const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { compose, composeGaster, gasterDuration, tracks, arcadeTracks, dodgeTracks, bossTracks, rockTracks, pickRockTrack, Player } = require('../music.js');
const { jukeboxTracks } = require('../music.js');

test('jukebox selects every catalog song, loops, pauses, switches, and returns to game music', () => {
  const ctx = context(), player = new Player(ctx);
  player.buffer = () => ({ duration: 60 });
  assert.equal(new Set(jukeboxTracks.map(track => track.id)).size, jukeboxTracks.length);
  assert.ok(jukeboxTracks.some(track => track.id === 'singularity'));
  for (const track of jukeboxTracks) {
    const theme = `jukebox:${track.id}`;
    player.setState({ theme, playing: true });
    assert.equal(player.track, track.id);
    assert.equal(player.current.source.loop, true);
    ctx.advance(ctx.currentTime + 2);
    player.setState({ theme, playing: false });
    assert.equal(player.offset, 2);
    ctx.advance(ctx.currentTime + 1);
    assert.equal(player.voices.size, 0);
    player.setState({ theme, playing: true });
    assert.equal(player.current.offset, 2);
  }
  player.setState({ theme: 'pumpkin', playing: true });
  ctx.advance(ctx.currentTime + 1);
  assert.equal(player.track, 'pumpkin');
  assert.equal(player.voices.size, 1);
  assert.throws(() => player.setState({ theme: 'jukebox:missing', playing: true }), /Unknown music/);
});

test('the original arcade expansion has five distinct chiptunes with bounded levels and quiet endings', () => {
  assert.equal(arcadeTracks.length, 46);
  assert.equal(arcadeTracks[0].id, 'arcade');
  assert.equal(new Set(arcadeTracks.map(track => track.title)).size, 46);
  const fingerprints = new Set();
  for (const track of arcadeTracks.filter(track => track.id === 'arcade' || track.id.startsWith('arcade_'))) {
    const samples = compose(track.id);
    fingerprints.add(createHash('sha256').update(Buffer.from(samples.buffer)).digest('hex'));
    let energy = 0, peak = 0, mean = 0;
    for (const value of samples) {
      assert.ok(Number.isFinite(value));
      energy += value * value;
      peak = Math.max(peak, Math.abs(value));
      mean += value;
    }
    assert.ok(samples.length / 22050 > 20 && samples.length / 22050 < 40);
    assert.ok(peak > .2 && peak < .9);
    assert.ok(Math.sqrt(energy / samples.length) > .08);
    assert.ok(Math.abs(mean / samples.length) < .005);
    assert.equal(Math.abs(samples[0]), 0);
    assert.equal(Math.abs(samples.at(-1)), 0);
  }
  assert.equal(fingerprints.size, 6);
});

test('five original rock songs have distinct scores, bounded audio and complete endings', () => {
  assert.equal(rockTracks.length, 5);
  assert.equal(new Set(rockTracks.map(track => track.title)).size, 5);
  const fingerprints = new Set();
  for (const track of rockTracks) {
    const samples = compose(track.id);
    fingerprints.add(createHash('sha256').update(Buffer.from(samples.buffer)).digest('hex'));
    let energy = 0, peak = 0, mean = 0;
    for (const value of samples) {
      assert.ok(Number.isFinite(value));
      energy += value * value;
      peak = Math.max(peak, Math.abs(value));
      mean += value;
    }
    assert.ok(samples.length / 22050 > 44 && samples.length / 22050 < 71);
    assert.ok(peak > .3 && peak < .81);
    assert.ok(Math.sqrt(energy / samples.length) > .08);
    assert.ok(Math.abs(mean / samples.length) < .01);
    assert.equal(Math.abs(samples[0]), 0);
    assert.equal(Math.abs(samples.at(-1)), 0);
  }
  assert.equal(fingerprints.size, 5);
  for (let i = 0; i < 5; i++) assert.equal(pickRockTrack(() => (i + .5) / 5), rockTracks[i]);
});

test('secret audio is finite, bounded, non-looping noise with quiet endpoints', () => {
  const samples = composeGaster();
  assert.equal(samples.length, Math.round(gasterDuration * 22050));
  assert.equal(Math.abs(samples[0]), 0);
  assert.equal(Math.abs(samples.at(-1)), 0);
  let energy = 0, peak = 0;
  for (const value of samples) {
    assert.ok(Number.isFinite(value));
    peak = Math.max(peak, Math.abs(value));
    energy += value * value;
  }
  assert.ok(peak > .2 && peak <= .4);
  assert.ok(Math.sqrt(energy / samples.length) > .1);
});

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
        start(time, offset) {
          this.startTime = time;
          this.offset = offset;
          this.endTime = time + this.buffer.duration - offset;
        },
        stop(time) { this.stopTime = time; this.stops.push(time); },
        disconnect() { this.disconnected = true; } };
      this.sources.push(source);
      return source;
    },
    advance(time) {
      this.currentTime = time;
      for (const source of this.sources) {
        if (!source.ended && (source.stopTime <= time || (!source.loop && source.endTime <= time))) {
          source.ended = true;
          source.onended();
        }
      }
    },
  };
  return ctx;
}

test('forty-six distinct arcade songs and the boss score have safe levels and quiet boundaries', () => {
  assert.equal(tracks.length, 46);
  assert.equal(new Set(tracks.map(track => track.id)).size, 46);
  assert.equal(new Set(tracks.map(track => track.title)).size, 46);
  assert.equal(tracks.find(track => track.id === 'hyperspeed').bpm, 212);
  assert.equal(tracks.find(track => track.id === 'velvet_tokens').bpm, 99);
  assert.ok(tracks.every(track => track.id !== 'pumpkin'));
  const fingerprints = new Set();
  for (const track of [...tracks, { id: 'pumpkin', bpm: 156 }]) {
    const samples = compose(track.id);
    let energy = 0, peak = 0, mean = 0;
    for (const value of samples) {
      assert.ok(Number.isFinite(value));
      energy += value * value;
      peak = Math.max(peak, Math.abs(value));
      mean += value;
    }
    assert.ok(samples.length / 22050 > (track.id.startsWith('arcade_') ? 20 : 24));
    assert.ok(peak < .9 && peak > .2);
    assert.ok(Math.sqrt(energy / samples.length) > .08);
    assert.ok(Math.abs(mean / samples.length) < .005);
    assert.equal(samples[0], 0);
    assert.equal(samples.at(-1), 0);
    const bars = track.id === 'arcade' || track.id === 'pumpkin' || track.id.startsWith('arcade_') ? 16 : 32;
    assert.ok(Math.abs(samples.length / 22050 - bars * 4 * 60 / track.bpm) < 1 / 22050);
    fingerprints.add(createHash('sha256').update(Buffer.from(samples.buffer)).digest('hex'));
  }
  assert.equal(fingerprints.size, tracks.length + 1);
  assert.throws(() => compose('missing'), /Unknown music/);
});

test('rock songs play once, return to arcade music, and can replay without leaking voices', () => {
  const ctx = context(), player = new Player(ctx);
  player.setState({ theme: 'arcade', playing: true });
  for (const track of rockTracks) {
    player.playOnce(track.id);
    const voice = player.current;
    assert.equal(player.theme, track.id);
    assert.equal(voice.source.loop, false);
    ctx.advance(ctx.currentTime + voice.source.buffer.duration + .01);
    assert.equal(player.theme, 'arcade');
    assert.equal(player.oneShot, null);
    assert.equal(player.current.source.loop, false);
    assert.equal(player.voices.size, 1);
    assert.ok(voice.source.disconnected && voice.gain.disconnected);
  }
});

test('mute, pause and replacement preserve a single rock song and restore the current game theme', () => {
  const ctx = context(), player = new Player(ctx);
  player.playOnce(rockTracks[0].id); // Can queue a song before audio is enabled.
  assert.equal(player.current, null);
  player.setState({ theme: 'arcade', playing: true });
  ctx.advance(3);
  player.setState({ theme: 'arcade', playing: false });
  ctx.advance(10);
  assert.equal(player.voices.size, 0);
  assert.equal(player.oneShot, rockTracks[0].id);
  assert.equal(player.offset, 3);
  player.setState({ theme: 'pumpkin', playing: true });
  assert.equal(player.theme, rockTracks[0].id);
  assert.equal(player.current.source.offset, 3);
  const outgoing = player.current;
  player.playOnce(rockTracks[0].id); // Re-entering can randomly select the same song.
  assert.equal(player.current.offset, 0);
  ctx.advance(10.2);
  assert.ok(outgoing.source.disconnected);
  assert.equal(player.voices.size, 1);
  const last = player.current;
  ctx.advance(last.started + last.source.buffer.duration + .01);
  assert.equal(player.oneShot, null);
  assert.equal(player.theme, 'pumpkin');
  assert.equal(player.voices.size, 1);
});

test('Key Rush has an original 48-second theme with safe audio levels outside the arcade shuffle', () => {
  assert.ok(tracks.every(track => track.id !== 'keyrush'));
  const samples = compose('keyrush');
  assert.equal(samples.length, 48 * 22050);
  let peak = 0, energy = 0, mean = 0;
  for (const value of samples) {
    assert.ok(Number.isFinite(value));
    peak = Math.max(peak, Math.abs(value));
    energy += value * value;
    mean += value;
  }
  assert.ok(peak > .2 && peak < .9);
  assert.ok(Math.sqrt(energy / samples.length) > .08);
  assert.ok(Math.abs(mean / samples.length) < .005);
  assert.equal(samples[0], 0);
  assert.equal(samples.at(-1), 0);
  assert.notEqual(createHash('sha256').update(Buffer.from(samples.buffer)).digest('hex'),
    createHash('sha256').update(Buffer.from(compose('arcade').buffer)).digest('hex'));
});

test('Hangman has an original 64-second theme with safe audio levels outside the arcade shuffle', () => {
  assert.ok(tracks.every(track => track.id !== 'hangman'));
  const samples = compose('hangman');
  assert.equal(samples.length, 64 * 22050);
  let peak = 0, energy = 0, mean = 0;
  for (const value of samples) {
    assert.ok(Number.isFinite(value));
    peak = Math.max(peak, Math.abs(value));
    energy += value * value;
    mean += value;
  }
  assert.ok(peak > .2 && peak < .9);
  assert.ok(Math.sqrt(energy / samples.length) > .08);
  assert.ok(Math.abs(mean / samples.length) < .005);
  assert.equal(samples[0], 0);
  assert.equal(samples.at(-1), 0);
  const hash = data => createHash('sha256').update(Buffer.from(data.buffer)).digest('hex');
  assert.notEqual(hash(samples), hash(compose('arcade')));
  assert.notEqual(hash(samples), hash(compose('keyrush')));
});

test('Turtle Dodge has four distinct themes with rising tempos and bounded, click-free audio', () => {
  assert.deepEqual(dodgeTracks.map(track => track.difficulty), ['easy', 'normal', 'hard', 'merciless']);
  assert.equal(new Set(dodgeTracks.map(track => track.title)).size, 4);
  const fingerprints = new Set();
  for (const [index, track] of dodgeTracks.entries()) {
    assert.ok(!tracks.some(arcade => arcade.id === track.id));
    if (index) assert.ok(track.bpm > dodgeTracks[index - 1].bpm);
    const samples = compose(track.id);
    assert.ok(Math.abs(samples.length / 22050 - 128 * 60 / track.bpm) < 1 / 22050);
    let peak = 0, energy = 0, mean = 0;
    for (const value of samples) {
      assert.ok(Number.isFinite(value));
      peak = Math.max(peak, Math.abs(value));
      energy += value * value;
      mean += value;
    }
    assert.ok(peak > .2 && peak < .9);
    assert.ok(Math.sqrt(energy / samples.length) > .08);
    assert.ok(Math.abs(mean / samples.length) < .005);
    assert.equal(samples[0], 0);
    assert.equal(samples.at(-1), 0);
    fingerprints.add(createHash('sha256').update(Buffer.from(samples.buffer)).digest('hex'));
  }
  assert.equal(fingerprints.size, 4);
});

test('Boss Crush rock themes get heavier and Impossible quotes the Pumpkin King opening motif', () => {
  assert.deepEqual(bossTracks.map(track => track.difficulty), ['mean', 'cruel', 'nightmare', 'impossible']);
  assert.equal(new Set(bossTracks.map(track => track.title)).size, 4);
  const fingerprints = new Set();
  for (const [index, track] of bossTracks.entries()) {
    assert.ok(!tracks.some(arcade => arcade.id === track.id));
    assert.ok(!rockTracks.some(secret => secret.id === track.id));
    if (index) {
      assert.ok(track.bpm > bossTracks[index - 1].bpm);
      assert.ok(track.drive > bossTracks[index - 1].drive);
      assert.ok(track.chugs >= bossTracks[index - 1].chugs);
    }
    const samples = compose(track.id);
    assert.ok(Math.abs(samples.length / 22050 - 128 * 60 / track.bpm) < 1 / 22050);
    let peak = 0, energy = 0, mean = 0;
    for (const value of samples) {
      assert.ok(Number.isFinite(value));
      peak = Math.max(peak, Math.abs(value));
      energy += value * value;
      mean += value;
    }
    assert.ok(peak > .3 && peak < .81);
    assert.ok(Math.sqrt(energy / samples.length) > .08);
    assert.ok(Math.abs(mean / samples.length) < .01);
    assert.equal(samples[0], 0);
    assert.equal(samples.at(-1), 0);
    fingerprints.add(createHash('sha256').update(Buffer.from(samples.buffer)).digest('hex'));
  }
  assert.equal(fingerprints.size, 4);
  assert.deepEqual(bossTracks.find(track => track.difficulty === 'impossible').riffs[0]
    .map(pitch => pitch === null ? 0 : pitch + 62), [74, 77, 81, 77, 74, 73, 74, 0]);
});

for (const [theme, title] of [['keyrush', 'Key Rush'], ['hangman', 'Hangman'],
  ...dodgeTracks.map(track => [track.id, `Turtle Dodge ${track.difficulty}`]),
  ...bossTracks.map(track => [track.id, `Boss Crush ${track.difficulty}`])])
test(`${title} loops, resumes its position, and returns after a secret song without leaking voices`, () => {
  const ctx = context(), player = new Player(ctx);
  player.setState({ theme, playing: true });
  assert.equal(player.track, theme);
  assert.equal(player.current.source.loop, true);
  const first = player.current;
  const duration = first.source.buffer.duration;
  for (let frame = 0; frame < 100; frame++) player.setState({ theme, playing: true });
  assert.equal(player.current, first);
  ctx.advance(duration + 2.5); // Continue beyond a full loop.
  player.setState({ theme, playing: false });
  assert.ok(Math.abs(player.offset - 2.5) < 1e-9);
  ctx.advance(duration + 3);
  assert.equal(player.voices.size, 0);
  player.setState({ theme, playing: true });
  assert.ok(Math.abs(player.current.offset - 2.5) < 1e-9);
  assert.equal(player.current.source.buffer, first.source.buffer);
  player.playOnce(rockTracks[0].id);
  const rock = player.current;
  ctx.advance(rock.started + rock.source.buffer.duration + .01);
  assert.equal(player.theme, theme);
  assert.equal(player.current.source.loop, true);
  assert.equal(player.voices.size, 1);
  player.setState({ theme: 'arcade', playing: true });
  ctx.advance(ctx.currentTime + .2);
  assert.equal(player.voices.size, 1);
  assert.equal(player.current.source.loop, false);
  assert.notEqual(player.track, theme);
});

test('Singularity has a separate looping theme with pause and return to the arcade', () => {
  assert.ok(tracks.every(track => track.id !== 'singularity'));
  const samples = compose('singularity');
  assert.ok(samples.every(Number.isFinite));
  assert.ok(samples.some(value => Math.abs(value) > .1));
  assert.ok(Math.abs(samples.length / 22050 - 48 * 4 * 60 / 78) < 1 / 22050,
    'the extended cinematic arrangement lasts 48 bars');
  const bar = 4 * 60 / 78;
  const rms = (start, end) => {
    let sum = 0;
    const first = Math.round(start * 22050), last = Math.round(end * 22050);
    for (let i = first; i < last; i++) sum += samples[i] ** 2;
    return Math.sqrt(sum / (last - first));
  };
  assert.ok(rms(16 * bar, 20 * bar) > rms(0, 4 * bar) * 1.8, 'first drop has real dynamic impact');
  assert.ok(rms(16 * bar, 20 * bar) > rms(12 * bar, 15 * bar) * 1.5,
    'post-drop section stays distinctly louder than the buildup');
  assert.ok(rms(36 * bar, 40 * bar) > rms(16 * bar, 20 * bar) * 1.05,
    'the final drop intensifies beyond the first');
  assert.ok(rms(36 * bar, 40 * bar) > rms(25 * bar, 27 * bar) * 2, 'final drop returns strongly after the interlude');
  for (const drop of [16, 32])
    assert.ok(rms(drop * bar - .2, drop * bar - .02) < .001, 'pre-drop silence includes reverb tails');
  let peak = 0, mean = 0, opening = 0, climax = 0;
  for (let i = 0; i < samples.length; i++) {
    const value = samples[i];
    peak = Math.max(peak, Math.abs(value));
    mean += value;
    if (i < 8 * 22050) opening += value * value;
    if (i >= 25 * 22050 && i < 35 * 22050) climax += value * value;
  }
  assert.ok(peak < .85, 'leave headroom for gameplay effects');
  assert.ok(Math.abs(mean / samples.length) < .005, 'avoid DC offset');
  assert.ok(climax / 10 > opening / 8 * 1.5, 'build from low strings into the full ensemble');
  assert.equal(samples[0], 0);
  assert.equal(samples.at(-1), 0);
  const ctx = context(), player = new Player(ctx);
  player.setState({ theme: 'singularity', playing: true });
  assert.equal(player.track, 'singularity');
  assert.equal(player.current.source.loop, true);
  ctx.advance(2.5);
  player.setState({ theme: 'singularity', playing: false });
  assert.equal(player.offset, 2.5);
  ctx.advance(3);
  player.setState({ theme: 'singularity', playing: true });
  assert.equal(player.current.offset, 2.5);
  player.setState({ theme: 'arcade', playing: true });
  ctx.advance(3.2);
  assert.equal(player.voices.size, 1);
  assert.notEqual(player.track, 'singularity');
  assert.equal(player.current.source.loop, false);
});

test('repeated state updates keep one loop and a theme change cleans up the outgoing voice', () => {
  const ctx = context(), player = new Player(ctx);
  player.setState({ theme: 'arcade', playing: true });
  const first = player.current;
  for (let i = 0; i < 100; i++) player.setState({ theme: 'arcade', playing: true });
  assert.equal(ctx.sources.length, 1);
  assert.equal(first.source.loop, false);
  ctx.advance(3);
  player.setState({ theme: 'pumpkin', playing: true });
  assert.notEqual(player.current.source.buffer, first.source.buffer);
  assert.equal(player.theme, 'pumpkin');
  assert.equal(player.track, 'pumpkin');
  assert.equal(player.current.source.loop, true);
  assert.equal(player.voices.size, 2); // Brief crossfade, not two permanent songs.
  ctx.advance(3.2);
  assert.equal(player.voices.size, 1);
  assert.ok(first.source.disconnected && first.gain.disconnected);
  player.setState({ theme: 'arcade', playing: true });
  assert.notEqual(player.track, first.track);
  assert.equal(player.buffer(first.track), first.source.buffer);
  assert.equal(ctx.buffers.length, 3);
  assert.throws(() => player.setState({ theme: 'missing', playing: true }), /Unknown music/);
});

test('song endings play every track once per shuffle and never repeat across playlist boundaries', () => {
  const ctx = context(), player = new Player(ctx, ctx.destination, () => 0);
  const heard = [];
  player.setState({ theme: 'arcade', playing: true });
  for (let i = 0; i < tracks.length * 3; i++) {
    const voice = player.current;
    heard.push(player.track);
    assert.equal(voice.source.loop, false);
    ctx.advance(voice.started + voice.source.buffer.duration - voice.offset + .001);
    assert.ok(voice.source.disconnected && voice.gain.disconnected);
    assert.equal(player.voices.size, 1);
    assert.equal(player.offset, 0);
    assert.notEqual(player.track, voice.track);
  }
  for (let i = 0; i < heard.length; i += tracks.length)
    assert.deepEqual([...heard.slice(i, i + tracks.length)].sort(), tracks.map(track => track.id).sort());
  assert.equal(ctx.buffers.length, tracks.length); // A replay uses its cached audio.
});

test('the first track and the playlist order use randomness', () => {
  const ctx = context();
  const low = new Player(ctx, ctx.destination, () => 0);
  const high = new Player(ctx, ctx.destination, () => .99999);
  const order = player => Array.from({ length: tracks.length }, () => player.nextTrack());
  const first = order(low), second = order(high);
  assert.notEqual(first[0], second[0]);
  assert.notDeepEqual(first, second);
  assert.deepEqual([...first].sort(), [...second].sort());
});

test('pausing arcade music preserves the song, position, and remaining shuffle order', () => {
  const ctx = context(), player = new Player(ctx);
  player.setState({ theme: 'arcade', playing: true });
  const voice = player.current, queue = [...player.queue];
  ctx.advance(7);
  player.setState({ theme: 'arcade', playing: false });
  ctx.advance(50); // The stopped source must not advance the playlist.
  assert.equal(player.current, null);
  assert.equal(player.voices.size, 0);
  assert.equal(player.offset, 7);
  assert.equal(player.track, voice.track);
  assert.deepEqual(player.queue, queue);
  player.setState({ theme: 'arcade', playing: true });
  assert.equal(player.current.track, voice.track);
  assert.equal(player.current.source.buffer, voice.source.buffer);
  assert.equal(player.current.offset, 7);
  assert.deepEqual(player.queue, queue);
  ctx.advance(player.current.started + player.current.source.buffer.duration - 7 + .001);
  assert.equal(player.track, queue[0]);
});

test('late end events from fading themes do not change the new song or restart muted music', () => {
  const ctx = context(), player = new Player(ctx);
  player.setState({ theme: 'arcade', playing: true });
  const first = player.current;
  player.setState({ theme: 'pumpkin', playing: true });
  const boss = player.current;
  player.setState({ theme: 'arcade', playing: true });
  const returning = player.current, queue = [...player.queue];
  ctx.advance(.2);
  assert.equal(player.current, returning);
  assert.ok(first.source.disconnected && boss.source.disconnected);
  assert.deepEqual(player.queue, queue);
  player.setState({ theme: 'arcade', playing: false });
  ctx.advance(1);
  assert.equal(player.current, null);
  assert.equal(player.voices.size, 0);
  assert.deepEqual(player.queue, queue);
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

test('muting and interruptions preserve the selected arcade track without skipping it', () => {
  const ctx = context(), player = new Player(ctx);
  player.setState({ theme: 'arcade', playing: true });
  ctx.advance(player.current.source.buffer.duration + .001);
  const selected = player.track;
  assert.ok(arcadeTracks.some(track => track.id === selected));
  ctx.advance(ctx.currentTime + 3);
  player.setState({ theme: 'arcade', playing: false });
  const offset = player.offset;
  ctx.advance(ctx.currentTime + 40);
  assert.equal(player.voices.size, 0);
  assert.equal(player.track, selected);
  player.setState({ theme: 'arcade', playing: true });
  assert.equal(player.current.offset, offset);
  player.setState({ theme: 'pumpkin', playing: true });
  assert.equal(player.current.source.loop, true);
  player.setState({ theme: 'arcade', playing: true });
  const returning = player.track;
  const queue = [...player.queue];
  player.playOnce(rockTracks[0].id);
  const rock = player.current;
  ctx.advance(rock.started + rock.source.buffer.duration + .001);
  assert.equal(player.theme, 'arcade');
  assert.equal(player.track, returning);
  assert.deepEqual(player.queue, queue);
  assert.equal(player.voices.size, 1);
});

test('melody pulses follow synthesized notes, rests, pause and loop position', () => {
  for (const track of ['arcade', 'singularity', rockTracks[0].id, bossTracks[0].id]) {
    const notes = [];
    compose(track, 1000, notes);
    assert.ok(notes.length > 0, track);
    assert.ok(notes.every(n => Number.isFinite(n.start) && n.duration > 0));
  }
  const player = new Player(context());
  player.playing = true;
  player.current = { track: 'test', offset: 0, started: 0, source: { loop: true, buffer: { duration: 2 } } };
  player.melodyNotes.set('test', [{ start: .5, duration: .2 }]);
  player.context.currentTime = .52;
  const pulse = player.melodyPulse();
  assert.ok(pulse > 0 && pulse <= 1);
  // A .2-second note now finishes its visual pulse after .2 / 1.5 seconds.
  player.context.currentTime = .62;
  assert.ok(player.melodyPulse() > 0);
  player.context.currentTime = .64;
  assert.equal(player.melodyPulse(), 0);
  player.context.currentTime = 1;
  assert.equal(player.melodyPulse(), 0);
  player.context.currentTime = 2.52;
  assert.ok(Math.abs(player.melodyPulse() - pulse) < 1e-10);
  player.playing = false;
  assert.equal(player.melodyPulse(), 0);
});

test('new arcade tempos and cinematic aftermath are available with safe, louder looping playback', () => {
  for (const [id, bpm] of [['starburst_255', 255], ['slow_orbit', 55], ['christmas_99', 99]])
    assert.equal(jukeboxTracks.find(track => track.id === id).bpm, bpm);
  const samples = compose('core_aftermath', 8000);
  assert.ok(samples.every(value => Number.isFinite(value) && Math.abs(value) < .9));
  const ctx = context(), player = new Player(ctx);
  player.buffer = () => ({duration:60});
  player.setState({theme:'core_aftermath', playing:true});
  assert.equal(player.current.source.loop, true);
  assert.equal(player.current.gain.gain.value, .36);
  player.setState({theme:'arcade', playing:true});
  assert.equal(player.current.gain.gain.value, .22);
});


test('welcome music plays in its cutscene and jukebox but stays out of arcade shuffle', () => {
  assert.ok(!arcadeTracks.some(track => track.id === 'cubie_hello'));
  assert.ok(jukeboxTracks.some(track => track.id === 'cubie_hello'));
  const player = new Player(context());
  player.buffer = () => ({duration: 60});
  player.setState({theme:'cubie_hello', playing:true});
  assert.equal(player.track, 'cubie_hello');
  assert.equal(player.current.source.loop, true);
  player.setState({theme:'arcade', playing:true});
  assert.notEqual(player.track, 'cubie_hello');
  player.setState({theme:'jukebox:cubie_hello', playing:true});
  assert.equal(player.track, 'cubie_hello');
  assert.equal(player.current.source.loop, true);
});
