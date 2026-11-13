const {test,expect,openGame}=require('./fixtures/game.cjs');

test('new shop collection buys, equips, persists, and pauses hidden artwork',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    if(!localStorage.getItem('microgame-madness.v1'))
      localStorage.setItem('microgame-madness.v1',JSON.stringify({shop:{units:8000000,owned:[]}}));
  });
  await openGame(page);
  await page.evaluate(async()=>{await accountApp.ready;selectGame('shop');});
  await expect(page.locator('#shop-grid .custom-tile')).toHaveCount(171);
  const first=page.locator('#shop-grid article[data-custom="shop_atelier_butter_biscuit"]');
  await first.scrollIntoViewIfNeeded();
  await expect(first).not.toHaveClass(/shop-art-paused/);
  await expect(page.locator('#shop-grid article[data-custom="shop_atelier_jubilation_monarch"]')).toHaveClass(/shop-art-paused/);
  await page.locator('#shop-search').fill('Jubilation Monarch');
  const royal=page.locator('#shop-grid article[data-custom="shop_atelier_jubilation_monarch"]');
  await royal.scrollIntoViewIfNeeded();
  await expect(royal).not.toHaveClass(/shop-art-paused/);
  await royal.locator('button').click();
  await expect(royal.locator('button')).toHaveText('Wear Custom');
  await royal.locator('button').click();
  await expect.poll(()=>page.evaluate(()=>saved.cubieCustom)).toBe('shop_atelier_jubilation_monarch');
  expect(await page.evaluate(()=>saved.shop.units)).toBe(998000);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  expect(await page.evaluate(()=>saved.cubieCustom)).toBe('shop_atelier_jubilation_monarch');
  expect(await page.evaluate(()=>saved.shop.owned.includes('shop_atelier_jubilation_monarch'))).toBe(true);
  await page.evaluate(()=>selectGame('shop'));
  await page.locator('#shop-search').fill('Jubilation Monarch');
  await royal.scrollIntoViewIfNeeded();
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await royal.locator('.atelier-orbit').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  expect(errors).toEqual([]);
});
