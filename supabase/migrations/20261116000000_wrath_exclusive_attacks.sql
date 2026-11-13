-- Eight Wrath-only attacks and their Easy/Hard variants. Existing weights already cover valid Wrath modes.
create or replace function leaderboard_private.valid_mode(game text, difficulty text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(case game
    when 'hangman' then difficulty in ('easy', 'medium', 'hard')
    when 'keyboard' then difficulty in ('progressive', 'endurance')
    when 'dodge' then difficulty in ('easy', 'normal', 'hard', 'merciless', 'impossible', 'chaos')
    when 'boss' then difficulty in ('mean', 'cruel', 'nightmare', 'impossible')
    when 'pumpkin' then difficulty in ('come_on', 'baby', 'coward', 'phase2')
    when 'wrath' then difficulty ~ '^(color_memory|bone_gauntlet|rotating_rings|magenta_fingers|chaos|royal_slams|haunted_quadrants|starfall_verdict|pendulum_court|crown_chess|mirror_lances|briar_pursuit|eclipse_waltz|resonant_bells|royal_loom|random_order)(__easy|__hard)?$'
    else false end, false);
$$;

notify pgrst, 'reload schema';
