"use strict";
// Shared by the parser-time preview and the running arcade. One scanner owns
// both the image and its readout, so their identity and timing cannot drift.
const GuideScanner = (() => {
  const interval = 2500;
  function analysis(block) {
    const text = block.description.trim().replace(/\s+/g, ' ');
    if (text.length <= 112) return text;
    return text.slice(0, 109).replace(/\s+\S*$/, '') + '…';
  }
  class Scanner {
    constructor(target, blocks) {
      this.blocks = blocks;
      this.lastChange = 0;
      this.root = document.createElement('span');
      this.root.className = 'guide-scanner';
      this.root.innerHTML = `<span class="guide-scan-object"><img class="guide-tab-preview" alt=""><span class="guide-scan-beam"></span><span class="guide-scan-id"></span></span><span class="guide-scan-readout"><span class="guide-scan-status">OBJECT RECOGNITION</span><span class="guide-scan-name"></span><span class="guide-scan-meta"></span><span class="guide-scan-disposition block-disposition"></span><span class="guide-scan-analysis"></span><span class="guide-scan-progress"><i></i></span></span>`;
      this.icon = this.root.querySelector('img');
      this.copy = this.root.querySelector('.guide-scan-analysis');
      this.progress = this.root.querySelector('.guide-scan-progress i');
      target.replaceChildren(this.root);
    }
    next(random = Math.random) {
      // Use the same spawn tickets as gameplay and Chaos's difficulty card.
      // Independent draws may repeat a block; excluding repeats biases its chance.
      return ChaosArt.pickBlock(this.blocks, random);
    }
    scan(block, now, reduced = false) {
      if (!block) return;
      const thumbnail = ChaosArt.tabPreview(block);
      this.icon.src = thumbnail.src;
      Object.assign(this.icon.dataset, { block: block.id, shape: thumbnail.shape, color: thumbnail.color });
      this.root.dataset.block = block.id;
      this.root.querySelector('.guide-scan-id').textContent = `ID ${String(this.blocks.findIndex(b => b.id === block.id) + 1).padStart(3, '0')}`;
      this.root.querySelector('.guide-scan-name').textContent = block.name;
      this.root.querySelector('.guide-scan-meta').textContent = `${block.rarity.toUpperCase()} · ${block.chance}% SPAWN`;
      const disposition = this.root.querySelector('.guide-scan-disposition');
      disposition.dataset.disposition = block.disposition;
      disposition.textContent = block.disposition[0].toUpperCase() + block.disposition.slice(1);
      this.fullText = analysis(block);
      this.root.title = `${block.name}: ${block.description}`;
      this.lastChange = now;
      this.type(now, reduced);
    }
    type(now, reduced) {
      const age = Math.max(0, now - this.lastChange);
      const count = reduced ? this.fullText.length : Math.floor(age / 5);
      const text = this.fullText.slice(0, count);
      if (this.copy.textContent !== text) this.copy.textContent = text;
      this.root.classList.toggle('is-typing', count < this.fullText.length);
      this.progress.style.transform = `scaleX(${reduced ? 1 : Math.min(1, age / interval)})`;
    }
    tick(now, reduced = false, initial = false) {
      if (document.hidden || !this.blocks.length) return;
      if (initial || !this.fullText || (!reduced && now - this.lastChange >= interval))
        this.scan(this.next(), now, reduced);
      else this.type(now, reduced);
    }
  }
  return { Scanner, interval, analysis };
})();

// Start immediately, even while Python is still downloading.
const guidePreviewBootstrap = (() => {
  const source = document.getElementById('chaos-bootstrap');
  if (!source?.textContent.trim()) return { stop() {}, scanner: null };
  const scanner = new GuideScanner.Scanner(document.querySelector('[data-game="guide"] .card-art'), JSON.parse(source.textContent));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  scanner.tick(performance.now(), motion.matches, true);
  const timer = setInterval(() => scanner.tick(performance.now(), motion.matches), 40);
  return { scanner, stop() { clearInterval(timer); } };
})();
