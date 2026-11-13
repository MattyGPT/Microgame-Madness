const { leaveFullscreen } = require('./fixtures/game.cjs');
const {test,expect,openGame}=require('./fixtures/game.cjs');
test('Impossible has its own picker, small white arena, scaled blocks, rewards, and scores',async({page},testInfo)=>{
  await page.route('**/app.js*',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace('const pyodide = await loadPyodide(', 'const pyodide = window.impossibleRuntime = await loadPyodide(')});
  });
  await openGame(page);
  await leaveFullscreen(page);
  await page.locator('[data-game="dodge"]').click();
  await page.getByRole('button',{name:/Impossible/}).click();
  await expect.poll(()=>page.evaluate(()=>snapshot?.difficulty)).toBe('impossible');
  const state=await page.evaluate(()=>{
    active=false;
    impossibleRuntime.runPython('from bridge import session\nfrom dodge_model import Block, CELL\nsession.game.blocks = [Block(-80, 70, ((0,0),(1,0),(1,1),(2,1)), "#ffffff", cell_size=CELL*.75), Block(50, 0, ((0,0),(1,0),(0,1),(1,1)), "#ffffff", cell_size=CELL*.75)]');
    snapshot=send('pause');draw(snapshot);
    return {bounds:snapshot.bounds,canPause:snapshot.can_pause,paused:snapshot.paused,commands:snapshot.commands};
  });
  expect(state.bounds).toEqual([-210,210,-170,170]);
  expect(state.canPause).toBe(false);
  const blocks=state.commands.filter(c=>c.fill==='#ffffff'&&c.kind==='rectangle');
  expect(blocks.length).toBe(8);
  for (const block of blocks) expect(block.coords[2]-block.coords[0]).toBeCloseTo(28*.94*.75,5);
  await page.locator('#game-canvas').screenshot({path:testInfo.outputPath('impossible-arena.png')});
  const result=await page.evaluate(()=>{
    achievementTracker.start('dodge','impossible');
    updateAchievements(achievementTracker.observe({mode:'dodge',difficulty:'impossible',elapsed:180,over:true,won:false,score:1800}));
    snapshot={...snapshot,elapsed:180,over:true,won:false,score:1800};roundSaved=false;saveRound();
    return {medals:Object.keys(saved.achievements.unlocked).filter(id=>id.startsWith('dodge_impossible_')),scoreKeys:Object.keys(saved.scores)};
  });
  expect(result.medals).toHaveLength(5);
  expect(result.scoreKeys).toContain('dodge:impossible');
  await leaveFullscreen(page);
  await page.locator('[data-game="customs"]').click();
  await page.getByRole('button',{name:'Wear White Dwarf Cubie',exact:true}).click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','white_dwarf');
  await page.reload();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','white_dwarf');
});
