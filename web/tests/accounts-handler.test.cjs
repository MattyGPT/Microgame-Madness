const { test } = require('node:test');
const assert = require('node:assert/strict');
const Rules = require('../../shared/account-rules.js');
const owner = '00000000-0000-0000-0000-000000000001';
const other = '00000000-0000-0000-0000-000000000002';
const sessionId = '10000000-0000-0000-0000-000000000001';
const validToken = `e30.${Buffer.from(JSON.stringify({session_id:sessionId})).toString('base64url')}.signature`;
const now = Date.parse('2026-11-07T12:00:00Z');
const operation = (id,kind,payload={}) => ({id,kind,payload,streamId:'device',version:1});
const json = (value,status=200) => new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
async function fixture(options={}) {
  const {createHandler} = await import('../../supabase/functions/accounts/handler.mjs');
  const calls=[], receipts=new Map();
  let state=Rules.initial(),revision=0,casFailures=options.casFailures||0,deleted=false,authDeletes=0;
  const transport=async (url,request={}) => {
    const body=request.body?JSON.parse(request.body):{};
    calls.push({url,request,body});
    if (url.endsWith('/auth/v1/user')) return request.headers.Authorization===`Bearer ${validToken}`
      ?json({id:owner,is_anonymous:options.anonymous===true,last_sign_in_at:new Date(options.lastSignIn??now).toISOString()}):json({message:'invalid'},401);
    if(url.includes('/auth/v1/token?grant_type=password')) return body.password==='correct password'?json({access_token:'reauth',user:{id:owner}}):json({},401);
    if(url.includes('/auth/v1/logout'))return new Response(null,{status:204});
    if(url.includes('/auth/v1/admin/users/')) { authDeletes++; return json({},options.deleteFails&&authDeletes===1?500:200); }
    assert.equal(request.headers.Authorization,'Bearer private-service-key');
    if(!url.endsWith('/identity_rate_limit'))assert.equal(body.p_owner,owner,'the authenticated owner must override all body owner claims');
    const name=url.split('/').at(-1);
    if(name==='identity_session_active')return json(!options.revoked);
    if(name==='identity_rate_limit')return json(true);
    if(name==='identity_lookup')return json({owner,active:true,provider_identifier:'test@accounts.invalid',handle:'tester'});
    if(name==='account_delete') {deleted=true;state=null;receipts.clear();return json({deleted:true});}
    if(deleted)return json({message:'account_deleted'},400);
    if(name==='account_read')return json({state,revision,public_id:'public-id'});
    if(name==='account_dependencies')return json(Object.fromEntries(body.p_operation_ids.filter(id=>receipts.has(id)).map(id=>[id,receipts.get(id).receipt.status])));
    if(name==='account_receipt'){
      const previous=receipts.get(body.p_operation_id);
      if(!previous)return json(null);
      return previous.digest!==body.p_digest?json({id:body.p_operation_id,status:'rejected',error:{code:'operation_conflict',message:'Different content'}})
        :json({...previous.receipt,status:previous.receipt.status==='applied'?'duplicate':'rejected'});
    }
    if(name==='account_commit'||name==='account_reject'){
      if(casFailures-->0){revision++;return json({status:'revision_conflict'});}
      if(body.p_expected_revision!==revision)return json({status:'revision_conflict'});
      if(name==='account_commit'){state=body.p_state;revision++;}
      const receipt=name==='account_reject'?{id:body.p_operation_id,status:'rejected',error:body.p_error,revision}
        :{id:body.p_operation_id,status:'applied',result:body.p_result,revision};
      receipts.set(body.p_operation_id,{digest:body.p_digest,receipt});return json(receipt);
    }
    if(name==='account_history')return json({runs:[],next_cursor:null});
    if(name==='account_export')return json({version:1,state,runs:[],wallet:[]});
    throw new Error(`Unexpected call ${name}`);
  };
  const handler=createHandler({url:'https://test.supabase.co',serviceKey:'private-service-key',rules:Rules,fetch:transport,now:()=>now,allowedOrigins:['https://arcade.example'],writesEnabled:options.writesEnabled,importsEnabled:options.importsEnabled,purchasesEnabled:options.purchasesEnabled});
  const request=(body,headers={})=>handler(new Request('https://test.supabase.co/functions/v1/accounts',{
    method:'POST',headers:{Authorization:`Bearer ${validToken}`,'Content-Type':'application/json',Origin:'https://arcade.example',...headers},body:JSON.stringify(body)}));
  return {calls,request,handler,receipts,getState:()=>state};
}

test('handler validates auth, binds owner and origin, and never returns service credentials',async()=>{
  const {calls,request,handler}=await fixture();
  let response=await request({action:'snapshot',owner:other});
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  assert.ok(!JSON.stringify(await response.json()).includes('private-service-key'));
  assert.equal(calls.at(-1).body.p_owner,owner);
  response=await request({action:'snapshot'},{Authorization:'Bearer invalid'});assert.equal(response.status,401);
  response=await request({action:'snapshot'},{Origin:'https://impostor.example'});assert.equal(response.status,403);
  response=await handler(new Request('https://example.test',{method:'OPTIONS',headers:{Origin:'https://arcade.example'}}));assert.equal(response.status,204);
  response=await handler(new Request('https://example.test',{method:'GET'}));assert.equal(response.status,405);
});

test('handler recomputes after revision conflicts and returns durable duplicates and terminal rejections',async()=>{
  const {request,calls}=await fixture({casFailures:1});
  const settings=operation('name','settings',{changes:{player:'New name'},baseRevisions:{}});
  let response=await request({action:'operations',operations:[settings]});
  let data=await response.json();
  assert.equal(response.status,200);assert.equal(data.state.player,'New name');assert.equal(data.receipts[0].status,'applied');
  assert.equal(calls.filter(call=>call.url.endsWith('/account_commit')).length,2);
  response=await request({action:'operations',operations:[{payload:settings.payload,kind:settings.kind,id:settings.id,version:1,streamId:'device'}]});
  data=await response.json();assert.equal(data.receipts[0].status,'duplicate');
  response=await request({action:'operations',operations:[{...settings,payload:{changes:{player:'Forgery'},baseRevisions:{}}}]});
  data=await response.json();assert.equal(data.receipts[0].error.code,'operation_conflict');assert.equal(data.state.player,'New name');
  const denied=operation('buy','purchase',{itemId:Rules.catalog.find(item=>item.price).id});
  response=await request({action:'operations',operations:[denied]});data=await response.json();
  assert.equal(data.receipts[0].status,'rejected');assert.equal(data.receipts[0].error.code,'insufficient_funds');
  response=await request({action:'operations',operations:[denied]});data=await response.json();
  assert.equal(data.receipts[0].error.code,'insufficient_funds');
  response=await request({action:'operations',operations:[operation('bad','settings',{changes:{unknown:1}}),operation('onboard','onboarding.complete')]});
  data=await response.json();assert.equal(data.receipts[0].status,'rejected');assert.equal(data.receipts[1].status,'applied');
});

test('history input and body limits are enforced without exposing backend details',async()=>{
  const {request}=await fixture();
  let response=await request({action:'history',cursor:'1);drop table profiles;'});assert.equal(response.status,400);
  response=await request({action:'history',limit:10000});assert.equal(response.status,200);
  response=await request({action:'operations',operations:new Array(51).fill({})});assert.equal(response.status,400);
  response=await request({action:'snapshot',padding:'x'.repeat(1024*1024)});assert.equal(response.status,413);
  response=await request({action:'unknown'});assert.equal(response.status,400);
  response=await request({action:'export'});assert.equal((await response.json()).version,1);
});

test('deletion requires the current password and confirmation; failed Auth cleanup is resumable behind the tombstone',async()=>{
  const expired=await fixture({lastSignIn:now-11*60000});
  let response=await expired.request({action:'delete',confirmation:'DELETE'});assert.equal(response.status,401);
  assert.equal((await response.json()).error.code,'reauth_required');
  const {request,calls}=await fixture({deleteFails:true});
  response=await request({action:'delete',confirmation:'yes'});assert.equal(response.status,400);
  response=await request({action:'delete',confirmation:'DELETE',password:'correct password'});assert.equal(response.status,503);
  assert.equal((await response.json()).error.code,'deletion_pending');
  response=await request({action:'snapshot'});assert.equal(response.status,410);
  response=await request({action:'delete',confirmation:'DELETE',password:'correct password'});assert.equal(response.status,200);
  assert.equal((await response.json()).deleted,true);
  const adminCall=calls.find(call=>call.url.includes('/auth/v1/admin/users/'));
  assert.ok(adminCall.url.endsWith(owner));assert.equal(adminCall.request.headers.Authorization,'Bearer private-service-key');
});


test('paused writes and unsupported protocols preserve operations for retry or upgrade',async()=>{
  for (const [flag,kind,payload] of [['writesEnabled','onboarding.complete',{}],['importsEnabled','import',{profile:{},baseline:true}],['purchasesEnabled','purchase',{itemId:'anything'}]]) {
    const {request,calls}=await fixture({[flag]:false});
    const response=await request({action:'operations',operations:[operation('queued',kind,payload)]});
    assert.equal(response.status,503);assert.equal((await response.json()).error.code,'paused');
    assert.equal(calls.some(call=>call.url.endsWith('/account_commit')||call.url.endsWith('/account_reject')),false);
  }
  const {request,calls}=await fixture();
  const response=await request({action:'operations',operations:[{...operation('future','onboarding.complete'),version:2}]});
  assert.equal(response.status,426);assert.equal((await response.json()).error.code,'unsupported_version');
  assert.equal(calls.some(call=>call.url.endsWith('/account_reject')),false);
});


test('failed dependencies remain pending while unrelated operations in a batch succeed',async()=>{
  const {request,calls}=await fixture();
  const denied=operation('denied','purchase',{itemId:Rules.catalog.find(item=>item.price).id});
  const dependent={...operation('dependent','settings',{changes:{soundOn:false}}),dependsOn:['denied']};
  const unrelated=operation('independent','onboarding.complete');
  let response=await request({action:'operations',operations:[denied,dependent,unrelated]});
  let data=await response.json();
  assert.deepEqual(data.receipts.map(receipt=>receipt.status),['rejected','blocked','applied']);
  assert.equal(data.receipts[1].error.code,'dependency_rejected');
  assert.equal(data.state.preferences.soundOn,true);
  assert.equal(calls.filter(call=>call.url.endsWith('/account_reject')).length,1);
  const missing={...operation('waiting','onboarding.complete'),dependsOn:['not-yet-sent']};
  response=await request({action:'operations',operations:[missing]});data=await response.json();
  assert.equal(data.receipts[0].status,'blocked');assert.equal(data.receipts[0].error.code,'dependency_pending');
  const parent=operation('parent','arcade',{event:'visit'});
  const child={...operation('child','settings',{changes:{soundOn:false}}),dependsOn:['parent']};
  response=await request({action:'operations',operations:[parent,child]});data=await response.json();
  assert.deepEqual(data.receipts.map(receipt=>receipt.status),['applied','applied']);
  assert.equal(data.state.preferences.soundOn,false);
});

test('revoked JWTs cannot read or change account data even before token expiry',async()=>{
 const {request,calls}=await fixture({revoked:true});
 assert.equal((await request({action:'snapshot'})).status,401);
 assert.equal(calls.some(call=>call.url.endsWith('/account_read')),false);
});

test('anonymous sessions cannot initialize cloud account saves',async()=>{
 const {request,calls}=await fixture({anonymous:true});
 assert.equal((await request({action:'snapshot'})).status,403);
 assert.equal(calls.some(call=>call.url.endsWith('/account_read')),false);
});
