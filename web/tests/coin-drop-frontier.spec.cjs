const {test,expect,openGame}=require('./fixtures/game.cjs');
test.beforeEach(async({page})=>{await openGame(page);await page.locator('[data-game="nanolab"]').click();});
test('all 2700 frontier challenges can be won using their controls without lab rewards',async({page},info)=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Audit every control in the hidden dialog without 2,700 layout/focus cycles or account writes.
 // The separate flow test exercises real modal opening, closing, timers and saved results.
 await page.evaluate(()=>{coinDropGame.onResult=()=>{};coinDropGame.sound=()=>false;coinDropGame.nanoDialog.showModal=()=>{};});
 await page.locator('#cd-lab-world').selectOption('100');
 const results={results:[],unchanged:true};
 for(let offset=0;offset<2700;offset+=90){
 const batch=await page.evaluate(offset=>{
  const g=coinDropGame,before=JSON.stringify(g.p),results=[];
  for(const game of CoinDropFrontier.games.slice(offset,offset+90)){
   g.startNanoTest(game.id);g.startNano();const s=g.nano.challenge.state,host=document.querySelector('#cd-nano-stage');
   const press=i=>host.querySelectorAll('.cd-expansion-grid > button')[i].click();
   const submit=()=>host.querySelector('.cd-pack-submit').click();
   switch(game.renderer){
    case 'equation':case 'cipher':case 'count':press(s.choices.indexOf(s.answer));break;
    case 'sort':for(const v of s.sequence)press(s.values.indexOf(v));break;
    case 'sum':{
     const mask=Array.from({length:1<<s.values.length},(_,i)=>i).find(mask=>s.values.reduce((sum,v,i)=>sum+((mask>>i&1)?v:0),0)===s.target);
     s.values.forEach((_,i)=>{if(mask>>i&1)press(i);});submit();break;
    }
    case 'recall':g.tickNano(s.preview+.01);for(const v of s.sequence)press(v-1);break;
    case 'route':for(const i of s.path)press(i);break;
    case 'dial':for(let i=0;i<s.values.length;i++)for(let turn=0;turn<4&&s.values[i]!==s.targets[i];turn++)press(i);submit();break;
    case 'pulse':for(let i=0;i<1000&&Math.abs(s.position-s.center)>s.width/2;i++)g.tickNano(.01);submit();break;
    case 'pairs':for(const v of new Set(s.values))for(let i=0;i<s.values.length;i++)if(s.values[i]===v)press(i);break;
    case 'arrows':for(const i of s.commands)press(i);break;
    case 'circuit':for(let i=0;i<s.values.length;i++)if(s.values[i]!==s.targets[i])press(i);submit();break;
   }
   results.push({id:game.id,closed:g.nano===null,outcome:document.querySelector('#cd-lab-result').dataset.outcome});
  }
  return {results,unchanged:JSON.stringify(g.p)===before};
 },offset);
 results.results.push(...batch.results);results.unchanged&&=batch.unchanged;
 }
 await page.evaluate(()=>{delete coinDropGame.nanoDialog.showModal;});
 expect(results.results).toHaveLength(2700);expect(results.results.filter(r=>!r.closed||r.outcome!=='win')).toEqual([]);expect(results.unchanged).toBe(true);expect(errors).toEqual([]);
 await page.locator('#cd-lab-world').selectOption('999');await expect(page.locator('[data-nano-test]')).toHaveCount(3);
 await page.locator('#cd-lab-result').getByRole('button',{name:'Dismiss'}).click();
 await page.locator('[data-nano-learn]').first().click();await expect(page.locator('#cd-nano-lesson-body')).toContainText('Learn Zenith Finale');
 await page.screenshot({path:info.outputPath('world-1000-nano-lesson.png')});
});
test('frontier search, pagination, random practice and final-world saves work',async({page})=>{
 await expect(page.locator('[data-nano-test]')).toHaveCount(60);
 await page.getByRole('button',{name:'Show more (60 of 3000)'}).click();
 await expect(page.locator('[data-nano-test]')).toHaveCount(120);
 await page.locator('#cd-lab-search').fill('Zenith Finale');
 await expect(page.locator('[data-nano-test]')).toHaveCount(3);
 await page.locator('#cd-lab-random').click();
 expect(await page.evaluate(()=>!!coinDropGame.nano?.testing)).toBe(true);
 await page.evaluate(()=>coinDropGame.finishNano(false,'closed'));
 const outcomes=await page.evaluate(()=>{
  const g=coinDropGame,out=[];
  for(const game of CoinDropFrontier.games.slice(0,18)){
   g.startNanoTest(game.id);g.startNano();g.tickNano(game.seconds+.1);
   out.push(document.querySelector('#cd-lab-result').dataset.outcome);
  }
  g.startNanoTest('frontier_101_1');g.startNano();const s=g.nano.challenge.state;
  document.querySelectorAll('#cd-nano-stage .cd-expansion-grid button')[s.choices.findIndex(v=>v!==s.answer)].click();
  out.push(document.querySelector('#cd-lab-result').dataset.outcome);return out;
 });
 expect(outcomes).toEqual(Array(19).fill('loss'));
 await page.locator('[data-game="coindrop"]').click();
 const result=await page.evaluate(()=>{
  const g=coinDropGame;g.p=CoinDrop.restore({cleared:999,map:999});g.go(999);g.draw();
  const cleared=CoinDrop.award(g.p,999,CoinDrop.maps[999].goal);g.save();g.render();
  return {cleared,count:g.p.cleared,finite:Number.isFinite(g.p.dots)};
 });
 expect(result).toEqual({cleared:true,count:1000,finite:true});
 await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready');
 await page.locator('[data-game="coindrop"]').click();
 await expect(page.locator('#cd-map-name')).toHaveText('Zenith Finale');
 await expect(page.locator('#cd-next')).toBeDisabled();
 expect(await page.evaluate(()=>coinDropGame.p.cleared)).toBe(1000);
});
test('all ten original nanogames remain winnable through their controls',async({page})=>{
 const outcomes=await page.evaluate(()=>{
  const g=coinDropGame,out=[];
  for(const game of CoinDrop.nanogames.slice(0,10)){
   g.startNanoTest(game.id);g.startNano();const n=g.nano;
   const click=i=>document.querySelectorAll('#cd-nano-stage .cd-nano-choices button')[i].click();
   if(game.id==='timing'||game.id==='rhythm'){
    for(let hit=0;hit<(game.id==='rhythm'?3:1);hit++){
     if(hit)g.tickNano(.61);
     while(n.position<.39||n.position>.61)g.tickNano(.01);
     document.querySelector('#cd-nano-stop').click();
    }
   }else if(game.id==='memory'){
    g.tickNano(3.01);for(const i of n.sequence)document.querySelectorAll('#cd-nano-symbols button')[i].click();
   }else if(game.id==='stars'){for(let i=0;i<5;i++)document.querySelector('#cd-nano-star').click();}
   else if(['math','odd','colors'].includes(game.id))click(n.correct);
   else if(game.id==='reaction'){g.tickNano(n.signalAt+.01);document.querySelector('#cd-nano-launch').click();}
   else if(game.id==='maze'){for(const i of [2,2,2,3,3,3])click(i);}
   else if(game.id==='code'){g.tickNano(1.01);for(const digit of n.code)click(digit-1);}
   out.push({id:game.id,closed:!g.nano,outcome:document.querySelector('#cd-lab-result').dataset.outcome});
  }return out;
 });
 expect(outcomes.filter(o=>!o.closed||o.outcome!=='win')).toEqual([]);
});
