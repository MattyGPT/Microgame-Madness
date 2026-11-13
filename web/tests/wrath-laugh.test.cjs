const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('Hard Wrath laugh is bounded, cached, and cleans up its audio source', () => {
  const app = fs.readFileSync('web/app.js', 'utf8');
  const source = app.slice(app.indexOf('let wrathMonsterLaughBuffer;'), app.indexOf('function startGasterSequence()'));
  let allocations = 0;
  const played = [];
  const context = {
    soundOn: true, gasterActive: false, selected: 'wrath', selectedDifficulty: 'rotating_rings__hard',
    audioMaster: {}, soundEffects: new Set(),
    audioContext: {
      sampleRate: 24000,
      createBuffer(channels, length, sampleRate) {
        allocations++;
        const data = new Float32Array(length);
        return { sampleRate, getChannelData: () => data };
      },
      createBufferSource() {
        const node = { connect() {}, disconnect() { this.disconnected = true; }, start() { played.push(this); } };
        return node;
      },
    },
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  vm.runInContext('playSound("boss_laugh")', context);
  assert.equal(played.length, 1);
  const data = played[0].buffer.getChannelData(0);
  assert.equal(data.length, 75600);
  assert.ok(data.every(value => Number.isFinite(value) && Math.abs(value) < 1));
  assert.ok(data.some(value => Math.abs(value) > .1));
  assert.equal(context.soundEffects.size, 1);
  played[0].onended();
  assert.equal(context.soundEffects.size, 0);
  assert.equal(played[0].disconnected, true);
  vm.runInContext('playSound("boss_laugh")', context);
  assert.equal(allocations, 1);
  context.soundOn = false;
  vm.runInContext('playSound("boss_laugh")', context);
  assert.equal(played.length, 2);
});
