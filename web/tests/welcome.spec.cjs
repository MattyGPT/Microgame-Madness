const { test, expect, openGame } = require('./fixtures/game.cjs');
const { accountService } = require('./fixtures/account-service.cjs');
test.use({firstVisitSetup:true, deterministicMusic:true});

async function welcome(page) {
  await openGame(page);
  await expect(page.locator('#welcome-dialog')).toBeVisible();
  await expect(page.locator('#welcome-dialog-title')).toHaveText('Hi! I’m Cubie.');
}

test('first visit introduces Cubie, saves guest preferences, then shows seven playable videos and remembers completion', async ({page}, testInfo) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await welcome(page);
  await page.locator('#welcome-dialog').screenshot({path:testInfo.outputPath('cubie-welcome.png')});
  await page.locator('#welcome-next').click();
  await expect.poll(() => page.evaluate(() => musicPlayer?.track)).toBe('cubie_hello');
  await expect(page.locator('#welcome-create')).toBeDisabled();
  await expect(page.locator('#welcome-cloud-note')).toContainText('aren’t connected');
  await page.locator('#welcome-next').click();
  await expect(page.locator('#welcome-sharing')).toBeChecked();
  await expect(page.locator('#welcome-public')).toBeChecked();
  await page.locator('#welcome-public').uncheck();
  await page.locator('#welcome-name').fill('New Buddy');
  await page.locator('#welcome-sound').uncheck();
  await page.locator('#welcome-sharing').uncheck();
  await page.locator('#welcome-dialog').screenshot({path:testInfo.outputPath('cubie-preferences.png')});
  await page.locator('#welcome-next').click();
  await expect(page.locator('#welcome-tour')).toBeVisible();
  const ids=['hangman','keyboard','dodge','boss','pumpkin','wrath','geomayhem'];
  await expect(page.locator('#welcome-game-dots button')).toHaveCount(7);
  for(let i=0;i<ids.length;i++){
    const video=page.locator('#welcome-video');
    await expect(video).toHaveAttribute('src',`./accounts/tours/${ids[i]}.webm`);
    await expect.poll(()=>video.evaluate(e=>e.readyState)).toBeGreaterThanOrEqual(2);
    await expect.poll(()=>video.evaluate(e=>e.currentTime)).toBeGreaterThan(0);
    expect(await video.evaluate(e=>e.videoWidth)).toBe(640);
    await expect(page.locator('#welcome-video-error')).toBeHidden();
    if(i===2)await page.locator('#welcome-dialog').screenshot({path:testInfo.outputPath('cubie-game-tour.png')});
    await page.locator('#welcome-next').click();
  }
  await expect(page.locator('#welcome-dialog')).not.toBeVisible();
  await page.reload();await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#welcome-dialog')).not.toBeVisible();
  await page.locator('#account-open').click();
  await expect(page.locator('#account-name')).toHaveValue('New Buddy');
  await expect(page.locator('#account-ranking')).not.toBeChecked();
  await expect(page.locator('#account-public')).not.toBeChecked();
  await expect(page.locator('#account-sound')).not.toBeChecked();
  expect(await page.locator('#account-open').evaluate(e=>parseFloat(getComputedStyle(e).borderTopWidth))).toBeGreaterThanOrEqual(4);
  await page.locator('#account-close').click();
  await expect(page.locator('#welcome-preview-tab')).toHaveCount(0);
  await page.locator('#account-open').click();await page.locator('#account-welcome').click();await expect(page.locator('#welcome-dialog')).toBeVisible();
  expect(errors).toEqual([]);
});

test('email creation validates codes, keeps progress, and continues to preferences before the tour', async ({page}) => {
  const service=await accountService(page);
  await welcome(page);await page.locator('#welcome-next').click();
  await page.locator('#welcome-email').fill('new-player@example.test');
  await page.locator('#welcome-create').click();
  await expect(page.locator('#welcome-code-form')).toBeVisible();
  await page.locator('#welcome-code').fill('000000');
  await page.locator('#welcome-code-form button[type="submit"]').click();
  await expect(page.locator('#welcome-message')).toContainText('invalid or expired');
  await page.locator('#welcome-code').fill('123456');
  await page.locator('#welcome-code-form button[type="submit"]').click();
  await expect(page.locator('#welcome-account-success')).toBeVisible();
  await expect(page.locator('#welcome-tour')).toBeHidden();
  expect(await page.evaluate(()=>accountApp.signedIn)).toBe(true);
  expect(service.email).toBe('new-player@example.test');
  await page.locator('#welcome-next').click();
  await expect(page.locator('#welcome-preferences')).toBeVisible();
  await expect(page.locator('#welcome-sharing')).toBeChecked();
  await page.locator('#welcome-next').click();
  await expect(page.locator('#welcome-tour')).toBeVisible();
  await page.locator('#welcome-skip-tour').click();
  await expect(page.locator('#welcome-dialog')).not.toBeVisible();
});

test('setup can be skipped and reduced-motion tour videos wait for play', async ({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await welcome(page);await page.locator('#welcome-close').click();
  await expect(page.locator('#welcome-dialog')).not.toBeVisible();
  await page.locator('#account-open').click();await page.locator('#account-welcome').click();
  await page.locator('#welcome-next').click();await page.locator('#welcome-next').click();
  await expect(page.locator('#welcome-motion')).toBeChecked();
  await page.locator('#welcome-next').click();await expect(page.locator('#welcome-tour')).toBeVisible();
  await expect.poll(()=>page.locator('#welcome-video').evaluate(e=>e.readyState)).toBeGreaterThanOrEqual(2);
  expect(await page.locator('#welcome-video').evaluate(e=>e.paused)).toBe(true);
  await page.locator('#welcome-skip-tour').click();await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#welcome-dialog')).not.toBeVisible();
});


test('greeting song is available in Jukebox and preview restores music when closed', async ({page})=>{
  await welcome(page);await page.locator('#welcome-next').click();
  await expect.poll(()=>page.evaluate(()=>musicPlayer?.track)).toBe('cubie_hello');
  await page.locator('#welcome-close').click();
  expect(await page.evaluate(()=>musicPlayer.theme)).toBe('arcade');
  await page.locator('[data-game="jukebox"]').click();
  await expect(page.locator('[data-difficulty="cubie_hello"]')).toContainText('Hello, New Friend!');
  await page.locator('[data-difficulty="cubie_hello"]').click();
  await expect.poll(()=>page.evaluate(()=>musicPlayer?.track)).toBe('cubie_hello');
  await expect(page.locator('#welcome-preview-tab')).toHaveCount(0);
  await page.locator('#account-open').click();await page.locator('#account-welcome').click();
  await expect(page.locator('#welcome-dialog')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>musicPlayer?.playing)).toBe(true);
});
