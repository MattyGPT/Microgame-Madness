const {test}=require('node:test');const assert=require('node:assert/strict');
const crowns=require('../crown-packs.js');
const cubies=require('../customs.js'),turtles=require('../turtle-customs.js'),trails=require('../trails.js');
crowns.install(cubies,turtles,trails);
test('thirteen live crowns grant all three pieces and revoke them without permanent ownership',async()=>{
  assert.equal(crowns.games.length,13);
  const client={configured:true,listGame:async mode=>[{rank:1,is_you:mode==='hangman'}]};
  await crowns.refresh(client,'owner-a');
  for(const [api,slot] of [[cubies,'cubie'],[turtles,'turtle'],[trails,'trail']]){
    const id=`crown_hangman_${slot}`;assert.ok(crowns.equip(slot,id));
    assert.equal(crowns.equipped(slot,null),id);assert.equal(api.selected(id,slot==='cubie'?{}:[]).id,id);
  }
  assert.equal(crowns.has('keyboard'),false);
  await crowns.refresh({...client,listGame:async()=>[{rank:1,is_you:false},{rank:2,is_you:true}]},'owner-a');
  assert.equal(crowns.equipped('cubie','classic'),'classic');assert.equal(cubies.selected('crown_hangman_cubie',{}).id,'classic');
  assert.equal(turtles.selected('crown_hangman_turtle',[]),null);
  assert.equal(trails.selected('crown_hangman_trail',[]),null);
});
test('network failure and identity switches cannot retain a crown; stale requests cannot grant it',async()=>{
  await crowns.refresh({configured:true,listGame:async()=>[{rank:1,is_you:true}]},'a');assert.ok(crowns.has('boss'));
  await crowns.refresh({configured:true,listGame:async()=>{throw Error('offline');}},'a');assert.equal(crowns.has('boss'),false);
  let finish;const pending=new Promise(r=>finish=r);
  const work=crowns.refresh({configured:true,listGame:()=>pending},'a');crowns.identity('b');finish([{rank:1,is_you:true}]);await work;
  assert.equal(crowns.has('hangman'),false);assert.equal(crowns.equip('cubie','crown_hangman_cubie'),false);
});
test('new shop art and overlapping collection memberships',()=>{
  const groups=require('../collections.js');
  const retro=cubies.catalog.find(i=>i.id==='shop_retro'),invisible=cubies.catalog.find(i=>i.id==='shop_invisible');
  assert.equal(retro.price,1000);assert.equal(invisible.price,600);
  assert.match(cubies.svg(retro),/crispEdges/);assert.doesNotMatch(cubies.svg(invisible),/cubie-smile|cubie-front/);
  const index=groups.groups(cubies.catalog);assert.ok(index.find(g=>g.id==='silver').items.includes(retro));assert.ok(index.find(g=>g.id==='color-green').items.includes(retro));assert.ok(index.find(g=>g.id==='arcade').items.includes(retro));
  assert.equal(index.find(g=>g.id==='exclusive').items.length,13);
});
test('cached entitlement expires even when a request never completes',async()=>{
  await crowns.refresh({configured:true,listGame:async()=>[{rank:1,is_you:true}]},'expiry-owner');
  assert.equal(crowns.has('hangman'),true);
  const now=Date.now;try{const time=now();Date.now=()=>time+45001;assert.equal(crowns.has('hangman'),false);}finally{Date.now=now;}
});

test('existing leaders celebrate once per account, survive reload and offline checks, and celebrate regained crowns',async()=>{
  const stored=new Map();const previous=global.localStorage;
  global.localStorage={getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)};
  const winning={configured:true,listGame:async mode=>[{rank:1,is_you:mode==='hangman'}]};
  try{
    await crowns.refresh(winning,'notice-owner');assert.deepEqual(crowns.celebrations().map(g=>g.mode),['hangman']);
    crowns.acknowledge(['hangman']);assert.equal(crowns.celebrations().length,0);
    crowns.identity('another-owner');await crowns.refresh(winning,'notice-owner');assert.equal(crowns.celebrations().length,0);
    await crowns.refresh({configured:true,listGame:async()=>{throw Error('offline');}},'notice-owner');
    await crowns.refresh(winning,'notice-owner');assert.equal(crowns.celebrations().length,0);
    await crowns.refresh({...winning,listGame:async()=>[{rank:1,is_you:false}]},'notice-owner');
    await crowns.refresh(winning,'notice-owner');assert.equal(crowns.celebrations().length,1);
    await crowns.refresh(winning,'new-notice-owner');assert.equal(crowns.celebrations().length,1);
  }finally{global.localStorage=previous;crowns.identity(null);}
});

test('Penguin Pool Golden Rack requires verified first place and revokes on loss',async()=>{
 await crowns.refresh({configured:true,listGame:async mode=>[{rank:mode==='pool'?1:2,is_you:true}]},'pool-player');
 assert.equal(crowns.has('pool'),true);assert.ok(crowns.equip('cubie','crown_pool_cubie'));
 assert.match(crowns.art(cubies.catalog.find(i=>i.id==='crown_pool_cubie')),/M75 34 133 133H17Z/);
 await crowns.refresh({configured:true,listGame:async()=>[{rank:2,is_you:true}]},'pool-player');
 assert.equal(crowns.equipped('cubie','classic'),'classic');
});
test('Balloon Pop gives all three pieces, 50 satellite balloons, and 20 ordered keyboard expressions',async()=>{
 await crowns.refresh({configured:true,listGame:async mode=>[{rank:1,is_you:mode==='balloon'}]},'sky-player');
 for(const slot of ['cubie','turtle','trail'])assert.ok(crowns.equip(slot,`crown_balloon_${slot}`));
 const item=cubies.catalog.find(i=>i.id==='crown_balloon_cubie'),svg=crowns.art(item);
 assert.equal((svg.match(/class="ex-satellite-balloon"/g)||[]).length,50);assert.match(svg,/ex-flame/);
 assert.ok(crowns.celebrations().some(g=>g.mode==='balloon'));crowns.acknowledge(['balloon']);assert.equal(crowns.celebrations().length,0);
 const keyboard=crowns.art(cubies.catalog.find(i=>i.id==='crown_keyboard_cubie'));assert.equal((keyboard.match(/data-expression=/g)||[]).length,20);
 assert.ok(crowns.games.some(g=>g.name==='Nanoverse Luminary'));assert.ok(crowns.games.every(g=>g.name!=='Microverse Luminary'));
 await crowns.refresh({configured:true,listGame:async()=>[{rank:2,is_you:true}]},'sky-player');assert.equal(crowns.has('balloon'),false);
});
