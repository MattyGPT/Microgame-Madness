const { test, expect, openGame } = require('./fixtures/game.cjs');
test.use({ launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } });
test('normal arrival stays silent, but Cubie welcome attempts its song', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => arcadeWelcome.ready);
  expect(await page.evaluate(() => !!audioContext)).toBe(false);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Runtime.evaluate', { expression: 'arcadeWelcome.open()', userGesture: false });
  await expect.poll(() => page.evaluate(() => audioContext?.state)).toBe('running');
  expect(await page.evaluate(() => musicPlayer.current?.track)).toBe('cubie_hello');
  await page.evaluate(() => { arcadeWelcome.dialog.close(); document.getElementById('sound').click(); });
  await page.evaluate(() => soundSettingChain);
  await page.reload();
  await page.evaluate(() => arcadeWelcome.ready);
  expect(await page.evaluate(() => soundOn)).toBe(false);
  await page.evaluate(() => arcadeWelcome.open());
  expect(await page.evaluate(() => !!musicPlayer?.playing)).toBe(false);
});
test.describe('first visit', () => {
  test.use({ firstVisitSetup: true });
  test('Cubie automatically opens with its intro music', async ({ page }) => {
    await openGame(page);
    await expect(page.locator('#welcome-dialog')).toBeVisible();
    await expect.poll(() => page.evaluate(() => musicPlayer?.current?.track)).toBe('cubie_hello');
  });
});
