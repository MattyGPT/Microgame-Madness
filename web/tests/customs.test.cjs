const { test } = require('node:test');
const assert = require('node:assert/strict');
const Customs = require('../customs.js');
const { catalog: achievements } = require('../achievements.js');

test('78 distinct Customs use achievements or shop purchases and retain Cubie’s face', () => {
  assert.equal(Customs.catalog.length, 78);
  assert.equal(new Set(Customs.catalog.map(item => item.id)).size, 78);
  assert.equal(new Set(Customs.catalog.map(item => item.body + item.detail)).size, 78);
  for (const item of Customs.catalog) {
    for (const id of item.achievements) assert.ok(achievements.some(a => a.id === id), id);
    assert.match(Customs.svg(item), /class="cubie-eyes"/);
    assert.match(Customs.svg(item), /class="cubie-smile"/);
    assert.equal(Customs.unlocked(item, {}), item.id === 'classic');
    assert.ok(item.achievements.length || item.price > 0);
    assert.ok(item.flavor);
  }
});

test('Pumpkin Cubie unlocks from a victory in any of the four Pumpkin modes', () => {
  const pumpkin = Customs.catalog.find(item => item.id === 'pumpkin');
  for (const id of ['pumpkin_baby', 'pumpkin_coward', 'pumpkin_phase2', 'pumpkin_come_on'])
    assert.equal(Customs.unlocked(pumpkin, { [id]: '2026-11-03' }), true);
  assert.equal(Customs.unlocked(pumpkin, { play_pumpkin: '2026-11-03', wrath_color_memory: '2026-11-03' }), false);
});

test('saved Customs are validated against earned medals', () => {
  for (const value of [null, undefined, 'missing', 'pumpkin', '__proto__'])
    assert.equal(Customs.selected(value, {}).id, 'classic');
  assert.equal(Customs.selected('pumpkin', { pumpkin_baby: '2026-11-03' }).id, 'pumpkin');
});

test('tier Customs require the exact earned-medal thresholds, persist, and never count themselves', () => {
  const { Tracker, points } = require('../achievements.js');
  for (const [tier, target] of [['gold', 10], ['silver', 15], ['bronze', 20],
    ['crystal', 5], ['diamond', 3], ['rainbow', 2], ['empyrorite', 1]]) {
    const candidates = achievements.filter(a => a.tier === tier && !a.collectionTier);
    assert.ok(candidates.length >= target, tier);
    const custom = Customs.catalog.find(c => c.id === 'medal_' + tier);
    const medal = achievements.find(a => a.id === 'collect_' + tier);
    assert.equal(medal.target, target);
    const date = '2026-11-03T12:00:00.000Z';
    const unlocked = Object.fromEntries(candidates.slice(0, target - 1).map(a => [a.id, date]));
    const tracker = new Tracker({ unlocked, stats: { [medal.stat]: 999 } });
    tracker.update(() => {});
    assert.equal(tracker.progress(medal), target - 1);
    assert.equal(Customs.unlocked(custom, tracker.data.unlocked), false);
    tracker.data.unlocked[candidates[target - 1].id] = date;
    const before = tracker.score;
    assert.deepEqual(tracker.update(() => {}).earned.map(a => a.id), [medal.id]);
    assert.equal(tracker.score - before, points[tier]);
    assert.equal(Customs.unlocked(custom, tracker.data.unlocked), true);
    const restored = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
    assert.equal(restored.update(() => {}).changed, false);
    assert.equal(restored.score, tracker.score);
    assert.equal(restored.progress(medal), target);
    assert.equal(Customs.selected(custom.id, restored.data.unlocked).id, custom.id);
    const selfOnly = new Tracker({ unlocked: { [medal.id]: date } });
    assert.equal(selfOnly.progress(medal), 0);
  }
});

test('a threshold-crossing game event awards a collector immediately, including old profiles', () => {
  const { Tracker } = require('../achievements.js');
  const date = '2026-11-03T12:00:00.000Z';
  const seeds = achievements.filter(a => a.tier === 'crystal' && !a.collectionTier && a.id !== 'dingdong').slice(0, 4);
  const tracker = new Tracker({ unlocked: Object.fromEntries(seeds.map(a => [a.id, date])) });
  assert.deepEqual(tracker.secret('dingdong').earned.map(a => a.id), ['dingdong', 'collect_crystal']);
  const legacy = new Tracker({ unlocked: Object.fromEntries([...seeds, { id: 'dingdong' }].map(a => [a.id, date])) });
  assert.ok(legacy.visit().earned.some(a => a.id === 'collect_crystal'));
  assert.equal(legacy.data.unlocked.dingdong, date);
});

test('Gaster Cubie requires completing the event, not just entering the name', () => {
  const { Tracker } = require('../achievements.js');
  const tracker = new Tracker();
  const custom = Customs.catalog.find(c => c.id === 'gaster');
  tracker.secret('gaster');
  assert.equal(Customs.unlocked(custom, tracker.data.unlocked), false);
  tracker.completeGaster();
  assert.equal(Customs.unlocked(custom, tracker.data.unlocked), true);
});
