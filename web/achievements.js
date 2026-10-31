"use strict";

// This model is shared by the browser UI and Node tests. Only completed wins
// count toward victory milestones; leaving a round never counts as a win.
const Achievements = (() => {
  const points = { bronze: 10, silver: 30, gold: 90 };
  const games = ["hangman", "keyboard", "dodge", "boss", "pumpkin"];
  const catalog = [];
  function add(id, title, tier, group, description, stat, target = 1) {
    catalog.push({ id, title, tier, group, description, stat, target });
  }
  add("welcome", "Welcome to Microgame Madness!", "bronze", "Arcade", "Join the arcade.", "visits");
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
  add("boss_impossible", "Impossible Is Possible", "gold", "Boss Crush", "Defeat the Impossible boss.", "boss_impossible");
  add("boss_5", "Boss of Bosses", "gold", "Boss Crush", "Win 5 Boss Crush games.", "bossWins", 5);
  add("pumpkin_baby", "Baby Steps, Big Victory", "silver", "Pumpkin King", "Defeat the Pumpkin King in Baby Mode.", "pumpkin_baby");
  add("pumpkin_coward", "Braver Than You Think", "gold", "Pumpkin King", "Defeat the Pumpkin King in Coward Mode.", "pumpkin_coward");
  add("pumpkin_phase2", "Long Live the New King", "gold", "Pumpkin King", "Defeat the Pumpkin King in Impossible Phase 2.", "pumpkin_phase2");
  add("pumpkin_3", "Crown Collector", "gold", "Pumpkin King", "Defeat the Pumpkin King 3 times in any mode.", "pumpkinWins", 3);
  const statNames = new Set(catalog.map(item => item.stat));
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
    visit() { return this.update(stats => { stats.visits = 1; }); }
    start(mode, difficulty) {
      this.round = { mode, difficulty, finished: false };
      return this.update(stats => {
        stats[`play_${mode}`] = 1;
        stats.gamesPlayed = games.filter(game => stats[`play_${game}`]).length;
      });
    }
    observe(s) {
      const round = this.round;
      if (!round || round.finished || s.mode !== round.mode || s.difficulty !== round.difficulty)
        return { earned: [], changed: false };
      if (!s.over && !["keyboard", "dodge"].includes(s.mode))
        return { earned: [], changed: false };
      return this.update(stats => {
        if (s.mode === "keyboard") stats.typingBest = Math.max(stats.typingBest, count(s.score));
        if (s.mode === "dodge") {
          stats.dodgeBest = Math.max(stats.dodgeBest, count(s.elapsed));
          if (s.difficulty === "merciless") stats.mercilessBest = Math.max(stats.mercilessBest, count(s.elapsed));
        }
        if (!s.over) return;
        round.finished = true;
        if (!s.won) return;
        if (s.mode === "hangman") {
          stats.hangmanWins++;
          if (s.difficulty === "hard") stats.hardWins++;
          if (s.mistakes === 0) stats.perfectWins++;
        } else if (s.mode === "boss" || s.mode === "pumpkin") {
          stats[`${s.mode}Wins`]++;
          const key = `${s.mode}_${s.difficulty}`;
          if (statNames.has(key)) stats[key] = 1;
        }
      });
    }
  }
  return { catalog, points, Tracker };
})();
if (typeof module !== "undefined") module.exports = Achievements;
