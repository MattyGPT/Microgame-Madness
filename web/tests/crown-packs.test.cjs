const {test}=require('node:test');const assert=require('node:assert/strict');
const crowns=require('../crown-packs.js');
const cubies=require('../customs.js'),turtles=require('../turtle-customs.js'),trails=require('../trails.js');
crowns.install(cubies,turtles,trails);
test('six live crowns grant all three pieces and revoke them without permanent ownership',async()=>{
  assert.equal(crowns.games.length,6);
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
  assert.equal(index.find(g=>g.id==='exclusive').items.length,6);
});
test('cached entitlement expires even when a request never completes',async()=>{
  await crowns.refresh({configured:true,listGame:async()=>[{rank:1,is_you:true}]},'expiry-owner');
  assert.equal(crowns.has('hangman'),true);
  const now=Date.now;try{const time=now();Date.now=()=>time+45001;assert.equal(crowns.has('hangman'),false);}finally{Date.now=now;}
});
