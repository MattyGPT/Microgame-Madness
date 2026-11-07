const { test, expect } = require('@playwright/test');

test('IndexedDB commits concurrent progress with its outbox and restores it after reopen', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof AccountStore !== 'undefined' && typeof AccountRules !== 'undefined');
  const result = await page.evaluate(async () => {
    const name = `account-storage-test-${crypto.randomUUID()}`;
    const first = new AccountStore.Store({ name, rules: AccountRules });
    const second = new AccountStore.Store({ name, rules: AccountRules });
    await first.ensure('test-owner');
    await second.open();
    await Promise.all([
      first.append('test-owner', 'arcade', { event: 'secret', name: 'cube' }),
      second.append('test-owner', 'arcade', { event: 'secret', name: 'cube' }),
    ]);
    const saved = await first.get('test-owner');
    first.close(); second.close();
    const restored = new AccountStore.Store({ name, rules: AccountRules });
    const record = await restored.get('test-owner');
    const output = { durable: restored.durable, count: record.optimistic.achievements.stats.cubePets,
      pending: record.pending.length, sameIds: JSON.stringify(saved.pending.map(op => op.id)) === JSON.stringify(record.pending.map(op => op.id)),
      sequences: record.pending.map(op => op.sequence) };
    restored.close(); indexedDB.deleteDatabase(name); return output;
  });
  expect(result).toEqual({ durable: true, count: 2, pending: 2, sameIds: true, sequences: [1, 2] });
});

test('IndexedDB acknowledgement rebases new pending work and rejects cross-owner binding', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof AccountStore !== 'undefined' && typeof AccountRules !== 'undefined');
  const result = await page.evaluate(async () => {
    const name = `account-binding-test-${crypto.randomUUID()}`;
    const store = new AccountStore.Store({ name, rules: AccountRules });
    await store.ensure('guest');
    await store.append('guest', 'arcade', { event: 'secret', name: 'cube' });
    await store.bind('guest', 'alice');
    let denied = false;
    try { await store.bind('guest', 'bob'); } catch (error) { denied = error.code === 'already_bound'; }
    await store.append('alice', 'arcade', { event: 'secret', name: 'cube' });
    let record = await store.get('alice');
    const first = record.pending[0];
    await store.acknowledge('alice', { state: AccountRules.apply(AccountRules.initial(), first).state,
      revision: 1, receipts: [{ id: first.id, status: 'applied' }] });
    record = await store.get('alice');
    const output = { denied, confirmed: record.confirmed.achievements.stats.cubePets,
      optimistic: record.optimistic.achievements.stats.cubePets, pending: record.pending.length,
      missingOtherOwner: (await store.get('bob')) === undefined };
    store.close(); indexedDB.deleteDatabase(name); return output;
  });
  expect(result).toEqual({ denied: true, confirmed: 1, optimistic: 2, pending: 1, missingOtherOwner: true });
});

test('two browser tabs claim different streams and reload preserves the original stream', async ({ page, context }) => {
  await page.goto('/');
  const second = await context.newPage();
  await second.goto('/');
  await Promise.all([page.waitForFunction(() => typeof AccountStore !== 'undefined'), second.waitForFunction(() => typeof AccountStore !== 'undefined')]);
  const databaseName = `account-tabs-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const firstStream = await page.evaluate(async name => {
    const store = new AccountStore.Store({ name, rules: AccountRules });
    await store.ensure('guest'); const stream = await store.claimStream('guest', 'first-tab');
    await store.append('guest', 'run.start', { mode: 'hangman', difficulty: 'easy' }, { streamId: stream, runId: 'run-one' });
    store.close(); return stream;
  }, databaseName);
  const secondStream = await second.evaluate(async name => {
    const store = new AccountStore.Store({ name, rules: AccountRules });
    const stream = await store.claimStream('guest', 'second-tab');
    await store.append('guest', 'run.start', { mode: 'dodge', difficulty: 'normal' }, { streamId: stream, runId: 'run-two' });
    store.close(); return stream;
  }, databaseName);
  expect(secondStream).not.toBe(firstStream);
  await page.reload();
  await page.waitForFunction(() => typeof AccountStore !== 'undefined');
  const resumed = await page.evaluate(async name => {
    const store = new AccountStore.Store({ name, rules: AccountRules });
    const stream = await store.claimStream('guest', 'first-tab'), record = await store.get('guest');
    const result = { stream, firstFinished: record.optimistic.runs['run-one'].finished,
      secondFinished: record.optimistic.runs['run-two'].finished };
    store.close(); indexedDB.deleteDatabase(name); return result;
  }, databaseName);
  expect(resumed).toEqual({ stream: firstStream, firstFinished: false, secondFinished: false });
  await second.close();
});

test('copied tab identifiers cannot share a live gameplay stream', async ({ page, context }) => {
  await page.goto('/'); const second = await context.newPage(); await second.goto('/');
  await Promise.all([page.waitForFunction(() => typeof AccountSync !== 'undefined'), second.waitForFunction(() => typeof AccountSync !== 'undefined')]);
  const databaseName = `account-locks-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  async function claim(page) {
    return page.evaluate(async name => {
      const store = new AccountStore.Store({ name, rules: AccountRules });
      const session = { configured: false, generation: 0, snapshot: () => ({ user: null }), subscribe: () => () => {} };
      const controller = new AccountSync.Controller({ store, session, rules: AccountRules, events: null });
      await controller.initialize();
      sessionStorage.setItem('microgame-madness.account-tab', 'copied-tab');
      const tabId = await AccountApp.App.prototype.tabIdentity();
      await controller.claimStream(tabId);
      globalThis.testAccountLockController = controller;
      return { stream: controller.streamId, tabId: controller.tabId };
    }, databaseName);
  }
  const first = await claim(page), duplicate = await claim(second);
  expect(duplicate.stream).not.toBe(first.stream);
  expect(first.tabId).toBe('copied-tab');
  expect(duplicate.tabId).not.toBe(first.tabId);
  for (const tab of [page, second]) await tab.evaluate(() => { testAccountLockController.close(); testAccountLockController.store.close(); });
  await second.close();
  await page.evaluate(name => indexedDB.deleteDatabase(name), databaseName);
});
