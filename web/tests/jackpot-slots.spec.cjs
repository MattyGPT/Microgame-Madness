const {test,expect,openGame}=require('./fixtures/game.cjs');
test('equipped visible reels spin, hidden previews cannot award, and visible 777 unlocks',async({page},testInfo)=>{
  await openGame(page);
  await page.evaluate(async()=>{
    await accountApp.ready;await accountApp.settle();
    accountApp.arcade=()=>{};
    achievementTracker.data.unlocked.chaos_score_3000=new Date().toISOString();
    saved.cubieCustom='chaos_jackpot';applyCubieCustom();
    jackpotMachine.machine.random=()=>0;
    window.slotClock=1000000;
    window.runSlots=()=>{jackpotMachine.machine.reset();jackpotMachine.last=slotClock;for(let i=0;i<54;i++){slotClock+=50;jackpotMachine.tick(slotClock);}};
  });
  await page.locator('#cube').evaluate(el=>el.scrollIntoView({block:'center'}));
  await page.evaluate(()=>{
    // All copies are hidden, including the collection-card preview.
    document.querySelectorAll('[data-custom="chaos_jackpot"].cubie-custom-art').forEach(el=>el.style.visibility='hidden');
    runSlots();
  });
  expect(await page.evaluate(()=>!!achievementTracker.data.unlocked.chaos_jackpot_777)).toBe(false);
  await page.evaluate(()=>{
    document.querySelectorAll('[data-custom="chaos_jackpot"].cubie-custom-art').forEach(el=>el.style.visibility='');
    saved.cubieCustom='classic';runSlots();
  });
  expect(await page.evaluate(()=>!!achievementTracker.data.unlocked.chaos_jackpot_777)).toBe(false);
  await page.evaluate(()=>{
    saved.cubieCustom='chaos_jackpot';jackpotMachine.machine.reset();jackpotMachine.last=slotClock;
    for(let i=0;i<12;i++){slotClock+=50;jackpotMachine.tick(slotClock);}
  });
  const reels=await page.locator('#cube [data-jackpot-reel]').evaluateAll(els=>els.map(el=>el.getAttribute('transform')));
  expect(new Set(reels).size).toBe(3);
  await page.evaluate(()=>runSlots());
  await expect.poll(()=>page.evaluate(()=>!!achievementTracker.data.unlocked.chaos_jackpot_777)).toBe(true);
  await page.locator('#cube').screenshot({path:testInfo.outputPath('jackpot-777.png'),animations:'disabled'});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>{jackpotMachine.machine.reset();jackpotMachine.last=slotClock;slotClock+=50;jackpotMachine.tick(slotClock);});
  expect(await page.locator('#cube [data-jackpot-reel]').evaluateAll(els=>els.every(el=>Number.isInteger(Number(el.getAttribute('transform').match(/translate\(0 ([^)]+)/)[1])/16)))).toBe(true);
});
