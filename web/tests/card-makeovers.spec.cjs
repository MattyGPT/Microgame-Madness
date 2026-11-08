const { test, expect, openGame } = require('./fixtures/game.cjs');
test('new scenes remain decorative, respect reduced motion and pause offscreen', async ({ page }) => {
  await openGame(page);
  await expect(page.locator('.arcade-card-scene')).toHaveCount(9);
  await expect(page.locator('[data-game="customs"] .custom-card-art .cubie-custom-art')).toHaveCount(1);
  await expect(page.locator('[data-game="guide"] .card-art .guide-tab-preview')).toHaveCount(1);
  const key = page.locator('[data-game="keyboard"]');
  await key.scrollIntoViewIfNeeded();
  await expect(key).not.toHaveClass(/card-effects-paused/);
  expect(await key.locator('.arcade-card-scene').evaluate(n => n.getAnimations({subtree:true}).some(a => a.playState === 'running'))).toBe(true);
  await key.click();
  await expect(page.locator('[data-difficulty="progressive"]')).toBeVisible();
  await page.locator('#difficulty-choices').scrollIntoViewIfNeeded();
  await expect(key).toHaveClass(/card-effects-paused/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.arcade-card-scene').evaluateAll(ns => ns.every(n => n.getAnimations({subtree:true}).length === 0))).toBe(true);
});
