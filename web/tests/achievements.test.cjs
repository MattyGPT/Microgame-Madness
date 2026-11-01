const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Tracker, catalog, points } = require('../achievements.js');
const ids = result => result.earned.map(item => item.id);
function finish(tracker, mode, difficulty, extra = {}) {
  tracker.start(mode, difficulty);
  return tracker.observe({ mode, difficulty, over: true, won: true, mistakes: 1, ...extra });
}

test('welcome is awarded once, points derive from medals, and saved profiles are normalized', () => {
  const tracker = new Tracker();
  assert.deepEqual(ids(tracker.visit()), ['welcome']);
  assert.equal(tracker.score, 10);
  assert.equal(tracker.visit().changed, false);
  const restored = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
  assert.equal(restored.visit().changed, false);
  assert.equal(restored.score, 10);
  assert.deepEqual(points, { bronze: 10, silver: 30, gold: 90, crystal: 270, diamond: 810 });
  for (const raw of [null, [], 'bad', { stats: { hangmanWins: -1, typingBest: Infinity }, unlocked: { welcome: 'bad', fake: '2026-01-01' } }]) {
    const clean = new Tracker(raw);
    assert.equal(clean.score, 0);
    assert.equal(clean.data.stats.hangmanWins, 0);
    assert.deepEqual(ids(clean.visit()), ['welcome']);
  }
  assert.equal(new Set(catalog.map(item => item.id)).size, catalog.length);
  assert.equal(catalog.length, 48);
});

test('Hangman losses, abandonment, repeated final frames and reloads never duplicate wins or points', () => {
  let tracker = new Tracker();
  tracker.visit();
  assert.deepEqual(ids(tracker.start('hangman', 'easy')), ['play_hangman']);
  assert.equal(tracker.score, 20);
  tracker.observe({ mode: 'hangman', difficulty: 'easy', over: true, won: false });
  assert.equal(tracker.data.stats.hangmanWins, 0);
  tracker.start('hangman', 'hard'); // abandoned by starting another round
  assert.deepEqual(ids(finish(tracker, 'hangman', 'easy')), ['hangman_win']);
  assert.equal(tracker.score, 50);
  assert.equal(tracker.data.stats.hardWins, 0);
  for (let i = 0; i < 10; i++) tracker.observe({ mode: 'hangman', difficulty: 'easy', over: true, won: true });
  assert.equal(tracker.data.stats.hangmanWins, 1);
  assert.deepEqual(ids(finish(tracker, 'hangman', 'hard', { mistakes: 0 })), ['hangman_hard', 'hangman_perfect']);
  assert.equal(tracker.score, 110);
  finish(tracker, 'hangman', 'medium');
  finish(tracker, 'hangman', 'easy');
  assert.deepEqual(ids(finish(tracker, 'hangman', 'hard')), ['hangman_5']);
  assert.equal(tracker.score, 200);
  tracker = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
  assert.equal(tracker.observe({ mode: 'hangman', difficulty: 'hard', over: true, won: true }).changed, false);
  for (let i = 0; i < 4; i++) finish(tracker, 'hangman', 'easy');
  assert.deepEqual(ids(finish(tracker, 'hangman', 'hard')), ['hangman_10']);
  assert.equal(tracker.score, 290);
  for (let i = 0; i < 15; i++) finish(tracker, 'hangman', 'easy');
  assert.equal(tracker.score, 380);
});

test('typing and survival use the best single run and exact thresholds', () => {
  const tracker = new Tracker();
  tracker.start('keyboard', 'progressive');
  const typing = score => tracker.observe({ mode: 'keyboard', difficulty: 'progressive', score, over: false });
  assert.deepEqual(ids(typing(1)), ['typing_1']);
  assert.deepEqual(ids(typing(4)), []);
  assert.deepEqual(ids(typing(5)), ['typing_5']);
  tracker.start('keyboard', 'progressive');
  assert.deepEqual(ids(typing(5)), []);
  assert.equal(tracker.data.stats.typingBest, 5);
  assert.deepEqual(ids(typing(10)), ['typing_10']);
  assert.deepEqual(ids(typing(20)), ['typing_20']);
  tracker.start('dodge', 'easy');
  const dodge = (elapsed, difficulty = 'easy') => tracker.observe({ mode: 'dodge', difficulty, elapsed, over: false });
  assert.deepEqual(ids(dodge(14)), []);
  assert.deepEqual(ids(dodge(15)), ['dodge_15']);
  assert.deepEqual(ids(dodge(30)), ['dodge_30']);
  assert.deepEqual(ids(dodge(60)), ['dodge_60']);
  assert.equal(tracker.data.unlocked.dodge_merciless, undefined);
  tracker.start('dodge', 'merciless');
  assert.deepEqual(ids(dodge(29, 'merciless')), []);
  assert.deepEqual(ids(dodge(30, 'merciless')), ['dodge_merciless']);
});

test('boss victories respect the selected mode and sampler requires all five games', () => {
  const tracker = new Tracker();
  assert.deepEqual(ids(finish(tracker, 'boss', 'mean')), ['boss_win']);
  assert.deepEqual(ids(finish(tracker, 'boss', 'cruel')), ['boss_cruel']);
  assert.deepEqual(ids(finish(tracker, 'boss', 'nightmare')), ['boss_nightmare']);
  assert.deepEqual(ids(finish(tracker, 'boss', 'impossible')), ['boss_impossible']);
  assert.deepEqual(ids(finish(tracker, 'boss', 'mean')), ['boss_5']);
  assert.deepEqual(ids(finish(tracker, 'pumpkin', 'baby')), ['pumpkin_baby']);
  assert.equal(tracker.data.unlocked.pumpkin_phase2, undefined);
  assert.deepEqual(ids(finish(tracker, 'pumpkin', 'coward')), ['pumpkin_coward']);
  assert.deepEqual(ids(finish(tracker, 'pumpkin', 'phase2')), ['pumpkin_phase2', 'pumpkin_3']);
  tracker.start('hangman', 'easy');
  tracker.start('keyboard', 'progressive');
  assert.equal(tracker.data.unlocked.sampler, undefined);
  assert.deepEqual(ids(tracker.start('dodge', 'easy')), ['play_dodge', 'sampler']);
  tracker.start('hangman', 'hard');
  assert.equal(tracker.observe({ mode: 'boss', difficulty: 'impossible', won: true, over: true }).changed, false);
});

test('King of Suffering requires a real zero-damage win in every mode, even after healing', () => {
  for (const difficulty of ['phase2', 'coward', 'baby', 'come_on']) {
    const tracker = new Tracker();
    for (const damage_taken of [undefined, 1, 5]) {
      const result = finish(tracker, 'pumpkin', difficulty, { damage_taken, lives: 23, max_lives: 23 });
      assert.ok(!ids(result).includes('pumpkin_flawless'));
    }
    tracker.start('pumpkin', difficulty);
    tracker.observe({ mode: 'pumpkin', difficulty, damage_taken: 0, over: true, won: false });
    assert.equal(tracker.data.unlocked.pumpkin_flawless, undefined);
    const before = tracker.score;
    assert.deepEqual(ids(finish(tracker, 'pumpkin', difficulty, { damage_taken: 0 })), ['pumpkin_flawless']);
    assert.equal(tracker.score - before, 810);
    const restored = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
    assert.ok(!ids(finish(restored, 'pumpkin', difficulty, { damage_taken: 0 })).includes('pumpkin_flawless'));
  }
});

test('Close One and the 120-second awards require evidence at their thresholds', () => {
  const tracker = new Tracker();
  tracker.start('dodge', 'easy');
  const observe = (elapsed, near_misses = 0, difficulty = 'easy') => tracker.observe({ mode: 'dodge', difficulty, elapsed, near_misses });
  observe(119);
  assert.equal(tracker.data.unlocked.dodge_120, undefined);
  assert.equal(tracker.data.unlocked.dodge_close, undefined);
  const before = tracker.score;
  assert.deepEqual(ids(observe(120, 1)), ['dodge_close', 'dodge_120']);
  assert.equal(tracker.score - before, 300);
  assert.equal(observe(120, 1).changed, false);
  tracker.start('dodge', 'merciless');
  observe(119, 0, 'merciless');
  assert.equal(tracker.data.unlocked.dodge_merciless_120, undefined);
  assert.deepEqual(ids(observe(120, 0, 'merciless')), ['dodge_merciless_120']);
});

test('every additional crystal and diamond challenge unlocks exactly at its threshold', () => {
  for (const [id, stat, threshold] of [
    ['hangman_50', 'hangmanWins', 50], ['hangman_100', 'hangmanWins', 100],
    ['hangman_hard_10', 'hardWins', 10], ['hangman_perfect_25', 'perfectWins', 25],
    ['typing_30', 'typingBest', 30], ['typing_50', 'typingBest', 50],
    ['boss_10', 'bossWins', 10], ['pumpkin_10', 'pumpkinWins', 10],
  ]) {
    const tracker = new Tracker({ stats: { [stat]: threshold - 1 } });
    tracker.visit();
    assert.equal(tracker.data.unlocked[id], undefined);
    let result;
    if (stat === 'typingBest') {
      tracker.start('keyboard', 'progressive');
      result = tracker.observe({ mode: 'keyboard', difficulty: 'progressive', score: threshold });
    } else {
      const mode = stat === 'bossWins' ? 'boss' : stat === 'pumpkinWins' ? 'pumpkin' : 'hangman';
      const difficulty = mode === 'boss' ? 'mean' : mode === 'pumpkin' ? 'baby' : 'hard';
      result = finish(tracker, mode, difficulty, { mistakes: 0, damage_taken: 1 });
    }
    assert.ok(ids(result).includes(id), id);
    assert.ok(new Tracker(tracker.data).data.unlocked[id]);
  }
  const tracker = new Tracker();
  finish(tracker, 'boss', 'mean', { damage_taken: 0 });
  finish(tracker, 'boss', 'impossible', { damage_taken: 1 });
  assert.equal(tracker.data.unlocked.boss_flawless, undefined);
  assert.deepEqual(ids(finish(tracker, 'boss', 'impossible', { damage_taken: 0 })), ['boss_flawless']);
});

test('existing progress and medals migrate without losing points or repeating awards', () => {
  const tracker = new Tracker({ stats: { visits: 1, hangmanWins: 50, dodgeBest: 120 },
    unlocked: { welcome: '2026-10-31', hangman_win: '2026-10-31' } });
  assert.equal(tracker.score, 40);
  const earned = ids(tracker.visit());
  assert.ok(!earned.includes('welcome'));
  assert.ok(!earned.includes('hangman_win'));
  assert.ok(earned.includes('hangman_50'));
  assert.ok(earned.includes('dodge_120'));
  assert.equal(new Tracker(tracker.data).visit().changed, false);
});

test('Gerson Boom requires 360 seconds in one run and awards diamond points only once', () => {
  const tracker = new Tracker();
  tracker.visit();
  tracker.start('dodge', 'easy');
  const run = elapsed => tracker.observe({ mode: 'dodge', difficulty: 'easy', elapsed });
  run(359);
  assert.equal(tracker.data.unlocked.dodge_360, undefined);
  tracker.start('dodge', 'easy');
  run(1); // 359 + 1 across separate games is not a 360-second run.
  assert.equal(tracker.data.unlocked.dodge_360, undefined);
  const before = tracker.score;
  assert.deepEqual(ids(run(360)), ['dodge_360']);
  assert.equal(tracker.score - before, 810);
  assert.equal(run(360).changed, false);
  assert.equal(new Tracker(tracker.data).score, tracker.score);
});

test('Domination requires an undamaged Mean victory, not healing or another difficulty', () => {
  const tracker = new Tracker();
  for (const damage_taken of [undefined, 1]) {
    finish(tracker, 'boss', 'mean', { damage_taken, lives: 3, max_lives: 3 });
    assert.equal(tracker.data.unlocked.boss_mean_flawless, undefined);
  }
  finish(tracker, 'boss', 'cruel', { damage_taken: 0 });
  assert.equal(tracker.data.unlocked.boss_mean_flawless, undefined);
  tracker.start('boss', 'mean');
  tracker.observe({ mode: 'boss', difficulty: 'mean', over: true, won: false, damage_taken: 0 });
  assert.equal(tracker.data.unlocked.boss_mean_flawless, undefined);
  const before = tracker.score;
  assert.deepEqual(ids(finish(tracker, 'boss', 'mean', { damage_taken: 0 })), ['boss_mean_flawless']);
  assert.equal(tracker.score - before, 30);
  assert.ok(!ids(finish(tracker, 'boss', 'mean', { damage_taken: 0 })).includes('boss_mean_flawless'));
});

test('Walking Dictionary and Speed of Type remain gold for existing and new profiles', () => {
  for (const id of ['hangman_25', 'typing_20']) {
    assert.equal(catalog.find(item => item.id === id).tier, 'gold');
    const tracker = new Tracker({ unlocked: { [id]: '2026-10-31' } });
    assert.equal(tracker.score, 90);
  }
});

test('secret achievements award the requested tiers once and persist with existing progress', () => {
  const tracker = new Tracker();
  tracker.visit();
  assert.deepEqual(ids(tracker.secret('dingdong')), ['dingdong']);
  assert.equal(tracker.score, 280);
  assert.equal(catalog.find(item => item.id === 'dingdong').description, 'WHO YOU ARE.');
  assert.equal(catalog.find(item => item.id === 'dingdong').tier, 'crystal');
  assert.deepEqual(ids(tracker.secret('cube')), ['cube_pet']);
  assert.equal(catalog.find(item => item.id === 'cube_pet').title, 'Awwwwww!');
  assert.equal(tracker.score, 370);
  const restored = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
  for (const secret of ['cube', 'dingdong', 'unknown']) assert.equal(restored.secret(secret).changed, false);
  assert.equal(restored.score, 370);
});

test('last-chance Hangman requires a completed win with exactly one guess remaining', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const tracker = new Tracker();
    tracker.start('hangman', difficulty);
    tracker.observe({ mode: 'hangman', difficulty, over: false, remaining: 1 });
    assert.equal(tracker.data.unlocked.hangman_last_chance, undefined);
    for (const remaining of [0, 1]) finish(tracker, 'hangman', difficulty, { won: false, remaining });
    for (const remaining of [undefined, 0, 2, 3]) finish(tracker, 'hangman', difficulty, { remaining });
    assert.equal(tracker.data.unlocked.hangman_last_chance, undefined);
    finish(tracker, 'hangman', difficulty, { remaining: 2 }); // Award the separate five-win milestone first.
    const before = tracker.score;
    assert.deepEqual(ids(finish(tracker, 'hangman', difficulty, { remaining: 1 })), ['hangman_last_chance']);
    assert.equal(tracker.score - before, 90);
    tracker.observe({ mode: 'hangman', difficulty, over: true, won: true, remaining: 1 });
    assert.equal(tracker.data.stats.lastChanceWins, 1);
    assert.equal(new Tracker(tracker.data).data.unlocked.hangman_last_chance, tracker.data.unlocked.hangman_last_chance);
  }
});
