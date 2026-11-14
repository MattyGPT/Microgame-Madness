"use strict";
(async()=>{
  const $=id=>document.getElementById(id),canvas=$('theater'),ctx=canvas.getContext('2d');
  let runtime=null,level=1,mode='intro',time=0,last=performance.now(),paused=false,state=null,arenaBackground=[];
  const keys=new Set();let aim=null;
  let audioContext=null,director=null,soundOn=false;
  $('sound').onclick=async()=>{soundOn=!soundOn;if(soundOn){audioContext??=new AudioContext();director??=new BossAudio.Director(audioContext);await audioContext.resume()}else director?.stop();$('sound').textContent=soundOn?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(soundOn));};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)director?.stop()});
  window.addEventListener('pagehide',()=>director?.stop());
  const reduced=$('reduced');reduced.checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const py=`import json, random
from geomayhem import Geomayhem, RELICS
from geomayhem_weapons import ARMORY
from geomayhem_bosses import boss_attack, boss_pressure
preview = None
def select_boss(level):
    global preview
    preview=Geomayhem(level, rng=random.Random(42))
    preview.anomaly='armored'
    preview.wave=20
    preview.break_left=0
    preview._spawn()
    preview.boss_intro_left=0
    preview.spawned=preview.quota
    preview.enemies[0].x=0
    preview.enemies[0].y=120
    return json.dumps(preview.snapshot(compact=True))
def fight_start(level, config):
    global preview
    select_boss(level)
    preview.loadout = {item['id']: item['stars'] for item in config['weapons']}
    preview.weapon = next(iter(preview.loadout))
    preview.cooldowns = {key: 0.0 for key in preview.loadout}
    preview.max_lives += config['workshop']['vitality'] * 10
    preview.magnet += config['workshop']['magnet'] * 12
    preview.damage_multiplier *= 1 + config['workshop']['power'] * .05
    preview.lives = preview.max_lives
    for key, count in config['upgrades'].items():
        for _ in range(count):
            preview.offers = [{'id': key}]
            preview.choose(key)
    for key in config['relics']:
        preview.offers = [{'id': 'relic:' + key}]
        preview.choose('relic:' + key)
    preview.lives = preview.max_lives
    preview.offers = []
    return json.dumps(preview.snapshot(compact=True))
def fight_tick(dt, keys, aim):
    preview.offers = []
    if preview.alive and not preview.boss_defeat_seen and not any(e.kind == 'boss' and e.hp > 0 for e in preview.enemies):
        preview.start_boss_defeat()
    preview.update(dt, set(keys), aim)
    # The selected build is fixed for this practice fight; XP cannot interrupt it.
    preview.offers = []
    preview.xp = 0
    if preview.alive and not preview.boss_defeat_seen and not any(e.kind == 'boss' and e.hp > 0 for e in preview.enemies):
        preview.start_boss_defeat()
    return json.dumps(preview.snapshot(compact=True, include_background=False))
def demo_tick(dt):
    preview.invulnerable=100
    preview.offers=[]
    preview.update(dt, set())
    return json.dumps(preview.snapshot(compact=True, include_background=False))
def demo_phase(phase):
    boss=preview.enemies[0]
    boss.hp=boss.max_hp*({1:1,2:.45,3:.2}[phase])
    boss.skill_in=0
    preview.zones=[]
    preview.hazards=[]
    return json.dumps(preview.snapshot(compact=True, include_background=False))
def demo_cast(index):
    preview.boss_cast=index
    preview.zones=[]
    preview.hazards=[]
    boss=preview.enemies[0]
    phase=3 if preview.level in (10,20) and boss.hp<boss.max_hp*.25 else 2 if boss.hp<boss.max_hp*.5 else 1
    boss_attack(preview,boss,phase)
    boss.skill_in=boss_pressure(preview.level,phase)["cast_interval"]
    return json.dumps(preview.snapshot(compact=True, include_background=False))
`;
  function choose(n){keys.clear();aim=null;director?.stop();level=(n+19)%20+1;time=0;mode='intro';paused=false;$('pause').textContent='Pause';$('phase').value='1';if(runtime){state=JSON.parse(runtime.runPython(`select_boss(${level})`));arenaBackground=state.background||[];}update();}
  function update(){const b=GeomayhemBosses.catalog[level-1];$('boss-name').textContent=b.name;$('score').textContent=`Original score: ${BossAudio.profiles[level-1].title} · Stereo sound design`;$('description').textContent=`${b.arena} — ${b.line}`;$('boss-hp').textContent=state?.boss?`${state.boss.hp.toLocaleString()} / ${state.boss.max_hp.toLocaleString()} HP · armored encounter`:'Loading encounter health';$('boss-health').max=state?.boss?.max_hp||100;$('boss-health').value=state?.boss?.hp??0;$('boss-health').style.accentColor=b.color;
    document.querySelectorAll('#roster button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===level-1)));
    $('phase').disabled=mode==='fight';$('speed').disabled=mode==='fight';
    $('phase').options[2].disabled=![10,20].includes(level);
    $('moves').replaceChildren(...b.moves.map((name,i)=>{const button=document.createElement('button');button.textContent=name;button.disabled=!runtime||mode==='fight';button.onclick=()=>{mode='attacks';time=0;state=JSON.parse(runtime.runPython(`demo_cast(${i})`));update()};return button}));
  }
  GeomayhemBosses.catalog.forEach(b=>{const button=document.createElement('button');button.innerHTML=`${String(b.level).padStart(2,'0')} · ${b.name}<small>${b.arena}</small>`;button.style.setProperty('--boss-color',b.color);button.onclick=()=>choose(b.level);$('roster').append(button)});
  $('previous').onclick=()=>choose(level-1);$('next').onclick=()=>choose(level+1);
  $('intro').onclick=()=>{if(mode==='fight')choose(level);director?.stop();time=0;mode='intro';paused=false;$('pause').textContent='Pause'};
  $('attacks').onclick=()=>{if(mode==='fight'||mode==='defeat-preview')choose(level);mode='attacks';time=0};
  $('defeat-preview').onclick=()=>{choose(level);mode='defeat-preview';time=0;director?.stop();};
  $('defeat-skip').onclick=()=>{if(mode==='defeat-preview'){choose(level);mode='attacks';return;}if(state?.boss_defeat){runtime.runPython('preview.finish_boss_defeat()');state=JSON.parse(runtime.runPython('json.dumps(preview.snapshot(compact=True, include_background=False))'));keys.clear();director?.stop();}};
  $('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause'};
  $('phase').onchange=()=>{if(runtime){state=JSON.parse(runtime.runPython(`demo_phase(${Number($('phase').value)})`));mode='attacks';update()}};
  const loadoutStorageKey='microgame-madness.boss-theater.loadout.v1';
  function saveLoadout(){
    const selections=Object.fromEntries([...$('loadout').querySelectorAll('select')].map(el=>[el.id,el.value]));
    const relics=[...$('relics').querySelectorAll('input:checked')].map(el=>el.value);
    try{localStorage.setItem(loadoutStorageKey,JSON.stringify({selections,relics}));}catch{}
  }
  function restoreLoadout(){
    try{
      const saved=JSON.parse(localStorage.getItem(loadoutStorageKey));
      if(!saved||typeof saved!=='object')return;
      for(const el of $('loadout').querySelectorAll('select')){
        const value=saved.selections?.[el.id];
        if(typeof value==='string'&&[...el.options].some(option=>option.value===value))el.value=value;
      }
      if(Array.isArray(saved.relics))for(const el of $('relics').querySelectorAll('input'))el.checked=saved.relics.includes(el.value);
      for(let i=0;i<4;i++)$(`weapon-${i}`).onchange();
    }catch{}
  }
  $('loadout').addEventListener('change',saveLoadout);
  function buildLoadout(){
    const catalog=JSON.parse(runtime.runPython("json.dumps({'weapons':[w.info() for w in ARMORY.values()], 'relics':RELICS})"));
    for(let i=0;i<4;i++){
      const row=document.createElement('div');row.className='slot';
      const label=document.createElement('label');label.textContent=`Slot ${i+1}`;
      const select=document.createElement('select');select.id=`weapon-${i}`;
      if(i)select.add(new Option('Empty',''));
      const featured=document.createElement('optgroup');featured.label='Featured · unlocked in theater';
      const geomutilator=catalog.weapons.find(w=>w.id==='geomutilator');
      if(geomutilator)featured.append(new Option('Geomutilator · Galactic blades',geomutilator.id));
      select.append(featured);
      const rest=document.createElement('optgroup');rest.label='All other weapons';
      for(const w of catalog.weapons.filter(w=>w.id!=='geomutilator'))rest.append(new Option(w.name+(w.automatic?' · Auto':''),w.id));
      select.append(rest);select.value=i?'':'needle';
      label.append(select);row.append(label);
      const stars=document.createElement('select');stars.id=`stars-${i}`;stars.setAttribute('aria-label',`Slot ${i+1} stars`);
      for(let n=1;n<=5;n++)stars.add(new Option(`${n} stars`,n));stars.value='5';row.append(stars);
      const detail=document.createElement('small');row.append(detail);
      const describe=()=>{const w=catalog.weapons.find(w=>w.id===select.value);detail.textContent=w?`${w.description}. ${w.third} ${w.fifth}`:'';stars.disabled=!w};select.onchange=describe;describe();$('weapon-slots').append(row);
    }
    for(const [group,items,max] of [['upgrades',{boots:'Move speed',magnet:'Pickup range',heart:'Maximum health'},5],['workshop',{power:'Damage',vitality:'Health',magnet:'Pickup range'},3]]){
      for(const [key,name] of Object.entries(items)){const label=document.createElement('label');label.textContent=name;const select=document.createElement('select');select.id=`${group}-${key}`;for(let n=0;n<=max;n++)select.add(new Option(`${n} / ${max}`,n));label.append(select);$(group).append(label)}
    }
    for(const [key,[name,description]] of Object.entries(catalog.relics)){const label=document.createElement('label');const input=document.createElement('input');input.type='checkbox';input.value=key;label.append(input,`${name} — ${description}`);$('relics').append(label)}
    restoreLoadout();
    $('equip-geomutilator').disabled=!catalog.weapons.some(w=>w.id==='geomutilator');
  }
  $('equip-geomutilator').onclick=()=>{
    const existing=Array.from({length:4},(_,i)=>i).find(i=>$(`weapon-${i}`).value==='geomutilator');
    const slot=existing??0;
    $(`weapon-${slot}`).value='geomutilator';$(`stars-${slot}`).value='5';$(`weapon-${slot}`).onchange();
    saveLoadout();$(`weapon-${slot}`).focus();
  };
  function startFight(event){
    event.preventDefault();if(!runtime){$('loadout-error').textContent='The battle engine is still loading. Please wait.';return;}
    try{
    const weapons=Array.from({length:4},(_,i)=>({id:$(`weapon-${i}`).value,stars:Number($(`stars-${i}`).value)})).filter(w=>w.id);
    const relics=[...document.querySelectorAll('#relics input:checked')].map(el=>el.value);
    if(new Set(weapons.map(w=>w.id)).size!==weapons.length||relics.length>3){$('loadout-error').textContent='Choose unique weapons and at most three relics.';return}
    $('loadout-error').textContent='';
    const config={weapons,relics,upgrades:{},workshop:{}};
    for(const group of ['upgrades','workshop'])for(const el of $(group).querySelectorAll('select'))config[group][el.id.slice(group.length+1)]=Number(el.value);
    runtime.globals.set('fight_config_json',JSON.stringify(config));
    state=JSON.parse(runtime.runPython(`fight_start(${level}, json.loads(fight_config_json))`));arenaBackground=state.background||[];
    keys.clear();aim=null;mode='fight';paused=false;time=0;$('speed').value='1';$('pause').textContent='Pause';director?.stop();update();canvas.focus();canvas.scrollIntoView({block:'center'});
    }catch(error){$('loadout-error').textContent=`Could not start fight: ${error.message}`;console.error(error);}
  }
  $('loadout').onsubmit=startFight;
  $('fight').onclick=startFight;
  const keyMap={a:'Left',d:'Right',w:'Up',s:'Down',ArrowLeft:'Left',ArrowRight:'Right',ArrowUp:'Up',ArrowDown:'Down',f:'f',' ':'f'};
  window.addEventListener('keydown',event=>{if(mode!=='fight'||/INPUT|SELECT|BUTTON/.test(event.target.tagName))return;const key=keyMap[event.key]||keyMap[event.key.toLowerCase()];if(key){event.preventDefault();keys.add(key)}if(event.key.toLowerCase()==='r'&&!event.repeat)$('pause').click()});
  window.addEventListener('keyup',event=>keys.delete(keyMap[event.key]||keyMap[event.key.toLowerCase()]));
  function release(){keys.clear();if(mode==='fight'){paused=true;$('pause').textContent='Resume'}}
  window.addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release()});
  function point(event){const r=canvas.getBoundingClientRect();aim=[(event.clientX-r.left)*960/r.width-480,300-(event.clientY-r.top)*600/r.height];aim=aim.map(v=>v/.95)}
  canvas.addEventListener('pointermove',point);
  canvas.addEventListener('pointerdown',event=>{if(mode!=='fight')return;event.preventDefault();canvas.focus();canvas.setPointerCapture(event.pointerId);point(event);keys.add('f')});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>keys.delete('f'));
  for(const button of document.querySelectorAll('[data-key]')){
    button.onpointerdown=event=>{event.preventDefault();button.setPointerCapture(event.pointerId);keys.add(button.dataset.key)};
    for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>keys.delete(button.dataset.key));
  }
  function primitive(command){const c=command.coords;ctx.save();ctx.globalAlpha=command.opacity??1;ctx.setLineDash(command.dash||[]);
    if(command.kind==='geomayhem_polygon'){ctx.beginPath();const count=command.sides*(command.star?2:1);for(let i=0;i<count;i++){const a=command.angle+i*Math.PI*2/count,r=command.radius*(command.star&&i%2?.52:1),x=c[0]+Math.cos(a)*r,y=c[1]-Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();if(command.fill){ctx.fillStyle=command.fill;ctx.fill()}if(command.outline){ctx.strokeStyle=command.outline;ctx.lineWidth=command.width||1;ctx.stroke()}}
    else if(command.kind==='geomayhem_weapon'){
      const sides={saw:12,bolt:3,fan:4,ring:8,beam:4,orbit:6,mine:5,boomerang:3,nova:10,drone:6}[command.weapon_kind]||6;
      if(command.stars>=3)primitive({...command,kind:'geomayhem_polygon',sides:command.stars===5?8:6,radius:command.size+(command.stars===5?8:4),fill:'',outline:command.fill,star:command.stars===5});
      primitive({...command,kind:'geomayhem_polygon',sides,radius:command.size,outline:'#efffff',star:['saw','ring','orbit','nova'].includes(command.weapon_kind)});
    }
    else if(command.kind==='geomayhem_enemy'){primitive({...command,kind:'geomayhem_polygon',outline:'#fff0dc',width:2});ctx.fillStyle='#152033';ctx.fillRect(c[0]-6,c[1]-4,3,4);ctx.fillRect(c[0]+3,c[1]-4,3,4);}
    else if(command.kind==='geomayhem_boss')GeomayhemBosses.drawCommand(ctx,command,reduced.checked);
    else if(command.kind==='geomayhem_cubie'){ctx.fillStyle='#baffc6';ctx.fillRect(c[0]-10,c[1]-10,20,20)}
    else {ctx.beginPath();ctx.fillStyle=command.fill||'#a3f1d4';ctx.strokeStyle=command.outline||'#a3f1d4';ctx.lineWidth=command.width||1;
      if(command.kind==='rectangle')ctx.rect(c[0],c[1],c[2]-c[0],c[3]-c[1]);
      else if(command.kind==='oval')ctx.ellipse((c[0]+c[2])/2,(c[1]+c[3])/2,Math.abs(c[2]-c[0])/2,Math.abs(c[3]-c[1])/2,0,0,Math.PI*2);
      else if(command.kind==='polygon'){ctx.moveTo(c[0],c[1]);for(let i=2;i<c.length;i+=2)ctx.lineTo(c[i],c[i+1]);ctx.closePath()}
      else if(command.kind==='text'){ctx.font=`bold ${command.font?.[1]||14}px sans-serif`;ctx.textAlign='center';ctx.fillText(command.text,c[0],c[1]);ctx.restore();return}
      if(command.fill)ctx.fill();if(command.outline)ctx.stroke();
    }ctx.restore();
  }
  function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!paused&&!document.hidden){time+=dt*Number($('speed').value);if((mode==='attacks'||mode==='fight')&&runtime&&!state?.over){let remaining=dt*Number($('speed').value);while(remaining>0){const step=Math.min(.05,remaining);state=JSON.parse(runtime.runPython(mode==='fight'?`fight_tick(${step}, ${JSON.stringify([...keys])}, ${aim?JSON.stringify(aim):'None'})`:`demo_tick(${step})`));remaining-=step;}}}
    const defeat=mode==='fight'?state?.boss_defeat:mode==='defeat-preview'?{time:Math.min(time,BossDefeat.duration(level)),duration:BossDefeat.duration(level)}:null;
    if(mode==='defeat-preview'&&time>=BossDefeat.duration(level)){paused=true;$('pause').textContent='Resume';}
    if(defeat){keys.clear();BossDefeat.draw(ctx,level,defeat.time,reduced.checked);}
    else if(mode==='intro'){GeomayhemBosses.cinematic(ctx,level,time,reduced.checked);if(time>=BossFilm.duration){mode='attacks';time=0}}
    else {ctx.fillStyle='#0a1520';ctx.fillRect(0,0,960,600);ctx.save();ctx.translate(480,300);ctx.scale(.95,.95);if(state){ctx.beginPath();ctx.arc(0,0,state.boss_arena_radius||280,0,Math.PI*2);ctx.clip();for(const c of arenaBackground)primitive(c);BossArena.draw(ctx,{level,bounds:state.bounds,time:state.fight_elapsed,phase:state.boss?.phase||1,radius:state.boss_arena_radius,reduced:reduced.checked});for(const c of state.commands)primitive(c)}else GeomayhemBosses.portrait(ctx,level,0,0,140,time,1,reduced.checked);ctx.restore();}
    if(runtime)$('status').textContent=mode==='intro'?`Introduction · ${Math.min(BossFilm.duration,time).toFixed(1)} / ${BossFilm.duration} seconds`:`Phase ${state?.boss?.phase||1} · ${state?.boss?.move||'Preparing attack'} · ${paused?'Paused':mode==='fight'?(state.over?(state.won?'Victory! Start fight to play again.':'Defeated. Start fight to retry.'):'Fight in progress'):'Demo running'} · ${state?.commands.filter(c=>c.kind==='geomayhem_enemy').length||0} reinforcements`;
    $('defeat-skip').hidden=!defeat;
    if(defeat)$('status').textContent=`${mode==='defeat-preview'?'Defeat cinematic':'Victory'} · ${BossDefeat.chapter(level,defeat.time)} · ${defeat.time.toFixed(1)} / ${defeat.duration}s`;
    $('player-hud').hidden=mode!=='fight'||!!defeat;
    if(mode==='fight'){ $('player-health').textContent=`Your HP: ${state.lives} / ${state.max_lives}`; $('player-health-bar').max=state.max_lives; $('player-health-bar').value=state.lives; $('player-hud').classList.toggle('low-health',state.lives<=state.max_lives*.25); $('boss-health').value=state.boss?.hp??0; $('boss-hp').textContent=state.boss?`${state.boss.hp} / ${state.boss.max_hp} HP`:'Boss defeated'; }else $('player-health').textContent='';
    director?.sync({level,mode:defeat?'defeat':mode==='intro'?'intro':'battle',time:defeat?defeat.time:time,phase:state?.boss?.phase||1,move:state?.boss?.move||'',playing:soundOn&&!paused&&!document.hidden&&!state?.over,speed:Number($('speed').value)});
    requestAnimationFrame(frame);
  }
  choose(1);requestAnimationFrame(frame);
  try{runtime=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/'});runtime.FS.mkdir('/bossdemo');for(const file of ['geomayhem.py','geomayhem_bosses.py','geomayhem_arenas.py','geomayhem_weapons.py','geomayhem_view.py']){const r=await fetch(`./python/${file}`,{cache:'no-store'});if(!r.ok)throw Error(`Unable to load ${file}`);runtime.FS.writeFile(`/bossdemo/${file}`,await r.text())}runtime.runPython("import sys\nsys.path.insert(0,'/bossdemo')");runtime.runPython(py);buildLoadout();choose(level);$('fight').disabled=false;document.body.dataset.ready='true'}catch(error){runtime=null;$('status').textContent=`Attack simulation could not load: ${error.message}. Cutscenes remain available.`;update()}
})();
