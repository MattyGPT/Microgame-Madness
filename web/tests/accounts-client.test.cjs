const { test } = require('node:test');
const assert = require('node:assert/strict');
const Rules = require('../../shared/account-rules.js');
const { Store, MemoryDatabase } = require('../accounts/store.js');
const { Client } = require('../accounts/session.js');
const { Controller } = require('../accounts/sync.js');

const config = { url: 'https://example.supabase.co', key: 'sb_publishable_example' };
function storage() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
function response(value, status = 200) { return new Response(value === undefined ? undefined : JSON.stringify(value), { status }); }
function store(t, options = {}) {
  let next = 0;
  const result = new Store({ rules: Rules, indexedDB: null, BroadcastChannel: null, uuid: () => `id-${++next}`, now: () => 100000, ...options });
  t.after(() => result.close()); return result;
}
function session(userId = 'user-one') {
  const listeners = new Set();
  return { configured: true, url: config.url, key: config.key, generation: 0, requiresSignIn: false, userId,
    snapshot() { return { user: this.userId ? { id: this.userId, is_anonymous: false } : null, generation: this.generation }; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    async getUser() { return this.snapshot().user; },
    async token() { return `token-${this.userId}`; },
    async signOut() { this.userId = null; this.generation++; for (const fn of listeners) fn(this.snapshot()); return { local: true, remote: true }; },
    switch(id) { this.userId = id; this.generation++; for (const fn of listeners) fn(this.snapshot()); },
  };
}
function server() {
  const users = new Map(); let loseResponse = false; const submitted = [];
  return { users, submitted, loseNext() { loseResponse = true; },
    async fetch(_url, options) {
      const owner = options.headers.Authorization.slice('Bearer token-'.length);
      const body = JSON.parse(options.body);
      const data = users.get(owner) || { state: Rules.initial(), revision: 0, ids: new Map() };
      users.set(owner, data);
      if (body.action === 'snapshot') return response({ state: data.state, revision: data.revision });
      if (body.action === 'operations') {
        const receipts = [];
        for (const op of body.operations) {
          submitted.push({ owner, op });
          if (data.ids.has(op.id)) { receipts.push({ id: op.id, status: 'duplicate' }); continue; }
          try { data.state = Rules.apply(data.state, op, { now: 100000 }).state; data.revision++; data.ids.set(op.id, true); receipts.push({ id: op.id, status: 'applied' }); }
          catch (error) { receipts.push({ id: op.id, status: 'rejected', error: { code: error.code, message: error.message } }); }
        }
        if (loseResponse) { loseResponse = false; throw new Error('connection lost after commit'); }
        return response({ receipts, state: data.state, revision: data.revision });
      }
      throw new Error(`Unexpected action ${body.action}`);
    },
  };
}
function controller(t, { session: auth = session(), store: local = store(t), backend = server(), online = () => false } = {}) {
  const result = new Controller({ config, store: local, session: auth, rules: Rules, fetch: backend.fetch.bind(backend), events: null, online });
  t.after(() => result.close()); return result;
}

test('local effect and outbox append together, including memory fallback and invalid mutation rollback', async t => {
  const local = store(t);
  await local.ensure('guest', { player: 'Cubie', shop: { units: 1000, owned: [] } });
  assert.equal(local.durable, false);
  await local.append('guest', 'arcade', { event: 'secret', name: 'cube' });
  const first = await local.get('guest');
  assert.equal(first.optimistic.achievements.stats.cubePets, 1);
  assert.equal(first.pending.length, 1);
  await assert.rejects(local.append('guest', 'purchase', { itemId: 'does-not-exist' }));
  assert.deepEqual(await local.get('guest'), first);
});

test('simultaneous writers retain both operations without snapshot overwrite', async t => {
  const memory = new MemoryDatabase(), a = store(t, { memory, uuid: () => 'a' }), b = store(t, { memory, uuid: () => 'b' });
  await a.ensure('guest');
  await Promise.all([a.append('guest', 'arcade', { event: 'secret', name: 'cube' }), b.append('guest', 'arcade', { event: 'secret', name: 'cube' })]);
  const saved = await a.get('guest');
  assert.equal(saved.pending.length, 2);
  assert.equal(saved.optimistic.achievements.stats.cubePets, 2);
  assert.deepEqual(saved.pending.map(op => op.sequence), [1, 2]);
});

test('acknowledging one operation preserves a newer optimistic action exactly once', async t => {
  const local = store(t); await local.ensure('user');
  await local.append('user', 'arcade', { event: 'secret', name: 'cube' });
  await local.append('user', 'arcade', { event: 'secret', name: 'cube' });
  let saved = await local.get('user'); const first = saved.pending[0];
  const confirmed = Rules.apply(Rules.initial(), first, { now: 100000 }).state;
  await local.acknowledge('user', { state: confirmed, revision: 1, receipts: [{ id: first.id, status: 'applied' }] });
  saved = await local.get('user');
  assert.equal(saved.confirmed.achievements.stats.cubePets, 1);
  assert.equal(saved.optimistic.achievements.stats.cubePets, 2);
  assert.equal(saved.pending.length, 1);
  await assert.rejects(local.acknowledge('user', { state: Rules.initial(), revision: 0, receipts: [{ id: saved.pending[0].id, status: 'applied' }] }), { code: 'stale_acknowledgement' });
});

test('guest binding retains IDs, fences old guest writers, and cancellation preserves source', async t => {
  const local = store(t); await local.ensure('guest');
  await local.append('guest', 'arcade', { event: 'secret', name: 'cube' });
  const guest = await local.get('guest');
  await local.bind('guest', 'user');
  await local.mutate('user', value => ({ ...value, importRequired: true }));
  assert.deepEqual((await local.get('user')).pending, guest.pending);
  await assert.rejects(local.append('guest', 'arcade', { event: 'visit' }), { code: 'bound_profile' });
  await local.cancelBinding('user');
  assert.equal(await local.get('user'), undefined);
  assert.deepEqual((await local.get('guest')).pending, guest.pending);
  assert.equal((await local.get('guest')).boundTo, null);
});

test('loss after server commit retries the identical ID and clears only acknowledged work', async t => {
  let online = false; const backend = server(), sync = controller(t, { backend, online: () => online });
  await sync.initialize();
  await sync.enqueue('arcade', { event: 'secret', name: 'cube' });
  backend.loseNext(); online = true;
  await assert.rejects(sync.flush(), { code: 'network' });
  sync.cancelRetry();
  assert.equal(sync.state().pending, 1);
  await sync.flush();
  assert.equal(sync.state().pending, 0);
  assert.equal(sync.state().profile.achievements.stats.cubePets, 1);
  assert.equal(backend.submitted[0].op.id, backend.submitted[1].op.id);
});

test('new account imports only confirmed guest baseline before replaying its journal', async t => {
  let online = false; const auth = session(null), backend = server();
  const sync = controller(t, { session: auth, backend, online: () => online });
  await sync.initialize({ player: 'Guest', shop: { units: 5000, owned: [] } });
  await sync.enqueue('arcade', { event: 'secret', name: 'cube' });
  auth.switch('new-user');
  await sync.activate('new-user', { bindGuest: true });
  assert.equal(sync.state().importRequired, true);
  assert.equal(sync.state().importProfile.achievements.stats.cubePets, 0);
  online = true;
  await sync.importProfile(sync.state().importProfile, { baseline: true });
  assert.equal(sync.state().pending, 0);
  assert.equal(sync.state().profile.shop.units, 5000);
  assert.equal(sync.state().profile.achievements.stats.cubePets, 1);
  assert.deepEqual(backend.submitted.map(row => row.op.kind), ['import', 'arcade']);
});

test('sign-out retains pending work for its owner but restores a separate guest profile', async t => {
  const auth = session(), sync = controller(t, { session: auth });
  await sync.initialize({ player: 'Local Guest' });
  await sync.enqueue('arcade', { event: 'secret', name: 'cube' });
  await sync.signOut({ retainPending: true });
  assert.equal(sync.state().owner, 'guest');
  assert.equal(sync.state().profile.player, 'Local Guest');
  assert.equal((await sync.store.get('user-one')).pending.length, 1);
  auth.switch('user-two'); await sync.activate('user-two');
  assert.equal(sync.state().profile.achievements.stats.cubePets, 0);
});

test('expired authentication refresh preserves the user and never falls back to signup', async t => {
  const saved = storage(), requests = [];
  saved.setItem(`microgame-madness.leaderboard.v1:${config.url}.session`, JSON.stringify({ access_token: 'old', refresh_token: 'refresh', expires_at: 0, user_id: 'same-user' }));
  const auth = new Client(config, { storage: saved, now: () => 100000, events: null, fetch: async (url, options) => {
    requests.push({ url, options }); return response({ message: 'Invalid refresh token' }, 400);
  } }); t.after(() => auth.close());
  await assert.rejects(auth.token());
  assert.equal(requests.length, 1);
  assert.ok(requests[0].url.includes('grant_type=refresh_token'));
  assert.equal(auth.snapshot().user.id, 'same-user');
  assert.equal(auth.snapshot().requiresSignIn, true);
});

test('logout while refresh is in flight cannot restore the logged-out session', async t => {
  const saved = storage(); let release;
  saved.setItem(`microgame-madness.leaderboard.v1:${config.url}.session`, JSON.stringify({ access_token: 'old', refresh_token: 'refresh', expires_at: 0, user_id: 'user' }));
  const auth = new Client(config, { storage: saved, events: null, fetch: async url => {
    if (url.includes('grant_type')) return new Promise(resolve => { release = () => resolve(response({ access_token: 'new', refresh_token: 'new-refresh', expires_in: 3600, user: { id: 'user' } })); });
    return response(undefined, 204);
  } }); t.after(() => auth.close());
  const refreshing = auth.token(); await auth.signOut(); release();
  await assert.rejects(refreshing, { code: 'stale_session' });
  assert.equal(auth.snapshot().user, null);
  assert.equal(saved.getItem(auth.storageKey), null);
});

test('existing-account email code does not auto-create accounts or discard current guest session', async t => {
  const requests = [], saved = storage();
  const auth = new Client(config, { storage: saved, events: null, fetch: async (url, options) => { requests.push({ url, body: JSON.parse(options.body) }); return response({}); } });
  t.after(() => auth.close());
  await auth.requestCode(' player@example.com ');
  assert.deepEqual(requests[0].body, { email: 'player@example.com', create_user: false });
  await assert.rejects(auth.verifyCode('other@example.com', '123456'), { code: 'code_request_required' });
  assert.equal(auth.snapshot().user, null);
});

test('a late response cannot populate a newly active account', async t => {
  const backend = server(), auth = session(); let release; let intercept = false;
  const sync = controller(t, { session: auth, backend: { fetch: async (...args) => {
    if (intercept) return new Promise(resolve => { release = async () => resolve(await backend.fetch(...args)); });
    return backend.fetch(...args);
  } } });
  await sync.initialize(); intercept = true;
  const oldRead = sync.pull();
  while (!release) await new Promise(resolve => setImmediate(resolve));
  intercept = false; auth.switch('user-two'); await sync.activate('user-two');
  await release(); await assert.rejects(oldRead, { code: 'stale_session' });
  assert.equal(sync.state().owner, 'user-two');
  assert.equal(sync.state().profile.achievements.stats.cubePets, 0);
});

test('session changes block new writes under the previous account owner', async t => {
  const auth = session(), sync = controller(t, { session: auth });
  await sync.initialize();
  auth.switch('another-account');
  await assert.rejects(sync.enqueue('arcade', { event: 'secret', name: 'cube' }), { code: 'sign_in_required' });
  assert.equal((await sync.store.get('user-one')).pending.length, 0);
});

test('account purchases cannot spend provisional offline earnings', async t => {
  const sync = controller(t);
  await sync.initialize();
  const item = Rules.catalog.find(item => item.price);
  await assert.rejects(sync.enqueue('purchase', { itemId: item.id }), { code: 'offline_purchase' });
  sync.online = () => true;
  await sync.store.mutate('user-one', record => {
    record.optimistic.shop.units = item.price * 1000;
    return record;
  });
  await assert.rejects(sync.enqueue('purchase', { itemId: item.id }), { code: 'unconfirmed_balance' });
});

test('rejected operation IDs cannot be reused for different local work', async t => {
  const local = store(t); await local.ensure('user');
  await local.append('user', 'arcade', { event: 'secret', name: 'cube' }, { id: 'once' });
  await local.acknowledge('user', { state: Rules.initial(), revision: 0, receipts: [{ id: 'once', status: 'rejected', error: { code: 'invalid', message: 'Rejected' } }] });
  await assert.rejects(local.append('user', 'arcade', { event: 'visit' }, { id: 'once' }), { code: 'duplicate_operation' });
  assert.equal((await local.get('user')).optimistic.achievements.stats.cubePets, 0);
});

test('concurrent anonymous requests create only one recoverable guest identity', async t => {
  let signups = 0;
  const user = { id: 'guest-id', is_anonymous: true };
  const auth = new Client(config, { storage: storage(), events: null, fetch: async url => {
    if (url.endsWith('/signup')) { signups++; return response({ access_token: 'access', refresh_token: 'refresh', expires_in: 3600, user }); }
    assert.ok(url.endsWith('/user')); return response(user);
  } }); t.after(() => auth.close());
  const users = await Promise.all([auth.ensureAnonymous(), auth.ensureAnonymous()]);
  assert.equal(signups, 1);
  assert.deepEqual(users.map(user => user.id), ['guest-id', 'guest-id']);
});

test('local storage migration preserves a completed guest streak without cloud-importing it', async t => {
  const local = store(t);
  await local.ensure('guest', { achievements: { stats: { bossCleanStreak: 4, bossRunActive: 0 }, unlocked: {} } });
  await local.append('guest', 'arcade', { event: 'visit' });
  const record = await local.get('guest');
  assert.equal(record.optimistic.achievements.stats.bossCleanStreak, 4);
  assert.equal(record.optimistic.streams[record.streamId].bossCleanStreak, 4);
  assert.equal(record.optimistic.baselineClosed, false);
});

test('rejected run starts retain blocked descendants while unrelated progress syncs', async t => {
  const local = store(t); await local.ensure('user');
  await local.append('user', 'run.start', { mode: 'hangman', difficulty: 'easy' }, { runId: 'run' });
  await local.append('user', 'run.checkpoint', { snapshot: { score: 5, mistakes: 1 } }, { runId: 'run' });
  await local.append('user', 'run.finish', { snapshot: { over: true, won: true, score: 5, mistakes: 1 }, outcome: 'win' }, { runId: 'run' });
  let record = await local.get('user');
  assert.deepEqual(record.pending[1].dependsOn, [record.pending[0].id]);
  assert.deepEqual(record.pending[2].dependsOn, [record.pending[1].id]);
  await local.acknowledge('user', { state: Rules.initial(), revision: 0,
    receipts: [{ id: record.pending[0].id, status: 'rejected', error: { code: 'invalid', message: 'Start rejected' } }] });
  record = await local.get('user');
  assert.equal(record.pending.length, 2);
  assert.deepEqual(record.blocked.map(item => item.code), ['dependency_failed', 'dependency_failed']);
  assert.equal(record.optimistic.shop.units, 0);
  await local.append('user', 'arcade', { event: 'secret', name: 'cube' });
  assert.equal((await local.get('user')).optimistic.achievements.stats.cubePets, 1);
});

test('external sign-out activates a fresh guest instead of a copy of the bound account wallet', async t => {
  const auth = session(null), sync = controller(t, { session: auth });
  await sync.initialize({ player: 'Guest', shop: { units: 100000, owned: [] } });
  auth.switch('user-one'); await sync.activate('user-one', { bindGuest: true });
  assert.equal((await sync.store.get('guest')).boundTo, 'user-one');
  auth.switch(null); await sync.activate('guest');
  assert.equal(sync.state().profile.shop.units, 0);
  assert.equal(sync.state().profile.player, 'Player');
  assert.equal((await sync.store.get('user-one')).importSource.shop.units, 100000);
});

test('tabs claim independent ordered streams and reload resumes only the same tab stream', async t => {
  const local = store(t); await local.ensure('guest');
  const first = await local.claimStream('guest', 'first-tab');
  const second = await local.claimStream('guest', 'second-tab');
  assert.notEqual(first, second);
  assert.equal(await local.claimStream('guest', 'first-tab'), first);
  await local.append('guest', 'run.start', { mode: 'hangman', difficulty: 'easy' }, { runId: 'first-run', streamId: first });
  await local.append('guest', 'run.start', { mode: 'dodge', difficulty: 'normal' }, { runId: 'second-run', streamId: second });
  const record = await local.get('guest');
  assert.equal(record.optimistic.runs['first-run'].finished, false);
  assert.equal(record.optimistic.runs['second-run'].finished, false);
  assert.equal(record.optimistic.streams[first].activeRun, 'first-run');
  assert.equal(record.optimistic.streams[second].activeRun, 'second-run');
});

test('imports send only normalized legacy progress while retaining the original local backup', async t => {
  const auth = session(null), sync = controller(t, { session: auth });
  await sync.initialize();
  const raw = { ...Rules.initial(), player: 'Imported', runs: { example: { transcript: 'x'.repeat(10000) } },
    unexpected: 'not part of the import protocol' };
  await sync.importProfile(raw, { baseline: false });
  const saved = await sync.store.get('guest');
  assert.deepEqual(saved.pending[0].payload.profile.runs, {});
  assert.equal(saved.pending[0].payload.profile.unexpected, undefined);
  assert.equal(saved.backups[0].source.runs.example.transcript.length, 10000);
  assert.equal(saved.optimistic.player, 'Player');
});

test('an event occurrence time survives delayed enqueue and later snapshot rebasing', async t => {
  const occurredAt = Date.parse('2026-11-07T10:00:00Z');
  let now = occurredAt + 60000;
  const local = store(t, { now: () => now });
  await local.ensure('user');
  await local.append('user', 'run.start', { mode: 'hangman', difficulty: 'easy' }, { runId: 'delayed-run', occurredAt });
  const original = (await local.get('user')).pending[0];
  assert.equal(original.occurredAt, occurredAt);
  now += 86400000;
  await local.acknowledge('user', { state: Rules.initial(), revision: 1, receipts: [] });
  const rebased = await local.get('user');
  assert.deepEqual(rebased.pending[0], original);
  assert.equal(rebased.optimistic.runs['delayed-run'].startedAt, new Date(occurredAt).toISOString());
});

test('other-tab token rotations preserve owner generation and pending email verification', async t => {
  const saved = storage(), auth = new Client(config, { storage: saved, events: null });
  t.after(() => auth.close());
  auth.save({ access_token: 'first', refresh_token: 'first-refresh', expires_in: 3600, user: { id: 'user' } });
  auth.pendingEmail = { email: 'player@example.com', generation: auth.generation };
  const pending = auth.pendingEmail, generation = auth.generation;
  saved.setItem(auth.storageKey, JSON.stringify({ ...auth.session, access_token: 'rotated', refresh_token: 'rotated-refresh' }));
  auth.onStorage({ key: auth.storageKey });
  assert.equal(auth.generation, generation);
  assert.equal(auth.pendingEmail, pending);
  assert.equal(await auth.token(), 'rotated');
  saved.setItem(auth.storageKey, JSON.stringify({ ...auth.session, user_id: 'other-user', user: { id: 'other-user' } }));
  auth.onStorage({ key: auth.storageKey });
  assert.equal(auth.generation, generation + 1);
  assert.equal(auth.pendingEmail, null);
  saved.removeItem(auth.storageKey); auth.onStorage({ key: null });
  assert.equal(auth.generation, generation + 2);
  assert.equal(auth.snapshot().user, null);
});

test('a failed concurrent refresh uses the successful rotation from another tab', async t => {
  const saved = storage(); let release;
  const auth = new Client(config, { storage: saved, events: null, now: () => 100000, fetch: async () =>
    new Promise(resolve => { release = () => resolve(response({ message: 'Already used refresh token' }, 400)); }) });
  t.after(() => auth.close());
  auth.save({ access_token: 'old', refresh_token: 'old-refresh', expires_in: 0, user: { id: 'user' } });
  const refreshing = auth.token();
  saved.setItem(auth.storageKey, JSON.stringify({ ...auth.session, access_token: 'rotated', refresh_token: 'rotated-refresh', expires_at: 3700 }));
  auth.onStorage({ key: auth.storageKey }); release();
  assert.equal(await refreshing, 'rotated');
  assert.equal(auth.requiresSignIn, false);
  assert.equal(auth.generation, 0);
});

test('failed guest conversion rolls back owner and preserves journal, claims, and backups', async t => {
  const auth = session(null), local = store(t);
  const sync = controller(t, { session: auth, store: local, backend: { fetch: async () => { throw new Error('offline'); } } });
  await sync.initialize({ player: 'Guest', shop: { units: 9000, owned: [] } });
  const streamId = await sync.claimStream('test-tab');
  await sync.enqueue('arcade', { event: 'secret', name: 'cube' });
  await local.backup('guest', { player: 'Saved backup' });
  const before = await local.get('guest');
  auth.switch('new-user');
  await assert.rejects(sync.activate('new-user', { bindGuest: true }), { code: 'network' });
  assert.equal(sync.state().owner, 'guest');
  assert.equal(sync.state().status, 'guest');
  assert.equal(sync.state().streamId, streamId);
  assert.equal(sync.state().profile.shop.units, 9000);
  assert.deepEqual(await local.get('guest'), before);
  assert.equal(await local.get('new-user'), undefined);
  await sync.enqueue('arcade', { event: 'secret', name: 'cube' });
  assert.equal(sync.state().profile.achievements.stats.cubePets, 2);
});

test('initial account snapshot failure restores guest during initialize and explicit activation', async t => {
  const sync = controller(t, { backend: { fetch: async () => { throw new Error('offline'); } } });
  await sync.initialize({ player: 'Guest', shop: { units: 9000, owned: [] } });
  assert.equal(sync.state().owner, 'guest');
  assert.equal(sync.state().status, 'guest');
  assert.equal(sync.state().profile.player, 'Guest');
  assert.equal(sync.state().error.code, 'network');
  await assert.rejects(sync.activate('user-one'), { code: 'network' });
  assert.equal(sync.state().owner, 'guest');
  await sync.enqueue('arcade', { event: 'secret', name: 'cube' });
  assert.equal(sync.state().profile.shop.units, 9000);
  assert.equal((await sync.store.get('user-one')).pending.length, 0);
});

test('malformed conversion snapshot does not fence or mutate the guest source', async t => {
  const local = store(t); await local.ensure('guest');
  await local.claimStream('guest', 'test-tab');
  await local.backup('guest', { player: 'Saved backup' });
  const before = await local.get('guest');
  await assert.rejects(local.bind('guest', 'user', { snapshot: { state: Rules.initial(), revision: '0' } }), { code: 'invalid_response' });
  assert.deepEqual(await local.get('guest'), before);
  assert.equal(await local.get('user'), undefined);
});

test('an import paused during backup cannot enqueue under a newly active owner', async t => {
  const auth = session(), sync = controller(t, { session: auth });
  await sync.initialize();
  const original = sync.store.backup.bind(sync.store); let release, started;
  const waiting = new Promise(resolve => { started = resolve; });
  sync.store.backup = async (...args) => {
    const result = await original(...args); started();
    await new Promise(resolve => { release = resolve; }); return result;
  };
  const importing = sync.importProfile({ player: 'Old owner backup' });
  await waiting;
  auth.switch('user-two'); await sync.activate('user-two'); release();
  await assert.rejects(importing, { code: 'stale_session' });
  assert.equal(sync.state().owner, 'user-two');
  assert.equal((await sync.store.get('user-two')).pending.length, 0);
  assert.equal((await sync.store.get('user-one')).backups.length, 1);
});
