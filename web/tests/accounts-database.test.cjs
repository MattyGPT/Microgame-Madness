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
async function setup(t) {
  const db = new PGlite(); t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
  for (const filename of fs.readdirSync(path.resolve(__dirname,'../../supabase/migrations')).filter(f => f.endsWith('.sql')).sort())
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
  assert.equal((await ranking()).length,0);
  await apply(first,op('share','settings',{changes:{leaderboard:true,publicProfile:true,player:'Arcade name'},baseRevisions:{}}));
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
  await apply(first,op('hide','settings',{changes:{leaderboard:false},baseRevisions:{leaderboard:1}}));
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
  await db.query("insert into leaderboard_private.scores(player_id,mode,difficulty,player,score) values($1,'hangman','easy','You',1)",[first]);
  for(let n=3;n<=16;n++){
    const id=`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
    await db.query('insert into auth.users values($1)',[id]);
    await db.query("insert into leaderboard_private.scores(player_id,mode,difficulty,player,score) values($1,'hangman','easy',$2,10)",[id,`Player ${n}`]);
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
