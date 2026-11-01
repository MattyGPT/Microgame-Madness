"use strict";

// This model is shared by the browser UI and Node tests. Only completed wins
// count toward victory milestones; leaving a round never counts as a win.
const Achievements = (() => {
  const points = { bronze: 10, silver: 30, gold: 90, crystal: 270, diamond: 810, rainbow: 2430 };
  const games = ["hangman", "keyboard", "dodge", "boss", "pumpkin"];
  const catalog = [];
  function add(id, title, tier, group, description, stat, target = 1) {
    catalog.push({ id, title, tier, group, description, stat, target });
  }
  add("welcome", "Welcome to Microgame Madness!", "bronze", "Arcade", "Join the arcade.", "visits");
  add("dingdong", "DINGDONG", "crystal", "Arcade", "WHO YOU ARE.", "dingdong");
  add("cube_pet", "Awwwwww!", "gold", "Arcade", "Make the cube blush and squeak.", "cubePets");
  for (const [game, title, label] of [
    ["hangman", "Hang in There!", "Hangman"],
    ["keyboard", "Key to Success", "Key Rush"],
    ["dodge", "Shell We Dance?", "Turtle Dodge"],
    ["boss", "Challenge Accepted", "Boss Crush"],
    ["pumpkin", "Royal Invitation", "Pumpkin King"],
  ]) add(`play_${game}`, title, "bronze", label, `Start a ${label} game.`, `play_${game}`);
  add("sampler", "A Little of Everything", "silver", "Arcade", "Play all five games.", "gamesPlayed", 5);
  add("hangman_win", "Good Game", "silver", "Hangman", "Win a Hangman game.", "hangmanWins");
  add("hangman_hard", "You've Got the Hang of It!!", "silver", "Hangman", "Win a hard Hangman game.", "hardWins");
  add("hangman_perfect", "Letter Perfect", "silver", "Hangman", "Win Hangman without a wrong guess.", "perfectWins");
  add("hangman_last_chance", "Down to the Wire", "gold", "Hangman", "Win Hangman with only one wrong guess remaining.", "lastChanceWins");
  add("hangman_5", "Word Wizard", "gold", "Hangman", "Win 5 Hangman games.", "hangmanWins", 5);
  add("hangman_10", "Professional Prodigy", "gold", "Hangman", "Win 10 Hangman games.", "hangmanWins", 10);
  add("hangman_25", "Walking Dictionary", "gold", "Hangman", "Win 25 Hangman games.", "hangmanWins", 25);
  add("typing_1", "Warm-Up Lap", "bronze", "Key Rush", "Complete a Key Rush round.", "typingBest");
  add("typing_5", "Finding Your Rhythm", "silver", "Key Rush", "Complete 5 rounds in one Key Rush game.", "typingBest", 5);
  add("typing_10", "Keyboard Lightning", "gold", "Key Rush", "Complete 10 rounds in one Key Rush game.", "typingBest", 10);
  add("typing_20", "Speed of Type", "gold", "Key Rush", "Complete 20 rounds in one Key Rush game.", "typingBest", 20);
  add("dodge_15", "Just Keep Moving", "bronze", "Turtle Dodge", "Survive 15 seconds in Turtle Dodge.", "dodgeBest", 15);
  add("dodge_30", "Shell Shockproof", "silver", "Turtle Dodge", "Survive 30 seconds in Turtle Dodge.", "dodgeBest", 30);
  add("dodge_60", "Untouchable Turtle", "gold", "Turtle Dodge", "Survive 60 seconds in Turtle Dodge.", "dodgeBest", 60);
  add("dodge_merciless", "No Mercy Needed", "gold", "Turtle Dodge", "Survive 30 seconds on Merciless.", "mercilessBest", 30);
  add("boss_win", "Boss Buster", "silver", "Boss Crush", "Win a Boss Crush game.", "bossWins");
  add("boss_cruel", "Cruel Intentions", "silver", "Boss Crush", "Defeat the Cruel boss.", "boss_cruel");
  add("boss_nightmare", "Dream Breaker", "gold", "Boss Crush", "Defeat the Nightmare boss.", "boss_nightmare");
  add("boss_impossible", "Impossible Is Possible", "crystal", "Boss Crush", "Defeat the Impossible boss.", "boss_impossible");
  add("boss_5", "Boss of Bosses", "gold", "Boss Crush", "Win 5 Boss Crush games.", "bossWins", 5);
  add("pumpkin_baby", "Baby Steps, Big Victory", "silver", "Pumpkin King", "Defeat the Pumpkin King in Baby Mode.", "pumpkin_baby");
  add("pumpkin_coward", "Braver Than You Think", "gold", "Pumpkin King", "Defeat the Pumpkin King in Coward Mode.", "pumpkin_coward");
  add("pumpkin_phase2", "Long Live the New King", "diamond", "Pumpkin King", "Defeat the Pumpkin King in Impossible Phase 2.", "pumpkin_phase2");
  add("pumpkin_3", "Crown Collector", "gold", "Pumpkin King", "Defeat the Pumpkin King 3 times in any mode.", "pumpkinWins", 3);
  add("dodge_close", "Close One", "silver", "Turtle Dodge", "Pass close to a block, then move clear without touching it.", "closeCalls");
  add("dodge_120", "I'm Still Standing!", "crystal", "Turtle Dodge", "Survive 120 seconds in one Turtle Dodge game.", "dodgeBest", 120);
  add("pumpkin_flawless", "King of Suffering", "diamond", "Pumpkin King", "Defeat the Pumpkin King in any mode without taking a single hit. Healing does not erase damage.", "pumpkinFlawless");
  add("hangman_50", "Lexicon Legend", "crystal", "Hangman", "Win 50 Hangman games.", "hangmanWins", 50);
  add("hangman_hard_10", "Hard-Earned Words", "crystal", "Hangman", "Win 10 hard Hangman games.", "hardWins", 10);
  add("typing_30", "Keys to the Kingdom", "crystal", "Key Rush", "Complete 30 rounds in one Key Rush game.", "typingBest", 30);
  add("boss_10", "Boss Rush Royalty", "crystal", "Boss Crush", "Win 10 Boss Crush games.", "bossWins", 10);
  add("pumpkin_10", "Pumpkin Carver", "crystal", "Pumpkin King", "Defeat the Pumpkin King 10 times in any mode.", "pumpkinWins", 10);
  add("hangman_100", "Master of Every Letter", "diamond", "Hangman", "Win 100 Hangman games.", "hangmanWins", 100);
  add("hangman_perfect_25", "Flawless Vocabulary", "diamond", "Hangman", "Win 25 Hangman games without a wrong guess.", "perfectWins", 25);
  add("typing_50", "Beyond the Speed Limit", "diamond", "Key Rush", "Complete 50 rounds in one Key Rush game.", "typingBest", 50);
  add("dodge_merciless_120", "Merciless Marathon", "diamond", "Turtle Dodge", "Survive 120 seconds in one Merciless game.", "mercilessBest", 120);
  add("boss_flawless", "Untouchable Champion", "diamond", "Boss Crush", "Defeat the Impossible boss without taking a single hit. Healing does not erase damage.", "bossFlawless");
  add("dodge_360", "Gerson Boom", "rainbow", "Turtle Dodge", "Survive 360 seconds in one Turtle Dodge game.", "dodgeBest", 360);
  add("boss_mean_flawless", "Domination!", "silver", "Boss Crush", "Defeat the Mean boss without taking any damage. Healing does not erase damage.", "meanFlawless");
  add("boss_cruel_flawless", "Cruel and Unscathed", "silver", "Boss Crush", "Defeat the Cruel boss without taking any damage. Healing does not erase damage.", "cruelFlawless");
  add("boss_nightmare_flawless", "Flawless Nightmare", "crystal", "Boss Crush", "Defeat the Nightmare boss without taking any damage. Healing does not erase damage.", "nightmareFlawless");
  add("boss_clean_streak", "Untouchable Streak", "crystal", "Boss Crush", "Win 5 Boss Crush fights in a row without taking damage. Damage, losses, and abandoned fights reset the streak.", "bossCleanStreak", 5);
  add("pumpkin_full_health", "Fit for a King", "crystal", "Pumpkin King", "Defeat the Pumpkin King with full HP in any mode. Healing is allowed.", "pumpkinFullHealth");
  for (const [difficulty, title, tier] of [
    ["mean", "Mean and Pristine", "silver"], ["cruel", "Cruel and Complete", "silver"],
    ["nightmare", "Healthy Awakening", "gold"], ["impossible", "Impossible Vitality", "crystal"],
  ]) add(`boss_${difficulty}_full`, title, tier, "Boss Crush",
    `Defeat the ${difficulty[0].toUpperCase() + difficulty.slice(1)} boss with full HP. Healing is allowed, but not required.`, `boss_${difficulty}_full`);
  add("hangman_perfect_5", "Flawless Five", "gold", "Hangman", "Win 5 Hangman games without a wrong guess.", "perfectWins", 5);
  add("hangman_hard_perfect", "Perfectly Difficult", "gold", "Hangman", "Win hard Hangman without a wrong guess.", "hardPerfectWins");
  add("dodge_180", "Three-Minute Shell", "diamond", "Turtle Dodge", "Survive 180 seconds in one Turtle Dodge game.", "dodgeBest", 180);
  add("boss_25", "Arena Legend", "diamond", "Boss Crush", "Win 25 Boss Crush games.", "bossWins", 25);
  add("pumpkin_25", "Harvest Legend", "diamond", "Pumpkin King", "Defeat the Pumpkin King 25 times in any mode.", "pumpkinWins", 25);
  add("pumpkin_come_on", "First Crown", "silver", "Pumpkin King", "Defeat the Pumpkin King in Come On, Are You Really That Bad at the Game? mode.", "pumpkin_come_on");
  add("boss_clean_streak_10", "Untouchable Ten", "diamond", "Boss Crush", "Win 10 consecutive Boss Crush fights without damage. Damage, losses, and abandoned fights reset the streak.", "bossCleanStreak", 10);
  add("hangman_250", "Rainbow Lexicon", "rainbow", "Hangman", "Win 250 Hangman games.", "hangmanWins", 250);
  add("typing_75", "Spectrum Speed", "rainbow", "Key Rush", "Complete 75 rounds in one Key Rush game.", "typingBest", 75);
  add("dodge_merciless_240", "Beyond Mercy", "rainbow", "Turtle Dodge", "Survive 240 seconds in one Merciless game.", "mercilessBest", 240);
  add("boss_clean_streak_15", "Unbreakable Spectrum", "rainbow", "Boss Crush", "Win 15 consecutive Boss Crush fights without damage. Damage, losses, and abandoned fights reset the streak.", "bossCleanStreak", 15);
  add("pumpkin_flawless_5", "Sovereign of Suffering", "rainbow", "Pumpkin King", "Defeat the Pumpkin King 5 times without taking damage, in any mode. Healing does not erase damage.", "pumpkinFlawlessWins", 5);
  const statNames = new Set([...catalog.map(item => item.stat), "bossRunActive"]);
  const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;

  class Tracker {
    constructor(raw = {}) {
      this.data = { stats: {}, unlocked: {} };
      for (const key of statNames) this.data.stats[key] = count(raw?.stats?.[key]);
      for (const item of catalog) {
        const date = raw?.unlocked?.[item.id];
        if (typeof date === "string" && Number.isFinite(Date.parse(date)))
          this.data.unlocked[item.id] = date;
      }
      this.round = null;
    }
    get score() {
      // Derive totals from current tiers, so retiering updates old profiles too.
      return catalog.reduce((sum, item) => sum + (this.data.unlocked[item.id] ? points[item.tier] : 0), 0);
    }
    progress(item) { return Math.min(item.target, this.data.stats[item.stat]); }
    update(change) {
      const before = JSON.stringify(this.data);
      change(this.data.stats);
      const earned = [];
      for (const item of catalog) {
        if (!this.data.unlocked[item.id] && this.progress(item) >= item.target) {
          this.data.unlocked[item.id] = new Date().toISOString();
          earned.push(item);
        }
      }
      return { earned, changed: before !== JSON.stringify(this.data) };
    }
    visit() {
      return this.update(stats => {
        stats.visits = 1;
        // A saved unfinished Boss Crush fight was abandoned by leaving/reloading.
        if (stats.bossRunActive) stats.bossCleanStreak = 0;
        stats.bossRunActive = 0;
      });
    }
    abandon() {
      if (this.round) this.round.finished = true;
      return this.update(stats => {
        if (stats.bossRunActive) stats.bossCleanStreak = 0;
        stats.bossRunActive = 0;
      });
    }
    secret(name) {
      return this.update(stats => {
        if (name === "dingdong") stats.dingdong = 1;
        if (name === "cube") stats.cubePets = 1;
      });
    }
    start(mode, difficulty) {
      this.round = { mode, difficulty, finished: false };
      return this.update(stats => {
        if (stats.bossRunActive) stats.bossCleanStreak = 0;
        stats.bossRunActive = mode === "boss" ? 1 : 0;
        stats[`play_${mode}`] = 1;
        stats.gamesPlayed = games.filter(game => stats[`play_${game}`]).length;
      });
    }
    observe(s) {
      const round = this.round;
      if (!round || round.finished || s.mode !== round.mode || s.difficulty !== round.difficulty)
        return { earned: [], changed: false };
      const streakBroken = s.mode === "boss" && s.damage_taken > 0 && this.data.stats.bossCleanStreak > 0;
      if (!s.over && !["keyboard", "dodge"].includes(s.mode) && !streakBroken)
        return { earned: [], changed: false };
      return this.update(stats => {
        if (streakBroken) stats.bossCleanStreak = 0;
        if (s.mode === "keyboard") stats.typingBest = Math.max(stats.typingBest, count(s.score));
        if (s.mode === "dodge") {
          stats.closeCalls = Math.max(stats.closeCalls, count(s.near_misses));
          stats.dodgeBest = Math.max(stats.dodgeBest, count(s.elapsed));
          if (s.difficulty === "merciless") stats.mercilessBest = Math.max(stats.mercilessBest, count(s.elapsed));
        }
        if (!s.over) return;
        round.finished = true;
        if (s.mode === "boss") {
          stats.bossRunActive = 0;
          stats.bossCleanStreak = s.won && s.damage_taken === 0 ? stats.bossCleanStreak + 1 : 0;
        }
        if (!s.won) return;
        if (s.mode === "hangman") {
          stats.hangmanWins++;
          if (s.difficulty === "hard") stats.hardWins++;
          if (s.mistakes === 0) stats.perfectWins++;
          if (s.difficulty === "hard" && s.mistakes === 0) stats.hardPerfectWins++;
          if (s.remaining === 1) stats.lastChanceWins++;
        } else if (s.mode === "boss" || s.mode === "pumpkin") {
          stats[`${s.mode}Wins`]++;
          if (Number.isFinite(s.max_lives) && s.max_lives > 0 && s.lives === s.max_lives) {
            if (s.mode === "pumpkin") stats.pumpkinFullHealth = 1;
            else if (statNames.has(`boss_${s.difficulty}_full`)) stats[`boss_${s.difficulty}_full`] = 1;
          }
          if (s.damage_taken === 0) {
            if (s.mode === "pumpkin") {
              stats.pumpkinFlawless = 1;
              stats.pumpkinFlawlessWins++;
            }
            else if (s.difficulty === "impossible") stats.bossFlawless = 1;
            else if (s.difficulty === "mean") stats.meanFlawless = 1;
            else if (s.difficulty === "cruel") stats.cruelFlawless = 1;
            else if (s.difficulty === "nightmare") stats.nightmareFlawless = 1;
          }
          const key = `${s.mode}_${s.difficulty}`;
          if (statNames.has(key)) stats[key] = 1;
        }
      });
    }
  }
  return { catalog, points, Tracker };
})();
if (typeof module !== "undefined") module.exports = Achievements;
