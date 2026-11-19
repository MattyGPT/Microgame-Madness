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

test('global rows show saved Cubies and award metallic bling only to absolute ranks one through three', async ({page},info) => {
  await openGame(page);
  await page.evaluate(async()=>{
    const client=await leaderboardReady;
    client.listGame=async()=>[
      {rank:1,player:'Golden player',score:900,cubie:'shop_retro'},
      {rank:2,player:'Silver player',score:800,cubie:'shop_dbtv'},
      {rank:3,player:'Bronze player',score:700,cubie:'shop_invisible',is_you:true},
      {rank:12,player:'<img src=x onerror=alert(1)>',score:600,cubie:'unknown-future-cubie'}
    ];
    document.getElementById('global-panel').hidden=false;
    await loadGlobalScores();
  });
  const rows=page.locator('#global-scores li');
  for(const [i,metal,id] of [[0,'gold','shop_retro'],[1,'silver','shop_dbtv'],[2,'bronze','shop_invisible']]){
    await expect(rows.nth(i)).toHaveAttribute('data-podium',metal);
    await expect(rows.nth(i).locator('.global-cubie svg')).toHaveAttribute('data-custom',id);
  }
  await expect(rows.nth(3)).not.toHaveAttribute('data-podium');
  await expect(rows.nth(3).locator('.global-cubie svg')).toHaveAttribute('data-custom','classic');
  await expect(rows.nth(3).locator('img')).toHaveCount(0);
  expect(await rows.evaluateAll(nodes=>nodes.every(n=>n.scrollWidth<=n.clientWidth+1))).toBe(true);
  await page.locator('#global-scores').screenshot({path:info.outputPath('podium-cubies.png')});
});
