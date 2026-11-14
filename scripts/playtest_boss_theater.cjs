// Sixty isolated browser attempts. UI inputs only; observations expose the rendered snapshot.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const {routeLocalRuntime}=require('../web/tests/fixtures/game.cjs');
(async()=>{
 const root=path.resolve(process.env.THEATER_OUTPUT||'artifacts/boss-theater-60-attempts'),worker=Number(process.env.THEATER_WORKER||0);
 const out=process.env.THEATER_LABEL?root+'/'+process.env.THEATER_LABEL:worker?root+'/worker-'+worker:root;fs.mkdirSync(out,{recursive:true});
 const completed=fs.existsSync(root+'/results.json')?JSON.parse(fs.readFileSync(root+'/results.json')).results:[];
 const levels=JSON.parse(process.env.THEATER_LEVELS||'[]');
 const trials=JSON.parse(fs.readFileSync(root+'/loadouts.json')).filter(t=>(!worker||t.attempt===worker)&&(!levels.length||levels.includes(t.level))&&t.attempt<=Number(process.env.THEATER_MAX_ATTEMPTS||30)&&!completed.some(r=>r.level===t.level&&r.attempt===t.attempt));
 const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1280,height:1000}});
 await routeLocalRuntime(page);
 await page.route('**/boss-showcase.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('  choose(1);requestAnimationFrame(frame);','  let theaterPaintFrame=0;window.theaterObservation=()=>state;\n  choose(1);requestAnimationFrame(frame);').replace("    if(mode==='intro'){GeomayhemBosses.cinematic","    if(++theaterPaintFrame%10===0||state?.over){if(mode==='intro'){GeomayhemBosses.cinematic").replace("    if(runtime)$('status')","    }if(runtime)$('status')")})});
 page.on('pageerror',e=>{fs.appendFileSync(out+'/errors.log',e.stack+'\n')});
 await page.goto(process.env.THEATER_TEST_URL||'http://127.0.0.1:8792/boss-showcase.html');
 await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});
 await page.clock.install();
 await page.evaluate(()=>{
  const bot=window.theaterBot={active:false,held:[],previous:null,decisions:0,misses:0,lapses:0};
  const random=()=>{bot.seed=(1664525*bot.seed+1013904223)>>>0;return bot.seed/4294967296};
  const input=arr=>{const canvas=document.querySelector('#theater');for(const key of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','f'])canvas.dispatchEvent(new KeyboardEvent(arr.includes(key)?'keydown':'keyup',{key,bubbles:true,cancelable:true}));bot.held=arr;};
  bot.release=()=>input([]);
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const segment=(p,a,b)=>{let dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return dist(p,[a[0]+dx*u,a[1]+dy*u]);};
  const zoneDistance=(p,c)=>{const q=c.coords;if(c.kind==='oval'){const center=[(q[0]+q[2])/2,(q[1]+q[3])/2],r=(q[2]-q[0])/2;return c.fill?dist(p,center)-r:Math.abs(dist(p,center)-r)-(c.width||1)/2;}
   if(c.kind==='rectangle')return Math.max(q[0]-p[0],p[0]-q[2],q[1]-p[1],p[1]-q[3]);
   if(c.kind==='polygon'){let inside=false,min=Infinity;for(let i=0,j=q.length-2;i<q.length;j=i,i+=2){const a=[q[j],q[j+1]],b=[q[i],q[i+1]];min=Math.min(min,segment(p,a,b));if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside?-min:min;}return 1000;};
  setInterval(()=>{
   if(!bot.active)return;
   const s=theaterObservation();if(!s)return;
   if(s.over||s.fight_elapsed>=300){bot.active=false;input([]);if(!s.over)document.querySelector('#pause').click();bot.result={outcome:s.over?(s.won?'WIN':'LOSS'):'TIME LIMIT',seconds:s.fight_elapsed,hp:s.lives,maxHP:s.max_lives,bossHP:s.boss?.hp??0,bossMaxHP:bot.initialBossHP,damageTaken:s.damage_taken,kills:s.kills,shots:s.shots_fired,decisions:bot.decisions,missedReactions:bot.misses,aimLapses:bot.lapses};return;}
   bot.decisions++;
   const seen={player:[s.player.x,-s.player.y],radius:s.boss_arena_radius,commands:s.commands};
   const obs=bot.previous;bot.previous=seen;if(!obs||random()<.10){bot.misses++;return;}
   const p=obs.player,enemies=obs.commands.filter(c=>['geomayhem_enemy','geomayhem_boss'].includes(c.kind));
   const bullets=obs.commands.filter(c=>c.kind==='oval'&&c.fill==='#ff3557').map(c=>[(c.coords[0]+c.coords[2])/2,(c.coords[1]+c.coords[3])/2]);
   const zones=obs.commands.filter(c=>['#ffce65','#ff526a','#ffd36d'].includes(c.fill)||['#ffce65','#ff526a'].includes(c.outline)).filter(c=>c.kind!=='text');
   enemies.sort((a,b)=>dist(p,a.coords)-dist(p,b.coords));
   let target=enemies[0];const boss=enemies.find(e=>e.kind==='geomayhem_boss');if(boss&&(!target||dist(p,target.coords)>130))target=boss;
   if(target){const lapse=random()<.08;if(lapse)bot.lapses++;const angle=Math.atan2(target.coords[1]-p[1],target.coords[0]-p[0])+(random()-.5)*(lapse?.9:.28),range=dist(p,target.coords),aim=[p[0]+Math.cos(angle)*range,p[1]+Math.sin(angle)*range];const canvas=document.querySelector('#theater'),r=canvas.getBoundingClientRect();canvas.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left+(480+aim[0]*.95)*r.width/960,clientY:r.top+(300+aim[1]*.95)*r.height/600,bubbles:true}));}
   let best=null;const speed=175+bot.boots*16+(bot.fleet?30:0);
   // Evaluate visible positions only; no access to hidden attack timers or future trajectories.
   const ignored=zones.filter(()=>random()>.15);
   for(let n=0;n<9;n++){
    const a=n*Math.PI/4,dx=n===8?0:Math.cos(a),dy=n===8?0:Math.sin(a),q=[p[0]+dx*speed*.4,p[1]+dy*speed*.4];let cost=0;
    const edge=obs.radius-Math.hypot(...q);cost+=Math.max(0,40-edge)**2*.3;
    for(const e of enemies){const d=dist(q,e.coords)-e.radius;cost+=Math.max(0,100-d)**2*.045;}
    for(const b of bullets)cost+=Math.max(0,45-segment(b,p,q))**2*.22;
    for(const z of ignored){const d=zoneDistance(q,z);cost+=Math.max(0,18-d)**2*(z.dash?.length?.12:.28);}
    if(target)cost+=Math.abs(dist(q,target.coords)-150)*.22;
    if(n===8)cost+=8;cost+=random()*12;
    if(!best||cost<best.cost)best={dx,dy,cost};
   }
   const arr=random()<.04?[]:['f'];if(best.dx>.3)arr.push('ArrowRight');if(best.dx<-.3)arr.push('ArrowLeft');if(best.dy>.3)arr.push('ArrowDown');if(best.dy<-.3)arr.push('ArrowUp');input(arr);
  },250);
 });
 const results=[];const wonLevels=new Set();const started=Date.now();
 for(const trial of trials){
  if(process.env.THEATER_UNTIL_WIN&&wonLevels.has(trial.level))continue;
  await page.evaluate(t=>{
   const bot=theaterBot;bot.active=false;bot.release();document.querySelectorAll('#roster button')[t.level-1].click();
   const set=(id,value)=>{const el=document.getElementById(id);el.value=String(value);el.dispatchEvent(new Event('change',{bubbles:true}));};
   for(let i=0;i<4;i++){set(`weapon-${i}`,t.config.weapons[i]?.id||'');set(`stars-${i}`,t.config.weapons[i]?.stars||1);}
   for(const group of ['upgrades','workshop'])for(const [key,value]of Object.entries(t.config[group]))set(`${group}-${key}`,value);
   for(const el of document.querySelectorAll('#relics input'))el.checked=t.config.relics.includes(el.value);
   document.querySelector('#fight').click();if(document.querySelector('#loadout-error').textContent)throw Error(document.querySelector('#loadout-error').textContent);
   bot.seed=t.seed;bot.boots=t.config.upgrades.boots;bot.fleet=t.config.relics.includes('fleet');bot.previous=null;bot.decisions=bot.misses=bot.lapses=0;bot.result=null;bot.initialBossHP=theaterObservation().boss.max_hp;bot.active=true;
  },trial);
  let state;
  do{await page.clock.runFor(10000);state=await page.evaluate(()=>({active:theaterBot.active,result:theaterBot.result}));}while(state.active);
  const result={...trial,...state.result};results.push(result);if(result.outcome==='WIN')wonLevels.add(trial.level);fs.writeFileSync(out+'/results.json',JSON.stringify({method:'Real Boss Theater UI, accelerated browser clock, delayed imperfect controller; not calibrated to human players.',results},null,2));
  await page.locator('.arena-screen').screenshot({path:out+`/boss-${trial.level}-attempt-${trial.attempt}.png`});
  console.log(JSON.stringify({level:trial.level,attempt:trial.attempt,...state.result,wallSeconds:Math.round((Date.now()-started)/1000)}));
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
