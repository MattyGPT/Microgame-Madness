const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { PGlite } = require('@electric-sql/pglite');
const Rules = require('../../shared/account-rules.js');

const first = '00000000-0000-0000-0000-000000000001';
const second = '00000000-0000-0000-0000-000000000002';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function op(id, kind, payload = {}, runId) { return { id, version: 1, streamId: 'device', kind, payload, ...(runId ? { runId } : {}) }; }
async function setup(t, { legacy = false, withoutCombined = false } = {}) {
  const db = new PGlite(); t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
  for (const filename of fs.readdirSync(path.resolve(__dirname,'../../supabase/migrations')).filter(f => f.endsWith('.sql') && (!withoutCombined || (!f.includes('combined_leaderboards') && !f.includes('keyrush_endurance') && !f.includes('wrath_variants'))) && (!legacy || (!f.includes('lifetime_leaderboards') && !f.includes('combined_leaderboards') && !f.includes('keyrush_endurance') && !f.includes('wrath_variants')))).sort())
    await db.exec(fs.readFileSync(path.resolve(__dirname,'../../supabase/migrations',filename),'utf8'));
  await db.query('insert into auth.users values($1),($2)',[first,second]);
  const role = async (name, owner = '') => {
    await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]); await db.exec(`set role ${name}`);
  };
  const call = async (name, params) => (await db.query(`select public.${name}(${params.map((_,i)=>`$${i+1}`).join(',')}) as value`, params)).rows[0].value;
  const read = async owner => { await role('service_role'); return call('account_read',[owner,JSON.stringify(Rules.initial())]); };
  const commit = async (owner, operation, current, next) => {
    await role('service_role');
    return call('account_commit',[owner,operation.id,digest(operation),current.revision,JSON.stringify(next.state),JSON.stringify(next.result),next.run?JSON.stringify(next.run):null,operation.kind]);
  };
  const apply = async (owner, operation) => {
    const current = await read(owner);
    const next = Rules.apply(current.state,operation,{now:Date.now()});
    const result = await commit(owner,operation,current,next);
    return { result, next, current };
  };
  const ranking = async (owner = '', season = null, around = false, limit = 10) => {
    await role(owner?'authenticated':'anon',owner);
    return (await db.query('select * from public.get_account_leaderboard($1,$2,$3,$4,$5,$6)',['hangman','easy',season,0,limit,around])).rows;
  };
  return {db,role,call,read,commit,apply,ranking};
}

test('account SQL isolates private data and never grants computed-state writes to browser roles', async t => {
  const {db,role,call,read} = await setup(t);
  const account = await read(first);
  assert.equal(account.revision,0);
  for (const name of ['anon','authenticated']) {
    await role(name,second);
    for (const table of ['profiles','runs','receipts','wallet_entries','imports','deleted_accounts','guest_visibility'])
      await assert.rejects(db.exec(`select * from accounts_private.${table}`),{code:'42501'});
    for (const [fn,args] of [['account_read',[first,'{}']],['account_export',[first]],['account_delete',[first]],['account_history',[first]],
      ['account_receipt',[first,'id','0'.repeat(64)]],['account_dependencies',[first,['id']]],['account_moderate',[first,true,'forged operator']]])
      await assert.rejects(call(fn,args),{code:'42501'});
    await assert.rejects(call('account_commit',[first,'forged','0'.repeat(64),0,JSON.stringify(account.state),'{}',null,'settings']),{code:'42501'});
  }
  await role('anon');
  assert.equal(await call('get_account_public_profile',[account.public_id]),null);
});

test('guest visibility withdraws existing results, stays owner-scoped, and cannot override account or operator privacy', async t => {
  const {db,role,call,read,apply,ranking} = await setup(t);
  await role('authenticated',first);
  await call('submit_leaderboard_score',['hangman','easy','First guest',10]);
  await role('authenticated',second);
  await call('submit_leaderboard_score',['hangman','easy','Second guest',9]);
  assert.equal((await ranking()).length,2); // Historical guests remain visible until opting out.
  await role('anon');
  await assert.rejects(call('set_guest_leaderboard_visibility',[false]),{code:'42501'});
  await role('authenticated');
  await assert.rejects(call('set_guest_leaderboard_visibility',[false]),{code:'42501'});
  await role('authenticated',first);
  await assert.rejects(call('set_guest_leaderboard_visibility',[null]),{code:'22004'});
  assert.equal(await call('set_guest_leaderboard_visibility',[false]),false);
  await assert.rejects(call('submit_leaderboard_score',['hangman','easy','First guest',10]),{code:'42501'});
  assert.deepEqual((await ranking()).map(row=>row.player),['Second guest']);
  await role('anon');
  assert.deepEqual((await db.query("select * from public.get_leaderboard('hangman','easy')")).rows.map(row=>row.player),['Second guest']);
  await role('authenticated',second);
  assert.equal(await call('set_guest_leaderboard_visibility',[true]),true);
  assert.deepEqual((await ranking()).map(row=>row.player),['Second guest']); // Another caller cannot restore first.
  await role('authenticated',first);
  assert.equal(await call('set_guest_leaderboard_visibility',[true]),true);
  assert.equal((await ranking()).length,2);
  await role('service_role'); await call('account_moderate',[first,true,'guest suppression']);
  await role('authenticated',first);
  assert.equal(await call('set_guest_leaderboard_visibility',[true]),false);
  assert.deepEqual((await ranking()).map(row=>row.player),['Second guest']);
  await role('service_role'); await call('account_moderate',[first,false,'restored']);
  await role('authenticated',first); await call('set_guest_leaderboard_visibility',[false]);
  await read(first); // Linking makes account settings authoritative, not the old guest flag.
  await role('authenticated',first);
  await assert.rejects(call('set_guest_leaderboard_visibility',[true]),{code:'42501'});
  await apply(first,op('share','settings',{changes:{leaderboard:true},baseRevisions:{}}));
  assert.equal((await ranking()).length,2);
  await role('authenticated',first);
  await assert.rejects(call('set_guest_leaderboard_visibility',[false]),{code:'42501'});
  await role('service_role'); await call('account_delete',[first]);
  await role('authenticated',first);
  await assert.rejects(call('set_guest_leaderboard_visibility',[true]),{code:'42501'});
  await role('postgres');
  assert.equal((await db.query('select count(*)::int n from accounts_private.guest_visibility where owner=$1',[first])).rows[0].n,0);
});

test('atomic receipts and independent run finalization prevent retry rewards; CAS rejects stale spending', async t => {
  const {db,role,call,read,commit,apply} = await setup(t);
  await apply(first,op('start','run.start',{mode:'hangman',difficulty:'easy'},'round'));
  const finish = op('finish','run.finish',{snapshot:{mode:'hangman',difficulty:'easy',over:true,won:true,score:10,mistakes:0,remaining:10},outcome:'win'},'round');
  const done = await apply(first,finish);
  assert.equal(done.result.status,'applied');
  const again = await commit(first,finish,done.current,done.next);
  assert.equal(again.status,'duplicate'); assert.equal(again.revision,done.result.revision);
  const collision = await commit(first,{...finish,payload:{...finish.payload,outcome:'loss'}},done.current,done.next);
  assert.equal(collision.status,'rejected'); assert.equal(collision.error.code,'operation_conflict');
  const current = await read(first);
  const distinctFinish = {...finish,id:'another-id'};
  const rejected = await commit(first,distinctFinish,current,{...done.next,state:{...current.state,shop:{...current.state.shop,units:current.state.shop.units+1000}}});
  assert.equal(rejected.error.code,'run_finalized');
  assert.equal((await read(first)).state.shop.units,current.state.shop.units);
  await role('postgres');
  assert.equal((await db.query('select count(*)::int n from accounts_private.runs')).rows[0].n,1);
  assert.equal((await db.query('select count(*)::int n from accounts_private.wallet_entries')).rows[0].n,1);
  // Two clients computed purchases from the same revision. Only the first may commit.
  await apply(second,op('seed','import',{profile:{player:'Buyer',shop:{units:100000,owned:[]}},baseline:true}));
  const before = await read(second);
  const items = Rules.catalog.filter(item=>item.price && item.price<=100).sort((a,b)=>a.price-b.price);
  const purchase1=op('buy-one','purchase',{itemId:items[0].id}),purchase2=op('buy-two','purchase',{itemId:items[1].id});
  const next1=Rules.apply(before.state,purchase1),next2=Rules.apply(before.state,purchase2);
  assert.equal((await commit(second,purchase1,before,next1)).status,'applied');
  assert.equal((await commit(second,purchase2,before,next2)).status,'revision_conflict');
  assert.equal((await commit(second,purchase1,before,next1)).status,'duplicate');
  const after=await read(second);
  assert.equal(after.state.shop.units,100000-items[0].price*1000);
  assert.deepEqual(after.state.shop.owned,[items[0].id]);
  await role('service_role');
  const exported=await call('account_export',[second]);
  assert.equal(exported.wallet.length,2); assert.equal(exported.version,1);
  assert.ok(!JSON.stringify(exported).includes('access_token'));
});

test('privacy, current names, moderation, season receipt time and deletion govern all public ranking paths', async t => {
  const {db,role,call,read,apply,ranking} = await setup(t);
  await read(first);
  await role('service_role');
  await call('account_set_season',['open','Open season',new Date(Date.now()-86400000).toISOString(),new Date(Date.now()+86400000).toISOString(),'1']);
  await call('account_set_season',['closed','Closed season',new Date(Date.now()-172800000).toISOString(),new Date(Date.now()-86400000).toISOString(),'1']);
  await apply(first,op('start','run.start',{mode:'hangman',difficulty:'easy'},'r1'));
  await apply(first,op('finish','run.finish',{snapshot:{over:true,won:true,score:9,mistakes:1},outcome:'win'},'r1'));
  assert.equal((await ranking()).length,1); // New profiles share by default.
  await apply(first,op('private','settings',{changes:{leaderboard:false,publicProfile:false},baseRevisions:{}}));
  assert.equal((await ranking()).length,0);
  await apply(first,op('share','settings',{changes:{leaderboard:true,publicProfile:true,player:'Arcade name'},baseRevisions:{leaderboard:1,publicProfile:1}}));
  const before=await ranking(first); assert.equal(before.length,1); assert.equal(before[0].is_you,true); assert.equal(before[0].player,'Arcade name');
  assert.deepEqual(Object.keys(before[0]).sort(),['rank','player','score','is_you','public_id','cubie'].sort());
  assert.notEqual(before[0].public_id,first);
  assert.equal((await ranking('', 'open')).length,1);
  assert.equal((await ranking('', 'closed')).length,0);
  await role('anon');
  const publicProfile=await call('get_account_public_profile',[before[0].public_id]);
  assert.deepEqual(Object.keys(publicProfile).sort(),['public_id','player','cubie'].sort());
  await apply(first,op('rename','settings',{changes:{player:'Renamed'},baseRevisions:{player:1}}));
  const renamed=await ranking(first); assert.equal(renamed[0].player,'Renamed'); assert.equal(renamed[0].rank,before[0].rank);
  // Existing nickname RPC cannot circumvent the new trusted result path.
  await role('authenticated',first);
  await assert.rejects(call('submit_leaderboard_score',['hangman','easy','Forged',10]),{code:'42501'});
  await role('service_role'); await call('account_moderate',[first,true,'test suppression']);
  assert.equal((await ranking()).length,0); assert.equal((await ranking('','open')).length,0);
  await role('anon'); assert.equal((await db.query("select * from public.get_leaderboard('hangman','easy')")).rows.length,0);
  await role('service_role'); await call('account_moderate',[first,false,'restored']);
  assert.equal((await ranking()).length,1);
  await apply(first,op('hide','settings',{changes:{leaderboard:false},baseRevisions:{leaderboard:2}}));
  assert.equal((await ranking()).length,0);
  await role('service_role'); await call('account_delete',[first]); await call('account_delete',[first]);
  await assert.rejects(read(first),/account_deleted/);
  await role('postgres');
  assert.equal((await db.query('select count(*)::int n from accounts_private.runs')).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from accounts_private.wallet_entries')).rows[0].n,0);
  await db.query('delete from auth.users where id=$1',[first]);
  assert.equal((await db.query('select count(*)::int n from accounts_private.deleted_accounts')).rows[0].n,1);
});

test('history has stable owner-specific cursor pages and imports do not invent runs or seasonal records', async t => {
  const {role,call,read,apply} = await setup(t);
  await apply(first,op('legacy','import',{baseline:true,profile:{player:'Legacy',scores:{'hangman:easy':[{player:'Legacy',score:10}]},shop:{units:50000,owned:[]}}}));
  await role('service_role');
  assert.deepEqual((await call('account_history',[first])).runs,[]);
  const before=await read(first);
  assert.throws(()=>Rules.apply(before.state,op('again','import',{baseline:true,profile:{shop:{units:50000}}})),/already closed/);
  await apply(first,op('extra','import',{profile:{player:'Other',shop:{units:999999,owned:[]}}}));
  assert.equal((await read(first)).state.shop.units,50000);
  for(let index=0;index<3;index++) {
    await apply(first,op(`s${index}`,'run.start',{mode:'hangman',difficulty:'easy'},`r${index}`));
    await apply(first,op(`f${index}`,'run.finish',{snapshot:{over:true,won:false,score:0,mistakes:10},outcome:'loss'},`r${index}`));
  }
  await role('service_role');
  const page=await call('account_history',[first,2]);
  assert.equal(page.runs.length,2); assert.ok(page.next_cursor);
  const next=await call('account_history',[first,2,page.next_cursor]);
  assert.equal(next.runs.length,1); assert.equal(next.next_cursor,null);
  assert.equal(new Set([...page.runs,...next.runs].map(run=>run.id)).size,3);
  assert.deepEqual((await call('account_history',[second,20])).runs,[]);
  assert.equal((await call('account_history',[first,20,null,'hangman','easy','win'])).runs.length,0);
});

test('nearby rankings include players beyond the first page and terminal rejections retain their original meaning',async t=>{
  const {db,role,call,read,ranking}=await setup(t);
  await role('postgres');
  await db.query("insert into leaderboard_private.scores(player_id,mode,difficulty,player,score,total) values($1,'hangman','easy','You',1,1)",[first]);
  for(let n=3;n<=16;n++){
    const id=`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
    await db.query('insert into auth.users values($1)',[id]);
    await db.query("insert into leaderboard_private.scores(player_id,mode,difficulty,player,score,total) values($1,'hangman','easy',$2,10,10)",[id,`Player ${n}`]);
  }
  const top=await ranking(first);assert.equal(top.length,10);assert.equal(top.some(row=>row.is_you),false);
  const nearby=await ranking(first,null,true,5);assert.equal(Number(nearby.find(row=>row.is_you).rank),15);
  assert.ok(nearby.every(row=>Number(row.rank)>=13));
  const state=await read(second);
  await role('service_role');
  const denied=await call('account_reject',[second,'denied','0'.repeat(64),state.revision,JSON.stringify({code:'insufficient_funds',message:'Not enough Cash'})]);
  assert.equal(denied.status,'rejected');
  assert.deepEqual(await call('account_receipt',[second,'denied','0'.repeat(64)]),denied);
  assert.equal((await call('account_receipt',[second,'denied','1'.repeat(64)])).error.code,'operation_conflict');
});

test('lifetime totals add 4 + 9 + 8 once for guests and accounts, with isolated difficulties and seasons', async t => {
  const { db, role, call, apply, ranking, commit } = await setup(t);
  await role('authenticated', first);
  const ids = ['10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003'];
  for (const [i, score] of [4, 9, 8].entries()) {
    await call('submit_leaderboard_run', [ids[i], 'hangman', 'easy', 'Guest', score]);
    await call('submit_leaderboard_run', [ids[i], 'hangman', 'easy', 'Guest', score]);
  }
  assert.equal((await ranking(first))[0].score, 21);
  await role('authenticated', first);
  await assert.rejects(call('submit_leaderboard_run', [ids[0], 'hangman', 'easy', 'Guest', 5]), {code: '22023'});
  await call('submit_leaderboard_run', ['10000000-0000-0000-0000-000000000004', 'hangman', 'hard', 'Guest', 5]);
  assert.equal((await ranking(first))[0].score, 21);
  await role('service_role');
  await call('account_set_season', ['total-season', 'Total season', new Date(Date.now()-86400000).toISOString(), new Date(Date.now()+86400000).toISOString(), '1']);
  for (const [i, score] of [4, 9, 8].entries()) {
    await apply(second, op(`start-${i}`, 'run.start', {mode:'hangman', difficulty:'easy'}, `run-${i}`));
    const finish = op(`finish-${i}`, 'run.finish', {snapshot:{over:true, won:true, score}, outcome:'win'}, `run-${i}`);
    const done = await apply(second, finish);
    await commit(second, finish, done.current, done.next);
  }
  const accountRow = (await ranking(second)).find(row => row.is_you);
  assert.equal(accountRow.score, 21);
  assert.equal((await ranking(second, 'total-season'))[0].score, 21);
  await role('postgres');
  assert.equal((await db.query('select score from leaderboard_private.scores where player_id=$1 and difficulty=$2', [second, 'easy'])).rows[0].score, 9);
  await role('authenticated', second);
  await assert.rejects(call('submit_leaderboard_run', [ids[0], 'hangman', 'easy', 'Account bypass', 4]), {code:'42501'});
  await role('anon');
  await assert.rejects(call('submit_leaderboard_run', [ids[0], 'hangman', 'easy', 'Impostor', 4]), {code:'42501'});
});

test('guest conversion cannot count an already-published run twice', async t => {
  const {role,call,apply,ranking} = await setup(t);
  const runId = 'converted-guest-run';
  await role('authenticated', first);
  assert.equal(await call('submit_leaderboard_run', [runId,'hangman','easy','Guest',9]),9);
  await apply(first, op('start-imported','run.start',{mode:'hangman',difficulty:'easy'},runId));
  await apply(first, op('finish-imported','run.finish',{snapshot:{over:true,won:true,score:9},outcome:'win'},runId));
  assert.equal((await ranking(first))[0].score,9);
  await apply(first, op('start-next','run.start',{mode:'hangman',difficulty:'easy'},'next'));
  await apply(first, op('finish-next','run.finish',{snapshot:{over:true,won:true,score:4},outcome:'win'},'next'));
  assert.equal((await ranking(first))[0].score,13);
});

test('migration recovers account history and preserves the known guest baseline', async t => {
  const {db,role,call,apply,ranking} = await setup(t, {legacy:true});
  for (const [i,score] of [4,9,8].entries()) {
    await apply(first,op(`old-start-${i}`,'run.start',{mode:'hangman',difficulty:'easy'},`old-${i}`));
    await apply(first,op(`old-finish-${i}`,'run.finish',{snapshot:{over:true,won:true,score},outcome:'win'},`old-${i}`));
  }
  assert.equal((await ranking(first))[0].score,9);
  await role('authenticated',second);
  await call('submit_leaderboard_score',['hangman','easy','Old guest',7]);
  await role('postgres');
  await db.exec(fs.readFileSync(path.resolve(__dirname,'../../supabase/migrations/20261111000000_lifetime_leaderboards.sql'),'utf8'));
  assert.equal((await ranking(first)).find(row=>row.is_you).score,21);
  assert.equal((await ranking(second)).find(row=>row.is_you).score,7);
  await role('authenticated',second);
  assert.equal(await call('submit_leaderboard_run',['new-after-migration','hangman','easy','Old guest',8]),15);
  await call('submit_leaderboard_score',['hangman','easy','Old client retry',7]);
  assert.equal((await ranking(second)).find(row=>row.is_you).score,15);
});

test('combined boards use exact multipliers, round once, preserve raw scores, and enforce visibility', async t => {
  const {db,role,call,read} = await setup(t);
  const {multipliers}=require('../leaderboards.js');
  const board = async (mode, season=null, offset=0, limit=10, around=false) =>
    (await db.query('select * from public.get_game_leaderboard($1,$2,$3,$4,$5)',[mode,season,offset,limit,around])).rows;
  await role('postgres');
  for(const [mode,weights] of Object.entries(multipliers)) for(const [difficulty,weight] of Object.entries(weights)) {
    assert.equal((await db.query('select leaderboard_private.weight_quarters($1,$2) weight',[mode,difficulty])).rows[0].weight,weight*4);
  }
  await role('authenticated',first);
  for(const [i,difficulty] of ['easy','normal','chaos','hard','merciless','impossible'].entries())
    await call('submit_leaderboard_run',[`dodge-${i}`,'dodge',difficulty,'Combined player',10]);
  const dodge=await board('dodge');
  assert.equal(dodge.length,1); assert.equal(dodge[0].score,190); assert.equal(dodge[0].is_you,true);
  for(const [difficulty,score] of [['easy',4],['medium',6],['hard',5]])
    await call('submit_leaderboard_run',[`word-${difficulty}`,'hangman',difficulty,'Combined player',score]);
  assert.equal((await board('hangman'))[0].score,39);
  for(let n=0;n<2;n++) await call('submit_leaderboard_run',[`cruel-${n}`,'boss','cruel','Combined player',1]);
  assert.equal((await board('boss'))[0].score,5); // round(1×2.25 + 1×2.25), not 2+2.
  await call('submit_leaderboard_run',['impossible','boss','impossible','Combined player',4]);
  assert.equal((await board('boss'))[0].score,28); // round(4.5 + 23)
  await role('postgres');
  assert.equal((await db.query("select total::int from leaderboard_private.scores where player_id=$1 and mode='boss' and difficulty='cruel'",[first])).rows[0].total,2);
  await role('authenticated',second);
  await call('submit_leaderboard_run',['competitor','boss','mean','Second',27]);
  assert.equal((await board('boss'))[0].player,'Combined player');
  assert.equal((await board('boss',null,1,1))[0].player,'Second');
  assert.ok((await board('boss',null,0,10,true)).some(row=>row.is_you));
  await role('authenticated',first);
  await call('set_guest_leaderboard_visibility',[false]);
  await role('anon'); assert.deepEqual((await board('boss')).map(row=>row.player),['Second']);
  await assert.rejects(board('invalid'),{code:'22023'});
  await assert.rejects(db.exec('select * from leaderboard_private.scores'),{code:'42501'});
  await role('service_role'); await call('account_delete',[second]);
  await role('anon'); assert.equal((await board('boss')).length,0);
});

test('combined seasonal rankings weight all difficulties within the chosen period', async t=>{
  const {db,role,call,apply}=await setup(t);
  await role('service_role');
  await call('account_set_season',['combined','Combined season',new Date(Date.now()-86400000).toISOString(),new Date(Date.now()+86400000).toISOString(),'1']);
  for(const [difficulty,score] of [['easy',4],['medium',6],['hard',5]]) {
    await apply(first,op(`start-${difficulty}`,'run.start',{mode:'hangman',difficulty},difficulty));
    await apply(first,op(`finish-${difficulty}`,'run.finish',{snapshot:{over:true,won:true,score},outcome:'win'},difficulty));
  }
  await role('anon');
  const rows=(await db.query("select * from public.get_game_leaderboard('hangman','combined')")).rows;
  assert.equal(rows.length,1); assert.equal(rows[0].score,39);
  assert.equal((await db.query("select * from public.get_game_leaderboard('hangman','unknown-season')")).rows.length,0);
});

test('scores saved before combined migration are reweighted without rewriting their raw totals', async t=>{
  const {db,role,call}=await setup(t,{withoutCombined:true});
  await role('authenticated',first);
  await call('submit_leaderboard_run',['historical-mean','boss','mean','Existing player',10]);
  await call('submit_leaderboard_run',['historical-cruel','boss','cruel','Existing player',2]);
  await role('postgres');
  const before=(await db.query('select mode,difficulty,total from leaderboard_private.scores order by difficulty')).rows;
  await db.exec(fs.readFileSync(path.resolve(__dirname,'../../supabase/migrations/20261112000000_combined_leaderboards.sql'),'utf8'));
  assert.deepEqual((await db.query('select mode,difficulty,total from leaderboard_private.scores order by difficulty')).rows,before);
  await role('anon');
  const rows=(await db.query("select * from public.get_game_leaderboard('boss')")).rows;
  assert.equal(rows.length,1); assert.equal(rows[0].score,15); // round(10 + 2×2.25)
});

 test('Endurance global rounds count at half the Progressive rate', async t => {
  const { db, role, call } = await setup(t);
  await role('authenticated', first);
  await call('submit_leaderboard_run', ['endurance-1','keyboard','endurance','Typist',10]);
  const board = async () => (await db.query("select * from public.get_game_leaderboard('keyboard')")).rows;
  assert.equal((await board())[0].score,5);
  await call('submit_leaderboard_run', ['progressive-1','keyboard','progressive','Typist',10]);
  assert.equal((await board())[0].score,15);
  // Retries must not award the same run twice.
  await call('submit_leaderboard_run', ['endurance-1','keyboard','endurance','Typist',10]);
  assert.equal((await board())[0].score,15);
});


test('Wrath difficulty variants retain raw scores and carry exact global weights', async t => {
  const {db} = await setup(t);
  for (const attack of ['color_memory','bone_gauntlet','rotating_rings','magenta_fingers','chaos','royal_slams','haunted_quadrants','random_order']) {
    for (const [suffix, quarters] of [['__easy',2],['',4],['__hard',8]]) {
      const result = await db.query("select leaderboard_private.valid_mode('wrath',$1) as valid, leaderboard_private.weight_quarters('wrath',$1) as weight", [attack+suffix]);
      assert.deepEqual(result.rows[0], {valid:true, weight:quarters});
    }
  }
});
