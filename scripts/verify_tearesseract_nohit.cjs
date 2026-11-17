// Deterministic no-hit witness at 120 Hz using actual mouse/shield physics.
// Practice safety is OFF. This proves a route exists, not human playability.
// Run from the repository root: node scripts/verify_tearesseract_nohit.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    checked: false, textContent: '', append() {}, addEventListener() {}, getContext() { return {}; },
  });
  return elements.get(id);
}
let randomState = Number(process.env.NO_HIT_SEED || 1) >>> 0;
const seededMath = Object.create(Math);
seededMath.random = () => ((randomState = (Math.imul(randomState,1664525)+1013904223) >>> 0) / 4294967296);
const context = {
  Math: seededMath, document: { querySelector: element, addEventListener() {}, createElement() { return {}; } },
  window: { addEventListener() {} }, requestAnimationFrame() {},
};
vm.createContext(context);
const source = fs.readFileSync('web/tearesseract.js', 'utf8');
vm.runInContext(source.replace(/\}\)\(\);\s*$/, `
  globalThis.game = {
    load(n) { round=n; hp=12; inv=0; enter('attack'); },
    step:update, pressF, coreSequence,shieldProfile,
    control(a,r=24) { mouse={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r}; pointerActive=true; },
    read() { return {t,p,round,hp,phase,bullets,lasers,blackHoles,chaosSlashes,shieldBroken}; }
  };
})();`), context);
const game = context.game;
for (let round = 0; round < 20; round++) {
  game.load(round);
  for (let frame = 0; frame < 8000 && game.read().phase === 'attack'; frame++) {
    const state = game.read(), core = game.coreSequence();
    let aim = -Math.PI / 2, radius = 24;
    if (core) {
      aim = -Math.PI / 2 - core.tilt;
      if (frame % 20 === 0) game.pressF();
    } else {
      const threats = state.bullets.map(b => {
        const dx=b.x-state.p.x, dy=b.y-state.p.y;
        return {
          eta: (Math.hypot(dx,dy)-35)/Math.hypot(b.vx,b.vy),
          angle: Math.atan2(dy,dx), approaching: dx*b.vx+dy*b.vy<0,
        };
      }).filter(b => b.approaching).sort((a,b) => a.eta-b.eta);
      if (threats.length) {
        const group = threats.filter(b => Math.abs(b.eta-threats[0].eta)<.025 && Math.cos(b.angle-threats[0].angle)>0);
        aim = Math.atan2(group.reduce((sum,b)=>sum+Math.sin(b.angle),0),
          group.reduce((sum,b)=>sum+Math.cos(b.angle),0));
      }
      const clearance = round===19 ? 25 : 45;
      const danger = state.lasers.find(l => l.age<l.warning+(l.life||.48) && (l.axis==='horizontal'?Math.abs(l.y-state.p.y):Math.abs(l.x-state.p.x))<clearance);
      if (danger && (!threats.length || threats[0].eta>(round===19?.12:.15))) {
        aim = danger.axis==='horizontal'?(danger.y>=515?-Math.PI/2:Math.PI/2):(danger.x>=550 ? Math.PI : 0);
        radius = 160;
      }
    }
    if(round===8){
      const x=550+130*Math.sin(state.t*1+0),y=515+100*Math.sin(state.t*1+0+Math.PI/2);
      aim=Math.atan2(y-state.p.y,x-state.p.x);radius=Math.hypot(x-state.p.x,y-state.p.y)+24;
    }
    if (round===6) {
      // Track the small moving space between two adjacent ribbons.
      const target = 540+Math.sin(state.t*2.3)*6;
      aim = target>=state.p.y ? Math.PI/2 : -Math.PI/2;
      radius = Math.abs(target-state.p.y)+24;
    }
    if([5,10,15].includes(round)){
      // Anchored gravity rounds: track the event horizon during each close pass.
      const hole=state.blackHoles.filter(h=>!h.imploding&&Math.hypot(h.x-state.p.x,h.y-state.p.y)<48)
        .sort((a,b)=>Math.hypot(a.x-state.p.x,a.y-state.p.y)-Math.hypot(b.x-state.p.x,b.y-state.p.y))[0];
      if(hole)aim=Math.atan2(hole.y-state.p.y,hole.x-state.p.x);
      radius=24;
    }
    if(round===18&&state.t>=5){
      const cuts=state.chaosSlashes.filter(s=>s.age<s.warning+.18/1.4);
      const safe=(x,y)=>cuts.every(s=>Math.abs(-(x-s.x)*Math.sin(s.a)+(y-s.y)*Math.cos(s.a))>=38);
      let target=state.p,best=Infinity;
      // Look ahead along each reachable mouse path, including the fast random shards.
      for(let x=290;x<=810;x+=15)for(let y=410;y<=640;y+=15){
        if(!safe(x,y))continue;
        const distance=Math.hypot(x-state.p.x,y-state.p.y);let valid=true;
        for(let future=.025;future<=.7;future+=.025){
          const travel=Math.min(1,220*future/Math.max(.001,distance)),px=state.p.x+(x-state.p.x)*travel,py=state.p.y+(y-state.p.y)*travel;
          if(cuts.some(s=>s.age+future>=s.warning&&s.age+future<s.warning+.18/1.4&&Math.abs(-(px-s.x)*Math.sin(s.a)+(py-s.y)*Math.cos(s.a))<30)||
            state.bullets.some(b=>Math.hypot(b.x+b.vx*future-px,b.y+b.vy*future-py)<22)){valid=false;break;}
        }
        if(valid&&distance<best){target={x,y};best=distance;}
      }
      aim=Math.atan2(target.y-state.p.y,target.x-state.p.x);radius=Math.hypot(target.x-state.p.x,target.y-state.p.y)+24;
    }
    if(round===19&&state.t>=45){
      const elapsed=state.t-45,a=-Math.PI/4-Math.max(0,elapsed-1)/(.52/1.8)*Math.PI/4+Math.PI;
      const x=550+75*Math.cos(a),y=470+75*Math.sin(a);
      aim=Math.atan2(y-state.p.y,x-state.p.x);radius=Math.hypot(x-state.p.x,y-state.p.y)+24;
    }
    game.control(aim,radius);
    game.step(1/120);
    // Assert every frame, so invulnerability or later healing cannot hide damage.
    assert.equal(game.read().hp,12,`Attack ${round+1} at ${state.t.toFixed(3)}s`);
  }
  assert.ok(['counter','heal'].includes(game.read().phase),`Attack ${round+1} must finish`);
  console.log(`Attack ${round+1}: no damage`);
}
