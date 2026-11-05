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

test('tester code grants only TON 618, persists, and permits re-equipping', async ({ page }) => {
  const before = await page.evaluate(() => JSON.stringify(saved.achievements));
  await page.locator('#player').fill('');
  await page.locator('#player').pressSequentially('GRAVITRON618', { delay: 35 });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'ton_618');
  expect(await page.evaluate(() => JSON.stringify(saved.achievements))).toBe(before);
  expect(await page.evaluate(() => saved.unlocks.singularity)).toBe(false);
  await expect(page.locator('#core-origin')).toBeHidden();
  await page.locator('#player').fill('Tester');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'ton_618');
  expect(await page.evaluate(() => JSON.stringify(saved.achievements))).toBe(before);
  await page.locator('[data-game="customs"]').click();
  await page.getByRole('button', { name: 'Wear Classic Cubie', exact: true }).click();
  await page.getByRole('button', { name: 'Wear TON 618', exact: true }).click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'ton_618');
});

test('disabling the temporary code revokes saved tester access without removing earned rewards', async ({ page }) => {
  await page.locator('#player').fill('gravitron618');
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'ton_618');
  await page.route('**/customs.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('const testerCodeActive = true;', 'const testerCodeActive = false;') });
  });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'classic');
  await page.locator('#player').fill('GRAVITRON618');
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'classic');
  expect(await page.evaluate(() => CubieCustoms.unlocked(CubieCustoms.catalog.find(c => c.id === 'ton_618'), {core_flawless: '2026-11-05'}))).toBe(true);
});
