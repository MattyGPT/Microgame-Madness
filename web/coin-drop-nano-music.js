"use strict";
const CoinDropNanoMusic = (() => {
  // Short, original arcade phrases. Each game gets its own melody, rhythm,
  // harmonic progression and synth palette, stable across visits and devices.
  const scales = [[0,2,4,7,9],[0,3,5,7,10],[0,2,4,6,9],[0,2,5,7,9],[0,3,5,8,10],[0,2,4,7,11]];
  const motifs = [[0,2,4,2],[0,1,3,4],[4,2,1,0],[0,3,2,4],[2,0,4,3],[0,4,3,1],[1,3,0,2],[3,2,4,0]];
  const cache = new Map();
  function hash(text){let value=2166136261;for(const c of text)value=Math.imul(value^c.charCodeAt(0),16777619);return value>>>0;}
  function score(game){
    if(cache.has(game.id))return cache.get(game.id);
    let seed=hash(game.id);const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    const scale=scales[Math.floor(random()*scales.length)],motif=motifs[Math.floor(random()*motifs.length)];
    const root=60+Math.floor(random()*12),duration=Math.min(5.6,game.seconds),step=duration/16;
    const lead=['triangle','sine','square'][Math.floor(random()*3)];
    const chords=[0,Math.floor(random()*3)+1,Math.floor(random()*4),0];
    const beats=Array.from({length:16},(_,i)=>{
      const bar=Math.floor(i/4),degree=i===15?0:(motif[i%4]+bar+(random()<.3?Math.floor(random()*3):0))%5;
      const midi=root+scale[degree]+(i>=8&&random()<.35?12:0);
      const notes=[];
      // The first note and final cadence always sound; interior rests give each tune its own rhythm.
      if(i===0||i===15||random()>.18)notes.push({midi,duration:step*(i===15?1.3:.55+random()*.3),type:lead,volume:lead==='square'?.11:.23});
      if(i%4===0)notes.push({midi:root-24+scale[chords[bar]],duration:step*2.6,type:'sine',volume:.25});
      if(i%4===2)notes.push({midi:root-12+scale[chords[bar]],duration:step*.7,type:'triangle',volume:.09});
      if(i%4===0||i%4===2&&random()>.4)notes.push({midi:34,duration:Math.min(.09,step*.6),type:'kick',volume:.2});
      return notes;
    });
    const song=Object.freeze({id:game.id,title:`${game.title} · pocket theme`,duration,step,beats});cache.set(game.id,song);return song;
  }
  function voice(context,destination,note,at){
    const oscillator=context.createOscillator(),gain=context.createGain();
    const frequency=440*2**((note.midi-69)/12),end=at+note.duration;
    oscillator.type=note.type==='kick'?'sine':note.type;oscillator.frequency.setValueAtTime(frequency,at);
    if(note.type==='kick')oscillator.frequency.exponentialRampToValueAtTime(35,end);
    gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(note.volume,at+.005);gain.gain.exponentialRampToValueAtTime(.0001,end);
    oscillator.connect(gain);gain.connect(destination);oscillator.start(at);oscillator.stop(end+.01);
    return {oscillator,gain};
  }
  class Player {
    constructor(context,destination=context.destination){
      this.context=context;this.output=context.createGain();this.output.gain.value=0;this.output.connect(destination);this.voices=new Set();this.playing=false;this.song=null;this.nextBeat=0;this.notesPlayed=0;
    }
    start(song){this.stop();this.song=song;}
    clearVoices(){
      for(const v of this.voices){try{v.oscillator.stop();}catch{}v.oscillator.disconnect();v.gain.disconnect();}
      this.voices.clear();
    }
    silence(){this.output.gain.value=0;this.playing=false;this.clearVoices();}
    stop(){this.silence();this.song=null;this.nextBeat=0;}
    sync(enabled,elapsed){
      if(!this.song)return;
      if(!enabled||this.context.state!=='running'){
        if(this.playing||this.voices.size)this.silence();
        this.nextBeat=Math.floor(elapsed/this.song.step);return;
      }
      if(!this.playing){this.playing=true;this.output.gain.value=.12;this.nextBeat=Math.floor(elapsed/this.song.step);}
      // Never replay missed beats after a hidden tab or a stalled frame.
      if(this.nextBeat*this.song.step<elapsed-.15)this.nextBeat=Math.floor(elapsed/this.song.step);
      while(this.nextBeat*this.song.step<=elapsed+.075){
        const beat=this.song.beats[this.nextBeat%16],offset=this.nextBeat*this.song.step-elapsed;
        if(offset>=-.04)for(const note of beat){
          const v=voice(this.context,this.output,note,this.context.currentTime+Math.max(.005,offset));
          this.voices.add(v);this.notesPlayed++;v.oscillator.onended=()=>{this.voices.delete(v);v.oscillator.disconnect();v.gain.disconnect();};
        }
        this.nextBeat++;
      }
    }
  }
  return {score,voice,Player};
})();
if(typeof module!=='undefined')module.exports=CoinDropNanoMusic;
