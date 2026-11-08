const { test } = require('node:test');
const assert = require('node:assert/strict');
const P = require('../geomayhem-progress.js');
const run = (level, extra = {}) => ({ mode: 'geomayhem', level, over: true, won: true, cleared: 20, kills: 100, ...extra });

test('campaign opens arenas sequentially and grants each run rewards only once', () => {
  let state = P.restore();
  assert.equal(P.unlocked(state, 1), true);
  assert.equal(P.unlocked(state, 2), false);
  assert.deepEqual(P.finish(state, 'skip', run(10)).state, state);
  for (let level = 1; level <= 20; level++) {
    const result = P.finish(state, `run${level}`, run(level));
    assert.equal(result.reward, 110);
    assert.equal(result.firstClear, true);
    assert.equal(result.state.cleared, level);
    assert.equal(result.state.best[level], 20);
    state = result.state;
    assert.deepEqual(P.finish(state, `run${level}`, run(level)).state, state);
  }
  assert.equal(P.unlocked(state, 21), false);
  const replay = P.finish(state, 'replay', run(1));
  assert.equal(replay.reward, 70);
  assert.equal(replay.firstClear, false);
  assert.equal(replay.state.cleared, 20);
});

test('losses and incomplete wins retain earned shards but cannot skip an arena', () => {
  const loss = P.finish(P.restore(), 'loss', run(1, { won: false, cleared: 3, kills: 25 }));
  assert.equal(loss.reward, 8);
  assert.equal(loss.state.cleared, 0);
  assert.equal(loss.state.best[1], 3);
  assert.equal(P.finish(loss.state, 'badwin', run(1, { cleared: 19 })).firstClear, false);
  assert.equal(P.finish(loss.state, 'exit', run(1, { over: false })).firstClear, false);
});

test('workshop purchases charge shards once per tier and stop at three', () => {
  let state = P.restore({ shards: 390, cleared: 8 });
  for (const remaining of [360, 240, 0]) {
    state = P.purchase(state, 'vitality');
    assert.equal(state.shards, remaining);
  }
  assert.equal(state.workshop.vitality, 3);
  assert.deepEqual(P.purchase(state, 'vitality'), state);
  assert.deepEqual(P.purchase(state, 'power'), state);
  assert.deepEqual(P.purchase(state, 'invented'), state);
  assert.equal(P.starterRequirement(0), 0);
  assert.equal(P.starterRequirement(5), 1);
  assert.equal(P.starterRequirement(43), 8);
});

test('campaign saves survive reload and remain separate for each profile', () => {
  const data = new Map(), storage = { getItem: k => data.get(k), setItem: (k, v) => data.set(k, v) };
  const guest = new P.Store('guest', storage);
  guest.finish('win', run(1));
  assert.equal(new P.Store('guest', storage).read().cleared, 1);
  const account = new P.Store('account:another', storage);
  assert.equal(account.read().cleared, 0);
  account.finish('loss', run(1, { won: false, cleared: 2 }));
  assert.equal(guest.read().cleared, 1);
  const broken = new P.Store('guest', { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } });
  assert.equal(broken.available, false);
  broken.finish('win', run(1));
  assert.equal(broken.read().cleared, 1);
});

test('later workshop tiers require arena milestones without revoking purchased upgrades', () => {
  let state = P.restore({ shards: 2000, cleared: 1 });
  state = P.purchase(state, 'power');
  assert.equal(state.workshop.power, 1);
  assert.deepEqual(P.purchase(state, 'power'), state);
  state.cleared = 4;
  state = P.purchase(state, 'power');
  assert.equal(state.workshop.power, 2);
  assert.deepEqual(P.purchase(state, 'power'), state);
  state.cleared = 8;
  state = P.purchase(state, 'power');
  assert.equal(state.workshop.power, 3);
  assert.equal(P.restore({ cleared: 1, workshop: { power: 3 } }).workshop.power, 3);
});


test('old completed campaigns keep every upgrade and open arena eleven', () => {
  const legacy = { cleared: 10, shards: 420, runs: 37, best: { 10: 20 }, workshop: { power: 3 }, finished: ['old'] };
  const state = P.restore(legacy);
  assert.equal(state.cleared, 10);
  assert.equal(state.shards, 420);
  assert.equal(state.runs, 37);
  assert.equal(state.workshop.power, 3);
  assert.equal(state.best[10], 20);
  assert.equal(state.best[11], 0);
  assert.equal(P.unlocked(state, 11), true);
  assert.equal(P.unlocked(state, 12), false);
  assert.equal(P.finish(state, 'new', run(11)).state.cleared, 11);
});
