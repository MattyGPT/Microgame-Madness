-- No contact identifiers are collected. Supabase alone hashes passwords.
create table accounts_private.identities (
  owner uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,24}$'),
  provider_identifier text not null unique check (provider_identifier ~ '^[0-9a-f]{64}@accounts[.]invalid$'),
  recovery_hash text check (recovery_hash ~ '^[0-9a-f]{64}$'),
  active boolean not null default false,
  mutation_id uuid,
  mutation_until timestamptz,
  created_at timestamptz not null default now()
);
create table accounts_private.credential_limits (
  bucket text primary key check (bucket ~ '^[0-9a-f]{64}$'),
  window_at timestamptz not null,
  attempts integer not null
);
alter table accounts_private.identities enable row level security;
alter table accounts_private.credential_limits enable row level security;
revoke all on accounts_private.identities, accounts_private.credential_limits from public, anon, authenticated;

create function public.identity_rate_limit(p_bucket text, p_limit integer, p_seconds integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if p_limit not between 1 and 10000 or p_seconds not between 1 and 86400 then raise exception 'invalid_limit'; end if;
  delete from accounts_private.credential_limits where window_at < now() - interval '2 days';
  insert into accounts_private.credential_limits values(p_bucket,now(),1)
  on conflict(bucket) do update set
    attempts = case when credential_limits.window_at < now()-make_interval(secs=>p_seconds) then 1 else credential_limits.attempts+1 end,
    window_at = case when credential_limits.window_at < now()-make_interval(secs=>p_seconds) then now() else credential_limits.window_at end
  returning attempts into n;
  return n <= p_limit;
end $$;

create function public.identity_lookup(p_handle text default null, p_owner uuid default null) returns jsonb
language sql security definer set search_path = '' as $$
  select jsonb_build_object('owner',owner,'handle',handle,'provider_identifier',provider_identifier,'active',active)
  from accounts_private.identities where (p_owner is not null and owner=p_owner) or (p_owner is null and handle=p_handle);
$$;

create function public.identity_register_begin(p_owner uuid,p_handle text,p_identifier text,p_recovery_hash text,p_mutation uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r accounts_private.identities;
begin
  if p_handle !~ '^[a-z0-9_]{3,24}$' or p_handle in ('admin','administrator','moderator','support','system','root','supabase','microgame','microgame_madness','guest','deleted','null','undefined') then raise exception 'invalid_handle'; end if;
  if exists(select 1 from accounts_private.deleted_accounts where owner=p_owner) then raise exception 'account_deleted'; end if;
  -- Insert and unique indexes serialize concurrent reservations for either owner or handle.
  insert into accounts_private.identities(owner,handle,provider_identifier) values(p_owner,p_handle,p_identifier)
    on conflict(owner) do nothing;
  select * into r from accounts_private.identities where owner=p_owner for update;
  if r.handle <> p_handle or r.active then raise exception 'already_registered'; end if;
  if r.mutation_until > now() then raise exception 'identity_busy'; end if;
  update accounts_private.identities set recovery_hash=p_recovery_hash, mutation_id=p_mutation, mutation_until=now()+interval '60 seconds' where owner=p_owner;
  return jsonb_build_object('owner',r.owner,'handle',r.handle,'provider_identifier',r.provider_identifier);
exception when unique_violation then raise exception 'handle_unavailable';
end $$;

create function public.identity_mutation_begin(p_owner uuid,p_recovery_hash text,p_new_recovery_hash text,p_mutation uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r accounts_private.identities;
begin
  select * into r from accounts_private.identities where owner=p_owner and active for update;
  if not found or (p_recovery_hash is not null and r.recovery_hash is distinct from p_recovery_hash) then raise exception 'invalid_credentials'; end if;
  if r.mutation_until > now() then raise exception 'identity_busy'; end if;
  -- Consume before external provider mutation: concurrent reuse cannot reset twice.
  update accounts_private.identities set recovery_hash=coalesce(p_new_recovery_hash,recovery_hash),mutation_id=p_mutation,mutation_until=now()+interval '60 seconds' where owner=p_owner;
  return jsonb_build_object('owner',r.owner,'handle',r.handle,'provider_identifier',r.provider_identifier);
end $$;

create function public.identity_mutation_finish(p_owner uuid,p_mutation uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update accounts_private.identities set active=true,mutation_id=null,mutation_until=null where owner=p_owner and mutation_id=p_mutation;
  return found;
end $$;

-- Called only AFTER Auth has validated a JWT. Never treat a decoded claim as authentication.
create function public.identity_session_active(p_owner uuid,p_session uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  return exists(select 1 from auth.sessions where id=p_session and user_id=p_owner);
end $$;

-- Revoke all sessions in the same database operation, including refresh credentials.
-- Auth owns these tables; deleting sessions uses its existing cascading constraints.
create function public.identity_revoke_sessions(p_owner uuid,p_mutation uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from accounts_private.identities where owner=p_owner and mutation_id=p_mutation) then return false; end if;
  delete from auth.sessions where user_id=p_owner;
  return true;
end $$;

-- The adapter changes credentials with a fresh server-only app_metadata ticket.
-- Browser /user changes cannot write app_metadata and cannot reuse an old ticket.
create function accounts_private.guard_auth_credentials() returns trigger
language plpgsql security definer set search_path = '' as $$
declare n jsonb := to_jsonb(new); o jsonb; r accounts_private.identities; changing boolean;
begin
  if coalesce(n->>'phone','') <> '' or coalesce(n->>'phone_change','') <> '' or coalesce(n->>'email_change','') <> '' then raise exception 'contact_credentials_disabled'; end if;
  if tg_op='INSERT' then
    if coalesce(n->>'email','') <> '' or coalesce(n->>'encrypted_password','') <> '' then raise exception 'use_handle_registration'; end if;
    return new;
  end if;
  o := to_jsonb(old);
  changing := (n->>'email' is distinct from o->>'email') or (n->>'encrypted_password' is distinct from o->>'encrypted_password');
  if changing then
    -- Auth updates password/email and app_metadata in separate statements within one
    -- transaction; validate its final row when the deferred constraint runs.
    select to_jsonb(u) into n from auth.users u where id=new.id;
    select * into r from accounts_private.identities where owner=new.id;
    if not found or r.mutation_id is null or r.mutation_until < now()
      or n->'raw_app_meta_data'->>'mm_mutation' is distinct from r.mutation_id::text
      or n->'raw_app_meta_data'->>'mm_mutation' is not distinct from o->'raw_app_meta_data'->>'mm_mutation'
      or n->>'email' is distinct from r.provider_identifier
      then raise exception 'use_handle_credentials'; end if;
  end if;
  if coalesce(n->>'email','') <> '' and not exists(select 1 from accounts_private.identities where owner=new.id and provider_identifier=n->>'email') then raise exception 'contact_credentials_disabled'; end if;
  return new;
end $$;
create constraint trigger microgame_guard_auth_credentials after insert or update on auth.users
deferrable initially deferred for each row execute function accounts_private.guard_auth_credentials();

create function public.identity_before_user_created(event jsonb) returns jsonb
language sql set search_path = '' as $$
  select case when coalesce(event->'user'->>'email','')='' and coalesce(event->'user'->>'phone','')=''
    then '{}'::jsonb else '{"error":{"http_code":403,"message":"Use an arcade handle to create an account."}}'::jsonb end;
$$;
create function public.identity_send_email(event jsonb) returns jsonb
language sql set search_path = '' as $$
  select '{"error":{"http_code":403,"message":"Email authentication is disabled."}}'::jsonb;
$$;

-- Explicit allowlist grants; no credential RPC is callable by a browser JWT.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as name from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'identity_%'
  loop execute format('revoke all on function %s from public, anon, authenticated',f.name); execute format('grant execute on function %s to service_role',f.name); end loop;
  if exists(select 1 from pg_roles where rolname='supabase_auth_admin') then
    grant execute on function public.identity_before_user_created(jsonb), public.identity_send_email(jsonb) to supabase_auth_admin;
  end if;
end $$;
revoke all on function accounts_private.guard_auth_credentials() from public,anon,authenticated;
