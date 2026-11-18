const {test,expect}=require('@playwright/test');
test('galactic hammers, rainbow terminal X and orbiting shock art render without errors',async({page},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
  await page.route('**/tearesseract.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/\}\)\(\);\s*$/,`window.artReview={paint(n,time){round=n;hp=12;inv=0;enter('attack');t=time;update(.001);draw();},orbit(){round=23;enter('attack');bullets=[{x:660,y:515,vx:-423,vy:0,yellow:true,turned:false,trail:[]}];spawn=99;update(.1);draw();}};})();`)});});
  await page.goto('/tearesseract.html');
  await page.evaluate(()=>artReview.paint(29,46.2));await page.locator('#fight').screenshot({path:info.outputPath('galactic-hammers.png')});
  await page.evaluate(()=>artReview.paint(29,57.6));await page.locator('#fight').screenshot({path:info.outputPath('rainbow-terminal-x.png')});
  await page.evaluate(()=>artReview.orbit());await page.locator('#fight').screenshot({path:info.outputPath('yellow-orbit.png')});
  expect(errors).toEqual([]);
});
