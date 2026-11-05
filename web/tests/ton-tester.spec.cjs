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

test('TON 618 code unlocks permanently without granting its achievement', async ({ page }) => {
  await page.locator('#player').fill('GRAVITRON618');
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'ton_618');
  expect(await page.evaluate(() => !!achievementTracker.data.unlocked.core_flawless)).toBe(false);
  await page.locator('#player').fill('Nate');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'ton_618');
  expect(await page.evaluate(() => saved.testerTon618)).toBe(true);
});
test('old code grants and saved code names restore TON 618 access', async ({page}) => {
  for (const profile of [{testerTon618:true,player:'Nate'}, {testerTon618:false,player:'GRAVITRON618'}]) {
    await page.evaluate(profile => {
      Object.assign(saved, profile, {cubieCustom:'ton_618'}); persist();
    }, profile);
    await page.reload();
    await expect(page.locator('#runtime-status')).toContainText('All games ready');
    await expect(page.locator('#cube')).toHaveAttribute('data-custom','ton_618');
  }
});
