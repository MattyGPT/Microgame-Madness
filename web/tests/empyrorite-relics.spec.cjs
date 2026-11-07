const { test, expect } = require('./fixtures/game.cjs');
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
});

test('Empyrorite relics preview while locked and equip after their achievements', async ({ page }, testInfo) => {
  const ids = ['phantom_emperor','living_grimoire','tempest_seraph','celestial_forge','abyssal_leviathan'];
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.locator('[data-game="customs"]').click();
  for (const id of ids) {
    const tile = page.locator(`#customs-grid [data-custom="${id}"].custom-tile`);
    await expect(tile).toHaveAttribute('data-tier','empyrorite');
    await expect(tile.locator('.custom-equip')).toBeDisabled();
    await tile.locator('.custom-preview-button').click();
    await expect(page.locator('.customs-preview')).toHaveAttribute('data-tier','empyrorite');
    await expect(page.locator('#customs-preview-art svg')).toHaveAttribute('data-custom',id);
    await page.locator('.customs-preview').screenshot({path:testInfo.outputPath(`${id}.png`)});
  }
  await page.evaluate(ids => {
    updateAchievements(achievementTracker.update(stats => {
      for (const id of ids) {
        const custom = CubieCustoms.catalog.find(c => c.id === id);
        const achievement = Achievements.catalog.find(a => a.id === custom.achievements[0]);
        stats[achievement.stat] = achievement.target;
      }
    }));
  }, ids);
  const emperor = page.locator('#customs-grid .custom-tile[data-custom="phantom_emperor"]');
  await expect(emperor.locator('.custom-equip')).toBeEnabled();
  await emperor.locator('.custom-equip').click();
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','phantom_emperor');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('#cube .emperor-seal')).toHaveCSS('animation-name','none');
  expect(errors).toEqual([]);
});
