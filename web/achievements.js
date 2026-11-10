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
  add("healing_20", "Sweet Recovery", "silver", "Arcade", "Collect 20 healing items in total across fights and Core attack practice.", "healingItems", 20);
  add("website_10_hours", "The Party Never Stops", "empyrorite", "Arcade", "Spend 10 hours total on the website across visits (36,000 seconds).", "websiteSeconds", 36000);
  add("website_5_hours", "All Aboard!", "rainbow", "Arcade", "Spend 5 hours total on the website across visits (18,000 seconds).", "websiteSeconds", 18000);
  add("cube_pet_500", "A New Dimension", "diamond", "Arcade", "Click Cubie 500 times in total.", "cubePets", 500);
  add("cube_pet_1000", "Five Thousand Little Hugs", "empyrorite", "Arcade", "Pet Cubie 5,000 times.", "cubePets", 5000);
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
  add("pumpkin_flawless_10", "Beyond the Phantom Crown", "empyrorite", "Pumpkin King", "Defeat the Pumpkin King 10 times without taking a hit, in any mode. Healing does not erase damage.", "pumpkinFlawlessWins", 10);
  add("hangman_perfect_100", "The Living Grimoire", "empyrorite", "Hangman", "Win 100 Hangman games without a wrong guess.", "perfectWins", 100);
  add("typing_100", "Thunder at Your Fingertips", "empyrorite", "Key Rush", "Complete 100 rounds in one Key Rush game.", "typingBest", 100);
  add("boss_100", "Heart of the Celestial Forge", "empyrorite", "Boss Crush", "Win 350 Boss Crush games.", "bossWins", 350);
  add("dodge_merciless_420", "Seven Minutes Below Infinity", "empyrorite", "Turtle Dodge", "Survive 420 seconds in one Merciless Turtle Dodge game.", "mercilessBest", 420);
  // Unicode equivalents of Wingdings M Y / A R M, repeated three times.
  // These remain symbols on devices without the Windows Wingdings font.
  add("waste_of_time", "WASTE OF TIME", "black", "Arcade",
    "💣︎✡︎ ✌︎☼💣︎ 💣︎✡︎ ✌︎☼💣︎ 💣︎✡︎ ✌︎☼💣︎", "gasterCompleted", 1,
    { secret: true, wingdings: true });
  // New achievements for the secret boss, practice game, and highest-tier challenges.
  add("santa_song", "A Very Cubie Christmas", "gold", "Arcade", "Listen to Snowfall at the Arcade to unlock Santa Cubie.", "christmasHeard");
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
  // More entry-level milestones make the twenty-bronze collection attainable.
  add("hangman_win_2", "Another Word", "bronze", "Hangman", "Win 2 Hangman games.", "hangmanWins", 2);
  add("typing_3", "Three-Key Rhythm", "bronze", "Key Rush", "Complete 3 rounds in one Key Rush game.", "typingBest", 3);
  add("dodge_10", "First Ten Seconds", "bronze", "Turtle Dodge", "Survive 10 seconds in one Turtle Dodge game.", "dodgeBest", 10);
  add("cube_pet_10", "Getting Acquainted", "bronze", "Arcade", "Pet Cubie 10 times.", "cubePets", 10);
  add("boss_win_2", "Back for Seconds", "bronze", "Boss Crush", "Win 2 Boss Crush games.", "bossWins", 2);
  add("pumpkin_win_2", "Second Harvest", "bronze", "Pumpkin King", "Defeat the Pumpkin King 2 times in any mode.", "pumpkinWins", 2);
  add("wrath_counter_1", "A Royal Reply", "bronze", "The King's Wrath", "Successfully counter a magenta finger in King's Wrath.", "wrathCounterHits");
  add("dodge_merciless_15", "A Little Less Mercy", "bronze", "Turtle Dodge", "Survive 15 seconds in one Merciless game.", "mercilessBest", 15);
  add("hangman_win_3", "Third Word's the Charm", "bronze", "Hangman", "Win 3 Hangman games.", "hangmanWins", 3);
  add("hangman_hard_3", "Taking the Hard Way", "bronze", "Hangman", "Win 3 hard Hangman games.", "hardWins", 3);
  add("hangman_perfect_3", "Clean Spelling", "bronze", "Hangman", "Win 3 Hangman games without a wrong guess.", "perfectWins", 3);
  add("typing_2", "Double Tap", "bronze", "Key Rush", "Complete 2 rounds in one Key Rush game.", "typingBest", 2);
  add("dodge_20", "Twenty-Second Turtle", "bronze", "Turtle Dodge", "Survive 20 seconds in one Turtle Dodge game.", "dodgeBest", 20);
  add("cube_pet_25", "Quarter-Century Cuddles", "bronze", "Arcade", "Pet Cubie 25 times.", "cubePets", 25);
  add("wrath_win_2", "Second Rehearsal", "bronze", "The King's Wrath", "Win 2 practice fights, in any modes.", "wrathWins", 2);
  add("dodge_close_3", "Three Close Shaves", "bronze", "Turtle Dodge", "Make 3 close calls in one Turtle Dodge game without touching the nearby blocks.", "closeCalls", 3);
  add("typing_4", "Four on the Floor", "bronze", "Key Rush", "Complete 4 rounds in one Key Rush game.", "typingBest", 4);
  add("hangman_hard_5", "Tough Words", "silver", "Hangman", "Win 5 hard Hangman games.", "hardWins", 5);
  add("dodge_close_10", "Thread the Shell", "gold", "Turtle Dodge", "Make 10 close calls in one Turtle Dodge game without touching the nearby blocks.", "closeCalls", 10);
  add("hangman_perfect_10", "Ten out of Ten", "crystal", "Hangman", "Win 10 Hangman games without a wrong guess.", "perfectWins", 10);
  add("hangman_hard_perfect_15", "Precision Dictionary", "diamond", "Hangman", "Win 15 hard Hangman games without a wrong guess.", "hardPerfectWins", 15);
  add("wrath_counter_100", "Return to Sender", "rainbow", "The King's Wrath", "Successfully counter 100 magenta fingers in King's Wrath. Counters accumulate across fights.", "wrathCounterHits", 100);
  add("core_flawless_3", "Perfect Gravity", "empyrorite", "Singularity Core", "Destroy Singularity Core 3 times without taking any damage. Each victory must be flawless.", "coreFlawlessWins", 3);
  // Unicode Wingdings equivalents of RUNRUNRUNRUNRUN, matching the Gaster symbols above.
  add("gaster_remix", "Signal Recognized", "black", "Arcade",
    "☼🕆☠︎☼🕆☠︎☼🕆☠︎☼🕆☠︎☼🕆☠︎", "gasterRemixHeard", 1, { wingdings: true });
  const attackRewards = [];
  for (const [family, target, group, entries] of [
    ['pumpkin', 10, 'Pumpkin King', [
      ['color_memory', 'Color Memory', 'Color Connoisseur', 'gold', 'Prism Cubie'],
      ['bone_gauntlet', 'Bone Gauntlet', 'Bone Veteran', 'gold', 'Bonekeeper Cubie'],
      ['rotating_rings', 'Rotating Rings', 'Ring Regular', 'gold', 'Ringmaster Cubie'],
      ['magenta_fingers', 'Magenta Fingers', 'Hands Off, Again!', 'gold', 'Counter Cubie'],
      ['chaos', 'Chaos', 'Calm in the Chaos', 'gold', 'Chaos Cubie'],
      ['royal_slams', 'Royal Slams', 'Ten Royal Rebounds', 'gold', 'Royal Guard Cubie'],
      ['haunted_quadrants', 'Haunted Quadrants', 'Unhauntable', 'gold', 'Haunted Cubie'],
    ]],
    ['core', 3, 'Singularity Core', [
      ['railgun_array', 'Railgun Array', 'Off the Rails', 'silver', 'Railgun Cubie'],
      ['accretion_sweep', 'Accretion Sweep', 'Sweep Specialist', 'silver', 'Accretion Cubie'],
      ['collapsing_horizons', 'Collapsing Horizons', 'Beyond the Horizon', 'silver', 'Horizon Cubie'],
      ['target_lock', 'Target Lock', 'Lock Breaker', 'silver', 'Target Cubie'],
      ['event_lattice', 'Event Lattice', 'Grid Graduate', 'gold', 'Lattice Cubie'],
      ['binary_stars', 'Binary Stars', 'Double-Star Survivor', 'gold', 'Binary Cubie'],
      ['gravity_guillotine', 'Gravity Guillotine', 'A Cut Above', 'gold', 'Guillotine Cubie'],
      ['photon_rain', 'Photon Rain', 'Light Shower', 'gold', 'Photon Cubie'],
      ['crossfire_engine', 'Crossfire Engine', 'Crossfire Certified', 'crystal', 'Crossfire Cubie'],
      ['dark_matter_mines', 'Dark Matter Mines', 'Mind the Mines', 'crystal', 'Dark Matter Cubie'],
      ['polarity_inversion', 'Polarity Inversion', 'Positive Outlook', 'crystal', 'Polarity Cubie'],
      ['orbital_saws', 'Orbital Saws', 'Saw It Coming', 'crystal', 'Sawblade Cubie'],
      ['echo_protocol', 'Echo Protocol', 'Third Echo', 'diamond', 'Echo Cubie'],
      ['lens_fracture', 'Lens Fracture', 'Through the Looking Glass', 'diamond', 'Prismatic Lens Cubie'],
      ['total_collapse', 'Total Collapse', 'Still Standing, Three Times', 'diamond', 'Collapse Cubie'],
    ]],
  ]) entries.forEach(([key, attack, title, tier, customName], index) => {
    const id = `survive_${family}_${key}`;
    add(id, title, tier, group, `Survive ${attack} ${target} times.` +
      (family === 'pumpkin' ? " Counts across Pumpkin King and The King's Wrath." : ''), id, target);
    attackRewards.push({ id, family, index, key, attack, target, customName });
  });
  add("cube_pet_5", "High Five, Cubie!", "bronze", "Arcade", "Pet Cubie 5 times.", "cubePets", 5);
  add("dodge_5", "Finding Your Feet", "bronze", "Turtle Dodge", "Survive 5 seconds in one Turtle Dodge game.", "dodgeBest", 5);
  add("wrath_counter_3", "Three Royal Replies", "bronze", "The King's Wrath", "Successfully counter 3 magenta fingers across King's Wrath fights.", "wrathCounterHits", 3);
  add("hangman_hard_2", "Double Difficulty", "bronze", "Hangman", "Win 2 hard Hangman games.", "hardWins", 2);
  add("hangman_win_4", "Four Words Forward", "bronze", "Hangman", "Win 4 Hangman games.", "hangmanWins", 4);
  add("hangman_win_7", "Lucky Letters", "silver", "Hangman", "Win 7 Hangman games.", "hangmanWins", 7);
  add("hangman_perfect_4", "Spotless Spelling", "silver", "Hangman", "Win 4 Hangman games without a wrong guess.", "perfectWins", 4);
  add("typing_7", "Seven-Key Stride", "silver", "Key Rush", "Complete 7 rounds in one Key Rush game.", "typingBest", 7);
  add("dodge_45", "Three-Quarter Minute", "silver", "Turtle Dodge", "Survive 45 seconds in one Turtle Dodge game.", "dodgeBest", 45);
  add("dodge_merciless_20", "Mercy Can Wait", "silver", "Turtle Dodge", "Survive 20 seconds in one Merciless Turtle Dodge game.", "mercilessBest", 20);
  add("dodge_close_5", "Narrow Escapes", "silver", "Turtle Dodge", "Make 5 close calls in one Turtle Dodge game without touching the nearby blocks.", "closeCalls", 5);
  add("cube_pet_50", "Fifty Little Squeaks", "silver", "Arcade", "Pet Cubie 50 times.", "cubePets", 50);
  add("boss_win_3", "Triple Trouble", "silver", "Boss Crush", "Win 3 Boss Crush games.", "bossWins", 3);
  add("wrath_win_3", "Third Rehearsal", "silver", "The King's Wrath", "Win 3 King's Wrath practice fights, in any modes.", "wrathWins", 3);
  add("wrath_counter_10", "Talk to the Hand", "silver", "The King's Wrath", "Successfully counter 10 magenta fingers across King's Wrath fights.", "wrathCounterHits", 10);
  add("name_codexisthebest", "Code to the Rainbow", "rainbow", "Arcade", "Enter CODEXISTHEBEST as your arcade name to unlock Codex Cubie.", "name_codexisthebest");
  add("pumpkin_merciful", "Mercy for the King", "rainbow", "Pumpkin King", "Survive 5 minutes in one Pumpkin King fight without firing a single shot, in any mode.", "pumpkinMercifulBest", 300);
  add("pumpkin_speedrunner", "Beat the Clock", "diamond", "Pumpkin King", "Defeat the Pumpkin King in 70 seconds or less, in any mode.", "pumpkinSpeedrun");
  add("magenta_counter_100", "The Golden Hand", "rainbow", "Pumpkin King", "Counter 100 magenta fingers across Pumpkin King and King's Wrath fights.", "magentaCounterHits", 100);
  add("arcade_deaths_10", "Back with a Hiss", "silver", "Arcade", "Die 10 times across Turtle Dodge, Boss Crush, Pumpkin King, King's Wrath, or Singularity Core (including Core practice).", "arcadeDeaths", 10);
  add("dodge_square_deaths_50", "Square One Again", "gold", "Turtle Dodge", "Die to the square O block 50 times across Easy, Normal, Hard, or Merciless. This is the normally yellow piece; Merciless recolors it red.", "dodgeSquareDeaths", 50);
  for (const [seconds, title, tier] of [
    [15, "Into the Whiteout", "silver"], [30, "White-Knuckle Dodge", "gold"],
    [60, "Ride the Slipstream", "diamond"], [120, "Absolute Zero Fear", "rainbow"],
    [180, "Beyond Impossible", "empyrorite"],
  ]) add(`dodge_impossible_${seconds}`, title, tier, "Turtle Dodge",
    `Survive ${seconds} seconds in one Impossible Turtle Dodge game.`, "impossibleBest", seconds);
  add("chaos_start", "Welcome to the Whirl", "bronze", "Turtle Dodge · Chaos", "Start a Chaos game.", "chaosPlayed");
  for (const [seconds, title, tier] of [
    [15, "Confetti Forecast", "bronze"], [30, "A Little Wild", "silver"],
    [60, "Chaos Conductor", "gold"], [120, "Weather the Weird", "crystal"],
    [180, "Eye of the Carnival", "diamond"], [300, "Master of Mayhem", "empyrorite"],
  ]) add(`chaos_survive_${seconds}`, title, tier, "Turtle Dodge · Chaos",
    `Survive ${seconds} seconds in one Chaos game.`, "chaosBest", seconds);
  for (const [seconds, title, tier] of [[30, "Untouched by Chaos", "gold"], [60, "Pristine Pandemonium", "rainbow"]])
    add(`chaos_clean_${seconds}`, title, tier, "Turtle Dodge · Chaos",
      `Survive ${seconds} seconds in one Chaos game without taking any damage.`, "chaosCleanBest", seconds);
  for (const [target, title, tier] of [[10, "Thread the Tetris", "silver"], [25, "Between the Falling Stars", "diamond"]])
    add(`chaos_near_${target}`, title, tier, "Turtle Dodge · Chaos",
      `Make ${target} near misses in one Chaos game.`, "chaosNearBest", target);
  for (const [target, title, tier] of [[4, "Back in the Green", "silver"], [12, "Patchwork Miracle", "crystal"]])
    add(`chaos_heal_${target}`, title, tier, "Turtle Dodge · Chaos",
      `Recover ${target} HP in one Chaos game, from regeneration or pickups.`, "chaosHealBest", target);
  add("chaos_score_3000", "Three Thousand Reasons to Smile", "gold", "Turtle Dodge · Chaos",
    "Score 3,000 points in one Chaos game.", "chaosScoreBest", 3000);
  add("chaos_jackpot_777", "Lucky Sevens!", "rainbow", "Arcade", "Land three sevens while Chaos Jackpot Cubie is equipped and visible.", "jackpot777");
  const geomayhemRewards = [
    ['geo_start', 'Into the Geometry', 'bronze', 'Start a Geomayhem expedition.', 'play_geomayhem', 1],
    ['geo_kills_10', 'Shape Shifter', 'bronze', 'Defeat 10 shapes in total.', 'geoKills', 10],
    ['geo_wave_1', 'First Wave Down', 'bronze', 'Clear your first wave.', 'geoWavesBest', 1],
    ['geo_kills_25', 'Corner Collector', 'bronze', 'Defeat 25 shapes in total.', 'geoKills', 25],
    ['geo_waves_5', 'Finding a Rhythm', 'silver', 'Clear 5 waves in one expedition.', 'geoWavesBest', 5],
    ['geo_stars_3', 'First Evolution', 'silver', 'Evolve a weapon to 3 stars.', 'geoStarsBest', 3],
    ['geo_kills_100', 'A Hundred Angles', 'silver', 'Defeat 100 shapes in total.', 'geoKills', 100],
    ['geo_rank_5', 'Crystal Student', 'silver', 'Reach rank 5 in one expedition.', 'geoRankBest', 5],
    ['geo_loadout_4', 'Armed to the Corners', 'gold', 'Carry four weapons at once.', 'geoLoadoutBest', 4],
    ['geo_win_1', 'Arena Victor', 'gold', 'Clear all 20 waves of any arena.', 'geoWins', 1],
    ['geo_waves_50', 'Wave After Wave', 'gold', 'Clear 50 waves in total.', 'geoWaves', 50],
    ['geo_kills_250', 'Shape Breaker', 'gold', 'Defeat 250 shapes in total.', 'geoKills', 250],
    ['geo_relics_3', 'Relic Cabinet', 'crystal', 'Carry three relics in one expedition.', 'geoRelicsBest', 3],
    ['geo_stars_5', 'Final Evolution', 'crystal', 'Evolve a weapon to 5 stars.', 'geoStarsBest', 5],
    ['geo_wins_3', 'Return Expedition', 'crystal', 'Win three expeditions in total.', 'geoWins', 3],
    ['geo_run_kills_150', 'Crowd Control', 'crystal', 'Defeat 150 shapes in one expedition.', 'geoRunKillsBest', 150],
    ['geo_arena_5', 'Through the Rift', 'diamond', 'Clear all 20 waves of arena 5 or higher.', 'geoArenaBest', 5],
    ['geo_kills_500', 'Prism Hunter', 'diamond', 'Defeat 500 shapes in total.', 'geoKills', 500],
    ['geo_wins_10', 'Veteran of the Grid', 'diamond', 'Win ten expeditions in total.', 'geoWins', 10],
    ['geo_waves_200', 'Unbroken Rhythm', 'diamond', 'Clear 200 waves in total.', 'geoWaves', 200],
    ['geo_arena_8', 'Beyond the Starfield', 'rainbow', 'Clear all 20 waves of arena 8 or higher.', 'geoArenaBest', 8],
    ['geo_evolved_3', 'Orbital Orchestra', 'rainbow', 'Carry three 5-star weapons at once.', 'geoEvolvedBest', 3],
    ['geo_kills_2000', 'A Thousand Sides Twice', 'rainbow', 'Defeat 2,000 shapes in total.', 'geoKills', 2000],
    ['geo_score_20000', 'Maximum Mayhem', 'rainbow', 'Score 20,000 points in one expedition.', 'geoScoreBest', 20000],
    ['geo_arena_10', 'Sovereign of Mayhem', 'empyrorite', 'Clear all 20 waves of arena 10.', 'geoArenaBest', 10],
    ['geo_flawless_10', 'Zero Point Perfection', 'empyrorite', 'Clear arena 10 without taking any damage. Healing does not erase damage.', 'geoFlawlessFinal', 1],
    ['geo_evolved_4', 'Fourfold Ascension', 'empyrorite', 'Carry four 5-star weapons at once.', 'geoEvolvedBest', 4],
    ['geo_wins_50', 'Everlasting Expedition', 'empyrorite', 'Win fifty expeditions in total.', 'geoWins', 50],
  ];
  for (const [id,title,tier,description,stat,target] of geomayhemRewards)
    add(id,title,tier,'Geomayhem',description,stat,target);
  // These must follow ordinary medals so the threshold-crossing event awards
  // its collector medal immediately. A collector never counts itself.
  for (const [tier, target, title] of [
    ["bronze", 20, "Bronze Collection"], ["silver", 15, "Silver Collection"],
    ["gold", 10, "Golden Collection"], ["crystal", 5, "Crystal Collection"],
    ["diamond", 3, "Diamond Collection"], ["rainbow", 2, "Rainbow Collection"],
    ["empyrorite", 1, "Empyrorite Collection"],
  ]) add(`collect_${tier}`, title, tier, "Arcade",
    `Earn ${target} ${tier} achievement${target === 1 ? "" : "s"} to unlock ${tier === "gold" ? "Golden" : tier[0].toUpperCase() + tier.slice(1)} Cubie. This collection medal does not count toward its own requirement.`,
    `collection_${tier}`, target, { collectionTier: tier });
  add("collect_prismatic", "A Spectrum of Triumphs", "rainbow", "Arcade", "Earn at least 3 Crystal, 3 Diamond, and 3 Rainbow achievements. This achievement does not count itself.", "prismaticCollection", 3, { collectionTiers: ["crystal", "diamond", "rainbow"] });
  const statNames = new Set([...catalog.map(item => item.stat), "bossRunActive", "bossSovereignRunActive", "pumpkinCounterHits"]);
  const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;

  class Tracker {
    constructor(raw = {}) {
      this.data = { stats: {}, unlocked: {} };
      for (const key of statNames) this.data.stats[key] = count(raw?.stats?.[key]);
      for (const item of catalog) {
        const date = raw?.unlocked?.[item.id];
        if (item.id === "boss_100" && this.data.stats.bossWins < 350) continue;
        if (typeof date === "string" && Number.isFinite(Date.parse(date)))
          this.data.unlocked[item.id] = date;
      }
      this.round = null;
    }
    get score() {
      // Derive totals from current tiers, so retiering updates old profiles too.
      return catalog.reduce((sum, item) => sum + (this.data.unlocked[item.id] ? points[item.tier] : 0), 0);
    }
    progress(item) {
      if (item.collectionTiers) return Math.min(item.target, ...item.collectionTiers.map(tier =>
        catalog.filter(medal => medal.tier === tier && medal.id !== item.id && this.data.unlocked[medal.id]).length));
      const value = item.collectionTier
        ? catalog.filter(medal => medal.tier === item.collectionTier && medal.id !== item.id && this.data.unlocked[medal.id]).length
        : this.data.stats[item.stat];
      return Math.min(item.target, value);
    }
    update(change) {
      this.observedAt = Date.now();
      const before = JSON.stringify(this.data);
      change(this.data.stats);
      this.data.stats.magentaCounterHits = this.data.stats.wrathCounterHits + this.data.stats.pumpkinCounterHits;
      const earned = [];
      for (const item of catalog) {
        if (!this.data.unlocked[item.id] && this.progress(item) >= item.target) {
          this.data.unlocked[item.id] = new Date(this.observedAt).toISOString();
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
    spendTime(seconds) {
      if (!Number.isSafeInteger(seconds) || seconds <= 0) return { earned: [], changed: false };
      return this.update(stats => {
        stats.websiteSeconds = Math.min(36000, stats.websiteSeconds + seconds);
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
        if (["cubie", "boo", "starlight", "rocknroy", "pixel", "1up", "codexisthebest"].includes(name)) stats[`name_${name}`] = 1;
        if (name === "high score") stats.name_high_score = 1;
        if (name === "gravitron") stats.name_gravitron = 1;
      });
    }
    slotResult(symbols, custom, visible) {
      if (custom !== 'chaos_jackpot' || visible !== true || !this.data.unlocked.chaos_score_3000
          || !Array.isArray(symbols) || symbols.length !== 3 || !symbols.every(n => n === 0))
        return { earned: [], changed: false };
      return this.update(stats => { stats.jackpot777 = 1; });
    }
    hearMusic(track, custom, audible) {
      if (audible && track === "christmas_99") return this.update(stats => { stats.christmasHeard = 1; });
      if (!audible || track !== "gaster_remix" || custom !== "gaster"
        || !this.data.unlocked.waste_of_time) return { earned: [], changed: false };
      return this.update(stats => { stats.gasterRemixHeard = 1; });
    }
    completeGaster() {
      return this.update(stats => { stats.gasterCompleted = 1; });
    }
    start(mode, difficulty) {
      this.round = { mode, difficulty, finished: false, counterHits: 0, healingCollected: 0, survivals: [] };
      if (mode === 'core_practice') return { earned: [], changed: false };
      return this.update(stats => {
        if (stats.bossRunActive) stats.bossCleanStreak = 0;
        if (stats.bossSovereignRunActive) stats.bossSovereignStreak = 0;
        stats.bossRunActive = mode === "boss" ? 1 : 0;
        stats.bossSovereignRunActive = mode === "boss" && sovereignDifficulties.includes(difficulty) ? 1 : 0;
        if (mode === "dodge" && difficulty === "chaos") stats.chaosPlayed = 1;
        stats[`play_${mode}`] = 1;
        stats.gamesPlayed = games.filter(game => stats[`play_${game}`]).length;
      });
    }
    observeGeomayhem(s) {
      const round = this.round;
      const level = Number(round.difficulty.slice(6));
      if (!Number.isInteger(level) || level < 1 || level > 10 || s.geo_level !== level)
        return { earned: [], changed: false };
      const kills = count(s.geo_kills), waves = Math.min(20, count(s.geo_waves));
      const newKills = Math.max(0, kills - (round.geoKills || 0));
      const newWaves = Math.max(0, waves - (round.geoWaves || 0));
      const maxima = { geoWavesBest: waves, geoRunKillsBest: kills,
        geoStarsBest: Math.min(5,count(s.geo_max_stars)), geoLoadoutBest: Math.min(4,count(s.geo_weapon_count)),
        geoEvolvedBest: Math.min(4,count(s.geo_five_star_count)), geoRelicsBest: Math.min(3,count(s.geo_relic_count)),
        geoRankBest: count(s.geo_rank), geoScoreBest: count(s.score) };
      if (s.over !== true && !newKills && !newWaves && !Object.entries(maxima).some(([key,value])=>value>this.data.stats[key]))
        return { earned: [], changed: false };
      return this.update(stats => {
        stats.geoKills += newKills; stats.geoWaves += newWaves;
        round.geoKills = Math.max(round.geoKills || 0,kills);
        round.geoWaves = Math.max(round.geoWaves || 0,waves);
        for (const [key,value] of Object.entries(maxima)) stats[key] = Math.max(stats[key],value);
        if (s.over === true) {
          round.finished = true;
          if (s.won === true && waves === 20) {
            stats.geoWins++;
            stats.geoArenaBest = Math.max(stats.geoArenaBest,level);
            if (level === 10 && s.damage_taken === 0) stats.geoFlawlessFinal = 1;
          }
        }
      });
    }
    observe(s) {
      const round = this.round;
      if (!round || round.finished || s.mode !== round.mode || s.difficulty !== round.difficulty)
        return { earned: [], changed: false };
      if (s.mode === 'geomayhem') return this.observeGeomayhem(s);
      const streakBroken = s.mode === "boss" && s.damage_taken > 0 && this.data.stats.bossCleanStreak > 0;
      const sovereignFight = s.mode === "boss" && sovereignDifficulties.includes(s.difficulty);
      const sovereignBroken = sovereignFight && s.damage_taken > 0 && this.data.stats.bossSovereignStreak > 0;
      const core = s.mode === "singularity" && s.difficulty === "gravitron";
      const wrath = s.mode === "wrath" && wrathModes.includes(s.difficulty);
      const corePractice = s.mode === 'core_practice' && attackRewards.some(reward => reward.family === 'core' && reward.key === s.difficulty);
      const healingMode = ["boss", "pumpkin"].includes(s.mode) || core || wrath || corePractice;
      const healing = healingMode ? count(s.healing_collected) : 0;
      const newHealing = Math.max(0, healing - round.healingCollected);
      const family = core || corePractice ? 'core' : s.mode === 'pumpkin' || wrath ? 'pumpkin' : null;
      const survivalCounts = Array.isArray(s.attack_survivals) && s.attack_survivals.length === (family === 'core' ? 15 : 7)
        ? s.attack_survivals.map(count) : [];
      const newSurvivals = family && survivalCounts.some((value, index) => value > (round.survivals[index] || 0));
      const protocols = Math.min(15, count(s.attacks_completed));
      const randomSets = wrath && s.difficulty === "random_order" ? Math.floor(count(s.attacks_completed) / 7) : 0;
      const counters = (wrath || s.mode === "pumpkin") ? Math.max(0, count(s.counter_hits) - round.counterHits) : 0;
      const mercifulTime = s.mode === "pumpkin" && s.shots_fired === 0 && s.lives > 0
        && Number.isFinite(s.fight_elapsed) && s.fight_elapsed >= 0 ? Math.floor(s.fight_elapsed) : 0;
      const newPumpkinProgress = s.mode === "pumpkin" && (counters > 0 || mercifulTime > this.data.stats.pumpkinMercifulBest);
      const newCoreProgress = core && (protocols > this.data.stats.coreProtocolsBest ||
        s.damage_taken === 0 && protocols > this.data.stats.coreCleanProtocolsBest);
      const newWrathProgress = wrath && (counters > 0 || randomSets > this.data.stats.wrathRandomSetsBest);
      if (!s.over && !["keyboard", "dodge"].includes(s.mode) && !streakBroken && !sovereignBroken && !newCoreProgress && !newWrathProgress && !newSurvivals && !newHealing && !newPumpkinProgress)
        return { earned: [], changed: false };
      return this.update(stats => {
        if (newHealing) {
          stats.healingItems += newHealing;
          round.healingCollected = healing;
        }
        if (newSurvivals) {
          for (const reward of attackRewards.filter(reward => reward.family === family)) {
            const previous = round.survivals[reward.index] || 0;
            const current = survivalCounts[reward.index];
            stats[reward.id] += Math.max(0, current - previous);
            round.survivals[reward.index] = Math.max(previous, current);
          }
        }
        if (s.over === true && s.won === false && (["dodge", "boss", "pumpkin"].includes(s.mode) || core || wrath || corePractice)) {
          stats.arcadeDeaths++;
          if (s.mode === "dodge" && ["easy", "normal", "hard", "merciless", "impossible"].includes(s.difficulty) && s.death_cause === "o_block")
            stats.dodgeSquareDeaths++;
        }
        if (s.mode === 'core_practice') {
          if (s.over) round.finished = true;
          return;
        }
        if (streakBroken) stats.bossCleanStreak = 0;
        if (sovereignBroken) stats.bossSovereignStreak = 0;
        if (core) {
          stats.coreProtocolsBest = Math.max(stats.coreProtocolsBest, protocols);
          if (s.damage_taken === 0) stats.coreCleanProtocolsBest = Math.max(stats.coreCleanProtocolsBest, protocols);
        }
        if (s.mode === "pumpkin") {
          stats.pumpkinMercifulBest = Math.max(stats.pumpkinMercifulBest, mercifulTime);
          stats.pumpkinCounterHits += counters;
          round.counterHits = Math.max(round.counterHits, count(s.counter_hits));
        }
        if (wrath) {
          stats.wrathRandomSetsBest = Math.max(stats.wrathRandomSetsBest, randomSets);
          stats.wrathCounterHits += counters;
          round.counterHits = Math.max(round.counterHits, count(s.counter_hits));
        }
        if (s.mode === "keyboard") stats.typingBest = Math.max(stats.typingBest, count(s.score));
        if (s.mode === "dodge") {
          if (s.difficulty === "chaos") {
            stats.chaosBest = Math.max(stats.chaosBest, count(s.elapsed));
            stats.chaosNearBest = Math.max(stats.chaosNearBest, count(s.near_misses));
            stats.chaosHealBest = Math.max(stats.chaosHealBest, count(s.healing_collected));
            stats.chaosScoreBest = Math.max(stats.chaosScoreBest, count(s.score));
            if (s.damage_taken === 0 && s.lives > 0)
              stats.chaosCleanBest = Math.max(stats.chaosCleanBest, count(s.elapsed));
          }
          if (s.over === true && s.won === false && Number.isFinite(s.elapsed)
              && s.elapsed >= 0 && s.elapsed < 5) stats.dodgeEarlyDeath = 1;
          stats.closeCalls = Math.max(stats.closeCalls, count(s.near_misses));
          stats.dodgeBest = Math.max(stats.dodgeBest, count(s.elapsed));
          if (s.difficulty === "impossible") stats.impossibleBest = Math.max(stats.impossibleBest, count(s.elapsed));
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
          if (s.mode === "pumpkin" && Number.isFinite(s.fight_elapsed) && s.fight_elapsed > 0 && s.fight_elapsed <= 70)
            stats.pumpkinSpeedrun = 1;
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
  return { catalog, points, Tracker, attackRewards };
})();
if (typeof module !== "undefined") module.exports = Achievements;

// Portable catalog access for the shared browser/server account rules.
if (typeof globalThis !== "undefined") globalThis.Achievements = Achievements;
