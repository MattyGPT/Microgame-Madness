const { test: base, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { version } = require('pyodide/package.json');

async function routeLocalRuntime(target) {
  await target.route(`https://cdn.jsdelivr.net/pyodide/v${version}/full/**`, route => {
    const name = path.basename(new URL(route.request().url()).pathname);
    const file = path.join(path.dirname(require.resolve('pyodide/package.json')), name);
    if (!fs.existsSync(file)) return route.abort();
    return route.fulfill({
      path: file,
      contentType: name.endsWith('.wasm') ? 'application/wasm'
        : name.endsWith('.js') ? 'application/javascript' : 'application/octet-stream',
      headers: { 'access-control-allow-origin': '*' },
    });
  });
}

// Install routes before a test navigates. Each test still gets a fresh context
// and runtime; persistence tests can explicitly reload that same page.
const test = base.extend({
  deterministicMusic: [false, { option: true }],
  firstVisitSetup: [false, { option: true }],
  page: async ({ page, deterministicMusic, firstVisitSetup }, use) => {
    if (!firstVisitSetup) await page.addInitScript(() => {
      try { localStorage.setItem('microgame-madness.welcome.v1', 'complete'); } catch {}
    });
    await routeLocalRuntime(page);
    // Test built assets without contacting a production leaderboard.
    // Leaderboard specs can override this route with their own mock service.
    await page.route('**/leaderboard-config.json', route => route.fulfill({
      json: { url: '', key: '' },
    }));
    if (deterministicMusic) {
      await page.route('**/music.js*', async route => {
        const response = await route.fetch();
        await route.fulfill({ response, body: (await response.text()).replace(
          'constructor(context, destination = context.destination, random = Math.random)',
          'constructor(context, destination = context.destination, random = () => .2)') });
      });
    }
    await use(page);
    // Finish mocked network responses before Playwright closes the context.
    await page.unrouteAll({ behavior: 'wait' });
  },
});

async function openGame(page) {
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
}

// Wait for native fullscreen transitions before sending keys or changing layout.
async function settleFullscreen(page) {
  await page.waitForFunction(() => typeof fullscreenBusy === 'undefined' || !fullscreenBusy, null, { polling: 50 });
}

// Collection, settings, and game cards live outside the immersive game view.
async function leaveFullscreen(page) {
  await settleFullscreen(page);
  const button = page.locator('#fullscreen');
  if (await button.getAttribute('aria-pressed') === 'true') {
    await button.click();
    await settleFullscreen(page);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  }
}

module.exports = { test, expect, openGame, routeLocalRuntime, settleFullscreen, leaveFullscreen };
