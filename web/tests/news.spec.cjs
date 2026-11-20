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

test('suggestions show likes and ten-idea Empyrorite reward progress',async({page})=>{
 let liked=false;
 await page.addInitScript(()=>localStorage.setItem('microgame-madness.welcome.v1','complete'));
 await page.route('**/leaderboard-config.json',r=>r.fulfill({json:{url:'https://news.test',key:'public'}}));
 await page.route('https://news.test/**',async r=>{
  if(r.request().url().endsWith('news_suggestion_like')){liked=!liked;return r.fulfill({json:{}});}
  return r.fulfill({json:{posts:[],reward:{approved:3,earned:false},comments:[{id:'00000000-0000-0000-0000-000000000001',body:'More tiny adventures',name:'Cubie fan',cubie:'classic',medals:[],created_at:'2026-11-19',likes:liked?2:1,liked,creator_liked:true}]}});
 });
 await page.goto('/');await page.locator('#news-open').click();await page.locator('#news-suggestions').click();
 await expect(page.locator('#news-reward')).toContainText('3/10');await expect(page.locator('#news-reward')).toContainText('Empyrorite');
 const like=page.locator('[data-suggestion-like]');await expect(like).toHaveAttribute('aria-pressed','false');
 await like.click();await expect(like).toHaveAttribute('aria-pressed','true');await expect(like).toContainText('2');
 await like.click();await expect(like).toHaveAttribute('aria-pressed','false');await expect(like).toContainText('1');
 await expect(page.locator('.news-creator-like')).toContainText('Liked by a creator');
 await expect(page.locator('.news-cubie-wave')).toHaveCount(0);
 await page.locator('#news-search').fill('no matching idea');await expect(page.locator('[data-suggestion-like]')).toHaveCount(0);await expect(page.locator('#news-list')).toContainText('No matches');
 await page.locator('#news-search').fill('adventures');await expect(page.locator('[data-suggestion-like]')).toHaveCount(1);
 await page.locator('#news-sort').selectOption('popular');await page.locator('#news-filter').selectOption('creator');await expect(page.locator('[data-suggestion-like]')).toHaveCount(1);
});

test('official gameplay preview renders as a controlled video without allowing arbitrary embeds',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('microgame-madness.welcome.v1','complete'));
 await page.route('**/leaderboard-config.json',r=>r.fulfill({json:{url:'https://news.test',key:'public'}}));
 await page.route('**/__news',r=>r.fulfill({status:404,json:{}}));
 await page.route('https://news.test/**',r=>r.fulfill({json:{posts:[{id:'preview',title:"What's Poppin?",body:'Watch this!\nhttps://microgame-madness.com/media/balloon-pop-preview.mp4\nSee ya round! —Nate',created_at:'2026-11-20',likes:0},{id:'unsafe',title:'Plain text',body:'<script>alert(1)</script>\nhttps://untrusted.example/video.mp4',created_at:'2026-11-19',likes:0}],comments:[]}}));
 await page.goto('/');await page.locator('#news-open').click();
 const video=page.locator('#news-list video');await expect(video).toHaveCount(1);await expect(video).toHaveAttribute('controls','');await expect(video).toHaveAttribute('playsinline','');await expect(video).not.toHaveAttribute('autoplay','');
 await expect(page.locator('#news-list')).toContainText('See ya round!');await expect(page.locator('#news-list script')).toHaveCount(0);
});
