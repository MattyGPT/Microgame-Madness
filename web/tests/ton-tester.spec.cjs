const { test, expect } = require('./fixtures/game.cjs');
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
});

test('retired code cannot grant TON 618, but the achievement still unlocks it', async ({page}) => {
  await page.locator('#player').fill('GRAVITRON618');
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','classic');
  expect(await page.evaluate(() => CubieCustoms.redeemTesterCode('GRAVITRON618'))).toBe(false);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  expect(await page.evaluate(() => CubieCustoms.unlocked(CubieCustoms.catalog.find(c => c.id === 'ton_618'), achievementTracker.data.unlocked, saved.shop.owned, saved.testerTon618))).toBe(false);
  await page.evaluate(() => {
    updateAchievements(achievementTracker.start('singularity','gravitron'));
    updateAchievements(achievementTracker.observe({mode:'singularity',difficulty:'gravitron',over:true,won:true,attacks_completed:15,hp:0,shielded:false,lives:10,damage_taken:0}));
    saved.cubieCustom='ton_618'; persist(); applyCubieCustom();
  });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','ton_618');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','ton_618');
});
test('previously restored code owners retain their Custom', async ({page}) => {
  await page.evaluate(() => { saved.testerTon618=true; saved.cubieCustom='ton_618'; persist(); });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','ton_618');
});
