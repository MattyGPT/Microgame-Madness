const {test,expect,openGame}=require('./fixtures/game.cjs');
test.beforeEach(async({page})=>{await openGame(page);await page.locator('[data-game="nanolab"]').click();});
test('Nano Lab lists all 60 tests, filters worlds, and leaves campaign untouched',async({page},info)=>{
 await expect(page.locator('[data-nano-test]')).toHaveCount(60);
 await page.locator('#cd-lab-world').selectOption('19');await expect(page.locator('[data-nano-test]')).toHaveCount(3);
 await page.locator('#coin-drop-room').screenshot({path:info.outputPath('nano-lab.png')});
 await page.locator('#cd-lab-world').selectOption('all');await page.locator('#cd-lab-search').fill('Vault Code');await expect(page.locator('[data-nano-test]')).toHaveCount(1);
 const before=await page.evaluate(()=>JSON.stringify(coinDropGame.p));await page.locator('[data-nano-test]').click();await page.locator('#cd-nano-start').click();
 await expect(page.locator('#cd-nano-prize')).toContainText('no rewards');
 await page.evaluate(()=>coinDropGame.tickNano(1.01));await expect(page.locator('#cd-nano-code')).toHaveText('Enter code');
 await page.locator('#cd-nano-skip').click();expect(await page.evaluate(()=>JSON.stringify(coinDropGame.p))).toBe(before);
 await page.locator('[data-game="coindrop"]').click();await expect(page.locator('[data-panel="board"]')).toBeVisible();await expect(page.locator('.cd-nano-lineup span')).toHaveCount(3);
});
test('all 50 new nanogames can be won through their controls without saving lab rewards',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const results=await page.evaluate(()=>{
   const g=coinDropGame,before=JSON.stringify(g.p),out=[];
   for(const game of CoinDropNanoPack.games){
     g.startNanoTest(game.id);g.startNano();const challenge=g.nano.challenge,s=challenge.state,host=document.querySelector('#cd-nano-stage');
     const buttons=()=>[...host.querySelectorAll('.cd-pack-area > button')],press=i=>buttons()[i].click(),tick=dt=>g.tickNano(dt),submit=()=>host.querySelector('.cd-pack-submit').click();
     switch(game.kind){
       case 'quiz':press(s.choices.indexOf(s.answer));break;
       case 'order':for(const value of s.sequence)press(s.choices.indexOf(value));break;
       case 'recall':tick(s.reveal+.01);if(['reverse','reverse_arrows'].includes(game.variant)){for(const i of s.answer)press(i);}else press(game.variant==='flash'?s.answer-3:s.answer);break;
       case 'pairs':for(const symbol of new Set(s.cards))for(let i=0;i<s.cards.length;i++)if(s.cards[i]===symbol)press(i);break;
       case 'meter':for(let i=0;i<600&&!s.zones.some(([a,b])=>s.position>=a&&s.position<=b);i++)tick(.01);submit();break;
       case 'lights':for(const i of [0,1,3])press(i);break;
       case 'slide':press(7);press(8);break;
       case 'wires':for(let i=0;i<4;i++)while(s.turns[i]!==1)press(i);break;
       case 'path':for(const i of s.path)press(i);break;
       case 'mines':for(const i of s.gems)press(i);break;
       case 'sum':press(s.values.indexOf(2));press(s.values.indexOf(8));submit();break;
       case 'taps':for(let i=0;i<7;i++)press(0);submit();break;
       case 'alternate':for(let i=0;i<8;i++)press(i%2);break;
       case 'hold':g.nanoDialog.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true}));tick(1.2);g.nanoDialog.dispatchEvent(new KeyboardEvent('keyup',{code:'Space',bubbles:true}));break;
       case 'signal':for(let i=0;i<3;i++){tick(i?2:1.05);press(0);}break;
       case 'catch':for(let i=0;i<3;i++)host.querySelector('.cd-pack-comet').click();break;
       case 'shield':case 'arrows':for(const i of s.commands)press(i);break;
       case 'balance':for(let i=0;i<110&&g.nano;i++){host.querySelector('input').value=String((.5+Math.sin((s.elapsed+.02)*1.5)*.22)*100);tick(.02);}break;
       case 'stopwatch':press(0);tick(3);press(0);break;
       default:throw Error('Untested kind '+game.kind);
     }
     out.push({id:game.id,closed:!g.nano,result:document.querySelector('#cd-lab-result').textContent,unchanged:JSON.stringify(g.p)===before});
     if(g.nano)g.finishNano(false);
   }
   return out;
 });
 expect(results).toHaveLength(50);for(const r of results){expect(r.closed,r.id).toBe(true);expect(r.result,r.id).toContain('won!');expect(r.unchanged,r.id).toBe(true);}expect(errors).toEqual([]);
});
test('every new game times out safely and campaign victories still award rewards',async({page})=>{
 const results=await page.evaluate(()=>{
   const g=coinDropGame,before=JSON.stringify(g.p),out=[];
   for(const game of CoinDropNanoPack.games){g.startNanoTest(game.id);g.startNano();g.tickNano(game.seconds+.01);out.push(!g.nano&&JSON.stringify(g.p)===before);}
   return out;
 });expect(results.every(Boolean)).toBe(true);
 await page.locator('[data-game="coindrop"]').click();
 const reward=await page.evaluate(()=>{
   const g=coinDropGame;g.p.cleared=20;g.go(3);g.drop();const pocket=g.features.find(f=>f.game==='nano_change');g.enterNano(g.coins[0],pocket);g.startNano();const n=g.nano,s=n.challenge.state,before=g.p.dots;document.querySelectorAll('#cd-nano-stage .cd-pack-area > button')[s.choices.indexOf(s.answer)].click();return {won:g.p.dots>before,resumed:g.playable()};
 });expect(reward).toEqual({won:true,resumed:true});
});
test('Nano Lab supports real keyboard holds, exposes correct visuals, and never writes campaign rewards',async({page},info)=>{
 const before=await page.evaluate(()=>localStorage.getItem(coinDropGame.key));
 await page.locator('[data-nano-test="nano_hold"]').click();await page.locator('#cd-nano-start').click();
 await page.keyboard.down('Space');await page.evaluate(()=>coinDropGame.tickNano(1.1));await page.keyboard.up('Space');
 await expect(page.locator('#cd-lab-result')).toContainText('Pressure Valve: won!');
 for(const id of ['nano_clock','nano_pairs','nano_orbit','nano_lights']){
   await page.locator(`[data-nano-test="${id}"]`).click();await page.locator('#cd-nano-start').click();
   await page.locator('.cd-nano').screenshot({path:info.outputPath(`${id}.png`)});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.locator('#cd-nano-skip').click();
 }
 expect(await page.evaluate(()=>localStorage.getItem(coinDropGame.key))).toBe(before);
});
