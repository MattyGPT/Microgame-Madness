const {test,expect,openGame}=require('./fixtures/game.cjs');
test('buy all uses an independent amount, previews affordable top tiers, spends once and saves',async({page},info)=>{
 await openGame(page);await page.locator('[data-game="coindrop"]').click();
 await page.evaluate(()=>{coinDropGame.p=CoinDrop.restore({dots:1e12,rubies:1e12,scrap:1e12,levels:Object.fromEntries(CoinDrop.nodes.map(n=>[n.id,1]))});coinDropGame.render();});
 await page.locator('[data-tab="tree"]').click();
 await expect(page.getByRole('group',{name:'Buy all purchase amount'}).locator('button')).toHaveCount(43);
 await page.locator('[data-buy-amount="25"]').click();await page.locator('[data-buy-all-amount="5"]').click();
 await expect(page.locator('[data-buy-amount="25"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#cd-buy-all')).toHaveText('Buy all ×5 · 16 categories');
 const before=await page.evaluate(()=>({wallet:{dots:coinDropGame.p.dots,rubies:coinDropGame.p.rubies,scrap:coinDropGame.p.scrap},plan:CoinDrop.planBuyAll(coinDropGame.p,5)}));
 await page.locator('.cd-buy-all summary').click();await expect(page.locator('#cd-buy-all-preview li')).toHaveCount(16);await expect(page.locator('#cd-buy-all-preview li').first()).toContainText('Apex Mint (tier 20) ×5');
 await page.screenshot({path:info.outputPath('buy-all-preview.png')});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#cd-buy-all').click();
 const after=await page.evaluate(()=>coinDropGame.p);
 for(const purchase of before.plan.purchases)expect(after.levels[purchase.id]).toBe(6);
 for(const currency of ['dots','rubies','scrap'])expect(after[currency]).toBe(before.wallet[currency]-before.plan.totals[currency]);
 await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready');expect(await page.evaluate(()=>coinDropGame.p.levels['mint-19'])).toBe(6);
 await page.locator('[data-game="coindrop"]').click();await page.evaluate(()=>{coinDropGame.p.dots=0;coinDropGame.p.rubies=0;coinDropGame.p.scrap=0;});await page.locator('[data-tab="tree"]').click();await expect(page.locator('#cd-buy-all')).toBeDisabled();
});
