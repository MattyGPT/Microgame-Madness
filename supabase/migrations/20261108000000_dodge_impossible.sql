-- Give Impossible Turtle Dodge its own leaderboard; preserve existing records.
create or replace function leaderboard_private.valid_mode(game text, difficulty text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(case game
    when 'hangman' then difficulty in ('easy', 'medium', 'hard')
    when 'keyboard' then difficulty = 'progressive'
    when 'dodge' then difficulty in ('easy', 'normal', 'hard', 'merciless', 'impossible')
    when 'boss' then difficulty in ('mean', 'cruel', 'nightmare', 'impossible')
    when 'pumpkin' then difficulty in ('come_on', 'baby', 'coward', 'phase2')
    when 'wrath' then difficulty in ('color_memory', 'bone_gauntlet', 'rotating_rings',
      'magenta_fingers', 'chaos', 'royal_slams', 'haunted_quadrants', 'random_order')
    else false end, false);
$$;
