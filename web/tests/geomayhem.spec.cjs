const { test, expect, openGame } = require('./fixtures/game.cjs');
test.use({ deterministicMusic: true });

test.beforeEach(async ({ page }) => {
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'handle = pyodide.globals.get("handle");',
      'window.geomayhemRuntime = pyodide; handle = pyodide.globals.get("handle");') });
  });
  await openGame(page);
  await page.locator('[data-game="geomayhem"]').click();
});

async function model(page, code) {
  return page.evaluate(code => window.geomayhemRuntime.runPython(code), `from bridge import session\n${code}`);
}

test('WASD and arrows move together, R pauses, and other games retain D pause', async ({ page }) => {
  await page.locator('[data-difficulty="level_1"]').click();
  await model(page, 'session.game.break_left = 100');
  await expect(page.locator('#pause')).toHaveText('Pause · R');
  await expect(page.locator('#game-canvas')).toHaveAttribute('aria-label', /WASD.*R pauses/);
  for (const [key, axis, direction] of [['w', 'y', 1], ['a', 'x', -1], ['s', 'y', -1], ['d', 'x', 1], ['W', 'y', 1]]) {
    await model(page, 'session.game.x = session.game.y = 0');
    await page.keyboard.down(key);
    await expect.poll(() => model(page, `session.game.${axis} * ${direction}`)).toBeGreaterThan(12);
    await page.keyboard.up(key);
    expect(await model(page, 'session.paused')).toBe(false);
  }
  await model(page, 'session.game.y = 0');
  await page.keyboard.down('w');
  await page.keyboard.down('ArrowUp');
  await expect.poll(() => model(page, 'session.game.y')).toBeGreaterThan(12);
  await page.keyboard.up('w');
  const afterW = await model(page, 'session.game.y');
  await expect.poll(() => model(page, 'session.game.y')).toBeGreaterThan(afterW + 12);
  await page.keyboard.up('ArrowUp');
  const stopped = await model(page, 'session.game.y');
  const elapsed = await model(page, 'session.game.elapsed');
  await expect.poll(() => model(page, 'session.game.elapsed')).toBeGreaterThan(elapsed + .15);
  expect(await model(page, 'session.game.y')).toBe(stopped);
  await page.keyboard.down('r');
  await expect(page.locator('#pause')).toHaveText('Resume · R');
  const pausedAt = await model(page, 'session.game.elapsed');
  await page.keyboard.down('r'); // A repeated keydown must not toggle again.
  await page.keyboard.up('r');
  await page.keyboard.press('d');
  expect(await model(page, 'session.paused')).toBe(true);
  expect(await model(page, 'session.game.elapsed')).toBe(pausedAt);
  await page.keyboard.press('r');
  await expect(page.locator('#overlay')).toBeHidden();
  await expect(page.locator('#pause')).toHaveText('Pause · R');
  await expect.poll(() => model(page, 'session.game.elapsed')).toBeGreaterThan(pausedAt);
  await page.locator('[data-game="dodge"]').click();
  await page.locator('[data-difficulty="easy"]').click();
  await page.keyboard.press('r');
  await expect(page.locator('#overlay')).toBeHidden();
  await page.keyboard.press('d');
  await expect(page.locator('#pause')).toHaveText('Resume · D');
});

test('Geomayhem armory, Cubie movement, manual mouse/touch fire and pause', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await expect(page.locator('#difficulty-choices button')).toHaveCount(10);
  await expect(page.locator('#geomayhem-weapon option')).toHaveCount(34);
  await page.locator('#geomayhem-weapon').selectOption('comet');
  await expect(page.locator('#geomayhem-evolution-three')).toContainText('Comet Flare');
  await expect(page.locator('#geomayhem-evolution-five')).toContainText('Comet Apocalypse');
  await page.screenshot({ path: testInfo.outputPath('geomayhem-armory.png'), fullPage: true });
  await page.locator('[data-difficulty="level_1"]').click();
  await expect(page.locator('#geomayhem-wave')).toHaveText('LEVEL 1/10 · WAVE 1/20');
  await model(page, 'session.game.break_left = 100');
  await page.keyboard.down('ArrowLeft');
  await expect.poll(() => model(page, 'session.game.x')).toBeLessThan(-20);
  await page.keyboard.up('ArrowLeft');
  expect(await model(page, 'session.game.face == (-1, 0)')).toBe(true);
  expect(await model(page, 'session.game.shots_fired')).toBe(0);
  const canvas = page.locator('#game-canvas');
  if (testInfo.project.name === 'mobile') {
    await expect(page.locator('#touch-fire')).toBeVisible();
    await page.locator('#touch-fire').dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch' });
    await expect.poll(() => model(page, 'session.game.shots_fired')).toBeGreaterThan(0);
    await page.locator('#touch-fire').dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch' });
  } else {
    await canvas.click({ button: 'right' });
    expect(await model(page, 'session.game.shots_fired')).toBe(0);
    await canvas.click({ position: { x: 430, y: 180 } });
    await expect.poll(() => model(page, 'session.game.shots_fired')).toBe(1);
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * .8, box.y + box.height * .4);
    await page.mouse.down();
    await expect.poll(() => model(page, 'session.game.shots_fired')).toBeGreaterThan(1);
    await page.mouse.up();
  }
  expect(await model(page, 'session.game.face == (-1, 0)')).toBe(true);
  await page.locator('#pause').click();
  const before = await model(page, 'session.game.elapsed');
  await expect(page.locator('#overlay-title')).toHaveText('Take a breather.');
  await page.keyboard.press('ArrowRight');
  expect(await model(page, 'session.game.elapsed')).toBe(before);
  await page.locator('#overlay-action').click();
  await model(page, 'session.game.break_left = 0\nfor _ in range(12): session.game._spawn()');
  await expect.poll(() => model(page, 'len(session.game.enemies)')).toBeGreaterThan(5);
  await page.screenshot({ path: testInfo.outputPath('geomayhem-playing.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('XP choices freeze combat and evolve weapon art and gimmicks at three and five stars', async ({ page }, testInfo) => {
  await page.locator('[data-difficulty="level_1"]').click();
  await model(page, 'session.game.break_left = 100');
  for (let stars = 2; stars <= 5; stars++) {
    await model(page, 'session.game.xp = session.game.xp_needed');
    await expect(page.locator('#geomayhem-upgrade')).toBeVisible();
    const before = await model(page, 'session.game.elapsed');
    await page.keyboard.press('ArrowRight');
    expect(await model(page, 'session.game.elapsed')).toBe(before);
    await page.screenshot({ path: testInfo.outputPath(`geomayhem-upgrade-${stars}.png`) });
    await page.locator('[data-upgrade="weapon"]').click();
    await expect(page.locator('#geomayhem-upgrade')).toBeHidden();
    expect(await model(page, 'session.game.stars')).toBe(stars);
    if (stars === 3) await expect(page.locator('[data-weapon="needle"]')).toContainText('Prism Fork');
    if (stars === 5) await expect(page.locator('[data-weapon="needle"]')).toContainText('Prism Constellation');
  }
  await model(page, 'session.game.xp = session.game.xp_needed');
  await expect(page.locator('#geomayhem-upgrade')).toBeVisible();
  await expect(page.locator('[data-upgrade="weapon"]')).toHaveCount(0);
  await page.locator('#exit').click();
  await expect(page.locator('#geomayhem-upgrade')).toBeHidden();
  await page.locator('[data-difficulty="level_1"]').click();
  expect(await model(page, 'session.game.stars')).toBe(1);
});

test('level ten ends at wave twenty and a defeated Cubie can restart', async ({ page }) => {
  await page.locator('[data-difficulty="level_10"]').click();
  await model(page, 'session.game.wave = 20\nsession.game.cleared = 19\nsession.game.spawned = session.game.quota\nsession.game.enemies.clear()');
  await expect(page.locator('#overlay-title')).toHaveText('Mayhem mastered!');
  await expect(page.locator('#overlay-copy')).toContainText('All 20 waves');
  await page.locator('#overlay-action').click();
  await page.locator('[data-difficulty="level_1"]').click();
  await model(page, 'session.game._damage(100)');
  await expect(page.locator('#overlay-title')).toHaveText('Cubie will be back.');
  await page.locator('#overlay-action').click();
  await page.locator('[data-difficulty="level_1"]').click();
  await expect(page.locator('#player-health-value')).toHaveText('100 / 100');
  await expect(page.locator('#geomayhem-wave')).toHaveText('LEVEL 1/10 · WAVE 1/20');
});

test('wave clears collect remaining XP, and the enlarged arena keeps mouse aim aligned', async ({ page }) => {
  await page.locator('[data-difficulty="level_1"]').click();
  await model(page, 'session.game.gems = [[200, 150, session.game.xp_needed]]\nsession.game.spawned = session.game.quota\nsession.game.enemies.clear()');
  await expect(page.locator('#geomayhem-wave')).toContainText('WAVE 2/20');
  expect(await model(page, 'session.game.rank')).toBe(2);
  expect(await model(page, 'len(session.game.gems)')).toBe(0);
  await model(page, 'session.game.break_left = 100');
  await expect(page.locator('#geomayhem-upgrade')).toBeVisible();
  await page.locator('[data-upgrade="weapon"]').click();
  await model(page, 'session.game.x = session.game.y = 0');
  const box = await page.locator('#game-canvas').boundingBox();
  await page.mouse.move(box.x + (340 + 400 * 2 / 3) * box.width / 680,
    box.y + (280 - 300 * 2 / 3) * box.height / 560);
  await page.mouse.down();
  await expect.poll(() => model(page, 'session.game.shots_fired')).toBeGreaterThan(0);
  expect(await model(page, 'abs(session.game.aim[0] - 400) < 3 and abs(session.game.aim[1] - 300) < 3')).toBe(true);
  await page.mouse.up();
  expect(await model(page, 'session.game.right - session.game.left')).toBe(930);
});

test('combat drops equip A and B drones by walking over them', async ({ page }, testInfo) => {
  await page.locator('[data-difficulty="level_1"]').click();
  await model(page, 'session.game.break_left = 100');
  for (const [kills, id] of [[7, 'drone_a'], [15, 'drone_b']]) {
    await model(page, `from geomayhem import Enemy\nsession.game.x, session.game.y = 200, 200\nsession.game.kills = ${kills}\nsession.game.enemies = [Enemy(500, 250, 200, 0, 0, 12, "chaser", 1)]`);
    await expect.poll(() => model(page, 'len(session.game.weapon_pickups)')).toBe(1);
    await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`weapon-pickup-${id}.png`) });
    await page.keyboard.down('d');
    await expect(page.locator(`#geomayhem-inventory [data-weapon="${id}"]`)).toBeVisible();
    await page.keyboard.up('d');
    await expect(page.locator('#geomayhem-upgrade')).toBeHidden();
  }
  await expect(page.locator('#geomayhem-build')).toHaveText('3/3 weapons');
});

test('level-ups equip three weapons including autonomous A and B drones with independent evolutions', async ({ page }, testInfo) => {
  await page.locator('[data-difficulty="level_1"]').click();
  await model(page, 'session.game.break_left = 100');
  for (const id of ['drone_a', 'drone_b']) {
    await model(page, 'session.game.xp = session.game.xp_needed');
    await expect(page.locator('#geomayhem-upgrade')).toBeVisible();
    await page.locator(`[data-upgrade="acquire:${id}"]`).click();
    await expect(page.locator(`#geomayhem-inventory [data-weapon="${id}"]`)).toBeVisible();
  }
  await expect(page.locator('#geomayhem-build')).toHaveText('3/3 weapons');
  expect(await model(page, 'session.game.stars')).toBe(1);
  await model(page, 'from geomayhem import Enemy\nsession.game.enemies = [Enemy(500, 150, 0, 100000, 0, 12, "chaser", 100000)]');
  await expect.poll(() => model(page, 'session.game.shots_fired')).toBeGreaterThan(0);
  expect(await model(page, 'all(shot.weapon != "needle" for shot in session.game.shots)')).toBe(true);
  await model(page, 'session.game.xp = session.game.xp_needed');
  await expect(page.locator('#geomayhem-upgrade')).toBeVisible();
  await expect(page.locator('[data-upgrade^="acquire:"]')).toHaveCount(0);
  await page.locator('#geomayhem-upgrade-choices button').last().click();
  await model(page, 'session.game.loadout = {key: (1 if key == "drone_a" else 5) for key in session.game.loadout}');
  for (let star = 2; star <= 5; star++) {
    await model(page, 'session.game.xp = session.game.xp_needed');
    await page.locator('[data-upgrade="upgrade:drone_a"]').click();
    expect(await model(page, 'session.game.loadout["drone_a"]')).toBe(star);
    expect(await model(page, 'session.game.loadout["drone_b"]')).toBe(5);
    if (star === 3) await expect(page.locator('[data-weapon="drone_a"]')).toContainText('A Drone Swarm');
  }
  await expect(page.locator('[data-weapon="drone_a"]')).toContainText('A Drone Starfleet');
  await expect(page.locator('#geomayhem-build')).toHaveText('3/3 weapons');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#arena').screenshot({ path: testInfo.outputPath('three-weapon-drone-build.png') });
  await page.locator('#exit').click();
  await page.locator('[data-difficulty="level_1"]').click();
  await expect(page.locator('#geomayhem-build')).toHaveText('1/3 weapons');
});
