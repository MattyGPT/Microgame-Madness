const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../coin-drop.js');
test('20 distinct boards have increasing goals and reachable bounded pegs',()=>{
 assert.equal(C.maps.length,20);
 assert.equal(new Set(C.maps.map(m=>JSON.stringify([C.pegsFor(m),m.wind,m.gravity,m.motion]))).size,20);
 for(const m of C.maps){assert.ok(C.pegsFor(m).length>20);assert.ok(C.pegsFor(m).every(p=>p.x>0&&p.x<C.BOARD.width&&p.y>70&&p.y<C.BOARD.pocketY));if(m.id)assert.ok(m.goal>C.maps[m.id-1].goal);}
});
test('campaign uses earned dots, pays clear bonus once, and progresses all 20 maps',()=>{
 const p=C.restore();
 for(const m of C.maps){const before=p.rubies;assert.equal(C.award(p,m.id,m.goal),true);assert.equal(p.cleared,m.id+1);assert.equal(p.rubies,before+3+m.id);p.dots=0;assert.equal(C.award(p,m.id,1),false);assert.equal(p.rubies,before+3+m.id);}
 assert.equal(C.restore(p).cleared,20);
});
test('80 upgrade nodes enforce dependencies and currency, repeat purchases increase real effects',()=>{
 const p=C.restore({dots:1e12,rubies:1e6});assert.equal(C.nodes.length,80);
 for(const b of C.branches){assert.equal(C.buy(p,`${b.id}-1`),false);let previous=0;for(let i=0;i<8;i++){const n=C.nodes.find(n=>n.id===`${b.id}-${i}`);const before=p[n.currency];const price=C.cost(p,n);assert.equal(C.buy(p,n.id),true);assert.equal(p[n.currency],before-price);assert.ok(C.rank(p,b.id)>previous);previous=C.rank(p,b.id);assert.equal(C.buy(p,n.id),true);}}
 assert.equal(C.buy(C.restore(),'mint-0'),false);assert.equal(C.buy(p,'unknown'),false);
});
test('corrupt saves and invalid payouts cannot poison or bypass campaign progression',()=>{
 const p=C.restore({map:19,cleared:2,dots:Infinity,rubies:-5,levels:{'mini-0':NaN},earned:[-4]});
 assert.equal(p.map,2);assert.equal(p.dots,0);assert.equal(p.rubies,0);assert.equal(p.earned[0],0);assert.equal(C.award(p,99,400),false);
 C.award(p,2,NaN,Infinity,-5);assert.equal(p.dots,0);assert.equal(p.rubies,0);assert.equal(p.scrap,0);
});

test('world goals are three times the previous targets and playfield area is tripled',()=>{
 assert.equal(C.BOARD.width*C.BOARD.height,560*660*3);
 for(const m of C.maps){assert.equal(m.goal,3*8*5*Math.round(250*1.38**m.id));const p=C.restore({cleared:m.id,map:m.id});assert.equal(C.award(p,m.id,m.goal-1),false);assert.equal(C.award(p,m.id,1),true);}
 const old=C.restore({cleared:6,map:5,earned:[250,345],dots:500});assert.equal(old.cleared,6);assert.equal(old.dots,500);
});
test('all worlds have three populated pinball decks and rails physically reflect coins',()=>{
 for(const map of C.maps){const fixtures=C.featuresFor(map);assert.ok(fixtures.length>=36);for(let deck=0;deck<3;deck++)for(const type of ['bumper','rail','sling','spinner','gate','target','nano'])assert.ok(fixtures.some(f=>f.deck===deck&&f.type===type));}
 const coin={x:50,y:95,r:10,vx:0,vy:100};assert.equal(C.hitSegment(coin,{x:0,y:100,x2:100,y2:100}),true);assert.ok(coin.vy<0);assert.ok(coin.y<90);
 const gate={phase:0};assert.equal(C.gateOpen(gate,0),true);assert.equal(C.gateOpen(gate,2),false);
 const spinner=C.featuresFor(C.maps[0]).find(f=>f.type==='spinner');assert.notDeepEqual(C.segmentFor(spinner,0),C.segmentFor(spinner,1));
});

test('moving pegs preserve a main-coin-wide gap throughout their sweep',()=>{
 for(const map of C.maps){const pegs=C.pegsFor(map);for(let i=0;i<pegs.length;i++)for(let j=0;j<i;j++){
  const a=pegs[i],b=pegs[j],sweep=2*map.motion*Math.abs(Math.sin((a.phase-b.phase)/2));
  assert.ok(Math.hypot(Math.max(0,Math.abs(a.x-b.x)-sweep),a.y-b.y)>=a.r+b.r+32-1e-8,`world ${map.id}`);
 }}
});
test('all 60 nanogames appear exactly once in campaign pockets',()=>{
 assert.equal(C.nanogames.length,60);assert.equal(new Set(C.nanogames.map(g=>g.id)).size,60);
 assert.deepEqual(new Set(C.maps.flatMap(m=>C.featuresFor(m).filter(f=>f.type==='nano').map(f=>f.game))),new Set(C.nanogames.map(g=>g.id)));
});
function physicsGame(map){
 const g=Object.create(C.Controller.prototype);Object.assign(g,{p:C.restore({map:map.id,cleared:20}),features:C.featuresFor(map),pegs:C.pegsFor(map),coins:[],particles:[],clock:0,beat:0,charge:1,musicStep:0});
 g.$=()=>({style:{setProperty(){}}});g.burst=g.tone=g.save=g.renderStats=g.message=()=>{};g.reward=()=>{};return g;
}
function ball(x,y=50){return {x,y,vx:0,vy:0,r:12,age:0,hits:new Set(),featureHits:new Set(),banks:new Set(),pocketBonus:1,boost:1,rubyHits:0,nanoPlayed:true};}
test('old balls still collide with rails and pegs instead of phasing or teleporting',()=>{
 const g=physicsGame(C.maps[0]);g.features=[{id:0,type:'rail',x:300,y:300,x2:540,y2:300}];g.pegs=[];
 const c=ball(420,280);c.age=70;c.vy=600;g.coins=[c];g.update(.05);assert.equal(g.coins.length,1);assert.ok(c.y<300);assert.ok(c.vy<0);
 g.features=[];g.pegs=[{x:420,y:200,r:6,phase:0}];c.x=420;c.y=182;c.vy=400;c.vx=0;g.update(1/120);assert.ok(c.y<200);assert.ok(c.hits.has(0));
});
test('fast minicoins cannot tunnel through rails during a long frame',()=>{
 const g=physicsGame(C.maps[0]);g.features=[{id:0,type:'rail',x:200,y:300,x2:600,y2:300}];g.pegs=[];const c=ball(420,270);c.r=6;c.vy=4000;g.coins=[c];g.update(.1);assert.ok(c.y<300);assert.ok(c.vy<0);
});
test('a full campaign of center and edge launches settles with collision-safe nudges',()=>{
 for(const map of C.maps){const g=physicsGame(map);g.coins=[ball(100),ball(420),ball(740)];for(let i=0;i<120*90&&g.coins.length;i++)g.update(1/120);assert.equal(g.coins.length,0,`stuck on world ${map.id+1}`);}
});

test('each world owns exactly three globally unique nanogames and original timings survive',()=>{
 const all=C.maps.flatMap(m=>{const pockets=C.featuresFor(m).filter(f=>f.type==='nano');assert.equal(pockets.length,3);assert.deepEqual(pockets.map(p=>p.game),C.nanogames.slice(m.id*3,m.id*3+3).map(g=>g.id));return pockets.map(p=>p.game);});assert.equal(new Set(all).size,60);
 for(const [id,seconds] of [['odd',3],['math',4],['colors',2],['maze',6],['code',14]])assert.equal(C.nanogames.find(g=>g.id===id).seconds,seconds);
});
test('new quiz answers are unambiguous and arithmetic is correct across seeds',()=>{
 const pack=require('../coin-drop-nanogames.js');
 for(const game of pack.games.filter(g=>g.kind==='quiz'))for(let seed=0;seed<20;seed++){
  let x=seed+1;const r=()=>((x=(x*1664525+1013904223)>>>0)/2**32),q=pack.quiz(game.variant,r);
  assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.equal(q.choices.filter(v=>v===q.answer).length,1);
  const nums=q.prompt.match(/\d+/g)?.map(Number)||[];
  if(game.variant==='change')assert.equal(+q.answer,nums[0]-nums[1]);
  if(game.variant==='multiply')assert.equal(+q.answer,nums[0]*nums[1]);
  if(game.variant==='divide')assert.equal(+q.answer,nums[0]/nums[1]);
  if(game.variant==='word')assert.equal(q.answer,q.choices.slice().sort()[0]);
  if(game.variant==='count')assert.equal(+q.answer,[...q.prompt].filter(c=>c==='★').length);
 }
});
