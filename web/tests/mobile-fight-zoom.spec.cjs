const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
test('pinch zoom preserves every fight canvas and does not force scrolling',async({page,context})=>{
 await page.route('https://cdn.jsdelivr.net/pyodide/v0.29.3/full/**',route=>{
  const file=path.basename(new URL(route.request().url()).pathname),local=path.resolve('node_modules/pyodide',file);
  return fs.existsSync(local)?route.fulfill({path:local,contentType:file.endsWith('.wasm')?'application/wasm':file.endsWith('.js')?'application/javascript':'application/octet-stream',headers:{'access-control-allow-origin':'*'}}):route.abort();
 });
 await page.goto('/');await expect(page.locator('#runtime-status')).toContainText('All games ready');
 await page.evaluate(()=>{unlockSingularity(false);});
 const cdp=await context.newCDPSession(page);
 const size=()=>page.locator('#game-canvas').evaluate(el=>({width:parseFloat(el.style.width),height:parseFloat(el.style.height)}));
 for(const mode of ['dodge','boss','pumpkin','wrath','singularity','core_practice']){
  await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1});
  await page.evaluate(mode=>selectGame(mode),mode);
  await page.locator('#difficulty-choices [data-difficulty]').first().click();
  await expect(page.locator('#game-canvas')).toBeVisible();
  await page.waitForTimeout(120);
  const before=await size();
  await page.evaluate(()=>{
   window.zoomScrollCalls=0;
   window.originalScrollIntoView ??= Element.prototype.scrollIntoView;
   Element.prototype.scrollIntoView=function(...args){window.zoomScrollCalls++;return window.originalScrollIntoView.apply(this,args);};
  });
  await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:2});
  await expect.poll(()=>page.evaluate(()=>visualViewport.scale)).toBe(2);
  // Also exercise layout-observer and normal resize paths while zoomed in.
  await page.evaluate(()=>{fitArcade();window.dispatchEvent(new Event('resize'));});
  await page.waitForTimeout(120);
  const after=await size();
  expect(Math.abs(after.width-before.width),mode).toBeLessThanOrEqual(1.3);
  expect(Math.abs(after.height-before.height),mode).toBeLessThanOrEqual(1.1);
  expect(await page.evaluate(()=>window.zoomScrollCalls),mode).toBe(0);
  await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1});
 }
 // Real layout changes still resize the canvas.
 await page.setViewportSize({width:900,height:450});
 await page.waitForTimeout(150);
 const landscape=await size();
 expect(landscape.width).toBeGreaterThan(0);expect(landscape.height).toBeGreaterThan(0);
 expect(landscape.height).toBeLessThan(450);
});
