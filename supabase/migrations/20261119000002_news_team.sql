-- Membership is assigned by the operator to verified account UUIDs, never by display name.
create table news_private.team (
 owner uuid primary key references auth.users(id) on delete cascade,
 label text not null,
 role text not null check(role in ('creator','moderator'))
);
alter table news_private.team enable row level security;
create table news_private.chat (
 id bigint generated always as identity primary key,
 owner uuid not null references auth.users(id) on delete cascade,
 body text not null check(length(body) between 1 and 2000),
 created_at timestamptz not null default now()
);
alter table news_private.chat enable row level security;
create table news_private.audit (
 id bigint generated always as identity primary key, owner uuid, action text not null,
 target uuid, created_at timestamptz not null default now()
);
alter table news_private.audit enable row level security;
alter table news_private.posts add column author_label text not null default 'Nate, the creator';
create function public.news_team(action text default 'status', target uuid default null, title text default null, body text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare member news_private.team; result jsonb;
begin
 select t.* into member from news_private.team t join accounts_private.identities i on i.owner=t.owner and i.active where t.owner=auth.uid();
 if action='status' then return jsonb_build_object('moderator',member.owner is not null,'label',member.label); end if;
 if member.owner is null then raise exception 'This account does not have moderator access' using errcode='42501'; end if;
 if action='publish' then
   if title is null or body is null or length(btrim(title)) not between 1 and 120 or length(btrim(body)) not between 1 and 4000 then raise exception 'Invalid post'; end if;
   insert into news_private.posts(title,body,author_label) values(btrim(title),btrim(body),member.label);
 elsif action='delete' then delete from news_private.comments where id=target;
 elsif action='deletePost' then delete from news_private.posts where id=target;
 elsif action='block' then
   insert into news_private.people(owner,blocked) select owner,true from news_private.comments where id=target on conflict(owner) do update set blocked=true;
 elsif action='unblock' then update news_private.people set blocked=false where owner=target;
 elsif action='blocked' then
   select coalesce(jsonb_agg(jsonb_build_object('owner',p.owner,'handle',i.handle)),'[]'::jsonb) into result from news_private.people p left join accounts_private.identities i on i.owner=p.owner where p.blocked;
   return result;
 else raise exception 'Unknown moderator action'; end if;
 insert into news_private.audit(owner,action,target) values(member.owner,action,target);
 return '{}'::jsonb;
end $$;
create function public.news_chat(body text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid:=auth.uid();
begin
 if not exists(select 1 from news_private.team t join accounts_private.identities i on i.owner=t.owner and i.active where t.owner=who) then raise exception 'Private room: sign in with an invited account' using errcode='42501'; end if;
 if body is not null then
   if length(btrim(body)) not between 1 and 2000 then raise exception 'Write 1–2000 characters'; end if;
   perform pg_advisory_xact_lock(hashtextextended(who::text,2));
   if exists(select 1 from news_private.chat where owner=who and created_at>now()-interval '2 seconds') then raise exception 'Please wait a moment before sending again'; end if;
   insert into news_private.chat(owner,body) values(who,btrim(body));
 end if;
 return (select coalesce(jsonb_agg(to_jsonb(c) order by c.id),'[]'::jsonb) from (
   select c.id,c.body,c.created_at,t.label,c.owner=who as mine from news_private.chat c join news_private.team t on t.owner=c.owner order by c.id desc limit 100
 ) c);
end $$;
revoke all on function public.news_team(text,uuid,text,text), public.news_chat(text) from public;
grant execute on function public.news_team(text,uuid,text,text), public.news_chat(text) to authenticated;
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
 'comments',coalesce((select jsonb_agg(row_to_json(c) order by c.created_at desc) from (
 select c.id,c.body,c.created_at,coalesce(t.label,i.handle,p.display_name,'Player') name,coalesce(p.cubie,'classic') cubie,
 coalesce((select jsonb_agg(jsonb_build_object('game',r.mode,'place',r.place)) from ranked r where r.player_id=c.owner and r.place<=3),'[]'::jsonb) medals
 from news_private.comments c left join accounts_private.profiles p on p.owner=c.owner left join accounts_private.identities i on i.owner=c.owner left join news_private.team t on t.owner=c.owner
 order by c.created_at desc limit 100) c),'[]'::jsonb));
$$;

notify pgrst,'reload schema';
