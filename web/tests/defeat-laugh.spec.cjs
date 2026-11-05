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

test('defeated bosses visibly laugh after combat stops, with reduced motion support', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('const pyodide = await loadPyodide(', 'const pyodide = window.laughRuntime = await loadPyodide(') });
  });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  for (const [mode, difficulty] of [['boss','mean'], ['boss','impossible'], ['pumpkin','baby'], ['wrath','color_memory'], ['singularity','gravitron'], ['core_practice','railgun_array']]) {
    await page.evaluate(({mode,difficulty}) => {
      saved.unlocks.singularity = true;
      selectGame(mode); startGame(difficulty);
      laughRuntime.runPython('from bridge import session\nfrom arcade_effects import DEATH_DURATION\nsession.game.alive = False\nsession.death_age = DEATH_DURATION');
    }, {mode,difficulty});
    await expect.poll(() => page.evaluate(() => !active && snapshot.over)).toBe(true);
    await expect.poll(() => page.evaluate(() => laughRuntime.runPython('getattr(session.game, "defeat_laugh_age", 0)'))).toBeGreaterThan(.1);
    const before = await page.evaluate(() => ({commands:JSON.stringify(snapshot.commands),score:snapshot.score}));
    await expect.poll(() => page.evaluate(() => JSON.stringify(snapshot.commands))).not.toBe(before.commands);
    expect(await page.evaluate(() => snapshot.score)).toBe(before.score);
    if(mode === 'pumpkin') await page.locator('#game-canvas').screenshot({path:'/tmp/pumpkin-happy-laugh.png'});
  }
  await page.emulateMedia({ reducedMotion:'reduce' });
  const age = await page.evaluate(() => laughRuntime.runPython('session.game.defeat_laugh_age'));
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => laughRuntime.runPython('session.game.defeat_laugh_age'))).toBe(age);
  expect(errors).toEqual([]);
});
