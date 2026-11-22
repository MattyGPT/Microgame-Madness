// Deterministic accelerated campaign: real physics, earned wallets, paid upgrades and forge recipes.
// UI/audio are omitted; captured nanogames are skipped (their win controls are tested in Playwright).
const fs=require('node:fs');
const C=require('../web/coin-drop.js');
const worldLimit=Number(process.env.COIN_DROP_TEST_WORLDS||C.maps.length);
let seed=7319;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const g=Object.create(C.Controller.prototype);
Object.assign(g,{p:C.restore(),coins:[],particles:[],aim:420,charge:1,clock:0,beat:0,musicStep:0});
g.$=()=>({style:{setProperty(){}}});
for(const name of ['burst','tone','save','render','renderStats','message','startAudio'])g[name]=()=>{};
g.blocked=()=>false;g.playable=()=>true;g.enterNano=coin=>{coin.nanoPlayed=true;};
const report={method:'Fresh save, deterministic physics at 240 Hz, real earned currencies only; real buy/craft calls; nanogame captures skipped. Simulation time excludes menus and nanogames.',worlds:[],purchases:0,forge:{magnet:0,ruby:0,boost:0},allNodes:new Set()};
function shop(){
 for(const branch of C.branches){
  const available=C.nodes.filter(n=>n.branch===branch.id&&C.unlocked(g.p,n));
  const node=available.at(-1);
  const reserve=node.currency==='scrap'?50:0;
  const amount=C.BUY_AMOUNTS.slice().reverse().find(a=>C.cost(g.p,node,a)<=Math.max(0,(g.p[node.currency]-reserve)*.15));
  if(amount&&C.buy(g.p,node.id,amount)){report.purchases++;report.allNodes.add(node.id);}
 }
 for(const kind of ['boost','ruby','magnet'])if(g.p.scrap>C.forgeCost(g.p,kind)+50&&(kind==='boost'?g.p.boosts<1:kind==='magnet'?g.p.magnets<1:g.p.rubies<30)){g.craft(kind);report.forge[kind]++;}
}
for(const map of C.maps.slice(0,worldLimit)){
 if(g.p.cleared<map.id)throw Error(`Locked world ${map.id+1}`);
 Object.assign(g,{pegs:C.pegsFor(map),features:C.featuresFor(map),coins:[],particles:[],charge:1});g.p.map=map.id;
 const start=g.clock,drops=g.p.drops;
 do{
  shop();g.aim=[100,420,740][g.p.drops%3];g.drop();
  let frames=0;
  while(g.coins.length&&frames++<900)g.update(.1);
  if(g.coins.length)throw Error(`Coins stuck in world ${map.id+1}`);
  shop();
  if(g.p.drops-drops>400)throw Error(`Progression stalled in world ${map.id+1}`);
 }while(g.p.cleared===map.id);
 if(![g.p.dots,g.p.scrap,g.p.rubies,g.p.earned[map.id]].every(Number.isFinite))throw Error(`Nonfinite wallet in world ${map.id+1}`);
 const saved=C.restore(JSON.parse(JSON.stringify(g.p)));
 if(saved.cleared!==g.p.cleared||saved.dots!==g.p.dots)throw Error(`Save mismatch in world ${map.id+1}`);
 report.worlds.push({world:map.id+1,name:map.name,drops:g.p.drops-drops,seconds:Math.round(g.clock-start)});
 if((map.id+1)%25===0)console.log(`Passed world ${map.id+1}; drops ${g.p.drops}; purchases ${report.purchases}`);
}
report.allNodes=[...report.allNodes];report.totalDrops=g.p.drops;report.simulatedSeconds=g.clock;report.cleared=g.p.cleared;
fs.writeFileSync('artifacts/coin-drop-playtest/campaign-progressive-prices.json',JSON.stringify(report,null,2));console.log(JSON.stringify({cleared:report.cleared,drops:report.totalDrops,seconds:report.simulatedSeconds,purchases:report.purchases,nodes:report.allNodes.length,forge:report.forge}));
