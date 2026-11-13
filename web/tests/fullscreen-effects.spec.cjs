const { test, expect, openGame } = require('./fixtures/game.cjs');
test.use({ deterministicMusic: true });

for (const fallback of [false, true]) {
  test(`screen effects stay above every fullscreen game (${fallback ? 'page fallback' : 'native'})`, async ({page}, testInfo) => {
    await openGame(page);
    await page.evaluate(fallback => {
      unlockSingularity(false);
      if (fallback) gameMain.requestFullscreen = () => Promise.reject(new Error('Unsupported'));
    }, fallback);
    for (const mode of ['hangman', 'keyboard', 'dodge', 'boss', 'pumpkin', 'wrath', 'singularity', 'core_practice', 'geomayhem']) {
      await page.evaluate(mode => selectGame(mode), mode);
      if (mode === 'dodge') await page.locator('[data-difficulty="chaos"]').click();
      else await page.locator('#difficulty-choices [data-difficulty]').first().click();
      if (mode === 'wrath') await page.locator('[data-difficulty="color_memory"]').click();
      if (['hangman', 'keyboard'].includes(mode)) await page.locator('#fullscreen').click();
      await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(() => page.evaluate(() => fullscreenBusy)).toBe(false);
      if (!fallback) expect(await page.evaluate(() => document.fullscreenElement === gameMain)).toBe(true);
      expect(await page.locator('[data-fullscreen-overlay]').evaluateAll(elements =>
        elements.length === 10 && elements.every(el => el.parentElement.matches('.game-main')))).toBe(true);
      // Stop combat and exercise the real damage/healing feedback without random enemy hits.
      await page.evaluate(() => { active = false; });
      if (['dodge', 'boss', 'pumpkin', 'wrath', 'singularity', 'core_practice'].includes(mode)) {
        await page.evaluate(() => {
          resetDamageFeedback();
          updateDamageFeedback({...snapshot, lives: 5, damage_taken: 0, healing_collected: 0});
          updateDamageFeedback({...snapshot, lives: 4, damage_taken: 1, healing_collected: 1});
          for (const animation of [damageFlashAnimation, healingFlashAnimation]) {
            animation.pause(); animation.currentTime = 0;
          }
        });
        for (const id of ['damage-flash', 'healing-flash']) {
          await expect(page.locator(`#${id}`)).toHaveCSS('opacity', '1');
          expect(await page.locator(`#${id}`).evaluate(el => {
            const r = el.getBoundingClientRect();
            // Hit testing proves the layer is painted above fullscreen, not merely visible in the DOM.
            el.style.pointerEvents = 'auto';
            const painted = document.elementFromPoint(1, 1) === el;
            el.style.removeProperty('pointer-events');
            return painted && r.x === 0 && r.y === 0 && r.width === innerWidth && r.height === innerHeight;
          })).toBe(true);
          await expect(page.locator(`#${id}`)).toHaveCSS('pointer-events', 'none');
        }
      }
      if (mode === 'dodge') {
        await page.evaluate(() => {
          resetDamageFeedback();
          const state = {...snapshot, paused: false};
          for (const [key] of chaosStatusDefinitions) state[key] = 4;
          state.protection_left = 4;
          updateChaosEffects(state);
        });
        await expect(page.locator('#chaos-electric')).toBeVisible();
        await expect(page.locator('#chaos-frost')).toBeVisible();
        await expect(page.locator('.chaos-status-layer:not([hidden])')).toHaveCount(16);
        expect(await page.locator('.chaos-screen-effect:not([hidden])').evaluateAll(elements => elements.every(el => {
          const r = el.getBoundingClientRect();
          return r.x === 0 && r.y === 0 && r.width === innerWidth && r.height === innerHeight;
        }))).toBe(true);
        await page.screenshot({path: testInfo.outputPath(`chaos-${fallback ? 'fallback' : 'native'}.png`)});
        await page.emulateMedia({reducedMotion: 'reduce'});
        await expect(page.locator('#chaos-electric svg')).toHaveCSS('animation-name', 'none');
        await page.emulateMedia({reducedMotion: 'no-preference'});
      }
      // The exit control remains clickable through the effects; restore every layer afterwards.
      await page.locator('#exit').click();
      await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'false');
      expect(await page.locator('[data-fullscreen-overlay]').evaluateAll(elements => elements.every(el => el.parentElement === document.body))).toBe(true);
      await expect(page.locator('#damage-flash')).toHaveCSS('opacity', '0');
      await expect(page.locator('#chaos-electric')).toBeHidden();
    }
  });
}
