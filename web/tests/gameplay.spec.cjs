const { test, expect, openGame } = require('./fixtures/game.cjs');

// Keep unrelated score assertions independent of the randomly selected song.
test.use({ deterministicMusic: true });

test("home fits the viewport and Hangman scores survive reload", async ({
  page,
}, testInfo) => {
  await openGame(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("arcade-home.png"),
    fullPage: true,
  });
  await page.locator("#player").fill("Browser Tester");
  await expect(page.locator("#hangman-game")).toBeHidden();
  await expect(page.locator("#difficulty-choices button")).toHaveCount(3);
  await page.locator('[data-difficulty="easy"]').click();
  await page.getByRole("button", { name: "Guess Z", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Guess Z", exact: true }),
  ).toBeDisabled();
  // Expanded dictionaries include Z words, so a correct guess keeps all attempts.
  const revealedZ = (await page.locator("#word").innerText()).includes("z");
  await expect(page.locator("#metric")).toHaveText(revealedZ ? "10" : "9");
  // Complete a round through the public alphabet UI; either outcome saves a score.
  for (const letter of "abcdefghijklmnopqrstuvwxy") {
    if (await page.locator("#overlay").isVisible()) break;
    const button = page.getByRole("button", {
      name: `Guess ${letter.toUpperCase()}`,
      exact: true,
    });
    if (await button.isEnabled()) await button.click();
  }
  await expect(page.locator("#overlay")).toBeVisible();
  await expect(page.locator("#scores-list")).toContainText("Browser Tester");
  await page.locator("#overlay-action").click();
  await expect(page.locator("#difficulty-choices")).toBeVisible();
  await expect(page.locator("#hangman-game")).toBeHidden();
  await page.locator('[data-difficulty="medium"]').click();
  await expect(page.locator("#metric")).toHaveText("7");
  await expect(page.locator("#scores-list")).not.toContainText("Browser Tester");
  await page.reload();
  await expect(page.locator("#runtime-status")).toContainText(
    "All games ready",
    { timeout: 30000 },
  );
  await expect(page.locator("#hangman-game")).toBeHidden();
  await page.locator('[data-difficulty="easy"]').click();
  await expect(page.locator("#scores-list")).toContainText("Browser Tester");
});

test("typing, arcade controls, pause, and all graphical modes work", async ({
  page,
}, testInfo) => {
  await openGame(page);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.locator('[data-game="keyboard"]').click();
  await expect(page.locator("#keyboard-game")).toBeHidden();
  await expect(page.locator("#difficulty-choices button")).toHaveCount(1);
  await page.locator('[data-difficulty="progressive"]').click();
  const sequence = await page.locator("#sequence").innerText();
  if (testInfo.project.name === "mobile") {
    for (const letter of sequence)
      await page.getByRole('button', { name: `Type ${letter}`, exact: true }).tap();
  } else await page.keyboard.type(sequence);
  await expect(page.locator("#score")).toHaveText("1");
  await page.locator("#exit").click();
  for (const mode of ["dodge", "boss", "pumpkin"]) {
    await page.locator(`[data-game="${mode}"]`).click();
    await expect(page.locator("#game-canvas")).toBeHidden();
    await page.locator("#arena").focus();
    await page.keyboard.press("Space");
    await expect(page.locator("#game-canvas")).toBeHidden();
    await expect(page.locator("#difficulty-choices")).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`${mode}-difficulty.png`),
      fullPage: true,
    });
    // Native button keyboard activation also makes an explicit choice.
    await page.locator("#difficulty-choices button").first().press("Enter");
    await expect(page.locator("#game-canvas")).toBeVisible();
    await page.locator("#pause").click();
    await expect(page.locator("#overlay-title")).toHaveText("Take a breather.");
    await page.screenshot({
      path: testInfo.outputPath(`${mode}-paused.png`),
      fullPage: true,
    });
    await page.locator("#overlay-action").click();
    await expect(page.locator("#overlay")).toBeHidden();
    if (testInfo.project.name === "mobile") {
      await expect(page.locator("#touch-controls")).toBeVisible();
      await page.locator("#touch-joystick").tap({ position: { x: 10, y: 52 } });
    } else {
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("f");
    }
    await page.screenshot({
      path: testInfo.outputPath(`${mode}-playing.png`),
      fullPage: true,
    });
    await page.locator("#exit").click();
  }
  await page.locator('[data-game="dodge"]').click();
  await page.locator('[data-difficulty="merciless"]').click();
  await expect(page.locator("#pause")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(page.locator("#game-canvas")).toBeHidden();
  await expect(page.locator("#difficulty-choices")).toBeVisible();
  const achievements = await page.evaluate(() => JSON.parse(localStorage.getItem('microgame-madness.v1')).achievements.unlocked);
  for (const id of ['play_keyboard', 'typing_1', 'play_dodge', 'play_boss', 'play_pumpkin'])
    expect(achievements[id]).toBeTruthy();
  expect(errors).toEqual([]);
});

test("missing runtime shows a recoverable loading error", async ({ page }) => {
  await page.route("**/python-files.json", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto('/');
  await expect(page.locator("#overlay-title")).toHaveText(
    "The arcade needs a restart.",
  );
  await expect(page.locator("#overlay-action")).toHaveText("Reload arcade");
  await page.locator('[data-game="keyboard"]').click();
  await expect(page.locator("#overlay-action")).toBeVisible();
  await expect(page.locator("#overlay-action")).toHaveText("Reload arcade");
});

test("every boss difficulty shows player HP with the full play area in view", async ({ page }, testInfo) => {
  await openGame(page);
  await page.setViewportSize(testInfo.project.name === "mobile"
    ? { width: 393, height: 727 } : { width: 1280, height: 720 });
  for (const [mode, difficulty, hp] of [
    ["boss", "mean", 3], ["boss", "cruel", 3],
    ["boss", "nightmare", 3], ["boss", "impossible", 5],
    ["pumpkin", "phase2", 5], ["pumpkin", "coward", 10],
    ["pumpkin", "baby", 15], ["pumpkin", "come_on", 23],
  ]) {
    await page.locator(`[data-game="${mode}"]`).click();
    await page.locator(`[data-difficulty="${difficulty}"]`).click();
    await expect(page.locator("#player-health-value")).toHaveText(`${hp} / ${hp}`);
    await expect(page.locator("#arena")).toBeInViewport({ ratio: 1 });
    await expect(page.locator("#player-health")).toBeInViewport({ ratio: 1 });
    await expect(page.locator("#exit")).toBeInViewport({ ratio: 1 });
    if (testInfo.project.name === "mobile")
      await expect(page.locator("#touch-controls")).toBeInViewport({ ratio: 1 });
    await page.locator("#pause").click();
    await expect(page.locator("#player-health")).toBeVisible();
    await page.locator("#exit").click();
    await expect(page.locator("#player-health")).toBeHidden();
  }
});

test("boss play area fits after resizing and HP display tracks damage and healing", async ({ page }, testInfo) => {
  await openGame(page);
  await page.locator('[data-game="pumpkin"]').click();
  await page.locator('[data-difficulty="coward"]').click();
  await page.locator("#pause").click();
  for (const size of [{ width: 1366, height: 768 }, { width: 1024, height: 600 },
    { width: 390, height: 640 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    await expect(page.locator("#arena")).toBeInViewport({ ratio: 1 });
    await expect(page.locator("#exit")).toBeInViewport({ ratio: 1 });
    if (testInfo.project.name === "mobile")
      await expect(page.locator("#touch-controls")).toBeInViewport({ ratio: 1 });
    const ratio = await page.locator("#game-canvas").evaluate(canvas =>
      canvas.getBoundingClientRect().width / canvas.getBoundingClientRect().height);
    expect(ratio).toBeCloseTo(680 / 560, 2);
    await expect(page.locator("#overlay-action")).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: testInfo.outputPath(`fit-${size.width}-${size.height}.png`) });
  }
  // Feed damage/healing snapshots through the real renderer without advancing combat.
  await page.evaluate(() => { active = false; snapshot.lives = 1; render(); });
  await expect(page.locator("#player-health-value")).toHaveText("1 / 10");
  await expect(page.locator("#player-health")).toHaveAttribute("data-low", "true");
  await page.evaluate(() => { snapshot.lives = 10; render(); });
  await expect(page.locator("#player-health-value")).toHaveText("10 / 10");
  await expect(page.locator("#player-health")).toHaveAttribute("data-low", "false");
});

test('Key Rush touch keyboard handles case and symbols without opening the device keyboard', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Touchscreen controls');
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'sequence, seconds = make_round(self.completed + 1)', 'sequence, seconds = ("aA7?", 600)') });
  });
  await openGame(page);
  await page.locator('[data-game="keyboard"]').click();
  await page.locator('[data-difficulty="progressive"]').click();
  await expect(page.locator('#typing-touch')).toBeVisible();
  await expect(page.locator('#typing-input')).not.toBeFocused();
  await page.locator('[data-typing-key="a"]').tap();
  await page.locator('#typing-shift').tap();
  await expect(page.locator('[data-typing-key="A"]')).toBeVisible();
  await page.locator('[data-typing-key="A"]').tap();
  await page.locator('#typing-symbols').tap();
  await expect(page.locator('[data-typing-key="7"]')).toBeVisible();
  await expect(page.locator('[data-typing-key="?"]')).toBeVisible();
  await page.locator('[data-typing-key="7"]').tap();
  await page.locator('[data-typing-key="?"]').tap();
  await expect(page.locator('#score')).toHaveText('1');
  await page.locator('#typing-symbols').tap();
  await expect(page.locator('[data-typing-key="A"]')).toBeVisible();
  await page.locator('#typing-shift').tap();
  await expect(page.locator('[data-typing-key="a"]')).toBeVisible();
  expect(await page.locator('#sequence').evaluate(el => getComputedStyle(el).userSelect)).toBe('none');
  expect(await page.locator('#typing-input').evaluate(el => getComputedStyle(el).userSelect)).toBe('text');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => {
    document.querySelectorAll('#achievement-toast button').forEach(button => button.click());
    document.querySelector('#achievement-celebrations').replaceChildren();
  });
  await page.locator('#keyboard-game').screenshot({ path: testInfo.outputPath('mobile-key-rush.png') });
  expect(errors).toEqual([]);
});

test('mobile joystick supports diagonals, a second finger, and safe release in every arcade game', async ({ page }, testInfo) => {
  await openGame(page);
  test.skip(testInfo.project.name !== 'mobile', 'Touch controls require a coarse pointer');
  const client = await page.context().newCDPSession(page);
  const touch = (type, touchPoints) => client.send('Input.dispatchTouchEvent', { type, touchPoints });
  await page.evaluate(() => unlockSingularity(false));
  for (const mode of ['dodge', 'boss', 'pumpkin', 'singularity']) {
    await page.locator(`[data-game="${mode}"]`).click();
    await page.locator('#difficulty-choices button').first().click();
    // Freeze combat while exercising real touch input so enemy hits cannot end the test.
    await page.evaluate(() => { lastFrame = performance.now(); window.requestAnimationFrame = () => 0; });
    const stick = page.locator('#touch-joystick');
    await expect(stick).toBeInViewport({ ratio: 1 });
    await expect(page.locator('[data-key="Left"]')).toHaveCount(0);
    const box = await stick.boundingBox();
    const center = { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await touch('touchStart', [center]);
    await expect.poll(() => page.evaluate(() => [...joystickKeys])).toEqual([]);
    const diagonal = { ...center, x: center.x + 24, y: center.y - 24 };
    await touch('touchMove', [diagonal]);
    await expect.poll(() => page.evaluate(() => [...joystickKeys].sort())).toEqual(['Right', 'Up']);
    if (['boss', 'pumpkin'].includes(mode)) {
      const fire = await page.locator('#touch-fire').boundingBox();
      const second = { id: 2, x: fire.x + fire.width / 2, y: fire.y + fire.height / 2 };
      await touch('touchStart', [diagonal, second]);
      await expect.poll(() => page.evaluate(() => keys.has('f'))).toBe(true);
      await expect.poll(() => page.evaluate(() => [...joystickKeys].sort())).toEqual(['Right', 'Up']);
      await touch('touchEnd', [second]);
      await expect.poll(() => page.evaluate(() => keys.has('f'))).toBe(false);
    }
    await touch('touchMove', [{ ...center, x: center.x - 85 }]);
    await expect.poll(() => page.evaluate(() => [...joystickKeys])).toEqual(['Left']);
    await touch('touchCancel', []);
    await expect.poll(() => page.evaluate(() => [...joystickKeys])).toEqual([]);
    await expect(stick).not.toHaveClass(/pressed/);
    await touch('touchStart', [diagonal]);
    await page.evaluate(() => clearKeys());
    await expect.poll(() => page.evaluate(() => [...joystickKeys])).toEqual([]);
    await touch('touchEnd', []);
    await touch('touchStart', [diagonal]);
    await touch('touchEnd', []);
    await expect.poll(() => page.evaluate(() => [...joystickKeys])).toEqual([]);
    await page.locator('#exit').click();
  }
});
