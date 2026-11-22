const {test,expect,openGame,leaveFullscreen}=require('./fixtures/game.cjs');
test.use({deterministicMusic:true});
test('current #1 players get all pack previews once; popup waits for gameplay and respects account changes',async({page},info)=>{
  await openGame(page);await leaveFullscreen(page);
  await page.evaluate(async()=>{
    await accountApp.ready;
    const client=await leaderboardReady;client.configured=true;client.listGame=async mode=>[{rank:1,is_you:true}];
    active=true;await refreshCrowns();showCrownCelebration();
  });
  await expect(page.locator('#crown-celebration')).not.toBeVisible();
  await page.evaluate(()=>{active=false;showCrownCelebration();});
  const dialog=page.locator('#crown-celebration');await expect(dialog).toBeVisible();
  await expect(dialog.locator('.crown-celebration-pack')).toHaveCount(13);
  await expect(dialog.locator('figure')).toHaveCount(39);
  await expect(dialog).toContainText('Keep first place');
  await dialog.screenshot({path:info.outputPath('crown-packs-celebration.png')});
  await page.locator('#crown-celebration-close').click();await page.evaluate(()=>refreshCrowns());await expect(dialog).not.toBeVisible();
  await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready',{timeout:30000});
  await page.evaluate(async()=>{const client=await leaderboardReady;client.configured=true;client.listGame=async mode=>[{rank:1,is_you:true}];await refreshCrowns();});
  await expect(page.locator('#crown-celebration')).not.toBeVisible();
  await page.evaluate(async()=>{const client=await leaderboardReady;client.listGame=async()=>[{rank:1,is_you:false}];await refreshCrowns();client.listGame=async mode=>[{rank:1,is_you:mode==='hangman'}];await refreshCrowns();});
  await expect(page.locator('#crown-celebration')).toBeVisible();
  await page.locator('#crown-celebration-view').click();await expect(page.locator('#customs-grid')).toBeVisible();
  await expect(page.locator('#customs-grid .custom-tile:visible')).toHaveCount(13);
});
