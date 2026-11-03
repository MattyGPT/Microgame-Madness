const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test('spectral Pumpkin King and rounded Boss Crush faces animate without changing combat', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://cdn.jsdelivr.net/pyodide/v0.29.3/full/**', route => {
    const file = path.basename(new URL(route.request().url()).pathname);
    const local = path.resolve('node_modules/pyodide', file);
    if (!fs.existsSync(local)) return route.abort();
    return route.fulfill({ path: local,
      contentType: file.endsWith('.wasm') ? 'application/wasm' : file.endsWith('.js') ? 'application/javascript' : 'application/octet-stream',
      headers: { 'access-control-allow-origin': '*' } });
  });
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('const pyodide = await loadPyodide(',
      'const pyodide = window.artRuntime = await loadPyodide(') });
  });
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await page.addStyleTag({ content: '#achievement-toast, #achievement-celebrations { visibility: hidden !important; }' });
  await page.locator('[data-game="pumpkin"]').click();
  await page.locator('[data-difficulty="baby"]').click();
  await page.evaluate(() => {
    active = false;
    artRuntime.runPython('from bridge import session\nfrom pumpkin_king import Stage\nsession.game.begin_attack(5)');
  });
  const pose = async (code) => page.evaluate(code => {
    artRuntime.runPython(code);
    const before = artRuntime.runPython('repr((session.game.hp, session.game.lives, session.game.elapsed, list(session.game.contact_rectangles())))');
    snapshot = send('tick', { dt: 0, keys: [] });
    render();
    const after = artRuntime.runPython('repr((session.game.hp, session.game.lives, session.game.elapsed, list(session.game.contact_rectangles())))');
    return { commands: snapshot.commands, unchanged: before === after };
  }, code);
  const idle = await pose("session.game.stage = Stage('break', 1)\nsession.game.elapsed = 1.2");
  expect(idle.unchanged).toBe(true);
  expect(idle.commands.every(c => c.coords.every(Number.isFinite))).toBe(true);
  await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath('spectral-king.png') });
  const animated = await pose('session.game.elapsed = 1.6');
  expect(animated.unchanged).toBe(true);
  expect(animated.commands).not.toEqual(idle.commands);
  for (const [stage, side] of [['raise', 'both'], ['slam', 'both'], ['slam', 'left'], ['slam', 'right'], ['roar', ''], ['fire', ''], ['laugh', '']]) {
    const state = await pose(`session.game.stage = Stage('${stage}', 1, '${side}')\nsession.game.stage_age = .3`);
    expect(state.unchanged).toBe(true);
    expect(state.commands.every(c => c.coords.every(Number.isFinite))).toBe(true);
    await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`spectral-king-${stage}-${side}.png`) });
  }
  const reactions = await page.evaluate(() => {
    const expressions = [];
    for (const code of ["session.game.stage = Stage('break', 1)", 'session.game.hit_flash = .12',
      "session.game.hit_flash = 0\nsession.game.stage = Stage('roar', 1)"]) {
      artRuntime.runPython(code);
      snapshot = send('tick', { dt: 0, keys: [] });
      // Restrict the comparison to the head, excluding animated arm decorations.
      expressions.push(snapshot.commands.filter(c => c.coords.every((v, i) => i % 2 || Math.abs(v) < 58)));
    }
    return expressions;
  });
  expect(reactions[1]).not.toEqual(reactions[0]);
  expect(reactions[2]).not.toEqual(reactions[0]);
  await page.locator('#exit').click();
  for (const difficulty of ['mean', 'cruel', 'nightmare', 'impossible']) {
    await page.locator('[data-game="boss"]').click();
    await page.locator(`[data-difficulty="${difficulty}"]`).click();
    await page.evaluate(() => { active = false; });
    const before = await page.evaluate(() => {
      artRuntime.runPython('session.game.elapsed = 1.2\nsession.game.move_boss(0)');
      snapshot = send('tick', { dt: 0, keys: [] });
      render();
      window.bossFace = () => {
        const colors = new Set(['#261b32', '#342039', '#000000', '#fff351']);
        const x = artRuntime.runPython('session.game.boss_x');
        const y = artRuntime.runPython('session.game.boss_y');
        return snapshot.commands.filter(c => colors.has(c.fill)).map(c => ({ kind: c.kind, fill: c.fill,
          coords: c.coords.map((v, i) => Math.round((v + (i % 2 ? y : -x)) * 1e6) / 1e6) }));
      };
      return bossFace();
    });
    await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`rounded-boss-${difficulty}.png`) });
    const struck = await page.evaluate(() => {
      artRuntime.runPython('from boss_crush import Projectile\nsession.game.shots = [Projectile(session.game.boss_x, session.game.boss_y, 0, 520)]');
      const hp = snapshot.hp;
      snapshot = send('tick', { dt: .001, keys: [] });
      render();
      return { face: bossFace(), damage: hp - snapshot.hp };
    });
    expect(struck.damage).toBe(5);
    expect(struck.face).not.toEqual(before);
    await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`rounded-boss-${difficulty}-hit.png`) });
    if (difficulty === 'impossible') {
      await page.evaluate(() => {
        artRuntime.runPython("session.game.hit_flash = 0\nsession.game.start_lunge_warning()");
        snapshot = send('tick', { dt: 0, keys: [] });
        render();
      });
      await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath('rounded-boss-lunge.png') });
    }
    await page.locator('#exit').click();
  }
  expect(errors).toEqual([]);
});
