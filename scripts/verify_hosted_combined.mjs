// Verify combined boards using a disposable guest; never print credentials.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { environment, query } from './hosted_accounts_admin.mjs';
const require=createRequire(import.meta.url);
const {Client:Session}=require('../web/accounts/session.js');
const {Client:Leaderboard}=require('../web/leaderboards.js');
const env=environment(),config={url:env.SUPABASE_URL,key:env.SUPABASE_PUBLISHABLE_KEY};
const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
const session=new Session(config,{storage,events:null});
const leaderboard=new Leaderboard(config,{storage}); leaderboard.accountSession=session;
let owner;
try {
  owner=(await session.ensureAnonymous()).id;
  for(const [mode,rounds,expected] of [
    ['hangman',[['easy',4],['medium',6],['hard',5]],39],
    ['dodge',[['easy',10],['normal',10],['chaos',10],['hard',10],['merciless',10],['impossible',10]],190],
    ['boss',[['mean',10],['cruel',2]],15],
  ]) {
    for(const [difficulty,score] of rounds)
      await leaderboard.submit({runId:randomUUID(),mode,difficulty,score,player:'Combined verification'});
    const rows=await leaderboard.listGame(mode,{aroundMe:true});
    assert.equal(rows.find(row=>row.is_you)?.score,expected);
    assert.equal(rows.filter(row=>row.is_you).length,1);
    console.log(`PASS hosted ${mode}: one combined row, weighted total ${expected}.`);
  }
  const rows=await query(`select sum(total)::int as total from leaderboard_private.scores where player_id='${owner}' and mode='boss'`);
  assert.equal(rows[0].total,12);
  console.log('PASS raw scores stay unchanged; weighting and rounding happen only in the leaderboard.');
} finally {
  session.close();
  if(owner) {
    await query(`select public.account_delete('${owner}'::uuid)`);
    const response=await fetch(`${config.url}/auth/v1/admin/users/${owner}`,{method:'DELETE',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`}});
    if(!response.ok && response.status!==404) throw new Error(`Disposable identity cleanup failed (${response.status}).`);
    console.log('Cleaned up disposable verification identity.');
  }
}
