const {test}=require('node:test');
const assert=require('node:assert/strict');
const Lessons=require('../coin-drop-lessons.js');
const {nanogames}=require('../coin-drop.js');
test('all 60 nanogames have a specific lesson and worked example',()=>{
 const lessons=nanogames.map(Lessons.get);assert.equal(lessons.length,60);assert.equal(new Set(lessons.map(l=>l.key)).size,60);
 for(const lesson of lessons){assert.equal(lesson.steps.length,2);assert.ok(lesson.steps.every(s=>s.trim().length>0));assert.ok(lesson.example.trim().length>0,lesson.key);}
});
test('binary switches cover all four-bit numbers and Roman key is correct',()=>{
 for(let n=0;n<16;n++){const bits=n.toString(2).padStart(4,'0').split('').map(Number);assert.equal(Lessons.binaryValue(bits),n);}
 assert.deepEqual(Lessons.romanKey.map(([roman])=>roman),['I','II','III','IV','V','VI','VII','VIII','IX','X']);
 assert.deepEqual(Lessons.romanKey.map(([,value])=>Number(value)),Array.from({length:10},(_,i)=>i+1));
 assert.match(Lessons.get(nanogames.find(g=>g.id==='nano_roman')).example,/IV = 5 − 1 = 4/);
});
