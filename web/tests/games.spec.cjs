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

test("Pumpkin King offers Coward Mode with ten HP and separate scores", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("microgame-madness.v1", JSON.stringify({
    player: "Mode Tester",
    scores: {
      "pumpkin:coward": [{ player: "Mode Tester", score: 123 }],
      "pumpkin:phase2": [{ player: "Mode Tester", score: 456 }],
    },
  })));
  await page.reload();
  await expect(page.locator("#runtime-status")).toContainText("All games ready");
  await page.locator('[data-game="pumpkin"]').click();
  await expect(page.locator("#difficulty-choices button")).toHaveCount(2);
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
});

test("every boss difficulty shows player HP with the full play area in view", async ({ page }, testInfo) => {
  await page.setViewportSize(testInfo.project.name === "mobile"
    ? { width: 393, height: 727 } : { width: 1280, height: 720 });
  for (const [mode, difficulty, hp] of [
    ["boss", "mean", 3], ["boss", "cruel", 3],
    ["boss", "nightmare", 3], ["boss", "impossible", 5],
    ["pumpkin", "phase2", 5], ["pumpkin", "coward", 10],
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
