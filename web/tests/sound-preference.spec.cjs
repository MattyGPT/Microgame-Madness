const { test, expect, openGame } = require('./fixtures/game.cjs');
test.use({ deterministicMusic: true });

test('enabling sound survives an older profile arriving while the preference saves', async ({ page }) => {
  await openGame(page);
  await page.locator('#sound').click();
  await page.evaluate(() => soundSettingChain);
  await page.reload();
  await expect.poll(() => page.evaluate(() => accountApp.initialized)).toBe(true);
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => {
    const old = structuredClone(saved);
    document.getElementById('sound').click();
    applyAccountProfile(old);
  });
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => soundSettingChain);
  await page.reload();
  await expect.poll(() => page.evaluate(() => accountApp.initialized)).toBe(true);
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
});

test('a delayed older profile cannot mute sound after the toggle has finished saving', async ({ page }) => {
  await openGame(page);
  await page.locator('#sound').click();
  await page.evaluate(() => soundSettingChain);
  await page.evaluate(() => { window.oldMutedProfile = structuredClone(saved); });
  await page.locator('#sound').click();
  await page.evaluate(() => soundSettingChain);
  await page.evaluate(() => applyAccountProfile(structuredClone(window.oldMutedProfile)));
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => soundOn && audioMaster.gain.value > .9)).toBe(true);
  // A genuinely newer settings edit must still be applied.
  await page.evaluate(() => accountApp.setting({ soundOn: false }));
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
});
