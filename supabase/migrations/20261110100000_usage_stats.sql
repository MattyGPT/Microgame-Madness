-- Aggregate usage counters. Nothing identifying is stored: one opaque hash of a
-- per-browser random id per day, plus daily event totals. No IP address, handle,
-- auth id, score payload, or credential ever reaches these tables, and browsers
-- can only add to counters through record_usage. These are trend metrics, never
-- an authorization, ranking, or moderation input.
create schema if not exists stats_private;
revoke all on schema stats_private from public, anon, authenticated;

create table stats_private.daily_events (
  day date not null,
  kind text not null check (kind in ('visit', 'login', 'register', 'play', 'finish')),
  game text not null default '' check (game in ('', 'hangman', 'keyboard', 'dodge', 'boss',
    'pumpkin', 'wrath', 'singularity', 'core_practice', 'geomayhem')),
  difficulty text not null default '' check (difficulty ~ '^[a-z0-9_]{0,32}$'),
  outcome text not null default '' check (outcome in ('', 'win', 'loss', 'exit', 'interrupted')),
  tally integer not null default 0 check (tally >= 0 and tally <= 1000000000),
  primary key (day, kind, game, difficulty, outcome)
);
-- One row per browser per day. scope is reported by the client, so it labels how
-- a visit happened; it is not proof of ownership. Authoritative signed-in play
-- remains accounts_private.runs.
create table stats_private.daily_players (
  day date not null,
  visitor_hash text not null check (visitor_hash ~ '^[0-9a-f]{64}$'),
  scope text not null default 'guest' check (scope in ('guest', 'account')),
  events integer not null default 0 check (events >= 0 and events <= 1000000),
  first_seen_at timestamptz not null default now(),
  primary key (day, visitor_hash)
);
create table stats_private.call_limits (
  bucket text primary key check (bucket ~ '^[0-9a-f]{64}$'),
  window_at timestamptz not null,
  attempts integer not null
);
alter table stats_private.daily_events enable row level security;
alter table stats_private.daily_players enable row level security;
alter table stats_private.call_limits enable row level security;
revoke all on stats_private.daily_events, stats_private.daily_players, stats_private.call_limits
  from public, anon, authenticated;
create index stats_events_day on stats_private.daily_events (day, kind);
create index stats_players_day on stats_private.daily_players (day, scope);

create function public.record_usage(p_visitor text, p_scope text, p_events jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_day date := (now() at time zone 'utc')::date;
  v_visitor text;
  v_scope text := case when p_scope = 'account' then 'account' else 'guest' end;
  v_item jsonb;
  v_kind text; v_game text; v_difficulty text; v_outcome text;
  v_accepted integer := 0;
  v_attempts integer;
  v_index integer;
  v_window record;
begin
  if p_visitor !~ '^[0-9a-fA-F]{32,64}$' then raise exception 'invalid_visitor'; end if;
  if jsonb_typeof(p_events) is distinct from 'array'
     or jsonb_array_length(p_events) not between 1 and 32 then raise exception 'invalid_events'; end if;
  v_visitor := encode(sha256(convert_to('mm-usage-v1:' || lower(p_visitor), 'UTF8')), 'hex');
  delete from stats_private.call_limits where window_at < now() - interval '2 days';
  -- Guests have no server-side identity and no IP is collected, so abuse is bounded
  -- per reported browser rather than prevented. Inflated counters stay visible in
  -- the report as totals far above distinct players.
  for v_window in select * from (values ('minute', 12, 60), ('day', 400, 86400))
    as windows(window_name, allowed, seconds)
  loop
    insert into stats_private.call_limits values (
      encode(sha256(convert_to('mm-usage-v1:' || v_window.window_name || ':' || v_visitor, 'UTF8')), 'hex'),
      now(), 1)
    on conflict (bucket) do update set
      attempts = case when call_limits.window_at < now() - make_interval(secs => v_window.seconds)
        then 1 else call_limits.attempts + 1 end,
      window_at = case when call_limits.window_at < now() - make_interval(secs => v_window.seconds)
        then now() else call_limits.window_at end
    returning attempts into v_attempts;
    if v_attempts > v_window.allowed then raise exception 'rate_limited'; end if;
  end loop;
  for v_index in 0 .. jsonb_array_length(p_events) - 1
  loop
    v_item := p_events->v_index;
    v_kind := v_item->>'kind';
    v_game := coalesce(v_item->>'game', '');
    v_difficulty := coalesce(v_item->>'difficulty', '');
    v_outcome := coalesce(v_item->>'outcome', '');
    if jsonb_typeof(v_item) is distinct from 'object'
       or v_kind is null or v_kind not in ('visit', 'login', 'register', 'play', 'finish')
       or v_game not in ('', 'hangman', 'keyboard', 'dodge', 'boss', 'pumpkin', 'wrath',
                         'singularity', 'core_practice', 'geomayhem')
       or v_difficulty !~ '^[a-z0-9_]{0,32}$'
       or v_outcome not in ('', 'win', 'loss', 'exit', 'interrupted')
       -- Each kind carries only its own dimensions, which keeps the counter key space small.
       or (v_kind in ('visit', 'login', 'register')
           and (v_game <> '' or v_difficulty <> '' or v_outcome <> ''))
       or (v_kind = 'play' and (v_game = '' or v_outcome <> ''))
       or (v_kind = 'finish' and (v_game = '' or v_outcome = ''))
       or exists (select 1 from jsonb_object_keys(v_item) as key
                  where key not in ('kind', 'game', 'difficulty', 'outcome')) then
      raise exception 'invalid_event';
    end if;
    insert into stats_private.daily_events as existing (day, kind, game, difficulty, outcome, tally)
      values (v_day, v_kind, v_game, v_difficulty, v_outcome, 1)
      on conflict (day, kind, game, difficulty, outcome)
      do update set tally = existing.tally + 1;
    v_accepted := v_accepted + 1;
  end loop;
  insert into stats_private.daily_players as existing (day, visitor_hash, scope, events)
    values (v_day, v_visitor, v_scope, v_accepted)
    on conflict (day, visitor_hash) do update set
      events = existing.events + excluded.events,
      scope = case when excluded.scope = 'account' then 'account' else existing.scope end;
  return v_accepted;
end $$;

-- Operator-run retention. Counters are small and grow with active browsers per
-- day, so nothing is deleted implicitly; choose a window and prune deliberately.
create function public.prune_usage(p_keep_days integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  cutoff date := (now() at time zone 'utc')::date - p_keep_days;
  removed_events integer; removed_players integer;
begin
  if p_keep_days is null or p_keep_days not between 1 and 3650 then raise exception 'invalid_retention'; end if;
  delete from stats_private.daily_events where day < cutoff;
  get diagnostics removed_events = row_count;
  delete from stats_private.daily_players where day < cutoff;
  get diagnostics removed_players = row_count;
  return jsonb_build_object('cutoff', cutoff, 'events', removed_events, 'players', removed_players);
end $$;

-- Counters stay unreadable by browser roles; only the operator's service key can
-- read tables or prune.
revoke all on function public.record_usage(text, text, jsonb),
  public.prune_usage(integer) from public, anon, authenticated;
grant execute on function public.record_usage(text, text, jsonb) to anon, authenticated;
grant execute on function public.prune_usage(integer) to service_role;
