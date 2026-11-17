const {test,expect}=require('@playwright/test');

test('slow soundtrack downloads show an animated loader, then the intro advances into combat',async({page})=>{
  let release;const gate=new Promise(resolve=>release=resolve);let downloads=0;
  await page.route('**/tearesseract-theme.mp3*',async route=>{downloads++;await gate;await route.continue();});
  await page.addInitScript(()=>{if(window.AudioParam)AudioParam.prototype.cancelAndHoldAtTime=undefined;});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/tearesseract.html',{waitUntil:'domcontentloaded'});
  await page.locator('#start').click();
  await expect(page.locator('#fight-loading')).toBeVisible();
  await expect(page.locator('#fight')).toHaveAttribute('data-phase','loading');
  await expect(page.locator('#start')).toBeDisabled();
  const animation=await page.locator('.loading-core').evaluate(el=>getComputedStyle(el).transform);
  await page.waitForTimeout(150);
  expect(await page.locator('.loading-core').evaluate(el=>getComputedStyle(el).transform)).not.toBe(animation);
  expect(await page.evaluate(()=>new Promise(resolve=>{let frames=0;function tick(){if(++frames===4)resolve(frames);else requestAnimationFrame(tick);}requestAnimationFrame(tick);}))).toBe(4);
  release();
  await expect(page.locator('#fight')).toHaveAttribute('data-phase','intro');
  await expect(page.locator('#fight-loading')).toBeHidden();
  await expect(page.locator('#pause')).toHaveText('PAUSE');
  await expect(page.locator('#fight')).toHaveAttribute('data-phase','attack',{timeout:18000});
  await page.locator('#start').click();
  await expect(page.locator('#fight')).toHaveAttribute('data-phase','intro');
  expect(downloads).toBe(1);
  expect(errors).toEqual([]);
});

test('failed audio cannot prevent the intro or a selected practice attack',async({page})=>{
  await page.route('**/tearesseract-theme.mp3*',route=>route.abort());
  await page.goto('/tearesseract.html',{waitUntil:'domcontentloaded'});
  await page.locator('#start').click();
  await expect(page.locator('#fight')).toHaveAttribute('data-phase','intro');
  await expect(page.locator('#status')).toContainText('AUDIO UNAVAILABLE');
  await expect(page.locator('#fight-loading')).toBeHidden();
  await page.locator('#attack-loader').selectOption('6');
  await page.locator('#load-attack').click();
  await expect(page.locator('#fight')).toHaveAttribute('data-phase','attack');
  await expect(page.locator('#status')).toContainText('PRISM CROSSCURRENT');
});

test('stalled audio starts silently within six seconds without a fake 90 percent',async({page})=>{
  let release;const gate=new Promise(resolve=>release=resolve);
  await page.route('**/tearesseract-theme.mp3*',async route=>{await gate;await route.abort();});
  try{
    await page.goto('/tearesseract.html',{waitUntil:'domcontentloaded'});
    await page.locator('#start').click();
    await expect(page.locator('#fight-loading')).toBeVisible();
    await expect(page.locator('#load-percent')).toHaveText('WAITING FOR AUDIO');
    await expect(page.locator('#load-progress')).not.toHaveAttribute('value');
    await expect(page.locator('#fight')).toHaveAttribute('data-phase','intro',{timeout:8000});
    await expect(page.locator('#status')).toContainText('AUDIO UNAVAILABLE');
  }finally{release();}
});

test.describe('iPad Home Screen lifecycle and slow frames',()=>{
  test.use({viewport:{width:810,height:1080},isMobile:true,hasTouch:true});
  test('intro reaches combat with interrupted WebAudio and low frame rate',async({page})=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>{
      Object.defineProperty(navigator,'standalone',{value:true});
      // A suspended/interrupted effect context must not gate streamed music or animation.
      AudioContext.prototype.resume=()=>new Promise(()=>{});
      AudioContext.prototype.decodeAudioData=()=>{throw Error('Must not decode the full soundtrack');};
      AudioContext.prototype.createOscillator=()=>{throw Error('Interrupted audio output');};
      Object.defineProperty(AudioContext.prototype,'state',{get:()=> 'running'});
      window.requestAnimationFrame=callback=>setTimeout(()=>callback(performance.now()),100);
      window.cancelAnimationFrame=clearTimeout;
    });
    await page.goto('/tearesseract.html');
    await page.locator('#start').click();
    await expect(page.locator('#fight')).toHaveAttribute('data-phase','intro');
    await expect(page.locator('#fight')).toHaveAttribute('data-phase','attack',{timeout:17000});
    expect(errors).toEqual([]);
  });
  test('foregrounding resumes automatic pauses and preserves manual pauses',async({page})=>{
    await page.addInitScript(()=>{
      Object.defineProperty(navigator,'standalone',{value:true});
      window.testHidden=false;
      Object.defineProperty(document,'hidden',{get:()=>window.testHidden});
    });
    await page.goto('/tearesseract.html');
    await page.locator('#start').click();
    await expect(page.locator('#fight')).toHaveAttribute('data-phase','intro');
    await page.evaluate(()=>{window.testHidden=true;document.dispatchEvent(new Event('visibilitychange'));});
    await expect(page.locator('#pause')).toHaveText('RESUME');
    await page.evaluate(()=>{window.testHidden=false;window.dispatchEvent(new Event('pageshow'));});
    await expect(page.locator('#pause')).toHaveText('PAUSE');
    await page.locator('#pause').click();
    await page.evaluate(()=>{window.testHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.testHidden=false;document.dispatchEvent(new Event('visibilitychange'));});
    await expect(page.locator('#pause')).toHaveText('RESUME');
    await page.locator('#pause').click();
    await expect(page.locator('#fight')).toHaveAttribute('data-phase','attack',{timeout:17000});
  });
});
