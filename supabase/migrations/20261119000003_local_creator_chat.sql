-- The creator uses the private loopback server; no public account impersonation.
alter table news_private.chat alter column owner drop not null;
alter table news_private.chat add column local_creator boolean not null default false;
alter table news_private.chat add constraint chat_sender check((owner is null and local_creator) or (owner is not null and not local_creator));
create or replace function public.news_chat(body text default null) returns jsonb language plpgsql security definer set search_path='' as $$
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
   select c.id,c.body,c.created_at,case when c.local_creator then 'Nate, the creator' else t.label end as label,coalesce(c.owner=who,false) as mine from news_private.chat c left join news_private.team t on t.owner=c.owner order by c.id desc limit 100
 ) c);
end $$;

notify pgrst,'reload schema';
