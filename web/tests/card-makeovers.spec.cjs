const { test, expect, openGame } = require('./fixtures/game.cjs');
test('new scenes remain decorative, respect reduced motion and pause offscreen', async ({ page }) => {
  await openGame(page);
  await expect(page.locator('.arcade-card-scene')).toHaveCount(9);
  await expect(page.locator('[data-game="customs"] .custom-card-art .cubie-custom-art')).toHaveCount(1);
  await expect(page.locator('[data-game="guide"] .card-art .guide-tab-preview')).toHaveCount(1);
  const key = page.locator('[data-game="keyboard"]');
  await key.scrollIntoViewIfNeeded();
  await key.hover();
  await expect(key).not.toHaveClass(/card-effects-paused/);
  expect(await key.locator('.arcade-card-scene').evaluate(n => n.getAnimations({subtree:true}).some(a => a.playState === 'running'))).toBe(true);
  await key.click();
  await expect(page.locator('[data-difficulty="progressive"]')).toBeVisible();
  await page.locator('#difficulty-choices').scrollIntoViewIfNeeded();
  await expect(key).toHaveClass(/card-effects-paused/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.arcade-card-scene').evaluateAll(ns => ns.every(n => n.getAnimations({subtree:true}).length === 0))).toBe(true);
});

test('cards slow during selection and return to full motion when scrolling back up', async ({ page }) => {
  await openGame(page);
  const key = page.locator('[data-game="keyboard"]');
  await key.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(key).not.toHaveClass(/card-effects-paused/);
  const rates = () => key.evaluate(n => n.getAnimations({subtree:true}).map(a => a.playbackRate));
  await expect.poll(async () => (await rates()).every(rate => rate === 1)).toBe(true);
  await key.click();
  await page.locator('#difficulty-choices').scrollIntoViewIfNeeded();
  await expect.poll(async () => (await rates()).every(rate => rate === .25)).toBe(true);
  await expect(page.locator('.intro')).toHaveClass(/decoration-paused/);
  await key.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await rates()).every(rate => rate === 1)).toBe(true);
  await expect(key).not.toHaveClass(/card-effects-paused/);
  await expect(page.locator('[data-difficulty="progressive"]')).toHaveClass(/decoration-paused/);
});

test('offscreen scanner does not mutate its preview every frame', async ({ page }) => {
  await openGame(page);
  await page.locator('[data-game="hangman"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-game="guide"]')).toHaveClass(/card-effects-paused/);
  const changes = await page.evaluate(async () => {
    let mutations = 0;
    const observer = new MutationObserver(records => { mutations += records.length; });
    observer.observe(chaosGuideScanner.root, { attributes: true, childList: true, subtree: true });
    for (let frame = 0; frame < 10; frame++) await new Promise(requestAnimationFrame);
    observer.disconnect();
    return mutations;
  });
  expect(changes).toBe(0);
});

test('gameplay pause wins over scrolling and quarter-speed card previews', async ({ page }) => {
  await openGame(page);
  const key = page.locator('[data-game="keyboard"]');
  await key.click();
  await expect.poll(() => page.evaluate(() => cardPlaybackRate)).toBe(.25);
  await page.evaluate(() => { active = true; gasterActive = true; updateCardGameplayPause(); });
  await key.scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => cardPlaybackRate)).toBe(1);
  await expect(key).toHaveClass(/card-effects-paused/);
  expect(await key.evaluate(n => n.getAnimations({subtree:true}).every(a => a.playState === 'paused'))).toBe(true);
  await page.locator('#difficulty-choices').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => cardPlaybackRate)).toBe(.25);
  expect(await page.locator('.game-card').evaluateAll(cards => cards.every(card =>
    card.getAnimations({subtree:true}).every(animation => animation.playState === 'paused')))).toBe(true);
  await page.evaluate(() => { active = false; gasterActive = false; updateCardGameplayPause(); });
  await key.scrollIntoViewIfNeeded();
  await expect(key).not.toHaveClass(/card-effects-paused/);
  await expect.poll(() => key.evaluate(n => n.getAnimations({subtree:true}).every(a => a.playbackRate === 1))).toBe(true);
});

test('simultaneous achievement tiers share a bounded visible confetti budget', async ({ page }) => {
  await openGame(page);
  const result = await page.evaluate(() => {
    document.getElementById('achievement-celebrations').replaceChildren();
    celebrateAchievements(['bronze', 'silver', 'gold', 'rainbow'].map(tier => ({ tier })));
    const layers = [...document.querySelectorAll('.achievement-confetti')];
    const visible = layer => [...layer.children].filter(piece => !piece.hidden);
    return { tiers: layers.length, particles: layers.flatMap(visible).length,
      rainbowColors: new Set(visible(layers.find(layer => layer.dataset.tier === 'rainbow'))
        .map(piece => piece.style.getPropertyValue('--confetti-color'))).size };
  });
  expect(result.tiers).toBe(4);
  expect(result.particles).toBe(32);
  expect(result.rainbowColors).toBe(6);
});
