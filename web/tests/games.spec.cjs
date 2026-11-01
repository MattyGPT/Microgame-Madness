const { test, expect } = require("@playwright/test");
const path = require("node:path");
const fs = require("node:fs");

// Serve the exact pinned runtime locally in CI so CDN availability does not
// make game regressions intermittent. Production uses the same CDN version.
test.beforeEach(async ({ page }) => {
  await page.route(
    "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/**",
    (route) => {
      const file = path.basename(new URL(route.request().url()).pathname);
      const local = path.resolve("node_modules/pyodide", file);
      if (!fs.existsSync(local)) return route.abort();
      return route.fulfill({
        path: local,
        contentType: file.endsWith(".wasm")
          ? "application/wasm"
          : file.endsWith(".js")
            ? "application/javascript"
            : "application/octet-stream",
        headers: { "access-control-allow-origin": "*" },
      });
    },
  );
  await page.goto("/");
  await expect(page.locator("#runtime-status")).toContainText(
    "All games ready",
  );
});

test("home fits the viewport and Hangman scores survive reload", async ({
  page,
}, testInfo) => {
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
  );
  await expect(page.locator("#hangman-game")).toBeHidden();
  await page.locator('[data-difficulty="easy"]').click();
  await expect(page.locator("#scores-list")).toContainText("Browser Tester");
});

test("typing, arcade controls, pause, and all graphical modes work", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.locator('[data-game="keyboard"]').click();
  await expect(page.locator("#keyboard-game")).toBeHidden();
  await expect(page.locator("#difficulty-choices button")).toHaveCount(1);
  await page.locator('[data-difficulty="progressive"]').click();
  const sequence = await page.locator("#sequence").innerText();
  if (testInfo.project.name === "mobile")
    await page.locator("#typing-input").fill(sequence);
  else await page.keyboard.type(sequence);
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
      await page.locator('[data-key="Left"]').tap();
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
  await page.reload();
  await expect(page.locator("#overlay-title")).toHaveText(
    "The arcade needs a restart.",
  );
  await expect(page.locator("#overlay-action")).toHaveText("Reload arcade");
  await page.locator('[data-game="keyboard"]').click();
  await expect(page.locator("#overlay-action")).toBeVisible();
  await expect(page.locator("#overlay-action")).toHaveText("Reload arcade");
});

test("Pumpkin King offers four HP choices with separate scores", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("microgame-madness.v1", JSON.stringify({
    player: "Mode Tester",
    scores: {
      "pumpkin:coward": [{ player: "Mode Tester", score: 123 }],
      "pumpkin:phase2": [{ player: "Mode Tester", score: 456 }],
      "pumpkin:baby": [{ player: "Mode Tester", score: 789 }],
      "pumpkin:come_on": [{ player: "Mode Tester", score: 923 }],
    },
  })));
  await page.reload();
  await expect(page.locator("#runtime-status")).toContainText("All games ready");
  await page.locator('[data-game="pumpkin"]').click();
  await expect(page.locator("#difficulty-choices button")).toHaveCount(4);
  const coward = page.getByRole("button", { name: /^Coward Mode/ });
  await expect(coward).toContainText("10 HP");
  await coward.click();
  await expect(page.locator("#metric")).toHaveText("10 / 10");
  await expect(page.locator("#best")).toHaveText("123");
  await page.locator("#exit").click();
  await page.locator('[data-difficulty="phase2"]').click();
  await expect(page.locator("#metric")).toHaveText("5 / 5");
  await expect(page.locator("#best")).toHaveText("456");
  await page.locator("#exit").click();
  await coward.click();
  await expect(page.locator("#metric")).toHaveText("10 / 10");
  await page.locator("#exit").click();
  const baby = page.getByRole("button", { name: /^Baby Mode/ });
  await expect(baby).toContainText("15 HP");
  await baby.click();
  await expect(page.locator("#metric")).toHaveText("15 / 15");
  await expect(page.locator("#player-health-value")).toHaveText("15 / 15");
  await expect(page.locator("#best")).toHaveText("789");
  await page.locator("#exit").click();
  await baby.click();
  await expect(page.locator("#player-health-value")).toHaveText("15 / 15");
  await page.locator("#exit").click();
  const comeOn = page.getByRole("button", { name: /^Come On, Are You Really That Bad at the Game/ });
  await expect(comeOn).toContainText("23 HP");
  await comeOn.click();
  await expect(page.locator("#player-health-value")).toHaveText("23 / 23");
  await expect(page.locator("#metric")).toHaveText("23 / 23");
  await expect(page.locator("#best")).toHaveText("923");
  await page.locator("#exit").click();
  await comeOn.click();
  await expect(page.locator("#player-health-value")).toHaveText("23 / 23");
});

test("every boss difficulty shows player HP with the full play area in view", async ({ page }, testInfo) => {
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

test("welcome achievement fades, persists once, and collection tabs work", async ({ page }, testInfo) => {
  await page.evaluate(() => localStorage.removeItem('microgame-madness.v1'));
  await page.reload();
  const toast = page.locator('#achievement-toast');
  await expect(toast).toContainText('Welcome to Microgame Madness!');
  await expect(toast).toContainText('bronze achievement · +10 points');
  const box = await toast.boundingBox();
  expect(box.x).toBeLessThan(20);
  expect(box.y).toBeLessThan(20);
  await page.screenshot({ path: testInfo.outputPath('welcome-achievement.png') });
  await expect(page.locator('#profile-score')).toHaveText('10');
  await expect(toast).toBeHidden({ timeout: 7000 });
  await page.locator('#achievements-tab').click();
  await expect(page.locator('#achievements-panel')).toBeVisible();
  await expect(page.locator('#scores-panel')).toBeHidden();
  await expect(page.locator('.achievement-card')).toHaveCount(48);
  await page.locator('#achievement-filter').selectOption('earned');
  await expect(page.locator('.achievement-card:visible')).toHaveCount(1);
  await expect(page.locator('[data-achievement="welcome"]')).toContainText('Unlocked');
  await page.locator('#achievement-filter').selectOption('locked');
  await expect(page.locator('.achievement-card:visible')).toHaveCount(47);
  await page.locator('#achievements-tab').press('ArrowLeft');
  await expect(page.locator('#scores-tab')).toBeFocused();
  await expect(page.locator('#scores-panel')).toBeVisible();
  await page.reload();
  await expect(page.locator('#profile-score')).toHaveText('10');
  await expect(toast).toBeHidden();
});

test("real Hangman wins award the requested medals once and persist across reloads", async ({ page }, testInfo) => {
  // Fix only the random word so guesses still run through the real Python game.
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('random.choice(rules["words"])', '"cat"') });
  });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  for (let round = 0; round < 10; round++) {
    await page.locator(`[data-difficulty="${round === 1 ? 'hard' : 'easy'}"]`).click();
    if (round === 0) {
      await expect(page.locator('#profile-score')).toHaveText('20');
      await page.getByRole('button', { name: 'Guess Z', exact: true }).click();
    }
    for (const letter of 'CAT') await page.getByRole('button', { name: `Guess ${letter}`, exact: true }).click();
    await expect(page.locator('#overlay-title')).toHaveText('You did it!');
    if (round === 0) await expect(page.locator('#profile-score')).toHaveText('50');
    if (round === 1) await expect(page.locator('#profile-score')).toHaveText('110');
    if (round === 4) await expect(page.locator('#profile-score')).toHaveText('200');
    await page.locator('#overlay-action').click();
  }
  await expect(page.locator('#profile-score')).toHaveText('290');
  await page.locator('#achievements-tab').click();
  await page.locator('#achievement-filter').selectOption('earned');
  for (const id of ['play_hangman', 'hangman_win', 'hangman_hard', 'hangman_5', 'hangman_10'])
    await expect(page.locator(`[data-achievement="${id}"]`)).toContainText('Unlocked');
  await expect(page.locator('[data-achievement="hangman_10"]')).toContainText('Professional Prodigy');
  await page.locator('#achievements-panel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('achievement-collection.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(page.locator('#profile-score')).toHaveText('290');
  await page.locator('#achievements-tab').click();
  await expect(page.locator('[data-achievement="hangman_25"]')).toContainText('10 / 25');
  await page.locator('#scores-tab').click();
  await page.locator('#player').fill('New nickname');
  await page.locator('[data-difficulty="hard"]').click();
  await page.locator('#exit').click();
  await expect(page.locator('#profile-score')).toHaveText('290');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('microgame-madness.v1')).achievements.stats.hangmanWins)).toBe(10);
});

test("achievements remain usable when browser storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
  });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await page.locator('[data-difficulty="easy"]').click();
  await expect(page.locator('#profile-score')).toHaveText('20');
  await expect(page.locator('#storage-note')).toContainText('Scores and achievements last for this visit only');
  await page.locator('#achievements-tab').click();
  await expect(page.locator('[data-achievement="play_hangman"]')).toContainText('Unlocked');
});

test("Pumpkin King contact kills in every mode and restart restores health", async ({ page }) => {
  await page.locator('[data-game="pumpkin"]').click();
  await expect(page.locator('#welcome-copy')).toContainText('body or arms kills instantly');
  for (const [mode, hp] of [['phase2', 5], ['coward', 10], ['baby', 15], ['come_on', 23]]) {
    await page.locator(`[data-difficulty="${mode}"]`).click();
    await expect(page.locator('#player-health-value')).toHaveText(`${hp} / ${hp}`);
    // Move into the actual Python boss, rather than injecting a death snapshot.
    await page.keyboard.down('ArrowUp');
    await expect(page.locator('#overlay')).toBeVisible();
    await expect(page.locator('#overlay-title')).toHaveText('One more try?');
    await page.keyboard.up('ArrowUp');
    await expect(page.locator('#player-health-value')).toHaveText(`0 / ${hp}`);
    await expect(page.locator('#overlay-copy')).toContainText('His body and arms kill instantly');
    expect(await page.evaluate(() => damageFlashAnimation !== null)).toBe(true);
    await page.locator('#overlay-action').click();
  }
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('microgame-madness.v1')).achievements.stats);
  expect(progress.pumpkinWins).toBe(0);
  await page.locator('[data-difficulty="come_on"]').click();
  await expect(page.locator('#player-health-value')).toHaveText('23 / 23');
});

test('real Turtle Dodge evidence unlocks Close One and the crystal survival reward', async ({ page }) => {
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    let body = await response.text();
    body = body.replace('from dodge_model import DodgeGame', 'from dodge_model import Block, DodgeGame');
    body = body.replace('self.game = DodgeGame(difficulty=difficulty)',
      'self.game = DodgeGame(difficulty=difficulty)\n            self.game.x, self.game.y = 0, 0\n            self.game.elapsed = 119.95\n            self.game.spawn_in = 1000\n            self.game.blocks = [Block(25, 65, ((0, 0),), "red")]');
    await route.fulfill({ response, body });
  });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await page.locator('[data-game="dodge"]').click();
  await page.locator('[data-difficulty="easy"]').click();
  await expect(page.locator('#profile-score')).toHaveText('450');
  await page.locator('#pause').click();
  await page.locator('#achievements-tab').click();
  await expect(page.locator('[data-achievement="dodge_close"]')).toContainText('Unlocked');
  await expect(page.locator('[data-achievement="dodge_120"]')).toContainText("I'm Still Standing!");
  await expect(page.locator('[data-achievement="dodge_120"]')).toContainText('crystal · +270 points');
  await page.reload();
  await expect(page.locator('#profile-score')).toHaveText('450');
});

test('King of Suffering rejects a healed win and awards 810 for a true no-hit win', async ({ page }) => {
  let wounded = true;
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    const preparation = 'self.game = PumpkinKing(difficulty=difficulty)\n            from boss_crush import Projectile, HealingPickup\n            self.game.begin_attack(0)\n'
      + (wounded ? '            self.game.hurt()\n            self.game.healing_pickups = [HealingPickup(self.game.x, self.game.y)]\n            self.game.update_healing(.01)\n' : '')
      + '            self.game.hp = 5\n            self.game.shots = [Projectile(self.game.boss_x, self.game.boss_y, 0, 520)]';
    await route.fulfill({ response, body: (await response.text()).replace('self.game = PumpkinKing(difficulty=difficulty)', preparation) });
  });
  async function win() {
    await page.reload();
    await expect(page.locator('#runtime-status')).toContainText('All games ready');
    await page.locator('[data-game="pumpkin"]').click();
    await page.locator('[data-difficulty="baby"]').click();
    await expect(page.locator('#overlay-title')).toHaveText('You did it!');
    await expect(page.locator('#player-health-value')).toHaveText('15 / 15');
    await page.locator('#achievements-tab').click();
  }
  await win();
  await expect(page.locator('[data-achievement="pumpkin_flawless"]')).toContainText('Locked');
  await expect(page.locator('#profile-score')).toHaveText('50');
  wounded = false;
  await win();
  await expect(page.locator('[data-achievement="pumpkin_flawless"]')).toContainText('Unlocked');
  await expect(page.locator('#profile-score')).toHaveText('860');
  // Queued notifications keep the new tier and its reward as well.
  while (!(await page.locator('#achievement-toast').innerText()).includes('King of Suffering'))
    await page.getByRole('button', { name: 'Dismiss achievement notification' }).click();
  await expect(page.locator('#achievement-toast')).toContainText('diamond achievement · +810 points');
  await page.reload();
  await expect(page.locator('#profile-score')).toHaveText('860');
});

test('all five medal tiers have readable colored frames and reduced-motion support', async ({ page }, testInfo) => {
  await page.locator('#achievements-tab').click();
  await expect(page.locator('.achievement-legend')).toContainText('Crystal +270 · Diamond +810');
  for (const [tier, id] of [['bronze', 'welcome'], ['silver', 'hangman_win'], ['gold', 'hangman_5'],
    ['crystal', 'dodge_120'], ['diamond', 'pumpkin_flawless']]) {
    const card = page.locator(`[data-achievement="${id}"]`);
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveClass(/in-view/);
    const style = await card.evaluate(el => {
      const cs = getComputedStyle(el);
      return { background: cs.backgroundImage, color: cs.getPropertyValue('--medal'), shape: cs.clipPath,
        thickness: cs.paddingTop, shine: cs.animationName, sparkle: getComputedStyle(el, '::before').animationName,
        blend: cs.backgroundBlendMode, filter: cs.filter, frameColor: cs.backgroundColor,
        sparkleFilter: getComputedStyle(el, '::before').filter };
    });
    expect(style.background).toContain('linear-gradient');
    expect(style.color.trim()).not.toBe('');
    expect(style.thickness).toBe(['crystal', 'diamond'].includes(tier) ? '2px' : '4px');
    expect(style.shape.startsWith('polygon(')).toBe(['crystal', 'diamond'].includes(tier));
    expect(style.shine).toBe('medal-shine');
    expect(style.sparkle).toBe('medal-sparkle');
    expect(style.blend).toBe(id === 'welcome' ? 'normal' : 'multiply');
    expect(style.filter).toBe(id === 'welcome' ? 'none' : 'grayscale(1)');
    if (id !== 'welcome') expect(style.frameColor).toBe('rgb(102, 102, 102)');
    expect(style.sparkleFilter).toBe(id === 'welcome' ? 'none' : 'brightness(0.25)');
    await card.screenshot({ path: testInfo.outputPath(`medal-${tier}.png`) });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('diamond-collection.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const card = page.locator('[data-achievement="pumpkin_flawless"]');
  expect(await card.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  expect(await card.evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('none');
});

test('Pumpkin King arm-lift smashes and roar fire deal one HP in every mode', async ({ page }) => {
  let attack = 'slam';
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    const setup = 'self.game = PumpkinKing(difficulty=difficulty)\n            from pumpkin_king import Stage\n            from collections import deque\n            self.game.intro_done = True\n'
      + (attack === 'slam'
        ? '            self.game.x = -150\n            self.game.stage = Stage("raise", .1, "left")\n            self.game.queue = deque([Stage("slam", .15, "left"), Stage("break", 100)])'
        : '            self.game.stage = Stage("roar", .1)\n            self.game.queue = deque([Stage("fire", .3), Stage("break", 100)])');
    await route.fulfill({ response, body: (await response.text()).replace('self.game = PumpkinKing(difficulty=difficulty)', setup) });
  });
  for (attack of ['slam', 'fire']) {
    await page.reload();
    await expect(page.locator('#runtime-status')).toContainText('All games ready');
    await page.locator('[data-game="pumpkin"]').click();
    for (const [mode, hp] of [['phase2', 5], ['coward', 10], ['baby', 15], ['come_on', 23]]) {
      await page.locator(`[data-difficulty="${mode}"]`).click();
      await expect(page.locator('#player-health-value')).toHaveText(`${hp - 1} / ${hp}`);
      expect(await page.evaluate(() => damageFlashAnimation !== null)).toBe(true);
      await expect(page.locator('#overlay')).toBeHidden();
      await page.locator('#pause').click();
      await expect(page.locator('#overlay-title')).toHaveText('Take a breather.');
      await page.locator('#exit').click();
    }
  }
});

test('Gerson Boom unlocks at 360 seconds with 810 points and survives reload', async ({ page }) => {
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('self.game = DodgeGame(difficulty=difficulty)',
      'self.game = DodgeGame(difficulty=difficulty)\n            self.game.elapsed = 359.95\n            self.game.spawn_in = 1000') });
  });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await page.locator('[data-game="dodge"]').click();
  await page.locator('[data-difficulty="easy"]').click();
  await expect(page.locator('#profile-score')).toHaveText('1230');
  await page.locator('#pause').click();
  await page.locator('#achievements-tab').click();
  const card = page.locator('[data-achievement="dodge_360"]');
  await expect(card).toContainText('Gerson Boom');
  await expect(card).toContainText('diamond · +810 points');
  await expect(card).toContainText('Unlocked');
  await page.reload();
  await expect(page.locator('#profile-score')).toHaveText('1230');
});

test('Domination rewards a no-damage Mean win and restores the unlocked frame shine', async ({ page }, testInfo) => {
  let wounded = true;
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    const setup = 'self.game = BossCrush(difficulty)\n            from boss_crush import Projectile\n'
      + (wounded ? '            self.game.hurt()\n' : '')
      + '            self.game.hp = 5\n            self.game.shots = [Projectile(self.game.boss_x, self.game.boss_y, 0, 520)]';
    await route.fulfill({ response, body: (await response.text()).replace('self.game = BossCrush(difficulty)', setup) });
  });
  for (const score of [50, 80]) {
    await page.reload();
    await expect(page.locator('#runtime-status')).toContainText('All games ready');
    await page.locator('[data-game="boss"]').click();
    await page.locator('[data-difficulty="mean"]').click();
    await expect(page.locator('#overlay-title')).toHaveText('You did it!');
    await expect(page.locator('#profile-score')).toHaveText(String(score));
    await page.locator('#achievements-tab').click();
    const card = page.locator('[data-achievement="boss_mean_flawless"]');
    await expect(card).toContainText(wounded ? 'Locked' : 'Unlocked');
    expect(await card.evaluate(el => getComputedStyle(el).backgroundBlendMode)).toBe(wounded ? 'multiply' : 'normal');
    expect(await card.evaluate(el => getComputedStyle(el).filter)).toBe(wounded ? 'grayscale(1)' : 'none');
    await card.screenshot({ path: testInfo.outputPath(wounded ? 'locked-silver.png' : 'unlocked-silver.png') });
    wounded = false;
  }
  await page.reload();
  await expect(page.locator('#profile-score')).toHaveText('80');
});

test("chiptune audio switches for every Pumpkin mode and obeys pause, mute, and visibility", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await expect(page.locator("#sound")).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => typeof audioContext)).toBe("undefined");
  await page.locator('[data-game="pumpkin"]').click();
  await expect.poll(() => page.evaluate(() => audioContext.state)).toBe("running");
  expect(await page.evaluate(() => musicPlayer.theme)).toBe("arcade");
  await page.evaluate(() => {
    window.musicProbe = audioContext.createAnalyser();
    audioMaster.connect(window.musicProbe);
  });
  const level = () => page.evaluate(() => {
    const samples = new Float32Array(window.musicProbe.fftSize);
    window.musicProbe.getFloatTimeDomainData(samples);
    return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
  });
  await expect.poll(level).toBeGreaterThan(.001);
  for (const mode of ["phase2", "coward", "baby", "come_on"]) {
    await page.locator(`[data-difficulty="${mode}"]`).click();
    expect(await page.evaluate(() => musicPlayer.theme)).toBe("pumpkin");
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
    expect(await page.evaluate(() => musicPlayer.current.source.loop)).toBe(true);
    await page.locator("#pause").click();
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
    expect(await page.evaluate(() => musicPlayer.offset)).toBeGreaterThan(0);
    await page.locator("#overlay-action").click();
    expect(await page.evaluate(() => musicPlayer.current.offset)).toBeGreaterThan(0);
    await page.locator("#sound").click();
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
    await expect.poll(level).toBe(0);
    await page.locator("#sound").click();
    await expect.poll(level).toBeGreaterThan(.001);
    expect(await page.evaluate(() => musicPlayer.theme)).toBe("pumpkin");
    await page.locator("#exit").click();
    expect(await page.evaluate(() => musicPlayer.theme)).toBe("arcade");
  }
  // Losing the fight returns to the arcade score, without leaving two loops.
  await page.locator('[data-difficulty="phase2"]').click();
  await page.keyboard.down("ArrowUp");
  await expect(page.locator("#overlay")).toBeVisible();
  await page.keyboard.up("ArrowUp");
  expect(await page.evaluate(() => musicPlayer.theme)).toBe("arcade");
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  // Simulate the browser visibility event: hidden tabs are silent.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(level).toBeGreaterThan(.001);
  await page.locator('[data-game="hangman"]').click();
  await page.locator('[data-difficulty="easy"]').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe("arcade");
  expect(errors).toEqual([]);
});

test("games remain playable when browser audio is unavailable", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    window.AudioContext = class { constructor() { throw new Error("Audio disabled"); } };
  });
  await page.reload();
  await expect(page.locator("#runtime-status")).toContainText("All games ready");
  await page.locator('[data-difficulty="easy"]').click();
  await expect(page.locator("#sound")).toHaveText("Sound unavailable");
  await expect(page.locator("#hangman-game")).toBeVisible();
  await page.getByRole("button", { name: "Guess A", exact: true }).click();
  await expect(page.getByRole("button", { name: "Guess A", exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('mascot floats and blinks, and every boss mode flashes only for damage', async ({ page }) => {
  const face = page.locator('.pixel-face');
  expect(await face.evaluate(el => getComputedStyle(el).animationName)).toBe('mascot-float');
  expect(await face.locator('i').first().evaluate(el => getComputedStyle(el).animationName)).toBe('mascot-blink');
  const poses = await face.evaluate(el => {
    const float = el.getAnimations()[0], blink = el.querySelector('i').getAnimations()[0];
    float.pause(); blink.pause();
    float.currentTime = 0; blink.currentTime = 0;
    const normal = [getComputedStyle(el).transform, getComputedStyle(el.querySelector('i')).transform];
    float.currentTime = 1900; blink.currentTime = 4512;
    return { normal, animated: [getComputedStyle(el).transform, getComputedStyle(el.querySelector('i')).transform] };
  });
  expect(poses.animated[0]).not.toBe(poses.normal[0]);
  expect(poses.animated[1]).not.toBe(poses.normal[1]);
  for (const [game, modes] of [['boss', ['mean', 'cruel', 'nightmare', 'impossible']],
    ['pumpkin', ['phase2', 'coward', 'baby', 'come_on']]]) {
    await page.locator(`[data-game="${game}"]`).click();
    for (const mode of modes) {
      await page.locator(`[data-difficulty="${mode}"]`).click();
      await page.locator('#pause').click();
      expect(await page.evaluate(() => damageFlashAnimation)).toBe(null);
      await page.evaluate(() => {
        snapshot.lives--; snapshot.damage_taken++; render();
        damageFlashAnimation.pause(); damageFlashAnimation.currentTime = 0;
      });
      await expect(page.locator('#damage-flash')).toHaveCSS('opacity', '1');
      await expect(page.locator('#damage-flash')).toHaveCSS('pointer-events', 'none');
      expect(await page.locator('#damage-flash').evaluate(el => {
        const box = el.getBoundingClientRect();
        return box.width === innerWidth && box.height === innerHeight && box.top === 0 && box.left === 0;
      })).toBe(true);
      expect(await page.evaluate(() => {
        const flash = damageFlashAnimation;
        render(); snapshot.lives++; render();
        return damageFlashAnimation === flash;
      })).toBe(true);
      // Damage and healing together still need feedback, even with unchanged HP.
      expect(await page.evaluate(() => {
        const flash = damageFlashAnimation;
        snapshot.damage_taken++; render();
        return damageFlashAnimation !== flash;
      })).toBe(true);
      await expect(page.locator('#damage-flash')).toHaveCSS('opacity', '0');
      await page.locator('#exit').click();
      expect(await page.evaluate(() => damageFlashAnimation)).toBe(null);
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await face.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  expect(await face.locator('i').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await expect(page.locator('#damage-flash')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page.locator('[data-game="hangman"]').click();
  await page.locator('[data-difficulty="easy"]').click();
  await page.getByRole('button', { name: 'Guess Z', exact: true }).click();
  expect(await page.evaluate(() => damageFlashAnimation)).toBe(null);
});

test('DINGDONG turns the screen red for four seconds and resumes the same music', async ({ page }) => {
  await page.locator('#player').click();
  await expect.poll(() => page.evaluate(() => musicPlayer?.current !== null && audioContext.currentTime > .1)).toBe(true);
  await page.locator('#player').fill('DINGDON');
  await expect(page.locator('#name-surprise')).toBeHidden();
  await page.evaluate(() => {
    window.nameEffectTimes = [];
    new MutationObserver(() => window.nameEffectTimes.push(performance.now()))
      .observe(document.getElementById('name-surprise'), { attributes: true, attributeFilter: ['hidden'] });
  });
  await page.locator('#player').fill('DINGDONG');
  await expect(page.locator('#name-surprise')).toBeVisible();
  await expect(page.locator('#name-surprise')).toHaveCSS('background-color', 'rgba(210, 0, 0, 0.72)');
  await expect(page.locator('#name-surprise')).toHaveCSS('pointer-events', 'none');
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
  const offset = await page.evaluate(() => musicPlayer.offset);
  expect(offset).toBeGreaterThan(0);
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  // Repeated matching input events must not restart or prolong the effect.
  await page.locator('#player').dispatchEvent('input');
  await expect(page.locator('#name-surprise')).toBeHidden({ timeout: 6500 });
  const times = await page.evaluate(() => window.nameEffectTimes);
  expect(times).toHaveLength(2);
  expect(times[1] - times[0]).toBeGreaterThanOrEqual(3900);
  expect(times[1] - times[0]).toBeLessThan(6000);
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  expect(await page.evaluate(() => musicPlayer.current.offset)).toBeCloseTo(offset, 3);
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
});

test('DINGDONG can repeat, does not block play, and preserves mute and pause choices', async ({ page }) => {
  await page.locator('#sound').click();
  await page.locator('#player').fill('dingdong');
  await expect(page.locator('#name-surprise')).toBeVisible();
  await page.locator('[data-game="pumpkin"]').click();
  await page.locator('[data-difficulty="baby"]').click();
  await page.locator('#pause').click();
  await expect(page.locator('#name-surprise')).toBeHidden({ timeout: 6500 });
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => typeof audioContext)).toBe('undefined');
  await page.locator('#sound').click();
  expect(await page.evaluate(() => musicPlayer.current)).toBe(null);
  await page.locator('#overlay-action').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('pumpkin');
  await page.locator('#exit').click();
  await page.locator('#player').fill('Player');
  await page.locator('#player').fill('DINGDONG');
  await expect(page.locator('#name-surprise')).toBeVisible();
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
  await page.locator('#sound').click();
  await expect(page.locator('#name-surprise')).toBeHidden({ timeout: 6500 });
  expect(await page.evaluate(() => musicPlayer.current)).toBe(null);
  await page.locator('#sound').click();
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
});

test('secret achievements persist, and the cube blushes and squeaks with mouse, touch, and keyboard', async ({ page }, testInfo) => {
  const cube = page.getByRole('button', { name: 'Pet the cube' });
  await expect(cube).toBeVisible();
  await page.locator('#player').click();
  await page.evaluate(() => {
    window.squeaks = [];
    const create = audioContext.createOscillator.bind(audioContext);
    audioContext.createOscillator = () => {
      const oscillator = create();
      window.squeaks.push(oscillator);
      return oscillator;
    };
  });
  if (testInfo.project.name === 'mobile') await cube.tap();
  else await cube.click();
  await expect(cube).toHaveClass(/blushing/);
  await expect.poll(() => cube.evaluate(el => Number(getComputedStyle(el, '::before').opacity))).toBeGreaterThan(.9);
  expect(await page.evaluate(() => window.squeaks.map(osc => osc.type))).toEqual(['sine']);
  await expect(page.locator('#profile-score')).toHaveText('100');
  await cube.screenshot({ path: testInfo.outputPath('blushing-cube.png') });
  await expect(cube).not.toHaveClass(/blushing/);
  await cube.press('Enter');
  await expect(cube).toHaveClass(/blushing/);
  await expect(page.locator('#profile-score')).toHaveText('100');
  await page.locator('#sound').click();
  await cube.press('Space');
  expect(await page.evaluate(() => window.squeaks.length)).toBe(2);
  await page.locator('#player').fill('DINGDONG');
  await expect(page.locator('#profile-score')).toHaveText('370');
  await page.locator('#name-surprise').waitFor({ state: 'hidden' });
  await page.locator('#achievements-tab').click();
  for (const [id, tier, title, description] of [
    ['dingdong', 'crystal', 'DINGDONG', 'WHO YOU ARE.'],
    ['cube_pet', 'gold', 'Awwwwww!', 'Make the cube blush and squeak.'],
  ]) {
    const card = page.locator(`[data-achievement="${id}"]`);
    await expect(card).toHaveAttribute('data-tier', tier);
    await expect(card).toContainText(title);
    await expect(card).toContainText(description);
    await expect(card).toContainText('Unlocked');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  await expect(page.locator('#profile-score')).toHaveText('370');
  await cube.click();
  await page.locator('#player').fill('DINGDONG');
  await expect(page.locator('#profile-score')).toHaveText('370');
});

test('winning real Hangman on the last guess awards Down to the Wire once', async ({ page }) => {
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('random.choice(rules["words"])', '"cat"') });
  });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready');
  for (const [difficulty, wrong] of [['easy', 'bdefghijk'], ['medium', 'bdefgh'], ['hard', 'bdef']]) {
    await page.locator(`[data-difficulty="${difficulty}"]`).click();
    for (const letter of wrong.toUpperCase()) await page.getByRole('button', { name: `Guess ${letter}`, exact: true }).click();
    await expect(page.locator('#metric')).toHaveText('1');
    if (difficulty === 'easy') {
      const data = await page.evaluate(() => JSON.parse(localStorage.getItem('microgame-madness.v1')).achievements);
      expect(data.unlocked.hangman_last_chance).toBeUndefined();
    }
    for (const letter of 'CAT') await page.getByRole('button', { name: `Guess ${letter}`, exact: true }).click();
    await expect(page.locator('#overlay-title')).toHaveText('You did it!');
    await expect(page.locator('#profile-score')).toHaveText(difficulty === 'hard' ? '170' : '140');
    await page.locator('#overlay-action').click();
  }
  await page.reload();
  await expect(page.locator('#profile-score')).toHaveText('170');
  await page.locator('#achievements-tab').click();
  const card = page.locator('[data-achievement="hangman_last_chance"]');
  await expect(card).toContainText('Down to the Wire');
  await expect(card).toHaveAttribute('data-tier', 'gold');
  await expect(card).toContainText('Unlocked');
});
