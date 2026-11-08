"use strict";
// Runs while the menu is parsed, independently of deferred game-engine scripts.
const guidePreviewBootstrap = (() => {
  const source = document.getElementById('chaos-bootstrap');
  if (!source?.textContent.trim()) return { stop() {} };
  const blocks = JSON.parse(source.textContent);
  const target = document.querySelector('[data-game="guide"] .card-art');
  const icon = document.createElement('img');
  icon.className = 'guide-tab-preview';
  icon.alt = '';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function draw() {
    const block = ChaosArt.pickBlock(blocks);
    const thumbnail = ChaosArt.tabPreview(block);
    icon.src = thumbnail.src;
    icon.dataset.block = block.id;
    icon.dataset.shape = thumbnail.shape;
    icon.dataset.color = thumbnail.color;
  }
  draw();
  target.replaceChildren(icon);
  const timer = setInterval(() => {
    if (!document.hidden && !reducedMotion.matches) draw();
  }, 500);
  return { stop() { clearInterval(timer); } };
})();
