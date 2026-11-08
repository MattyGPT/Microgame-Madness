const { test } = require('node:test');
const assert = require('node:assert/strict');
const Customs = require('../customs.js');

test('Wild Card has 50 distinct vector symbols', () => {
  assert.equal(Customs.wildCardSymbols.length, 50);
  assert.equal(new Set(Customs.wildCardSymbols.map(([name]) => name)).size, 50);
  assert.equal(new Set(Customs.wildCardSymbols.map(([,path]) => path)).size, 50);
  assert.match(Customs.svg(Customs.catalog.find(c => c.id === 'chaos_wild')), /class="chaos-wild-card"/);
});

test('each Wild Card symbol can change to all 49 alternatives without repeating', () => {
  for (let previous = 0; previous < 50; previous++) {
    const next = Array.from({length:49}, (_,i) => Customs.nextWildCardSymbol(previous, () => (i+.5)/49));
    assert.equal(new Set(next).size, 49);
    assert.ok(next.every(n => n >= 0 && n < 50 && n !== previous));
  }
});
