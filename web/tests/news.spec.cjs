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

test('news broadcast music yields to video audio and returns after pause or close',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('microgame-madness.welcome.v1','complete'));
 await page.route('**/leaderboard-config.json',r=>r.fulfill({json:{url:'https://news.test',key:'public'}}));
 await page.route('**/__news',r=>r.fulfill({status:404,json:{}}));
 await page.route('https://news.test/**',r=>r.fulfill({json:{posts:[{id:'music-preview',title:'Preview',body:'https://microgame-madness.com/media/balloon-pop-preview.mp4',created_at:'2026-11-20',likes:0}],comments:[]}}));
 await page.route('https://microgame-madness.com/media/balloon-pop-preview.mp4',r=>r.fulfill({path:require('node:path').resolve(__dirname,'../media/balloon-pop-preview.mp4'),contentType:'video/mp4'}));
 await page.goto('/');await page.locator('#news-open').click();
 await expect.poll(()=>page.evaluate(()=>musicPlayer?.theme)).toBe('news_broadcast');await expect.poll(()=>page.evaluate(()=>musicPlayer?.playing)).toBe(true);
 const video=page.locator('#news-list video');await video.evaluate(async v=>{v.muted=true;await v.play();});
 await expect.poll(()=>page.evaluate(()=>musicPlayer?.playing)).toBe(false);
 await video.evaluate(v=>v.pause());await expect.poll(()=>page.evaluate(()=>musicPlayer?.playing)).toBe(true);await expect.poll(()=>page.evaluate(()=>musicPlayer?.theme)).toBe('news_broadcast');
 await video.evaluate(v=>v.play());await expect.poll(()=>page.evaluate(()=>musicPlayer?.playing)).toBe(false);
 await page.locator('#news-close').click();await expect.poll(()=>video.evaluate(v=>v.paused)).toBe(true);await expect.poll(()=>page.evaluate(()=>musicPlayer?.theme)).not.toBe('news_broadcast');
});


test('compact suggestions open comments with creator bling, replies, likes and saved drafts',async({page})=>{
 const replies=[{id:'mod',body:'Great idea!',label:'Aidan',creator:true,created_at:'2026-11-20',likes:0}];
 await page.addInitScript(()=>localStorage.setItem('microgame-madness.welcome.v1','complete'));
 await page.route('**/leaderboard-config.json',r=>r.fulfill({json:{url:'https://news.test',key:'public'}}));
 await page.route('https://news.test/**',r=>r.fulfill({json:{posts:[],comments:[{id:'idea',body:'Add more balloons',name:'Player',cubie:'classic',medals:[],created_at:'2026-11-20',replies}]}}));
 await page.route('**/__news',r=>{const b=r.request().postDataJSON();if(b.action==='status')return r.fulfill({json:{moderator:true}});if(b.action==='discussion'){if(b.operation==='create')replies.push({id:'reply-one',body:b.body,parent:b.parent,label:'Nate',creator:true,created_at:'2026-11-21',likes:0});if(b.operation==='like'){replies[0].likes=1;replies[0].liked=true;}return r.fulfill({json:b.operation==='list'?replies:{}});}return r.fulfill({json:[]});});
 await page.goto('/');await expect(page.locator('#autumn-open')).toBeVisible();await page.locator('#news-open').click();await page.locator('#news-suggestions').click();
 expect((await page.locator('.news-avatar').boundingBox()).width).toBeLessThanOrEqual(28);
 await expect(page.locator('#news-list .news-reply')).toHaveCount(0);
 await page.locator('[data-discussion="idea"]').click();
 await expect(page.locator('.news-reply-aidan')).toContainText('CREATOR');
 await page.locator('[data-comment-reply="mod"]').click();await expect(page.locator('#discussion-parent')).toContainText('Aidan');
 const input=page.locator('#discussion-body');await input.fill('Thanks! <b>More ideas</b>');
 await page.locator('#discussion-close').click();await page.locator('[data-discussion="idea"]').click();await expect(input).toHaveValue('Thanks! <b>More ideas</b>');
 await page.locator('[data-comment-reply="mod"]').click();await page.locator('#discussion-form [type=submit]').click();
 await expect(page.locator('.news-reply-nate')).toContainText('Thanks! <b>More ideas</b>');await expect(page.locator('.news-reply b')).toHaveCount(0);
 await expect(page.locator('.news-discussion-child')).toContainText('Replying to Aidan');
 await page.locator('[data-comment-like="mod"]').click();await expect(page.locator('[data-comment-like="mod"]')).toHaveAttribute('aria-pressed','true');
});
test('tab badges separate news from suggestion replies and show creator names',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('microgame-madness.welcome.v1','complete'));
 await page.route('**/leaderboard-config.json',r=>r.fulfill({json:{url:'https://news.test',key:'public'}}));
 await page.route('https://news.test/**',r=>r.fulfill({json:r.request().url().endsWith('news_discussion')?[{id:'reply',body:'Great idea',label:'Player',created_at:'2026-11-22',likes:2,creator_likes:['Aidan','Nate']}]:{posts:[{id:'post',title:'Update',body:'Hello',created_at:'2026-11-22',seen:false,likes:0}],comments:[{id:'suggestion',body:'More penguins',name:'Player',cubie:'classic',medals:[],created_at:'2026-11-22',likes:2,creator_likes:['Aidan','Nate'],unread_count:2,replies:[{},{}]}]}}));
 await page.goto('/');await expect(page.locator('#news-badge')).toHaveText('3');await page.locator('#news-open').click();await expect(page.locator('#news-posts-badge')).toHaveText('1');await expect(page.locator('#news-suggestions-badge')).toHaveText('2');await page.locator('#news-suggestions').click();await expect(page.locator('.news-creator-like')).toHaveText('★ Liked by 2 creators (Aidan, Nate)');
 const comments=page.locator('[data-discussion="suggestion"]');await expect(comments).toContainText('2 new');expect((await comments.boundingBox()).height).toBeGreaterThanOrEqual(46);await comments.click();await expect(page.locator('#discussion-list')).toContainText('Liked by 2 creators (Aidan, Nate)');
});

test('signed-in players can comment on news without moderator access',async({page})=>{
 const replies=[];let token;
 await page.addInitScript(()=>localStorage.setItem('microgame-madness.welcome.v1','complete'));
 await page.route('**/leaderboard-config.json',r=>r.fulfill({json:{url:'https://news.test',key:'public'}}));
 await page.route('**/__news',r=>r.fulfill({status:404,json:{}}));
 await page.route('https://news.test/**',r=>{
  const body=r.request().postDataJSON();
  if(r.request().url().endsWith('news_discussion')){
   if(body.action==='create'){token=r.request().headers().authorization;replies.push({id:'player-reply',label:'PlayerOne',creator:false,body:body.body,created_at:'2026-11-23',likes:0,can_delete:true});}
   return r.fulfill({json:body.action==='list'?replies:{}});
  }
  if(r.request().url().endsWith('news_team'))return r.fulfill({json:{moderator:false}});
  return r.fulfill({json:{posts:[{id:'post',title:'Update',body:'Hello',created_at:'2026-11-23',likes:0}],comments:[]}});
 });
 await page.goto('/');await page.locator('#news-open').click();await page.locator('[data-discussion="post"]').click();
 await page.locator('#discussion-body').fill('Thanks for the update!');await page.locator('#discussion-form [type=submit]').click();
 await expect(page.locator('#discussion-status')).toContainText('Sign in');
 await page.evaluate(()=>{accountApp={session:{snapshot:()=>({user:{id:'player-one',handle:'PlayerOne'}}),token:async()=>'player-token',subscribe:()=>{}}};});
 await page.locator('#discussion-form [type=submit]').click();
 await expect(page.locator('#discussion-list')).toContainText('Thanks for the update!');expect(token).toBe('Bearer player-token');
 await expect(page.locator('#discussion-list')).not.toContainText('CREATOR');
});

test('creator access recovers when the local server becomes available and likes use local identity',async({page})=>{
 let available=false,liked=false;
 await page.addInitScript(()=>localStorage.setItem('microgame-madness.welcome.v1','complete'));
 await page.route('**/leaderboard-config.json',r=>r.fulfill({json:{url:'https://news.test',key:'public'}}));
 await page.route('https://news.test/**',r=>r.fulfill({json:{posts:[{id:'post',title:'Update',body:'Hello',created_at:'2026-11-23',likes:liked?1:0,local_liked:liked}],comments:[]}}));
 await page.route('**/__news',r=>{const b=r.request().postDataJSON();if(!available)return r.fulfill({status:404,json:{}});if(b.action==='postLike')liked=!liked;return r.fulfill({json:b.action==='status'?{moderator:true}:{}});});
 await page.goto('/');await page.locator('#news-open').click();await expect(page.locator('#news-publish')).toBeHidden();available=true;
 await expect(page.locator('#news-publish')).toBeVisible({timeout:15000});await expect(page.locator('#autumn-open')).toBeVisible();
 const like=page.locator('[data-like="post"]');await like.click();await expect(like).toHaveAttribute('aria-pressed','true');await expect(like).toContainText('1');
 await like.click();await expect(like).toHaveAttribute('aria-pressed','false');
});

test('transient news_team outage does not close Autumn Room or wipe unsent drafts',async({page})=>{
 let teamOk=true;
 await page.addInitScript(()=>localStorage.setItem('microgame-madness.welcome.v1','complete'));
 await page.route('**/leaderboard-config.json',r=>r.fulfill({json:{url:'https://news.test',key:'public'}}));
 await page.route('**/__news',r=>r.fulfill({status:404,json:{}}));
 await page.route('https://news.test/**',r=>{
  if(r.request().url().endsWith('news_team'))return teamOk?r.fulfill({json:{moderator:true}}):r.fulfill({status:503,json:{}});
  if(r.request().url().endsWith('news_chat'))return r.fulfill({json:[{id:1,label:'Aidan',body:'Hi',created_at:'2026-11-23T12:00:00Z',mine:true}]});
  return r.fulfill({json:{posts:[],comments:[]}});
 });
 await page.goto('/');
 await page.evaluate(()=>{accountApp={session:{snapshot:()=>({user:{id:'mod-1',handle:'Aidan'}}),token:async()=>'mod-token',subscribe:()=>{}}};});
 await expect(page.locator('#autumn-open')).toBeVisible({timeout:15000});
 await page.locator('#autumn-open').click();
 await page.locator('#autumn-message').fill('Unsent draft stays safe');
 teamOk=false;
 await page.waitForTimeout(10500);
 await expect(page.locator('#autumn-room')).toBeVisible();
 await expect(page.locator('#autumn-message')).toHaveValue('Unsent draft stays safe');
});
