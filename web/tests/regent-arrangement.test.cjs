const {test}=require('node:test');const assert=require('node:assert/strict');const {Director,regentArrangement,saveWorldMotif}=require('../boss-audio.js');
function events(bar){const out=[],director=Object.create(Director.prototype);director.tone=(note,at,duration,volume,voice,pan)=>out.push({type:'tone',note,at,duration,volume,voice,pan});director.sound=(level,kind,at,volume,end)=>out.push({type:'drum',kind,at,volume,end});for(let step=0;step<16;step++)director.regentFeature(bar*16+step,step*.075,.3,1);return out;}
test('guitar lasts sixteen bars, drums join halfway and both give way to the heavy section',()=>{
 assert.equal(regentArrangement(31*16).guitar,false);
 for(let bar=32;bar<48;bar++){assert.equal(regentArrangement(bar*16).guitar,true);assert.ok(events(bar).some(e=>e.voice==='guitar'));assert.equal(regentArrangement(bar*16).groove,bar>=40);assert.equal(regentArrangement(bar*16).heavy,false);}
 assert.equal(events(39).filter(e=>e.type==='drum').length,0);assert.ok(events(40).some(e=>e.type==='drum'));
 assert.equal(regentArrangement(48*16).guitar,false);assert.equal(regentArrangement(48*16).groove,false);assert.equal(regentArrangement(48*16).heavy,true);assert.equal(events(48).some(e=>e.voice==='guitar'),false);assert.ok(events(48).some(e=>e.kind==='kick'));
 assert.equal(regentArrangement(64*16).heavy,false);assert.equal(regentArrangement(32*16,true).guitar,false);
});
test('the phrase retains its rhythm and the final two bars fade to the transition boundary',()=>{
 assert.deepEqual(saveWorldMotif.slice(0,4),[[0,60],[8,72],[16,67],[32,65]]);
 assert.equal(regentArrangement(46*16).guitarGain,1);assert.equal(regentArrangement(47*16).guitarGain,.5);assert.ok(regentArrangement(48*16-1).guitarGain<.04);
 const last=events(47);for(const event of last){if(event.type==='tone')assert.ok(event.at+event.duration<=1.2+1e-9);else assert.ok(Math.abs(event.end-1.2)<1e-9);}
 const mid=events(40),heavy=events(51);assert.ok(heavy.filter(e=>e.kind==='kick').length>mid.filter(e=>e.kind==='kick').length);assert.ok(heavy.some(e=>e.kind==='snare'&&e.volume>.7));
});

test('each electric guitar note lasts exactly until the next motif note',()=>{
 for(let bar=32;bar<48;bar++)for(const event of events(bar).filter(e=>e.voice==='guitar'&&e.pan===-.18)){
  const step=Math.round(event.at/.075),offset=((bar-32)*16+step)%64,index=saveWorldMotif.findIndex(n=>n[0]===offset),next=saveWorldMotif[index+1]?.[0]??64;
  assert.ok(Math.abs(event.duration-(next-offset)*.075)<1e-9);
 }
});

test('guitar strings decay and darken naturally while retaining an audible sustained tail',()=>{
 const {pluckedGuitar}=require('../boss-audio.js'),rate=22050;
 for(const note of [60,65,72,74]){
  const data=pluckedGuitar(note,1.2,rate),rms=(a,b)=>{const part=data.slice(Math.floor(a*rate),Math.floor(b*rate));return Math.sqrt(part.reduce((sum,v)=>sum+v*v,0)/part.length);};
  assert.equal(data.length,Math.ceil(1.2*rate));assert.ok(data.every(Number.isFinite));assert.ok(data.every(v=>Math.abs(v)<1));
  const attack=rms(.02,.16),tail=rms(.95,1.1);assert.ok(tail>0.01);assert.ok(tail<attack*.8,`${note}: attack ${attack}, tail ${tail}`);
  assert.ok(Math.abs(data.at(-1))<.005);assert.equal(Math.abs(data[0]),0);
 }
});
