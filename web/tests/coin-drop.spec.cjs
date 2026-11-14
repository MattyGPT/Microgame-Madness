const {test,expect,openGame}=require('./fixtures/game.cjs');
test.beforeEach(async({page})=>{await openGame(page);await page.locator('[data-game="coindrop"]').click();});
test('flat coin physics, keyboard aim, pause, map clear and reload persistence',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await expect(page.locator('#coin-drop-room')).toBeVisible();
 await page.locator('#cd-board').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');
 expect(await page.evaluate(()=>coinDropGame.coins.length)).toBe(1);
 expect(await page.evaluate(()=>coinDropGame.coinImage.naturalWidth)).toBeGreaterThan(0);
 await page.locator('#cd-pause').click();const clock=await page.evaluate(()=>coinDropGame.clock);await page.waitForTimeout(200);expect(await page.evaluate(()=>coinDropGame.clock)).toBe(clock);
 await page.locator('#cd-pause').click();
 await page.evaluate(()=>{for(let i=0;i<10800&&coinDropGame.coins.length;i++){if(coinDropGame.nano)coinDropGame.finishNano(false);coinDropGame.update(1/120);}});
 expect(await page.evaluate(()=>coinDropGame.coins.length)).toBe(0);expect(await page.evaluate(()=>coinDropGame.p.dots)).toBeGreaterThan(0);
 await page.evaluate(()=>{coinDropGame.reward(CoinDrop.maps[0].goal);coinDropGame.save();coinDropGame.render();});
 await expect(page.locator('#cd-next')).toBeVisible();await page.locator('#cd-next').click();await expect(page.locator('#cd-map-name')).toHaveText('Honeycomb Hollow');
 await page.locator('#coin-drop-room').screenshot({path:info.outputPath('coin-drop-board.png')});
 await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready');await page.locator('[data-game="coindrop"]').click();await expect(page.locator('#cd-map-name')).toHaveText('Honeycomb Hollow');
 expect(errors).toEqual([]);
});
test('upgrade dependencies, minicoins, forge and map locking',async({page},info)=>{
 await page.locator('[data-tab="maps"]').click();await expect(page.locator('#cd-maps button')).toHaveCount(20);await expect(page.locator('#cd-maps button').nth(1)).toBeDisabled();
 await page.evaluate(()=>{coinDropGame.p.dots=10000;coinDropGame.render();});await page.locator('[data-tab="tree"]').click();await expect(page.locator('.cd-node')).toHaveCount(8);await expect(page.locator('.cd-node button').nth(1)).toBeDisabled();await page.locator('.cd-node button').first().click();await expect(page.locator('.cd-node button').nth(1)).toBeEnabled();
 await page.getByRole('button',{name:'◌ Minicoins',exact:true}).click();await page.locator('.cd-node button').first().click();
 await page.screenshot({path:info.outputPath('coin-drop-tree.png'),fullPage:true});
 await page.locator('[data-tab="board"]').click();await page.locator('#cd-drop').click();expect(await page.evaluate(()=>coinDropGame.coins.filter(c=>c.mini).length)).toBe(1);
 await page.evaluate(()=>{for(let i=0;i<10800&&coinDropGame.coins.length;i++){if(coinDropGame.nano)coinDropGame.finishNano(false);coinDropGame.update(1/120);}});expect(await page.evaluate(()=>coinDropGame.p.scrap)).toBeGreaterThan(0);
 await page.evaluate(()=>{coinDropGame.p.scrap=100;});await page.locator('[data-tab="forge"]').click();await page.locator('[data-craft="ruby"]').click();expect(await page.evaluate(()=>coinDropGame.p.scrap)).toBe(40);await page.locator('[data-craft="boost"]').click();expect(await page.evaluate(()=>coinDropGame.p.boosts)).toBe(10);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('every board settles real coins; sound and scene lifecycle respect controls',async({page})=>{
 await page.locator('#cd-drop').click();
 const results=await page.evaluate(()=>{const out=[];coinDropGame.coins=[];coinDropGame.p.cleared=20;for(let map=0;map<20;map++){coinDropGame.go(map);coinDropGame.charge=1;coinDropGame.drop();const before=coinDropGame.p.earned[map];for(let i=0;i<10800&&coinDropGame.coins.length;i++){if(coinDropGame.nano)coinDropGame.finishNano(false);coinDropGame.update(1/120);}out.push({map,left:coinDropGame.coins.length,gain:coinDropGame.p.earned[map]-before});}return out;});
 for(const r of results){expect(r.left).toBe(0);expect(r.gain).toBeGreaterThan(0);}
 await page.locator('#sound').click();await expect.poll(()=>page.evaluate(()=>coinDropGame.master?.gain.value)).toBe(0);
 await page.locator('[data-game="shop"]').click();await expect(page.locator('#coin-drop-room')).toBeHidden();const time=await page.evaluate(()=>coinDropGame.clock);await page.waitForTimeout(150);expect(await page.evaluate(()=>coinDropGame.clock)).toBe(time);
});

test('pinball bonus banks pay once per coin and table zoom keeps controls accessible',async({page})=>{
 await page.locator('#cd-drop').click();
 const result=await page.evaluate(()=>{
   const game=coinDropGame,c=game.coins[0],targets=game.features.filter(f=>f.type==='target'&&f.deck===0);
   for(const target of targets){c.x=target.x;c.y=target.y;c.vx=0;c.vy=0;game.update(1/120);}
   const bonus=c.pocketBonus,earned=game.p.earned[0];
   for(const target of targets){c.x=target.x;c.y=target.y;c.vx=0;c.vy=0;game.update(1/120);}
   return {bonus,after:c.pocketBonus,earned,gain:game.p.earned[0]-earned};
 });
 expect(result.bonus).toBe(1.25);expect(result.after).toBe(1.25);expect(result.gain).toBe(0);
 await page.locator('#cd-zoom').click();await expect(page.locator('#cd-zoom')).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#cd-zoom').click();await expect(page.locator('#cd-zoom')).toHaveText('Zoom table');
});

test('landing pockets run all three nanogames, award prizes, and automatically resume',async({page},info)=>{
 for(const kind of ['timing','memory','stars']){
   await page.evaluate(kind=>{
     const g=coinDropGame;g.coins=[];g.charge=1;g.nanoCooldown=0;g.drop();
     const f=g.features.find(f=>f.type==='nano'&&f.game===kind),c=g.coins[0];c.x=f.x;c.y=f.y;c.vy=80;g.update(1/120);
   },kind);
   await expect(page.locator('.cd-nano')).toBeVisible();
   const before=await page.evaluate(()=>({clock:coinDropGame.clock,dots:coinDropGame.p.dots,rubies:coinDropGame.p.rubies,scrap:coinDropGame.p.scrap}));
   await page.waitForTimeout(100);expect(await page.evaluate(()=>coinDropGame.clock)).toBe(before.clock);
   await page.locator('#cd-nano-start').click();
   if(kind==='timing'){
     await page.evaluate(()=>{coinDropGame.nano.elapsed=0;coinDropGame.nano.position=.5;document.querySelector('#cd-nano-stop').click();});
   }else if(kind==='memory'){
     const sequence=await page.evaluate(()=>{coinDropGame.tickNano(3.1);return coinDropGame.nano.sequence;});
     await page.locator('.cd-nano').screenshot({path:info.outputPath('nanogame-memory.png')});
     for(const index of sequence)await page.locator('#cd-nano-symbols button').nth(index).click();
   }else for(let i=0;i<5;i++)await page.locator('#cd-nano-star').click();
   await expect(page.locator('.cd-nano')).not.toBeVisible();
   expect(await page.evaluate(()=>coinDropGame.p.dots)).toBeGreaterThan(before.dots);
   if(kind==='memory')expect(await page.evaluate(()=>coinDropGame.p.rubies)).toBe(before.rubies+1);
   if(kind==='stars')expect(await page.evaluate(()=>coinDropGame.p.scrap)).toBe(before.scrap+5);
   await expect.poll(()=>page.evaluate(()=>coinDropGame.clock)).toBeGreaterThan(before.clock);
 }
});
test('skipping, losing, and timing out release the coin without granting prizes',async({page})=>{
 for(const action of ['skip','wrong','timeout']){
   await page.evaluate(()=>{const g=coinDropGame;g.coins=[];g.charge=1;g.drop();g.enterNano(g.coins[0],g.features.find(f=>f.type==='nano'&&f.game==='memory'));});
   const before=await page.evaluate(()=>coinDropGame.p.rubies);
   if(action==='skip')await page.locator('#cd-nano-skip').click();
   else{await page.locator('#cd-nano-start').click();if(action==='timeout')await page.evaluate(()=>coinDropGame.tickNano(16));else{const wrong=await page.evaluate(()=>{coinDropGame.tickNano(3.1);return (coinDropGame.nano.sequence[0]+1)%4;});await page.locator('#cd-nano-symbols button').nth(wrong).click();}}
   await expect(page.locator('.cd-nano')).not.toBeVisible();expect(await page.evaluate(()=>coinDropGame.p.rubies)).toBe(before);expect(await page.evaluate(()=>coinDropGame.playable())).toBe(true);
 }
});
test('nanogame capture never replays another coin’s already-settled payout',async({page})=>{
 const result=await page.evaluate(()=>{
   const g=coinDropGame;g.charge=1;g.drop();g.charge=1;g.drop();
   const first=g.coins[0],second=g.coins[1],pocket=g.features.find(f=>f.type==='nano');
   first.y=CoinDrop.BOARD.pocketY+1;first.vy=0;second.x=pocket.x;second.y=pocket.y;second.vy=80;
   g.update(1/120);const captured=!!g.nano,count=g.coins.length,earned=g.p.earned[0];g.finishNano(false);second.x=420;second.y=60;second.vx=0;second.vy=0;g.update(1/120);
   return {captured,count,earned,after:g.p.earned[0]};
 });
 expect(result.captured).toBe(true);expect(result.count).toBe(1);expect(result.after).toBe(result.earned);
});

test('previous worlds are directly accessible and resetting balls preserves progress and hit ledgers',async({page})=>{
 await expect(page.locator('#cd-prev')).toBeDisabled();await expect(page.locator('#cd-next')).toBeDisabled();
 await page.evaluate(()=>{coinDropGame.p.cleared=3;coinDropGame.go(2);});
 await page.locator('#cd-drop').click();
 const before=await page.evaluate(()=>{const c=coinDropGame.coins[0];c.hits.add(9);c.featureHits.add(0);c.nanoPlayed=true;c.y=500;return JSON.stringify(coinDropGame.p);});
 await page.locator('#cd-reset-balls').click();
 expect(await page.evaluate(()=>JSON.stringify(coinDropGame.p))).toBe(before);
 expect(await page.evaluate(()=>({y:coinDropGame.coins[0].y,hit:coinDropGame.coins[0].hits.has(9),nano:coinDropGame.coins[0].nanoPlayed,paused:coinDropGame.paused}))).toEqual({y:50,hit:true,nano:true,paused:true});
 await page.locator('#cd-prev').click();await expect(page.locator('#cd-map-name')).toHaveText('Honeycomb Hollow');
 await page.locator('#cd-drop').click();await page.locator('#cd-prev').click();await expect(page.locator('#cd-map-name')).toHaveText('Bluebell Arcade');expect(await page.evaluate(()=>coinDropGame.coins.length)).toBe(0);
 await page.locator('#cd-next').click();await expect(page.locator('#cd-map-name')).toHaveText('Honeycomb Hollow');
 await page.locator('#cd-worlds').click();await expect(page.locator('#cd-maps button').nth(4)).toBeDisabled();await page.locator('#cd-maps button').first().click();await expect(page.locator('#cd-map-name')).toHaveText('Bluebell Arcade');
});
test('seven additional nanogames have playable win conditions and resume the board',async({page},info)=>{
 for(const kind of ['math','odd','colors','reaction','maze','code','rhythm']){
   await page.evaluate(kind=>{const g=coinDropGame;g.p.cleared=20;const map=CoinDrop.maps.find(m=>CoinDrop.featuresFor(m).some(f=>f.game===kind));g.go(map.id);g.drop();const f=g.features.find(f=>f.game===kind),c=g.coins[0];g.nanoCooldown=0;c.x=f.x;c.y=f.y;c.vy=80;g.update(1/120);},kind);
   await expect(page.locator('.cd-nano')).toBeVisible();await page.locator('#cd-nano-start').click();
   const before=await page.evaluate(()=>coinDropGame.p.dots);
   if(['math','odd','colors'].includes(kind)){
     const answer=await page.evaluate(()=>coinDropGame.nano.correct);await page.locator('#cd-nano-stage .cd-nano-choices button').nth(answer).click();
   }else if(kind==='reaction'){
     await page.evaluate(()=>coinDropGame.tickNano(coinDropGame.nano.signalAt-coinDropGame.nano.elapsed+.05));await page.locator('#cd-nano-launch').click();
   }else if(kind==='maze'){
     await page.locator('.cd-nano').screenshot({path:info.outputPath('pocket-maze.png')});
     for(const direction of [2,2,2,3,3,3])await page.locator('#cd-nano-stage .cd-nano-choices button').nth(direction).click();
   }else if(kind==='code'){
     const code=await page.evaluate(()=>{coinDropGame.tickNano(3.1);return coinDropGame.nano.code;});for(const digit of code)await page.locator('#cd-nano-stage .cd-nano-choices button').nth(digit-1).click();
   }else{
     for(let i=0;i<3;i++)await page.evaluate(()=>{const n=coinDropGame.nano;n.elapsed+=.8;n.position=.5;document.querySelector('#cd-nano-stop').click();});
   }
   await expect(page.locator('.cd-nano')).not.toBeVisible();expect(await page.evaluate(()=>coinDropGame.p.dots)).toBeGreaterThan(before);expect(await page.evaluate(()=>coinDropGame.playable())).toBe(true);
 }
});
test('Pocket Maze uses arrow keys, kills on walls and edges, and times out after six seconds',async({page})=>{
 async function openMaze(){
   await page.evaluate(()=>{const g=coinDropGame;g.p.cleared=20;const map=CoinDrop.maps.find(m=>CoinDrop.featuresFor(m).some(f=>f.game==='maze'));g.go(map.id);g.drop();g.enterNano(g.coins[0],g.features.find(f=>f.game==='maze'));});
   await page.locator('#cd-nano-start').click();
 }
 await openMaze();const aim=await page.evaluate(()=>coinDropGame.aim),rubies=await page.evaluate(()=>coinDropGame.p.rubies);
 for(const key of ['ArrowDown','ArrowDown','ArrowDown','ArrowRight','ArrowRight','ArrowRight'])await page.keyboard.press(key);
 await expect(page.locator('.cd-nano')).not.toBeVisible();expect(await page.evaluate(()=>coinDropGame.p.rubies)).toBe(rubies+1);expect(await page.evaluate(()=>coinDropGame.aim)).toBe(aim);
 for(const action of ['wall','edge','touch','timeout']){
   await openMaze();const before=await page.evaluate(()=>coinDropGame.p.rubies);
   if(action==='wall')await page.keyboard.press('ArrowRight');
   else if(action==='edge')await page.keyboard.press('ArrowUp');
   else if(action==='touch')await page.locator('#cd-nano-stage .cd-nano-choices button').nth(3).click();
   else{expect(await page.evaluate(()=>coinDropGame.nano.config.seconds)).toBe(6);await page.evaluate(()=>coinDropGame.tickNano(6.01));}
   await expect(page.locator('.cd-nano')).not.toBeVisible();expect(await page.evaluate(()=>coinDropGame.p.rubies)).toBe(before);expect(await page.evaluate(()=>coinDropGame.playable())).toBe(true);
   if(action!=='timeout')await expect(page.locator('#cd-status')).toContainText('Hit a wall!');
 }
});
