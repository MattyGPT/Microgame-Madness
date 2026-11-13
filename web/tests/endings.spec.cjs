const { leaveFullscreen } = require('./fixtures/game.cjs');
const { test, expect } = require('./fixtures/game.cjs');

test.beforeEach(async ({ page }) => {
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('const pyodide = await loadPyodide(',
      'const pyodide = window.endingRuntime = await loadPyodide(') });
  });
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await page.addStyleTag({ content: '#achievement-toast, #achievement-celebrations { visibility:hidden!important; }' });
  await leaveFullscreen(page);
  await page.locator('#player').fill('GRAVITRON');
  await page.locator('[data-origin-skip]').click();
  await page.evaluate(() => endingRuntime.runPython('from bridge import session'));
});

test('every turtle game explodes into white pixels for 1.6 seconds before its result', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const [mode, difficulty] of [['dodge','easy'], ['boss','mean'], ['pumpkin','baby'],
    ['wrath','royal_slams'], ['singularity','gravitron'], ['core_practice','railgun_array']]) {
    await page.evaluate(([mode,difficulty]) => { selectGame(mode); startGame(difficulty); }, [mode,difficulty]);
    const initial = await page.evaluate(() => {
      endingRuntime.runPython('session.game.alive = False');
      snapshot = send('tick', { dt: 0 });
      render();
      window.deathStarted = performance.now();
      return { dying: snapshot.dying, age: snapshot.death_age, source: sequencePlayer?.kind,
        duration: sequencePlayer?.source?.buffer.duration, white: snapshot.commands.filter(c => c.fill === '#ffffff').length };
    });
    expect(initial).toMatchObject({ dying: true, age: 0, source: 'death', duration: 1.6 });
    expect(initial.white).toBeGreaterThan(15);
    await expect(page.locator('#overlay')).toBeHidden();
    if (mode === 'dodge') {
      await expect.poll(() => page.evaluate(() => snapshot.death_age)).toBeGreaterThan(.35);
      await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath('white-pixel-death.png') });
    }
    await expect(page.locator('#overlay')).toBeVisible();
    expect(await page.evaluate(() => performance.now()-deathStarted)).toBeGreaterThanOrEqual(1500);
    expect(await page.evaluate(() => snapshot.death_age)).toBeCloseTo(1.6, 6);
    expect(await page.evaluate(() => sequencePlayer.source)).toBeNull();
    expect(await page.evaluate(() => snapshot.won)).toBe(false);
    await page.locator('#overlay-action').click();
  }
  expect(errors).toEqual([]);
});

test('Core finale keeps its beam, whitens, sucks stars inward and shatters before revealing the score', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.locator('[data-difficulty="gravitron"]').click();
  const audio = await page.evaluate(() => {
    endingRuntime.runPython("session.game.stage = 'exposed'\nsession.game.attacks_completed = 15\nsession.game.attack_index = 14");
    snapshot = send('laser');
    render();
    active = false;
    return { kind: sequencePlayer.kind, duration: sequencePlayer.source.buffer.duration };
  });
  expect(audio.kind).toBe('finale');
  expect(audio.duration).toBeCloseTo(5.4, 6);
  let previous = 0;
  for (const [age, phase] of [[.35,'beam'], [1.6,'whitening'], [3.15,'implosion'],
    [3.68,'implosion'], [3.76,'shatter'], [4.3,'shatter']]) {
    const state = await page.evaluate(delta => {
      endingRuntime.runPython(`session.game.update(${delta}, set())`);
      snapshot = send('tick', { dt: 0 });
      render();
      return { phase: snapshot.cinematic_phase, won: snapshot.won, saved: roundSaved,
        shattered: snapshot.arena_shattered, commands: snapshot.commands.length };
    }, age-previous);
    previous = age;
    expect(state.phase).toBe(phase);
    expect(state.won).toBe(false);
    expect(state.saved).toBe(false);
    expect(state.shattered).toBe(phase === 'shatter');
    await expect(page.locator('#overlay')).toBeHidden();
    await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`core-${age}-${phase}.png`) });
  }
  await page.evaluate(() => { active = true; lastFrame = performance.now(); });
  await expect(page.locator('#overlay-title')).toHaveText('Singularity erased.');
  await expect(page.locator('#overlay-copy')).toContainText('Score:');
  expect(await page.evaluate(() => roundSaved)).toBe(true);
  expect(await page.evaluate(() => sequencePlayer.source)).toBeNull();
  expect(errors).toEqual([]);
});
