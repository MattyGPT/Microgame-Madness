const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Client, optedOut, VISITOR_KEY } = require('../usage.js');

const config = { url: 'https://arcade.supabase.co', key: 'sb_publishable_example' };

function storage() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
function windowStub() {
  const handlers = new Map();
  return { handlers, addEventListener: (type, handler) => handlers.set(type, handler),
    removeEventListener: type => handlers.delete(type), emit: type => handlers.get(type)?.({}) };
}
function recorder(calls, { status = 200, offline = false } = {}) {
  return async (url, options) => {
    calls.push({ url, ...options, body: JSON.parse(options.body) });
    if (offline) throw new Error('offline');
    return new Response(JSON.stringify(calls.length), { status });
  };
}
function client(overrides = {}) {
  const calls = [];
  const usage = new Client(config, { storage: storage(), fetch: recorder(calls),
    events: windowStub(), navigator: {}, setTimeout: () => ({}), clearTimeout: () => {}, ...overrides });
  return { usage, calls, storage: usage.storage, events: usage.events };
}
function session(initial = null) {
  const listeners = new Set();
  const state = { user: initial };
  return { state, snapshot: () => ({ user: state.user }),
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    emit: () => listeners.forEach(listener => listener({ user: state.user })) };
}

test('a page load reports one visit and nothing that identifies the player', async () => {
  const { usage, calls } = client();
  await usage.visit();
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith('/rest/v1/rpc/record_usage'));
  assert.equal(calls[0].headers.apikey, config.key);
  assert.equal(calls[0].headers.Authorization, undefined); // No token: no auth traffic for analytics.
  assert.equal(calls[0].keepalive, true);
  assert.deepEqual(calls[0].body, { p_visitor: usage.visitor, p_scope: 'guest',
    p_events: [{ kind: 'visit' }] });
  assert.match(usage.visitor, /^[0-9a-f]{32}$/);
  assert.equal(usage.storage.getItem(VISITOR_KEY), usage.visitor);
});

test('one browser keeps one visitor id across visits and never stores anything else', async () => {
  const store = storage();
  const options = { storage: store, events: windowStub(), navigator: {},
    setTimeout: () => ({}), clearTimeout: () => {} };
  const calls = [];
  const first = new Client(config, { ...options, fetch: recorder(calls) });
  const second = new Client(config, { ...options, fetch: recorder(calls) });
  await first.visit();
  await second.visit();
  assert.equal(calls[0].body.p_visitor, calls[1].body.p_visitor);
  assert.deepEqual([...store.values.keys()], [VISITOR_KEY]);
});

test('a do-not-track browser reports nothing and stores no id', async () => {
  for (const navigator of [{ doNotTrack: '1' }, { doNotTrack: 'yes' }, { globalPrivacyControl: true }]) {
    assert.equal(optedOut(navigator), true);
    const { usage, calls } = client({ navigator });
    await usage.visit();
    usage.play('hangman', 'easy');
    usage.finish('hangman', 'easy', 'win');
    assert.deepEqual(calls, []);
    assert.equal(usage.visitor, null);
    assert.deepEqual(usage.buffer, []);
    assert.equal(usage.storage.values.size, 0);
  }
  assert.equal(optedOut({ doNotTrack: '0' }), false);
});

test('an unconfigured build stays silent instead of failing gameplay', async () => {
  const calls = [];
  const usage = new Client({ url: '', key: '' }, { storage: storage(), fetch: recorder(calls),
    events: windowStub(), navigator: {}, setTimeout: () => ({}), clearTimeout: () => {} });
  await usage.visit();
  usage.play('hangman', 'easy');
  await usage.flush();
  assert.deepEqual(calls, []);
});

test('gameplay batches into one report when the page is hidden', async () => {
  const { usage, calls, events } = client();
  usage.play('hangman', 'easy');
  usage.finish('hangman', 'easy', 'win');
  usage.play('dodge', 'chaos');
  assert.deepEqual(calls, []); // Batched rather than one request per event.
  events.emit('pagehide');
  await usage.flushing;
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].body.p_events, [
    { kind: 'play', game: 'hangman', difficulty: 'easy' },
    { kind: 'finish', game: 'hangman', difficulty: 'easy', outcome: 'win' },
    { kind: 'play', game: 'dodge', difficulty: 'chaos' },
  ]);
  assert.deepEqual(usage.buffer, []);
});

test('events the server would reject are dropped client-side', () => {
  const { usage } = client();
  usage.play('tetris', 'easy');
  usage.finish('hangman', 'easy', 'crash');
  usage.event('purchase', { game: 'hangman' });
  assert.deepEqual(usage.buffer, []);
  // An unusable difficulty costs the label, not the play.
  usage.play('hangman', 'Hard Mode!');
  assert.deepEqual(usage.buffer, [{ kind: 'play', game: 'hangman' }]);
  usage.buffer.length = 0;
  usage.finish('keyboard', 'progressive', 'loss');
  assert.deepEqual(usage.buffer, [{ kind: 'finish', game: 'keyboard', difficulty: 'progressive', outcome: 'loss' }]);
});

test('registering a guest and signing in to an account are told apart', async () => {
  const { usage, calls } = client();
  const auth = session({ id: 'guest-owner', is_anonymous: true });
  usage.attach(auth);
  await usage.visit();
  assert.equal(calls[0].body.p_scope, 'guest');
  // Registration converts the same anonymous owner in place.
  auth.state.user = { id: 'guest-owner', is_anonymous: false, handle: 'cubie' };
  auth.emit();
  assert.deepEqual(usage.buffer, [{ kind: 'register' }]);
  // A token refresh for the same account is not another login.
  auth.emit();
  assert.deepEqual(usage.buffer, [{ kind: 'register' }]);
  usage.play('boss', 'nightmare');
  await usage.flush();
  assert.equal(calls[1].body.p_scope, 'account');
  assert.deepEqual(calls[1].body.p_events, [{ kind: 'register' },
    { kind: 'play', game: 'boss', difficulty: 'nightmare' }]);
  // A different owner appearing is a credential sign-in.
  auth.state.user = { id: 'other-account', is_anonymous: false, handle: 'turtle' };
  auth.emit();
  assert.deepEqual(usage.buffer, [{ kind: 'login' }]);
  // Signing out clears attribution without reporting an event.
  auth.state.user = null;
  auth.emit();
  assert.deepEqual(usage.buffer, [{ kind: 'login' }]);
  assert.equal(usage.signedIn, false);
});

test('a cached session at page load is attributed to the account without a login event', async () => {
  const { usage, calls } = client();
  usage.attach(session({ id: 'returning-account', is_anonymous: false }));
  await usage.visit();
  assert.deepEqual(calls[0].body, { p_visitor: usage.visitor, p_scope: 'account',
    p_events: [{ kind: 'visit' }] });
});

test('a rejected or offline report is retried once and never throws into gameplay', async () => {
  let fail = true;
  const calls = [];
  const usage = new Client(config, { storage: storage(), events: windowStub(), navigator: {},
    setTimeout: () => ({}), clearTimeout: () => {},
    fetch: async (url, options) => {
      calls.push(JSON.parse(options.body));
      if (!fail) return new Response('2', { status: 200 });
      fail = false;
      return new Response('{}', { status: 503 });
    } });
  await usage.visit();
  assert.deepEqual(calls[0].p_events, [{ kind: 'visit' }]);
  usage.play('hangman', 'easy');
  await usage.flush();
  assert.deepEqual(calls[1].p_events, [{ kind: 'visit' },
    { kind: 'play', game: 'hangman', difficulty: 'easy' }]);
  assert.deepEqual(usage.buffer, []);

  const offline = new Client(config, { storage: storage(), events: windowStub(), navigator: {},
    setTimeout: () => ({}), clearTimeout: () => {}, fetch: recorder([], { offline: true }) });
  await offline.visit(); // Must resolve rather than reject.
  assert.deepEqual(offline.buffer, [{ kind: 'visit' }]);
});

test('timers are called bound to the global, as window timers require', async () => {
  const seen = [];
  const usage = new Client(config, { storage: storage(), fetch: recorder([]), events: windowStub(),
    navigator: {},
    setTimeout: function () { seen.push(['set', this === globalThis]); return { token: 1 }; },
    clearTimeout: function () { seen.push(['clear', this === globalThis]); } });
  usage.play('hangman', 'easy');
  await usage.flush();
  assert.deepEqual(seen, [['set', true], ['clear', true]]);
});

test('a throwing timer costs the interval flush but never the events', async () => {
  const calls = [];
  const illegal = () => { throw new TypeError('Illegal invocation'); };
  const usage = new Client(config, { storage: storage(), fetch: recorder(calls),
    events: windowStub(), navigator: {}, setTimeout: illegal, clearTimeout: illegal });
  // This is the browser path that must not throw into gameplay.
  usage.play('hangman', 'easy');
  usage.finish('hangman', 'easy', 'win');
  assert.deepEqual(usage.buffer, [{ kind: 'play', game: 'hangman', difficulty: 'easy' },
    { kind: 'finish', game: 'hangman', difficulty: 'easy', outcome: 'win' }]);
  await usage.flush();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.p_events.length, 2);
});

test('closing detaches listeners and drops the buffer', async () => {
  const { usage, calls, events } = client();
  usage.play('pumpkin', 'baby');
  assert.equal(events.handlers.size, 3);
  usage.close();
  assert.equal(events.handlers.size, 0);
  events.emit('pagehide');
  await usage.flush();
  assert.deepEqual(calls, []);
});
