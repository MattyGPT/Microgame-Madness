const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
test.beforeEach(async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/pyodide/v0.29.3/full/**', route => {
    const file=path.basename(new URL(route.request().url()).pathname), local=path.resolve('node_modules/pyodide',file);
    return fs.existsSync(local) ? route.fulfill({path:local,contentType:file.endsWith('.wasm')?'application/wasm':file.endsWith('.js')?'application/javascript':'application/octet-stream',headers:{'access-control-allow-origin':'*'}}) : route.abort();
  });
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
});

test('48 shop trails are sorted, purchased once, equipped separately, and retained after reload',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.locator('[data-game="shop"]').click();
  await page.evaluate(()=>{saved.shop.units=1000000;renderShop();});
  await page.locator('#shop-trails-tab').click();
  await expect(page.locator('#shop-grid')).toBeHidden();
  await expect(page.locator('#trail-grid article')).toHaveCount(48);
  const prices=await page.locator('#trail-grid article').evaluateAll(cards=>cards.map(card=>TurtleTrails.catalog.find(t=>t.id===card.dataset.trail).price));
  expect(prices).toEqual([...prices].sort((a,b)=>a-b));
  const first=page.locator('[data-trail="trail_mint_mist"]');
  await first.getByRole('button').click();
  await expect(page.locator('#shop-balance')).toHaveText('950 Cubie Cash');
  await first.getByRole('button').click();
  await expect(first.getByRole('button')).toHaveText('Equipped ✓');
  expect(await page.evaluate(()=>saved.cubieCustom)).toBe('classic');
  await expect(page.locator('#shop-balance')).toHaveText('950 Cubie Cash');
  await page.screenshot({path:testInfo.outputPath('turtle-trail-shop.png')});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready');
  expect(await page.evaluate(()=>({id:saved.turtleTrail,owned:saved.shop.owned.includes('trail_mint_mist'),cash:CubieShop.balance(saved.shop)})))
    .toEqual({id:'trail_mint_mist',owned:true,cash:950});
  await page.locator('[data-game="shop"]').click();await page.locator('#shop-trails-tab').click();
  const second=page.locator('[data-trail="trail_blue_bubbles"]');
  await second.getByRole('button').click();await second.getByRole('button').click();
  await expect(page.locator('#trail-equipped')).toHaveText('Equipped: Blue Bubbles');
  await expect(page.locator('#shop-balance')).toHaveText('885 Cubie Cash');
  await page.locator('#trail-remove').click();
  expect(await page.evaluate(()=>saved.turtleTrail)).toBeNull();
  expect(await page.evaluate(()=>saved.shop.owned.filter(id=>id.startsWith('trail_')).length)).toBe(2);
  await page.locator('#shop-customs-tab').click();await expect(page.locator('#shop-grid')).toBeVisible();
  expect(errors).toEqual([]);
});

test('trails follow real turtle movement, fade on stopping, freeze on pause, and stay absent in Core',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluate(()=>{saved.turtleTrail='trail_starlight_steps';saved.shop.owned.push(saved.turtleTrail);});
  for(const [mode,difficulty] of [['dodge','easy'],['boss','mean'],['pumpkin','baby'],['wrath','bone_gauntlet']]) {
    await page.evaluate(([mode,difficulty])=>{selectGame(mode);startGame(difficulty);},[mode,difficulty]);
    await page.keyboard.down('ArrowRight');
    await expect.poll(()=>page.evaluate(()=>turtleTrailField.particles.length)).toBeGreaterThan(4);
    await page.keyboard.up('ArrowRight');
    if(mode==='dodge') {
      await page.evaluate(()=>pause());
      const before=await page.evaluate(()=>JSON.stringify(turtleTrailField.particles));
      await page.waitForTimeout(180);
      expect(await page.evaluate(()=>JSON.stringify(turtleTrailField.particles))).toBe(before);
      await page.evaluate(()=>pause());
      await page.locator('#game-canvas').screenshot({path:testInfo.outputPath('turtle-trail-in-game.png')});
    }
    await expect.poll(()=>page.evaluate(()=>turtleTrailField.particles.length)).toBe(0);
  }
  for(const [mode,difficulty] of [['singularity','gravitron'],['core_practice','photon_rain']]) {
    await page.evaluate(([mode,difficulty])=>{unlockSingularity(false);selectGame(mode);startGame(difficulty);},[mode,difficulty]);
    await page.keyboard.down('ArrowRight');await page.waitForTimeout(180);await page.keyboard.up('ArrowRight');
    expect(await page.evaluate(()=>turtleTrailField.particles.length)).toBe(0);
    expect(await page.evaluate(()=>saved.turtleTrail)).toBe('trail_starlight_steps');
  }
  expect(errors).toEqual([]);
});

test('reduced motion suppresses gameplay particles and animating shop previews',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>{saved.turtleTrail='trail_mint_mist';saved.shop.owned.push(saved.turtleTrail);selectGame('dodge');startGame('easy');});
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(200);await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(()=>turtleTrailField.particles.length)).toBe(0);
  await page.locator('[data-game="shop"]').click();await page.locator('#shop-trails-tab').click();
  expect(await page.locator('.trail-preview-mark').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});
