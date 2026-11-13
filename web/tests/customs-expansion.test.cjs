const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../customs.js');
const X=require('../customs-expansion.js');
const S=require('../shop.js');
const R=require('../../shared/account-rules.js');

test('100 new shop characters have individual names, artwork, and fixed unique prices',()=>{
  assert.equal(X.catalog.length,100);
  for(const key of ['id','name','price','flavor','emblem']) assert.equal(new Set(X.catalog.map(x=>x[key])).size,100,key);
  assert.equal(new Set(X.catalog.map(x=>C.svg(x))).size,100);
  const previous=C.catalog.filter(x=>x.price&&!x.expansion);
  assert.ok(X.catalog.every(x=>!previous.some(y=>y.price===x.price)));
  assert.equal(new Set(X.catalog.map(x=>x.collection)).size,10);
  for(const x of X.catalog) {
    assert.ok(R.catalog.some(y=>y.id===x.id&&y.price===x.price));
    assert.ok(Number.isSafeInteger(x.price)&&x.price>0);
    assert.match(C.svg(x),/class="cubie-eyes"/);
    assert.match(C.svg(x),/class="cubie-smile"/);
  }
});

test('each collection gains materials, layers, and motion at higher tiers',()=>{
  const nodes=s=>(s.match(/<(path|circle|rect|ellipse)\b/g)||[]).length;
  for(let f=0;f<10;f++) {
    let previous=0;
    for(let l=0;l<7;l++) {
      const item=X.catalog.find(x=>x.family===f&&x.level===l);
      const art=X.art(item,1);
      const count=nodes(art.detail+art.back);
      assert.ok(count>previous,`${item.name}: ${count} <= ${previous}`);
      previous=count;
      if(l>=3) assert.ok(art.back.length>0);
      if(l>=5) assert.match(art.back,/atelier-orbit/);
      if(l>0) assert.ok(item.price>Math.max(...X.catalog.filter(x=>x.level<l).map(x=>x.price)));
    }
  }
});

test('all 100 purchases charge exactly once and survive ownership restoration',()=>{
  const wallet={units:0,owned:[]};
  for(const item of X.catalog) {
    wallet.units=item.price*1000-1;
    assert.equal(S.buy(wallet,item),false);
    wallet.units++;
    assert.equal(S.buy(wallet,item),true);
    assert.equal(wallet.units,0);
    assert.equal(S.buy(wallet,item),false);
    assert.equal(C.selected(item.id,{},wallet.owned).id,item.id);
  }
  const restored=S.restore(JSON.parse(JSON.stringify(wallet)),C.catalog);
  assert.equal(restored.owned.length,100);
  const profile=R.sanitizeLegacy({shop:restored,cubieCustom:X.catalog[99].id});
  assert.equal(profile.cubieCustom,X.catalog[99].id);
});

test('Geomayhem retains every signature emblem without orbiting particle layers',()=>{
  for(const item of X.catalog) {
    const sprite=C.gameSvg(item);
    assert.ok(sprite.includes(item.emblem),item.name);
    assert.doesNotMatch(sprite,/atelier-orbit/);
    assert.doesNotMatch(sprite,/undefined|NaN/);
  }
  const marshmallow=C.catalog.find(x=>x.id==='shop_toasted_marshmallow');
  assert.match(C.gameSvg(marshmallow),/mallow/);
  assert.match(C.gameSvg(marshmallow),/#704435/);
});
