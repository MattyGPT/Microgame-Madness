"use strict";
// Procedural scores and physically inspired synthesis: no external recordings.
// Regent includes the brief SAVE the World motif credited below.
const BossAudio=(()=>{
  const profiles=[
    ['Signal / Sentinel',92,38,'metal',[0,7,3,10,7,12,10,3]],
    ['Heart of the Furnace',76,33,'impact',[0,0,7,3,0,10,7,2]],
    ['Impossible Geometry',110,42,'glass',[0,6,7,13,12,6,3,7]],
    ['Crown Beneath the Ice',68,45,'ice',[12,7,3,0,10,7,15,12]],
    ['The Rose Remembers',84,41,'organic',[0,3,7,10,8,7,3,2]],
    ['Orchestra of Voltage',138,40,'electric',[0,12,7,15,12,7,3,10]],
    ['Iron Through Ash',102,31,'engine',[0,0,3,0,7,5,3,2]],
    ['Doors of the Pale Moon',78,46,'bell',[0,7,12,10,5,7,3,2]],
    ['A Reflection Ahead',118,43,'glass',[0,3,6,10,12,6,3,1]],
    ['Containment Zero',126,30,'engine',[0,7,0,6,12,10,7,3]],
    ['Cathedral Underwater',72,38,'water',[0,5,7,12,10,7,5,3]],
    ['The Borrowed Second',96,40,'clock',[0,7,3,7,2,7,10,12]],
    ['The Mountain Is Alive',88,36,'wood',[0,5,3,7,12,10,7,5]],
    ['Black Glass Heart',82,32,'stone',[0,1,7,3,0,8,7,1]],
    ['Atlas of Falling Stars',90,45,'glass',[0,7,14,12,10,7,3,5]],
    ['No Final Lap',150,39,'engine',[0,7,12,7,10,3,7,14]],
    ['All the Drowned Words',66,35,'water',[0,3,10,7,5,3,2,0]],
    ['A Kingdom of Light',104,43,'sand',[0,1,4,7,8,7,4,1]],
    ['The Note That Remains',62,34,'voice',[0,7,1,8,3,10,7,0]],
    ['Nineteen Worlds / Crownfall Symphony',112,38,'royal',[0,7,12,15,14,12,10,7]],
  ].map(([title,bpm,root,material,motif],i)=>({level:i+1,title,bpm,root,material,motif}));
  // Each score has its own tempo, meter, groove, lead timbre and harmonic route.
  const arrangements=[
    [144,16,[0,3,8,10],[4,12],'pulse',[0,-1,-3,-5]],
    [132,12,[0,5,6,10],[3,9],'brass',[0,-5,-1,-3]],
    [158,14,[0,3,7,10],[4,11],'pluck',[0,6,-1,3]],
    [146,16,[0,6,8,14],[4,12],'blade',[0,-3,1,-5]],
    [150,12,[0,2,6,8],[3,9],'strings',[0,-3,-5,1]],
    [178,16,[0,3,6,8,11,14],[4,12],'pulse',[0,6,3,-1]],
    [148,16,[0,2,8,9,14],[4,12],'brass',[0,-1,0,-5]],
    [142,14,[0,6,7,12],[3,10],'bell',[0,1,-5,-3]],
    [166,16,[0,5,8,11,14],[4,12],'pluck',[0,3,6,1]],
    [172,16,[0,2,6,8,10,15],[4,12],'blade',[0,-1,6,-5]],
    [148,12,[0,4,6,11],[3,9],'brass',[0,-5,-3,-1]],
    [160,16,[0,4,8,12],[6,14],'pluck',[0,3,-1,6]],
    [152,12,[0,2,5,6,8],[3,9],'strings',[0,-5,1,-3]],
    [156,16,[0,1,6,8,10],[4,12],'blade',[0,1,-5,6]],
    [168,14,[0,2,7,9,12],[4,11],'bell',[0,6,-3,1]],
    [188,16,[0,4,8,12],[4,12],'pulse',[0,-3,1,-1]],
    [154,12,[0,4,6,7,10],[3,9],'pluck',[0,-1,-5,3]],
    [174,16,[0,3,7,8,11],[4,12],'brass',[0,1,4,-1]],
    [162,14,[0,1,7,8,12],[4,11],'blade',[0,1,6,-1]],
    [196,16,[0,2,3,8,10,14],[4,12],'brass',[0,-1,6,-3]],
  ];
  profiles.forEach((p,i)=>{const [bpm,steps,kick,snare,lead,harmony]=arrangements[i];Object.assign(p,{bpm,steps,kick,snare,lead,harmony});});
  const regentMovements=[
    {name:'The Obsidian Crown',mode:'minor',roots:[38,34,41,33],chord:[0,3,7,10],motif:[0,7,12,15,14,7,10,13]},
    {name:'Nineteen Broken Worlds',mode:'phrygian',roots:[38,39,34,33],chord:[0,3,7,13],motif:[0,1,7,12,13,7,6,1]},
    {name:'A Crown of Dawn',mode:'major',roots:[38,45,47,43],chord:[0,4,7,11],motif:[0,4,7,12,16,14,12,7]},
    {name:'Wings Above the World',mode:'lydian',roots:[43,45,38,45],chord:[0,4,7,14],motif:[12,16,18,19,23,19,18,16]},
    {name:'The Throne Descends',mode:'minor',roots:[38,37,34,33],chord:[0,3,7,10],motif:[0,12,1,13,7,19,6,18]},
    {name:'The Unbroken Oath',mode:'dorian',roots:[38,43,45,38],chord:[0,3,7,9],motif:[0,3,7,9,12,15,14,9]},
    {name:'Beyond Infinity',mode:'major',roots:[38,45,43,38],chord:[0,4,7,12],motif:[12,16,19,24,23,19,16,14]},
    {name:'The Last Coronation',mode:'suspended',roots:[38,41,43,33],chord:[0,5,7,14],motif:[0,7,12,17,19,14,12,7]},
  ];
  // Brief four-bar SAVE the World motif (Toby Fox), transposed down six semitones.
  // Pitch/rhythm reference: Kris Dreemur transcription, https://www.vgmusic.com/file/fafa588f8504aad4fdacae905c9868b0.html
  const saveWorldMotif=Object.freeze([[0,60],[8,72],[16,67],[32,65],[40,72],[44,74],[46,72],[50,69],[54,67],[58,69],[59,67],[60,65]].map(Object.freeze));
  function regentArrangement(n,intro=false){
    const position=(n%(64*16))/(16),guitar=!intro&&position>=32&&position<48;
    const fade=guitar?Math.min(1,(position-32)*2+.15,(48-position)/2):0;
    return {position,guitar,guitarGain:Math.max(0,fade),groove:guitar&&position>=40,heavy:!intro&&position>=48,endSteps:48*16-n%(64*16)};
  }
  const hz=n=>440*2**((n-69)/12),TAU=Math.PI*2;
  function random(seed){let n=seed>>>0;return()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296*2-1}}
  function effect(context,level,kind='impact'){
    const p=profiles[level-1],length=kind==='rise'?2.4:kind==='ambient'?3.2:1.6,rate=context.sampleRate;
    const buffer=context.createBuffer(2,Math.ceil(rate*length),rate);
    for(let ch=0;ch<2;ch++){
      const data=buffer.getChannelData(ch),rng=random(level*713+ch*991+kind.length);let low=0,band=0;
      for(let i=0;i<data.length;i++){
        const t=i/rate,n=rng();low+=.025*(n-low);band+=.18*(n-band);
        const attack=Math.min(1,t/.008),decay=Math.exp(-t*(kind==='ambient'?.7:kind==='rise'?.2:3));
        const root=hz(p.root),pitch=root*(1+ch*.002),metal=[1,2.76,5.4,8.93];let sample=0;
        switch(p.material){
          case 'metal':case 'clock':case 'bell':
            sample=metal.reduce((v,m,j)=>v+Math.sin(TAU*pitch*m*t)*Math.exp(-t*(1.7+j*1.3))/(j+1),0)*.22+(n-band)*Math.exp(-t*45)*.14;break;
          case 'glass':case 'ice':
            sample=[3.1,4.8,7.3,11.1,13.7].reduce((v,m,j)=>v+Math.sin(TAU*pitch*m*t+ch*.2)*Math.exp(-t*(2+j*.6))/(j+2),0)*.34+(n-band)*Math.exp(-t*28)*.13;break;
          case 'water':
            sample=(Math.sin(TAU*(320*t+80*Math.sin(t*9)))*Math.exp(-t*5)*.2+low*3+band*.2)*( .7+.3*Math.sin(t*17));break;
          case 'electric':
            sample=(n-band)*(.4+.3*Math.sin(t*83))*Math.exp(-t*8)+Math.sin(TAU*(90*t+20*(1-Math.exp(-t*13))))*.2;break;
          case 'voice':case 'organic':
            sample=Math.sin(TAU*pitch*t+3*Math.sin(TAU*pitch*.5*t))*.22+Math.sin(TAU*pitch*2.98*t)*.06+band*.2;sample*=.7+.3*Math.sin(t*22);break;
          case 'wood':
            sample=Math.sin(TAU*145*t)*Math.exp(-t*19)*.35+Math.sin(TAU*237*t)*Math.exp(-t*12)*.2+band*Math.exp(-t*17)*.7;break;
          case 'sand':sample=band*.8+Math.sin(TAU*pitch*4*t)*Math.exp(-t*5)*.12;break;
          default:sample=Math.sin(TAU*(42*t+5*(1-Math.exp(-t*13))))*.33+low*2.2+n*Math.exp(-t*32)*.24;
        }
        if(kind==='rise')sample=(sample*.4+band*.35)*Math.min(1,t/2.2)*(1-t/length);
        else if(kind==='ambient')sample=(sample*.22+low*.4)*Math.sin(Math.PI*t/length);
        else sample+=Math.sin(TAU*(48*t+2*(1-Math.exp(-t*20))))*.13*Math.exp(-t*6);
        data[i]=Math.tanh(sample*attack*decay)*.55*Math.min(1,(length-t)/.08);
      }
    }return buffer;
  }
  function drum(context,level,kind){
    const length={kick:.48,snare:.3,hat:.09,taiko:.65,crash:1.2}[kind],rate=context.sampleRate;
    const buffer=context.createBuffer(2,Math.ceil(rate*length),rate);
    for(let ch=0;ch<2;ch++){
      const data=buffer.getChannelData(ch),rng=random(level*91+ch*53+kind.length);let low=0;
      for(let i=0;i<data.length;i++){
        const t=i/rate,n=rng();low+=.13*(n-low);let v=0;
        if(kind==='kick')v=Math.sin(TAU*(46*t+7*(1-Math.exp(-t*35))))*Math.exp(-t*10)*.9+n*Math.exp(-t*180)*.2;
        if(kind==='snare')v=(n-low)*Math.exp(-t*18)*.7+Math.sin(TAU*185*t)*Math.exp(-t*27)*.35;
        if(kind==='hat')v=(n-low)*Math.exp(-t*55)*.4;
        if(kind==='taiko')v=(Math.sin(TAU*(72+level)*t)*.65+Math.sin(TAU*(117+level)*t)*.24)*Math.exp(-t*7)+low*Math.exp(-t*45);
        if(kind==='crash')v=((n-low)*.6+Math.sin(TAU*3171*t)*.06)*Math.exp(-t*4);
        data[i]=Math.tanh(v)*Math.min(1,t/.002)*Math.min(1,(length-t)/.025)*.8;
      }
    }return buffer;
  }
  function pluckedGuitar(note,duration,rate=22050){
    const data=new Float32Array(Math.ceil(duration*rate)),frequency=hz(note),rng=random(note*997+Math.round(duration*1000));
    const harmonics=Array.from({length:12},(_,i)=>{const k=i+1;return {ratio:k*Math.sqrt(1+.000035*k*k),weight:Math.sin(Math.PI*k*.19)/k**1.25,decay:.65+.2*k+.025*k*k};}).filter(h=>frequency*h.ratio<rate*.42);
    for(let i=0;i<data.length;i++){
      const t=i/rate,vibrato=Math.min(1,Math.max(0,(t-.12)/.22));
      // A slightly sharp pick settles into pitch; gentle vibrato arrives after the attack.
      const phase=TAU*frequency*(t+.000115*(1-Math.exp(-t/.025)))+frequency*.00065*vibrato*Math.sin(TAU*5.2*t);
      let string=0;for(const h of harmonics)string+=Math.sin(phase*h.ratio)*h.weight*Math.exp(-t*h.decay);
      const pick=rng()*.07*Math.exp(-t*95),attack=Math.min(1,t/.003),release=Math.min(1,(duration-t)/Math.min(.035,duration*.15));
      // Mild amplifier saturation retains the string's decay instead of flattening it.
      data[i]=Math.tanh((string+pick)*1.8)*.75*attack*release;
    }
    return data;
  }
  class Director{
    constructor(context,destination=context.destination){
      this.context=context;this.sources=new Set();this.cache=new Map();this.session=null;this.events=0;
      this.bus=context.createGain();this.bus.gain.value=.65;
      this.compressor=context.createDynamicsCompressor();this.compressor.threshold.value=-18;this.compressor.knee.value=12;this.compressor.ratio.value=5;this.compressor.attack.value=.008;this.compressor.release.value=.2;
      this.bus.connect(this.compressor);this.compressor.connect(destination);
      this.reverb=context.createConvolver();const impulse=context.createBuffer(2,Math.ceil(context.sampleRate*1.5),context.sampleRate);
      for(let c=0;c<2;c++){const d=impulse.getChannelData(c),r=random(31+c);for(let i=0;i<d.length;i++)d[i]=r()*(1-i/d.length)**3*.24;}
      this.reverb.buffer=impulse;this.wet=context.createGain();this.wet.gain.value=.22;this.bus.connect(this.reverb);this.reverb.connect(this.wet);this.wet.connect(this.compressor);
    }
    track(source,gain){this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();gain.disconnect()};}
    tone(note,at,duration,volume=.06,voice='strings',pan=0){
      if(voice==='guitar'){this.guitar(note,at,duration,volume,pan);return;}
      const c=this.context,g=c.createGain(),stereo=c.createStereoPanner();stereo.pan.value=pan;g.connect(stereo);stereo.connect(this.bus);
      g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(volume,at+Math.min(duration*.3,voice==='strings'?.035:.006));g.gain.exponentialRampToValueAtTime(.0001,at+duration);
      const freq=hz(note),partials=voice==='bell'?[1,2.76,5.4]:['brass','blade'].includes(voice)?[1,2,3,4,5]:voice==='choir'?[1,2,3,5,8]:voice==='pluck'?[1,2,4]:[1,2,3];let pending=partials.length;
      partials.forEach((ratio,i)=>{const o=c.createOscillator();o.type=voice==='pulse'?'square':voice==='blade'?'sawtooth':'sine';o.frequency.setValueAtTime(freq*ratio,at);o.detune.value=(i%2?1:-1)*3;const v=c.createGain();v.gain.value=1/(1+i*2);o.connect(v);v.connect(g);this.sources.add(o);o.onended=()=>{this.sources.delete(o);o.disconnect();v.disconnect();if(!--pending){g.disconnect();stereo.disconnect()}};o.start(at);o.stop(at+duration+.02)});
    }
    guitar(note,at,duration,volume,pan){
      const c=this.context,key=`${note}:${duration.toFixed(5)}`;this.guitarBuffers??=new Map();
      if(!this.guitarBuffers.has(key)){const data=pluckedGuitar(note,duration),buffer=c.createBuffer(1,data.length,22050);buffer.copyToChannel(data,0);if(this.guitarBuffers.size>=48)this.guitarBuffers.delete(this.guitarBuffers.keys().next().value);this.guitarBuffers.set(key,buffer);}
      const source=c.createBufferSource(),cabinet=c.createBiquadFilter(),gain=c.createGain(),stereo=c.createStereoPanner();
      source.buffer=this.guitarBuffers.get(key);cabinet.type='lowpass';cabinet.Q.value=.65;cabinet.frequency.setValueAtTime(4600,at);cabinet.frequency.exponentialRampToValueAtTime(1800,at+duration);
      gain.gain.value=volume;stereo.pan.value=pan;source.connect(cabinet);cabinet.connect(gain);gain.connect(stereo);stereo.connect(this.bus);
      this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();cabinet.disconnect();gain.disconnect();stereo.disconnect();};source.start(at);source.stop(at+duration);
    }
    sound(level,kind,at=this.context.currentTime,volume=.55,fadeEnd=null){
      const key=`${level}:${kind}`;if(!this.cache.has(key)){if(this.cache.size>=12)this.cache.delete(this.cache.keys().next().value);this.cache.set(key,kind.startsWith('death_')&&globalThis.BossDefeat?BossDefeat.soundBuffer(this.context,level,kind.slice(6)):['kick','snare','hat','taiko','crash'].includes(kind)?drum(this.context,level,kind):effect(this.context,level,kind));}
      const s=this.context.createBufferSource(),g=this.context.createGain();s.buffer=this.cache.get(key);g.gain.value=volume;s.connect(g);g.connect(this.bus);this.track(s,g);if(fadeEnd!==null){g.gain.setValueAtTime(volume,at);g.gain.setValueAtTime(volume,Math.max(at,fadeEnd-8*60/profiles[level-1].bpm));g.gain.linearRampToValueAtTime(0,fadeEnd);}s.start(at);if(fadeEnd!==null)s.stop(fadeEnd);this.events++;
    }
    regentStep(n,phase,intro,time,at,beatLength){
      const step=n%16,bar=Math.floor(n/16),section=Math.floor(bar/8)%regentMovements.length,m=regentMovements[section];
      const root=m.roots[bar%4],build=intro?Math.min(1,.35+time/11):1,bright=['major','lydian'].includes(m.mode),sparse=section===3||section===5;
      const arrangement=regentArrangement(n,intro);
      this.regentFeature(n,at,beatLength,build,arrangement);
      const drumBuild=build*(arrangement.groove?.45:1),leadBuild=build*(arrangement.guitar?.25:1);
      // Eight movements (~78 seconds): minor tension, major release, then a transformed reprise.
      const kicks=sparse?[0,6,8,14]:section===4?[0,2,3,6,8,10,11,14]:[0,3,6,8,10,14];
      if(!arrangement.heavy){
      if(kicks.includes(step))this.sound(20,'kick',at,.76*drumBuild);
      if(step===4||step===12)this.sound(20,'snare',at,.63*drumBuild);
      if(!sparse||step%2===0)this.sound(20,'hat',at,(step%2?.11:.22)*drumBuild);
      if(step%4===0)this.sound(20,'taiko',at,.42*drumBuild);
      if(step===0&&bar%4===0)this.sound(20,'crash',at,.32*drumBuild);
      if(step>=12&&bar%8===7)this.sound(20,step%2?'taiko':'snare',at,.38*drumBuild);
      }
      if(step%2===0){
        this.tone(root+(step%4===2?12:0),at,beatLength*.45,.075*build,'blade',0);
        const note=root+24+m.motif[step/2];
        this.tone(note,at,beatLength*(bright?1.05:.48),.042*leadBuild,bright?'brass':'pulse',-.22);
        this.tone(note-12,at+beatLength*.04,beatLength*.65,.025*leadBuild,'strings',.3);
      }
      // Sustained background harmony, stereo string ostinato, and answering high bells.
      if(step===0){
        m.chord.forEach((v,i)=>{this.tone(root+12+v,at,beatLength*4.1,.019*build,'strings',(i-1.5)*.4);this.tone(root+24+v,at+.04,beatLength*3.8,.012*build,'choir',(1.5-i)*.4);});
        this.tone(root-12,at,beatLength*3.7,.07*build,'brass');
      }
      const arp=m.chord[(step+bar)%m.chord.length];
      this.tone(root+24+arp+(step%4===3?12:0),at,beatLength*.38,.014*build,'pluck',Math.sin(n*.3)*.6);
      if(step%4===2)this.tone(root+36+m.motif[(7-Math.floor(step/2)+bar)%8],at,beatLength*.85,.014*build,'bell',.45);
      if(step%4===0)m.chord.slice(0,3).forEach((v,i)=>this.tone(root+12+v,at,beatLength*.7,.016*build,'brass',(i-1)*.25));
      if(phase>=2&&step%2===1)this.tone(root+36+m.chord[step%4],at,beatLength*.23,.014*build,'pluck',-.45);
      if(step===0&&bar%8===7)this.sound(20,'rise',at,.22);
    }
    regentFeature(n,at,beatLength,build,arrangement=regentArrangement(n)){
      const step=n%16,bar=Math.floor(n/16),end=at+arrangement.endSteps*beatLength*.25;
      if(arrangement.guitar){
        const offset=(n-32*16)%64,index=saveWorldMotif.findIndex(note=>note[0]===offset);
        if(index>=0){const [,note]=saveWorldMotif[index],next=saveWorldMotif[index+1]?.[0]??64;
          const duration=Math.min((next-offset)*beatLength*.25,Math.max(.01,end-at));
          this.tone(note,at,duration,.13*build*arrangement.guitarGain,'guitar',-.18);
          if(arrangement.groove)this.tone(note-12,at,duration,.035*build*arrangement.guitarGain,'guitar',.3);
        }
      }
      if(arrangement.groove){
        const gain=build*arrangement.guitarGain;
        if([0,3,7,8,10,14].includes(step))this.sound(20,'kick',at,.8*gain,end);
        if([4,12].includes(step))this.sound(20,'snare',at,.7*gain,end);
        if([6,15].includes(step))this.sound(20,'snare',at,.23*gain,end);
        this.sound(20,'hat',at,(step%2?.12:.24)*gain,end);
        if(step>=12&&bar%2===1)this.sound(20,'taiko',at,.4*gain,end);
        if(step===0&&bar%4===0)this.sound(20,'crash',at,.35*gain,end);
      }
      if(arrangement.heavy){
        if([0,1,3,6,8,9,11,14].includes(step))this.sound(20,'kick',at,.95*build);
        if([4,12].includes(step))this.sound(20,'snare',at,.85*build);
        if([7,15].includes(step))this.sound(20,'snare',at,.33*build);
        this.sound(20,'hat',at,(step%2?.16:.28)*build);
        if([2,5,10,13].includes(step))this.sound(20,'taiko',at,.46*build);
        if(step===0&&bar%2===0)this.sound(20,'crash',at,.5*build);
        if(bar%4===3&&step>=12){this.sound(20,'snare',at+beatLength*.125,.48*build);this.sound(20,'taiko',at,.5*build);}
      }
    }
    defeat(level,time,now){
      for(const [cue,kind] of BossDefeat.audioCues(level))if(time>=cue&&this.lastTimeBefore<cue)this.sound(level,'death_'+kind,now,kind==='ray'?.75:kind==='impact'?.65:.46);
      // A separate score follows the picture, including the minor-to-major final resolution.
      const beat=Math.floor(time/1.2);
      if(beat!==this.lastDefeatBeat){
        this.lastDefeatBeat=beat;
        const major=level===20?time>=13:time>=5,root=level===20?38:profiles[level-1].root;
        const chord=level===20&&time>=19&&time<25?[0,1,6,13]:major?[0,4,7,12]:[0,3,7,10];
        chord.forEach((v,i)=>this.tone(root+12+v,now,1.9,level===20?.022:.014,major?'choir':'strings',(i-1.5)*.4));
        this.tone(root-12,now,1.5,.045,'brass');
        if(level===20&&time>=13)chord.forEach((v,i)=>this.tone(root+36+v,now+i*.09,.65,.012,'bell',(i-1.5)*.3));
      }
      this.lastTimeBefore=time;
    }
    stop(){for(const s of this.sources){try{s.stop()}catch{}}this.sources.clear();this.wet.gain.cancelScheduledValues(this.context.currentTime);this.wet.gain.setValueAtTime(0,this.context.currentTime);this.session=null;this.nextBeat=0;this.lastCue=-1;this.lastMove=null;this.lastDefeatBeat=-1;}
    sync({level,mode='intro',time=0,phase=1,move='',playing=true,speed=1,startBeat=0}={}){
      if(!playing||!level||this.context.state!=='running'){if(this.session)this.stop();return;}
      const key=`${level}:${mode}`,p=profiles[level-1],now=this.context.currentTime;
      if(this.session!==key||time<this.lastTime-.15){this.stop();this.session=key;this.lastTimeBefore=time-.01;this.wet.gain.setValueAtTime(0,now);this.wet.gain.linearRampToValueAtTime(.22,now+1.5);this.nextBeat=now;this.beat=startBeat;this.lastCue=Math.floor(time/.5)-1;this.lastMove=move;}
      this.lastTime=time;
      if(mode==='defeat'&&globalThis.BossDefeat){this.defeat(level,time,now);return;}
      // Schedule only a short window, so pause/skip/mute are immediate.
      const beatLength=60/(p.bpm+(phase-1)*7)/Math.max(.5,Math.min(2,speed));
      if(this.nextBeat<now-.25)this.nextBeat=now;
      while(this.nextBeat<now+.12){
        const n=this.beat++,step=n%p.steps,bar=Math.floor(n/p.steps),root=p.root+p.harmony[bar%4],intro=mode==='intro',at=this.nextBeat;
        const build=intro?Math.min(1,.4+time/10):1;
        if(level===20){this.regentStep(n,phase,intro,time,at,beatLength);this.nextBeat+=beatLength*.25;continue;}
        // Sixteenth-note grooves: syncopated kicks, backbeats, hats and tom fills.
        if(p.kick.includes(step))this.sound(level,'kick',at,.8*build);
        if(p.snare.includes(step))this.sound(level,'snare',at,.62*build);
        if(step%2===0||phase>=2)this.sound(level,'hat',at,(step%4===0?.3:.17)*build);
        if(step===0){this.sound(level,'taiko',at,.55*build);if(bar%4===0)this.sound(level,'crash',at,.35*build);}
        if(step>=p.steps-3&&(bar%4===3||phase>=2))this.sound(level,step%2?'taiko':'snare',at,.35*build);
        if(step%2===0){
          this.tone(root+(step%4===2?12:0),at,beatLength*.4,.1*build,'brass');
          const motif=p.motif[(Math.floor(step/2)+bar)%p.motif.length]+root+24;
          this.tone(motif,at,beatLength*.38,.045*build,p.lead,Math.sin(n*.7)*.3);
        }
        if(step%4===0){
          [0,3,7].forEach((v,i)=>this.tone(root+12+v,at,beatLength*.65,.026*build,'brass',(i-1)*.45));
          // Fast bowed ostinato replaces the long, calm sustained pads.
          this.tone(root+19,at+beatLength*.125,beatLength*.2,.027*build,'strings',-.35);
        }
        if(phase>=2&&step%2===1)this.tone(root+36+(step%4===1?1:7),at,beatLength*.18,.022,'pluck',.35);
        this.nextBeat+=beatLength*.25;
      }
      if(mode==='intro'){
        const cues=[.2,2.5,5.2,8,10.8,13];
        cues.forEach((cue,i)=>{if(time>=cue&&this.lastTimeBefore<cue)this.sound(level,i===1||i===3?'rise':i===0?'ambient':'impact',now,i===5?.7:.4)});
      }else if(move&&move!==this.lastMove){this.sound(level,'impact',now,.6);this.lastMove=move;}
      this.lastTimeBefore=time;
    }
  }
  return {profiles,effect,drum,Director,regentMovements,regentArrangement,saveWorldMotif,pluckedGuitar};
})();
if(typeof module!=='undefined')module.exports=BossAudio;
if(typeof globalThis!=='undefined')globalThis.BossAudio=BossAudio;
