/* An original, procedural origin film: no downloaded video or audio assets. */
(() => {
  'use strict';
  const duration = 23, TAU = Math.PI * 2;
  const cues = { planetStart: 2.1, planetStep: .87, planetFall: 2.4, collapse: 10.5,
    armorStart: 13.1, armorStep: .24, armorTravel: 2.15, title: 18.3 };
  const clamp = v => Math.max(0, Math.min(1, v));
  const ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const mix = (a, b, t) => a + (b - a) * t;
  const noise = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const chapters = ['THE LAST SUN', 'WORLDS FALL SILENT', 'COLLAPSE', 'AN IMPOSSIBLE HEART', 'CONTAINMENT FORMED'];
  function chapter(t) { return chapters[t < 3 ? 0 : t < 8.5 ? 1 : t < 11 ? 2 : t < 15 ? 3 : 4]; }
  function circle(c, x, y, r, color) {
    if (r <= 0) return;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = color; c.fill();
  }
  function glow(c, x, y, r, color) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'transparent');
    circle(c, x, y, r, g);
  }
  function ellipse(c, rx, ry, color, width, start = 0, end = TAU) {
    c.beginPath(); c.ellipse(0, 0, rx, ry, -.13, start, end);
    c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }
  function draw(c, t, w, h) {
    c.save();
    c.fillStyle = '#02040d'; c.fillRect(0, 0, w, h);
    const zoom = mix(1, 1.38, ease((t - 10) / 8));
    const unit = Math.min(w / 1200, h / 780);
    const cx = w / 2, cy = h * .45;
    for (let i = 0; i < 220; i++) {
      const x = noise(i + 1) * w, y = noise(i + 700) * h;
      const brightness = .16 + noise(i + 1200) * .55;
      circle(c, x, y, (.4 + noise(i + 400) * 1.3) * Math.min(1.5, unit),
        `rgba(185,207,255,${brightness * (.85 + .15 * Math.sin(t * .7 + i))})`);
    }
    c.translate(cx, cy); c.scale(unit * zoom, unit * zoom);
    glow(c, -250, -100, 600, 'rgba(74,29,112,.13)');
    glow(c, 300, 100, 480, 'rgba(16,62,108,.13)');
    // Thin orbital traces dissolve as their planets are pulled out of orbit.
    if (t < 9.4) {
      c.save(); c.globalAlpha = (1 - ease((t - 5) / 4)) * .22;
      for (let i = 0; i < 5; i++) ellipse(c, 210 + i * 64, 88 + i * 35, '#a4bded', 1);
      c.restore();
    }
    const collapse = ease((t - 8.3) / 2.25);
    const sunR = mix(88 + 48 * ease(t / 7), 3, collapse);
    if (t < 10.7) {
      glow(c, 0, 0, sunR * 3.6, `rgba(255,61,12,${.3 * (1 - collapse)})`);
      // Corona, hot flowing surface, and fine animated solar prominences.
      for (let i = 0; i < 50; i++) {
        const a = i / 50 * TAU + t * .035;
        const rr = sunR * (1.12 + .11 * Math.sin(i * 2.3 + t * 2));
        c.save(); c.rotate(a); c.strokeStyle = `rgba(255,103,32,${.14 * (1 - collapse)})`;
        c.lineWidth = 3; c.beginPath(); c.moveTo(sunR * .92, -5);
        c.bezierCurveTo(rr * 1.15, -25, rr * 1.18, 25, sunR * .95, 8); c.stroke(); c.restore();
      }
      const sun = c.createRadialGradient(-sunR * .25, -sunR * .32, 2, 0, 0, sunR);
      sun.addColorStop(0, '#fff3ac'); sun.addColorStop(.33, '#ffc05d');
      sun.addColorStop(.72, '#f35b25'); sun.addColorStop(.95, '#ad261a'); sun.addColorStop(1, '#ffae4a');
      circle(c, 0, 0, sunR, sun);
      c.save(); c.beginPath(); c.arc(0, 0, sunR, 0, TAU); c.clip();
      for (let i = 0; i < 105; i++) {
        const a = noise(i + 90) * TAU + t * (.03 + noise(i) * .03);
        const r = Math.sqrt(noise(i + 330)) * sunR;
        glow(c, Math.cos(a) * r, Math.sin(a) * r, sunR * (.05 + noise(i + 9) * .15),
          i % 3 ? 'rgba(255,230,105,.22)' : 'rgba(111,18,9,.3)');
      }
      c.restore();
    }
    const planetColors = [['#92edf3', '#197ba7'], ['#e3be92', '#9d5c4e'], ['#a8aaef', '#3c428e'], ['#efbc81', '#a84c28'], ['#9fe3ae', '#347d72']];
    for (let i = 4; i >= 0; i--) {
      const pull = ease((t - (cues.planetStart + i * cues.planetStep)) / cues.planetFall);
      if (pull >= 1) continue;
      const a = i * 2.28 + t * (.1 + i * .012) + pull * 2.7;
      const rx = (220 + i * 65) * (1 - pull), ry = (100 + i * 34) * (1 - pull);
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      const r = (13 + i * 3) * (1 - pull * .7);
      // Debris follows the actual spiral trajectory rather than a straight tail.
      for (let j = 24; j > 0; j--) {
        const q = Math.max(0, pull - j * .006), aa = a - j * .023;
        circle(c, Math.cos(aa) * (220 + i * 65) * (1 - q), Math.sin(aa) * (100 + i * 34) * (1 - q),
          r * .36 * (1 - j / 25), `rgba(255,168,97,${pull * (1 - j / 25) * .55})`);
      }
      glow(c, x, y, r * 2.5, `rgba(255,135,78,${pull * .5})`);
      const pg = c.createRadialGradient(x - r * .4, y - r * .4, 0, x, y, r);
      pg.addColorStop(0, planetColors[i][0]); pg.addColorStop(.55, planetColors[i][1]); pg.addColorStop(1, '#080f25');
      circle(c, x, y, r, pg);
      c.save(); c.translate(x, y); c.rotate(-.3); c.globalAlpha = 1 - pull;
      if (i === 2) { ellipse(c, r * 1.9, r * .38, '#bca4df', 3, 0, Math.PI); }
      c.beginPath(); c.arc(-r * .07, -r * .05, r * .78, -2.5, -.7);
      c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1; c.stroke(); c.restore();
    }
    // The star's light is drawn inward before a single soft shock wave expands.
    const birth = ease((t - 10.05) / 1.25);
    if (t > 8.5 && t < 11.4) {
      const fall = ease((t - 8.5) / 2.2);
      c.save(); c.globalAlpha = Math.sin(fall * Math.PI) * .6;
      for (let i = 0; i < 65; i++) {
        const a = noise(i + 2200) * TAU, r = mix(400, 15, fall);
        c.beginPath(); c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        c.lineTo(Math.cos(a) * (r + 35), Math.sin(a) * (r + 35));
        c.strokeStyle = '#fdb698'; c.lineWidth = .8; c.stroke();
      }
      c.restore();
    }
    if (t > cues.collapse && t < cues.collapse + 2.7) {
      const wave = (t - cues.collapse) / 2.7;
      c.save(); c.globalAlpha = Math.pow(1 - wave, 2) * .65;
      ellipse(c, 70 + wave * 620, 70 + wave * 620, '#b69aff', 2 + (1 - wave) * 9);
      c.restore();
    }
    if (birth > 0) {
      c.save(); c.globalAlpha = birth;
      glow(c, 0, 0, 290, 'rgba(100,61,216,.25)');
      // Lensed light arches over the event horizon, with a separate foreground disk.
      for (let i = 12; i >= 0; i--) {
        c.beginPath(); c.ellipse(0, -2, 89 + i * 1.1, 101 + i * .6, 0, Math.PI, TAU);
        c.strokeStyle = `rgba(164,128,255,${.018 + (12 - i) * .005})`; c.lineWidth = 5; c.stroke();
      }
      for (let i = 0; i < 14; i++) ellipse(c, 145 + i * 3, 25 + i * 1.35,
        i % 3 ? 'rgba(144,98,255,.22)' : 'rgba(255,184,135,.25)', 1.8);
      circle(c, 0, 0, 91, '#000108');
      for (let i = 12; i >= 1; i--) {
        c.beginPath(); c.arc(0, 0, 86 + i * .6, 0, TAU); c.lineWidth = 2;
        c.strokeStyle = `rgba(177,140,255,${.045 + (12 - i) * .015})`; c.stroke();
      }
      circle(c, 0, 0, 81, '#000007');
      // Eight beveled armor plates visibly arrive from different directions.
      for (let i = 0; i < 8; i++) {
        const land = ease((t - cues.armorStart - i * cues.armorStep) / cues.armorTravel);
        const angle = i * TAU / 8 + .12;
        const distance = (1 - land) * (380 + noise(i + 40) * 150);
        c.save(); c.translate(Math.cos(angle) * distance, Math.sin(angle) * distance);
        c.rotate(angle + (1 - land) * (i % 2 ? 1.6 : -1.6));
        c.globalAlpha = birth * ease((t - 12.5 - i * .24) / .8);
        const metal = c.createLinearGradient(85, -30, 121, 30);
        metal.addColorStop(0, '#72849c'); metal.addColorStop(.24, '#38445e');
        metal.addColorStop(.55, '#202a44'); metal.addColorStop(1, '#0b1121');
        c.beginPath(); c.moveTo(88, -24); c.lineTo(112, -34); c.lineTo(122, 27); c.lineTo(88, 23); c.closePath();
        c.fillStyle = metal; c.fill(); c.lineWidth = 1.8; c.strokeStyle = '#65738e'; c.stroke();
        c.beginPath(); c.moveTo(95, -19); c.lineTo(106, -24); c.lineTo(112, 20);
        c.strokeStyle = `rgba(93,239,255,${.25 + land * .7})`; c.lineWidth = 2.5; c.stroke();
        circle(c, 98, 14, 2, '#96e9fa'); c.restore();
      }
      // Small scrap pieces arrive ahead of the assembled segments.
      for (let i = 0; i < 45; i++) {
        const p = clamp((t - 11.7 - noise(i + 800) * 2.5) / 3.3);
        if (p <= 0 || p >= 1) continue;
        const a = i * 2.4 + p * 2, r = mix(530, 108, ease(p));
        c.save(); c.translate(Math.cos(a) * r, Math.sin(a) * r * .73); c.rotate(a + p * 4);
        c.fillStyle = i % 3 ? '#67758f' : '#b3cde0'; c.fillRect(-3, -1, 6 + i % 5, 2); c.restore();
      }
      for (let i = 0; i < 60; i++) {
        const a = i / 60 * TAU + t * .35;
        const r = 87 + (i % 3) * 1.8;
        circle(c, Math.cos(a) * r, Math.sin(a) * r, i % 4 ? .8 : 1.6, i % 3 ? '#b8a0ff' : '#fbe6ff');
      }
      ellipse(c, 178, 32, 'rgba(169,131,255,.65)', 3, 0, Math.PI);
      ellipse(c, 171, 27, 'rgba(231,199,255,.65)', 1.2, 0, Math.PI);
      for (let i = 0; i < 24; i++) {
        const a = (i / 24 * TAU + t * .4) % TAU;
        if (Math.sin(a) < 0) continue;
        c.save(); c.rotate(-.13); circle(c, Math.cos(a) * 176, Math.sin(a) * 32, 1.2, '#b5edff'); c.restore();
      }
      c.restore();
    }
    c.restore();
    // Film vignette stays in screen space.
    const vignette = c.createRadialGradient(cx, cy, Math.min(w, h) * .2, cx, cy, Math.max(w, h) * .7);
    vignette.addColorStop(0, 'transparent'); vignette.addColorStop(1, 'rgba(0,0,9,.85)');
    c.fillStyle = vignette; c.fillRect(0, 0, w, h);
  }

  // Render a synchronized stereo score once per context. Sources can restart at
  // the exact film position after a pause, tab switch, or sound toggle.
  const audioCache = new WeakMap();
  function soundtrack(context) {
    if (audioCache.has(context)) return audioCache.get(context);
    const rate = context.sampleRate, buffer = context.createBuffer(2, Math.ceil(duration * rate), rate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let low = 0, seed = 419 + channel * 739;
      const impacts = [...Array.from({length: 5}, (_, i) => cues.planetStart + i * cues.planetStep + cues.planetFall), cues.collapse, ...Array.from({length: 8}, (_, i) => cues.armorStart + i * cues.armorStep + cues.armorTravel), cues.title];
      for (let i = 0; i < data.length; i++) {
        const t = i / rate;
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
        const white = seed / 2147483648; low = low * .975 + white * .025;
        const fade = ease(t / 1.5) * (1 - ease((t - 21) / 2));
        const collapse = ease((t - 8) / 2.3) * (1 - ease((t - 10.25) / .3));
        const hush = 1 - .92 * ease((t - 10.15) / .2) * (1 - ease((t - 10.5) / .45));
        // Sub-bass plus audible upper harmonics gives the approach weight on
        // both headphones and small speakers, without raising the output ceiling.
        let sample = (.17 * Math.sin(TAU * 36.708 * t)
          + .065 * Math.sin(TAU * 73.416 * t)
          + .035 * Math.sin(TAU * 110.124 * t)
          + low * (.75 + collapse * 2.4)) * hush;
        const pad = t < 10.5 ? [73.416, 110, 138.591] : [73.416, 110, 146.832, 174.614];
        for (const hz of pad) sample += Math.sin(TAU * (hz + channel * .13) * t + .4 * Math.sin(t * .32)) * .025 * hush;
        sample += (Math.sin(TAU * (65 * t + 6 * t * t)) * .09
          + Math.sin(TAU * (130 * t + 12 * t * t)) * .035
          + white * .055) * collapse;
        // Small orbiting notes rise with the worlds; the title resolves the chord.
        if (t < 8.5) {
          const beat = t % .6, note = [293.665, 440, 554.365, 587.33][Math.floor(t / .6) % 4];
          sample += Math.sin(TAU * note * beat) * Math.exp(-beat * 10) * .028;
        }
        for (let j = 0; j < impacts.length; j++) {
          const age = t - impacts[j];
          if (age < 0 || age > 3) continue;
          const metal = j >= 6 && j < 14;
          if (metal) {
            // Each containment segment locks with a steel strike and a low thud.
            sample += (.14 * Math.sin(TAU * 630 * age) + .085 * Math.sin(TAU * 937 * age) + white * .14) * Math.exp(-age * 15) * ease(age / .006);
            sample += .18 * Math.sin(TAU * (72 * age + 3 * (1 - Math.exp(-age * 22)))) * Math.exp(-age * 12) * ease(age / .008);
          }
          else {
            const big = j === 5 || j === 14;
            const phase = TAU * (42 * age + 5 * (1 - Math.exp(-age * 9)));
            sample += (Math.sin(phase) * (big ? .48 : .17)
              + Math.sin(phase * 2) * (big ? .16 : .055)
              + low * (big ? 1.8 : .65)) * Math.exp(-age * (big ? 1.1 : 2.6)) * ease(age / .012);
            // The collapse and title get a broad impact crack and a long tail.
            if (big) sample += (white * .2 * Math.exp(-age * 24)
              + .12 * Math.sin(TAU * 29.136 * age) * Math.exp(-age * 1.3)) * ease(age / .008);
          }
        }
        if (t >= cues.title) {
          const a = t - cues.title;
          for (const hz of [146.832, 220, 293.665, 349.228]) sample += Math.sin(TAU * hz * a) * .065 * ease(a / .1) * Math.exp(-a * .5);
        }
        data[i] = Math.tanh(sample * fade) * .72;
      }
    }
    audioCache.set(context, buffer); return buffer;
  }

  class Film {
    constructor(dialog, options = {}) {
      this.dialog = dialog; this.options = options; this.source = null;
      this.canvas = dialog.querySelector('canvas'); this.ctx = this.canvas.getContext('2d');
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
      this.skip = dialog.querySelector('[data-origin-skip]');
      this.pause = dialog.querySelector('[data-origin-pause]');
      this.mute = dialog.querySelector('[data-origin-sound]');
      this.skip.onclick = () => this.close();
      this.pause.onclick = () => { this.advance(performance.now()); this.paused = !this.paused; this.last = performance.now(); this.syncSound(); this.controls(); };
      this.mute.onclick = () => { this.advance(performance.now()); this.options.toggleSound?.(); this.syncSound(); this.controls(); };
      dialog.addEventListener('cancel', event => { event.preventDefault(); this.close(); });
      document.addEventListener('visibilitychange', () => { if (this.source) this.advance(performance.now()); this.last = performance.now(); this.syncSound(); });
      this.reduced.addEventListener('change', () => {
        if (this.open && this.reduced.matches) { this.age = 19; this.paused = true; this.syncSound(); this.controls(); }
      });
      this.tick = this.tick.bind(this);
    }
    get open() { return this.dialog.open; }
    play() {
      if (this.open) return;
      this.focusBefore = document.activeElement;
      this.age = this.reduced.matches ? 19 : 0; this.paused = this.reduced.matches;
      this.last = performance.now(); this.dialog.showModal();
      this.options.onChange?.(true); this.controls(); this.syncSound();
      this.last = performance.now();
      this.skip.focus({ preventScroll: true }); this.tick(this.last);
    }
    controls() {
      this.pause.textContent = this.paused ? 'Play' : 'Pause';
      this.pause.setAttribute('aria-pressed', String(this.paused));
      this.pause.hidden = this.reduced.matches;
      this.skip.textContent = this.reduced.matches ? 'Enter containment' : 'Skip film';
      const sound = !!this.options.audio?.()?.enabled;
      this.mute.textContent = sound ? 'Sound on' : 'Sound off';
      this.mute.setAttribute('aria-pressed', String(sound));
    }
    syncSound() {
      if (this.source) {
        const source = this.source, gain = this.audioGain, now = source.context.currentTime;
        gain.gain.cancelAndHoldAtTime(now); gain.gain.linearRampToValueAtTime(0, now + .012);
        source.stop(now + .015); source.onended = () => { source.disconnect(); gain.disconnect(); };
        this.source = null; this.audioGain = null;
      }
      const audio = this.options.audio?.();
      if (!this.open || this.paused || document.hidden || !audio?.enabled || !audio.context || this.age >= duration) return;
      const source = audio.context.createBufferSource();
      source.buffer = soundtrack(audio.context);
      const gain = audio.context.createGain(), now = audio.context.currentTime;
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(1, now + .012);
      source.connect(gain); gain.connect(audio.destination);
      this.audioOffset = this.age; this.audioStarted = now;
      source.start(now, this.age); this.source = source; this.audioGain = gain;
      // Buffer synthesis can take time on phones. Never count that work as film time.
      this.last = performance.now();
    }
    advance(now) {
      if (!this.paused) {
        if (this.source) {
          // AudioContext time stops when audio is suspended and advances through
          // dropped frames, keeping the picture on the same playback position.
          this.age = this.audioOffset + Math.max(0, this.source.context.currentTime - this.audioStarted);
        } else if (!document.hidden) this.age += Math.max(0, (now - this.last) / 1000);
      }
      this.last = now;
    }
    tick(now) {
      if (!this.open) return;
      this.advance(now);
      if (this.age >= duration) { this.close(); return; }
      const w = this.canvas.clientWidth, h = this.canvas.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
      if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
        this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
      }
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(this.ctx, this.age, w, h);
      const title = this.dialog.querySelector('.origin-title');
      title.style.opacity = ease((this.age - cues.title) / 1.2);
      const label = this.dialog.querySelector('[data-origin-chapter]');
      const text = chapter(this.age); if (label.textContent !== text) label.textContent = text;
      this.dialog.querySelector('.origin-progress').style.transform = `scaleX(${clamp(this.age / duration)})`;
      this.raf = requestAnimationFrame(this.tick);
    }
    close() {
      if (!this.open) return;
      cancelAnimationFrame(this.raf); this.dialog.close(); this.syncSound();
      this.options.onChange?.(false);
      if (this.focusBefore?.isConnected) this.focusBefore.focus({ preventScroll: true });
    }
  }
  window.CoreOrigin = { Film, draw, soundtrack, duration, chapter, cues };
})();
