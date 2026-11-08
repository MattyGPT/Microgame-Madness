"use strict";

const GeomayhemProgress = (() => {
  const arenaCount = 20;
  const keyPrefix = 'microgame-madness.geomayhem.v1:';
  const upgrades = {
    vitality: { name: 'Reinforced Cubie', description: '+10 starting health per tier' },
    power: { name: 'Prism Forge', description: '+5% weapon damage per tier' },
    magnet: { name: 'Crystal Compass', description: '+12 XP pickup range per tier' },
  };
  const integer = (value, max) => Number.isSafeInteger(value) ? Math.max(0, Math.min(max, value)) : 0;
  function restore(value = {}) {
    value = value && typeof value === 'object' ? value : {};
    return { version: 1, cleared: integer(value.cleared, arenaCount), shards: integer(value.shards, 100000000),
      runs: integer(value.runs, 100000000),
      best: Object.fromEntries(Array.from({ length: arenaCount }, (_, i) => [i + 1, integer(value.best?.[i + 1], 20)])),
      workshop: Object.fromEntries(Object.keys(upgrades).map(key => [key, integer(value.workshop?.[key], 3)])),
      finished: Array.isArray(value.finished) ? value.finished.filter(id => typeof id === 'string').slice(-100) : [] };
  }
  function unlocked(state, level) { return Number.isInteger(level) && level >= 1 && level <= Math.min(arenaCount, state.cleared + 1); }
  function starterRequirement(index) { return Math.floor(index / 5); }
  function cost(state, key) { return [30, 120, 240][state.workshop[key]] || 0; }
  function requiredClear(state, key) { return [1, 4, 8][state.workshop[key]] || 0; }
  function finish(value, id, run) {
    const state = restore(value);
    if (!id || state.finished.includes(id) || run?.mode !== 'geomayhem' || !unlocked(state, run.level))
      return { state, reward: 0, firstClear: false };
    const waves = integer(run.cleared, 20);
    const won = run.over === true && run.won === true && waves === 20;
    const firstClear = won && run.level === state.cleared + 1;
    const reward = waves * 2 + Math.floor(integer(run.kills, 5000) / 10) + (won ? 20 : 0) + (firstClear ? 40 : 0);
    state.shards += reward;
    state.runs += 1;
    state.best[run.level] = Math.max(state.best[run.level], waves);
    if (firstClear) state.cleared = run.level;
    state.finished.push(id);
    state.finished = state.finished.slice(-100);
    return { state, reward, firstClear };
  }
  function purchase(value, key) {
    const state = restore(value);
    if (!Object.hasOwn(upgrades, key) || state.workshop[key] >= 3 || state.shards < cost(state, key)
        || state.cleared < requiredClear(state, key)) return state;
    state.shards -= cost(state, key);
    state.workshop[key] += 1;
    return state;
  }
  class Store {
    constructor(owner, storage) {
      this.owner = owner || 'guest';
      this.key = keyPrefix + this.owner;
      this.storage = storage;
      this.available = true;
      this.memory = restore();
      this.read();
    }
    read() {
      if (!this.available) return this.memory;
      try { this.memory = restore(JSON.parse(this.storage.getItem(this.key) || 'null')); }
      catch { this.available = false; }
      return this.memory;
    }
    write(state) {
      this.memory = restore(state);
      try { this.storage.setItem(this.key, JSON.stringify(this.memory)); }
      catch { this.available = false; }
      return this.memory;
    }
    finish(id, run) {
      const result = finish(this.read(), id, run);
      this.write(result.state);
      return result;
    }
    purchase(key) { return this.write(purchase(this.read(), key)); }
  }
  return { arenaCount, Store, restore, finish, purchase, unlocked, starterRequirement, cost, requiredClear, upgrades, keyPrefix };
})();
if (typeof module !== 'undefined') module.exports = GeomayhemProgress;
