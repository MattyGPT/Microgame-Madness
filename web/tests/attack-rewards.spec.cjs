const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

test.beforeEach(async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/pyodide/v0.29.3/full/**', route => {
    const name = path.basename(new URL(route.request().url()).pathname);
    const file = path.resolve('node_modules/pyodide', name);
    if (!fs.existsSync(file)) return route.abort();
    return route.fulfill({ path: file, contentType: name.endsWith('.wasm') ? 'application/wasm'
      : name.endsWith('.js') ? 'application/javascript' : 'application/octet-stream',
    headers: { 'access-control-allow-origin': '*' } });
  });
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('const pyodide = await loadPyodide(',
      'const pyodide = window.attackTestRuntime = await loadPyodide(') });
  });
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
});

async function clearCelebrations(page) {
  await page.evaluate(() => {
    document.querySelector('#achievement-celebrations').replaceChildren();
    document.querySelector('#achievement-toast').hidden = true;
  });
}

test('Pumpkin and Wrath completed attacks combine, persist, and unlock the matching outfit at ten', async ({ page }) => {
  await page.evaluate(() => {
    selectGame('pumpkin'); startGame('baby'); active = false;
    attackTestRuntime.runPython('from bridge import session\ngame = session.game\ngame.invulnerable = 1000000\ngame.touches_king = lambda: False\nfor _ in range(4):\n    game.begin_attack(1)\n    game.update(6, set())');
    snapshot = send('tick', { dt: 0 }); render();
    selectGame('wrath'); startGame('bone_gauntlet'); active = false;
    attackTestRuntime.runPython('game = session.game\ngame.invulnerable = 1000000\ngame.touches_king = lambda: False\ngame.update(45, set())');
    snapshot = send('tick', { dt: 0 }); render();
  });
  expect(await page.evaluate(() => saved.achievements.stats.survive_pumpkin_bone_gauntlet)).toBe(9);
  expect(await page.evaluate(() => !!saved.achievements.unlocked.survive_pumpkin_bone_gauntlet)).toBe(false);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await page.evaluate(() => {
    selectGame('wrath'); startGame('bone_gauntlet'); active = false;
    attackTestRuntime.runPython('from bridge import session\ngame = session.game\ngame.invulnerable = 1000000\ngame.touches_king = lambda: False\ngame.update(9, set())');
    snapshot = send('tick', { dt: 0 }); render(); render();
  });
  expect(await page.evaluate(() => saved.achievements.stats.survive_pumpkin_bone_gauntlet)).toBe(10);
  await clearCelebrations(page);
  await page.locator('[data-game="customs"]').click();
  const tile = page.locator('[data-custom="attack_pumpkin_bone_gauntlet"]');
  await expect(tile).toContainText('Bone Veteran');
  await expect(tile.locator('.custom-equip')).toBeEnabled();
  await tile.locator('.custom-equip').click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'attack_pumpkin_bone_gauntlet');
});

test('Core full fight and loader combine to three, award once, and preserve equipped reward', async ({ page }) => {
  await page.evaluate(() => {
    unlockSingularity(false); selectGame('singularity'); startGame('gravitron'); active = false;
    attackTestRuntime.runPython('from bridge import session\ngame = session.game\ngame.invulnerable = 1000000\nfor _ in range(2):\n    game.begin_attack(7)\n    game.update(8, set())');
    snapshot = send('tick', { dt: 0 }); render();
    selectGame('core_practice'); startGame('photon_rain'); active = false;
    attackTestRuntime.runPython('game = session.game\ngame.invulnerable = 1000000\ngame.update(10.9, set())');
    snapshot = send('tick', { dt: 0 }); render();
  });
  expect(await page.evaluate(() => saved.achievements.stats.survive_core_photon_rain)).toBe(2);
  expect(await page.evaluate(() => !!saved.achievements.unlocked.survive_core_photon_rain)).toBe(false);
  await page.evaluate(() => {
    attackTestRuntime.runPython('game.update(.1, set())');
    snapshot = send('tick', { dt: 0 }); render(); render();
  });
  expect(await page.evaluate(() => saved.achievements.stats.survive_core_photon_rain)).toBe(3);
  expect(await page.evaluate(() => saved.achievements.stats.coreWins)).toBe(0);
  await clearCelebrations(page);
  await page.locator('[data-game="customs"]').click();
  const tile = page.locator('[data-custom="attack_core_photon_rain"]');
  await expect(tile).toContainText('Survive Photon Rain 3 times.');
  await expect(tile).not.toContainText(/loader|temporary/);
  await tile.locator('.custom-equip').click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'attack_core_photon_rain');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'attack_core_photon_rain');
});
