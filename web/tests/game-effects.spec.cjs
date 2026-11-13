const { leaveFullscreen } = require('./fixtures/game.cjs');
const { test, expect, openGame } = require('./fixtures/game.cjs');

// Keep unrelated score assertions independent of the randomly selected song.
test.use({ deterministicMusic: true });

test('mascot floats and blinks, and every boss mode flashes only for damage', async ({ page }) => {
  await openGame(page);
  const face = page.locator('#cube');
  expect(await face.evaluate(el => getComputedStyle(el).animationName)).toBe('mascot-float');
  expect(await face.locator('i').first().evaluate(el => getComputedStyle(el).animationName)).toBe('mascot-blink');
  const poses = await face.evaluate(el => {
    const float = el.getAnimations()[0], blink = el.querySelector('i').getAnimations()[0];
    float.pause(); blink.pause();
    float.currentTime = 0; blink.currentTime = 0;
    const normal = [getComputedStyle(el).transform, getComputedStyle(el.querySelector('i')).transform];
    float.currentTime = 1900; blink.currentTime = 4512;
    return { normal, animated: [getComputedStyle(el).transform, getComputedStyle(el.querySelector('i')).transform] };
  });
  expect(poses.animated[0]).not.toBe(poses.normal[0]);
  expect(poses.animated[1]).not.toBe(poses.normal[1]);
  for (const [game, modes] of [['boss', ['mean', 'cruel', 'nightmare', 'impossible']],
    ['pumpkin', ['phase2', 'coward', 'baby', 'come_on']]]) {
    await leaveFullscreen(page);
    await page.locator(`[data-game="${game}"]`).click();
    for (const mode of modes) {
      await page.locator(`[data-difficulty="${mode}"]`).click();
      await page.locator('#pause').click();
      expect(await page.evaluate(() => damageFlashAnimation)).toBe(null);
      await page.evaluate(() => {
        snapshot.lives--; snapshot.damage_taken++; render();
        damageFlashAnimation.pause(); damageFlashAnimation.currentTime = 0;
      });
      await expect(page.locator('#damage-flash')).toHaveCSS('opacity', '1');
      await expect(page.locator('#damage-flash')).toHaveCSS('pointer-events', 'none');
      expect(await page.locator('#damage-flash').evaluate(el => {
        const box = el.getBoundingClientRect();
        return box.width === innerWidth && box.height === innerHeight && box.top === 0 && box.left === 0;
      })).toBe(true);
      expect(await page.evaluate(() => {
        const flash = damageFlashAnimation;
        render(); snapshot.lives++; render();
        return damageFlashAnimation === flash;
      })).toBe(true);
      // Damage and healing together still need feedback, even with unchanged HP.
      expect(await page.evaluate(() => {
        const flash = damageFlashAnimation;
        snapshot.damage_taken++; render();
        return damageFlashAnimation !== flash;
      })).toBe(true);
      await expect(page.locator('#damage-flash')).toHaveCSS('opacity', '0');
      await page.locator('#exit').click();
      expect(await page.evaluate(() => damageFlashAnimation)).toBe(null);
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await face.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  expect(await face.locator('i').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await expect(page.locator('#damage-flash')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await leaveFullscreen(page);
  await page.locator('[data-game="hangman"]').click();
  await page.locator('[data-difficulty="easy"]').click();
  await page.getByRole('button', { name: 'Guess Z', exact: true }).click();
  expect(await page.evaluate(() => damageFlashAnimation)).toBe(null);
});

test('actual healing pickups flash green even at full HP in Boss Crush and every Pumpkin mode', async ({ page }, testInfo) => {
  let wounded = false;
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    let body = await response.text();
    for (const constructor of ['BossCrush(difficulty)', 'PumpkinKing(difficulty=difficulty)']) {
      body = body.replace(`self.game = ${constructor}`, `self.game = ${constructor}\n            from boss_crush import HealingPickup\n`
        + (wounded ? '            self.game.hurt()\n' : '')
        + '            self.game.healing_pickups = [HealingPickup(self.game.x, self.game.y)]');
    }
    await route.fulfill({ response, body });
  });
  for (wounded of [false, true]) {
    await openGame(page);
    for (const [mode, difficulty, hp] of [['boss', 'impossible', 5], ['pumpkin', 'phase2', 5], ['pumpkin', 'coward', 10], ['pumpkin', 'baby', 15], ['pumpkin', 'come_on', 23]]) {
      await leaveFullscreen(page);
      await page.locator(`[data-game="${mode}"]`).click();
      await page.locator(`[data-difficulty="${difficulty}"]`).click();
      await expect.poll(() => page.evaluate(() => snapshot.healing_collected)).toBe(1);
      await page.locator('#pause').click();
      await expect(page.locator('#player-health-value')).toHaveText(`${hp} / ${hp}`);
      expect(await page.evaluate(() => damageFlashAnimation)).toBe(null);
      await page.evaluate(() => { healingFlashAnimation.pause(); healingFlashAnimation.currentTime = 0; });
      await expect(page.locator('#healing-flash')).toHaveCSS('opacity', '1');
      await expect(page.locator('#healing-flash')).toHaveCSS('background-color', 'rgba(55, 255, 115, 0.22)');
      await expect(page.locator('#healing-flash')).toHaveCSS('pointer-events', 'none');
      if (mode === 'pumpkin' && difficulty === 'baby' && !wounded)
        await page.screenshot({ path: testInfo.outputPath('green-healing-flash.png') });
      expect(await page.evaluate(() => { const flash = healingFlashAnimation; render(); return flash === healingFlashAnimation; })).toBe(true);
      await page.locator('#exit').click();
      await expect(page.locator('#healing-flash')).toHaveCSS('opacity', '0');
      expect(await page.evaluate(() => healingFlashAnimation)).toBe(null);
    }
  }
});

