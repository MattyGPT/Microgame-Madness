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
