const { leaveFullscreen } = require('./fixtures/game.cjs');
const { test, expect, openGame } = require('./fixtures/game.cjs');
test.use({ deterministicMusic: true });

test('each arena plays its own looping theme; pause, mute, exit and jukebox preserve playback controls', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const key = 'microgame-madness.geomayhem.v1:guest';
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ cleared: 20 }));
  });
  await openGame(page);
  for (let level = 1; level <= 20; level++) {
    await leaveFullscreen(page);
    await page.locator('[data-game="geomayhem"]').click();
    await page.locator(`[data-difficulty="level_${level}"]`).click();
    expect(await page.evaluate(() => musicPlayer.track)).toBe(`geomayhem_level_${level}`);
    expect(await page.evaluate(() => musicPlayer.current.source.loop)).toBe(true);
    await page.locator('#pause').click();
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
    const offset = await page.evaluate(() => musicPlayer.offset);
    await page.locator('#overlay-action').click();
    expect(await page.evaluate(() => musicPlayer.current.offset)).toBe(offset);
  }
  await leaveFullscreen(page);
  await page.locator('#sound').click();
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
  await leaveFullscreen(page);
  await page.locator('#sound').click();
  expect(await page.evaluate(() => musicPlayer.track)).toBe('geomayhem_level_20');
  await leaveFullscreen(page);
  await page.locator('[data-game="hangman"]').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
  await leaveFullscreen(page);
  await page.locator('[data-game="jukebox"]').click();
  for (let level = 1; level <= 20; level++) {
    const card = page.locator(`[data-difficulty="geomayhem_level_${level}"]`);
    await expect(card).toBeVisible();
    await card.click();
    expect(await page.evaluate(() => musicPlayer.track)).toBe(`geomayhem_level_${level}`);
  }
  expect(errors).toEqual([]);
});
