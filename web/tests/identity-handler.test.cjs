const {test}=require('node:test');
const assert=require('node:assert/strict');
const owner='00000000-0000-0000-0000-000000000001',sid='10000000-0000-0000-0000-000000000001';
const token=`e30.${Buffer.from(JSON.stringify({session_id:sid})).toString('base64url')}.sig`;
const json=(value,status=200)=>new Response(JSON.stringify(value),{status});
async function fixture(options={}){
 const {createIdentityHandler}=await import('../../supabase/functions/identity/handler.mjs');
 let identity=options.registered?{owner,handle:'player_1',provider_identifier:'opaque@accounts.invalid',active:true}:null;
 let password='correct password',recoveryHash,pendingHash=null,mutation,revocations=0;
 const calls=[];
 const transport=async(url,request={})=>{
  const body=request.body?JSON.parse(request.body):{};calls.push({url,body});
  if(url.endsWith('/auth/v1/user'))return options.providerRevoked?json({},401):json({id:owner,is_anonymous:!identity?.active,email:identity?.provider_identifier});
  if(url.includes('/auth/v1/token?'))return body.password===password?json({access_token:token,refresh_token:'refresh',expires_in:3600,user:{id:owner,is_anonymous:false,email:identity.provider_identifier}}):json({},401);
  if(url.includes('/auth/v1/admin/users/')){if(options.failProvider)return json({},500);password=body.password;return json({id:owner});}
  const name=url.split('/').at(-1);
  if(name==='identity_rate_limit')return json(!options.rateLimited);
  if(name==='identity_session_active')return json(!options.revoked);
  if(name==='identity_lookup')return json(identity);
  if(name==='identity_register_begin'){
   identity={owner,handle:body.p_handle,provider_identifier:body.p_identifier,active:false};pendingHash=body.p_recovery_hash;mutation=body.p_mutation;return json(identity);
  }
  if(url.includes('/auth/v1/logout'))return new Response(null,{status:204});
  if(name==='identity_mutation_begin'){
   if(body.p_recovery_hash && body.p_recovery_hash!==recoveryHash)return json({message:'invalid_credentials'},400);
   pendingHash=body.p_new_recovery_hash||null;mutation=body.p_mutation;return json(identity);
  }
  if(name==='identity_mutation_abort'){if(body.p_mutation===mutation){pendingHash=null;mutation=null;return json(true);}return json(false);}
  if(name==='identity_revoke_sessions'){revocations++;return json(true);}
  if(name==='identity_mutation_finish'){if(body.p_mutation!==mutation)return json(false);identity.active=true;recoveryHash=pendingHash||recoveryHash;pendingHash=null;mutation=null;return json(true);}
  throw new Error(name);
 };
 const handler=createIdentityHandler({url:'https://test.supabase.co',serviceKey:'server-secret',fetch:transport,allowedOrigins:['https://arcade.example']});
 const request=(body,headers={})=>handler(new Request('https://test/functions/v1/identity',{method:'POST',headers:{origin:'https://arcade.example',authorization:`Bearer ${token}`,...headers},body:JSON.stringify(body)}));
 return {request,handler,calls,getIdentity:()=>identity,getRevocations:()=>revocations};
}

test('registration preserves owner, returns recovery only once per response, and projects no provider contact identifier',async()=>{
 const f=await fixture();const response=await f.request({action:'register',handle:'Player_1',password:'correct password'});
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.session.user.id,owner);assert.equal(data.session.user.handle,'player_1');assert.match(data.recoveryCode,/^[a-f0-9]{64}$/);
 assert.equal(JSON.stringify(data).includes('@'),false);assert.equal(JSON.stringify(data).includes('server-secret'),false);assert.equal(response.headers.get('cache-control'),'no-store');
 const reservation=f.calls.find(c=>c.url.endsWith('identity_register_begin'));
 assert.notEqual(reservation.body.p_recovery_hash,data.recoveryCode);
 assert.match(reservation.body.p_identifier,/^[a-f0-9]{64}@accounts.invalid$/);
 assert.equal(f.calls.some(c=>/\/otp|\/recover|\/invite/.test(c.url)),false);
});

test('wrong credentials are generic, auth errors are redacted, and rate limits stop provider work',async()=>{
 let f=await fixture({registered:true});let r=await f.request({action:'login',handle:'player_1',password:'wrong password'});
 assert.equal(r.status,401);assert.equal((await r.json()).error.code,'invalid_credentials');
 f=await fixture({rateLimited:true});r=await f.request({action:'register',handle:'player_1',password:'correct password'});assert.equal(r.status,429);assert.equal(f.calls.some(c=>c.url.includes('/auth/')),false);
 f=await fixture({failProvider:true});r=await f.request({action:'register',handle:'player_1',password:'correct password'});assert.equal(r.status,503);assert.equal(JSON.stringify(await r.json()).includes('server-secret'),false);
});

test('recovery rotates its verifier, rejects replay, and fences all old sessions before and after replacement',async()=>{
 const f=await fixture();let r=await f.request({action:'register',handle:'player_1',password:'correct password'});const original=await r.json();
 r=await f.request({action:'recover',handle:'player_1',recoveryCode:original.recoveryCode,newPassword:'replacement password'});assert.equal(r.status,200);const recovered=await r.json();
 assert.notEqual(recovered.recoveryCode,original.recoveryCode);assert.equal(recovered.session.user.id,owner);assert.equal(f.getRevocations(),2);
 r=await f.request({action:'recover',handle:'player_1',recoveryCode:original.recoveryCode,newPassword:'another password'});assert.equal(r.status,401);
 r=await f.request({action:'login',handle:'player_1',password:'correct password'});assert.equal(r.status,401);
 r=await f.request({action:'login',handle:'player_1',password:'replacement password'});assert.equal(r.status,200);
});

test('password changes require current password; revoked sessions cannot rotate recovery',async()=>{
 const f=await fixture({registered:true});let r=await f.request({action:'change_password',password:'wrong password',newPassword:'replacement password'});assert.equal(r.status,401);assert.equal(f.getRevocations(),0);
 r=await f.request({action:'change_password',password:'correct password',newPassword:'replacement password'});assert.equal(r.status,200);assert.equal(f.getRevocations(),2);
 const revoked=await fixture({registered:true,revoked:true});r=await revoked.request({action:'rotate_recovery',password:'correct password'});assert.equal(r.status,401);
});

test('validation rejects contact fields, password truncation, oversized bodies, and unapproved origins',async()=>{
 const f=await fixture();for(const body of [{action:'register',handle:'a@b.com',password:'correct password'},{action:'register',handle:'player_1',password:'x'.repeat(73)},{action:'register',handle:'player_1',password:'🙂'.repeat(19)},{action:'login',handle:'player_1',password:'correct password',email:'person@example.com'}])assert.equal((await f.request(body)).status,400);
 assert.equal((await f.request({padding:'x'.repeat(4097)})).status,413);
 assert.equal((await f.request({action:'login',handle:'player_1',password:'correct password'},{origin:'https://other.example'})).status,403);
});

 test('registration response-loss retry proves credentials when Auth rejects the revoked anonymous session',async()=>{
 const f=await fixture({registered:true,providerRevoked:true});
 let r=await f.request({action:'register',handle:'player_1',password:'wrong password'});assert.equal(r.status,401);
 r=await f.request({action:'register',handle:'player_1',password:'short'});assert.equal(r.status,400);
 r=await f.request({action:'register',handle:'player_1',password:'correct password'});assert.equal(r.status,200);
 const data=await r.json();assert.equal(data.session.user.id,owner);assert.match(data.recoveryCode,/^[a-f0-9]{64}$/);
});

test('failed provider update during recover aborts mutation and preserves original recovery code',async()=>{
 const f=await fixture();let r=await f.request({action:'register',handle:'player_1',password:'correct password'});const original=await r.json();
 // Force one provider failure, then retry with the same original recovery code.
 let failOnce=true;
 const {createIdentityHandler}=await import('../../supabase/functions/identity/handler.mjs');
 const calls=[];let recoveryHash=null,pendingHash=null,mutation=null,password='correct password';
 const identity={owner,handle:'player_1',provider_identifier:'opaque@accounts.invalid',active:true};
 const cryptoMod=require('node:crypto');
 recoveryHash=cryptoMod.createHash('sha256').update(original.recoveryCode).digest('hex');
 const handler=createIdentityHandler({url:'https://test.supabase.co',serviceKey:'server-secret',allowedOrigins:['https://arcade.example'],fetch:async(url,req={})=>{
  const body=req.body?JSON.parse(req.body):{};calls.push({url,body});
  if(url.includes('/auth/v1/admin/users/')){if(failOnce){failOnce=false;return json({},500);}password=body.password;return json({id:owner});}
  if(url.includes('/auth/v1/token?'))return body.password===password?json({access_token:token,refresh_token:'refresh',expires_in:3600,user:{id:owner,is_anonymous:false}}):json({},401);
  const name=url.split('/').at(-1);
  if(name==='identity_rate_limit')return json(true);
  if(name==='identity_lookup')return json(identity);
  if(name==='identity_mutation_begin'){if(body.p_recovery_hash!==recoveryHash)return json({message:'invalid_credentials'},400);pendingHash=body.p_new_recovery_hash;mutation=body.p_mutation;return json(identity);}
  if(name==='identity_revoke_sessions')return json(true);
  if(name==='identity_mutation_abort'){pendingHash=null;mutation=null;return json(true);}
  if(name==='identity_mutation_finish'){recoveryHash=pendingHash;pendingHash=null;mutation=null;return json(true);}
  throw new Error(name);
 }});
 const send=body=>handler(new Request('https://test/functions/v1/identity',{method:'POST',headers:{origin:'https://arcade.example'},body:JSON.stringify(body)}));
 assert.equal((await send({action:'recover',handle:'player_1',recoveryCode:original.recoveryCode,newPassword:'replacement password'})).status,503);
 assert.ok(calls.some(c=>c.url.endsWith('/identity_mutation_abort')));
 const retry=await send({action:'recover',handle:'player_1',recoveryCode:original.recoveryCode,newPassword:'replacement password'});
 assert.equal(retry.status,200);
 // Rate limit must check narrowest buckets (handle, ip) before global.
 const rateCalls=calls.filter(c=>c.url.endsWith('/identity_rate_limit'));
 assert.equal(rateCalls[0].body.p_limit,12);
 assert.equal(rateCalls[1].body.p_limit,40);
 assert.equal(rateCalls[2].body.p_limit,1000);
});
