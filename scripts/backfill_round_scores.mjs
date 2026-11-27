// One-time historical conversion. Receipt scores stay immutable for offline retries.
import {query} from './hosted_accounts_admin.mjs';
const apply=process.argv.includes('--apply');
const sql=`
lock table leaderboard_private.scores, leaderboard_private.run_receipts, accounts_private.runs, accounts_private.profiles, accounts_private.season_scores in share row exclusive mode;
create table if not exists accounts_deploy.round_sum_backup(name text primary key, data jsonb not null, created_at timestamptz not null default now());
revoke all on accounts_deploy.round_sum_backup from public,anon,authenticated;
do $$ begin
 if exists(select 1 from accounts_deploy.round_sum_backup) then raise exception 'Round scores were already converted'; end if;
 if (select count(*) from leaderboard_private.run_receipts where mode='keyboard')<>66
 or (select coalesce(sum(score),0) from leaderboard_private.run_receipts where mode='keyboard')<>290
 or (select count(*) from leaderboard_private.run_receipts where mode='tearesseract')<>11
 or (select coalesce(sum(score),0) from leaderboard_private.run_receipts where mode='tearesseract')<>38
 or exists(select 1 from accounts_private.runs where mode in ('keyboard','tearesseract') and received_at>='2026-11-24 18:45:00+00')
 then raise exception 'History changed since the audit; inspect before converting'; end if;
end $$;
insert into accounts_deploy.round_sum_backup(name,data)
select 'scores',coalesce(jsonb_agg(to_jsonb(s)),'[]') from leaderboard_private.scores s where mode in ('keyboard','tearesseract')
union all select 'runs',coalesce(jsonb_agg(to_jsonb(r)),'[]') from accounts_private.runs r where mode in ('keyboard','tearesseract')
union all select 'seasons',coalesce(jsonb_agg(to_jsonb(s)),'[]') from accounts_private.season_scores s where mode in ('keyboard','tearesseract')
union all select 'profiles',coalesce(jsonb_agg(to_jsonb(p)),'[]') from accounts_private.profiles p where state->'scores' ?| array['keyboard:progressive','keyboard:endurance','tearesseract:standard'];
create temporary table conversion on commit drop as
select x.player_id owner,x.run_id,x.mode,x.difficulty,x.score old_score,(x.score::bigint*(x.score+1)/2)::integer new_score from leaderboard_private.run_receipts x where mode in ('keyboard','tearesseract')
union all
select r.owner,r.run_id,r.mode,r.difficulty,r.score,(r.score::bigint*(r.score+1)/2)::integer from accounts_private.runs r where r.mode in ('keyboard','tearesseract') and r.eligible and not exists(select 1 from leaderboard_private.run_receipts x where x.player_id=r.owner and x.run_id=r.run_id);
update leaderboard_private.scores s set total=s.total+c.delta,score=greatest(s.score,c.best)
from (select owner,mode,difficulty,sum(new_score-old_score) delta,max(new_score) best from conversion group by 1,2,3)c
where s.player_id=c.owner and s.mode=c.mode and s.difficulty=c.difficulty;
update accounts_private.season_scores s set total=s.total+c.delta,score=greatest(s.score,c.best)
from (select r.owner,r.mode,r.difficulty,season.id,sum(r.score::bigint*(r.score+1)/2-r.score) delta,max((r.score::bigint*(r.score+1)/2)::integer) best
 from accounts_private.runs r join accounts_private.seasons season on r.received_at>=season.starts_at and r.received_at<season.ends_at and r.rules_version=season.rules_version
 where r.mode in ('keyboard','tearesseract') and r.eligible group by 1,2,3,4)c
where s.owner=c.owner and s.mode=c.mode and s.difficulty=c.difficulty and s.season_id=c.id;
update accounts_private.runs set data=jsonb_set(data,'{score}',to_jsonb((score::bigint*(score+1)/2)::integer))||jsonb_build_object('scoring','round-sum','legacyScore',score),score=(score::bigint*(score+1)/2)::integer where mode in ('keyboard','tearesseract');
do $$ declare p record; k text; updated jsonb; run record; n bigint; begin
 for p in select * from accounts_private.profiles where state->'scores' ?| array['keyboard:progressive','keyboard:endurance','tearesseract:standard'] loop
  updated:=p.state;
  foreach k in array array['keyboard:progressive','keyboard:endurance','tearesseract:standard'] loop
   if updated->'scores' ? k then
    updated:=jsonb_set(updated,array['scores',k],(select coalesce(jsonb_agg(jsonb_set(e,'{score}',to_jsonb((e->>'score')::bigint*((e->>'score')::bigint+1)/2))),'[]') from jsonb_array_elements(updated->'scores'->k)e));
   end if;
  end loop;
  for run in select key,value from jsonb_each(coalesce(updated->'runs','{}')) where value->>'mode'='keyboard' and value->>'finished'='true' loop
   n:=(run.value->>'score')::bigint;
   updated:=jsonb_set(updated,array['runs',run.key,'score'],to_jsonb(n*(n+1)/2));
   if run.value ? 'snapshot' then
    updated:=jsonb_set(updated,array['runs',run.key,'snapshot','score'],to_jsonb(n*(n+1)/2));
    updated:=jsonb_set(updated,array['runs',run.key,'snapshot','rounds_completed'],to_jsonb(n));
   end if;
  end loop;
  update accounts_private.profiles set state=updated,revision=revision+1,updated_at=now() where owner=p.owner;
 end loop;
end $$;
`;
const results=await query('begin;'+sql+`select mode,count(*) players,sum(total) total from leaderboard_private.scores where mode in ('keyboard','tearesseract') group by mode;`+(apply?'commit;':'rollback;'));
console.log(JSON.stringify({applied:apply,results}));
