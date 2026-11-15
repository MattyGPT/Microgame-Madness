const { test, expect } = require('@playwright/test');
test('death glitches the encounter, returns to the arcade, and reloads once after three seconds', async ({ page }) => {
  await page.goto('/tearesseract.html');
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const requests = [];
  page.on('request', request => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) requests.push({ url: request.url(), time: Date.now() });
  });
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now()+1000));
  await page.evaluate(() => TearesseractDeath.start(null, true));
  await expect(page.locator('html')).toHaveClass(/tea-breach/);
  await page.clock.runFor(960);
  await expect(page).toHaveURL(/tearesseract-breach=/);
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('.tea-breach-overlay')).toBeVisible();
  await page.clock.runFor(1900);
  await expect(page).toHaveURL(/tearesseract-breach=/);
  await page.clock.runFor(200);
  await expect(page).toHaveURL(/:\d+\/$/);
  await expect(page.locator('.tea-breach-overlay')).toHaveCount(0);
  await page.waitForLoadState('domcontentloaded');
  await page.clock.runFor(1200);
  expect(requests).toHaveLength(2);
  expect(errors).toEqual([]);
});
