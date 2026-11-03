-- Public rankings; only the authenticated player can submit their own best.
create schema if not exists leaderboard_private;
revoke all on schema leaderboard_private from public, anon, authenticated;

create function leaderboard_private.valid_mode(game text, difficulty text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(case game
    when 'hangman' then difficulty in ('easy', 'medium', 'hard')
    when 'keyboard' then difficulty = 'progressive'
    when 'dodge' then difficulty in ('easy', 'normal', 'hard', 'merciless')
    when 'boss' then difficulty in ('mean', 'cruel', 'nightmare', 'impossible')
    when 'pumpkin' then difficulty in ('come_on', 'baby', 'coward', 'phase2')
    else false end, false);
$$;

create table leaderboard_private.scores (
  player_id uuid not null references auth.users(id) on delete cascade,
  mode text not null,
  difficulty text not null,
  player text not null check (char_length(player) between 1 and 24 and player !~ '[[:cntrl:]]'),
  score integer not null check (score between 0 and 1000000000),
  achieved_at timestamptz not null default now(),
  primary key (player_id, mode, difficulty),
  check (leaderboard_private.valid_mode(mode, difficulty))
);
alter table leaderboard_private.scores enable row level security;
revoke all on table leaderboard_private.scores from public, anon, authenticated;
create index leaderboard_ranking on leaderboard_private.scores
  (mode, difficulty, score desc, achieved_at, player_id);

create function public.submit_leaderboard_score(p_mode text, p_difficulty text, p_player text, p_score integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  identity uuid := auth.uid();
  nickname text := btrim(p_player);
  best integer;
begin
  if identity is null then
    raise exception 'Sign in before submitting a score' using errcode = '42501';
  end if;
  if not leaderboard_private.valid_mode(p_mode, p_difficulty) then
    raise exception 'Unknown game or difficulty' using errcode = '22023';
  end if;
  if nickname is null or char_length(nickname) not between 1 and 24 or nickname ~ '[[:cntrl:]]'
     or p_score is null or p_score not between 0 and 1000000000 then
    raise exception 'Invalid player or score' using errcode = '22023';
  end if;
  if p_mode = 'hangman' and p_score > (case p_difficulty when 'easy' then 10 when 'medium' then 7 else 5 end) then
    raise exception 'Invalid Hangman score' using errcode = '22023';
  end if;
  insert into leaderboard_private.scores as previous (player_id, mode, difficulty, player, score)
    values (identity, p_mode, p_difficulty, nickname, p_score)
    on conflict (player_id, mode, difficulty) do update set
      player = excluded.player,
      score = greatest(previous.score, excluded.score),
      achieved_at = case when excluded.score > previous.score then now() else previous.achieved_at end
    returning score into best;
  return best;
end;
$$;

create function public.get_leaderboard(p_mode text, p_difficulty text)
returns table (rank bigint, player text, score integer, is_you boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not leaderboard_private.valid_mode(p_mode, p_difficulty) then
    raise exception 'Unknown game or difficulty' using errcode = '22023';
  end if;
  return query
    select row_number() over (order by s.score desc, s.achieved_at, s.player_id),
      s.player, s.score, coalesce(s.player_id = auth.uid(), false)
    from leaderboard_private.scores s
    where s.mode = p_mode and s.difficulty = p_difficulty
    order by s.score desc, s.achieved_at, s.player_id limit 10;
end;
$$;

revoke all on function public.submit_leaderboard_score(text, text, text, integer) from public, anon, authenticated;
grant execute on function public.submit_leaderboard_score(text, text, text, integer) to authenticated;
revoke all on function public.get_leaderboard(text, text) from public, anon, authenticated;
grant execute on function public.get_leaderboard(text, text) to anon, authenticated;
