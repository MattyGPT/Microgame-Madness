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
const context = {
  Math, document: { querySelector: element, addEventListener() {}, createElement() { return {}; } },
  window: { addEventListener() {} }, requestAnimationFrame() {},
};
vm.createContext(context);
const source = fs.readFileSync('web/tearesseract.js', 'utf8');
vm.runInContext(source.replace(/\}\)\(\);\s*$/, `
  globalThis.game = {
    load(n) { round=n; hp=12; inv=0; enter('attack'); },
    step:update, pressF, coreSequence,
    control(a,r=24) { mouse={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r}; pointerActive=true; },
    read() { return {t,p,round,hp,phase,bullets,lasers,shieldBroken}; }
  };
})();`), context);
const game = context.game;
for (let round = 0; round < 20; round++) {
  game.load(round);
  for (let frame = 0; frame < 6000 && game.read().phase === 'attack'; frame++) {
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
        const group = threats.filter(b => Math.abs(b.eta-threats[0].eta)<.025);
        aim = Math.atan2(group.reduce((sum,b)=>sum+Math.sin(b.angle),0),
          group.reduce((sum,b)=>sum+Math.cos(b.angle),0));
      }
      const clearance = round===19 ? 25 : 45;
      const danger = state.lasers.find(l => l.age<l.warning+.48 && Math.abs(l.x-state.p.x)<clearance);
      if (danger && (!threats.length || threats[0].eta>(round===19?.12:.15))) {
        aim = danger.x>=550 ? Math.PI : 0;
        radius = 160;
      }
    }
    if (round===6) {
      // Track the small moving space between two adjacent ribbons.
      const target = 515+Math.sin(state.t*2.3)*6;
      aim = target>=state.p.y ? Math.PI/2 : -Math.PI/2;
      radius = Math.abs(target-state.p.y)+24;
    }
    game.control(aim,radius);
    game.step(1/120);
    // Assert every frame, so invulnerability or later healing cannot hide damage.
    assert.equal(game.read().hp,12,`Attack ${round+1} at ${state.t.toFixed(3)}s`);
  }
  assert.ok(['counter','heal'].includes(game.read().phase),`Attack ${round+1} must finish`);
  console.log(`Attack ${round+1}: no damage`);
}
