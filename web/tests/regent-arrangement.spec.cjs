const {test,expect,openGame}=require('./fixtures/game.cjs');
test('Regent guitar and drum sections render finite audible audio and jukebox seeking reaches them',async({page})=>{
 await openGame(page);
 const sections=await page.evaluate(async()=>{
  const results=[];
  for(const bar of [32,40,48]){
   const rate=22050,beat=60/BossAudio.profiles[19].bpm,duration=beat*8+1.5;
   const context=new OfflineAudioContext(2,Math.ceil(rate*duration),rate),director=new BossAudio.Director(context);
   for(let step=0;step<32;step++)director.regentStep(bar*16+step,1,false,bar*beat*4+step*beat*.25,.02+step*beat*.25,beat);
   const buffer=await context.startRendering(),data=buffer.getChannelData(0);let energy=0,peak=0,finite=true;
   for(const value of data){energy+=value*value;peak=Math.max(peak,Math.abs(value));finite&&=Number.isFinite(value);}
   results.push({bar,rms:Math.sqrt(energy/data.length),peak,finite});
  }
  return results;
 });
 for(const section of sections){expect(section.finite).toBe(true);expect(section.rms).toBeGreaterThan(.001);expect(section.peak).toBeLessThan(1);}
 expect(new Set(sections.map(s=>s.rms.toFixed(5))).size).toBe(3);
 await page.locator('[data-game="jukebox"]').click();await page.locator('[data-difficulty="geomayhem_boss_20"]').click();
 for(const bar of [32,40,48]){
  const state=await page.evaluate(bar=>{bossAudioDirector.stop();bossJukebox.elapsed=bar*4*60/196;bossJukebox.started=audioContext.currentTime;tickBossJukebox();return BossAudio.regentArrangement(bossAudioDirector.beat-1);},bar);
  expect(state.guitar).toBe(bar<48);expect(state.groove).toBe(bar===40);expect(state.heavy).toBe(bar===48);
 }
 await page.locator('#jukebox-stop').click();expect(await page.evaluate(()=>bossAudioDirector.sources.size)).toBe(0);
});
