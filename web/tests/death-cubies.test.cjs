const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Tracker}=require('../achievements.js');
const C=require('../customs.js'),Shop=require('../shop.js');
const die=(t,mode,difficulty,extra={})=>{t.start(mode,difficulty);const s={mode,difficulty,over:true,won:false,...extra};t.observe(s);t.observe(s);};
test('Creeper counts 10 deaths once each, across games and visits',()=>{
 let t=new Tracker();
 for(let i=0;i<9;i++)die(t,'dodge','easy');
 assert.equal(t.data.stats.arcadeDeaths,9);assert.equal(t.data.unlocked.arcade_deaths_10,undefined);
 t=new Tracker(JSON.parse(JSON.stringify(t.data)));
 die(t,'pumpkin','baby');assert.equal(C.selected('creeper',t.data.unlocked).id,'creeper');
 const empty=new Tracker();die(empty,'hangman','easy');die(empty,'keyboard','progressive');
 empty.start('boss','mean');empty.abandon();
 empty.start('boss','mean');empty.observe({mode:'boss',difficulty:'mean',over:true,won:true});
 assert.equal(empty.data.stats.arcadeDeaths,0);
 for(const [mode,difficulty] of [['boss','mean'],['wrath','magenta_fingers'],['singularity','gravitron'],['core_practice','railgun_array']])die(empty,mode,difficulty);
 assert.equal(empty.data.stats.arcadeDeaths,4);
});
test('Tetris needs 50 square-piece deaths on supported difficulties, not merely yellow blocks or edge deaths',()=>{
 let t=new Tracker();const modes=['easy','normal','hard','merciless'];
 for(let i=0;i<49;i++)die(t,'dodge',modes[i%4],{death_cause:'o_block'});
 assert.equal(t.data.unlocked.dodge_square_deaths_50,undefined);
 for(const cause of ['edge','block',undefined])die(t,'dodge','hard',{death_cause:cause});
 assert.equal(t.data.stats.dodgeSquareDeaths,49);
 t=new Tracker(JSON.parse(JSON.stringify(t.data)));die(t,'dodge','merciless',{death_cause:'o_block'});
 assert.equal(t.data.stats.dodgeSquareDeaths,50);assert.equal(C.selected('tetris',t.data.unlocked).id,'tetris');
});
test('Cybercubie costs 900 CC, saves ownership, and equips',()=>{
 const item=C.catalog.find(c=>c.id==='shop_cyber'),wallet={units:899999,owned:[]};
 assert.equal(Shop.buy(wallet,item),false);wallet.units++;assert.equal(Shop.buy(wallet,item),true);assert.equal(wallet.units,0);
 const restored=Shop.restore(JSON.parse(JSON.stringify(wallet)),C.catalog);
 assert.equal(C.selected(item.id,{},restored.owned).id,item.id);
});
