const { leaveFullscreen } = require('./fixtures/game.cjs');
const { test, expect, openGame } = require('./fixtures/game.cjs');
test.use({ deterministicMusic: true });

test('enabling sound survives an older profile arriving while the preference saves', async ({ page }) => {
  await openGame(page);
  await leaveFullscreen(page);
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
  await leaveFullscreen(page);
  await page.locator('#sound').click();
  await page.evaluate(() => soundSettingChain);
  await page.evaluate(() => { window.oldMutedProfile = structuredClone(saved); });
  await leaveFullscreen(page);
  await page.locator('#sound').click();
  await page.evaluate(() => soundSettingChain);
  await page.evaluate(() => applyAccountProfile(structuredClone(window.oldMutedProfile)));
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => soundOn && audioMaster.gain.value > .9)).toBe(true);
  // A genuinely newer settings edit must still be applied.
  await page.evaluate(() => accountApp.setting({ soundOn: false }));
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
});

test('local sound choice survives save failure, newer cloud mute, and reload', async ({ page }) => {
  await openGame(page);
  await leaveFullscreen(page);
  await page.locator('#sound').click();
  await page.evaluate(() => soundSettingChain);
  await page.evaluate(() => {
    accountApp.setting = async () => { throw new Error('Offline'); };
    document.getElementById('sound').click();
  });
  await page.evaluate(() => soundSettingChain);
  await page.evaluate(() => {
    const cloud = structuredClone(saved);
    cloud.preferences.soundOn = false;
    cloud.preferenceRevisions.soundOn = 100;
    applyAccountProfile(cloud);
  });
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect.poll(() => page.evaluate(() => accountApp.initialized)).toBe(true);
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
});

test('temporary audio setup failure preserves intent and retries on interaction', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => {
    window.RealAudioContext = window.AudioContext;
    window.AudioContext = class { constructor() { throw new Error('Temporary audio failure'); } };
    initializeAudio();
  });
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => { window.AudioContext = window.RealAudioContext; });
  await page.mouse.click(5, 5);
  await expect.poll(() => page.evaluate(() => audioContext?.state)).toBe('running');
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
});

test('rapid toggles keep the final choice through saving and reload', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => {
    for (let n = 0; n < 4; n++) document.getElementById('sound').click();
  });
  await page.evaluate(() => soundSettingChain);
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect.poll(() => page.evaluate(() => accountApp.initialized)).toBe(true);
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
});
