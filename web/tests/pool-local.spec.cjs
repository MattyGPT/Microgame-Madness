const {test,expect}=require('@playwright/test'),fs=require('node:fs');
test('Penguin Pool starts, aims, shoots and pauses on desktop and touch',async({page},info)=>{
 test.skip(!fs.existsSync('dist/pool/index.html'),'Local preview only');
 await page.goto('/pool/index.html');await expect(page.locator('#aim-pad')).toHaveCount(0);await page.locator('#start').click();
 await page.locator('#table').click({position:{x:250,y:100}});
 expect(await page.evaluate(()=>Pool.game.shots)).toBe(1);
 await page.locator('#pause').click();expect(await page.evaluate(()=>Pool.paused)).toBe(true);
 const time=await page.evaluate(()=>Pool.game.time);await page.waitForTimeout(150);expect(await page.evaluate(()=>Pool.game.time)).toBe(time);
 await page.locator('#pause').click();await page.locator('#new').click();await expect(page.locator('#confirm')).toBeVisible();
 await page.locator('#cancel').click();await expect.poll(()=>page.evaluate(()=>Pool.paused)).toBe(false);
 await page.screenshot({path:info.outputPath('pool.png'),fullPage:true});
 await page.locator('#new').click();await page.locator('#mode').selectOption('practice');await page.locator('#restart').click();await expect.poll(()=>page.evaluate(()=>Pool.game.practice)).toBe(true);await expect.poll(()=>page.evaluate(()=>Pool.paused)).toBe(false);
});

test('dragging back adjusts power and releases one shot',async({page,isMobile})=>{
 test.skip(!fs.existsSync('dist/pool/index.html'),'Local preview only');
 await page.goto('/pool/index.html');await page.locator('#start').click();
 const box=await page.locator('#table').boundingBox();
 const x=box.x+box.width*.6,y=box.y+box.height*.5;
 if(isMobile){
  const client=await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*.4,y}]});
  expect(Number(await page.locator('#power').inputValue())).toBeGreaterThan(90);
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }else{
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(box.x+box.width*.4,y,{steps:5});
  expect(Number(await page.locator('#power').inputValue())).toBeGreaterThan(90);await page.mouse.up();
 }
 expect(await page.evaluate(()=>Pool.game.shots)).toBe(1);

});
test('inline call controls sit below the table and shoot without a popup',async({page})=>{
 await page.goto('/pool/index.html');await page.locator('#start').click();await page.evaluate(()=>Pool.game.breakShot=false);
 await expect(page.locator('#call-dialog')).toHaveCount(0);await expect(page.locator('#call-controls')).toBeVisible();
 const table=await page.locator('#table').boundingBox(),controls=await page.locator('#call-controls').boundingBox();expect(controls.y).toBeGreaterThanOrEqual(table.y+table.height);
 await page.locator('#call-ball').selectOption('9');await page.locator('#call-pocket').selectOption('5');await page.locator('#shoot').click();
 expect(await page.evaluate(()=>({shots:Pool.game.shots,ball:Pool.game.shot.callBall,pocket:Pool.game.shot.callPocket}))).toEqual({shots:1,ball:9,pocket:5});
});
test('local player two controls the table and practice has no automatic opponent',async({page})=>{
 await page.goto('/pool/index.html');await page.locator('#local-play').click();await page.evaluate(()=>Pool.game.turn=1);
 await page.waitForTimeout(1200);expect(await page.evaluate(()=>Pool.game.shots)).toBe(0);await expect(page.locator('#turn')).toContainText('Player 2');await page.locator('#shoot').click();expect(await page.evaluate(()=>Pool.game.shots)).toBe(1);
 await page.locator('#new').click();await page.locator('#mode').selectOption('practice');await page.locator('#restart').click();await page.waitForTimeout(1200);expect(await page.evaluate(()=>Pool.game.mode)).toBe('practice');expect(await page.evaluate(()=>Pool.game.shots)).toBe(0);
});
test('table callouts announce pots and fouls without blocking play and expire',async({page})=>{
 await page.goto('/pool/index.html');await page.locator('#local-play').click();
 await page.evaluate(()=>{Pool.game.balls=[{id:0,x:260,y:275,vx:0,vy:0},{id:1,x:500,y:22,vx:0,vy:0},{id:8,x:700,y:300,vx:0,vy:0}];});
 const notice=page.locator('#pool-callout');await expect(notice).toBeVisible();await expect(notice.locator('strong')).toHaveText('BALL IN!');await expect(notice.locator('span')).toContainText('Player 1');await expect(notice).toHaveCSS('pointer-events','none');
 const time=await page.evaluate(()=>Pool.game.time);await expect(notice).toBeHidden({timeout:2500});expect(await page.evaluate(()=>Pool.game.time)).toBeGreaterThan(time);
 await page.evaluate(()=>{const t=Pool.game;t.shoot(0,.5);t.cue.vx=t.cue.vy=0;t.resolveShot();});
 await expect(notice.locator('strong')).toHaveText('FOUL!');await expect(notice.locator('span')).toContainText('No object ball hit');await expect(notice).toBeHidden({timeout:2500});
});
