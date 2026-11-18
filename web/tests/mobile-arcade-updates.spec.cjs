const {test,expect,openGame,leaveFullscreen}=require('./fixtures/game.cjs');
test.use({deterministicMusic:true});
test('shop purchases work with touch and mouse, report low funds, and persist DBTV',async({page,isMobile},info)=>{
  test.setTimeout(150000);await openGame(page);await leaveFullscreen(page);
  await page.evaluate(async()=>{await accountApp.ready;selectGame('shop');});
  const action=async locator=>isMobile?locator.tap():locator.click();
  let card=page.locator('[data-custom="shop_dbtv"]').filter({has:page.locator('button')});
  await expect(card.locator('button')).toBeEnabled();await action(card.locator('button'));
  await expect(page.locator('#shop-status')).toContainText('Cash');
  await page.evaluate(async()=>{await accountApp.settle();const owner=accountApp.controller.state().owner;await accountApp.store.mutate(owner,record=>{record.confirmed.shop.units=10000000;return accountApp.store.rebase(record);});await accountApp.controller.refreshLocal();accountApp.applyCurrent();});
  await action(card.locator('button'));await expect(card.locator('button')).toHaveText('Wear Custom');
  await action(card.locator('button'));await expect(page.locator('#cube')).toHaveAttribute('data-custom','shop_dbtv');
  await expect(card.locator('.dbtv-no-eyes')).toHaveCount(1);await expect(card.locator('.cubie-eyes')).toHaveCount(0);
  await card.screenshot({path:info.outputPath('dbtv.png')});
  for(const [tab,grid] of [['#shop-turtles-tab','#turtle-custom-grid'],['#shop-trails-tab','#trail-grid']]){
    await action(page.locator(tab));const buy=page.locator(grid+' button').filter({hasText:/^Buy/}).first();await expect(buy).toBeEnabled();await action(buy);
    await expect(page.locator('#shop-status')).toContainText('is yours');
  }
  await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready',{timeout:30000});
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','shop_dbtv');
  expect(await page.evaluate(()=>saved.shop.owned.includes('shop_dbtv'))).toBe(true);
});
test('Geomutilator survives an immediate reload before its asynchronous save starts',async({page})=>{
  await openGame(page);await page.evaluate(async()=>{await accountApp.ready;});
  const receipt=await page.evaluate(()=>{accountApp.chain=new Promise(()=>{});achievementTracker.completeForge();return localStorage.getItem(accountApp.forgeRecoveryKey());});
  expect(JSON.parse(receipt).id).toBeTruthy();
  await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready',{timeout:30000});
  await expect.poll(()=>page.evaluate(()=>geomutilatorUnlocked())).toBe(true);
  await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready',{timeout:30000});
  await expect.poll(()=>page.evaluate(()=>geomutilatorUnlocked())).toBe(true);
});
test('Coin Drop instructions are above the board and Signal Recognized is secret',async({page})=>{
  await openGame(page);await page.evaluate(()=>selectGame('coindrop'));
  const guidance=page.locator('.cd-instructions');await expect(guidance).toBeVisible();
  expect(await guidance.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(17);
  expect((await guidance.boundingBox()).y).toBeLessThan((await page.locator('#cd-board').boundingBox()).y);
  const secret=await page.evaluate(()=>({secret:Achievements.catalog.find(a=>a.id==='gaster_remix').secret,redacted:achievementCards.get('gaster_remix').classList.contains('redacted')}));
  expect(secret).toEqual({secret:true,redacted:true});
});
