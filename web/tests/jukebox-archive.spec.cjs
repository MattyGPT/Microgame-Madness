const {test,expect,leaveFullscreen}=require('./fixtures/game.cjs');
test('archived songs play, seek, pause and stay out of automatic shuffle',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.locator('#runtime-status')).toContainText('All games ready',{timeout:30000});
  await leaveFullscreen(page);await page.locator('[data-game="jukebox"]').click();
  for(const id of ['nano_theme_timing','coin_board_4','galactic_forge','core_origin_film','tearesseract_prelude']){
    await page.locator(`[data-difficulty="${id}"]`).click();
    await expect.poll(()=>page.evaluate(()=>musicPlayer.current?.track),{timeout:30000}).toBe(id);
    await page.evaluate(()=>seekJukebox(1));
    expect(await page.evaluate(()=>musicPlayer.current.offset)).toBe(1);
  }
  await page.locator('#jukebox-pause').click();expect(await page.evaluate(()=>musicPlayer.current)).toBeNull();
  await page.locator('#jukebox-pause').click();await expect.poll(()=>page.evaluate(()=>musicPlayer.current?.track)).toBe('tearesseract_prelude');
  await page.locator('#jukebox-stop').click();expect(await page.evaluate(()=>musicPlayer.current)).toBeNull();
  expect(await page.evaluate(()=>ArcadeMusic.arcadeTracks.some(t=>JukeboxArchive.has(t.id)))).toBe(false);
  for(const [id,mode] of [['boss_score_1_intro','intro'],['boss_score_20_phase3','battle'],['boss_score_20_defeat','defeat']]){
    await page.locator(`[data-difficulty="${id}"]`).click();
    await expect.poll(()=>page.evaluate(()=>bossAudioDirector.session)).toBe(`${id.includes('_20_')?20:1}:${mode}`);
    await page.evaluate(()=>seekJukebox(1));expect(await page.evaluate(()=>bossJukeboxTime())).toBeGreaterThanOrEqual(1);
  }
  expect(errors).toEqual([]);
});
