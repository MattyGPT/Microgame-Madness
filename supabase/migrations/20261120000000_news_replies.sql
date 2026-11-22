create table news_private.replies (
 id uuid primary key default gen_random_uuid(),
 comment uuid not null references news_private.comments on delete cascade,
 owner uuid references auth.users on delete set null,
 label text not null,
 body text not null check(length(body) between 1 and 1000),
 created_at timestamptz not null default now()
);
alter table news_private.replies enable row level security;
create index news_replies_comment on news_private.replies(comment,created_at);
create function news_private.reply_action(action text,target uuid,body text,who uuid,local_creator boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare author text; result uuid;
begin
 if local_creator then author:='Nate';
 else
  select split_part(t.label,',',1) into author from news_private.team t join accounts_private.identities i on i.owner=t.owner and i.active where t.owner=who;
  if author is null then raise exception 'Only Nate and Aidan can reply' using errcode='42501'; end if;
 end if;
 if action='delete' then
  delete from news_private.replies where id=target;
 elsif action='create' then
  if body is null or length(btrim(body)) not between 1 and 1000 then raise exception 'Write between 1 and 1000 characters'; end if;
  if news_private.unkind(body) then raise exception 'Kind words only'; end if;
  perform 1 from news_private.comments where id=target for update;
  if not found then raise exception 'Suggestion no longer exists'; end if;
  if (select count(*) from news_private.replies where comment=target)>=20 then raise exception 'This suggestion has reached its reply limit'; end if;
  insert into news_private.replies(comment,owner,label,body) values(target,case when local_creator then null else who end,author,btrim(body)) returning id into result;
 else raise exception 'Unknown reply action'; end if;
 insert into news_private.audit(owner,action,target) values(who,'reply_'||action,target);
 return jsonb_build_object('id',result);
end $$;
create function public.news_reply(action text,target uuid,body text default null) returns jsonb language sql security definer set search_path='' as $$
 select news_private.reply_action(action,target,body,auth.uid(),false);
$$;
revoke all on function news_private.reply_action(text,uuid,text,uuid,boolean) from public,anon,authenticated;
revoke all on function public.news_reply(text,uuid,text) from public,anon;
grant execute on function public.news_reply(text,uuid,text) to authenticated;
create or replace function public.news_feed() returns jsonb language sql stable security definer set search_path='' as $$
 with totals as (
 select s.player_id,s.mode,round(sum(s.total::numeric*leaderboard_private.weight_quarters(s.mode,s.difficulty))/4) score,max(s.achieved_at) achieved
 from leaderboard_private.scores s where accounts_private.visible(s.player_id) group by s.player_id,s.mode
 ), ranked as (select player_id,mode,row_number() over(partition by mode order by score desc,achieved,player_id) place from totals)
 select jsonb_build_object('posts',coalesce((select jsonb_agg(row_to_json(p) order by p.created_at desc) from (
 select p.*, (select count(*) from news_private.likes l where l.post=p.id) likes,
 exists(select 1 from news_private.likes l where l.post=p.id and l.owner=auth.uid()) liked,
 exists(select 1 from news_private.seen s where s.post=p.id and s.owner=auth.uid()) seen
 from news_private.posts p order by created_at desc limit 100) p),'[]'::jsonb),
 'reward',jsonb_build_object('approved',news_private.approved_count(auth.uid()),'earned',exists(select 1 from news_private.rewards where owner=auth.uid())),
 'comments',coalesce((select jsonb_agg(row_to_json(c) order by c.created_at desc) from (
 select c.id,c.body,c.created_at,
 coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'body',r.body,'label',r.label,'created_at',r.created_at) order by r.created_at,r.id) from news_private.replies r where r.comment=c.id),'[]'::jsonb) replies,
 (select count(*) from news_private.suggestion_likes l where l.comment=c.id) likes,
 exists(select 1 from news_private.suggestion_likes l where l.comment=c.id and l.owner=auth.uid()) liked,
 exists(select 1 from news_private.suggestion_likes l where l.comment=c.id and (l.actor='local_creator' or exists(select 1 from news_private.team t join accounts_private.identities i on i.owner=t.owner and i.active where t.owner=l.owner))) creator_liked,
 coalesce(t.label,i.handle,p.display_name,'Player') name,coalesce(p.cubie,'classic') cubie,
 coalesce((select jsonb_agg(jsonb_build_object('game',r.mode,'place',r.place)) from ranked r where r.player_id=c.owner and r.place<=3),'[]'::jsonb) medals
 from news_private.comments c left join accounts_private.profiles p on p.owner=c.owner left join accounts_private.identities i on i.owner=c.owner left join news_private.team t on t.owner=c.owner
 order by c.created_at desc limit 100) c),'[]'::jsonb));
$$;

notify pgrst,'reload schema';
