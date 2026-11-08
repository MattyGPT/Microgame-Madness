const { test, expect } = require('./fixtures/game.cjs');

test.use({ deterministicMusic: true });

test.beforeEach(async ({ page }) => {

  // Expose the existing runtime only in this test response, without production hooks.
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('const pyodide = await loadPyodide(',
      'const pyodide = window.testRuntime = await loadPyodide(');
    await route.fulfill({ response, body });
  });
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await page.evaluate(() => testRuntime.runPython('from bridge import session'));
  await page.evaluate(() => {
    document.querySelector('#achievement-celebrations').style.display = 'none';
    document.querySelector('#achievement-toast').style.display = 'none';
  });
});

async function unlock(page) {
  await page.locator('#player').fill('GRAVITRON');
  await page.locator('[data-origin-skip]').click();
  await expect(page.locator('#game-title')).toHaveText('Singularity Core');
  await page.locator('[data-difficulty="gravitron"]').click();
}

async function choosePractice(page) {
  await page.locator('#player').fill('GRAVITRON');
  await page.locator('[data-origin-skip]').click();
  await expect(page.locator('[data-difficulty="practice"]')).toHaveCount(0);
  await expect(page.locator('[data-difficulty="gravitron"]')).toBeVisible();
  // Practice remains an internal test harness; it has no player-facing tab.
  await page.evaluate(() => { selectGame('core_practice'); showGameArea(); });
  await expect(page.locator('#game-title')).toHaveText('Singularity Core Practice');
  await expect(page.locator('[data-difficulty]')).toHaveCount(16);
}

test('practice final cutscene plays, pauses, and replays without rewards', async ({ page }) => {
  await choosePractice(page);
  const profileBefore = await page.evaluate(() => JSON.stringify([saved.achievements, saved.scores], (key, value) => key === "websiteSeconds" ? undefined : value));
  await page.locator('[data-difficulty="final_cutscene"]').click();
  expect(await page.evaluate(() => snapshot.laser_firing)).toBe(true);
  await page.locator('#pause').click();
  const age = await page.evaluate(() => testRuntime.runPython('session.game.stage_age'));
  await page.evaluate(() => send('tick', { dt: .05 }));
  expect(await page.evaluate(() => testRuntime.runPython('session.game.stage_age'))).toBe(age);
  await page.locator('#overlay-action').click();
  await expect(page.locator('#overlay')).toBeVisible();
  await expect(page.locator('#overlay')).toContainText('Cutscene complete');
  expect(await page.evaluate(() => JSON.stringify([saved.achievements, saved.scores], (key, value) => key === "websiteSeconds" ? undefined : value))).toBe(profileBefore);
  await page.locator('#overlay-action').click();
  await page.locator('[data-difficulty="final_cutscene"]').click();
  expect(await page.evaluate(() => snapshot.laser_firing)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-difficulty]')).toHaveCount(16);
});

test('temporary Core picker records attack survivals without saving scores or full-fight awards', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await choosePractice(page);
  await page.screenshot({ path: testInfo.outputPath('core-practice-picker.png'), fullPage: true });
  const profileBefore = await page.evaluate(() => JSON.stringify([saved.achievements.unlocked, saved.scores]));
  const options = await page.evaluate(() => send('core_practice_options').attacks);
  for (const attack of options) {
    const choice = page.locator(`[data-difficulty="${attack.id}"]`);
    await expect(choice).toContainText(attack.name);
    await choice.click();
    await page.evaluate(() => { active = false; });
    await expect(page.locator('#player-health-value')).toHaveText('10 / 10');
    await expect(page.locator('#game-instruction')).toContainText('GET READY — 3');
    if (attack.number === 3)
      await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath('core-practice-countdown.png') });
    const repeated = await page.evaluate(() => {
      testRuntime.runPython('session.game.invulnerable = 1000\nsession.game.update(session.game.ready_time - session.game.stage_age, set())\nsession.game.update(2.5, set())');
      snapshot = send('tick', { dt: 0 });
      render();
      return { index: testRuntime.runPython('session.game.attack_index'),
        stage: testRuntime.runPython('session.game.stage'), shielded: snapshot.shielded,
        laser: snapshot.laser_ready, mode: snapshot.mode, commands: snapshot.commands.length };
    });
    expect(repeated).toMatchObject({ index: attack.number - 1, stage: 'attack', shielded: true,
      laser: false, mode: 'core_practice' });
    expect(repeated.commands).toBeGreaterThan(0);
    if ([3, 6, 12, 13].includes(attack.number))
      await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`core-practice-${attack.number}.png`) });
    const end = await page.evaluate(() => {
      testRuntime.runPython('from singularity_core import ATTACKS\nsession.game.update(ATTACKS[session.game.attack_index].duration - session.game.stage_age, set())');
      snapshot = send('tick', { dt: 0 });
      render();
      return { completed: snapshot.attacks_completed, index: testRuntime.runPython('session.game.attack_index'), label: snapshot.label };
    });
    expect(end.completed).toBe(1);
    expect(end.index).toBe(attack.number - 1);
    expect(end.label).toContain('GET READY — 3');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-difficulty]')).toHaveCount(16);
  }
  await page.locator('[data-difficulty="railgun_array"]').click();
  await page.evaluate(() => {
    active = false;
    testRuntime.runPython('session.game.lives = 0\nsession.game.alive = False');
    snapshot = send('tick', { dt: 0 });
    for (let frame = 0; frame < 32; frame++) snapshot = send('tick', { dt: .05 });
    render();
  });
  await expect(page.locator('#overlay')).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify([saved.achievements.unlocked, saved.scores]))).toBe(profileBefore);
  expect(await page.evaluate(() => Achievements.attackRewards.filter(r => r.family === 'core')
    .map(r => saved.achievements.stats[r.id]))).toEqual(Array(15).fill(1));
  await expect(page.locator('#scores-list')).toContainText('records are not saved');
  await page.locator('#overlay-action').click();
  await expect(page.locator('[data-difficulty]')).toHaveCount(16);
  await page.locator('[data-game="singularity"]').click();
  await page.locator('[data-difficulty="gravitron"]').click();
  expect(await page.evaluate(() => snapshot.mode)).toBe('singularity');
  expect(await page.evaluate(() => testRuntime.runPython('session.game.stage'))).toBe('intro');
  await expect(page.locator('[data-game]:visible')).toHaveCount(12);
  expect(errors).toEqual([]);
});

test('temporary Core practice pauses the countdown and supports keyboard and touch teleport', async ({ page }, testInfo) => {
  await choosePractice(page);
  await page.locator('[data-difficulty="collapsing_horizons"]').click();
  await page.locator('#pause').click();
  const age = await page.evaluate(() => testRuntime.runPython('session.game.stage_age'));
  await page.evaluate(() => { snapshot = send('tick', { dt: .05, keys: ['Left'] }); render(); });
  expect(await page.evaluate(() => testRuntime.runPython('session.game.stage_age'))).toBe(age);
  await page.locator('#overlay-action').click();
  await page.evaluate(() => {
    testRuntime.runPython('session.game.invulnerable = 1000\nsession.game.update(session.game.ready_time - session.game.stage_age, set())');
  });
  const position = () => page.evaluate(() => testRuntime.runPython('(session.game.x, session.game.y)').toJs());
  await page.keyboard.down('ArrowLeft');
  await expect.poll(position).toEqual([-126, -70]);
  await page.keyboard.up('ArrowLeft');
  await expect.poll(position).toEqual([0, -70]);
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('singularity');
  await expect(page.locator('#touch-fire')).toBeHidden();
  await expect(page.locator('#touch-counter')).toBeHidden();
  if (testInfo.project.name === 'mobile') {
    const stick = await page.locator('#touch-joystick').boundingBox();
    await page.mouse.move(stick.x + stick.width - 10, stick.y + stick.height / 2);
    await page.mouse.down();
    await expect.poll(position).toEqual([126, -70]);
    await page.mouse.up();
    await expect.poll(position).toEqual([0, -70]);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-difficulty]')).toHaveCount(16);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('GRAVITRON unlock persists and keyboard and touch teleport immediately', async ({ page }, testInfo) => {
  const card = page.locator('[data-game="singularity"]');
  await expect(card).toBeHidden();
  await expect(page.locator('[data-game]:visible')).toHaveCount(11);
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
    const stick = await page.locator('#touch-joystick').boundingBox();
    await page.mouse.move(stick.x + stick.width - 10, stick.y + stick.height / 2);
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
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(card).toBeVisible();
  await expect(page.locator('[data-game]:visible')).toHaveCount(12);
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

test('Echo Protocol safely demonstrates all four positions on the box before its live replay', async ({ page }, testInfo) => {
  for (const mode of ['singularity', 'core_practice']) {
    if (mode === 'singularity') await unlock(page);
    else {
      await choosePractice(page);
      await page.locator('[data-difficulty="echo_protocol"]').click();
    }
    await page.evaluate(mode => {
      active = false;
      testRuntime.runPython('from singularity_core import ECHO_INTERVAL, ECHO_PREVIEW_DURATION, NODES');
      testRuntime.runPython(mode === 'singularity' ? 'session.game.begin_attack(12)' : 'session.game.update(3, set())');
    }, mode);
    for (let step = 0; step < 4; step++) {
      const preview = await page.evaluate(step => {
        testRuntime.runPython(`session.game.update(${step} * ECHO_INTERVAL + .4 - session.game.stage_age, set())`);
        snapshot = send('tick', { dt: 0 });
        render();
        return { hp: snapshot.lives, damage: snapshot.damage_taken,
          step: testRuntime.runPython('session.game.echo_step'),
          preview: testRuntime.runPython('session.game.echo_preview'),
          holograms: snapshot.commands.filter(c => c.fill === '#65f5ff30').length,
          safePositions: snapshot.commands.filter(c => c.outline === '#8affba').length };
      }, step);
      expect(preview).toEqual({ hp: 10, damage: 0, step, preview: true, holograms: 8, safePositions: 1 });
      await expect(page.locator('#game-instruction')).toContainText('SAFE PREVIEW');
      await expect(page.locator('#game-instruction')).not.toContainText('REMEMBER:');
      if (step === 1)
        await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`${mode}-echo-safe-preview.png`) });
    }
    const live = await page.evaluate(() => {
      testRuntime.runPython("target = NODES[(session.game.memory[0] + 1) % 9]\nheld = ({'Left'} if target[0] < 0 else {'Right'} if target[0] > 0 else set())\nif target[1] != -70:\n    held.add('Down' if target[1] < -70 else 'Up')\nsession.game.update(ECHO_PREVIEW_DURATION - session.game.stage_age, held)\nsession.game.update(.34, held)");
      snapshot = send('tick', { dt: 0 });
      render();
      return { hp: snapshot.lives, damage: snapshot.damage_taken,
        preview: testRuntime.runPython('session.game.echo_preview'),
        safePositions: snapshot.commands.filter(c => c.outline === '#8affba').length,
        liveHazards: snapshot.commands.filter(c => c.kind === 'oval' && c.fill === '#f080db' && c.outline === '#ffe4ef').length };
    });
    expect(live).toEqual({ hp: 9, damage: 1, preview: false, safePositions: 0, liveHazards: 8 });
    await expect(page.locator('#game-instruction')).toContainText('YOUR TURN');
    await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`${mode}-echo-live-replay.png`) });
    await page.keyboard.press('Escape');
  }
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
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  expect(await page.evaluate(() => saved.achievements.unlocked.core_win)).toBe(earned.victory);
  expect(await page.evaluate(() => saved.achievements.unlocked.core_flawless)).toBe(earned.flawless);
});
