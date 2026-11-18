const {test}=require('node:test'),assert=require('node:assert/strict');
const {Round,difficulty}=require('../treasure-trove.js');
test('difficulty increases chest count, shuffle count and speed within playable bounds',()=>{
  assert.equal(difficulty(1).count,3);assert.equal(difficulty(16).count,8);
  for(let i=2;i<100;i++){assert.ok(difficulty(i).count>=difficulty(i-1).count);assert.ok(difficulty(i).seconds<=difficulty(i-1).seconds);assert.ok(difficulty(i).swaps>=difficulty(i-1).swaps);}
  assert.equal(difficulty(1000).seconds,.22);assert.equal(difficulty(1000).count,8);
});
test('all shuffle techniques preserve chest identities and exactly one correct answer',()=>{
  const techniques=new Set();let seed=8;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(const number of [1,3,6,9,20,100]){
    const round=new Round(number,random);assert.equal(round.choose(0),null);
    for(let i=0;i<5000&&round.phase!=='choose';i++){
      round.advance(.02);if(round.move)techniques.add(round.move.type);
      assert.equal(new Set(round.order).size,round.settings.count);
      for(const p of round.positions()){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.x>0&&p.x<1&&p.y>0&&p.y<1);}
    }
    assert.equal(round.phase,'choose');assert.equal(round.choose(round.order.indexOf(round.target)),true);assert.equal(round.choose(0),null);
  }
  assert.deepEqual([...techniques].sort(),['Crossing swap','Double crossing','False swap','Three-chest carousel'].sort());
});
test('wrong selections lose, and invalid slots cannot consume the guess',()=>{
  const round=new Round(3,()=>.1);while(round.phase!=='choose')round.advance(.05);
  assert.equal(round.choose(-1),null);assert.equal(round.choose(99),null);assert.equal(round.phase,'choose');
  assert.equal(round.choose((round.order.indexOf(round.target)+1)%round.order.length),false);assert.equal(round.phase,'lost');
});
test('Treasure Trove theme is playable, finite and available in the jukebox',()=>{
  const music=require('../music.js');assert.ok(music.jukeboxTracks.some(t=>t.id==='treasure_trove'));assert.ok(!music.arcadeTracks.some(t=>t.id==='treasure_trove'));
  const audio=music.compose('treasure_trove',22050);assert.ok(audio.length>22050*30);assert.ok(audio.every(Number.isFinite));assert.ok(audio.some(value=>Math.abs(value)>.05));assert.ok(audio.every(value=>Math.abs(value)<=1)); // Same renderer used by the game's looping theme and jukebox.
});
