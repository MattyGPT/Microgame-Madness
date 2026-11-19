const {test,expect,openGame,leaveFullscreen}=require('./fixtures/game.cjs');
test('music search filters categories and BPM, supports suggestions and clearing',async({page})=>{
  await openGame(page);await leaveFullscreen(page);await page.locator('[data-game="jukebox"]').click();
  const input=page.getByRole('searchbox',{name:'Search arcade music'});
  const visible=page.locator('.jukebox-song-item:visible');
  const all=await visible.count();expect(all).toBeGreaterThan(10);
  await input.fill('boss');
  await expect(page.getByRole('group',{name:'Search suggestions'}).getByRole('button',{name:'Boss Crush',exact:true})).toBeVisible();
  await page.getByRole('group',{name:'Search suggestions'}).getByRole('button',{name:'Boss Crush',exact:true}).click();
  await expect(input).toHaveValue('Boss Crush');
  expect(await visible.count()).toBeGreaterThan(0);
  for(const text of await visible.allTextContents())expect(text).toContain('Boss Crush');
  await input.fill('100');await input.press('ArrowDown');await page.keyboard.press('Enter');
  expect(await visible.count()).toBeGreaterThan(0);
  for(const text of await visible.allTextContents()){const bpm=Number(text.match(/(\d+) BPM/)[1]);expect(bpm).toBeGreaterThan(0);expect(bpm).toBeLessThanOrEqual(100);}
  await input.fill('zzzz no song');await expect(visible).toHaveCount(0);await expect(page.locator('#jukebox-search [role="status"]')).toContainText('No songs found');
  await page.locator('.jukebox-search-clear').click();await expect(visible).toHaveCount(all);
  await input.fill('treasure');await visible.first().locator('[data-difficulty]').click();await expect(page.locator('#jukebox-status')).toContainText('Gilded Tides');
  await page.locator('.jukebox-search-clear').click();await expect(page.locator('#jukebox-status')).toContainText('Gilded Tides');
  await input.fill('rock');await input.press('Escape');await expect(page.locator('.jukebox-suggestions')).toBeHidden();
  await page.locator('#jukebox-search').screenshot({path:test.info().outputPath('music-search.png')});
});
