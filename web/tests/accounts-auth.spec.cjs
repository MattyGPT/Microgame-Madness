const { test, expect, openGame } = require('./fixtures/game.cjs');
const Rules = require('../../shared/account-rules.js');

test.use({ deterministicMusic: true });

// These routes emulate provider transport only. Real client storage/sessions,
// semantic game operations, and the shared trusted reducer remain in use.
// Database authorization/transactions are covered by account backend tests.
async function accountService(page, { loseOneResultResponse = false } = {}) {
  const config = { url: 'https://accounts.test', key: 'sb_publishable_account_browser_test' };
  const userId = '00000000-0000-0000-0000-000000000123';
  const service = { state: Rules.initial(), revision: 0, receipts: new Map(), runs: new Map(), auth: [],
    commands: [], anonymous: true, email: null, signupCount: 0, dropped: false };
  const user = () => ({ id: userId, is_anonymous: service.anonymous, email: service.email,
    email_confirmed_at: service.anonymous ? null : '2026-11-07T12:00:00Z', last_sign_in_at: new Date().toISOString() });
  const session = () => ({ access_token: service.anonymous ? 'guest-access' : 'account-access',
    refresh_token: 'refresh-one', expires_in: 3600, user: user() });
  const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'apikey,authorization,content-type',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS' };
  const snapshot = () => ({ state: service.state, revision: service.revision, public_id: 'public-test-player' });
  await page.route('**/leaderboard-config.json', route => route.fulfill({ json: config }));
  await page.route('https://accounts.test/**', async route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const body = request.postData() ? request.postDataJSON() : {};
    if (url.pathname.startsWith('/auth/')) {
      service.auth.push({ path: url.pathname, method: request.method(), body });
      if (url.pathname.endsWith('/signup')) {
        service.signupCount++;
        return route.fulfill({ headers, json: session() });
      }
      if (url.pathname.endsWith('/user')) {
        if (request.method() === 'PUT') service.email = body.email;
        return route.fulfill({ headers, json: user() });
      }
      if (url.pathname.endsWith('/otp')) {
        if (body.email !== service.email || body.create_user !== false)
          return route.fulfill({ status: 400, headers, json: { message: 'Unknown account' } });
        return route.fulfill({ headers, json: {} });
      }
      if (url.pathname.endsWith('/verify')) {
        if (body.token !== '123456') return route.fulfill({ status: 400, headers, json: { message: 'Code is invalid or expired.' } });
        if (body.email !== service.email || !['email_change', 'email'].includes(body.type))
          return route.fulfill({ status: 400, headers, json: { message: 'Verification did not match the request.' } });
        service.anonymous = false;
        return route.fulfill({ headers, json: session() });
      }
      if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204, headers });
      if (url.pathname.endsWith('/token')) return route.fulfill({ headers, json: session() });
      return route.fulfill({ status: 404, headers, json: { message: 'Unknown auth route' } });
    }
    if (url.pathname === '/functions/v1/accounts') {
      if (request.headers().authorization !== 'Bearer account-access' || service.anonymous)
        return route.fulfill({ status: 401, headers, json: { error: { code: 'sign_in_required', message: 'Sign in first.' } } });
      if (body.action === 'snapshot') {
        await service.snapshotWait;
        return route.fulfill({ headers, json: snapshot() });
      }
      if (body.action === 'history') {
        const runs = [...service.runs.values()].filter(run => (!body.mode || run.mode === body.mode)
          && (!body.outcome || run.outcome === body.outcome) && (!body.difficulty || run.difficulty === body.difficulty));
        return route.fulfill({ headers, json: { runs: runs.slice(0, body.limit || 20), next_cursor: null } });
      }
      if (body.action === 'operations') {
        const receipts = [];
        let includesResult = false;
        for (const operation of body.operations) {
          service.commands.push(operation);
          const existing = service.receipts.get(operation.id);
          if (existing) {
            if (existing.payload !== JSON.stringify(operation))
              receipts.push({ id: operation.id, status: 'rejected', error: { code: 'conflict', message: 'Operation changed' } });
            else receipts.push({ ...existing.receipt, status: 'duplicate' });
            continue;
          }
          try {
            const applied = Rules.apply(service.state, operation, { now: Date.now() });
            service.state = applied.state; service.revision++;
            if (applied.run) { service.runs.set(applied.run.id, applied.run); includesResult = true; }
            const receipt = { id: operation.id, status: 'applied', result: applied.result };
            service.receipts.set(operation.id, { payload: JSON.stringify(operation), receipt });
            receipts.push(receipt);
          } catch (error) {
            const receipt = { id: operation.id, status: 'rejected', error: { code: error.code || 'invalid', message: error.message } };
            service.receipts.set(operation.id, { payload: JSON.stringify(operation), receipt });
            receipts.push(receipt);
          }
        }
        // The write succeeds before the response is lost, exercising retry
        // receipts rather than treating a transport failure as a rolled-back run.
        if (loseOneResultResponse && includesResult && !service.dropped) {
          service.dropped = true;
          return route.abort('failed');
        }
        return route.fulfill({ headers, json: { ...snapshot(), receipts } });
      }
      if (body.action === 'export') return route.fulfill({ headers, json: { version: 1, ...snapshot(), runs: [...service.runs.values()] } });
      return route.fulfill({ status: 400, headers, json: { error: { code: 'invalid', message: 'Unknown account command' } } });
    }
    if (url.pathname.endsWith('/get_account_seasons')) return route.fulfill({ headers, json: [] });
    if (url.pathname.endsWith('/get_leaderboard')) return route.fulfill({ headers, json: [] });
    return route.fulfill({ status: 404, headers, json: { error: 'Unexpected endpoint' } });
  });
  return service;
}
async function waitForAccount(page) {
  await page.waitForFunction(() => accountApp?.initialized && accountApp?.controller?.state().status !== 'loading');
}
async function openProfile(page) {
  await page.locator('#account-open').click();
  await expect(page.locator('#account-dialog')).toBeVisible();
  await expect(page.locator('#account-dialog')).not.toHaveAttribute('aria-busy', 'true');
}
async function verify(page) {
  await page.locator('#account-code').fill('123456');
  await page.locator('#account-verify').click();
}

test('guest upgrade, receipt retry, sign-out, and existing sign-in preserve one earned balance', async ({ page }) => {
  const service = await accountService(page, { loseOneResultResponse: true });
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'HangmanGame(random.choice(rules["words"]), rules["max_attempts"])',
      'HangmanGame("cat", rules["max_attempts"])') });
  });
  await openGame(page); await waitForAccount(page);
  await page.locator('[data-difficulty="easy"]').click();
  for (const letter of ['C', 'A', 'T']) await page.getByRole('button', { name: `Guess ${letter}`, exact: true }).click();
  await expect(page.locator('#overlay')).toBeVisible();
  await expect.poll(() => page.evaluate(() => accountApp.controller.state().profile.shop.units)).toBe(40000);
  await openProfile(page);
  await page.locator('#account-email').fill('private-player@example.test');
  await page.locator('#account-create').click();
  await expect(page.locator('#account-code-step')).toBeVisible();
  let finishSnapshot;
  service.snapshotWait = new Promise(resolve => { finishSnapshot = resolve; });
  await verify(page);
  try {
    await expect(page.locator('#account-dialog')).toHaveAttribute('aria-busy', 'true');
    await page.locator('#account-close').click();
    await page.locator('[data-game="hangman"]').click();
    await page.locator('[data-difficulty="easy"]').click();
    expect(await page.evaluate(() => active)).toBe(false);
  } finally { finishSnapshot(); }
  await openProfile(page);
  await expect(page.locator('#account-import')).toBeVisible();
  await expect(page.locator('#account-status')).toContainText('Review your guest progress');
  expect(service.revision).toBe(0); // Confirmation does not silently import.
  await page.locator('#account-import-confirm').click();
  await expect.poll(() => service.state.shop.units).toBe(40000);
  await expect.poll(() => page.evaluate(() => accountApp.controller.state().pending), { timeout: 20000 }).toBe(0);
  expect(service.dropped).toBe(true);
  expect(service.runs.size).toBe(1);
  expect(service.state.achievements.stats.hangmanWins).toBe(1);
  expect(service.signupCount).toBe(1);
  expect(service.state.baselineClosed).toBe(true);
  expect(service.auth.some(request => request.path.endsWith('/user') && request.method === 'PUT')).toBe(true);
  expect(service.auth.some(request => request.path.endsWith('/verify') && request.body.type === 'email_change')).toBe(true);
  expect(JSON.stringify(service.commands)).not.toContain('private-player@example.test');
  await expect(page.locator('#account-summary')).not.toContainText('private-player@example.test');
  await page.locator('#account-sync').click();
  await expect(page.locator('#account-history')).toContainText('hangman · easy · win · 10 pts');
  expect(service.state.shop.units).toBe(40000);
  await page.locator('#account-close').click();
  // Public account names are independent of legacy name-triggered secrets.
  await page.locator('#player').fill('GRAVITRON');
  await expect.poll(() => service.state.player).toBe('GRAVITRON');
  expect(service.state.unlocks.singularity).toBe(false);
  await expect(page.locator('[data-game="singularity"]')).toBeHidden();
  await openProfile(page);
  await page.locator('#account-signout').click();
  await expect(page.locator('#account-auth')).toBeVisible();
  await expect.poll(() => page.evaluate(() => accountApp.controller.state().profile.shop.units)).toBe(0);
  await expect(page.locator('#account-history')).toContainText('Your next game starts your history');
  await page.locator('#account-email').fill('private-player@example.test');
  await page.locator('#account-login').click();
  await expect(page.locator('#account-code-step')).toBeVisible();
  await verify(page);
  await expect(page.locator('#account-import')).toBeHidden();
  await expect(page.locator('#account-user-actions')).toBeVisible();
  await expect.poll(() => page.evaluate(() => accountApp.controller.state().profile.shop.units)).toBe(40000);
  await expect(page.locator('#account-name')).toHaveValue('GRAVITRON');
  await expect(page.locator('#account-history')).toContainText('hangman · easy · win · 10 pts');
  expect(service.state.achievements.stats.hangmanWins).toBe(1);
  expect(service.signupCount).toBe(1);
  expect(service.auth.some(request => request.path.endsWith('/otp') && request.body.create_user === false)).toBe(true);
  // An expired session offers sign-in directly while keeping its local data.
  await page.evaluate(() => {
    accountApp.session.requiresSignIn = true;
    accountApp.controller.fail(Object.assign(new Error('Sign in again'), { code: 'sign_in_required' }));
  });
  await expect(page.locator('#account-auth')).toBeVisible();
  await expect(page.locator('#account-create')).toBeDisabled();
  await page.locator('#account-email').fill('private-player@example.test');
  await page.locator('#account-login').click();
  await verify(page);
  await expect(page.locator('#account-auth')).toBeHidden();
  await expect.poll(() => page.evaluate(() => accountApp.controller.state().profile.shop.units)).toBe(40000);
  // Deliver the same storage notification as a logout in another tab while the
  // profile is open. Its previous private history/name must disappear.
  await page.evaluate(() => {
    const key = accountApp.session.storageKey;
    localStorage.removeItem(key);
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: null }));
  });
  await expect(page.locator('#account-auth')).toBeVisible();
  await expect(page.locator('#account-history')).not.toContainText('hangman · easy · win');
  await expect(page.locator('#account-name')).not.toHaveValue('GRAVITRON');
  await expect(page.locator('#account-email')).toHaveValue('');
});

test('an invalid email code leaves the guest journal and identity available for retry', async ({ page }) => {
  const service = await accountService(page);
  await openGame(page); await waitForAccount(page); await openProfile(page);
  await page.locator('#account-email').fill('retry-player@example.test');
  await page.locator('#account-create').click();
  await expect(page.locator('#account-code-step')).toBeVisible();
  await page.locator('#account-code').fill('000000');
  await page.locator('#account-verify').click();
  await expect(page.locator('#account-message')).toContainText('invalid or expired');
  await expect(page.locator('#account-import')).toBeHidden();
  expect(await page.evaluate(() => accountApp.controller.state().owner)).toBe('guest');
  expect(service.revision).toBe(0);
  await verify(page);
  await expect(page.locator('#account-import')).toBeVisible();
  expect(service.signupCount).toBe(1);
});
