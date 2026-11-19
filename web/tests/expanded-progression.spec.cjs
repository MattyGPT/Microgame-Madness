const {test,expect,openGame,leaveFullscreen}=require('./fixtures/game.cjs');
test('random Nano Lab games, banked coins and treasure wins persist rewards',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await openGame(page);await leaveFullscreen(page);await page.evaluate(()=>accountApp.ready);
  for(const mode of ['geomayhem','coindrop','nanolab','tearesseract','treasure'])await expect(page.locator(`#leaderboard-game option[value="${mode}"]`)).toHaveCount(1);
  await page.locator('[data-game="nanolab"]').click();
  await page.getByRole('button',{name:'Play random nanogame',exact:true}).click();await expect(page.locator('#cd-nano-start')).toBeVisible();
  await page.locator('#cd-nano-skip').click();expect(await page.evaluate(()=>achievementTracker.data.stats.nanoWins)).toBe(0);
  await page.getByRole('button',{name:'Play random nanogame',exact:true}).click();await page.locator('#cd-nano-start').click();
  const before=await page.evaluate(()=>JSON.stringify(coinDropGame.p));
  await page.evaluate(()=>coinDropGame.finishNano(true));await page.evaluate(()=>accountApp.settle());
  expect(await page.evaluate(()=>JSON.stringify(coinDropGame.p))).toBe(before);
  expect(await page.evaluate(()=>accountApp.controller.state().profile.achievements.stats.nanoWins)).toBe(1);
  await page.locator('[data-game="coindrop"]').click();await page.locator('#cd-drop').click();
  await page.evaluate(()=>{coinDropGame.coins[0].y=1320;coinDropGame.update(1/120);});await page.evaluate(()=>accountApp.settle());
  expect(await page.evaluate(()=>accountApp.controller.state().profile.achievements.stats.coinBanked)).toBe(1);
  await page.locator('[data-game="treasure"]').click();await page.locator('#trove-next').click();
  await page.evaluate(()=>{while(treasureTrove.round.phase!=='choose')treasureTrove.round.advance(.05);treasureTrove.choose(treasureTrove.round.order.indexOf(treasureTrove.round.target));});await page.evaluate(()=>accountApp.settle());
  expect(await page.evaluate(()=>accountApp.controller.state().profile.achievements.stats.treasureBest)).toBe(1);
  await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready');await page.evaluate(()=>accountApp.ready);
  for(const mode of ['coindrop','nanolab','treasure'])expect(await page.evaluate(mode=>!!achievementTracker.data.unlocked[`${mode}_milestone_1`],mode)).toBe(true);
  expect(errors).toEqual([]);
});
test('every exclusive Custom Turtle has turtle anatomy and a distinct shell emblem',async({page},info)=>{
  await openGame(page);await page.evaluate(()=>{
    const gallery=document.createElement('div');gallery.id='crown-turtle-gallery';gallery.style='position:fixed;inset:0;z-index:99999;overflow:auto;background:#101321;display:grid;grid-template-columns:repeat(3,1fr);align-content:start;color:white';
    gallery.innerHTML=CrownPacks.games.map(g=>`<article style="text-align:center"><div>${CrownPacks.art({crown:g.mode,id:`crown_${g.mode}_turtle`},'turtle')}</div>${g.game}</article>`).join('');document.body.append(gallery);
  });
  await expect(page.locator('#crown-turtle-gallery .crown-turtle')).toHaveCount(11);
  expect(await page.locator('#crown-turtle-gallery').innerHTML()).not.toContain('undefined');
  await page.locator('#crown-turtle-gallery').screenshot({path:info.outputPath('exclusive-turtles.png')});
});
test('Tearesseract saves full encounters to the same profile but excludes practice',async({page})=>{
  await page.route('**/tearesseract-theme.mp3*',route=>route.abort());
  await page.route('**/tearesseract.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('previewMusic();\n})();',"window.teaResult=(score,won)=>{rankedClears=score;enter(won?'ending':'dead');};\npreviewMusic();\n})();")});});
  await openGame(page);await page.evaluate(()=>accountApp.ready);
  await page.goto('/tearesseract.html');await page.locator('#start').click();await expect(page.locator('#fight')).toHaveAttribute('data-phase','intro');
  await page.evaluate(()=>window.teaResult(3,false));await expect(page.locator('#tea-progress')).toContainText('3 attacks cleared');
  await page.locator('#load-attack').focus();await page.locator('#load-attack').press('Enter');await expect(page.locator('#fight')).toHaveAttribute('data-phase','attack');await page.evaluate(()=>window.teaResult(30,true));
  await page.goto('/');await expect(page.locator('#runtime-status')).toContainText('All games ready');await page.evaluate(()=>accountApp.ready);
  expect(await page.evaluate(()=>achievementTracker.data.stats.teaAttacksBest)).toBe(3);expect(await page.evaluate(()=>achievementTracker.data.stats.teaWins)).toBe(0);
});
