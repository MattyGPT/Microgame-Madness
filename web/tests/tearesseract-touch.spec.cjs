const {test,expect}=require('@playwright/test');
test.use({viewport:{width:810,height:1080},hasTouch:true,isMobile:true});
test('joystick aims and moves while an independent finger shoots, cancellation stops movement',async({page},info)=>{
  await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
  await page.route('**/tearesseract.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/\}\)\(\);\s*$/,`window.touchReview={load(n){round=n;enter('attack');},step:update,enter,read(){return {p:{...p},angle:angle(),hits,phase,shield:shieldProfile(),disabled:shieldDisabled()};}};})();`)});});
  await page.goto('/tearesseract.html');await expect(page.locator('#tea-stick')).toBeVisible();await expect(page.locator('#tea-fire')).toBeVisible();
  const result=await page.evaluate(()=>{
    const pad=document.querySelector('#tea-stick'),fire=document.querySelector('#tea-fire');pad.setPointerCapture=()=>{};fire.setPointerCapture=()=>{};
    const r=pad.getBoundingClientRect(),x=r.left+r.width*.8,y=r.top+r.height/2;
    touchReview.load(0);pad.dispatchEvent(new PointerEvent('pointerdown',{pointerId:10,pointerType:'touch',clientX:x,clientY:y,button:0,bubbles:true}));touchReview.step(.1);const anchored=touchReview.read();
    touchReview.load(8);touchReview.step(.1);const moved=touchReview.read();
    touchReview.enter('counter');fire.dispatchEvent(new PointerEvent('pointerdown',{pointerId:11,pointerType:'touch',button:0,bubbles:true}));const shot=touchReview.read();
    pad.dispatchEvent(new PointerEvent('pointercancel',{pointerId:10}));touchReview.load(8);touchReview.step(.1);const stopped=touchReview.read();
    touchReview.load(29);const last=touchReview.read();return {anchored,moved,shot,stopped,last};
  });
  expect(result.anchored.angle).toBeCloseTo(0);expect(result.anchored.p.x).toBe(550);expect(result.anchored.shield.scale).toBeCloseTo(1.03);
  expect(result.moved.p.x).toBeGreaterThan(550);expect(result.moved.disabled).toBe(true);expect(result.shot.hits).toBe(1);expect(result.stopped.p.x).toBe(550);expect(result.last.shield.scale).toBe(1);
  await page.screenshot({path:info.outputPath('touch-controls.png'),fullPage:true});
});
