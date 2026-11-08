const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Machine,symbols}=require('../jackpot-slots.js');
const {Tracker}=require('../achievements.js');
const Customs=require('../customs.js');
test('three reels draw independently from five symbols and settle separately',()=>{
  const picks=[0,.4,.8];const machine=new Machine(()=>picks.shift());
  for(let i=0;i<15;i++) machine.advance(.1,true);
  assert.deepEqual(symbols,['seven','star','cherry','diamond','bell']);
  assert.deepEqual(machine.targets,[0,2,4]);
  assert.equal(machine.positions[0],0);
  assert.notEqual(machine.positions[1],2);
  assert.notEqual(machine.positions[2],4);
  let result;
  for(let i=0;i<12;i++) result=machine.advance(.1,true)||result;
  assert.deepEqual(result,[0,2,4]);
  assert.deepEqual(machine.positions,[0,2,4]);
  assert.equal(machine.advance(.1,true),null);
});
test('hidden or unequipped spins reset and never finish in the background',()=>{
  const machine=new Machine(()=>0);
  for(let i=0;i<20;i++)machine.advance(.1,true);
  assert.equal(machine.advance(60,false),null);
  assert.equal(machine.advance(60,true),null);
  assert.ok(machine.elapsed<=.1);
});
test('777 requires equipped, visible, legitimately unlocked Cubie and awards once',()=>{
  let tracker=new Tracker();
  assert.equal(tracker.slotResult([0,0,0],'chaos_jackpot',true).changed,false);
  tracker.data.unlocked.chaos_score_3000=new Date().toISOString();
  for(const [symbols,custom,visible] of [[[0,1,0],'chaos_jackpot',true],[[0,0,0],'classic',true],[[0,0,0],'chaos_jackpot',false],[[0,0],'chaos_jackpot',true]])
    assert.equal(tracker.slotResult(symbols,custom,visible).changed,false);
  assert.ok(tracker.slotResult([0,0,0],'chaos_jackpot',true).earned.some(a=>a.id==='chaos_jackpot_777'));
  const stamp=tracker.data.unlocked.chaos_jackpot_777;
  tracker=new Tracker(JSON.parse(JSON.stringify(tracker.data)));
  assert.equal(tracker.slotResult([0,0,0],'chaos_jackpot',true).changed,false);
  assert.equal(tracker.data.unlocked.chaos_jackpot_777,stamp);
});
test('each reel renders all five symbols behind its own unique clip',()=>{
  const art=Customs.svg(Customs.catalog.find(c=>c.id==='chaos_jackpot'));
  assert.equal((art.match(/data-jackpot-reel=/g)||[]).length,3);
  for(const symbol of symbols) assert.equal((art.match(new RegExp(`data-slot-symbol="${symbol}"`,'g'))||[]).length,6);
});
