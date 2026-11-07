-- Account writes are computed by the trusted accounts function and committed atomically.
-- Browser roles cannot call the computed-state functions, even with an authenticated JWT.
create schema if not exists accounts_private;
revoke all on schema accounts_private from public, anon, authenticated;

create table accounts_private.deleted_accounts (
  owner uuid primary key,
  deleted_at timestamptz not null default now()
);
create table accounts_private.guest_visibility (
  owner uuid primary key references auth.users(id) on delete cascade,
  visible boolean not null,
  updated_at timestamptz not null default now()
);
create table accounts_private.profiles (
  owner uuid primary key references auth.users(id) on delete cascade,
  public_id uuid not null unique default gen_random_uuid(),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  revision bigint not null default 0 check (revision >= 0),
  display_name text not null default 'Player' check (char_length(display_name) between 1 and 24 and display_name !~ '[[:cntrl:]]'),
  cubie text not null default 'classic',
  ranking_enabled boolean not null default false,
  profile_visible boolean not null default false,
  restricted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table accounts_private.receipts (
  owner uuid not null references accounts_private.profiles(owner) on delete cascade,
  operation_id text not null check (char_length(operation_id) between 1 and 160),
  digest text not null check (digest ~ '^[0-9a-f]{64}$'),
  result jsonb not null,
  status text not null default 'applied' check (status in ('applied','rejected')),
  revision bigint not null,
  received_at timestamptz not null default now(),
  primary key (owner, operation_id)
);
create index account_receipts_time on accounts_private.receipts (owner, received_at);
create table accounts_private.runs (
  entry_id bigint generated always as identity unique,
  owner uuid not null references accounts_private.profiles(owner) on delete cascade,
  run_id text not null check (char_length(run_id) between 1 and 160),
  mode text not null,
  difficulty text not null,
  outcome text not null check (outcome in ('win', 'loss', 'exit', 'interrupted')),
  score integer not null check (score between 0 and 1000000000),
  rules_version text not null,
  eligible boolean not null,
  data jsonb not null,
  received_at timestamptz not null default now(),
  primary key (owner, run_id)
);
create index account_history on accounts_private.runs (owner, entry_id desc);
create index account_history_mode on accounts_private.runs (owner, mode, difficulty, entry_id desc);
create table accounts_private.wallet_entries (
  owner uuid not null references accounts_private.profiles(owner) on delete cascade,
  operation_id text not null,
  reason text not null,
  delta bigint not null,
  balance bigint not null check (balance between 0 and 9007199254740991),
  received_at timestamptz not null default now(),
  primary key (owner, operation_id)
);
create table accounts_private.imports (
  owner uuid not null references accounts_private.profiles(owner) on delete cascade,
  operation_id text not null,
  digest text not null,
  baseline boolean not null,
  received_at timestamptz not null default now(),
  primary key (owner, operation_id)
);
create unique index one_account_baseline on accounts_private.imports (owner) where baseline;
create table accounts_private.seasons (
  id text primary key check (id ~ '^[a-z0-9_-]{1,64}$'),
  title text not null check (char_length(title) between 1 and 80),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  rules_version text not null default '1',
  check (ends_at > starts_at)
);
create table accounts_private.season_scores (
  owner uuid not null references accounts_private.profiles(owner) on delete cascade,
  season_id text not null references accounts_private.seasons(id),
  mode text not null,
  difficulty text not null,
  score integer not null check (score between 0 and 1000000000),
  achieved_at timestamptz not null default now(),
  run_id text not null,
  primary key (owner, season_id, mode, difficulty)
);
create index season_ranking on accounts_private.season_scores (season_id, mode, difficulty, score desc, achieved_at, owner);
create table accounts_private.suppressed_players (
  owner uuid primary key,
  reason text not null check (char_length(reason) between 1 and 500),
  changed_at timestamptz not null default now()
);
create table accounts_private.moderation_log (
  id bigint generated always as identity primary key,
  owner uuid not null,
  action text not null,
  reason text not null,
  changed_at timestamptz not null default now()
);

-- No direct access, including accidental default grants, to private account tables.
do $$ declare item record; begin
  for item in select tablename from pg_tables where schemaname = 'accounts_private' loop
    execute format('alter table accounts_private.%I enable row level security', item.tablename);
    execute format('revoke all on table accounts_private.%I from public, anon, authenticated', item.tablename);
  end loop;
end $$;

create function accounts_private.visible(identity uuid) returns boolean
language sql stable set search_path = '' as $$
  select not exists (select 1 from accounts_private.deleted_accounts d where d.owner = identity)
    and not exists (select 1 from accounts_private.suppressed_players s where s.owner = identity)
    and not exists (select 1 from accounts_private.profiles p where p.owner = identity and (not p.ranking_enabled or p.restricted))
    and (exists (select 1 from accounts_private.profiles p where p.owner = identity)
      or coalesce((select g.visible from accounts_private.guest_visibility g where g.owner = identity), true));
$$;

-- Guests can withdraw already-published results without creating an account.
-- Account privacy and operator suppression remain authoritative after linking.
create function public.set_guest_leaderboard_visibility(p_visible boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare identity uuid := auth.uid();
begin
  if identity is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_visible is null then raise exception 'Visibility is required' using errcode = '22004'; end if;
  if exists(select 1 from accounts_private.deleted_accounts where owner = identity)
    or exists(select 1 from accounts_private.profiles where owner = identity) then
    raise exception 'Use account privacy settings for this identity' using errcode = '42501';
  end if;
  insert into accounts_private.guest_visibility(owner, visible) values(identity, p_visible)
    on conflict(owner) do update set visible = excluded.visible, updated_at = now();
  return accounts_private.visible(identity);
end $$;
revoke all on function public.set_guest_leaderboard_visibility(boolean) from public, anon;
grant execute on function public.set_guest_leaderboard_visibility(boolean) to authenticated;

create function public.account_read(p_owner uuid, p_initial jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p accounts_private.profiles;
begin
  if exists(select 1 from accounts_private.deleted_accounts where owner = p_owner) then
    raise exception 'account_deleted' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_initial) <> 'object' then raise exception 'invalid_initial_state'; end if;
  insert into accounts_private.profiles(owner, state) values (p_owner, p_initial) on conflict do nothing;
  select * into strict p from accounts_private.profiles where owner = p_owner;
  return jsonb_build_object('state', p.state, 'revision', p.revision, 'public_id', p.public_id);
end $$;

create function public.account_receipt(p_owner uuid, p_operation_id text, p_digest text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r accounts_private.receipts;
begin
  select * into r from accounts_private.receipts where owner = p_owner and operation_id = p_operation_id;
  if not found then return null; end if;
  if r.digest <> p_digest then return jsonb_build_object('id', p_operation_id, 'status', 'rejected', 'error', jsonb_build_object('code', 'operation_conflict', 'message', 'This operation ID already has different content.')); end if;
  if r.status = 'rejected' then return jsonb_build_object('id', p_operation_id, 'status', 'rejected', 'error', r.result, 'revision', r.revision); end if;
  return jsonb_build_object('id', p_operation_id, 'status', 'duplicate', 'result', r.result, 'revision', r.revision);
end $$;

create function public.account_dependencies(p_owner uuid, p_operation_ids text[])
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(operation_id,status),'{}'::jsonb)
    from accounts_private.receipts where owner=p_owner and operation_id=any(p_operation_ids);
$$;

create function public.account_reject(p_owner uuid, p_operation_id text, p_digest text, p_expected_revision bigint, p_error jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p accounts_private.profiles; existing jsonb;
begin
  if exists(select 1 from accounts_private.deleted_accounts where owner = p_owner) then raise exception 'account_deleted'; end if;
  select * into strict p from accounts_private.profiles where owner = p_owner for update;
  existing := public.account_receipt(p_owner,p_operation_id,p_digest);
  if existing is not null then return existing; end if;
  if p.revision <> p_expected_revision then return jsonb_build_object('id',p_operation_id,'status','revision_conflict'); end if;
  if (select count(*) from accounts_private.receipts where owner = p_owner and received_at > now() - interval '1 minute') >= 600 then raise exception 'rate_limited'; end if;
  insert into accounts_private.receipts(owner,operation_id,digest,result,status,revision) values(p_owner,p_operation_id,p_digest,p_error,'rejected',p.revision);
  return jsonb_build_object('id',p_operation_id,'status','rejected','error',p_error,'revision',p.revision);
end $$;

create function public.account_commit(p_owner uuid, p_operation_id text, p_digest text, p_expected_revision bigint,
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
      insert into leaderboard_private.scores as previous(player_id, mode, difficulty, player, score)
        values(p_owner, run_mode, run_difficulty, new_name, run_score)
        on conflict(player_id, mode, difficulty) do update set player = excluded.player,
          score = greatest(previous.score, excluded.score),
          achieved_at = case when excluded.score > previous.score then now() else previous.achieved_at end;
      -- Receipt time is server-generated: late uploads cannot backdate a season.
      for season in select * from accounts_private.seasons where starts_at <= now() and ends_at > now() and rules_version = run_version loop
        insert into accounts_private.season_scores as previous(owner, season_id, mode, difficulty, score, run_id)
          values(p_owner, season.id, run_mode, run_difficulty, run_score, run_identity)
          on conflict(owner, season_id, mode, difficulty) do update set
            score = greatest(previous.score, excluded.score),
            run_id = case when excluded.score > previous.score then excluded.run_id else previous.run_id end,
            achieved_at = case when excluded.score > previous.score then now() else previous.achieved_at end;
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

create function public.account_history(p_owner uuid, p_limit integer default 20, p_before bigint default null,
  p_mode text default null, p_difficulty text default null, p_outcome text default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb; next_cursor text; amount integer := least(100, greatest(1, coalesce(p_limit, 20)));
begin
  with page as (
    select r.* from accounts_private.runs r where owner = p_owner and (p_before is null or entry_id < p_before)
      and (p_mode is null or mode = p_mode) and (p_difficulty is null or difficulty = p_difficulty) and (p_outcome is null or outcome = p_outcome)
      order by entry_id desc limit amount
  ) select coalesce(jsonb_agg(data || jsonb_build_object('receivedAt', received_at, 'cursor', entry_id::text) order by entry_id desc), '[]'::jsonb),
      case when count(*) = amount then min(entry_id)::text else null end into result, next_cursor from page;
  return jsonb_build_object('runs', result, 'next_cursor', next_cursor);
end $$;

create function public.account_export(p_owner uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare profile accounts_private.profiles;
begin
  select * into strict profile from accounts_private.profiles where owner = p_owner;
  return jsonb_build_object('version', 1, 'exported_at', now(), 'state', profile.state,
    'runs', coalesce((select jsonb_agg(data order by entry_id) from accounts_private.runs where owner = p_owner), '[]'::jsonb),
    'wallet', coalesce((select jsonb_agg(jsonb_build_object('operationId', operation_id, 'reason', reason, 'delta', delta, 'balance', balance, 'receivedAt', received_at) order by received_at) from accounts_private.wallet_entries where owner = p_owner), '[]'::jsonb));
end $$;

create function public.account_delete(p_owner uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  -- Tombstone has no FK: a stale JWT cannot resurrect records after auth deletion.
  insert into accounts_private.deleted_accounts(owner) values(p_owner) on conflict do nothing;
  delete from leaderboard_private.scores where player_id = p_owner;
  delete from accounts_private.profiles where owner = p_owner;
  delete from accounts_private.guest_visibility where owner = p_owner;
  delete from accounts_private.suppressed_players where owner = p_owner;
  delete from accounts_private.moderation_log where owner = p_owner;
  return jsonb_build_object('deleted', true);
end $$;

-- This endpoint is for trusted operators only; local tester flags never confer access.
create function public.account_moderate(p_owner uuid, p_suppress boolean, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_reason is null or char_length(btrim(p_reason)) not between 1 and 500 then raise exception 'A moderation reason is required'; end if;
  if p_suppress then
    insert into accounts_private.suppressed_players(owner, reason) values(p_owner, btrim(p_reason))
      on conflict(owner) do update set reason = excluded.reason, changed_at = now();
  else delete from accounts_private.suppressed_players where owner = p_owner; end if;
  update accounts_private.profiles set restricted = p_suppress where owner = p_owner;
  insert into accounts_private.moderation_log(owner, action, reason) values(p_owner, case when p_suppress then 'suppress' else 'restore' end, btrim(p_reason));
end $$;

create function public.account_set_season(p_id text, p_title text, p_starts_at timestamptz, p_ends_at timestamptz, p_rules_version text default '1')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists(select 1 from accounts_private.seasons where id = p_id) then raise exception 'Seasons are immutable; create a new season'; end if;
  insert into accounts_private.seasons(id,title,starts_at,ends_at,rules_version) values(p_id,p_title,p_starts_at,p_ends_at,p_rules_version);
end $$;

-- Restrict all privileged RPCs. Managed Supabase provides service_role; minimal DB tests may not.
do $$ declare fn record; begin
  for fn in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('account_read','account_receipt','account_dependencies','account_reject','account_commit','account_history','account_export','account_delete','account_moderate','account_set_season') loop
    execute format('revoke all on function %s from public, anon, authenticated', fn.signature);
    if exists(select 1 from pg_roles where rolname='service_role') then execute format('grant execute on function %s to service_role', fn.signature); end if;
  end loop;
end $$;

create function public.get_account_leaderboard(p_mode text, p_difficulty text, p_season text default null,
  p_offset integer default 0, p_limit integer default 10, p_around_me boolean default false)
returns table(rank bigint, player text, score integer, is_you boolean, public_id uuid, cubie text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not leaderboard_private.valid_mode(p_mode,p_difficulty) then raise exception 'Unknown game or difficulty' using errcode='22023'; end if;
  return query
  with candidates as (
    select s.player_id as owner, s.player as old_name, s.score, s.achieved_at from leaderboard_private.scores s
      where p_season is null and s.mode=p_mode and s.difficulty=p_difficulty
    union all
    select s.owner, 'Player'::text, s.score, s.achieved_at from accounts_private.season_scores s
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

create function public.get_account_public_profile(p_public_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('public_id',p.public_id,'player',p.display_name,'cubie','classic')
    from accounts_private.profiles p where p.public_id=p_public_id and p.profile_visible
      and not p.restricted and not exists(select 1 from accounts_private.deleted_accounts d where d.owner=p.owner)
      and not exists(select 1 from accounts_private.suppressed_players s where s.owner=p.owner);
$$;
create function public.get_account_seasons()
returns table(id text,title text,starts_at timestamptz,ends_at timestamptz,rules_version text)
language sql stable security definer set search_path = '' as $$
  select s.id,s.title,s.starts_at,s.ends_at,s.rules_version from accounts_private.seasons s order by starts_at desc limit 100;
$$;
revoke all on function public.get_account_leaderboard(text,text,text,integer,integer,boolean) from public;
revoke all on function public.get_account_public_profile(uuid) from public;
revoke all on function public.get_account_seasons() from public;
grant execute on function public.get_account_leaderboard(text,text,text,integer,integer,boolean) to anon,authenticated;
grant execute on function public.get_account_public_profile(uuid) to anon,authenticated;
grant execute on function public.get_account_seasons() to anon,authenticated;

-- Old clients retain their response shape but cannot bypass participation or moderation.
create or replace function public.get_leaderboard(p_mode text,p_difficulty text)
returns table(rank bigint,player text,score integer,is_you boolean)
language sql stable security definer set search_path = '' as $$
  select r.rank,r.player,r.score,r.is_you from public.get_account_leaderboard(p_mode,p_difficulty) r;
$$;
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
  insert into leaderboard_private.scores as previous(player_id,mode,difficulty,player,score) values(identity,p_mode,p_difficulty,nickname,p_score)
    on conflict(player_id,mode,difficulty) do update set player=excluded.player,score=greatest(previous.score,excluded.score),
      achieved_at=case when excluded.score>previous.score then now() else previous.achieved_at end returning score into best;
  return best;
end $$;
