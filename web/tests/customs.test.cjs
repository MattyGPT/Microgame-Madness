const { test } = require('node:test');
const assert = require('node:assert/strict');
const Customs = require('../customs.js');
const { catalog: achievements } = require('../achievements.js');

test('132 distinct Customs use achievements or shop purchases and retain Cubie’s face', () => {
  assert.equal(Customs.catalog.length, 132);
  assert.equal(new Set(Customs.catalog.map(item => item.id)).size, 132);
  assert.equal(new Set(Customs.catalog.map(item => item.body + item.detail)).size, 132);
  for (const item of Customs.catalog) {
    for (const id of item.achievements) assert.ok(achievements.some(a => a.id === id), id);
    assert.match(Customs.svg(item), /class="cubie-eyes"/);
    assert.match(Customs.svg(item), /class="cubie-smile"/);
    assert.equal(Customs.unlocked(item, {}), item.id === 'classic');
    assert.ok(item.achievements.length || item.price > 0);
    assert.ok(item.flavor);
  }
});

test('TON 618 requires a flawless Core victory and recognizes saved achievements', () => {
  const { Tracker } = require('../achievements.js');
  const item = Customs.catalog.find(item => item.id === 'ton_618');
  assert.equal(item.tier, 'empyrorite');
  const tracker = new Tracker();
  const win = damage => {
    tracker.start('singularity', 'gravitron');
    tracker.observe({ mode: 'singularity', difficulty: 'gravitron', over: true,
      won: true, attacks_completed: 15, hp: 0, shielded: false, lives: 10, damage_taken: damage });
  };
  win(1);
  assert.equal(Customs.unlocked(item, tracker.data.unlocked), false);
  win(0);
  const restored = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
  assert.equal(Customs.unlocked(item, restored.data.unlocked), true);
  assert.equal(Customs.selected('ton_618', restored.data.unlocked).id, 'ton_618');
});

test('Rainbow Phantom King requires a no-hit Pumpkin victory even after healing', () => {
  const { Tracker } = require('../achievements.js');
  const item = Customs.catalog.find(item => item.id === 'phantom_king');
  assert.equal(item.tier, 'rainbow');
  assert.equal(achievements.find(a => a.id === 'pumpkin_flawless').tier, 'diamond');
  for (const difficulty of ['baby', 'coward', 'phase2', 'come_on']) {
    const tracker = new Tracker();
    const finish = (won, damage) => {
      tracker.start('pumpkin', difficulty);
      tracker.observe({ mode: 'pumpkin', difficulty, over: true, won,
        lives: 15, max_lives: 15, damage_taken: damage });
    };
    finish(true, 1);
    assert.equal(Customs.unlocked(item, tracker.data.unlocked), false);
    finish(false, 0);
    assert.equal(Customs.unlocked(item, tracker.data.unlocked), false);
    finish(true, 0);
    const restored = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
    assert.equal(Customs.selected('phantom_king', restored.data.unlocked).id, 'phantom_king');
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

test('Codex Cubie unlocks once from its rainbow arcade-name achievement', () => {
  const { Tracker } = require('../achievements');
  const tracker = new Tracker();
  const custom = Customs.catalog.find(c => c.id === 'codex');
  assert.equal(custom.tier, 'rainbow');
  assert.equal(Customs.selected('codex', tracker.data.unlocked).id, 'classic');
  assert.deepEqual(tracker.secret('codexisthebest').earned.map(a => a.id), ['name_codexisthebest']);
  assert.equal(tracker.score, 2430);
  assert.equal(Customs.selected('codex', tracker.data.unlocked).id, 'codex');
  const restored = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
  assert.equal(restored.secret('codexisthebest').changed, false);
});


test('Boss Cubie unlocks at ten Boss Crush wins, including saved progress', () => {
  const { Tracker } = require('../achievements');
  const custom = Customs.catalog.find(c => c.id === 'boss');
  const tracker = new Tracker({ stats: { bossWins: 9 } });
  tracker.visit();
  assert.equal(Customs.unlocked(custom, tracker.data.unlocked), false);
  tracker.start('boss', 'mean');
  tracker.observe({ mode: 'boss', difficulty: 'mean', over: true, won: true, damage_taken: 1 });
  assert.equal(Customs.unlocked(custom, tracker.data.unlocked), true);
  const returning = new Tracker({ stats: { bossWins: 10 } });
  returning.visit();
  assert.equal(Customs.selected('boss', returning.data.unlocked).id, 'boss');
  assert.equal(custom.tier, 'crystal');
  assert.match(custom.flavor, /dry erase marker/);
});

test('Forever Friend unlocks at 1000 cumulative pets, persists, and migrates existing pet counts', () => {
  const { Tracker } = require('../achievements.js');
  const item = Customs.catalog.find(c => c.id === 'forever_friend');
  assert.equal(item.tier, 'empyrorite');
  assert.equal(item.price, undefined);
  let tracker = new Tracker({ stats: { cubePets: 998 } });
  tracker.visit();
  tracker.secret('cube');
  assert.equal(Customs.selected(item.id, tracker.data.unlocked).id, 'classic');
  tracker = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
  const awards = tracker.secret('cube').earned.map(a => a.id);
  assert.ok(awards.includes('cube_pet_1000'));
  assert.equal(Customs.selected(item.id, tracker.data.unlocked).id, item.id);
  const stamp = tracker.data.unlocked.cube_pet_1000;
  const score = tracker.score;
  tracker = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
  tracker.visit();
  assert.ok(!tracker.secret('cube').earned.some(a => a.id === 'cube_pet_1000'));
  assert.equal(tracker.score, score);
  assert.equal(tracker.data.unlocked.cube_pet_1000, stamp);
  for (const pets of [1000, 1200]) {
    const old = new Tracker({ stats: { cubePets: pets } });
    assert.ok(old.visit().earned.some(a => a.id === 'cube_pet_1000'));
    assert.equal(Customs.selected(item.id, old.data.unlocked).id, item.id);
  }
});

test('Singularity Cubie unlocks only from a completed one-HP Core victory and persists', () => {
  const { Tracker } = require('../achievements.js');
  const item = Customs.catalog.find(c => c.id === 'singularity');
  for (const [mode, lives, won, expected] of [
    ['singularity', 2, true, false], ['singularity', 0, false, false],
    ['core_practice', 1, true, false], ['singularity', 1, true, true],
  ]) {
    const tracker = new Tracker();
    const difficulty = mode === 'singularity' ? 'gravitron' : 'orbital_saws';
    tracker.start(mode, difficulty);
    tracker.observe({ mode, difficulty, over: true, won, lives, hp: 0,
      shielded: false, attacks_completed: 15, damage_taken: 9 });
    const restored = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
    assert.equal(Customs.unlocked(item, restored.data.unlocked), expected);
  }
});
