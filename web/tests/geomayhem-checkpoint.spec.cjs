const {test,expect,openGame}=require('./fixtures/game.cjs');
test('campaign boss death returns to its intro with the entry build in the same run',async({page})=>{
 await page.route('**/app.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('handle = pyodide.globals.get("handle");','window.checkpointRuntime=pyodide; handle = pyodide.globals.get("handle");')});});
 await openGame(page);
 await page.evaluate(()=>{selectGame('geomayhem');startGame('level_1');checkpointRuntime.runPython('from bridge import session\ng=session.game\ng.loadout={"needle":4,"drone_a":3}\ng.cooldowns={k:0 for k in g.loadout}\ng.score=1234\ng.cleared=19\ng.wave=20\ng.break_left=0\ng._spawn()');});
 await expect(page.locator('#boss-cinema')).toBeVisible();
 const run=await page.evaluate(()=>geomayhemRun.id);
 for(let attempt=0;attempt<2;attempt++){
  await page.locator('#boss-cinema-skip').click();await expect(page.locator('#boss-cinema')).toBeHidden();
  await page.evaluate(()=>checkpointRuntime.runPython('g.enemies[0].hp=1\ng.score+=100\ng.invulnerable=g.forge_shield=0\ng._damage(10000)'));
  await expect(page.locator('#boss-cinema')).toBeVisible();
  expect(await page.evaluate(()=>({over:snapshot.over,wave:snapshot.wave,cleared:snapshot.cleared,hp:snapshot.lives,max:snapshot.max_lives,score:snapshot.score,run:geomayhemRun.id,reward:geomayhemResult,build:checkpointRuntime.runPython('str(g.loadout)'),bossFull:snapshot.boss.hp===snapshot.boss.max_hp}))).toEqual({over:false,wave:20,cleared:19,hp:100,max:100,score:1234,run,reward:null,build:"{'needle': 4, 'drone_a': 3}",bossFull:true});
 }
 await page.locator('#boss-cinema-skip').click();
 await page.evaluate(()=>checkpointRuntime.runPython('g.enemies[0].hp=0'));
 await expect(page.locator('#boss-cinema-label')).toContainText('Defeated');
 await page.locator('#boss-cinema-skip').click();
 expect(await page.evaluate(()=>snapshot.won)).toBe(true);
});
test('campaign death before the boss still ends the expedition',async({page})=>{
 await page.route('**/app.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('handle = pyodide.globals.get("handle");','window.checkpointRuntime=pyodide; handle = pyodide.globals.get("handle");')});});
 await openGame(page);await page.evaluate(()=>{selectGame('geomayhem');startGame('level_1');checkpointRuntime.runPython('from bridge import session\nsession.game.invulnerable=session.game.forge_shield=0\nsession.game._damage(10000)');});
 await page.waitForFunction(()=>snapshot.over);await expect(page.locator('#boss-cinema')).toBeHidden();
});
