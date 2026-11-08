const { test, expect, openGame } = require('./fixtures/game.cjs');
test('Dodge ocean cycles through 24 creatures with seven reused actors', async ({ page }) => {
  await openGame(page);
  const card = page.locator('[data-game="dodge"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('symbol[id^="ocean-"]')).toHaveCount(24);
  await expect(card.locator('.ocean-swimmer')).toHaveCount(7);
  const result = await card.evaluate(card => {
    const actors = [...card.querySelectorAll('.ocean-swimmer')];
    const seen = new Set(actors.map(n => n.dataset.species));
    for (let i = 0; i < 17; i++) {
      const actor = actors[i % actors.length];
      actor.dispatchEvent(new AnimationEvent('animationiteration'));
      seen.add(actor.dataset.species);
    }
    return { seen: seen.size, valid: actors.every(n => document.getElementById(n.dataset.species)) };
  });
  expect(result).toEqual({ seen: 24, valid: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await card.locator('.ocean-creatures').evaluate(n => n.getAnimations({subtree:true}).length)).toBe(0);
  await card.click();
  await expect(page.locator('[data-difficulty="chaos"]')).toBeVisible();
});
