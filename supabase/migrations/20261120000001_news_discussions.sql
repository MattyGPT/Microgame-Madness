alter table news_private.replies alter column comment drop not null;
alter table news_private.replies add column post uuid references news_private.posts on delete cascade;
alter table news_private.replies add column parent uuid references news_private.replies on delete set null;
alter table news_private.replies add column creator boolean not null default true;
alter table news_private.replies add constraint reply_thread check ((comment is not null)::int+(post is not null)::int=1);
create index news_replies_post on news_private.replies(post,created_at);
create table news_private.reply_likes(reply uuid references news_private.replies on delete cascade, actor text not null, owner uuid references auth.users on delete cascade, primary key(reply,actor));
alter table news_private.reply_likes enable row level security;
create table news_private.discussion_clock(actor text primary key,posted_at timestamptz);
alter table news_private.discussion_clock enable row level security;
create function news_private.discussion(action text,target uuid,body text,reply_parent uuid,kind text,who uuid,local_creator boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare is_mod boolean:=false; author text; actor_key text; person news_private.people; selected_reply news_private.replies; until_time timestamptz; last_post timestamptz; result uuid;
begin
 select split_part(t.label,',',1) into author from news_private.team t join accounts_private.identities i on i.owner=t.owner and i.active where t.owner=who;
 is_mod:=local_creator or author is not null;
 actor_key:=case when local_creator then 'local_creator' else who::text end;
 if action='list' then
  return coalesce((select jsonb_agg(to_jsonb(item) order by item.created_at,item.id) from (
   select r.id,r.body,r.label,r.creator,r.parent,r.created_at,
   (select count(*) from news_private.reply_likes l where l.reply=r.id) likes,
   exists(select 1 from news_private.reply_likes l where l.reply=r.id and l.actor=actor_key) liked,
   is_mod or r.owner=who can_delete
   from news_private.replies r where (kind='suggestion' and r.comment=target) or (kind='post' and r.post=target)
   order by r.created_at,r.id limit 200
  ) item),'[]'::jsonb);
 end if;
 if not local_creator and not exists(select 1 from accounts_private.identities where owner=who and active) then raise exception 'Sign in to join the discussion' using errcode='42501'; end if;
 if action in ('like','delete') then
  select * into selected_reply from news_private.replies where id=target for update;
  if not found then raise exception 'Comment no longer exists'; end if;
  if action='delete' then
   if not is_mod and selected_reply.owner is distinct from who then raise exception 'Cannot delete this comment' using errcode='42501'; end if;
   delete from news_private.replies where id=target;
  else
   delete from news_private.reply_likes where reply=target and actor=actor_key;
   if not found then insert into news_private.reply_likes values(target,actor_key,case when local_creator then null else who end); end if;
  end if;
  return '{}'::jsonb;
 end if;
 if action<>'create' then raise exception 'Unknown discussion action'; end if;
 if body is null or length(btrim(body)) not between 1 and 1000 then raise exception 'Write between 1 and 1000 characters'; end if;
 insert into news_private.discussion_clock(actor) values(actor_key) on conflict do nothing;
 select posted_at into last_post from news_private.discussion_clock where actor=actor_key for update;
 if not local_creator then
  insert into news_private.people(owner) values(who) on conflict do nothing;
  select * into person from news_private.people where owner=who for update;
  if person.blocked then return jsonb_build_object('error','Commenting has been blocked by the moderator.'); end if;
  if person.banned_until>now() then return jsonb_build_object('error','Commenting is temporarily paused.','until',person.banned_until); end if;
 end if;
 if news_private.unkind(body) then
  if local_creator then return jsonb_build_object('error','Kind Words Only'); end if;
  until_time:=now()+case when person.strikes+1>=5 then interval '24 hours' else interval '10 minutes' end;
  update news_private.people set strikes=strikes+1,banned_until=until_time where owner=who;
  return jsonb_build_object('kind',true,'hours',person.strikes+1>=5,'until',until_time);
 end if;
 if greatest(last_post,person.last_comment)>now()-interval '3 seconds' then return jsonb_build_object('error','Please wait 3 seconds between comments.'); end if;
 if kind='suggestion' then perform 1 from news_private.comments where id=target for update;
 elsif kind='post' then perform 1 from news_private.posts where id=target for update;
 else raise exception 'Invalid discussion'; end if;
 if not found then raise exception 'This discussion no longer exists'; end if;
 if reply_parent is not null and not exists(select 1 from news_private.replies r where r.id=reply_parent and ((kind='suggestion' and r.comment=target) or (kind='post' and r.post=target))) then raise exception 'Reply must belong to this discussion'; end if;
 if (select count(*) from news_private.replies r where (kind='suggestion' and r.comment=target) or (kind='post' and r.post=target))>=200 then raise exception 'This discussion is full'; end if;
 if local_creator then author:='Nate'; end if;
 if author is null then select handle into author from accounts_private.identities where owner=who; end if;
 insert into news_private.replies(comment,post,parent,owner,label,creator,body) values(case when kind='suggestion' then target end,case when kind='post' then target end,reply_parent,case when local_creator then null else who end,author,is_mod,btrim(body)) returning id into result;
 update news_private.discussion_clock set posted_at=now() where actor=actor_key;
 if not local_creator then update news_private.people set last_comment=now() where owner=who; end if;
 return jsonb_build_object('id',result);
end $$;
create function public.news_discussion(action text,target uuid,body text default null,parent uuid default null,kind text default 'suggestion') returns jsonb language sql security definer set search_path='' as $$
 select news_private.discussion(action,target,body,parent,kind,auth.uid(),false);
$$;
revoke all on function news_private.discussion(text,uuid,text,uuid,text,uuid,boolean) from public,anon,authenticated;
revoke all on function public.news_discussion(text,uuid,text,uuid,text) from public;
grant execute on function public.news_discussion(text,uuid,text,uuid,text) to anon,authenticated;
-- Keep older clients on the same authorization, filtering and cooldown rules.
create or replace function news_private.reply_action(action text,target uuid,body text,who uuid,local_creator boolean default false)
returns jsonb language sql security definer set search_path='' as $$
 select news_private.discussion(action,target,body,null,'suggestion',who,local_creator);
$$;
create or replace function public.news_action(action text, target uuid default null, body text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid := auth.uid(); person news_private.people; until_time timestamptz;
begin
 if who is null then raise exception 'Sign in to participate'; end if;
 if action='seen' then
   insert into news_private.seen values(target,who) on conflict do nothing;
 elsif action='like' then
   perform pg_advisory_xact_lock(hashtextextended(who::text,1));
   delete from news_private.likes where post=target and owner=who;
   if not found then insert into news_private.likes values(target,who); end if;
 elsif action='comment' then
   if not exists(select 1 from accounts_private.identities where owner=who and active) then raise exception 'Create an account to suggest ideas'; end if;
   insert into news_private.people(owner) values(who) on conflict do nothing;
   select * into person from news_private.people where owner=who for update;
   if person.blocked then return jsonb_build_object('error','Commenting has been blocked by the moderator.'); end if;
   if person.banned_until > now() then return jsonb_build_object('error','Commenting is paused until '||person.banned_until, 'until',person.banned_until); end if;
   if body is null or length(btrim(body)) not between 1 and 1000 then raise exception 'Write between 1 and 1000 characters'; end if;
   if news_private.unkind(body) then
     until_time := now() + case when person.strikes+1 >= 5 then interval '24 hours' else interval '10 minutes' end;
     update news_private.people set strikes=strikes+1,banned_until=until_time where owner=who;
     return jsonb_build_object('kind',true,'hours',person.strikes+1>=5,'until',until_time);
   end if;
   if person.last_comment > now()-interval '3 seconds' then return jsonb_build_object('error','Please wait 3 seconds between suggestions.'); end if;
   insert into news_private.comments(owner,body) values(who,btrim(body));
   update news_private.people set last_comment=now() where owner=who;
 else raise exception 'Unknown action'; end if;
 return '{}'::jsonb;
end $$;
create or replace function public.news_feed() returns jsonb language sql stable security definer set search_path='' as $$
 with totals as (
 select s.player_id,s.mode,round(sum(s.total::numeric*leaderboard_private.weight_quarters(s.mode,s.difficulty))/4) score,max(s.achieved_at) achieved
 from leaderboard_private.scores s where accounts_private.visible(s.player_id) group by s.player_id,s.mode
 ), ranked as (select player_id,mode,row_number() over(partition by mode order by score desc,achieved,player_id) place from totals)
 select jsonb_build_object('posts',coalesce((select jsonb_agg(row_to_json(p) order by p.created_at desc) from (
 select p.*, (select count(*) from news_private.replies r where r.post=p.id) comment_count, (select count(*) from news_private.likes l where l.post=p.id) likes,
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
