const {test,expect,openGame,leaveFullscreen}=require('./fixtures/game.cjs');
test.use({deterministicMusic:true});
test('Treasure Trove plays a full round with touch or mouse and exposes its theme in the jukebox',async({page,isMobile},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await openGame(page);await leaveFullscreen(page);await page.locator('[data-game="treasure"]').click();
  await page.locator('#trove-next').click();
  await expect(page.locator('#trove-status')).toContainText('Follow this chest');
  await expect(page.locator('.trove-chest')).toHaveCount(3);await expect(page.locator('.trove-number')).toHaveCount(0);
  // Track the revealed chest through the actual shuffle by its stable DOM node.
  const target=await page.locator('.trove-chest.has-treasure').elementHandle();
  await expect(page.locator('#trove-status')).toContainText('Which chest',{timeout:15000});
  if(isMobile)await target.tap();else await target.click();
  await expect(page.locator('#trove-status')).toContainText('Treasure found');await expect(page.locator('#trove-best')).toHaveText('1');
  await page.locator('#treasure-room').screenshot({path:info.outputPath('treasure-trove.png')});
  await page.locator('#trove-next').click();await expect(page.locator('#trove-round')).toContainText('Round 2');
  await page.locator('#trove-pause').click();await expect(page.locator('#trove-status')).toContainText('Paused');
  const before=await page.evaluate(()=>treasureTrove.round.age);await page.evaluate(()=>treasureTrove.tick(performance.now()+2000));expect(await page.evaluate(()=>treasureTrove.round.age)).toBe(before);
  await page.evaluate(()=>selectGame('jukebox'));
  await expect(page.locator('[data-difficulty="treasure_trove"]')).toContainText('Gilded Tides');
  await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready',{timeout:30000});await page.evaluate(()=>selectGame('treasure'));await expect(page.locator('#trove-best')).toHaveText('1');
  expect(errors).toEqual([]);
});
test('unaffordable shop items are gray and labeled Too Expensive, then update when funded; turtle tile is static',async({page})=>{
  await openGame(page);await leaveFullscreen(page);await page.evaluate(()=>selectGame('shop'));
  for(const [tab,grid] of [['#shop-customs-tab','#shop-grid'],['#shop-turtles-tab','#turtle-custom-grid'],['#shop-trails-tab','#trail-grid']]){
    await page.locator(tab).click();const button=page.locator(grid+' .custom-equip').first();await expect(button).toHaveText('Too Expensive');await expect(button).toHaveCSS('background-color','rgb(52, 58, 64)');
  }
  await page.evaluate(async()=>{await accountApp.ready;const owner=accountApp.controller.state().owner;await accountApp.store.mutate(owner,record=>{record.confirmed.shop.units=10000000;return accountApp.store.rebase(record);});await accountApp.controller.refreshLocal();accountApp.applyCurrent();});
  await expect(page.locator('#trail-grid .custom-equip').first()).toContainText('Buy');
  const animations=await page.locator('[data-game="turtles"]').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length);expect(animations).toBe(0);
});
