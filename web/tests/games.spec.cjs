const {test,expect}=require('@playwright/test');
const path=require('node:path');
const fs=require('node:fs');

// Serve the exact pinned runtime locally in CI so CDN availability does not
// make game regressions intermittent. Production uses the same CDN version.
test.beforeEach(async ({page})=>{
  await page.route('https://cdn.jsdelivr.net/pyodide/v0.29.3/full/**',route=>{
    const file=path.basename(new URL(route.request().url()).pathname);
    const local=path.resolve('node_modules/pyodide',file);
    if(!fs.existsSync(local))return route.abort();
    return route.fulfill({path:local,contentType:file.endsWith('.wasm')?'application/wasm':file.endsWith('.js')?'application/javascript':'application/octet-stream',headers:{'access-control-allow-origin':'*'}});
  });
  await page.goto('/');
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
});

test('home fits the viewport and Hangman scores survive reload',async({page},testInfo)=>{
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('arcade-home.png'),fullPage:true});
  await page.locator('#player').fill('Browser Tester');
  await page.locator('#start').click();
  await page.getByRole('button',{name:'Guess Z',exact:true}).click();
  await expect(page.locator('#metric')).toHaveText('9'); // Easy words never contain Z.
  await expect(page.getByRole('button',{name:'Guess Z',exact:true})).toBeDisabled();
  // Complete a round through the public alphabet UI; either outcome saves a score.
  for(const letter of 'abcdefghijklmnopqrstuvwxy') {
    if(await page.locator('#overlay').isVisible())break;
    const button=page.getByRole('button',{name:`Guess ${letter.toUpperCase()}`,exact:true});
    if(await button.isEnabled())await button.click();
  }
  await expect(page.locator('#overlay')).toBeVisible();
  await expect(page.locator('#scores-list')).toContainText('Browser Tester');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#scores-list')).toContainText('Browser Tester');
});

test('typing, arcade controls, pause, and all graphical modes work',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.locator('[data-game="keyboard"]').click();
  await page.locator('#start').click();
  const sequence=await page.locator('#sequence').innerText();
  if(testInfo.project.name==='mobile')await page.locator('#typing-input').fill(sequence);
  else await page.keyboard.type(sequence);
  await expect(page.locator('#score')).toHaveText('1');
  await page.locator('#exit').click();
  for(const mode of ['dodge','boss','pumpkin']) {
    await page.locator(`[data-game="${mode}"]`).click();
    await page.locator('#start').click();
    await expect(page.locator('#game-canvas')).toBeVisible();
    await page.locator('#pause').click();
    await expect(page.locator('#overlay-title')).toHaveText('Take a breather.');
    await page.screenshot({path:testInfo.outputPath(`${mode}-paused.png`),fullPage:true});
    await page.locator('#overlay-action').click();
    await expect(page.locator('#overlay')).toBeHidden();
    if(testInfo.project.name==='mobile') {
      await expect(page.locator('#touch-controls')).toBeVisible();
      await page.locator('[data-key="Left"]').tap();
    }else{
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('f');
    }
    await page.screenshot({path:testInfo.outputPath(`${mode}-playing.png`),fullPage:true});
    await page.locator('#exit').click();
  }
  await page.locator('[data-game="dodge"]').click();
  await page.locator('#difficulty').selectOption('merciless');
  await page.locator('#start').click();
  await expect(page.locator('#pause')).toBeHidden();
  expect(errors).toEqual([]);
});

test('missing runtime shows a recoverable loading error',async({page})=>{
  await page.route('**/python-files.json',route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.reload();
  await expect(page.locator('#overlay-title')).toHaveText('The arcade needs a restart.');
  await expect(page.locator('#overlay-action')).toHaveText('Reload arcade');
});
