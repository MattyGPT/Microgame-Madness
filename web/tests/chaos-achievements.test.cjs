const {test}=require('node:test');
const assert=require('node:assert/strict');
const A=require('../achievements.js');
const C=require('../customs.js');
const Art=require('../chaos-art.js');
const observe=(t, extra={})=>t.observe({mode:'dodge',difficulty:'chaos',elapsed:0,lives:8,max_lives:8,damage_taken:0,healing_collected:0,near_misses:0,score:0,over:false,won:false,...extra});
test('fourteen Chaos medals each unlock a distinct renderable Cubie, with persistence and exact thresholds',()=>{
  const medals=A.catalog.filter(a=>a.group === 'Turtle Dodge · Chaos');
  assert.equal(medals.length,14);
  const customs=new Set();
  for(const medal of medals){
    let t=new A.Tracker();t.start('dodge','chaos');
    if(medal.id!=='chaos_start') {
      const key={chaosBest:'elapsed',chaosCleanBest:'elapsed',chaosNearBest:'near_misses',chaosHealBest:'healing_collected',chaosScoreBest:'score'}[medal.stat];
      observe(t,{[key]:medal.target-1});assert.ok(!t.data.unlocked[medal.id]);
      observe(t,{[key]:medal.target});assert.ok(t.data.unlocked[medal.id]);
    }
    const custom=C.catalog.find(c=>c.achievements.includes(medal.id));assert.ok(custom);customs.add(custom.id);
    assert.ok(C.svg(custom).includes('<svg'));
    const stamp=t.data.unlocked[medal.id];t=new A.Tracker(JSON.parse(JSON.stringify(t.data)));
    assert.equal(t.data.unlocked[medal.id],stamp);
    assert.equal(C.selected(custom.id,t.data.unlocked).id,custom.id);
  }
  assert.equal(customs.size,14);
});
test('Chaos milestones do not inherit other modes or add different runs; healing cannot hide damage',()=>{
  const t=new A.Tracker({stats:{dodgeBest:500,impossibleBest:500}});
  t.start('dodge','easy');t.observe({mode:'dodge',difficulty:'easy',elapsed:500,over:false});
  assert.equal(t.data.stats.chaosBest,0);
  t.start('dodge','chaos');observe(t,{elapsed:29,near_misses:9,healing_collected:3});
  t.start('dodge','chaos');observe(t,{elapsed:29,near_misses:9,healing_collected:3});
  assert.equal(t.data.stats.chaosNearBest,9);assert.equal(t.data.stats.chaosHealBest,3);
  observe(t,{elapsed:60,damage_taken:1,lives:8});assert.ok(!t.data.unlocked.chaos_clean_30);
  assert.ok(t.data.unlocked.chaos_survive_60);
  observe(t,{elapsed:100,damage_taken:0,lives:0,over:true});assert.ok(!t.data.unlocked.chaos_clean_30);
});
test('guide chooses exact spawn-weight intervals, including very rare blocks',()=>{
  const blocks=[{id:'normal',weight:22},{id:'doom',weight:.45},{id:'weak',weight:15}];
  const total=37.45;
  assert.equal(Art.pickBlock(blocks,()=>0).id,'normal');
  assert.equal(Art.pickBlock(blocks,()=>21.99/total).id,'normal');
  assert.equal(Art.pickBlock(blocks,()=>22.1/total).id,'doom');
  assert.equal(Art.pickBlock(blocks,()=>22.46/total).id,'weak');
  assert.equal(Art.pickBlock(blocks,()=>.999999).id,'weak');
});

test('simple tab thumbnails randomize geometry and Wild colors while retaining special colors',()=>{
  const first=Art.tabPreview({id:'normal',color:'#63d9ed'},()=>0);
  const second=Art.tabPreview({id:'normal',color:'#63d9ed'},()=>.6);
  assert.notEqual(first.shape,second.shape);
  assert.notEqual(first.color,second.color);
  const special=Art.tabPreview({id:'fire',color:'#ff8a42'},()=>.6);
  assert.equal(special.color,'#ff8a42');
  const svg=decodeURIComponent(first.src.split(',')[1]);
  assert.ok(svg.includes('<rect'));
  assert.ok(svg.includes(Art.paths.normal) && !svg.includes('<text'));
  for (const id of Object.keys(Art.paths)) {
    const thumbnail=Art.tabPreview({id,color:'#ff8a42'},()=>.6);
    assert.ok(decodeURIComponent(thumbnail.src.split(',')[1]).includes(Art.paths[id]), id);
  }
});

test('Wild Seven randomizes tab colors while retaining its seven symbol',()=>{
  const a=Art.tabPreview({id:'wild_seven',color:'#63d9ed'},()=>0);
  const b=Art.tabPreview({id:'wild_seven',color:'#63d9ed'},()=>.6);
  assert.notEqual(a.color,b.color);
  assert.ok(decodeURIComponent(a.src.split(',')[1]).includes(Art.paths.wild_seven));
});

test('glowing outlines distinguish helpful, harmful and temporarily harmless blocks',()=>{
  for(const id of ['heal','shield','antidote','bubble','hourglass','heartburst','mender','stasis','phoenix','aegis','mint','clockwork','repellent','lullaby'])
    assert.equal(Art.outlineColor(id),'#57ff75');
  for(const id of ['normal','wild_seven','haste','curse','doom','ghost','phase','gravity_well'])
    assert.equal(Art.outlineColor(id),'#ff4055');
  assert.equal(Art.outlineColor('weak'),'#b8b8b8');
  assert.equal(Art.outlineColor('ghost',true),'#b8b8b8');
  for (const id of ['heal','wild_seven']) {
    const svg=decodeURIComponent(Art.tabPreview({id,color:'#63d9ed'},()=>0).src.split(',')[1]);
    assert.ok(svg.includes(`stroke="${Art.outlineColor(id)}" stroke-width="3"`));
    assert.ok(svg.includes('drop-shadow'));
  }
});

test('extra outlines identify pickups only, never solid hazards',()=>{
  assert.equal(Art.outerOutlineColor('heal'),'#ff1493');
  assert.equal(Art.outerOutlineColor('curse'),'#ffe45c');
  assert.equal(Art.outerOutlineColor('haste'),'#ffe45c');
  for (const kind of ['normal','wild_seven','fire','poison','doom','glitch','gravity_well'])
    assert.equal(Art.outerOutlineColor(kind),null);
  assert.equal(Art.outerOutlineColor('weak'),null);
  assert.equal(Art.outerOutlineColor('phase',true),null);
  for (const id of ['heal','curse']) {
    const svg=decodeURIComponent(Art.tabPreview({id,color:'#63d9ed'},()=>0).src.split(',')[1]);
    assert.ok(svg.includes(`stroke="${Art.outerOutlineColor(id)}" stroke-width="2"`));
    assert.ok(svg.includes(`stroke="${Art.outlineColor(id)}" stroke-width="3"`));
  }
});


test('guide animation states include timed colors, teleport warnings, ghost phases and lightning',()=>{
  const state=(id,age)=>Art.previewState({id,color:'#abc',preview_cells:[[0,0]],preview_size:32},age);
  assert.equal(state('elite_turbo',.099).fill,state('elite_turbo',0).fill);
  assert.notEqual(state('elite_turbo',.1).fill,state('elite_turbo',0).fill);
  assert.notEqual(state('elite_leafy',.2).fill,state('elite_leafy',.1).fill);
  assert.equal(state('glitch',1).warning,true);
  assert.notDeepEqual([state('glitch',1).x,state('glitch',1).y],[state('glitch',2.21).x,state('glitch',2.21).y]);
  assert.equal(state('ghost',2.1).ghost,true);
  assert.equal(state('ghost',3.1).ghost,false);
  assert.equal(state('thunder',1.1).warning,true);
  assert.equal(state('thunder',1.3).strike,true);
  assert.equal(state('thunder',1.6).strike,false);
  assert.equal(state('fire_star',1.2).warning,true);
  assert.equal(state('fire_star',2.6).strike,true);
});

test('new catalog blocks are eligible immediately and have a fallback thumbnail', () => {
  const added = { id: 'future_catalog_block', name: 'Future block', color: '#57b9ff', weight: 2 };
  const blocks = [{ id: 'normal', color: '#48d9ef', weight: 8 }, added];
  assert.equal(Art.pickBlock(blocks, () => .7999).id, 'normal');
  assert.equal(Art.pickBlock(blocks, () => .8), added);
  assert.equal(Art.pickBlock(blocks, () => .9999), added);
  const preview = Art.tabPreview(added, () => .3);
  assert.ok(preview.src.startsWith('data:image/svg+xml'));
  const svg = decodeURIComponent(preview.src.split(',')[1]);
  assert.ok(svg.includes(added.color));
  assert.ok(!svg.includes('undefined'));
});
