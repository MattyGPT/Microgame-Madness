const {test,expect,openGame}=require('./fixtures/game.cjs');
test('all 20 bosses load with cinematics and three real attack previews',async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/boss-showcase.html');
  await expect(page.locator('body')).toHaveAttribute('data-ready','true',{timeout:30000});
  await expect(page.locator('#roster button')).toHaveCount(20);
  for(let i=0;i<20;i++){
    await page.locator('#roster button').nth(i).click();
    await expect(page.locator('#boss-name')).toHaveText(await page.evaluate(i=>GeomayhemBosses.catalog[i].name,i));
    await expect(page.locator('#moves button')).toHaveCount(3);
    for(let j=0;j<3;j++){
      const button=page.locator('#moves button').nth(j),name=await button.textContent();
      await button.click();await expect(page.locator('#status')).toContainText(name);
    }
  }
  await page.locator('#phase').selectOption('3');await expect(page.locator('#status')).toContainText('Phase 3');
  await expect(page.locator('#status')).toContainText(/[1-9]\d* reinforcements/);
  await page.locator('#intro').click();await page.waitForTimeout(3600);
  await page.screenshot({path:info.outputPath('boss-theater.png')});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
test('campaign boss introduction freezes combat, skips, and keeps a named health bar',async({page})=>{
  await page.route('**/app.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('handle = pyodide.globals.get("handle");','window.bossRuntime=pyodide; handle = pyodide.globals.get("handle");')})});
  await openGame(page);
  await page.evaluate(()=>{selectGame('geomayhem');startGame('level_1');window.bossRuntime.runPython('from bridge import session\nsession.game.wave=20\nsession.game.break_left=0\nsession.game.spawned=0\nsession.game._spawn()');});
  await expect(page.locator('#boss-cinema')).toBeVisible();
  await page.evaluate(()=>setSoundEnabled(true));
  await page.waitForFunction(()=>bossAudioDirector?.session==='1:intro');
  const before=await page.evaluate(()=>window.bossRuntime.runPython('str((session.game.elapsed, session.game.lives, session.game.x))'));
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(300);await page.keyboard.up('ArrowRight');
  const after=await page.evaluate(()=>window.bossRuntime.runPython('str((session.game.elapsed, session.game.lives, session.game.x))'));
  // Python proxies are converted to strings for deterministic comparison.
  expect(String(after)).toBe(String(before));
  await page.locator('#boss-cinema-skip').click();await expect(page.locator('#boss-cinema')).toBeHidden();
  await expect(page.locator('#geomayhem-boss-name')).toContainText('Circuit Warden');
  await expect(page.locator('#geomayhem-boss-name')).toContainText('HP');
  await page.waitForFunction(()=>bossAudioDirector?.session==='1:battle');
  await page.evaluate(()=>setSoundEnabled(false));
  expect(await page.evaluate(()=>bossAudioDirector.session)).toBe(null);
});

test('boss audio renders twenty finite stereo effects and stops on pause and mute',async({page})=>{
  await page.goto('/boss-showcase.html');
  await page.waitForFunction(()=>globalThis.BossAudio && globalThis.BossFilm);
  const result=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=960;canvas.height=600;const ctx=canvas.getContext('2d');
    for(let level=1;level<=20;level++)for(const time of [0,3.5,6.5,9.4,12.5])BossFilm.draw(ctx,level,time);
    BossFilm.draw(ctx,20,1,true);const still=canvas.toDataURL();BossFilm.draw(ctx,20,13,true);
    if(canvas.toDataURL()!==still)throw Error('Reduced motion must remain static');
    const context=new OfflineAudioContext(2,48000,24000);
    const grooves=new Set(BossAudio.profiles.map(p=>JSON.stringify([p.steps,p.kick,p.snare,p.lead,p.harmony])));
    if(grooves.size!==20)throw Error('Boss arrangements must be distinct');
    const drums=['kick','snare','hat','taiko','crash'].map(kind=>{
      const buffer=BossAudio.drum(context,20,kind),data=buffer.getChannelData(0);
      let energy=0;for(const v of data){if(!Number.isFinite(v)||Math.abs(v)>=1)throw Error('Invalid percussion sample');energy+=v*v;}
      if(energy<.1)throw Error('Silent percussion');return energy;
    });
    if(new Set(drums).size!==5)throw Error('Drums must have distinct waveforms');
    const signatures=BossAudio.profiles.map(p=>{
      const buffer=BossAudio.effect(context,p.level),left=buffer.getChannelData(0),right=buffer.getChannelData(1);
      let energy=0,stereo=0,peak=0;for(let i=0;i<left.length;i++){if(!Number.isFinite(left[i])||!Number.isFinite(right[i]))throw Error('Invalid sample');energy+=left[i]*left[i];stereo+=Math.abs(left[i]-right[i]);peak=Math.max(peak,Math.abs(left[i]));}
      return {energy,stereo,peak};
    });
    return {signatures,duration:BossFilm.duration,titles:new Set(BossAudio.profiles.map(p=>p.title)).size};
  });
  expect(result.duration).toBe(14);expect(result.titles).toBe(20);
  for(const s of result.signatures){expect(s.energy).toBeGreaterThan(1);expect(s.stereo).toBeGreaterThan(.1);expect(s.peak).toBeLessThan(1);}
  await page.locator('#sound').click();await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','true');
  const lifecycle=await page.evaluate(async()=>{
    const context=new AudioContext();await context.resume();const director=new BossAudio.Director(context);
    director.sync({level:6,time:0});director.sync({level:6,time:.3});
    const audible=director.sources.size>0 && director.events>0;
    director.sync({level:6,playing:false});await new Promise(resolve=>setTimeout(resolve,60));const stopped=director.sources.size===0 && director.wet.gain.value===0;
    director.sync({level:20,mode:'battle',time:0});const switched=director.session==='20:battle';
    director.stop();await context.close();return {audible,stopped,switched};
  });
  expect(lifecycle).toEqual({audible:true,stopped:true,switched:true});
  await page.locator('#sound').click();await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','false');
});

test('theater uses real arena commands and animated shared boss scenery',async({page},info)=>{
  await page.route('**/boss-showcase.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('arenaBackground=state.background||[];', 'arenaBackground=state.background||[];window.theaterBackground=arenaBackground;')});});
  await page.goto('/boss-showcase.html');
  await expect(page.locator('body')).toHaveAttribute('data-ready','true',{timeout:30000});
  for(const index of [0,9,19]){
    await page.locator('#roster button').nth(index).click();
    expect(await page.evaluate(()=>window.theaterBackground.length)).toBeGreaterThan(10);
    await page.locator('#attacks').click();
  }
  const results=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=930;canvas.height=705;
    const ctx=canvas.getContext('2d');ctx.translate(465,352.5);
    const paint=(level,time,reduced=false)=>{ctx.clearRect(-465,-352.5,930,705);BossArena.draw(ctx,{level,bounds:[-465,465,-352.5,352.5],time,phase:2,reduced});return canvas.toDataURL()};
    const variants=Array.from({length:20},(_,i)=>paint(i+1,3));
    return {unique:new Set(variants).size,animated:paint(20,1)!==paint(20,2),still:paint(20,1,true)===paint(20,2,true)};
  });
  expect(results).toEqual({unique:20,animated:true,still:true});
  await page.locator('#pause').click();
  await page.locator('#theater').screenshot({path:info.outputPath('real-boss-arena.png')});
});
