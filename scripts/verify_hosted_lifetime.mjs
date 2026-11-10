// Disposable hosted verification for lifetime totals and the 350-win reward.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { environment, query } from './hosted_accounts_admin.mjs';
const require = createRequire(import.meta.url);
const Rules = require('../shared/account-rules.js');
const { Client: Session } = require('../web/accounts/session.js');
const { Client: Leaderboard } = require('../web/leaderboards.js');
const { Store } = require('../web/accounts/store.js');
const { Controller } = require('../web/accounts/sync.js');
const env = environment(), config = { url: env.SUPABASE_URL, key: env.SUPABASE_PUBLISHABLE_KEY };
const data = new Map();
const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key,value), removeItem: key => data.delete(key) };
const session = new Session(config, {storage, events:null});
const store = new Store({rules:Rules, indexedDB:null, BroadcastChannel:null});
let online = false, owner;
const controller = new Controller({config,session,store,rules:Rules,events:null,online:()=>online});
const leaderboard = new Leaderboard(config, {storage});
leaderboard.accountSession = session;
const password = `Verify-${randomBytes(24).toString('base64url')}!`;
try {
  await controller.initialize({player:'Lifetime verification', achievements:{stats:{bossWins:349},unlocked:{}}});
  owner = (await session.ensureAnonymous()).id;
  let total = 0;
  for (const score of [4,9,8]) {
    const runId = randomUUID();
    await controller.enqueue('run.start',{mode:'hangman',difficulty:'easy'},{runId});
    await controller.enqueue('run.finish',{outcome:'win',snapshot:{over:true,won:true,score}},{runId});
    const entry = {runId,mode:'hangman',difficulty:'easy',player:'Lifetime verification',score};
    await leaderboard.submit(entry);
    await leaderboard.submit(entry); // A committed retry must not add another round.
    total += score;
    const rows = await query(`select total::int from leaderboard_private.scores where player_id='${owner}' and mode='hangman' and difficulty='easy'`);
    assert.equal(rows[0].total,total);
  }
  console.log('PASS hosted guest lifetime total: 4 + 9 + 8 = 21, including retries.');
  await session.register(`total_${randomBytes(7).toString('hex')}`,password);
  await controller.activate(owner,{bindGuest:true});
  online=true;
  await controller.importProfile(controller.state().importProfile,{baseline:true});
  await controller.flush();
  const rows = await query(`select total::int from leaderboard_private.scores where player_id='${owner}' and mode='hangman' and difficulty='easy'`);
  assert.equal(rows[0].total,21);
  console.log('PASS hosted account conversion preserves 21 without counting the guest journal twice.');
  assert.equal(controller.state().profile.achievements.stats.bossWins,349);
  assert.equal(controller.state().profile.achievements.unlocked.boss_100,undefined);
  const runId=randomUUID();
  await controller.enqueue('run.start',{mode:'boss',difficulty:'mean'},{runId});
  await controller.enqueue('run.finish',{outcome:'win',snapshot:{over:true,won:true,score:50,damage_taken:0}},{runId});
  await controller.flush();
  assert.equal(controller.state().profile.achievements.stats.bossWins,350);
  assert.ok(controller.state().profile.achievements.unlocked.boss_100);
  console.log('PASS hosted Celestial Forge stays locked at 349 and unlocks at 350 wins.');
  const publicRows=await leaderboard.listPage('hangman','easy',{aroundMe:true});
  assert.equal(publicRows.find(row=>row.is_you)?.score,21);
  await controller.deleteAccount(password);
  console.log('PASS public lifetime ranking and account deletion.');
} finally {
  controller.close(); store.close(); session.close();
  if(owner) {
    // A tombstone and removal cover failures before normal deletion completed.
    await query(`select public.account_delete('${owner}'::uuid)`);
    const response=await fetch(`${config.url}/auth/v1/admin/users/${owner}`,{method:'DELETE',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`}});
    if(!response.ok && response.status!==404) throw new Error(`Disposable identity cleanup failed (${response.status}).`);
    console.log('Cleaned up disposable verification identity.');
  }
}
