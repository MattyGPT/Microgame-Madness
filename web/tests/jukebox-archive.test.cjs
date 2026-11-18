const test=require('node:test');
const assert=require('node:assert/strict');
const music=require('../music.js');
const archive=require('../jukebox-archive.js');
const coin=require('../coin-drop.js');
test('every nanogame and missing score appears once, with duration, outside automatic shuffle',()=>{
  const ids=music.jukeboxTracks.map(t=>t.id),automatic=new Set(music.arcadeTracks.map(t=>t.id));
  assert.equal(new Set(ids).size,ids.length);
  for(const game of coin.nanogames)assert.ok(ids.includes(`nano_theme_${game.id}`));
  for(const track of archive.tracks){assert.ok(ids.includes(track.id));assert.ok(track.duration>0);assert.ok(!automatic.has(track.id));}
  for(const id of ['tearesseract_prelude','gaster_signal']){assert.ok(ids.includes(id));assert.ok(!automatic.has(id));}
  assert.equal(music.arcadeTracks.length,50);
  const player=new music.Player({});
  const shuffled=Array.from({length:50*3},()=>player.nextTrack());
  assert.ok(shuffled.every(id=>automatic.has(id)));
});
test('board variants and forge use their in-game note patterns',()=>{
  assert.equal(archive.boardBeat(0,0)[0].hz,220);
  assert.equal(archive.boardBeat(0,20)[0].hz,220*2**(8/12));
  assert.equal(archive.forgeBeat(0)[0].hz,220);
  assert.equal(archive.forgeBeat(8)[0].hz,261.63);
  assert.ok(archive.forgeBeat(0).some(n=>n.endHz===38));
});
