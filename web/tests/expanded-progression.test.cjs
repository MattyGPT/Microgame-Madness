const {test}=require('node:test'),assert=require('node:assert/strict');
const Rules=require('../../shared/account-rules.js'),Achievements=require('../achievements.js'),Cubies=require('../customs.js'),Leaderboards=require('../leaderboards.js');
const operation=(id,mode,score,extra={})=>({id,version:1,streamId:'device',kind:'arcade',payload:{event:'side-result',mode,score,won:score>0,...extra}});
test('all four side games award permanent Cubies and produce ranked results',()=>{
  let state=Rules.initial();
  for(const [mode,score,extra] of [['coindrop',1,{}],['nanolab',1,{}],['treasure',1,{level:6}],['tearesseract',30,{}]]){
    const result=Rules.apply(state,operation(mode,mode,score,extra));state=result.state;
    assert.equal(result.run.mode,mode);assert.equal(result.run.eligible,true);assert.equal(result.run.score,score);
    const item=Cubies.catalog.find(item=>item.id===`${mode}_cubie_1`);assert.ok(item);assert.ok(Cubies.unlocked(item,state.achievements.unlocked,[]));
    assert.ok(Leaderboards.valid({mode,difficulty:'standard',score,player:'Player'}));
  }
  assert.ok(state.achievements.unlocked.tearesseract_win);assert.equal(state.achievements.stats.treasureBest,6);
  assert.equal(Cubies.catalog[0].id,'classic');
});
test('invalid outcomes cannot award points and losing does not award a win',()=>{
  for(const payload of [operation('bad1','nanolab',1,{won:false}),operation('bad2','treasure',1,{level:0}),operation('bad3','tearesseract',29),operation('bad4','coindrop',2)])assert.throws(()=>Rules.apply(Rules.initial(),payload));
  const result=Rules.apply(Rules.initial(),operation('loss','nanolab',0,{won:false}));assert.equal(result.run.eligible,false);assert.equal(result.state.achievements.stats.nanoWins,0);
  const tracker=new Achievements.Tracker();tracker.sideResult('treasure',{score:1,level:10,won:true});tracker.sideResult('treasure',{score:0,level:11,won:false});assert.equal(tracker.data.stats.treasureBest,10);
});
test('completed Geomayhem expeditions are ranked, exits are not',()=>{
  for(const level of [1,20]){
    const start={id:'start',version:1,streamId:'device',runId:'geo',kind:'run.start',payload:{mode:'geomayhem',difficulty:`level_${level}`}};
    const state=Rules.apply(Rules.initial(),start).state;
    const done=Rules.apply(state,{...start,id:'finish',kind:'run.finish',payload:{outcome:'win',snapshot:{mode:'geomayhem',difficulty:`level_${level}`,geo_level:level,geo_waves:20,score:500,over:true,won:true}}});
    assert.equal(done.run.eligible,true);assert.equal(done.run.score,500);
    const exit=Rules.apply(state,{...start,id:'exit',kind:'run.finish',payload:{outcome:'exit',snapshot:{score:20,over:false}}});assert.equal(exit.run.eligible,false);
  }
});

test('round-sum scoring credits treasure increments and Tearesseract totals without inflating achievements',()=>{
 let state=Rules.initial(),total=0;
 for(let level=1;level<=6;level++){
  const result=Rules.apply(state,operation('treasure-'+level,'treasure',level,{level}));
  total+=result.run.score;state=result.state;
 }
 assert.equal(total,21);assert.equal(state.achievements.stats.treasureBest,6);
 assert.equal(state.scores['treasure:standard'][0].score,21);
 const tea=Rules.apply(state,operation('tea-six','tearesseract',21,{attacksCleared:6,won:false}));
 assert.equal(tea.run.score,21);assert.equal(tea.state.achievements.stats.teaAttacksBest,6);
 assert.equal(tea.state.achievements.stats.teaWins,0);
 const victory=Rules.apply(tea.state,operation('tea-win','tearesseract',465,{attacksCleared:30,won:true}));
 assert.equal(victory.run.score,465);assert.equal(victory.state.achievements.stats.teaAttacksBest,30);
 assert.throws(()=>Rules.apply(state,operation('bad-total','tearesseract',21,{attacksCleared:5,won:false})));
 assert.throws(()=>Rules.apply(state,operation('bad-treasure','treasure',21,{level:6})));
});

test('Key Rush records triangular points while achievements count completed rounds',()=>{
 const start={id:'start',version:1,streamId:'device',runId:'typing',kind:'run.start',payload:{mode:'keyboard',difficulty:'progressive'}};
 const state=Rules.apply(Rules.initial(),start).state;
 const finish={...start,id:'finish',kind:'run.finish',payload:{outcome:'loss',snapshot:{score:21,rounds_completed:6,over:true,won:false}}};
 const result=Rules.apply(state,finish);
 assert.equal(result.run.score,21);assert.equal(result.state.achievements.stats.typingBest,6);
 assert.throws(()=>Rules.apply(state,{...finish,payload:{...finish.payload,snapshot:{...finish.payload.snapshot,score:6}}}));
});

test('Coin Drop world scores retain personal best and count banked coins separately',()=>{
 let state=Rules.initial();
 for(const [i,world,coins] of [[0,25,0],[1,25,1],[2,10,1],[3,1000,0]]){
  const result=Rules.apply(state,operation(`world-${i}`,'coindrop',world,{highestUnlockedWorld:world,bankedCoins:coins}));
  state=result.state;
  assert.equal(result.run.score,world);
  assert.equal(state.scores['coindrop:standard'][0].score,i===3?1000:25);
 }
 assert.equal(state.achievements.stats.coinBanked,2);
 for(const world of [0,1001,2.5])assert.throws(()=>Rules.apply(state,operation('bad','coindrop',world,{highestUnlockedWorld:world,bankedCoins:0})));
});

test('Coin Drop reports unlocked frontier rather than selected world, capped at 1000',()=>{
 const C=require('../coin-drop.js'),g=Object.create(C.Controller.prototype),results=[];
 g.identity='guest';g.reportedWorlds=new Map();g.blocked=()=>false;g.onResult=(owner,mode,result)=>results.push(result);
 for(const cleared of [0,24,999,1000]){g.p={map:0,cleared,drops:0};g.reportWorld();}
 assert.deepEqual(results.map(r=>r.score),[1,25,1000,1000]);
 assert.ok(results.every(r=>r.bankedCoins===0&&r.highestUnlockedWorld===r.score));
 results.length=0;g.reportedWorlds.clear();g.labMode=false;
 g.p={map:0,cleared:0,drops:0};g.syncWorld();assert.equal(results.length,0);
 g.p={map:0,cleared:24,drops:1};g.syncWorld();g.syncWorld();assert.deepEqual(results.map(r=>r.score),[25]);
 g.p={map:0,cleared:25,drops:2};g.syncWorld();assert.deepEqual(results.map(r=>r.score),[25,26]);
});

test('Treasure level cap, Hangman attempt validation, and Coin Drop leaderboard bounds are enforced',()=>{
 assert.throws(()=>Rules.apply(Rules.initial(),operation('huge-treasure','treasure',44721,{level:44721})));
 const okTreasure=Rules.apply(Rules.initial(),operation('max-treasure','treasure',44720,{level:44720}));
 assert.equal(okTreasure.state.scores['treasure:standard'][0].score,44720*44721/2);
 const start={id:'h-start',version:1,streamId:'device',runId:'h1',kind:'run.start',payload:{mode:'hangman',difficulty:'hard'}};
 const state=Rules.apply(Rules.initial(),start).state;
 assert.throws(()=>Rules.apply(state,{...start,id:'h-bad',kind:'run.finish',payload:{outcome:'win',snapshot:{mode:'hangman',difficulty:'hard',score:1,mistakes:4,remaining:100,over:true,won:true}}}));
 assert.equal(Leaderboards.valid({mode:'coindrop',difficulty:'standard',score:0,player:'Player'}),false);
 assert.equal(Leaderboards.valid({mode:'coindrop',difficulty:'standard',score:1001,player:'Player'}),false);
 assert.equal(Leaderboards.valid({mode:'coindrop',difficulty:'standard',score:1000,player:'Player'}),true);
});
