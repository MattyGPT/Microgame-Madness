const {test,expect,openGame}=require('./fixtures/game.cjs');
test.beforeEach(async({page})=>{await openGame(page);await page.locator('[data-game="nanolab"]').click();});
test('binary lesson teaches place values interactively without running timer or music',async({page},info)=>{
 await expect(page.locator('[data-nano-learn]')).toHaveCount(60);
 const before=await page.evaluate(()=>JSON.stringify(coinDropGame.p));
 await page.locator('#cd-lab-search').fill('binary');await page.locator('[data-nano-learn="nano_binary"]').click();
 await expect(page.locator('#cd-nano-lesson')).toHaveAttribute('open','');
 await expect(page.locator('.cd-lesson-answer')).toHaveText('1010 = 8 + 2 = 10');
 await page.locator('[data-bit="1"]').click();await expect(page.locator('.cd-lesson-answer')).toHaveText('1110 = 8 + 4 + 2 = 14');
 await page.evaluate(()=>coinDropGame.tickNano(40));expect(await page.evaluate(()=>({phase:coinDropGame.nano.phase,elapsed:coinDropGame.nano.elapsed,music:coinDropGame.nanoMusic?.playing??false}))).toEqual({phase:'ready',elapsed:0,music:false});
 await page.locator('.cd-nano').screenshot({path:info.outputPath('binary-lesson.png')});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#cd-nano-start').click();await expect(page.locator('#cd-nano-lesson')).toBeHidden();await expect(page.locator('#cd-nano-stage button')).toHaveCount(4);
 await page.locator('#cd-nano-skip').click();expect(await page.evaluate(()=>JSON.stringify(coinDropGame.p))).toBe(before);
});
test('Roman key and all other lessons are accessible before a test, but absent in campaign',async({page},info)=>{
 await page.locator('[data-nano-learn="nano_roman"]').click();await expect(page.locator('.cd-roman-key tbody tr')).toHaveCount(10);
 await expect(page.locator('.cd-roman-key')).toContainText('IV');await expect(page.locator('.cd-lesson-example')).toContainText('IX = 10 − 1 = 9');
 await page.locator('.cd-nano').screenshot({path:info.outputPath('roman-key.png')});await page.locator('#cd-nano-skip').click();
 const missing=await page.evaluate(()=>{const g=coinDropGame,missing=[];for(const game of CoinDrop.nanogames){g.startNanoTest(game.id,true);if(!document.querySelector('#cd-nano-lesson').open||document.querySelectorAll('#cd-nano-lesson-body li').length!==2)missing.push(game.id);g.finishNano(false);}return missing;});expect(missing).toEqual([]);
 await page.locator('[data-nano-test="nano_roman"]').click();await expect(page.locator('#cd-nano-lesson')).not.toHaveAttribute('open','');await page.locator('#cd-nano-lesson summary').click();await expect(page.locator('.cd-roman-key')).toBeVisible();await page.locator('#cd-nano-skip').click();
 await page.locator('[data-game="coindrop"]').click();await page.evaluate(()=>{const g=coinDropGame;g.drop();g.enterNano(g.coins[0],g.features.find(f=>f.type==='nano'));});await expect(page.locator('#cd-nano-lesson')).toBeHidden();
});
