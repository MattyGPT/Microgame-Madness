const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Tracker,catalog}=require('../achievements.js');
const Customs=require('../customs.js');
const Shop=require('../shop.js');
const observe=(tracker,difficulty,elapsed)=>{
  tracker.start('dodge',difficulty);
  return tracker.observe({mode:'dodge',difficulty,elapsed,over:true,won:false,score:100,near_misses:0});
};
test('Impossible milestones use one run, exact thresholds, and persist their Cubies',()=>{
  for(const seconds of [15,30,60,120,180]){
    let tracker=new Tracker();
    observe(tracker,'merciless',seconds+100);
    assert.ok(!tracker.data.unlocked[`dodge_impossible_${seconds}`]);
    observe(tracker,'impossible',seconds-1);
    observe(tracker,'impossible',seconds-1);
    assert.ok(!tracker.data.unlocked[`dodge_impossible_${seconds}`]);
    const earned=observe(tracker,'impossible',seconds).earned;
    assert.ok(earned.some(a=>a.id===`dodge_impossible_${seconds}`));
    tracker=new Tracker(JSON.parse(JSON.stringify(tracker.data)));
    const stamp=tracker.data.unlocked[`dodge_impossible_${seconds}`];
    observe(tracker,'impossible',seconds);
    assert.equal(tracker.data.unlocked[`dodge_impossible_${seconds}`],stamp);
    const cubie=Customs.catalog.find(c=>c.achievements.includes(`dodge_impossible_${seconds}`));
    if(seconds>=30){assert.ok(cubie);assert.equal(Customs.selected(cubie.id,tracker.data.unlocked).id,cubie.id);}
  }
});
test('Impossible starts at zero for old saves and keeps rewards distinct',()=>{
  const tracker=new Tracker({stats:{mercilessBest:500,dodgeBest:1000}});
  tracker.visit();
  assert.equal(tracker.data.stats.impossibleBest,0);
  assert.equal(catalog.filter(c=>c.stat==='impossibleBest').length,5);
  assert.equal(Customs.catalog.filter(c=>c.achievements.some(a=>a.startsWith('dodge_impossible_'))).length,4);
});
