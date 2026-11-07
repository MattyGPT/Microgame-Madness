const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const Customs = require('../customs.js');
const css = fs.readFileSync(require.resolve('../style.css'), 'utf8').replace(/^@import[^;]+;/, '');
async function gallery(page) {
  await page.setContent(`<meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}
    body { background:#101618; color:#eee; padding:24px; display:grid; grid-template-columns:repeat(auto-fit,minmax(155px,1fr)); gap:20px; align-content:start; }
    article { height:250px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:40px; padding:20px; background:#1e2528; border-radius:12px; }
    .sample { width:90px; height:90px; flex-shrink:0; }
    .cubie-float { animation:none; transform:none; }
    h3 { font:12px sans-serif; text-align:center; }
  </style>${Customs.catalog.map(c => `<article data-skin="${c.id}"><div class="sample">${Customs.svg(c)}</div><h3>${c.name}</h3></article>`).join('')}`);
}

test('every Cubie renders valid art, independent accessory motion, and collision-free SVG references', async ({ page }, testInfo) => {
  await gallery(page);
  const report = await page.evaluate(() => {
    const roots = [...document.querySelectorAll('.cubie-custom-art')];
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    return {
      count: roots.length,
      invalid: roots.filter(el => new DOMParser().parseFromString(el.outerHTML, 'image/svg+xml').querySelector('parsererror')).map(el => el.dataset.custom),
      duplicateIds: ids.filter((id, i) => ids.indexOf(id) !== i),
      missingReferences: [...document.querySelectorAll('[clip-path], [fill]')].filter(el => {
        const ref = (el.getAttribute('clip-path') || el.getAttribute('fill')).match(/^url\(#(.+)\)$/);
        return ref && !document.getElementById(ref[1]);
      }).length,
      missingAnimations: [...document.querySelectorAll('.cubie-motion')].filter(el => getComputedStyle(el).animationName === 'none').length,
    };
  });
  expect(report).toEqual({ count: Customs.catalog.length, invalid: [], duplicateIds: [], missingReferences: 0, missingAnimations: 0 });
  // The same character can appear in the header and preview without sharing clips.
  const clone = Customs.svg(Customs.catalog.find(c => c.id === 'medal_gold'));
  await page.locator('body').evaluate((el, svg) => el.insertAdjacentHTML('beforeend', svg), clone);
  expect(await page.locator('[id]').evaluateAll(els => new Set(els.map(el => el.id)).size === els.length)).toBe(true);

  // Real animated transforms preserve the hinge/axle locations while moving parts.
  for (const [skin, selector, x, y] of [
    ['bumblebee', '.motion-wing', 36, 52], ['turtle', '.motion-paddle', 32, 48],
    ['rocket', '.motion-thrust', 60, 107], ['attack_core_orbital_saws', '.motion-spin', 60, 68],
    ['shop_clockwork', '.motion-clock', 60, 24],
  ]) {
    const part = page.locator(`[data-skin="${skin}"] ${selector}`).first();
    const phases = await part.evaluate((el, pivot) => {
      const a = el.getAnimations()[0]; a.pause();
      const duration = a.effect.getTiming().duration;
      return [.1, .6].map(fraction => {
        a.currentTime = duration * fraction;
        const transform = getComputedStyle(el).transform;
        const point = new DOMPoint(...pivot).matrixTransform(el.getCTM());
        return { transform, x: point.x, y: point.y };
      });
    }, [x, y]);
    expect(phases[0].transform, skin).not.toBe(phases[1].transform);
    expect(phases[0].x, skin).toBeCloseTo(phases[1].x, 2);
    expect(phases[0].y, skin).toBeCloseTo(phases[1].y, 2);
  }
  // Sample every animation at multiple phases to catch invalid geometry.
  for (const phase of [.15, .5, .85]) {
    const invalid = await page.evaluate(phase => {
      document.getAnimations().forEach(a => { a.pause(); a.currentTime = a.effect.getTiming().duration * phase; });
      return [...document.querySelectorAll('.cubie-custom-art')].filter(el => {
        // getBBox includes offscreen art inside clip paths (e.g. Rainbow's
        // sliding stripes), so finite geometry is the appropriate invariant.
        const b = el.getBBox(); return ![b.x,b.y,b.width,b.height].every(Number.isFinite) || b.width <= 0 || b.height <= 0;
      }).map(el => el.dataset.custom);
    }, phase);
    expect(invalid).toEqual([]);
  }
  const examples = ['bumblebee','racecar','rocket','attack_core_binary_stars','attack_core_orbital_saws','shop_clockwork','shop_jellyfish','shop_neon_noodle'];
  await page.locator('article').evaluateAll((els, examples) => els.forEach(el => { if (!examples.includes(el.dataset.skin)) el.remove(); }), examples);
  await page.locator('body > svg').evaluateAll(els => els.forEach(el => el.remove()));
  await page.screenshot({ path: testInfo.outputPath('animated-cubies.png'), fullPage: true });
});

test('reduced motion stops all Cubie effects and leaves every face and accessory visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gallery(page);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  for (const id of ['bumblebee', 'rocket', 'attack_core_binary_stars', 'shop_jellyfish', 'shop_clockwork']) {
    const art = page.locator(`[data-skin="${id}"] svg`);
    await expect(art.locator('.cubie-eyes')).toBeVisible();
    await expect(art.locator('.cubie-smile')).toBeVisible();
  }
  expect(await page.locator('.cubie-motion').evaluateAll(els => els.every(el => Number(getComputedStyle(el).opacity) > 0))).toBe(true);
  const stars = await page.locator('[data-skin="attack_core_binary_stars"] .motion-binary').evaluateAll(els => els.map(el => el.getBoundingClientRect().x));
  expect(Math.abs(stars[0] - stars[1])).toBeGreaterThan(20);
});

test('ring particles share a continuous closed circuit across front and rear layers', async ({ page }, testInfo) => {
  await gallery(page);
  const ringSkins = ['attack_pumpkin_rotating_rings', 'attack_core_accretion_sweep', 'vortex'];
  await page.locator('article').evaluateAll((els, ids) => els.forEach(el => { if (!ids.includes(el.dataset.skin)) el.remove(); }), ringSkins);
  const result = await page.evaluate(() => [...document.querySelectorAll('.cubie-orbit-layer[data-half="back"]')].map(back => {
    const root = back.closest('svg');
    const front = root.querySelector(`.cubie-orbit-layer[data-half="front"][data-orbit="${back.dataset.orbit}"]`);
    const a = back.querySelector('.cubie-ring-particles');
    const b = front.querySelector('.cubie-ring-particles');
    const length = a.getTotalLength();
    const start = a.getPointAtLength(0), end = a.getPointAtLength(length);
    const phases = [0, .125, .375, .625, .875, 1].map(f => {
      for (const path of [a,b]) {
        const animation = path.getAnimations()[0]; animation.pause();
        animation.currentTime = animation.effect.getTiming().duration * f;
      }
      const pa = a.getPointAtLength(length*f).matrixTransform(a.getCTM());
      const pb = b.getPointAtLength(b.getTotalLength()*f).matrixTransform(b.getCTM());
      return { separation: Math.hypot(pa.x-pb.x, pa.y-pb.y), samePhase: getComputedStyle(a).strokeDashoffset === getComputedStyle(b).strokeDashoffset };
    });
    return { closed: Math.hypot(start.x-end.x, start.y-end.y) < .01,
      clippedFront: !!front.querySelector('[clip-path]'), unclippedRear: !back.querySelector('[clip-path]'),
      samePath: a.getAttribute('d') === b.getAttribute('d'), phases };
  }));
  expect(result).toHaveLength(4);
  for (const ring of result) {
    expect(ring.closed && ring.clippedFront && ring.unclippedRear && ring.samePath).toBe(true);
    for (const phase of ring.phases) { expect(phase.samePhase).toBe(true); expect(phase.separation).toBeLessThan(.01); }
  }
  await page.screenshot({ path: testInfo.outputPath('ring-circuits.png'), fullPage: true });
});

test('petting blush follows custom faces and disappears after petting', async ({ page }, testInfo) => {
  await gallery(page);
  await page.evaluate(() => {
    document.querySelectorAll('.sample').forEach(el => {
      el.classList.add('pixel-face', 'custom-equipped', 'blushing');
      el.style.cssText = 'position:relative;top:auto;left:auto;margin:0;width:90px;height:90px;animation:none;transform:none';
    });
  });
  await page.waitForTimeout(150);
  const blushes = page.locator('.cubie-blush');
  expect(await blushes.count()).toBeGreaterThanOrEqual(Customs.catalog.length);
  expect(await blushes.evaluateAll(els => els.every(el => Number(getComputedStyle(el).opacity) > .9))).toBe(true);
  expect(await page.locator('.sample').evaluateAll(els => els.every(el => getComputedStyle(el, '::before').display === 'none' && getComputedStyle(el, '::after').display === 'none'))).toBe(true);
  await expect(page.locator('[data-skin="golden_hand"] .cubie-blush ellipse').first()).toHaveAttribute('cy', '113');
  expect(await page.locator('[data-skin="three_d"] .cubie-blush').evaluate(el => el.parentNode.getAttribute('transform'))).toContain('matrix(');
  await expect(page.locator('[data-skin="shop_koi"] .koi-face .cubie-blush')).toHaveCount(1);
  await expect(page.locator('[data-skin="shop_disco"] .disco-tile .cubie-blush')).toHaveCount(4);
  await page.locator('.sample').evaluateAll(els => els.forEach(el => el.classList.remove('blushing')));
  await page.waitForTimeout(150);
  expect(await blushes.evaluateAll(els => els.every(el => Number(getComputedStyle(el).opacity) === 0))).toBe(true);
});

test('Puzzle Cube turns independent layers, loops seamlessly, and stays still with reduced motion', async ({ page }, testInfo) => {
  const item = Customs.catalog.find(c => c.id === 'shop_puzzle_cube');
  await page.setContent(`<style>${css}</style><div style="width:145px;height:145px;margin:100px auto">${Customs.svg(item)}</div>`);
  const inspect = phase => page.evaluate(phase => {
    document.getAnimations().forEach(animation => {
      animation.pause(); animation.currentTime = animation.animationName === 'custom-float' ? 0 : animation.effect.getTiming().duration * phase;
    });
    return [...document.querySelectorAll('.puzzle-layer')].map(el => getComputedStyle(el).transform);
  }, phase);
  const start = await inspect(0);
  const face = page.locator('.puzzle-expression');
  const originalFace = await face.boundingBox();
  await expect(page.locator('.puzzle-layer .cubie-eyes')).toHaveCount(0);
  await expect(page.locator('.puzzle-expression .cubie-eyes')).toHaveCount(1);
  for (const phase of [.12, .48, .9]) {
    await inspect(phase);
    const bounds = await face.boundingBox();
    for (const dimension of ['x', 'y', 'width', 'height'])
      expect(bounds[dimension]).toBeCloseTo(originalFace[dimension], 3);
    const origins = await page.locator('.puzzle-layer').evaluateAll(layers => layers.map(layer => getComputedStyle(layer).transformOrigin));
    expect(origins).toEqual(['54px 18px', '54px 18px', '54px 18px']);
  }
  // Each completed turn parks on the same footprint; only one slice moves
  // at a time, and all three are aligned during the rests between turns.
  for (const phase of [.12, .24, .44, .56, .76, .88]) {
    const transforms = await inspect(phase);
    expect(transforms.filter((value, i) => value !== start[i])).toHaveLength(1);
  }
  for (const phase of [.32, .64, .96]) expect(await inspect(phase)).toEqual(start);
  const dimensions = await page.locator('.puzzle-layer').evaluateAll(layers => layers.map(layer => {
    const style = getComputedStyle(layer);
    return [style.left, style.top, style.width, style.height];
  }));
  expect(dimensions).toEqual([
    ['-54px', '-54px', '108px', '36px'],
    ['-54px', '-18px', '108px', '36px'],
    ['-54px', '18px', '108px', '36px'],
  ]);
  const turned = await inspect(.2);
  expect(turned[0]).not.toEqual(start[0]);
  expect(turned[1]).toEqual(start[1]);
  expect(turned[2]).toEqual(start[2]);
  await page.screenshot({ path: testInfo.outputPath('puzzle-cube-turn.png') });
  expect(await inspect(1)).toEqual(start);
  // Every original face contains several colors; the top/bottom remain
  // scrambled throughout their turns, so the animation cannot become solved.
  for (const side of ['front', 'right', 'back', 'left', 'top', 'bottom']) {
    const colors = await page.locator(`.puzzle-face-${side} .puzzle-sticker`).evaluateAll(els => els.map(el => el.dataset.color));
    expect(colors).toHaveLength(9);
    expect(new Set(colors).size).toBeGreaterThan(2);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await expect(page.locator('.cubie-smile')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('puzzle-cube-still.png') });
});
