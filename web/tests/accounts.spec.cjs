const { test, expect, openGame } = require('./fixtures/game.cjs');
const fs = require('node:fs/promises');
const { accountService } = require('./fixtures/account-service.cjs');

test.use({ deterministicMusic: true });

async function openAccountsGame(page) {
  await openGame(page);
  await page.waitForFunction(() => accountApp?.initialized && accountApp?.controller?.state()?.status !== 'loading');
}
async function profile(page) {
  await page.locator('#account-open').click();
  await expect(page.locator('#account-dialog')).toBeVisible();
  await expect(page.locator('#account-dialog')).not.toHaveAttribute('aria-busy', 'true');
}
async function guestRecord(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const opening = indexedDB.open('microgame-madness.accounts.v1', 1);
    opening.onerror = () => reject(opening.error);
    opening.onsuccess = () => {
      const db = opening.result;
      const request = db.transaction('profiles', 'readonly').objectStore('profiles').get('guest');
      request.onsuccess = () => { db.close(); resolve(request.result); };
      request.onerror = () => { db.close(); reject(request.error); };
    };
  }));
}
async function deterministicHangman(page) {
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'HangmanGame(random.choice(rules["words"]), rules["max_attempts"])',
      'HangmanGame("cat", rules["max_attempts"])') });
  });
}
async function winHangman(page) {
  await page.locator('[data-game="hangman"]').click();
  await page.locator('[data-difficulty="easy"]').click();
  for (const letter of ['C', 'A', 'T']) await page.getByRole('button', { name: `Guess ${letter}`, exact: true }).click();
  await expect(page.locator('#overlay')).toBeVisible();
  await expect.poll(async () => {
    const record = await guestRecord(page);
    return Object.values(record.optimistic.runs).filter(run => run.finished && run.outcome === 'win').length;
  }).toBe(1);
}

test('guest profile remains usable when cloud accounts are disconnected', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openAccountsGame(page);
  await profile(page);
  await expect(page.locator('#account-status')).toContainText('Guest');
  await expect(page.locator('#account-status')).toContainText('Cloud accounts are not connected yet');
  await expect(page.locator('#account-create')).toBeDisabled();
  await expect(page.locator('#account-login')).toBeDisabled();
  await expect(page.locator('#account-sync')).toBeDisabled();
  await expect(page.locator('#account-auth input[type="email"]')).toHaveCount(0);
  await expect(page.locator('#account-password')).toHaveAttribute('autocomplete', 'new-password');
  await page.locator('#account-password').fill('An unsaved password 42!');
  await page.locator('[data-password="account-password"]').click();
  await expect(page.locator('#account-password')).toHaveAttribute('type', 'text');
  await expect(page.locator('#account-ranking')).toBeChecked();
  await expect(page.locator('#account-public')).toBeChecked();
  await expect(page.locator('#account-export')).toBeEnabled();
  await expect(page.locator('#account-history')).toContainText('Your next game starts your history');
  expect(await page.locator('#account-dialog').evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('account-profile.png') });
  await page.locator('#account-close').click();
  await expect(page.locator('#account-open')).toBeFocused();
  await expect(page.locator('#account-password')).toHaveValue('');
  expect(errors).toEqual([]);
});

test('a real Hangman win journals once in IndexedDB and history survives reload without another reward', async ({ page }) => {
  await deterministicHangman(page);
  await openAccountsGame(page);
  await winHangman(page);
  const before = await guestRecord(page);
  const finished = Object.values(before.optimistic.runs).filter(run => run.finished);
  expect(finished).toHaveLength(1);
  expect(finished[0]).toMatchObject({ mode: 'hangman', difficulty: 'easy', outcome: 'win', score: 10 });
  expect(before.pending.filter(operation => operation.kind === 'run.finish')).toHaveLength(1);
  expect(before.optimistic.shop.units).toBe(40000);
  expect(before.optimistic.achievements.stats.hangmanWins).toBe(1);
  await profile(page);
  await expect(page.locator('#account-history li')).toHaveCount(1);
  await expect(page.locator('#account-history')).toContainText('hangman · easy · win · 10 pts');
  await page.reload();
  await page.waitForFunction(() => accountApp?.initialized && accountApp?.controller?.state()?.status === 'guest');
  await profile(page);
  await expect(page.locator('#account-history li')).toHaveCount(1);
  const after = await guestRecord(page);
  expect(after.optimistic.shop.units).toBe(before.optimistic.shop.units);
  expect(after.optimistic.achievements.stats.hangmanWins).toBe(1);
  expect(Object.values(after.optimistic.runs).filter(run => run.finished)).toHaveLength(1);
  await page.locator('#account-history-outcome').selectOption('loss');
  await expect(page.locator('#account-history')).toContainText('Your next game starts your history');
});

test('preferences persist and an arcade code does not rename the profile', async ({ page }) => {
  await openAccountsGame(page);
  await profile(page);
  await page.locator('#account-name').fill('Account Tester');
  await page.locator('#account-sound').uncheck();
  await page.locator('#account-motion').check();
  await page.locator('#account-save-settings').click();
  await expect(page.locator('#account-message')).toHaveText('Preferences saved.');
  await page.locator('#account-close').click();
  await expect(page.locator('#sound')).toHaveText('Sound off');
  await expect(page.locator('#player')).toHaveValue('Account Tester');
  await page.locator('#arcade-code').fill('PIXEL');
  await page.locator('#arcade-code-submit').click();
  await expect(page.locator('#player')).toHaveValue('Account Tester');
  await expect.poll(async () => (await guestRecord(page)).optimistic.achievements.stats.name_pixel).toBe(1);
  await page.reload();
  await page.waitForFunction(() => accountApp?.initialized && accountApp?.controller?.state()?.status === 'guest');
  await expect(page.locator('#sound')).toHaveText('Sound off');
  await expect(page.locator('#player')).toHaveValue('Account Tester');
  await profile(page);
  await expect(page.locator('#account-sound')).not.toBeChecked();
  await expect(page.locator('#account-motion')).toBeChecked();
  await expect(page.locator('#account-name')).toHaveValue('Account Tester');
  expect(await page.evaluate(() => coreOrigin.reducedMotion)).toBe(true);
});

test('export and reviewed restore preserve progress without adding Cash or historical runs', async ({ page }) => {
  await deterministicHangman(page);
  await openAccountsGame(page);
  await winHangman(page);
  await profile(page);
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#account-export').click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('microgame-madness-progress.json');
  const archive = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
  expect(archive.version).toBe(1);
  expect(archive.profile.shop.units).toBe(40000);
  expect(archive.profile.achievements.stats.hangmanWins).toBe(1);
  expect(JSON.stringify(archive)).not.toMatch(/access_token|refresh_token/);
  await page.locator('#account-file').setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(archive)) });
  await expect(page.locator('#account-import')).toBeVisible();
  await expect(page.locator('#account-import-summary')).toContainText('Additional Cash, counters, and streaks stay in the backup');
  await page.locator('#account-import-confirm').click();
  await expect(page.locator('#account-import')).toBeHidden();
  const restored = await guestRecord(page);
  expect(restored.optimistic.shop.units).toBe(40000);
  expect(restored.optimistic.achievements.stats.hangmanWins).toBe(1);
  expect(Object.values(restored.optimistic.runs).filter(run => run.finished)).toHaveLength(1);
  expect(restored.backups.length).toBeGreaterThan(0);
});

test('reloading an unfinished round records interruption and permits the next round', async ({ page }) => {
  await deterministicHangman(page);
  await openAccountsGame(page);
  await page.locator('[data-difficulty="easy"]').click();
  await page.getByRole('button', { name: 'Guess C', exact: true }).click();
  await expect.poll(async () => Object.values((await guestRecord(page)).optimistic.runs).length).toBe(1);
  await page.reload();
  await page.waitForFunction(() => accountApp?.initialized && accountApp?.controller?.state()?.status === 'guest');
  await expect.poll(async () => Object.values((await guestRecord(page)).optimistic.runs).filter(run => run.outcome === 'interrupted').length).toBe(1);
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await winHangman(page);
  const record = await guestRecord(page);
  expect(Object.values(record.optimistic.runs).filter(run => run.outcome === 'interrupted')).toHaveLength(1);
  expect(record.optimistic.shop.units).toBe(40000);
});

test('blocked browser storage is reported without blocking guest gameplay', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'indexedDB', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } }));
  await openAccountsGame(page);
  await profile(page);
  await expect(page.locator('#account-status')).toContainText('Storage unavailable');
  await expect(page.locator('#account-status')).toContainText('Progress lasts for this visit');
  await page.locator('#account-close').click();
  await page.locator('[data-difficulty="easy"]').click();
  await expect(page.locator('#hangman-game')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guess A', exact: true })).toBeEnabled();
});


test('profile recovery, password replacement and recovery rotation keep the same owner', async ({ page }) => {
  await accountService(page);
  await openAccountsGame(page); await profile(page);
  await page.locator('#account-handle').fill('profile_player');
  await page.locator('#account-password').fill('Unique arcade password 42!');
  await page.locator('#account-confirm').fill('Unique arcade password 42!');
  await page.locator('#account-confirm').press('Enter');
  await expect(page.locator('#account-recovery-step')).toBeVisible();
  const code = await page.locator('#account-recovery-code').inputValue();
  await page.locator('#account-recovery-saved').click();
  await expect(page.locator('#account-import')).toBeVisible();
  await page.locator('#account-import-confirm').click();
  await expect(page.locator('#account-import')).toBeHidden();
  const owner = await page.evaluate(() => accountApp.controller.state().owner);
  await page.locator('#account-signout').click();
  await expect(page.locator('#account-auth')).toBeVisible();
  await page.locator('#account-recover').click();
  await page.locator('#account-handle').fill('profile_player');
  await page.locator('#account-recovery').fill(code);
  await page.locator('#account-password').fill('Replacement password 43!');
  await page.locator('#account-confirm').fill('Replacement password 43!');
  await page.locator('#account-recover').click();
  await expect(page.locator('#account-recovery-step')).toBeVisible();
  expect(await page.locator('#account-recovery-code').inputValue()).not.toBe(code);
  await page.locator('#account-recovery-saved').click();
  await expect.poll(() => page.evaluate(() => accountApp.controller.state().owner)).toBe(owner);
  await page.getByText('Password & recovery', { exact: true }).click();
  await page.locator('#account-current-password').fill('Replacement password 43!');
  await page.locator('#account-new-password').fill('Changed arcade password 44!');
  await page.locator('#account-new-confirm').fill('Changed arcade password 44!');
  await page.locator('#account-change-password').click();
  await expect(page.locator('#account-message')).toContainText('Password changed');
  await expect(page.locator('#account-current-password')).toHaveValue('');
  await page.locator('#account-recovery-saved').click();
  await page.locator('#account-current-password').fill('Changed arcade password 44!');
  await page.locator('#account-rotate-recovery').click();
  await expect(page.locator('#account-recovery-step')).toBeVisible();
  await expect(page.locator('#account-recovery-code')).not.toHaveValue('');
  await page.locator('#account-recovery-saved').click();
  expect(await page.evaluate(() => accountApp.controller.state().owner)).toBe(owner);
});

test('one-time recovery survives a failed first cloud snapshot and clears on another tab account change', async ({ page }) => {
  await accountService(page);
  await openAccountsGame(page); await profile(page);
  await page.route('https://accounts.test/functions/v1/accounts', async route => {
    if (route.request().method() === 'POST' && route.request().postDataJSON().action === 'snapshot')
      return route.fulfill({ status: 503, headers: { 'access-control-allow-origin': '*' }, json: { error: { code: 'unavailable', message: 'Temporary snapshot failure' } } });
    return route.fallback();
  });
  await page.locator('#account-handle').fill('snapshot_player');
  await page.locator('#account-password').fill('Unique arcade password 42!');
  await page.locator('#account-confirm').fill('Unique arcade password 42!');
  await page.locator('#account-create').click();
  await expect(page.locator('#account-dialog')).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#account-message')).toContainText('snapshot failure');
  expect(await page.evaluate(() => accountApp.controller.state().owner)).toBe('guest');
  await expect(page.locator('#account-recovery-step')).toBeVisible();
  await expect(page.locator('#account-recovery-code')).not.toHaveValue('');
  await page.evaluate(() => {
    localStorage.removeItem(accountApp.session.storageKey);
    window.dispatchEvent(new StorageEvent('storage', { key: accountApp.session.storageKey }));
  });
  await expect(page.locator('#account-recovery-step')).toBeHidden();
  await expect(page.locator('#account-recovery-code')).toHaveValue('');
});
