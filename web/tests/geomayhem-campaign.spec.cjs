const { leaveFullscreen } = require('./fixtures/game.cjs');
const { test, expect, openGame } = require('./fixtures/game.cjs');
test.use({ deterministicMusic: true });
const key = 'microgame-madness.geomayhem.v1:guest';
test.beforeEach(async ({ page }) => {
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'handle = pyodide.globals.get("handle");',
      'window.geomayhemRuntime = pyodide; handle = pyodide.globals.get("handle");') });
  });
  await openGame(page);
  await leaveFullscreen(page);
  await page.locator('[data-game="geomayhem"]').click();
});
const model = (page, code) => page.evaluate(code => window.geomayhemRuntime.runPython(code), `from bridge import session\n${code}`);
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);

test('fresh campaign locks arenas, saves a clear, buys permanent upgrades and resets defeated runs', async ({ page }, testInfo) => {
  await expect(page.locator('[data-difficulty="level_1"]')).toBeEnabled();
  await expect(page.locator('[data-difficulty="level_2"]')).toBeDisabled();
  await expect(page.locator('#geomayhem-weapon option:enabled')).toHaveCount(5);
  await page.locator('[data-difficulty="level_2"]').evaluate(button => { button.disabled = false; button.click(); });
  await expect(page.locator('#geomayhem-hud')).toBeHidden();
  await page.locator('[data-difficulty="level_1"]').click();
  await expect(page.locator('#geomayhem-run-info')).toContainText('Relics: none yet');
  await model(page, 'session.game.wave = 20\nsession.game.cleared = 19\nsession.game.spawned = session.game.quota\nsession.game.enemies.clear()');
  await expect(page.locator('#overlay-copy')).toContainText('Arena 2 unlocked');
  await expect(page.locator('#overlay-copy')).toContainText('+100 shards');
  await expect.poll(async () => (await saved(page))?.cleared).toBe(1);
  await page.locator('#overlay-action').click();
  await expect(page.locator('[data-difficulty="level_2"]')).toBeEnabled();
  await expect(page.locator('[data-difficulty="level_3"]')).toBeDisabled();
  await expect(page.locator('#geomayhem-weapon option:enabled')).toHaveCount(10);
  await page.locator('[data-workshop="vitality"]').click();
  await expect(page.locator('#geomayhem-campaign')).toContainText('70 shards');
  await expect(page.locator('[data-workshop="vitality"]')).toBeDisabled();
  await expect(page.locator('[data-workshop="vitality"]')).toContainText('Clear arena 4');
  await page.locator('#geomayhem-loadout').screenshot({ path: testInfo.outputPath('campaign-workshop.png') });
  await page.locator('[data-difficulty="level_2"]').click();
  await expect(page.locator('#player-health-value')).toHaveText('110 / 110');
  await expect(page.locator('#geomayhem-build')).toHaveText('1/4 weapons');
  await model(page, 'session.game.cleared = 3\nsession.game.kills = 20\nsession.game.stars = 5\nsession.game.alive = False');
  await expect(page.locator('#overlay-copy')).toContainText('+8 shards');
  await page.locator('#overlay-action').click();
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await leaveFullscreen(page);
  await page.locator('[data-game="geomayhem"]').click();
  await expect(page.locator('#geomayhem-campaign')).toContainText('78 shards');
  await expect(page.locator('[data-difficulty="level_2"]')).toContainText('Best: 3/20');
  await expect(page.locator('[data-difficulty="level_3"]')).toBeDisabled();
  await page.locator('[data-difficulty="level_2"]').click();
  expect(await model(page, 'session.game.stars')).toBe(1);
  expect(await model(page, 'session.game.rerolls')).toBe(2);
  await expect(page.locator('#player-health-value')).toHaveText('110 / 110');
  expect((await saved(page)).runs).toBe(2);
});

test('rerolls are limited and relics change the build without occupying weapon slots', async ({ page }) => {
  await page.locator('[data-difficulty="level_1"]').click();
  await model(page, 'session.game.break_left = 100\nsession.game.xp = session.game.xp_needed');
  await expect(page.locator('#geomayhem-upgrade')).toBeVisible();
  const rank = await model(page, 'session.game.rank');
  await page.locator('#geomayhem-reroll').click();
  await page.locator('#geomayhem-reroll').click();
  await expect(page.locator('#geomayhem-reroll')).toBeDisabled();
  expect(await model(page, 'session.game.rank')).toBe(rank);
  await page.locator('[data-upgrade="weapon"]').click();
  await model(page, 'session.game.xp = session.game.xp_needed');
  await page.locator('[data-upgrade^="relic:"]').click();
  expect(await model(page, 'len(session.game.relics)')).toBe(1);
  await expect(page.locator('#geomayhem-run-info')).not.toContainText('Relics: none yet');
  await expect(page.locator('#geomayhem-build')).toHaveText('1/4 weapons');
  await page.locator('#exit').click();
  await page.locator('[data-difficulty="level_1"]').click();
  expect(await model(page, 'len(session.game.relics)')).toBe(0);
  expect(await model(page, 'session.game.rerolls')).toBe(2);
});


test('a completed ten-arena save continues through arena twenty and survives reload', async ({ page }) => {
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ cleared: 10, shards: 420,
    runs: 37, workshop: { power: 3 }, best: { 10: 20 } })), key);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await leaveFullscreen(page);
  await page.locator('[data-game="geomayhem"]').click();
  await expect(page.locator('#geomayhem-campaign')).toContainText('10/20 arenas cleared');
  await expect(page.locator('[data-workshop="power"]')).toContainText('3/3');
  for (let level = 11; level <= 20; level++) {
    await expect(page.locator(`[data-difficulty="level_${level}"]`)).toBeEnabled();
    if (level < 20) await expect(page.locator(`[data-difficulty="level_${level + 1}"]`)).toBeDisabled();
    await page.locator(`[data-difficulty="level_${level}"]`).click();
    await expect(page.locator('#geomayhem-wave')).toHaveText(`LEVEL ${level}/20 · WAVE 1/20`);
    await model(page, 'session.game.break_left = 0\nsession.game.wave = 20\nsession.game.cleared = 19\nsession.game.spawned = session.game.quota\nsession.game.enemies.clear()');
    await expect(page.locator('#overlay-copy')).toContainText(level === 20 ? 'All 20 arenas conquered!' : `Arena ${level + 1} unlocked`);
    await page.locator('#overlay-action').click();
  }
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await leaveFullscreen(page);
  await page.locator('[data-game="geomayhem"]').click();
  await expect(page.locator('#geomayhem-campaign')).toContainText('20/20 arenas cleared');
  const progress = await saved(page);
  expect(progress.workshop.power).toBe(3);
  expect(progress.shards).toBe(1420);
  expect(progress.best[20]).toBe(20);
  expect(progress.runs).toBe(47);
});
