const { leaveFullscreen } = require('./fixtures/game.cjs');
const {test,expect,openGame}=require('./fixtures/game.cjs');
test.beforeEach(async({page})=>{
  await page.route('**/app.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('handle = pyodide.globals.get("handle");','window.rewardRuntime = pyodide; handle = pyodide.globals.get("handle");')});});
  await page.addInitScript(()=>{const key='microgame-madness.geomayhem.v1:guest';if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({cleared:9}));});
  await openGame(page);
  await leaveFullscreen(page);
  await page.locator('[data-game="geomayhem"]').click();
});
async function model(page,code){return page.evaluate(code=>rewardRuntime.runPython('from bridge import session\n'+code),code);}
test('live progress grants Cubies and arena rewards survive profile reloads',async({page})=>{
  await page.locator('[data-difficulty="level_1"]').click();
  await expect.poll(()=>page.evaluate(()=>!!achievementTracker.data.unlocked.geo_start)).toBe(true);
  await model(page,'from geomayhem import ARMORY, RELICS\nsession.game.break_left = 1000\nsession.game.kills = 150\nsession.game.cleared = 5\nsession.game.rank = 10\nsession.game.loadout = {key:5 for key in list(ARMORY)[:4]}\nsession.game.cooldowns = {key:0 for key in session.game.loadout}\nsession.game.relics = set(list(RELICS)[:3])');
  await expect.poll(()=>page.evaluate(()=>!!achievementTracker.data.unlocked.geo_evolved_4)).toBe(true);
  for(const id of ['geo_kills_100','geo_waves_5','geo_stars_3','geo_stars_5','geo_relics_3','geo_loadout_4'])
    expect(await page.evaluate(id=>!!achievementTracker.data.unlocked[id],id)).toBe(true);
  await model(page,'session.game.cleared = 20\nsession.game.won = True');
  await expect.poll(()=>page.evaluate(()=>!!achievementTracker.data.unlocked.geo_win_1)).toBe(true);
  await page.evaluate(()=>accountApp.settle());
  const totals=await page.evaluate(()=>({kills:saved.achievements.stats.geoKills,waves:saved.achievements.stats.geoWaves,wins:saved.achievements.stats.geoWins,cash:saved.shop.units}));
  expect(totals).toEqual({kills:150,waves:20,wins:1,cash:0});
  await leaveFullscreen(page);
  await page.locator('[data-game="customs"]').click();
  await page.getByRole('button',{name:'Wear Arena Victor Cubie',exact:true}).click();
  await page.evaluate(()=>accountApp.settle());
  await page.reload();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','geo_victor');
  expect(await page.evaluate(()=>saved.achievements.stats.geoWins)).toBe(1);
});
test('a flawless final arena grants both Empyrorite Cubies',async({page})=>{
  await page.locator('[data-difficulty="level_10"]').click();
  await model(page,'session.game.cleared = 20\nsession.game.damage_taken = 0\nsession.game.won = True');
  await expect.poll(()=>page.evaluate(()=>!!achievementTracker.data.unlocked.geo_flawless_10)).toBe(true);
  await page.evaluate(()=>accountApp.settle());
  await leaveFullscreen(page);
  await page.locator('[data-game="customs"]').click();
  await expect(page.getByRole('button',{name:'Wear Mayhem Sovereign Cubie',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Wear Zero Point Seraph Cubie',exact:true}).click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','geo_seraph');
});
