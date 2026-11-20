-- Ten distinct creator-approved ideas now earn an Empyrorite achievement and Cubie.
-- Keep permanent rewards already earned under the previous requirement.
create or replace function news_private.protect_reward() returns trigger language plpgsql security definer set search_path='' as $$
declare owned jsonb; medals jsonb; stats jsonb; earned timestamptz; approved bigint;
begin
 select coalesce(jsonb_agg(v),'[]'::jsonb) into owned from jsonb_array_elements(coalesce(new.state#>'{shop,owned}','[]'::jsonb)) v where v <> '"news_anchor"'::jsonb;
 if exists(select 1 from news_private.rewards where owner=new.owner) then owned:=owned||'"news_anchor"'::jsonb; end if;
 new.state:=jsonb_set(new.state,'{shop}',coalesce(new.state->'shop','{}'::jsonb)||jsonb_build_object('owned',owned));
 if new.state->>'cubieCustom'='news_anchor' and not exists(select 1 from news_private.rewards where owner=new.owner) then
  new.state:=jsonb_set(new.state,'{cubieCustom}','"classic"');new.cubie:='classic';
 end if;
 select earned_at into earned from news_private.rewards where owner=new.owner;
 approved:=news_private.approved_count(new.owner);
 medals:=coalesce(new.state#>'{achievements,unlocked}','{}'::jsonb)-'news_ideas_10';
 stats:=coalesce(new.state#>'{achievements,stats}','{}'::jsonb)||jsonb_build_object('creatorApprovedIdeas',case when earned is not null then greatest(10,approved) else approved end);
 if earned is not null then medals:=medals||jsonb_build_object('news_ideas_10',earned); end if;
 new.state:=jsonb_set(new.state,'{achievements}',coalesce(new.state->'achievements','{}'::jsonb)||jsonb_build_object('stats',stats,'unlocked',medals));
 return new;
end $$;
create or replace function news_private.toggle_suggestion(target uuid, who uuid, local_creator boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare author uuid; actor_key text; approved bigint; awarded boolean:=false;
begin
 if not local_creator and not exists(select 1 from accounts_private.identities where owner=who and active) then raise exception 'Sign in to like suggestions'; end if;
 select owner into author from news_private.comments where id=target;
 if author is null then raise exception 'Suggestion no longer exists'; end if;
 -- Serialize all likes for this author so simultaneous tenth approvals award once.
 perform pg_advisory_xact_lock(hashtextextended(author::text,6));
 actor_key:=case when local_creator then 'local_creator' else who::text end;
 delete from news_private.suggestion_likes where comment=target and actor=actor_key;
 if not found then insert into news_private.suggestion_likes values(target,actor_key,case when local_creator then null else who end); end if;
 approved:=news_private.approved_count(author);
 if approved>=10 then
  insert into news_private.rewards(owner) values(author) on conflict do nothing;
  awarded:=found;

 end if;
 update accounts_private.profiles set revision=revision+1 where owner=author;
 return jsonb_build_object('awarded',awarded);
end $$;

update accounts_private.profiles set revision=revision+1 where owner in (select owner from news_private.rewards) or owner in (select owner from news_private.comments);
notify pgrst,'reload schema';

create index if not exists news_comments_owner on news_private.comments(owner);
create function news_private.refresh_deleted_suggestion() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update accounts_private.profiles set revision=revision+1 where owner=old.owner;
 return old;
end $$;
revoke all on function news_private.refresh_deleted_suggestion() from public,anon,authenticated;
create trigger news_deleted_progress after delete on news_private.comments for each row execute function news_private.refresh_deleted_suggestion();
