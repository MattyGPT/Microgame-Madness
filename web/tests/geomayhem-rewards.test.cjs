const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Tracker,catalog}=require('../achievements.js');
const Customs=require('../customs.js');
const Rules=require('../../shared/account-rules.js');
const {compactSnapshot}=require('../accounts/app.js');
const state=(level=1,extra={})=>({mode:'geomayhem',difficulty:`level_${level}`,geo_level:level,
  geo_kills:0,geo_waves:0,geo_rank:1,geo_weapon_count:1,geo_max_stars:1,geo_five_star_count:0,geo_relic_count:0,
  score:0,over:false,won:false,damage_taken:0,...extra});
test('28 milestones and 16 Cubies span all seven tiers with unique rendered art',()=>{
  const medals=catalog.filter(a=>a.group==='Geomayhem');
  const cubies=Customs.catalog.filter(c=>c.id.startsWith('geo_'));
  assert.equal(medals.length,28);assert.equal(cubies.length,16);
  for(const tier of ['bronze','silver','gold','crystal','diamond','rainbow','empyrorite']){
    assert.equal(medals.filter(a=>a.tier===tier).length,4);
    assert.equal(cubies.filter(c=>c.tier===tier).length,tier === 'bronze' ? 4 : 2);
  }
  for(const c of cubies) assert.match(Customs.svg(c),new RegExp(`data-geomayhem-tier="${c.tier}"`));
});
test('incremental kills and waves never double count repeated, stale, or finished snapshots',()=>{
  let tracker=new Tracker();tracker.start('geomayhem','level_1');
  assert.ok(tracker.data.unlocked.geo_start);
  tracker.observe(state(1,{geo_kills:12,geo_waves:3}));
  assert.equal(tracker.observe(state(1,{geo_kills:12,geo_waves:3})).changed,false);
  tracker.observe(state(1,{geo_kills:10,geo_waves:2}));
  tracker.observe(state(1,{geo_kills:15,geo_waves:5,over:true}));
  tracker.observe(state(1,{geo_kills:1000,geo_waves:20,over:true,won:true}));
  assert.equal(tracker.data.stats.geoKills,15);assert.equal(tracker.data.stats.geoWaves,5);
  assert.equal(tracker.data.stats.geoWins,0);
  tracker=new Tracker(JSON.parse(JSON.stringify(tracker.data)));
  tracker.start('geomayhem','level_2');tracker.observe(state(2,{geo_kills:10,geo_waves:2}));
  assert.equal(tracker.data.stats.geoKills,25);assert.equal(tracker.data.stats.geoWaves,7);
  assert.equal(tracker.data.stats.geoWavesBest,5);
});
test('milestone thresholds distinguish loadout, evolution, relics, and valid victories',()=>{
  const tracker=new Tracker();tracker.start('geomayhem','level_10');
  tracker.observe(state(10,{geo_weapon_count:3,geo_max_stars:2,geo_five_star_count:2,geo_relic_count:2}));
  for(const id of ['geo_loadout_4','geo_stars_3','geo_stars_5','geo_evolved_3','geo_relics_3'])assert.ok(!tracker.data.unlocked[id]);
  tracker.observe(state(10,{geo_weapon_count:4,geo_max_stars:5,geo_five_star_count:4,geo_relic_count:3}));
  for(const id of ['geo_loadout_4','geo_stars_3','geo_stars_5','geo_evolved_3','geo_evolved_4','geo_relics_3'])assert.ok(tracker.data.unlocked[id]);
  tracker.observe(state(10,{geo_waves:19,over:true,won:true}));
  assert.equal(tracker.data.stats.geoWins,0);
  tracker.start('geomayhem','level_10');
  tracker.observe(state(10,{geo_waves:20,over:true,won:true,damage_taken:1,lives:100}));
  assert.ok(tracker.data.unlocked.geo_arena_10);assert.ok(!tracker.data.unlocked.geo_flawless_10);
  tracker.start('geomayhem','level_10');tracker.observe(state(10,{geo_waves:20,over:true,won:true}));
  assert.ok(tracker.data.unlocked.geo_flawless_10);
  const restored=new Tracker(JSON.parse(JSON.stringify(tracker.data)));
  assert.equal(Customs.selected('geo_seraph',restored.data.unlocked).id,'geo_seraph');
});
test('unfinished, mismatched, and other-mode observations cannot grant Geomayhem victories',()=>{
  const tracker=new Tracker();tracker.start('geomayhem','level_1');
  tracker.observe(state(10,{geo_waves:20,over:true,won:true}));
  tracker.observe(state(1,{geo_waves:20,won:true}));
  tracker.abandon();tracker.observe(state(1,{geo_waves:20,won:true,over:true}));
  assert.equal(tracker.data.stats.geoWins,0);
  tracker.start('boss','mean');tracker.observe(state(1,{geo_kills:1000,over:true,won:true}));
  assert.equal(tracker.data.stats.geoKills,0);
});
test('account checkpoints persist rewards across reloads without giving arcade Cash or scores',()=>{
  let profile=Rules.initial(),serial=0;
  const apply=(kind,payload)=>{const result=Rules.apply(profile,{schema:1,id:`geo-${++serial}`,stream_id:'geo-device',run_id:'geo-run',kind,payload},{now:Date.parse('2026-11-07T12:00:00Z')});profile=result.state;return result;};
  apply('run.start',{mode:'geomayhem',difficulty:'level_10'});
  const snapshot=compactSnapshot(state(10,{geo_kills:100,geo_waves:10,geo_max_stars:5,score:1000}));
  apply('run.checkpoint',{snapshot});profile=JSON.parse(JSON.stringify(profile));
  assert.ok(profile.achievements.unlocked.geo_stars_5);
  assert.throws(()=>apply('run.checkpoint',{snapshot:{...snapshot,geo_waves:21}}),{code:'invalid'});
  const result=apply('run.finish',{outcome:'win',snapshot:{...snapshot,geo_waves:20,over:true,won:true}});
  assert.ok(profile.achievements.unlocked.geo_arena_10);
  assert.ok(profile.achievements.unlocked.geo_flawless_10);
  assert.equal(profile.shop.units,0);assert.deepEqual(profile.scores,{});assert.equal(result.run.eligible,false);
});
