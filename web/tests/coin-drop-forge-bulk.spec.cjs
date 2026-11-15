const {test,expect,openGame}=require('./fixtures/game.cjs');
test('forge bulk controls show total prices, award full batches, and save rewards',async({page},info)=>{
 await openGame(page);await page.locator('[data-game="coindrop"]').click();
 await page.evaluate(()=>{coinDropGame.p.scrap=1000000;coinDropGame.p.boosts=9999;coinDropGame.render();});
 await page.locator('[data-tab="forge"]').click();
 const amounts=page.getByRole('group',{name:'Forge purchase amount'});await expect(amounts.locator('button')).toHaveCount(29);
 for(const amount of [1,5,10,25,50,100,250,500,1000,2500,5000]){
  await page.locator(`[data-craft-amount="${amount}"]`).click();await expect(page.locator(`[data-craft-amount="${amount}"]`)).toHaveAttribute('aria-pressed','true');
  for(const [kind,price]of [['boost',20],['ruby',60],['dots',50]])await expect(page.locator(`[data-craft="${kind}"]`)).toContainText(`${(amount*price).toLocaleString('en')} scrap`);
 }
 await page.locator('[data-craft="boost"]').click();await page.locator('[data-craft="ruby"]').click();await page.locator('[data-craft="dots"]').click();
 expect(await page.evaluate(()=>({scrap:coinDropGame.p.scrap,boosts:coinDropGame.p.boosts,rubies:coinDropGame.p.rubies,cleared:coinDropGame.p.cleared}))).toEqual({scrap:350000,boosts:59999,rubies:15003,cleared:1});
 await page.screenshot({path:info.outputPath('forge-bulk.png')});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>{coinDropGame.p.scrap=50;coinDropGame.render();});await expect(page.locator('[data-craft="dots"]')).toBeDisabled();
 await page.locator('[data-craft-amount="1"]').click();await expect(page.locator('[data-craft="dots"]')).toBeEnabled();await page.locator('[data-craft="dots"]').click();
 await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready');
 expect(await page.evaluate(()=>coinDropGame.p.boosts)).toBe(59999);expect(await page.evaluate(()=>coinDropGame.p.scrap)).toBe(0);
});
