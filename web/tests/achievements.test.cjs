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
  assert.deepEqual(points, { bronze: 10, silver: 30, gold: 90 });
  for (const raw of [null, [], 'bad', { stats: { hangmanWins: -1, typingBest: Infinity }, unlocked: { welcome: 'bad', fake: '2026-01-01' } }]) {
    const clean = new Tracker(raw);
    assert.equal(clean.score, 0);
    assert.equal(clean.data.stats.hangmanWins, 0);
    assert.deepEqual(ids(clean.visit()), ['welcome']);
  }
  assert.equal(new Set(catalog.map(item => item.id)).size, catalog.length);
  assert.equal(catalog.length, 30);
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
