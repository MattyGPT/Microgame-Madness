const {test,expect,openGame}=require('./fixtures/game.cjs');
test.beforeEach(async({page})=>{await openGame(page);await page.locator('[data-game="nanolab"]').click();});
async function launch(page,id){await page.evaluate(id=>coinDropGame.startNanoTest(id),id);await page.locator('#cd-nano-start').click();}
const keys=['ArrowUp','ArrowLeft','ArrowDown','ArrowRight'];
test('Nano Lab displays WIN, LOSS, timeout and CLOSED distinctly, with replay and no rewards',async({page},info)=>{
 const before=await page.evaluate(()=>JSON.stringify(coinDropGame.p));
 await launch(page,'math');const answer=await page.evaluate(()=>coinDropGame.nano.correct);await page.locator('#cd-nano-stage .cd-nano-choices button').nth(answer).click();
 await expect(page.locator('#cd-lab-result')).toBeInViewport();await expect(page.locator('#cd-lab-result')).toBeVisible();await expect(page.locator('.cd-result-badge')).toHaveText('WIN');await expect(page.locator('#cd-lab-result')).toHaveAttribute('data-outcome','win');
 await page.screenshot({path:info.outputPath('nano-win.png')});
 await page.locator('#cd-lab-result').getByRole('button',{name:'Try again'}).click();await page.locator('#cd-nano-start').click();const wrong=await page.evaluate(()=>(coinDropGame.nano.correct+1)%3);await page.locator('#cd-nano-stage .cd-nano-choices button').nth(wrong).click();await expect(page.locator('.cd-result-badge')).toHaveText('LOSS');
 await launch(page,'math');await page.evaluate(()=>coinDropGame.tickNano(5));await expect(page.locator('#cd-lab-result')).toContainText('time ran out');await expect(page.locator('.cd-result-badge')).toHaveText('LOSS');
 await launch(page,'math');await page.locator('#cd-nano-skip').click();await expect(page.locator('.cd-result-badge')).toHaveText('CLOSED');await page.locator('#cd-lab-result').getByRole('button',{name:'Dismiss'}).click();await expect(page.locator('#cd-lab-result')).toBeHidden();
 expect(await page.evaluate(()=>JSON.stringify(coinDropGame.p))).toBe(before);
});
test('Arrow Sprint and Shield Shift make exactly one move per key press',async({page})=>{
 for(const id of ['nano_arrows','nano_shield']){
   await launch(page,id);const commands=await page.evaluate(()=>coinDropGame.nano.challenge.state.commands);await page.keyboard.down(keys[commands[0]]);await page.keyboard.down(keys[commands[0]]);expect(await page.evaluate(()=>coinDropGame.nano.challenge.state.index)).toBe(1);await page.keyboard.up(keys[commands[0]]);expect(await page.evaluate(()=>coinDropGame.nano.challenge.state.index)).toBe(1);
   for(const direction of commands.slice(1))await page.keyboard.press(keys[direction]);await expect(page.locator('#cd-lab-result')).toBeVisible();await expect(page.locator('.cd-result-badge')).toHaveText('WIN');
 }
});
test('memory arrows, compass, alternation and sliding tiles all accept arrow keys',async({page})=>{
 const aim=await page.evaluate(()=>coinDropGame.aim);
 await launch(page,'nano_reverse_arrows');await page.keyboard.press('ArrowLeft');expect(await page.evaluate(()=>coinDropGame.nano.challenge.state.index)).toBe(0);
 const route=await page.evaluate(()=>{coinDropGame.tickNano(2.1);return coinDropGame.nano.challenge.state.answer;});for(const direction of route)await page.keyboard.press(keys[direction]);await expect(page.locator('#cd-lab-result')).toBeVisible();await expect(page.locator('.cd-result-badge')).toHaveText('WIN');
 await launch(page,'nano_compass');for(const key of ['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'])await page.keyboard.press(key);await expect(page.locator('#cd-lab-result')).toBeVisible();await expect(page.locator('.cd-result-badge')).toHaveText('WIN');
 await launch(page,'nano_alternate');for(let i=0;i<8;i++)await page.keyboard.press(i%2?'ArrowRight':'ArrowLeft');await expect(page.locator('#cd-lab-result')).toBeVisible();await expect(page.locator('.cd-result-badge')).toHaveText('WIN');
 await launch(page,'nano_slide');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowRight');await expect(page.locator('#cd-lab-result')).toBeVisible();await expect(page.locator('.cd-result-badge')).toHaveText('WIN');
 expect(await page.evaluate(()=>coinDropGame.aim)).toBe(aim);
});
test('diagonal arrow combinations choose a mirror answer and wire arrows select and rotate pieces',async({page})=>{
 await launch(page,'nano_mirror');await page.keyboard.down('ArrowUp');await page.keyboard.down('ArrowLeft');await page.keyboard.up('ArrowLeft');await page.keyboard.up('ArrowUp');await expect(page.locator('#cd-lab-result')).toBeVisible();await expect(page.locator('.cd-result-badge')).toHaveText('WIN');
 await launch(page,'nano_mirror');await page.keyboard.down('ArrowDown');await page.keyboard.down('ArrowRight');await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowDown');await expect(page.locator('.cd-result-badge')).toHaveText('LOSS');
 await launch(page,'nano_wires');await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowUp');await expect(page.locator('#cd-lab-result')).toBeVisible();await expect(page.locator('.cd-result-badge')).toHaveText('WIN');
});
