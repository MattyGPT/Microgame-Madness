const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Tracker, catalog } = require('../achievements.js');

const id = 'dodge_early_death';
const death = { mode: 'dodge', difficulty: 'easy', over: true, won: false, elapsed: 4.999 };

test('At Least You Tried is bronze, unlocks on any difficulty under five seconds, and persists once', () => {
  const item = catalog.find(item => item.id === id);
  assert.equal(item.title, 'At Least You Tried');
  assert.equal(item.tier, 'bronze');
  for (const difficulty of ['easy', 'normal', 'hard', 'merciless']) {
    let tracker = new Tracker();
    tracker.start('dodge', difficulty);
    const before = tracker.score;
    const state = { ...death, difficulty };
    assert.deepEqual(tracker.observe(state).earned.map(item => item.id), [id]);
    assert.equal(tracker.score, before + 10);
    assert.equal(tracker.observe(state).changed, false);
    const date = tracker.data.unlocked[id];
    tracker = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
    tracker.start('dodge', difficulty);
    assert.deepEqual(tracker.observe(state).earned, []);
    assert.equal(tracker.data.unlocked[id], date);
    assert.equal(tracker.score, before + 10);
  }
});

test('early death requires a real loss in the active Turtle Dodge round with a valid time below five', () => {
  for (const update of [{ elapsed: 5 }, { elapsed: 5.001 }, { elapsed: 12 },
    { elapsed: undefined }, { elapsed: null }, { elapsed: -1 }, { elapsed: NaN },
    { elapsed: Infinity }, { elapsed: '4' }, { over: false }, { won: true },
    { won: undefined }, { mode: 'boss' }, { difficulty: 'hard' }]) {
    const tracker = new Tracker();
    tracker.start('dodge', 'easy');
    tracker.observe({ ...death, ...update });
    assert.equal(tracker.data.unlocked[id], undefined);
  }
  const tracker = new Tracker();
  tracker.observe(death);
  assert.equal(tracker.data.unlocked[id], undefined);
  tracker.start('dodge', 'easy');
  tracker.abandon();
  tracker.observe(death);
  assert.equal(tracker.data.unlocked[id], undefined);
});
