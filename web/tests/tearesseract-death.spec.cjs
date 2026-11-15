const { test, expect } = require('@playwright/test');
test('death glitches the encounter, returns to the arcade, and reloads once after three seconds', async ({ page }) => {
  await page.goto('/tearesseract.html');
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const requests = [];
  page.on('request', request => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) requests.push({ url: request.url(), time: Date.now() });
  });
  const started = Date.now();
  await page.evaluate(() => TearesseractDeath.start(null, true));
  await expect(page.locator('html')).toHaveClass(/tea-breach/);
  await expect(page).toHaveURL(/tearesseract-breach=/);
  await expect(page.locator('.tea-breach-overlay')).toBeVisible();
  await expect(page).toHaveURL(/:\d+\/$/);
  await expect(page.locator('.tea-breach-overlay')).toHaveCount(0);
  await page.waitForTimeout(1200);
  expect(requests).toHaveLength(2);
  expect(requests[1].time - started).toBeGreaterThanOrEqual(2900);
  expect(requests[1].time - started).toBeLessThan(4500);
  expect(errors).toEqual([]);
});
