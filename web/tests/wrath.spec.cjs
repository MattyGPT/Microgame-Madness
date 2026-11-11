const { test, expect, openGame } = require('./fixtures/game.cjs');

// Keep unrelated score assertions independent of the randomly selected song.
test.use({ deterministicMusic: true });

test("The King's Wrath has a yellow crown and loads all eight practice modes", async ({ page }, testInfo) => {
  await openGame(page);
  await expect(page.locator('[data-game]:visible')).toHaveCount(11);
  const card = page.locator('[data-game="wrath"]');
  await expect(card).toContainText("The King's Wrath");
  const crown = card.locator('.wrath-art svg > path').first();
  await expect(crown).toHaveAttribute('fill', 'url(#wrath-crown-gold)');
  await expect(card.locator('#wrath-crown-gold stop')).toHaveCount(4);
  await page.evaluate(() => {
    document.querySelector('#achievement-toast').hidden = true;
    document.querySelector('#achievement-celebrations').replaceChildren();
  });
  await page.locator('.game-grid').screenshot({ path: testInfo.outputPath('six-games-yellow-crown.png') });
  for (const target of [crown, card.locator('.card-title')]) {
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
  expect(await page.evaluate(() => snapshot.label)).toContain('BREATHE');
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
  await page.locator('[data-difficulty="random_order"]').click();
  await page.evaluate(() => { active = false; });
  await expect(page.locator('#player-health-value')).toHaveText('15 / 15');
  expect(await page.evaluate(() => snapshot.label)).toContain('GET READY — 3 · NEXT:');
  const result = await page.evaluate(() => {
    wrathRuntime.runPython('from bridge import session');
    const order = [wrathRuntime.runPython('session.game.attack_index')];
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
      order.push(wrathRuntime.runPython('session.game.attack_index'));
      if (snapshot.label.includes('GET READY')) throw new Error('Countdown repeated');
    }
    render();
    return { order, difficulty: snapshot.difficulty, over: snapshot.over,
      completed: snapshot.attacks_completed, fullDeck: Boolean(saved.achievements.unlocked.wrath_full_deck) };
  });
  expect(result.order).toHaveLength(8);
  expect(result.order.every(Number.isInteger)).toBe(true);
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
  await expect(page.locator('#leaderboard-multipliers')).toHaveText('Easy ×0.5 · Normal ×1 · Hard ×2.');
  await expect(page.locator('#leaderboard-difficulty')).toHaveCount(0);
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
  await expect(page.locator('#leaderboard-multipliers')).toHaveText('Easy ×0.5 · Normal ×1 · Hard ×2.');
  await expect(page.locator('#leaderboard-difficulty')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  expect(await page.evaluate(() => saved.scores['wrath:bone_gauntlet'][0].player)).toBe('Practice player');
});



test('Wrath offers named difficulty cards, descriptions, reward rates, and all variants start', async ({ page }, testInfo) => {
  await openGame(page);
  await page.locator('[data-game="wrath"]').click();
  for (const attack of ['color_memory', 'bone_gauntlet', 'rotating_rings', 'magenta_fingers', 'chaos', 'royal_slams', 'haunted_quadrants', 'random_order']) {
    await page.locator(`[data-difficulty="${attack}"]`).click();
    await expect(page.locator('#difficulty-choices [data-difficulty]')).toHaveCount(3);
    for (const [suffix, level, rate] of [['__easy', 'Easy', '0.5'], ['', 'Normal', '1'], ['__hard', 'Hard', '2']]) {
      const card = page.locator(`[data-difficulty="${attack}${suffix}"]`);
      await expect(card.locator('strong')).toContainText(`(${level})`);
      await expect(card.locator('span')).toContainText(`Cubie Cash ×${rate}`);
    }
    await page.getByRole('button', { name: '← All attacks' }).click();
  }
  await page.locator('[data-difficulty="color_memory"]').click();
  await expect(page.locator('[data-difficulty="color_memory__easy"]')).toContainText('Do Your Cute Face (Easy)');
  await page.locator('#welcome').screenshot({path: testInfo.outputPath('wrath-variants.png')});
  await page.locator('[data-difficulty="color_memory__easy"]').click();
  expect(await page.evaluate(() => snapshot.difficulty)).toBe('color_memory__easy');
  await page.evaluate(() => {
    active = false;
    for (let i=0; i<61; i++) snapshot = send('tick', {dt:.05, keys:[]});
    render();
  });
  await page.locator('#game-canvas').screenshot({path: testInfo.outputPath('cute-face.png')});
  for (const attack of ['color_memory', 'bone_gauntlet', 'rotating_rings', 'magenta_fingers', 'chaos', 'royal_slams', 'haunted_quadrants', 'random_order']) {
    for (const level of ['easy', 'hard']) {
      const state = await page.evaluate(({attack, level}) => {
        snapshot = send('start', {mode:'wrath', difficulty:`${attack}__${level}`});
        for (let i=0; i<65; i++) snapshot = send('tick', {dt:.05, keys:[]});
        render();
        return {difficulty:snapshot.difficulty, over:snapshot.over};
      }, {attack, level});
      expect(state).toEqual({difficulty:`${attack}__${level}`, over:false});
    }
  }
});

test('Wrath difficulty themes and new attack gestures render clearly', async ({page}, testInfo) => {
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({response, body:(await response.text()).replace('const pyodide = await loadPyodide(', 'const pyodide = window.wrathArtRuntime = await loadPyodide(')});
  });
  await openGame(page);
  await page.locator('[data-game="wrath"]').click();
  await page.locator('[data-difficulty="chaos"]').click();
  await expect(page.locator('.wrath-difficulty-art')).toHaveCount(3);
  await expect(page.locator('[data-difficulty="chaos__hard"]')).toContainText('40% more projectiles');
  await page.locator('#welcome').screenshot({path:testInfo.outputPath('havoc-difficulty-art.png')});
  await page.locator('[data-difficulty="chaos__hard"]').click();
  for (const [attack, level, stage, age] of [
    ['chaos','easy','chaos',.8], ['chaos','hard','chaos',.8],
    ['haunted_quadrants','easy','scare_ready',1], ['haunted_quadrants','hard','scare_ready',1],
    ['royal_slams','hard','center',.39], ['royal_slams','hard','split',.39], ['royal_slams','hard','sweep',.39],
  ]) {
    await page.evaluate(({attack,level,stage,age}) => {
      active = false;
      snapshot = send('start',{mode:'wrath',difficulty:`${attack}__${level}`});
      wrathArtRuntime.runPython(`from bridge import session\nfrom pumpkin_king import Stage\ngame = session.game\ngame.update(3, set())`);
      if (attack === 'royal_slams') wrathArtRuntime.runPython(`game.stage = Stage('raise', .5/1.2, '${stage}')\ngame.stage_age = ${age}`);
      else if (stage === 'scare_ready') wrathArtRuntime.runPython(`game.stage_age = ${age}`);
      else wrathArtRuntime.runPython(`game.update(${age}, set())`);
      snapshot = send('tick',{dt:0,keys:[]});
      render();
    }, {attack,level,stage,age});
    await page.locator('#game-canvas').screenshot({path:testInfo.outputPath(`${attack}-${level}-${stage}.png`)});
  }
});
