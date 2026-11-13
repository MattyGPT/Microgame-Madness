const { leaveFullscreen } = require('./fixtures/game.cjs');
const { test, expect, openGame } = require('./fixtures/game.cjs');
test('Chaos has 55 orbiting blocks and randomizes on each selection visit', async ({ page }) => {
  await openGame(page);
  await leaveFullscreen(page);
  await page.locator('[data-game="dodge"]').click();
  const card = page.locator('[data-difficulty="chaos"]');
  await expect(card.locator('.chaos-border-block')).toHaveCount(55);
  const edgeErrors = await card.locator('.chaos-border-flight').evaluate(orbit => {
    const bounds = orbit.getBoundingClientRect();
    const errors = [];
    for (const block of orbit.children) {
      const animation = block.getAnimations()[0];
      animation.pause();
      const timing = animation.effect.getTiming();
      for (const fraction of [.125, .375, .625, .875]) {
        animation.currentTime = timing.delay + timing.duration * (2 + fraction);
        const box = block.getBoundingClientRect();
        const x = box.x + box.width / 2, y = box.y + box.height / 2;
        const distance = Math.min(Math.abs(x - bounds.left), Math.abs(x - bounds.right),
          Math.abs(y - bounds.top), Math.abs(y - bounds.bottom));
        if (distance > 1) errors.push(distance);
      }
      animation.play();
    }
    return errors;
  });
  expect(edgeErrors).toEqual([]);
  const first = await card.locator('.chaos-border-flight').innerHTML();
  expect(await card.locator('.chaos-border-block').evaluateAll(nodes => nodes.every(n => n.complete && n.naturalWidth > 0))).toBe(true);
  expect(await card.evaluate(n => n.getAnimations({ subtree: true }).length)).toBe(57);
  await leaveFullscreen(page);
  await page.locator('[data-game="hangman"]').click();
  await leaveFullscreen(page);
  await page.locator('[data-game="dodge"]').click();
  expect(await card.locator('.chaos-border-flight').innerHTML()).not.toBe(first);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await card.evaluate(n => n.getAnimations({ subtree: true }).length)).toBe(0);
  await card.click();
  await expect(page.locator('#game-canvas')).toBeVisible();
});

test('all Dodge borders use requested counts, increasing speeds and smaller Impossible blocks', async ({ page }) => {
  await openGame(page);
  await leaveFullscreen(page);
  await page.locator('[data-game="dodge"]').click();
  const stats = await page.locator('.dodge-border-card').evaluateAll(cards => cards.map(card => {
    const blocks = [...card.querySelectorAll('.chaos-border-block')];
    return { id: card.dataset.difficulty, count: blocks.length, border: card.style.borderColor,
      times: blocks.map(n => parseFloat(n.style.getPropertyValue('--flight-time'))),
      sizes: blocks.map(n => parseFloat(n.style.getPropertyValue('--block-size'))) };
  }));
  expect(stats.map(s => s.count)).toEqual([20, 35, 38, 40, 48, 55]);
  for (let i = 1; i < 5; i++) expect(Math.max(...stats[i].times)).toBeLessThan(Math.min(...stats[i-1].times));
  expect(Math.max(...stats[4].sizes)).toBeLessThan(Math.min(...stats[3].sizes));
  expect(stats[3].border).toBe('rgb(255, 48, 48)');
  expect(stats[4].border).toBe('rgb(255, 255, 255)');
  await leaveFullscreen(page);
  await page.locator('[data-game="hangman"]').click();
  await expect(page.locator('.chaos-border-block')).toHaveCount(0);
});

test('Chaos card includes newly registered catalog blocks without a card-specific list', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => {
    // Force the appended block's weighted interval, without changing its weight.
    chaosGuideBlocks.push({ id: 'future_catalog_block', name: 'Future block', color: '#57b9ff', weight: 2 });
    const originalPick = ChaosArt.pickBlock;
    ChaosArt.pickBlock = blocks => originalPick(blocks, () => .999999999);
  });
  await leaveFullscreen(page);
  await page.locator('[data-game="dodge"]').click();
  const blocks = page.locator('[data-difficulty="chaos"] .chaos-border-block');
  await expect(blocks).toHaveCount(55);
  expect(await blocks.evaluateAll(nodes => nodes.every(n => n.dataset.block === 'future_catalog_block'))).toBe(true);
  await expect.poll(() => blocks.evaluateAll(nodes => nodes.every(n => n.complete && n.naturalWidth > 0))).toBe(true);
});
