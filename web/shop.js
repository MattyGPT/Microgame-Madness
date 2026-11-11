"use strict";
const CubieShop = (() => {
  // 1,000 wallet units = 1 Cash. Integer units retain fractional earnings.
  const rates = {
    hangman: { base: 400, modes: { easy: 1, medium: 2, hard: 3 } },
    keyboard: { base: 400, modes: { progressive: 1 } },
    dodge: { base: 1.2, modes: { easy: 1, normal: 2, hard: 3, merciless: 5, impossible: 6, chaos: 2 } },
    boss: { base: 1, modes: { mean: 1, cruel: 2, nightmare: 3, impossible: 5 } },
    pumpkin: { base: 1, modes: { come_on: 1, baby: 2, coward: 3, phase2: 5 } },
    wrath: { base: 1, modes: { color_memory: 1, bone_gauntlet: 1, rotating_rings: 1, magenta_fingers: 1, chaos: 1, royal_slams: 1, haunted_quadrants: 1, random_order: 1 } },
    singularity: { base: .1, modes: { gravitron: 3 } },
  };
  for (const attack of Object.keys(rates.wrath.modes)) {
    rates.wrath.modes[`${attack}__easy`] = .5;
    rates.wrath.modes[`${attack}__hard`] = 2;
  }
  const limit = Number.MAX_SAFE_INTEGER;
  function restore(raw, catalog) {
    return {
      units: Number.isSafeInteger(raw?.units) && raw.units >= 0 ? raw.units : 0,
      owned: [...new Set(Array.isArray(raw?.owned) ? raw.owned.filter(id => catalog.some(c => c.price && c.id === id)) : [])],
    };
  }
  function reward(wallet, mode, difficulty, score) {
    const rate = Object.hasOwn(rates, mode) ? rates[mode] : null;
    if (!rate || !Object.hasOwn(rate.modes, difficulty) || !Number.isSafeInteger(score) || score <= 0) return 0;
    const units = Math.min(limit - wallet.units, Math.floor(score * (rate.base * 10) * rate.modes[difficulty]));
    wallet.units += units;
    return units;
  }
  function buy(wallet, item) {
    if (!item || !Number.isSafeInteger(item.price) || item.price <= 0 || wallet.owned.includes(item.id) || wallet.units < item.price * 1000) return false;
    wallet.units -= item.price * 1000;
    wallet.owned.push(item.id);
    return true;
  }
  return { rates, restore, reward, buy, balance: wallet => Math.floor(wallet.units / 1000) };
})();
if (typeof module !== "undefined") module.exports = CubieShop;

// Portable catalog access for the shared browser/server account rules.
if (typeof globalThis !== "undefined") globalThis.CubieShop = CubieShop;
