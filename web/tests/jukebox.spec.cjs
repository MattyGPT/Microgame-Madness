const { leaveFullscreen, settleFullscreen } = require('./fixtures/game.cjs');
const { test, expect } = require('./fixtures/game.cjs');
const journeySongs = ['compass_rose', 'jellyfish_jam', 'kite_runner', 'sands_of_time',
  'tape_deck_daydream', 'mushroom_meadow', 'last_train_to_neon', 'snowglobe_shuffle',
  'anchor_point', 'butterfly_byte'];

test('jukebox picks songs, pauses, mutes, stops, and restores game music', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await leaveFullscreen(page);
  await page.locator('[data-game="jukebox"]').click();
  const before = await page.evaluate(() => JSON.stringify([saved.scores, saved.achievements], (key, value) => key === "websiteSeconds" ? undefined : value));
  await expect(page.locator('#game-title')).toHaveText('Arcade Jukebox');
  await expect(page.locator('[data-difficulty]')).toHaveCount(await page.evaluate(() => ArcadeMusic.jukeboxTracks.length));
  const art = await page.evaluate(ids => {
    const cards = [...document.querySelectorAll('.song-card')];
    return cards.map(card => ({ fresh: ids.includes(card.dataset.difficulty),
      motif: card.dataset.motif, path: card.querySelector('.song-art path').getAttribute('d'),
      color: card.style.getPropertyValue('--song-color') }));
  }, journeySongs);
  const fresh = art.filter(card => card.fresh), previous = art.filter(card => !card.fresh);
  expect(fresh).toHaveLength(10);
  expect(new Set(fresh.map(card => card.motif)).size).toBe(10);
  expect(new Set(fresh.map(card => card.color)).size).toBe(10);
  for (const card of fresh) {
    expect(card.path.length).toBeGreaterThan(30);
    expect(previous.some(old => old.motif === card.motif || old.path === card.path)).toBe(false);
  }
  await page.locator('#difficulty-choices').screenshot({ path: testInfo.outputPath('song-cards.png') });
  for (const id of ['arcade', 'pumpkin', 'singularity', 'boss_mean', 'rock_afterburn', 'starlight_soda', 'aurora_afterparty', ...journeySongs]) {
    await page.locator(`[data-difficulty="${id}"]`).click();
    await expect.poll(() => page.evaluate(() => musicPlayer.track)).toBe(id);
    expect(await page.evaluate(() => musicPlayer.current.source.loop)).toBe(true);
  }
  await page.locator('#jukebox-pause').click();
  await expect(page.locator('#jukebox-status')).toContainText('Paused');
  const offset = await page.evaluate(() => musicPlayer.offset);
  expect(await page.evaluate(() => musicPlayer.current)).toBeNull();
  await page.locator('#jukebox-pause').click();
  expect(await page.evaluate(() => musicPlayer.current.offset)).toBe(offset);
  await leaveFullscreen(page);
  await page.locator('#sound').click();
  await expect(page.locator('#jukebox-status')).toContainText('Muted');
  expect(await page.evaluate(() => musicPlayer.current)).toBeNull();
  await leaveFullscreen(page);
  await page.locator('#sound').click();
  await expect(page.locator('#jukebox-status')).toContainText('Now playing');
  await page.locator('#jukebox-controls').screenshot({ path: testInfo.outputPath('jukebox-player.png') });
  await page.locator('#jukebox-stop').click();
  expect(await page.evaluate(() => musicPlayer.current)).toBeNull();
  await page.locator('[data-difficulty="pumpkin"]').click();
  await settleFullscreen(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('#jukebox-pause')).toBeDisabled();
  expect(await page.evaluate(() => JSON.stringify([saved.scores, saved.achievements], (key, value) => key === "websiteSeconds" ? undefined : value))).toBe(before);
  await leaveFullscreen(page);
  await page.locator('[data-game="hangman"]').click();
  await expect(page.locator('#jukebox-controls')).toBeHidden();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
  await page.locator('[data-difficulty="easy"]').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('hangman');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
