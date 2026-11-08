"use strict";
const JackpotSlots = (() => {
  // Each reel chooses independently from seven, star, cherry, diamond, and bell.
  const symbols = ['seven', 'star', 'cherry', 'diamond', 'bell'];
  class Machine {
    constructor(random = Math.random) { this.random = random; this.reset(); }
    reset() { this.positions = [1, 2, 3]; this.elapsed = 0; this.spinning = false; this.hold = 0; }
    advance(dt, eligible) {
      if (!eligible) { this.reset(); return null; }
      if (!Number.isFinite(dt) || dt <= 0) return null;
      dt = Math.min(dt, .1); // Never catch up spins after a stalled/hidden page.
      if (this.hold > 0) { this.hold = Math.max(0, this.hold - dt); return null; }
      if (!this.spinning) {
        this.starts = this.positions.slice();
        this.targets = symbols.slice(0, 3).map(() => Math.floor(this.random() * 5));
        this.distances = this.targets.map((target, i) => 10 + i * 5 + (target - this.starts[i] + 5) % 5);
        this.elapsed = 0; this.spinning = true;
      }
      this.elapsed += dt;
      this.positions = this.targets.map((target, i) => {
        const progress = Math.min(1, this.elapsed / (1.4 + i * .55));
        return progress === 1 ? target : (this.starts[i] + this.distances[i] * (1 - (1 - progress) ** 3)) % 5;
      });
      if (this.elapsed < 2.5) return null;
      this.spinning = false; this.hold = 3.5;
      return this.targets.slice();
    }
  }
  function inView(element) {
    if (document.hidden || !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    const r = element.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return false;
    const container = element.closest('button, .custom-tile, .customs-preview, .card-art, .pixel-face') || element.parentElement;
    const top = document.elementFromPoint(x, y);
    return !!top && container.contains(top);
  }
  class Controller {
    constructor({ equipped, onResult, reducedMotion, random }) {
      this.equipped = equipped; this.onResult = onResult; this.reducedMotion = reducedMotion;
      this.machine = new Machine(random); this.last = null;
      document.addEventListener('visibilitychange', () => { this.machine.reset(); this.last = null; });
    }
    tick(now) {
      const dt = this.last === null ? 0 : (now - this.last) / 1000;
      this.last = now;
      const equipped = this.equipped();
      if (equipped !== this.lastEquipped) {
        this.machine.reset(); this.lastEquipped = equipped;
      }
      // Visible previews can play too, but equipping starts a fresh eligible spin.
      const roots = [...document.querySelectorAll('[data-custom="chaos_jackpot"].cubie-custom-art')].filter(inView);
      const result = this.machine.advance(dt, roots.length > 0);
      for (const root of roots) {
        root.querySelectorAll('[data-jackpot-reel]').forEach((reel, i) => {
          // Reduced motion still plays, but swaps symbols only when each reel stops.
          const position = this.machine.positions[i];
          if (!this.reducedMotion() || Number.isInteger(position)) reel.setAttribute('transform', `translate(0 ${-position * 16})`);
        });
        root.classList.toggle('jackpot-winner', this.machine.hold > 0 && this.machine.targets?.every(n => n === 0));
      }
      if (result && equipped === 'chaos_jackpot') this.onResult(result);
    }
  }
  return { symbols, Machine, Controller };
})();
if (typeof module !== 'undefined') module.exports = JackpotSlots;
