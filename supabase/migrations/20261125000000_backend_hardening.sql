-- Pass 2 backend hardening:
-- 1. Preserve recovery_hash until identity_mutation_finish (pending_recovery_hash + identity_mutation_abort).
-- 2. Reclaim abandoned inactive handle reservations and index credential_limits(window_at).
-- 3. Enforce per-mode score ceilings across account_commit and guest leaderboard RPCs, clamp lifetime totals, and check restricted in account_reject.
-- 4. Stop non-creator suggestion likes from bumping author profiles.revision; require active non-deleted identities for news likes; clean up team/clock on account_delete.
-- 5. Fix news_private.unkind false positives on ordinary multi-word English phrases while catching repeated-letter and spaced obfuscations.

alter table accounts_private.identities
  add column if not exists pending_recovery_hash text check (pending_recovery_hash ~ '^[0-9a-f]{64}$');

create index if not exists credential_limits_window_at on accounts_private.credential_limits(window_at);

create or replace function public.identity_lookup(p_handle text default null, p_owner uuid default null) returns jsonb
language sql security definer set search_path = '' as $$
  select jsonb_build_object(
    'owner', i.owner,
    'handle', i.handle,
    'provider_identifier', i.provider_identifier,
    'active', i.active,
    'deleted', exists(select 1 from accounts_private.deleted_accounts d where d.owner = i.owner)
  )
  from accounts_private.identities i
  where (p_owner is not null and i.owner = p_owner) or (p_owner is null and i.handle = p_handle);
$$;

create or replace function public.identity_register_begin(p_owner uuid, p_handle text, p_identifier text, p_recovery_hash text, p_mutation uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r accounts_private.identities;
begin
  if p_handle !~ '^[a-z0-9_]{3,24}$' or p_handle in ('admin','administrator','moderator','support','system','root','supabase','microgame','microgame_madness','guest','deleted','null','undefined') then
    raise exception 'invalid_handle';
  end if;
  if exists(select 1 from accounts_private.deleted_accounts where owner = p_owner) then
    raise exception 'account_deleted';
  end if;
  -- Reclaim abandoned inactive handle reservations after 15 minutes only if Auth has not already assigned credentials.
  if exists(select 1 from information_schema.columns where table_schema = 'auth' and table_name = 'users' and column_name = 'email') then
    execute $q$
      delete from accounts_private.identities i
      where i.handle = $1 and i.owner <> $2 and not i.active
        and i.created_at < now() - interval '15 minutes'
        and (i.mutation_until is null or i.mutation_until < now() - interval '15 minutes')
        and not exists(
          select 1 from auth.users u
          where u.id = i.owner and (coalesce(u.email, '') <> '' or coalesce(u.encrypted_password, '') <> '')
        )
    $q$ using p_handle, p_owner;
  else
    delete from accounts_private.identities
      where handle = p_handle and owner <> p_owner and not active
        and created_at < now() - interval '15 minutes'
        and (mutation_until is null or mutation_until < now() - interval '15 minutes');
  end if;
  insert into accounts_private.identities(owner, handle, provider_identifier) values(p_owner, p_handle, p_identifier)
    on conflict(owner) do nothing;
  select * into r from accounts_private.identities where owner = p_owner for update;
  if r.handle <> p_handle or r.active then raise exception 'already_registered'; end if;
  if r.mutation_until > now() then raise exception 'identity_busy'; end if;
  update accounts_private.identities
    set pending_recovery_hash = p_recovery_hash, mutation_id = p_mutation, mutation_until = now() + interval '60 seconds'
    where owner = p_owner;
  return jsonb_build_object('owner', r.owner, 'handle', r.handle, 'provider_identifier', r.provider_identifier);
exception when unique_violation then raise exception 'handle_unavailable';
end $$;

create or replace function public.identity_mutation_begin(p_owner uuid, p_recovery_hash text, p_new_recovery_hash text, p_mutation uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r accounts_private.identities;
begin
  if exists(select 1 from accounts_private.deleted_accounts where owner = p_owner) then
    raise exception 'account_deleted';
  end if;
  select * into r from accounts_private.identities where owner = p_owner and active for update;
  if not found or (p_recovery_hash is not null and r.recovery_hash is distinct from p_recovery_hash) then
    raise exception 'invalid_credentials';
  end if;
  if r.mutation_until > now() then raise exception 'identity_busy'; end if;
  -- Stage the replacement verifier until the external Auth update completes so a provider failure cannot lock out the account.
  update accounts_private.identities
    set pending_recovery_hash = p_new_recovery_hash, mutation_id = p_mutation, mutation_until = now() + interval '60 seconds'
    where owner = p_owner;
  return jsonb_build_object('owner', r.owner, 'handle', r.handle, 'provider_identifier', r.provider_identifier);
end $$;

create or replace function public.identity_mutation_finish(p_owner uuid, p_mutation uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update accounts_private.identities
    set active = true,
        recovery_hash = coalesce(pending_recovery_hash, recovery_hash),
        pending_recovery_hash = null,
        mutation_id = null,
        mutation_until = null
    where owner = p_owner and mutation_id = p_mutation;
  return found;
end $$;

create or replace function public.identity_mutation_abort(p_owner uuid, p_mutation uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update accounts_private.identities
    set pending_recovery_hash = null,
        mutation_id = null,
        mutation_until = null
    where owner = p_owner and mutation_id = p_mutation;
  return found;
end $$;

do $$ begin
  revoke all on function public.identity_mutation_abort(uuid, uuid) from public, anon, authenticated;
  if exists(select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.identity_mutation_abort(uuid, uuid) to service_role;
  end if;
end $$;

create or replace function leaderboard_private.valid_score(game text, difficulty text, score integer)
returns boolean language sql immutable set search_path = '' as $$
  select score is not null and score between 0 and 1000000000 and case game
    when 'hangman' then score <= (case difficulty when 'easy' then 10 when 'medium' then 7 when 'hard' then 5 else -1 end)
    when 'pool' then score <= 1
    when 'coindrop' then score between 1 and 1000
    when 'nanolab' then score <= 1
    when 'treasure' then score <= 44720
    when 'tearesseract' then score <= 465
    else true
  end;
$$;

create or replace function public.account_reject(p_owner uuid, p_operation_id text, p_digest text, p_expected_revision bigint, p_error jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p accounts_private.profiles; existing jsonb;
begin
  if exists(select 1 from accounts_private.deleted_accounts where owner = p_owner) then raise exception 'account_deleted'; end if;
  select * into strict p from accounts_private.profiles where owner = p_owner for update;
  existing := public.account_receipt(p_owner, p_operation_id, p_digest);
  if existing is not null then return existing; end if;
  if p.revision <> p_expected_revision then return jsonb_build_object('id', p_operation_id, 'status', 'revision_conflict'); end if;
  if p.restricted then raise exception 'submissions_restricted' using errcode = '42501'; end if;
  if (select count(*) from accounts_private.receipts where owner = p_owner and received_at > now() - interval '1 minute') >= 600 then
    raise exception 'rate_limited';
  end if;
  insert into accounts_private.receipts(owner, operation_id, digest, result, status, revision)
    values(p_owner, p_operation_id, p_digest, p_error, 'rejected', p.revision);
  return jsonb_build_object('id', p_operation_id, 'status', 'rejected', 'error', p_error, 'revision', p.revision);
end $$;

create or replace function public.account_commit(p_owner uuid, p_operation_id text, p_digest text, p_expected_revision bigint,
  p_state jsonb, p_result jsonb, p_run jsonb, p_kind text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  p accounts_private.profiles;
  existing jsonb;
  old_units bigint;
  new_units bigint;
  new_name text;
  run_mode text;
  run_difficulty text;
  run_score integer;
  run_credit integer;
  run_identity text;
  run_eligible boolean;
  run_version text;
  next_revision bigint;
  season accounts_private.seasons;
begin
  if exists(select 1 from accounts_private.deleted_accounts where owner = p_owner) then raise exception 'account_deleted'; end if;
  select * into strict p from accounts_private.profiles where owner = p_owner for update;
  existing := public.account_receipt(p_owner, p_operation_id, p_digest);
  if existing is not null then return existing; end if;
  if p.revision <> p_expected_revision then return jsonb_build_object('id', p_operation_id, 'status', 'revision_conflict'); end if;
  if p.restricted then raise exception 'submissions_restricted' using errcode = '42501'; end if;
  if (select count(*) from accounts_private.receipts where owner = p_owner and received_at > now() - interval '1 minute') >= 600 then
    raise exception 'rate_limited';
  end if;
  if jsonb_typeof(p_state) <> 'object' or jsonb_typeof(p_result) <> 'object' or p_operation_id is null or p_digest is null
      or p_kind not in ('run.start', 'run.checkpoint', 'run.finish', 'arcade', 'purchase', 'settings', 'import', 'onboarding.complete') then
    raise exception 'invalid_operation' using errcode = '22023';
  end if;
  new_name := p_state->>'player';
  old_units := coalesce((p.state#>>'{shop,units}')::bigint, 0);
  new_units := (p_state#>>'{shop,units}')::bigint;
  if new_units is null or new_units < 0 or new_units > 9007199254740991
      or new_name is null or char_length(new_name) not between 1 and 24 or new_name ~ '[[:cntrl:]]' then
    raise exception 'invalid_state' using errcode = '22023';
  end if;
  if p_kind = 'run.start' and exists(
    select 1 from jsonb_each(coalesce(p_state->'runs', '{}'::jsonb)) r
    where not coalesce((r.value->>'finished')::boolean, false)
      and exists(select 1 from accounts_private.runs prev where prev.owner = p_owner and prev.run_id = r.key)
  ) then
    raise exception 'run_conflict';
  end if;
  if p_run is not null and p_run <> 'null'::jsonb then
    run_mode := p_run->>'mode'; run_difficulty := p_run->>'difficulty'; run_score := (p_run->>'score')::integer;
    if p_kind = 'run.finish' and run_mode in ('coindrop','nanolab','tearesseract','treasure','pool','balloon') then
      raise exception 'invalid_run';
    end if;
    if p_kind <> 'run.finish' and not (p_kind = 'arcade' and run_mode in ('coindrop','nanolab','tearesseract','treasure','pool','balloon') and p_run->>'id' = p_operation_id) then
      raise exception 'invalid_run';
    end if;
    run_identity := p_run->>'id';
    if exists(select 1 from accounts_private.runs where owner = p_owner and run_id = run_identity) then
      return jsonb_build_object('id', p_operation_id, 'status', 'rejected', 'error', jsonb_build_object('code', 'run_finalized', 'message', 'This run was already finalized.'));
    end if;
    run_eligible := coalesce((p_run->>'eligible')::boolean, false);
    run_version := coalesce(p_run->>'rulesVersion', '1');
    if not leaderboard_private.valid_score(run_mode, run_difficulty, run_score) then
      raise exception 'invalid_score' using errcode = '22023';
    end if;
    insert into accounts_private.runs(owner, run_id, mode, difficulty, outcome, score, rules_version, eligible, data)
      values (p_owner, run_identity, run_mode, run_difficulty, p_run->>'outcome', run_score, run_version, run_eligible, p_run);
    if run_eligible and leaderboard_private.valid_mode(run_mode, run_difficulty) then
      run_credit := run_score;
      insert into leaderboard_private.run_receipts values(p_owner, run_identity, run_mode, run_difficulty, run_score) on conflict do nothing;
      if not found then
        if not exists(select 1 from leaderboard_private.run_receipts where player_id = p_owner and run_id = run_identity
          and mode = run_mode and difficulty = run_difficulty and score = run_score) then raise exception 'run_conflict'; end if;
        run_credit := 0;
      end if;
      insert into leaderboard_private.scores as previous(player_id, mode, difficulty, player, score, total)
        values(p_owner, run_mode, run_difficulty, new_name, run_score, run_credit)
        on conflict(player_id, mode, difficulty) do update set player = excluded.player,
          score = greatest(previous.score, excluded.score),
          total = least(9007199254740991::bigint, previous.total + excluded.total),
          achieved_at = case when excluded.total > 0 then now() else previous.achieved_at end;
      for season in select * from accounts_private.seasons where starts_at <= now() and ends_at > now() and rules_version = run_version loop
        insert into accounts_private.season_scores as previous(owner, season_id, mode, difficulty, score, run_id, total)
          values(p_owner, season.id, run_mode, run_difficulty, run_score, run_identity, run_score)
          on conflict(owner, season_id, mode, difficulty) do update set
            score = greatest(previous.score, excluded.score),
            total = least(9007199254740991::bigint, previous.total + excluded.total),
            run_id = case when excluded.score > previous.score then excluded.run_id else previous.run_id end,
            achieved_at = case when excluded.total > 0 then now() else previous.achieved_at end;
      end loop;
    end if;
  end if;
  if new_units <> old_units then
    insert into accounts_private.wallet_entries(owner, operation_id, reason, delta, balance)
      values(p_owner, p_operation_id, p_kind, new_units - old_units, new_units);
  end if;
  if p_kind = 'import' then
    insert into accounts_private.imports(owner, operation_id, digest, baseline)
      values(p_owner, p_operation_id, p_digest, coalesce(p_result->>'imported', '') = 'baseline');
  end if;
  next_revision := p.revision + 1;
  update accounts_private.profiles set state = p_state, revision = next_revision, display_name = new_name,
    cubie = coalesce(p_state->>'cubieCustom', 'classic'), ranking_enabled = coalesce((p_state#>>'{privacy,leaderboard}')::boolean, false),
    profile_visible = coalesce((p_state#>>'{privacy,publicProfile}')::boolean, false), updated_at = now() where owner = p_owner;
  insert into accounts_private.receipts(owner, operation_id, digest, result, revision)
    values(p_owner, p_operation_id, p_digest, p_result, next_revision);
  return jsonb_build_object('id', p_operation_id, 'status', 'applied', 'result', p_result, 'revision', next_revision);
end $$;

create or replace function public.submit_leaderboard_run(p_run_id text, p_mode text, p_difficulty text, p_player text, p_score integer)
returns double precision language plpgsql security definer set search_path = '' as $$
declare identity uuid := auth.uid(); nickname text := btrim(p_player); prior leaderboard_private.run_receipts; result bigint;
begin
  if identity is null then raise exception 'Sign in before submitting a score' using errcode = '42501'; end if;
  if not accounts_private.visible(identity) then raise exception 'Leaderboard participation is disabled' using errcode = '42501'; end if;
  if exists(select 1 from accounts_private.profiles where owner = identity)
     or exists(select 1 from accounts_private.identities where owner = identity and active) then
    raise exception 'Update the game to submit account results' using errcode = '42501';
  end if;
  if p_run_id is null or p_run_id !~ '^[A-Za-z0-9_-]{1,128}$' or not leaderboard_private.valid_mode(p_mode, p_difficulty)
     or nickname is null or char_length(nickname) not between 1 and 24 or nickname ~ '[[:cntrl:]]'
     or not leaderboard_private.valid_score(p_mode, p_difficulty, p_score) then
    raise exception 'Invalid player or score' using errcode = '22023';
  end if;
  insert into leaderboard_private.run_receipts values(identity, p_run_id, p_mode, p_difficulty, p_score) on conflict do nothing;
  if not found then
    select * into strict prior from leaderboard_private.run_receipts where player_id = identity and run_id = p_run_id;
    if prior.mode <> p_mode or prior.difficulty <> p_difficulty or prior.score <> p_score then
      raise exception 'Run ID already used for a different result' using errcode = '22023';
    end if;
    select total into result from leaderboard_private.scores where player_id = identity and mode = p_mode and difficulty = p_difficulty;
    return coalesce(result, 0)::double precision;
  end if;
  insert into leaderboard_private.scores as previous(player_id, mode, difficulty, player, score, total)
    values(identity, p_mode, p_difficulty, nickname, p_score, p_score)
    on conflict(player_id, mode, difficulty) do update set player = excluded.player,
      score = greatest(previous.score, excluded.score),
      total = least(9007199254740991::bigint, previous.total + excluded.total),
      achieved_at = case when excluded.total > 0 then now() else previous.achieved_at end returning total into result;
  return result::double precision;
end $$;

create or replace function public.submit_leaderboard_score(p_mode text, p_difficulty text, p_player text, p_score integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare identity uuid := auth.uid(); nickname text := btrim(p_player); best integer;
begin
  if identity is null then raise exception 'Sign in before submitting a score' using errcode = '42501'; end if;
  if not accounts_private.visible(identity) then raise exception 'Leaderboard participation is disabled' using errcode = '42501'; end if;
  if exists(select 1 from accounts_private.profiles where owner = identity)
     or exists(select 1 from accounts_private.identities where owner = identity and active) then
    raise exception 'Update the game to submit account results' using errcode = '42501';
  end if;
  if not leaderboard_private.valid_mode(p_mode, p_difficulty) or nickname is null or char_length(nickname) not between 1 and 24
     or nickname ~ '[[:cntrl:]]' or not leaderboard_private.valid_score(p_mode, p_difficulty, p_score) then
    raise exception 'Invalid player or score' using errcode = '22023';
  end if;
  insert into leaderboard_private.scores as previous(player_id, mode, difficulty, player, score, total)
    values(identity, p_mode, p_difficulty, nickname, p_score, p_score)
    on conflict(player_id, mode, difficulty) do update set player = excluded.player,
      score = greatest(previous.score, excluded.score), total = greatest(previous.total, excluded.total),
      achieved_at = case when excluded.score > previous.score then now() else previous.achieved_at end returning score into best;
  return best;
end $$;

create or replace function public.account_delete(p_owner uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  insert into accounts_private.deleted_accounts(owner) values(p_owner) on conflict do nothing;
  delete from leaderboard_private.run_receipts where player_id = p_owner;
  delete from leaderboard_private.scores where player_id = p_owner;
  delete from accounts_private.profiles where owner = p_owner;
  delete from accounts_private.guest_visibility where owner = p_owner;
  delete from accounts_private.suppressed_players where owner = p_owner;
  delete from accounts_private.moderation_log where owner = p_owner;
  if to_regclass('news_private.team') is not null then
    delete from news_private.team where owner = p_owner;
  end if;
  if to_regclass('news_private.discussion_clock') is not null then
    delete from news_private.discussion_clock where actor = p_owner::text;
  end if;
  return jsonb_build_object('deleted', true);
end $$;

create or replace function news_private.toggle_suggestion(target uuid, who uuid, local_creator boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  author uuid;
  actor_key text;
  approved bigint;
  awarded boolean := false;
  is_creator boolean := false;
  person news_private.people;
begin
  if not local_creator then
    if who is null or exists(select 1 from accounts_private.deleted_accounts where owner = who)
       or not exists(select 1 from accounts_private.identities where owner = who and active) then
      raise exception 'Sign in to like suggestions';
    end if;
    select * into person from news_private.people where owner = who;
    if found and (person.blocked or person.banned_until > now()) then
      raise exception 'Commenting and likes are paused for this account';
    end if;
  end if;
  select owner into author from news_private.comments where id = target;
  if author is null then raise exception 'Suggestion no longer exists'; end if;
  is_creator := local_creator or exists(
    select 1 from news_private.team t
    join accounts_private.identities i on i.owner = t.owner and i.active
    where t.owner = who and not exists(select 1 from accounts_private.deleted_accounts d where d.owner = t.owner)
  );
  perform pg_advisory_xact_lock(hashtextextended(author::text, 6));
  actor_key := case when local_creator then 'local_creator' else who::text end;
  delete from news_private.suggestion_likes where comment = target and actor = actor_key;
  if not found then
    insert into news_private.suggestion_likes values(target, actor_key, case when local_creator then null else who end);
  end if;
  -- Only creator likes affect reward progress; never let ordinary player likes bump the author's profile revision.
  if is_creator then
    approved := news_private.approved_count(author);
    if approved >= 10 then
      insert into news_private.rewards(owner) values(author) on conflict do nothing;
      awarded := found;
    end if;
    update accounts_private.profiles set revision = revision + 1 where owner = author;
  end if;
  return jsonb_build_object('awarded', awarded);
end $$;

create or replace function public.news_action(action text, target uuid default null, body text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare who uuid := auth.uid(); person news_private.people; until_time timestamptz;
begin
  if who is null or exists(select 1 from accounts_private.deleted_accounts where owner = who) then
    raise exception 'Sign in to participate';
  end if;
  if action = 'seen' then
    insert into news_private.seen values(target, who) on conflict do nothing;
  elsif action = 'like' then
    if not exists(select 1 from accounts_private.identities where owner = who and active) then
      raise exception 'Create an account to like posts';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(who::text, 1));
    delete from news_private.likes where post = target and owner = who;
    if not found then insert into news_private.likes values(target, who); end if;
  elsif action = 'comment' then
    if not exists(select 1 from accounts_private.identities where owner = who and active) then
      raise exception 'Create an account to suggest ideas';
    end if;
    insert into news_private.people(owner) values(who) on conflict do nothing;
    select * into person from news_private.people where owner = who for update;
    if person.blocked then return jsonb_build_object('error', 'Commenting has been blocked by the moderator.'); end if;
    if person.banned_until > now() then return jsonb_build_object('error', 'Commenting is paused until ' || person.banned_until, 'until', person.banned_until); end if;
    if body is null or length(btrim(body)) not between 1 and 1000 then raise exception 'Write between 1 and 1000 characters'; end if;
    if news_private.unkind(body) then
      until_time := now() + case when person.strikes + 1 >= 5 then interval '24 hours' else interval '10 minutes' end;
      update news_private.people set strikes = strikes + 1, banned_until = until_time where owner = who;
      return jsonb_build_object('kind', true, 'hours', person.strikes + 1 >= 5, 'until', until_time);
    end if;
    if person.last_comment > now() - interval '3 seconds' then return jsonb_build_object('error', 'Please wait 3 seconds between suggestions.'); end if;
    insert into news_private.comments(owner, body) values(who, btrim(body));
    update news_private.people set last_comment = now() where owner = who;
  else raise exception 'Unknown action'; end if;
  return '{}'::jsonb;
end $$;

create or replace function news_private.discussion(action text, target uuid, body text, reply_parent uuid, kind text, who uuid, local_creator boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare is_mod boolean := false; author text; actor_key text; person news_private.people; selected_reply news_private.replies; until_time timestamptz; last_post timestamptz; result uuid;
begin
  select split_part(t.label, ',', 1) into author
  from news_private.team t
  join accounts_private.identities i on i.owner = t.owner and i.active
  where t.owner = who and not exists(select 1 from accounts_private.deleted_accounts d where d.owner = t.owner);
  is_mod := local_creator or author is not null;
  actor_key := case when local_creator then 'local_creator' else who::text end;
  if action = 'list' then
    return coalesce((select jsonb_agg(to_jsonb(item) order by item.created_at, item.id) from (
      select r.id, r.body, r.label, r.creator, r.parent, r.created_at,
        (select count(*) from news_private.reply_likes l where l.reply = r.id) likes,
        exists(select 1 from news_private.reply_likes l where l.reply = r.id and l.actor = actor_key) liked,
        coalesce((select jsonb_agg(name order by name) from (select distinct news_private.creator_label(l.actor, l.owner) name from news_private.reply_likes l where l.reply = r.id) creators where name is not null), '[]'::jsonb) creator_likes,
        is_mod or r.owner = who can_delete
      from news_private.replies r where (kind = 'suggestion' and r.comment = target) or (kind = 'post' and r.post = target)
      order by r.created_at, r.id limit 200
    ) item), '[]'::jsonb);
  end if;
  if not local_creator and (
    who is null
    or exists(select 1 from accounts_private.deleted_accounts where owner = who)
    or not exists(select 1 from accounts_private.identities where owner = who and active)
  ) then
    raise exception 'Sign in to join the discussion' using errcode = '42501';
  end if;
  if action in ('like', 'delete') then
    select * into selected_reply from news_private.replies where id = target for update;
    if not found then raise exception 'Comment no longer exists'; end if;
    if action = 'delete' then
      if not is_mod and selected_reply.owner is distinct from who then raise exception 'Cannot delete this comment' using errcode = '42501'; end if;
      delete from news_private.replies where id = target;
    else
      delete from news_private.reply_likes where reply = target and actor = actor_key;
      if not found then insert into news_private.reply_likes values(target, actor_key, case when local_creator then null else who end); end if;
    end if;
    return '{}'::jsonb;
  end if;
  if action <> 'create' then raise exception 'Unknown discussion action'; end if;
  if body is null or length(btrim(body)) not between 1 and 1000 then raise exception 'Write between 1 and 1000 characters'; end if;
  insert into news_private.discussion_clock(actor) values(actor_key) on conflict do nothing;
  select posted_at into last_post from news_private.discussion_clock where actor = actor_key for update;
  if not local_creator then
    insert into news_private.people(owner) values(who) on conflict do nothing;
    select * into person from news_private.people where owner = who for update;
    if person.blocked then return jsonb_build_object('error', 'Commenting has been blocked by the moderator.'); end if;
    if person.banned_until > now() then return jsonb_build_object('error', 'Commenting is temporarily paused.', 'until', person.banned_until); end if;
  end if;
  if news_private.unkind(body) then
    if local_creator then return jsonb_build_object('error', 'Kind Words Only'); end if;
    until_time := now() + case when person.strikes + 1 >= 5 then interval '24 hours' else interval '10 minutes' end;
    update news_private.people set strikes = strikes + 1, banned_until = until_time where owner = who;
    return jsonb_build_object('kind', true, 'hours', person.strikes + 1 >= 5, 'until', until_time);
  end if;
  if greatest(last_post, person.last_comment) > now() - interval '3 seconds' then return jsonb_build_object('error', 'Please wait 3 seconds between comments.'); end if;
  if kind = 'suggestion' then perform 1 from news_private.comments where id = target for update;
  elsif kind = 'post' then perform 1 from news_private.posts where id = target for update;
  else raise exception 'Invalid discussion'; end if;
  if not found then raise exception 'This discussion no longer exists'; end if;
  if reply_parent is not null and not exists(select 1 from news_private.replies r where r.id = reply_parent and ((kind = 'suggestion' and r.comment = target) or (kind = 'post' and r.post = target))) then raise exception 'Reply must belong to this discussion'; end if;
  if (select count(*) from news_private.replies r where (kind = 'suggestion' and r.comment = target) or (kind = 'post' and r.post = target)) >= 200 then raise exception 'This discussion is full'; end if;
  if local_creator then author := 'Nate'; end if;
  if author is null then select handle into author from accounts_private.identities where owner = who; end if;
  insert into news_private.replies(comment, post, parent, owner, label, creator, body) values(case when kind = 'suggestion' then target end, case when kind = 'post' then target end, reply_parent, case when local_creator then null else who end, author, is_mod, btrim(body)) returning id into result;
  update news_private.discussion_clock set posted_at = now() where actor = actor_key;
  if not local_creator then update news_private.people set last_comment = now() where owner = who; end if;
  return jsonb_build_object('id', result);
end $$;

create or replace function news_private.unkind(body text) returns boolean
language sql immutable set search_path = '' as $$
  with clean as (
    -- Only translate '!' to 'i' when embedded inside a word (e.g. "sh!t"), never trailing punctuation ("fuck!", "f.u.c.k!").
    select translate(
      regexp_replace(lower(coalesce(body, '')), '([a-z0-9@$])!([a-z0-9@$])', '\1i\2', 'g'),
      '013457@$', 'oieastas'
    ) as txt
  ),
  tokens as (
    select regexp_replace(tok, '[^a-z]', '', 'g') as w
    from clean, lateral regexp_split_to_table(txt, '[^a-z]+') as tok
    where regexp_replace(tok, '[^a-z]', '', 'g') <> ''
  ),
  numbered as (
    select w, row_number() over () as idx from tokens
  ),
  singles as (
    select string_agg(w, '' order by idx) as run
    from (
      select w, idx, idx - row_number() over (order by idx) as grp
      from numbered where length(w) = 1
    ) s
    group by grp having count(*) >= 4
  )
  select exists(
    select 1 from tokens
    where w ~ '^(f+u+c+k+(e+r+s?|e+d+|i+n+g+|s+)?|m+o+t+h+e+r+f+u+c+k+(e+r+s?|i+n+g+)?|s+h+i+t+(t+y+|s+|h+e+a+d+)?|b+u+l+l+s+h+i+t+|d+i+p+s+h+i+t+|b+i+t+c+h+(e+s+|y+|i+n+g+)?|c+u+n+t+s?|n+i+g{2,}e+r+s?|n+i+g{2,}a+s?|f+a+g{2,}o+t+s?|r+e+t+a+r+d+(e+d+|s+)?|a+s{2,}h+o+l+e+s?|b+a+s+t+a+r+d+s?|w+h+o+r+e+s?|s+l+u+t+(s+|t+y+)?|c+h+i+n+k+s?|k+i+k+e+s?|t+r+a+n{2,}(y+|i+e+s+))$'
  )
  or exists(
    select 1 from singles
    where run ~ '(f+u+c+k+|s+h+i+t+|b+i+t+c+h+|c+u+n+t+|n+i+g{2,}e+r+|n+i+g{2,}a+|f+a+g{2,}o+t+|r+e+t+a+r+d+|k+i+l+l+y+o+u+r+s+e+l+f+|m+o+t+h+e+r+f+u+c+k+e+r+|a+s{2,}h+o+l+e+|b+a+s+t+a+r+d+|w+h+o+r+e+|s+l+u+t+|c+h+i+n+k+|k+i+k+e+|t+r+a+n{2,}y+)'
  )
  or exists(
    select 1 from clean
    where txt ~ '\mk+i+l+l+\s+y+o+u+r+\s*s+e+l+f+\M'
  );
$$;

notify pgrst, 'reload schema';
