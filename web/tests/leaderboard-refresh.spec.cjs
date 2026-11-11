const { test, expect, openGame } = require('./fixtures/game.cjs');

test('signed-in rounds and Refresh flush account scores and show the new lifetime total', async ({ page }) => {
  await openGame(page);
  const result = await page.evaluate(async () => {
    const previousApp = accountApp, client = await leaderboardReady, previousList = client.listGame;
    let flushes = 0, reads = 0;
    const panel = document.getElementById('global-panel'), hidden = panel.hidden;
    try {
      panel.hidden = false;
      document.getElementById('leaderboard-game').value = 'dodge';
      client.listGame = async () => {
        reads++;
        return [{ rank: 1, player: 'Test player', score: flushes === 1 ? 30109 : 30134, is_you: true }];
      };
      accountApp = { signedIn: true, ready: Promise.resolve(), settle: async () => {},
        controller: { state: () => ({ profile: { privacy: { leaderboard: true } } }),
          flush: async () => { flushes++; return { pending: 0 }; } } };
      await publishGlobalScore({ mode: 'dodge', difficulty: 'chaos', score: 4875 });
      const afterRound = document.getElementById('global-scores').textContent;
      await retryGlobalScores();
      await loadGlobalScores();
      return { flushes, reads, afterRound, afterRefresh: document.getElementById('global-scores').textContent };
    } finally { accountApp = previousApp; client.listGame = previousList; panel.hidden = hidden; }
  });
  expect(result.flushes).toBe(2);
  expect(result.reads).toBe(2);
  expect(result.afterRound).toContain('30109');
  expect(result.afterRefresh).toContain('30134');
});
