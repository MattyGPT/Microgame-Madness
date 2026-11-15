'use strict';
const JukeboxArchive=(()=>{
  const node=typeof module!=='undefined'&&module.exports;
  const coin=node?require('./coin-drop.js'):CoinDrop;
  const nano=node?require('./coin-drop-nano-music.js'):CoinDropNanoMusic;
  const bosses=node?require('./boss-audio.js'):BossAudio;
  const defeat=node?require('./boss-defeat.js'):BossDefeat;
  const origin=node?require('./core-origin.js'):CoreOrigin;
  const effects=node?require('./effects.js'):ArcadeEffects;
  const tracks=[];
  const add=track=>tracks.push(Object.freeze(track));
  for(const game of coin.nanogames){const song=nano.score(game);add({id:`nano_theme_${game.id}`,title:song.title,category:'Nanogame themes',bpm:Math.round(60/song.step),duration:song.duration,kind:'nano',game});}
  for(let key=0;key<5;key++)add({id:`coin_board_${key}`,title:`Coin Drop — Board Theme ${key+1}`,category:'Coin Drop',bpm:125,duration:3.84,kind:'board',key});
  add({id:'galactic_forge',title:'Galactic Forge — Celestial Hammer',category:'Minigame themes',bpm:107,duration:4.48,kind:'forge'});
  add({id:'core_origin_film',title:'Singularity Core — Origin Film',category:'Cinematic scores',bpm:100,duration:origin.duration,kind:'origin'});
  for(const kind of ['death','finale'])add({id:`core_sequence_${kind}`,title:`Singularity Core — ${kind==='death'?'Collapse':'Final Beam'}`,category:'Cinematic scores',bpm:0,duration:kind==='death'?effects.DEATH_DURATION:effects.FINALE_DURATION,kind:'sequence',sequence:kind});
  for(const profile of bosses.profiles){
    for(const mode of ['intro','phase2','phase3','defeat']){
      const phase=mode==='phase3'?3:mode==='phase2'?2:1,bpm=profile.bpm+(phase-1)*7;
      const duration=mode==='intro'?14:mode==='defeat'?defeat.duration(profile.level):(profile.level===20?64:8)*profile.steps*.25*60/bpm;
      add({id:`boss_score_${profile.level}_${mode}`,title:`${profile.title} — ${mode==='intro'?'Introduction':mode==='defeat'?'Defeat':`Phase ${phase}`}`,category:'Geomayhem cinematic scores',bpm,duration,kind:'boss',level:profile.level,mode:mode.startsWith('phase')?'battle':mode,phase});
    }
  }
  const byId=new Map(tracks.map(t=>[t.id,t]));
  const forgeNotes=[220,329.63,440,493.88,659.25,493.88,440,329.63,261.63,392,523.25,659.25,783.99,659.25,523.25,392];
  function forgeBeat(beat){const notes=[{hz:forgeNotes[beat%16],duration:.48,volume:.028,type:'sine'}];if(beat%4===0)notes.push({hz:beat%16<8?55:65.41,duration:1.1,volume:.035,type:'triangle'});if(beat%2===0)notes.push({hz:95,endHz:38,duration:.13,volume:.025,type:'sine'});return notes;}
  function boardBeat(beat,map){const scale=[0,7,12,16,14,7,4,12,0,7,11,14,12,7,4,2];const notes=[{hz:220*2**((scale[beat%16]+Math.floor(map/5)%5*2)/12),duration:.3,type:'triangle',volume:.16}];if(beat%4===0)notes.push({hz:110*2**([0,0,5,7][Math.floor(beat/4)%4]/12),duration:.65,type:'sine',volume:.25});return notes;}
  function schedule(context,note,at,forge){const o=context.createOscillator(),g=context.createGain();o.type=note.type;o.frequency.setValueAtTime(note.hz,at);if(note.endHz)o.frequency.exponentialRampToValueAtTime(note.endHz,at+note.duration);g.gain.setValueAtTime(forge?0:note.volume,at);if(forge)g.gain.linearRampToValueAtTime(note.volume,at+.012);g.gain.exponentialRampToValueAtTime(forge?.0001:.001,at+note.duration);o.connect(g).connect(context.destination);o.start(at);o.stop(at+note.duration);}
  async function render(id,rate=22050){
    const track=byId.get(id);if(!track)throw Error(`Unknown archive song: ${id}`);
    const context=new OfflineAudioContext(2,Math.ceil(track.duration*rate),rate);
    if(track.kind==='origin')return origin.soundtrack(context);
    if(track.kind==='sequence')return effects.buffer(context,track.sequence);
    if(track.kind==='nano'){
      const song=nano.score(track.game);song.beats.forEach((beat,i)=>beat.forEach(note=>nano.voice(context,context.destination,note,i*song.step)));
    }else if(track.kind==='board'||track.kind==='forge'){
      for(let i=0;i<16;i++)for(const note of track.kind==='forge'?forgeBeat(i):boardBeat(i,track.key*5))schedule(context,note,i*(track.kind==='forge'?.28:.24),track.kind==='forge');
    }else if(track.kind==='boss'){
      // Run the real live scheduler against a deterministic offline clock.
      let now=0;
      const clock=new Proxy(context,{get(target,key){if(key==='currentTime')return now;if(key==='state')return 'running';const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
      const director=new bosses.Director(clock,context.destination);
      for(now=0;now<track.duration;now+=.025)director.sync({level:track.level,mode:track.mode,time:now,phase:track.phase,playing:true});
    }
    const buffer=await context.startRendering();
    let peak=0;for(let ch=0;ch<buffer.numberOfChannels;ch++)for(const x of buffer.getChannelData(ch))peak=Math.max(peak,Math.abs(x));
    const gain=peak>0?.8/peak:1;
    for(let ch=0;ch<buffer.numberOfChannels;ch++){const data=buffer.getChannelData(ch);for(let i=0;i<data.length;i++)data[i]*=gain;}
    return buffer;
  }
  return {tracks:Object.freeze(tracks),has:id=>byId.has(id),render,boardBeat,forgeBeat};
})();
if(typeof module!=='undefined')module.exports=JukeboxArchive;
