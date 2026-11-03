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
  // Expose the existing runtime only in this test response, without production hooks.
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('const pyodide = await loadPyodide(',
      'const pyodide = window.testRuntime = await loadPyodide(');
    await route.fulfill({ response, body });
  });
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await page.evaluate(() => testRuntime.runPython('from bridge import session'));
  await page.evaluate(() => {
    document.querySelector('#achievement-celebrations').style.display = 'none';
    document.querySelector('#achievement-toast').hidden = true;
  });
});

async function unlock(page) {
  await page.locator('#player').fill('GRAVITRON');
  await expect(page.locator('#game-title')).toHaveText('Singularity Core');
  await page.locator('[data-difficulty="gravitron"]').click();
}

test('GRAVITRON unlock persists and keyboard and touch teleport immediately', async ({ page }, testInfo) => {
  const card = page.locator('[data-game="singularity"]');
  await expect(card).toBeHidden();
  await expect(page.locator('[data-game]:visible')).toHaveCount(6);
  await unlock(page);
  await expect(page.locator('#player-health-value')).toHaveText('10 / 10');
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('singularity');
  const position = () => page.evaluate(() => testRuntime.runPython('(session.game.x, session.game.y)').toJs());
  await page.keyboard.down('ArrowLeft');
  await expect.poll(position).toEqual([-126, -70]);
  await page.keyboard.down('ArrowUp');
  await expect.poll(position).toEqual([-126, 56]);
  await page.keyboard.up('ArrowLeft');
  await expect.poll(position).toEqual([0, 56]);
  await page.keyboard.up('ArrowUp');
  await expect.poll(position).toEqual([0, -70]);
  await page.keyboard.down('f');
  expect(await page.evaluate(() => snapshot.shielded)).toBe(true);
  expect(await page.evaluate(() => snapshot.hp)).toBe(1);
  await page.keyboard.up('f');
  if (testInfo.project.name === 'mobile') {
    await expect(page.locator('#touch-fire')).toBeDisabled();
    await expect(page.locator('#touch-counter')).toBeHidden();
    const button = await page.locator('[data-key="Right"]').boundingBox();
    await page.mouse.move(button.x + button.width / 2, button.y + button.height / 2);
    await page.mouse.down();
    await expect.poll(position).toEqual([126, -70]);
    await page.mouse.up();
    await expect.poll(position).toEqual([0, -70]);
  }
  await page.locator('#pause').click();
  await expect(page.locator('#overlay-title')).toHaveText('Take a breather.');
  expect(await page.evaluate(() => snapshot.paused)).toBe(true);
  await page.locator('#overlay-action').click();
  await page.locator('#exit').click();
  await page.locator('#player').fill('Core Tester');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(card).toBeVisible();
  await expect(page.locator('[data-game]:visible')).toHaveCount(7);
  await card.click();
  await page.locator('#welcome').screenshot({ path: testInfo.outputPath('core-unlocked.png') });
});

test('Railgun Array gives 0.72 seconds of warning and the cinematic theme stays resumable', async ({ page }, testInfo) => {
  await unlock(page);
  const warning = await page.evaluate(() => {
    const track = musicPlayer.track, duration = musicPlayer.current.source.buffer.duration;
    active = false;
    testRuntime.runPython("session.game.begin_attack(0)\nsession.game.update(.719, {'Left'})");
    snapshot = send('tick', { dt: 0, keys: [] });
    render();
    return { lives: snapshot.lives, track, duration };
  });
  expect(warning.lives).toBe(10);
  expect(warning.track).toBe('singularity');
  expect(warning.duration).toBeGreaterThan(45);
  await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath('railgun-extended-warning.png') });
  await page.evaluate(() => {
    testRuntime.runPython("session.game.update(.002, {'Left'})");
    snapshot = send('tick', { dt: 0, keys: [] });
    render();
  });
  await expect(page.locator('#player-health-value')).toHaveText('9 / 10');
  await page.evaluate(() => { active = true; lastFrame = performance.now(); syncMusic(); });
  await page.locator('#pause').click();
  await expect.poll(() => page.evaluate(() => musicPlayer.current)).toBe(null);
  const position = await page.evaluate(() => musicPlayer.offset);
  await page.locator('#overlay-action').click();
  expect(await page.evaluate(() => musicPlayer.current.offset)).toBe(position);
});

test('galactic Core packs spawn after three attacks, heal on teleport, and preserve damage history', async ({ page }, testInfo) => {
  await unlock(page);
  const spawn = await page.evaluate(() => {
    active = false;
    testRuntime.runPython("session.game.begin_attack(2)\nsession.game.attacks_completed = 2\nsession.game.hurt()\nsession.game.invulnerable = 1000\nsession.game.update(7, set())");
    resetDamageFeedback();
    snapshot = send('tick', { dt: 0 });
    render();
    return { lives: snapshot.lives, completed: snapshot.attacks_completed,
      packs: testRuntime.runPython('len(session.game.healing_pickups)') };
  });
  expect(spawn).toEqual({ lives: 9, completed: 3, packs: 1 });
  await expect(page.locator('#player-health-value')).toHaveText('9 / 10');
  await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath('galactic-healing-pack.png') });
  const healed = await page.evaluate(() => {
    const target = testRuntime.runPython('(session.game.healing_pickups[0].x, session.game.healing_pickups[0].y)').toJs();
    const held = [];
    if (target[0]) held.push(target[0] < 0 ? 'Left' : 'Right');
    if (target[1] !== -70) held.push(target[1] < -70 ? 'Down' : 'Up');
    snapshot = send('tick', { dt: .01, keys: held });
    render();
    return { lives: snapshot.lives, healing: snapshot.healing_collected, damage: snapshot.damage_taken };
  });
  expect(healed).toEqual({ lives: 10, healing: 1, damage: 1 });
  await expect(page.locator('#player-health-value')).toHaveText('10 / 10');
  await page.evaluate(() => { healingFlashAnimation.pause(); healingFlashAnimation.currentTime = 0; });
  await expect(page.locator('#healing-flash')).toHaveCSS('opacity', '1');
  await page.evaluate(() => {
    healingFlashAnimation.finish();
    testRuntime.runPython("session.game.attacks_completed = 15\nsession.game.stage = 'exposed'");
    snapshot = send('tick', { dt: 0 });
    render();
    active = true;
    lastFrame = performance.now();
  });
  if (testInfo.project.name === 'mobile') await page.locator('#touch-fire').tap();
  else await page.keyboard.press('f');
  await expect(page.locator('#overlay-title')).toHaveText('Singularity erased.');
  expect(await page.evaluate(() => saved.achievements.unlocked.core_win)).toBeTruthy();
  expect(await page.evaluate(() => saved.achievements.unlocked.core_flawless)).toBeUndefined();
});

test('all 15 Core attacks render and only the final laser wins', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await unlock(page);
  await page.evaluate(() => { active = false; });
  for (let index = 0; index < 15; index++) {
    const state = await page.evaluate(index => {
      testRuntime.runPython(`session.game.begin_attack(${index})\nsession.game.invulnerable = 1000\nsession.game.update(.8, set())`);
      snapshot = send('tick', { dt: .001, keys: [] });
      render();
      return { label: snapshot.label, shielded: snapshot.shielded, hp: snapshot.hp,
        commands: snapshot.commands.length };
    }, index);
    expect(state.label).toContain(`${String(index + 1).padStart(2, '0')} / 15`);
    expect(state.shielded).toBe(true);
    expect(state.hp).toBe(1);
    expect(state.commands).toBeGreaterThan(0);
    if ([1, 4, 14].includes(index))
      await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`core-protocol-${index + 1}.png`) });
  }
  // Run the entire real sequence. Immunity keeps this lifecycle test independent of a human's skill.
  await page.evaluate(() => {
    snapshot = send('start', { mode: 'singularity', difficulty: 'gravitron' });
    testRuntime.runPython('session.game.invulnerable = 1000');
    for (let frame = 0; frame < 3000 && !snapshot.laser_ready; frame++)
      snapshot = send('tick', { dt: .05, keys: ['f'] });
    render();
  });
  expect(await page.evaluate(() => ({ completed: snapshot.attacks_completed, ready: snapshot.laser_ready,
    hp: snapshot.hp, won: snapshot.won, healing: snapshot.healing_collected })))
    .toEqual({ completed: 15, ready: true, hp: 1, won: false, healing: 0 });
  await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath('core-laser-ready.png') });
  await page.evaluate(() => { active = true; lastFrame = performance.now(); });
  if (testInfo.project.name === 'mobile') await page.locator('#touch-fire').tap();
  else await page.keyboard.press('f');
  await expect.poll(() => page.evaluate(() => snapshot.laser_firing)).toBe(true);
  await page.evaluate(() => {
    active = false;
    testRuntime.runPython('session.game.stage_age = .45');
    snapshot = send('tick', { dt: .001 });
    render();
  });
  await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath('core-annihilation-laser.png') });
  await page.evaluate(() => { active = true; lastFrame = performance.now(); });
  await expect(page.locator('#overlay-title')).toHaveText('Singularity erased.');
  expect(await page.evaluate(() => saved.scores['singularity:gravitron'][0].score)).toBeGreaterThan(15000);
  const earned = await page.evaluate(() => ({ wins: saved.achievements.stats.coreWins,
    victory: saved.achievements.unlocked.core_win, flawless: saved.achievements.unlocked.core_flawless,
    protocols: saved.achievements.stats.coreProtocolsBest,
    tier: Achievements.catalog.find(item => item.id === 'core_win').tier }));
  expect(earned).toMatchObject({ wins: 1, protocols: 15, tier: 'rainbow' });
  expect(earned.victory).toBeTruthy();
  expect(earned.flawless).toBeTruthy();
  expect(await page.evaluate(() => saved.achievements.stats.pumpkinWins)).toBe(0);
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  expect(await page.evaluate(() => saved.achievements.unlocked.core_win)).toBe(earned.victory);
  expect(await page.evaluate(() => saved.achievements.unlocked.core_flawless)).toBe(earned.flawless);
});
