const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
test.beforeEach(async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/pyodide/v0.29.3/full/**', route => {
    const file = path.basename(new URL(route.request().url()).pathname);
    const local = path.resolve('node_modules/pyodide', file);
    return fs.existsSync(local) ? route.fulfill({ path: local,
      contentType: file.endsWith('.wasm') ? 'application/wasm' : file.endsWith('.js') ? 'application/javascript' : 'application/octet-stream',
      headers: { 'access-control-allow-origin': '*' } }) : route.abort();
  });
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
});

test('GRAVITRON origin plays on unlock and reentry, with synchronized sound and clean exit', async ({ page }, testInfo) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.locator('#player').fill('GRAVITRON');
  await expect(page.locator('#core-origin')).toBeVisible();
  expect(await page.evaluate(() => saved.unlocks.singularity)).toBe(true);
  await expect.poll(() => page.evaluate(() => coreOrigin.age)).toBeGreaterThan(.1);
  expect(await page.evaluate(() => ({ duration: coreOrigin.source.buffer.duration, channels: coreOrigin.source.buffer.numberOfChannels, music: musicPlayer.playing })))
    .toEqual({ duration: 23, channels: 2, music: false });
  await page.locator('[data-origin-pause]').click();
  const age = await page.evaluate(() => coreOrigin.age);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => coreOrigin.age)).toBe(age);
  expect(await page.evaluate(() => coreOrigin.source)).toBeNull();
  for (const [t, name] of [[1.5, 'red-giant'], [6, 'absorbing-planets'], [10, 'implosion'], [12.4, 'black-hole'], [15, 'assembling-metal'], [20, 'singularity-core']]) {
    await page.evaluate(t => { coreOrigin.age = t; }, t);
    await page.waitForTimeout(70);
    await page.locator('#core-origin').screenshot({ path: testInfo.outputPath(`${name}.png`) });
  }
  await expect(page.locator('#origin-heading')).toBeVisible();
  await page.locator('[data-origin-pause]').click();
  expect(await page.evaluate(() => coreOrigin.source !== null)).toBe(true);
  await page.locator('[data-origin-sound]').click();
  expect(await page.evaluate(() => ({ soundOn, source: coreOrigin.source }))).toEqual({ soundOn: false, source: null });
  await page.locator('[data-origin-sound]').click();
  expect(await page.evaluate(() => !!coreOrigin.source)).toBe(true);
  // Exercise the real visibility handler without depending on a window manager.
  const hiddenAge = await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    return coreOrigin.age;
  });
  await page.waitForTimeout(180);
  expect(await page.evaluate(() => coreOrigin.age)).toBe(hiddenAge);
  expect(await page.evaluate(() => coreOrigin.source)).toBeNull();
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => !!coreOrigin.source)).toBe(true);
  await page.locator('[data-origin-skip]').click();
  await expect(page.locator('#core-origin')).toBeHidden();
  expect(await page.evaluate(() => coreOrigin.source)).toBeNull();
  await expect(page.locator('[data-difficulty="gravitron"]')).toBeFocused();
  await page.locator('#player').fill('Player');
  await page.locator('#player').fill('gravitron');
  await expect(page.locator('#core-origin')).toBeVisible();
  expect(await page.evaluate(() => coreOrigin.age)).toBeLessThan(3);
  await page.keyboard.press('Escape');
  await expect(page.locator('#core-origin')).toBeHidden();
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#core-origin')).toBeHidden();
  await page.locator('#player').fill('Player');
  await page.locator('#player').fill('GRAVITRON');
  await expect(page.locator('#core-origin')).toBeVisible();
  await page.evaluate(() => { coreOrigin.age = 22.95; coreOrigin.syncSound(); });
  await expect(page.locator('#core-origin')).toBeHidden();
  expect(errors).toEqual([]);
});

test('muted and reduced-motion players get a still reveal without forced sound', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#sound').click();
  await page.locator('#player').fill('GRAVITRON');
  await expect(page.locator('#core-origin')).toBeVisible();
  await expect(page.locator('[data-origin-pause]')).toBeHidden();
  await expect(page.locator('[data-origin-skip]')).toHaveText('Enter containment');
  expect(await page.evaluate(() => ({ age: coreOrigin.age, paused: coreOrigin.paused, source: coreOrigin.source, soundOn })))
    .toEqual({ age: 19, paused: true, source: null, soundOn: false });
  await page.locator('[data-origin-skip]').click();
  await expect(page.locator('#core-origin')).toBeHidden();
});

test('soundtrack is finite stereo audio with headroom and a clean ending', async ({ page }) => {
  const result = await page.evaluate(() => {
    const context = new OfflineAudioContext(2, 8000 * 23, 8000);
    const buffer = CoreOrigin.soundtrack(context), left = buffer.getChannelData(0), right = buffer.getChannelData(1);
    let max = 0, energy = 0, stereo = 0, finite = true;
    for (let i = 0; i < left.length; i++) { max = Math.max(max, Math.abs(left[i]), Math.abs(right[i])); energy += left[i] ** 2; stereo += Math.abs(left[i] - right[i]); finite &&= Number.isFinite(left[i]) && Number.isFinite(right[i]); }
    return { max, energy, stereo, finite, first: left[0], last: left.at(-1), cached: CoreOrigin.soundtrack(context) === buffer };
  });
  expect(result.finite).toBe(true); expect(result.cached).toBe(true);
  expect(result.max).toBeLessThan(.9); expect(result.max).toBeGreaterThan(.1);
  expect(result.energy).toBeGreaterThan(10); expect(result.stereo).toBeGreaterThan(10);
  expect(result.first).toBe(0); expect(Math.abs(result.last)).toBeLessThan(.0001);
});

test('film follows audio through stalled frames, audio suspension, and sound toggles', async ({ page }) => {
  await page.locator('#player').fill('GRAVITRON');
  await expect(page.locator('#core-origin')).toBeVisible();
  const drift = () => page.evaluate(() => Math.abs(coreOrigin.age -
    (coreOrigin.audioOffset + coreOrigin.source.context.currentTime - coreOrigin.audioStarted)));
  await page.evaluate(() => {
    const until = performance.now() + 250;
    while (performance.now() < until) { /* simulate a slow mobile frame */ }
  });
  await page.waitForTimeout(80);
  expect(await drift()).toBeLessThan(.1);
  await page.evaluate(() => coreOrigin.source.context.suspend());
  await page.waitForTimeout(80);
  const age = await page.evaluate(() => coreOrigin.age);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => coreOrigin.age)).toBeCloseTo(age, 3);
  await page.evaluate(() => coreOrigin.source.context.resume());
  await page.waitForTimeout(100);
  expect(await drift()).toBeLessThan(.1);
  await page.locator('[data-origin-sound]').click();
  const mutedAge = await page.evaluate(() => coreOrigin.age);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => coreOrigin.age)).toBeGreaterThan(mutedAge);
  await page.locator('[data-origin-sound]').click();
  await page.waitForTimeout(80);
  expect(await drift()).toBeLessThan(.1);
  await page.locator('[data-origin-skip]').click();
});
