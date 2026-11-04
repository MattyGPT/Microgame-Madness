const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Tracker, catalog, attackRewards } = require('../achievements');
const Customs = require('../customs');

function snapshot(reward, mode, difficulty, completed, extra = {}) {
  const attack_survivals = Array(reward.family === 'core' ? 15 : 7).fill(0);
  attack_survivals[reward.index] = completed;
  return { mode, difficulty, attack_survivals, over: false, won: false, ...extra };
}

test('all 22 attack medals unlock a distinct Cubie with the correct requirement and description', () => {
  assert.equal(attackRewards.length, 22);
  assert.equal(attackRewards.filter(r => r.family === 'pumpkin').length, 7);
  for (const reward of attackRewards) {
    const medal = catalog.find(a => a.id === reward.id);
    assert.equal(medal.target, reward.family === 'pumpkin' ? 10 : 3);
    assert.ok(medal.description.includes(reward.attack));
    if (reward.family === 'core') assert.doesNotMatch(medal.description, /temporary|loader|practice/i);
    const skins = Customs.catalog.filter(c => c.achievements.includes(reward.id));
    assert.equal(skins.length, 1);
    assert.equal(skins[0].name, reward.customName);
    assert.equal(Customs.unlocked(skins[0], {}), false);
    assert.equal(Customs.unlocked(skins[0], { [reward.id]: '2026-11-03' }), true);
  }
});

test('Pumpkin and Wrath survivals combine per attack across runs and reloads and award once at ten', () => {
  for (const reward of attackRewards.filter(r => r.family === 'pumpkin')) {
    let tracker = new Tracker();
    tracker.start('pumpkin', 'baby');
    const first = snapshot(reward, 'pumpkin', 'baby', 4);
    tracker.observe(first);
    assert.equal(tracker.observe(first).changed, false);
    tracker = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
    tracker.start('wrath', reward.key);
    tracker.observe(snapshot(reward, 'wrath', reward.key, 5));
    assert.equal(tracker.data.stats[reward.id], 9);
    assert.equal(tracker.data.unlocked[reward.id], undefined);
    tracker.abandon();
    tracker.start('wrath', 'random_order');
    const final = snapshot(reward, 'wrath', 'random_order', 1);
    assert.ok(tracker.observe(final).earned.some(a => a.id === reward.id));
    assert.equal(tracker.data.stats[reward.id], 10);
    assert.equal(tracker.observe(final).changed, false);
    const date = tracker.data.unlocked[reward.id];
    tracker.observe(snapshot(reward, 'wrath', 'random_order', 2));
    assert.equal(tracker.data.unlocked[reward.id], date);
    for (const other of attackRewards.filter(r => r.family === 'pumpkin' && r.id !== reward.id))
      assert.equal(tracker.data.stats[other.id], 0);
  }
});

test('every Core attack combines full-fight and loader survivals, without granting full-fight medals', () => {
  for (const reward of attackRewards.filter(r => r.family === 'core')) {
    let tracker = new Tracker();
    tracker.start('singularity', 'gravitron');
    tracker.observe(snapshot(reward, 'singularity', 'gravitron', 1));
    tracker = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
    tracker.start('core_practice', reward.key);
    tracker.observe(snapshot(reward, 'core_practice', reward.key, 1));
    assert.equal(tracker.data.stats[reward.id], 2);
    assert.equal(tracker.data.unlocked[reward.id], undefined);
    const third = snapshot(reward, 'core_practice', reward.key, 2);
    assert.ok(tracker.observe(third).earned.some(a => a.id === reward.id));
    assert.equal(tracker.observe(third).changed, false);
    tracker.observe({ ...third, over: true, won: true, attacks_completed: 15, damage_taken: 0, hp: 0, shielded: false });
    for (const stat of ['coreWins', 'coreProtocolsBest', 'coreFlawlessWins', 'totalLosses'])
      assert.equal(tracker.data.stats[stat], 0);
    const restored = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
    assert.equal(restored.data.stats[reward.id], 3);
    assert.ok(restored.data.unlocked[reward.id]);
  }
});

test('no survival is invented for starts, aborted rounds, losses, finale replay, or missing counters', () => {
  const reward = attackRewards.find(r => r.family === 'core');
  const tracker = new Tracker({ stats: { coreWins: 8, coreProtocolsBest: 15 } });
  assert.equal(tracker.data.stats[reward.id], 0);
  tracker.start('core_practice', reward.key);
  tracker.observe({ mode: 'core_practice', difficulty: reward.key, over: true, won: false });
  tracker.start('core_practice', reward.key);
  tracker.abandon();
  tracker.observe(snapshot(reward, 'core_practice', reward.key, 3));
  tracker.start('core_practice', 'final_cutscene');
  tracker.observe(snapshot(reward, 'core_practice', 'final_cutscene', 3, { over: true, won: true }));
  tracker.start('core_practice', reward.key);
  tracker.observe(snapshot(reward, 'singularity', 'gravitron', 3));
  tracker.observe({ mode: 'core_practice', difficulty: reward.key, attack_survivals: [3] });
  for (const value of [-1, NaN, Infinity, '3', null])
    tracker.observe(snapshot(reward, 'core_practice', reward.key, value));
  assert.equal(tracker.data.stats[reward.id], 0);
  assert.equal(tracker.data.unlocked[reward.id], undefined);
});

test('rewound or repeated counter snapshots never count the same completion again', () => {
  const reward = attackRewards[0];
  const tracker = new Tracker();
  tracker.start('pumpkin', 'baby');
  for (const value of [2, 2, 0, 1, 2, 3]) tracker.observe(snapshot(reward, 'pumpkin', 'baby', value));
  assert.equal(tracker.data.stats[reward.id], 3);
});
