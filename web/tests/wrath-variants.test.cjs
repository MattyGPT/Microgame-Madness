const {test} = require('node:test');
const assert = require('node:assert/strict');
const Shop = require('../shop.js');
const Leaderboards = require('../leaderboards.js');
const Rules = require('../../shared/account-rules.js');
test('each Wrath variant has matching global and cash weights and survives account import', () => {
  for (const attack of ['color_memory','bone_gauntlet','rotating_rings','magenta_fingers','chaos','royal_slams','haunted_quadrants','starfall_verdict', 'pendulum_court', 'crown_chess', 'mirror_lances', 'briar_pursuit', 'eclipse_waltz', 'resonant_bells', 'royal_loom','random_order']) {
    for (const [suffix, multiplier] of [['__easy',.5],['',1],['__hard',2]]) {
      const difficulty = attack+suffix;
      assert.equal(Leaderboards.valid({mode:'wrath',difficulty,player:'Tester',score:100}),true);
      assert.equal(Leaderboards.multipliers.wrath[difficulty],multiplier);
      assert.equal(Shop.reward({units:0},'wrath',difficulty,100),1000*multiplier);
      const key = `wrath:${difficulty}`;
      const clean = Rules.sanitizeLegacy({scores:{[key]:[{player:'Tester',score:100}]}});
      assert.equal(clean.scores[key][0].score,100);
    }
  }
});
