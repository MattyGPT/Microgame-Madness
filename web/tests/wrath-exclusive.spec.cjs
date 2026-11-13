const {test,expect,openGame}=require('./fixtures/game.cjs');
test.use({deterministicMusic:true});
test('eight exclusive attacks offer distinct Easy, Normal and Hard fights',async({page},testInfo)=>{
 test.setTimeout(300000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app.js*',async route=>{
  const response=await route.fetch();
  await route.fulfill({response,body:(await response.text()).replace('const pyodide = await loadPyodide(', 'const pyodide = window.wrathRuntime = await loadPyodide(')});
 });
 await openGame(page);
 await page.locator('[data-game="wrath"]').click();
 await expect(page.locator('#difficulty-choices [data-wrath-exclusive]')).toHaveCount(8);
 await expect(page.locator('#difficulty-choices [data-difficulty]')).toHaveCount(16);
 const attacks=await page.evaluate(()=>Object.keys(wrathExclusive));
 for(const attack of attacks){
  const images=new Set();
  for(const level of ['easy','normal','hard']){
   await page.evaluate(()=>selectGame('wrath'));
   await page.locator(`[data-difficulty="${attack}"]`).click();
   await expect(page.locator('[data-wrath-level]')).toHaveCount(3);
   await expect(page.locator('[data-wrath-level] svg')).toHaveCount(3);
   const difficulty=level==='normal'?attack:`${attack}__${level}`;
   await page.locator(`[data-difficulty="${difficulty}"]`).click();
   await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed','true');
   await expect.poll(()=>page.evaluate(()=>fullscreenBusy)).toBe(false);
   const state=await page.evaluate(()=>{
    active=false;
    snapshot=send("start",{mode:"wrath",difficulty:selectedDifficulty});
    wrathRuntime.runPython('from bridge import session\nsession.game.invulnerable = 10000\nsession.game.update(4.3, set())');
    snapshot=send('tick',{dt:0});render();
    return {label:snapshot.label,lives:snapshot.max_lives,counts:snapshot.attack_survivals.length,commands:JSON.stringify(snapshot.commands)};
   });
   expect(state.counts).toBe(15);expect(state.lives).toBe(15);
   expect(state.label).toContain(attack.replaceAll('_',' ').toUpperCase());
   expect(state.commands).not.toContain('NaN');images.add(state.commands);
   if(level==='normal')await page.locator('#game-canvas').screenshot({path:testInfo.outputPath(`${attack}.png`)});
   if(attack==='starfall_verdict' && level!=='normal')await page.locator('#game-canvas').screenshot({path:testInfo.outputPath(`${attack}-${level}.png`)});
   await page.locator('#exit').click();
   await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed','false');
  }
  expect(images.size).toBe(3);
 }
 await page.evaluate(()=>selectGame('pumpkin'));
 expect(await page.locator('#difficulty-choices').innerText()).not.toMatch(/Starfall|Pendulum|Chess|Lances|Briar|Eclipse|Bells|Loom/);
 expect(errors).toEqual([]);
});
