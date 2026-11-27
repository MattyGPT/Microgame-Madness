'use strict';
(() => {
const canvas=document.querySelector('#fight'),c=canvas.getContext('2d'),status=document.querySelector('#status');
const TAU=Math.PI*2, names=['BOOT SECTOR','CROSS EXAMINATION','SPIRAL WARRANT','FOUR TERMINALS / CORE RUPTURE','RELEASE / LIVE WIRE','REVERSE VERDICT / GRAVITY RETURN','PRISM CROSSCURRENT','EXECUTION CLOCK','RELEASE / RAIN','PULSE TRIBUNAL / CORE RUPTURE','FALSE HORIZON / GRAVITY RETURN','RELEASE / LASER GRID','SCISSOR PROTOCOL','ORBITAL SENTENCE','RELEASE / FLOOD','EIGHTFOLD ERROR / GRAVITY RETURN','DEADLOCK','RELEASE / COLLAPSE','FINAL APPEAL','REBOUND INDICTMENT','ECHO WARRANT','YELLOW FEINT','TURNABOUT CLOCK','GOLDEN REVERSAL','DOUBLE JEOPARDY','VELOCITY TRIAL','STAGGERED SENTENCE','TEMPO COLLAPSE','EVENT HORIZON','SYSTEM OVERDRIVE'];
const FINAL_ROUND=names.length-1,BOSS_MAX=names.length*5;
// Mix the ten new patterns through the existing encounter; the finale is always last.
const attackOrder=[0,1,19,2,3,21,4,5,25,6,7,20,8,9,22,10,11,26,12,13,23,14,15,28,16,17,27,24,18,FINAL_ROUND];
const attackNumber=()=>attackOrder.indexOf(round)+1;
const classicPatterns=[
  {pink:.35,pattern:0,speed:440,interval:.40},
  {pink:.4,pattern:1,speed:465,interval:.38},
  {yellow:.25,pattern:2,speed:470,interval:.37},
  {yellow:.25,pattern:3,speed:490,interval:.36},
  {yellow:1,pattern:2,speed:470*.9*.7,interval:.37/(.9*.7)},
  {pink:.25,yellow:.25,pattern:1,speed:480,interval:.40},
  {varied:true,pattern:0,speed:475,interval:.36},
  {varied:true,pattern:1,speed:490,interval:.35},
  {varied:true,pattern:3,speed:510,interval:.34},
  {holes:true},
];
const classicPattern=()=>round>=19&&round<FINAL_ROUND?classicPatterns[round-19]:null;
let rankedEncounter=null,rankedEligible=false,rankedClears=0;
let phase='ready',round=0,hp=16,boss=BOSS_MAX,t=0,world=0,spawn=0,inv=0,bullets=[],lasers=[],sparks=[],hits=0,blocked=0,paused=false,muted=false,mouse={x:550,y:300},p={x:550,y:515},keys=new Set(),audio,beat=0,nextBeat=0,frame=0,last=0,healSent=false;
let impactReservations=[];
let touchStick={pointer:null,x:0,y:0},touchFire=null;
let recoil=0, discharge=0, parry=0, shieldAngle=-Math.PI/2, pointerActive=false;
let finalCuts=[],finalWave=-1,finalShotTimer=0;
let chaosSlashes=[],chaosWave=-1,chaosShotTimer=0;
let prismMist=[],mistSeed=18731;
let wispTrail=[], volley=0, laserTimer=0, blackHoles=[], holeTimer=0, debris=[], destructionStarted=false;
let shieldIntegrity=100,shieldBroken=false,beamStarted=false,beamFired=false,beamBlocking=false,beamFx=0,beamFinished=false;
function coreSequence(){
  if(phase!=='attack'||![3,9,FINAL_ROUND].includes(round))return null;
  const speed=round===FINAL_ROUND?1.3:1,progress=(t-(round===FINAL_ROUND?32:2))*speed;
  if(progress<0||progress>=8)return null;
  const sway=Math.max(0,progress-1),x=550+Math.sin(sway*1.65)*145,y=215+Math.sin(sway*2.1)*17;
  return {speed,progress,warning:progress<2,x,y,tilt:Math.atan2(p.x-x,p.y-y)};
}
function beamGeometry(sequence){
  const dx=Math.sin(sequence.tilt),dy=Math.cos(sequence.tilt),vx=p.x-sequence.x,vy=p.y-sequence.y;
  return {dx,dy,along:vx*dx+vy*dy,across:vx*dy-vy*dx,incoming:Math.atan2(-dy,-dx)};
}
function braceShield(){
  const sequence=coreSequence();if(!sequence||sequence.warning||shieldBroken)return;
  shieldIntegrity=Math.min(100,shieldIntegrity+22);parry=.3;
}
function updateCoreBeam(dt,sequence){
  bullets=[];lasers=[];
  if(!beamStarted){beamStarted=true;p={x:550,y:515};pointerActive=false;wispTrail=[];status.textContent='GALACTIC DUST — CORE CHARGING · AIM UP · SPAM F WHEN THE BEAM FIRES';}
  if(sequence.warning){beamBlocking=false;return;}
  if(!beamFired){beamFired=true;playEffect('crush');status.textContent='CORE RUPTURE — FOLLOW THE TILT WITH YOUR SHIELD + SPAM F';}
  const geometry=beamGeometry(sequence),aim=angle();
  const difference=Math.abs(Math.atan2(Math.sin(aim-geometry.incoming),Math.cos(aim-geometry.incoming)));
  const exposed=geometry.along>0&&Math.abs(geometry.across)<115;
  beamBlocking=exposed&&!shieldBroken&&difference<.32;
  if(!shieldBroken){shieldIntegrity=Math.max(0,shieldIntegrity-44*sequence.speed*dt);
    if(shieldIntegrity===0){shieldBroken=true;beamBlocking=false;burst(p.x,p.y,'#ff71ce',65);playEffect('hurt');status.textContent='SHIELD IMPLODED — UNAVAILABLE FOR THE REST OF THIS ATTACK';}
  }
  if(exposed&&!beamBlocking)hit();
  beamFx-=dt;
  if(beamBlocking&&beamFx<=0){beamFx=.12/sequence.speed;burst(p.x+Math.cos(aim)*35,p.y+Math.sin(aim)*35,'#c5fff8',7);tone(105+shieldIntegrity,.09,'sawtooth',.025);}
}

const BLACK_HOLE_SPEED=1.4*.8,BLACK_HOLE_CYCLE=1.8,BLACK_HOLE_END=BLACK_HOLE_CYCLE*3;
const blackHoleRound=()=>[5,10,15,28].includes(round);
const attackTuning=()=>{
  const slow=round===8?.65:1,level=Math.min(round,19),classic=classicPattern();
  if(classic&&!classic.holes)return {speed:classic.speed,interval:classic.interval,damage:1};
  return {speed:(275+level*13)*([0,7].includes(round)?1.4:round===18?1.3*.8*.96*.91:round===13?.85:1)*slow,
    interval:(round===FINAL_ROUND?.20:Math.max(.24,.58-level*.016))/(round===18?1.35*.93:slow),
    laserWarning:Math.max(.65,.86-level*.01)/slow,
    laserInterval:Math.max(.95,1.65-level*.035)/slow,laserLife:.48/slow,damage:round===8?2:1};
};
const chaosPhase=()=>phase==='attack'&&round===18&&t>=5;
const overdriveFinale=()=>phase==='attack'&&round===FINAL_ROUND&&t>=45;
const shieldDisabled=()=>overdriveFinale()||chaosPhase()||(phase==='attack'&&round===8);
const moving=()=>([4,5,6,8,10,11,14,15,17,FINAL_ROUND].includes(round)||chaosPhase())&&!blackHoleRound()&&!coreSequence(), duration=()=>round===FINAL_ROUND?58.5:round===18?16.25:blackHoleRound()?18:10, angle=()=>{if(!(phase==='attack'&&round===12)&&Math.hypot(mouse.x-p.x,mouse.y-p.y)>2)shieldAngle=Math.atan2(mouse.y-p.y,mouse.x-p.x);return shieldAngle;}, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const SCISSOR_TURN_SPEED=400*Math.PI/180;
function updateShieldAim(dt){
  if(phase!=='attack'||round!==12||Math.hypot(mouse.x-p.x,mouse.y-p.y)<=2)return;
  const target=Math.atan2(mouse.y-p.y,mouse.x-p.x),delta=target-shieldAngle;
  // Opposing shields are equivalent modulo half a turn; take the shorter turn.
  const shortest=Math.atan2(Math.sin(delta*2),Math.cos(delta*2))/2;
  shieldAngle+=clamp(shortest,-SCISSOR_TURN_SPEED*dt,SCISSOR_TURN_SPEED*dt);
}
const chaosTempo=()=>1+.25*clamp((t-5)/11.25,0,1);
function shieldProfile(){const scale=(phase==='attack'?(round===12?1.2:round===16?.85:1):1)*(round!==FINAL_ROUND&&!shieldDisabled()?1.03:1);return {scale,inner:19*scale,outer:42*scale,radius:35*scale,arc:.48*scale,dual:phase==='attack'&&round===12};}
function shieldCovers(dx,dy){
  if(shieldBroken||shieldDisabled())return false;
  const shield=shieldProfile(),distance=Math.hypot(dx,dy),a=Math.atan2(dy,dx)-angle();
  const diff=Math.abs(Math.atan2(Math.sin(a),Math.cos(a)));
  return distance<shield.outer&&distance>shield.inner&&(diff<shield.arc||(shield.dual&&Math.PI-diff<shield.arc));
}
const effectBuffers=new Map(), activeEffects=[];
let effectsGain, effectsLimiter;
function effectsOutput(){
  if(!effectsGain){effectsGain=audio.createGain();effectsLimiter=audio.createDynamicsCompressor();effectsLimiter.threshold.value=-12;effectsLimiter.knee.value=12;effectsLimiter.ratio.value=5;effectsLimiter.attack.value=.003;effectsLimiter.release.value=.12;effectsGain.connect(effectsLimiter).connect(audio.destination);}
  return effectsGain;
}
function syncEffects(){try{if(effectsGain)effectsGain.gain.setTargetAtTime(muted||paused?0:1,audio.currentTime,.008);}catch{ /* Audio interruptions must not stop gameplay. */ }}
function makeEffect(kind,rate){
  const duration=kind==='hurt'?.32:.68, samples=new Float32Array(Math.ceil(rate*duration));
  let seed=817, phase=0, noise=0, held=0;
  for(let i=0;i<samples.length;i++){
    const t=i/rate, life=t/duration;
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const random=seed/2147483648-1;noise+=.12*(random-noise);
    let v;
    if(kind==='hurt'){
      phase+=2*Math.PI*(70+180*Math.exp(-t*28))/rate;
      v=Math.sin(phase)*.65*Math.exp(-t*10)+(random-noise)*.42*Math.exp(-t*35)+Math.sin(2*Math.PI*890*t)*.12*Math.exp(-t*22);
    }else{
      phase+=2*Math.PI*(39+100*Math.exp(-t*12)+7*Math.sin(t*34))/rate;
      const roar=Math.sin(phase)+.48*Math.sin(phase*1.99+.8*Math.sin(t*27))+.23*Math.sin(phase*3.03);
      // Sample-held distortion makes the attack crunch, then decay into a low growl.
      if(i%Math.max(1,Math.floor(rate/7000))===0)held=Math.round(Math.tanh(roar*2.4)*15)/15;
      v=held*.55*(.78+.22*Math.sin(t*73))*Math.exp(-t*3.5)+noise*.9*Math.exp(-t*6)+(random-noise)*.3*Math.exp(-t*50);
    }
    samples[i]=Math.tanh(v*1.2)*Math.min(1,t/.002)*Math.pow(1-life,.7);
  }
  return samples;
}
function playEffect(kind,volume=1){try{
  if(!audio||audio.state!=='running'||muted||paused)return;
  const output=effectsOutput();syncEffects();
  if(!effectBuffers.has(kind)){const samples=makeEffect(kind,audio.sampleRate),buffer=audio.createBuffer(1,samples.length,audio.sampleRate);buffer.copyToChannel(samples,0);effectBuffers.set(kind,buffer);}
  // Rapid F presses still produce distinct impacts without stacking unlimited roars.
  while(activeEffects.length>=3){const oldest=activeEffects.shift();oldest.gain.gain.setTargetAtTime(.0001,audio.currentTime,.008);oldest.source.stop(audio.currentTime+.04);}
  const source=audio.createBufferSource(),gain=audio.createGain();source.buffer=effectBuffers.get(kind);gain.gain.value=(kind==='hurt'?.42:.62)*volume;source.connect(gain).connect(output);
  const voice={source,gain};activeEffects.push(voice);source.onended=()=>{const index=activeEffects.indexOf(voice);if(index>=0)activeEffects.splice(index,1);source.disconnect();gain.disconnect();};source.start();
}catch{ /* Audio interruptions must not stop gameplay. */ }}
function tone(f,d=.1,type='square',volume=.035){try{if(!audio||audio.state!=='running'||muted||paused)return;let o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(f,audio.currentTime);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);o.connect(g).connect(effectsOutput());syncEffects();o.start();o.stop(audio.currentTime+d);}catch{ /* Continue animation if iOS interrupts the effect context. */ }}
// Stream the soundtrack instead of decoding the entire 98-second score before startup.
let songTrack,songRequest=0;
const songMedia=new Map();
function mediaFor(track){
  if(songMedia.has(track))return songMedia.get(track);
  const id=track==='tearesseract'?'fight-theme':'fight-prelude';
  const media=new Audio(document.querySelector('#'+id)?.content||`./${track==='tearesseract'?'tearesseract-theme':'tearesseract-prelude'}.mp3`);
  media.preload='auto';media.loop=true;media.playsInline=true;media.volume=track==='tearesseract_prelude'?.35:.5;
  songMedia.set(track,media);return media;
}
function music(){
  if(phase==='loading')return;
  for(const [track,media] of songMedia){
    media.muted=muted||paused||track!==songTrack||['loading','dead','win'].includes(phase);
    media.volume=track==='tearesseract_prelude'?.35:.5;
  }
}
function prepareSong(track){
  const media=mediaFor(track);
  // Called directly in the click handler, before any await, to retain iOS activation.
  for(const [other,playing] of songMedia)if(other!==track)playing.pause();
  media.muted=muted;
  if(media.readyState>0)media.currentTime=0;
  return new Promise((resolve,reject)=>{
    let settled=false;
    const finish=error=>{if(settled)return;settled=true;clearTimeout(timeout);media.removeEventListener('canplay',ready);media.removeEventListener('error',failed);error?reject(error):resolve();};
    const ready=()=>finish(),failed=()=>finish(Error('Soundtrack unavailable'));
    const timeout=setTimeout(()=>finish(Error('Soundtrack startup timed out')),6000);
    media.addEventListener('canplay',ready);media.addEventListener('error',failed);
    media.play().then(ready,finish);
    if(media.readyState>=3)ready();
  });
}
function beginSong(track){
  for(const [other,media] of songMedia)if(other!==track)media.pause();
  songTrack=track;
  const media=mediaFor(track);music();
  if(track==='tearesseract_prelude')document.querySelector('#preview-music').textContent=muted?'PRE-FIGHT MOTIF MUTED':'PRE-FIGHT MOTIF PLAYING';
  media.play().catch(()=>{});
}
async function playSong(track='tearesseract_prelude'){
  const request=++songRequest;
  try{await prepareSong(track);if(request===songRequest&&phase==='ready')beginSong(track);}
  catch{if(phase==='ready')document.querySelector('#preview-music').textContent='RETRY PRE-FIGHT MUSIC';}
}
function loadingUI(show){
  document.querySelector('#fight-loading').hidden=!show;
  for(const id of ['start','pause'])document.querySelector('#'+id).disabled=show;
}
function loadingProgress(){
  const media=songMedia.get('tearesseract'),bar=document.querySelector('#load-progress');
  let buffered=0;
  if(media)for(let i=0;i<media.buffered.length;i++)if(media.buffered.start(i)<=media.currentTime)buffered=Math.max(buffered,media.buffered.end(i)-media.currentTime);
  // This is initial playback readiness, not a fictional percentage of full-song decoding.
  const ready=media?.readyState>=3;
  if(ready)bar.value=100;
  else if(buffered>0)bar.value=Math.min(99,buffered/2*100);
  else bar.removeAttribute('value');
  document.querySelector('#load-percent').textContent=ready?'READY':buffered>0?`${buffered.toFixed(1)}s buffered`:'WAITING FOR AUDIO';
  document.querySelector('#load-message').textContent=ready?'LINK ESTABLISHED':'BUFFERING SOUNDTRACK';
}
let preludePending=false;
function previewMusic(){
  if(phase!=='ready'||typeof Audio!=='function')return;
  if(songTrack==='tearesseract_prelude'||preludePending)return;
  preludePending=true;playSong().finally(()=>{preludePending=false;});
}
document.querySelector('#preview-music').onclick=previewMusic;
// Try on entry, then retry on gestures when browser autoplay policy requires one.
document.addEventListener('pointerdown',previewMusic);
document.addEventListener('keydown',previewMusic);
function burst(x,y,color,n=18){for(let i=0;i<n;i++){let a=Math.random()*TAU,s=40+Math.random()*210;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.5+Math.random()*.5,color});}}
function enter(s){let savePromise=null;if((s==='dead'||s==='ending')&&rankedEligible){rankedEligible=false;if(typeof TearesseractProgress!=='undefined')savePromise=TearesseractProgress.finish(rankedEncounter,rankedClears,s==='ending');}const recenter=overdriveFinale();phase=s;if(recenter){p={x:550,y:525};mouse={x:550,y:425};pointerActive=false;wispTrail=[];}if(canvas.dataset)canvas.dataset.phase=s;if(s==='dead'&&typeof TearesseractDeath!=='undefined')TearesseractDeath.start(audio,muted,savePromise);t=0;spawn=0;impactReservations=[];finalCuts=[];finalWave=-1;finalShotTimer=0;chaosSlashes=[];chaosWave=-1;chaosShotTimer=0;bullets=[];prismMist=[];lasers=[];blackHoles=[];holeTimer=3;healSent=false;beamBlocking=false;if(s==='heal'||s==='counter'){shieldBroken=false;shieldIntegrity=100;}if(s==='ending'){boss=0;debris=[];destructionStarted=false;status.textContent='SYSTEM OVERDRIVE — TOTAL STRUCTURAL FAILURE';}if(s==='intro')status.textContent='CONNECTION IN PROGRESS / ASSEMBLING TEARESSERACT';if(s==='attack'){shieldAngle=-Math.PI/2;shieldIntegrity=100;shieldBroken=false;beamStarted=false;beamFired=false;beamFinished=false;beamFx=0;volley=0;laserTimer=1.2;p={x:550,y:515};wispTrail=[];pointerActive=false;status.textContent=`${attackNumber()}/${names.length} · ${names[round]} · ${moving()?'RELEASE: MOUSE MOVES WISP + SHIELD':'ANCHORED: AIM SHIELD'}`;if(round===8)status.textContent=`${attackNumber()}/${names.length} · RELEASE / RAIN · SHIELD OFF — MOUSE TO DODGE · RED HAZARDS: 2 DAMAGE`;if(round===12)status.textContent+=' · DUAL SHIELDS: 120%';if(round===16)status.textContent+=' · SHIELD SIZE: 85%';if(classicPattern()&&!classicPattern().holes)status.textContent+=' · '+(classicPattern().pink?'PINK: BLOCK TWICE · ':'')+(classicPattern().yellow?'YELLOW: HALF-ORBIT → OPPOSITE SIDE':'WATCH THE RHYTHM');if(blackHoleRound())status.textContent+=' · THREE BLACK-HOLE RETURNS';} }
async function start(attack=null){
  if(phase==='loading')return;
  rankedEligible=false;
  const request=++songRequest;enter('loading');paused=false;loadingUI(true);loadingProgress();
  status.textContent='ESTABLISHING LINK — PREPARING ENCOUNTER';
  document.querySelector('#preview-music').hidden=true;
  let audioReady=false;
  try{
    try{if(!audio){const Context=window.AudioContext||window.webkitAudioContext;if(Context)audio=new Context();}
      if(audio)audio.resume().catch(()=>{});
    }catch{ /* Streaming music does not depend on WebAudio. */ }
    await prepareSong('tearesseract');audioReady=true;
  }catch{ /* A blocked or failed audio request must never prevent the fight. */ }
  const progressRun=typeof TearesseractProgress!=='undefined'?await TearesseractProgress.begin():null;
  if(request!==songRequest)return;
  rankedEncounter=progressRun;rankedClears=0;rankedEligible=attack===null&&!document.querySelector('#practice-safe')?.checked;
  recoil=discharge=parry=0;keys.clear();sparks=[];round=attack??0;hp=16;boss=BOSS_MAX-(attackNumber()-1)*5;
  blocked=hits=beat=0;paused=Boolean(document.hidden);autoPaused=paused;syncEffects();
  for(const voice of activeEffects.splice(0))voice.source.stop();inv=0;
  enter(attack===null?'intro':'attack');last=performance.now();
  if(audioReady)beginSong('tearesseract');
  else{songTrack=null;for(const media of songMedia.values())media.pause();}
  loadingUI(false);document.querySelector('#pause').textContent=paused?'RESUME':'PAUSE';
  document.querySelector('#start').textContent='RESTART';
  if(!audioReady)status.textContent+=' · AUDIO UNAVAILABLE';
}

function fire(a,green=false,offset=0){
  if(!green)discharge=1;const r=400,speed=green?115:attackTuning().speed;
  const shot={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,vx:-Math.cos(a+offset)*speed,vy:-Math.sin(a+offset)*speed,green,red:!green&&round===8,damage:green?0:attackTuning().damage,trail:[]};
  const pattern=classicPattern();
  if(pattern&&!green&&!pattern.holes){
    const n=Math.max(0,volley-1);
    shot.yellow=pattern.yellow===1||!!pattern.yellow&&n%4===0;
    shot.pink=!!pattern.pink&&!shot.yellow&&(pattern.yellow?n%4===2:n%3===0);
    const scale=shot.pink?.8:pattern.varied?[.72,1.12,.88,1.25,.94][n%5]:1;
    shot.vx*=scale;shot.vy*=scale;shot.returnTimer=0;shot.turned=false;shot.blocks=0;shot.orbitDirection=n%2?1:-1;shot.orbitDuration=round===23?.26/.7:.26;
    if(shot.yellow){shot.vx*=.8;shot.vy*=.8;shot.orbitDuration/=.8;}
  }
  if(pattern&&!green&&!pattern.holes){
    const speed=Math.hypot(shot.vx,shot.vy),arrival=(r-35)/speed;
    const events=shot.yellow?[{at:arrival+shot.orbitDuration,a:a+Math.PI}]:shot.pink?[{at:arrival,a},{at:arrival+.52+13/speed,a}]:[{at:arrival,a}];
    impactReservations=impactReservations.filter(event=>event.at>t-.6);
    let delay=0;
    // Reserve real shield-contact windows, including rebounds and opposite-side returns.
    // Separate conflicting directions by reaction time plus a bounded mouse turn.
    for(let attempt=0;attempt<200;attempt++){
      let required=delay;
      for(const next of events)for(const old of impactReservations){
        const difference=Math.abs(Math.atan2(Math.sin(next.a-old.a),Math.cos(next.a-old.a)));
        if(difference<.7)continue; // A single ordinary shield arc covers this cluster.
        const gap=.26+Math.max(0,difference-.7)/(Math.PI*4),at=t+delay+next.at;
        if(Math.abs(at-old.at)<gap)required=Math.max(required,old.at+gap-t-next.at+.015);
      }
      if(required<=delay)break;delay=required;
    }
    shot.launchDelay=delay;
    for(const event of events)impactReservations.push({at:t+delay+event.at,a:event.a});
  }
  bullets.push(shot);
  if(round===12&&!green)bullets.push({...shot,x:2*p.x-shot.x,y:2*p.y-shot.y,vx:-shot.vx,vy:-shot.vy,trail:[]});
}
function hit(damage=1){if(document.querySelector('#practice-safe')?.checked){rankedEligible=false;return;}if(inv>0)return;hp=Math.max(0,hp-damage);inv=.7;burst(p.x,p.y,'#ff527c');playEffect('hurt');if(hp<=0)enter('dead');}
function spawnBlackHole(){
  const a=-Math.PI/2+volley*2.399,dir=-1;
  blackHoles.push({cx:p.x,cy:p.y,a,dir,age:0,x:p.x+Math.cos(a)*260,y:p.y+Math.sin(a)*260,cycle:0,blocked:0,trail:[]});
  volley++;
}
function blackHoleOffset(age){
  const cycle=Math.floor(age/BLACK_HOLE_CYCLE),u=age%BLACK_HOLE_CYCLE;
  const ease=v=>(1-Math.cos(Math.PI*clamp(v,0,1)))/2;
  // Retreat and turn together in one continuous outward quarter spiral.
  const outward=ease((u-.9)/.9);
  const radius=u<.9?260-240*ease(u/.9):20+240*outward;
  const turn=(cycle+outward)*Math.PI/2;
  return {radial:radius*Math.cos(turn),side:radius*Math.sin(turn)};
}
function updateBlackHoles(dt){
  for(const h of blackHoles){
    h.age+=dt*BLACK_HOLE_SPEED;h.blocked=Math.max(0,h.blocked-dt);
    if(h.age>=BLACK_HOLE_END){if(!h.imploding){h.imploding=true;burst(h.x,h.y,'#cbb0ff',24);tone(60,.25,'sawtooth',.03);}continue;}
    const cycle=Math.floor(h.age/BLACK_HOLE_CYCLE);
    if(cycle!==h.cycle){h.cycle=cycle;burst(h.x,h.y,'#b2a0ff',8);}
    const {radial,side}=blackHoleOffset(h.age);
    h.trail.push({x:h.x,y:h.y});if(h.trail.length>16)h.trail.shift();
    h.x=h.cx+Math.cos(h.a)*radial-Math.sin(h.a)*side*h.dir;
    h.y=h.cy+Math.sin(h.a)*radial+Math.cos(h.a)*side*h.dir;
    if(shieldCovers(h.x-p.x,h.y-p.y)){if(!h.blocked){parry=.35;tone(170,.07,'triangle',.012);}h.blocked=.12;}
    else if(!h.blocked&&Math.hypot(h.x-p.x,h.y-p.y)<29)hit();
  }
  blackHoles=blackHoles.filter(h=>h.age<BLACK_HOLE_END+.45);
}
function beginDestruction(){
  destructionStarted=true;playEffect('crush',1.23);tone(44,1.1,'sawtooth',.06*1.23);burst(550,215,'#f2ffff',100);
  for(let i=0;i<190;i++){
    const core=i<24,side=i%2?1:-1,x=core?550+(Math.random()-.5)*90:550+side*(95+Math.random()*340);
    const y=core?215+(Math.random()-.5)*90:i%3?230+Math.abs(x-550)*.45:Math.random()*230;
    const direction=i*2.399,force=140+Math.random()*230;
    debris.push({x,y,vx:(x-550)*.45+Math.cos(direction)*force,vy:(y-215)*.35+Math.sin(direction)*force-55,angle:Math.random()*TAU,spin:(Math.random()-.5)*8,size:core?15+Math.random()*20:5+Math.random()*18,wire:i%3===0,color:i%4?'#62e9dd':'#cf9eff'});
  }
}
function updateDestruction(dt){
  if(t>=2&&!destructionStarted)beginDestruction();
  for(const part of debris){part.vy+=85*dt;part.x+=part.vx*dt;part.y+=part.vy*dt;part.angle+=part.spin*dt;}
  if(t>12)enter('win');
}
// Rendering and collision share the same tilted, rippling ribbon geometry.
function prismY(b,x){
  const dx=x-550,w=b.weave;
  // Independent phases, speeds, tilt and curl per projectile; modest shared drift
  // keeps the narrow arena traversable without synchronizing the ribbons.
  return b.baseY+Math.sin(t*2.3)*6
    +Math.sin(t*w.rate+w.phase)*w.amplitude
    +Math.sin(t*w.tiltRate+w.tiltPhase)*dx*.17
    +Math.sin(dx*w.curl+t*w.rate*.7+w.curlPhase)*2;
}
function prismPath(b){return Array.from({length:17},(_,i)=>{const x=b.x-Math.sign(b.vx)*(b.beam?90:48)*(1-i/16);return [x,prismY(b,x)];});}
// Independent emitted material: it keeps its velocity after the comet moves away.
// A separate random stream keeps cosmetic turbulence from changing attack patterns.
function mistRandom(){mistSeed=(Math.imul(mistSeed,1664525)+1013904223)>>>0;return mistSeed/4294967296;}
function emitPrismMist(b,dt){
  b.mistClock=(b.mistClock||0)+dt;
  while(b.mistClock>=1/30){
    b.mistClock-=1/30;
    const life=.28+mistRandom()*.32;
    prismMist.push({x:b.x-b.vx*b.mistClock,y:b.y+(mistRandom()-.5)*5,
      vx:-b.vx*(.035+mistRandom()*.09),vy:(mistRandom()-.5)*24,
      ay:(mistRandom()-.5)*45,life,maxLife:life,hue:b.hue+(mistRandom()-.5)*25,
      width:.5+mistRandom()*1.7,length:18+mistRandom()*27});
  }
  if(prismMist.length>1200)prismMist.splice(0,prismMist.length-1200);
}
function updatePrismMist(dt){
  for(const w of prismMist){w.life-=dt;w.vy+=w.ay*dt;const drag=Math.exp(-1.8*dt);w.vx*=drag;w.vy*=drag;w.x+=w.vx*dt;w.y+=w.vy*dt;}
  prismMist=prismMist.filter(w=>w.life>0);
}
function drawPrismMist(){
  c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
  for(const w of prismMist){
    const remaining=w.life/w.maxLife,age=1-remaining;
    c.globalAlpha=Math.min(1,age*10)*remaining*.55;
    c.strokeStyle=`hsl(${w.hue} 95% 72%)`;c.lineWidth=w.width*remaining;
    const direction=Math.sign(w.vx),tail=w.length*(1+age*.7);
    c.beginPath();c.moveTo(w.x,w.y);
    c.quadraticCurveTo(w.x+direction*tail*.5,w.y-w.vy*.18,w.x+direction*tail,w.y+w.vy*.3+w.ay*age*.06);c.stroke();
  }
  c.restore();
}
function prismTouches(b,point){
  const path=prismPath(b);
  for(let i=1;i<path.length;i++){
    const [x,y]=path[i-1],dx=path[i][0]-x,dy=path[i][1]-y;
    const u=clamp(((point.x-x)*dx+(point.y-y)*dy)/(dx*dx+dy*dy),0,1);
    if(Math.hypot(point.x-x-u*dx,point.y-y-u*dy)<17)return true;
  }
  return false;
}
function arenaBounds(){
  if(round===6)return {x:445,y:425,w:210,h:190};
  const expand=overdriveFinale()?clamp((t-45)/1.1,0,1):0;
  const eased=expand*expand*(3-2*expand);
  return {x:275-145*eased,y:395-150*eased,w:550+290*eased,h:260+150*eased};
}
function updateOverdriveFinale(dt){
  const elapsed=t-45;
  if(finalWave<0){bullets=[];lasers=[];prismMist=[];finalWave=0;status.textContent='SYSTEM OVERDRIVE / REALITY FRACTURE — SHIELD OFF · CIRCLE THE CENTER';}
  if(elapsed>=1&&elapsed<10.6){
    const wave=Math.floor((elapsed-1)/(.52/(1.8*1.4)));
    if(wave>=finalWave){finalCuts.push({a:-Math.PI/4-wave*Math.PI/4,age:0,warning:.62/1.4,struck:false});finalWave=wave+1;tone(180+wave*17,.09,'triangle',.025);}
  }
  finalShotTimer-=dt;
  if(elapsed>=1&&elapsed<10.6&&finalShotTimer<=0){
    finalShotTimer=.3;
    const lane=Math.floor((elapsed-1)/.3)%4,x=[220,340,760,880][lane];
    bullets.push({x,y:230,vx:x<550?45:-45,vy:230+(lane%2)*30,chaosShard:true,finalMote:true,damage:1,trail:[]});
  }
  if(elapsed>=11.3)bullets=bullets.filter(b=>!b.finalMote);
  for(const cut of finalCuts){
    cut.age+=dt;
    if(cut.age>=cut.warning&&!cut.struck){cut.struck=true;discharge=1;burst(550+Math.cos(cut.a)*160,470+Math.sin(cut.a)*160,'#ff85eb',10);tone(65,.16,'sawtooth',.035);}
    const dx=p.x-550,dy=p.y-470,along=dx*Math.cos(cut.a)+dy*Math.sin(cut.a),across=-dx*Math.sin(cut.a)+dy*Math.cos(cut.a);
    if(cut.age>=cut.warning&&cut.age<cut.warning+.18&&along>-30&&along<520&&Math.abs(across)<30)hit();
  }
  finalCuts=finalCuts.filter(cut=>cut.age<cut.warning+.42);
  if(elapsed>=12.7&&elapsed<12.88){
    const dx=p.x-550,dy=p.y-470;
    // Two finite diagonal lanes, with generous open wedges above, below, and beside them.
    for(const sign of [-1,1]){const a=Math.atan2(sign*160,360),along=dx*Math.cos(a)+dy*Math.sin(a),across=-dx*Math.sin(a)+dy*Math.cos(a);if(Math.abs(along)<394&&Math.abs(across)<22)hit(6);}
  }
  if(elapsed>=11.3)status.textContent='RAINBOW X — LEAVE THE TWO DIAGONAL LANES · 6 DAMAGE';

}
function drawOverdriveAtmosphere(){
  if(phase!=='attack'||round!==FINAL_ROUND)return;
  const finale=overdriveFinale(),fade=finale?clamp((t-45)/1.1,0,1):0;
  c.save();c.globalCompositeOperation='screen';
  const glow=c.createRadialGradient(550,230,30,550,300,520);
  glow.addColorStop(0,`rgba(201,30,230,${(.16+.06*Math.sin(world*3))*(1-fade)})`);glow.addColorStop(1,'#30003500');c.fillStyle=glow;c.fillRect(0,0,1100,740);
  // Offset strips of the already-rendered boss create echoes without redrawing its scaffolding.
  c.globalAlpha=.14*(1-fade);
  for(let i=0;i<5;i++){const y=95+(i*61+world*33)%280,shift=Math.sin(world*9+i*7)*22;c.drawImage(canvas,150,y,800,9,150+shift,y,800,9);}
  c.globalCompositeOperation='source-over';c.globalAlpha=1;
  c.fillStyle=`rgba(0,0,5,${fade*.88})`;c.fillRect(0,0,1100,740);
  c.strokeStyle=finale?'#a347cc':'#fa69da';c.lineWidth=1;
  for(let i=0;i<8;i++){const y=110+(i*97+world*46)%530,x=(i*173)%1050;c.globalAlpha=.14+.09*Math.sin(world*6+i);line([[x,y],[x+70,y],[x+78,y-5],[x+120,y-5]],i%2?'#d273ff':'#ff4ed2',1);}
  c.globalAlpha=.5*(1-fade);c.translate(550,215);c.rotate(-world*.3);
  for(let i=0;i<3;i++){c.rotate(Math.PI/3);c.strokeStyle=i%2?'#e88cff':'#ff54ce';c.strokeRect(-82-i*8,-82-i*8,164+i*16,164+i*16);}
  c.restore();
}
function drawGalacticHammer(x,time){
  c.save();c.translate(x,0);c.shadowColor='#d51aff';c.shadowBlur=18;
  const metal=c.createLinearGradient(-30,-50,30,50);metal.addColorStop(0,'#26083f');metal.addColorStop(.4,'#7a1897');metal.addColorStop(.6,'#e64bbd');metal.addColorStop(1,'#190827');
  line([[-112,0],[0,0]],'#250c49',12);line([[-110,-2],[-3,-2]],'#b042c8',3);
  c.fillStyle=metal;c.strokeStyle='#ed76ef';c.lineWidth=2;c.beginPath();c.moveTo(-27,-43);c.lineTo(-16,-53);c.lineTo(24,-53);c.lineTo(32,-42);c.lineTo(32,42);c.lineTo(22,53);c.lineTo(-18,53);c.lineTo(-27,41);c.closePath();c.fill();c.stroke();
  for(let i=0;i<9;i++){const y=-42+i*10;c.globalAlpha=.35+.25*Math.sin(time*5+i);line([[-22,y],[-5,y+4],[24,y]],'#e68eff',1);}
  c.globalAlpha=1;c.fillStyle='#e9a5ff';c.beginPath();c.moveTo(2,-15);c.lineTo(13,0);c.lineTo(2,15);c.lineTo(-9,0);c.closePath();c.fill();
  for(let i=0;i<12;i++){const a=time*(i%2?1:-1)+i*2.4,r=30+i%4*9,px=Math.cos(a)*r,py=Math.sin(a)*r;c.globalAlpha=.4+.5*Math.sin(time*8+i)**2;line([[px-2,py],[px+2,py]],i%2?'#ff8bdf':'#b998ff',1);line([[px,py-2],[px,py+2]],'#fff0ff',1);}
  c.restore();
}
function drawOverdriveFinale(){
  if(!overdriveFinale())return;
  const bounds=arenaBounds(),elapsed=t-45;
  c.save();c.strokeStyle='#ce78ff';c.lineWidth=2;c.shadowColor='#ef59e4';c.shadowBlur=12;c.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h);c.shadowBlur=0;
  for(const cut of finalCuts){
    const warning=cut.age<cut.warning;
    c.save();c.translate(550,470);c.rotate(cut.a);
    if(warning){c.globalAlpha=.3+.4*cut.age/cut.warning;c.fillStyle='#e450ed22';c.fillRect(-25,-30,545,60);c.setLineDash([10,8]);line([[-25,0],[520,0]],'#f2a5ff',2);c.setLineDash([]);
      const offset=490-80*cut.age/cut.warning;drawGalacticHammer(offset,world);
    }else{c.globalAlpha=clamp(1-(cut.age-cut.warning-.18)/.24,0,1);c.shadowBlur=22;c.shadowColor='#fa53d7';line([[-25,0],[520,0]],'#cb39d9',48);line([[-25,0],[520,0]],'#fff0ff',6);
      for(let i=0;i<5;i++)line([[i*90,0],[i*90+25,Math.sin(i*8)*30],[i*90+48,0]],'#bd4ee8',2);drawGalacticHammer(500-clamp((cut.age-cut.warning)/.18,0,1)*490,world);
    }c.restore();
  }
  if(elapsed>=11.3){
    const charge=clamp((elapsed-11.3)/1.4,0,1),strike=elapsed>=12.7,fade=1-clamp((elapsed-12.88)/.5,0,1);
    c.translate(550,470);
    for(const sign of [-1,1]){
      c.save();c.rotate(Math.atan2(sign*160,360));
      // The warning lane is fixed; the luminous slash slides along it and fades in.
      c.globalAlpha=.22*fade;c.fillStyle='#d28aff';c.fillRect(-394,-22,788,44);
      c.globalAlpha=(.18+.82*charge)*fade;c.translate((1-charge)*sign*145,0);
      const spectrum=c.createLinearGradient(-394,0,394,0);['#ff507c','#ffb84e','#ffff82','#65ffc4','#70dbff','#b893ff','#ff7fe5'].forEach((color,i)=>spectrum.addColorStop(i/6,color));
      c.strokeStyle=spectrum;c.lineWidth=strike?22:9;c.shadowColor='#c16cff';c.shadowBlur=strike?30:12;
      c.beginPath();c.moveTo(-394,0);c.lineTo(394,0);c.stroke();line([[-394,0],[394,0]],'#ffffff',strike?3:1);
      c.restore();
    }
  }
  c.restore();
}
function updateChaosSlashes(dt){
  if(chaosWave<0){bullets=[];lasers=[];prismMist=[];status.textContent='FINAL APPEAL / CHAOS SLICER — SHIELD OFF · MOUSE TO DODGE';}
  const elapsed=t-5,tempo=chaosTempo();
  const wave=Math.min(17,Math.floor((elapsed+.125*elapsed*elapsed/11.25)/(.95/1.4)));
  if(wave>chaosWave){
    chaosWave=wave;
    const angles=[-.65,.65,0,Math.PI/2,-.65];
    const add=(a,offset=0)=>chaosSlashes.push({x:p.x-Math.sin(a)*offset,y:p.y+Math.cos(a)*offset,a,age:0,warning:wave===17?.75:.65,struck:false});
    const a=angles[wave%angles.length];add(a);add(a,wave%2?120:-120);
    if(wave===17){add(a+Math.PI/2);add(a+Math.PI/2,120);}
    tone(280+wave*60,.12,'triangle',.025);
  }
  chaosShotTimer-=dt;
  if(chaosShotTimer<=0){
    chaosShotTimer+=.22/tempo;
    const side=Math.random()<.5?-1:1,x=550+side*330,y=390+Math.random()*270;
    const targetX=300+Math.random()*500,targetY=410+Math.random()*230;
    const a=Math.atan2(targetY-y,targetX-x),speed=(360+Math.random()*120)*tempo;
    bullets.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,chaosShard:true,damage:1,trail:[]});
  }
  for(const slash of chaosSlashes){
    slash.age+=dt;
    if(slash.age>=slash.warning&&!slash.struck){slash.struck=true;discharge=1;tone(70,.18,'sawtooth',.045);}
    const dx=p.x-slash.x,dy=p.y-slash.y;
    if(slash.age>=slash.warning&&slash.age<slash.warning+.18/1.4&&Math.abs(-dx*Math.sin(slash.a)+dy*Math.cos(slash.a))<25&&Math.abs(dx*Math.cos(slash.a)+dy*Math.sin(slash.a))<430)hit();
  }
  chaosSlashes=chaosSlashes.filter(s=>s.age<s.warning+.42);
}
function drawChaosSlashes(){
  if(!chaosPhase())return;
  for(const s of chaosSlashes){
    const warning=s.age<s.warning,progress=clamp((s.age-s.warning)/(.18/1.4),0,1);
    c.save();c.translate(s.x,s.y);c.rotate(s.a);
    if(warning){
      c.globalAlpha=.35+.35*s.age/s.warning;c.fillStyle='#d74aff22';c.fillRect(-430,-25,860,50);
      c.setLineDash([12,9]);line([[-430,0],[430,0]],'#f4a0ff',2);c.setLineDash([]);
      // Two suspended blades close in before the indicated lane is cut.
      for(const side of [-1,1]){c.save();c.translate(side*(430-60*s.age/s.warning),0);c.scale(-side,1);
        c.fillStyle='#f7e8ff';c.beginPath();c.moveTo(55,0);c.lineTo(-18,-9);c.lineTo(-30,0);c.lineTo(-18,9);c.closePath();c.fill();
        line([[-25,-18],[-25,18]],'#da72ff',4);line([[-25,0],[-48,0]],'#8f64df',5);c.restore();}
    }else{
      c.globalAlpha=clamp(1-(s.age-s.warning-.18/1.4)/.24,0,1);c.shadowColor='#dc61ff';c.shadowBlur=22;
      line([[-430,-7],[430,7]],'#c360ff',36*(1-progress*.45));line([[-430,-7],[430,7]],'#fff1ff',5);
      for(let i=0;i<7;i++){const x=-330+i*110;line([[x,0],[x+35,(-1)**i*(14+progress*28)]],'#edb4ff',2);}
    }
    c.restore();
  }
}
function update(dt){
  if(touchStick.pointer!==null){const length=Math.hypot(touchStick.x,touchStick.y);pointerActive=length>.12;if(pointerActive){const reach=24+140*Math.min(1,length);mouse={x:p.x+touchStick.x/length*reach,y:p.y+touchStick.y/length*reach};}}
  updateShieldAim(dt);world+=dt;recoil=Math.max(0,recoil-dt*2.4);discharge=Math.max(0,discharge-dt*4);parry=Math.max(0,parry-dt*3);music();t+=dt;inv-=dt;if(phase==='intro'){if(Math.floor(t*4)!==Math.floor((t-dt)*4))tone(45+t*35,.18,'sawtooth',.035);if(t>12)enter('attack');}else if(phase==='attack'){
const sequence=coreSequence();
if(sequence)updateCoreBeam(dt,sequence);else{
if(beamStarted&&!beamFinished){beamFinished=true;beamBlocking=false;status.textContent=shieldBroken?'SHIELD IMPLODED — SURVIVE THE REMAINING ATTACK':`${attackNumber()}/${names.length} · ${names[round]} · RELEASE: MOUSE MOVES WISP + SHIELD`;}
if(moving()&&pointerActive){
  const dx=mouse.x-p.x,dy=mouse.y-p.y,distance=Math.hypot(dx,dy);
  // Keep a small aiming gap so the shield has a stable direction at rest.
  const travel=Math.min(Math.max(0,distance-24),220*dt);
  if(distance>0){const bounds=arenaBounds();p.x=clamp(p.x+dx/distance*travel,bounds.x+5,bounds.x+bounds.w-5);p.y=clamp(p.y+dy/distance*travel,bounds.y+5,bounds.y+bounds.h-5);}
}

if(overdriveFinale()){updateOverdriveFinale(dt);}else if(chaosPhase()){updateChaosSlashes(dt);}else if(blackHoleRound()){
  holeTimer-=dt;if(holeTimer<=0){holeTimer+=BLACK_HOLE_CYCLE/BLACK_HOLE_SPEED*2.5*(round===28?.87:1);spawnBlackHole();}
  spawn-=dt;if(round!==28&&spawn<=0){
    spawn+=.85;
    // Aim bolts along the nearest hole's upcoming pass so one shield can catch both.
    const arrival=(400-30)/attackTuning().speed;
    const candidates=[...blackHoles];
    if(arrival>holeTimer)candidates.push({age:-holeTimer*BLACK_HOLE_SPEED,a:-Math.PI/2+volley*2.399,dir:-1});
    const future=candidates.filter(h=>h.age+arrival*BLACK_HOLE_SPEED<BLACK_HOLE_END).map(h=>{
      const {radial,side}=blackHoleOffset(h.age+arrival*BLACK_HOLE_SPEED);
      return {distance:Math.hypot(radial,side),angle:h.a+Math.atan2(side*h.dir,radial)};
    }).sort((a,b)=>a.distance-b.distance);
    fire(future[0]?.angle??-Math.PI/2);
  }
}else if(classicPattern()){
  const pattern=classicPattern();spawn-=dt;
  if(spawn<=0){
    spawn+=pattern.interval;
    const step=volley++,a=pattern.pattern===0?-Math.PI/2+(Math.floor(step/4)%4)*Math.PI/2:pattern.pattern===1?-Math.PI/2+Math.sin(step*.42)*1.35:pattern.pattern===2?-Math.PI/2+(step%8)*Math.PI/4:-Math.PI/2+Math.floor(step/3)*Math.PI/3;
    fire(a);
  }
}else if(round===6){
  spawn-=dt;if(spawn<=0){spawn+=.38;volley++;
    // Interleaved ribbons have no missing rows: weave between the moving strands.
    for(let row=0;row<7;row++){const y=370+row*68;
      for(const side of [-1,1])bullets.push({x:550+side*300,y,vx:-side*510,vy:0,baseY:y,weave:{phase:Math.random()*TAU,rate:1.8+Math.random()*2.6,amplitude:6+Math.random()*3,tiltPhase:Math.random()*TAU,tiltRate:1.4+Math.random()*2,curl:.012+Math.random()*.012,curlPhase:Math.random()*TAU},green:false,rainbow:true,beam:(volley+row)%2===0,hue:(row*39+volley*37)%360,trail:[]});
    }
  }
}else{
spawn-=dt;if(spawn<=0){
  spawn+=attackTuning().interval;
  const tempo=t*1.45,kind=round===FINAL_ROUND?Math.floor(t/3.75)%6:round%6;
  const a=kind===0?-Math.PI/2+(Math.floor(tempo*1.5)%4)*Math.PI/2:kind===1?Math.sin(tempo*2)*Math.PI:kind===2?tempo*1.8:kind===3?Math.floor(tempo*2)%8*Math.PI/4:kind===4?-Math.PI/2+Math.sin(tempo)*1.5:-tempo*2.1;
  fire(a);volley++;
  // Close fans demand precise aim while remaining catchable by one shield arc.
  if(volley%(round<5?3:2)===0||round===FINAL_ROUND)fire(a+.30);
  if(round>=12&&volley%3===0)fire(a-.30);
}
if(moving()){
  laserTimer-=dt;
  if(laserTimer<=0){laserTimer+=attackTuning().laserInterval;const warning=attackTuning().laserWarning;lasers.push({x:p.x,age:0,warning,life:attackTuning().laserLife,damage:attackTuning().damage,red:round===8});
    if(round===11)lasers.push({axis:'horizontal',y:p.y,age:0,warning:warning+.2,life:.48,damage:1});
    if(round>=14)lasers.push({x:clamp(p.x+(volley%2?160:-160),280,820),age:0,warning});
  }
}
}
}
if(t>=duration()){enter(attackNumber()%4===0?'heal':'counter');return;}
}else if(phase==='heal'){if(!healSent){fire(-Math.PI/2,true);healSent=true;}if(t>4.4)enter('counter');}else if(phase==='counter'&&t>3){if(hits<12){status.textContent=`CORE LOCK: ${12-hits} MORE F STRIKES`;t=2;}else{rankedClears++;hits=0;boss= Math.max(0,BOSS_MAX-attackNumber()*5);if(round===FINAL_ROUND)enter('ending');else{round=attackOrder[attackNumber()];enter('attack');}}}else if(phase==='ending')updateDestruction(dt);
updatePrismMist(dt);
if(phase==='attack')updateBlackHoles(dt);
for(const b of bullets){
if(b.launchDelay>0){b.launchDelay=Math.max(0,b.launchDelay-dt);continue;}
if(b.returnTimer>0){b.returnTimer=Math.max(0,b.returnTimer-dt);if(!b.returnTimer){const a=Math.atan2(p.y-b.y,p.x-b.x),speed=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;}}
if(b.yellow&&!b.turned&&Math.hypot(b.x-p.x,b.y-p.y)<115){
  b.turned=true;b.orbit={duration:b.orbitDuration||.26,x:p.x,y:p.y,r:Math.hypot(b.x-p.x,b.y-p.y),a:Math.atan2(b.y-p.y,b.x-p.x),age:0,speed:Math.hypot(b.vx,b.vy)};burst(b.x,b.y,'#ffed69',5);
}
const orbiting=!!b.orbit;
if(orbiting){
  const orbit=b.orbit;orbit.age=Math.min(orbit.duration,orbit.age+dt);const a=orbit.a+(b.orbitDirection||1)*Math.PI*orbit.age/orbit.duration;
  b.x=orbit.x+Math.cos(a)*orbit.r;b.y=orbit.y+Math.sin(a)*orbit.r;
  b.vx=-Math.sin(a)*(b.orbitDirection||1)*orbit.speed;b.vy=Math.cos(a)*(b.orbitDirection||1)*orbit.speed;
  if(orbit.age>=orbit.duration){const inward=Math.atan2(p.y-b.y,p.x-b.x);b.vx=Math.cos(inward)*orbit.speed;b.vy=Math.sin(inward)*orbit.speed;b.orbit=null;}
}
b.trail.push({x:b.x,y:b.y});if(b.trail.length>7)b.trail.shift();if(!orbiting){b.x+=b.vx*dt;b.y+=b.vy*dt;}if(round===13&&!b.green&&phase==='attack'){const a=dt*.95*1.25,cos=Math.cos(a),sin=Math.sin(a),dx=b.x-p.x,dy=b.y-p.y,vx=b.vx;b.x=p.x+dx*cos-dy*sin;b.y=p.y+dx*sin+dy*cos;b.vx=vx*cos-b.vy*sin;b.vy=vx*sin+b.vy*cos;}if(b.rainbow){b.y=prismY(b,b.x);emitPrismMist(b,dt);}const d=Math.hypot(b.x-p.x,b.y-p.y),diff=Math.atan2(Math.sin(Math.atan2(b.y-p.y,b.x-p.x)-angle()),Math.cos(Math.atan2(b.y-p.y,b.x-p.x)-angle()));if(!b.returnTimer&&shieldCovers(b.x-p.x,b.y-p.y)){
if(b.pink&&!b.blocks){b.blocks=1;b.returnTimer=.26;const a=Math.atan2(b.y-p.y,b.x-p.x),speed=Math.hypot(b.vx,b.vy);b.x=p.x+Math.cos(a)*48;b.y=p.y+Math.sin(a)*48;b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;}else b.dead=true;
blocked++;parry=.35;if(b.green)hp=Math.min(16,hp+2);burst(b.x,b.y,b.green?'#78ff85':'#67fff2',9);tone(b.green?660:420,.07,'triangle',b.green?.025:.012);}else if(d<(b.chaosShard?13:17)){b.dead=true;if(!b.green)hit(b.damage||1);}else if(b.beam&&prismTouches(b,p))hit();if(b.x< -500||b.x>1600||b.y< -500||b.y>1200)b.dead=true;}bullets=bullets.filter(b=>!b.dead);
for(const l of lasers){l.age+=dt;const distance=l.axis==='horizontal'?Math.abs(p.y-l.y):Math.abs(p.x-l.x);if(l.age>l.warning&&l.age<l.warning+(l.life||.48)&&distance<23)hit(l.damage||1);}lasers=lasers.filter(l=>l.age<l.warning+(l.life||.48)+.07);
if(['attack','heal','counter'].includes(phase)){wispTrail.push({x:p.x,y:p.y,life:.45});}for(const point of wispTrail)point.life-=dt;wispTrail=wispTrail.filter(point=>point.life>0);
for(const s of sparks){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;}sparks=sparks.filter(s=>s.life>0);
}
const overdrivePalette=new Map();
function overdriveInk(color){
  if(phase!=='attack'||round!==FINAL_ROUND||!/^#[0-9a-f]{6}$/i.test(color))return color;
  if(overdrivePalette.has(color))return overdrivePalette.get(color);
  const value=parseInt(color.slice(1),16),r=value>>16,g=value>>8&255,b=value&255;
  const ink=g>r*1.2&&b>r?`rgb(${Math.round(g*.97)} ${Math.round(g*.25+r*.3)} ${Math.min(255,Math.round(g*.7+b*.4))})`:color;
  overdrivePalette.set(color,ink);return ink;
}
function line(points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=overdriveInk(color);c.lineWidth=width;const glow=c.shadowBlur;if(width<=2)c.shadowBlur=0;c.stroke();c.shadowBlur=glow;}
function text(str,x,y,size=18,color='#b5fff0'){c.font=`${size}px monospace`;c.textAlign='center';c.fillStyle=color;c.fillText(str,x,y);}
function bossArt(){let assembly=phase==='intro'?clamp((t-2)/3,0,1):1;if(assembly===0)return; c.save();c.translate(550+Math.sin(world*65)*recoil*9,215-recoil*14);c.rotate(Math.sin(world*45)*recoil*.035);c.scale(assembly||.001,assembly||.001);if(phase==='ending')c.rotate(Math.sin(t*30)*t*.015);c.shadowBlur=14+recoil*18;c.shadowColor=recoil>0?'#ff93df':'#35efdf';
for(let side of [-1,1]){c.save();const arm=phase==='intro'?1-clamp((t-4)/3,0,1):0;c.translate(side*arm*420,-arm*160);c.rotate(side*(arm*.4+recoil*.09-Math.sin(world*4)*discharge*.025+parry*.018));// Suspended power trunks: traveling bends, swelling insulation, and electric packets.
for(let i=0;i<16;i++){
  const points=[];
  for(let j=0;j<=28;j++){
    const u=j/28, envelope=Math.sin(Math.PI*u), flow=world*3.4-u*11+i*.67;
    const x=side*(80+i*21)*(1-u)+side*(100+i*15)*u;
    points.push([x+side*Math.sin(u*Math.PI*2+i*.3)*25+Math.sin(flow)*envelope*(9+i%4*3),-260+(260+i*8)*u]);
  }
  c.lineCap='round';c.lineJoin='round';c.shadowBlur=0;
  line(points,'#04121f',13+i%3*3);line(points,i%3?'#164957':'#287a82',8+i%3*3);
  line(points,'#42b6b8',1.4);
  for(let packet=0;packet<2;packet++){
    const u=(world*(.38+i%3*.035)+i*.113+packet*.5)%1;
    const index=Math.floor(u*25), pulse=Math.sin(u*Math.PI);
    c.shadowColor='#5affec';c.shadowBlur=12;
    line(points.slice(index,index+4),`rgba(93,255,229,${.35+pulse*.6})`,5+pulse*4);
    line(points.slice(index,index+3),'#e3fff5',1.8);
    if(i%4===0){const q=points[index+1];line([[q[0],q[1]],[q[0]+side*12,q[1]+5],[q[0]+side*7,q[1]+13],[q[0]+side*19,q[1]+20]],'#8cdfff',1);}
  }
}
c.shadowBlur=12;

for(let j=0;j<26;j++){let x=side*(80+j*12),y=20+j*j*.21+Math.sin(world*2+j*.15)*9,w=27-j*.35;line([[x-w,y-30],[x+w,y-22],[x+w+side*18,y+28],[x-w,y+38],[x-w,y-30],[x+w+side*18,y+28],[x+w,y-22],[x-w,y+38]],j%3?'#237e8b':'#8bfff0',1.4);for(let k=0;k<5;k++){line([[x-w+k*7,y-25],[x+w-k*6,y+30]],'#245166');c.fillStyle=(j+k+Math.floor(world*8))%9===0?'#eefff8':'#286574';c.fillRect(x-w+k*8,y+8,3,3);}c.fillStyle='#061c2c';c.fillRect(x-6,y-13,12,22);line([[x-5,y-12],[x+5,y-12],[x+5,y+8]],'#51bcb6',1);}
// Broad skeletal palms and long jointed talons follow the reference drawing.
c.save();c.translate(side*383,155);c.scale(side,1);c.rotate(Math.sin(world*1.7)*.035-recoil*.12);
const palm=[[-38,-26],[5,-38],[43,-10],[49,35],[19,60],[-32,39],[-38,-26]];
c.beginPath();palm.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.fillStyle='#061b29';c.fill();
line(palm,'#81dbd3',3);
for(let layer=0;layer<6;layer++){
  const y=-22+layer*12;
  line([[-32,y],[25,y+10],[37,y+22],[-24,y+10],[-32,y]],layer%2?'#307b89':'#54b4b4',1.3);
  for(let rib=0;rib<5;rib++){const x=-28+rib*13;line([[x,y],[x+9,y+13],[x-4,y+23]],'#2e6979',1);}
}
for(let finger=0;finger<4;finger++){
  const x=-31+finger*23, length=[90,110,103,83][finger];
  const flex=Math.sin(world*2.1+finger*.7)*5+discharge*9;
  const contour=[[x-9,27],[x+8,24],[x+14+flex,63],[x+5+flex,length],[x-7,length+25],[x-14+flex,67],[x-9,27]];
  c.beginPath();contour.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.fillStyle='#082431';c.fill();
  line(contour,'#78ccc9',2.2);
  line([[x,31],[x+flex,63],[x-7,length+25]],'#cefef1',1.4);
  for(let joint=0;joint<4;joint++){const y=36+joint*15;line([[x-9+flex*.5,y],[x+7+flex,y+9],[x-7+flex*.5,y+17]],'#368b9c',1.4);}
  c.fillStyle='#b3fff1';c.fillRect(x-3,29,4,6);
}
c.restore();c.restore();}
// Four hanging conduits share their precise endpoints with the beam funnels.
for(let i=0;i<4;i++){
  const x=[-210,-57,57,210][i], y=Math.abs(x)>100?75:55;
  const laser=lasers.find(l=>Math.round(clamp((l.x-280)/540*3,0,3))===i);
  const active=laser&&laser.age>=laser.warning&&laser.age<laser.warning+.48;
  const charge=laser?clamp(laser.age/laser.warning,0,1):0;
  const settle=laser?clamp(laser.age/.22,0,1):0;
  const release=laser?1-clamp((laser.age-laser.warning-.48)/.07,0,1):0;
  const lock=settle*settle*(3-2*settle)*release;
  const frozenTime=laser?world-laser.age:world;
  const tilt=laser?Math.atan2(laser.x-550-x,175-y)*lock:0;
  const points=[];
  for(let j=0;j<=18;j++){
    const u=j/18, length=(150-y)*u;
    // Freeze the broad sway during charging, then shake around the aimed pose.
    const sway=(Math.sin(world*2.8-u*3+i)*(1-lock)+Math.sin(frozenTime*2.8-u*3+i)*lock)*14*u*(1-lock*.8);
    const shake=active?Math.sin(world*96-j*1.9+i)*3.5*u:0;
    points.push([x+Math.sin(tilt)*length+Math.cos(tilt)*(sway+shake),
      y+Math.cos(tilt)*length-Math.sin(tilt)*(sway+shake)]);
  }
  const nozzle=points.at(-1);
  c.shadowColor=active?'#b9ffff':'#70ffee';c.shadowBlur=active?30:5+charge*16;
  line(points,'#071e2b',12);line(points,active?'#65e7ef':'#327e8d',active?10:8);
  line(points,active?'#f3ffff':'#85dacf',active?3.5:2);
  if(active){
    for(let arc=0;arc<4;arc++){
      const index=3+arc*4, q=points[index], end=points[Math.min(18,index+3)];
      const sign=arc%2?1:-1, crackle=8+Math.sin(world*113+arc*7)*5;
      line([q,[q[0]+sign*crackle,q[1]+3],[q[0]-sign*4,q[1]+8],
        [end[0]+sign*crackle,end[1]-4],end],arc%2?'#d9aaff':'#c8ffff',1.7);
    }
  }
  const packet=Math.floor((world*1.5+i*.23)%1*15);line(points.slice(packet,packet+4),active?'#fff4ff':'#b2fff1',4);
  for(let collar=3;collar<18;collar+=4){const q=points[collar];line([[q[0]-5,q[1]],[q[0]+5,q[1]+2]],'#a0d8d3',2);}
  if(laser&&laser.age<laser.warning+.48){
    const target=laser.x-550, endY=175;
    if(active){
      // Widen continuously from the wire's mouth into the full 36px hazard lane.
      for(const [scale,color] of [[1.5,'#b269ff44'],[1,'#79eaffbb'],[.48,'#fff5ff']]){
        c.fillStyle=color;c.beginPath();c.moveTo(nozzle[0]-4*scale,nozzle[1]);
        c.bezierCurveTo(nozzle[0]-8*scale,nozzle[1]+13,target-18*scale,endY-10,target-18*scale,endY);
        c.lineTo(target+18*scale,endY);
        c.bezierCurveTo(target+18*scale,endY-10,nozzle[0]+8*scale,nozzle[1]+13,nozzle[0]+4*scale,nozzle[1]);c.closePath();c.fill();
      }
    }else{c.setLineDash([3,6]);line([nozzle,[target,endY]],'#e59bc799',1);c.setLineDash([]);}
    c.strokeStyle=active?'#ffffff':'#d89cff';c.lineWidth=2;c.beginPath();c.ellipse(nozzle[0],nozzle[1],5+charge*5,3+charge*2,-tilt,0,TAU);c.stroke();
  }
  c.fillStyle=active?'white':`rgb(${100+charge*150} 240 230)`;c.beginPath();c.ellipse(nozzle[0],nozzle[1],5,3,-tilt,0,TAU);c.fill();
}

if(recoil>0){c.save();c.globalAlpha=recoil;c.strokeStyle='#ffa8e8';c.lineWidth=2;c.beginPath();c.arc(0,0,65+(1-recoil)*140,0,TAU);c.stroke();for(let i=0;i<8;i++){let a=i*TAU/8+world;line([[Math.cos(a)*70,Math.sin(a)*70],[Math.cos(a)*(85+recoil*45),Math.sin(a)*(85+recoil*45)]],'#fff0fb',2);}c.restore();}
if(discharge>0||parry>0){c.save();c.globalAlpha=Math.max(discharge,parry)*.7;for(let side of [-1,1])line([[side*60,15],[side*120,8],[side*150,45],[side*210,44],[side*255,90],[side*350,140]],parry>0?'#b5ff9a':'#e8fcff',2);c.restore();}
const head=coreSequence();c.save();if(head){line([[-95,0],[head.x-550,head.y-215],[95,0]],'#5daab7',5);c.translate(head.x-550,head.y-215);c.rotate(-head.tilt);}
c.save();c.rotate(world*.18+recoil*.5);for(let ring=0;ring<3;ring++){c.strokeStyle=['#276779','#4198a7','#72ddca'][ring];c.lineWidth=ring===0?3:1;c.setLineDash([12,8,2,8]);c.beginPath();c.ellipse(0,0,82+ring*15,65+ring*12,ring*.7,0,TAU);c.stroke();}c.setLineDash([]);c.restore();
let vertices=[];for(let i=0;i<16;i++){let v=[i&1?1:-1,i&2?1:-1,i&4?1:-1,i&8?1:-1],a=world*.65,b=world*.43;let x=v[0]*Math.cos(a)-v[3]*Math.sin(a),w=v[0]*Math.sin(a)+v[3]*Math.cos(a),y=v[1]*Math.cos(b)-v[2]*Math.sin(b),z=v[1]*Math.sin(b)+v[2]*Math.cos(b),q=75/(2.6-w*.4-z*.2);vertices.push([x*q,y*q]);}for(let i=0;i<16;i++)for(let bit=1;bit<=8;bit*=2)if(!(i&bit))line([vertices[i],vertices[i|bit]],'#8bfff2',2);c.fillStyle='white';c.shadowBlur=35;c.beginPath();c.arc(0,0,9+Math.sin(world*7)*3,0,TAU);c.fill();c.restore();c.restore();}
function drawBlackHoles(){
  for(const h of blackHoles){
    const implode=h.imploding?clamp(1-(h.age-BLACK_HOLE_END)/.45,0,1):1;
    c.save();line(h.trail.map(q=>[q.x,q.y]),'#695188',2);c.translate(h.x,h.y);c.scale(implode,implode);
    // A pitch-black event horizon occludes the far half of a hot accretion disk.
    const halo=c.createRadialGradient(0,0,14,0,0,43);
    halo.addColorStop(0,'#ffdca788');halo.addColorStop(.35,'#b473d044');halo.addColorStop(1,'#341c6000');
    c.fillStyle=halo;c.fillRect(-43,-43,86,86);c.rotate(h.dir*.24);
    c.shadowColor='#ffb46b';c.shadowBlur=10;
    for(let ring=0;ring<4;ring++){
      c.strokeStyle=['#643a83','#b779aa','#ffc780','#fff0ca'][ring];c.lineWidth=3-ring*.4;
      c.beginPath();c.ellipse(0,0,33-ring*3,8+ring*.7,0,0,TAU);c.stroke();
    }
    c.shadowBlur=0;c.fillStyle='#000';c.beginPath();c.arc(0,0,15,0,TAU);c.fill();
    // Lensed light bends over the silhouette; the center stays completely dark.
    c.strokeStyle='#ffe4b3';c.lineWidth=1.5;c.beginPath();c.arc(0,0,16,Math.PI,TAU);c.stroke();
    c.strokeStyle='#dd9bdf';c.lineWidth=1;c.beginPath();c.arc(0,0,17.5,0,Math.PI);c.stroke();
    c.strokeStyle='#ffce97';c.lineWidth=2.5;c.beginPath();c.ellipse(0,2,31,7,0,0,Math.PI);c.stroke();
    for(let i=0;i<12;i++){
      const a=world*h.dir*4+i*TAU/12,x=Math.cos(a)*29,y=Math.sin(a)*8;
      if(y<0&&Math.abs(x)<16)continue;
      c.fillStyle=i%3?'#ffb477':'#fff4d8';c.fillRect(x-1,y-1,2,1.5);
    }
    c.restore();
  }
}
function drawDestruction(){
  const age=t-2;
  if(phase==='ending'){
    if(age>=0){
      c.save();c.globalCompositeOperation='lighter';
      for(const part of debris){c.save();c.translate(part.x,part.y);c.rotate(part.angle);c.globalAlpha=clamp((12-t)/3,0,1);c.shadowColor=part.color;c.shadowBlur=8;
        const r=part.size;line(part.wire?[[-r*2,0],[-r,-3],[0,3],[r,0]]:[[-r,-r*.5],[r,-r*.3],[r*.7,r*.6],[-r*.6,r],[-r,-r*.5],[r*.7,r*.6]],part.color,part.wire?3:2);c.restore();}
      c.strokeStyle='#b4ffef';c.lineWidth=4;c.globalAlpha=Math.max(0,1-age/2);c.beginPath();c.arc(550,215,age*520,0,TAU);c.stroke();
      c.globalAlpha=Math.max(0,1-age/.35)*.65;c.fillStyle='#c5fff5';c.fillRect(0,0,1100,740);c.restore();
    }else{c.save();c.strokeStyle='#ff9be5';for(let i=0;i<12;i++){const a=i*TAU/12+t*2;line([[550+Math.cos(a)*40,215+Math.sin(a)*40],[550+Math.cos(a)*(80+t*90),215+Math.sin(a)*(80+t*90)]],'#ff9be5',2);}c.restore();}
    c.fillStyle='#010610';c.fillRect(0,0,1100,65);c.fillRect(0,675,1100,65);
  }
  if(t>8||phase==='win'){const y=phase==='win'?360:515-(t-8)*38;c.save();c.shadowBlur=35;c.shadowColor='#bfaaff';c.fillStyle='#efffff';c.beginPath();c.arc(550,y,9,0,TAU);c.fill();c.restore();}
}
function drawCoreBeam(){
  const sequence=coreSequence();if(!sequence)return;
  if(sequence.warning){
    c.save();c.globalCompositeOperation='lighter';
    for(let i=0;i<110;i++){
      const f=(i/110+sequence.progress*.55)%1,a=i*2.399+sequence.progress*.6,r=35+(1-f)*340;
      const x=sequence.x+Math.cos(a)*r,y=sequence.y+Math.sin(a)*r*.65;
      c.globalAlpha=.2+f*.7;c.fillStyle=i%3?'#bd98ff':'#8bfff1';c.beginPath();c.arc(x,y,1+f*2,0,TAU);c.fill();
      line([[x,y],[x+Math.cos(a)*12,y+Math.sin(a)*8]],'#976fe6',1);
    }
    c.globalAlpha=1;c.strokeStyle='#debaff';c.lineWidth=2;c.beginPath();c.arc(sequence.x,sequence.y,95-sequence.progress*30,0,TAU);c.stroke();c.restore();
    text('GALACTIC DUST // CORE RUPTURE',550,350,22,'#e4bdff');
    text('AIM INTO THE BEAM · TAP F REPEATEDLY TO HOLD YOUR SHIELD',550,380,13,'#eddaff');return;
  }
  const g=beamGeometry(sequence),stopped=beamBlocking&&!shieldBroken,length=stopped?g.along-32:850;
  c.save();c.translate(sequence.x,sequence.y);c.rotate(-sequence.tilt);c.globalCompositeOperation='lighter';
  c.shadowColor='#a75cff';c.shadowBlur=28;
  const tip=stopped?g.across:0;
  for(const [width,color] of [[112,'#7939d655'],[83,'#a85bff99'],[48,'#73dfffbb'],[22,'#edffff']]){
    c.fillStyle=color;c.beginPath();c.moveTo(-width*.65,0);c.lineTo(width*.65,0);
    if(stopped){c.lineTo(width,length-65);c.quadraticCurveTo(width,length-20,tip+15,length);c.lineTo(tip-15,length);c.quadraticCurveTo(-width,length-20,-width,length-65);}
    else{c.lineTo(width,length);c.lineTo(-width,length);}
    c.closePath();c.fill();
  }
  for(let i=0;i<16;i++){let y=(world*650+i*57)%Math.max(1,length),x=Math.sin(world*18+i*3)*28;line([[x,y],[x+Math.sin(i+world*27)*14,y+15],[x-4,Math.min(length,y+32)]],'#e0bfff',1.5);}
  if(stopped){c.shadowBlur=35;c.strokeStyle='#f1ffff';c.lineWidth=4;c.beginPath();c.ellipse(tip,length,26,8,0,0,TAU);c.stroke();}
  c.restore();
}
function pressF(){
  if(paused)return;
  if(phase==='attack'){braceShield();return;}
  if(phase==='counter'&&hits<12){hits++;recoil=1;boss=Math.max(0,BOSS_MAX-(attackNumber()-1)*5-Math.min(hits,12)*5/12);playEffect('crush');burst(550,215,'#eeffff',12);}
}
function draw(){c.fillStyle='#030815';c.fillRect(0,0,1100,740);for(let i=0;i<65;i++){let x=(i*173.7)%1100,y=(i*79+world*(8+i%9))%740;c.fillStyle=i%3?'#143644':'#336f78';c.fillRect(x,y,2,2);}let g=c.createRadialGradient(550,230,10,550,230,480);g.addColorStop(0,'#12475480');g.addColorStop(1,'#03081500');c.fillStyle=g;c.fillRect(0,0,1100,740);// Perspective floor and distant machinery give the boss a physical scale.
for(let i=0;i<15;i++)line([[550+(i-7)*35,380],[550+(i-7)*180,740]],'#102331');
for(let i=0;i<8;i++){let y=390+((i*48+world*12)%350);line([[0,y],[1100,y]],'#102331');}
if(phase!=='win'&&(phase!=='ending'||t<2))bossArt();drawOverdriveAtmosphere();drawCoreBeam();if(phase==='ending'||phase==='win')drawDestruction();
if(phase==='intro'){c.fillStyle='#01040be8';c.fillRect(0,0,1100,95);c.fillRect(0,625,1100,115);text('CONTAINMENT RECORD // ENTITY 0x14',550,650,14);const progress=clamp(t/12,0,1);c.fillStyle='#4ce6ce';c.fillRect(300,675,500*progress,2);if(t>7&&t<9){c.strokeStyle='#8bfff0';c.lineWidth=2;c.beginPath();c.arc(550,215,(t-7)*500,0,TAU);c.stroke();}for(let i=0;i<9;i++)text(['LINK ESTABLISHED','ARMATURE ONLINE','DIMENSION BREACH'][i%3],100,130+i*32,9,t>i?'#3a9b99':'#163039');}

if(['attack','heal','counter'].includes(phase)){c.strokeStyle=moving()?'#426379':'#20344a';const bounds=arenaBounds();c.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h);if(round===6)text('PRISM CROSSCURRENT · WEAVE BETWEEN BOTH SIDES',550,395,13,'#d7a8ff');if(!moving()){c.setLineDash([3,8]);c.beginPath();c.arc(p.x,p.y,64,0,TAU);c.stroke();c.setLineDash([]);}for(let l of lasers){const warning=l.age<l.warning;c.fillStyle=warning?'#ff557733':l.red?'#ff3155':'#fff0f8';if(l.axis==='horizontal'){c.fillRect(275,l.y-(warning?1:18),550,warning?2:36);text(warning?'!':'',255,l.y+7,22,'#ff6688');}else{c.fillRect(l.x-(warning?1:18),390,warning?2:36,270);text(warning?'!':'',l.x,380,22,'#ff6688');}}drawBlackHoles();drawPrismMist();drawChaosSlashes();drawOverdriveFinale();for(let b of bullets){
const color=b.rainbow?`hsl(${b.hue} 100% 72%)`:b.green?'#7aff9d':b.red?'#ff3c62':b.yellow?'#ffe85a':'#6de9ff';
if(!b.rainbow&&(b.x<15||b.x>1085||b.y<15||b.y>725)){
  // Offscreen launches announce their direction before fast lower bolts enter view.
  const ingress=Math.atan2(b.y-p.y,b.x-p.x);c.save();c.translate(p.x+Math.cos(ingress)*125,p.y+Math.sin(ingress)*125);c.rotate(ingress);
  c.globalAlpha=.6+.25*Math.sin(world*12);c.shadowColor=color;c.shadowBlur=8;line([[9,-7],[-2,0],[9,7]],b.pink?'#ff65c4':color,2);line([[16,-7],[5,0],[16,7]],color,1);c.restore();
}
if(b.chaosShard){c.save();line(b.trail.map(q=>[q.x,q.y]),'#de7aff88',1.2);c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));c.fillStyle='#fff1ff';c.shadowColor='#ed76ff';c.shadowBlur=9;c.beginPath();c.moveTo(5,0);c.lineTo(-3,-2.5);c.lineTo(-1,0);c.lineTo(-3,2.5);c.closePath();c.fill();c.restore();continue;}
if(b.rainbow){c.save();c.shadowColor=color;c.shadowBlur=17;const ribbon=prismPath(b);line(ribbon,color,b.beam?7:4);line(ribbon,'#fff7ff',b.beam?2:1);c.fillStyle='#fff';c.beginPath();c.arc(b.x,b.y,b.beam?4:6,0,TAU);c.fill();c.restore();continue;}

if(b.orbit){c.save();c.strokeStyle='#ffe85a66';c.lineWidth=2;c.setLineDash([4,7]);c.beginPath();c.arc(b.orbit.x,b.orbit.y,b.orbit.r,b.orbit.a,b.orbit.a+(b.orbitDirection||1)*Math.PI,(b.orbitDirection||1)<0);c.stroke();c.restore();}
c.save();if(b.launchDelay>0)c.globalAlpha=.45;c.shadowColor=color;c.shadowBlur=13;
line(b.trail.map((v,i)=>[v.x+Math.sin(world*43+i*2)*i*.55,v.y+Math.cos(world*37+i)*i*.55]),b.green?'#34996b':b.red?'#af2446':'#287ba5',2);
c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));if(b.pink)c.scale(1.4,1.4);
const jitter=Math.sin(world*53+b.x*.07)*3;
const bolt=[[-17,0],[-9,-4-jitter],[-4,3],[1,-5+jitter],[5,1],[12,0]];
if(b.pink){c.shadowColor='#ff67c8';line(bolt,'#ff65c4',9);c.strokeStyle='#ff9cdd';c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,20,13,0,0,TAU);c.stroke();}line(bolt,color,5);line(bolt,'#edffff',1.6);
for(let i=0;i<3;i++){const flip=i%2?1:-1;line([[-7+i*6,0],[-10+i*5,flip*(7+Math.sin(world*35+i)*3)],[-18+i*5,flip*6]],color,1);}
c.globalAlpha=.5+.25*Math.sin(world*21);c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.ellipse(0,0,11,8,world*8,0,TAU);c.stroke();c.globalAlpha=1;c.fillStyle='#fff';c.beginPath();c.arc(5,0,2.5,0,TAU);c.fill();c.restore();
}
c.save();if(coreSequence()&&!coreSequence().warning){c.fillStyle='#071020';c.beginPath();c.arc(p.x,p.y,16,0,TAU);c.fill();}c.globalCompositeOperation='lighter';
for(let i=0;i<wispTrail.length;i++){const point=wispTrail[i];c.globalAlpha=point.life*.4;c.fillStyle='#8860ff';c.beginPath();c.arc(point.x+Math.sin(world*7+i*.5)*3,point.y,3+point.life*13,0,TAU);c.fill();}
c.translate(p.x,p.y);c.globalAlpha=inv>0?.4+.25*Math.sin(world*40):1;
const aura=c.createRadialGradient(0,0,2,0,0,23);aura.addColorStop(0,'#f2ecff');aura.addColorStop(.25,'#9eaeffbb');aura.addColorStop(.6,'#6f45de55');aura.addColorStop(1,'#532caa00');c.fillStyle=aura;c.fillRect(-24,-24,48,48);
for(let strand=0;strand<3;strand++){
  c.save();c.rotate(world*(strand%2?-.6:.8)+strand*TAU/3);c.strokeStyle=['#c2b1ff','#68dcff','#e8afff'][strand];c.lineWidth=1.3;c.beginPath();c.moveTo(-3,-8);c.bezierCurveTo(-17,-7,-17,14,-4+Math.sin(world*4+strand)*4,23);c.bezierCurveTo(-10,10,10,5,5,-4);c.stroke();c.restore();
}
c.shadowColor='#bba0ff';c.shadowBlur=12;c.fillStyle='#f8f5ff';c.beginPath();c.moveTo(0,-10);c.quadraticCurveTo(3,-2,7,0);c.quadraticCurveTo(2,3,0,10);c.quadraticCurveTo(-3,2,-7,0);c.quadraticCurveTo(-2,-3,0,-10);c.fill();
for(let star=0;star<4;star++){let orbit=world*(star%2?-.9:1.2)+star*TAU/4;c.fillStyle=star%2?'#94ddff':'#dec8ff';c.fillRect(Math.cos(orbit)*18-1,Math.sin(orbit)*12-1,2,2);}
c.globalCompositeOperation='source-over';if(!shieldBroken&&!shieldDisabled()){const shield=shieldProfile();c.strokeStyle=shieldIntegrity<30?'#ff83cc':'#91fff0';c.lineWidth=6*shield.scale;c.shadowColor='#50ffe2';c.shadowBlur=18;for(let side=0;side<(shield.dual?2:1);side++){c.beginPath();c.arc(0,0,shield.radius,angle()+side*Math.PI-shield.arc,angle()+side*Math.PI+shield.arc);c.stroke();}}c.restore();}
for(let s of sparks){c.globalAlpha=Math.min(1,s.life);c.fillStyle=s.color;c.fillRect(s.x,s.y,3,3);}c.globalAlpha=1;text('EXTRADIMENSIONAL CONTAINMENT ENGINE',550,32,12,'#63a9b7');text(names[round],550, sixty(),20);c.fillStyle='#172c40';c.fillRect(350,78,400,4);c.fillStyle='#66f5df';c.fillRect(350,78,boss/BOSS_MAX*400,4);text(`HP ${hp} / 16`,110,700,20,hp<4?'#ff6688':'#80ffba');text(`ATTACK ${attackNumber()} / ${names.length}`,950,700,18);if(phase==='attack'){c.fillStyle='#85f5e4';c.fillRect(280,673,540*(1-t/duration()),3);const core=coreSequence();
if(core&&!core.warning){c.fillStyle='#030815e8';c.fillRect(330,610,440,48);c.fillRect(240,695,620,35);}
text(overdriveFinale()?(t>=56.3?'RAINBOW X — DODGE BETWEEN THE DIAGONALS · 6 DAMAGE':'REALITY FRACTURE — CIRCLE THE CENTER'):round===8?'RELEASE / RAIN — SHIELD OFF · MOUSE TO DODGE':chaosPhase()?'CHAOS SLICER — DODGE THE MARKED LANES':shieldBroken?'SHIELD IMPLODED — SURVIVE WITHOUT IT':core?(core.warning?'CORE CHARGING — AIM UP':'HOLD THE BEAM · SPAM F · FOLLOW THE TILT'):moving()?'RELEASED — MOUSE GUIDES WISP + SHIELD':'ANCHORED — AIM YOUR SHIELD',550,715,14,shieldBroken?'#ff83cc':'#b5fff0');
if(core&&!core.warning){c.fillStyle='#261c38';c.fillRect(400,640,300,12);c.fillStyle=shieldIntegrity<30?'#ff83cc':'#91fff0';c.fillRect(400,640,3*shieldIntegrity,12);text(`SHIELD ${Math.ceil(shieldIntegrity)}%${round===FINAL_ROUND?' · OVERDRIVE ×1.30':''}`,550,632,14);}}
const labels={ready:['THE MACHINE HAS FOUND YOU','Galactic wisp · Mouse aims shield and guides RELEASE movement.'],intro:[t<2?'INCOMING / UNKNOWN SIGNAL':t<4?'BREACHING DIMENSIONAL SEAL':t<7?'ARMATURES / CONNECTED':t<9?'CORE / AWAKENING':'TEARESSERACT',t<9?'ASSEMBLING IMPOSSIBILITY':'CONTAINMENT IS NOT OPTIONAL'],counter:['CORE EXPOSED — SPAM F',hits===12?'12 / 12 — CORE FRACTURED':`${hits} / 12 STRIKES · ${Math.max(0,3-t).toFixed(1)}s`],heal:['GREEN SIGNAL — CATCH WITH SHIELD','RECOVERY PACKET +2 HP'],dead:['CONNECTION SEVERED',`${blocked} projectiles blocked · Press CONNECT to retry`],ending:[t<2?'SYSTEM OVERDRIVE':t<5?'CORE DISINTEGRATION':t<9?'ALL STRUCTURES / DESTROYED':'YOU ARE FREE',''],win:['IMPOSSIBLE / OVERCOME',`${blocked} projectiles blocked · ${hp} HP remaining`]};if(labels[phase]){c.fillStyle='#020914d9';c.fillRect(200,440,700,110);text(labels[phase][0],550,480,27);text(labels[phase][1],550,519,14);}if(paused){c.fillStyle='#000b';c.fillRect(0,0,1100,740);text('PAUSED',550,370,35);}}
function sixty(){return 61;}
canvas.addEventListener('pointermove',e=>{if(touchStick.pointer!==null)return;pointerActive=true;let r=canvas.getBoundingClientRect();mouse={x:(e.clientX-r.left)*1100/r.width,y:(e.clientY-r.top)*740/r.height};});
document.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.length===1?e.key.toLowerCase():e.key);if(e.key==='Escape'&&!e.repeat)togglePause();if(e.key.toLowerCase()==='f'&&!e.repeat)pressF();});document.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));function togglePause(){if(phase==='loading')return;autoPaused=false;paused=!paused;syncEffects();document.querySelector('#pause').textContent=paused?'RESUME':'PAUSE';keys.clear();}document.querySelector('#pause').onclick=togglePause;document.querySelector('#start').onclick=()=>start();document.querySelector('#mute').onclick=()=>{muted=!muted;syncEffects();document.querySelector('#mute').textContent=muted?'SOUND OFF':'SOUND ON';};document.addEventListener('visibilitychange',restoreVisibility);window.addEventListener('pageshow',restoreVisibility);window.addEventListener('blur',()=>keys.clear());
const touchPad=document.querySelector('#tea-stick'),touchShot=document.querySelector('#tea-fire');
function resetTouchControls(){touchStick={pointer:null,x:0,y:0};touchFire=null;pointerActive=false;touchPad.style?.removeProperty('--stick-x');touchPad.style?.removeProperty('--stick-y');}
function moveTouchStick(event){
  if(event.pointerId!==touchStick.pointer)return;event.preventDefault();
  const r=touchPad.getBoundingClientRect(),dx=(event.clientX-r.left-r.width/2)/(r.width*.32),dy=(event.clientY-r.top-r.height/2)/(r.height*.32),length=Math.max(1,Math.hypot(dx,dy));
  touchStick.x=dx/length;touchStick.y=dy/length;
  touchPad.style.setProperty('--stick-x',`${touchStick.x*r.width*.32}px`);touchPad.style.setProperty('--stick-y',`${touchStick.y*r.height*.32}px`);
}
touchPad.addEventListener('pointerdown',event=>{if(touchStick.pointer!==null||event.button!==0)return;event.preventDefault();touchStick.pointer=event.pointerId;touchPad.setPointerCapture(event.pointerId);moveTouchStick(event);});
touchPad.addEventListener('pointermove',moveTouchStick);
for(const type of ['pointerup','pointercancel','lostpointercapture'])touchPad.addEventListener(type,event=>{if(event.pointerId===touchStick.pointer)resetTouchControls();});
touchShot.addEventListener('pointerdown',event=>{if(touchFire!==null||event.button!==0)return;event.preventDefault();touchFire=event.pointerId;touchShot.setPointerCapture(event.pointerId);pressF();});
for(const type of ['pointerup','pointercancel','lostpointercapture'])touchShot.addEventListener(type,event=>{if(event.pointerId===touchFire)touchFire=null;});
touchShot.addEventListener('click',event=>{if(event.detail===0)pressF();});
window.addEventListener('blur',resetTouchControls);
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetTouchControls();});
// Resume only lifecycle pauses; an explicit PAUSE remains paused after switching apps.
let autoPaused=false;
function restoreVisibility(){
  keys.clear();last=performance.now();
  if(document.hidden){if(!paused){autoPaused=true;paused=true;}}
  else{
    if(autoPaused){autoPaused=false;paused=false;}
    if(audio)audio.resume().catch(()=>{});
    if(songTrack&&!paused)songMedia.get(songTrack)?.play().catch(()=>{});
    cancelAnimationFrame(frame);frame=requestAnimationFrame(loop);
  }
  syncEffects();music();document.querySelector('#pause').textContent=paused?'RESUME':'PAUSE';
}
function loop(now){
  // An audio failure must not cancel all future animation frames.
  frame=requestAnimationFrame(loop);
  let dt=Math.max(0,Math.min(phase==='intro'?1:.1,(now-last)/1000||0));last=now;
  if(!paused){let remaining=dt;while(remaining>0){const tick=Math.min(remaining,1/120);update(tick);remaining-=tick;}}else music();
  if(phase==='loading')loadingProgress();else draw();
}
frame=requestAnimationFrame(loop);
previewMusic();
})();
