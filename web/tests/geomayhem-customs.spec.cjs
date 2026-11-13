const {test,expect,openGame}=require('./fixtures/game.cjs');
test('every Cubie Custom has a portable arena sprite and equipped skins appear in Geomayhem',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await openGame(page);
  const failed=await page.evaluate(async()=>{
    const failed=[];
    for(const item of CubieCustoms.catalog) {
      const image=new Image();image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(CubieCustoms.gameSvg(item))}`;
      try {await image.decode();if(!image.naturalWidth)failed.push(item.id);}catch{failed.push(item.id);}
    }
    return failed;
  });
  expect(failed).toEqual([]);
  await page.evaluate(()=>{saved.shop.owned.push('shop_puzzle_cube','shop_disco');saved.cubieCustom='shop_puzzle_cube';selectGame('geomayhem');startGame('level_1');});
  await expect.poll(()=>page.evaluate(()=>geomayhemCubieSprites.get('shop_puzzle_cube')?.naturalWidth||0)).toBeGreaterThan(0);
  expect(await page.evaluate(()=>snapshot.commands.filter(c=>c.kind==='geomayhem_cubie').length)).toBe(1);
  await page.evaluate(()=>saved.cubieCustom='shop_disco');
  await expect.poll(()=>page.evaluate(()=>geomayhemCubieSprites.get('shop_disco')?.naturalWidth||0)).toBeGreaterThan(0);
  for (const id of ['shop_toasted_marshmallow','shop_atelier_butter_biscuit','shop_atelier_jubilation_monarch']) {
    await page.evaluate(id=>{saved.shop.owned.push(id);saved.cubieCustom=id;},id);
    await expect.poll(()=>page.evaluate(id=>geomayhemCubieSprites.get(id)?.naturalWidth||0,id)).toBeGreaterThan(0);
  }
  await page.evaluate(()=>saved.cubieCustom='not-a-custom');
  await expect.poll(()=>page.evaluate(()=>geomayhemCubieSprites.get('classic')?.naturalWidth||0)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
