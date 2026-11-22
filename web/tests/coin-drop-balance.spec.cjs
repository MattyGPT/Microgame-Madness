const {test,expect,openGame}=require('./fixtures/game.cjs');
test('legacy level 43 progress clears the reduced target once without deleting savings or upgrades',async({page})=>{
 await page.addInitScript(()=>{
  const earned=Array(100).fill(0);earned[42]=1e83;
  if(!localStorage.getItem('balance-fixture')){
   localStorage.setItem('microgame-madness.coin-drop.v1:guest',JSON.stringify({map:42,cleared:42,dots:1e84,rubies:10,scrap:55,earned,levels:{'mint-0':100}}));
   localStorage.setItem('balance-fixture','1');
  }
 });
 await openGame(page);await page.locator('[data-game="coindrop"]').click();
 expect(await page.evaluate(()=>({dots:coinDropGame.p.dots,cleared:coinDropGame.p.cleared,rubies:coinDropGame.p.rubies,rank:coinDropGame.p.levels['mint-0']}))).toEqual({dots:1e84,cleared:43,rubies:55,rank:100});
 await expect(page.locator('#cd-progress-label')).toContainText('WORLD CLEARED');
 await expect(page.locator('#cd-next')).toBeEnabled();await page.locator('#cd-next').click();
 expect(await page.evaluate(()=>coinDropGame.p.map)).toBe(43);
 await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready');
 expect(await page.evaluate(()=>({map:coinDropGame.p.map,dots:coinDropGame.p.dots,rubies:coinDropGame.p.rubies,cleared:coinDropGame.p.cleared}))).toEqual({map:43,dots:1e84,rubies:55,cleared:43});
});
