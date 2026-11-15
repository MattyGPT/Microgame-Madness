const {test,expect,openGame}=require('./fixtures/game.cjs');
test.beforeEach(async({page})=>{await openGame(page);await page.locator('[data-game="nanolab"]').click();});
test('all 240 expedition challenges can be won using their controls without lab rewards',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const results=await page.evaluate(()=>{
  const g=coinDropGame,before=JSON.stringify(g.p),results=[];
  for(const game of CoinDropExpansion.games){
   g.startNanoTest(game.id);g.startNano();const s=g.nano.challenge.state,host=document.querySelector('#cd-nano-stage');
   const press=i=>host.querySelectorAll('.cd-expansion-grid > button')[i].click();
   const submit=()=>host.querySelector('.cd-pack-submit').click();
   switch(game.variant){
    case 'equation':case 'cipher':case 'count':press(s.choices.indexOf(s.answer));break;
    case 'sort':for(const v of s.sequence)press(s.values.indexOf(v));break;
    case 'sum':{
     const mask=Array.from({length:1<<s.values.length},(_,i)=>i).find(mask=>s.values.reduce((sum,v,i)=>sum+((mask>>i&1)?v:0),0)===s.target);
     s.values.forEach((_,i)=>{if(mask>>i&1)press(i);});submit();break;
    }
    case 'recall':g.tickNano(s.preview+.01);for(const v of s.sequence)press(v-1);break;
    case 'route':for(const i of s.path)press(i);break;
    case 'dial':for(let i=0;i<s.values.length;i++)while(s.values[i]!==s.targets[i])press(i);submit();break;
    case 'pulse':for(let i=0;i<1000&&Math.abs(s.position-s.center)>s.width/2;i++)g.tickNano(.01);submit();break;
    case 'pairs':for(const v of new Set(s.values))for(let i=0;i<s.values.length;i++)if(s.values[i]===v)press(i);break;
    case 'arrows':for(const i of s.commands)press(i);break;
    case 'circuit':for(let i=0;i<s.values.length;i++)if(s.values[i]!==s.targets[i])press(i);submit();break;
   }
   results.push({id:game.id,closed:g.nano===null,outcome:document.querySelector('#cd-lab-result').dataset.outcome});
  }
  return {results,unchanged:JSON.stringify(g.p)===before};
 });
 expect(results.results).toHaveLength(240);expect(results.results.filter(r=>!r.closed||r.outcome!=='win')).toEqual([]);expect(results.unchanged).toBe(true);expect(errors).toEqual([]);
 await page.locator('#cd-lab-world').selectOption('99');await expect(page.locator('[data-nano-test]')).toHaveCount(3);
 await page.locator('#cd-lab-result').getByRole('button',{name:'Dismiss'}).click();
 await page.locator('[data-nano-learn]').first().click();await expect(page.locator('#cd-nano-lesson-body')).toContainText('Learn Eternal Throne');
 await page.screenshot({path:info.outputPath('world-100-nano-lesson.png')});
});
test('new challenges lose on wrong answers, time out, and close without rewarding practice',async({page})=>{
 const result=await page.evaluate(()=>{
  const g=coinDropGame,before=JSON.stringify(g.p),out=[];
  for(const game of CoinDropExpansion.games){g.startNanoTest(game.id);g.startNano();g.tickNano(game.seconds+.1);out.push(document.querySelector('#cd-lab-result').dataset.outcome);}
  g.startNanoTest('expedition_21_1');g.startNano();const s=g.nano.challenge.state;
  document.querySelectorAll('#cd-nano-stage .cd-expansion-grid button')[s.choices.findIndex(v=>v!==s.answer)].click();
  const wrong=document.querySelector('#cd-lab-result').dataset.outcome;
  g.startNanoTest('expedition_100_3');g.finishNano(false,'closed');
  return {out,wrong,closed:document.querySelector('#cd-lab-result').dataset.outcome,unchanged:before===JSON.stringify(g.p)};
 });
 expect(result.out).toEqual(Array(240).fill('loss'));expect(result.wrong).toBe('loss');expect(result.closed).toBe('closed');expect(result.unchanged).toBe(true);
});
test('100-world progression, 320 upgrades and fivefold nanogame bonuses persist',async({page},info)=>{
 await page.locator('[data-game="coindrop"]').click();
 const data=await page.evaluate(()=>{
  const g=coinDropGame;g.p=CoinDrop.restore({dots:1e35,rubies:1e9,scrap:1e9,cleared:99,map:99});g.go(99);
  const nano=g.features.find(f=>f.type==='nano'),coin={x:nano.x,y:nano.y,r:12,boost:1,age:0};
  g.enterNano(coin,nano);const prize=g.nano.prize;const rubies=g.p.rubies;g.finishNano(true);
  const bonusRubies=g.p.rubies-rubies;
  CoinDrop.buy(g.p,'expedition-0');CoinDrop.buy(g.p,'nano-0');g.reward(CoinDrop.maps[99].goal);g.save();g.render();
  return {prize,expected:300*CoinDrop.maps[99].value,bonusRubies,cleared:g.p.cleared};
 });
 expect(data.prize).toBe(Math.ceil(data.expected));expect(data.bonusRubies).toBe(5);expect(data.cleared).toBe(100);
 await page.locator('#cd-lab-result').getByRole('button',{name:'Dismiss'}).click();
 await page.locator('[data-tab="maps"]').click();await expect(page.locator('#cd-maps button')).toHaveCount(100);
 await page.locator('[data-tab="tree"]').click();await expect(page.locator('#cd-branches button')).toHaveCount(16);await expect(page.locator('.cd-node')).toHaveCount(20);
 await page.screenshot({path:info.outputPath('expanded-upgrades.png')});
 await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready');await page.locator('[data-game="coindrop"]').click();
 expect(await page.evaluate(()=>({map:coinDropGame.p.map,cleared:coinDropGame.p.cleared,earned:coinDropGame.p.earned.length,expedition:coinDropGame.p.levels['expedition-0']}))).toEqual({map:99,cleared:100,earned:100,expedition:1});
 await expect(page.locator('#cd-map-name')).toHaveText('Eternal Throne');await expect(page.locator('#cd-next')).toBeDisabled();
});
