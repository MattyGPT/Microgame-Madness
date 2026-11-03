"use strict";

// This model is shared by the browser UI and Node tests. Only completed wins
// count toward victory milestones; leaving a round never counts as a win.
const Achievements = (() => {
  const points = { bronze: 10, silver: 30, gold: 90, crystal: 270, diamond: 810, rainbow: 2430, empyrorite: 7290, black: 666 };
  const games = ["hangman", "keyboard", "dodge", "boss", "pumpkin"];
  const sovereignDifficulties = ["cruel", "nightmare", "impossible"];
  const wrathModes = ['color_memory', 'bone_gauntlet', 'rotating_rings', 'magenta_fingers',
    'chaos', 'royal_slams', 'haunted_quadrants', 'random_order'];
  const catalog = [];
  function add(id, title, tier, group, description, stat, target = 1, options = {}) {
    catalog.push({ id, title, tier, group, description, stat, target, ...options });
  }
  add("welcome", "Welcome to Microgame Madness!", "bronze", "Arcade", "Join the arcade.", "visits");
  add("dingdong", "DINGDONG", "crystal", "Arcade", "WHO YOU ARE.", "dingdong");
  add("name_cubie", "On a First-Name Basis", "gold", "Arcade", "Say Cubie's name in your player name.", "name_cubie");
  add("name_boo", "Boo to You Too!", "gold", "Arcade", "Give the arcade a little name-entry scare.", "name_boo");
  add("name_starlight", "Written in the Stars", "crystal", "Arcade", "Find the starry name hidden in the arcade.", "name_starlight");
  add("name_rocknroy", "Game Tester", "rainbow", "Arcade", "Turn up the arcade with ROCKNROY.", "name_rocknroy");
  add("cube_pet", "Awwwwww!", "gold", "Arcade", "Make Cubie blush and squeak.", "cubePets");
  add("cube_pet_100", "Cubie's Best Friend", "crystal", "Arcade", "Pet Cubie 100 times.", "cubePets", 100);
  for (const [game, title, label] of [
    ["hangman", "Hang in There!", "Hangman"],
    ["keyboard", "Key to Success", "Key Rush"],
    ["dodge", "Shell We Dance?", "Turtle Dodge"],
    ["boss", "Challenge Accepted", "Boss Crush"],
    ["pumpkin", "Royal Invitation", "Pumpkin King"],
  ]) add(`play_${game}`, title, "bronze", label, `Start a ${label} game.`, `play_${game}`);
  add("sampler", "A Little of Everything", "silver", "Arcade", "Play all five original games.", "gamesPlayed", 5);
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
  add("dodge_early_death", "At Least You Tried", "bronze", "Turtle Dodge", "Die in less than 5 seconds in Turtle Dodge.", "dodgeEarlyDeath");
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
  // Unicode equivalents of Wingdings M Y / A R M, repeated three times.
  // These remain symbols on devices without the Windows Wingdings font.
  add("waste_of_time", "WASTE OF TIME", "black", "Arcade",
    "💣︎✡︎ ✌︎☼💣︎ 💣︎✡︎ ✌︎☼💣︎ 💣︎✡︎ ✌︎☼💣︎", "gasterCompleted", 1,
    { secret: true, wingdings: true });
  // New achievements for the secret boss, practice game, and highest-tier challenges.
  add("name_gravitron", "Access Granted", "bronze", "Singularity Core", "Unlock Singularity Core with GRAVITRON.", "name_gravitron");
  add("play_singularity", "Into the Event Horizon", "silver", "Singularity Core", "Start a Singularity Core fight.", "play_singularity");
  for (const [index, [title, tier, protocol]] of [
    ["Railway to Nowhere", "bronze", "Railgun Array"],
    ["Outside the Spin", "silver", "Accretion Sweep"],
    ["Between Horizons", "silver", "Collapsing Horizons"],
    ["Can't Lock This", "silver", "Target Lock"],
    ["Lattice Escape", "gold", "Event Lattice"],
    ["Two Stars, One Turtle", "gold", "Binary Stars"],
    ["Gravity Dodger", "gold", "Gravity Guillotine"],
    ["Weathering the Photons", "gold", "Photon Rain"],
    ["Crossfire Specialist", "crystal", "Crossfire Engine"],
    ["Mind the Dark Matter", "crystal", "Dark Matter Mines"],
    ["Perfect Polarity", "crystal", "Polarity Inversion"],
    ["Orbit Breaker", "crystal", "Orbital Saws"],
    ["Echoes Remembered", "diamond", "Echo Protocol"],
    ["Unbroken Lens", "diamond", "Lens Fracture"],
    ["Still Here", "diamond", "Total Collapse"],
  ].entries()) add(`core_protocol_${index + 1}`, title, tier, "Singularity Core",
    `Survive protocol ${index + 1}: ${protocol}.`, "coreProtocolsBest", index + 1);
  add("core_win", "My Fingers Hurt", "rainbow", "Singularity Core", "Survive all 15 protocols and destroy Singularity Core with the final laser.", "coreWins");
  add("core_win_3", "Callus Protocol", "rainbow", "Singularity Core", "Defeat Singularity Core 3 times.", "coreWins", 3);
  add("core_win_10", "Gravity Is Optional", "rainbow", "Singularity Core", "Defeat Singularity Core 10 times.", "coreWins", 10);
  add("core_flawless", "Hands of Empyrorite", "empyrorite", "Singularity Core", "Destroy Singularity Core without taking any damage throughout the fight.", "coreFlawlessWins");
  add("core_clutch", "One Finger Left", "rainbow", "Singularity Core", "Destroy Singularity Core with exactly 1 HP remaining.", "coreClutch");
  add("core_steady", "Steady Hands", "crystal", "Singularity Core", "Survive the first 5 protocols in one fight without taking damage.", "coreCleanProtocolsBest", 5);
  add("play_wrath", "Practice Makes Panic", "bronze", "The King's Wrath", "Start a King's Wrath practice fight.", "play_wrath");
  for (const [index, [title, tier, label]] of [
    ["A Colorful Education", "silver", "Color Memory"],
    ["Bone to Pick", "silver", "Bone Gauntlet"],
    ["Ring Reader", "gold", "Rotating Rings"],
    ["Counter Culture", "gold", "Magenta Fingers"],
    ["Method in the Madness", "gold", "Chaos"],
    ["Hands Off the Crown", "gold", "Royal Slams"],
    ["Unspookable", "gold", "Haunted Quadrants"],
    ["Royal Roulette", "diamond", "Random Order"],
  ].entries()) add(`wrath_${wrathModes[index]}`, title, tier, "The King's Wrath",
    `Win a ${label} practice fight.`, `wrath_${wrathModes[index]}`);
  add("wrath_curriculum", "The Royal Curriculum", "diamond", "The King's Wrath", "Win each of the seven individual practice attacks.", "wrathLessons", 7);
  add("wrath_win_5", "Practice Paying Off", "gold", "The King's Wrath", "Win 5 practice fights, in any modes.", "wrathWins", 5);
  add("wrath_win_25", "Resident of the Throne Room", "rainbow", "The King's Wrath", "Win 25 practice fights, in any modes.", "wrathWins", 25);
  add("wrath_flawless", "Unscathed Rehearsal", "diamond", "The King's Wrath", "Win a practice fight without taking damage. Healing cannot undo a hit.", "wrathFlawlessWins");
  add("wrath_full_deck", "Full Deck", "crystal", "The King's Wrath", "Survive all seven attacks in one Random Order fight.", "wrathRandomSetsBest");
  add("wrath_three_sets", "Shuffled Survivor", "rainbow", "The King's Wrath", "Survive 21 attacks in one Random Order fight: three complete shuffled sets.", "wrathRandomSetsBest", 3);
  add("wrath_perfect_shuffle", "Chaos, Perfected", "rainbow", "The King's Wrath", "Survive a full set of seven Random Order attacks, then win without taking any damage throughout the fight.", "wrathPerfectShuffle");
  add("wrath_counter_25", "The King's Rebuttal", "crystal", "The King's Wrath", "Successfully counter 25 magenta fingers in King's Wrath. Counters accumulate across fights.", "wrathCounterHits", 25);
  add("dodge_merciless_300", "Beyond the Last Mercy", "empyrorite", "Turtle Dodge", "Survive 300 seconds in one Merciless Turtle Dodge game.", "mercilessBest", 300);
  add("boss_clean_streak_20", "Sovereign of the Arena", "empyrorite", "Boss Crush", "Win 20 consecutive Boss Crush fights on Cruel or harder without damage. Mean fights are ignored. Damage, losses, and abandoned qualifying fights reset the streak.", "bossSovereignStreak", 20);
  add("determination", "Determination", "crystal", "Arcade", "Lose 50 minigame rounds in total.", "totalLosses", 50);
  add("name_pixel", "Pixel Perfect", "gold", "Arcade", "Enter PIXEL as your arcade name.", "name_pixel");
  add("name_1up", "Extra Life Energy", "gold", "Arcade", "Enter 1UP as your arcade name.", "name_1up");
  add("name_high_score", "Name on the Leaderboard", "crystal", "Arcade", "Enter HIGH SCORE as your arcade name.", "name_high_score");
  add("hangman_hard_perfect_5", "Five-Star Vocabulary", "crystal", "Hangman", "Win 5 hard Hangman games without a wrong guess.", "hardPerfectWins", 5);
  add("hangman_last_chance_5", "Clutch Wordsmith", "crystal", "Hangman", "Win 5 Hangman games with only one wrong guess remaining.", "lastChanceWins", 5);
  add("typing_15", "Turbo Typist", "gold", "Key Rush", "Complete 15 rounds in one Key Rush game.", "typingBest", 15);
  add("dodge_90", "Shell Endurance", "gold", "Turtle Dodge", "Survive 90 seconds in one Turtle Dodge game.", "dodgeBest", 90);
  add("boss_50", "Arena All-Star", "rainbow", "Boss Crush", "Win 50 Boss Crush games.", "bossWins", 50);
  add("pumpkin_50", "Endless Harvest", "rainbow", "Pumpkin King", "Defeat the Pumpkin King 50 times in any mode.", "pumpkinWins", 50);
  add("wrath_win_10", "Royal Regular", "crystal", "The King's Wrath", "Win 10 practice fights, in any modes.", "wrathWins", 10);
  const statNames = new Set([...catalog.map(item => item.stat), "bossRunActive", "bossSovereignRunActive"]);
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
        if (stats.bossSovereignRunActive) stats.bossSovereignStreak = 0;
        stats.bossRunActive = 0;
        stats.bossSovereignRunActive = 0;
      });
    }
    abandon() {
      if (this.round) this.round.finished = true;
      return this.update(stats => {
        if (stats.bossRunActive) stats.bossCleanStreak = 0;
        if (stats.bossSovereignRunActive) stats.bossSovereignStreak = 0;
        stats.bossRunActive = 0;
        stats.bossSovereignRunActive = 0;
      });
    }
    secret(name) {
      return this.update(stats => {
        if (name === "dingdong") stats.dingdong = 1;
        if (name === "cube") stats.cubePets++;
        if (["cubie", "boo", "starlight", "rocknroy", "pixel", "1up"].includes(name)) stats[`name_${name}`] = 1;
        if (name === "high score") stats.name_high_score = 1;
        if (name === "gravitron") stats.name_gravitron = 1;
      });
    }
    completeGaster() {
      return this.update(stats => { stats.gasterCompleted = 1; });
    }
    start(mode, difficulty) {
      this.round = { mode, difficulty, finished: false, counterHits: 0 };
      return this.update(stats => {
        if (stats.bossRunActive) stats.bossCleanStreak = 0;
        if (stats.bossSovereignRunActive) stats.bossSovereignStreak = 0;
        stats.bossRunActive = mode === "boss" ? 1 : 0;
        stats.bossSovereignRunActive = mode === "boss" && sovereignDifficulties.includes(difficulty) ? 1 : 0;
        stats[`play_${mode}`] = 1;
        stats.gamesPlayed = games.filter(game => stats[`play_${game}`]).length;
      });
    }
    observe(s) {
      const round = this.round;
      if (!round || round.finished || s.mode !== round.mode || s.difficulty !== round.difficulty)
        return { earned: [], changed: false };
      const streakBroken = s.mode === "boss" && s.damage_taken > 0 && this.data.stats.bossCleanStreak > 0;
      const sovereignFight = s.mode === "boss" && sovereignDifficulties.includes(s.difficulty);
      const sovereignBroken = sovereignFight && s.damage_taken > 0 && this.data.stats.bossSovereignStreak > 0;
      const core = s.mode === "singularity" && s.difficulty === "gravitron";
      const wrath = s.mode === "wrath" && wrathModes.includes(s.difficulty);
      const protocols = Math.min(15, count(s.attacks_completed));
      const randomSets = wrath && s.difficulty === "random_order" ? Math.floor(count(s.attacks_completed) / 7) : 0;
      const counters = wrath ? Math.max(0, count(s.counter_hits) - round.counterHits) : 0;
      const newCoreProgress = core && (protocols > this.data.stats.coreProtocolsBest ||
        s.damage_taken === 0 && protocols > this.data.stats.coreCleanProtocolsBest);
      const newWrathProgress = wrath && (counters > 0 || randomSets > this.data.stats.wrathRandomSetsBest);
      if (!s.over && !["keyboard", "dodge"].includes(s.mode) && !streakBroken && !sovereignBroken && !newCoreProgress && !newWrathProgress)
        return { earned: [], changed: false };
      return this.update(stats => {
        if (streakBroken) stats.bossCleanStreak = 0;
        if (sovereignBroken) stats.bossSovereignStreak = 0;
        if (core) {
          stats.coreProtocolsBest = Math.max(stats.coreProtocolsBest, protocols);
          if (s.damage_taken === 0) stats.coreCleanProtocolsBest = Math.max(stats.coreCleanProtocolsBest, protocols);
        }
        if (wrath) {
          stats.wrathRandomSetsBest = Math.max(stats.wrathRandomSetsBest, randomSets);
          stats.wrathCounterHits += counters;
          round.counterHits = Math.max(round.counterHits, count(s.counter_hits));
        }
        if (s.mode === "keyboard") stats.typingBest = Math.max(stats.typingBest, count(s.score));
        if (s.mode === "dodge") {
          if (s.over === true && s.won === false && Number.isFinite(s.elapsed)
              && s.elapsed >= 0 && s.elapsed < 5) stats.dodgeEarlyDeath = 1;
          stats.closeCalls = Math.max(stats.closeCalls, count(s.near_misses));
          stats.dodgeBest = Math.max(stats.dodgeBest, count(s.elapsed));
          if (s.difficulty === "merciless") stats.mercilessBest = Math.max(stats.mercilessBest, count(s.elapsed));
        }
        if (!s.over) return;
        round.finished = true;
        if (s.over === true && s.won === false && (games.includes(s.mode) || core || wrath))
          stats.totalLosses++;
        if (s.mode === "boss") {
          stats.bossRunActive = 0;
          stats.bossCleanStreak = s.won && s.damage_taken === 0 ? stats.bossCleanStreak + 1 : 0;
          stats.bossSovereignRunActive = 0;
          if (sovereignFight)
            stats.bossSovereignStreak = s.won && s.damage_taken === 0 ? stats.bossSovereignStreak + 1 : 0;
        }
        if (!s.won) return;
        if (core && s.attacks_completed === 15 && s.hp === 0 && s.shielded === false) {
          stats.coreWins++;
          if (s.damage_taken === 0) stats.coreFlawlessWins++;
          if (s.lives === 1) stats.coreClutch = 1;
        }
        if (wrath) {
          stats.wrathWins++;
          stats[`wrath_${s.difficulty}`] = 1;
          stats.wrathLessons = wrathModes.slice(0, 7).filter(mode => stats[`wrath_${mode}`] > 0).length;
          if (s.damage_taken === 0) {
            stats.wrathFlawlessWins++;
            if (randomSets >= 1) stats.wrathPerfectShuffle = 1;
          }
        }
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
