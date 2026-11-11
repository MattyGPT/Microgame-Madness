const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Client, difficulties } = require('../leaderboards.js');

const config = { url: 'https://arcade.supabase.co', key: 'sb_publishable_example' };
const session = { access_token: 'access', refresh_token: 'refresh', expires_in: 3600, user: { id: 'player-one' } };
const entry = { mode: 'hangman', difficulty: 'easy', player: 'Cubie', score: 7 };
function storage() {
  const values = new Map([['microgame-madness.v1', '{"player":"Original","achievements":{"wins":10}}']]);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
function response(data, status = 200) { return new Response(JSON.stringify(data), { status }); }

test('legacy pending scores cannot be replayed as a different account or guest', async () => {
  const client = new Client(config, { storage: storage(), fetch: async () => { throw new Error('offline'); } });
  let user = { id: 'original-guest', is_anonymous: true };
  client.accountSession = { snapshot: () => ({ user }), ensureAnonymous: async () => user, token: async () => 'token' };
  await assert.rejects(client.submit(entry));
  assert.equal(client.pendingOwner, 'original-guest');
  user = { id: 'permanent-account', is_anonymous: false };
  await assert.rejects(client.flush(), /account synchronization/);
  user = { id: 'different-guest', is_anonymous: true };
  await assert.rejects(client.flush(), /another guest identity/);
  assert.equal(Object.keys(client.pending).length, 1);
});

test('every mode can be browsed without signing up or changing the existing profile', async () => {
  const store = storage(), original = store.getItem('microgame-madness.v1'), calls = [];
  const client = new Client(config, { storage: store, fetch: async (url, options) => {
    calls.push({ url, options });
    return response([{ rank: 1, player: 'World champion', score: 10, is_you: false }]);
  } });
  for (const [mode, values] of Object.entries(difficulties)) for (const difficulty of values)
    assert.equal((await client.list(mode, difficulty))[0].player, 'World champion');
  assert.equal(calls.length, Object.values(difficulties).flat().length);
  assert.ok(calls.every(call => call.url.endsWith('/rpc/get_leaderboard')));
  assert.ok(calls.every(call => !call.options.headers.Authorization));
  assert.equal(store.getItem('microgame-madness.v1'), original);
  assert.equal(store.values.size, 1);
});

test('completed rounds create one guest identity and submit authenticated scores without touching local progress', async () => {
  const store = storage(), original = store.getItem('microgame-madness.v1'), calls = [];
  const client = new Client(config, { storage: store, fetch: async (url, options) => {
    calls.push({ url, ...options, body: JSON.parse(options.body) });
    return response(url.includes('/auth/') ? session : 7);
  } });
  await client.submit(entry);
  await client.submit({ ...entry, score: 6 });
  assert.equal(calls.filter(call => call.url.includes('/auth/')).length, 1);
  assert.equal(calls[1].headers.Authorization, 'Bearer access');
  assert.match(calls[1].body.p_run_id, /^[0-9a-f-]{36}$/);
  assert.deepEqual(calls[1].body, { p_run_id: calls[1].body.p_run_id, p_mode: 'hangman', p_difficulty: 'easy', p_player: 'Cubie', p_score: 7 });
  assert.deepEqual(client.pending, {});
  assert.equal(store.getItem('microgame-madness.v1'), original);
  assert.equal(new Client(config, { storage: store }).session.user_id, 'player-one');
});

test('failed submissions survive reload and retry under the same identity, retaining every round', async () => {
  const store = storage();
  const client = new Client(config, { storage: store, fetch: async url => response(url.includes('/auth/') ? session : {}, url.includes('/auth/') ? 200 : 503) });
  await assert.rejects(client.submit(entry), /unavailable/);
  await assert.rejects(client.submit({ ...entry, score: 3 }), /unavailable/);
  assert.deepEqual(Object.values(client.pending).map(row => row.score), [7, 3]);
  const ids = Object.keys(client.pending);
  const calls = [];
  const reloaded = new Client(config, { storage: store, fetch: async (url, options) => {
    calls.push({ url, options });
    return response(7);
  } });
  await reloaded.flush();
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(call => JSON.parse(call.options.body).p_run_id), ids);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer access');
  assert.equal(JSON.parse(calls[0].options.body).p_score, 7);
  assert.deepEqual(reloaded.pending, {});
  assert.deepEqual(new Client(config, { storage: store }).pending, {});
});

test('expired sessions refresh without replacing the player, and rejected refreshes keep the saved identity', async () => {
  const store = storage(), calls = [];
  let now = 100000;
  const client = new Client(config, { storage: store, now: () => now, fetch: async (url, options) => {
    calls.push({ url, options });
    return response(url.includes('/auth/') ? session : 7);
  } });
  await client.submit(entry);
  now += 4000000;
  await client.submit(entry);
  assert.ok(calls[2].url.endsWith('/token?grant_type=refresh_token'));
  assert.deepEqual(JSON.parse(calls[2].options.body), { refresh_token: 'refresh' });
  const reloaded = new Client(config, { storage: store, now: () => now + 4000000, fetch: async url => {
    assert.ok(url.includes('/token?grant_type=refresh_token'));
    return response({}, 401);
  } });
  await assert.rejects(reloaded.submit(entry));
  assert.equal(reloaded.session.user_id, 'player-one');
  assert.equal(reloaded.session.refresh_token, 'refresh');
  assert.equal(Object.keys(reloaded.pending).length, 1);
});

test('a better score arriving during a submission is sent next and never lost', async () => {
  const posted = [];
  let release, entered;
  const waiting = new Promise(resolve => { entered = resolve; });
  const client = new Client(config, { storage: storage(), fetch: async (url, options) => {
    if (url.includes('/auth/')) return response(session);
    const score = JSON.parse(options.body).p_score;
    posted.push(score);
    if (posted.length === 1) {
      entered();
      await new Promise(resolve => { release = resolve; });
    }
    return response(score);
  } });
  const first = client.submit({ ...entry, score: 3 });
  await waiting;
  const second = client.submit({ ...entry, score: 9 });
  release();
  await Promise.all([first, second]);
  assert.deepEqual(posted, [3, 9]);
  assert.deepEqual(client.pending, {});
});

test('blocked storage, offline servers, and absent configuration never erase local profiles', async () => {
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const client = new Client(config, { storage: blocked, fetch: async url => response(url.includes('/auth/') ? session : 7) });
  await client.submit(entry);
  assert.equal(client.session.user_id, 'player-one');
  let calls = 0;
  const unconfigured = new Client({}, { storage: storage(), fetch: async () => { calls++; } });
  assert.equal(await unconfigured.submit(entry), false);
  await assert.rejects(unconfigured.list('hangman', 'easy'), /aren’t connected/);
  assert.equal(calls, 0);
});

test('invalid submissions and malformed rankings are rejected', async () => {
  const client = new Client(config, { storage: storage(), fetch: async () => response([{ rank: 1, player: '<script>', score: -1 }]) });
  for (const update of [{ score: -1 }, { score: 1.5 }, { score: Infinity }, { score: 11 },
    { mode: 'unknown' }, { difficulty: 'unknown' }, { player: '' }, { player: 'x'.repeat(25) }, { player: 'Hi\nthere' }])
    await assert.rejects(client.submit({ ...entry, ...update }), /Invalid leaderboard/);
  await assert.rejects(client.list('hangman', 'easy'), /could not be loaded/);
});

test('combined leaderboard requests a game without a difficulty and keeps pagination and account identity', async () => {
  const calls=[];
  const client=new Client(config,{storage:storage(),fetch:async (url,options)=>{
    calls.push({url,body:JSON.parse(options.body),headers:options.headers});
    return response([{rank:11,player:'Combined',score:39,is_you:true}]);
  }});
  client.accountSession={snapshot:()=>({user:{id:'account'}}),token:async ()=>'account-token'};
  assert.equal((await client.listGame('hangman',{season:'spring',offset:10,aroundMe:true}))[0].score,39);
  assert.equal(calls[0].url,config.url+'/rest/v1/rpc/get_game_leaderboard');
  assert.deepEqual(calls[0].body,{p_mode:'hangman',p_season:'spring',p_offset:10,p_limit:10,p_around_me:true});
  assert.equal(calls[0].headers.Authorization,'Bearer account-token');
  await assert.rejects(client.listGame('invalid'),/Unknown game/);
});
