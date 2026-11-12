const { test, expect, openGame } = require('./fixtures/game.cjs');

// Keep unrelated score assertions independent of the randomly selected song.
test.use({ deterministicMusic: true });

test("welcome achievement fades, persists once, and collection tabs work", async ({ page }, testInfo) => {
  // Freeze the toast lifetime while runtime loading and assertions run on busy CI.
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.goto('/');
  const toast = page.locator('#achievement-toast');
  await expect(toast).toContainText('Welcome to Microgame Madness!');
  await expect(page.locator('.achievement-confetti[data-tier="bronze"] i')).toHaveCount(40);
  await expect(toast).toContainText('bronze achievement · +10 points');
  const box = await toast.boundingBox();
  expect(box.x).toBeLessThan(20);
  expect(box.y).toBeLessThan(20);
  await page.screenshot({ path: testInfo.outputPath('welcome-achievement.png') });
  await expect(page.locator('#profile-score')).toHaveText('10');
  await page.clock.runFor(4500);
  await expect(toast).toBeHidden();
  await page.clock.resume();
  await page.locator('#achievements-tab').click();
  await expect(page.locator('#achievements-panel')).toBeVisible();
  await expect(page.locator('#scores-panel')).toBeHidden();
  const achievementTotal = await page.evaluate(() => Achievements.catalog.length);
  await expect(page.locator('.achievement-card')).toHaveCount(achievementTotal);
  await page.locator('#achievement-filter').selectOption('earned');
  await expect(page.locator('.achievement-card:visible')).toHaveCount(1);
  await expect(page.locator('[data-achievement="welcome"]')).toContainText('Unlocked');
  await page.locator('#achievement-filter').selectOption('locked');
  await expect(page.locator('.achievement-card:visible')).toHaveCount(achievementTotal - 1);
  await page.locator('#achievements-tab').press('ArrowLeft');
  await expect(page.locator('#scores-tab')).toBeFocused();
  await expect(page.locator('#scores-panel')).toBeVisible();
  await page.reload();
  await expect(page.locator('#profile-score')).toHaveText('10');
  await expect(toast).toBeHidden();
});

test("real Hangman wins award the requested medals once and persist across reloads", async ({ page }, testInfo) => {
  // Fix only the random word so guesses still run through the real Python game.
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('random.choice(rules["words"])', '"cat"') });
  });
  await openGame(page);
  for (let round = 0; round < 10; round++) {
    await page.locator(`[data-difficulty="${round === 1 ? 'hard' : 'easy'}"]`).click();
    if (round === 0) {
      await expect(page.locator('#profile-score')).toHaveText('20');
      await page.getByRole('button', { name: 'Guess Z', exact: true }).click();
    }
    for (const letter of 'CAT') await page.getByRole('button', { name: `Guess ${letter}`, exact: true }).click();
    await expect(page.locator('#overlay-title')).toHaveText('You did it!');
    if (round === 0) await expect(page.locator('#profile-score')).toHaveText('50');
    if (round === 1) await expect(page.locator('#profile-score')).toHaveText('210');
    if (round === 4) await expect(page.locator('#profile-score')).toHaveText('360');
    await page.locator('#overlay-action').click();
  }
  await expect(page.locator('#profile-score')).toHaveText('570');
  await page.locator('#achievements-tab').click();
  await page.locator('#achievement-filter').selectOption('earned');
  for (const id of ['play_hangman', 'hangman_win', 'hangman_hard', 'hangman_5', 'hangman_10'])
    await expect(page.locator(`[data-achievement="${id}"]`)).toContainText('Unlocked');
  await expect(page.locator('[data-achievement="hangman_10"]')).toContainText('Professional Prodigy');
  await page.locator('#achievements-panel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('achievement-collection.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(page.locator('#profile-score')).toHaveText('570');
  await page.locator('#achievements-tab').click();
  await expect(page.locator('[data-achievement="hangman_25"]')).toContainText('10 / 25');
  await page.locator('#scores-tab').click();
  await page.locator('#player').fill('New nickname');
  await page.locator('[data-difficulty="hard"]').click();
  await page.locator('#exit').click();
  await expect(page.locator('#profile-score')).toHaveText('570');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('microgame-madness.v1')).achievements.stats.hangmanWins)).toBe(10);
});

test("achievements remain usable when browser storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('microgame-madness.v1')) return;
    Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
  });
  await openGame(page);
  await page.locator('[data-difficulty="easy"]').click();
  await expect(page.locator('#profile-score')).toHaveText('20');
  await expect(page.locator('#storage-note')).toContainText('Scores and achievements last for this visit only');
  await page.locator('#achievements-tab').click();
  await expect(page.locator('[data-achievement="play_hangman"]')).toContainText('Unlocked');
});

test('real Turtle Dodge evidence unlocks Close One and the crystal survival reward', async ({ page }) => {
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    let body = await response.text();
    body = body.replace('from dodge_model import DodgeGame', 'from dodge_model import Block, DodgeGame');
    body = body.replace('self.game = DodgeGame(difficulty=difficulty)',
      'self.game = DodgeGame(difficulty=difficulty)\n            self.game.x, self.game.y = 0, 0\n            self.game.elapsed = 119.95\n            self.game.spawn_in = 1000\n            self.game.blocks = [Block(25, 65, ((0, 0),), "red")]');
    await route.fulfill({ response, body });
  });
  await openGame(page);
  await page.locator('[data-game="dodge"]').click();
  await page.locator('[data-difficulty="easy"]').click();
  await expect(page.locator('#profile-score')).toHaveText('600'); // Includes Shell Endurance at 90 seconds.
  await page.locator('#pause').click();
  await page.locator('#achievements-tab').click();
  await expect(page.locator('[data-achievement="dodge_close"]')).toContainText('Unlocked');
  await expect(page.locator('[data-achievement="dodge_120"]')).toContainText("I'm Still Standing!");
  await expect(page.locator('[data-achievement="dodge_120"]')).toContainText('crystal · +270 points');
  await page.reload();
  await expect(page.locator('#profile-score')).toHaveText('600');
});

test('King of Suffering rejects a healed win and awards 810 for a true no-hit win', async ({ page }) => {
  let wounded = true;
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    const preparation = 'self.game = PumpkinKing(difficulty=difficulty)\n            from boss_crush import Projectile, HealingPickup\n            self.game.begin_attack(0)\n'
      + (wounded ? '            self.game.hurt()\n            self.game.healing_pickups = [HealingPickup(self.game.x, self.game.y)]\n            self.game.update_healing(.01)\n' : '')
      + '            self.game.elapsed = 100\n            self.game.hp = 5\n            self.game.shots = [Projectile(self.game.boss_x, self.game.boss_y, 0, 520)]';
    await route.fulfill({ response, body: (await response.text()).replace('self.game = PumpkinKing(difficulty=difficulty)', preparation) });
  });
  async function win() {
    await openGame(page);
    await page.locator('[data-game="pumpkin"]').click();
    await page.locator('[data-difficulty="baby"]').click();
    await expect(page.locator('#overlay-title')).toHaveText('You did it!');
    await expect(page.locator('#player-health-value')).toHaveText('15 / 15');
    await page.locator('#achievements-tab').click();
  }
  await win();
  await expect(page.locator('[data-achievement="pumpkin_flawless"]')).toContainText('Locked');
  await expect(page.locator('#profile-score')).toHaveText('320');
  await expect(page.locator('[data-achievement="pumpkin_full_health"]')).toContainText('Unlocked');
  await expect(page.locator('[data-achievement="pumpkin_full_health"]')).toHaveAttribute('data-tier', 'crystal');
  wounded = false;
  await win();
  await expect(page.locator('[data-achievement="pumpkin_flawless"]')).toContainText('Unlocked');
  await expect(page.locator('#profile-score')).toHaveText('1140');
  // Queued notifications keep the new tier and its reward as well.
  while (!(await page.locator('#achievement-toast').innerText()).includes('King of Suffering'))
    await page.getByRole('button', { name: 'Dismiss achievement notification' }).first().click();
  await expect(page.locator('#achievement-toast')).toContainText('diamond achievement · +810 points');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#profile-score')).toHaveText('1140');
});

test('all six medal tiers have readable colored frames and reduced-motion support', async ({ page }, testInfo) => {
  await openGame(page);
  await page.locator('#achievements-tab').click();
  await expect(page.locator('.achievement-legend')).toContainText('Crystal +270 · Diamond +810');
  for (const [tier, id] of [['bronze', 'welcome'], ['silver', 'hangman_win'], ['gold', 'hangman_5'],
    ['crystal', 'dodge_120'], ['diamond', 'pumpkin_flawless'], ['rainbow', 'hangman_250']]) {
    const card = page.locator(`[data-achievement="${id}"]`);
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveClass(/in-view/);
    const style = await card.evaluate(el => {
      const cs = getComputedStyle(el);
      return { background: cs.backgroundImage, color: cs.getPropertyValue('--medal'), shape: cs.clipPath,
        thickness: cs.paddingTop, shine: cs.animationName, sparkle: getComputedStyle(el, '::before').animationName,
        blend: cs.backgroundBlendMode, filter: cs.filter, frameColor: cs.backgroundColor,
        sparkleFilter: getComputedStyle(el, '::before').filter };
    });
    expect(style.background).toContain('linear-gradient');
    expect(style.color.trim()).not.toBe('');
    expect(style.thickness).toBe(['crystal', 'diamond', 'rainbow'].includes(tier) ? '2px' : '4px');
    expect(style.shape.startsWith('polygon(')).toBe(['crystal', 'diamond', 'rainbow'].includes(tier));
    expect(style.shine).toBe('medal-shine');
    expect(style.sparkle).toBe('medal-sparkle');
    expect(style.blend).toBe(id === 'welcome' ? 'normal' : 'multiply');
    expect(style.filter).toBe(id === 'welcome' ? 'none' : 'grayscale(1)');
    if (id !== 'welcome') expect(style.frameColor).toBe('rgb(102, 102, 102)');
    expect(style.sparkleFilter).toBe(id === 'welcome' ? 'none' : 'brightness(0.25)');
    await card.screenshot({ path: testInfo.outputPath(`medal-${tier}.png`) });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('diamond-collection.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const card = page.locator('[data-achievement="pumpkin_flawless"]');
  expect(await card.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  expect(await card.evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('none');
});

test('Gerson Boom unlocks at 360 seconds with 2430 points and survives reload', async ({ page }) => {
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('self.game = DodgeGame(difficulty=difficulty)',
      'self.game = DodgeGame(difficulty=difficulty)\n            self.game.elapsed = 359.95\n            self.game.spawn_in = 1000') });
  });
  await openGame(page);
  await page.locator('[data-game="dodge"]').click();
  await page.locator('[data-difficulty="easy"]').click();
  await expect(page.locator('#profile-score')).toHaveText('3810'); // Includes Shell Endurance at 90 seconds.
  await page.locator('#pause').click();
  await page.locator('#achievements-tab').click();
  const card = page.locator('[data-achievement="dodge_360"]');
  await expect(card).toContainText('Gerson Boom');
  await expect(card).toContainText('rainbow · +2430 points');
  await expect(card).toContainText('Unlocked');
  await page.reload();
  await expect(page.locator('#profile-score')).toHaveText('3810');
});

for (const [difficulty, tier, baseScore, reward] of [['mean', 'silver', 80, 30], ['cruel', 'silver', 110, 30], ['nightmare', 'crystal', 230, 270], ['impossible', 'diamond', 590, 810]])
test(`${difficulty} flawless achievement rejects healed damage and restores the unlocked frame shine`, async ({ page }, testInfo) => {
  let wounded = true;
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    const setup = 'self.game = BossCrush(difficulty)\n            from boss_crush import Projectile\n'
      + (wounded ? '            self.game.hurt()\n            self.game.lives = self.game.max_lives\n' : '')
      + '            self.game.hp = 5\n            self.game.shots = [Projectile(self.game.boss_x, self.game.boss_y, 0, 520)]';
    await route.fulfill({ response, body: (await response.text()).replace('self.game = BossCrush(difficulty)', setup) });
  });
  for (const score of [baseScore, baseScore + reward + 10]) {
    await openGame(page);
    await page.locator('[data-game="boss"]').click();
    await page.locator(`[data-difficulty="${difficulty}"]`).click();
    await expect(page.locator('#overlay-title')).toHaveText('You did it!');
    await expect(page.locator('#profile-score')).toHaveText(String(score));
    await page.locator('#achievements-tab').click();
    const card = page.locator(`[data-achievement="${difficulty === 'impossible' ? 'boss_flawless' : `boss_${difficulty}_flawless`}"]`);
    await expect(page.locator(`[data-achievement="boss_${difficulty}_full"]`)).toContainText('Unlocked');
    await expect(card).toHaveAttribute('data-tier', tier);
    await expect(card).toContainText(wounded ? 'Locked' : 'Unlocked');
    expect(await card.evaluate(el => getComputedStyle(el).backgroundBlendMode)).toBe(wounded ? 'multiply' : 'normal');
    expect(await card.evaluate(el => getComputedStyle(el).filter)).toBe(wounded ? 'grayscale(1)' : 'none');
    await card.screenshot({ path: testInfo.outputPath(`${difficulty}-${wounded ? 'locked' : 'unlocked'}-${tier}.png`) });
    wounded = false;
  }
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#profile-score')).toHaveText(String(baseScore + reward + 10));
});

test('winning real Hangman on the last guess awards Down to the Wire once', async ({ page }) => {
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('random.choice(rules["words"])', '"cat"') });
  });
  await openGame(page);
  for (const [difficulty, wrong] of [['easy', 'bdefghijk'], ['medium', 'bdefgh'], ['hard', 'bdef']]) {
    await page.locator(`[data-difficulty="${difficulty}"]`).click();
    for (const letter of wrong.toUpperCase()) await page.getByRole('button', { name: `Guess ${letter}`, exact: true }).click();
    await expect(page.locator('#metric')).toHaveText('1');
    if (difficulty === 'easy') {
      const data = await page.evaluate(() => JSON.parse(localStorage.getItem('microgame-madness.v1')).achievements);
      expect(data.unlocked.hangman_last_chance).toBeUndefined();
    }
    for (const letter of 'CAT') await page.getByRole('button', { name: `Guess ${letter}`, exact: true }).click();
    await expect(page.locator('#overlay-title')).toHaveText('You did it!');
    await expect(page.locator('#profile-score')).toHaveText(difficulty === 'hard' ? '190' : difficulty === 'medium' ? '150' : '140');
    await page.locator('#overlay-action').click();
  }
  await page.reload();
  await expect(page.locator('#profile-score')).toHaveText('190');
  await page.locator('#achievements-tab').click();
  const card = page.locator('[data-achievement="hangman_last_chance"]');
  await expect(card).toContainText('Down to the Wire');
  await expect(card).toHaveAttribute('data-tier', 'gold');
  await expect(card).toContainText('Unlocked');
});

test('all achievement tiers celebrate immediately, hold confetti four seconds, then fade and clean up', async ({ page }, testInfo) => {
  await openGame(page);
  expect(await page.evaluate(() => pendingAchievementDing)).toBe(true);
  await page.locator('#player').click();
  await expect.poll(() => page.evaluate(() => pendingAchievementDing)).toBe(false);
  await page.evaluate(() => {
    window.awardSounds = [];
    const create = audioContext.createOscillator.bind(audioContext);
    audioContext.createOscillator = () => {
      const oscillator = create();
      window.awardSounds.push(oscillator);
      return oscillator;
    };
  });
  for (const [id, tier, color] of [['play_boss', 'bronze', '#b87545'], ['boss_mean_flawless', 'silver', '#a9bacb'],
    ['cube_pet', 'gold', '#ffd34d'], ['dingdong', 'crystal', '#b67dff'], ['pumpkin_flawless', 'diamond', '#55ddff'],
    ['pumpkin_flawless_5', 'rainbow', '#ff5470'], ['core_flawless', 'empyrorite', '#2cf5a0']]) {
    const soundedImmediately = await page.evaluate(id => {
      const item = Achievements.catalog.find(item => item.id === id);
      const before = window.awardSounds.length;
      updateAchievements(achievementTracker.update(stats => { stats[item.stat] = item.target; }));
      return window.awardSounds.length - before;
    }, id);
    expect(soundedImmediately).toBe(1);
    const layer = page.locator(`.achievement-confetti[data-tier="${tier}"]`);
    await expect(layer.locator('i')).toHaveCount(40);
    expect(await layer.locator('i').first().evaluate(el => el.style.getPropertyValue('--confetti-color'))).toBe(color);
    // Keep the original white shine while checking the actual tier colors.
    const fills = await layer.locator('i').evaluateAll(pieces => pieces.map(piece => {
      const style = getComputedStyle(piece);
      const swatch = document.createElement('span');
      swatch.style.color = piece.style.getPropertyValue('--confetti-color');
      document.body.append(swatch);
      const expected = getComputedStyle(swatch).color;
      swatch.remove();
      return { color: style.backgroundColor, expected, image: style.backgroundImage };
    }));
    if (tier === 'rainbow')
      expect(fills.every(fill => fill.color === fill.expected && fill.image === 'none')).toBe(true);
    else
      expect(fills.every(fill => fill.image.includes(fill.expected) && fill.image.includes('rgba(255, 255, 255, 0.6)'))).toBe(true);
    if (tier === 'diamond') expect([...new Set(fills.map(fill => fill.expected))]).toEqual([
      'rgb(85, 221, 255)', 'rgb(169, 244, 255)', 'rgb(57, 186, 255)',
    ]);
    const opacity = await layer.locator('i').first().evaluate(el => {
      const animation = el.getAnimations().find(animation => animation.animationName === 'confetti-fade');
      animation.pause();
      animation.currentTime = 4000;
      const held = Number(getComputedStyle(el).opacity);
      animation.currentTime = 4500;
      const fading = Number(getComputedStyle(el).opacity);
      animation.currentTime = 0;
      animation.play();
      return { held, fading };
    });
    expect(opacity.held).toBe(1);
    expect(opacity.fading).toBeCloseTo(.5, 2);
  }
  await expect(page.locator('.achievement-confetti')).toHaveCount(7);
  await page.screenshot({ path: testInfo.outputPath('all-tier-confetti.png') });
  await expect(page.locator('#achievement-celebrations')).toHaveCSS('pointer-events', 'none');
  expect(await page.evaluate(() => window.awardSounds.every(osc => osc.type === 'sine' && osc.frequency.value === 1568))).toBe(true);
  await page.evaluate(() => updateAchievements(achievementTracker.secret('cube')));
  expect(await page.evaluate(() => window.awardSounds.length)).toBe(7);
  await expect(page.locator('.achievement-confetti')).toHaveCount(0, { timeout: 6500 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#sound').click();
  await page.locator('[data-difficulty="easy"]').click();
  await expect(page.locator('.achievement-confetti[data-tier="bronze"]')).toBeVisible();
  await expect(page.locator('.achievement-confetti i').first()).toHaveCSS('animation-name', 'none');
  expect(await page.evaluate(() => window.awardSounds.length)).toBe(7);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('five actual clean Boss Crush wins earn crystal and unfinished rounds reset the saved streak', async ({ page }) => {
  let instantWin = true;
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    let body = await response.text();
    if (instantWin) body = body.replace('self.game = BossCrush(difficulty)',
      'self.game = BossCrush(difficulty)\n            from boss_crush import Projectile\n            self.game.hp = 5\n            self.game.shots = [Projectile(self.game.boss_x, self.game.boss_y, 0, 520)]');
    await route.fulfill({ response, body });
  });
  for (const [index, difficulty] of ['mean', 'cruel', 'nightmare', 'impossible', 'mean'].entries()) {
    await openGame(page);
    await page.locator('[data-game="boss"]').click();
    await page.locator(`[data-difficulty="${difficulty}"]`).click();
    await expect(page.locator('#overlay-title')).toHaveText('You did it!');
    const data = await page.evaluate(() => JSON.parse(localStorage.getItem('microgame-madness.v1')).achievements);
    expect(data.stats.bossCleanStreak).toBe(index + 1);
    expect(Boolean(data.unlocked.boss_clean_streak)).toBe(index === 4);
  }
  await page.locator('#achievements-tab').click();
  const card = page.locator('[data-achievement="boss_clean_streak"]');
  await expect(card).toHaveAttribute('data-tier', 'crystal');
  await expect(card).toContainText('Unlocked');
  await expect(page.locator('#profile-score')).toHaveText('2400');
  instantWin = false;
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await page.locator('[data-game="boss"]').click();
  await page.locator('[data-difficulty="mean"]').click();
  await page.locator('#pause').click();
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  expect(await page.evaluate(() => achievementTracker.data.stats.bossCleanStreak)).toBe(0);
  await expect(page.locator('#profile-score')).toHaveText('2400');
  // Exiting a different unfinished run must persist the reset immediately too.
  await page.evaluate(() => { achievementTracker.data.stats.bossCleanStreak = 4; persist(); });
  await page.locator('[data-game="boss"]').click();
  await page.locator('[data-difficulty="mean"]').click();
  await page.locator('#pause').click();
  await page.locator('#exit').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('microgame-madness.v1')).achievements.stats.bossCleanStreak)).toBe(0);
});

test('retiered profiles show corrected points and Rainbow awards have six-color celebrations', async ({ page }, testInfo) => {
  const date = '2026-10-31T12:00:00.000Z';
  await page.addInitScript(date => {
    if (localStorage.getItem('microgame-madness.v1')) return;
    const unlocked = Object.fromEntries(['welcome', 'boss_impossible', 'boss_nightmare_flawless', 'pumpkin_phase2', 'dodge_360'].map(id => [id, date]));
    localStorage.setItem('microgame-madness.v1', JSON.stringify({ player: 'Returning Player', scores: {}, achievements: { stats: { visits: 1 }, unlocked, score: 1090 } }));
  }, date);
  await openGame(page);
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#profile-score')).toHaveText('3790');
  await expect(page.locator('#achievement-toast')).toBeHidden();
  await expect(page.locator('.achievement-confetti')).toHaveCount(0);
  await page.locator('#achievements-tab').click();
  await expect(page.locator('.achievement-legend')).toContainText('Diamond +810 · Rainbow +2430');
  for (const [id, tier] of [['boss_impossible', 'crystal'], ['boss_nightmare_flawless', 'crystal'], ['pumpkin_phase2', 'diamond'], ['dodge_360', 'rainbow']]) {
    await expect(page.locator(`[data-achievement="${id}"]`)).toHaveAttribute('data-tier', tier);
    await expect(page.locator(`[data-achievement="${id}"]`)).toContainText('Unlocked');
  }
  const rainbow = page.locator('[data-achievement="dodge_360"]');
  await rainbow.scrollIntoViewIfNeeded();
  await rainbow.screenshot({ path: testInfo.outputPath('rainbow-medal.png') });
  expect(await page.evaluate(() => achievementTracker.data.unlocked.dodge_360)).toBe(date);
  // Import the near-threshold fixture through the same journal as restored progress.
  await page.evaluate(async () => {
    await accountApp.chain;
    const profile = structuredClone(saved);
    profile.achievements.stats.pumpkinFlawlessWins = 4;
    await accountApp.controller.importProfile(profile, { baseline: true });
    accountApp.applyCurrent();
  });
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    const setup = 'self.game = PumpkinKing(difficulty=difficulty)\n            from boss_crush import Projectile\n            self.game.begin_attack(0)\n            self.game.elapsed = 100\n            self.game.hp = 5\n            self.game.shots = [Projectile(self.game.boss_x, self.game.boss_y, 0, 520)]';
    await route.fulfill({ response, body: (await response.text()).replace('self.game = PumpkinKing(difficulty=difficulty)', setup) });
  });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await page.locator('[data-game="pumpkin"]').click();
  await page.locator('[data-difficulty="baby"]').click();
  await expect(page.locator('#overlay-title')).toHaveText('You did it!');
  await expect(page.locator('#profile-score')).toHaveText('9770');
  const confetti = page.locator('.achievement-confetti[data-tier="rainbow"]');
  await expect(confetti.locator('i')).toHaveCount(40);
  expect(await confetti.evaluate(el => new Set([...el.children].map(piece => piece.style.getPropertyValue('--confetti-color'))).size)).toBe(6);
  await page.screenshot({ path: testInfo.outputPath('rainbow-celebration.png') });
  for (let i = 0; i < 8 && !(await page.locator('#achievement-toast').innerText()).includes('Sovereign of Suffering'); i++)
    await page.getByRole('button', { name: 'Dismiss achievement notification' }).first().click();
  await expect(page.locator('#achievement-toast')).toContainText('rainbow achievement · +2430 points');
  await page.locator('#achievement-toast').screenshot({ path: testInfo.outputPath('rainbow-toast.png') });
  await page.locator('#achievements-tab').click();
  await expect(page.locator('[data-achievement="pumpkin_flawless_5"]')).toHaveAttribute('data-tier', 'rainbow');
  await expect(page.locator('[data-achievement="pumpkin_flawless_5"]')).toContainText('Unlocked');
  await page.reload();
  await expect(page.locator('#profile-score')).toHaveText('9770');
  await expect(page.locator('#achievement-toast')).toBeHidden();
});


