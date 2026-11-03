const { test } = require('node:test');
const assert = require('node:assert/strict');
const Customs = require('../customs.js');
const { catalog: achievements } = require('../achievements.js');

test('34 distinct Customs use existing achievements and retain Cubie’s face', () => {
  assert.equal(Customs.catalog.length, 34);
  assert.equal(new Set(Customs.catalog.map(item => item.id)).size, 34);
  assert.equal(new Set(Customs.catalog.map(item => item.body + item.detail)).size, 34);
  for (const item of Customs.catalog) {
    for (const id of item.achievements) assert.ok(achievements.some(a => a.id === id), id);
    assert.match(Customs.svg(item), /class="cubie-eyes"/);
    assert.match(Customs.svg(item), /class="cubie-smile"/);
    assert.equal(Customs.unlocked(item, {}), item.id === 'classic');
    if (item.id !== 'classic') assert.ok(item.achievements.length);
  }
});

test('Pumpkin Cubie unlocks from a victory in any of the four Pumpkin modes', () => {
  const pumpkin = Customs.catalog.find(item => item.id === 'pumpkin');
  for (const id of ['pumpkin_baby', 'pumpkin_coward', 'pumpkin_phase2', 'pumpkin_come_on'])
    assert.equal(Customs.unlocked(pumpkin, { [id]: '2026-11-03' }), true);
  assert.equal(Customs.unlocked(pumpkin, { play_pumpkin: '2026-11-03', wrath_color_memory: '2026-11-03' }), false);
});

test('saved Customs are validated against earned medals', () => {
  for (const value of [null, undefined, 'missing', 'pumpkin', '__proto__'])
    assert.equal(Customs.selected(value, {}).id, 'classic');
  assert.equal(Customs.selected('pumpkin', { pumpkin_baby: '2026-11-03' }).id, 'pumpkin');
});
