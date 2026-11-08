const { test, expect, openGame } = require('./fixtures/game.cjs');

test('scanner covers every catalog block and keeps typed analysis synchronized', async ({ page }) => {
  await openGame(page);
  const result = await page.evaluate(() => {
    const target = document.createElement('span');
    const scanner = new GuideScanner.Scanner(target, chaosGuideBlocks);
    const seen = new Set();
    for (const block of chaosGuideBlocks) {
      seen.add(block.id);
      const guideLabel = document.querySelector(`.block-guide-card[data-block="${block.id}"] .block-disposition`);
      if (guideLabel?.dataset.disposition !== block.disposition) throw Error('Guide classification mismatch');
      if (!guideLabel.previousElementSibling.classList.contains('block-rarity')) throw Error('Classification must follow rarity');
      scanner.scan(block, 1000);
      if (scanner.copy.textContent !== '') throw Error('Text did not reset');
      const label = scanner.root.querySelector('.guide-scan-disposition');
      if (label.dataset.disposition !== block.disposition || label.textContent.toLowerCase() !== block.disposition)
        throw Error('Scanner classification mismatch');
      scanner.type(1025, false);
      if (!scanner.copy.textContent || scanner.copy.textContent === scanner.fullText) throw Error('Missing typing stage: ' + block.id);
      scanner.type(1700, false);
      if (scanner.copy.textContent !== GuideScanner.analysis(block)) throw Error('Analysis mismatch');
      if (scanner.icon.dataset.block !== block.id || scanner.root.dataset.block !== block.id) throw Error('Image mismatch');
      if (!scanner.fullText.trim() || !scanner.root.title.includes(block.description)) throw Error('Missing analysis: ' + block.id);
    }
    scanner.tick(3499);
    const before = scanner.lastChange;
    scanner.tick(3500);
    const after = scanner.lastChange;
    const id = scanner.icon.dataset.block;
    scanner.tick(9000, true);
    return { count: seen.size, catalog: chaosGuideBlocks.length, before, after,
      reducedStable: scanner.icon.dataset.block === id, fullText: scanner.copy.textContent === scanner.fullText };
  });
  expect(result.count).toBe(result.catalog);
  expect(result.before).toBe(1000);
  expect(result.after).toBe(3500);
  expect(result.reducedStable && result.fullText).toBe(true);
});


test('scanner selection matches every in-game spawn ticket', async ({ page }) => {
  await openGame(page);
  const distribution = await page.evaluate(() => {
    const scanner = new GuideScanner.Scanner(document.createElement('span'), chaosGuideBlocks);
    const total = chaosGuideBlocks.reduce((sum, block) => sum + block.weight, 0);
    const counts = {};
    for (let ticket = 0; ticket < total; ticket++) {
      const block = scanner.next(() => (ticket + .5) / total);
      counts[block.id] = (counts[block.id] || 0) + 1;
    }
    return chaosGuideBlocks.map(block => ({ id: block.id, actual: counts[block.id] || 0,
      expected: block.weight, chance: block.chance, actualChance: counts[block.id] / total * 100 }));
  });
  for (const block of distribution) {
    expect(block.actual, block.id).toBe(block.expected);
    expect(block.actualChance, block.id).toBeCloseTo(block.chance, 6);
  }
});
