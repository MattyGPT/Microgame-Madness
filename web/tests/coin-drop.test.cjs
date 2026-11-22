const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../coin-drop.js');
test('1000 distinct boards have increasing goals and reachable bounded pegs',()=>{
 assert.equal(C.maps.length,1000);
 assert.equal(new Set(C.maps.map(m=>JSON.stringify([C.pegsFor(m),m.wind,m.gravity,m.motion]))).size,1000);
 for(const m of C.maps){assert.ok(C.pegsFor(m).length>20);assert.ok(C.pegsFor(m).every(p=>p.x>0&&p.x<C.BOARD.width&&p.y>70&&p.y<C.BOARD.pocketY));if(m.id)assert.ok(m.goal>C.maps[m.id-1].goal);}
});
test('campaign uses earned dots, pays clear bonus once, and progresses all 1000 maps',()=>{
 const p=C.restore();
 for(const m of C.maps){const before=p.rubies;assert.equal(C.award(p,m.id,m.goal),true);assert.equal(p.cleared,m.id+1);assert.equal(p.rubies,before+3+m.id);p.dots=0;assert.equal(C.award(p,m.id,1),false);assert.equal(p.rubies,before+3+m.id);}
 assert.equal(C.restore(p).cleared,1000);
});
test('320 upgrade nodes enforce dependencies and currency, repeat purchases increase real effects',()=>{
 const p=C.restore({dots:1e20,rubies:1e20,scrap:1e20});assert.equal(C.nodes.length,320);
 for(const b of C.branches){assert.equal(C.buy(p,`${b.id}-1`),false);let previous=0;for(let i=0;i<b.names.length;i++){const n=C.nodes.find(n=>n.id===`${b.id}-${i}`);const before=p[n.currency];const price=C.cost(p,n);assert.equal(C.buy(p,n.id),true);assert.equal(p[n.currency],before-price);assert.ok(C.rank(p,b.id)>previous);previous=C.rank(p,b.id);assert.equal(C.buy(p,n.id),true);}}
 assert.equal(C.buy(C.restore(),'mint-0'),false);assert.equal(C.buy(p,'unknown'),false);
});
test('corrupt saves and invalid payouts cannot poison or bypass campaign progression',()=>{
 const p=C.restore({map:19,cleared:2,dots:Infinity,rubies:-5,levels:{'mini-0':NaN},earned:[-4]});
 assert.equal(p.map,2);assert.equal(p.dots,0);assert.equal(p.rubies,0);assert.equal(p.earned[0],0);assert.equal(C.award(p,1000,400),false);
 C.award(p,2,NaN,Infinity,-5);assert.equal(p.dots,0);assert.equal(p.rubies,0);assert.equal(p.scrap,0);
});

test('opening targets are preserved and later goals track payouts without currency cliffs',()=>{
 assert.equal(C.BOARD.width*C.BOARD.height,560*660*3);
 for(const m of C.maps){if(m.id<20)assert.equal(m.goal,720*Math.round(250*1.75**m.id));else {const prev=C.maps[m.id-1];assert.ok(m.goal/prev.goal<1.28);assert.ok((m.goal/m.value)/(prev.goal/prev.value)<1.026);}const p=C.restore({cleared:m.id,map:m.id});assert.equal(C.award(p,m.id,m.goal*.9),false);assert.equal(C.award(p,m.id,m.goal-p.earned[m.id]),true);}
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
test('all 3000 nanogames appear exactly once in campaign pockets',()=>{
 assert.equal(C.nanogames.length,3000);assert.equal(new Set(C.nanogames.map(g=>g.id)).size,3000);
 assert.deepEqual(new Set(C.maps.flatMap(m=>C.featuresFor(m).filter(f=>f.type==='nano').map(f=>f.game))),new Set(C.nanogames.map(g=>g.id)));
});
function physicsGame(map){
 const g=Object.create(C.Controller.prototype);Object.assign(g,{p:C.restore({map:map.id,cleared:100}),features:C.featuresFor(map),pegs:C.pegsFor(map),coins:[],particles:[],clock:0,beat:0,charge:1,musicStep:0});
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
 const all=C.maps.flatMap(m=>{const pockets=C.featuresFor(m).filter(f=>f.type==='nano');assert.equal(pockets.length,3);assert.deepEqual(pockets.map(p=>p.game),C.nanogames.slice(m.id*3,m.id*3+3).map(g=>g.id));return pockets.map(p=>p.game);});assert.equal(new Set(all).size,3000);
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

test('completed twenty-world saves retain progress and unlock the first expansion world',()=>{
 const old={dots:123456,rubies:77,scrap:91,cleared:20,map:19,earned:Array(20).fill(1234),levels:{'mint-7':3,'launch-0':2}};
 const p=C.restore(old);
 assert.equal(p.cleared,20);assert.equal(p.map,19);assert.equal(p.dots,old.dots);assert.equal(p.rubies,old.rubies);assert.equal(p.scrap,old.scrap);
 assert.deepEqual(p.earned.slice(0,20),old.earned);assert.deepEqual(p.earned.slice(20),Array(980).fill(0));
 assert.equal(p.levels['mint-7'],3);assert.equal(p.levels['launch-0'],2);assert.equal(p.levels['expedition-0'],0);
 assert.equal(C.nodes.find(n=>n.id==='mint-7').currency,'rubies');
 assert.equal(C.unlocked(p,C.nodes.find(n=>n.id==='mint-8')),true);
 assert.equal(C.award(p,20,C.maps[20].goal),true);assert.equal(p.cleared,21);
});

test('bulk prices and purchases equal sequential ranks for every amount and currency',()=>{
 assert.equal(C.BUY_AMOUNTS.at(-1),1e200);assert.equal(C.BUY_AMOUNTS.length,43);
 for(const id of ['mint-0','mint-6','mint-8'])for(const amount of C.BUY_AMOUNTS.filter(n=>n<=5000)){
  const node=C.nodes.find(n=>n.id===id),p=C.restore({dots:8e15,rubies:8e15,scrap:8e15,levels:{[id]:3,[node.requires]:1}}),sequential=C.restore(p);
  let total=0;for(let i=0;i<amount;i++){total+=C.cost(sequential,node);assert.equal(C.buy(sequential,id),true);}
  assert.equal(C.cost(p,node,amount),total);assert.equal(C.buy(p,id,amount),true);assert.deepEqual(p,sequential);
 }
});
test('bulk purchases are atomic and respect funds, dependencies, allowed sizes and rank limits',()=>{
 const p=C.restore({dots:100,rubies:100,scrap:100}),before=JSON.stringify(p);
 for(const [id,amount] of [['mint-0',5],['mint-1',1],['mint-0',0],['mint-0',-1],['mint-0',2],['mint-0',Infinity],['mint-0',NaN],['missing',5]]){
  assert.equal(C.buy(p,id,amount),false);assert.equal(JSON.stringify(p),before);
 }
 const capped=C.restore({dots:1e300,levels:{'mint-0':C.MAX_RANK}});assert.equal(C.buy(capped,'mint-0',1),false);assert.equal(C.buy(capped,'mint-0',1e200),false);
});

test('Scrap Magnets replace the condenser without granting dots or progress',()=>{
 const g=Object.create(C.Controller.prototype);g.p=C.restore({scrap:49});g.blocked=()=>false;g.message=g.save=g.render=g.tone=()=>{};
 g.craft('magnet');assert.equal(g.p.magnets,0);g.p.scrap=50;g.craft('magnet');
 assert.equal(g.p.magnets,10);assert.equal(g.p.scrap,0);assert.equal(g.p.dots,0);assert.equal(g.p.earned[0],0);assert.equal(g.p.forgeCrafts.magnet,1);assert.equal(C.forgeCost(g.p,'magnet'),55);
 const before=JSON.stringify(g.p);g.craft('dots');assert.equal(JSON.stringify(g.p),before);
 assert.deepEqual(C.restore(g.p),g.p);
});

test('forge bulk crafting matches individual crafts for all sizes and preserves large boost reserves',()=>{
 const controller=()=>{const g=Object.create(C.Controller.prototype);g.p=C.restore({scrap:1e10,boosts:9999,levels:{'expedition-0':2}});g.blocked=()=>false;g.message=g.save=g.render=g.tone=g.burst=()=>{};return g;};
 for(const kind of ['boost','ruby','magnet'])for(const amount of C.BUY_AMOUNTS.filter(n=>n<=5000)){
  const bulk=controller(),single=controller();bulk.craft(kind,amount);for(let i=0;i<amount;i++)single.craft(kind);
  assert.deepEqual(bulk.p,single.p);assert.deepEqual(C.restore(bulk.p),bulk.p);
 }
 const g=controller();g.p.scrap=49;const before=JSON.stringify(g.p);
 for(const [kind,amount]of [['magnet',1],['boost',5],['ruby',1],['unknown',1],['boost',-1],['boost',0],['boost',2],['boost',Infinity]]){g.craft(kind,amount);assert.equal(JSON.stringify(g.p),before);}
});

test('buy all previews without spending and buys only the highest affordable unlocked tier in each category',()=>{
 const p=C.restore({dots:1e12,rubies:1e12,scrap:1e12,levels:Object.fromEntries(C.nodes.map(n=>[n.id,1]))});
 const before=JSON.stringify(p),plan=C.planBuyAll(p,5);assert.equal(JSON.stringify(p),before);assert.equal(plan.purchases.length,16);
 assert.ok(plan.purchases.every(item=>item.id.endsWith('-19')&&item.amount===5));
 assert.deepEqual(C.buyAll(p,5),plan);
 for(const n of C.nodes)assert.equal(p.levels[n.id],n.tier===19?6:1);
 for(const currency of ['dots','rubies','scrap'])assert.equal(p[currency],1e12-plan.totals[currency]);
});
test('buy all falls back to affordable tiers, shares currency across categories and respects locks and caps',()=>{
 const p=C.restore({dots:70});const plan=C.buyAll(p);assert.deepEqual(plan.purchases.map(x=>x.id),['mint-0','peg-0']);assert.equal(p.dots,0);assert.equal(p.levels['mint-1'],0);
 const fallback=C.restore({dots:500,levels:{'mint-0':1,'mint-1':1,'mint-2':C.MAX_RANK,'mint-3':1}});
 const planned=C.planBuyAll(fallback);assert.equal(planned.purchases[0].id,'mint-1');
 const empty=C.restore(),snapshot=JSON.stringify(empty);assert.equal(C.buyAll(empty,5000).purchases.length,0);assert.equal(C.buyAll(empty,-1).purchases.length,0);assert.equal(JSON.stringify(empty),snapshot);
 const cap=C.restore({dots:1e15,levels:{'mint-0':C.MAX_RANK-1}});assert.ok(!C.planBuyAll(cap,5).purchases.some(x=>x.id==='mint-0'));
});

test('large batches quote progressive prices without iterating per rank',()=>{
 for(const amount of C.BUY_AMOUNTS.filter(n=>n>=10000&&n<=5e10)){
  const p=C.restore({dots:1e40,rubies:1e40,scrap:1e40,levels:Object.fromEntries(C.nodes.map(n=>[n.id,100]))});
  const node=C.nodes[0],price=C.cost(p,node,amount);
  assert.ok(Number.isFinite(price));assert.ok(price>amount*C.cost(p,node));
  assert.equal(C.buy(p,node.id,amount),true);assert.equal(p.levels[node.id],100+amount);
  assert.equal(C.buyAll(p,amount).purchases.length,16);assert.deepEqual(C.restore(p).levels,p.levels);
 }
});
test('billion-craft batches charge escalating costs and cannot clear a world',()=>{
 for(const kind of ['boost','ruby','magnet']){
  const g=Object.create(C.Controller.prototype);g.p=C.restore({scrap:1e25});g.blocked=()=>false;g.message=g.save=g.render=g.tone=()=>{};
  const price=C.forgeCost(g.p,kind,1e9);assert.ok(price>C.forgeCost(g.p,kind)*1e9);
  g.craft(kind,1e9);assert.equal(g.p.scrap,1e25-price);assert.equal(g.p.forgeCrafts[kind],1e9);assert.equal(g.p.cleared,0);assert.equal(g.p.dots,0);
  assert.equal(g.p[{boost:'boosts',ruby:'rubies',magnet:'magnets'}[kind]],(kind==='ruby'?3:10)*1e9);
  assert.deepEqual(C.restore(g.p),g.p);
 }
});

test('late-world dot balances survive saves above 1E89 and can clear the final world',()=>{
 const goal=C.maps[999].goal,p=C.restore({map:999,cleared:999,dots:goal*.5,earned:[...Array(999).fill(0),goal*.5]});
 assert.ok(Number.isFinite(goal));assert.ok(goal>=1e89);assert.equal(p.dots,goal*.5);assert.equal(p.earned[999],goal*.5);
 assert.equal(C.award(p,999,goal),true);assert.equal(p.cleared,1000);
 const saved=C.restore(JSON.parse(JSON.stringify(p)));assert.equal(saved.dots,p.dots);assert.equal(saved.earned[999],p.earned[999]);assert.equal(saved.cleared,1000);
});

test('prices keep increasing past the former cap and unaffordable ultra batches are atomic',()=>{
 const node=C.nodes[0];let previous=0;
 for(const level of [0,1,10,100,1e6,1e12,1e50,1e100]){
  const amount=level>=1e50?level:1,p=C.restore({levels:{'mint-0':level}}),price=C.cost(p,node,amount);
  assert.ok(price>previous);previous=price;
 }
 const p=C.restore({dots:1e300,rubies:1e300,scrap:1e300,levels:{'mint-0':1e200}}),before=JSON.stringify(p);
 assert.equal(C.cost(p,node,1e200),Infinity);assert.equal(C.buy(p,'mint-0',1e200),false);assert.equal(JSON.stringify(p),before);
 assert.equal(C.buyAll(p,1e200).purchases.length,0);
});
test('magnet charges wait for minicoins and captured coin boosts survive resets',()=>{
 const g=physicsGame(C.maps[0]);g.p=C.restore({magnets:2});g.aim=420;g.playable=()=>true;g.startAudio=g.render=()=>{};
 g.drop();assert.equal(g.p.magnets,2);g.coins=[];g.charge=1;g.p.levels['mini-0']=1;g.drop();
 assert.equal(g.p.magnets,1);const mini=g.coins.find(c=>c.mini);assert.equal(mini.scrapBoost,2);
 g.blocked=()=>false;g.closeNano=()=>{};g.resetBalls();assert.equal(mini.scrapBoost,2);assert.equal(g.p.magnets,1);
 g.coins=[mini];mini.x=420;mini.y=C.BOARD.pocketY+1;mini.nanoPlayed=true;g.reward=C.Controller.prototype.reward;g.update(1/120);
 assert.equal(g.p.scrap,2);
});
test('ultra payout multiplication saturates instead of generating invalid or zero rewards',()=>{
 assert.equal(C.payoutProduct(1e200,1e200),1e300);assert.equal(C.payoutProduct(1e200,0,1e200),0);assert.equal(C.payoutProduct(2,3,.5),3);
 const g=physicsGame(C.maps[0]);g.p=C.restore({levels:Object.fromEntries(C.nodes.map(n=>[n.id,1e200]))});
 g.reward=C.Controller.prototype.reward;g.coins=[ball(420,C.BOARD.pocketY+1)];g.coins[0].boost=1e200;g.coins[0].pocketBonus=1e200;
 g.update(1/120);assert.ok(g.p.dots>0);assert.ok(Number.isFinite(g.p.dots));assert.ok(Number.isFinite(g.p.earned[0]));
});

test('level 43 legacy savings and upgrades survive rebalance; earned progress clears exactly once',()=>{
 const raw={map:42,cleared:42,dots:1e84,rubies:10,scrap:55,levels:{'mint-0':100},earned:Array(43).fill(0)};
 const fresh=C.restore(raw);assert.equal(fresh.cleared,42);assert.equal(fresh.dots,1e84);
 raw.earned[42]=1e83;const p=C.restore(raw);
 assert.equal(p.map,42);assert.equal(p.cleared,43);assert.equal(p.earned[42],1e83);assert.equal(p.dots,1e84);assert.equal(p.rubies,55);assert.equal(p.scrap,55);assert.equal(p.levels['mint-0'],100);
 assert.deepEqual(C.restore(JSON.parse(JSON.stringify(p))),p);
 assert.ok(C.maps[42].goal<2e12);
});
