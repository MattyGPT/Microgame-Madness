const {test,expect,openGame,leaveFullscreen}=require('./fixtures/game.cjs');
test.use({deterministicMusic:true});
test('group covers open overlapping Cubie, turtle and trail galleries',async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await openGame(page);await leaveFullscreen(page);await page.evaluate(()=>selectGame('customs'));
  await expect(page.locator('#cubie-groups')).toBeVisible();await expect(page.locator('#customs-grid')).toBeHidden();
  await page.locator('#cubie-groups [data-group="exclusive"]').click();
  await expect(page.locator('#customs-grid .custom-tile:visible')).toHaveCount(6);
  await expect(page.locator('[data-custom="crown_hangman_cubie"] .custom-equip')).toBeDisabled();
  await page.locator('#cubie-groups-back').click();await page.locator('#customs-search').fill('Retro Cubie');
  await expect(page.locator('#customs-grid .custom-tile:visible')).toHaveCount(1);
  for(const mode of ['turtles','trails']){
    await page.locator(`[data-game="${mode}"]`).click();await expect(page.locator('#equipment-groups')).toBeVisible();
    await page.locator('#equipment-groups [data-group="exclusive"]').click();await expect(page.locator('#equipment-grid .custom-tile')).toHaveCount(6);
    await page.locator('#equipment-back').click();await page.locator('#equipment-groups [data-group="ember"]').click();
    expect(await page.locator('#equipment-grid .custom-tile').count()).toBeGreaterThan(0);
  }
  await page.evaluate(()=>selectGame('customs'));await page.locator('#customs-search').fill('');await page.locator('#cubie-groups [data-group="exclusive"]').click();
  await page.locator('#customs-grid').screenshot({path:info.outputPath('exclusive-packs.png')});
  await page.evaluate(()=>{
    const context=document.createElement('canvas').getContext('2d');
    for(const item of TurtleCustoms.catalog.filter(i=>i.crown))TurtleCustoms.draw(context,item,80,80,2);
    for(const item of TurtleTrails.catalog.filter(i=>i.crown)){
      const field=new TurtleTrails.Field();field.itemId=item.id;field.particles=[{x:20,y:20,age:.1,rotation:1,color:item.colors[0]}];field.draw(context,item);
    }
  });
  expect(errors).toEqual([]);
});
test('verified first place equips a temporary pack; losing it restores normal equipment',async({page})=>{
  await openGame(page);await leaveFullscreen(page);
  await page.evaluate(async()=>{await accountApp.ready;await CrownPacks.refresh({configured:true,listGame:async()=>[{rank:1,is_you:true}]},accountApp.controller.state().owner);selectGame('customs');});
  await page.locator('#cubie-groups [data-group="exclusive"]').click();
  await page.locator('[data-custom="crown_keyboard_cubie"] .custom-equip').click();
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','crown_keyboard_cubie');
  expect(await page.evaluate(()=>saved.shop.owned.some(id=>id.startsWith('crown_')))).toBe(false);
  for(const [mode,slot] of [['turtles','turtle'],['trails','trail']]){
    await page.evaluate(mode=>selectGame(mode),mode);await page.locator('#equipment-groups [data-group="exclusive"]').click();
    await page.locator(`#equipment-grid [data-custom="crown_keyboard_${slot}"] button`).click();
    await expect(page.locator('#collection-equipped')).toContainText('Chromatic Keymaster');
  }
  await page.evaluate(async()=>{await CrownPacks.refresh({configured:true,listGame:async()=>[{rank:1,is_you:false}]},accountApp.controller.state().owner);applyCubieCustom();renderEquipmentCollection();});
  await expect(page.locator('#cube')).toHaveAttribute('data-custom','classic');
  await expect(page.locator('#collection-equipped')).toContainText('Classic / none');
});
test('DBTV wires deform along their length and stop for reduced motion',async({page})=>{
  await openGame(page);await leaveFullscreen(page);await page.evaluate(()=>selectGame('shop'));await page.locator('#shop-search').fill('DBTV');
  const wire=page.locator('#shop-grid .dbtv-wire').first();await wire.scrollIntoViewIfNeeded();
  const tip=()=>wire.evaluate(p=>{const point=p.getPointAtLength(p.getTotalLength());return [point.x,point.y];});
  const start=await tip();await expect.poll(tip).not.toEqual(start);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(()=>wire.evaluate(p=>p.ownerSVGElement.animationsPaused())).toBe(true);
});
