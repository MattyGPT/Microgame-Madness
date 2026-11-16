// Regenerate the compressed fight cues after editing composeTearesseract in music.js.
// Requires ffmpeg; runtime playback never synthesizes these cues on the main thread.
const {compose}=require('../web/music.js');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
for(const [track,file] of [['tearesseract','tearesseract-theme.mp3'],['tearesseract_prelude','tearesseract-prelude.mp3']]){
  const samples=compose(track,22050);
  const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','f32le','-ar','22050','-ac','1','-i','pipe:0','-codec:a','libmp3lame','-b:a','128k',path.resolve(__dirname,'../web',file)],{input:Buffer.from(samples.buffer),maxBuffer:1024*1024});
  if(result.status!==0)throw Error(result.stderr.toString());
  console.log(`${file}: ${(samples.length/22050).toFixed(2)} seconds`);
}
