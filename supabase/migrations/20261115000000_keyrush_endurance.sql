-- Endurance earns half Progressive’s combined global score. Preserve deployed Wrath variants.
create or replace function leaderboard_private.valid_mode(game text, difficulty text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(case game
    when 'hangman' then difficulty in ('easy', 'medium', 'hard')
    when 'keyboard' then difficulty in ('progressive', 'endurance')
    when 'dodge' then difficulty in ('easy', 'normal', 'hard', 'merciless', 'impossible', 'chaos')
    when 'boss' then difficulty in ('mean', 'cruel', 'nightmare', 'impossible')
    when 'pumpkin' then difficulty in ('come_on', 'baby', 'coward', 'phase2')
    when 'wrath' then difficulty ~ '^(color_memory|bone_gauntlet|rotating_rings|magenta_fingers|chaos|royal_slams|haunted_quadrants|random_order)(__easy|__hard)?$'
    else false end, false);
$$;

create or replace function leaderboard_private.weight_quarters(game text, difficulty text)
returns integer language sql immutable set search_path = '' as $$
  select case game
    when 'hangman' then case difficulty when 'easy' then 4 when 'medium' then 10 when 'hard' then 16 end
    when 'dodge' then case difficulty when 'easy' then 4 when 'normal' then 7 when 'chaos' then 10 when 'hard' then 14 when 'merciless' then 19 when 'impossible' then 22 end
    when 'boss' then case difficulty when 'mean' then 4 when 'cruel' then 9 when 'nightmare' then 15 when 'impossible' then 23 end
    when 'pumpkin' then case difficulty when 'come_on' then 4 when 'baby' then 7 when 'coward' then 10 when 'phase2' then 14 end
    when 'keyboard' then case difficulty when 'progressive' then 4 when 'endurance' then 2 end
    when 'wrath' then case when leaderboard_private.valid_mode(game,difficulty) then
      case when difficulty like '%\_\_easy' then 2 when difficulty like '%\_\_hard' then 8 else 4 end end
  end;
$$;

notify pgrst, 'reload schema';
