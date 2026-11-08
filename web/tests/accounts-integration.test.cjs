const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const Rules = require('../../shared/account-rules.js');
const { Store } = require('../accounts/store.js');
const { Client } = require('../accounts/session.js');
const { Controller } = require('../accounts/sync.js');

const config = { url: 'https://local-integration.supabase.co', key: 'sb_publishable_test' };
const owner = '00000000-0000-0000-0000-000000000001';
const otherOwner = '00000000-0000-0000-0000-000000000002';
const sessionId = id => `10000000-0000-0000-0000-${id.slice(-12)}`;
const accessToken = id => `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, session_id: sessionId(id) })).toString('base64url')}.fixture-signature`;
const now = Date.parse('2026-11-07T12:00:00Z');
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
function storage() {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
}

// The only emulated network service is Auth: the real client, portable Edge
// handler, shared reducer, and every SQL migration/command run unchanged.
async function integration(t) {
  const db = new PGlite(); t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create table auth.sessions(id uuid primary key, user_id uuid references auth.users(id) on delete cascade);
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;`);
  const migrations = path.resolve(__dirname, '../../supabase/migrations');
  for (const filename of fs.readdirSync(migrations).filter(file => file.endsWith('.sql')).sort())
    await db.exec(fs.readFileSync(path.join(migrations, filename), 'utf8'));
  await db.query('insert into auth.users values ($1), ($2)', [owner, otherOwner]);
  for (const id of [owner, otherOwner]) await db.query('insert into auth.sessions values($1,$2)', [sessionId(id),id]);
  await db.exec('set role service_role');
  const users = new Map([owner, otherOwner].map(id => [id, { id, handle: id === owner ? 'cubie' : 'other_cubie', is_anonymous: false }]));
  const requests = [];
  let loseResponse = false;
  const { createHandler } = await import('../../supabase/functions/accounts/handler.mjs');
  const transport = async (url, options = {}) => {
    if (url.endsWith('/auth/v1/user')) {
      const token = options.headers.Authorization || '';
      const user = [...users.values()].find(user => token === `Bearer ${accessToken(user.id)}`);
      return user ? reply(user) : reply({ message: 'Invalid test identity' }, 401);
    }
    if (url.includes('/auth/v1/logout')) return new Response(null, { status: 204 });
    if (url.includes('/rest/v1/rpc/')) {
      assert.equal(options.headers.Authorization, 'Bearer test-service-key');
      const name = url.split('/').at(-1);
      assert.match(name, /^(account|identity)_[a-z_]+$/);
      const body = JSON.parse(options.body);
      const keys = Object.keys(body);
      const values = keys.map(key => Array.isArray(body[key]) ? body[key] : body[key] !== null && typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key]);
      try {
        const result = await db.query(`select public.${name}(${keys.map((key, index) => `${key} => $${index + 1}`).join(',')}) as data`, values);
        return reply(result.rows[0].data);
      } catch (error) { return reply({ code: error.code, message: error.message }, 400); }
    }
    throw new Error(`Unexpected test transport ${url}`);
  };
  const handler = createHandler({ url: config.url, serviceKey: 'test-service-key', rules: Rules, fetch: transport, now: () => now });
  const fetch = async (url, options = {}) => {
    if (!url.endsWith('/functions/v1/accounts')) return transport(url, options);
    const body = JSON.parse(options.body);
    requests.push({ owner: options.headers.Authorization, ...body });
    const response = await handler(new Request(url, options));
    if (body.action === 'operations' && loseResponse && response.ok) {
      loseResponse = false;
      throw new Error('Disconnected after SQL commit and before client acknowledgement');
    }
    return response;
  };
  const clients = [];
  function client(initialOwner = null) {
    let serial = 0; const clientIndex = clients.length;
    const local = new Store({ rules: Rules, indexedDB: null, BroadcastChannel: null, now: () => now,
      uuid: () => `client-${clientIndex}-operation-${++serial}` });
    const auth = new Client(config, { storage: storage(), fetch, events: null, now: () => now });
    const state = { online: false };
    const sync = new Controller({ config, store: local, session: auth, rules: Rules, fetch, events: null, now: () => now, online: () => state.online });
    function signIn(id) { auth.save({ access_token: accessToken(id), refresh_token: `refresh-${id}`, expires_in: 3600, user: users.get(id) }); }
    if (initialOwner) signIn(initialOwner);
    clients.push({ local, auth, sync });
    t.after(() => { sync.close(); local.close(); auth.close(); });
    return { local, auth, sync, state, signIn };
  }
  return { db, client, requests, loseNextResponse() { loseResponse = true; } };
}

test('local integration: guest baseline and run journal survive lost replies, purchase once, and load on another device', async t => {
  const env = await integration(t);
  const first = env.client();
  await first.sync.initialize({ player: 'Legacy Cubie', shop: { units: 120000, owned: [] }, achievements: { stats: {}, unlocked: {} } });
  await first.sync.enqueue('run.start', { mode: 'hangman', difficulty: 'easy' }, { runId: 'first-round' });
  await first.sync.enqueue('run.finish', { outcome: 'win', snapshot: { mode: 'hangman', difficulty: 'easy', over: true, won: true, score: 10, mistakes: 0, remaining: 10 } }, { runId: 'first-round' });
  assert.equal(first.sync.state().profile.shop.units, 160000);
  first.signIn(owner);
  await first.sync.activate(owner, { bindGuest: true });
  assert.equal(first.sync.state().importRequired, true);
  assert.equal(first.sync.state().importProfile.shop.units, 120000);
  first.state.online = true; env.loseNextResponse();
  await assert.rejects(first.sync.importProfile(first.sync.state().importProfile, { baseline: true }), { code: 'network' });
  first.sync.cancelRetry();
  assert.equal(first.sync.state().pending, 3);
  await first.sync.flush();
  assert.equal(first.sync.state().pending, 0);
  assert.equal(first.sync.state().rejected.length, 0);
  assert.equal(first.sync.state().profile.shop.units, 160000);
  assert.equal(first.sync.state().profile.achievements.stats.hangmanWins, 1);
  const operationBatches = env.requests.filter(request => request.action === 'operations');
  assert.deepEqual(operationBatches[0].operations, operationBatches[1].operations);
  const history = await first.sync.history({ mode: 'hangman', limit: 20 });
  assert.equal(history.runs.length, 1);
  assert.equal(history.runs[0].id, 'first-round');

  const item = Rules.catalog.filter(item => item.price).sort((a, b) => a.price - b.price)[0];
  await first.sync.enqueue('purchase', { itemId: item.id });
  await first.sync.flush();
  assert.equal(first.sync.state().profile.shop.units, 160000 - item.price * 1000);
  assert.deepEqual(first.sync.state().profile.shop.owned, [item.id]);
  const archive = await first.sync.export();
  assert.equal(archive.wallet.length, 3, 'opening credit, one run reward, and one purchase debit');
  assert.doesNotMatch(JSON.stringify(archive), /fixture-signature|refresh-|recoveryCode|provider_identifier|encrypted_password/);

  const second = env.client(owner);
  await second.sync.initialize();
  assert.deepEqual(second.sync.state().profile.shop, first.sync.state().profile.shop);
  assert.equal(second.sync.state().profile.achievements.stats.hangmanWins, 1);
  assert.equal((await second.sync.history()).runs.length, 1);
  assert.equal(second.sync.state().pending, 0);

  const stranger = env.client(otherOwner);
  await stranger.sync.initialize();
  assert.equal(stranger.sync.state().profile.shop.units, 0);
  assert.equal((await stranger.sync.history()).runs.length, 0);
});

test('local integration: real handler preference conflict rebases without dropping another operation', async t => {
  const env = await integration(t), first = env.client(owner), second = env.client(owner);
  await first.sync.initialize(); await second.sync.initialize();
  await first.sync.enqueue('settings', { changes: { player: 'First device' }, baseRevisions: {} });
  await second.sync.enqueue('settings', { changes: { player: 'Second device' }, baseRevisions: {} });
  await second.sync.enqueue('arcade', { event: 'secret', name: 'cube' });
  first.state.online = true; await first.sync.flush();
  second.state.online = true; await second.sync.flush();
  assert.equal(second.sync.state().profile.player, 'First device');
  assert.equal(second.sync.state().profile.achievements.stats.cubePets, 1);
  assert.equal(second.sync.state().pending, 0);
  assert.equal(second.sync.state().rejected.length, 1);
  assert.equal(second.sync.state().rejected[0].error.code, 'conflict');
  await first.sync.pull();
  assert.equal(first.sync.state().profile.achievements.stats.cubePets, 1);
});

test('local integration: revoked access token cannot read or write even while Auth still recognizes it', async t => {
  const env = await integration(t), player = env.client(owner);
  await player.sync.initialize();
  assert.equal(player.sync.state().owner, owner);
  await player.sync.enqueue('arcade', { event: 'secret', name: 'cube' });
  await env.db.exec('reset role');
  await env.db.query('delete from auth.sessions where user_id=$1', [owner]);
  await env.db.exec('set role service_role');
  await assert.rejects(player.sync.pull(), { status: 401 });
  player.state.online = true;
  await assert.rejects(player.sync.flush(), { status: 401 });
  player.sync.cancelRetry();
  assert.equal(player.sync.state().pending, 1, 'revocation retains the original owner journal');
  const state = await env.db.query('select public.account_read($1,$2) as snapshot', [owner, JSON.stringify(Rules.initial())]);
  assert.equal(state.rows[0].snapshot.state.achievements.stats.cubePets, 0);
});
