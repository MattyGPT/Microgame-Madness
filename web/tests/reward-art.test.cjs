const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../customs.js'),Crowns=require('../crown-packs.js');
const items=C.catalog.filter(i=>i.rewardMode);
test('all 28 reward Cubies retain unlocks but have independent artwork and palettes',()=>{
  assert.equal(items.length,28);assert.equal(new Set(items.map(i=>i.body+i.back+i.detail)).size,28);
  for(const mode of ['coindrop','nanolab','treasure','tearesseract']){
    const group=items.filter(i=>i.rewardMode===mode);assert.equal(new Set(group.map(i=>i.color)).size,7);
    assert.ok(new Set(group.map(i=>i.body)).size>=6);
    for(const i of group){assert.equal(i.achievements.length,1);assert.ok(i.achievements[0].startsWith(mode+'_milestone_'));}
  }
});
test('reward previews and arena sprites resolve all local gradients and clip paths',()=>{
  for(const item of items)for(const svg of [C.svg(item),C.gameSvg(item)]){
    assert.doesNotMatch(svg,/@\w+@|undefined|NaN/);
    const ids=new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
    for(const match of svg.matchAll(/url\(#([^)]+)\)/g))assert.ok(ids.has(match[1]),`${item.id}: missing ${match[1]}`);
  }
});
test('high-tier rewards and new champions use themed animated components',()=>{
  for(const item of items.filter(i=>i.rewardRank>=3))assert.match(C.svg(item),/class="reward-(?:bob|core|orbit|reverse|shards|pulse|wing|lid|prism|neural|ribbon|spin|flag|sail)/);
  const champions=['geomayhem','coindrop','nanolab','tearesseract','treasure'].map(mode=>Crowns.art({id:`crown_${mode}_cubie`,crown:mode}));
  assert.equal(new Set(champions).size,5);for(const art of champions)assert.doesNotMatch(art,/undefined|NaN/);
});
