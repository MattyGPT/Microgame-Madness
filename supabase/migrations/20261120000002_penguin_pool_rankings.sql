-- Penguin Pool: one point per completed match win; existing scores preserved.
-- Add five games to lifetime/season rankings; preserve existing scores and weights.
-- Eight Wrath-only attacks and their Easy/Hard variants. Existing weights already cover valid Wrath modes.
create or replace function leaderboard_private.valid_mode(game text, difficulty text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(case game
    when 'geomayhem' then difficulty ~ '^level_([1-9]|1[0-9]|20)$'
    when 'pool' then difficulty='standard'
    when 'coindrop' then difficulty='standard'
    when 'nanolab' then difficulty='standard'
    when 'tearesseract' then difficulty='standard'
    when 'treasure' then difficulty='standard'
    when 'hangman' then difficulty in ('easy', 'medium', 'hard')
    when 'keyboard' then difficulty in ('progressive', 'endurance')
    when 'dodge' then difficulty in ('easy', 'normal', 'hard', 'merciless', 'impossible', 'chaos')
    when 'boss' then difficulty in ('mean', 'cruel', 'nightmare', 'impossible')
    when 'pumpkin' then difficulty in ('come_on', 'baby', 'coward', 'phase2')
    when 'wrath' then difficulty ~ '^(color_memory|bone_gauntlet|rotating_rings|magenta_fingers|chaos|royal_slams|haunted_quadrants|starfall_verdict|pendulum_court|crown_chess|mirror_lances|briar_pursuit|eclipse_waltz|resonant_bells|royal_loom|random_order)(__easy|__hard)?$'
    else false end, false);
$$;


create or replace function leaderboard_private.weight_quarters(game text, difficulty text)
returns integer language sql immutable set search_path = '' as $$
  select case game
    when 'geomayhem' then case when leaderboard_private.valid_mode(game,difficulty) then 4 end
    when 'pool' then 4
    when 'coindrop' then 4
    when 'nanolab' then 4
    when 'tearesseract' then 4
    when 'treasure' then 4
    when 'hangman' then case difficulty when 'easy' then 4 when 'medium' then 10 when 'hard' then 16 end
    when 'dodge' then case difficulty when 'easy' then 4 when 'normal' then 7 when 'chaos' then 10 when 'hard' then 14 when 'merciless' then 19 when 'impossible' then 22 end
    when 'boss' then case difficulty when 'mean' then 4 when 'cruel' then 9 when 'nightmare' then 15 when 'impossible' then 23 end
    when 'pumpkin' then case difficulty when 'come_on' then 4 when 'baby' then 7 when 'coward' then 10 when 'phase2' then 14 end
    when 'keyboard' then case difficulty when 'progressive' then 4 when 'endurance' then 2 end
    when 'wrath' then case when leaderboard_private.valid_mode(game,difficulty) then
      case when difficulty like '%\_\_easy' then 2 when difficulty like '%\_\_hard' then 8 else 4 end end
  end;
$$;
-- Show saved cosmetics for public profiles without exposing private profile equipment.
create or replace function public.get_game_leaderboard(p_mode text, p_season text default null,
  p_offset integer default 0, p_limit integer default 10, p_around_me boolean default false)
returns table(rank bigint, player text, score double precision, is_you boolean, public_id uuid, cubie text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_mode is null or p_mode not in ('hangman','keyboard','dodge','boss','pumpkin','wrath','geomayhem','coindrop','nanolab','tearesseract','treasure','pool') then
    raise exception 'Unknown game' using errcode='22023';
  end if;
  return query
  with raw_scores as (
    select s.player_id as owner, s.player as old_name, s.total, s.difficulty, s.achieved_at
      from leaderboard_private.scores s where p_season is null and s.mode=p_mode
    union all
    select s.owner, 'Player'::text, s.total, s.difficulty, s.achieved_at
      from accounts_private.season_scores s where p_season is not null and s.season_id=p_season and s.mode=p_mode
  ), combined as (
    select r.owner, (array_agg(r.old_name order by r.achieved_at desc,r.difficulty))[1] as old_name,
      round(sum(r.total::numeric * leaderboard_private.weight_quarters(p_mode,r.difficulty)) / 4)::double precision as score,
      max(r.achieved_at) as achieved_at
    from raw_scores r where accounts_private.visible(r.owner)
    group by r.owner
  ), ordered as (
    select row_number() over(order by c.score desc,c.achieved_at,c.owner) as placement,
      coalesce(p.display_name,c.old_name) as name,c.score,c.owner,
      case when p.profile_visible then p.public_id else null::uuid end as exposed_id,
      case when p.profile_visible then coalesce(nullif(p.cubie, ''), 'classic') else 'classic' end as appearance
    from combined c left join accounts_private.profiles p on p.owner=c.owner
  ), start_at as (
    select case when p_around_me then greatest(0,coalesce((select placement-3 from ordered where owner=auth.uid()),0))
      else least(100000, greatest(0, coalesce(p_offset,0))) end as value
  )
  select o.placement,o.name,o.score,coalesce(o.owner=auth.uid(),false),o.exposed_id,o.appearance
    from ordered o where o.placement > (select value from start_at)
    order by o.placement limit least(100,greatest(1,coalesce(p_limit,10)));
end $$;
revoke all on function public.get_game_leaderboard(text,text,integer,integer,boolean) from public;
grant execute on function public.get_game_leaderboard(text,text,integer,integer,boolean) to anon,authenticated;
notify pgrst, 'reload schema';

-- Atomic side-game results share the same receipt and ranking transaction.
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
    if p_kind <> 'run.finish' and not (p_kind='arcade' and p_run->>'mode' in ('coindrop','nanolab','tearesseract','treasure','pool') and p_run->>'id'=p_operation_id) then raise exception 'invalid_run'; end if;
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
