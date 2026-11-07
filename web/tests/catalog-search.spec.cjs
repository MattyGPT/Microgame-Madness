const { test, expect } = require('./fixtures/game.cjs');
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
});

test('shop search filters Customs and trails while preserving buying and sorting', async ({ page }, testInfo) => {
  await page.locator('[data-game="shop"]').click();
  const search = page.getByRole('searchbox', { name: 'Search shop' });
  await search.fill('  SPACE   junk  ');
  await expect(page.locator('#shop-grid .custom-tile:visible')).toHaveCount(1);
  await expect(page.locator('#shop-grid .custom-tile:visible')).toContainText('Space Junk Cubie');
  await page.evaluate(() => { saved.shop.units = 1230000; renderShop(); });
  await page.getByRole('button', { name: 'Buy Space Junk Cubie', exact: true }).click();
  await expect(search).toHaveValue('  SPACE   junk  ');
  await page.getByRole('button', { name: 'Wear Space Junk Cubie', exact: true }).click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'shop_space_junk');
  await search.fill('zzznomatch');
  await expect(page.locator('#shop-grid .custom-tile:visible')).toHaveCount(0);
  await expect(page.locator('#shop-search-status')).toContainText('No matches');
  await page.locator('#shop-trails-tab').click();
  await search.fill('mint');
  await expect(page.locator('#trail-grid .custom-tile:visible')).toContainText(['Mint']);
  await search.fill('');
  await expect(page.locator('#trail-grid .custom-tile:visible')).toHaveCount(48);
  await page.locator('#shop-customs-tab').click();
  const prices = await page.locator('#shop-grid .custom-tile:visible').evaluateAll(cards => cards.map(card => CubieCustoms.catalog.find(c => c.id === card.dataset.custom).price));
  expect(prices).toEqual([...prices].sort((a,b) => a-b));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#shop-room').screenshot({path:testInfo.outputPath('shop-search.png')});
});

test('Cubie collection search combines with ownership filters and keeps preview usable', async ({ page }) => {
  await page.locator('[data-game="customs"]').click();
  const search = page.getByRole('searchbox', { name: 'Search Cubie collection' });
  await search.fill('chocolate');
  await expect(page.locator('#customs-grid .custom-tile:visible')).toHaveCount(1);
  await page.getByRole('button', { name: 'Preview Chocolate Cubie', exact: true }).click();
  await expect(page.locator('#customs-equipped-name')).toHaveText('Chocolate Cubie');
  await page.locator('#customs-filter').selectOption('unlocked');
  await expect(page.locator('#customs-grid .custom-tile:visible')).toHaveCount(0);
  await expect(page.locator('#customs-search-status')).toContainText('No Customs match');
  await search.fill('classic');
  await expect(page.locator('#customs-grid .custom-tile:visible')).toHaveCount(1);
  await page.locator('#customs-filter').selectOption('all');
  await search.fill('20 healing');
  await expect(page.locator('#customs-grid .custom-tile:visible')).toContainText(['Chocolate Cubie']);
  await search.fill('');
  await expect(page.locator('#customs-grid .custom-tile:visible')).toHaveCount(await page.evaluate(() => CubieCustoms.catalog.length));
});

test('achievement search combines with filters without disclosing redacted achievements', async ({ page }) => {
  await page.locator('#achievements-tab').click();
  const search = page.getByRole('searchbox', { name: 'Search achievements' });
  await search.fill('  SWEET recovery ');
  await expect(page.locator('.achievement-card:visible')).toHaveCount(1);
  await expect(page.locator('.achievement-card:visible')).toContainText('Collect 20 healing');
  await page.locator('#achievement-filter').selectOption('earned');
  await expect(page.locator('.achievement-card:visible')).toHaveCount(0);
  await expect(page.locator('#achievement-empty')).toBeVisible();
  await page.locator('#achievement-filter').selectOption('all');
  const secret = await page.evaluate(() => Achievements.catalog.find(a => a.secret && !achievementTracker.data.unlocked[a.id]).title);
  await search.fill(secret);
  await expect(page.locator('.achievement-card.redacted:visible')).toHaveCount(0);
  await search.fill('silver');
  await expect(page.locator('.achievement-card:visible:not([data-tier="silver"])')).toHaveCount(0);
  await search.fill('');
  await expect(page.locator('.achievement-card:visible')).toHaveCount(await page.evaluate(() => Achievements.catalog.length));
});
