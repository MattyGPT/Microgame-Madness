-- Lifetime totals retain personal bests for legacy clients and record each new run once.
alter table leaderboard_private.scores add column total bigint not null default 0
  check (total between 0 and 9007199254740991);
alter table accounts_private.season_scores add column total bigint not null default 0
  check (total between 0 and 9007199254740991);
-- Guest history was not retained. Preserve its known best as the opening balance.
-- For accounts, use all retained eligible history, without counting the old best twice.
update leaderboard_private.scores s set total = greatest(s.score, coalesce((
  select sum(r.score) from accounts_private.runs r
  where r.owner=s.player_id and r.mode=s.mode and r.difficulty=s.difficulty and r.eligible
),0));
update accounts_private.season_scores s set total = greatest(s.score, coalesce((
  select sum(r.score) from accounts_private.runs r join accounts_private.seasons season on season.id=s.season_id
  where r.owner=s.owner and r.mode=s.mode and r.difficulty=s.difficulty and r.eligible
    and r.received_at>=season.starts_at and r.received_at<season.ends_at and r.rules_version=season.rules_version
),0));
create index leaderboard_total_ranking on leaderboard_private.scores(mode,difficulty,total desc,achieved_at,player_id);
create index season_total_ranking on accounts_private.season_scores(season_id,mode,difficulty,total desc,achieved_at,owner);

create table leaderboard_private.run_receipts (
  player_id uuid not null references auth.users(id) on delete cascade,
  run_id text not null check (run_id ~ '^[A-Za-z0-9_-]{1,128}$'),
  mode text not null,
  difficulty text not null,
  score integer not null check (score between 0 and 1000000000),
  primary key(player_id,run_id)
);
alter table leaderboard_private.run_receipts enable row level security;
revoke all on leaderboard_private.run_receipts from public,anon,authenticated;

-- This separate endpoint requires a stable run ID, making offline retries idempotent.
create function public.submit_leaderboard_run(p_run_id text,p_mode text,p_difficulty text,p_player text,p_score integer)
returns double precision language plpgsql security definer set search_path = '' as $$
declare identity uuid:=auth.uid(); nickname text:=btrim(p_player); prior leaderboard_private.run_receipts; result bigint;
begin
  if identity is null then raise exception 'Sign in before submitting a score' using errcode='42501'; end if;
  if not accounts_private.visible(identity) then raise exception 'Leaderboard participation is disabled' using errcode='42501'; end if;
  if exists(select 1 from accounts_private.profiles where owner=identity) then raise exception 'Update the game to submit account results' using errcode='42501'; end if;
  if p_run_id is null or p_run_id !~ '^[A-Za-z0-9_-]{1,128}$' or not leaderboard_private.valid_mode(p_mode,p_difficulty) or nickname is null or char_length(nickname) not between 1 and 24
    or nickname ~ '[[:cntrl:]]' or p_score is null or p_score not between 0 and 1000000000 then raise exception 'Invalid player or score' using errcode='22023'; end if;
  if p_mode='hangman' and p_score>(case p_difficulty when 'easy' then 10 when 'medium' then 7 else 5 end) then raise exception 'Invalid Hangman score' using errcode='22023'; end if;
  insert into leaderboard_private.run_receipts values(identity,p_run_id,p_mode,p_difficulty,p_score) on conflict do nothing;
  if not found then
    select * into strict prior from leaderboard_private.run_receipts where player_id=identity and run_id=p_run_id;
    if prior.mode<>p_mode or prior.difficulty<>p_difficulty or prior.score<>p_score then raise exception 'Run ID already used for a different result' using errcode='22023'; end if;
    select total into result from leaderboard_private.scores where player_id=identity and mode=p_mode and difficulty=p_difficulty;
    return coalesce(result,0)::double precision;
  end if;
  insert into leaderboard_private.scores as previous(player_id,mode,difficulty,player,score,total)
    values(identity,p_mode,p_difficulty,nickname,p_score,p_score)
    on conflict(player_id,mode,difficulty) do update set player=excluded.player,
      score=greatest(previous.score,excluded.score),total=previous.total+excluded.total,
      achieved_at=case when excluded.total>0 then now() else previous.achieved_at end returning total into result;
  return result::double precision;
end $$;
revoke all on function public.submit_leaderboard_run(text,text,text,text,integer) from public,anon;
grant execute on function public.submit_leaderboard_run(text,text,text,text,integer) to authenticated;

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
  -- The immutable history key is a second independent guard against finalization twice.
  if p_run is not null and p_run <> 'null'::jsonb then
    if p_kind <> 'run.finish' then raise exception 'invalid_run'; end if;
    run_identity := p_run->>'id';
    if exists(select 1 from accounts_private.runs where owner = p_owner and run_id = run_identity) then
      return jsonb_build_object('id', p_operation_id, 'status', 'rejected', 'error', jsonb_build_object('code', 'run_finalized', 'message', 'This run was already finalized.'));
    end if;
    run_mode := p_run->>'mode'; run_difficulty := p_run->>'difficulty'; run_score := (p_run->>'score')::integer;
    run_eligible := coalesce((p_run->>'eligible')::boolean, false);
    run_version := coalesce(p_run->>'rulesVersion', '1');
    insert into accounts_private.runs(owner, run_id, mode, difficulty, outcome, score, rules_version, eligible, data)
      values (p_owner, run_identity, run_mode, run_difficulty, p_run->>'outcome', run_score, run_version, run_eligible, p_run);
    if run_eligible and leaderboard_private.valid_mode(run_mode, run_difficulty) then
      if run_mode = 'hangman' and run_score > (case run_difficulty when 'easy' then 10 when 'medium' then 7 else 5 end) then raise exception 'invalid_score'; end if;
      -- A guest may already have published this run before converting to an account.
      -- Share the receipt key across both paths so importing its journal cannot add it twice.
      run_credit := run_score;
      insert into leaderboard_private.run_receipts values(p_owner,run_identity,run_mode,run_difficulty,run_score) on conflict do nothing;
      if not found then
        if not exists(select 1 from leaderboard_private.run_receipts where player_id=p_owner and run_id=run_identity
          and mode=run_mode and difficulty=run_difficulty and score=run_score) then raise exception 'run_conflict'; end if;
        run_credit := 0;
      end if;
      insert into leaderboard_private.scores as previous(player_id, mode, difficulty, player, score, total)
        values(p_owner, run_mode, run_difficulty, new_name, run_score, run_credit)
        on conflict(player_id, mode, difficulty) do update set player = excluded.player,
          score = greatest(previous.score, excluded.score), total = previous.total + excluded.total,
          achieved_at = case when excluded.total > 0 then now() else previous.achieved_at end;
      -- Receipt time is server-generated: late uploads cannot backdate a season.
      for season in select * from accounts_private.seasons where starts_at <= now() and ends_at > now() and rules_version = run_version loop
        insert into accounts_private.season_scores as previous(owner, season_id, mode, difficulty, score, run_id, total)
          values(p_owner, season.id, run_mode, run_difficulty, run_score, run_identity, run_score)
          on conflict(owner, season_id, mode, difficulty) do update set
            score = greatest(previous.score, excluded.score), total = previous.total + excluded.total,
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

create or replace function public.submit_leaderboard_score(p_mode text,p_difficulty text,p_player text,p_score integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare identity uuid:=auth.uid(); nickname text:=btrim(p_player); best integer;
begin
  if identity is null then raise exception 'Sign in before submitting a score' using errcode='42501'; end if;
  if not accounts_private.visible(identity) then raise exception 'Leaderboard participation is disabled' using errcode='42501'; end if;
  -- Once an account profile exists, only the trusted event path may publish its results.
  if exists(select 1 from accounts_private.profiles where owner=identity) then raise exception 'Update the game to submit account results' using errcode='42501'; end if;
  if not leaderboard_private.valid_mode(p_mode,p_difficulty) or nickname is null or char_length(nickname) not between 1 and 24
    or nickname ~ '[[:cntrl:]]' or p_score is null or p_score not between 0 and 1000000000 then raise exception 'Invalid player or score' using errcode='22023'; end if;
  if p_mode='hangman' and p_score>(case p_difficulty when 'easy' then 10 when 'medium' then 7 else 5 end) then raise exception 'Invalid Hangman score' using errcode='22023'; end if;
  insert into leaderboard_private.scores as previous(player_id,mode,difficulty,player,score,total) values(identity,p_mode,p_difficulty,nickname,p_score,p_score)
    on conflict(player_id,mode,difficulty) do update set player=excluded.player,score=greatest(previous.score,excluded.score),total=greatest(previous.total,excluded.total),
      achieved_at=case when excluded.score>previous.score then now() else previous.achieved_at end returning score into best;
  return best;
end $$;

create or replace function public.account_delete(p_owner uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  -- Tombstone has no FK: a stale JWT cannot resurrect records after auth deletion.
  insert into accounts_private.deleted_accounts(owner) values(p_owner) on conflict do nothing;
  delete from leaderboard_private.run_receipts where player_id = p_owner;
  delete from leaderboard_private.scores where player_id = p_owner;
  delete from accounts_private.profiles where owner = p_owner;
  delete from accounts_private.guest_visibility where owner = p_owner;
  delete from accounts_private.suppressed_players where owner = p_owner;
  delete from accounts_private.moderation_log where owner = p_owner;
  return jsonb_build_object('deleted', true);
end $$;

drop function public.get_leaderboard(text,text);
drop function public.get_account_leaderboard(text,text,text,integer,integer,boolean);
create or replace function public.get_account_leaderboard(p_mode text, p_difficulty text, p_season text default null,
  p_offset integer default 0, p_limit integer default 10, p_around_me boolean default false)
returns table(rank bigint, player text, score double precision, is_you boolean, public_id uuid, cubie text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not leaderboard_private.valid_mode(p_mode,p_difficulty) then raise exception 'Unknown game or difficulty' using errcode='22023'; end if;
  return query
  with candidates as (
    select s.player_id as owner, s.player as old_name, s.total::double precision as score, s.achieved_at from leaderboard_private.scores s
      where p_season is null and s.mode=p_mode and s.difficulty=p_difficulty
    union all
    select s.owner, 'Player'::text, s.total::double precision as score, s.achieved_at from accounts_private.season_scores s
      where p_season is not null and s.season_id=p_season and s.mode=p_mode and s.difficulty=p_difficulty
  ), ordered as (
    select row_number() over(order by c.score desc,c.achieved_at,c.owner) as placement,
      coalesce(p.display_name,c.old_name) as name,c.score,c.owner,
      case when p.profile_visible then p.public_id else null::uuid end as exposed_id,
      'classic'::text as appearance
    from candidates c left join accounts_private.profiles p on p.owner=c.owner
    where accounts_private.visible(c.owner)
  ), start_at as (
    select case when p_around_me then greatest(0,coalesce((select placement-3 from ordered where owner=auth.uid()),0))
      else least(100000, greatest(0, coalesce(p_offset,0))) end as value
  )
  select o.placement,o.name,o.score,coalesce(o.owner=auth.uid(),false),o.exposed_id,o.appearance
    from ordered o where o.placement > (select value from start_at)
    order by o.placement limit least(100,greatest(1,coalesce(p_limit,10)));
end $$;
create function public.get_leaderboard(p_mode text,p_difficulty text)
returns table(rank bigint,player text,score double precision,is_you boolean)
language sql stable security definer set search_path = '' as $$
  select r.rank,r.player,r.score,r.is_you from public.get_account_leaderboard(p_mode,p_difficulty) r;
$$;
grant execute on function public.get_leaderboard(text,text) to anon,authenticated;
grant execute on function public.get_account_leaderboard(text,text,text,integer,integer,boolean) to anon,authenticated;
revoke all on function public.get_leaderboard(text,text) from public;
revoke all on function public.get_account_leaderboard(text,text,text,integer,integer,boolean) from public;

notify pgrst, 'reload schema';
