const {test,expect,openGame,leaveFullscreen}=require('./fixtures/game.cjs');
test('all twenty boss themes play through the jukebox with pause, mute, stop and scene controls',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await openGame(page);await leaveFullscreen(page);await page.locator('[data-game="jukebox"]').click();
 await expect(page.locator('[data-difficulty^="geomayhem_boss_"]')).toHaveCount(20);
 for(let level=1;level<=20;level++){
  const card=page.locator(`[data-difficulty="geomayhem_boss_${level}"]`);await expect(card).toContainText('Geomayhem boss');await card.click();
  await expect.poll(()=>page.evaluate(()=>bossAudioDirector.session)).toBe(`${level}:battle`);
  expect(await page.evaluate(()=>bossAudioDirector.sources.size)).toBeGreaterThan(0);
  expect(await page.evaluate(()=>musicPlayer.playing)).toBe(false);
 }
 await expect(page.locator('#now-playing')).toContainText('Crownfall Symphony');
 await page.evaluate(()=>{window.bossAnalyser=audioContext.createAnalyser();bossAnalyser.fftSize=512;bossAudioDirector.bus.connect(bossAnalyser);});
 await expect.poll(()=>page.evaluate(()=>{const data=new Float32Array(512);bossAnalyser.getFloatTimeDomainData(data);return data.some(v=>Math.abs(v)>.0001);})).toBe(true);
 await page.locator('#jukebox-pause').click();await expect(page.locator('#jukebox-status')).toContainText('Paused');
 const paused=await page.evaluate(()=>bossJukeboxTime());expect(await page.evaluate(()=>bossAudioDirector.sources.size)).toBe(0);await page.waitForTimeout(150);expect(await page.evaluate(()=>bossJukeboxTime())).toBe(paused);
 await page.locator('#jukebox-pause').click();await expect.poll(()=>page.evaluate(()=>bossJukeboxTime())).toBeGreaterThan(paused);
 await page.evaluate(()=>setSoundEnabled(false));expect(await page.evaluate(()=>bossAudioDirector.session)).toBeNull();await expect(page.locator('#now-playing')).toBeHidden();
 await page.evaluate(()=>setSoundEnabled(true));await expect.poll(()=>page.evaluate(()=>bossAudioDirector.session)).toBe('20:battle');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 expect(await page.evaluate(()=>bossAudioDirector.session)).toBeNull();
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(()=>page.evaluate(()=>bossAudioDirector.session)).toBe('20:battle');
 await page.locator('#jukebox-controls').screenshot({path:info.outputPath('boss-jukebox.png')});
 await page.locator('#jukebox-stop').click();expect(await page.evaluate(()=>bossAudioDirector.session)).toBeNull();expect(await page.evaluate(()=>bossJukebox.track)).toBeNull();
 await page.locator('[data-difficulty="geomayhem_boss_1"]').click();await page.locator('[data-difficulty="pumpkin"]').click();expect(await page.evaluate(()=>bossAudioDirector.session)).toBeNull();expect(await page.evaluate(()=>musicPlayer.track)).toBe('pumpkin');
 await page.locator('[data-difficulty="geomayhem_boss_2"]').click();await leaveFullscreen(page);await page.locator('[data-game="hangman"]').click();expect(await page.evaluate(()=>bossAudioDirector.session)).toBeNull();expect(await page.evaluate(()=>musicPlayer.theme)).toBe('arcade');
 expect(errors).toEqual([]);
});
