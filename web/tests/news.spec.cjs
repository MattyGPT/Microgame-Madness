const {test,expect}=require('@playwright/test');
test('news spans the grid, reads only while visible, and shows Cubie warning',async({page})=>{
 await page.route('**/leaderboard-config.json',r=>r.fulfill({json:{url:'https://news.test',key:'public'}}));
 await page.route('https://news.test/**',r=>r.fulfill({json:r.request().url().endsWith('news_feed')?{posts:[{id:'00000000-0000-0000-0000-000000000001',title:'Next up',body:'More Cubies are coming.',created_at:'2026-11-19',likes:2,liked:false,seen:false}],comments:[]}:{kind:true,hours:false}}));
 await page.addInitScript(()=>localStorage.setItem('microgame-madness.welcome.v1','complete'));
 await page.goto('/');
 await expect(page.locator('#news-badge')).toHaveText('1');
 await page.locator('#news-open').click();await expect(page.locator('#news-list')).toContainText('Next up');
 await page.waitForTimeout(2500);await page.locator('#news-close').click();await page.waitForTimeout(3000);
 await expect(page.locator('#news-badge')).toBeVisible();
 await page.locator('#news-open').click();await expect(page.locator('#news-badge')).toBeHidden({timeout:8000});
 await page.locator('#news-suggestions').click();await page.locator('#news-comment').fill('bad word');await page.locator('#news-compose button').click();
 await expect(page.locator('#news-kind')).toBeVisible();await expect(page.locator('#news-kind-message')).toContainText('10 minutes');
 await expect(page.locator('#news-kind-art svg')).toBeVisible();
});
