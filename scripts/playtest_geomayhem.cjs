// Full browser runs: normal UI events, ordinary frame loop, no model mutation.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const {routeLocalRuntime}=require('../web/tests/fixtures/game.cjs');
(async()=>{
 const startLevel=Number(process.env.BOSS_TEST_LEVEL||1);
 const out=path.resolve(process.env.BOSS_TEST_LEVEL?`artifacts/geomayhem-playtest/arena-${startLevel}`:'artifacts/geomayhem-playtest');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1100}});
 await routeLocalRuntime(context);
 await context.addInitScript(level=>{localStorage.setItem('microgame-madness.welcome.v1','complete');if(level>1)localStorage.setItem('microgame-madness.geomayhem.v1:guest',JSON.stringify({cleared:level-1}));},startLevel);
 const page=await context.newPage();page.on('pageerror',e=>fs.appendFileSync(out+'/errors.log',e.stack+'\n'));
 await page.goto('http://localhost:8777/');await page.waitForFunction(()=>document.querySelector('#runtime-status').textContent.includes('All games ready'),{timeout:60000});
 await page.locator('[data-game="geomayhem"]').click();
 if(await page.locator('#sound').getAttribute('aria-pressed')==='true')await page.locator('#sound').click();
 await page.clock.install();
 await page.evaluate(startLevel=>{
  const state=window.playtest={level:startLevel,wins:0,attempt:0,sinceWin:0,results:[],attempts:[],running:false,done:false,previous:null,held:[],boots:0,seed:17349,wait:0};
  const random=()=>{state.seed=(1664525*state.seed+1013904223)>>>0;return state.seed/4294967296};
  const emit=(type,key)=>document.querySelector('#arena').dispatchEvent(new KeyboardEvent(type,{key,bubbles:true,cancelable:true}));
  const input=arr=>{for(const key of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','f'])emit(arr.includes(key)?'keydown':'keyup',key);state.held=arr;};
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const segment=(p,a,b)=>{let dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return dist(p,[a[0]+dx*u,a[1]+dy*u]);};
  const zoneDistance=(p,c)=>{const q=c.coords;if(c.kind==='oval'){const center=[(q[0]+q[2])/2,(q[1]+q[3])/2],r=(q[2]-q[0])/2;return c.fill?dist(p,center)-r:Math.abs(dist(p,center)-r)-(c.width||1)/2;}
   if(c.kind==='rectangle')return Math.max(q[0]-p[0],p[0]-q[2],q[1]-p[1],p[1]-q[3]);
   if(c.kind==='polygon'){let inside=false,min=Infinity;for(let i=0,j=q.length-2;i<q.length;j=i,i+=2){const a=[q[j],q[j+1]],b=[q[i],q[i+1]];min=Math.min(min,segment(p,a,b));if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside?-min:min;}return 1000;};
  setInterval(()=>{try{
   if(state.done)return;
   const s=snapshot;
   if(!state.running){
    if(state.wait++<4)return;state.wait=0;
    document.querySelector('[data-game="geomayhem"]').click();
    // Spend only legitimately earned shards, using normal workshop controls.
    for(const key of ['vitality','power','magnet']){const b=document.querySelector(`[data-workshop="${key}"]`);if(b&&!b.disabled)b.click();}
    const starter=document.querySelector('#geomayhem-weapon');starter.value='seeker';starter.dispatchEvent(new Event('change',{bubbles:true}));
    const button=document.querySelector(`[data-difficulty="level_${state.level}"]`);if(!button||button.disabled)throw Error('Arena remains locked: '+state.level);
    button.click();state.running=true;state.attempt++;state.sinceWin++;state.previous=null;state.boots=0;state.start=performance.now();return;
   }
   if(s?.over){input([]);state.attempts.push({level:state.level,attempt:state.attempt,won:s.won,wave:s.wave,cleared:s.cleared,seconds:s.fight_elapsed,health:s.lives,bossHp:s.boss?.hp??null,loadout:s.loadout.map(w=>[w.id,w.stars]),anomaly:s.anomaly.name});
    if(s.won){state.wins++;state.results.push({level:state.level,win:state.wins,attempts:state.sinceWin,totalAttempts:state.attempt});state.sinceWin=0;}
    state.running=false;state.wait=0;if(state.wins===3){state.level++;state.wins=0;state.attempt=0;}if(state.level>startLevel){state.done=true;state.reason='Three wins complete at arena '+startLevel;}
    if(state.attempt>=30){state.done=true;state.reason='Thirty full-run attempts without three wins at arena '+state.level;}
    return;
   }
   if(!s||s.mode!=='geomayhem')return;
   if(s.offers?.length){input([]);
    const score=o=>{const id=o.id;if(id==='repair')return s.lives<s.max_lives*.55?110:0;if(id==='heart')return s.lives<s.max_lives*.75?95:50;if(id==='boots')return state.boots<2?85:45;if(id==='magnet')return 35;if(id==='relic:fleet')return 80;if(id==='relic:reach')return 60;if(id.startsWith('relic:'))return id==='relic:glass'?0:55;if(id.startsWith('upgrade:')||id==='weapon')return 90;if(id.startsWith('acquire:'))return 70;return 10;};
    const choice=[...s.offers].sort((a,b)=>score(b)-score(a))[0];document.querySelector(`[data-upgrade="${choice.id}"]`)?.click();if(choice.id==='boots')state.boots++;state.previous=null;return;
   }
   if(s.boss_intro){input([]);document.querySelector('#boss-cinema-skip').click();state.previous=null;return;}
   const seen={player:[s.player.x,-s.player.y],bounds:s.bounds,radius:s.boss_arena_radius,commands:s.commands.map(c=>({...c,coords:[...c.coords]}))};
   const obs=state.previous;state.previous=seen;if(!obs||random()<.05)return;
   const p=obs.player,enemies=obs.commands.filter(c=>['geomayhem_enemy','geomayhem_boss'].includes(c.kind)),gems=obs.commands.filter(c=>c.kind==='geomayhem_polygon'&&c.fill==='#70f6d4');
   const bullets=obs.commands.filter(c=>c.kind==='oval'&&c.fill==='#ff3557').map(c=>[(c.coords[0]+c.coords[2])/2,(c.coords[1]+c.coords[3])/2]);
   const zones=obs.commands.filter(c=>['#ffce65','#ff526a','#ffd36d'].includes(c.fill)||['#ffce65','#ff526a'].includes(c.outline)).filter(c=>c.kind!=='text');
   enemies.sort((a,b)=>dist(p,a.coords)-dist(p,b.coords));gems.sort((a,b)=>dist(p,a.coords)-dist(p,b.coords));
   let target=enemies[0];const boss=enemies.find(e=>e.kind==='geomayhem_boss');if(boss&&(!target||dist(p,target.coords)>150))target=boss;
   if(target){const angle=Math.atan2(target.coords[1]-p[1],target.coords[0]-p[0])+(random()-.5)*.24,range=dist(p,target.coords),aim=[p[0]+Math.cos(angle)*range,p[1]+Math.sin(angle)*range];const camera=geomayhemCamera(s),rect=document.querySelector('#game-canvas').getBoundingClientRect();document.querySelector('#game-canvas').dispatchEvent(new PointerEvent('pointermove',{pointerType:'mouse',clientX:rect.left+(340+(aim[0]-camera.x)*camera.scale)*rect.width/680,clientY:rect.top+(280+(aim[1]+camera.y)*camera.scale)*rect.height/560,bubbles:true}));}
   let best=null;const speed=175+state.boots*16;
   for(let n=0;n<9;n++){
    const a=n*Math.PI/4,dx=n===8?0:Math.cos(a),dy=n===8?0:Math.sin(a),q=[p[0]+dx*speed*.5,p[1]+dy*speed*.5];let cost=0;
    const edge=obs.radius?obs.radius-Math.hypot(...q):Math.min(q[0]-obs.bounds[0],obs.bounds[1]-q[0],q[1]+obs.bounds[3],-obs.bounds[2]-q[1]);cost+=Math.max(0,55-edge)**2*.3;
    for(const e of enemies){let d=dist(q,e.coords)-e.radius;cost+=Math.max(0,130-d)**2*.035;}
    for(const b of bullets)cost+=Math.max(0,65-segment(b,p,q))**2*.3;
    for(const z of zones){let d=zoneDistance(q,z);cost+=Math.max(0,25-d)**2*(z.dash?.length?.15:.3);}
    if(gems.length)cost+=dist(q,gems[0].coords)*.2;else if(target)cost+=Math.abs(dist(q,target.coords)-190)*.1;
    cost+=Math.hypot(...q)*.018;if(n===8)cost+=8;cost+=random()*4;
    if(!best||cost<best.cost)best={dx,dy,cost};
   }
   const arr=['f'];if(best.dx>.3)arr.push('ArrowRight');if(best.dx<-.3)arr.push('ArrowLeft');if(best.dy>.3)arr.push('ArrowDown');if(best.dy<-.3)arr.push('ArrowUp');input(arr);
   state.status={level:state.level,attempt:state.attempt,win:state.wins+1,wave:s.wave,health:s.lives,elapsed:s.fight_elapsed,bossHp:s.boss?.hp??null};
  }catch(e){state.error=e.stack;state.done=true;input([]);}},250);
 },startLevel);
 let chunks=0,recorded=0;const start=Date.now();
 while(true){
  await page.clock.runFor(10000);
  const data=await page.evaluate(()=>({status:playtest.status,attempts:playtest.attempts,results:playtest.results,done:playtest.done,reason:playtest.reason,error:playtest.error}));
  data.wallSeconds=(Date.now()-start)/1000;data.virtualSeconds=++chunks*10;
  fs.writeFileSync(out+'/results.json',JSON.stringify(data,null,2));
  if(data.attempts.length>recorded){await page.screenshot({path:out+`/attempt-${data.attempts.length}.png`});recorded=data.attempts.length;console.log(JSON.stringify(data.attempts.at(-1)));}
  if(chunks%6===0)console.log(JSON.stringify({progress:data.status,wall:data.wallSeconds,virtual:data.virtualSeconds}));
  if(data.done){console.log(JSON.stringify(data));break;}
 }
 await context.storageState({path:out+'/isolated-profile.json'});await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
