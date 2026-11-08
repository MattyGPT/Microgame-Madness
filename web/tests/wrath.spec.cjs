const { test, expect, openGame } = require('./fixtures/game.cjs');

// Keep unrelated score assertions independent of the randomly selected song.
test.use({ deterministicMusic: true });

test("The King's Wrath has a yellow crown and loads all eight practice modes", async ({ page }, testInfo) => {
  await openGame(page);
  await expect(page.locator('[data-game]:visible')).toHaveCount(11);
  const card = page.locator('[data-game="wrath"]');
  await expect(card).toContainText("The King's Wrath");
  expect(await card.locator('svg path').evaluate(el => getComputedStyle(el).fill)).toBe('rgb(255, 224, 102)');
  await page.evaluate(() => {
    document.querySelector('#achievement-toast').hidden = true;
    document.querySelector('#achievement-celebrations').replaceChildren();
  });
  await page.locator('.game-grid').screenshot({ path: testInfo.outputPath('six-games-yellow-crown.png') });
  for (const target of [card.locator('svg path'), card.locator('.card-title')]) {
    await target.click();
    await expect(page.locator('#game-title')).toHaveText("The King's Wrath");
    await expect(page.locator('#difficulty-choices button')).toHaveCount(8);
    await page.locator('[data-game="hangman"]').click();
  }
  await card.press('Enter');
  await expect(page.locator('#game-title')).toHaveText("The King's Wrath");
  await expect(page.locator('#difficulty-title')).toHaveText('Choose an attack to load');
  await expect(page.locator('#difficulty-choices button')).toHaveCount(8);
  await expect(page.locator('#welcome-art svg')).toBeVisible();
  await page.locator('#welcome').screenshot({ path: testInfo.outputPath('wrath-attack-picker.png') });
  const attacks = {
    color_memory: 'WATCH THE EYES', bone_gauntlet: 'BONE GAUNTLET', rotating_rings: 'ROTATING RINGS',
    magenta_fingers: 'MAGENTA FINGERS', chaos: 'CHAOS', royal_slams: 'HAND RISING', haunted_quadrants: 'TOP LEFT',
  };
  for (const [attack, label] of Object.entries(attacks)) {
    await page.locator(`[data-difficulty="${attack}"]`).click();
    await expect(page.locator('#game-canvas')).toBeVisible();
    await expect(page.locator('#player-health')).toBeVisible();
    const state = await page.evaluate(attack => {
      // Start from the exact countdown boundary after the UI assertions.
      // Real animation frames may advance while CI waits for those assertions.
      active = false;
      snapshot = send('start', { mode: 'wrath', difficulty: attack });
      return { mode: snapshot.mode, attack: snapshot.difficulty,
        hp: snapshot.max_lives, label: snapshot.label, music: musicPlayer.theme };
    }, attack);
    expect(state).toMatchObject({ mode: 'wrath', attack, hp: 15, music: 'pumpkin' });
    expect(state.label).toContain('GET READY — 3');
    expect(state.label).not.toContain('AWAKENING');
    for (const seconds of [2, 1, 0]) {
      await page.evaluate(() => {
        for (let frame = 0; frame < 20; frame++) snapshot = send('tick', { dt: .05, keys: [] });
        render();
      });
      expect(await page.evaluate(() => snapshot.label)).toContain(seconds ? `GET READY — ${seconds}` : label);
    }
    if (testInfo.project.name === 'mobile') {
      await expect(page.locator('#touch-fire')).toBeVisible();
      await expect(page.locator('#touch-counter')).toBeVisible();
    }
    await page.locator('#exit').click();
    await expect(page.locator('#difficulty-choices button')).toHaveCount(8);
  }
  await page.locator('[data-difficulty="haunted_quadrants"]').click();
  await page.locator('#pause').click();
  expect(await page.evaluate(() => snapshot.paused)).toBe(true);
  expect(await page.evaluate(() => JSON.stringify(send('tick', { dt: .05, keys: ['Up', 'f', 'e'] })) === JSON.stringify(snapshot))).toBe(true);
  await page.locator('#overlay-action').click();
  expect(await page.evaluate(() => snapshot.paused)).toBe(false);
  await page.evaluate(() => {
    // Keep the real bridge and renderer; advance only the practice run.
    snapshot = send('start', { mode: 'wrath', difficulty: 'haunted_quadrants' });
    active = false;
    for (let frame = 0; frame < 200; frame++) snapshot = send('tick', { dt: .05, keys: [] });
    render();
  });
  expect(await page.evaluate(() => snapshot.label)).toContain('GET READY — 3');
  expect(await page.evaluate(() => snapshot.over)).toBe(false);
  await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath('wrath-repeat-countdown.png') });
  await page.locator('[data-game="pumpkin"]').click();
  await expect(page.locator('#difficulty-title')).toHaveText('Choose a difficulty to play');
  await expect(page.locator('#difficulty-choices button')).toHaveCount(4);
  await page.locator('[data-difficulty="baby"]').click();
  expect(await page.evaluate(() => snapshot.label)).toContain('AWAKENING');
});

test("The King's Wrath Random Order shuffles all attacks and keeps the preparation countdown", async ({ page }, testInfo) => {
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'const pyodide = await loadPyodide(',
      'const pyodide = window.wrathRuntime = await loadPyodide(') });
  });
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('self.game = KingsWrath(attack=difficulty)',
      'self.game = KingsWrath(attack=difficulty, rng=random.Random(12))\n            self.game.hurt = lambda *args, **kwargs: None');
    await route.fulfill({ response, body });
  });
  await openGame(page);
  await page.locator('[data-game="wrath"]').click();
  await expect(page.locator('#difficulty-choices button')).toHaveCount(8);
  await page.locator('[data-difficulty="random_order"]').click();
  await page.evaluate(() => { active = false; });
  await expect(page.locator('#player-health-value')).toHaveText('15 / 15');
  expect(await page.evaluate(() => snapshot.label)).toContain('GET READY — 3 · NEXT:');
  const result = await page.evaluate(() => {
    const order = [snapshot.label.split('NEXT: ')[1]];
    // Native Python tests exhaustively replay shuffle rules. Advance the real
    // model to each boundary here to check browser countdowns and the award,
    // without thousands of canvas snapshots and JSON/WASM round trips.
    wrathRuntime.runPython('from bridge import session');
    for (let attack = 0; attack < 7; attack++) {
      wrathRuntime.runPython(`
game = session.game
remaining = game.stage.duration - game.stage_age + sum(stage.duration for stage in game.queue)
game.update(remaining, set())
`);
      snapshot = send('tick', { dt: 0, keys: [] });
      order.push(snapshot.label.split('NEXT: ')[1]);
    }
    render();
    return { order, difficulty: snapshot.difficulty, over: snapshot.over,
      completed: snapshot.attacks_completed, fullDeck: Boolean(saved.achievements.unlocked.wrath_full_deck) };
  });
  expect(result.order).toHaveLength(8);
  expect(result.order.every(Boolean)).toBe(true);
  expect(new Set(result.order.slice(0, 7)).size).toBe(7);
  expect(result.order[7]).not.toBe(result.order[6]);
  expect(result).toMatchObject({ difficulty: 'random_order', over: false, completed: 7, fullDeck: true });
  await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath('wrath-random-order.png') });
  await page.locator('#exit').click();
  await expect(page.locator('[data-difficulty="random_order"]')).toBeVisible();
});

test("The King's Wrath Random Order saves separate records and offers global rankings", async ({ page }) => {
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('self.game = KingsWrath(attack=difficulty)',
      'self.game = KingsWrath(attack=difficulty)\n            from boss_crush import Projectile\n            self.game.hp = 5\n            self.game.shots = [Projectile(self.game.boss_x, self.game.boss_y, 0, 520)]');
    await route.fulfill({ response, body });
  });
  await openGame(page);
  await page.locator('#player').fill('Shuffle player');
  await page.locator('[data-game="wrath"]').click();
  await page.locator('[data-difficulty="random_order"]').click();
  await expect(page.locator('#overlay-title')).toHaveText('You did it!');
  const profile = await page.evaluate(() => saved);
  expect(profile.scores['wrath:random_order'][0].player).toBe('Shuffle player');
  expect(profile.achievements.unlocked.wrath_random_order).toBeTruthy();
  expect(profile.achievements.unlocked.wrath_flawless).toBeTruthy();
  expect(profile.achievements.unlocked.wrath_perfect_shuffle).toBeUndefined();
  expect(profile.achievements.stats.pumpkinWins).toBe(0);
  await page.locator('#global-tab').click();
  await expect(page.locator('#leaderboard-game')).toHaveValue('wrath');
  await expect(page.locator('#leaderboard-difficulty')).toHaveValue('random_order');
  await expect(page.locator('#leaderboard-difficulty option')).toHaveCount(8);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  expect(await page.evaluate(() => saved.scores['wrath:random_order'][0].player)).toBe('Shuffle player');
});

test("The King's Wrath keeps practice records and wins separate from the full fight", async ({ page }) => {
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('self.game = KingsWrath(attack=difficulty)',
      'self.game = KingsWrath(attack=difficulty)\n            from boss_crush import Projectile\n            self.game.hp = 5\n            self.game.shots = [Projectile(self.game.boss_x, self.game.boss_y, 0, 520)]');
    await route.fulfill({ response, body });
  });
  await page.addInitScript(() => {
    if (localStorage.getItem('microgame-madness.v1')) return;
    const profile = { scores: {} };
    profile.scores['pumpkin:baby'] = [{ player: 'Original player', score: 1234 }];
    localStorage.setItem('microgame-madness.v1', JSON.stringify(profile));
  });
  await openGame(page);
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await page.locator('#player').fill('Practice player');
  await page.locator('[data-game="wrath"]').click();
  await page.locator('[data-difficulty="bone_gauntlet"]').click();
  await expect(page.locator('#overlay-title')).toHaveText('You did it!');
  const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('microgame-madness.v1')));
  expect(profile.scores['wrath:bone_gauntlet'][0].player).toBe('Practice player');
  expect(profile.scores['pumpkin:baby']).toEqual([{ player: 'Original player', score: 1234 }]);
  expect(profile.achievements.stats.pumpkinWins).toBe(0);
  expect(profile.achievements.unlocked.pumpkin_full_health).toBeUndefined();
  expect(profile.achievements.unlocked.pumpkin_flawless).toBeUndefined();
  await page.locator('#overlay-action').click();
  await expect(page.locator('#difficulty-choices button')).toHaveCount(8);
  await page.locator('#global-tab').click();
  await expect(page.locator('#leaderboard-game')).toHaveValue('wrath');
  await expect(page.locator('label[for="leaderboard-difficulty"]')).toHaveText('Attack');
  await expect(page.locator('#leaderboard-difficulty option')).toHaveCount(8);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  expect(await page.evaluate(() => saved.scores['wrath:bone_gauntlet'][0].player)).toBe('Practice player');
});

