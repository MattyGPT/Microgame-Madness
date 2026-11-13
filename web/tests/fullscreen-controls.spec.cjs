const { test, expect, openGame } = require('./fixtures/game.cjs');

test('fullscreen button works on desktop and mobile without capturing Q, including fallback', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => selectGame('dodge'));
  await page.keyboard.press('q');
  await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#fullscreen').click();
  await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#fullscreen').click();
  await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => { document.querySelector('.game-main').requestFullscreen = () => Promise.reject(new Error('Unsupported')); });
  await page.locator('#fullscreen').click();
  await expect(page.locator('.game-main')).toHaveClass(/game-fullscreen/);
  const box = await page.locator('.game-main').boundingBox();
  expect(box.x).toBe(0); expect(box.y).toBe(0);
  expect(Math.abs(box.width - page.viewportSize().width)).toBeLessThan(2);
  await page.keyboard.press('q');
  await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#fullscreen').click();
  await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#player').fill('Q');
  await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'false');
});

test('mobile dragging on the arena floats the larger joystick in every combat game', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await openGame(page);
  await page.evaluate(() => unlockSingularity(false));
  const client = await page.context().newCDPSession(page);
  const touch = (type, touchPoints) => client.send('Input.dispatchTouchEvent', {type, touchPoints});
  for (const mode of ['dodge', 'boss', 'pumpkin', 'wrath', 'singularity', 'core_practice', 'geomayhem']) {
    await page.evaluate(mode => selectGame(mode), mode);
    await page.locator('#difficulty-choices [data-difficulty]').first().click();
    if (mode === 'wrath') await page.locator('[data-difficulty="color_memory"]').click();
    await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(() => fullscreenBusy)).toBe(false);
    await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
    const canvas = await page.locator('#game-canvas').boundingBox();
    const start = {id: 1, x: canvas.x + canvas.width / 2, y: canvas.y + canvas.height / 2};
    await touch('touchStart', [start]);
    const stick = page.locator('#touch-joystick');
    await expect(stick).toHaveClass(/floating/);
    const box = await stick.boundingBox();
    expect(box.width).toBeGreaterThan(104);
    expect(Math.abs(box.x + box.width/2 - start.x)).toBeLessThan(3);
    expect(Math.abs(box.y + box.height/2 - start.y)).toBeLessThan(3);
    await touch('touchMove', [{...start, x: start.x + 35, y: start.y - 35}]);
    await expect.poll(() => page.evaluate(() => [...joystickKeys].sort())).toEqual(['Right', 'Up']);
    await touch('touchCancel', []);
    await expect.poll(() => page.evaluate(() => [...joystickKeys])).toEqual([]);
    await expect(stick).not.toHaveClass(/floating/);
  }
});


test('arcade rounds enter fullscreen and every round exit restores the page', async ({page}, testInfo) => {
  await openGame(page);
  for (const mode of ['hangman', 'keyboard']) {
    await page.evaluate(mode => selectGame(mode), mode);
    await page.locator('#difficulty-choices [data-difficulty]').first().click();
    await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'false');
    await page.locator('#fullscreen').click();
    await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#exit').click();
    await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'false');
  }
  await page.evaluate(() => selectGame('dodge'));
  await page.locator('#difficulty-choices [data-difficulty]').first().click();
  await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => fullscreenBusy)).toBe(false);
  await expect(page.locator('#fullscreen')).toHaveCSS('border-top-width', '4px');
  await expect(page.locator('#fullscreen')).toBeInViewport({ratio: 1});
  await page.screenshot({path: testInfo.outputPath('rainbow-fullscreen.png')});
  await page.locator('#fullscreen').click();
  await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => active)).toBe(true);
  await page.locator('#fullscreen').click();
  await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => { snapshot.over = true; snapshot.dying = false; render(); });
  await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#overlay')).toBeVisible();
  // Exercise the mobile fallback and a round ending during an in-flight request.
  await page.evaluate(async () => {
    selectGame('dodge');
    gameMain.requestFullscreen = () => new Promise((_, reject) => { window.rejectFullscreen = reject; });
    startGame('normal');
    exitGame();
    window.rejectFullscreen(new Error('Unsupported'));
  });
  await expect.poll(() => page.evaluate(() => fullscreenBusy)).toBe(false);
  await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('body')).not.toHaveClass(/game-fullscreen-open/);
});
