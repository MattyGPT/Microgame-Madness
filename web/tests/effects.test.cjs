const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buffer, SequencePlayer } = require('../effects.js');
function context() {
  return { currentTime: 0, sampleRate: 22050, sources: [],
    createBuffer(channels, length, rate) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { duration: length / rate, getChannelData: n => data[n] };
    },
    createBufferSource() {
      const source = { connect() {}, disconnect() {}, stop() { this.stopped = true; },
        start(time, offset) { this.time = time; this.offset = offset; } };
      this.sources.push(source); return source;
    } };
}
test('death and cinematic PCM have exact durations, finite levels, and a strong final explosion', () => {
  const c = context();
  const death = buffer(c, 'death'), finale = buffer(c, 'finale');
  assert.equal(death.duration, 1.6);
  assert.equal(finale.duration, 5.4);
  for (const b of [death, finale]) for (let channel = 0; channel < 2; channel++)
    assert.ok(b.getChannelData(channel).every(v => Number.isFinite(v) && Math.abs(v) <= 1));
  const data = finale.getChannelData(0);
  const rms = (a,b) => Math.sqrt(data.slice(a*c.sampleRate,b*c.sampleRate).reduce((s,v)=>s+v*v,0)/((b-a)*c.sampleRate));
  assert.ok(rms(3.7,3.85) > rms(.4,.55) * 2);
  assert.ok(rms(4.3,4.6) > .005);
  assert.notDeepEqual(finale.getChannelData(0), finale.getChannelData(1));
});
test('sequence audio follows the animation clock through mute, pause, replacement, and completion', () => {
  const c = context(), player = new SequencePlayer(c, {});
  player.sync('finale', .4, true);
  assert.equal(player.source.offset, .4);
  c.currentTime = .1;
  player.sync('finale', .5, true);
  assert.equal(c.sources.length, 1);
  const first = player.source;
  player.sync('finale', .5, false);
  assert.equal(first.stopped, true);
  assert.equal(player.source, null);
  player.sync('finale', .5, true);
  assert.equal(player.source.offset, .5);
  player.sync('death', 0, true);
  assert.equal(player.source.buffer.duration, 1.6);
  player.sync('death', 1.6, true);
  assert.equal(player.source, null);
  player.sync(null, null, true);
  assert.equal(player.source, null);
});

test('Reset sounds escalate in duration and loudness without clipping', () => {
  const { resetBuffer } = require('../effects.js');
  const c = context();
  const sounds = [0, 1, 2].map(stage => resetBuffer(c, stage));
  const rms = b => Math.sqrt(b.getChannelData(0).reduce((sum, x) => sum + x*x, 0) / b.getChannelData(0).length);
  assert.ok(sounds[0].duration < sounds[1].duration && sounds[1].duration < sounds[2].duration);
  assert.ok(rms(sounds[0]) < rms(sounds[1]) && rms(sounds[1]) < rms(sounds[2]));
  for (const sound of sounds) assert.ok(sound.getChannelData(0).every(x => Number.isFinite(x) && Math.abs(x) < .25));
});
