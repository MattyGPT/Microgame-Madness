const { test } = require('node:test');
const assert = require('node:assert/strict');
const Rules = require('../../shared/account-rules.js');
const Achievements = require('../achievements.js');
const Shop = require('../shop.js');
const Customs = require('../customs.js');
const Trails = require('../trails.js');
const now = Date.parse('2026-11-07T12:00:00Z');
let serial = 0;
function op(kind, payload = {}, runId, stream = 'device-one') {
  return { schema: 1, id: `op-${++serial}`, stream_id: stream, ...(runId ? { run_id: runId } : {}), kind, payload };
}
function apply(state, kind, payload, runId, stream) { return Rules.apply(state, op(kind, payload, runId, stream), { now }); }
function start(state, mode = 'hangman', difficulty = 'easy', runId = 'round-one', stream) {
  return apply(state, 'run.start', { mode, difficulty }, runId, stream).state;
}
function complete(state, runId = 'round-one', extra = {}, stream) {
  const run = state.runs[runId];
  return apply(state, 'run.finish', { outcome: 'win', snapshot: {
    mode: run.mode, difficulty: run.difficulty, over: true, won: true, score: 5, mistakes: 0, remaining: 5, ...extra,
  } }, runId, stream);
}

test('rules share actual catalog and keep reducer inputs immutable', () => {
  const original = Rules.initial(), originalJSON = JSON.stringify(original);
  const command = op('arcade', { event: 'visit' }), commandJSON = JSON.stringify(command);
  const next = Rules.apply(original, command, { now });
  assert.equal(JSON.stringify(original), originalJSON);
  assert.equal(JSON.stringify(command), commandJSON);
  assert.equal(next.state.achievements.unlocked.welcome, new Date(now).toISOString());
  assert.equal(next.result.profilePoints, 10);
  assert.equal(Rules.catalog.length, Customs.catalog.length + Trails.catalog.length + require("../turtle-customs.js").catalog.length);
  assert.equal(next.state.privacy.leaderboard, true);
});

test('completed Hangman uses original achievements and reward rates exactly once', () => {
  const result = complete(start(Rules.initial(), 'hangman', 'hard'));
  const tracker = new Achievements.Tracker();
  tracker.start('hangman', 'hard');
  tracker.observe({ mode: 'hangman', difficulty: 'hard', over: true, won: true, score: 5, mistakes: 0, remaining: 5 });
  assert.deepEqual(result.state.achievements.stats, tracker.data.stats);
  assert.deepEqual(Object.keys(result.state.achievements.unlocked), Object.keys(tracker.data.unlocked));
  const wallet = { units: 0, owned: [] };
  Shop.reward(wallet, 'hangman', 'hard', 5);
  assert.equal(result.result.cashUnits, wallet.units);
  assert.equal(result.state.shop.units, 60000);
  assert.equal(result.run.outcome, 'win');
  assert.equal(result.run.eligible, true);
  assert.deepEqual(result.state.scores['hangman:hard'], [{ player: 'Player', score: 5 }]);
  assert.equal(result.state.minigamesCompleted, 1);
  const repeated = complete(result.state);
  assert.equal(repeated.result.duplicate, true);
  assert.equal(repeated.state.shop.units, 60000);
  assert.equal(repeated.state.achievements.stats.hangmanWins, 1);
  assert.throws(() => complete(result.state, 'round-one', { score: 4 }), { code: 'conflict' });
});

test('checkpoints and final results count cumulative attacks and healing only once', () => {
  let state = start(Rules.initial(), 'pumpkin', 'baby');
  const snapshot = { mode: 'pumpkin', difficulty: 'baby', over: false, won: false, score: 100,
    damage_taken: 1, healing_collected: 2, attack_survivals: [1,0,0,0,0,0,0], counter_hits: 3, fight_elapsed: 80 };
  state = apply(state, 'run.checkpoint', { snapshot }, 'round-one').state;
  state = apply(state, 'run.checkpoint', { snapshot }, 'round-one').state;
  assert.equal(state.achievements.stats.healingItems, 2);
  assert.equal(state.achievements.stats.pumpkinCounterHits, 3);
  assert.equal(state.achievements.stats.survive_pumpkin_color_memory, 1);
  const result = complete(state, 'round-one', { ...snapshot, over: true, won: true });
  assert.equal(result.state.achievements.stats.healingItems, 2);
  assert.equal(result.state.achievements.stats.pumpkinCounterHits, 3);
  assert.equal(result.state.achievements.stats.survive_pumpkin_color_memory, 1);
  assert.throws(() => apply(state, 'run.checkpoint', { snapshot: { ...snapshot, healing_collected: 1 } }, 'round-one'), { code: 'invalid' });
});

test('Core practice grants survival/death progress without cash, completed games, or rankings', () => {
  const state = start(Rules.initial(), 'core_practice', 'photon_rain');
  const snapshot = { mode: 'core_practice', difficulty: 'photon_rain', over: true, won: false, score: 500,
    attack_survivals: Array.from({ length: 15 }, (_, i) => i === 7 ? 3 : 0), healing_collected: 1, damage_taken: 2 };
  const result = apply(state, 'run.finish', { outcome: 'loss', snapshot }, 'round-one');
  assert.equal(result.state.achievements.stats.survive_core_photon_rain, 3);
  assert.equal(result.state.achievements.stats.arcadeDeaths, 1);
  assert.equal(result.state.achievements.stats.totalLosses, 0);
  assert.equal(result.state.achievements.stats.healingItems, 1);
  assert.equal(result.state.minigamesCompleted, 0);
  assert.equal(result.state.shop.units, 0);
  assert.deepEqual(result.state.scores, {});
  assert.equal(result.run.eligible, false);
});

test('Key Rush voluntary exit earns Cash and a best without counting a completed loss', () => {
  const state = start(Rules.initial(), 'keyboard', 'progressive');
  const result = apply(state, 'run.finish', { outcome: 'exit', snapshot: { over: false, won: false, score: 12 } }, 'round-one');
  assert.equal(result.state.shop.units, 48000);
  assert.equal(result.state.achievements.stats.typingBest, 12);
  assert.equal(result.state.achievements.stats.totalLosses, 0);
  assert.equal(result.state.minigamesCompleted, 0);
  assert.equal(result.run.eligible, true);
});

test('interruption preserves mid-run progress without a completion reward', () => {
  let state = start(Rules.initial(), 'dodge', 'easy');
  state = apply(state, 'run.checkpoint', { snapshot: { over: false, won: false, score: 100, elapsed: 40, near_misses: 3 } }, 'round-one').state;
  const result = apply(state, 'run.finish', { outcome: 'interrupted', snapshot: {} }, 'round-one');
  assert.equal(result.state.achievements.stats.dodgeBest, 40);
  assert.equal(result.state.shop.units, 0);
  assert.equal(result.state.minigamesCompleted, 0);
  assert.equal(result.run.eligible, false);
  assert.equal(start(result.state, 'hangman', 'easy', 'next-run').runs['next-run'].finished, false);
});

test('different devices cannot concatenate streaks and totals still combine', () => {
  let state = Rules.initial();
  for (const [device, count] of [['one', 3], ['two', 2]]) {
    for (let i = 0; i < count; i++) {
      const id = `${device}-${i}`;
      state = start(state, 'boss', 'mean', id, device);
      state = complete(state, id, { damage_taken: 0, score: 100 }, device).state;
    }
  }
  assert.equal(state.achievements.stats.bossWins, 5);
  assert.equal(state.achievements.stats.bossCleanStreak, 3);
  assert.equal(state.streams.one.bossCleanStreak, 3);
  assert.equal(state.streams.two.bossCleanStreak, 2);
  assert.equal(state.achievements.unlocked.boss_clean_streak, undefined);
});

test('shop pricing is catalog-authoritative and ownership prevents duplicate debit', () => {
  const item = Trails.catalog[0];
  const state = Rules.initial();
  state.shop.units = item.price * 1000;
  const bought = apply(state, 'purchase', { itemId: item.id, price: 0 });
  assert.equal(bought.state.shop.units, 0);
  assert.equal(bought.result.cashUnits, -item.price*1000);
  assert.deepEqual(bought.state.shop.owned, [item.id]);
  const repeated = apply(bought.state, 'purchase', { itemId: item.id });
  assert.equal(repeated.result.alreadyOwned, true);
  assert.equal(repeated.result.cashUnits, 0);
  assert.throws(() => apply(Rules.initial(), 'purchase', { itemId: item.id }), { code: 'insufficient_funds' });
  assert.throws(() => apply(state, 'purchase', { itemId: '__unknown' }), { code: 'invalid' });
});

test('preferences conflict per field, validate ownership, and reject privilege changes', () => {
  let state = Rules.initial();
  state = apply(state, 'settings', { changes: { player: '  Cubie  ', soundOn: false }, baseRevisions: { player: 0, soundOn: 0 } }).state;
  assert.equal(state.player, 'Cubie');
  assert.equal(state.preferences.soundOn, false);
  assert.equal(state.preferenceRevisions.player, 1);
  assert.throws(() => apply(state, 'settings', { changes: { player: 'Other' }, baseRevisions: { player: 0 } }), { code: 'conflict' });
  state = apply(state, 'settings', { changes: { leaderboard: true }, baseRevisions: { leaderboard: 0 } }).state;
  assert.equal(state.privacy.leaderboard, true);
  assert.equal(state.privacy.publicProfile, true);
  assert.throws(() => apply(state, 'settings', { changes: { turtleTrail: Trails.catalog[0].id } }), { code: 'not_owned' });
  assert.throws(() => apply(state, 'settings', { changes: { administrator: true } }), { code: 'invalid' });
  assert.throws(() => apply(state, 'settings', { changes: { player: '\n' }, baseRevisions: { player: 1 } }), { code: 'invalid' });
});

test('baseline imports are one-time, preserve selected names, and never create runs', () => {
  const legacy = { player: 'Alice', shop: { units: 32100, owned: [Trails.catalog[0].id, 'not-an-item'] },
    achievements: { stats: { hangmanWins: 10 }, unlocked: { welcome: '2026-01-01', fake: '2026-01-01' } },
    scores: { 'hangman:easy': [{ player: 'Alice', score: 8 }, { player: 'Bob', score: 10 }], invalid: [{ player: 'Alice', score: 100 }] },
    testerTon618: true, unlocks: { singularity: true } };
  const result = apply(Rules.initial(), 'import', { profile: legacy, baseline: true, names: ['Alice'] });
  assert.equal(result.state.shop.units, 32100);
  assert.equal(result.state.achievements.stats.hangmanWins, 10);
  assert.equal(result.state.baselineClosed, true);
  assert.deepEqual(result.state.runs, {});
  assert.deepEqual(result.result.earned, []);
  assert.deepEqual(result.state.scores['hangman:easy'], [{ player: 'Alice', score: 8 }]);
  assert.deepEqual(result.state.shop.owned, [Trails.catalog[0].id]);
  assert.equal(result.state.achievements.unlocked.fake, undefined);
  assert.equal(result.state.privacy.leaderboard, true);
  assert.throws(() => apply(result.state, 'import', { profile: legacy, baseline: true }), { code: 'conflict' });
  assert.throws(() => apply(start(Rules.initial()), 'import', { profile: legacy, baseline: true }), { code: 'conflict' });
});

test('later imports union unlocks and bests but do not add money, counters or streaks', () => {
  let state = complete(start(Rules.initial())).state;
  const units = state.shop.units;
  const legacy = { shop: { units: 999999, owned: [Trails.catalog[0].id] },
    achievements: { stats: { hangmanWins: 250, bossCleanStreak: 20 }, unlocked: { name_pixel: '2026-01-01' } },
    scores: { 'hangman:easy': [{ player: 'Player', score: 10 }] } };
  state = apply(state, 'import', { profile: legacy, baseline: false }).state;
  assert.equal(state.shop.units, units);
  assert.equal(state.achievements.stats.hangmanWins, 1);
  assert.equal(state.achievements.stats.bossCleanStreak, 0);
  assert.equal(state.scores['hangman:easy'][0].score, 10);
  assert.equal(state.shop.owned.includes(Trails.catalog[0].id), true);
  assert.equal(Object.keys(state.runs).length, 1);
});

test('time interval union deduplicates overlap across tabs, with bounded clock checks', () => {
  let state = Rules.initial();
  state = apply(state, 'arcade', { event: 'time', start: now-20000, end: now-10000 }, undefined, 'one').state;
  state = apply(state, 'arcade', { event: 'time', start: now-15000, end: now }, undefined, 'two').state;
  state = apply(state, 'arcade', { event: 'time', start: now-20000, end: now-10000 }, undefined, 'one').state;
  assert.equal(state.achievements.stats.websiteSeconds, 20);
  assert.deepEqual(state.timeIntervals, [[now-20000, now]]);
  assert.throws(() => apply(state, 'arcade', { event: 'time', start: now-70000, end: now }), { code: 'invalid' });
  assert.throws(() => apply(state, 'arcade', { event: 'time', start: now+600000, end: now+610000 }), { code: 'invalid' });
});

test('secrets and audible music use existing unlock rules without granting tester roles', () => {
  let state = apply(Rules.initial(), 'arcade', { event: 'secret', name: 'GRAVITRON' }).state;
  assert.equal(state.unlocks.singularity, true);
  assert.equal(state.achievements.stats.name_gravitron, 1);
  state = apply(state, 'arcade', { event: 'secret', name: 'cube' }).state;
  assert.equal(state.achievements.stats.cubePets, 1);
  state = apply(state, 'arcade', { event: 'music', track: 'christmas_99', audible: false }).state;
  assert.equal(state.achievements.stats.christmasHeard, 0);
  state = apply(state, 'arcade', { event: 'music', track: 'christmas_99', audible: true }).state;
  assert.equal(state.achievements.stats.christmasHeard, 1);
  assert.throws(() => apply(state, 'arcade', { event: 'secret', name: 'GRAVITRON618' }), { code: 'invalid' });
});

test('validation rejects corrupted snapshots, unknown modes, wrong streams, and prototype IDs', () => {
  assert.throws(() => start(Rules.initial(), '__proto__', 'easy'), { code: 'invalid' });
  const state = start(Rules.initial());
  assert.throws(() => complete(state, 'round-one', { score: 11 }), { code: 'invalid' });
  assert.throws(() => complete(state, 'round-one', { score: -1 }), { code: 'invalid' });
  assert.throws(() => complete(state, 'round-one', { score: NaN }), { code: 'invalid' });
  assert.throws(() => complete(state, 'round-one', { difficulty: 'hard' }), { code: 'invalid' });
  assert.throws(() => complete(state, 'round-one', {}, 'different-device'), { code: 'invalid' });
  assert.throws(() => Rules.apply(state, { ...op('arcade', { event: 'visit' }), stream_id: '__proto__' }), { code: 'invalid' });
  assert.throws(() => Rules.apply(state, { ...op('arcade', { event: 'visit' }), schema: 2 }), { code: 'unsupported_version' });
  assert.equal({}.activeRun, undefined);
});


test('all inherited object identifiers are rejected without mutating built-in prototypes', () => {
  const before = Object.getOwnPropertyDescriptors(Object.prototype);
  for (const key of [...Object.getOwnPropertyNames(Object.prototype), 'prototype']) {
    for (const field of ['id', 'stream_id', 'run_id']) {
      const operation = { ...op('run.start', { mode: 'hangman', difficulty: 'easy' }, 'valid-run'), [field]: key };
      assert.throws(() => Rules.apply(Rules.initial(), operation, { now }), { code: 'invalid' }, `${field}: ${key}`);
    }
  }
  assert.deepEqual(Object.getOwnPropertyDescriptors(Object.prototype), before);
  assert.throws(() => Rules.validate({ ...op('arcade', { event: 'visit' }), schema: 1, version: 2 }), { code: 'unsupported_version' });
});


test('offline occurrence timestamps survive sync without controlling receipt time or rejecting skewed clocks', () => {
  const began = now - 86400000, ended = began + 45000;
  let state = Rules.apply(Rules.initial(), { ...op('run.start', { mode: 'hangman', difficulty: 'easy' }, 'offline'), occurredAt: began }, { now }).state;
  const result = Rules.apply(state, { ...op('run.finish', { outcome: 'win', snapshot: { over: true, won: true, score: 10 } }, 'offline'), occurredAt: new Date(ended).toISOString() }, { now });
  assert.equal(result.run.startedAt, new Date(began).toISOString());
  assert.equal(result.run.finishedAt, new Date(ended).toISOString());
  assert.equal(result.run.duration, 45);
  assert.equal(result.run.timeSource, 'client-reported');
  assert.equal(result.run.timeAdjusted, false);
  assert.equal(result.state.achievements.unlocked[Achievements.catalog.find(item => item.title === 'Good Game').id], new Date(ended).toISOString());
  for (const occurredAt of [0, now + 86400000]) {
    state = Rules.apply(Rules.initial(), { ...op('run.start', { mode: 'hangman', difficulty: 'easy' }, 'skewed'), occurredAt }, { now }).state;
    assert.equal(state.runs.skewed.startedAt, new Date(now).toISOString());
    assert.equal(state.runs.skewed.timeAdjusted, true);
  }
  const command = { ...op('arcade', { event: 'visit' }), occurredAt: 'not-a-date' };
  assert.throws(() => Rules.validate(command), { code: 'invalid' });
});


test('replaying a pending award at later receipt times preserves earned dates', () => {
  const occurredAt = now - 60000;
  const operations = [
    op('arcade', { event: 'visit' }),
    op('import', { baseline: true, profile: { achievements: { stats: { coreFlawlessWins: 1 } } } }),
  ];
  for (const operation of operations) {
    operation.occurredAt = occurredAt;
    const first = Rules.apply(Rules.initial(), operation, { now });
    const rebased = Rules.apply(Rules.initial(), operation, { now: now + 86400000 });
    assert.ok(Object.keys(first.state.achievements.unlocked).length > 0);
    assert.deepEqual(rebased.state.achievements.unlocked, first.state.achievements.unlocked);
    for (const earnedAt of Object.values(first.state.achievements.unlocked))
      assert.equal(earnedAt, new Date(occurredAt).toISOString());
  }
});

test('Chaos Turtle Dodge saves under its own difficulty and earns its configured reward', () => {
  const state = start(Rules.initial(), 'dodge', 'chaos');
  const result = apply(state, 'run.finish', {outcome: 'loss', snapshot: {
    mode: 'dodge', difficulty: 'chaos', over: true, won: false, score: 120,
    elapsed: 12, lives: 0, max_lives: 8, damage_taken: 8,
  }}, 'round-one');
  assert.equal(result.state.scores['dodge:chaos'][0].score, 120);
  assert.equal(result.state.scores['dodge:easy'], undefined);
  const wallet = {units: 0, owned: []};
  Shop.reward(wallet, 'dodge', 'chaos', 120);
  assert.equal(result.result.cashUnits, wallet.units);
});

test('account checkpoints award Chaos Cubies and keep the unlocks on repeat sync', () => {
  let state = start(Rules.initial(), 'dodge', 'chaos');
  const snapshot = {over:false,won:false,elapsed:60,lives:8,max_lives:8,damage_taken:0,score:600,healing_collected:0,near_misses:10};
  state = apply(state, 'run.checkpoint', {snapshot}, 'round-one').state;
  assert.ok(state.achievements.unlocked.chaos_clean_60);
  const stamp = state.achievements.unlocked.chaos_clean_60;
  state = apply(state, 'run.checkpoint', {snapshot}, 'round-one').state;
  assert.equal(state.achievements.unlocked.chaos_clean_60, stamp);
  assert.equal(Customs.selected('chaos_pristine',state.achievements.unlocked).id,'chaos_pristine');
});

test('slot results sync only for an owned equipped Jackpot Cubie and visible 777', () => {
  let state = Rules.initial();
  state.achievements.unlocked.chaos_score_3000 = new Date(now).toISOString();
  const payload = { event: 'slots', symbols: [0,0,0], visible: true };
  state = apply(state, 'arcade', payload).state;
  assert.ok(!state.achievements.unlocked.chaos_jackpot_777);
  state.cubieCustom = 'chaos_jackpot';
  state = apply(state, 'arcade', { ...payload, visible: false }).state;
  assert.ok(!state.achievements.unlocked.chaos_jackpot_777);
  state = apply(state, 'arcade', payload).state;
  assert.ok(state.achievements.unlocked.chaos_jackpot_777);
  const stamp = state.achievements.unlocked.chaos_jackpot_777;
  state = apply(state, 'arcade', payload).state;
  assert.equal(state.achievements.unlocked.chaos_jackpot_777, stamp);
  assert.throws(() => apply(state, 'arcade', {...payload,symbols:[5,0,0]}), {code:'invalid'});
});

 test('Endurance exit earns exactly half Progressive Cash and preserves raw rounds', () => {
  const state = start(Rules.initial(), 'keyboard', 'endurance');
  const result = apply(state, 'run.finish', { outcome: 'exit', snapshot: { over: false, won: false, score: 12 } }, 'round-one');
  assert.equal(result.state.shop.units, 24000);
  assert.equal(result.run.score, 12);
  assert.equal(result.run.eligible, true);
});

test('Endurance checkpoints and finishes never grant Key Rush achievements', () => {
  for (const outcome of ['exit', 'loss']) {
    let state = start(Rules.initial(), 'keyboard', 'endurance');
    state = apply(state, 'run.checkpoint', { snapshot: { over: false, won: false, score: 100 } }, 'round-one').state;
    state = JSON.parse(JSON.stringify(state));
    const result = apply(state, 'run.finish', { outcome, snapshot: { over: outcome === 'loss', won: false, score: 100 } }, 'round-one');
    assert.equal(result.state.shop.units, 200000);
    assert.equal(result.state.achievements.stats.typingBest, 0);
    assert.equal(result.state.achievements.stats.play_keyboard, 0);
    assert.equal(Object.keys(result.state.achievements.unlocked).some(id => id === 'play_keyboard' || id.startsWith('typing_')), false);
  }
});

test('new Wrath victories retain all fifteen counters and grant the matching medal once', () => {
  for (const [index, attack] of ['starfall_verdict','pendulum_court','crown_chess','mirror_lances','briar_pursuit','eclipse_waltz','resonant_bells','royal_loom'].entries()) {
    for (const suffix of ['', '__easy', '__hard']) {
      const difficulty=attack+suffix;
      const counts=Array(15).fill(0);counts[index+7]=2;
      const result=complete(start(Rules.initial(),'wrath',difficulty), 'round-one', {
        attack_survivals:counts, attacks_completed:2, damage_taken:0, healing_collected:0,
      });
      assert.equal(result.state.runs['round-one'].snapshot.attack_survivals.length,15);
      assert.ok(result.state.achievements.unlocked[`wrath_${attack}`]);
      assert.equal(result.state.achievements.stats.pumpkinWins,0);
      assert.equal(complete(result.state,'round-one').result.duplicate,true);
    }
  }
});
