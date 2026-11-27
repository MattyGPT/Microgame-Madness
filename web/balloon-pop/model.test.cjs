const {test}=require('node:test');const assert=require('node:assert/strict');const {Run,modes}=require('./model.js');
test('all four modes start with five lives and use requested multipliers',()=>{for(const [i,name] of Object.keys(modes).entries()){const r=new Run(name);assert.equal(r.lives,5);r.score=123;assert.equal(r.weighted,123*[1,3,5,7.5][i]);}assert.ok(modes.impossible.width>modes.normal.width);});
test('spawn rate and rise speed increase, with bounded spawns',()=>{const r=new Run('normal',()=>.5);r.spawn();const speed=r.balloons[0].speed,interval=r.interval;r.time=90;r.spawn();assert.ok(r.balloons[1].speed>speed);assert.ok(r.interval<interval);r.time=1e6;assert.ok(r.interval>=.13);});
test('quick pops, combos, stars and misses have distinct effects',()=>{const r=new Run('normal',()=>.5);for(let i=0;i<12;i++){r.spawn();const b=r.balloons.at(-1);assert.ok(r.pop(b.x,b.y));r.time+=.1;}assert.equal(r.popped,12);assert.equal(r.quick,12);assert.equal(r.bestCombo,12);assert.ok(r.score>12*15+25);assert.equal(r.pop(0,0),false);assert.equal(r.combo,0);assert.equal(r.lives,5);});
test('escaped balloons consume exactly five lives and end the run',()=>{const r=new Run();for(let i=0;i<6;i++){r.spawn();r.balloons.at(-1).y=-100;}r.tick(.01);assert.equal(r.lives,0);assert.equal(r.over,true);assert.equal(r.missed,5);const time=r.time;r.tick(.1);assert.equal(r.time,time);assert.equal(r.pop(0,0),false);});
test('mouse assistance accepts a small edge margin without enlarging touch targets',()=>{const r=new Run('normal',()=>.5);r.spawn();const b=r.balloons[0],x=b.x+b.radius+3,y=b.y;assert.equal(r.pop(x,y),false);assert.equal(r.pop(x+3,y,4),false);assert.equal(r.pop(x,y,4),true);});

test('every mode starts 40 percent slower while retaining its acceleration slope',()=>{
 for(const name of Object.keys(modes)){const r=new Run(name,()=>.5);r.spawn();assert.ok(Math.abs(r.balloons[0].speed-modes[name].speed*.6)<1e-8);r.time=95;r.spawn();assert.ok(Math.abs(r.balloons[1].speed-modes[name].speed*1.6)<1e-8);}
});
test('larger mouse assist still gives direct hits priority',()=>{
 const r=new Run('normal',()=>.5);r.spawn();const b=r.balloons[0];assert.equal(r.pop(b.x+b.radius+6,b.y),false);assert.equal(r.pop(b.x+b.radius+6,b.y,7),true);
});
