const { settleFullscreen } = require('./fixtures/game.cjs');
const { test, expect, openGame } = require('./fixtures/game.cjs');

const config = { url: 'https://usage.test', key: 'sb_publishable_browser_test' };

async function mockUsage(page, service = { reports: [] }) {
  await page.route('**/leaderboard-config.json', route => route.fulfill({ json: config }));
  await page.route('https://usage.test/**', route => {
    const request = route.request();
    const headers = { 'access-control-allow-origin': '*',
      'access-control-allow-headers': 'apikey,authorization,content-type',
      'access-control-allow-methods': 'GET,POST,OPTIONS', 'content-type': 'application/json' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (request.url().endsWith('/rpc/record_usage')) {
      const body = request.postDataJSON();
      service.reports.push({ body, headers: request.headers() });
      return route.fulfill({ headers, body: String(body.p_events.length) });
    }
    return route.fulfill({ headers, body: '[]' });
  });
  return service;
}

test('a page load reports one visit and nothing that identifies the player', async ({ page }) => {
  const service = await mockUsage(page);
  await openGame(page);
  await expect.poll(() => service.reports.length).toBe(1);
  const [report] = service.reports;
  expect(report.body.p_events).toEqual([{ kind: 'visit' }]);
  expect(report.body.p_scope).toBe('guest');
  expect(report.body.p_visitor).toMatch(/^[0-9a-f]{32}$/);
  expect(report.headers.apikey).toBe(config.key);
  // Analytics never carries a session token and never creates an auth user.
  expect(report.headers.authorization).toBeUndefined();
  expect(await page.evaluate(() =>
    localStorage.getItem('microgame-madness.usage.v1.visitor'))).toBe(report.body.p_visitor);
});

test('starting and leaving a game reports the play and its outcome for the same browser', async ({ page }) => {
  const service = await mockUsage(page);
  await openGame(page);
  await expect.poll(() => service.reports.length).toBe(1);
  await page.locator('[data-difficulty="easy"]').click();
  await settleFullscreen(page);
  await page.keyboard.press('Escape');
  // Gameplay batches; the page-hide flush is what a real visit sends.
  expect(await page.evaluate(async () => {
    await accountApp.usage.flush();
    return accountApp.usage.buffer.length;
  })).toBe(0);
  const report = service.reports.at(-1);
  expect(report.body.p_visitor).toBe(service.reports[0].body.p_visitor);
  // Escape leaves through selectGame, which reports an unfinished round as interrupted.
  expect(report.body.p_events).toEqual([
    { kind: 'play', game: 'hangman', difficulty: 'easy' },
    { kind: 'finish', game: 'hangman', difficulty: 'easy', outcome: 'interrupted' },
  ]);
});

test('a do-not-track browser reports nothing and stores no id', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'doNotTrack', { get: () => '1', configurable: true });
  });
  const service = await mockUsage(page);
  await openGame(page);
  await page.locator('[data-difficulty="easy"]').click();
  await settleFullscreen(page);
  await page.keyboard.press('Escape');
  await page.evaluate(async () => { await accountApp.usage?.flush?.(); });
  expect(service.reports).toEqual([]);
  expect(await page.evaluate(() =>
    localStorage.getItem('microgame-madness.usage.v1.visitor'))).toBeNull();
});

test('an offline visit keeps its counters for the next flush instead of failing', async ({ page }) => {
  const service = { reports: [] };
  let online = false;
  await page.route('**/leaderboard-config.json', route => route.fulfill({ json: config }));
  await page.route('https://usage.test/**', route => {
    const request = route.request();
    const headers = { 'access-control-allow-origin': '*', 'content-type': 'application/json',
      'access-control-allow-headers': 'apikey,content-type',
      'access-control-allow-methods': 'GET,POST,OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    // Only the usage RPC is under test; other leaderboard traffic gets an empty list.
    if (!request.url().endsWith('/rpc/record_usage')) return route.fulfill({ headers, json: [] });
    if (!online) return route.fulfill({ status: 503, headers, json: {} });
    const body = request.postDataJSON();
    service.reports.push({ body });
    return route.fulfill({ headers, json: body.p_events.length });
  });
  await openGame(page);
  await expect.poll(() => service.reports.length).toBe(0);
  online = true;
  await page.locator('[data-difficulty="easy"]').click();
  await page.evaluate(async () => { await accountApp.usage.flush(); });
  expect(service.reports.length).toBe(1);
  expect(service.reports[0].body.p_events).toEqual([
    { kind: 'visit' }, { kind: 'play', game: 'hangman', difficulty: 'easy' }]);
});
