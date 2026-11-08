const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Tracker, catalog, points } = require('../achievements.js');
const milestones = ['hangman_win_3', 'hangman_hard_3', 'hangman_perfect_3', 'typing_2',
  'dodge_20', 'cube_pet_25', 'wrath_win_2', 'dodge_close_3'];

test('eight bronze milestones unlock at their exact threshold and preserve earned dates on reload', () => {
  for (const id of milestones) {
    const item = catalog.find(a => a.id === id);
    assert.equal(item.tier, 'bronze');
    assert.equal(points[item.tier], 10);
    const tracker = new Tracker({ stats: { [item.stat]: item.target - 1 } });
    tracker.visit();
    assert.equal(tracker.data.unlocked[id], undefined);
    assert.equal(tracker.progress(item), item.target - 1);
    assert.ok(tracker.update(stats => stats[item.stat]++).earned.some(a => a.id === id));
    const restored = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
    const date = restored.data.unlocked[id];
    assert.equal(restored.visit().changed, false);
    assert.equal(restored.score, tracker.score);
    assert.equal(restored.data.unlocked[id], date);
    const returning = new Tracker({ stats: { [item.stat]: item.target } });
    assert.ok(returning.visit().earned.some(a => a.id === id));
  }
  assert.equal(catalog.filter(a => a.tier === 'bronze').length, 41);
  assert.equal(catalog.find(a => a.id === 'collect_bronze').target, 20);
});

test('new milestones use actual game events; survival, typing and close calls never add separate runs', () => {
  const tracker = new Tracker();
  for (let i = 0; i < 3; i++) {
    tracker.start('hangman', 'hard');
    const win = { mode: 'hangman', difficulty: 'hard', over: true, won: true, mistakes: 0 };
    tracker.observe(win);
    assert.equal(tracker.observe(win).changed, false);
  }
  for (const id of milestones.slice(0, 3)) assert.ok(tracker.data.unlocked[id]);
  for (let i = 0; i < 2; i++) {
    tracker.start('keyboard', 'progressive');
    tracker.observe({ mode: 'keyboard', difficulty: 'progressive', over: true, won: false, score: 1 });
    tracker.start('dodge', 'easy');
    tracker.observe({ mode: 'dodge', difficulty: 'easy', over: true, won: false, elapsed: 19, near_misses: 2 });
  }
  for (const id of ['typing_2', 'dodge_20', 'dodge_close_3']) assert.equal(tracker.data.unlocked[id], undefined);
  tracker.start('keyboard', 'progressive');
  tracker.observe({ mode: 'keyboard', difficulty: 'progressive', over: false, score: 2 });
  tracker.start('dodge', 'easy');
  tracker.observe({ mode: 'dodge', difficulty: 'easy', over: false, elapsed: 20, near_misses: 3 });
  for (const id of ['typing_2', 'dodge_20', 'dodge_close_3']) assert.ok(tracker.data.unlocked[id]);
  for (let i = 0; i < 25; i++) tracker.secret('cube');
  assert.ok(tracker.data.unlocked.cube_pet_25);
  for (let i = 0; i < 2; i++) {
    tracker.start('wrath', 'color_memory');
    tracker.observe({ mode: 'wrath', difficulty: 'color_memory', over: true, won: true, damage_taken: 1 });
  }
  assert.ok(tracker.data.unlocked.wrath_win_2);
});
