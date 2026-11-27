const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('local Balloon Pop pauses for a centered difficulty dialog and resumes or switches',async({page},info)=>{
 test.skip(!fs.existsSync('dist/balloon-pop/index.html'),'Local-only game is absent from public builds');
 await page.goto('/balloon-pop/index.html');
 await page.evaluate(()=>BalloonPop.start('normal',true));
 await page.locator('[data-mode="hard"]').click();
 await expect(page.locator('#change-mode')).toBeVisible();
 expect(await page.evaluate(()=>BalloonPop.phase)).toBe('paused');
 const before=await page.evaluate(()=>BalloonPop.run.time);
 await page.waitForTimeout(250);
 expect(await page.evaluate(()=>BalloonPop.run.time)).toBe(before);
 const box=await page.locator('#change-mode').boundingBox(),viewport=page.viewportSize();
 expect(Math.abs(box.x+box.width/2-viewport.width/2)).toBeLessThan(2);
 expect(Math.abs(box.y+box.height/2-viewport.height/2)).toBeLessThan(2);
 await page.screenshot({path:info.outputPath('difficulty-dialog.png')});
 await page.locator('#change-cancel').click();await expect.poll(()=>page.evaluate(()=>BalloonPop.phase)).toBe('playing');
 await page.locator('[data-mode="hard"]').click();await page.locator('#change-confirm').click();
 await expect.poll(()=>page.evaluate(()=>BalloonPop.phase)).toBe('ready');
 await expect(page.locator('[data-mode="hard"]')).toHaveAttribute('aria-pressed','true');
});

test('mouse gets 60 screen pixels of extra reach while touch requires a direct hit',async({page})=>{
 await page.goto('/balloon-pop/index.html');
 const results=await page.evaluate(()=>{
  BalloonPop.start('normal',true);
  const canvas=document.querySelector('canvas'),rect=canvas.getBoundingClientRect(),run=BalloonPop.run;
  function attempt(pointerType,extra){
   run.balloons=[];run.spawn();
   const b=run.balloons[0];b.x=run.width/2;b.y=325;
   const clientX=rect.left+(b.x+b.radius)/canvas.width*rect.width+extra;
   const clientY=rect.top+b.y/650*rect.height;
   canvas.dispatchEvent(new PointerEvent('pointerdown',{pointerType,clientX,clientY,bubbles:true,cancelable:true}));
   return run.balloons.length===0;
  }
  return {mouseInside:attempt('mouse',59),mouseOutside:attempt('mouse',61),touchOutside:attempt('touch',10),touchDirect:attempt('touch',-10)};
 });
 expect(results).toEqual({mouseInside:true,mouseOutside:false,touchOutside:false,touchDirect:true});
});

test('mouse range indicator follows the pointer and matches the scaled reach',async({page})=>{
 await page.goto('/balloon-pop/index.html');
 const geometry=await page.evaluate(()=>{
  BalloonPop.start('normal',true);
  const canvas=document.querySelector('canvas'),r=canvas.getBoundingClientRect();
  const x=r.left+r.width/2,y=r.top+r.height/2;
  canvas.dispatchEvent(new PointerEvent('pointermove',{pointerType:'mouse',clientX:x,clientY:y}));
  const ring=document.querySelector('.balloon-click-range').getBoundingClientRect();
  return {width:ring.width,height:ring.height,expectedHeight:120*canvas.width/r.width*r.height/650,dx:ring.x+ring.width/2-x,dy:ring.y+ring.height/2-y};
 });
 expect(geometry.width).toBeCloseTo(120,1);
 expect(geometry.height).toBeCloseTo(geometry.expectedHeight,1);
 expect(geometry.dx).toBeCloseTo(0,1);expect(geometry.dy).toBeCloseTo(0,1);
 await expect(page.locator('#balloon-cursor')).toBeVisible();
 await page.locator('canvas').dispatchEvent('pointerleave');
 await expect(page.locator('#balloon-cursor')).toBeHidden();
});

test('difficulty labels and scoring use the new multipliers with a wider Impossible arena',async({page},info)=>{
 await page.goto('/balloon-pop/index.html');
 for(const [mode,multiplier] of [['hard',3],['merciless',5],['impossible',7.5]]){
  await expect(page.locator(`[data-mode="${mode}"] b`)).toHaveText('×'+multiplier);
 }
 await page.locator('[data-mode="impossible"]').click();
 await expect(page.locator('#mode-label')).toContainText('×7.5');
 expect(await page.locator('canvas').evaluate(el=>el.width)).toBe(info.project.name==='mobile'?630:1200);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const score=await page.evaluate(()=>{BalloonPop.start('impossible',true);BalloonPop.run.score=123;return BalloonPop.run.weighted;});
 expect(score).toBe(922.5);
});
