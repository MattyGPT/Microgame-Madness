"use strict";
(async()=>{
  const $=id=>document.getElementById(id),canvas=$('theater'),ctx=canvas.getContext('2d');
  let runtime=null,level=1,mode='intro',time=0,last=performance.now(),paused=false,state=null,arenaBackground=[];
  let audioContext=null,director=null,soundOn=false;
  $('sound').onclick=async()=>{soundOn=!soundOn;if(soundOn){audioContext??=new AudioContext();director??=new BossAudio.Director(audioContext);await audioContext.resume()}else director?.stop();$('sound').textContent=soundOn?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(soundOn));};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)director?.stop()});
  window.addEventListener('pagehide',()=>director?.stop());
  const reduced=$('reduced');reduced.checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const py=`import json, random
from geomayhem import Geomayhem
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
  function choose(n){director?.stop();level=(n+19)%20+1;time=0;mode='intro';paused=false;$('pause').textContent='Pause';$('phase').value='1';if(runtime){state=JSON.parse(runtime.runPython(`select_boss(${level})`));arenaBackground=state.background||[];}update();}
  function update(){const b=GeomayhemBosses.catalog[level-1];$('boss-name').textContent=b.name;$('score').textContent=`Original score: ${BossAudio.profiles[level-1].title} · Stereo sound design`;$('description').textContent=`${b.arena} — ${b.line}`;$('boss-hp').textContent=state?`${state.boss.hp.toLocaleString()} / ${state.boss.max_hp.toLocaleString()} HP · armored encounter`:'3× original encounter health';$('boss-health').max=state?.boss.max_hp||100;$('boss-health').value=state?.boss.hp||100;$('boss-health').style.accentColor=b.color;
    document.querySelectorAll('#roster button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===level-1)));
    $('phase').options[2].disabled=![10,20].includes(level);
    $('moves').replaceChildren(...b.moves.map((name,i)=>{const button=document.createElement('button');button.textContent=name;button.disabled=!runtime;button.onclick=()=>{mode='attacks';time=0;state=JSON.parse(runtime.runPython(`demo_cast(${i})`));update()};return button}));
  }
  GeomayhemBosses.catalog.forEach(b=>{const button=document.createElement('button');button.innerHTML=`${String(b.level).padStart(2,'0')} · ${b.name}<small>${b.arena}</small>`;button.style.setProperty('--boss-color',b.color);button.onclick=()=>choose(b.level);$('roster').append(button)});
  $('previous').onclick=()=>choose(level-1);$('next').onclick=()=>choose(level+1);
  $('intro').onclick=()=>{director?.stop();time=0;mode='intro';paused=false;$('pause').textContent='Pause'};
  $('attacks').onclick=()=>{mode='attacks';time=0};
  $('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause'};
  $('phase').onchange=()=>{if(runtime){state=JSON.parse(runtime.runPython(`demo_phase(${Number($('phase').value)})`));mode='attacks';update()}};
  function primitive(command){const c=command.coords;ctx.save();ctx.globalAlpha=command.opacity??1;ctx.setLineDash(command.dash||[]);
    if(command.kind==='geomayhem_polygon'){ctx.beginPath();const count=command.sides*(command.star?2:1);for(let i=0;i<count;i++){const a=command.angle+i*Math.PI*2/count,r=command.radius*(command.star&&i%2?.52:1),x=c[0]+Math.cos(a)*r,y=c[1]-Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();if(command.fill){ctx.fillStyle=command.fill;ctx.fill()}if(command.outline){ctx.strokeStyle=command.outline;ctx.lineWidth=command.width||1;ctx.stroke()}}
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
  function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!paused&&!document.hidden){time+=dt*Number($('speed').value);if(mode==='attacks'&&runtime){let remaining=dt*Number($('speed').value);while(remaining>0){const step=Math.min(.05,remaining);state=JSON.parse(runtime.runPython(`demo_tick(${step})`));remaining-=step;}}}
    if(mode==='intro'){GeomayhemBosses.cinematic(ctx,level,time,reduced.checked);if(time>=BossFilm.duration){mode='attacks';time=0}}
    else {ctx.fillStyle='#0a1520';ctx.fillRect(0,0,960,600);ctx.save();ctx.translate(480,300);ctx.scale(.95,.95);if(state){ctx.beginPath();ctx.arc(0,0,state.boss_arena_radius||280,0,Math.PI*2);ctx.clip();for(const c of arenaBackground)primitive(c);BossArena.draw(ctx,{level,bounds:state.bounds,time:state.fight_elapsed,phase:state.boss.phase,radius:state.boss_arena_radius,reduced:reduced.checked});for(const c of state.commands)primitive(c)}else GeomayhemBosses.portrait(ctx,level,0,0,140,time,1,reduced.checked);ctx.restore();}
    if(runtime)$('status').textContent=mode==='intro'?`Introduction · ${Math.min(BossFilm.duration,time).toFixed(1)} / ${BossFilm.duration} seconds`:`Phase ${state?.boss.phase||1} · ${state?.boss.move||'Preparing attack'} · ${paused?'Paused':'Demo running'} · ${state?.commands.filter(c=>c.kind==='geomayhem_enemy').length||0} reinforcements`;
    director?.sync({level,mode,time,phase:state?.boss?.phase||1,move:state?.boss?.move||'',playing:soundOn&&!paused&&!document.hidden,speed:Number($('speed').value)});
    requestAnimationFrame(frame);
  }
  choose(1);requestAnimationFrame(frame);
  try{runtime=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/'});runtime.FS.mkdir('/bossdemo');for(const file of ['geomayhem.py','geomayhem_bosses.py','geomayhem_arenas.py','geomayhem_weapons.py','geomayhem_view.py']){const r=await fetch(`./python/${file}`);if(!r.ok)throw Error(`Unable to load ${file}`);runtime.FS.writeFile(`/bossdemo/${file}`,await r.text())}runtime.runPython("import sys\nsys.path.insert(0,'/bossdemo')");runtime.runPython(py);choose(level);document.body.dataset.ready='true'}catch(error){runtime=null;$('status').textContent=`Attack simulation could not load: ${error.message}. Cutscenes remain available.`;update()}
})();
