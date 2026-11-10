-- Keep raw lifetime totals intact. Weight them on read so old and new scores
-- follow the same rules, without lossy per-round rounding or a destructive rewrite.
create function leaderboard_private.weight_quarters(game text, difficulty text)
returns integer language sql immutable set search_path = '' as $$
  select case game
    when 'hangman' then case difficulty when 'easy' then 4 when 'medium' then 10 when 'hard' then 16 end
    when 'dodge' then case difficulty when 'easy' then 4 when 'normal' then 7 when 'chaos' then 10 when 'hard' then 14 when 'merciless' then 19 when 'impossible' then 22 end
    when 'boss' then case difficulty when 'mean' then 4 when 'cruel' then 9 when 'nightmare' then 15 when 'impossible' then 23 end
    when 'pumpkin' then case difficulty when 'come_on' then 4 when 'baby' then 7 when 'coward' then 10 when 'phase2' then 14 end
    when 'keyboard' then case when difficulty='progressive' then 4 end
    when 'wrath' then case when leaderboard_private.valid_mode(game,difficulty) then 4 end
  end;
$$;

create function public.get_game_leaderboard(p_mode text, p_season text default null,
  p_offset integer default 0, p_limit integer default 10, p_around_me boolean default false)
returns table(rank bigint, player text, score double precision, is_you boolean, public_id uuid, cubie text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_mode is null or p_mode not in ('hangman','keyboard','dodge','boss','pumpkin','wrath') then
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
      'classic'::text as appearance
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
