const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Director,profiles}=require('../boss-audio.js');
function movement(section,phase){
  const events=[];
  const recorder={sound:(...args)=>events.push(['sound',...args]),tone:(...args)=>events.push(['tone',...args])};
  for(let step=0;step<16;step++)Director.prototype.regentStep.call(recorder,section*128+step,phase,false,0,step*.075,.3);
  return events;
}
test('Regent has four distinct fully scored movements and a denser final phase',()=>{
  const movements=[0,1,2,3].map(section=>movement(section,1));
  assert.equal(new Set(movements.map(JSON.stringify)).size,4);
  for(const events of movements){
    for(const kind of ['kick','snare','hat','taiko','crash'])assert(events.some(e=>e[0]==='sound'&&e[2]===kind));
    assert(events.some(e=>e[0]==='tone'&&e[5]==='choir'));
    for(const event of events)for(const v of event)if(typeof v==='number')assert(Number.isFinite(v));
  }
  assert(movement(3,3).length>movement(3,1).length);
  assert(profiles[19].bpm>profiles[18].bpm);
});
