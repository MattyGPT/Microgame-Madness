const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('microgame-madness.welcome.v1','complete'));await page.route('**/leaderboard-config.json',r=>r.fulfill({json:{url:'',key:''}}));});
test('settings tabs, search and persisted preferences work without changing game data',async({page},info)=>{
 await page.goto('/');await page.locator('#settings-open').click();await expect(page.locator('#settings-dialog')).toBeVisible();
 await page.locator('#settings-tabs').getByRole('button',{name:'Appearance',exact:true}).click();await page.locator('#settings-subtabs').getByRole('button',{name:'Comfort'}).click();await page.locator('#setting-motion').check();await expect(page.locator('html')).toHaveAttribute('data-setting-motion','true');
 await page.locator('#settings-search').fill('pointer');await expect(page.locator('#setting-cursor')).toBeVisible();await page.locator('#setting-cursor').check();
 await page.locator('#settings-search').fill('no such preference');await expect(page.locator('#settings-fields')).toContainText('No settings match');
 await page.locator('#settings-search').fill('');await page.locator('#settings-tabs').getByRole('button',{name:'Audio',exact:true}).click();await page.locator('#setting-volume').evaluate(el=>{el.value='23';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('#setting-newsMusic').uncheck();
 await page.screenshot({path:info.outputPath('settings.png'),fullPage:true});await page.locator('#settings-close').click();await page.reload();await page.locator('#settings-open').click();await page.locator('#settings-tabs').getByRole('button',{name:'Audio',exact:true}).click();await expect(page.locator('#setting-volume')).toHaveValue('23');await expect(page.locator('#setting-newsMusic')).not.toBeChecked();
 expect(await page.evaluate(()=>ArcadeSettings.normalize({volume:999,motion:'true',newsSort:'invalid',moderator:true}))).toMatchObject({volume:100,motion:false,newsSort:'newest'});
 expect(await page.evaluate(()=>Object.hasOwn(ArcadeSettings.normalize({moderator:true}),'moderator'))).toBe(false);
});
test('imports validate and reset touches only settings',async({page})=>{
 await page.goto('/');await page.evaluate(()=>localStorage.setItem('unrelated-progress','keep'));await page.locator('#settings-open').click();await page.locator('#settings-tabs').getByRole('button',{name:'Data',exact:true}).click();
 await page.getByLabel('Import preferences JSON').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{no')});await expect(page.locator('#settings-status')).toContainText('Could not import');
 await page.getByLabel('Import preferences JSON').setInputFiles({name:'settings.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,preferences:{contrast:true,textScale:120}}))});await expect(page.locator('html')).toHaveAttribute('data-setting-contrast','true');
 await page.locator('#settings-reset').click();await expect(page.locator('#game-confirm-dialog')).toBeVisible();await page.locator('#game-confirm-accept').click();await expect(page.locator('html')).toHaveAttribute('data-setting-contrast','false');expect(await page.evaluate(()=>localStorage.getItem('unrelated-progress'))).toBe('keep');
});
test('game confirmations cancel safely and the sticky header defaults on once',async({page})=>{
 let nativeDialogs=0;page.on('dialog',d=>{nativeDialogs++;d.dismiss();});
 await page.addInitScript(()=>{if(!localStorage.getItem('microgame.settings.v1'))localStorage.setItem('microgame.settings.v1',JSON.stringify({stickyHeader:false,contrast:true}));});
 await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-setting-sticky-header','true');await page.locator('#settings-open').click();await expect(page.locator('#setting-stickyHeader')).toBeChecked();await page.locator('#setting-stickyHeader').uncheck();
 await page.locator('#settings-reset').click();await expect(page.locator('#game-confirm-dialog')).toBeVisible();await page.locator('#game-confirm-dialog').getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-setting-contrast','true');await expect(page.locator('#settings-reset')).toBeFocused();
 await page.locator('#settings-reset').click();await page.keyboard.press('Escape');await expect(page.locator('#game-confirm-dialog')).not.toBeVisible();await expect(page.locator('#settings-dialog')).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-setting-sticky-header','false');expect(nativeDialogs).toBe(0);
 // Reload without the test fixture rewriting preferences, then verify user choice survives.
 await page.evaluate(()=>location.reload());await expect(page.locator('html')).toHaveAttribute('data-setting-sticky-header','false');
});
