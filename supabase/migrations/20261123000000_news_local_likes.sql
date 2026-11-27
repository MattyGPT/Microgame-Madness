-- Local creator likes are written only by the private loopback server.
alter table news_private.posts add column local_liked boolean not null default false;
create or replace function public.news_feed() returns jsonb language sql stable security definer set search_path='' as $$
 with totals as (
 select s.player_id,s.mode,round(sum(s.total::numeric*leaderboard_private.weight_quarters(s.mode,s.difficulty))/4) score,max(s.achieved_at) achieved
 from leaderboard_private.scores s where accounts_private.visible(s.player_id) group by s.player_id,s.mode
 ), ranked as (select player_id,mode,row_number() over(partition by mode order by score desc,achieved,player_id) place from totals)
 select jsonb_build_object('posts',coalesce((select jsonb_agg(row_to_json(p) order by p.created_at desc) from (
 select p.*, (select count(*) from news_private.replies r where r.post=p.id) comment_count, ((select count(*) from news_private.likes l where l.post=p.id)+p.local_liked::int) likes,
 exists(select 1 from news_private.likes l where l.post=p.id and l.owner=auth.uid()) liked,
 exists(select 1 from news_private.seen s where s.post=p.id and s.owner=auth.uid()) seen
 from news_private.posts p order by created_at desc limit 100) p),'[]'::jsonb),
 'reward',jsonb_build_object('approved',news_private.approved_count(auth.uid()),'earned',exists(select 1 from news_private.rewards where owner=auth.uid())),
 'comments',coalesce((select jsonb_agg(row_to_json(c) order by c.created_at desc) from (
 select c.id,c.body,c.created_at,c.owner=auth.uid() mine,
 (select count(*) from news_private.replies r where r.comment=c.id and c.owner=auth.uid() and r.owner is distinct from auth.uid() and not exists(select 1 from news_private.reply_seen s where s.reply=r.id and s.owner=auth.uid())) unread_count,
 coalesce((select jsonb_agg(name order by name) from (select distinct news_private.creator_label(l.actor,l.owner) name from news_private.suggestion_likes l where l.comment=c.id) creators where name is not null),'[]'::jsonb) creator_likes,
 coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'body',r.body,'label',r.label,'created_at',r.created_at) order by r.created_at,r.id) from news_private.replies r where r.comment=c.id),'[]'::jsonb) replies,
 (select count(*) from news_private.suggestion_likes l where l.comment=c.id) likes,
 exists(select 1 from news_private.suggestion_likes l where l.comment=c.id and l.owner=auth.uid()) liked,
 exists(select 1 from news_private.suggestion_likes l where l.comment=c.id and (l.actor='local_creator' or exists(select 1 from news_private.team t join accounts_private.identities i on i.owner=t.owner and i.active where t.owner=l.owner))) creator_liked,
 coalesce(t.label,i.handle,p.display_name,'Player') name,coalesce(p.cubie,'classic') cubie,
 coalesce((select jsonb_agg(jsonb_build_object('game',r.mode,'place',r.place)) from ranked r where r.player_id=c.owner and r.place<=3),'[]'::jsonb) medals
 from news_private.comments c left join accounts_private.profiles p on p.owner=c.owner left join accounts_private.identities i on i.owner=c.owner left join news_private.team t on t.owner=c.owner
 order by (select count(*) from news_private.replies r where r.comment=c.id and c.owner=auth.uid() and r.owner is distinct from auth.uid() and not exists(select 1 from news_private.reply_seen s where s.reply=r.id and s.owner=auth.uid())) desc,c.created_at desc limit 100) c),'[]'::jsonb));
$$;
notify pgrst,'reload schema';
