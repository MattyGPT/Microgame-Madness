const test = require('node:test');
const assert = require('node:assert/strict');
const { App } = require('../accounts/app.js');

test('queued gameplay cannot cross an account generation change', async () => {
  let release, writes = 0;
  const app = Object.create(App.prototype);
  app.chain = new Promise(resolve => { release = resolve; });
  app.ready = Promise.resolve();
  app.message = () => {};
  app.controller = { generation: 2, enqueue: async () => { writes++; } };
  const operation = app.enqueue('arcade', { event: 'visit' });
  app.controller.generation = 3;
  release();
  await assert.rejects(operation, /active profile changed/);
  assert.equal(writes, 0);
});

test('identity loss during a profile action is isolated once the action ends', async () => {
  const app = Object.create(App.prototype);
  const activated = [];
  let interrupted = 0;
  app.ready = app.chain = Promise.resolve();
  app.nodes = { panel: { setAttribute() {}, removeAttribute() {} } };
  app.message = app.render = app.applyCurrent = app.loadHistory = () => {};
  app.onIdentityLoss = () => { interrupted++; };
  app.session = { snapshot: () => ({ user: null }) };
  app.controller = { state: () => ({ owner: 'former-owner' }),
    activate: async owner => { activated.push(owner); } };
  await app.action(async () => { assert.equal(app.isolateChangedIdentity(), false); });
  assert.deepEqual(activated, ['guest']);
  assert.equal(interrupted, 1);
});

test('preferences and purchases queued before sign-out do not mutate the next owner', async () => {
  let release, writes = 0;
  const app = Object.create(App.prototype);
  app.initialized = true;
  app.chain = new Promise(resolve => { release = resolve; });
  app.message = () => {};
  app.controller = { generation: 1, enqueue: async () => { writes++; } };
  const purchase = app.purchase('example');
  app.preferences({ player: 'Former player' });
  app.controller.generation++;
  release();
  await assert.rejects(purchase, /active profile changed/);
  await app.chain;
  assert.equal(writes, 0);
});

test('a server-rejected purchase is not reported as owned', async t => {
  const app = Object.create(App.prototype);
  app.chain = Promise.resolve();
  app.session = { snapshot: () => ({ user: { id: 'account', is_anonymous: false } }) };
  app.controller = { generation: 1, enqueue: async () => {}, flush: async () => {},
    state: () => ({ owner: 'account', pending: 0, profile: { shop: { owned: [] } } }) };
  app.applyCurrent = () => {};
  global.navigator ||= { onLine: true };
  const previous = Object.getOwnPropertyDescriptor(global.navigator, 'onLine');
  Object.defineProperty(global.navigator, 'onLine', { value: true, configurable: true });
  t.after(() => {
    if (previous) Object.defineProperty(global.navigator, 'onLine', previous);
    else delete global.navigator.onLine;
  });
  await assert.rejects(app.purchase('item'), /purchase was not accepted/);
});

test('a delayed preference update waits for newer gameplay before applying the profile', async () => {
  let releaseSetting, releaseGameplay, settingStarted, gameplayStarted;
  const settingGate = new Promise(resolve => { releaseSetting = resolve; });
  const gameplayGate = new Promise(resolve => { releaseGameplay = resolve; });
  const startedSetting = new Promise(resolve => { settingStarted = resolve; });
  const startedGameplay = new Promise(resolve => { gameplayStarted = resolve; });
  const app = Object.create(App.prototype);
  const profile = { preferenceRevisions: {}, unlocked: false };
  app.chain = app.ready = Promise.resolve();
  app.message = () => {};
  const applied = [];
  app.applyCurrent = () => applied.push(profile.unlocked);
  app.controller = { generation: 1, state: () => ({ profile }), enqueue: async kind => {
    if (kind === 'settings') { settingStarted(); await settingGate; }
    else { gameplayStarted(); await gameplayGate; profile.unlocked = true; }
  } };
  const preference = app.setting({ soundOn: false });
  await startedSetting;
  const gameplay = app.enqueue('arcade', { event: 'secret', name: 'rocknroy' });
  assert.equal(app.queuedWrites, 2);
  releaseSetting();
  await startedGameplay;
  assert.deepEqual(applied, []);
  releaseGameplay();
  await Promise.all([preference, gameplay]);
  assert.deepEqual(applied, [true]);
  assert.equal(app.queuedWrites, 0);
});

test('registration preserves its one-time recovery code if cloud activation fails and clears passwords', async () => {
  const app = Object.create(App.prototype);
  const fields = Object.fromEntries(['auth-form', 'handle', 'password', 'confirm', 'recovery', 'recovery-code', 'recovery-step'].map(id => [id, {
    value: '', hidden: true, reportValidity: () => true, hasAttribute: () => false, focus() {}, select() {},
  }]));
  fields.handle.value = 'new_player';
  fields.password.value = fields.confirm.value = 'Unique password 42!';
  const root = { querySelector: selector => fields[selector.replace('#account-', '')],
    querySelectorAll: selector => selector === '[data-password]' ? [] : [fields.password, fields.confirm, fields.recovery] };
  app.nodes = { panel: root }; app.config = { url: 'https://example.test', key: 'public' };
  let registered = false;
  app.session = { register: async () => { registered = true; return { recoveryCode: 'one-time-secret' }; }, snapshot: () => ({ user: { id: 'owner' } }) };
  app.controller = { activate: async (_owner, options) => {
    assert.equal(options.bindGuest, true);
    assert.equal(fields['recovery-code'].value, 'one-time-secret');
    throw new Error('Network interrupted');
  } };
  await assert.rejects(app.authenticate('register'), /Network interrupted/);
  assert.equal(registered, true);
  assert.equal(fields['recovery-code'].value, 'one-time-secret');
  assert.equal(fields['recovery-step'].hidden, false);
  assert.equal(fields.password.value, '');
  assert.equal(fields.confirm.value, '');
});

test('handle defaults wait for guest import and preserve an existing display nickname', async () => {
  const app = Object.create(App.prototype), changes = [];
  const state = { importRequired: true, profile: { player: 'Player' } };
  app.registrationHandle = 'new_player';
  app.controller = { state: () => state };
  app.setting = async value => { changes.push(value); };
  await app.defaultHandle();
  assert.equal(app.registrationHandle, 'new_player');
  assert.deepEqual(changes, []);
  state.importRequired = false; state.profile.player = 'Guest Nickname';
  await app.defaultHandle();
  assert.deepEqual(changes, []);
  state.profile.player = 'Player';
  await app.defaultHandle('another_player');
  assert.deepEqual(changes, [{ player: 'another_player' }]);
});
