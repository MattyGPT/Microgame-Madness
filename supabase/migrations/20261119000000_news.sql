-- Community data is only reachable through bounded, authenticated RPCs.
create schema news_private;
revoke all on schema news_private from public, anon, authenticated;
create table news_private.posts(id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 1 and 120), body text not null check(length(body) between 1 and 4000), created_at timestamptz not null default now());
create table news_private.people(owner uuid primary key references auth.users on delete cascade, strikes int not null default 0, banned_until timestamptz, blocked boolean not null default false, last_comment timestamptz);
create table news_private.comments(id uuid primary key default gen_random_uuid(), owner uuid not null references auth.users on delete cascade, body text not null check(length(body) between 1 and 1000), created_at timestamptz not null default now());
create table news_private.likes(post uuid references news_private.posts on delete cascade, owner uuid references auth.users on delete cascade, primary key(post,owner));
create table news_private.seen(post uuid references news_private.posts on delete cascade, owner uuid references auth.users on delete cascade, primary key(post,owner));
alter table news_private.posts enable row level security;
alter table news_private.people enable row level security;
alter table news_private.comments enable row level security;
alter table news_private.likes enable row level security;
alter table news_private.seen enable row level security;

create function news_private.unkind(body text) returns boolean language sql immutable set search_path='' as $$
 select regexp_replace(translate(lower(body), '013457@$!', 'oieasta si'), '[^a-z]', '', 'g') ~ '(fuck|shit|bitch|cunt|nigger|nigga|faggot|retard|killyourself|motherfucker|asshole|bastard|whore|slut|chink|kike|tranny)';
$$;
create function public.news_action(action text, target uuid default null, body text default null) returns jsonb language plpgsql security definer set search_path='' as $$
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
   if person.last_comment > now()-interval '30 seconds' then return jsonb_build_object('error','Please wait 30 seconds between suggestions.'); end if;
   insert into news_private.comments(owner,body) values(who,btrim(body));
   update news_private.people set last_comment=now() where owner=who;
 else raise exception 'Unknown action'; end if;
 return '{}'::jsonb;
end $$;
create function public.news_feed() returns jsonb language sql stable security definer set search_path='' as $$
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
 select c.id,c.body,c.created_at,coalesce(i.handle,p.display_name,'Player') name,coalesce(p.cubie,'classic') cubie,
 coalesce((select jsonb_agg(jsonb_build_object('game',r.mode,'place',r.place)) from ranked r where r.player_id=c.owner and r.place<=3),'[]'::jsonb) medals
 from news_private.comments c left join accounts_private.profiles p on p.owner=c.owner left join accounts_private.identities i on i.owner=c.owner
 order by c.created_at desc limit 100) c),'[]'::jsonb));
$$;
revoke all on function public.news_feed() from public;
revoke all on function public.news_action(text,uuid,text) from public;
grant execute on function public.news_feed() to anon,authenticated;
grant execute on function public.news_action(text,uuid,text) to authenticated;
notify pgrst,'reload schema';
