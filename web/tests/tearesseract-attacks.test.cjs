const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function encounter(){
  const elements=new Map();
  const element=id=>{if(!elements.has(id))elements.set(id,{checked:id==='#practice-safe',textContent:'',append(){},addEventListener(){},getContext(){return {};}});return elements.get(id);};
  const context={document:{querySelector:element,addEventListener(){},createElement(){return {};}},window:{addEventListener(){}},requestAnimationFrame(){},Math};
  vm.createContext(context);
  const source=fs.readFileSync(require.resolve('../tearesseract.js'),'utf8');
  // Observe the real encounter without exposing development hooks to players.
  vm.runInContext(source.replace(/\}\)\(\);\s*$/,`globalThis.encounter={load(n){round=n;hp=12;enter('attack');},step:update,updatePrismMist,tuning:attackTuning,fire,makeEffect,coreSequence,beamGeometry,pressF,duration,shieldProfile,shieldCovers,updateShieldAim,angle,chaosTempo,moving,chaosPhase,overdriveFinale,arenaBounds,spawnBlackHole,updateBlackHoles,enter,pose(x,y){p={x,y};},hazards(b,l=[]){bullets=b;lasers=l;spawn=99;laserTimer=99;},seek(value){t=value;},aim(a){mouse={x:p.x+Math.cos(a)*100,y:p.y+Math.sin(a)*100};},pointer(){pointerActive=true;},safe(value){document.querySelector('#practice-safe').checked=value;},read(){return {phase,t,p,volley,bullets,lasers,blackHoles,debris,prismMist,chaosSlashes,finalCuts,hp,shieldIntegrity,shieldBroken,beamBlocking};}};})();`),context);
  return context.encounter;
}
test('all twenty attacks use their requested timing and projectile tuning',()=>{
  const game=encounter();
  for(let round=0;round<20;round++){
    game.load(round);const config=game.tuning();
    const multiplier=[0,7].includes(round)?1.4:round===8?.65:round===18?1.3*.8*.96*.91:round===13?.85:1;
    assert.equal(config.speed,(275+round*13)*multiplier);
    game.step(1/120);
    if([5,10,15].includes(round)){assert.equal(game.read().blackHoles.length,0);assert.equal(game.duration(),18);}
    else{const bullet=game.read().bullets[0];assert.ok(Math.abs(Math.hypot(bullet.vx,bullet.vy)-(round===6?510:config.speed))<.001);}
    for(let i=0;i<1080;i++)game.step(1/120);
    assert.equal(game.read().phase,'attack');
    if(![3,5,9,10,15].includes(round))assert.ok(game.read().volley>=Math.floor((round===18?5:9)/(round===6?.38:config.interval)));
    else assert.ok(game.read().volley>0&&game.read().volley<10);
  }
  game.load(18);assert.equal(game.tuning().interval,(.58-18*.016)/(1.35*.93));
});
test('late movement attacks pair telegraphed lasers and preserve slow healing',()=>{
  const game=encounter();game.load(19);game.step(.01);
  const lasers=game.read().lasers;
  assert.equal(lasers.length,0);
  for(let i=0;i<145;i++)game.step(1/120);
  assert.equal(game.read().lasers.length,2);
  assert.ok(game.read().lasers.every(l=>l.warning>=.65&&l.warning<1));
  game.fire(0,true);const heal=game.read().bullets.at(-1);
  assert.equal(Math.hypot(heal.vx,heal.vy),115);
  for(let i=0;i<1200;i++)game.step(1/120);
  assert.equal(game.read().phase,'attack');
});

test('damage and boss crush effects render distinct finite envelopes at browser sample rates',()=>{
  const game=encounter();
  for(const rate of [44100,48000]){
    const hurt=game.makeEffect('hurt',rate),crush=game.makeEffect('crush',rate);
    assert.equal(hurt.length,Math.ceil(.32*rate));
    assert.equal(crush.length,Math.ceil(.68*rate));
    for(const data of [hurt,crush]){
      assert.equal(data[0],0);
      assert.ok(Math.abs(data.at(-1))<.001);
      assert.ok(data.every(sample=>Number.isFinite(sample)&&Math.abs(sample)<=1));
      assert.ok(data.some(sample=>Math.abs(sample)>.3));
    }
  }
});

test('core dust clears projectiles, correct shielding and F sustain stop the beam',()=>{
  const game=encounter();game.load(9);game.safe(false);game.step(.01);
  assert.ok(game.read().bullets.length>0);
  game.seek(2);game.step(.001);
  assert.ok(game.coreSequence().warning);
  assert.equal(game.read().bullets.length,0);assert.equal(game.read().lasers.length,0);
  game.seek(4);
  for(let i=0;i<600;i++){
    const sequence=game.coreSequence();game.aim(-Math.PI/2-sequence.tilt);
    if(i%60===0)game.pressF();game.step(1/120);
  }
  assert.equal(game.read().hp,12);assert.equal(game.read().shieldBroken,false);
  assert.equal(game.read().beamBlocking,true);assert.ok(game.read().shieldIntegrity>50);
});
test('shield implosion persists through final attack, resets next round, and beam is 30% faster',()=>{
  const game=encounter();game.load(19);game.seek(32);game.step(.001);
  assert.equal(game.coreSequence().speed,1.3);
  game.seek(32+2/1.3+.001);
  assert.equal(game.coreSequence().warning,false);
  for(let i=0;i<260;i++){game.aim(-Math.PI/2-game.coreSequence().tilt);game.step(1/120);}
  assert.equal(game.read().shieldBroken,true);assert.equal(game.read().beamBlocking,false);
  game.pressF();assert.equal(game.read().shieldIntegrity,0);
  game.seek(40);game.step(.01);assert.equal(game.coreSequence(),null);
  assert.equal(game.read().shieldBroken,true);assert.ok(game.read().bullets.length>0);
  game.load(10);assert.equal(game.read().shieldBroken,false);assert.equal(game.read().shieldIntegrity,100);
});
test('F cannot substitute for aiming the shield into the core beam',()=>{
  const game=encounter();game.load(9);game.safe(false);game.seek(4);game.step(.001);
  game.aim(Math.PI/2);
  for(let i=0;i<120;i++){if(i%12===0)game.pressF();game.step(1/120);}
  assert.ok(game.read().hp<12);assert.equal(game.read().shieldBroken,false);assert.equal(game.read().beamBlocking,false);
});

test('prism crosscurrent fills every row with paired, moving rainbow ribbons',()=>{
  const game=encounter();game.load(6);game.step(1/120);
  const bullets=game.read().bullets;assert.ok(bullets.length>8);
  assert.ok(bullets.every(b=>b.rainbow&&b.vy===0));
  assert.equal(bullets.filter(b=>b.vx>0).length,bullets.filter(b=>b.vx<0).length);
  assert.equal(new Set(bullets.map(b=>b.baseY)).size,7);
  assert.ok(bullets.every(b=>(b.baseY-370)%68===0));
  for(let i=0;i<180;i++)game.step(1/120);
  assert.ok(game.read().bullets.some(b=>b.beam));
  assert.ok(game.read().bullets.some(b=>Math.abs(b.y-b.baseY)>3));
  assert.ok(game.read().volley>=3);
});

test('prism ribbons weave independently with stable randomized motion parameters',()=>{
  const game=encounter();game.load(6);game.step(1/120);
  const pair=game.read().bullets.slice(0,2);
  const configs=pair.map(b=>JSON.stringify(b.weave));
  assert.notEqual(configs[0],configs[1]);
  for(let i=0;i<20;i++)game.step(1/120);
  assert.ok(Math.abs(pair[0].y-pair[1].y)>.001);
  assert.deepEqual(pair.map(b=>JSON.stringify(b.weave)),configs);
  assert.ok(pair.every(b=>b.weave.amplitude>=6&&b.weave.amplitude<=9));
});

test('Scissor Protocol doubles hostile bolts and enlarges both opposing shields; Deadlock shrinks coverage',()=>{
  const game=encounter();game.load(12);game.fire(0);
  assert.equal(game.read().bullets.length,2);
  assert.equal(game.read().bullets[0].vx,-game.read().bullets[1].vx);
  assert.equal(game.shieldProfile().scale,1.2);assert.equal(game.shieldProfile().dual,true);
  game.aim(0);game.updateShieldAim(1);assert.ok(game.shieldCovers(45,0));assert.ok(game.shieldCovers(-45,0));assert.ok(!game.shieldCovers(0,45));
  game.load(16);assert.equal(game.shieldProfile().scale,.85);game.aim(0);
  assert.ok(game.shieldCovers(25,0));assert.ok(!game.shieldCovers(-25,0));assert.ok(!game.shieldCovers(37,0));
});
test('Rain slows attacks and all red damaging hazards remove two HP',()=>{
  const game=encounter();game.load(8);game.safe(false);game.fire(0);
  assert.equal(game.read().bullets[0].red,true);assert.equal(game.read().bullets[0].damage,2);
  assert.equal(game.tuning().laserLife,.48/.65);
  game.hazards([{x:550,y:515,vx:0,vy:0,damage:2,red:true,trail:[]}]);game.step(.001);assert.equal(game.read().hp,10);
});
test('Laser Grid telegraphs both horizontal and vertical damaging lanes',()=>{
  const game=encounter();game.load(11);for(let i=0;i<145;i++)game.step(1/120);
  assert.ok(game.read().lasers.some(l=>l.axis==='horizontal'));
  assert.ok(game.read().lasers.some(l=>!l.axis));
});
test('all three core attacks sway their heads while aiming exactly at the wisp',()=>{
  const game=encounter();
  for(const n of [3,9,19]){game.load(n);game.seek(n===19?32+2.5/1.3:4.5);game.pose(550,515);
    const sequence=game.coreSequence(),geometry=game.beamGeometry(sequence);
    assert.ok(Math.abs(sequence.x-550)>60);assert.ok(Math.abs(geometry.across)<1e-8);
    assert.ok(Math.abs(sequence.tilt)>.2);
  }
});
test('black holes turn counterclockwise while retreating, without a separate turning phase',()=>{
  const game=encounter(),speed=1.4*.8;
  for(const n of [5,10,15]){
    game.load(n);game.spawnBlackHole();const h=game.read().blackHoles[0];
    for(let cycle=0;cycle<3;cycle++){
      game.updateBlackHoles(.9/speed);
      assert.ok(Math.abs(Math.hypot(h.x-h.cx,h.y-h.cy)-20)<1e-7);
      const start=Math.atan2(h.y-h.cy,h.x-h.cx);
      for(let i=0;i<90;i++){
        const before=Math.atan2(h.y-h.cy,h.x-h.cx),radius=Math.hypot(h.x-h.cx,h.y-h.cy);
        game.updateBlackHoles(.01/speed);
        const after=Math.atan2(h.y-h.cy,h.x-h.cx);
        assert.ok(Math.atan2(Math.sin(after-before),Math.cos(after-before))<0,'turns counterclockwise');
        assert.ok(Math.hypot(h.x-h.cx,h.y-h.cy)>radius,'moves outward during every part of the turn');
      }
      assert.ok(Math.abs(Math.hypot(h.x-h.cx,h.y-h.cy)-260)<1e-7);
      const end=Math.atan2(h.y-h.cy,h.x-h.cx);
      assert.ok(Math.abs(Math.atan2(Math.sin(end-start),Math.cos(end-start))+Math.PI/2)<1e-7);
    }
    game.updateBlackHoles(.001);assert.equal(h.imploding,true);
    game.updateBlackHoles(.5);assert.equal(game.read().blackHoles.length,0);assert.equal(game.duration(),18);
  }
});
test('Orbital Sentence rotates both shock positions and velocities around the wisp',()=>{
  const game=encounter();game.load(13);game.fire(0);game.hazards(game.read().bullets);const b=game.read().bullets[0];game.step(.01);
  assert.ok(b.y>515);assert.ok(b.vy<0);assert.ok(Math.abs(Math.atan2(-b.vy,-b.vx)-.01*.95*1.25)<1e-9);assert.ok(Math.hypot(b.x-550,b.y-515)<400);
});
test('victory disintegrates the boss into moving fragments and reaches the win state',()=>{
  const game=encounter();game.enter('ending');game.step(1);assert.equal(game.read().debris.length,0);
  game.step(1.1);assert.equal(game.read().debris.length,190);const part=game.read().debris[0],x=part.x;
  game.step(.1);assert.notEqual(part.x,x);
  for(let i=0;i<1300;i++)game.step(1/120);assert.equal(game.read().phase,'win');
});

test('gravity attacks anchor the wisp, spawn shockbolts, and slow smooth returns by 20 percent from the previous speed',()=>{
  const game=encounter();
  for(const n of [5,10,15]){
    game.load(n);game.spawnBlackHole();game.aim(0);game.pointer();game.step(.1);
    assert.equal(game.read().p.x,550);assert.equal(game.read().p.y,515);
    assert.ok(game.read().bullets.length>0);
    const h=game.read().blackHoles[0];assert.ok(Math.abs(h.age-.112)<1e-9);
    game.updateBlackHoles((.9-.112)/(1.4*.8));
    assert.ok(Math.abs(Math.hypot(h.x-h.cx,h.y-h.cy)-20)<1e-8);
    const x=h.x,y=h.y;game.updateBlackHoles(.001);
    assert.ok(Math.hypot(h.x-x,h.y-y)<.01,'turn begins smoothly');
  }
});

test('Prism emits independent wisps that drift and expire after their comet is removed',()=>{
  const game=encounter();game.load(6);for(let i=0;i<30;i++)game.step(1/120);
  const mist=game.read().prismMist;assert.ok(mist.length>0&&mist.length<=1200);
  assert.ok(new Set(mist.map(w=>w.maxLife)).size>3);
  const w=mist[0],x=w.x,y=w.y;game.hazards([]);game.updatePrismMist(.05);
  assert.ok(w.x!==x||w.y!==y);assert.ok(w.life<w.maxLife);
  game.updatePrismMist(1);assert.equal(game.read().prismMist.length,0);
});
test('final core rupture can be braced at three F presses per second',()=>{
  const game=encounter();game.load(19);game.safe(false);game.seek(32);game.step(.001);game.seek(32+2/1.3+.001);
  for(let i=0;i<540;i++){game.aim(-Math.PI/2-game.coreSequence().tilt);if(i%40===0)game.pressF();game.step(1/120);}
  assert.equal(game.read().hp,12);assert.equal(game.read().shieldBroken,false);
});

test('black holes wait three seconds while shockbolts start immediately',()=>{
  const game=encounter();
  for(const n of [5,10,15]){
    game.load(n);game.step(.1);assert.ok(game.read().bullets.length>0);
    for(let i=0;i<347;i++)game.step(1/120);
    assert.equal(game.read().blackHoles.length,0);
    game.step(.02);assert.equal(game.read().blackHoles.length,1);
  }
});

test('Final Appeal replaces all shocks and the shield with dodgeable, warned slashes at halfway',()=>{
  const game=encounter();game.load(18);game.safe(false);game.step(.01);assert.ok(game.read().bullets.length>0);
  game.seek(5);game.step(.001);assert.ok(game.read().bullets.every(b=>b.chaosShard));assert.equal(game.chaosPhase(),true);assert.equal(game.moving(),true);
  game.aim(0);assert.equal(game.shieldCovers(35,0),false);
  const slash=game.read().chaosSlashes[0];assert.ok(slash.warning>=.65);assert.equal(game.read().hp,12);
  game.pose(slash.x-Math.sin(slash.a)*75,slash.y+Math.cos(slash.a)*75);
  for(let i=0;i<100;i++){game.hazards([]);game.step(1/120);}
  assert.equal(game.read().hp,12);assert.ok(game.read().bullets.every(b=>b.chaosShard));
  game.load(18);game.safe(false);game.seek(5);for(let i=0;i<90;i++)game.step(1/120);assert.equal(game.read().hp,11);
});

test('Release Rain disables blocking during the attack and restores the shield afterward',()=>{
  const game=encounter();game.load(8);game.aim(0);
  assert.equal(game.moving(),true);assert.equal(game.shieldCovers(35,0),false);
  game.hazards([{x:585,y:515,vx:0,vy:0,red:true,damage:2,trail:[]}]);game.step(.001);
  assert.equal(game.read().bullets.length,1,'invisible shield must not remove bullets');
  game.enter('heal');game.aim(0);assert.equal(game.shieldCovers(35,0),true);
  game.load(9);game.aim(0);assert.equal(game.shieldCovers(35,0),true);
});

test('Final Appeal extends the dodge half and increases slice density and cadence',()=>{
  const game=encounter();game.load(18);assert.equal(game.duration(),16.25);game.seek(5);game.step(.001);
  assert.equal(game.read().chaosSlashes.length,2);
  const initial=game.read().bullets[0];assert.equal(initial.chaosShard,true);assert.ok(Math.hypot(initial.vx,initial.vy)>=360);
  for(let i=0;i<82;i++)game.step(1/120);
  assert.ok(game.read().chaosSlashes.length>=4,'next pair appears at 1.4 times the old rate');
  assert.ok(game.read().bullets.every(b=>b.chaosShard));
  game.seek(16.24);game.step(.001);assert.equal(game.read().phase,'attack');game.step(.02);assert.equal(game.read().phase,'counter');
});

test('Scissor shields have a frame-rate-independent turn cap and aiming reads cannot bypass it',()=>{
  const game=encounter();game.load(12);const before=game.angle();game.aim(0);
  for(let i=0;i<100;i++)game.angle();assert.equal(game.angle(),before);
  game.updateShieldAim(.1);assert.ok(Math.abs(game.angle()-before)<=Math.PI/5+1e-8);
  const partial=game.angle();game.updateShieldAim(.1);assert.ok(Math.abs(game.angle()-partial)<=Math.PI/5+1e-8);
  game.load(11);game.aim(0);assert.equal(game.angle(),0);
});
test('Final Appeal accelerates gradually across its 11.25 second dodge phase',()=>{
  const game=encounter();game.load(18);game.seek(5);assert.equal(game.chaosTempo(),1);
  game.seek(10.625);assert.equal(game.chaosTempo(),1.125);
  game.seek(16.25);assert.equal(game.chaosTempo(),1.25);
});

test('System Overdrive expands its arena and replaces old hazards for the extended finale',()=>{
  const game=encounter();game.load(19);assert.equal(game.duration(),58.5);game.step(.01);assert.ok(game.read().bullets.length>0);
  game.seek(45);game.step(.001);assert.equal(game.overdriveFinale(),true);assert.equal(game.read().bullets.length,0);assert.equal(game.read().lasers.length,0);
  assert.equal(game.shieldCovers(35,0),false);game.seek(46.2);game.step(.001);
  assert.equal(game.arenaBounds().w,840);assert.equal(game.arenaBounds().h,410);assert.ok(game.read().finalCuts.length>0);
  game.seek(58.49);game.step(.001);assert.equal(game.read().phase,'attack');game.step(.02);assert.equal(game.read().phase,'heal');assert.equal(game.read().p.x,550);assert.equal(game.read().p.y,525);
});
test('Overdrive radial cuts are warned, damaging only during the strike, and end with a harmless fake-out',()=>{
  const game=encounter();game.load(19);game.safe(false);game.seek(46);game.step(.001);
  const cut=game.read().finalCuts[0];game.pose(550+Math.cos(cut.a)*100,470+Math.sin(cut.a)*100);
  for(let i=0;i<60;i++)game.step(1/120);assert.equal(game.read().hp,12);
  for(let i=0;i<20;i++)game.step(1/120);assert.equal(game.read().hp,11);
  game.load(19);game.safe(false);game.seek(56.4);game.step(.001);game.pose(550,470);
  for(let i=0;i<220;i++)game.step(1/120);assert.equal(game.read().hp,12);
});

test('Overdrive spiral launches strikes 80 percent faster and small moving projectiles',()=>{
  const game=encounter();game.load(19);game.seek(46);game.step(.001);
  assert.equal(game.read().finalCuts.length,1);assert.ok(game.read().bullets.some(b=>b.finalMote&&Math.hypot(b.vx,b.vy)>200));
  for(let i=0;i<35;i++)game.step(1/120);assert.equal(game.read().finalCuts.length,2);
  assert.ok(Math.abs(game.read().finalCuts[1].a-game.read().finalCuts[0].a+Math.PI/4)<1e-8);
  game.pose(900,260);game.seek(58.49);game.step(.02);
  assert.equal(game.read().p.x,550);assert.equal(game.read().p.y,525);
});
