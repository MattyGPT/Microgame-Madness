const {test,expect,openGame}=require('./fixtures/game.cjs');
test('all defeat films render; Regent has a staged world-ending finale and accessible stills',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/boss-showcase.html');await page.waitForFunction(()=>document.body.dataset.ready==='true');
 const result=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=960;c.height=600;const ctx=c.getContext('2d');
  const films=[];for(let level=1;level<=20;level++){for(const t of [0,2.8,4,6,7.8])BossDefeat.draw(ctx,level,t);films.push(c.toDataURL());}
  const phases=[];for(const t of [1,4,8,11,15,18,20,22,24,27]){BossDefeat.draw(ctx,20,t);phases.push(c.toDataURL());}
  BossDefeat.draw(ctx,20,1,true);const still=c.toDataURL();BossDefeat.draw(ctx,20,22,true);
  return {unique:new Set(films).size,phases:new Set(phases).size,static:still===c.toDataURL(),duration:BossDefeat.duration(20),normal:BossDefeat.duration(12)};
 });
 expect(result).toEqual({unique:20,phases:10,static:true,duration:28,normal:8});
 // Dedicated visible review canvas avoids the theater's animation loop repainting our samples.
 await page.evaluate(()=>{const c=document.createElement('canvas');c.id='death-review';c.width=960;c.height=600;c.style.width='min(960px,100%)';document.body.prepend(c);});
 for(const [level,t,name] of [[12,3.5,'timekeeper'],[16,3.9,'neon-crash'],[5,3,'rose'],[20,4,'regent-wings'],[20,11,'regent-implosion'],[20,18,'regent-world'],[20,20,'regent-shatter'],[20,23,'regent-ray']]){
  await page.evaluate(([level,t])=>BossDefeat.draw(document.querySelector('#death-review').getContext('2d'),level,t),[level,t]);
  await page.locator('#death-review').screenshot({path:info.outputPath(name+'.png')});
 }
 expect(errors).toEqual([]);
});
test('theater victory freezes player, plays defeat sound, and can finish or skip',async({page})=>{
 await page.route('**/boss-showcase.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('buildLoadout();choose(level);','window.deathRuntime=runtime;buildLoadout();choose(level);')});});
 await page.goto('/boss-showcase.html');await page.waitForFunction(()=>document.body.dataset.ready==='true');
 await page.locator('#sound').click();await page.locator('#fight').click();
 await page.evaluate(()=>deathRuntime.runPython('preview.enemies[0].hp=0'));
 await expect(page.locator('#defeat-skip')).toBeVisible();await expect(page.locator('#status')).toContainText('Victory');
 const before=await page.evaluate(()=>deathRuntime.runPython('str((preview.elapsed,preview.x,preview.y,preview.lives))'));
 await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');
 expect(await page.evaluate(()=>deathRuntime.runPython('str((preview.elapsed,preview.x,preview.y,preview.lives))'))).toBe(before);
 await page.locator('#defeat-skip').click();await expect(page.locator('#status')).toContainText('Victory!');
 await page.locator('#fight').click();await page.evaluate(()=>deathRuntime.runPython('preview.enemies[0].hp=0'));
 await expect(page.locator('#defeat-skip')).toBeVisible();
 await page.clock.install();await page.clock.runFor(9000);await expect(page.locator('#status')).toContainText('Victory!');
});
test('campaign Regent defeat freezes combat, switches audio and awards a single victory after skip',async({page})=>{
 await page.route('**/app.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('handle = pyodide.globals.get("handle");','window.deathRuntime=pyodide; handle = pyodide.globals.get("handle");')});});
 await openGame(page);
 await page.evaluate(()=>{selectGame('geomayhem');startGame('level_1');deathRuntime.runPython('from bridge import session\nfrom geomayhem import Geomayhem\nsession.game=Geomayhem(20)\nsession.game.wave=20\nsession.game.break_left=0\nsession.game._spawn()\nsession.game.boss_intro_left=0\nsession.game.enemies[0].hp=0');});
 await expect(page.locator('#boss-cinema')).toBeVisible();await expect(page.locator('#boss-cinema-label')).toContainText('Defeated');
 await page.evaluate(()=>setSoundEnabled(true));await page.waitForFunction(()=>bossAudioDirector?.session==='20:defeat');
 expect(await page.evaluate(()=>snapshot.over)).toBe(false);
 await page.locator('#boss-cinema-skip').click();await expect(page.locator('#boss-cinema')).toBeHidden();
 expect(await page.evaluate(()=>({won:snapshot.won,cleared:snapshot.cleared}))).toEqual({won:true,cleared:20});
});
test('defeat effects are finite stereo audio and Regent score travels from minor to major',async({page})=>{
 await page.goto('/boss-showcase.html');await page.waitForFunction(()=>globalThis.BossDefeat&&globalThis.BossAudio);
 const result=await page.evaluate(()=>{
  const c=new OfflineAudioContext(2,24000,24000);let minimum=Infinity,peak=0;
  for(let level=1;level<=20;level++)for(const kind of new Set(BossDefeat.audioCues(level).map(x=>x[1]))){const b=BossDefeat.soundBuffer(c,level,kind);let energy=0;for(const v of b.getChannelData(0)){if(!Number.isFinite(v))throw Error('Invalid sample');energy+=v*v;peak=Math.max(peak,Math.abs(v))}minimum=Math.min(minimum,energy);}
  const director=new BossAudio.Director(c);let notes=0,sounds=0;director.tone=()=>notes++;director.sound=()=>sounds++;
  for(let section=0;section<8;section++)for(let step=0;step<16;step++)director.regentStep(section*8*16+step,3,false,section*10,0,.3);
  return {minimum,peak,notes,sounds,modes:BossAudio.regentMovements.map(m=>m.mode),names:new Set(BossAudio.regentMovements.map(m=>m.name)).size};
 });
 expect(result.minimum).toBeGreaterThan(1);expect(result.peak).toBeLessThan(1);expect(result.notes).toBeGreaterThan(300);expect(result.sounds).toBeGreaterThan(100);expect(result.names).toBe(8);expect(result.modes).toContain('major');expect(result.modes).toContain('minor');
});
