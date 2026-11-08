const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
const owner='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002';
const mutation='10000000-0000-0000-0000-000000000001',next='10000000-0000-0000-0000-000000000002';
const sid='20000000-0000-0000-0000-000000000001';
const identifier='a'.repeat(64)+'@accounts.invalid',hash='b'.repeat(64),newHash='c'.repeat(64);
async function setup(t){
 const db=new PGlite();t.after(()=>db.close());
 await db.exec(`create role anon; create role authenticated; create role service_role; create role supabase_auth_admin;
 create schema auth; create table auth.users(id uuid primary key,email text,phone text,email_change text,phone_change text,encrypted_password text,raw_app_meta_data jsonb default '{}');
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade);
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
 for(const f of fs.readdirSync(path.resolve(__dirname,'../../supabase/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync(path.resolve(__dirname,'../../supabase/migrations',f),'utf8'));
 await db.query('insert into auth.users(id) values($1),($2)',[owner,other]);
 const rpc=async(name,args)=>(await db.query(`select public.${name}(${args.map((_,i)=>`$${i+1}`).join(',')}) as value`,args)).rows[0].value;
 return {db,rpc,begin:()=>rpc('identity_register_begin',[owner,'player_1',identifier,hash,mutation])};
}

test('handle reservation is unique, owner stable, and credentials require a fresh admin transaction ticket',async t=>{
 const {db,rpc,begin}=await setup(t);
 assert.equal((await begin()).owner,owner);
 await assert.rejects(rpc('identity_register_begin',[other,'player_1','d'.repeat(64)+'@accounts.invalid',hash,next]),/handle_unavailable/);
 await assert.rejects(begin(),/identity_busy/);
 await assert.rejects(db.query('update auth.users set email=$1,encrypted_password=$2 where id=$3',[identifier,'provider-hash',owner]),/use_handle_credentials/);
 // Mirrors Auth's admin API: password, then email, then app_metadata in one transaction.
 await db.exec('begin');
 await db.query('update auth.users set encrypted_password=$1 where id=$2',['provider-hash',owner]);
 await db.query('update auth.users set email=$1 where id=$2',[identifier,owner]);
 await db.query('update auth.users set raw_app_meta_data=$1 where id=$2',[JSON.stringify({mm_mutation:mutation}),owner]);
 await db.exec('commit');
 assert.equal(await rpc('identity_mutation_finish',[owner,mutation]),true);
 await assert.rejects(db.query("update auth.users set encrypted_password='attacker-hash' where id=$1",[owner]),/use_handle_credentials/);
 await assert.rejects(db.query("update auth.users set email_change='person@example.com' where id=$1",[owner]),/contact_credentials_disabled/);
 await assert.rejects(db.query("update auth.users set phone='+12025550123' where id=$1",[owner]),/contact_credentials_disabled/);
 await assert.rejects(db.query("insert into auth.users(id,email) values(gen_random_uuid(),'person@example.com')"),/use_handle_registration/);
 assert.equal((await rpc('identity_lookup',['player_1',null])).owner,owner);
});

test('recovery consumption is single use, mutation tickets fence races, and revoked sessions fail authorization',async t=>{
 const {db,rpc,begin}=await setup(t);await begin();await rpc('identity_mutation_finish',[owner,mutation]);
 await db.query('insert into auth.sessions values($1,$2)',[sid,owner]);
 assert.equal(await rpc('identity_session_active',[owner,sid]),true);
 assert.equal(await rpc('identity_session_active',[other,sid]),false);
 await assert.rejects(rpc('identity_mutation_begin',[owner,newHash,hash,next]),/invalid_credentials/);
 await rpc('identity_mutation_begin',[owner,hash,newHash,next]);
 await assert.rejects(rpc('identity_mutation_begin',[owner,hash,newHash,mutation]),/invalid_credentials/);
 assert.equal(await rpc('identity_mutation_finish',[owner,mutation]),false);
 assert.equal(await rpc('identity_revoke_sessions',[owner,mutation]),false);
 assert.equal(await rpc('identity_revoke_sessions',[owner,next]),true);
 assert.equal(await rpc('identity_session_active',[owner,sid]),false);
 assert.equal(await rpc('identity_mutation_finish',[owner,next]),true);
 await assert.rejects(rpc('identity_mutation_begin',[owner,hash,newHash,mutation]),/invalid_credentials/);
 await rpc('identity_mutation_begin',[owner,newHash,hash,mutation]);
});

test('credential limits persist rejected attempts; browser roles cannot inspect identities or invoke credential RPCs',async t=>{
 const {db,rpc}=await setup(t);
 assert.equal(await rpc('identity_rate_limit',[hash,2,60]),true);
 assert.equal(await rpc('identity_rate_limit',[hash,2,60]),true);
 assert.equal(await rpc('identity_rate_limit',[hash,2,60]),false);
 assert.equal(await rpc('identity_rate_limit',[hash,2,60]),false);
 for(const role of ['anon','authenticated']){
  await db.exec(`set role ${role}`);
  await assert.rejects(db.exec('select * from accounts_private.identities'),{code:'42501'});
  await assert.rejects(rpc('identity_lookup',[null,owner]),{code:'42501'});
  await assert.rejects(rpc('identity_mutation_begin',[owner,null,hash,mutation]),{code:'42501'});
  await assert.rejects(rpc('identity_session_active',[owner,sid]),{code:'42501'});
  await db.exec('reset role');
 }
 await db.exec('set role supabase_auth_admin');
 assert.deepEqual(await rpc('identity_before_user_created',[JSON.stringify({user:{is_anonymous:true}})]),{});
 assert.equal((await rpc('identity_before_user_created',[JSON.stringify({user:{email:'person@example.com'}})])).error.http_code,403);
 assert.equal((await rpc('identity_send_email',['{}'])).error.http_code,403);
});
