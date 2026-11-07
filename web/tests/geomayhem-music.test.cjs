const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { compose, geomayhemTracks, jukeboxTracks } = require('../music.js');

test('all ten arenas have distinct, audible, bounded original scores with quiet loop boundaries', () => {
  assert.equal(geomayhemTracks.length, 10);
  const hashes = new Set();
  for (const track of geomayhemTracks) {
    assert.ok(jukeboxTracks.some(song => song.id === track.id && song.category === 'Geomayhem'));
    const notes = [], samples = compose(track.id, 22050, notes);
    assert.ok(samples.length / 22050 > 40 && samples.length / 22050 < 66);
    let energy = 0, peak = 0;
    for (const value of samples) {
      assert.ok(Number.isFinite(value));
      energy += value * value;
      peak = Math.max(peak, Math.abs(value));
    }
    assert.ok(peak > .2 && peak <= .821);
    assert.ok(Math.sqrt(energy / samples.length) > .04);
    assert.equal(Math.abs(samples[0]), 0);
    assert.equal(Math.abs(samples.at(-1)), 0);
    assert.ok(notes.length > 100);
    assert.ok(notes.every(note => note.start >= 0 && note.duration > 0));
    hashes.add(createHash('sha256').update(Buffer.from(samples.buffer)).digest('hex'));
  }
  assert.equal(hashes.size, 10);
});
