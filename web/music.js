"use strict";

// Original 16-bar scores. MIDI pitches, with 0 representing a rest.
// Pulse lead + triangle bass + arpeggio + noise drums evoke a small chip synth.
const ArcadeMusic = (() => {
  const scores = {
    arcade: {
      bpm: 128,
      roots: [48, 45, 53, 55, 48, 45, 53, 55, 48, 52, 53, 55, 45, 53, 55, 48],
      chords: [[0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7],
        [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7],
        [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7],
        [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]],
      melody: [
        [72, 0, 76, 79, 76, 74, 72, 0], [69, 72, 76, 0, 79, 76, 72, 0],
        [77, 0, 76, 74, 72, 74, 77, 0], [74, 79, 0, 81, 79, 77, 74, 71],
        [72, 76, 79, 0, 84, 79, 76, 74], [72, 69, 0, 72, 76, 79, 81, 0],
        [81, 79, 77, 0, 76, 74, 72, 69], [71, 74, 79, 77, 74, 71, 72, 0],
        [84, 0, 79, 76, 79, 81, 79, 0], [83, 79, 76, 0, 74, 76, 79, 0],
        [81, 0, 77, 72, 74, 77, 81, 79], [79, 74, 71, 0, 74, 77, 79, 83],
        [84, 81, 79, 76, 72, 0, 76, 79], [81, 79, 77, 74, 72, 0, 74, 77],
        [79, 0, 77, 74, 71, 74, 79, 0], [76, 74, 72, 0, 67, 71, 72, 0],
      ],
    },
    pumpkin: {
      bpm: 156,
      roots: [38, 34, 43, 45, 38, 41, 34, 45, 38, 39, 43, 45, 34, 43, 45, 38],
      chords: [[0, 3, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7],
        [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7],
        [0, 3, 7], [0, 3, 6], [0, 3, 7], [0, 4, 7],
        [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 3, 7]],
      melody: [
        [74, 77, 81, 77, 74, 73, 74, 0], [70, 74, 77, 74, 70, 69, 70, 0],
        [79, 82, 81, 79, 77, 74, 73, 74], [73, 76, 79, 82, 81, 79, 76, 73],
        [86, 81, 77, 74, 77, 81, 86, 85], [81, 77, 72, 69, 72, 77, 81, 0],
        [82, 81, 77, 74, 70, 74, 77, 0], [73, 76, 81, 0, 82, 81, 76, 73],
        [74, 0, 86, 85, 86, 81, 77, 74], [75, 78, 81, 78, 75, 74, 75, 0],
        [79, 82, 86, 82, 79, 77, 74, 0], [85, 81, 79, 76, 73, 76, 79, 81],
        [82, 77, 74, 70, 74, 77, 82, 81], [79, 74, 70, 67, 70, 74, 79, 0],
        [73, 76, 79, 82, 85, 82, 79, 73], [74, 77, 81, 86, 81, 77, 74, 0],
      ],
    },
  };
  function compose(theme, sampleRate = 22050) {
    const score = scores[theme];
    if (!score) throw new Error(`Unknown music theme: ${theme}`);
    const beat = 60 / score.bpm;
    const samples = new Float32Array(Math.round(16 * 4 * beat * sampleRate));
    function tone(pitch, start, duration, amplitude, voice) {
      if (!pitch) return;
      const frequency = 440 * 2 ** ((pitch - 69) / 12);
      const offset = Math.round(start * sampleRate);
      const length = Math.floor(duration * sampleRate);
      for (let i = 0; i < length && offset + i < samples.length; i++) {
        const t = i / sampleRate;
        const envelope = Math.min(1, t / .004, (duration - t) / .018);
        const phase = (t * frequency) % 1;
        // Band-limit the pulse with a few odd harmonics instead of hard edges.
        const wave = voice === "bass" ? 1 - 4 * Math.abs(phase - .5)
          : (Math.sin(2 * Math.PI * phase) + Math.sin(6 * Math.PI * phase) / 3
            + Math.sin(10 * Math.PI * phase) / 5) / 1.53;
        const tremolo = theme === "pumpkin" && voice === "lead" ? .88 + .12 * Math.cos(t * 35) : 1;
        samples[offset + i] += wave * amplitude * envelope * tremolo;
      }
    }
    let seed = 7341;
    function drum(start, kind) {
      const duration = kind === "hat" ? .035 : .13;
      const offset = Math.round(start * sampleRate);
      let previousNoise = 0;
      for (let i = 0; i < duration * sampleRate && offset + i < samples.length; i++) {
        const t = i / sampleRate;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const noise = seed / 2147483648 - 1;
        const envelope = Math.min(1, t / .002) * (1 - t / duration) ** 3;
        const wave = kind === "kick" ? Math.sin(2 * Math.PI * (58 * t + 5 * (1 - Math.exp(-t * 35))))
          : kind === "hat" ? (noise - previousNoise) * .18 : noise * .5;
        samples[offset + i] += wave * envelope * (kind === "kick" ? .3 : .2);
        previousNoise = noise;
      }
    }
    for (let bar = 0; bar < 16; bar++) {
      const root = score.roots[bar], chord = score.chords[bar];
      const start = bar * 4 * beat;
      score.melody[bar].forEach((pitch, n) => tone(pitch, start + n * beat / 2, beat * .42, .21, "lead"));
      for (let n = 0; n < 8; n++) {
        tone(root + (n % 4 === 3 ? 12 : n % 2 ? 7 : 0), start + n * beat / 2, beat * .4, .24, "bass");
        drum(start + n * beat / 2, "hat");
      }
      for (let n = 0; n < 16; n++)
        tone(root + 24 + chord[[0, 1, 2, 1][n % 4]], start + n * beat / 4, beat * .18, .065, "arp");
      for (let n = 0; n < 4; n++) drum(start + n * beat, n % 2 ? "snare" : "kick");
      if (theme === "pumpkin") drum(start + beat * 2.75, "kick");
    }
    return samples;
  }

  class Player {
    constructor(context, destination = context.destination) {
      this.context = context;
      this.destination = destination;
      this.buffers = new Map();
      this.voices = new Set();
      this.current = null;
      this.theme = "arcade";
      this.offset = 0;
    }
    buffer(theme) {
      if (!this.buffers.has(theme)) {
        const data = compose(theme);
        const buffer = this.context.createBuffer(1, data.length, 22050);
        buffer.copyToChannel(data, 0);
        this.buffers.set(theme, buffer);
      }
      return this.buffers.get(theme);
    }
    retire(voice, fade) {
      const now = this.context.currentTime;
      if (voice.stopAt && voice.stopAt <= now + fade) return;
      voice.stopAt = now + fade;
      voice.gain.gain.cancelAndHoldAtTime(now);
      voice.gain.gain.setTargetAtTime(0, now, fade / 4);
      voice.source.stop(voice.stopAt);
    }
    setState({ theme, playing }) {
      if (!scores[theme]) throw new Error(`Unknown music theme: ${theme}`);
      const changed = theme !== this.theme;
      if (this.current && (changed || !playing)) {
        this.offset = (this.current.offset + this.context.currentTime - this.current.started) % this.current.source.buffer.duration;
        this.retire(this.current, playing ? .18 : .02);
        this.current = null;
      }
      if (changed) this.offset = 0;
      this.theme = theme;
      if (!playing) {
        // Include any fading old theme, so mute/pause never leaves a second loop.
        for (const voice of this.voices) this.retire(voice, .02);
        return;
      }
      if (this.current) return;
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      source.buffer = this.buffer(theme);
      source.loop = true;
      gain.gain.setValueAtTime(0, this.context.currentTime);
      gain.gain.linearRampToValueAtTime(.22, this.context.currentTime + .18);
      source.connect(gain);
      gain.connect(this.destination);
      const voice = { source, gain, offset: this.offset, started: this.context.currentTime };
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        this.voices.delete(voice);
      };
      this.voices.add(voice);
      this.current = voice;
      source.start(this.context.currentTime, this.offset);
    }
  }
  return { compose, Player };
})();
if (typeof module !== "undefined") module.exports = ArcadeMusic;
