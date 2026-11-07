const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Tracker, catalog } = require('../achievements.js');
const Customs = require('../customs.js');
const snapshot = extra => ({ mode:'pumpkin', difficulty:'come_on', over:false, won:false,
  lives:10, shots_fired:0, fight_elapsed:0, counter_hits:0, ...extra });
const has = (t,id) => !!t.data.unlocked[id];

test('Merciful requires 300 seconds in one living, shot-free full fight', () => {
  const t = new Tracker(); t.start('pumpkin','come_on');
  t.observe(snapshot({fight_elapsed:299.999}));
  assert.equal(has(t,'pumpkin_merciful'),false);
  t.observe(snapshot({fight_elapsed:300}));
  assert.equal(has(t,'pumpkin_merciful'),true);
  assert.equal(Customs.selected('merciful',t.data.unlocked).id,'merciful');
  for (const extra of [{shots_fired:1},{shots_fired:undefined},{lives:0,over:true}, {mode:'wrath'}]) {
    const bad=new Tracker(); bad.start('pumpkin','come_on');
    bad.observe(snapshot({fight_elapsed:301,...extra}));
    assert.equal(has(bad,'pumpkin_merciful'),false);
  }
  const split=new Tracker(); split.start('pumpkin','come_on');
  split.observe(snapshot({fight_elapsed:200})); split.abandon();
  split.start('pumpkin','come_on'); split.observe(snapshot({fight_elapsed:100}));
  assert.equal(has(split,'pumpkin_merciful'),false);
});

test('Speedrunner requires a real win at or below the precise 70-second cutoff', () => {
  for (const [time,won,expected] of [[67.1,true,true],[70,true,true],[70.001,true,false],[69,false,false],[0,true,false],[NaN,true,false],[undefined,true,false]]) {
    const t=new Tracker(); t.start('pumpkin','come_on');
    t.observe(snapshot({over:true,won,fight_elapsed:time}));
    assert.equal(has(t,'pumpkin_speedrunner'),expected,`${time}/${won}`);
    if (expected) assert.equal(Customs.selected('speedrunner',t.data.unlocked).id,'speedrunner');
  }
});

test('Hand accumulates real counter deltas across modes and visits without double counting', () => {
  let t=new Tracker({stats:{wrathCounterHits:90}});t.visit();
  t.start('pumpkin','come_on'); t.observe(snapshot({counter_hits:9}));
  t.observe(snapshot({counter_hits:9}));
  assert.equal(t.data.stats.magentaCounterHits,99);
  assert.equal(has(t,'magenta_counter_100'),false);
  t=new Tracker(JSON.parse(JSON.stringify(t.data)));
  t.start('wrath','magenta_fingers');
  const s={mode:'wrath',difficulty:'magenta_fingers',counter_hits:1,over:false};
  t.observe(s);t.observe(s);
  assert.equal(t.data.stats.magentaCounterHits,100);
  assert.equal(Customs.selected('golden_hand',t.data.unlocked).id,'golden_hand');
  const old=new Tracker({stats:{wrathCounterHits:100}});old.visit();
  assert.equal(has(old,'magenta_counter_100'),true);
});

test('Prismatic needs all three tiers, excludes itself, and migrates saved medals', () => {
  const date='2026-11-06T12:00:00Z';
  const tiers=['crystal','diamond','rainbow'];
  // Include the existing collection medals in each set so visit cannot add
  // an extra medal that accidentally obscures the 2-versus-3 boundary.
  const medals=tiers.map(tier=>[catalog.find(a=>a.id===`collect_${tier}`),
    ...catalog.filter(a=>a.tier===tier&&!a.collectionTier&&!a.collectionTiers).slice(0,2)]);
  for(let missing=0;missing<3;missing++) {
    const unlocked=Object.fromEntries(medals.flatMap((a,i)=>a.slice(0,i===missing?2:3)).map(a=>[a.id,date]));
    const t=new Tracker({unlocked});t.visit();
    assert.equal(has(t,'collect_prismatic'),false);
    t.data.unlocked[medals[missing][2].id]=date;t.update(()=>{});
    assert.equal(Customs.selected('prismatic',t.data.unlocked).id,'prismatic');
    const restored=new Tracker(JSON.parse(JSON.stringify(t.data)));restored.visit();
    assert.equal(has(restored,'collect_prismatic'),true);
  }
  const item=catalog.find(a=>a.id==='collect_prismatic');
  const t=new Tracker({unlocked:{collect_prismatic:date}});
  assert.equal(t.progress(item),0);
});
