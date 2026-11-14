const {test}=require('node:test');
const assert=require('node:assert/strict');
const Music=require('../coin-drop-nano-music.js');
const {nanogames}=require('../coin-drop.js');
function context(){
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const ctx={state:'running',currentTime:0,destination:{},starts:[],stops:0,createGain(){return {gain:param(),connect(){},disconnect(){}};},createOscillator(){return {frequency:param(),connect(){},disconnect(){},start(at){ctx.starts.push(at);},stop(){ctx.stops++;}};}};
 return ctx;
}
test('all 60 games receive stable, short and musically distinct original phrases',()=>{
 const songs=nanogames.map(Music.score);assert.equal(songs.length,60);
 const melodies=songs.map(s=>{const notes=s.beats.map(b=>b[0]?.midi??null),root=notes[0];return JSON.stringify(notes.map(n=>n===null?null:n-root));});
 assert.equal(new Set(melodies).size,60,'melodies must differ even without transposition');
 for(const [i,s] of songs.entries()){
  assert.strictEqual(Music.score(nanogames[i]),s);assert.ok(s.duration<=nanogames[i].seconds&&s.duration<=5.6);assert.equal(s.beats.length,16);
  for(const note of s.beats.flat()){assert.ok(note.midi>=24&&note.midi<=96);assert.ok(note.duration>0&&note.duration<1);assert.ok(note.volume>0&&note.volume<=.25);}
 }
});
test('mute, stop, suspended audio and song changes cancel every scheduled voice',()=>{
 const ctx=context(),p=new Music.Player(ctx),a=Music.score(nanogames[0]),b=Music.score(nanogames[1]);
 p.start(a);p.sync(false,0);assert.equal(ctx.starts.length,0);
 p.sync(true,0);assert.ok(p.voices.size>0);assert.equal(p.output.gain.value,.12);
 p.sync(false,.02);assert.equal(p.voices.size,0);assert.equal(p.output.gain.value,0);
 p.sync(true,.35);p.start(b);assert.equal(p.voices.size,0);assert.equal(p.song.id,b.id);
 ctx.state='suspended';p.sync(true,0);assert.equal(p.voices.size,0);
 ctx.state='running';p.sync(true,0);assert.ok(p.voices.size>0);p.stop();assert.equal(p.voices.size,0);assert.equal(p.song,null);assert.equal(p.output.gain.value,0);
});
test('scheduler skips elapsed beats instead of playing a catch-up burst',()=>{
 const ctx=context(),p=new Music.Player(ctx);p.start(Music.score(nanogames[0]));p.sync(true,0);const before=ctx.starts.length;
 ctx.currentTime=120;p.sync(true,120);assert.ok(ctx.starts.length-before<=8);assert.ok(ctx.starts.slice(before).every(t=>t>=120));p.stop();
});
