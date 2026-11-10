const { test, expect, openGame, routeLocalRuntime } = require('./fixtures/game.cjs');

// Keep unrelated score assertions independent of the randomly selected song.
test.use({ deterministicMusic: true });

async function mockGlobalLeaderboards(page, service) {
  await page.route('**/leaderboard-config.json', route => route.fulfill({
    json: { url: 'https://leaderboard.test', key: 'sb_publishable_browser_test' },
  }));
  await page.route('https://leaderboard.test/**', async route => {
    const request = route.request();
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'apikey,authorization,content-type',
      'access-control-allow-methods': 'GET,POST,OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (service.offline) return route.fulfill({ status: 503, headers, json: {} });
    const body = request.method() === 'GET' ? {} : request.postDataJSON();
    if (request.url().endsWith('/get_account_seasons')) return route.fulfill({ headers, json: [] });
    if (request.url().endsWith('/auth/v1/user')) {
      const id = (request.headers().authorization || '').replace('Bearer ', '');
      return route.fulfill({ headers, json: { id, is_anonymous: true } });
    }
    if (request.url().includes('/auth/')) {
      const id = body.refresh_token || `guest-${++service.guests}`;
      return route.fulfill({ headers, json: { access_token: id, refresh_token: id, expires_in: 3600, user: { id, is_anonymous: true } } });
    }
    const key = `${body.p_mode}:${body.p_difficulty}`;
    const identity = (request.headers().authorization || '').replace('Bearer ', '');
    service.visibility ||= new Map();
    if (request.url().endsWith('/set_guest_leaderboard_visibility')) {
      service.visibility.set(identity, body.p_visible);
      return route.fulfill({ headers, json: body.p_visible });
    }
    if (request.url().endsWith('/submit_leaderboard_run')) {
      const id = `${key}:${identity}`, previous = service.scores.get(id);
      service.receipts ||= new Set();
      const receipt = `${identity}:${body.p_run_id}`;
      const score = (previous?.score || 0) + (service.receipts.has(receipt) ? 0 : body.p_score);
      service.receipts.add(receipt);
      service.scores.set(id, { key, identity, player: body.p_player, score });
      return route.fulfill({ headers, json: score });
    }
    service.requested.add(key);
    const rows = [...service.scores.values()].filter(row => row.key === key && service.visibility.get(row.identity) !== false).sort((a, b) => b.score - a.score);
    return route.fulfill({ headers, json: rows.slice(0, 10).map((row, i) => ({
      rank: i + 1, player: row.player, score: row.score, is_you: row.identity === identity,
    })) });
  });
}
async function finishHangman(page, name) {
  await page.evaluate(async () => {
    await accountApp.ready;
    try { await accountApp.setting({ leaderboard: true }); } catch { /* Offline opt-in is saved locally and retried. */ }
    if (!accountApp.controller.state().profile.privacy.leaderboard) throw new Error('Sharing preference was not saved.');
  });
  await page.locator('#player').fill(name);
  await page.locator('[data-difficulty="easy"]').click();
  for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
    if (await page.locator('#overlay').isVisible()) break;
    const button = page.getByRole('button', { name: `Guess ${letter.toUpperCase()}`, exact: true });
    if (await button.isEnabled()) await button.click();
  }
  await expect(page.locator('#overlay')).toBeVisible();
}

test('unconfigured global rankings leave local scores and achievements usable', async ({ page }) => {
  await openGame(page);
  const before = await page.evaluate(() => localStorage.getItem('microgame-madness.v1'));
  await page.locator('#global-tab').click();
  await expect(page.locator('#leaderboard-status')).toContainText('aren’t connected yet');
  await page.locator('#achievements-tab').click();
  await expect(page.locator('[data-achievement="welcome"]')).toContainText('Unlocked');
  expect(await page.evaluate(() => localStorage.getItem('microgame-madness.v1'))).toBe(before);
});

test('global rankings can browse all 26 modes without starting a round', async ({ page }) => {
  await openGame(page);
  const service = { scores: new Map(), guests: 0, requested: new Set() };
  await mockGlobalLeaderboards(page, service);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await page.locator('#global-tab').click();
  const modes = await page.evaluate(() => Leaderboards.difficulties);
  for (const [mode, values] of Object.entries(modes)) {
    await page.locator('#leaderboard-game').selectOption(mode);
    for (const difficulty of values) {
      await page.locator('#leaderboard-difficulty').selectOption(difficulty);
      await expect(page.locator('#leaderboard-status')).toHaveText('No scores yet. Set the first record!');
      await expect.poll(() => service.requested.has(`${mode}:${difficulty}`)).toBe(true);
    }
  }
  expect(service.requested.size).toBe(26);
  expect(service.guests).toBe(1); // Default-on sharing establishes a guest identity.
  await page.locator('#global-tab').press('End');
  await expect(page.locator('#global-tab')).toBeFocused();
  await page.locator('#global-tab').press('ArrowRight');
  await expect(page.locator('#scores-tab')).toBeFocused();
  expect(await page.evaluate(() => active)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('global scores are shared across independent browsers and preserve the original local profile', async ({ page, context }, testInfo) => {
  await openGame(page);
  const service = { scores: new Map(), guests: 0, requested: new Set() };
  await page.evaluate(async () => {
    const profile = JSON.parse(localStorage.getItem('microgame-madness.v1'));
    profile.scores['hangman:hard'] = [{ player: 'Old champion', score: 5 }];
    await accountApp.controller.importProfile(profile, { baseline: false });
    accountApp.applyCurrent();
  });
  await mockGlobalLeaderboards(page, service);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  const originalPoints = await page.locator('#profile-score').textContent();
  await finishHangman(page, 'First browser');
  await page.locator('#global-tab').click();
  await expect(page.locator('#global-scores')).toContainText('First browser (you)');
  // A browser context has independent localStorage and its own cloud identity.
  const otherContext = await context.browser().newContext();
  try {
    const other = await otherContext.newPage();
    await other.addInitScript(() => localStorage.setItem('microgame-madness.welcome.v1', 'complete'));
    await routeLocalRuntime(other);
    await mockGlobalLeaderboards(other, service);
    await other.goto(page.url());
    await expect(other.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
    await other.locator('#global-tab').click();
    await expect(other.locator('#global-scores')).toContainText('First browser');
    await finishHangman(other, 'Second browser');
    await expect(other.locator('#global-scores')).toContainText('Second browser (you)');
    await page.locator('#leaderboard-refresh').click();
    await expect(page.locator('#global-scores')).toContainText('Second browser');
    expect(service.guests).toBe(2);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('microgame-madness.v1')).scores['hangman:hard']))
      .toEqual([{ player: 'Old champion', score: 5 }]);
    expect(Number(await page.locator('#profile-score').textContent())).toBeGreaterThanOrEqual(Number(originalPoints));
    await page.locator('#global-panel').screenshot({ path: testInfo.outputPath('global-leaderboard.png') });
    // Withdrawal is retained offline and hides existing rows after reconnect.
    service.offline = true;
    await page.evaluate(async () => { try { await accountApp.setting({ leaderboard: false }); } catch { /* Pending network update. */ } });
    expect(await page.evaluate(() => accountApp.controller.state().profile.privacy.leaderboard)).toBe(false);
    service.offline = false;
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect.poll(() => [...service.visibility.values()].filter(value => !value).length).toBe(1);
    await other.locator('#leaderboard-refresh').click();
    await expect(other.locator('#global-scores')).not.toContainText('First browser');
    await expect(other.locator('#global-scores')).toContainText('Second browser');
    await page.evaluate(() => accountApp.setting({ leaderboard: true }));
    await other.locator('#leaderboard-refresh').click();
    await expect(other.locator('#global-scores')).toContainText('First browser');
  } finally { await otherContext.close(); }
});

test('global outages keep games playable and queued scores retry after reload', async ({ page }) => {
  await openGame(page);
  const service = { scores: new Map(), guests: 0, requested: new Set(), offline: true };
  await mockGlobalLeaderboards(page, service);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await finishHangman(page, 'Offline player');
  await page.locator('#global-tab').click();
  await expect(page.locator('#leaderboard-submission')).toContainText('Saved locally');
  await expect(page.locator('#leaderboard-status')).toContainText('unavailable');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  service.offline = false;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.locator('#global-tab').click();
  await expect(page.locator('#global-scores')).toContainText('Offline player (you)');
  expect(service.guests).toBe(1);
});


test('lifetime totals add all rounds across tabs and do not repeat after reload', async ({ page, context }) => {
  const service = { scores: new Map(), guests: 0, requested: new Set() };
  await mockGlobalLeaderboards(page, service);
  await openGame(page);
  await page.evaluate(() => accountApp.ready);
  const other = await context.newPage();
  try {
    await routeLocalRuntime(other);
    await mockGlobalLeaderboards(other, service);
    await other.goto(page.url());
    await expect(other.locator('#runtime-status')).toContainText('All games ready');
    await other.evaluate(() => accountApp.ready);
    const submit = (tab, score) => tab.evaluate(async score => {
      const client = await leaderboardReady;
      await client.submit({mode:'hangman',difficulty:'easy',player:'Lifetime player',score});
    }, score);
    await Promise.all([submit(page,4),submit(other,9),submit(page,8)]);
    expect(service.guests).toBe(1);
    expect([...service.scores.values()].map(row=>row.score)).toEqual([21]);
    await page.reload();
    await expect(page.locator('#runtime-status')).toContainText('All games ready');
    await page.locator('#global-tab').click();
    await page.locator('#leaderboard-refresh').click();
    await expect(page.locator('#global-scores')).toContainText('21');
    expect([...service.scores.values()].map(row=>row.score)).toEqual([21]);
  } finally { await other.close(); }
});
