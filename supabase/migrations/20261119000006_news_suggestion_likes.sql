-- Only trusted database functions may award the permanent News Cubie.
create table news_private.suggestion_likes (
 comment uuid not null references news_private.comments on delete cascade,
 actor text not null,
 owner uuid references auth.users on delete cascade,
 primary key(comment,actor),
 check ((actor='local_creator' and owner is null) or actor=owner::text)
);
create table news_private.rewards(owner uuid primary key references auth.users on delete cascade, earned_at timestamptz not null default now());
alter table news_private.suggestion_likes enable row level security;
alter table news_private.rewards enable row level security;
create function news_private.approved_count(who uuid) returns bigint language sql stable set search_path='' as $$
 select count(*) from news_private.comments c where c.owner=who and exists(
 select 1 from news_private.suggestion_likes l where l.comment=c.id and (l.actor='local_creator' or exists(
 select 1 from news_private.team t join accounts_private.identities i on i.owner=t.owner and i.active where t.owner=l.owner)));
$$;
-- Reconcile on every account write: imports cannot forge this entitlement, and
-- stale account operations cannot erase a reward earned in another session.
create function news_private.protect_reward() returns trigger language plpgsql security definer set search_path='' as $$
declare owned jsonb;
begin
 select coalesce(jsonb_agg(v),'[]'::jsonb) into owned from jsonb_array_elements(coalesce(new.state#>'{shop,owned}','[]'::jsonb)) v where v <> '"news_anchor"'::jsonb;
 if exists(select 1 from news_private.rewards where owner=new.owner) then owned:=owned||'"news_anchor"'::jsonb; end if;
 new.state:=jsonb_set(new.state,'{shop}',coalesce(new.state->'shop','{}'::jsonb)||jsonb_build_object('owned',owned));
 if new.state->>'cubieCustom'='news_anchor' and not exists(select 1 from news_private.rewards where owner=new.owner) then
  new.state:=jsonb_set(new.state,'{cubieCustom}','"classic"');new.cubie:='classic';
 end if;
 return new;
end $$;
create trigger protect_news_reward before insert or update on accounts_private.profiles for each row execute function news_private.protect_reward();
create function news_private.toggle_suggestion(target uuid, who uuid, local_creator boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare author uuid; actor_key text; approved bigint; awarded boolean:=false;
begin
 if not local_creator and not exists(select 1 from accounts_private.identities where owner=who and active) then raise exception 'Sign in to like suggestions'; end if;
 select owner into author from news_private.comments where id=target;
 if author is null then raise exception 'Suggestion no longer exists'; end if;
 -- Serialize all likes for this author so simultaneous fifth approvals award once.
 perform pg_advisory_xact_lock(hashtextextended(author::text,6));
 actor_key:=case when local_creator then 'local_creator' else who::text end;
 delete from news_private.suggestion_likes where comment=target and actor=actor_key;
 if not found then insert into news_private.suggestion_likes values(target,actor_key,case when local_creator then null else who end); end if;
 approved:=news_private.approved_count(author);
 if approved>=5 then
  insert into news_private.rewards(owner) values(author) on conflict do nothing;
  awarded:=found;
  if awarded then update accounts_private.profiles set revision=revision+1 where owner=author; end if;
 end if;
 return jsonb_build_object('awarded',awarded);
end $$;
create function public.news_suggestion_like(target uuid) returns jsonb language sql security definer set search_path='' as $$
 select news_private.toggle_suggestion(target,auth.uid(),false);
$$;
revoke all on function news_private.approved_count(uuid),news_private.protect_reward(),news_private.toggle_suggestion(uuid,uuid,boolean) from public,anon,authenticated;
revoke all on function public.news_suggestion_like(uuid) from public,anon;
grant execute on function public.news_suggestion_like(uuid) to authenticated;
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
 (select count(*) from news_private.suggestion_likes l where l.comment=c.id) likes,
 exists(select 1 from news_private.suggestion_likes l where l.comment=c.id and l.owner=auth.uid()) liked,
 exists(select 1 from news_private.suggestion_likes l where l.comment=c.id and (l.actor='local_creator' or exists(select 1 from news_private.team t join accounts_private.identities i on i.owner=t.owner and i.active where t.owner=l.owner))) creator_liked,
 coalesce(t.label,i.handle,p.display_name,'Player') name,coalesce(p.cubie,'classic') cubie,
 coalesce((select jsonb_agg(jsonb_build_object('game',r.mode,'place',r.place)) from ranked r where r.player_id=c.owner and r.place<=3),'[]'::jsonb) medals
 from news_private.comments c left join accounts_private.profiles p on p.owner=c.owner left join accounts_private.identities i on i.owner=c.owner left join news_private.team t on t.owner=c.owner
 order by c.created_at desc limit 100) c),'[]'::jsonb));
$$;

notify pgrst,'reload schema';
