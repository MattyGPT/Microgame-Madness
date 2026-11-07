const { test, expect } = require('./fixtures/game.cjs');

// The queue tests award their own medals; random Christmas playback must not
// enqueue an unrelated Santa award when a toast click enables audio.
test.use({ deterministicMusic: true });

test.beforeEach(async ({ page }) => {
  // Keep the automatic welcome award out of the batch under test.
  await page.addInitScript(() => localStorage.setItem('microgame-madness.v1', JSON.stringify({
    player: 'Toast tester', scores: {}, achievements: {
      stats: { visits: 1 }, unlocked: { welcome: '2026-11-02T12:00:00.000Z' },
    },
  })));
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
});

async function awardProtocols(page, count) {
  return page.evaluate(count => {
    const result = achievementTracker.update(stats => { stats.coreProtocolsBest = count; });
    updateAchievements(result);
    return result.earned.map(item => item.id);
  }, count);
}

const visibleIds = page => page.locator('#achievement-toast .achievement-toast')
  .evaluateAll(cards => cards.map(card => card.dataset.achievementId));

test('one, two, and three awards appear together in a vertical stack', async ({ page }, testInfo) => {
  for (const [total, batch] of [[2, 2], [5, 3], [6, 1]]) {
    const ids = await awardProtocols(page, total);
    expect(ids).toHaveLength(batch);
    expect(await visibleIds(page)).toEqual(ids);
    const boxes = await page.locator('#achievement-toast .achievement-toast')
      .evaluateAll(cards => cards.map(card => {
        const box = card.getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width, bottom: box.bottom, right: box.right };
      }));
    for (let index = 0; index < boxes.length; index++) {
      expect(boxes[index].x).toBeLessThan(20);
      expect(boxes[index].right).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
      if (index) {
        expect(boxes[index].x).toBe(boxes[index - 1].x);
        expect(boxes[index].y).toBeGreaterThan(boxes[index - 1].bottom);
      }
    }
    await page.clock.runFor(300);
    if (batch === 3)
      await page.locator('#achievement-toast').screenshot({ path: testInfo.outputPath('three-stacked-awards.png') });
    await page.clock.runFor(4200);
    await expect(page.locator('#achievement-toast')).toBeHidden();
    expect(await visibleIds(page)).toEqual([]);
  }
});

for (const count of [4, 7]) test(`${count} simultaneous awards show two at a time through the last queued award`, async ({ page }, testInfo) => {
  const ids = await awardProtocols(page, count);
  expect(ids).toHaveLength(count);
  const score = await page.locator('#profile-score').textContent();
  const unlocked = await page.evaluate(() => JSON.stringify(saved.achievements.unlocked));
  await page.locator('#player').focus();
  for (let index = 0; index < count; index += 2) {
    expect(await visibleIds(page)).toEqual(ids.slice(index, index + 2));
    await page.clock.runFor(300);
    if (index === 0 && count === 7)
      await page.locator('#achievement-toast').screenshot({ path: testInfo.outputPath('two-from-large-batch.png') });
    await page.clock.runFor(4199);
    expect(await visibleIds(page)).toEqual(ids.slice(index, index + 2));
    await page.clock.runFor(1);
    await expect(page.locator('#player')).toBeFocused();
  }
  await expect(page.locator('#achievement-toast')).toBeHidden();
  expect(await visibleIds(page)).toEqual([]);
  await expect(page.locator('#profile-score')).toHaveText(score);
  expect(await page.evaluate(() => JSON.stringify(saved.achievements.unlocked))).toBe(unlocked);
});

test('dismissing a card refills just its slot and new awards join the existing queue', async ({ page }) => {
  const ids = await awardProtocols(page, 4);
  await page.clock.runFor(1000);
  await page.locator('#achievement-toast .achievement-toast').first().getByRole('button').click();
  expect(await visibleIds(page)).toEqual([ids[1], ids[2]]);
  const added = await awardProtocols(page, 7);
  expect(added).toHaveLength(3);
  expect(await visibleIds(page)).toEqual([ids[1], ids[2]]);
  await page.clock.runFor(3500);
  expect(await visibleIds(page)).toEqual([ids[2], ids[3]]);
  await page.clock.runFor(1000);
  expect(await visibleIds(page)).toEqual([ids[3], added[0]]);
  // Dismiss the rest individually; no stale timer may resurrect a notification.
  while (await page.locator('#achievement-toast .achievement-toast').count())
    await page.locator('#achievement-toast .achievement-toast').first().getByRole('button').click();
  await page.clock.runFor(10000);
  expect(await visibleIds(page)).toEqual([]);
  await expect(page.locator('#achievement-toast')).toBeHidden();
});

test('reduced motion still drains a large queue without relying on animation events', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const ids = await awardProtocols(page, 4);
  expect(await visibleIds(page)).toEqual(ids.slice(0, 2));
  for (const toast of await page.locator('#achievement-toast .achievement-toast').all())
    await expect(toast).toHaveCSS('animation-name', 'none');
  await page.clock.runFor(4500);
  expect(await visibleIds(page)).toEqual(ids.slice(2));
  await page.clock.runFor(4500);
  await expect(page.locator('#achievement-toast')).toBeHidden();
});
