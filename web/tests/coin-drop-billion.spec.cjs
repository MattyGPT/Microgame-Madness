const {test,expect,openGame}=require('./fixtures/game.cjs');
test('billion-size upgrades, buy all and forge batches remain usable and persist',async({page},info)=>{
 await openGame(page);await page.locator('[data-game="coindrop"]').click();
 await page.evaluate(()=>{coinDropGame.p=CoinDrop.restore({dots:1e25,scrap:1e12});coinDropGame.render();});
 await page.locator('[data-tab="tree"]').click();
 for(const label of ['Upgrade purchase amount','Buy all purchase amount'])await expect(page.getByRole('group',{name:label}).locator('button')).toHaveCount(43);
 await page.locator('[data-buy-amount="1000000000"]').click();await page.locator('.cd-node button').first().click();
 expect(await page.evaluate(()=>coinDropGame.p.levels['mint-0'])).toBe(1e9);
 await page.locator('[data-buy-all-amount="1000000000"]').click();await expect(page.locator('#cd-buy-all')).toContainText('16 categories');await page.locator('#cd-buy-all').click();
 expect(await page.evaluate(()=>coinDropGame.p.levels['mint-1'])).toBe(1e9);
 expect(await page.evaluate(()=>coinDropGame.p.levels['salvage-0'])).toBe(1e9);
 await page.locator('[data-tab="forge"]').click();await page.locator('[data-craft-amount="1000000000"]').click();
 await expect(page.locator('[data-craft="boost"]')).toContainText('20,000,000,000 scrap');await page.locator('[data-craft="boost"]').click();await page.locator('[data-craft="ruby"]').click();await page.locator('[data-craft="dots"]').click();
 expect(await page.evaluate(()=>coinDropGame.p.boosts)).toBe(1e10);expect(await page.evaluate(()=>coinDropGame.p.scrap)).toBe(870e9);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('billion-forge.png')});
 await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready');
 expect(await page.evaluate(()=>coinDropGame.p.boosts)).toBe(1e10);expect(await page.evaluate(()=>coinDropGame.p.levels['mint-0'])).toBe(1e9);
});
