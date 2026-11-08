// Rehearse operational pause switches on the selected project, restoring them in finally.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {environment,management,projectRef,deploy} from './hosted_accounts_admin.mjs';
const require=createRequire(import.meta.url),{Client}=require('../web/accounts/session.js');
const env=environment(),entries=new Map();
const auth=new Client({url:env.SUPABASE_URL,key:env.SUPABASE_PUBLISHABLE_KEY},{storage:{getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)},events:null});
const password=`Pause-${randomBytes(24).toString('base64url')}!`;
let owner;
async function switches(writes,imports,purchases){
  await management(`/v1/projects/${projectRef}/secrets`,{method:'POST',body:[
    {name:'ACCOUNTS_WRITES_ENABLED',value:String(writes)},{name:'ACCOUNTS_IMPORTS_ENABLED',value:String(imports)},{name:'ACCOUNTS_PURCHASES_ENABLED',value:String(purchases)}]});
  await deploy('accounts');
}
async function command(body){const response=await fetch(`${env.SUPABASE_URL}/functions/v1/accounts`,{method:'POST',headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${await auth.token()}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});return {status:response.status,body:await response.json()};}
const operation=(kind,payload={})=>({id:randomUUID(),kind,version:1,streamId:randomUUID(),payload});
try{
  owner=(await auth.ensureAnonymous()).id;
  await auth.register(`pause_${randomBytes(7).toString('hex')}`,password);
  assert.equal((await command({action:'snapshot'})).status,200);
  await switches(true,false,false);
  for(const op of [operation('import',{profile:{},baseline:true}),operation('purchase',{itemId:'shop_blue_mint'})]){
    const r=await command({action:'operations',operations:[op]});assert.equal(r.status,503);assert.equal(r.body.error.code,'paused');
  }
  assert.equal((await command({action:'operations',operations:[operation('onboarding.complete')]})).status,200);
  console.log('PASS imports/purchases paused independently of ordinary writes.');
  await switches(false,true,true);
  assert.equal((await command({action:'operations',operations:[operation('arcade',{event:'secret',name:'cube'})]})).status,503);
  assert.equal((await command({action:'snapshot'})).status,200);
  assert.equal((await command({action:'export'})).status,200);
  assert.equal((await command({action:'delete',confirmation:'DELETE',password})).status,200);owner=null;
  console.log('PASS global write pause retains reads/export/deletion.');
}catch(error){console.error(`Pause rehearsal failed: ${error.code||error.name}.`);process.exitCode=1;}
finally{
  try{await switches(true,true,true);console.log('RESTORED all write/import/purchase controls to enabled.');}catch{console.error('RESTORE FAILED: operator must restore write controls.');process.exitCode=1;}
  if(owner){
    for(const [path,body,method] of [['rest/v1/rpc/account_delete',{p_owner:owner},'POST'],[`auth/v1/admin/users/${owner}`,undefined,'DELETE']]){
      const r=await fetch(`${env.SUPABASE_URL}/${path}`,{method,headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
      if(!r.ok){console.error('Disposable pause user cleanup failed.');process.exitCode=1;}
    }
  }
  auth.close();
}
