const {test,expect}=require('@playwright/test');
test('private autumn room renders messages safely, controls music and closes',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('microgame-madness.welcome.v1','complete'));
 await page.route('**/leaderboard-config.json',r=>r.fulfill({json:{url:'https://news.test',key:'public'}}));
 await page.route('https://news.test/**',r=>r.fulfill({json:{posts:[],comments:[]}}));
 let rows=[{id:1,label:'Aidan, the gametester',body:'Welcome to autumn.',created_at:'2026-11-19T12:00:00Z',mine:false}];
 await page.route('**/__news',async r=>{const b=r.request().postDataJSON();if(b.action==='status')return r.fulfill({json:{moderator:true}});if(b.body)rows.push({id:2,label:'Nate, the creator',body:b.body,created_at:'2026-11-19T12:01:00Z',mine:true});return r.fulfill({json:rows});});
 await page.goto('/');await expect(page.locator('#autumn-open')).toBeVisible();await page.locator('#autumn-open').click();
 await expect(page.locator('#autumn-messages')).toContainText('Welcome to autumn.');
 await page.locator('#autumn-message').fill('<img src=x onerror=alert(1)>');await page.locator('#autumn-compose button').click();
 await expect(page.locator('#autumn-messages')).toContainText('<img src=x onerror=alert(1)>');await expect(page.locator('#autumn-messages img')).toHaveCount(0);
 await expect(page.locator('#autumn-music')).toHaveAttribute('aria-pressed','true');
 await expect.poll(()=>page.evaluate(()=>musicPlayer?.playing ?? false)).toBe(false);
 await page.locator('#autumn-music').click();await expect(page.locator('#autumn-music')).toHaveAttribute('aria-pressed','false');
 await page.locator('#autumn-music').click();await expect(page.locator('#autumn-music')).toHaveAttribute('aria-pressed','true');
 await page.locator('#autumn-close').click();await expect(page.locator('#autumn-room')).not.toBeVisible();await expect(page.locator('#autumn-music')).toHaveAttribute('aria-pressed','false');
});
test('public readers see author themes without private chat access',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('microgame-madness.welcome.v1','complete'));
 await page.route('**/leaderboard-config.json',r=>r.fulfill({json:{url:'https://news.test',key:'public'}}));
 await page.route('**/__news',r=>r.fulfill({status:404,json:{}}));
 await page.route('https://news.test/**',r=>r.fulfill({json:{posts:['Nate, the creator','Aidan, the gametester'].map((label,i)=>({id:String(i),title:'Studio update',body:'Hello arcade!',author_label:label,created_at:'2026-11-19',likes:0})),comments:[]}}));
 await page.goto('/');await page.locator('#news-open').click();await expect(page.locator('.news-galaxy')).toContainText('Nate, the creator');await expect(page.locator('.news-fire')).toContainText('Aidan, the gametester');await expect(page.locator('#autumn-open')).toBeHidden();await expect(page.locator('#news-publish')).toBeHidden();
});
