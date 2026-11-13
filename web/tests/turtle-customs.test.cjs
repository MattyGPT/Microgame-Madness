const {test}=require('node:test');
const assert=require('node:assert/strict');
const T=require('../turtle-customs.js');
const S=require('../shop.js');
const R=require('../../shared/account-rules.js');
test('57 unique customs increase price and visual complexity across all seven shop tiers',()=>{
  assert.equal(T.catalog.length,57);assert.equal(new Set(T.catalog.map(x=>x.id)).size,57);
  for(let l=0;l<7;l++){
    const rows=T.catalog.filter(x=>x.level===l);assert.equal(rows.length,l===6?9:8);
    for(const item of rows){assert.ok(T.preview(item).includes('<svg'));assert.ok(R.catalog.some(x=>x.id===item.id));}
    if(l){const previous=T.catalog.filter(x=>x.level===l-1);assert.ok(Math.min(...rows.map(x=>x.price))>Math.max(...previous.map(x=>x.price)));assert.ok(T.shapes(rows[0]).length>T.shapes(previous[0]).length);}
  }
});
test('ownership gates equipment and survives account migration',()=>{
  const item=T.catalog[55],wallet={units:item.price*1000,owned:[]};
  assert.equal(T.selected(item.id,wallet.owned),null);assert.ok(S.buy(wallet,item));assert.equal(S.buy(wallet,item),false);
  const profile=R.sanitizeLegacy({shop:wallet,turtleCustom:item.id});
  assert.equal(profile.turtleCustom,item.id);assert.equal(profile.shop.units,0);
});
test('Terrastrial Angel costs 5000 and contains all eight elemental crystal guardians',()=>{
  const angel=T.catalog.find(item=>item.name==='Terrastrial Angel');
  assert.equal(angel.price,5000);assert.equal(angel.tier,'empyrorite');
  const parts=T.shapes(angel,0);
  assert.equal(parts.filter(p=>p.fill.startsWith('@element')).length,8);
  assert.notDeepEqual(T.shapes(angel,1),parts);
  const wallet={units:4999999,owned:[]};assert.equal(S.buy(wallet,angel),false);
  wallet.units=5000000;assert.equal(S.buy(wallet,angel),true);assert.equal(wallet.units,0);
  assert.equal(R.sanitizeLegacy({shop:wallet,turtleCustom:angel.id}).turtleCustom,angel.id);
});
test('Angel crystal positions advance clockwise in screen coordinates',()=>{
  const angel=T.catalog.find(x=>x.angel);
  const at=t=>T.shapes(angel,t).find(p=>p.fill==='@element0').transform;
  const start=at(0),next=at(1);
  assert.equal(start.y,0);assert.ok(next.y>0);assert.ok(next.x<start.x);
});
