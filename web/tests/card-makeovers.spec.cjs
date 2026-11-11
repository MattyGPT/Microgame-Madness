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

test('slow frames reduce idle decoration work while hover and keyboard previews still run', async ({ page }) => {
  await openGame(page);
  const key = page.locator('[data-game="keyboard"]');
  await key.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    limitedCardMotion = false;
    cardMotionLastFrame = 1000;
    cardMotionElapsed = cardMotionFrames = cardMotionSlowFrames = 0;
    // One isolated stall must not disable the full set of decorations.
    updateCardMotionBudget(1600);
    if (limitedCardMotion) throw Error('An isolated stall reduced motion');
    for (let time = 1650; time <= 3200; time += 50) updateCardMotionBudget(time);
    if (!limitedCardMotion) throw Error('Sustained slow frames were ignored');
  });
  await expect(key).toHaveClass(/card-effects-paused/);
  await key.hover();
  await expect(key).not.toHaveClass(/card-effects-paused/);
  await page.mouse.move(0, 0);
  await expect(key).toHaveClass(/card-effects-paused/);
  await page.keyboard.press('Tab');
  await key.focus();
  await expect(key).not.toHaveClass(/card-effects-paused/);
  await page.evaluate(() => {
    active = true;
    updateCardMotionBudget(performance.now());
  });
  await expect(key).toHaveClass(/card-effects-paused/);
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
