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
  vm.runInContext(source.replace(/\}\)\(\);\s*$/,`globalThis.encounter={load(n){round=n;hp=12;enter('attack');},step:update,tuning:attackTuning,fire,makeEffect,coreSequence,pressF,seek(value){t=value;},aim(a){mouse={x:p.x+Math.cos(a)*100,y:p.y+Math.sin(a)*100};},safe(value){document.querySelector('#practice-safe').checked=value;},read(){return {phase,t,volley,bullets,lasers,hp,shieldIntegrity,shieldBroken,beamBlocking};}};})();`),context);
  return context.encounter;
}
test('all twenty attacks fire faster and more often',()=>{
  const game=encounter();
  for(let round=0;round<20;round++){
    game.load(round);const config=game.tuning();
    assert.ok(config.speed>185+round*9);
    assert.ok(config.interval<Math.max(.25,.85-round*.025));
    game.step(1/120);
    const bullet=game.read().bullets[0];
    assert.ok(Math.abs(Math.hypot(bullet.vx,bullet.vy)-(round===6?510:config.speed))<.001);
    for(let i=0;i<1080;i++)game.step(1/120);
    assert.equal(game.read().phase,'attack');
    if(round!==9)assert.ok(game.read().volley>=Math.floor(9/(round===6?.38:config.interval)));else assert.ok(game.read().volley>0&&game.read().volley<10);
  }
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
    if(i%24===0)game.pressF();game.step(1/120);
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
