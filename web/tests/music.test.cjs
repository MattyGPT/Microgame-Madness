const { test } = require('node:test');
const assert = require('node:assert/strict');
const { compose, Player } = require('../music.js');

function context() {
  const ctx = { currentTime: 0, destination: {}, sources: [], buffers: [],
    createBuffer(channels, length, rate) {
      const buffer = { duration: length / rate, copyToChannel(data) { this.data = data; } };
      this.buffers.push(buffer);
      return buffer;
    },
    createGain() {
      return { gain: { value: 0, cancelAndHoldAtTime() {},
        setValueAtTime(value) { this.value = value; },
        linearRampToValueAtTime(value) { this.value = value; },
        setTargetAtTime(value) { this.value = value; } },
        connect() {}, disconnect() { this.disconnected = true; } };
    },
    createBufferSource() {
      const source = { stops: [], connect() {},
        start(time, offset) { this.startTime = time; this.offset = offset; },
        stop(time) { this.stopTime = time; this.stops.push(time); },
        disconnect() { this.disconnected = true; } };
      this.sources.push(source);
      return source;
    },
    advance(time) {
      this.currentTime = time;
      for (const source of this.sources) {
        if (!source.ended && source.stopTime <= time) {
          source.ended = true;
          source.onended();
        }
      }
    },
  };
  return ctx;
}

test('original chiptune loops have bounded levels and quiet seams, with a faster boss tempo', () => {
  const tracks = ['arcade', 'pumpkin'].map(theme => compose(theme));
  assert.ok(tracks[0].length > tracks[1].length);
  for (const samples of tracks) {
    let energy = 0, peak = 0, mean = 0;
    for (const value of samples) {
      assert.ok(Number.isFinite(value));
      energy += value * value;
      peak = Math.max(peak, Math.abs(value));
      mean += value;
    }
    assert.ok(samples.length / 22050 > 24);
    assert.ok(peak < .9 && peak > .2);
    assert.ok(Math.sqrt(energy / samples.length) > .08);
    assert.ok(Math.abs(mean / samples.length) < .005);
    assert.equal(samples[0], 0);
    assert.equal(samples.at(-1), 0);
  }
  assert.throws(() => compose('missing'), /Unknown music/);
});

test('repeated state updates keep one loop and a theme change cleans up the outgoing voice', () => {
  const ctx = context(), player = new Player(ctx);
  player.setState({ theme: 'arcade', playing: true });
  const first = player.current;
  for (let i = 0; i < 100; i++) player.setState({ theme: 'arcade', playing: true });
  assert.equal(ctx.sources.length, 1);
  assert.equal(first.source.loop, true);
  ctx.advance(3);
  player.setState({ theme: 'pumpkin', playing: true });
  assert.notEqual(player.current.source.buffer, first.source.buffer);
  assert.equal(player.theme, 'pumpkin');
  assert.equal(player.voices.size, 2); // Brief crossfade, not two permanent songs.
  ctx.advance(3.2);
  assert.equal(player.voices.size, 1);
  assert.ok(first.source.disconnected && first.gain.disconnected);
  player.setState({ theme: 'arcade', playing: true });
  assert.equal(player.current.source.buffer, first.source.buffer);
  assert.equal(ctx.buffers.length, 2);
});

test('pause and mute preserve position, stop every voice, and never postpone pending stops', () => {
  const ctx = context(), player = new Player(ctx);
  player.setState({ theme: 'pumpkin', playing: true });
  ctx.advance(4);
  player.setState({ theme: 'pumpkin', playing: false });
  const paused = ctx.sources[0];
  assert.equal(player.current, null);
  assert.equal(player.offset, 4);
  for (const time of [4.005, 4.01, 4.015]) {
    ctx.advance(time);
    player.setState({ theme: 'pumpkin', playing: false });
  }
  assert.deepEqual(paused.stops, [4.02]);
  ctx.advance(5);
  assert.equal(player.voices.size, 0);
  player.setState({ theme: 'pumpkin', playing: true });
  assert.equal(player.current.source.offset, 4);
  player.setState({ theme: 'arcade', playing: true });
  player.setState({ theme: 'arcade', playing: false });
  ctx.advance(5.03);
  assert.equal(player.voices.size, 0);
  player.setState({ theme: 'pumpkin', playing: false });
  assert.equal(player.offset, 0);
  assert.equal(player.current, null);
  player.setState({ theme: 'pumpkin', playing: true });
  assert.equal(player.current.source.offset, 0);
});
