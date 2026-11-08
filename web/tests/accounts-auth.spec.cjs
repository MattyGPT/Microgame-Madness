const { test, expect, openGame } = require('./fixtures/game.cjs');
const Rules = require('../../shared/account-rules.js');

test.use({ deterministicMusic: true });

const { accountService } = require('./fixtures/account-service.cjs');

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
