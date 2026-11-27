-- Apply updated Balloon Pop weights to public rankings. Raw scores stay unchanged.
create or replace function leaderboard_private.weight_quarters(game text, difficulty text)
returns integer language sql immutable set search_path = '' as $$
  select case game
    when 'geomayhem' then case when leaderboard_private.valid_mode(game,difficulty) then 4 end
    when 'balloon' then case difficulty when 'normal' then 4 when 'hard' then 12 when 'merciless' then 20 when 'impossible' then 30 end
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
