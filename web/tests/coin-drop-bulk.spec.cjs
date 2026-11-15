const {test,expect,openGame}=require('./fixtures/game.cjs');
test('bulk selector quotes and buys every amount, keeps selection between branches, and saves ranks',async({page},info)=>{
 await openGame(page);await page.locator('[data-game="coindrop"]').click();
 await page.evaluate(()=>{coinDropGame.p.dots=2e16;coinDropGame.render();});
 await page.locator('[data-tab="tree"]').click();
 await expect(page.getByRole('group',{name:'Upgrade purchase amount'}).locator('button')).toHaveCount(43);
 await expect(page.locator('.cd-node button').nth(1)).toBeDisabled();
 let levels=0;
 for(const amount of [1,5,10,25,50,100,250,500,1000,2500,5000]){
  await page.locator(`[data-buy-amount="${amount}"]`).click();
  await expect(page.locator(`[data-buy-amount="${amount}"]`)).toHaveAttribute('aria-pressed','true');
  const before=await page.evaluate(amount=>({dots:coinDropGame.p.dots,price:CoinDrop.cost(coinDropGame.p,CoinDrop.nodes[0],amount)}),amount);
  await expect(page.locator('.cd-node button').first()).toContainText(`×${amount.toLocaleString('en')}`);
  await page.locator('.cd-node button').first().click();levels+=amount;
  expect(await page.evaluate(()=>coinDropGame.p.levels['mint-0'])).toBe(levels);
  expect(await page.evaluate(()=>coinDropGame.p.dots)).toBe(before.dots-before.price);
 }
 await page.getByRole('button',{name:'✦ Pegcraft',exact:true}).click();await expect(page.locator('[data-buy-amount="5000"]')).toHaveAttribute('aria-pressed','true');
 await page.screenshot({path:info.outputPath('bulk-upgrades.png')});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>{coinDropGame.p.dots=35;coinDropGame.render();});await expect(page.locator('.cd-node button').first()).toBeDisabled();
 await page.locator('[data-buy-amount="1"]').click();await expect(page.locator('.cd-node button').first()).toBeEnabled();await page.locator('.cd-node button').first().click();
 await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready');
 expect(await page.evaluate(()=>coinDropGame.p.levels['mint-0'])).toBe(9441);expect(await page.evaluate(()=>coinDropGame.p.levels['peg-0'])).toBe(1);
});
