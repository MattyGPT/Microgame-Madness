const {test,expect,openGame}=require('./fixtures/game.cjs');
test.use({deterministicMusic:true});
test('exclusive artwork is valid, attached and morphs without expression fades',async({page})=>{
 await openGame(page);await page.evaluate(()=>accountApp.ready);
 const result=await page.evaluate(()=>{
  const errors=[];const gallery=document.createElement('div');gallery.id='exclusive-review';
  for(const game of CrownPacks.games)for(const kind of ['cubie','turtle','trail']){
   const svg=CrownPacks.art({crown:game.mode,id:`review-${game.mode}-${kind}`},kind);
   if(new DOMParser().parseFromString(svg,'image/svg+xml').querySelector('parsererror'))errors.push(`${game.mode}:${kind}`);
   if(kind==='cubie')gallery.insertAdjacentHTML('beforeend',svg);
  }document.body.append(gallery);return errors;
 });expect(result).toEqual([]);
 const gallery=page.locator('#exclusive-review');
 await expect(gallery.locator('[data-crown-mode="geomayhem"] .ex-attached-crown .crown-regalia')).toHaveCount(1);
 await expect(gallery.locator('.ex-thorn-orbit')).toHaveCount(0);
 await expect(gallery.locator('.ex-surface-thorn')).toHaveCount(18);
 await expect(gallery.locator('[data-expression-count="20"]')).toHaveCount(1);
 await expect(gallery.locator('.ex-expression')).toHaveCount(0);
 const lengths=await page.evaluate(async()=>{
  const svg=document.querySelector('#exclusive-review [data-crown-mode="keyboard"]');svg.pauseAnimations();
  const path=svg.querySelector('.ex-face-idle>path');svg.setCurrentTime(0);await new Promise(requestAnimationFrame);const start=path.getTotalLength();
  svg.setCurrentTime(5);await new Promise(requestAnimationFrame);return [start,path.getTotalLength(),getComputedStyle(path).opacity];
 });expect(lengths[0]).not.toBe(lengths[1]);expect(lengths[2]).toBe('1');
 await page.evaluate(()=>{document.documentElement.dataset.settingMotion='true';document.dispatchEvent(new Event('arcade-settings-change'));});
 await expect.poll(()=>page.evaluate(()=>[...document.querySelectorAll('#exclusive-review svg')].filter(s=>s.querySelector('animate')).every(s=>s.animationsPaused()))).toBe(true);
});
