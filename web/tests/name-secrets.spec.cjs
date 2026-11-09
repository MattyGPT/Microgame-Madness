const { test, expect, openGame } = require('./fixtures/game.cjs');

// Keep unrelated score assertions independent of the randomly selected song.
test.use({ deterministicMusic: true });

test('DINGDONG turns the screen red for four seconds and resumes the same music', async ({ page }) => {
  await openGame(page);
  await page.locator('#player').click();
  await expect.poll(() => page.evaluate(() => musicPlayer?.current !== null && audioContext.currentTime > .1)).toBe(true);
  await page.locator('#player').fill('DINGDON');
  await expect(page.locator('#name-surprise')).toBeHidden();
  await page.evaluate(() => {
    window.nameEffectTimes = [];
    new MutationObserver(() => window.nameEffectTimes.push(performance.now()))
      .observe(document.getElementById('name-surprise'), { attributes: true, attributeFilter: ['hidden'] });
  });
  await page.locator('#player').fill('DINGDONG');
  await expect(page.locator('#name-surprise')).toBeVisible();
  await expect(page.locator('#name-surprise')).toHaveCSS('background-color', 'rgba(210, 0, 0, 0.72)');
  await expect(page.locator('#name-surprise')).toHaveCSS('pointer-events', 'none');
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
  const offset = await page.evaluate(() => musicPlayer.offset);
  expect(offset).toBeGreaterThan(0);
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  // Repeated matching input events must not restart or prolong the effect.
  await page.locator('#player').dispatchEvent('input');
  await expect(page.locator('#name-surprise')).toBeHidden({ timeout: 6500 });
  const times = await page.evaluate(() => window.nameEffectTimes);
  expect(times).toHaveLength(2);
  expect(times[1] - times[0]).toBeGreaterThanOrEqual(3900);
  expect(times[1] - times[0]).toBeLessThan(6000);
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  expect(await page.evaluate(() => musicPlayer.current.offset)).toBeCloseTo(offset, 3);
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
});

test('DINGDONG can repeat, does not block play, and preserves mute and pause choices', async ({ page }) => {
  await openGame(page);
  await page.locator('#sound').click();
  await page.locator('#player').fill('dingdong');
  await expect(page.locator('#name-surprise')).toBeVisible();
  await page.locator('[data-game="pumpkin"]').click();
  await page.locator('[data-difficulty="baby"]').click();
  await page.locator('#pause').click();
  await expect(page.locator('#name-surprise')).toBeHidden({ timeout: 6500 });
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => typeof audioContext)).toBe('undefined');
  await page.locator('#sound').click();
  expect(await page.evaluate(() => musicPlayer.current)).toBe(null);
  await page.locator('#overlay-action').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('pumpkin');
  await page.locator('#exit').click();
  await page.locator('#player').fill('Player');
  await page.locator('#player').fill('DINGDONG');
  await expect(page.locator('#name-surprise')).toBeVisible();
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
  await page.locator('#sound').click();
  await expect(page.locator('#name-surprise')).toBeHidden({ timeout: 6500 });
  expect(await page.evaluate(() => musicPlayer.current)).toBe(null);
  await page.locator('#sound').click();
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
});

test('Gaster reloads once, waits five seconds, and reveals the redacted award only after audio ends', async ({ page }, testInfo) => {
  await openGame(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const card = page.locator('[data-achievement="waste_of_time"]');
  await page.locator('#achievements-tab').click();
  await expect(card).toHaveClass(/redacted/);
  await expect(card).toHaveAttribute('aria-label', 'Redacted achievement');
  await expect(card).toHaveText('[REDACTED]');
  await expect(card.locator('progress, .achievement-tier')).toHaveCount(0);
  expect(await card.getAttribute('data-tier')).toBeNull();
  await expect(page.locator('.achievement-legend')).not.toContainText(/black/i);
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: testInfo.outputPath('redacted-achievement.png') });
  await page.locator('#player').click();
  const reloaded = page.waitForEvent('load');
  await page.locator('#player').fill('  gAsTeR  ');
  await reloaded;
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  expect(await page.evaluate(() => performance.getEntriesByType('navigation')[0].type)).toBe('reload');
  expect(await page.evaluate(() => history.state?.gasterSequence)).toBeUndefined();
  await expect(page.locator('#profile-score')).toHaveText('10');
  await expect(page.locator('#achievement-toast')).toBeHidden();
  await expect(page.locator('#gaster-blackout')).toBeHidden();
  await page.evaluate(() => {
    window.gasterTimings = [];
    new MutationObserver(() => window.gasterTimings.push(performance.now()))
      .observe(document.querySelector('#gaster-blackout'), { attributes: true, attributeFilter: ['hidden'] });
    window.secretProbe = audioContext.createAnalyser();
    audioMaster.connect(window.secretProbe);
  });
  await expect.poll(() => page.evaluate(() => audioContext.state)).toBe('running');
  await expect(page.locator('#gaster-blackout')).toBeVisible({ timeout: 6500 });
  const blackout = await page.locator('#gaster-blackout').evaluate(el => ({
    background: getComputedStyle(el).backgroundColor,
    width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height,
    viewportWidth: innerWidth, viewportHeight: innerHeight,
    inert: document.body.inert,
  }));
  expect(blackout.background).toBe('rgb(0, 0, 0)');
  expect(blackout.width).toBe(blackout.viewportWidth);
  expect(blackout.height).toBe(blackout.viewportHeight);
  expect(blackout.inert).toBe(true);
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
  await expect.poll(() => page.evaluate(() => {
    const data = new Float32Array(window.secretProbe.fftSize);
    window.secretProbe.getFloatTimeDomainData(data);
    return Math.max(...data.map(Math.abs));
  })).toBeGreaterThan(.05);
  await expect(card).toHaveClass(/redacted/);
  await expect(page.locator('#profile-score')).toHaveText('10');
  await page.screenshot({ path: testInfo.outputPath('gaster-blackout.png') });
  await expect(page.locator('#gaster-blackout')).toBeHidden({ timeout: 8500 });
  const timings = await page.evaluate(() => window.gasterTimings);
  expect(timings[0]).toBeGreaterThanOrEqual(4900);
  expect(timings[0]).toBeLessThan(6000);
  expect(timings[1] - timings[0]).toBeGreaterThan(6500);
  expect(timings[1] - timings[0]).toBeLessThan(7300);
  expect(await page.evaluate(() => document.body.inert)).toBe(false);
  await expect(page.locator('#profile-score')).toHaveText('676');
  await expect(page.locator('#achievement-toast')).toContainText('WASTE OF TIME');
  await expect(page.locator('#achievement-toast')).toContainText('+666 points');
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  await page.locator('#achievements-tab').click();
  await expect(card).toHaveClass(/earned/);
  await expect(card).not.toHaveClass(/redacted/);
  await expect(card).toHaveAttribute('data-tier', 'black');
  await expect(card).toContainText('black · +666 points');
  await expect(card.locator('.wingdings')).toHaveText('💣︎✡︎ ✌︎☼💣︎ 💣︎✡︎ ✌︎☼💣︎ 💣︎✡︎ ✌︎☼💣︎');
  await expect(page.locator('.achievement-legend')).not.toContainText(/black/i);
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: testInfo.outputPath('waste-of-time.png') });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#profile-score')).toHaveText('676');
  await expect(page.locator('#achievement-toast')).toBeHidden();
  await page.waitForTimeout(5500);
  await expect(page.locator('#gaster-blackout')).toBeHidden();
  await page.locator('#achievements-tab').click();
  await expect(card).toHaveClass(/earned/);
  expect(errors).toEqual([]);
});

test('Gaster respects mute and blocked storage and freezes a running game', async ({ page }) => {
  await page.addInitScript(() => {
    for (const property of ['localStorage', 'sessionStorage'])
      Object.defineProperty(window, property, { get() { throw new Error('Storage blocked'); } });
  });
  await openGame(page);
  await page.locator('#welcome-close').click();
  await page.locator('#sound').click();
  const reloaded = page.waitForEvent('load');
  await page.locator('#player').fill('gaster');
  await reloaded;
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await page.locator('#welcome-close').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => {
    window.gasterGameRemaining = [];
    new MutationObserver(() => window.gasterGameRemaining.push(snapshot.remaining))
      .observe(document.querySelector('#gaster-blackout'), { attributes: true, attributeFilter: ['hidden'] });
  });
  await page.waitForTimeout(await page.evaluate(() => Math.max(0, 4100 - performance.now())));
  await page.locator('[data-game="keyboard"]').click();
  await page.locator('[data-difficulty="progressive"]').click();
  await expect(page.locator('#gaster-blackout')).toBeVisible({ timeout: 2500 });
  const remaining = await page.evaluate(() => snapshot.remaining);
  expect(remaining).toBeGreaterThan(.5);
  await expect(page.locator('#gaster-blackout')).toBeHidden({ timeout: 7500 });
  await expect(page.locator('#profile-score')).toHaveText('686');
  expect(await page.evaluate(() => typeof audioContext)).toBe('undefined');
  const frozen = await page.evaluate(() => window.gasterGameRemaining);
  expect(frozen).toHaveLength(2);
  expect(frozen[1]).toBe(frozen[0]);
  expect(await page.evaluate(() => snapshot.over)).toBe(false);
  await page.locator('#exit').click();
});

test('Gaster recovers from unavailable audio and interrupted sequences cannot unlock the award', async ({ page }) => {
  await openGame(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.AudioContext = class { constructor() { throw new Error('Audio disabled'); } };
  });
  const reloaded = page.waitForEvent('load');
  await page.locator('#player').fill('GASTER');
  await reloaded;
  await expect(page.locator('#sound')).toHaveText('Sound on');
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#gaster-blackout')).toBeVisible({ timeout: 6500 });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#profile-score')).toHaveText('10');
  await page.waitForTimeout(5500);
  await expect(page.locator('#gaster-blackout')).toBeHidden();
  await page.locator('#player').fill('Player');
  const secondReload = page.waitForEvent('load');
  await page.locator('#player').fill('gaster');
  await secondReload;
  await expect(page.locator('#gaster-blackout')).toBeVisible({ timeout: 6500 });
  await expect(page.locator('#gaster-blackout')).toBeHidden({ timeout: 7500 });
  await expect(page.locator('#profile-score')).toHaveText('676');
  expect(errors).toEqual([]);
});

test('ROCKNROY randomly selects all five original songs, returns to arcade, and awards Game Tester once', async ({ page }) => {
  await openGame(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.locator('#player').click();
  await expect(page.locator('#achievement-toast')).toBeHidden();
  const tracks = await page.evaluate(() => ArcadeMusic.rockTracks.map(track => track.id));
  expect(tracks).toHaveLength(5);
  for (let i = 0; i < tracks.length; i++) {
    if (i) await page.locator('#player').fill('Player');
    await page.evaluate(i => {
      window.originalRockRandom = Math.random;
      Math.random = () => (i + .5) / 5;
    }, i);
    await page.locator('#player').fill('  rOcKnRoY  ');
    await page.evaluate(() => { Math.random = window.originalRockRandom; });
    await expect.poll(() => page.evaluate(() => musicPlayer.theme)).toBe(tracks[i]);
    expect(await page.evaluate(() => musicPlayer.current.source.loop)).toBe(false);
    await expect(page.locator('#profile-score')).toHaveText('2440');
    await expect(page.locator('#name-surprise')).toBeHidden();
    if (!i) {
      await expect(page.locator('#achievement-toast')).toContainText('Game Tester');
      await expect(page.locator('#achievement-toast')).toContainText('rainbow achievement · +2430 points');
      await expect(page.locator('.achievement-confetti[data-tier="rainbow"] i')).toHaveCount(40);
      await page.evaluate(() => {
        window.rockProbe = audioContext.createAnalyser();
        audioMaster.connect(window.rockProbe);
      });
      await expect.poll(() => page.evaluate(() => {
        const samples = new Float32Array(window.rockProbe.fftSize);
        window.rockProbe.getFloatTimeDomainData(samples);
        return Math.max(...samples.map(Math.abs));
      })).toBeGreaterThan(.01);
    }
    // Exercise the real source's natural end event without waiting a minute
    // per song. No manual onended callback or replacement audio buffer.
    await page.evaluate(() => musicPlayer.current.source.playbackRate.setValueAtTime(100, audioContext.currentTime));
    await expect.poll(() => page.evaluate(() => musicPlayer.oneShot)).toBe(null);
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
    expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
    expect(await page.evaluate(() => musicPlayer.current.source.loop)).toBe(false);
  }
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#profile-score')).toHaveText('2440');
  await expect(page.locator('#achievement-toast')).toBeHidden();
  await page.locator('#achievements-tab').click();
  const card = page.locator('[data-achievement="name_rocknroy"]');
  await expect(card).toHaveClass(/earned/);
  await expect(card).toHaveAttribute('data-tier', 'rainbow');
  await expect(card).toContainText('Game Tester');
  expect(errors).toEqual([]);
});

test('ROCKNROY respects mute, visibility and game pause, and can replace a name effect', async ({ page }) => {
  await openGame(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.locator('#sound').click();
  await page.locator('#player').fill('ROCKNROY');
  await expect(page.locator('#profile-score')).toHaveText('2440');
  expect(await page.evaluate(() => typeof audioContext)).toBe('undefined');
  await page.locator('#sound').click();
  const song = await page.evaluate(() => musicPlayer.oneShot);
  expect(song).toMatch(/^rock_/);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
  const offset = await page.evaluate(() => musicPlayer.offset);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => musicPlayer.current.offset)).toBe(offset);
  expect(await page.evaluate(() => musicPlayer.oneShot)).toBe(song);
  await page.locator('#sound').click();
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
  await page.locator('#sound').click();
  expect(await page.evaluate(() => musicPlayer.oneShot)).toBe(song);
  await page.locator('#player').fill('BOO');
  await expect(page.locator('#name-surprise')).toBeVisible();
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
  await page.locator('#player').fill('ROCKNROY');
  await expect(page.locator('#name-surprise')).toBeHidden();
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  await page.locator('[data-game="pumpkin"]').click();
  await page.locator('[data-difficulty="baby"]').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toMatch(/^rock_/);
  await page.locator('#pause').click();
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
  await page.locator('#pause').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toMatch(/^rock_/);
  await page.locator('#exit').click();
  await page.evaluate(() => musicPlayer.current.source.playbackRate.setValueAtTime(100, audioContext.currentTime));
  await expect.poll(() => page.evaluate(() => musicPlayer.theme)).toBe('arcade');
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  expect(errors).toEqual([]);
});

test('Game Tester still unlocks when browser audio is unavailable', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.AudioContext = class { constructor() { throw new Error('Audio disabled'); } };
  });
  await openGame(page);
  await page.locator('#player').fill('ROCKNROY');
  await expect(page.locator('#profile-score')).toHaveText('2440');
  await expect(page.locator('#sound')).toHaveText('Sound on');
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#name-surprise')).toBeHidden();
  expect(errors).toEqual([]);
});

test('new name secrets replace effects cleanly and award once across reloads', async ({ page }, testInfo) => {
  await openGame(page);
  await page.locator('#player').click();
  for (const [name, secret, message, score] of [
    ['  cUbIe  ', 'cubie', 'Hi, I’m Cubie!', '100'],
    ['BOO', 'boo', 'BOO!', '190'],
    ['starlight', 'starlight', 'You’re made of starlight.', '460'],
  ]) {
    await page.locator('#player').fill(name);
    await expect(page.locator('#name-surprise')).toHaveAttribute('data-secret', secret);
    await expect(page.locator('#name-surprise')).toContainText(message);
    await expect(page.locator('#name-surprise')).toBeVisible();
    await expect(page.locator('#profile-score')).toHaveText(score);
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
    if (secret === 'cubie') await expect(page.locator('#cube')).toHaveClass(/blushing/);
  }
  await page.screenshot({ path: testInfo.outputPath('starlight-secret.png') });
  await expect(page.locator('#name-surprise')).toBeHidden({ timeout: 6500 });
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#profile-score')).toHaveText('460');
  await page.locator('#sound').click();
  for (const name of ['CUBIE', 'BOO', 'STARLIGHT']) await page.locator('#player').fill(name);
  await expect(page.locator('#profile-score')).toHaveText('460');
  await expect(page.locator('#name-surprise')).toBeHidden({ timeout: 6500 });
  expect(await page.evaluate(() => typeof audioContext)).toBe('undefined');
});

test("ROCKNROY and The King's Wrath work together and restore the boss theme", async ({ page }) => {
  await openGame(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.locator('#player').click();
  await page.locator('#player').fill('ROCKNROY');
  await expect(page.locator('#profile-score')).toHaveText('2440');
  await page.locator('[data-game="wrath"]').click();
  await expect(page.locator('#difficulty-choices button')).toHaveCount(8);
  await page.locator('[data-difficulty="color_memory"]').click();
  await expect(page.locator('#game-canvas')).toBeVisible();
  expect(await page.evaluate(() => snapshot.mode)).toBe('wrath');
  expect(await page.evaluate(() => musicPlayer.theme)).toMatch(/^rock_/);
  await page.evaluate(() => musicPlayer.current.source.playbackRate.setValueAtTime(100, audioContext.currentTime));
  await expect.poll(() => page.evaluate(() => musicPlayer.theme)).toBe('pumpkin');
  expect(await page.evaluate(() => musicPlayer.current.source.loop)).toBe(true);
  expect(await page.evaluate(() => achievementTracker.data.unlocked.name_rocknroy)).toBeTruthy();
  await page.locator('#exit').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
  await expect(page.locator('#difficulty-choices button')).toHaveCount(8);
  expect(errors).toEqual([]);
});

test('three new arcade names unlock through name entry and persist', async ({ page }) => {
  await openGame(page);
  for (const [name, id, title] of [
    ['  PiXeL  ', 'name_pixel', 'Pixel Perfect'],
    ['1uP', 'name_1up', 'Extra Life Energy'],
    ['High Score', 'name_high_score', 'Name on the Leaderboard'],
  ]) {
    await page.locator('#player').fill(name);
    await expect(page.locator('#name-surprise')).toBeVisible();
    await expect(page.locator('#achievement-toast')).toContainText(title);
    expect(await page.evaluate(id => !!achievementTracker.data.unlocked[id], id)).toBe(true);
  }
  await expect(page.locator('#profile-score')).toHaveText('460');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await page.locator('#achievements-tab').click();
  for (const id of ['name_pixel', 'name_1up', 'name_high_score'])
    await expect(page.locator(`[data-achievement="${id}"]`)).toContainText('Unlocked');
  await page.locator('#player').fill('PIXEL');
  await expect(page.locator('#profile-score')).toHaveText('460');
  await expect(page.locator('#achievement-toast')).toBeHidden();
});

