const { test } = require('node:test');
const assert = require('node:assert/strict');
const Shop = require('../shop.js');
const Customs = require('../customs.js');

test('game scales normalize scores and harder modes earn more', () => {
  for (const [mode, difficulty, score, cash] of [['hangman', 'easy', 10, 40], ['keyboard', 'progressive', 10, 40], ['pumpkin', 'come_on', 1000, 10], ['dodge', 'easy', 10000, 120]]) {
    const wallet = Shop.restore(null, Customs.catalog);
    Shop.reward(wallet, mode, difficulty, score);
    assert.equal(Shop.balance(wallet), cash);
  }
  const wallet = Shop.restore(null, Customs.catalog);
  Shop.reward(wallet, 'hangman', 'hard', 5);
  assert.equal(Shop.balance(wallet), 60);
  Shop.reward(wallet, 'dodge', 'merciless', 10000);
  assert.equal(Shop.balance(wallet), 660);
});

test('fractional earnings persist; invalid scores and temporary modes earn nothing', () => {
  let wallet = Shop.restore(null, Customs.catalog);
  Shop.reward(wallet, 'dodge', 'easy', 124);
  wallet = Shop.restore(JSON.parse(JSON.stringify(wallet)), Customs.catalog);
  Shop.reward(wallet, 'dodge', 'easy', 126);
  assert.equal(Shop.balance(wallet), 3);
  for (const score of [-1, Infinity, NaN, '100', 1.5]) assert.equal(Shop.reward(wallet, 'hangman', 'easy', score), 0);
  assert.equal(Shop.reward(wallet, 'core_practice', 'chaos', 10000), 0);
  assert.equal(Shop.reward(wallet, 'dodge', '__proto__', 10000), 0);
  assert.equal(wallet.units, 3000);
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
  assert.equal(Customs.catalog.filter(c => c.price).length, 52);
});

test('original shop prices increase tenfold without removing existing ownership', () => {
  const prices = [150, 200, 250, 300, 400, 450, 600, 700, 850, 1000, 1300, 1800];
  const items = Customs.catalog.filter(c => c.price);
  assert.deepEqual(items.slice(0, 12).map(c => c.price), prices);
  const wallet = Shop.restore({ units: 0, owned: ['shop_blue_mint'] }, Customs.catalog);
  assert.equal(Customs.selected('shop_blue_mint', {}, wallet.owned).id, 'shop_blue_mint');
  assert.equal(new Set(items.map(c => c.detail)).size, 52);
  assert.equal(new Set(items.map(c => c.flavor)).size, 52);
});

test('Hacker Cubie costs exactly 4000 Cash and keeps purchased ownership', () => {
  const item = Customs.catalog.find(c => c.id === 'shop_hacker');
  assert.equal(item.price, 4000);
  assert.equal(item.tier, 'empyrorite');
  const wallet = Shop.restore({ units: 3999999 }, Customs.catalog);
  assert.equal(Shop.buy(wallet, item), false);
  assert.equal(Customs.selected(item.id, {}, wallet.owned).id, 'classic');
  wallet.units++;
  assert.equal(Shop.buy(wallet, item), true);
  assert.equal(wallet.units, 0);
  const restored = Shop.restore(JSON.parse(JSON.stringify(wallet)), Customs.catalog);
  assert.equal(Customs.selected(item.id, {}, restored.owned).id, item.id);
});

test('Space Junk Cubie costs 1230 Cash and purchased equipment persists', () => {
  const item = Customs.catalog.find(c => c.id === 'shop_space_junk');
  assert.equal(item.price, 1230);
  const wallet = Shop.restore({ units: 1229999 }, Customs.catalog);
  assert.equal(Shop.buy(wallet, item), false);
  wallet.units++;
  assert.equal(Shop.buy(wallet, item), true);
  assert.equal(wallet.units, 0);
  const restored = Shop.restore(JSON.parse(JSON.stringify(wallet)), Customs.catalog);
  assert.equal(Customs.selected(item.id, {}, restored.owned).id, item.id);
});
