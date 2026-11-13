const { leaveFullscreen, settleFullscreen } = require('./fixtures/game.cjs');
const { test, expect, openGame } = require('./fixtures/game.cjs');
test.use({ deterministicMusic: true });

test.beforeEach(async ({ page }) => {
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'handle = pyodide.globals.get("handle");',
      'window.geomayhemRuntime = pyodide; handle = pyodide.globals.get("handle");') });
  });
  await page.addInitScript(() => {
    const key = 'microgame-madness.geomayhem.v1:guest';
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ cleared: 20 }));
  });
  await openGame(page);
  await leaveFullscreen(page);
  await page.locator('[data-game="geomayhem"]').click();
});

async function model(page, code) {
  return page.evaluate(code => window.geomayhemRuntime.runPython(code), `from bridge import session\n${code}`);
}

test('WASD and arrows move together, R pauses, and other games retain D pause', async ({ page }) => {
  await page.locator('[data-difficulty="level_1"]').click();
  await model(page, 'session.game.break_left = 100');
  await expect(page.locator('#pause')).toHaveText('Pause · R');
  await expect(page.locator('#game-canvas')).toHaveAttribute('aria-label', /WASD.*R pauses/);
  for (const [key, axis, direction] of [['w', 'y', 1], ['a', 'x', -1], ['s', 'y', -1], ['d', 'x', 1], ['W', 'y', 1]]) {
    await model(page, 'session.game.x = session.game.y = 0');
    await settleFullscreen(page);
    await page.keyboard.down(key);
    await expect.poll(() => model(page, `session.game.${axis} * ${direction}`)).toBeGreaterThan(12);
    await page.keyboard.up(key);
    expect(await model(page, 'session.paused')).toBe(false);
  }
  await model(page, 'session.game.y = 0');
  await settleFullscreen(page);
  await page.keyboard.down('w');
  await settleFullscreen(page);
  await page.keyboard.down('ArrowUp');
  await expect.poll(() => model(page, 'session.game.y')).toBeGreaterThan(12);
  await page.keyboard.up('w');
  const afterW = await model(page, 'session.game.y');
  await expect.poll(() => model(page, 'session.game.y')).toBeGreaterThan(afterW + 12);
  await page.keyboard.up('ArrowUp');
  const stopped = await model(page, 'session.game.y');
  const elapsed = await model(page, 'session.game.elapsed');
  await expect.poll(() => model(page, 'session.game.elapsed')).toBeGreaterThan(elapsed + .15);
  expect(await model(page, 'session.game.y')).toBe(stopped);
  await settleFullscreen(page);
  await page.keyboard.down('r');
  await expect(page.locator('#pause')).toHaveText('Resume · R');
  const pausedAt = await model(page, 'session.game.elapsed');
  await settleFullscreen(page);
  await page.keyboard.down('r'); // A repeated keydown must not toggle again.
  await page.keyboard.up('r');
  await settleFullscreen(page);
  await page.keyboard.press('d');
  expect(await model(page, 'session.paused')).toBe(true);
  expect(await model(page, 'session.game.elapsed')).toBe(pausedAt);
  await settleFullscreen(page);
  await page.keyboard.press('r');
  await expect(page.locator('#overlay')).toBeHidden();
  await expect(page.locator('#pause')).toHaveText('Pause · R');
  await expect.poll(() => model(page, 'session.game.elapsed')).toBeGreaterThan(pausedAt);
  await leaveFullscreen(page);
  await page.locator('[data-game="dodge"]').click();
  await page.locator('[data-difficulty="easy"]').click();
  await settleFullscreen(page);
  await page.keyboard.press('r');
  await expect(page.locator('#overlay')).toBeHidden();
  await settleFullscreen(page);
  await page.keyboard.press('d');
  await expect(page.locator('#pause')).toHaveText('Resume · D');
});

test('Geomayhem armory, Cubie movement, manual mouse/touch fire and pause', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await expect(page.locator('#difficulty-choices button')).toHaveCount(20);
  await expect(page.locator('#geomayhem-weapon option')).toHaveCount(44);
  await page.locator('#geomayhem-weapon').selectOption('comet');
  await expect(page.locator('#geomayhem-evolution-three')).toContainText('Comet Flare');
  await expect(page.locator('#geomayhem-evolution-five')).toContainText('Comet Apocalypse');
  await page.screenshot({ path: testInfo.outputPath('geomayhem-armory.png'), fullPage: true });
  await page.locator('[data-difficulty="level_1"]').click();
  await expect(page.locator('#geomayhem-wave')).toHaveText('LEVEL 1/20 · WAVE 1/20');
  await model(page, 'session.game.break_left = 100');
  await settleFullscreen(page);
  await page.keyboard.down('ArrowLeft');
  await expect.poll(() => model(page, 'session.game.x')).toBeLessThan(-20);
  await page.keyboard.up('ArrowLeft');
  expect(await model(page, 'session.game.face == (-1, 0)')).toBe(true);
  expect(await model(page, 'session.game.shots_fired')).toBe(0);
  const canvas = page.locator('#game-canvas');
  if (testInfo.project.name === 'mobile') {
    await expect(page.locator('#touch-fire')).toBeVisible();
    await page.locator('#touch-fire').dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch' });
    await expect.poll(() => model(page, 'session.game.shots_fired')).toBeGreaterThan(0);
    await page.locator('#touch-fire').dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch' });
  } else {
    await canvas.click({ button: 'right' });
    expect(await model(page, 'session.game.shots_fired')).toBe(0);
    await canvas.click({ position: { x: 430, y: 180 } });
    await expect.poll(() => model(page, 'session.game.shots_fired')).toBe(1);
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * .8, box.y + box.height * .4);
    await page.mouse.down();
    await expect.poll(() => model(page, 'session.game.shots_fired')).toBeGreaterThan(1);
    await page.mouse.up();
  }
  expect(await model(page, 'session.game.face == (-1, 0)')).toBe(true);
  await page.locator('#pause').click();
  const before = await model(page, 'session.game.elapsed');
  await expect(page.locator('#overlay-title')).toHaveText('Take a breather.');
  await settleFullscreen(page);
  await page.keyboard.press('ArrowRight');
  expect(await model(page, 'session.game.elapsed')).toBe(before);
  await page.locator('#overlay-action').click();
  await model(page, 'session.game.break_left = 0\nfor _ in range(12): session.game._spawn()');
  await expect.poll(() => model(page, 'len(session.game.enemies)')).toBeGreaterThan(5);
  await page.screenshot({ path: testInfo.outputPath('geomayhem-playing.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('XP choices freeze combat and evolve weapon art and gimmicks at three and five stars', async ({ page }, testInfo) => {
  await page.locator('[data-difficulty="level_1"]').click();
  await model(page, 'session.game.break_left = 100');
  for (let stars = 2; stars <= 5; stars++) {
    await model(page, 'session.game.xp = session.game.xp_needed');
    await expect(page.locator('#geomayhem-upgrade')).toBeVisible();
    const before = await model(page, 'session.game.elapsed');
    await settleFullscreen(page);
    await page.keyboard.press('ArrowRight');
    expect(await model(page, 'session.game.elapsed')).toBe(before);
    await page.screenshot({ path: testInfo.outputPath(`geomayhem-upgrade-${stars}.png`) });
    await page.locator('[data-upgrade="weapon"]').click();
    await expect(page.locator('#geomayhem-upgrade')).toBeHidden();
    expect(await model(page, 'session.game.stars')).toBe(stars);
    if (stars === 3) await expect(page.locator('[data-weapon="needle"]')).toContainText('Prism Fork');
    if (stars === 5) await expect(page.locator('[data-weapon="needle"]')).toContainText('Prism Constellation');
  }
  await model(page, 'session.game.xp = session.game.xp_needed');
  await expect(page.locator('#geomayhem-upgrade')).toBeVisible();
  await expect(page.locator('[data-upgrade="weapon"]')).toHaveCount(0);
  await page.locator('#exit').click();
  await expect(page.locator('#geomayhem-upgrade')).toBeHidden();
  await page.locator('[data-difficulty="level_1"]').click();
  expect(await model(page, 'session.game.stars')).toBe(1);
});

test('level twenty ends at wave twenty and a defeated Cubie can restart', async ({ page }) => {
  await page.locator('[data-difficulty="level_20"]').click();
  await model(page, 'session.game.wave = 20\nsession.game.cleared = 19\nsession.game.spawned = session.game.quota\nsession.game.enemies.clear()');
  await expect(page.locator('#overlay-title')).toHaveText('Mayhem mastered!');
  await expect(page.locator('#overlay-copy')).toContainText('All 20 waves');
  await page.locator('#overlay-action').click();
  await page.locator('[data-difficulty="level_1"]').click();
  await model(page, 'session.game._damage(100)');
  await expect(page.locator('#overlay-title')).toHaveText('Cubie will be back.');
  await page.locator('#overlay-action').click();
  await page.locator('[data-difficulty="level_1"]').click();
  await expect(page.locator('#player-health-value')).toHaveText('100 / 100');
  await expect(page.locator('#geomayhem-wave')).toHaveText('LEVEL 1/20 · WAVE 1/20');
});

test('wave clears collect remaining XP, and the enlarged arena keeps mouse aim aligned', async ({ page }) => {
  await page.locator('[data-difficulty="level_1"]').click();
  await model(page, 'session.game.gems = [[200, 150, session.game.xp_needed]]\nsession.game.spawned = session.game.quota\nsession.game.enemies.clear()');
  await expect(page.locator('#geomayhem-wave')).toContainText('WAVE 2/20');
  expect(await model(page, 'session.game.rank')).toBe(2);
  expect(await model(page, 'len(session.game.gems)')).toBe(0);
  await model(page, 'session.game.break_left = 100');
  await expect(page.locator('#geomayhem-upgrade')).toBeVisible();
  await page.locator('[data-upgrade="weapon"]').click();
  await model(page, 'session.game.x, session.game.y = 300, 200');
  await expect.poll(() => page.evaluate(() => snapshot.player.x)).toBe(300);
  const camera = await page.evaluate(() => geomayhemCamera(snapshot));
  const box = await page.locator('#game-canvas').boundingBox();
  await page.mouse.move(box.x + (340 + 100 * camera.scale) * box.width / 680,
    box.y + (280 - 100 * camera.scale) * box.height / 560);
  await page.mouse.down();
  await expect.poll(() => model(page, 'session.game.shots_fired')).toBeGreaterThan(0);
  expect(await model(page, `abs(session.game.aim[0] - ${camera.x+100}) < 3 and abs(session.game.aim[1] - ${camera.y+100}) < 3`)).toBe(true);
  expect(28 * camera.scale * box.width / 680).toBeGreaterThanOrEqual(17.9);
  await page.mouse.up();
  expect(await model(page, 'session.game.right - session.game.left')).toBe(930);
});

test('enemy defeats drop XP but item weapons require a level-up choice', async ({ page }) => {
  await page.locator('[data-difficulty="level_1"]').click();
  await model(page, 'from geomayhem import Enemy\nsession.game.break_left = 100\nsession.game.enemies = [Enemy(i, 250, 200, 0, 0, 12, "chaser", 1) for i in range(24)]');
  await expect.poll(() => model(page, 'session.game.kills')).toBe(24);
  expect(await model(page, 'len(session.game.gems)')).toBe(24);
  await expect(page.locator('#geomayhem-build')).toHaveText('1/4 weapons');
  await model(page, 'session.game.x, session.game.y = 250, 200');
  await expect(page.locator('#geomayhem-upgrade')).toBeVisible();
  await expect(page.locator('#geomayhem-build')).toHaveText('1/4 weapons');
  const acquisition = page.locator('[data-upgrade^="acquire:"]').first();
  const item = (await acquisition.getAttribute('data-upgrade')).split(':')[1];
  await acquisition.click();
  await expect(page.locator(`[data-weapon="${item}"]`)).toBeVisible();
  await expect(page.locator('#geomayhem-build')).toHaveText('2/4 weapons');
});

test('new item companions appear in the armory and evolve independently through five stars', async ({ page }, testInfo) => {
  for (const id of ['ember_lantern', 'frost_orb', 'tesla_coil', 'blade_bot', 'gravity_cube',
    'prism_turret', 'spore_pod', 'repair_beetle', 'storm_totem', 'solar_shield']) {
    await page.locator('#geomayhem-weapon').selectOption(id);
    await expect(page.locator('#geomayhem-weapon-description')).toContainText('Auto companion');
  }
  await page.locator('#geomayhem-weapon').selectOption('needle');
  await page.locator('[data-difficulty="level_1"]').click();
  await model(page, 'session.game.break_left = 100\nsession.game.stars = 5\nsession.game._equip("prism_turret")');
  await expect(page.locator('[data-weapon="prism_turret"]')).toContainText('Prism Turret');
  for (let star = 2; star <= 5; star++) {
    await model(page, 'session.game.xp = session.game.xp_needed');
    await page.locator('[data-upgrade="upgrade:prism_turret"]').click();
    if (star === 3) {
      await expect(page.locator('[data-weapon="prism_turret"]')).toContainText('Prism Battery');
      await page.locator('#arena').screenshot({ path: testInfo.outputPath('prism-battery.png') });
    }
  }
  await expect(page.locator('[data-weapon="prism_turret"]')).toContainText('Rainbow Bastion');
  await page.locator('#arena').screenshot({ path: testInfo.outputPath('rainbow-bastion.png') });
  await model(page, 'from geomayhem import Enemy\nsession.game.enemies = [Enemy(500, 150, 0, 100000, 0, 12, "chaser", 100000)]');
  await expect.poll(() => model(page, 'session.game.shots_fired')).toBeGreaterThan(0);
  expect(await model(page, 'all(s.weapon == "prism_turret" for s in session.game.shots)')).toBe(true);
  await model(page, 'session.game.xp = session.game.xp_needed');
  await expect(page.locator('#geomayhem-upgrade')).toBeVisible();
  await expect(page.locator('[data-upgrade="upgrade:prism_turret"]')).toHaveCount(0);
});

test('level-ups equip four weapons with varied automatic companions and independent evolutions', async ({ page }, testInfo) => {
  await page.locator('[data-difficulty="level_1"]').click();
  await model(page, 'session.game.break_left = 100');
  const companions = [];
  for (let i = 0; i < 2; i++) {
    await model(page, 'session.game.xp = session.game.xp_needed');
    await expect(page.locator('#geomayhem-upgrade')).toBeVisible();
    const acquisition = page.locator('[data-upgrade^="acquire:"]').first();
    const id = (await acquisition.getAttribute('data-upgrade')).split(':')[1];
    companions.push(id);
    await acquisition.click();
    await expect(page.locator(`#geomayhem-inventory [data-weapon="${id}"]`)).toBeVisible();
  }
  await expect(page.locator('#geomayhem-build')).toHaveText('3/4 weapons');
  expect(await model(page, 'session.game.stars')).toBe(1);
  await model(page, 'from geomayhem import Enemy\nsession.game.enemies = [Enemy(500, 150, 0, 100000, 0, 12, "chaser", 100000)]');
  await expect.poll(() => model(page, 'session.game.shots_fired')).toBeGreaterThan(0);
  expect(await model(page, 'all(shot.weapon != "needle" for shot in session.game.shots)')).toBe(true);
  await model(page, 'session.game.xp = session.game.xp_needed');
  await expect(page.locator('#geomayhem-upgrade')).toBeVisible();
  await page.locator('[data-upgrade^="acquire:"]').first().click();
  await expect(page.locator('#geomayhem-build')).toHaveText('4/4 weapons');
  await model(page, 'session.game.xp = session.game.xp_needed');
  await expect(page.locator('#geomayhem-upgrade')).toBeVisible();
  await expect(page.locator('[data-upgrade^="acquire:"]')).toHaveCount(0);
  await page.locator('#geomayhem-upgrade-choices button').last().click();
  const item = companions[0];
  await model(page, `session.game.loadout = {key: (1 if key == "${item}" else 5) for key in session.game.loadout}`);
  for (let star = 2; star <= 5; star++) {
    await model(page, 'session.game.xp = session.game.xp_needed');
    await page.locator(`[data-upgrade="upgrade:${item}"]`).click();
    expect(await model(page, `session.game.loadout["${item}"]`)).toBe(star);
    expect(await model(page, `session.game.loadout["${companions[1]}"]`)).toBe(5);
    const form = await model(page, `from geomayhem_weapons import ARMORY\nARMORY["${item}"].info(${star})["form"]`);
    await expect(page.locator(`[data-weapon="${item}"]`)).toContainText(form);
  }
  await expect(page.locator('#geomayhem-build')).toHaveText('4/4 weapons');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#arena').screenshot({ path: testInfo.outputPath('four-weapon-drone-build.png') });
  await page.locator('#exit').click();
  await page.locator('[data-difficulty="level_1"]').click();
  await expect(page.locator('#geomayhem-build')).toHaveText('1/4 weapons');
});

test('the twenty themed arenas render distinct backgrounds, boss phases and queued upgrade counts', async ({ page }, testInfo) => {
  const signatures = new Set();
  for (let level = 1; level <= 20; level++) {
    await page.locator(`[data-difficulty="level_${level}"]`).click();
    await model(page, 'session.game.break_left = 100');
    await page.locator('#pause').click();
    signatures.add(await page.evaluate(() => document.querySelector('#game-canvas').toDataURL()));
    const png = await page.locator('#game-canvas').evaluate(canvas => canvas.toDataURL().split(',')[1]);
    require('node:fs').writeFileSync(testInfo.outputPath(`arena-${level}.png`), Buffer.from(png, 'base64'));
    await page.locator('#exit').click();
  }
  expect(signatures.size).toBe(20);
  await page.locator('[data-difficulty="level_20"]').click();
  await model(page, 'session.game.break_left = 100\nsession.game.wave = 20\nsession.game._spawn()\nsession.game.enemies[0].hp *= .2\nsession.game.enemies[0].skill_in = 0');
  await expect(page.locator('#geomayhem-boss-name')).toContainText('Infinity Regent · Phase 3');
  await page.locator('#boss-cinema-skip').click();
  await expect.poll(() => model(page, 'len(session.game.zones)')).toBeGreaterThan(0);
  await model(page, 'session.game.wave = 1\nsession.game.break_left = 100\nsession.game.enemies.clear()\nsession.game.zones.clear()\nsession.game.xp = 12 + 20 + 27');
  await expect(page.locator('#geomayhem-upgrade-status')).toContainText('3 upgrades remaining');
  await page.locator('[data-upgrade="weapon"]').click();
  await expect(page.locator('#geomayhem-upgrade-status')).toContainText('2 upgrades remaining');
  await page.locator('[data-upgrade="weapon"]').click();
  await expect(page.locator('#geomayhem-upgrade-status')).toContainText('1 upgrade remaining');
  await page.locator('[data-upgrade="weapon"]').click();
  await expect(page.locator('#geomayhem-upgrade')).toBeHidden();
});


test('compact rendering preserves all weapon evolutions and caches arena art', async ({ page }) => {
  await page.locator('[data-difficulty="level_14"]').click();
  await model(page, 'session.game.break_left = 100');
  await page.locator('#pause').click();
  const pairs = JSON.parse(await model(page, `
import json
from geomayhem import Geomayhem, Shot, Enemy
from geomayhem_weapons import ARMORY
from geomayhem_view import draw_geomayhem
pairs=[]
for wid in ARMORY:
    for stars in (1,3,5):
        g=Geomayhem(14,wid)
        g.stars=stars
        g.alive=False  # Browser Cubie art has its own dedicated rendering tests.
        g.shots=[Shot(80,65,0,0,1,wid,stars,set(),angle=.37)]
        pairs.append([draw_geomayhem(g,include_background=False),draw_geomayhem(g,compact=True,include_background=False)])
g=Geomayhem(14)
g.alive=False
# Authored boss art is covered in geomayhem-boss-theater; compare shared enemies here.
g.enemies=[Enemy(1,75,-65,40,0,24,'elite',100,burn=1)]
g._effect('line',-80,60,8,'#ff8899',(90,-30),5)
g._effect('ring',-60,-70,35,'#ff8899',stars=5)
pairs.append([draw_geomayhem(g,include_background=False),draw_geomayhem(g,compact=True,include_background=False)])
json.dumps(pairs)
`));
  const differences = await page.evaluate(pairs => {
    const paint = commands => {
      const canvas = document.createElement('canvas'); canvas.width=canvas.height=300;
      const context=canvas.getContext('2d'); context.translate(150,150);
      for (const command of commands) drawGeomayhemCommand(context,command);
      return context.getImageData(0,0,300,300).data;
    };
    return pairs.map(([full,compact])=>{
      const a=paint(full),b=paint(compact);let changed=0,painted=0;
      for(let i=0;i<a.length;i+=4){
        if(a[i+3] || b[i+3]) painted++;
        if(Math.max(...[0,1,2,3].map(c=>Math.abs(a[i+c]-b[i+c])))>24)changed++;
      }
      return changed/painted;
    });
  }, pairs);
  expect(Math.max(...differences)).toBeLessThan(.03);
  const cache = await page.evaluate(() => {
    const backdrop=geomayhemBackdrop;
    for(let i=0;i<10;i++) draw(snapshot);
    return {same:backdrop===geomayhemBackdrop,paths:geomayhemPaths.size};
  });
  expect(cache.same).toBe(true);
  expect(cache.paths).toBeLessThan(30);
  const pausedTicks = await page.evaluate(() => new Promise(resolve => {
    const original=send;let ticks=0,frames=0;
    send=(action,...args)=>{if(action==='tick')ticks++;return original(action,...args);};
    const check=()=>{if(++frames<6)requestAnimationFrame(check);else{send=original;resolve(ticks);}};
    requestAnimationFrame(check);
  }));
  expect(pausedTicks).toBe(0);
});
