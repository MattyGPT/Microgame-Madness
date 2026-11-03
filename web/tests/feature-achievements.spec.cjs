const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

test.beforeEach(async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/pyodide/v0.29.3/full/**', route => {
    const file = path.basename(new URL(route.request().url()).pathname);
    const local = path.resolve('node_modules/pyodide', file);
    if (!fs.existsSync(local)) return route.abort();
    return route.fulfill({ path: local,
      contentType: file.endsWith('.wasm') ? 'application/wasm' : file.endsWith('.js') ? 'application/javascript' : 'application/octet-stream',
      headers: { 'access-control-allow-origin': '*' } });
  });
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
});

test('Determination tracks real losses across reloads and awards crystal on the fiftieth loss', async ({ page }, testInfo) => {
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('random.choice(rules["words"])', '"cat"') });
  });
  await page.evaluate(() => { saved.achievements.stats.totalLosses = 48; persist(); });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await page.locator('#achievements-tab').click();
  const card = page.locator('[data-achievement="determination"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute('data-tier', 'crystal');
  await expect(card).toContainText('Lose 50 minigame rounds in total.');
  await expect(card).toContainText('Locked · 48 / 50');
  await expect(card).toContainText('+270 points');
  await card.screenshot({ path: testInfo.outputPath('determination-locked.png') });
  async function loseHangman() {
    await page.locator('[data-game="hangman"]').click();
    await page.locator('[data-difficulty="easy"]').click();
    for (const letter of 'BDEFGHIJKLMNOPQRSUVWXYZ') {
      if (await page.locator('#overlay').isVisible()) break;
      await page.getByRole('button', { name: `Guess ${letter}`, exact: true }).click();
    }
    await expect(page.locator('#overlay')).toBeVisible();
  }
  await loseHangman();
  await expect(card).toContainText('Locked · 49 / 50');
  expect(await page.evaluate(() => saved.achievements.stats.totalLosses)).toBe(49);
  const before = Number(await page.locator('#profile-score').textContent());
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await page.locator('[data-difficulty="easy"]').click();
  await page.locator('#exit').click();
  expect(await page.evaluate(() => saved.achievements.stats.totalLosses)).toBe(49);
  await page.locator('#player').fill('Still Trying');
  await loseHangman();
  await expect(page.locator('#profile-score')).toHaveText(String(before + 270));
  const toast = page.locator('.achievement-toast[data-achievement-id="determination"]');
  await expect(toast).toHaveAttribute('data-tier', 'crystal');
  await expect(toast).toContainText('Determination');
  await expect(toast).toContainText('crystal achievement · +270 points');
  await toast.screenshot({ path: testInfo.outputPath('determination-toast.png') });
  await page.locator('#achievements-tab').click();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveClass(/earned/);
  await expect(card).toContainText('Unlocked');
  expect(await card.locator('progress').evaluate(progress => progress.value)).toBe(50);
  await card.screenshot({ path: testInfo.outputPath('determination-earned.png') });
  const date = await page.evaluate(() => saved.achievements.unlocked.determination);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#profile-score')).toHaveText(String(before + 270));
  expect(await page.evaluate(() => saved.achievements.unlocked.determination)).toBe(date);
  expect(await page.evaluate(() => saved.achievements.stats.totalLosses)).toBe(50);
  await expect(page.locator('#achievement-toast')).toBeHidden();
});

test('Empyrorite has emerald crystal cards, a 7290-point reward, matching celebration, and persistence', async ({ page }, testInfo) => {
  await page.locator('#achievements-tab').click();
  await expect(page.locator('.achievement-card')).toHaveCount(await page.evaluate(() => Achievements.catalog.length));
  await expect(page.locator('.achievement-legend')).toContainText('Empyrorite +7290');
  const card = page.locator('[data-achievement="core_flawless"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toContainText('Hands of Empyrorite');
  await expect(card).toContainText('empyrorite · +7290 points');
  await expect(card).toContainText('Locked');
  await expect(card.locator('.empyrorite-gem')).toHaveCount(1);
  const style = () => card.evaluate(el => ({
    filter: getComputedStyle(el).filter,
    shape: getComputedStyle(el).clipPath,
    padding: getComputedStyle(el).paddingTop,
    background: getComputedStyle(el.querySelector('.achievement-content')).backgroundImage,
  }));
  const locked = await style();
  expect(locked.filter).not.toContain('grayscale');
  expect(locked.shape).toContain('polygon(');
  expect(locked.padding).toBe('3px');
  expect(locked.background).toContain('rgb(23, 75, 57)');
  await card.screenshot({ path: testInfo.outputPath('empyrorite-locked.png') });
  await expect(page.locator('#achievement-toast')).toBeHidden({ timeout: 7000 });
  const before = await page.evaluate(() => achievementTracker.score);
  await page.evaluate(() => updateAchievements(achievementTracker.update(stats => { stats.coreFlawlessWins = 1; })));
  await expect(card).toHaveClass(/earned/);
  await expect(card).toContainText('Unlocked');
  await expect(page.locator('#profile-score')).toHaveText(String(before + 7290));
  expect((await style()).background).not.toBe(locked.background);
  await expect(page.locator('#achievement-toast .achievement-toast')).toHaveAttribute('data-tier', 'empyrorite');
  await expect(page.locator('#achievement-toast')).toContainText('empyrorite achievement · +7290 points');
  await expect(page.locator('#achievement-toast .empyrorite-gem')).toHaveCount(1);
  const confetti = page.locator('.achievement-confetti[data-tier="empyrorite"]');
  await expect(confetti.locator('i')).toHaveCount(40);
  expect(await confetti.locator('i').first().evaluate(el => el.style.getPropertyValue('--confetti-color'))).toBe('#2cf5a0');
  await card.screenshot({ path: testInfo.outputPath('empyrorite-earned.png') });
  await page.screenshot({ path: testInfo.outputPath('empyrorite-celebration.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const date = await page.evaluate(() => saved.achievements.unlocked.core_flawless);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#profile-score')).toHaveText(String(before + 7290));
  expect(await page.evaluate(() => saved.achievements.unlocked.core_flawless)).toBe(date);
  await page.locator('#achievements-tab').click();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveClass(/earned/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(card).toHaveCSS('animation-name', 'none');
  expect(await card.evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('none');
});

test('Empyrorite challenges cover Merciless and Boss Crush while Chaos, Perfected is Rainbow', async ({ page }, testInfo) => {
  await page.locator('#achievements-tab').click();
  await expect(page.locator('.achievement-card[data-tier="empyrorite"]')).toHaveCount(3);
  for (const [id, title, requirement] of [
    ['dodge_merciless_300', 'Beyond the Last Mercy', '300 seconds in one Merciless'],
    ['boss_clean_streak_20', 'Sovereign of the Arena', '20 consecutive Boss Crush fights'],
  ]) {
    const card = page.locator(`[data-achievement="${id}"]`);
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveAttribute('data-tier', 'empyrorite');
    await expect(card).toContainText(title);
    await expect(card).toContainText(requirement);
    await expect(card).toContainText('+7290 points');
    if (id === 'boss_clean_streak_20') {
      await expect(card).toContainText('Cruel or harder');
      await expect(card).toContainText('Mean fights are ignored');
    }
    await card.screenshot({ path: testInfo.outputPath(`${id}.png`) });
  }
  const shuffle = page.locator('[data-achievement="wrath_perfect_shuffle"]');
  await shuffle.scrollIntoViewIfNeeded();
  await expect(shuffle).toHaveAttribute('data-tier', 'rainbow');
  await expect(shuffle).toContainText('Chaos, Perfected');
  await expect(shuffle).toContainText('+2430 points');
  await expect(shuffle.locator('.empyrorite-gem')).toHaveCount(0);
});

test('Rainbow retiering keeps the existing Chaos, Perfected date and recalculates profile points once', async ({ page }) => {
  const date = '2026-11-01T10:00:00.000Z';
  await page.evaluate(date => {
    localStorage.setItem(storageKey, JSON.stringify({ ...saved, achievements: {
      stats: { visits: 1, wrathPerfectShuffle: 1 },
      unlocked: { welcome: date, wrath_perfect_shuffle: date }, score: 7300,
    } }));
  }, date);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#profile-score')).toHaveText('2440');
  expect(await page.evaluate(() => saved.achievements.unlocked.wrath_perfect_shuffle)).toBe(date);
  await expect(page.locator('#achievement-toast')).toBeHidden();
  await page.locator('#achievements-tab').click();
  const card = page.locator('[data-achievement="wrath_perfect_shuffle"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveClass(/earned/);
  await expect(card).toHaveAttribute('data-tier', 'rainbow');
});
