const { test, expect, openGame } = require('./fixtures/game.cjs');

// Keep unrelated score assertions independent of the randomly selected song.
test.use({ deterministicMusic: true });

test('Custom Cubie unlocks, equips, persists, and preserves normal game flow', async ({ page }, testInfo) => {
  await openGame(page);
  const card = page.locator('[data-game="customs"]');
  await expect(card.locator('.cubie-float')).toHaveCSS('animation-name', 'custom-float');
  await expect(card.locator('.cubie-eyes')).toHaveCSS('animation-name', 'mascot-blink');
  await card.click();
  await expect(page.locator('#customs-room')).toBeVisible();
  await expect(page.locator('#customs-grid .custom-tile')).toHaveCount(155);
  await expect(page.locator('#customs-count')).toHaveText('1 / 155 Customs unlocked');
  const pumpkin = page.locator('.custom-tile[data-custom="pumpkin"]');
  await expect(pumpkin).toContainText('Defeat the Pumpkin King in any mode.');
  await expect(pumpkin.locator('.custom-equip')).toBeDisabled();
  // A completed real-mode victory unlocks the reward immediately.
  await page.evaluate(async () => {
    await accountApp.ready;
    accountApp.startRun('pumpkin', 'baby');
    updateAchievements(achievementTracker.start('pumpkin', 'baby'));
    const result = { mode: 'pumpkin', difficulty: 'baby', over: true, won: true,
      score: 0, damage_taken: 2, lives: 13, max_lives: 15 };
    updateAchievements(achievementTracker.observe(result));
    accountApp.observe(result, true);
    await accountApp.chain;
  });
  await expect(pumpkin.locator('.custom-equip')).toBeEnabled();
  await pumpkin.locator('.custom-equip').click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'pumpkin');
  await expect(page.locator('#customs-equipped-name')).toHaveText('Pumpkin Cubie');
  await expect(page.locator('#customs-status')).toHaveText('Now wearing Pumpkin Cubie.');
  await page.locator('#customs-filter').selectOption('unlocked');
  await expect(page.locator('#customs-grid .custom-tile')).toHaveCount(2);
  await page.locator('#customs-filter').selectOption('all');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#achievement-toast').waitFor({ state: 'hidden' });
  await page.locator('.achievement-confetti').first().waitFor({ state: 'hidden' });
  await page.locator('#customs-room').screenshot({ path: testInfo.outputPath('custom-cubie-collection.png') });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'pumpkin');
  await page.locator('#cube').click({ force: true });
  await expect(page.locator('#cube')).toHaveClass(/blushing/);
  await card.click();
  await page.getByRole('button', { name: 'Wear Classic Cubie', exact: true }).click();
  await expect(page.locator('#cube')).not.toHaveClass(/custom-equipped/);
  await page.locator('[data-game="hangman"]').click();
  await expect(page.locator('#customs-room')).toBeHidden();
  await page.locator('[data-difficulty="easy"]').click();
  await expect(page.locator('#hangman-game')).toBeVisible();
  await card.click();
  await expect(page.locator('#customs-room')).toBeVisible();
  expect(await page.evaluate(() => active)).toBe(false);
});

test('Custom Cubie rejects locked saved outfits and respects reduced motion', async ({ page }) => {
  // Seed an old save before first navigation so the actual migration validates
  // the locked selection. Later localStorage writes are no longer authoritative.
  await page.addInitScript(() => {
    localStorage.setItem('microgame-madness.v1', JSON.stringify({ player: 'Player', cubieCustom: 'pumpkin' }));
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openGame(page);
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'classic');
  await expect(page.locator('[data-game="customs"] .cubie-float')).toHaveCSS('animation-name', 'none');
});

test('locked Customs can be previewed with flavor text without equipping', async ({ page }) => {
  await openGame(page);
  await page.locator('[data-game="customs"]').click();
  await page.getByRole('button', { name: 'Preview Pumpkin Cubie', exact: true }).click();
  await expect(page.locator('#customs-equipped-name')).toHaveText('Pumpkin Cubie');
  await expect(page.locator('#customs-flavor')).toHaveText('Won the crown. Kept the pumpkin. Refuses to become pie.');
  await expect(page.locator('#customs-status')).toContainText('Preview only · Locked');
  await expect(page.locator('[data-custom="pumpkin"] .custom-equip')).toBeDisabled();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'classic');
  expect(await page.evaluate(() => saved.cubieCustom)).toBe('classic');
  await page.getByRole('button', { name: 'Preview Word Wizard', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#customs-equipped-name')).toHaveText('Word Wizard');
  await expect(page.locator('#customs-flavor')).toHaveText('Knows every spell except the one that finds missing socks.');
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'classic');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'classic');
});

test('Gaster and tier Customs migrate earned medals, preview, equip, and persist', async ({ page }, testInfo) => {
  // This scenario exercises importing existing earned medals, so seed the
  // legacy profile before the first IndexedDB migration instead of replacing it.
  const unlocked = Object.fromEntries(require('../achievements.js').catalog
    .filter(a => !a.collectionTier).map(a => [a.id, '2026-11-03T12:00:00.000Z']));
  await page.addInitScript(unlocked => {
    if (!localStorage.getItem('microgame-madness.v1'))
      localStorage.setItem('microgame-madness.v1', JSON.stringify({
        player: 'Player', achievements: { stats: { visits: 1 }, unlocked },
      }));
  }, unlocked);
  await openGame(page);
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await page.locator('[data-game="customs"]').click();
  await expect(page.locator('#customs-count')).toHaveText('90 / 155 Customs unlocked');
  for (const [tier, threshold] of [['gold', 10], ['silver', 15], ['bronze', 20],
    ['crystal', 5], ['diamond', 3], ['rainbow', 2], ['empyrorite', 1]]) {
    const tile = page.locator('.custom-tile[data-custom="medal_' + tier + '"]');
    await expect(tile).toContainText(threshold + ' / ' + threshold);
    await expect(tile.locator('.custom-equip')).toBeEnabled();
    await tile.locator('.custom-preview-button').click();
    await expect(page.locator('#customs-status')).toContainText('Preview only · Unlocked');
    await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'classic');
  }
  const gaster = page.locator('.custom-tile[data-custom="gaster"]');
  await expect(gaster).toContainText('Some things are better left unexplained.');
  await gaster.locator('.custom-preview-button').click();
  await expect(page.locator('#customs-equipped-name')).toHaveText('Gaster Cubie');
  await expect(page.locator('#customs-flavor')).toHaveText('Probably nothing.');
  await gaster.locator('.custom-equip').click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'gaster');
  // Show the eight new designs together for visual inspection.
  await page.evaluate(() => {
    document.querySelectorAll('.custom-tile').forEach(tile => {
      tile.hidden = tile.dataset.custom !== 'gaster' && !tile.dataset.custom.startsWith('medal_');
    });
    document.querySelectorAll('#achievement-toast button').forEach(button => button.click());
    document.querySelector('#achievement-celebrations').replaceChildren();
  });
  await page.locator('#customs-room').screenshot({ path: testInfo.outputPath('gaster-and-tier-customs.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'gaster');
  await page.locator('[data-game="customs"]').click();
  await page.getByRole('button', { name: 'Wear Empyrorite Cubie', exact: true }).click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'medal_empyrorite');
});

test('every Custom shows its tier on the card and preview with matching outlines', async ({ page }, testInfo) => {
  await openGame(page);
  await page.locator('[data-game="customs"]').click();
  const customs = await page.evaluate(() => CubieCustoms.catalog.map(item => ({
    id: item.id, name: item.name, tier: item.tier, label: CubieCustoms.tierLabels[item.tier],
  })));
  // Routine playtime saves must preserve card nodes and active previews.
  expect(await page.evaluate(() => {
    const card = document.querySelector('.custom-tile');
    websiteTimeCheckpoint -= 11000;
    saveWebsiteTime();
    return card === document.querySelector('.custom-tile');
  })).toBe(true);
  // Inspect the entire growing catalog in one browser call to avoid hundreds
  // of round trips while keeping every card's tier, label, and border covered.
  const cards = await page.locator('.custom-tile').evaluateAll(tiles => tiles.map(tile => ({
    id: tile.dataset.custom, tier: tile.dataset.tier,
    label: tile.querySelector('.custom-tier').textContent,
    border: getComputedStyle(tile).borderTopWidth,
  })));
  expect(cards.sort((a, b) => a.id.localeCompare(b.id))).toEqual(customs.map(item => ({
    id: item.id, tier: item.tier, label: item.label + ' Custom', border: '2px',
  })).sort((a, b) => a.id.localeCompare(b.id)));
  for (const tier of ['bronze', 'silver', 'gold', 'crystal', 'diamond', 'rainbow', 'empyrorite', 'black']) {
    const id = tier === 'black' ? 'gaster' : 'medal_' + tier;
    const tile = page.locator('.custom-tile[data-custom="' + id + '"]');
    await tile.locator('.custom-preview-button').click();
    await expect(page.locator('.customs-preview')).toHaveAttribute('data-tier', tier);
    await expect(page.locator('#customs-preview-tier')).toHaveText(tier[0].toUpperCase() + tier.slice(1) + ' Custom');
    await expect(tile.locator('.custom-equip')).toBeDisabled();
    const cardBorder = await tile.evaluate(el => getComputedStyle(el).borderTopColor);
    await expect(page.locator('.customs-preview')).toHaveCSS('border-top-color', cardBorder);
    if (tier === 'rainbow') expect(await tile.evaluate(el => getComputedStyle(el).backgroundImage)).toContain('linear-gradient');
  }
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'classic');
  // Keep only the eight tier examples in the visual review capture.
  await page.evaluate(() => {
    document.querySelectorAll('.custom-tile').forEach(tile => {
      tile.hidden = tile.dataset.custom !== 'gaster' && !tile.dataset.custom.startsWith('medal_');
    });
  });
  await page.locator('#achievement-toast').waitFor({ state: 'hidden' });
  await page.locator('#customs-room').screenshot({ path: testInfo.outputPath('cubie-tiers.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Gaster remix achievement follows audible playback and equipment, not previews', async ({ page }) => {
  await openGame(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluate(() => updateAchievements(achievementTracker.completeGaster()));
  await page.locator('[data-game="jukebox"]').click();
  await page.locator('[data-difficulty="gaster_remix"]').click();
  await expect.poll(() => page.evaluate(() => musicPlayer?.current?.track)).toBe('gaster_remix');
  await page.evaluate(() => previewCustom(CubieCustoms.catalog.find(item => item.id === 'gaster')));
  expect(await page.evaluate(() => achievementTracker.data.unlocked.gaster_remix)).toBeUndefined();
  await page.locator('#sound').click();
  await page.evaluate(() => { saved.cubieCustom = 'gaster'; applyCubieCustom(); persist(); });
  expect(await page.evaluate(() => achievementTracker.data.unlocked.gaster_remix)).toBeUndefined();
  await page.locator('#sound').click();
  await expect.poll(() => page.evaluate(() => !!achievementTracker.data.unlocked.gaster_remix)).toBe(true);
  const score = await page.locator('#profile-score').textContent();
  await page.locator('#jukebox-pause').click();
  await page.locator('#jukebox-pause').click();
  await expect(page.locator('#profile-score')).toHaveText(score);
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  expect(await page.evaluate(() => !!achievementTracker.data.unlocked.gaster_remix)).toBe(true);
  await expect(page.locator('#profile-score')).toHaveText(score);
  expect(errors).toEqual([]);
});

test('Cubie Shop earns Cash once, buys and equips exclusive Customs, and persists', async ({ page }, testInfo) => {
  await openGame(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const checkPriceOrder = async () => {
    const order = await page.evaluate(() => ({
      actual: [...document.querySelectorAll('#shop-grid .custom-tile')].map(el => el.dataset.custom),
      expected: CubieCustoms.catalog.filter(c => c.price).sort((a,b) => a.price-b.price || a.name.localeCompare(b.name)).map(c => c.id),
    }));
    expect(order.actual).toEqual(order.expected);
  };
  await page.locator('[data-game="shop"]').click();
  await expect(page.locator('#shop-grid .custom-tile')).toHaveCount(65);
  await checkPriceOrder();
  await expect(page.locator('#shop-balance')).toHaveText('0 Cubie Cash');
  const mint = page.locator('#shop-grid [data-custom="shop_blue_mint"]');
  await expect(mint.locator('button')).toBeDisabled();
  await page.locator('[data-game="customs"]').click();
  const locked = page.locator('#customs-grid [data-custom="shop_blue_mint"]');
  await locked.locator('.custom-preview-button').click();
  await expect(page.locator('#customs-flavor')).toContainText('Freshly minted');
  await expect(locked.locator('.custom-equip')).toBeDisabled();
  // Exercise the real round-save boundary twice for the same round.
  await page.evaluate(async () => {
    await accountApp.ready;
    selectGame('hangman'); selectedDifficulty = 'hard';
    snapshot = { mode: 'hangman', difficulty: 'hard', score: 5, over: true, won: true,
      mistakes: 0, remaining: 5 };
    for (let i = 0; i < 10; i++) {
      accountApp.startRun('hangman', 'hard');
      roundSaved = false;
      saveRound(); saveRound();
    }
    await accountApp.chain;
    accountApp.applyCurrent();
  });
  await page.locator('[data-game="shop"]').click();
  await expect(page.locator('#shop-balance')).toHaveText('600 Cubie Cash');
  await mint.locator('button').click();
  await expect(page.locator('#shop-balance')).toHaveText('450 Cubie Cash');
  await expect(mint.locator('button')).toHaveText('Wear Custom');
  await mint.locator('button').click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'shop_blue_mint');
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'shop_blue_mint');
  await page.locator('[data-game="shop"]').click();
  await expect(page.locator('#shop-balance')).toHaveText('450 Cubie Cash');
  await expect(mint.locator('button')).toHaveText('Equipped ✓');
  await checkPriceOrder();
  await page.locator('#shop-room summary').click();
  await expect(page.locator('#shop-rates')).toContainText('Hangman: score × 400');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#shop-room').screenshot({ path: testInfo.outputPath('cubie-shop.png') });
  expect(errors).toEqual([]);
});

test('CODEXISTHEBEST unlocks rainbow Codex Cubie and equipment survives reload', async ({ page }, testInfo) => {
  await openGame(page);
  await page.locator('[data-game="customs"]').click();
  const custom = page.locator('#customs-grid .custom-tile[data-custom="codex"]');
  await expect(custom).toHaveAttribute('data-tier', 'rainbow');
  await expect(custom.locator('.custom-equip')).toBeDisabled();
  await page.locator('#player').fill('CODEXISTHEBEST');
  await expect(custom.locator('.custom-equip')).toBeEnabled();
  await expect(page.locator('#profile-score')).toHaveText('2440');
  await custom.locator('.custom-equip').click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'codex');
  await page.evaluate(() => {
    document.querySelectorAll('#achievement-toast button').forEach(button => button.click());
    document.querySelector('#achievement-celebrations').replaceChildren();
  });
  await expect(page.locator('#name-surprise')).toBeHidden();
  await custom.screenshot({ path: testInfo.outputPath('codex-cubie.png') });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'codex');
  await expect(page.locator('#profile-score')).toHaveText('2440');
});

test('Hacker Cubie can be purchased for 4000 Cash and keeps its corrupted face when equipped', async ({ page }, testInfo) => {
  // A funded legacy save isolates purchase/rendering from the earning tests.
  await page.addInitScript(() => {
    if (!localStorage.getItem('microgame-madness.v1'))
      localStorage.setItem('microgame-madness.v1', JSON.stringify({ player: 'Player', shop: { units: 4000000, owned: [] } }));
  });
  await openGame(page);
  await page.locator('[data-game="shop"]').click();
  const card = page.locator('#shop-grid .custom-tile[data-custom="shop_hacker"]');
  await expect(card).toHaveAttribute('data-tier', 'empyrorite');
  await expect(card.locator('.shop-price')).toHaveText('4000 Cubie Cash');
  await card.getByRole('button', { name: 'Buy Hacker Cubie', exact: true }).click();
  await expect(page.locator('#shop-balance')).toHaveText('0 Cubie Cash');
  await card.getByRole('button', { name: 'Wear Hacker Cubie', exact: true }).click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'shop_hacker');
  await expect(page.locator('#cube .hacker-claw')).toHaveCount(1);
  await expect(page.locator('#cube .cubie-eyes path')).toHaveAttribute('stroke', '#fff5f5');
  await card.screenshot({ path: testInfo.outputPath('hacker-shop-card.png') });
  await page.reload();
  await expect(page.locator('#runtime-status')).toContainText('All games ready', { timeout: 30000 });
  await expect(page.locator('#cube')).toHaveAttribute('data-custom', 'shop_hacker');
});

