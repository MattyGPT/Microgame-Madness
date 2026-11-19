const {test}=require('node:test'),assert=require('node:assert/strict');
const {matches,suggestions}=require('../jukebox-search.js');
const tracks=[{id:'boss_a',title:'Thunder Road',category:'Boss Crush',bpm:100},{id:'quiet',title:'Quiet Night',category:'Game theme',bpm:80},{id:'fast',title:'Wild Ride',category:'Boss Crush',bpm:180},{id:'signal',title:'Signal',category:'Secret encounter',bpm:0}];
test('search matches partial names and categories regardless of case',()=>{
  assert.deepEqual(tracks.filter(t=>matches(t,'BOSS cru')).map(t=>t.id),['boss_a','fast']);
  assert.equal(matches(tracks[0],'thunder'),true);assert.equal(matches(tracks[0],'no such song'),false);
  assert.equal(tracks.filter(t=>matches(t,'')).length,4);
});
test('tempo queries support inclusive ranges, exact BPM and combined categories',()=>{
  for(const query of ['100 BPM and below','<=100 bpm','at most 100 bpm'])assert.deepEqual(tracks.filter(t=>matches(t,query)).map(t=>t.id),['boss_a','quiet']);
  assert.deepEqual(tracks.filter(t=>matches(t,'Boss Crush 100 BPM and below')).map(t=>t.id),['boss_a']);
  assert.deepEqual(tracks.filter(t=>matches(t,'100 bpm')).map(t=>t.id),['boss_a']);
  assert.deepEqual(tracks.filter(t=>matches(t,'150 bpm and above')).map(t=>t.id),['fast']);
  assert.equal(matches(tracks[0],'under 100 bpm'),false);
});
test('suggestions offer matching categories, tempos, and titles',()=>{
  assert.ok(suggestions(tracks,'boss').includes('Boss Crush'));assert.ok(suggestions(tracks,'100').includes('100 BPM and below'));assert.ok(suggestions(tracks,'thun').includes('Thunder Road'));assert.deepEqual(suggestions(tracks,'zzzz'),[]);
});
