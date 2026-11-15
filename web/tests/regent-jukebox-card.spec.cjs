const {test,expect,openGame}=require('./fixtures/game.cjs');
test('Regent sleeve has animated gold foil and rainbow crown, border and text, with reduced-motion support',async({page},info)=>{
 await openGame(page);await page.locator('[data-game="jukebox"]').click();const card=page.locator('[data-difficulty="geomayhem_boss_20"]');
 await card.scrollIntoViewIfNeeded();await expect(card).toHaveClass(/regent-song/);await expect(page.locator('.regent-song')).toHaveCount(1);
 await expect(card).toContainText('Infinity Regent');await expect(card.locator('.song-art > path')).toHaveAttribute('stroke','url(#regent-jukebox-rainbow)');
 const styles=await card.evaluate(el=>({background:getComputedStyle(el).backgroundImage,animation:getComputedStyle(el).animationName,stroke:getComputedStyle(el.querySelector('.regent-word')).webkitTextStrokeWidth}));
 expect(styles.background).toContain('conic-gradient');expect(styles.background).toContain('linear-gradient');expect(styles.animation).toContain('regent-card-drift');expect(parseFloat(styles.stroke)).toBeGreaterThan(0);
 await card.screenshot({path:info.outputPath('regent-gold-rainbow.png'),animations:'disabled'});
 await card.click();await expect.poll(()=>page.evaluate(()=>bossAudioDirector.session)).toBe('20:battle');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.emulateMedia({reducedMotion:'reduce'});expect(await card.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');expect(await card.locator('.song-art').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>document.documentElement.classList.add('account-reduced-motion'));expect(await card.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});
