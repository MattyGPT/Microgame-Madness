const { leaveFullscreen } = require('./fixtures/game.cjs');
const { test, expect, openGame } = require('./fixtures/game.cjs');

test('Wild Card changes only while edge-on and hidden, and stays visible with reduced motion', async ({ page }) => {
  await openGame(page);
  await leaveFullscreen(page);
  await page.locator('[data-game="customs"]').click();
  await page.evaluate(() => previewCustom(CubieCustoms.catalog.find(c => c.id === 'chaos_wild')));
  const card = page.locator('#customs-preview-art .chaos-wild-card');
  await page.locator('#customs-preview-art').scrollIntoViewIfNeeded();
  await card.evaluate(el => {
    window.wildSwaps = [];
    let previous = Number(el.querySelector('.chaos-wild-symbol').dataset.symbolIndex);
    new MutationObserver(() => {
      const current = Number(el.querySelector('.chaos-wild-symbol').dataset.symbolIndex);
      const style = getComputedStyle(el), matrix = new DOMMatrix(style.transform);
      window.wildSwaps.push({previous, current, opacity:Number(style.opacity), width:Math.hypot(matrix.a, matrix.b)});
      previous = current;
    }).observe(el, {childList:true});
    el.style.animationDuration = '.6s';
  });
  await expect.poll(() => page.evaluate(() => wildSwaps.length)).toBeGreaterThanOrEqual(4);
  const swaps = await page.evaluate(() => wildSwaps);
  for (const swap of swaps) {
    expect(swap.current).not.toBe(swap.previous);
    expect(swap.current).toBeGreaterThanOrEqual(0);
    expect(swap.current).toBeLessThan(50);
    expect(swap.opacity).toBe(0);
    expect(swap.width).toBeLessThan(.001);
  }
  await page.emulateMedia({ reducedMotion:'reduce' });
  await expect(card).toHaveCSS('animation-name', 'none');
  await expect(card).toHaveCSS('opacity', '1');
  expect(await card.evaluate(el => (() => { const m = new DOMMatrix(getComputedStyle(el).transform); return Math.abs(m.a*m.d-m.b*m.c); })())).toBeGreaterThan(.9);
  const symbol = await card.locator('.chaos-wild-symbol').getAttribute('data-symbol');
  await page.waitForTimeout(700);
  await expect(card.locator('.chaos-wild-symbol')).toHaveAttribute('data-symbol', symbol);
  await page.emulateMedia({ reducedMotion:'no-preference' });
  await page.evaluate(() => document.documentElement.classList.add('account-reduced-motion'));
  await expect(card).toHaveCSS('animation-name', 'none');
  await expect(card).toHaveCSS('opacity', '1');
});
