const { test, expect } = require('./fixtures/game.cjs');
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
});

test('defeated bosses visibly laugh after combat stops, with reduced motion support', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('const pyodide = await loadPyodide(', 'const pyodide = window.laughRuntime = await loadPyodide(') });
  });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  for (const [mode, difficulty] of [['boss','mean'], ['boss','impossible'], ['pumpkin','baby'], ['wrath','color_memory'], ['singularity','gravitron'], ['core_practice','railgun_array']]) {
    await page.evaluate(({mode,difficulty}) => {
      saved.unlocks.singularity = true;
      selectGame(mode); startGame(difficulty);
      if (['pumpkin', 'wrath'].includes(mode)) laughRuntime.runPython('from bridge import session\nsession.game.begin_attack(0)');
      laughRuntime.runPython('from bridge import session\nfrom arcade_effects import DEATH_DURATION\nsession.game.alive = False\nsession.death_age = DEATH_DURATION');
    }, {mode,difficulty});
    await expect.poll(() => page.evaluate(() => !active && snapshot.over)).toBe(true);
    await expect.poll(() => page.evaluate(() => laughRuntime.runPython('getattr(session.game, "defeat_laugh_age", 0)'))).toBeGreaterThan(.1);
    await expect(page.locator('#overlay')).toHaveClass(/boss-defeat/);
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
