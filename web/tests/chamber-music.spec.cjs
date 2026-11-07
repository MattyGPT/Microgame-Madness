const { test, expect, openGame } = require('./fixtures/game.cjs');
test('Dragon Dance plays its extended arrangement through the jukebox controls', async ({ page }) => {
  await openGame(page);
  await page.locator('[data-game="jukebox"]').click();
  for (const id of ['dragon_dance', 'lantern_market', 'rain_on_glass', 'sunwheel_parade'])
    await expect(page.locator(`[data-difficulty="${id}"]`)).toBeVisible();
  await page.locator('[data-difficulty="dragon_dance"]').click();
  await expect(page.locator('#jukebox-status')).toContainText('Now playing');
  expect(await page.evaluate(() => musicPlayer.current.source.buffer.duration)).toBeGreaterThan(150);
  await page.locator('#jukebox-pause').click();
  await expect(page.locator('#jukebox-status')).toContainText('Paused');
  await page.locator('#jukebox-pause').click();
  await expect(page.locator('#jukebox-status')).toContainText('Now playing');
});
