const { test, expect } = require('./fixtures/game.cjs');
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
});

test('Core aftermath loops until a game is selected and resets on reload', async ({ page }) => {
  await page.locator('#player').fill('GRAVITRON');
  await expect(page.locator('#core-origin')).toBeVisible();
  await page.evaluate(() => coreOrigin.close());
  expect(await page.evaluate(() => coreAftermath)).toBe(true);
  await expect.poll(() => page.evaluate(() => musicPlayer?.current?.track)).toBe('core_aftermath');
  expect(await page.evaluate(() => musicPlayer.current.source.loop)).toBe(true);
  await page.locator('[data-game="hangman"]').click();
  expect(await page.evaluate(() => coreAftermath)).toBe(false);
  await page.locator('[data-game="jukebox"]').click();
  await page.locator('#player').fill('');
  await page.locator('#player').fill('GRAVITRON');
  await expect(page.locator('#core-origin')).toBeVisible();
  await page.evaluate(() => coreOrigin.close());
  await expect.poll(() => page.evaluate(() => musicPlayer?.current?.track)).toBe('core_aftermath');
  await page.reload();
  expect(await page.evaluate(() => coreAftermath)).toBe(false);
});

test('audible Christmas song unlocks persistent Gold Santa, muted selection does not', async ({ page }) => {
  await page.locator('#sound').click();
  await page.locator('[data-game="jukebox"]').click();
  await page.locator('[data-difficulty="christmas_99"]').click();
  expect(await page.evaluate(() => !!saved.achievements.unlocked.santa_song)).toBe(false);
  await page.locator('#sound').click();
  await expect.poll(() => page.evaluate(() => !!saved.achievements.unlocked.santa_song)).toBe(true);
  await page.locator('[data-game="customs"]').click();
  await page.getByRole('button', { name: 'Wear Santa Cubie', exact: true }).click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'santa');
  expect(await page.evaluate(() => CubieCustoms.catalog.find(c => c.id === 'santa').tier)).toBe('gold');
  await page.screenshot({path:'/tmp/santa-cubie.png'});
  await page.reload();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'santa');
});

test('only character bosses laugh on defeat; Core and victories stay silent', async ({ page }) => {
  const heard = await page.evaluate(() => {
    const events = []; const original = playSound;
    playSound = event => events.push(event);
    for (const mode of ['boss', 'pumpkin', 'wrath', 'singularity', 'core_practice']) {
      selected = mode; selectedDifficulty = Object.keys(modes[mode].difficulties)[0];
      snapshot = {over:true, won:false, score:0}; roundSaved = false;
      saveRound(); saveRound();
      snapshot.won = true; roundSaved = false; saveRound();
    }
    playSound = original;
    return events;
  });
  expect(heard.filter(event => event === 'boss_laugh')).toHaveLength(3);
});
