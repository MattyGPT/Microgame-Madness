const {test,expect,openGame,leaveFullscreen}=require('./fixtures/game.cjs');
test('Galactic Smith has rainbow materials, animated forge effects, and portable arena art',async({page},testInfo)=>{
  await openGame(page);await leaveFullscreen(page);
  await page.evaluate(()=>{selectGame('customs');previewCustom(CubieCustoms.catalog.find(c=>c.id==='galactic_smith'));});
  await expect(page.locator('#customs-preview-tier')).toHaveText('Rainbow Custom');
  const art=page.locator('#customs-preview-art');
  await expect(art.locator('.smith-hammer')).toHaveCount(1);
  expect(await art.locator('.smith-hammer').evaluate(el=>getComputedStyle(el).animationName)).toBe('smith-hammer');
  await page.locator('.customs-preview').screenshot({path:testInfo.outputPath('galactic-smith.png')});
  const decoded=await page.evaluate(async()=>{
    const item=CubieCustoms.catalog.find(c=>c.id==='galactic_smith');
    const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(CubieCustoms.gameSvg(item));await img.decode();return img.naturalWidth;
  });
  expect(decoded).toBe(176);
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await art.locator('.smith-hammer').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});
