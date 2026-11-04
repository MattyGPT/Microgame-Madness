const { test } = require('node:test');
const assert = require('node:assert/strict');
const Shop = require('../shop.js');
const Customs = require('../customs.js');

test('game scales normalize scores and harder modes earn more', () => {
  for (const [mode, difficulty, score] of [['hangman', 'easy', 10], ['keyboard', 'progressive', 10], ['pumpkin', 'come_on', 1000], ['dodge', 'easy', 10000]]) {
    const wallet = Shop.restore(null, Customs.catalog);
    Shop.reward(wallet, mode, difficulty, score);
    assert.equal(Shop.balance(wallet), 10);
  }
  const wallet = Shop.restore(null, Customs.catalog);
  Shop.reward(wallet, 'hangman', 'hard', 5);
  assert.equal(Shop.balance(wallet), 15);
  Shop.reward(wallet, 'dodge', 'merciless', 10000);
  assert.equal(Shop.balance(wallet), 65);
});

test('fractional earnings persist; invalid scores and temporary modes earn nothing', () => {
  let wallet = Shop.restore(null, Customs.catalog);
  Shop.reward(wallet, 'dodge', 'easy', 499);
  wallet = Shop.restore(JSON.parse(JSON.stringify(wallet)), Customs.catalog);
  Shop.reward(wallet, 'dodge', 'easy', 501);
  assert.equal(Shop.balance(wallet), 1);
  for (const score of [-1, Infinity, NaN, '100', 1.5]) assert.equal(Shop.reward(wallet, 'hangman', 'easy', score), 0);
  assert.equal(Shop.reward(wallet, 'core_practice', 'chaos', 10000), 0);
  assert.equal(Shop.reward(wallet, 'dodge', '__proto__', 10000), 0);
  assert.equal(wallet.units, 1000);
});

test('purchases deduct exactly once, persist ownership, and gate equipment', () => {
  const item = Customs.catalog.find(c => c.price);
  const wallet = Shop.restore(null, Customs.catalog);
  assert.equal(Shop.buy(wallet, item), false);
  assert.equal(Customs.selected(item.id, {}, wallet.owned).id, 'classic');
  wallet.units = item.price * 1000 + 123;
  assert.equal(Shop.buy(wallet, item), true);
  assert.equal(wallet.units, 123);
  assert.equal(Shop.buy(wallet, item), false);
  const restored = Shop.restore(JSON.parse(JSON.stringify(wallet)), Customs.catalog);
  assert.equal(Customs.selected(item.id, {}, restored.owned).id, item.id);
  assert.deepEqual(Shop.restore({ units: -1, owned: ['gaster', item.id, item.id, '__proto__'] }, Customs.catalog), { units: 0, owned: [item.id] });
  assert.equal(Customs.catalog.filter(c => c.price).length, 12);
});
