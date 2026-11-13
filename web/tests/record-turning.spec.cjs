const { leaveFullscreen, settleFullscreen } = require('./fixtures/game.cjs');
const { test, expect, openGame } = require('./fixtures/game.cjs');

test('death celebrates a strict personal best once, and keeps the record after reload', async ({ page }) => {
  await openGame(page);
  await leaveFullscreen(page);
  await page.locator('[data-game="dodge"]').click();
  for (const [score, title] of [[100, 'NEW PERSONAL BEST'], [100, 'One more try?'], [99, 'One more try?'], [101, 'NEW PERSONAL BEST']]) {
    await page.locator('[data-difficulty="easy"]').click();
    await page.evaluate(score => {
      snapshot = { ...snapshot, score, over: true, won: false, dying: false };
      render(); render();
    }, score);
    await expect(page.locator('#overlay-title')).toHaveText(title);
    await page.locator('#overlay-action').click();
  }
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  expect(await page.evaluate(() => saved.scores['dodge:easy'].find(x => x.player === saved.player).score)).toBe(101);
});

test('Chaos turtle turns smoothly toward movement and keeps its heading at rest; Impossible has its own remix', async ({ page }) => {
  await openGame(page);
  await leaveFullscreen(page);
  await page.locator('[data-game="dodge"]').click();
  await page.locator('[data-difficulty="chaos"]').click();
  await settleFullscreen(page);
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => chaosTurtleAngle)).toBeGreaterThan(1);
  await page.keyboard.up('ArrowRight');
  await settleFullscreen(page);
  await page.keyboard.down('ArrowDown');
  await expect.poll(() => page.evaluate(() => chaosTurtleAngle)).toBeGreaterThan(2.5);
  await page.keyboard.up('ArrowDown');
  await expect.poll(() => page.evaluate(() => Math.abs(chaosTurtleAngle - Math.PI))).toBeLessThan(.08);
  await page.locator('#exit').click();
  await page.locator('[data-difficulty="impossible"]').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('dodge_impossible');
  expect(await page.evaluate(() => chaosTurtleAngle)).toBe(0);
});
