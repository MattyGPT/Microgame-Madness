// Hostile paths against the one authorized project; generated .invalid addresses only.
// Run: node --env-file=.env.supabase scripts/verify_hosted_identity.mjs
import {randomBytes,randomUUID} from 'node:crypto';
import {environment,management,projectRef} from './hosted_accounts_admin.mjs';
const env=environment(),url=env.SUPABASE_URL;
if(!env.SUPABASE_PUBLISHABLE_KEY || !env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Both public and server credentials are required.');
const owners=new Set();
const password=()=>`Probe-${randomBytes(24).toString('base64url')}!`;
const check=(condition,label)=>{if(!condition)throw new Error(label);};
let stage='initialization';
async function request(path,body,{token,admin=false,method='POST'}={}){
 const response=await fetch(`${url}${path}`,{method,headers:{apikey:admin?env.SUPABASE_SERVICE_ROLE_KEY:env.SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',...(admin||token?{Authorization:`Bearer ${admin?env.SUPABASE_SERVICE_ROLE_KEY:token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 let data;try{data=await response.json();}catch{}
 return {ok:response.ok,status:response.status,data};
}
const identity=(body,token)=>request('/functions/v1/identity',body,{token});
const report=label=>console.log(`PASS ${label}`);
try{
 stage='anonymous signup';
 const guests=[];
 for(let i=0;i<2;i++){
  const result=await request('/auth/v1/signup',{data:{identity_hostile_probe:true}});
  check(result.ok&&result.data?.user?.id,'anonymous signup failed');owners.add(result.data.user.id);guests.push(result.data);
 }
 const denied=await request('/functions/v1/accounts',{action:'snapshot'},{token:guests[0].access_token});check(denied.status===403,'anonymous account write/read accepted');
 stage='concurrent handle collision';
 const handle=`hostile_${randomBytes(6).toString('hex')}`,initial=password();
 const results=await Promise.all(guests.map(guest=>identity({action:'register',handle,password:initial},guest.access_token)));
 check(results.filter(r=>r.ok).length===1,'collision did not produce exactly one winner');
 const winner=results.findIndex(r=>r.ok),registered=results[winner].data;
 check(registered.session.user.id===guests[winner].user.id,'conversion changed owner');
 check(results[1-winner].data?.error?.code==='handle_unavailable','collision did not preserve unique handle');
 report('concurrent duplicate handles reserve exactly one owner; anonymous cloud account reads denied.');
 stage='interrupted registration retry';
 // Treat the first success response as lost; retry with the original guest token.
 const retry=await identity({action:'register',handle,password:initial},guests[winner].access_token);
 if(!retry.ok)console.error(`Registration retry returned HTTP ${retry.status}, code ${String(retry.data?.error?.code||'unknown').replace(/[^a-z_]/g,'')}.`);
 check(retry.ok&&retry.data.session.user.id===registered.session.user.id,'lost-response registration retry failed');
 check(retry.data.recoveryCode!==registered.recoveryCode,'registration retry did not rotate recovery');
 const registeredAgain=retry.data;
 report('lost registration response can be retried using original guest identity and password.');
 stage='direct Auth bypasses';
 const provider=await request('/auth/v1/user',undefined,{token:registeredAgain.session.access_token,method:'GET'});
 check(provider.ok&&provider.data.email.endsWith('@accounts.invalid'),'opaque provider identifier missing');
 const directPassword=await request('/auth/v1/user',{password:password()},{token:registeredAgain.session.access_token,method:'PUT'});
 check(!directPassword.ok,'direct password update bypassed reauthentication');
 const directEmail=await request('/auth/v1/user',{email:`blocked-${randomUUID()}@example.invalid`},{token:registeredAgain.session.access_token,method:'PUT'});
 check(!directEmail.ok,'direct contact update accepted');
 const directSignup=await request('/auth/v1/signup',{email:`blocked-${randomUUID()}@example.invalid`,password:password()});
 check(!directSignup.ok,'direct nonanonymous signup accepted');
 const emailRecovery=await request('/auth/v1/recover',{email:provider.data.email});
 check(!emailRecovery.ok,'known-user email recovery did not reject email sending');
 const after=await identity({action:'login',handle,password:initial});check(after.ok,'blocked provider request changed password');
 const config=await management(`/v1/projects/${projectRef}/config/auth`);
 check(config.hook_send_email_enabled&&config.hook_send_email_uri==='pg-functions://postgres/public/identity_send_email','send-email hook absent');
 check(config.hook_before_user_created_enabled&&config.hook_before_user_created_uri==='pg-functions://postgres/public/identity_before_user_created','signup hook absent');
 check(!config.external_phone_enabled,'phone provider enabled');
 report('direct Auth password/contact changes, nonanonymous signup, and outbound email recovery blocked.');
 stage='concurrent recovery';
 const replacements=[password(),password()];
 const resets=await Promise.all(replacements.map(newPassword=>identity({action:'recover',handle,recoveryCode:registeredAgain.recoveryCode,newPassword})));
 check(resets.filter(r=>r.ok).length===1,'concurrent recovery did not have exactly one success');
 const resetIndex=resets.findIndex(r=>r.ok),reset=resets[resetIndex].data;
 check(reset.session.user.id===registered.session.user.id,'recovery changed owner');
 const replay=await identity({action:'recover',handle,recoveryCode:registeredAgain.recoveryCode,newPassword:password()});check(replay.status===401,'consumed recovery replay accepted');
 const oldAccess=await request('/functions/v1/accounts',{action:'snapshot'},{token:registeredAgain.session.access_token});check(oldAccess.status===401,'old access token remained authorized');
 const oldRefresh=await request('/auth/v1/token?grant_type=refresh_token',{refresh_token:registeredAgain.session.refresh_token});check(!oldRefresh.ok,'old refresh token accepted');
 report('simultaneous recovery consumes one code once and revokes old access/refresh credentials.');
 stage='credential abuse limits';
 let limited=false;
 for(let i=0;i<14;i++){
  const bad=await identity({action:'login',handle,password:password()});
  if(bad.status===429){limited=true;break;}
  check(bad.status===401&&bad.data?.error?.code==='invalid_credentials','wrong-password response exposed provider details');
 }
 check(limited,'credential rate limit did not reject repeated attempts');
 check((await identity({action:'login',handle,password:replacements[resetIndex]})).status===429,'correct password bypassed exhausted rate bucket');
 report('persistent credential abuse limits apply to wrong and correct passwords after exhaustion.');
 console.log(`Hostile identity checks complete for ${projectRef}.`);
}catch(error){
 // Never print provider responses, assertion diffs, passwords, handles, tokens, or IDs.
 console.error(`Hostile identity verification FAILED during ${stage}: ${error instanceof Error&&/^[a-z -]+$/.test(error.message)?error.message:'request or invariant failed'}.`);
 process.exitCode=1;
}finally{
 for(const owner of owners){
  try{
   await request('/rest/v1/rpc/account_delete',{p_owner:owner},{admin:true});
   const removed=await request(`/auth/v1/admin/users/${owner}`,undefined,{admin:true,method:'DELETE'});
   check(removed.ok||removed.status===404,'cleanup failed');
   const absent=await request(`/auth/v1/admin/users/${owner}`,undefined,{admin:true,method:'GET'});
   check(absent.status===404,'cleanup verification failed');
  }catch{console.error('Disposable hostile-probe user cleanup failed; inspect users marked identity_hostile_probe.');process.exitCode=1;}
 }
}
