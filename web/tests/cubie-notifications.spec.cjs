const { test, expect } = require('./fixtures/game.cjs');
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
});

test('new Customs share the achievement stack once, including purchases, and stay quiet on reload', async ({page}, testInfo) => {
  const drain = () => page.evaluate(() => {
    while (activeAchievementToasts.size) dismissAchievementToast(activeAchievementToasts.keys().next().value);
  });
  await drain();
  await page.evaluate(() => {
    updateAchievements(achievementTracker.secret('codexisthebest'));
  });
  const notice = page.locator('#achievement-toast [data-custom-id="codex"]');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('New Cubie unlocked');
  await expect(notice).toContainText('Codex Cubie');
  await expect(notice.locator('svg')).toHaveAttribute('data-custom','codex');
  await page.locator('#achievement-toast').screenshot({path:testInfo.outputPath('cubie-unlock.png')});
  await drain();
  await page.evaluate(() => updateAchievements(achievementTracker.secret('codexisthebest')));
  await expect(page.locator('#achievement-toast [data-custom-id]')).toHaveCount(0);
  await page.evaluate(() => { saved.shop.units = 10000000; persist(); });
  await page.locator('[data-game="shop"]').click();
  const tile = page.locator('#shop-grid .custom-tile').first();
  const id = await tile.getAttribute('data-custom');
  await tile.locator('.custom-equip').click();
  await expect(page.locator(`#achievement-toast [data-custom-id="${id}"]`)).toBeVisible();
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#achievement-toast [data-custom-id]')).toHaveCount(0);
});
