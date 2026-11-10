const { test, expect, openGame } = require('./fixtures/game.cjs');
test.use({ firstVisitSetup: true });

test('reset requires two yes answers and clears persisted guest progress', async ({ page }) => {
  await openGame(page);
  await page.locator('#welcome-close').click();
  await page.evaluate(async () => {
    await accountApp.ready;
    await accountApp.store.mutate('guest', record => {
      record.confirmed.player = record.optimistic.player = 'Reset Test';
      return record;
    });
    await accountApp.controller.activate('guest');
    accountApp.applyCurrent();
    localStorage.setItem('microgame-madness.sound.v2', 'false');
    localStorage.setItem('microgame-madness.extra', 'old data');
    sessionStorage.setItem('microgame-madness.extra', 'old data');
    await accountApp.store.ensure('another-cached-account');
  });
  const reset = page.locator('#reset-open');
  const dialog = page.locator('#reset-dialog');
  const yes = page.locator('#reset-yes');
  const name = () => page.evaluate(async () => (await accountApp.store.get('guest')).optimistic.player);
  await reset.click();
  await expect(page.locator('#reset-heading')).toHaveText('REALLY reset?');
  await page.locator('#reset-no').click();
  await expect.poll(name).toBe('Reset Test');
  await reset.click();
  await yes.click();
  await expect(page.locator('#reset-heading')).toHaveText('Are you 100% sure?');
  await expect(page.locator('#reset-description')).toContainText('resets ALL progress');
  await expect.poll(name).toBe('Reset Test');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect.poll(name).toBe('Reset Test');
  await reset.click();
  await expect(page.locator('#reset-heading')).toHaveText('REALLY reset?');
  await yes.click();
  await Promise.all([page.waitForEvent('load'), yes.click()]);
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await page.evaluate(() => accountApp.ready);
  await expect.poll(name).not.toBe('Reset Test');
  await expect(page.locator('#player')).not.toHaveValue('Reset Test');
  await expect(page.locator('#welcome-dialog')).toBeVisible();
  await expect(page.locator('#welcome-hello')).toBeVisible();
  expect(await page.evaluate(async () => ({
    sound: localStorage.getItem('microgame-madness.sound.v2'),
    local: localStorage.getItem('microgame-madness.extra'),
    session: sessionStorage.getItem('microgame-madness.extra'),
    cached: await accountApp.store.get('another-cached-account') || null,
  }))).toEqual({ sound: null, local: null, session: null, cached: null });
  const positions = await page.evaluate(() => ({
    reset: document.querySelector('#reset-open').getBoundingClientRect().right,
    login: document.querySelector('#login-open').getBoundingClientRect().left,
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(positions.reset).toBeLessThanOrEqual(positions.login);
  expect(positions.width).toBeLessThanOrEqual(positions.viewport);
});
