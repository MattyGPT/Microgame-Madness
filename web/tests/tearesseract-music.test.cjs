const test = require('node:test');
const assert = require('node:assert/strict');
const music = require('../music.js');
test('Tearesseract follows the requested movements with a short E and cinematic F', () => {
  const events = [], rate = 8000;
  const data = music.compose('tearesseract', rate, events);
  const order = events.filter((event, i) => !i || events[i - 1].section !== event.section).map(event => event.section);
  assert.deepEqual(order, ['A', 'B', 'A', 'B-drop', 'C', 'D', 'E-short', 'B-reprise', 'F-cinematic']);
  const step = 60 / 172 / 4;
  const bridge = events.find(event => event.section === 'E-short');
  const reprise = events.find(event => event.section === 'B-reprise');
  assert.ok(Math.abs(reprise.start - bridge.start - 32 * step) < .001);
  assert.ok(events.filter(e => e.section === 'F-cinematic').some(e => e.duration > 1));
  const bPeak = Math.max(...events.filter(e => e.section === 'B').map(e => e.pitch));
  const reprisePeak = Math.max(...events.filter(e => e.section === 'B-reprise').map(e => e.pitch));
  assert.equal(reprisePeak - bPeak, 12);
  assert.ok(events.slice(0, 8).every(e => e.pitch < 72));
  const regularB=events.filter(e=>e.section==='B');
  const bSpacing=regularB.slice(1).map((e,i)=>Math.round((e.start-regularB[i].start)/step));
  assert.ok(new Set(bSpacing).size>=3,'B has varied phrasing');
  assert.ok(new Set(regularB.map(e=>e.duration)).size>=3,'B mixes held notes and pickups');
  assert.equal(events.find(e=>e.section==='B-drop').start,384*step,'drop melody enters during the fade');
  assert.ok(events.every(e=>e.guitar===true));
  assert.equal(data.length,Math.ceil(1120*step*rate),"ends at final bar without appended tail");
  const ending=data.slice(-Math.round(rate*.02));
  assert.ok(Math.sqrt(ending.reduce((sum,x)=>sum+x*x,0)/ending.length)>.04,"final chord sustains through cutoff");
  assert.ok(data.every(sample => Number.isFinite(sample) && Math.abs(sample) <= 1));
  const prelude = [];
  music.compose('tearesseract_prelude', rate, prelude);
  assert.ok(prelude.every(e=>e.guitar===false));
  assert.deepEqual(prelude.slice(0, 8).map(e => e.pitch), events.slice(0, 8).map(e => e.pitch));
});

test('phonk carries after the drop but excludes E and F',()=>{
  const fs=require('node:fs'),Module=require('node:module');
  const probe=new Module(require.resolve('../music.js'));
  const events=[];
  // Observe the rendered instrument scheduling without adding a production debug API.
  probe.__voices=events;
  const source=fs.readFileSync(require.resolve('../music.js'),'utf8').replace(
    'function voice(pitch,start,len,amp,kind, expression = {}) {',
    'function voice(pitch,start,len,amp,kind, expression = {}) { if(["bass808","cowbell","clap","hat"].includes(kind))module.__voices.push({start,kind});');
  probe._compile(source,require.resolve('../music.js'));
  probe.exports.compose('tearesseract',8000);
  const step=60/172/4;
  for(const [start,end] of [[384,512],[512,640],[640,768],[800,928]]){
    for(const kind of ['bass808','cowbell','clap','hat'])assert.ok(events.some(e=>e.kind===kind&&e.start>=start*step&&e.start<end*step));
  }
  assert.ok(events.every(e=>e.start>=384*step&&e.start<928*step&&!(e.start>=768*step&&e.start<800*step)));
});
