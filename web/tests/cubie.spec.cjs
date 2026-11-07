const { test, expect, openGame } = require('./fixtures/game.cjs');

// Keep unrelated score assertions independent of the randomly selected song.
test.use({ deterministicMusic: true });

test('Cubie pets persist across reloads and the 100th pet awards crystal once', async ({ page }, testInfo) => {
  await openGame(page);
  await page.locator('#sound').click();
  const cube = page.getByRole('button', { name: 'Pet Cubie' });
  if (testInfo.project.name === 'mobile') await cube.tap({ force: true });
  else await cube.click({ force: true });
  for (let i = 1; i < 49; i++) await cube.press('Enter');
  await page.locator('#achievements-tab').click();
  const card = page.locator('[data-achievement="cube_pet_100"]');
  await expect(card).toContainText('Locked · 49 / 100');
  await expect(page.locator('#profile-score')).toHaveText('130');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await page.locator('#sound').click();
  for (let i = 49; i < 99; i++) await cube.press('Space');
  await page.locator('#achievements-tab').click();
  await expect(card).toContainText('Locked · 99 / 100');
  await expect(page.locator('#profile-score')).toHaveText('160');
  await cube.press('Enter');
  await expect(card).toHaveAttribute('data-tier', 'crystal');
  await expect(card).toHaveClass(/earned/);
  await expect(card).toContainText("Cubie's Best Friend");
  await expect(card).toContainText('Unlocked');
  await expect(page.locator('#profile-score')).toHaveText('430');
  await expect(page.locator('#achievement-toast')).toContainText("Cubie's Best Friend");
  await expect(page.locator('#achievement-toast')).toContainText('crystal achievement · +270 points');
  for (let i = 0; i < 5; i++) await cube.press('Enter');
  await expect(page.locator('#profile-score')).toHaveText('430');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await page.locator('#achievements-tab').click();
  await expect(card).toHaveClass(/earned/);
  await expect(page.locator('#profile-score')).toHaveText('430');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('microgame-madness.v1')).achievements.stats.cubePets)).toBe(105);
  await expect(page.locator('#achievement-toast')).toBeHidden();
});

test('secret achievements persist, and the cube blushes and squeaks with mouse, touch, and keyboard', async ({ page }, testInfo) => {
  await openGame(page);
  const cube = page.getByRole('button', { name: 'Pet Cubie' });
  await expect(cube).toBeVisible();
  await page.locator('#player').click();
  await page.evaluate(() => {
    window.squeaks = [];
    const create = audioContext.createOscillator.bind(audioContext);
    audioContext.createOscillator = () => {
      const oscillator = create();
      window.squeaks.push(oscillator);
      return oscillator;
    };
  });
  // The cube keeps floating, so activate its current position without waiting
  // for the animated bounding box to become stationary.
  if (testInfo.project.name === 'mobile') await cube.tap({ force: true });
  else await cube.click({ force: true });
  await expect(cube).toHaveClass(/blushing/);
  await expect.poll(() => cube.evaluate(el => Number(getComputedStyle(el, '::before').opacity))).toBeGreaterThan(.9);
  expect(await page.evaluate(() => window.squeaks.map(osc => osc.type))).toEqual(['sine', 'sine']);
  await expect(page.locator('#profile-score')).toHaveText('100');
  await cube.screenshot({ path: testInfo.outputPath('blushing-cube.png'), animations: 'disabled' });
  await expect(cube).not.toHaveClass(/blushing/);
  await cube.press('Enter');
  await expect(cube).toHaveClass(/blushing/);
  await expect(page.locator('#profile-score')).toHaveText('100');
  await page.locator('#sound').click();
  await cube.press('Space');
  expect(await page.evaluate(() => window.squeaks.length)).toBe(3);
  await page.locator('#player').fill('DINGDONG');
  await expect(page.locator('#profile-score')).toHaveText('370');
  await page.locator('#name-surprise').waitFor({ state: 'hidden' });
  await page.locator('#achievements-tab').click();
  for (const [id, tier, title, description] of [
    ['dingdong', 'crystal', 'DINGDONG', 'WHO YOU ARE.'],
    ['cube_pet', 'gold', 'Awwwwww!', 'Make Cubie blush and squeak.'],
  ]) {
    const card = page.locator(`[data-achievement="${id}"]`);
    await expect(card).toHaveAttribute('data-tier', tier);
    await expect(card).toContainText(title);
    await expect(card).toContainText(description);
    await expect(card).toContainText('Unlocked');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#profile-score')).toHaveText('370');
  await cube.click({ force: true });
  await page.locator('#player').fill('DINGDONG');
  await expect(page.locator('#profile-score')).toHaveText('370');
});

test('Cubie has moving sparkles and orbits with reduced-motion support', async ({ page }, testInfo) => {
  await openGame(page);
  await expect(page.getByRole('button', { name: 'Pet Cubie' })).toBeVisible();
  await expect(page.locator('.art-label')).toContainText('CUBIE');
  for (const selector of ['.orbit-one', '.orbit-two', '.orbit-one .orbit-particle', '.orbit-two .orbit-particle', '.spark.s1', '.spark.s2']) {
    const decoration = page.locator(selector);
    await expect(decoration).toBeVisible();
    const property = selector.includes('orbit-particle') ? 'strokeDashoffset' : 'transform';
    const before = await decoration.evaluate((el, p) => getComputedStyle(el)[p], property);
    await expect.poll(() => decoration.evaluate((el, p) => getComputedStyle(el)[p], property)).not.toBe(before);
  }
  const orbits = await page.locator('.orbit').evaluateAll(els => els.map(el => {
    const track = el.querySelector('.orbit-track'), dot = el.querySelector('.orbit-particle');
    return { centered: ['cx','cy','rx','ry'].every(a => track.getAttribute(a) === dot.getAttribute(a)),
      duration: parseFloat(getComputedStyle(dot).animationDuration), direction: getComputedStyle(dot).animationDirection,
      ringDuration: parseFloat(getComputedStyle(el).animationDuration), ringDirection: getComputedStyle(el).animationDirection };
  }));
  expect(orbits.every(o => o.centered)).toBe(true);
  expect(orbits[0].duration).toBeCloseTo(18 / 1.1, 4);
  expect(orbits[1].duration).toBeCloseTo(24 / 1.1, 4);
  expect(orbits.map(o => o.direction)).toEqual(['normal', 'reverse']);
  expect(orbits.map(o => o.ringDirection)).toEqual(['normal', 'reverse']);
  expect(orbits.every(o => o.ringDuration === o.duration)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.hero-art').screenshot({ path: testInfo.outputPath('cubie.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const selector of ['#cube', '.orbit-one', '.orbit-two', '.orbit-one .orbit-particle', '.orbit-two .orbit-particle', '.spark.s1', '.spark.s2'])
    expect(await page.locator(selector).evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.locator('[data-game="boss"]').click();
  await page.locator('[data-difficulty="impossible"]').click();
  await page.evaluate(() => { active = false; });
  await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath('impossible-face.png') });
});


test('Cubie hints after twenty completed minigames, ignores exits, and remembers dismissal', async ({ page }, testInfo) => {
  await openGame(page);
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('microgame-madness.v1') || '{}');
    saved.minigamesCompleted = 18;
    saved.minigamesStarted = 20;
    saved.cubieHintShown = false;
    localStorage.setItem('microgame-madness.v1', JSON.stringify(saved));
  });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  const dialog = page.locator('#cubie-hint');
  // Abandoning even a scored Key Rush run must not count as completion.
  await page.locator('[data-game="keyboard"]').click();
  await page.locator('#difficulty-choices button').first().click();
  await page.locator('#exit').click();
  expect(await page.evaluate(() => saved.minigamesCompleted)).toBe(18);
  await page.locator('[data-game="hangman"]').click();
  await page.locator('[data-difficulty="easy"]').click();
  await expect(dialog).not.toBeVisible();
  // Complete a loss, then verify that completion survives a reload.
  await page.evaluate(() => {
    for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
      if (!snapshot.over && !snapshot.word.toLowerCase().includes(letter)) guess(letter);
    }
  });
  expect(await page.evaluate(() => saved.minigamesCompleted)).toBe(19);
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await page.locator('[data-game="hangman"]').click();
  await page.locator('[data-difficulty="easy"]').click();
  await expect(dialog).not.toBeVisible();
  // The next finished round is completion twenty; repeated renders must not count twice.
  await page.evaluate(() => {
    for (const letter of 'abcdefghijklmnopqrstuvwxyz') if (!snapshot.over) guess(letter);
    render();
    render();
  });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('GRAVITRON');
  await expect(dialog).toContainText('finished 20 minigames');
  await expect(page.locator('#cubie-hint-okay')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('cubie-hint.png') });
  await page.locator('#cubie-hint-okay').click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await page.locator('[data-game="hangman"]').click();
  await page.locator('[data-difficulty="easy"]').click();
  await page.evaluate(() => {
    for (const letter of 'abcdefghijklmnopqrstuvwxyz') if (!snapshot.over) guess(letter);
  });
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => saved.cubieHintShown)).toBe(true);
});

