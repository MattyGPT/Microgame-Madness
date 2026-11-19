const {test,expect}=require('@playwright/test');
const C=require('../customs.js'),Crowns=require('../crown-packs.js');
test('new reward effects animate and honor both reduced-motion settings',async({page})=>{
  await page.setContent('<div id="art"></div>');
  await page.addStyleTag({path:'web/style.css'});
  await page.locator('#art').evaluate((el,svg)=>el.innerHTML=svg,C.catalog.filter(i=>i.rewardMode).map(i=>C.svg(i)).join('')+Crowns.games.slice(-5).map(g=>Crowns.art({crown:g.mode,id:`crown_${g.mode}_cubie`})).join(''));
  const running=()=>page.evaluate(()=>[...document.querySelectorAll('[class^="reward-"]')].flatMap(el=>el.getAnimations()).filter(a=>a.playState==='running').length);
  expect(await running()).toBeGreaterThan(40);
  await page.emulateMedia({reducedMotion:'reduce'});expect(await running()).toBe(0);
  await page.emulateMedia({reducedMotion:'no-preference'});expect(await running()).toBeGreaterThan(40);
  await page.evaluate(()=>document.documentElement.classList.add('account-reduced-motion'));expect(await running()).toBe(0);
  // Confirm the portable arena renderer can rasterize every redesigned tier.
  const images=C.catalog.filter(i=>i.rewardMode).map(i=>C.gameSvg(i));
  expect(await page.evaluate(async svgs=>Promise.all(svgs.map(svg=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image.naturalWidth>0);image.onerror=()=>resolve(false);image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}))),images)).toEqual(images.map(()=>true));
});
