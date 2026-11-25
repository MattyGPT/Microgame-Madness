const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
test('news permissions, shared likes, filter strikes, bans and comment identity',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
 const dir=path.resolve(__dirname,'../../../supabase/migrations');for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync(path.join(dir,f),'utf8'));
 assert.equal((await db.query("select leaderboard_private.valid_mode('pool','standard') valid")).rows[0].valid,true);
 assert.equal((await db.query("select leaderboard_private.valid_mode('pool','practice') valid")).rows[0].valid,false);
 assert.deepEqual((await db.query("select * from public.get_game_leaderboard('pool')")).rows,[]);
 const who='00000000-0000-0000-0000-000000000001';
 await db.query('insert into auth.users values($1)',[who]);
 await db.query("insert into accounts_private.identities(owner,handle,provider_identifier,active) values($1,'cubiefan','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@accounts.invalid',true)",[who]);
 await db.query("insert into accounts_private.profiles(owner,state,cubie,ranking_enabled) values($1,'{}','classic',true)",[who]);
 const post=(await db.query("insert into news_private.posts(title,body) values('Update','A tiny fix') returning id")).rows[0].id;
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[who]);
 await db.query("insert into leaderboard_private.scores(player_id,mode,difficulty,player,score,total) values($1,'hangman','easy','Cubie',5,5)",[who]);
 await db.exec('set role authenticated');
 const action=async(a,body=null,target=null)=>(await db.query('select public.news_action($1,$2,$3) data',[a,target,body])).rows[0].data;
 const feed=async()=>(await db.query('select public.news_feed() data')).rows[0].data;
 await assert.rejects(db.exec("delete from news_private.comments"));
 await assert.rejects(db.exec("insert into news_private.posts(title,body) values('fake','fake')"));
 await action('like',null,post);assert.equal((await feed()).posts[0].likes,1);await action('like',null,post);assert.equal((await feed()).posts[0].likes,0);
 await action('seen',null,post);assert.equal((await feed()).posts[0].seen,true);
 await action('comment','Please add another game!');assert.equal((await feed()).comments[0].name,'cubiefan');assert.equal((await feed()).comments[0].cubie,'classic');assert.deepEqual((await feed()).comments[0].medals,[{game:'hangman',place:1}]);
 assert.match((await action('comment','Another idea')).error,/3 seconds/);
 for(let n=1;n<=5;n++){
  await db.exec('reset role');await db.query('update news_private.people set banned_until=null where owner=$1',[who]);await db.exec('set role authenticated');
  const result=await action('comment','f.u.c.k');assert.equal(result.kind,true);assert.equal(result.hours,n>=5);
  assert.ok((await action('comment','A nice idea')).until);
 }
 assert.equal((await feed()).comments.length,1);
 await db.exec('reset role');await db.query('update news_private.people set blocked=true,banned_until=null where owner=$1',[who]);await db.exec('set role authenticated');
 assert.match((await action('comment','Nice game')).error,/blocked/);
 await db.exec('reset role');await db.query('delete from news_private.comments');await db.exec('set role anon');
 assert.equal((await feed()).comments.length,0);await assert.rejects(action('comment','Bypass'));
 await db.exec('reset role');
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[who]);
 await db.exec('set role authenticated');
 await assert.rejects(db.query("select public.news_team('publish',null,'Forged','No')"),{code:'42501'});
 await assert.rejects(db.query('select public.news_chat()'),{code:'42501'});
 await assert.rejects(db.exec("insert into news_private.team values(auth.uid(),'Impostor','moderator')"),{code:'42501'});
 await db.exec('reset role');
 await db.query("insert into news_private.team values($1,'Aidan, the gametester','moderator')",[who]);
 await db.query("insert into news_private.chat(owner,local_creator,body) values(null,true,'Hello from Nate')");
 await db.exec('set role authenticated');
 await db.query("select public.news_team('publish',null,'Tester update','New things soon')");
 assert.equal((await feed()).posts.find(p=>p.title==='Tester update').author_label,'Aidan, the gametester');
 const chat=(await db.query("select public.news_chat('Hello from Aidan') data")).rows[0].data;
 assert.deepEqual(chat.map(c=>c.label),['Nate, the creator','Aidan, the gametester']);
 assert.equal(chat[1].mine,true);
 assert.ok(!JSON.stringify(await feed()).includes('Hello from Nate'));
 await db.exec('reset role');
 await db.query('update news_private.people set blocked=false,banned_until=null,last_comment=null where owner=$1',[who]);
 const idea=(await db.query("insert into news_private.comments(owner,body) values($1,'A new idea') returning id",[who])).rows[0].id;
 await db.exec('set role authenticated');
 const reply=(await db.query("select public.news_reply('create',$1,'We love this idea!') data",[idea])).rows[0].data.id;
 assert.equal((await feed()).comments[0].replies[0].label,'Aidan');
 await assert.rejects(db.query("select news_private.reply_action('create',$1,'Impersonation',null,true)",[idea]),{code:'42501'});
 await assert.rejects(db.query("select public.news_reply('create',$1,'   ')",[idea]));
 assert.equal((await db.query("select public.news_reply('create',$1,'f.u.c.k') data",[idea])).rows[0].data.kind,true);
 await db.exec('reset role');await db.query("select news_private.reply_action('create',$1,'Thanks for suggesting this!',null,true)",[idea]);
 await db.exec('set role anon');assert.deepEqual((await feed()).comments[0].replies.map(r=>r.label),['Aidan','Nate']);
 await assert.rejects(db.query("select public.news_reply('create',$1,'Not allowed')",[idea]));
 await db.exec('reset role');await db.exec('set role authenticated');
 await db.query("select public.news_reply('delete',$1)",[reply]);assert.equal((await feed()).comments[0].replies.length,1);
 await db.query("select public.news_team('delete',$1)",[idea]);
 await db.exec('reset role');assert.equal((await db.query('select count(*) n from news_private.replies')).rows[0].n,0);
 await db.exec('set role authenticated');

 await db.exec('reset role');await db.query('delete from news_private.team where owner=$1',[who]);await db.exec('set role authenticated');
 await assert.rejects(db.query('select public.news_chat()'),{code:'42501'});


});

test('suggestion likes require ten distinct creator-approved ideas and grant a protected permanent reward',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
 const dir=path.resolve(__dirname,'../../../supabase/migrations');for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync(path.join(dir,f),'utf8'));
 const author='00000000-0000-0000-0000-000000000011',team='00000000-0000-0000-0000-000000000012',fan='00000000-0000-0000-0000-000000000013';
 for(const [id,name] of [[author,'author'],[team,'gametester'],[fan,'fan']]){
  await db.query('insert into auth.users values($1)',[id]);
  await db.query('insert into accounts_private.identities(owner,handle,provider_identifier,active) values($1,$2,$3,true)',[id,name,require('node:crypto').createHash('sha256').update(name).digest('hex')+'@accounts.invalid']);
  await db.query(`insert into accounts_private.profiles(owner,state) values($1,'{"shop":{"units":0,"owned":["news_anchor"]},"cubieCustom":"news_anchor"}')`,[id]);
 }
 const profile=async()=>(await db.query('select state,revision from accounts_private.profiles where owner=$1',[author])).rows[0];
 assert.deepEqual((await profile()).state.shop.owned,[]);assert.equal((await profile()).state.achievements.unlocked.news_ideas_10,undefined);assert.equal((await profile()).state.cubieCustom,'classic');
 await db.query("insert into news_private.team values($1,'Aidan, the gametester','moderator')",[team]);
 const ids=[];for(let i=0;i<10;i++)ids.push((await db.query('insert into news_private.comments(owner,body) values($1,$2) returning id',[author,'Idea '+i])).rows[0].id);
 const login=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');};
 const like=async id=>db.query('select public.news_suggestion_like($1)',[id]);
 await login(fan);for(const id of ids)await like(id);
 let feed=(await db.query('select public.news_feed() data')).rows[0].data;
 assert.equal(feed.comments[0].likes,1);assert.equal(feed.comments[0].liked,true);assert.equal(feed.comments[0].creator_liked,false);
 await assert.rejects(db.query('select news_private.toggle_suggestion($1,null,true)',[ids[0]]));
 await like(ids[0]);await like(ids[0]); // toggles never add duplicate likes
 await db.exec('reset role');assert.deepEqual((await profile()).state.shop.owned,[]);
 await login(team);for(const id of ids.slice(0,9))await like(id);
 await db.exec('reset role');await db.query('select news_private.toggle_suggestion($1,null,true)',[ids[0]]);
 assert.equal(Number((await db.query('select news_private.approved_count($1) n',[author])).rows[0].n),9);
 assert.deepEqual((await profile()).state.shop.owned,[]);
 await db.query('select news_private.toggle_suggestion($1,null,true)',[ids[9]]);
 const earned=await profile();assert.deepEqual(earned.state.shop.owned,['news_anchor']);assert.ok(earned.state.achievements.unlocked.news_ideas_10);assert.equal(earned.state.achievements.stats.creatorApprovedIdeas,10);
 await db.query('select news_private.toggle_suggestion($1,null,true)',[ids[9]]);
 await db.query('delete from news_private.comments where owner=$1',[author]);
 await db.query(`update accounts_private.profiles set state='{"shop":{"units":0,"owned":[]}}' where owner=$1`,[author]);
 assert.deepEqual((await profile()).state.shop.owned,['news_anchor']);
 await login(author);feed=(await db.query('select public.news_feed() data')).rows[0].data;
 assert.equal(feed.reward.earned,true);assert.equal(feed.reward.approved,0);
 await db.exec('reset role');await db.exec('set role anon');await assert.rejects(like(ids[0]));
});

test('public discussions support player replies, likes, ownership, filtering and shared cooldown',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
 const dir=path.resolve(__dirname,'../../../supabase/migrations');for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync(path.join(dir,f),'utf8'));
 const who='00000000-0000-0000-0000-000000000021';
 await db.query('insert into auth.users values($1)',[who]);
 await db.query("insert into accounts_private.identities(owner,handle,provider_identifier,active) values($1,'nate','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb@accounts.invalid',true)",[who]);
 const post=(await db.query("insert into news_private.posts(title,body) values('News','Hello') returning id")).rows[0].id;
 const other=(await db.query("insert into news_private.posts(title,body) values('Other','Hello') returning id")).rows[0].id;
 const creator=(await db.query("select news_private.discussion('create',$1,'Welcome',null,'post',null,true) data",[post])).rows[0].data.id;
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[who]);await db.exec('set role authenticated');
 const call=async(action,target=post,body=null,parent=null)=>(await db.query("select public.news_discussion($1,$2,$3,$4,'post') data",[action,target,body,parent])).rows[0].data;
 const reply=(await call('create',post,'Thank you!',creator)).id;assert.ok(reply);
 let rows=await call('list');assert.equal(rows.find(r=>r.id===reply).creator,false);assert.equal(rows.find(r=>r.id===creator).creator,true);assert.equal(rows.find(r=>r.id===reply).parent,creator);
 assert.match((await call('create',post,'Too soon')).error,/3 seconds/);
 assert.match((await db.query("select public.news_action('comment',null,'Idea') data")).rows[0].data.error,/3 seconds/);
 await call('like',creator);assert.equal((await call('list')).find(r=>r.id===creator).likes,1);
 await call('like',creator);assert.equal((await call('list')).find(r=>r.id===creator).likes,0);
 await assert.rejects(call('delete',creator),{code:'42501'});
 await db.exec("reset role;update news_private.people set last_comment=null;update news_private.discussion_clock set posted_at=null;set role authenticated");
 await assert.rejects(call('create',other,'Wrong thread',creator),/belong/);
 assert.equal((await call('create',post,'f.u.c.k')).kind,true);
 assert.ok((await call('create',post,'Wait')).until);
 await call('delete',reply);assert.equal((await call('list')).length,1);
 await db.exec("reset role;select set_config('request.jwt.claim.sub','',false);set role anon");
 assert.equal((await call('list')).length,1);await assert.rejects(call('create',post,'Anonymous'),{code:'42501'});
 await assert.rejects(call('like',creator),{code:'42501'});
});
test('Penguin Pool match receipts credit wins once and rank them publicly',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
 const dir=path.resolve(__dirname,'../../../supabase/migrations');for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync(path.join(dir,f),'utf8'));
 const who='00000000-0000-0000-0000-000000000041';await db.query('insert into auth.users values($1)',[who]);
 await db.query("insert into accounts_private.identities(owner,handle,provider_identifier,active) values($1,'poolfan','cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc@accounts.invalid',true)",[who]);
 const rules=require('../../../shared/account-rules.js'),state=rules.initial();state.player='Pool Fan';state.privacy.leaderboard=true;
 await db.query("insert into accounts_private.profiles(owner,state) values($1,$2)",[who,state]);
 const result=rules.apply(state,{schema:1,id:'pool-match',stream_id:'test',kind:'arcade',payload:{event:'pool-result',won:true}},{now:Date.now()});
 const commit=()=>db.query('select public.account_commit($1,$2,$3,$4,$5,$6,$7,$8)',[who,'pool-match','d'.repeat(64),0,result.state,result.result,result.run,'arcade']);
 await commit();await commit();
 const board=(await db.query("select * from public.get_game_leaderboard('pool')")).rows;
 assert.equal(board.length,1);assert.equal(board[0].score,1);assert.equal(Number(board[0].rank),1);
 const balloon=rules.apply(result.state,{schema:1,id:'balloon-run',stream_id:'test',kind:'arcade',payload:{event:'balloon-result',difficulty:'impossible',score:125}},{now:Date.now()});
 const saveBalloon=()=>db.query('select public.account_commit($1,$2,$3,$4,$5,$6,$7,$8)',[who,'balloon-run','e'.repeat(64),1,balloon.state,balloon.result,balloon.run,'arcade']);await saveBalloon();await saveBalloon();
 assert.equal((await db.query("select * from public.get_game_leaderboard('balloon')")).rows[0].score,938);

});
test('suggestion notifications are private, acknowledge only displayed replies, and credit both creators',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
 const dir=path.resolve(__dirname,'../../../supabase/migrations');for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync(path.join(dir,f),'utf8'));
 const author='00000000-0000-0000-0000-000000000071',aidan='00000000-0000-0000-0000-000000000072';
 for(const [id,handle] of [[author,'fan'],[aidan,'gametester']]){await db.query('insert into auth.users values($1)',[id]);await db.query('insert into accounts_private.identities(owner,handle,provider_identifier,active) values($1,$2,$3,true)',[id,handle,id.replaceAll('-','').padEnd(64,'a')+'@accounts.invalid']);}
 await db.query("insert into news_private.team values($1,'Aidan, the gametester','moderator')",[aidan]);
 const suggestion=(await db.query("insert into news_private.comments(owner,body) values($1,'Penguins please') returning id",[author])).rows[0].id;
 await db.query('select news_private.toggle_suggestion($1,null,true)',[suggestion]);await db.query('select news_private.toggle_suggestion($1,$2,false)',[suggestion,aidan]);
 const reply=(await db.query("select news_private.discussion('create',$1,'Great idea',null,'suggestion',null,true) data",[suggestion])).rows[0].data.id;
 await db.query("select news_private.discussion('like',$1,null,null,'suggestion',null,true)",[reply]);await db.query("select news_private.discussion('like',$1,null,null,'suggestion',$2,false)",[reply,aidan]);
 const login=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');};
 const feed=async()=>(await db.query('select public.news_feed() data')).rows[0].data.comments[0];
 await login(author);assert.equal((await feed()).unread_count,1);assert.deepEqual((await feed()).creator_likes,['Aidan','Nate']);
 const rows=(await db.query("select public.news_discussion('list',$1,null,null,'suggestion') data",[suggestion])).rows[0].data;assert.deepEqual(rows[0].creator_likes,['Aidan','Nate']);
 await login(aidan);assert.equal((await feed()).unread_count,0);await db.query('select public.news_discussion_seen($1,$2)',[suggestion,[reply]]);
 await login(author);assert.equal((await feed()).unread_count,1);await db.query('select public.news_discussion_seen($1,$2)',[suggestion,[reply]]);assert.equal((await feed()).unread_count,0);
 await db.exec("reset role;select set_config('request.jwt.claim.sub','',false);set role anon");assert.equal((await feed()).unread_count,0);await assert.rejects(db.query('select public.news_discussion_seen($1,$2)',[suggestion,[reply]]),{code:'42501'});
});

test('non-creator suggestion likes do not bump author profile revision and profanity filter avoids multi-word false positives',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
 const dir=path.resolve(__dirname,'../../../supabase/migrations');for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync(path.join(dir,f),'utf8'));
 const author='00000000-0000-0000-0000-000000000081',fan='00000000-0000-0000-0000-000000000082',guest='00000000-0000-0000-0000-000000000083';
 for(const [id,handle] of [[author,'ideaauthor'],[fan,'regularfan']]){
  await db.query('insert into auth.users values($1)',[id]);
  await db.query('insert into accounts_private.identities(owner,handle,provider_identifier,active) values($1,$2,$3,true)',[id,handle,id.replaceAll('-','').padEnd(64,'b')+'@accounts.invalid']);
  await db.query("insert into accounts_private.profiles(owner,state) values($1,'{}')",[id]);
 }
 await db.query('insert into auth.users values($1)',[guest]);
 const idea=(await db.query("insert into news_private.comments(owner,body) values($1,'More arenas please') returning id",[author])).rows[0].id;
 const post=(await db.query("insert into news_private.posts(title,body) values('Update','Hello') returning id")).rows[0].id;
 const revBefore=(await db.query('select revision from accounts_private.profiles where owner=$1',[author])).rows[0].revision;
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[fan]);await db.exec('set role authenticated');
 await db.query('select public.news_suggestion_like($1)',[idea]);
 await db.query('select public.news_suggestion_like($1)',[idea]);
 await db.exec('reset role');
 const revAfter=(await db.query('select revision from accounts_private.profiles where owner=$1',[author])).rows[0].revision;
 assert.equal(revAfter,revBefore);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[guest]);await db.exec('set role authenticated');
 await assert.rejects(db.query("select public.news_action('like',$1,null)",[post]));
 await db.exec('reset role');
 for(const safe of ['I wish it had more arenas','Let us finish it together','This boss is a bit challenging','Can we crush it on hard?','Do not pass hole 8']){
  assert.equal((await db.query('select news_private.unkind($1) bad',[safe])).rows[0].bad,false,safe);
 }
 for(const bad of ['f.u.c.k','f u c k','fuuuuck','sh!t','shiiit','a$$hole','kill yourself']){
  assert.equal((await db.query('select news_private.unkind($1) bad',[bad])).rows[0].bad,true,bad);
 }
});
