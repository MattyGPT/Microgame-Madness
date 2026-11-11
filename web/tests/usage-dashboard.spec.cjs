const { test, expect } = require('@playwright/test');

const config = { url: 'https://usage.test', key: 'sb_publishable_browser_test' };
const TOKEN = 'operator-token-value';

function document(days = 7) {
  const today = new Date();
  const at = offset => new Date(today.getTime() - offset * 86400000).toISOString().slice(0, 10);
  return { generated_at: '2026-11-10T12:34:56Z', window_days: days,
    window_start: at(days - 1), window_end: at(0),
    days: Array.from({ length: days }, (_, offset) => {
      const index = days - 1 - offset;
      return { day: at(index), visits: 10 + index, players: 6 + (index % 3),
        accounts: 2 + (index % 2), guests: 4, logins: index % 3, registers: index % 2,
        plays: 20 + index * 2, finishes: 14 + index, wins: 5 + index, losses: 4,
        exits: 2, interrupted: 1 };
    }),
    games: [{ game: 'hangman', plays: 40, days_played: days, finishes: 30, wins: 12, losses: 10,
      exits: 5, interrupted: 3 },
    { game: 'dodge', plays: 18, days_played: 3, finishes: 12, wins: 4, losses: 6, exits: 1,
      interrupted: 1 }],
    account_runs: [{ day: at(0), players: 2, runs: 9, wins: 4 }],
    accounts: { active_handles: 4, reserved_handles: 5, new_handles: 1, accounts: 4,
      new_accounts: 1, signed_in_recently: 2, anonymous_users: 11, deleted_accounts: 1 },
    totals: { since: at(30), unique_browsers: 37, browsers_signed_in: 6, visits: 210,
      plays: 260, finishes: 180, wins: 70, leaderboard_rows: 12 } };
}

async function setup(page, { status = 200, days = 30 } = {}) {
  const service = { calls: [] };
  await page.route('**/leaderboard-config.json', route => route.fulfill({ json: config }));
  await page.route('https://usage.test/**', route => {
    const request = route.request();
    const headers = { 'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization,content-type',
      'access-control-allow-methods': 'GET,OPTIONS', 'content-type': 'application/json' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    service.calls.push({ url: request.url(), authorization: request.headers().authorization });
    if (status !== 200) return route.fulfill({ status, headers, json: { error: {
      code: status === 401 ? 'unauthorized' : 'unavailable',
      message: status === 401 ? 'Enter the operator token to view usage.'
        : 'The usage counters could not be read.' } } });
    const requested = Number(new URL(request.url()).searchParams.get('days')) || days;
    return route.fulfill({ headers, json: document(requested) });
  });
  return service;
}

async function openDashboard(page) {
  await page.goto('/ops/usage.html');
  await expect(page.locator('#status')).not.toHaveText('Loading configuration…');
}

async function signIn(page, token = TOKEN) {
  await page.locator('#token-input').fill(token);
  await page.locator('#token-form button[type="submit"]').click();
  await expect(page.locator('#dashboard')).toBeVisible();
}

test('without a token the page asks for one and reads nothing', async ({ page }) => {
  const service = await setup(page);
  await openDashboard(page);
  await expect(page.locator('#gate')).toBeVisible();
  await expect(page.locator('#dashboard')).toBeHidden();
  expect(service.calls).toEqual([]);
  await expect(page.locator('#status')).toContainText('Enter the operator token');
  // The page itself is not linked from the arcade and stays out of indexes.
  expect(await page.locator('meta[name="robots"]').getAttribute('content')).toContain('noindex');
});

test('a token renders the charts, tables and provenance', async ({ page }) => {
  const service = await setup(page);
  await openDashboard(page);
  await signIn(page);
  expect(service.calls.length).toBe(1);
  expect(service.calls[0].authorization).toBe(`Bearer ${TOKEN}`);
  expect(service.calls[0].url).toContain('days=30');

  await expect(page.locator('#traffic-chart svg')).toBeVisible();
  await expect(page.locator('#players-chart svg')).toBeVisible();
  await expect(page.locator('#signins-chart svg')).toBeVisible();
  await expect(page.locator('#plays-chart svg')).toBeVisible();
  await expect(page.locator('#winrate-chart svg')).toBeVisible();
  expect(await page.locator('#stats .stat').count()).toBe(6);
  expect(await page.locator('#daily-table tbody tr').count()).toBe(30);
  expect(await page.locator('#game-table tbody tr').count()).toBe(2);
  expect(await page.locator('#runs-table tbody tr').count()).toBe(1);

  // Every chart is described for assistive tech and states its finding.
  for (const id of ['traffic', 'players', 'signins', 'plays', 'winrate']) {
    const label = await page.locator(`#${id}-chart svg`).getAttribute('aria-label');
    expect(label.length).toBeGreaterThan(20);
  }
  await expect(page.locator('#traffic-finding')).toContainText('Busiest day');
  await expect(page.locator('#provenance')).toContainText('2026-11-10T12:34:56Z');
  await expect(page.locator('#provenance')).toContainText('UTC');
  await expect(page.locator('#status')).toContainText('30 days of aggregate counters');
  // The token is remembered for the next visit, and only in this browser.
  expect(await page.evaluate(key => localStorage.getItem(key),
    'microgame-madness.usage-dashboard.v1.token')).toBe(TOKEN);
});

test('changing the window refetches that many days', async ({ page }) => {
  const service = await setup(page);
  await openDashboard(page);
  await signIn(page);
  await expect(page.locator('#daily-table tbody tr')).toHaveCount(30);
  await page.locator('#window-select').selectOption('7');
  await expect(page.locator('#daily-table tbody tr')).toHaveCount(7);
  expect(service.calls.map(call => new URL(call.url).searchParams.get('days'))).toEqual(['30', '7']);
  await expect(page.locator('#window-label')).toHaveText('7 days');
});

test('a rejected token returns to the gate and forgets itself', async ({ page }) => {
  const service = await setup(page, { status: 401 });
  await openDashboard(page);
  await page.locator('#token-input').fill(TOKEN);
  await page.locator('#token-form button[type="submit"]').click();
  await expect(page.locator('#gate')).toBeVisible();
  await expect(page.locator('#dashboard')).toBeHidden();
  await expect(page.locator('#status')).toContainText('rejected');
  expect(await page.evaluate(key => localStorage.getItem(key),
    'microgame-madness.usage-dashboard.v1.token')).toBeNull();
  expect(service.calls.length).toBe(1);
});

test('an outage is reported without breaking the page', async ({ page }) => {
  await setup(page, { status: 503 });
  await openDashboard(page);
  await signIn(page);
  await expect(page.locator('#status')).toContainText('could not be read');
  // The operator stays on the dashboard and can retry; the token is not discarded.
  await expect(page.locator('#gate')).toBeHidden();
  await expect(page.locator('#refresh')).toBeEnabled();
  expect(await page.evaluate(key => localStorage.getItem(key),
    'microgame-madness.usage-dashboard.v1.token')).toBe(TOKEN);
});

test('forgetting the token clears it and returns to the gate', async ({ page }) => {
  const service = await setup(page);
  await openDashboard(page);
  await signIn(page);
  expect(service.calls.length).toBe(1);
  await page.locator('#forget').click();
  await expect(page.locator('#gate')).toBeVisible();
  await expect(page.locator('#dashboard')).toBeHidden();
  await expect(page.locator('#status')).toContainText('Token cleared');
  expect(await page.evaluate(key => localStorage.getItem(key),
    'microgame-madness.usage-dashboard.v1.token')).toBeNull();
  // Nothing further is read; the controls are hidden with the dashboard.
  expect(service.calls.length).toBe(1);
});

test('a returning operator is not asked for the token again', async ({ page }) => {
  const service = await setup(page);
  await page.addInitScript(([key, token]) => {
    try { localStorage.setItem(key, token); } catch { /* storage may be blocked */ }
  }, ['microgame-madness.usage-dashboard.v1.token', TOKEN]);
  await openDashboard(page);
  await expect(page.locator('#dashboard')).toBeVisible();
  await expect(page.locator('#gate')).toBeHidden();
  expect(service.calls.length).toBe(1);
  expect(service.calls[0].authorization).toBe(`Bearer ${TOKEN}`);
});

test('an unconfigured build explains itself instead of failing silently', async ({ page }) => {
  await page.route('**/leaderboard-config.json', route => route.fulfill({ json: { url: '', key: '' } }));
  await page.goto('/ops/usage.html');
  await expect(page.locator('#status')).toContainText('not connected to a project');
  await expect(page.locator('#dashboard')).toBeHidden();
});
