const { leaveFullscreen } = require('./fixtures/game.cjs');
const { test, expect, openGame } = require('./fixtures/game.cjs');

test('Endurance plays six-character rounds with a fixed timer on keyboard and touch', async ({ page }, testInfo) => {
  await openGame(page);
  await leaveFullscreen(page);
  await page.locator('[data-game="keyboard"]').click();
  const choice = page.locator('[data-difficulty="endurance"]');
  await expect(choice).toContainText('50%');
  await choice.click();
  for (let round = 0; round < 3; round++) {
    await expect(page.locator('#sequence span')).toHaveCount(6);
    const sequence = await page.locator('#sequence').innerText();
    if (testInfo.project.name === 'mobile') {
      for (const letter of sequence) {
        const symbols = /[0-9]/.test(letter);
        const toggle = page.locator('#typing-symbols');
        if ((await toggle.getAttribute('aria-pressed') === 'true') !== symbols) await toggle.tap();
        await page.getByRole('button', { name: `Type ${letter}`, exact: true }).tap();
      }
    } else await page.keyboard.type(sequence);
    await expect(page.locator('#score')).toHaveText(String(round + 1));
    expect(await page.evaluate(() => snapshot.time_limit)).toBe(8);
  }
  const medals = await page.evaluate(() => achievementTracker.data.unlocked);
  expect(Object.keys(medals).filter(id => id === 'play_keyboard' || id.startsWith('typing_'))).toEqual([]);
  // Check the actual UI bar in a late round, where Progressive has a 4s timer.
  const width = await page.evaluate(() => {
    snapshot = { ...snapshot, level: 100, remaining: 4 };
    render();
    return document.getElementById('timer-bar').style.width;
  });
  expect(width).toBe('50%');
  await page.locator('#exit').click();
  await expect(page.locator('[data-difficulty="endurance"]')).toBeVisible();
});
