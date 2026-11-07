const { test, expect, openGame } = require('./fixtures/game.cjs');

// Keep unrelated score assertions independent of the randomly selected song.
test.use({ deterministicMusic: true });

test('Pumpkin King classic colors and smoother artwork keep blue and orange eye cues readable', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('const pyodide = await loadPyodide(',
      'const pyodide = window.testKingRuntime = await loadPyodide(') });
  });
  await openGame(page);
  await page.locator('[data-game="pumpkin"]').click();
  await page.locator('[data-difficulty="baby"]').click();
  await page.evaluate(() => {
    active = false;
    document.querySelector('#achievement-celebrations').replaceChildren();
    document.querySelector('#achievement-toast').hidden = true;
    testKingRuntime.runPython('from bridge import session\nfrom pumpkin_king import Stage\nsession.game.begin_attack(0)');
  });
  for (const [rule, color] of [['blue', '#42c9ff'], ['orange', '#ff9d32']]) {
    const coloredEyes = await page.evaluate(({ rule, color }) => {
      testKingRuntime.runPython(`session.game.stage = Stage('color', 100, '${rule}')\nsession.game.stage_age = .25`);
      snapshot = send('tick', { dt: 0, keys: [] });
      render();
      return snapshot.commands.filter(command => command.kind === 'polygon' && command.fill === color).length;
    }, { rule, color });
    expect(coloredEyes).toBeGreaterThanOrEqual(2);
    await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`classic-pumpkin-${rule}.png`) });
  }
  for (const stage of ['raise', 'fire']) {
    await page.evaluate(stage => {
      testKingRuntime.runPython(`session.game.stage = Stage('${stage}', .65, 'both')\nsession.game.stage_age = .3\nsession.game.x = 150`);
      snapshot = send('tick', { dt: 0, keys: [] });
      render();
    }, stage);
    await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`classic-pumpkin-${stage}.png`) });
  }
  expect(errors).toEqual([]);
});

test("Pumpkin King offers four HP choices with separate scores", async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => localStorage.setItem("microgame-madness.v1", JSON.stringify({
    player: "Mode Tester",
    scores: {
      "pumpkin:coward": [{ player: "Mode Tester", score: 123 }],
      "pumpkin:phase2": [{ player: "Mode Tester", score: 456 }],
      "pumpkin:baby": [{ player: "Mode Tester", score: 789 }],
      "pumpkin:come_on": [{ player: "Mode Tester", score: 923 }],
    },
  })));
  await page.reload();
  await expect(page.locator("#runtime-status")).toContainText("All games ready", { timeout: 30000 });
  await page.locator('[data-game="pumpkin"]').click();
  await expect(page.locator("#difficulty-choices button")).toHaveCount(4);
  const coward = page.getByRole("button", { name: /^Coward Mode/ });
  await expect(coward).toContainText("10 HP");
  await coward.click();
  await expect(page.locator("#metric")).toHaveText("10 / 10");
  await expect(page.locator("#best")).toHaveText("123");
  await page.locator("#exit").click();
  await page.locator('[data-difficulty="phase2"]').click();
  await expect(page.locator("#metric")).toHaveText("5 / 5");
  await expect(page.locator("#best")).toHaveText("456");
  await page.locator("#exit").click();
  await coward.click();
  await expect(page.locator("#metric")).toHaveText("10 / 10");
  await page.locator("#exit").click();
  const baby = page.getByRole("button", { name: /^Baby Mode/ });
  await expect(baby).toContainText("15 HP");
  await baby.click();
  await expect(page.locator("#metric")).toHaveText("15 / 15");
  await expect(page.locator("#player-health-value")).toHaveText("15 / 15");
  await expect(page.locator("#best")).toHaveText("789");
  await page.locator("#exit").click();
  await baby.click();
  await expect(page.locator("#player-health-value")).toHaveText("15 / 15");
  await page.locator("#exit").click();
  const comeOn = page.getByRole("button", { name: /^Come On, Are You Really That Bad at the Game/ });
  await expect(comeOn).toContainText("23 HP");
  await comeOn.click();
  await expect(page.locator("#player-health-value")).toHaveText("23 / 23");
  await expect(page.locator("#metric")).toHaveText("23 / 23");
  await expect(page.locator("#best")).toHaveText("923");
  await page.locator("#exit").click();
  await comeOn.click();
  await expect(page.locator("#player-health-value")).toHaveText("23 / 23");
});

test("Pumpkin King contact kills in every mode and restart restores health", async ({ page }) => {
  await openGame(page);
  await page.locator('[data-game="pumpkin"]').click();
  await expect(page.locator('#welcome-copy')).toContainText('body or arms kills instantly');
  for (const [mode, hp] of [['phase2', 5], ['coward', 10], ['baby', 15], ['come_on', 23]]) {
    await page.locator(`[data-difficulty="${mode}"]`).click();
    await expect(page.locator('#player-health-value')).toHaveText(`${hp} / ${hp}`);
    // Move into the actual Python boss, rather than injecting a death snapshot.
    await page.keyboard.down('ArrowUp');
    await expect(page.locator('#overlay')).toBeVisible();
    await expect(page.locator('#overlay-title')).toHaveText('One more try?');
    await page.keyboard.up('ArrowUp');
    await expect(page.locator('#player-health-value')).toHaveText(`0 / ${hp}`);
    await expect(page.locator('#overlay-copy')).toContainText('His body and arms kill instantly');
    expect(await page.evaluate(() => damageFlashAnimation !== null)).toBe(true);
    await page.locator('#overlay-action').click();
  }
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('microgame-madness.v1')).achievements.stats);
  expect(progress.pumpkinWins).toBe(0);
  await page.locator('[data-difficulty="come_on"]').click();
  await expect(page.locator('#player-health-value')).toHaveText('23 / 23');
});

test('Pumpkin King arm-lift smashes and roar fire deal one HP in every mode', async ({ page }) => {
  let attack = 'slam';
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    const setup = 'self.game = PumpkinKing(difficulty=difficulty)\n            from pumpkin_king import Stage\n            from collections import deque\n            self.game.intro_done = True\n'
      + (attack === 'slam'
        ? '            self.game.x = -150\n            self.game.stage = Stage("raise", .1, "left")\n            self.game.queue = deque([Stage("slam", .15, "left"), Stage("break", 100)])'
        : '            self.game.stage = Stage("roar", .1)\n            self.game.queue = deque([Stage("fire", .3), Stage("break", 100)])');
    await route.fulfill({ response, body: (await response.text()).replace('self.game = PumpkinKing(difficulty=difficulty)', setup) });
  });
  for (attack of ['slam', 'fire']) {
    await openGame(page);
    await page.locator('[data-game="pumpkin"]').click();
    for (const [mode, hp] of [['phase2', 5], ['coward', 10], ['baby', 15], ['come_on', 23]]) {
      await page.locator(`[data-difficulty="${mode}"]`).click();
      await expect(page.locator('#player-health-value')).toHaveText(`${hp - 1} / ${hp}`);
      expect(await page.evaluate(() => damageFlashAnimation !== null)).toBe(true);
      await expect(page.locator('#overlay')).toBeHidden();
      await page.locator('#pause').click();
      await expect(page.locator('#overlay-title')).toHaveText('Take a breather.');
      await page.locator('#exit').click();
    }
  }
});

for (const mode of ['pumpkin', 'wrath'])
test(`${mode} Haunted Quadrants gives two seconds to position with laughing faces, then eighteen slower scares`, async ({ page }, testInfo) => {
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    let body = (await response.text()).replace('self.game = PumpkinKing(difficulty=difficulty)',
      'self.game = PumpkinKing(difficulty=difficulty)\n            self.game.begin_attack(6)\n            self.game.x, self.game.y = -150, 30');
    body = body.replace('self.game = KingsWrath(attack=difficulty)',
      'self.game = KingsWrath(attack=difficulty)\n            self.game.x, self.game.y = -150, 30');
    await route.fulfill({ response, body });
  });
  await openGame(page);
  await page.locator('#player').click();
  await page.evaluate(mode => {
    selectGame(mode); startGame(mode === 'pumpkin' ? 'baby' : 'haunted_quadrants'); active = false;
    window.scareSounds = [];
    const original = playSound;
    playSound = event => { if (event === 'scare') window.scareSounds.push(event); original(event); };
    document.querySelector('#achievement-celebrations').replaceChildren();
    document.querySelector('#achievement-toast').hidden = true;
  }, mode);
  const tick = frames => page.evaluate(frames => {
    for (let i = 0; i < frames; i++) { snapshot = send('tick', { dt: .05, keys: [] }); render(); }
    return { lives: snapshot.lives, label: snapshot.label, damage: snapshot.damage_taken,
      warnings: snapshot.commands.filter(c => c.kind === 'text' && c.text === '!'),
      introFaces: snapshot.commands.filter(c => c.kind === 'polygon' && c.coords.length === 22
        && ['#9e8cff', '#7cdae6', '#b8a3f4'].includes(c.fill)).length,
      faces: snapshot.commands.filter(c => c.kind === 'polygon' && c.coords.length === 22 && c.fill === '#e7d9ff').length,
      lines: snapshot.commands.filter(c => c.fill === '#d9b8f5').length };
  }, frames);
  let state = await tick(0);
  if (mode === 'wrath') {
    expect(state.label).toContain('GET READY — 3');
    expect(state.introFaces).toBe(0);
    await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath('wrath-three-second-countdown.png') });
    state = await tick(20);
    expect(state.label).toContain('GET READY — 2');
    state = await tick(20);
    expect(state.label).toContain('GET READY — 1');
    state = await tick(19);
    expect(state.label).toContain('GET READY — 1');
    await page.evaluate(() => { snapshot = send('pause'); render(); });
    expect(await tick(20)).toEqual(state);
    await page.evaluate(() => { snapshot = send('pause'); render(); });
    state = await tick(1);
  }
  expect(state.label).toContain('GET IN POSITION');
  expect(state.label).toContain('TOP LEFT FIRST');
  expect(state.introFaces).toBe(20);
  expect(state.warnings).toHaveLength(0);
  expect(state.lives).toBe(15);
  await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`${mode}-haunted-positioning.png`) });
  const firstArt = await page.evaluate(() => JSON.stringify(snapshot.commands));
  state = await tick(39); // 1.95 seconds: the first quadrant is still harmless.
  expect(state.label).toContain('GET IN POSITION');
  expect(state.damage).toBe(0);
  expect(await page.evaluate(() => JSON.stringify(snapshot.commands))).not.toBe(firstArt);
  await page.evaluate(() => { snapshot = send('pause'); render(); });
  const frozen = await tick(20);
  expect(frozen).toEqual(state);
  expect(await page.evaluate(() => window.scareSounds.length)).toBe(0);
  await page.evaluate(() => { snapshot = send('pause'); render(); });
  state = await tick(1); // Exactly two seconds begins the first warning.
  expect(state.introFaces).toBe(0);
  expect(state.warnings).toHaveLength(3);
  expect(state.warnings[0].fill).toBe('#ff4d55');
  expect(state.lines).toBe(2);
  state = await tick(2);
  expect(state.warnings[0].fill).toBe('#ffe45c');
  expect(state.lives).toBe(15);
  await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`${mode}-scare-warning.png`) });
  state = await tick(1);
  expect(state.warnings).toHaveLength(0);
  expect(state.faces).toBe(3);
  expect(state.lives).toBe(14.5);
  expect(state.damage).toBe(.5);
  await expect(page.locator('#player-health')).toContainText('14.5 / 15');
  expect(await page.evaluate(() => damageFlashAnimation !== null)).toBe(true);
  await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`${mode}-scare-faces.png`) });
  state = await tick(97);
  expect(state.label).toContain(mode === 'wrath' ? 'GET READY — 3' : 'BREATHE');
  expect(state.faces).toBe(0);
  expect(state.lines).toBe(0);
  expect(state.lives).toBe(12.5);
  expect(await page.evaluate(() => window.scareSounds.length)).toBe(18);
  if (mode === 'wrath') {
    state = await tick(60);
    expect(state.label).toContain('GET IN POSITION');
    expect(state.introFaces).toBe(20);
    expect(state.damage).toBe(2.5);
  }
});


