const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Tracker, catalog, points } = require('../achievements.js');
const ids = result => result.earned.map(item => item.id);
const core = extra => ({ mode: 'singularity', difficulty: 'gravitron', over: false, won: false,
  attacks_completed: 0, damage_taken: 0, lives: 10, max_lives: 10, hp: 1, shielded: true, ...extra });
const coreWin = extra => core({ over: true, won: true, attacks_completed: 15, hp: 0, shielded: false, ...extra });
const wrath = (difficulty, extra) => ({ mode: 'wrath', difficulty, over: false, won: false,
  attacks_completed: 0, counter_hits: 0, damage_taken: 0, lives: 15, max_lives: 15, ...extra });

test('catalog includes Determination, the named Rainbow wins, and the expanded Empyrorite rewards', () => {
  assert.equal(catalog.length, 204);
  assert.equal(new Set(catalog.map(item => item.id)).size, 204);
  assert.equal(catalog.slice(74).length, 130);
  const victory = catalog.find(item => item.id === 'core_win');
  assert.equal(victory.title, 'My Fingers Hurt');
  assert.equal(victory.tier, 'rainbow');
  assert.equal(points.empyrorite, 7290);
  assert.equal(points.empyrorite, points.rainbow * 3);
  assert.equal(catalog.filter(item => item.tier === 'empyrorite').length, 11);
  assert.equal(catalog.find(item => item.id === 'wrath_perfect_shuffle').tier, 'rainbow');
});

test('Core protocol rewards track completed attacks and the real finishing laser awards once', () => {
  const tracker = new Tracker();
  assert.deepEqual(ids(tracker.secret('gravitron')), ['name_gravitron']);
  assert.equal(tracker.secret('gravitron').changed, false);
  assert.deepEqual(ids(tracker.start('singularity', 'gravitron')), ['play_singularity']);
  assert.equal(tracker.observe(core()).changed, false);
  for (let completed = 1; completed <= 15; completed++) {
    const result = tracker.observe(core({ attacks_completed: completed }));
    assert.ok(ids(result).includes(`core_protocol_${completed}`));
    if (completed < 15) assert.equal(tracker.data.unlocked[`core_protocol_${completed + 1}`], undefined);
    assert.equal(tracker.observe(core({ attacks_completed: completed })).changed, false);
    assert.equal(tracker.data.unlocked.core_win, undefined);
  }
  assert.ok(tracker.data.unlocked.core_steady);
  const before = tracker.score;
  assert.deepEqual(ids(tracker.observe(coreWin())), ['core_win', 'core_flawless', 'collect_empyrorite']);
  assert.equal(tracker.score - before, 2430 + 7290 * 2);
  assert.equal(tracker.data.stats.coreWins, 1);
  assert.equal(tracker.observe(coreWin()).changed, false);
  const restored = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
  assert.equal(restored.score, tracker.score);
  assert.deepEqual(restored.data.unlocked, tracker.data.unlocked);
  assert.equal(restored.observe(coreWin()).changed, false);
  assert.equal(restored.visit().earned.length, 1); // Only the never-recorded arcade visit.
});

test('Core losses, shielded victories, missing damage, and abandoned fights cannot fake a perfect win', () => {
  for (const state of [core({ over: true }), coreWin({ hp: 1 }), coreWin({ shielded: true }),
    coreWin({ attacks_completed: 14 })]) {
    const tracker = new Tracker();
    tracker.start('singularity', 'gravitron');
    tracker.observe(state);
    assert.equal(tracker.data.unlocked.core_win, undefined);
    assert.equal(tracker.data.unlocked.core_flawless, undefined);
  }
  for (const damage_taken of [1, undefined, 9]) {
    const tracker = new Tracker();
    tracker.start('singularity', 'gravitron');
    tracker.observe(coreWin({ damage_taken, healing_collected: 1 }));
    assert.ok(tracker.data.unlocked.core_win);
    assert.equal(tracker.data.unlocked.core_flawless, undefined);
  }
  const tracker = new Tracker();
  tracker.start('singularity', 'gravitron');
  tracker.abandon();
  assert.equal(tracker.observe(coreWin()).changed, false);
  assert.equal(tracker.data.stats.coreWins, 0);
});

test('Core cumulative wins, one-HP victories, and clean first-five protocols use their real thresholds', () => {
  const tracker = new Tracker();
  for (let wins = 1; wins <= 10; wins++) {
    tracker.start('singularity', 'gravitron');
    tracker.observe(coreWin({ damage_taken: 1, lives: 9 }));
    assert.equal(Boolean(tracker.data.unlocked.core_win_3), wins >= 3);
    assert.equal(Boolean(tracker.data.unlocked.core_win_10), wins >= 10);
  }
  assert.equal(tracker.data.unlocked.core_flawless, undefined);
  assert.equal(tracker.data.unlocked.core_clutch, undefined);
  tracker.start('singularity', 'gravitron');
  tracker.observe(coreWin({ damage_taken: 9, lives: 1 }));
  assert.ok(tracker.data.unlocked.core_clutch);
  assert.equal(tracker.data.unlocked.core_steady, undefined);
  tracker.start('singularity', 'gravitron');
  tracker.observe(core({ attacks_completed: 4 }));
  assert.equal(tracker.data.unlocked.core_steady, undefined);
  tracker.observe(core({ attacks_completed: 5 }));
  assert.ok(tracker.data.unlocked.core_steady);
  assert.equal(tracker.data.stats.pumpkinWins, 0);
  assert.equal(tracker.data.stats.bossWins, 0);
});

test('Wrath awards all eight modes while only seven individual victories complete the curriculum', () => {
  const tracker = new Tracker();
  const modes = ['random_order', 'color_memory', 'bone_gauntlet', 'rotating_rings',
    'magenta_fingers', 'chaos', 'royal_slams', 'haunted_quadrants'];
  for (const [index, difficulty] of modes.entries()) {
    tracker.start('wrath', difficulty);
    const state = wrath(difficulty, { over: true, won: true, damage_taken: 1 });
    assert.ok(ids(tracker.observe(state)).includes(`wrath_${difficulty}`));
    assert.equal(tracker.data.stats.wrathLessons, index);
    assert.equal(tracker.observe(state).changed, false);
    assert.equal(Boolean(tracker.data.unlocked.wrath_curriculum), index === 7);
    assert.equal(Boolean(tracker.data.unlocked.wrath_win_5), index >= 4);
  }
  for (let wins = 9; wins <= 25; wins++) {
    tracker.start('wrath', 'chaos');
    tracker.observe(wrath('chaos', { over: true, won: true, damage_taken: 1 }));
    assert.equal(Boolean(tracker.data.unlocked.wrath_win_25), wins === 25);
  }
  assert.equal(tracker.data.stats.wrathWins, 25);
  assert.equal(tracker.data.stats.pumpkinWins, 0);
  assert.equal(tracker.data.unlocked.sampler, undefined);
  assert.equal(tracker.data.unlocked.wrath_flawless, undefined);
});

test('Random Order sets belong to a single run and perfection requires a full set plus a zero-damage win', () => {
  const tracker = new Tracker();
  for (let run = 0; run < 2; run++) {
    tracker.start('wrath', 'random_order');
    tracker.observe(wrath('random_order', { attacks_completed: 6 }));
    tracker.abandon();
  }
  assert.equal(tracker.data.unlocked.wrath_full_deck, undefined);
  tracker.start('wrath', 'random_order');
  for (let completed = 0; completed <= 21; completed++) {
    tracker.observe(wrath('random_order', { attacks_completed: completed }));
    assert.equal(Boolean(tracker.data.unlocked.wrath_full_deck), completed >= 7);
    assert.equal(Boolean(tracker.data.unlocked.wrath_three_sets), completed >= 21);
    assert.equal(tracker.data.unlocked.wrath_perfect_shuffle, undefined);
  }
  for (const extra of [{ won: false }, { won: true, attacks_completed: 6 },
    { won: true, damage_taken: 1, healing_collected: 1 }, { won: true, damage_taken: undefined }]) {
    tracker.start('wrath', 'random_order');
    tracker.observe(wrath('random_order', { attacks_completed: 7, over: true, ...extra }));
    assert.equal(tracker.data.unlocked.wrath_perfect_shuffle, undefined);
  }
  tracker.start('wrath', 'random_order');
  assert.ok(ids(tracker.observe(wrath('random_order', { attacks_completed: 7, over: true, won: true })))
    .includes('wrath_perfect_shuffle'));
  assert.ok(tracker.data.unlocked.wrath_flawless);
});

test('real counter deltas accumulate across fights and reloads without counting repeated snapshots', () => {
  let tracker = new Tracker();
  tracker.start('wrath', 'magenta_fingers');
  for (const hits of [0, 10, 10, 20, 20])
    tracker.observe(wrath('magenta_fingers', { counter_hits: hits }));
  assert.equal(tracker.data.stats.wrathCounterHits, 20);
  assert.equal(tracker.data.unlocked.wrath_counter_25, undefined);
  tracker.abandon();
  tracker = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
  tracker.start('pumpkin', 'baby');
  tracker.observe({ mode: 'pumpkin', difficulty: 'baby', over: false, counter_hits: 100 });
  assert.equal(tracker.data.stats.wrathCounterHits, 20);
  tracker.start('wrath', 'random_order');
  tracker.observe(wrath('random_order', { counter_hits: 4 }));
  assert.equal(tracker.data.unlocked.wrath_counter_25, undefined);
  assert.ok(ids(tracker.observe(wrath('random_order', { counter_hits: 5 }))).includes('wrath_counter_25'));
  assert.equal(tracker.observe(wrath('random_order', { counter_hits: 5 })).changed, false);
  assert.equal(tracker.data.stats.wrathCounterHits, 25);
});

test('old medals keep their dates and points, and Empyrorite scores persist without another award', () => {
  const date = '2026-11-01T10:00:00.000Z';
  const old = new Tracker({ stats: { visits: 1, hangmanWins: 1 }, unlocked: { welcome: date, hangman_win: date } });
  assert.equal(old.score, 40);
  assert.deepEqual(ids(old.visit()), []);
  assert.equal(old.data.unlocked.hangman_win, date);
  for (const id of ['core_flawless', 'wrath_perfect_shuffle', 'dodge_merciless_300', 'boss_clean_streak_20']) {
    const restored = new Tracker({ stats: { visits: 1 }, unlocked: { welcome: date, [id]: date } });
    const reward = id === 'wrath_perfect_shuffle' ? points.rainbow : points.empyrorite;
    assert.equal(restored.score, reward + points.bronze);
    assert.deepEqual(ids(restored.visit()), id === 'wrath_perfect_shuffle' ? [] : ['collect_empyrorite']);
    assert.equal(restored.data.unlocked[id], date);
  }
});

test('Merciless Empyrorite requires 300 seconds in one run, not another mode or summed runs', () => {
  const tracker = new Tracker();
  const item = catalog.find(item => item.id === 'dodge_merciless_300');
  assert.equal(item.tier, 'empyrorite');
  tracker.start('dodge', 'easy');
  tracker.observe({ mode: 'dodge', difficulty: 'easy', elapsed: 600, over: false });
  assert.equal(tracker.data.unlocked[item.id], undefined);
  for (const elapsed of [299, 1]) {
    tracker.start('dodge', 'merciless');
    tracker.observe({ mode: 'dodge', difficulty: 'merciless', elapsed, over: true, won: false });
    assert.equal(tracker.data.unlocked[item.id], undefined);
  }
  tracker.start('dodge', 'merciless');
  const before = tracker.score;
  assert.ok(ids(tracker.observe({ mode: 'dodge', difficulty: 'merciless', elapsed: 300, over: false })).includes(item.id));
  assert.equal(tracker.score - before, 7290 * 2);
  assert.equal(tracker.observe({ mode: 'dodge', difficulty: 'merciless', elapsed: 300, over: false }).changed, false);
  assert.equal(new Tracker(JSON.parse(JSON.stringify(tracker.data))).data.unlocked[item.id], tracker.data.unlocked[item.id]);
});

test('Boss Crush Empyrorite requires twenty consecutive undamaged wins on Cruel or harder', () => {
  const tracker = new Tracker();
  const item = catalog.find(item => item.id === 'boss_clean_streak_20');
  assert.equal(item.tier, 'empyrorite');
  for (let wins = 1; wins <= 20; wins++) {
    const difficulty = ['cruel', 'nightmare', 'impossible'][(wins - 1) % 3];
    tracker.start('boss', difficulty);
    const before = tracker.score;
    tracker.observe({ mode: 'boss', difficulty, over: true, won: true, damage_taken: 0 });
    assert.equal(Boolean(tracker.data.unlocked[item.id]), wins === 20);
    if (wins === 20) assert.equal(tracker.score - before, 7290 * 2);
  }
  for (const state of [{ won: false, damage_taken: 0 }, { won: true, damage_taken: 1, healing_collected: 1 },
    { won: true, damage_taken: undefined }]) {
    const interrupted = new Tracker({ stats: { bossSovereignStreak: 19 } });
    interrupted.start('boss', 'cruel');
    interrupted.observe({ mode: 'boss', difficulty: 'cruel', over: true, ...state });
    assert.equal(interrupted.data.stats.bossSovereignStreak, 0);
    assert.equal(interrupted.data.unlocked[item.id], undefined);
  }
  for (const reload of [false, true]) {
    let interrupted = new Tracker({ stats: { bossSovereignStreak: 19 } });
    interrupted.start('boss', 'cruel');
    if (reload) {
      interrupted = new Tracker(JSON.parse(JSON.stringify(interrupted.data)));
      interrupted.visit();
    } else interrupted.abandon();
    assert.equal(interrupted.data.stats.bossSovereignStreak, 0);
    assert.equal(interrupted.data.unlocked[item.id], undefined);
  }
});

test('Mean fights do not advance or break Sovereign progress and retain the older streak awards', () => {
  const meanOnly = new Tracker();
  for (let i = 0; i < 20; i++) {
    meanOnly.start('boss', 'mean');
    meanOnly.observe({ mode: 'boss', difficulty: 'mean', over: true, won: true, damage_taken: 0 });
  }
  assert.equal(meanOnly.data.stats.bossCleanStreak, 20);
  assert.equal(meanOnly.data.stats.bossSovereignStreak, 0);
  assert.ok(meanOnly.data.unlocked.boss_clean_streak_15);
  assert.equal(meanOnly.data.unlocked.boss_clean_streak_20, undefined);
  for (const outcome of ['win', 'damage', 'loss', 'abandon', 'reload']) {
    let tracker = new Tracker({ stats: { bossSovereignStreak: 19 } });
    tracker.start('boss', 'mean');
    if (outcome === 'abandon') tracker.abandon();
    else if (outcome === 'reload') {
      tracker = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
      tracker.visit();
    } else tracker.observe({ mode: 'boss', difficulty: 'mean', over: true,
      won: outcome !== 'loss', damage_taken: outcome === 'damage' ? 1 : 0 });
    assert.equal(tracker.data.stats.bossSovereignStreak, 19, outcome);
    assert.equal(tracker.data.unlocked.boss_clean_streak_20, undefined, outcome);
    tracker.start('boss', 'impossible');
    const result = tracker.observe({ mode: 'boss', difficulty: 'impossible', over: true, won: true, damage_taken: 0 });
    assert.ok(ids(result).includes('boss_clean_streak_20'), outcome);
  }
});

test('Sovereign resets on live qualifying damage even without the older streak and survives completed-run reloads', () => {
  const tracker = new Tracker({ stats: { bossSovereignStreak: 19 } });
  tracker.start('boss', 'nightmare');
  tracker.observe({ mode: 'boss', difficulty: 'nightmare', over: false, damage_taken: 1 });
  assert.equal(tracker.data.stats.bossSovereignStreak, 0);
  tracker.observe({ mode: 'boss', difficulty: 'nightmare', over: true, won: true,
    damage_taken: 1, healing_collected: 1, lives: 3, max_lives: 3 });
  assert.equal(tracker.data.unlocked.boss_clean_streak_20, undefined);
  const restored = new Tracker({ stats: { visits: 1, bossSovereignStreak: 19 } });
  restored.visit();
  assert.equal(restored.data.stats.bossSovereignStreak, 19);
  const legacy = new Tracker({ stats: { bossCleanStreak: 20 } });
  legacy.visit();
  assert.equal(legacy.data.stats.bossSovereignStreak, 0);
  assert.equal(legacy.data.unlocked.boss_clean_streak_20, undefined);
});

test('Chaos, Perfected migrates from Empyrorite to Rainbow without another award or a changed date', () => {
  const date = '2026-11-01T10:00:00.000Z';
  const tracker = new Tracker({ stats: { visits: 1, wrathPerfectShuffle: 1 },
    unlocked: { welcome: date, wrath_perfect_shuffle: date }, score: 7300 });
  assert.equal(tracker.score, 2440);
  assert.equal(tracker.data.unlocked.wrath_perfect_shuffle, date);
  assert.deepEqual(ids(tracker.visit()), []);
  assert.equal(tracker.data.unlocked.wrath_perfect_shuffle, date);
});
