const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
test.beforeEach(async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/pyodide/v0.29.3/full/**', route => {
    const name = path.basename(new URL(route.request().url()).pathname);
    const file = path.resolve('node_modules/pyodide', name);
    return fs.existsSync(file) ? route.fulfill({ path: file,
      contentType: name.endsWith('.wasm') ? 'application/wasm' : name.endsWith('.js') ? 'application/javascript' : 'application/octet-stream',
      headers: { 'access-control-allow-origin': '*' } }) : route.abort();
  });
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
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
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#achievement-toast [data-custom-id]')).toHaveCount(0);
});
