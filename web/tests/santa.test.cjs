const {test} = require('node:test');
const assert = require('node:assert/strict');
const {Tracker} = require('../achievements.js');
const Customs = require('../customs.js');
test('Santa is Gold and unlocks once from audible Christmas playback with any equipped Custom', () => {
  const tracker = new Tracker();
  const santa = Customs.catalog.find(item => item.id === 'santa');
  assert.equal(santa.tier, 'gold');
  assert.equal(tracker.hearMusic('christmas_99', 'classic', false).changed, false);
  assert.equal(Customs.unlocked(santa, tracker.data.unlocked), false);
  assert.equal(tracker.hearMusic('christmas_99', 'classic', true).earned[0].id, 'santa_song');
  const restored = new Tracker(JSON.parse(JSON.stringify(tracker.data)));
  assert.equal(Customs.unlocked(santa, restored.data.unlocked), true);
  assert.deepEqual(restored.hearMusic('christmas_99', 'classic', true).earned, []);
});
