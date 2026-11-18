const {test,expect}=require('@playwright/test');
test('revised attacks and complete destruction render without errors',async({page},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.route('**/tearesseract.js*',async route=>{
    const response=await route.fetch();const source=await response.text();
    await route.fulfill({response,body:source.replace(/\}\)\(\);\s*$/,`window.reviewEncounter=(n,seconds,ending=false)=>{
      round=n;hp=12;inv=0;paused=false;enter(ending?'ending':'attack');document.querySelector('#practice-safe').checked=true;
      for(let i=0;i<Math.round(seconds*120);i++)update(1/120);draw();
      return {phase,holes:blackHoles.length,fragments:debris.length,mist:prismMist.length,chaos:chaosSlashes.length,shocks:bullets.filter(b=>!b.chaosShard).length,shards:bullets.filter(b=>b.chaosShard).length,shieldOff:chaosPhase(),shield:shieldProfile(),horizontal:lasers.some(l=>l.axis==='horizontal')};
    };})();`)});
  });
  await page.goto('/tearesseract.html');
  for(const [round,seconds] of [[3,4.5],[5,4.2],[6,1.2],[8,2.5],[11,2],[12,.7],[13,.7],[16,.7],[18,5.4],[18,8.95],[18,15.7],[29,25],[29,47],[29,57.2]]){
    const state=await page.evaluate(([n,t])=>window.reviewEncounter(n,t),[round,seconds]);
    expect(state.phase).toBe('attack');
    if(round===5)expect(state.holes).toBeGreaterThan(0);
    if(round===18){expect(state.chaos).toBeGreaterThanOrEqual(2);expect(state.shards).toBeGreaterThan(0);expect(state.shocks).toBe(0);expect(state.shieldOff).toBe(true);}
    if(round===6)expect(state.mist).toBeGreaterThan(0);
    if(round===11)expect(state.horizontal).toBe(true);
    if(round===12)expect(state.shield.dual).toBe(true);
    await page.locator('#fight').screenshot({path:info.outputPath(`attack-${round+1}-${seconds}.png`)});
  }
  const state=await page.evaluate(()=>window.reviewEncounter(29,3.2,true));
  expect(state.fragments).toBe(190);expect(state.phase).toBe('ending');
  await page.locator('#fight').screenshot({path:info.outputPath('total-destruction.png')});
  expect(await page.evaluate(()=>window.reviewEncounter(29,12.2,true).phase)).toBe('win');
  expect(errors).toEqual([]);
});
