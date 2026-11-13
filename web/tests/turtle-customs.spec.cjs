const {test,expect}=require('./fixtures/game.cjs');
test('Turtle Customs purchase, equipment, search, reload and game rendering',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{if(!localStorage.getItem('microgame-madness.v1'))localStorage.setItem('microgame-madness.v1',JSON.stringify({shop:{units:1000000,owned:[]}}));});
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready',{timeout:30000});
  await page.locator('[data-game="shop"]').click();
  await page.locator('#shop-turtles-tab').click();
  await expect(page.locator('#turtle-custom-grid article')).toHaveCount(57);
  const first=page.locator('#turtle-custom-grid [data-trail="turtle_bronze_fern"] button');
  await first.click();await first.click();
  await expect(first).toHaveText('Equipped ✓');
  await expect(page.locator('#shop-balance')).toHaveText('850 Cubie Cash');
  await page.locator('#shop-search').fill('empyrorite');
  await expect(page.locator('#turtle-custom-grid article:visible')).toHaveCount(9);
  await page.screenshot({path:testInfo.outputPath('turtle-customs.png')});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready',{timeout:30000});
  expect(await page.evaluate(()=>saved.turtleCustom)).toBe('turtle_bronze_fern');
  await page.evaluate(()=>{window.customDraws=0;const original=TurtleCustoms.draw;TurtleCustoms.draw=(...args)=>{window.customDraws++;original(...args);};});
  for(const [mode,difficulty] of [['dodge','easy'],['boss','mean'],['pumpkin','baby'],['wrath','bone_gauntlet']]) {
    await page.evaluate(([m,d])=>{window.customDraws=0;selectGame(m);startGame(d);},[mode,difficulty]);
    await expect.poll(()=>page.evaluate(()=>window.customDraws)).toBeGreaterThan(0);
  }
  expect(errors).toEqual([]);
});
