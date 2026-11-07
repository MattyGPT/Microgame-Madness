const { test, expect } = require('./fixtures/game.cjs');
test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title.startsWith('previously restored')) {
    await page.addInitScript(() => {
      if (!localStorage.getItem('microgame-madness.v1'))
        localStorage.setItem('microgame-madness.v1', JSON.stringify({ testerTon618: true, cubieCustom: 'ton_618' }));
    });
  }
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
  await page.evaluate(async () => {
    const result = {mode:'singularity',difficulty:'gravitron',over:true,won:true,score:1000,attacks_completed:15,hp:0,shielded:false,lives:10,damage_taken:0};
    accountApp.startRun('singularity','gravitron');
    accountApp.observe(result, true);
    await accountApp.chain;
    accountApp.applyCurrent();
    await accountApp.setting({ cubieCustom: 'ton_618' });
  });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','ton_618');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','ton_618');
});
test('previously restored code owners retain their Custom', async ({page}) => {
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','ton_618');
});
