const { test } = require('node:test');
const assert = require('node:assert/strict');
const Trails = require('../trails.js');
const Shop = require('../shop.js');
const Customs = require('../customs.js');
const item = Trails.catalog[0];
const state = (x, extra = {}) => ({mode:'dodge', player:{x, y:20, visible:true}, paused:false, over:false, ...extra});

test('48 unique, affordable-to-premium trails have valid previews and short lifetimes', () => {
  assert.equal(Trails.catalog.length,48);
  for (const key of ['id','name','flavor']) assert.equal(new Set(Trails.catalog.map(t=>t[key])).size,48);
  assert.deepEqual(Trails.catalog.map(t=>t.price),Trails.catalog.map(t=>t.price).sort((a,b)=>a-b));
  for (const t of Trails.catalog) {
    assert.ok(Number.isSafeInteger(t.price) && t.price > 0);
    assert.ok(t.lifetime > .2 && t.lifetime < .5);
    assert.ok(!/undefined|NaN/.test(Trails.preview(t)));
    assert.ok(t.colors.every(color=>/^#[0-9a-f]{6}$/i.test(color)));
  }
});

test('trails share the wallet, preserve skin ownership, and cannot equip without purchase', () => {
  const catalog=[...Customs.catalog,...Trails.catalog];
  const skin=Customs.catalog.find(c=>c.price);
  const wallet=Shop.restore({units:500000,owned:[skin.id]},catalog);
  assert.equal(Trails.selected(item.id,wallet.owned),null);
  assert.equal(Shop.buy(wallet,item),true);
  assert.equal(wallet.units,500000-item.price*1000);
  assert.equal(Shop.buy(wallet,item),false);
  const restored=Shop.restore(JSON.parse(JSON.stringify(wallet)),catalog);
  assert.ok(restored.owned.includes(skin.id));
  assert.equal(Trails.selected(item.id,restored.owned),item);
  assert.equal(Trails.selected('__proto__',restored.owned),null);
});

test('movement emits by distance; stopping fades, pausing freezes, and teleports do not draw streaks', () => {
  const field=new Trails.Field();
  field.update(.016,state(0),item);
  for(let x=1;x<=30;x++) field.update(.001,state(x),item);
  assert.equal(field.particles.length,6);
  assert.ok(field.particles.every(p=>p.x>0 && p.x<=30 && Math.abs(p.y+20)<3));
  const before=JSON.stringify(field.particles);
  field.update(.1,state(30,{paused:true}),item);
  assert.equal(JSON.stringify(field.particles),before);
  for(let i=0;i<5;i++) field.update(.1,state(30),item);
  assert.equal(field.particles.length,0);
  field.update(.016,state(50),item);
  assert.ok(field.particles.length>0);
  field.update(.016,state(500),item);
  assert.equal(field.particles.length,0);
});

test('both Core modes, death, unequipping, and reduced motion clear trails', () => {
  for(const [snapshot,equipped,reduced] of [[state(30,{mode:'singularity'}),item,false],
    [state(30,{mode:'core_practice'}),item,false], [state(30,{over:true}),item,false],
    [state(30,{player:{x:30,y:20,visible:false}}),item,false], [state(30),null,false], [state(30),item,true]]) {
    const field=new Trails.Field(); field.update(.016,state(0),item);field.update(.016,state(20),item);
    assert.ok(field.particles.length>0); field.update(.016,snapshot,equipped,reduced);
    assert.equal(field.particles.length,0);assert.equal(field.last,null);
  }
  for(const mode of ['dodge','boss','pumpkin','wrath']) {
    const field=new Trails.Field();field.update(.016,state(0,{mode}),item);field.update(.016,state(30,{mode}),item);
    assert.ok(field.particles.length>0);
  }
});
