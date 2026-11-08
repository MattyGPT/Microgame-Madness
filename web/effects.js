/* Procedural PCM effects: bit-crushed death and a cinematic physical collapse. */
(function (root) {
  'use strict';
  const DEATH_DURATION = 1.6, FINALE_DURATION = 5.4;
  function buffer(context, kind) {
    const duration = kind === 'death' ? DEATH_DURATION : FINALE_DURATION;
    const volume = kind === 'death' ? .85 : 1;
    const result = context.createBuffer(2, Math.round(duration * context.sampleRate), context.sampleRate);
    let seed = 0x51a7, low = 0, rumble = 0, held = 0, hold = 0, phase = 0;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; };
    const left = result.getChannelData(0), right = result.getChannelData(1);
    const shards = Array.from({ length: 22 }, (_, i) => ({
      delay: .04 + i * .061, pitch: 1800 + (i * 673) % 4900, pan: Math.sin(i * 2.4),
    }));
    for (let i = 0; i < left.length; i++) {
      const t = i / context.sampleRate;
      const noise = random();
      low += .065 * (noise - low);
      rumble += .006 * (noise - rumble);
      let value, stereo = 0;
      if (kind === 'death') {
        phase += (340 * Math.exp(-t * 2.8) + 25) / context.sampleRate;
        if (hold-- <= 0) {
          held = Math.round((Math.sign(Math.sin(phase * Math.PI * 2)) * .6 + noise * .4) * 7) / 7;
          hold = Math.floor(context.sampleRate / (6500 - 3900 * t / duration));
        }
        value = held * Math.min(1, t * 130) * (1 - t / duration) ** 1.6 * .252;
      } else {
        const beam = Math.min(1, t / .16) * Math.max(0, Math.min(1, (3.7 - t) / .08));
        const load = Math.min(1, Math.max(0, (t - .65) / 1.75));
        // A broad electrical sizzle over a low, irregular industrial hum.
        value = beam * (.11 * low + .045 * (noise - low) +
          Math.sin(t * 2 * Math.PI * 67 + Math.sin(t * 13) * 1.3) * .04 + rumble * load * .7);
        if (t >= 2.4 && t < 3.7) {
          const p = (t - 2.4) / 1.3;
          value += Math.sin(2 * Math.PI * (150 * p - 65 * p * p)) * .12 * p;
          value += low * p * .3 + rumble * p * 1.4;
        }
        if (t >= 3.7) {
          const boom = t - 3.7;
          value = noise * .45 * Math.exp(-boom * 10) + low * .75 * Math.exp(-boom * 3.5) +
            Math.sin(2 * Math.PI * (47 * boom - 5 * boom * boom)) * .32 * Math.exp(-boom * 3) +
            rumble * .9 * Math.exp(-boom * 2);
          for (const shard of shards) {
            const dt = boom - shard.delay;
            if (dt >= 0 && dt < .35) {
              const glass = (Math.sin(dt * shard.pitch * Math.PI * 2) +
                Math.sin(dt * shard.pitch * 1.477 * Math.PI * 2) * .3) * Math.exp(-dt * 30) * .025;
              value += glass;
              stereo += glass * shard.pan;
            }
          }
        }
        value *= Math.min(1, (duration - t) / .12);
      }
      left[i] = Math.tanh(value + stereo) * volume;
      right[i] = Math.tanh(value - stereo) * volume;
    }
    return result;
  }
  class SequencePlayer {
    constructor(context, output) {
      this.context = context;
      this.output = output;
      this.buffers = new Map();
      this.source = null;
      this.kind = null;
    }
    stop() {
      const source = this.source;
      this.source = null;
      if (source) { source.onended = null; source.stop(); source.disconnect(); }
    }
    sync(kind, age, playing) {
      if (!kind || !playing || age == null) { this.stop(); return; }
      const duration = kind === 'death' ? DEATH_DURATION : FINALE_DURATION;
      if (age >= duration - .001) { this.stop(); return; }
      let now = this.context.currentTime;
      if (this.source && this.kind === kind && Math.abs(this.offset + now - this.started - age) < .16) return;
      this.stop();
      if (!this.buffers.has(kind)) this.buffers.set(kind, buffer(this.context, kind));
      now = this.context.currentTime;
      const source = this.context.createBufferSource();
      source.buffer = this.buffers.get(kind);
      source.connect(this.output);
      this.kind = kind;
      this.offset = Math.max(0, age);
      this.started = now;
      this.source = source;
      source.onended = () => { source.disconnect(); if (this.source === source) this.source = null; };
      source.start(now, this.offset);
    }
  }
  const api = { buffer, SequencePlayer, DEATH_DURATION, FINALE_DURATION };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ArcadeEffects = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
