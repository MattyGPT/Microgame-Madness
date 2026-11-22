const {test,expect,openGame}=require('./fixtures/game.cjs');
test('progressive forge quotes, Scrap Magnets and counters persist without granting world progress',async({page},info)=>{
 await openGame(page);await page.locator('[data-game="coindrop"]').click();
 await page.evaluate(()=>{coinDropGame.p.scrap=1e10;coinDropGame.p.boosts=9999;coinDropGame.render();});
 await page.locator('[data-tab="forge"]').click();
 await expect(page.getByText('Dot condenser',{exact:true})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Scrap Magnet',exact:true})).toBeVisible();
 await expect(page.getByRole('group',{name:'Forge purchase amount'}).locator('button')).toHaveCount(29);
 for(const amount of [1,5,10,25,50,100,250,500,1000,2500,5000]){
  await page.locator(`[data-craft-amount="${amount}"]`).click();
  for(const kind of ['boost','ruby','magnet']){
   const quote=await page.evaluate(({kind,amount})=>CoinDrop.forgeCost(coinDropGame.p,kind,amount),{kind,amount});
   await expect(page.locator(`[data-craft="${kind}"]`)).toHaveAttribute('title',`${quote.toLocaleString('en')} scrap for ${amount} crafts. Crafted so far: 0.`);
  }
 }
 const total=await page.evaluate(()=>['boost','ruby','magnet'].reduce((sum,kind)=>sum+CoinDrop.forgeCost(coinDropGame.p,kind,5000),0));
 for(const kind of ['boost','ruby','magnet'])await page.locator(`[data-craft="${kind}"]`).click();
 expect(await page.evaluate(()=>({scrap:coinDropGame.p.scrap,boosts:coinDropGame.p.boosts,rubies:coinDropGame.p.rubies,magnets:coinDropGame.p.magnets,cleared:coinDropGame.p.cleared,dots:coinDropGame.p.dots}))).toEqual({scrap:1e10-total,boosts:59999,rubies:15000,magnets:50000,cleared:0,dots:0});
 await page.locator('[data-craft-amount="1"]').click();
 await page.evaluate(()=>{coinDropGame.p.scrap=50;coinDropGame.render();});await expect(page.locator('[data-craft="magnet"]')).toBeDisabled();
 await page.evaluate(()=>{coinDropGame.p.scrap=CoinDrop.forgeCost(coinDropGame.p,'magnet');coinDropGame.render();});
 await page.locator('[data-craft="magnet"]').click();
 await page.screenshot({path:info.outputPath('progressive-forge.png')});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready');
 expect(await page.evaluate(()=>({scrap:coinDropGame.p.scrap,magnets:coinDropGame.p.magnets,count:coinDropGame.p.forgeCrafts.magnet,next:CoinDrop.forgeCost(coinDropGame.p,'magnet')}))).toEqual({scrap:0,magnets:50010,count:5001,next:25055});
});
test('magnet consumes one launch charge and doubles actual minicoin scrap',async({page})=>{
 await openGame(page);await page.locator('[data-game="coindrop"]').click();
 const result=await page.evaluate(()=>{
  const g=coinDropGame;g.p=CoinDrop.restore({magnets:2});g.charge=1;g.drop();const beforeMini=g.p.magnets;
  g.coins=[];g.p.levels['mini-0']=1;g.charge=1;g.drop();const charges=g.p.magnets,mini=g.coins.find(c=>c.mini);
  g.coins=[mini];mini.nanoPlayed=true;mini.x=420;mini.y=CoinDrop.BOARD.pocketY+1;g.update(1/120);
  return {beforeMini,charges,scrap:g.p.scrap,boost:mini.scrapBoost};
 });expect(result).toEqual({beforeMini:2,charges:1,scrap:2,boost:2});
});
