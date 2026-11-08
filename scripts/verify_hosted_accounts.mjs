// Real hosted flows, disposable generated accounts only. No credential logging.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { environment, projectRef, query } from './hosted_accounts_admin.mjs';
const require = createRequire(import.meta.url);
const Rules = require('../shared/account-rules.js');
const { Client } = require('../web/accounts/session.js');
const { Store } = require('../web/accounts/store.js');
const { Controller } = require('../web/accounts/sync.js');
const env = environment(), url = env.SUPABASE_URL, key = env.SUPABASE_PUBLISHABLE_KEY;
const owners = new Set(), clients = [];
const password = () => `Hosted-${randomBytes(24).toString('base64url')}!`;
const storage = () => { const entries=new Map();return {getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)}; };
async function request(path,body,token,{admin=false,method='POST'}={}) {
  const response=await fetch(`${url}${path}`,{method,headers:{apikey:admin?env.SUPABASE_SERVICE_ROLE_KEY:key,'Content-Type':'application/json',...(token||admin?{Authorization:`Bearer ${admin?env.SUPABASE_SERVICE_ROLE_KEY:token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
  let data;try{data=await response.json();}catch{}return {status:response.status,ok:response.ok,data};
}
function client() {
  let loseRegistration=false;
  const auth=new Client({url,key},{storage:storage(),events:null,fetch:async (...args)=>{
    const response=await fetch(...args);
    if(loseRegistration && args[1]?.body?.includes('"action":"register"') && response.ok){loseRegistration=false;throw new Error('Simulated lost registration response');}
    return response;
  }});
  const store=new Store({rules:Rules,indexedDB:null,BroadcastChannel:null});
  const connection={online:false};
  let lose=false;
  const transport=async (...args)=>{const response=await fetch(...args);if(lose && args[1]?.body?.includes('"action":"operations"') && response.ok){lose=false;throw new Error('Simulated response loss after real commit');}return response;};
  const sync=new Controller({config:{url,key},store,session:auth,rules:Rules,events:null,online:()=>connection.online,fetch:transport});
  const result={auth,store,sync,connection,lose:()=>{lose=true},loseRegistration:()=>{loseRegistration=true}};clients.push(result);return result;
}
const report=message=>console.log(message);
try {
  const first=client(),handle=`verify_${randomBytes(7).toString('hex')}`,initial=password();
  await first.sync.initialize({player:'Hosted verification',shop:{units:120000,owned:[]},achievements:{stats:{},unlocked:{}}});
  await first.sync.enqueue('run.start',{mode:'hangman',difficulty:'easy'},{runId:'hosted-first-round'});
  await first.sync.enqueue('run.finish',{outcome:'win',snapshot:{mode:'hangman',difficulty:'easy',over:true,won:true,score:10,mistakes:0,remaining:10}},{runId:'hosted-first-round'});
  const guest=await first.auth.ensureAnonymous();owners.add(guest.id);
  first.loseRegistration();await assert.rejects(first.auth.register(handle,initial),{code:'network'});
  first.auth.session.expires_at=0; // A delayed retry must not refresh the revoked guest session.
  const registered=await first.auth.register(handle,initial);assert.equal(registered.user.id,guest.id);assert.ok(registered.recoveryCode);
  await first.sync.activate(guest.id,{bindGuest:true});assert.equal(first.sync.state().importRequired,true);
  first.connection.online=true;first.lose();
  await assert.rejects(first.sync.importProfile(first.sync.state().importProfile,{baseline:true}));first.sync.cancelRetry();
  await first.sync.flush();assert.equal(first.sync.state().pending,0);assert.equal(first.sync.state().profile.shop.units,160000);
  assert.equal((await first.sync.history()).runs.length,1);
  report('PASS lost registration response retry with revoked guest token, guest UUID, baseline and earned journal preserved through real committed-response loss/retry.');
  const second=client();await second.auth.login(handle.toUpperCase(),initial);await second.sync.initialize();second.connection.online=true;
  assert.deepEqual(second.sync.state().profile.shop,first.sync.state().profile.shop);
  await first.sync.enqueue('settings',{changes:{soundOn:false,leaderboard:true,publicProfile:true},baseRevisions:{}});await first.sync.flush();await second.sync.pull();
  assert.equal(second.sync.state().profile.preferences.soundOn,false);
  const board=await request('/rest/v1/rpc/get_account_leaderboard',{p_mode:'hangman',p_difficulty:'easy'},await first.auth.token());assert.equal(board.ok,true);assert.ok(board.data.some(r=>r.is_you));
  const publicId=first.sync.state().publicId;const pub=await request('/rest/v1/rpc/get_account_public_profile',{p_public_id:publicId});assert.equal(pub.ok,true);assert.ok(pub.data);
  report('PASS another-device case-insensitive login, cloud history/settings and public ranking/profile.');
  // Deliberately overlap two PostgreSQL transactions at the same revision.
  // Backend PIDs establish separate connections; the stale writer must conflict.
  const current=(await request('/functions/v1/accounts',{action:'snapshot'},await first.auth.token())).data;
  const sqlLiteral=value=>`'${String(value).replaceAll("'","''")}'`;
  const contenderOps=[false,true].map(reducedMotion=>({id:randomUUID(),kind:'settings',version:1,streamId:randomUUID(),payload:{changes:{reducedMotion},baseRevisions:{}}}));
  const contenders=await Promise.all(contenderOps.map(async operation=>{
    const next=Rules.apply(current.state,operation);
    const args=[guest.id,operation.id,createHash('sha256').update(JSON.stringify(operation)).digest('hex'),current.revision,JSON.stringify(next.state),JSON.stringify(next.result),null,'settings'];
    const values=args.map(v=>v===null?'null':typeof v==='number'?String(v):sqlLiteral(v)).join(',');
    return query(`select pg_backend_pid() as pid, public.account_commit(${values}) as receipt, pg_sleep(0.5)`);
  }));
  assert.notEqual(contenders[0][0].pid,contenders[1][0].pid);
  assert.deepEqual(contenders.map(rows=>rows[0].receipt.status).sort(),['applied','revision_conflict']);
  await first.sync.pull();
  report('PASS two overlapping PostgreSQL connections: one same-revision commit and one stale-write conflict.');
  const items=Rules.catalog.filter(i=>i.price>0&&i.price*1000<=160000).sort((a,b)=>b.price-a.price);
  assert.ok(items.length>=2);
  const operations=items.slice(0,2).map(item=>({id:randomUUID(),kind:'purchase',version:1,streamId:randomUUID(),payload:{itemId:item.id}}));
  const before=first.sync.state().profile.shop.units;
  const buys=await Promise.all(operations.map((op,i)=>request('/functions/v1/accounts',{action:'operations',operations:[op]},clients[i].auth.session.access_token)));
  assert.ok(buys.every(r=>r.ok));await first.sync.pull();const applied=buys.map((r,i)=>r.data.receipts[0].status==='applied'?items[i].price*1000:0).reduce((a,b)=>a+b,0);
  assert.equal(first.sync.state().profile.shop.units,before-applied);assert.ok(first.sync.state().profile.shop.units>=0);
  const duplicate=await request('/functions/v1/accounts',{action:'operations',operations:[operations[0]]},await first.auth.token());assert.ok(['duplicate','rejected'].includes(duplicate.data.receipts[0].status));
  report('PASS simultaneous hosted purchases and retry receipts preserve wallet balance.');
  const exported=JSON.stringify(await first.sync.export());for(const secret of [initial,registered.recoveryCode,first.auth.session.access_token,env.SUPABASE_SERVICE_ROLE_KEY])assert.ok(!exported.includes(secret));
  first.auth.session.expires_at=0;await first.auth.token();
  await assert.rejects(second.auth.login(handle,password()));
  const oldToken=first.auth.session.access_token,oldRefresh=first.auth.session.refresh_token;
  const newPassword=password();const recovered=await second.auth.recover(handle,registered.recoveryCode,newPassword);assert.equal(recovered.user.id,guest.id);assert.notEqual(recovered.recoveryCode,registered.recoveryCode);
  await assert.rejects(first.auth.recover(handle,registered.recoveryCode,password()));
  assert.equal((await request('/functions/v1/accounts',{action:'snapshot'},oldToken)).status,401);
  assert.equal((await request('/auth/v1/token?grant_type=refresh_token',{refresh_token:oldRefresh})).ok,false);
  await assert.rejects(first.auth.login(handle,initial));await first.auth.login(handle,newPassword);
  report('PASS export excludes credentials, refresh works, recovery rotates once and revokes old access/refresh credentials.');
  const changedPassword=password();await first.auth.changePassword(newPassword,changedPassword);await assert.rejects(second.auth.login(handle,newPassword));await second.auth.login(handle,changedPassword);
  const rotated=await second.auth.rotateRecovery(changedPassword);assert.ok(rotated.recoveryCode);
  const badDelete=await request('/functions/v1/accounts',{action:'delete',confirmation:'DELETE',password:'wrong'},await second.auth.token());assert.equal(badDelete.ok,false);
  const deleted=await request('/functions/v1/accounts',{action:'delete',confirmation:'DELETE',password:changedPassword},await second.auth.token());assert.equal(deleted.ok,true);owners.delete(guest.id);
  await assert.rejects(first.auth.login(handle,changedPassword));
  report('PASS password change, recovery rotation, password-required deletion and subsequent login rejection.');
  // No actual contact address is used in hostile-provider-path tests.
  const directSignup=await request('/auth/v1/signup',{email:`blocked-${randomUUID()}@example.invalid`,password:password()});assert.equal(directSignup.ok,false);
  report('PASS direct nonanonymous provider signup blocked.');
  const grants=await query("select count(*)::int as unsafe from information_schema.routine_privileges where routine_schema='public' and (routine_name like 'account_%' or routine_name like 'identity_%') and grantee in ('anon','authenticated','PUBLIC')");
  assert.equal(grants[0].unsafe,0);report('PASS hosted private RPC grants exclude browser roles.');
  report(`Hosted verification complete for ${projectRef}.`);
} catch(error) {console.error(`Hosted verification FAILED: ${error.code||error.name}: ${String(error.message).replace(/[A-Za-z0-9_-]{32,}/g,'[redacted]').slice(0,300)}`);process.exitCode=1;}
finally {
  for(const c of clients){c.sync.close();c.auth.close();c.store.close();}
  for(const owner of owners){
    await request('/rest/v1/rpc/account_delete',{p_owner:owner},null,{admin:true});
    const removed=await request(`/auth/v1/admin/users/${owner}`,undefined,null,{admin:true,method:'DELETE'});
    if(!removed.ok){console.error('Disposable hosted user cleanup failed.');process.exitCode=1;}
  }
}
