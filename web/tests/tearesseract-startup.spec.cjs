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
