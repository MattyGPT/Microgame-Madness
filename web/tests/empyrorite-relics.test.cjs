const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Tracker, catalog } = require('../achievements.js');
const Customs = require('../customs.js');
const rewards = ['phantom_emperor', 'living_grimoire', 'tempest_seraph', 'celestial_forge', 'abyssal_leviathan'];
test('five Empyrorite relics unlock at their exact thresholds and restore saved progress', () => {
  for (const id of rewards) {
    const custom = Customs.catalog.find(c => c.id === id);
    const achievement = catalog.find(a => a.id === custom.achievements[0]);
    assert.equal(custom.tier, 'empyrorite');
    assert.equal(achievement.tier, 'empyrorite');
    const tracker = new Tracker({ stats: { [achievement.stat]: achievement.target - 1 } });
    tracker.visit();
    assert.equal(Customs.unlocked(custom, tracker.data.unlocked), false);
    assert.equal(Customs.selected(id, tracker.data.unlocked).id, 'classic');
    tracker.update(stats => stats[achievement.stat]++);
    const restored = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
    assert.equal(Customs.selected(id, restored.data.unlocked).id, id);
    const svg = Customs.svg(custom);
    assert.ok(svg.includes('cubie-eyes') && svg.includes('cubie-smile'));
    assert.ok(!svg.includes('undefined') && !svg.includes('NaN'));
  }
});
test('Phantom Emperor counts ten real clean victories, never healed damage or duplicate snapshots', () => {
  const tracker = new Tracker();
  const finish = damage => {
    tracker.start('pumpkin', 'baby');
    const snapshot = { mode:'pumpkin', difficulty:'baby', over:true, won:true,
      damage_taken:damage, lives:10, max_lives:10 };
    tracker.observe(snapshot);
    tracker.observe(snapshot);
  };
  finish(1);
  for (let n=0;n<9;n++) finish(0);
  assert.equal(tracker.data.stats.pumpkinFlawlessWins, 9);
  assert.equal(tracker.data.unlocked.pumpkin_flawless_10, undefined);
  finish(0);
  assert.ok(tracker.data.unlocked.pumpkin_flawless_10);
  assert.equal(tracker.data.stats.pumpkinFlawlessWins, 10);
});
