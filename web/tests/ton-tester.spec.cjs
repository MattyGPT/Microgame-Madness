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

test('retired code cannot grant TON 618, but the achievement still unlocks it', async ({page}) => {
  await page.locator('#player').fill('GRAVITRON618');
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','classic');
  expect(await page.evaluate(() => CubieCustoms.redeemTesterCode('GRAVITRON618'))).toBe(false);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  expect(await page.evaluate(() => CubieCustoms.unlocked(CubieCustoms.catalog.find(c => c.id === 'ton_618'), achievementTracker.data.unlocked, saved.shop.owned, saved.testerTon618))).toBe(false);
  await page.evaluate(() => {
    updateAchievements(achievementTracker.start('singularity','gravitron'));
    updateAchievements(achievementTracker.observe({mode:'singularity',difficulty:'gravitron',over:true,won:true,attacks_completed:15,hp:0,shielded:false,lives:10,damage_taken:0}));
    saved.cubieCustom='ton_618'; persist(); applyCubieCustom();
  });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','ton_618');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','ton_618');
});
test('previously restored code owners retain their Custom', async ({page}) => {
  await page.evaluate(() => { saved.testerTon618=true; saved.cubieCustom='ton_618'; persist(); });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','ton_618');
});
