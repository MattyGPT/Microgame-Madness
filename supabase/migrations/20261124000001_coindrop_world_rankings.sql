-- Old coin receipts remain in history. Their counts cannot reveal campaign
-- progress; existing players start at world 1 until their campaign reports it.
update leaderboard_private.scores set score=1,total=1 where mode='coindrop';
update accounts_private.season_scores set score=1,total=1
where mode='coindrop' and season_id in (select id from accounts_private.seasons where ends_at > now());

-- Apply maximum-world semantics to every submission path, including guests,
-- account commits, lifetime rankings, and seasonal rankings.
create or replace function leaderboard_private.coindrop_world_score()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.mode='coindrop' then
    if new.score not between 1 and 1000 then raise exception 'invalid_world' using errcode = '22023'; end if;
    if TG_OP='UPDATE' then
      new.score := greatest(old.score,new.score);
      if new.score=old.score then new.achieved_at := old.achieved_at; end if;
    end if;
    new.total := new.score;
  end if;
  return new;
end $$;
drop trigger if exists coindrop_world_score on leaderboard_private.scores;
create trigger coindrop_world_score before insert or update on leaderboard_private.scores
for each row execute function leaderboard_private.coindrop_world_score();
drop trigger if exists coindrop_world_score on accounts_private.season_scores;
create trigger coindrop_world_score before insert or update on accounts_private.season_scores
for each row execute function leaderboard_private.coindrop_world_score();
