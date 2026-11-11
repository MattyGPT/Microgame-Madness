-- Single read path for usage reporting, shared by scripts/usage_report.mjs and the
-- operator dashboard so the two cannot disagree. Aggregates only: the returned
-- document holds counters and UTC days, never a visitor hash, owner, or handle.
-- Service role only; browser roles cannot read stats_private or call this.
create function public.usage_report(p_days integer default 30)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_from date;
  v_from_ts timestamptz;
  v_days jsonb;
  v_games jsonb;
  v_runs jsonb;
  v_accounts jsonb;
  v_totals jsonb;
begin
  if p_days is null or p_days not between 1 and 365 then raise exception 'invalid_window'; end if;
  v_from := v_today - (p_days - 1);
  v_from_ts := v_from::timestamp at time zone 'utc';

  -- Every day in the window appears, so a quiet day reads as zero rather than a gap.
  select coalesce(jsonb_agg(jsonb_build_object(
      'day', series.day::text,
      'visits', events.visits, 'players', players.players,
      'accounts', players.accounts, 'guests', players.guests,
      'logins', events.logins, 'registers', events.registers,
      'plays', events.plays, 'finishes', events.finishes,
      'wins', events.wins, 'losses', events.losses,
      'exits', events.exits, 'interrupted', events.interrupted
    ) order by series.day desc), '[]'::jsonb)
  into v_days
  from (select generate_series(v_from, v_today, interval '1 day')::date as day) as series
  left join lateral (
    select
      coalesce(sum(tally) filter (where kind = 'visit'), 0) as visits,
      coalesce(sum(tally) filter (where kind = 'login'), 0) as logins,
      coalesce(sum(tally) filter (where kind = 'register'), 0) as registers,
      coalesce(sum(tally) filter (where kind = 'play'), 0) as plays,
      coalesce(sum(tally) filter (where kind = 'finish'), 0) as finishes,
      coalesce(sum(tally) filter (where kind = 'finish' and outcome = 'win'), 0) as wins,
      coalesce(sum(tally) filter (where kind = 'finish' and outcome = 'loss'), 0) as losses,
      coalesce(sum(tally) filter (where kind = 'finish' and outcome = 'exit'), 0) as exits,
      coalesce(sum(tally) filter (where kind = 'finish' and outcome = 'interrupted'), 0)
        as interrupted
    from stats_private.daily_events where day = series.day
  ) as events on true
  left join lateral (
    select count(*) as players,
      count(*) filter (where scope = 'account') as accounts,
      count(*) filter (where scope = 'guest') as guests
    from stats_private.daily_players where day = series.day
  ) as players on true;

  select coalesce(jsonb_agg(jsonb_build_object(
      'game', grouped.game, 'plays', grouped.plays, 'days_played', grouped.days_played,
      'finishes', grouped.finishes, 'wins', grouped.wins, 'losses', grouped.losses,
      'exits', grouped.exits, 'interrupted', grouped.interrupted
    ) order by grouped.plays desc, grouped.game), '[]'::jsonb)
  into v_games
  from (
    select game,
      coalesce(sum(tally) filter (where kind = 'play'), 0) as plays,
      count(distinct day) filter (where kind = 'play') as days_played,
      coalesce(sum(tally) filter (where kind = 'finish'), 0) as finishes,
      coalesce(sum(tally) filter (where kind = 'finish' and outcome = 'win'), 0) as wins,
      coalesce(sum(tally) filter (where kind = 'finish' and outcome = 'loss'), 0) as losses,
      coalesce(sum(tally) filter (where kind = 'finish' and outcome = 'exit'), 0) as exits,
      coalesce(sum(tally) filter (where kind = 'finish' and outcome = 'interrupted'), 0)
        as interrupted
    from stats_private.daily_events
    where game <> '' and day between v_from and v_today
    group by game
  ) as grouped;

  -- Server-side truth for signed-in play; the dashboard shows it next to the counters.
  select coalesce(jsonb_agg(jsonb_build_object(
      'day', grouped.day::text, 'players', grouped.players,
      'runs', grouped.runs, 'wins', grouped.wins
    ) order by grouped.day desc), '[]'::jsonb)
  into v_runs
  from (
    select (received_at at time zone 'utc')::date as day,
      count(distinct owner) as players, count(*) as runs,
      count(*) filter (where outcome = 'win') as wins
    from accounts_private.runs
    where received_at >= v_from_ts and (received_at at time zone 'utc')::date <= v_today
    group by 1
  ) as grouped;

  select jsonb_build_object(
    'active_handles', (select count(*) from accounts_private.identities where active),
    'reserved_handles', (select count(*) from accounts_private.identities),
    'new_handles', (select count(*) from accounts_private.identities where created_at >= v_from_ts),
    'accounts', (select count(*) from auth.users
      where deleted_at is null and is_anonymous = false),
    'new_accounts', (select count(*) from auth.users
      where deleted_at is null and is_anonymous = false and created_at >= v_from_ts),
    'signed_in_recently', (select count(*) from auth.users
      where deleted_at is null and is_anonymous = false and last_sign_in_at >= v_from_ts),
    'anonymous_users', (select count(*) from auth.users
      where deleted_at is null and is_anonymous),
    'deleted_accounts', (select count(*) from accounts_private.deleted_accounts)
  ) into v_accounts;

  select jsonb_build_object(
    'since', (select min(day)::text from stats_private.daily_players),
    'unique_browsers', (select count(distinct visitor_hash) from stats_private.daily_players),
    'browsers_signed_in', (select count(distinct visitor_hash)
      from stats_private.daily_players where scope = 'account'),
    'visits', (select coalesce(sum(tally), 0) from stats_private.daily_events where kind = 'visit'),
    'plays', (select coalesce(sum(tally), 0) from stats_private.daily_events where kind = 'play'),
    'finishes', (select coalesce(sum(tally), 0) from stats_private.daily_events where kind = 'finish'),
    'wins', (select coalesce(sum(tally), 0) from stats_private.daily_events
      where kind = 'finish' and outcome = 'win'),
    'leaderboard_rows', (select count(*) from leaderboard_private.scores)
  ) into v_totals;

  return jsonb_build_object(
    'generated_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'window_days', p_days,
    'window_start', v_from::text,
    'window_end', v_today::text,
    'days', v_days,
    'games', v_games,
    'account_runs', v_runs,
    'accounts', v_accounts,
    'totals', v_totals);
end $$;

revoke all on function public.usage_report(integer) from public, anon, authenticated;
grant execute on function public.usage_report(integer) to service_role;
