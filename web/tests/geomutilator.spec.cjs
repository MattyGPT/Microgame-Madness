const { test, expect, openGame, leaveFullscreen } = require('./fixtures/game.cjs');
test('both code entries, failure, ten slams and persistent forge rewards', async ({ page }) => {
  await openGame(page);
  await leaveFullscreen(page);
  await page.locator('#player').fill('IHATEGEOMETRY');
  await expect(page.locator('#galactic-forge')).toBeVisible();
  await page.locator('#forge-slam').click();
  await page.locator('#forge-slam').click();
  await expect(page.locator('#galactic-forge')).toHaveCount(0);
  await expect(page.locator('#name-surprise')).toContainText('Forge failed');
  await page.locator('#arcade-code').fill('IHATEGEOMETRY');
  await page.locator('#arcade-code-submit').click();
  await expect(page.locator('#forge-progress')).toContainText('Strike 1 / 10');
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now()+1000));
  await page.locator('#forge-slam').click();
  for (let i=0; i<10; i++) {
    const center = await page.locator('.forge-target').evaluate(el => (parseFloat(el.style.left)+parseFloat(el.style.width)/2)/100);
    await page.clock.runFor(Math.round(center*(1600-i*85)));
    if (i === 8) await page.screenshot({path: 'artifacts/galactic-forge.png'});
    await page.locator('#forge-slam').dispatchEvent('pointerdown');
  }
  await expect(page.locator('#galactic-forge')).toHaveCount(0);
  await expect(page.locator('#name-surprise')).toContainText('Forged!');
  await page.clock.resume();
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await page.locator('[data-game="geomayhem"]').click();
  await expect(page.locator('#geomayhem-weapon option[value="geomutilator"]')).toBeEnabled();
  await page.locator('#geomayhem-weapon').selectOption('geomutilator');
  await expect(page.locator('#geomayhem-evolution-three')).toContainText('25%');
  const rewards = await page.evaluate(() => ({medal: !!achievementTracker.data.unlocked.galactic_forge, custom: saved.cubieCustom}));
  expect(rewards).toEqual({medal:true, custom:'galactic_smith'});
  await page.locator('[data-difficulty="level_1"]').click();
  await expect(page.locator('#geomayhem-wave')).toContainText('WAVE 1/20');
});

test('one wrap per round, J slams, final timeout, and forge audio cleanup', async ({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await openGame(page);await leaveFullscreen(page);
  await page.locator('#arcade-code').fill('IHATEGEOMETRY');await page.locator('#arcade-code-submit').click();
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));
  await page.locator('#forge-slam').press('j');
  await page.clock.runFor(1650);
  await expect(page.locator('#forge-pass')).toHaveText('PASS 2 / 2 · FINAL CHANCE');
  expect(await page.locator('.forge-marker').evaluate(el=>parseFloat(el.style.left))).toBeLessThan(5);
  const center=await page.locator('.forge-target').evaluate(el=>(parseFloat(el.style.left)+parseFloat(el.style.width)/2)/100);
  await page.clock.runFor(Math.round(center*1600)-50);
  await page.locator('#forge-slam').press('j');
  await expect(page.locator('#forge-progress')).toContainText('Strike 2 / 10');
  await expect(page.locator('#forge-pass')).toContainText('PASS 1 / 2');
  await page.locator('#galactic-forge').screenshot({path:testInfo.outputPath('forge-upgraded.png')});
  expect(await page.evaluate(()=>musicPlayer.playing)).toBe(false);
  await page.locator('#forge-sound').click();
  await expect(page.locator('#forge-sound')).toHaveText('Sound off');
  await page.clock.runFor(1515*2+30);
  await expect(page.locator('#galactic-forge')).toHaveCount(0);
  await expect(page.locator('#name-surprise')).toContainText('Forge failed');
  await page.locator('#sound').click();
  await expect.poll(()=>page.evaluate(()=>musicPlayer.playing)).toBe(true);
  expect(errors).toEqual([]);
});

test('timing edges match the marker width and only the hammer head contacts the anvil',async({page},testInfo)=>{
  await openGame(page);await leaveFullscreen(page);
  await page.locator('#arcade-code').fill('IHATEGEOMETRY');await page.locator('#arcade-code-submit').click();
  const edges=await page.evaluate(()=>{
    const half=document.querySelector('.forge-marker').getBoundingClientRect().width/(2*document.querySelector('.forge-track').clientWidth);
    return [.16,.07].map(width=>{
      const left=.5-width/2-half,right=.5+width/2+half;
      return [forgeTimingHit(left,.5,width,half),forgeTimingHit(right,.5,width,half),forgeTimingHit(left-.001,.5,width,half),forgeTimingHit(right+.001,.5,width,half)];
    });
  });
  expect(edges).toEqual([[true,true,false,false],[true,true,false,false]]);
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));
  await page.locator('#forge-slam').press('j');
  const center=await page.locator('.forge-target').evaluate(el=>(parseFloat(el.style.left)+parseFloat(el.style.width)/2)/100);
  await page.clock.runFor(Math.round(center*1600));await page.locator('#forge-slam').press('j');
  const contact=await page.evaluate(()=>{
    const hammer=document.querySelector('#forge-hammer'),animation=hammer.getAnimations()[0];
    animation.pause();animation.effect.updateTiming({easing:'linear'});animation.currentTime=100;
    const svg=hammer.ownerSVGElement,point=svg.createSVGPoint();point.x=300;point.y=177;
    const surface=point.matrixTransform(svg.getScreenCTM()).y;
    const head=document.querySelector('#forge-hammer-head');
    // A rotated bounding rectangle includes empty space beyond the beveled head.
    const bottom=Math.max(...Array.from({length:1001},(_,i)=>head.getPointAtLength(head.getTotalLength()*i/1000).matrixTransform(head.getScreenCTM()).y));
    return {head:bottom,handle:document.querySelector('#forge-hammer-handle').getBoundingClientRect().bottom,surface};
  });
  expect(Math.abs(contact.head-contact.surface)).toBeLessThan(1);
  expect(contact.handle).toBeLessThan(contact.surface-10);
  await page.locator('#galactic-forge').screenshot({path:testInfo.outputPath('hammer-contact.png')});
});

test('bar clicks use the visible marker even between animation frames',async({page})=>{
  await openGame(page);await leaveFullscreen(page);
  await page.locator('#arcade-code').fill('IHATEGEOMETRY');await page.locator('#arcade-code-submit').click();
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));
  await page.locator('#forge-slam').press('j');
  const right=await page.locator('.forge-target').evaluate(el=>(parseFloat(el.style.left)+parseFloat(el.style.width))/100);
  await page.clock.runFor(Math.floor(right*1600)-2);
  const overlaps=await page.evaluate(()=>{
    const marker=document.querySelector('.forge-marker').getBoundingClientRect(),target=document.querySelector('.forge-target').getBoundingClientRect();
    return marker.right>=target.left && marker.left<=target.right;
  });
  expect(overlaps).toBe(true);
  await page.evaluate(()=>{
    // Input arrives after the clock advances, but before another frame is painted.
    const original=performance.now.bind(performance),now=original();
    performance.now=()=>now+25;
    document.querySelector('#forge-slam').dispatchEvent(new PointerEvent('pointerdown'));
    performance.now=original;
  });
  await expect(page.locator('#forge-progress')).toContainText('Strike 2 / 10');
  // The reset marker is visibly outside the new cyan zone: an immediate click fails.
  await page.locator('#forge-slam').dispatchEvent('pointerdown');
  await expect(page.locator('#galactic-forge')).toHaveCount(0);
  await expect(page.locator('#name-surprise')).toContainText('Forge failed');
});
