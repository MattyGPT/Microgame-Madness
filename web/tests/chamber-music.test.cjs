const { test } = require('node:test');
const assert = require('node:assert/strict');
const { compose, jukeboxTracks } = require('../music.js');
test('four instrumental jukebox songs have distinct arrangements, headroom and clean endings', () => {
  const durations = [];
  for (const id of ['dragon_dance', 'lantern_market', 'rain_on_glass', 'sunwheel_parade']) {
    assert.ok(jukeboxTracks.some(track => track.id === id));
    const notes = [], samples = compose(id, 22050, notes);
    durations.push(samples.length / 22050);
    let peak = 0, energy = 0;
    for (const sample of samples) {
      assert.ok(Number.isFinite(sample));
      peak = Math.max(peak, Math.abs(sample)); energy += sample * sample;
    }
    assert.ok(peak <= .821 && peak > .3);
    assert.ok(Math.sqrt(energy / samples.length) > .025);
    assert.equal(samples[0], 0); assert.equal(samples.at(-1), 0);
    assert.ok(notes.length > 100);
    assert.ok(notes.every(note => note.start >= 0 && note.duration > 0));
  }
  assert.ok(durations[0] >= 150);
  assert.ok(durations.slice(1).every(duration => duration > 60 && duration < durations[0]));
});
