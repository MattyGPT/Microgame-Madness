const {test,expect,openGame}=require('./fixtures/game.cjs');
test.use({deterministicMusic:true});
test('Chaos guide, health, pause, effects, death and separate score work',async({page},testInfo)=>{
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/app.js*',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace('const pyodide = await loadPyodide(', 'const pyodide = window.chaosRuntime = await loadPyodide(')});
  });
  await openGame(page);
  await page.locator('[data-game="guide"]').click();
  await expect(page.locator('.block-guide-card')).toHaveCount(75);
  await expect(page.locator('#block-guide-room')).toBeVisible();
  await expect(page.locator('.block-guide-icon')).toHaveCount(75);
  expect(await page.locator('.block-guide-icon').evaluateAll(images=>images.every(img=>img.complete && img.naturalWidth>0))).toBe(true);
  await expect(page.locator('.block-guide-card[data-block="doom"]')).toContainText('Very rare');
  await expect(page.locator('#game-total')).toContainText('+ GUIDE');
  await page.locator('#block-guide-heading').scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('guide.png')});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('[data-game="dodge"]').click();
  await expect(page.locator('#block-guide-room')).toBeHidden();
  await page.locator('[data-difficulty="chaos"]').click();
  await expect(page.locator('#player-health-value')).toHaveText('8 / 8');
  expect(await page.evaluate(()=>musicPlayer.track)).toBe('chaos_carnival');
  expect(await page.evaluate(()=>musicPlayer.current.source.loop)).toBe(true);
  expect(await page.evaluate(()=>snapshot.bounds)).toEqual([-300,300,-240,240]);
  await page.locator('#pause').click();
  const timer=await page.evaluate(()=>snapshot.regen_in);
  await page.evaluate(()=>{snapshot=send('tick',{dt:.05});render();});
  expect(await page.evaluate(()=>snapshot.regen_in)).toBe(timer);
  await page.locator('#overlay-action').click();
  await page.evaluate(()=>{
    active=false;
    chaosRuntime.runPython(`from bridge import session\nfrom dodge_model import Block\nsession.game.blocks = []\nsession.game.spawn_in = 999\nsession.game.lives = 6\nsession.game.regen_in = .02`);
    snapshot=send('tick',{dt:.03});render();
  });
  await expect(page.locator('#player-health-value')).toHaveText('7 / 8');
  await page.evaluate(()=>{
    chaosRuntime.runPython(`from chaos_dodge import CATALOG\nfor i, kind in enumerate(CATALOG):\n    session.game.spawn_chaos(kind)\n    b = session.game.blocks[-1]\n    b.x = -230 + (i % 5)*110\n    b.y = 150 - (i // 5)*90\n    b.cells = ((0,0),)\n    b.cell_size = 28\nsession.game.x = 0\nsession.game.y = -200`);
    snapshot=send('tick',{dt:0});render();
  });
  await page.screenshot({path:testInfo.outputPath('chaos-arena.png')});
  await page.evaluate(()=>{
    chaosRuntime.runPython('session.game.blocks = [Block(session.game.x, session.game.y, ((0,0),), "#ff3866", kind="doom")]');
    snapshot=send('tick',{dt:.01});render();
    for(let i=0;i<50;i++) snapshot=send('tick',{dt:.05});
    render();
  });
  expect(await page.evaluate(()=>snapshot.death_cause)).toBe('doom');
  expect(await page.evaluate(()=>snapshot.lives)).toBe(0);
  expect(await page.evaluate(()=>saved.scores['dodge:chaos']?.length)).toBeGreaterThan(0);
  await page.locator('[data-game="jukebox"]').click();
  await page.locator('[data-difficulty="chaos_carnival"]').click();
  expect(await page.evaluate(()=>musicPlayer.track)).toBe('chaos_carnival');
  expect(await page.evaluate(()=>musicPlayer.current.source.loop)).toBe(true);
  expect(errors).toEqual([]);
});

test('weighted guide preview changes on half-second ticks and Chaos Cubies equip and persist', async ({page}, testInfo) => {
  const errors=[];page.on('pageerror', e=>errors.push(e.message));
  await openGame(page);
  const preview=page.locator('[data-game="guide"] .guide-tab-preview');
  await expect(preview).toBeVisible();
  const timings=await page.evaluate(()=>{
    const before=chaosGuideLastChange;
    animateChaosGuide(before+499);const early=chaosGuideLastChange;
    animateChaosGuide(before+500);return {before,early,after:chaosGuideLastChange};
  });
  expect(timings.early).toBe(timings.before);expect(timings.after).toBe(timings.before+500);
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.evaluate(()=>{const before=chaosGuideLastChange;animateChaosGuide(before+2000);return chaosGuideLastChange===before;})).toBe(true);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('[data-game="dodge"]').click();
  await page.locator('[data-difficulty="chaos"]').click();
  expect(await page.evaluate(()=>!!saved.achievements.unlocked.chaos_start)).toBe(true);
  await page.evaluate(async()=>{
    active=false;
    const state={...snapshot,elapsed:60,fight_elapsed:60,damage_taken:0,near_misses:10,lives:8,over:false};
    updateAchievements(achievementTracker.observe(state));
    accountApp.observe(state,true);await accountApp.chain;
  });
  await page.locator('[data-game="customs"]').click();
  await page.locator('#customs-search').fill('Pristine Prism');
  const custom=page.locator('.custom-tile[data-custom="chaos_pristine"]');
  await expect(custom.locator('.custom-equip')).toBeEnabled();
  await custom.locator('.custom-equip').click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','chaos_pristine');
  await page.locator('#customs-search').fill('Chaos');
  await page.locator('#customs-room').screenshot({path:testInfo.outputPath('chaos-cubies.png')});
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready',{timeout:30000});
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','chaos_pristine');
  expect(errors).toEqual([]);
});

test('Chaos follows Impossible and status effects tint, animate, pause and clear correctly', async ({page},testInfo)=>{
  await page.route('**/app.js*',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace('const pyodide = await loadPyodide(', 'const pyodide = window.effectRuntime = await loadPyodide(')});
  });
  await openGame(page);
  await page.locator('[data-game="dodge"]').click();
  expect(await page.locator('#difficulty-choices [data-difficulty]').evaluateAll(buttons=>buttons.map(b=>b.dataset.difficulty))).toEqual(['easy','normal','hard','merciless','impossible','chaos']);
  await page.locator('[data-difficulty="chaos"]').click();
  await page.evaluate(()=>{
    active=false;
    effectRuntime.runPython('from bridge import session\nsession.game.spawn_in = 999\nsession.game.blocks = []\nsession.game.haste_left = 4');
    snapshot=send('tick',{dt:0});render();
  });
  await expect(page.locator('#chaos-electric')).toBeVisible();
  await expect(page.locator('#arena')).toHaveCSS('animation-name','chaos-jiggle');
  await page.screenshot({path:testInfo.outputPath('haste-effect.png')});
  await page.evaluate(()=>{snapshot=send('pause');render();});
  await expect(page.locator('#chaos-electric')).toBeHidden();
  await page.evaluate(()=>{
    snapshot=send('pause');
    effectRuntime.runPython('session.game.haste_left = 0\nsession.game.frost_left = 2.5');
    snapshot=send('tick',{dt:0});render();
  });
  await expect(page.locator('#chaos-electric')).toBeHidden();
  await expect(page.locator('#chaos-frost')).toBeVisible();
  await expect(page.locator('#arena')).toHaveCSS('animation-name','chaos-shiver');
  await page.screenshot({path:testInfo.outputPath('frost-effect.png')});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>render());
  await expect(page.locator('#arena')).toHaveCSS('animation-name','none');
  await expect(page.locator('#chaos-frost span').first()).toHaveCSS('animation-name','none');
  await page.locator('[data-game="guide"]').click();
  await expect(page.locator('#chaos-frost')).toBeHidden();
  await expect(page.locator('#chaos-electric')).toBeHidden();
});

test('guide preview appears and cycles before the game engine has loaded', async ({page})=>{
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/pyodide.js',async route=>{await gate;await route.fallback();});
  try {
    await page.goto('/',{waitUntil:'commit'});
    const preview=page.locator('[data-game="guide"] .guide-tab-preview');
    await expect(preview).toBeVisible();
    await expect.poll(()=>preview.evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
    await expect(page.locator('#runtime-status')).not.toContainText('All games ready');
    await preview.evaluate(img=>{
      window.guideStartupChanges=0;
      window.guideStartupObserver=new MutationObserver(()=>window.guideStartupChanges++);
      window.guideStartupObserver.observe(img,{attributes:true,attributeFilter:['src']});
    });
    await expect.poll(()=>page.evaluate(()=>window.guideStartupChanges),{timeout:2000}).toBeGreaterThan(0);
    await page.evaluate(()=>window.guideStartupObserver.disconnect());
  } finally {release();}
  await expect(page.locator('#runtime-status')).toContainText('All games ready',{timeout:30000});
  await expect(page.locator('[data-game="guide"] .guide-tab-preview')).toBeVisible();
});

test('Elite Glitch telegraphs a fixed destination that the player can dodge', async ({page},testInfo)=>{
  await page.route('**/app.js*',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace('const pyodide = await loadPyodide(', 'const pyodide = window.glitchRuntime = await loadPyodide(')});
  });
  await openGame(page);
  await page.locator('[data-game="dodge"]').click();
  await page.locator('[data-difficulty="chaos"]').click();
  await page.evaluate(()=>{
    active=false;
    glitchRuntime.runPython('from bridge import session\nfrom dodge_model import Block\ng = session.game\ng.blocks = [Block(100, 100, ((0,0),), "#ff5479", kind="elite_glitch", speed_multiplier=0)]\ng.spawn_in = 999\ng.update(1.1, set())');
    snapshot=send('tick',{dt:0});render();
  });
  const target=await page.evaluate(()=>snapshot.commands.find(c=>c.role==='teleport_target').coords);
  expect(await page.evaluate(()=>snapshot.commands.some(c=>c.role==='teleport_warning'&&c.text==='!!!'))).toBe(true);
  await page.screenshot({path:testInfo.outputPath('elite-glitch-warning.png')});
  await page.evaluate(()=>{
    glitchRuntime.runPython('g.x = -150\ng.y = 0\ng.update(.3, set())');
    snapshot=send('tick',{dt:0});render();
  });
  expect(await page.evaluate(()=>snapshot.commands.find(c=>c.role==='teleport_target').coords)).toEqual(target);
  await page.evaluate(()=>{
    glitchRuntime.runPython('g.update(g.blocks[0].warning_left + .00001, set())');
    snapshot=send('tick',{dt:0});render();
  });
  expect(await page.evaluate(()=>snapshot.lives)).toBe(8);
  const location=await page.evaluate(()=>JSON.parse(glitchRuntime.runPython('import json\njson.dumps([g.blocks[0].x, g.blocks[0].y, g.blocks[0].teleports])')));
  expect(location[0]).toBeCloseTo((target[0]+target[2])/2);
  expect(location[1]).toBeCloseTo(-(target[1]+target[3])/2);
  expect(location[2]).toBe(1);
  await page.locator('[data-game="guide"]').click();
  await expect(page.locator('[data-block="elite_glitch"]')).toContainText('start of each warning');
});

test('pixel status badges reflect active effects, pause, shield loss and expiry', async ({page},testInfo)=>{
  await page.route('**/app.js*',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace('const pyodide = await loadPyodide(', 'const pyodide = window.badgeRuntime = await loadPyodide(')});
  });
  await openGame(page);
  await page.locator('[data-game="dodge"]').click();
  await page.locator('[data-difficulty="chaos"]').click();
  await page.evaluate(()=>{
    active=false;
    badgeRuntime.runPython('from bridge import session\ng=session.game\ng.blocks=[]\ng.spawn_in=999\ng.shield=True\ng.haste_left=4\ng.frost_left=2.5\ng.burn_ticks=2\ng.burn_in=2\ng.poison_ticks=3\ng.poison_in=3\ng.invulnerable=1\ng.curse_left=4\ng.slowfall_left=4\ng.stasis_left=1.5\ng.repellent_left=4');
    snapshot=send('tick',{dt:0});render();
  });
  const root=page.locator('#chaos-status-badges');
  await expect(root.locator('li')).toHaveCount(10);
  await expect(root.locator('[data-effect="shield"]')).toContainText('Shielded');
  await expect(root.locator('[data-effect="haste_left"]')).toContainText('4s');
  const box=await root.boundingBox();
  const arenaBox=await page.locator('#arena').boundingBox();
  expect(box.x).toBeGreaterThan(arenaBox.x);
  expect(arenaBox.x+arenaBox.width-box.x-box.width).toBeLessThan(20);
  expect(box.y-arenaBox.y).toBeGreaterThan(35);
  expect(box.y-arenaBox.y).toBeLessThan(65);
  expect(box.y+box.height).toBeLessThan(arenaBox.y+arenaBox.height);
  await expect(page.locator('#arena #chaos-status-badges')).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/chaos-status-active/);
  await expect(page.locator('#achievement-toast')).toHaveCSS('bottom','12px');
  await page.screenshot({path:testInfo.outputPath('pixel-status-badges.png')});
  await page.evaluate(()=>{snapshot=send('pause');render();});
  await expect(root.locator('li')).toHaveCount(10);
  await page.evaluate(()=>{
    snapshot=send('pause');
    badgeRuntime.runPython('g.shield=False\ng.haste_left=0');
    snapshot=send('tick',{dt:0});render();
  });
  await expect(root.locator('[data-effect="shield"]')).toHaveCount(0);
  await expect(root.locator('[data-effect="haste_left"]')).toHaveCount(0);
  await page.evaluate(()=>{
    badgeRuntime.runPython('g.burn_ticks=g.poison_ticks=0\ng.update(4.1, set())');
    snapshot=send('tick',{dt:0});render();
  });
  await expect(root).toBeHidden();
  await page.evaluate(()=>{
    badgeRuntime.runPython('g.shield=True');snapshot=send('tick',{dt:0});render();
  });
  await expect(root).toBeVisible();
  await page.locator('[data-game="guide"]').click();
  await expect(root).toBeHidden();
});

test('fire pattern blocks visibly warn, beep, pause and fire all three patterns', async ({page},testInfo)=>{
  await page.route('**/app.js*',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace('const pyodide = await loadPyodide(', 'const pyodide = window.fireRuntime = await loadPyodide(')});
  });
  await openGame(page);
  await page.locator('[data-game="dodge"]').click();
  await page.locator('[data-difficulty="chaos"]').click();
  for (const [kind,count] of [['fire_x',4],['fire_plus',4],['fire_star',8]]) {
    const state=await page.evaluate(kind=>{
      active=false;
      fireRuntime.runPython(`from bridge import session\ng=session.game\ng.blocks=[]\ng.spawn_in=999\ng.x,g.y=90,45\ng.spawn_chaos('${kind}')\ng.blocks[0].y=0\ng.update(.01,set())`);
      snapshot=send('tick',{dt:0});render();
      snapshot.sounds.forEach(playSound);
      return snapshot;
    },kind);
    expect(state.sounds).toContain('chaos_fire_warning');
    expect(state.commands.filter(c=>c.role==='fire_warning')).toHaveLength(count);
    await page.screenshot({path:testInfo.outputPath(kind+'-warning.png')});
    const warning=await page.evaluate(()=>{
      snapshot=send('pause');render();
      const before=fireRuntime.runPython('g.blocks[0].flame_left');
      send('tick',{dt:.05});
      const after=fireRuntime.runPython('g.blocks[0].flame_left');
      snapshot=send('pause');render();
      return [before,after];
    });
    expect(warning[0]).toBe(warning[1]);
    const fired=await page.evaluate(()=>{
      fireRuntime.runPython('g.update(1.51,set())');
      snapshot=send('tick',{dt:0});render();snapshot.sounds.forEach(playSound);return snapshot;
    });
    expect(fired.sounds).toContain('chaos_fire_burst');
    expect(fired.commands.filter(c=>c.role==='fire_beam')).toHaveLength(count);
    await page.screenshot({path:testInfo.outputPath(kind+'-firing.png')});
  }
});
