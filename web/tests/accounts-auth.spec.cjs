const { leaveFullscreen } = require('./fixtures/game.cjs');
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
const password = 'Browser-test-passphrase-123!';
async function credentials(page, handle = 'private_player', confirm = false) {
  await page.locator('#account-handle').fill(handle);
  await page.locator('#account-password').fill(password);
  if (confirm) await page.locator('#account-confirm').fill(password);
}
async function acknowledgeRecovery(page) {
  await expect(page.locator('#account-recovery-step')).toBeVisible();
  await expect(page.locator('#account-recovery-code')).not.toHaveValue('');
  await page.locator('#account-recovery-saved').click();
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
  await credentials(page, 'private_player', true);
  let finishSnapshot;
  service.snapshotWait = new Promise(resolve => { finishSnapshot = resolve; });
  await page.locator('#account-create').click();
  try {
    await expect(page.locator('#account-dialog')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#account-recovery-step')).toBeVisible();
    expect(await page.evaluate(() => active)).toBe(false);
  } finally { finishSnapshot(); }
  // The profile stays modal throughout activation; clicking its background
  // entry button would wait forever for the dialog to stop intercepting it.
  await expect(page.locator('#account-dialog')).not.toHaveAttribute('aria-busy', 'true');
  await acknowledgeRecovery(page);
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
  expect(service.auth.some(request => request.body.action === 'register')).toBe(true);
  expect(JSON.stringify(service.commands)).not.toContain(password);
  await expect(page.locator('#account-summary')).not.toContainText(password);
  await page.locator('#account-sync').click();
  await expect(page.locator('#account-history')).toContainText('hangman · easy · win · 10 pts');
  expect(service.state.shop.units).toBe(40000);
  await expect(page.locator('#login-open')).toHaveClass(/signed-in/);
  await expect(page.locator('#login-open')).toHaveText('private_player');
  await page.locator('#account-close').click();
  // Public account names are independent of legacy name-triggered secrets.
  await leaveFullscreen(page);
  await page.locator('#player').fill('GRAVITRON');
  await expect.poll(() => service.state.player).toBe('GRAVITRON');
  expect(service.state.unlocks.singularity).toBe(false);
  await expect(page.locator('[data-game="singularity"]')).toBeHidden();
  await openProfile(page);
  await page.locator('#account-signout').click();
  await expect(page.locator('#account-auth')).toBeVisible();
  await expect(page.locator('#login-open')).toHaveText('Log In');
  await expect(page.locator('#login-open')).not.toHaveClass(/signed-in/);
  await expect.poll(() => page.evaluate(() => accountApp.controller.state().profile.shop.units)).toBe(0);
  await expect(page.locator('#account-history')).toContainText('Your next game starts your history');
  await page.locator('#account-close').click();
  await page.locator('#login-open').click();
  await expect(page.locator('#account-auth-form')).toHaveAttribute('data-mode', 'login');
  await expect(page.locator('#account-confirm-step')).toBeHidden();
  await credentials(page);
  await page.locator('#account-login').click();
  await expect(page.locator('#account-import')).toBeHidden();
  await expect(page.locator('#account-user-actions')).toBeVisible();
  await expect.poll(() => page.evaluate(() => accountApp.controller.state().profile.shop.units)).toBe(40000);
  await expect(page.locator('#account-name')).toHaveValue('GRAVITRON');
  // The entry button names the immutable handle, never the editable display name.
  await expect(page.locator('#login-open')).toHaveText('private_player');
  await expect(page.locator('#account-history')).toContainText('hangman · easy · win · 10 pts');
  expect(service.state.achievements.stats.hangmanWins).toBe(1);
  expect(service.signupCount).toBe(1);
  expect(service.auth.some(request => request.body.action === 'login')).toBe(true);
  // An expired session offers sign-in directly while keeping its local data.
  await page.evaluate(() => {
    accountApp.session.requiresSignIn = true;
    accountApp.controller.fail(Object.assign(new Error('Sign in again'), { code: 'sign_in_required' }));
  });
  await expect(page.locator('#account-auth')).toBeVisible();
  await expect(page.locator('#account-create')).toBeDisabled();
  await credentials(page);
  await page.locator('#account-login').click();
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
  await expect(page.locator('#account-handle')).toHaveValue('');
});

test('invalid credentials leave the guest journal available for retry', async ({ page }) => {
  const service = await accountService(page);
  service.handle = 'existing_player'; service.password = password;
  await openGame(page); await waitForAccount(page); await openProfile(page);
  await page.locator('#account-login').click();
  await credentials(page, 'existing_player');
  await page.locator('#account-password').fill('Incorrect-password-123');
  await page.locator('#account-login').click();
  await expect(page.locator('#account-message')).toContainText('incorrect');
  await expect(page.locator('#account-import')).toBeHidden();
  expect(await page.evaluate(() => accountApp.controller.state().owner)).toBe('guest');
  expect(service.revision).toBe(0);
  await page.locator('#account-new-account').click();
  await credentials(page, 'new_player', true);
  await page.locator('#account-create').click();
  await acknowledgeRecovery(page);
  await expect(page.locator('#account-import')).toBeVisible();
  expect(service.signupCount).toBe(1);
});
