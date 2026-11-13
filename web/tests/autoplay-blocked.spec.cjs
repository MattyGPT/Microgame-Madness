const { settleFullscreen } = require('./fixtures/game.cjs');
const { test, expect, openGame } = require('./fixtures/game.cjs');

test('a blocked autoplay attempt resumes the same context on interaction', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeAudioContext = window.AudioContext;
    let unlocked = false;
    document.addEventListener('keydown', () => { unlocked = true; }, true);
    window.AudioContext = class extends NativeAudioContext {
      constructor(...args) { super(...args); this.suspend(); }
      resume() {
        if (!unlocked) return Promise.reject(new DOMException('Interaction required', 'NotAllowedError'));
        return super.resume();
      }
    };
  });
  await openGame(page);
  await page.evaluate(() => arcadeWelcome.open());
  await expect.poll(() => page.evaluate(() => audioContext?.state)).toBe('suspended');
  await page.evaluate(() => { window.initialAudioContext = audioContext; });
  await settleFullscreen(page);
  await page.keyboard.press('Shift');
  await expect.poll(() => page.evaluate(() => audioContext?.state)).toBe('running');
  expect(await page.evaluate(() => audioContext === window.initialAudioContext)).toBe(true);
  expect(await page.evaluate(() => musicPlayer.current?.track)).toBe('cubie_hello');
});
