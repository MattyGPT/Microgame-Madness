const { leaveFullscreen } = require('./fixtures/game.cjs');
const { test, expect } = require('./fixtures/game.cjs');

test('all Pumpkin King attacks and five candies render without changing combat', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('const pyodide = await loadPyodide(',
      'const pyodide = window.artRuntime = await loadPyodide(') });
  });
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await page.addStyleTag({ content: '#achievement-toast, #achievement-celebrations { visibility: hidden !important; }' });
  await leaveFullscreen(page);
  await page.locator('[data-game="pumpkin"]').click();
  await page.locator('[data-difficulty="baby"]').click();
  await page.evaluate(() => {
    active = false;
    artRuntime.runPython('from bridge import session\nfrom pumpkin_king import Stage, CandyPickup, CANDY_VARIANTS\nimport pickle');
  });
  const poses = [
    ['memory', 'session.game.begin_attack(0)\nsession.game.stage_age = .3'],
    ['bones', 'session.game.begin_attack(1)\nsession.game.update(1.3, set())'],
    ['rings', 'session.game.begin_attack(2)\nsession.game.update(2.6, set())'],
    ['fingers', 'session.game.begin_attack(3)\nsession.game.update(1.4, set())'],
    ['chaos', 'session.game.begin_attack(4)\nsession.game.update(1.5, set())'],
    ['raise', 'session.game.begin_attack(5)\nsession.game.stage_age = .3'],
    ['slam', "session.game.stage = Stage('slam', .15, 'both')\nsession.game.stage_age = .07"],
    ['fire', "session.game.stage = Stage('fire', .65)\nsession.game.stage_age = .22"],
    ['haunted', "session.game.begin_attack(6)\nsession.game.stage = Stage('scares', 5)\nsession.game.stage_age = .14"],
    ['candies', "session.game.stage = Stage('break', 1)\nsession.game.healing_pickups = [CandyPickup((i-2)*60, -90, 9, name) for i, name in enumerate(CANDY_VARIANTS)]"],
  ];
  for (const [name, code] of poses) {
    const unchanged = await page.evaluate(code => {
      artRuntime.runPython('session.game.invulnerable = 1000\n' + code + '\nsession.game.sound_events.clear()\nbefore_art = pickle.dumps(session.game)');
      snapshot = send('tick', { dt: 0, keys: [] });
      render();
      return artRuntime.runPython('before_art == pickle.dumps(session.game)');
    }, code);
    expect(unchanged).toBe(true);
    await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`${name}.png`) });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
