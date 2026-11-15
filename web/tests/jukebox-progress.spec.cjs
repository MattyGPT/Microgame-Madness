const {test,expect,openGame}=require('./fixtures/game.cjs');
test('selected songs show a seekable progress bar that respects pause and stop',async({page})=>{
 await openGame(page);await page.locator('[data-game="jukebox"]').click();
 const lengths=await page.locator('.song-card .song-length').allTextContents();
 expect(lengths.length).toBe(await page.locator('.song-card').count());
 expect(lengths.every(text=>/^\d+:\d{2}$/.test(text))).toBe(true);
 const regular=await page.locator('.song-card').first().getAttribute('data-difficulty');
 for(const id of [regular,'geomayhem_boss_20']){
  await page.locator(`[data-difficulty="${id}"]`).click();
  const panel=page.locator(`[data-song-progress="${id}"]`),slider=panel.locator('input');
  await expect(panel).toBeVisible();
  await expect(page.locator('.song-progress:visible')).toHaveCount(1);
  await expect.poll(async()=>Number(await slider.inputValue())).toBeGreaterThan(.1);
  await page.locator('#jukebox-pause').click();
  const duration=Number(await slider.getAttribute('max'));
  await slider.fill((duration*.65).toFixed(1));
  await expect.poll(async()=>Number(await slider.inputValue())).toBeCloseTo(duration*.65,0);
  const paused=Number(await slider.inputValue());
  await page.waitForTimeout(250);
  expect(Number(await slider.inputValue())).toBe(paused);
  await page.locator('#jukebox-pause').click();
  await expect.poll(async()=>Number(await slider.inputValue())).toBeGreaterThan(paused+.1);
 }
 await page.locator('#jukebox-stop').click();await expect(page.locator('.song-progress:visible')).toHaveCount(0);
});
