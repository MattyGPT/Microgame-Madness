const {test,expect,openGame}=require('./fixtures/game.cjs');
test('unaffordable ultra batches are disabled while existing ranks and rewards survive',async({page},info)=>{
 await openGame(page);await page.locator('[data-game="coindrop"]').click();
 await page.evaluate(()=>{coinDropGame.p=CoinDrop.restore({dots:1e300,rubies:1e300,scrap:1e300,boosts:1});coinDropGame.render();});
 await page.locator('[data-tab="tree"]').click();
 await page.locator('[data-buy-all-amount="1e+200"]').click();await expect(page.locator('#cd-buy-all')).toBeDisabled();
 await page.locator('[data-buy-amount="1e+200"]').click();await expect(page.locator('.cd-node button').first()).toBeDisabled();await expect(page.locator('.cd-node button').first()).toHaveText('Too expensive');
 // Existing enormous ranks are preserved even though new purchases now cost more.
 await page.evaluate(()=>{coinDropGame.p.levels['mint-0']=1e200;coinDropGame.save();coinDropGame.render();});
 await page.locator('[data-buy-amount="1"]').click();await expect(page.locator('.cd-node button').first()).toBeDisabled();await expect(page.locator('.cd-node button').first()).toHaveText('Choose a larger batch');
 await page.screenshot({path:info.outputPath('ultra-upgrades.png')});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('[data-tab="board"]').click();
 const result=await page.evaluate(()=>{const g=coinDropGame;g.p.dots=0;g.charge=1;g.drop();const c=g.coins[0];g.enterNano(c,g.features.find(f=>f.type==='nano'));const prize=g.nano.prize;g.finishNano(true);return {prize,dots:g.p.dots,valid:Number.isFinite(prize)&&Number.isFinite(g.p.dots)};});
 expect(result.valid).toBe(true);expect(result.prize).toBeGreaterThan(0);expect(result.dots).toBeGreaterThan(0);
 await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready');expect(await page.evaluate(()=>coinDropGame.p.levels['mint-0'])).toBe(1e200);
});
