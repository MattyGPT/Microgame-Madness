const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
test('news permissions, shared likes, filter strikes, bans and comment identity',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
 const dir=path.resolve(__dirname,'../../../supabase/migrations');for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync(path.join(dir,f),'utf8'));
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
 assert.match((await action('comment','Another idea')).error,/30 seconds/);
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
