"use strict";

const $ = (id) => document.getElementById(id);
const modes = {
  shop: {
    title: "Cubie Shop", category: "10 / CUBIE CASH", art: "C",
    heading: "Little outfits. Big personality.", copy: "Play games to earn Cubie Cash and collect Customs and Turtle Trails.",
    accent: "#80b9ff", controls: "100 converted score = 1 Cubie Cash · Harder modes earn more",
    localOnly: true, temporary: true, difficulties: {},
  },
  customs: {
    title: "Custom Cubie", category: "09 / CUBIE'S CLOSET", art: "",
    heading: "A Custom for every adventure.",
    copy: "Earn achievements or visit the Cubie Shop to dress up your arcade buddy.",
    accent: "#c6f783", controls: "Earn achievements or buy shop Customs · Choose an unlocked Custom to wear it",
    localOnly: true, temporary: true, difficulties: {},
  },
  jukebox: {
    title: "Arcade Jukebox", category: "08 / MUSIC ROOM", art: "♫",
    heading: "Pick your soundtrack.",
    copy: "Browse the arcade songs, game themes, and rock tracks. Your selected song loops until you choose another.",
    accent: "#f5a5dc", controls: "Choose a song · Pause or resume below · Esc stops playback",
    choiceLabel: "Choose a song", localOnly: true, temporary: true,
    difficulties: Object.fromEntries(ArcadeMusic.jukeboxTracks.map(track =>
      [track.id, [track.title, `${track.category} · ${track.bpm} BPM`]])),
  },
  hangman: {
    title: "Hangman",
    category: "01 / WORDPLAY",
    art: "A _ C",
    heading: "Every letter counts.",
    copy: "Find the hidden word before your guesses run out.",
    accent: "#c6f783",
    controls: "Type a letter or use the buttons below.",
    difficulties: {
      easy: ["Easy", "10 wrong guesses. A friendly start."],
      medium: ["Medium", "7 wrong guesses. A little more brainwork."],
      hard: ["Hard", "5 wrong guesses. Make every one count."],
    },
  },
  keyboard: {
    title: "Key Rush",
    category: "02 / QUICK THINKING",
    art: "[ A S D ]",
    heading: "Ready, set, type.",
    copy: "Beat the clock. Wrong keys cost half a second.",
    accent: "#b9a5f5",
    controls: "Case matters. No Enter needed. Esc ends the challenge.",
    difficulties: {
      progressive: [
        "Progressive",
        "Each round adds a little more speed and complexity.",
      ],
    },
  },
  dodge: {
    title: "Turtle Dodge",
    category: "03 / SURVIVAL",
    art: "▟  ▚  ▙",
    heading: "Stay small. Stay alive.",
    copy: "Weave between falling blocks and keep your turtle safe.",
    accent: "#88dce7",
    controls: "Arrows move · D pauses · Esc returns to the menu",
    difficulties: {
      easy: ["Easy", "Classic falling blocks. Find your rhythm."],
      normal: ["Normal", "Faster blocks with unpredictable speeds."],
      hard: ["Hard", "Fast yellow blocks that sway side to side."],
      merciless: [
        "Merciless",
        "Deadly edges, a smaller arena, and no pausing.",
      ],
    },
  },
  boss: {
    title: "Boss Crush",
    category: "04 / BOSS BATTLE",
    art: "▪ ▰ ▪",
    heading: "Pick on someone bigger.",
    copy: "Dodge the patterns. Hold F to fire back.",
    accent: "#f29d9e",
    controls: "Arrows move · F shoots · D pauses · Esc exits",
    difficulties: {
      mean: ["Mean", "Fans and aimed bursts. 3 HP."],
      cruel: ["Cruel", "Faster volleys and rotating rings. 3 HP."],
      nightmare: ["Nightmare", "Dense, fast patterns. Keep moving. 3 HP."],
      impossible: [
        "Impossible",
        "Blue: stay still. Orange: move. Green + heals. 5 HP.",
      ],
    },
  },
  pumpkin: {
    title: "Pumpkin King",
    category: "05 / THE FINAL BOSS",
    art: "◈",
    heading: "An audience with the king.",
    copy: "Touching the King’s body or arms kills instantly. Smashes and mouth fire deal 1 HP.",
    accent: "#f8b36b",
    controls: "Arrows move · F shoots after intro · E counters · D pauses",
    difficulties: {
      come_on: [
        "Come On, Are You Really That Bad at the Game?",
        "23 HP. Body and arm contact still kills instantly. E counters magenta fingers.",
      ],
      baby: [
        "Baby Mode",
        "15 HP. Blue: stay still. Orange: move. Tap E just before magenta fingers hit.",
      ],
      coward: [
        "Coward Mode",
        "10 HP. Blue: stay still. Orange: move. Tap E just before magenta fingers hit.",
      ],
      phase2: [
        "Impossible Phase 2",
        "5 HP. Blue: stay still. Orange: move. Tap E just before magenta fingers hit.",
      ],
    },
  },
  wrath: {
    title: "The King's Wrath",
    category: "06 / ATTACK PRACTICE",
    art: "",
    heading: "Choose your attack. Or shuffle them all.",
    copy: "Start with 15 HP and a three-second countdown before each attack. Repeat one pattern or face all seven in Random Order. Body and arm contact still kills instantly.",
    accent: "#ffe066",
    controls: "Arrows move · F shoots · E counters · D pauses · Esc picks another attack",
    choiceLabel: "Choose an attack to load",
    difficulties: {
      color_memory: ["Color Memory", "Watch six eye colors, then obey blue and orange."],
      bone_gauntlet: ["Bone Gauntlet", "Weave through the King's bone patterns."],
      rotating_rings: ["Rotating Rings", "Read the colored ring sections and find a way through."],
      magenta_fingers: ["Magenta Fingers", "Tap E just before a magenta finger reaches you."],
      chaos: ["Chaos", "Dodge the King's mixed projectile patterns."],
      royal_slams: ["Royal Slams", "Avoid the raised hands, then escape the mouth fire."],
      haunted_quadrants: ["Haunted Quadrants", "Three-second countdown, then two more seconds to get in position. Dodge slower clockwise scares. Half a heart per hit."],
      random_order: ["Random Order", "All seven attacks in a shuffled order. Three seconds to prepare for each. Reshuffles after every seven attacks."],
    },
  },
  singularity: {
    title: "Singularity Core",
    category: "07 / SECRET BOSS",
    art: "◎",
    heading: "Nothing escapes. Except you.",
    copy: "A robotic black hole. Survive all 15 protocols to drop its shield, then erase it with one enormous laser. 10 HP. Galactic +1 HP packs appear every three attacks.",
    accent: "#65f5ff",
    controls: "Hold arrows to teleport · Release to center · F fires the final laser · D pauses",
    choiceLabel: "Containment access granted",
    localOnly: true,
    difficulties: {
      gravitron: ["Enter containment", "Harder than the King. Two arrows jump to a corner. The Core cannot be damaged until every attack ends."],
      practice: ["Practice attacks (temporary)", "Repeat any of the 15 attacks or watch the final cutscene."],
    },
  },
  core_practice: {
    title: "Singularity Core Practice",
    category: "TEMPORARY / ATTACK PRACTICE",
    art: "◎",
    heading: "Choose a protocol. Perfect your escape.",
    copy: "Repeat any of the Core’s 15 attacks with 10 HP and a three-second countdown before each repeat. Galactic healing packs appear every three repeats. Attack survivals count toward Cubie rewards; scores and full-fight records are not saved. Or watch the final cutscene immediately.",
    accent: "#65f5ff",
    controls: "Hold arrows to teleport · Release to center · D pauses · Esc picks another attack",
    choiceLabel: "Choose an attack or watch the finale",
    localOnly: true,
    temporary: true,
    // Loaded from the shared Python attacks so edits also update this picker.
    difficulties: {},
  },
};
// Each sleeve has its own palette; related songs share a visual motif.
const songSleeves = {
  starburst_255: ["#ffdc65", "#ff6295", "bolt"],
  slow_orbit: ["#b3c9ff", "#776ba4", "moon"],
  christmas_99: ["#fff4cf", "#cf404a", "star"],
  core_aftermath: ["#ffb2ac", "#a13764", "orbit"],
  hyperspeed: ["#ffde70", "#f26a99", "bolt"],
  velvet_tokens: ["#d7b5f5", "#737bb4", "moon"],
  arcade: ["#c6f783", "#5cb8a5", "pixels"],
  megalo_remix: ["#72dfff", "#5267ed", "heart"],
  freedom_remix: ["#ffe77e", "#ec73d8", "star"],
  gaster_remix: ["#e0e7ed", "#7f8eac", "signal"],
  lantern_leap: ["#ffcf75", "#c8743b", "lantern"],
  copper_comet: ["#ffb58a", "#b86846", "comet"],
  sleepy_satellite: ["#b9caff", "#747bbb", "moon"],
  comet: ["#9eecff", "#9178f2", "comet"],
  clockwork: ["#f6cf85", "#ae8c56", "clock"],
  moonlit: ["#c4c9ff", "#6c83c7", "moon"],
  soda: ["#a7ffb3", "#ed81bc", "bubbles"],
  ghost: ["#e0d6ff", "#9da9d9", "ghost"],
  hero: ["#fbd883", "#6ca7d8", "shield"],
  crystal: ["#adf4ff", "#a38eea", "crystal"],
  midnight: ["#e3a1ff", "#7162d8", "bolt"],
  home: ["#ffcba6", "#b29779", "home"],
  arcade_pixel: ["#ffc0e5", "#88b8fb", "pixels"],
  arcade_moonlit: ["#a3cfff", "#8b7fc9", "moon"],
  arcade_turbo: ["#ffdb7f", "#ed875c", "coin"],
  arcade_bubblebyte: ["#8df1ed", "#559cc1", "waves"],
  arcade_horizon: ["#ffbf8f", "#ac83e3", "sunrise"],
  dodge_easy: ["#b5eca0", "#69bca1", "shell"],
  dodge_normal: ["#a5ddff", "#718dd1", "rain"],
  dodge_hard: ["#ffdc76", "#779ca0", "waves"],
  dodge_merciless: ["#ff9aab", "#9271c1", "waves"],
  hangman: ["#d0ef99", "#97ad6b", "letters"],
  keyrush: ["#d3b9ff", "#7da5e7", "keys"],
  pumpkin: ["#ffc16e", "#aa76d6", "pumpkin"],
  singularity: ["#8bf3ff", "#ac8bfa", "orbit"],
  boss_mean: ["#ff9a98", "#b66774", "circuit"],
  boss_cruel: ["#d5dfed", "#8a9daa", "shield"],
  boss_nightmare: ["#dcadff", "#bb668f", "eye"],
  boss_impossible: ["#ffcc7a", "#b66173", "crown"],
  rock_afterburn: ["#ffb384", "#df675b", "flame"],
  rock_neon: ["#ff9ce6", "#67ced9", "bolt"],
  rock_static: ["#dfef9e", "#9e9a79", "signal"],
  rock_midnight: ["#b8b8ff", "#698ab6", "circuit"],
  rock_victory: ["#ffdf7c", "#c39a4c", "crown"],
};
const sleevePaths = {
  pixels: "M12 12h12v12H12z M40 12h12v12H40z M26 26h12v12H26z M12 40h12v12H12z M40 40h12v12H40z",
  heart: "M32 51 10 29V17h9l13 10 13-10h9v12Z",
  star: "m32 7 7 17 18 2-14 12 4 18-15-10-15 10 4-18L7 26l18-2Z",
  signal: "M7 20h13l5-10v44l10-36v31l7-16h15 M8 10h7 M48 52h8",
  lantern: "M22 19v-5a10 10 0 0 1 20 0v5 M16 20h32l-4 31H20Z M25 28h14v15H25Z M16 56h32",
  comet: "m11 37 27-26 M23 41l30-30 M29 52l26-26 M23 43a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  clock: "M55 32a23 23 0 1 1-46 0 23 23 0 0 1 46 0Z M32 15v18l12 7 M32 3v6 M32 55v6 M3 32h6 M55 32h6",
  moon: "M43 9a23 23 0 1 0 12 35A25 25 0 0 1 43 9Z M52 12v10 M47 17h10",
  bubbles: "M30 39a12 12 0 1 1-24 0 12 12 0 0 1 24 0Z M53 19a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M53 48a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z",
  ghost: "M14 53V28a18 18 0 0 1 36 0v25l-9-6-9 6-9-6Z M25 26v7 M39 26v7",
  shield: "M12 11h40v23Q49 48 32 57 15 48 12 34Z M32 19v26 M22 29h20",
  crystal: "m20 9 24 0 12 18-24 29L8 27Z M8 27h48 M20 9l-1 18 13 29 13-29-1-18 M19 27l13-18 13 18",
  bolt: "M35 5 12 36h18l-3 23 25-34H35Z",
  home: "M8 30 32 9l24 21 M15 26v28h34V26 M27 54V38h10v16",
  coin: "M54 32a22 22 0 1 1-44 0 22 22 0 0 1 44 0Z M45 32a13 13 0 1 1-26 0 13 13 0 0 1 26 0Z M32 25v14",
  waves: "M6 20q9-12 18 0t18 0 18 0 M6 33q9-12 18 0t18 0 18 0 M6 46q9-12 18 0t18 0 18 0",
  sunrise: "M13 39a19 19 0 0 1 38 0 M6 39h52 M12 47h40 M21 55h22 M32 4v7 M8 15l6 6 M56 15l-6 6",
  shell: "M49 35a17 20 0 1 1-34 0 17 20 0 0 1 34 0Z M25 27h14l5 13-12 9-12-9Z M25 27l-5-8 M39 27l5-8 M32 49v6 M26 15V8h12v7 M15 29l-8-5 M49 29l8-5",
  rain: "M12 12h10v10H12Z M39 9h12v12H39Z M29 32h10v10H29Z M13 32v12 M49 32v19 M28 51v8",
  letters: "M5 45 12 19l7 26 M8 35h8 M26 45V19h6c10 0 10 13 0 13h-6 M32 32c11 0 11 13 0 13h-6 M59 22c-13-12-17 32 0 20",
  keys: "M8 14h48v36H8Z M16 23h5 M29 23h5 M42 23h5 M16 32h5 M29 32h5 M42 32h5 M23 41h18",
  pumpkin: "M32 17q-22-12-25 13t25 23q22 2 25-23T32 17Z M32 17q-5-11 5-13 M17 28l7 7H14Z M47 28l3 7H40Z M17 42l8 6 7-4 7 4 8-6",
  orbit: "M48 32a16 16 0 1 1-32 0 16 16 0 0 1 32 0Z M14 23C-12 37 9 54 36 43S72 11 46 22 M6 14h4 M8 12v4",
  circuit: "M7 14h17l16 16h17 M7 49h17l16-16 M24 14v35 M49 9v12 M49 43v12 M6 29h9 M6 35h9",
  eye: "M5 32Q32 1 59 32 32 63 5 32Z M41 32a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M32 24v16",
  crown: "m8 18 14 13 10-21 10 21 14-13-6 29H14Z M15 55h34",
  flame: "M32 5c6 20 19 18 19 34a19 19 0 0 1-38 0c0-10 6-15 9-21l3 14c7-6 9-16 7-27Z M32 35c-12 11-8 20 0 20s12-9 0-20Z",
};
function styleSongCard(button, id) {
  const [color, glow, motif] = songSleeves[id];
  button.classList.add("song-card");
  button.style.setProperty("--song-color", color);
  button.style.setProperty("--song-glow", glow);
  button.dataset.motif = motif;
  const art = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  art.setAttribute("viewBox", "0 0 64 64");
  art.setAttribute("class", "song-art");
  art.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(art.namespaceURI, "path");
  path.setAttribute("d", sleevePaths[motif]);
  art.append(path);
  button.prepend(art);
}
let selected = "hangman";
let selectedDifficulty = null;
let jukeboxPaused = false;
let previousBossHealth = null;
let damageFlashAnimation = null;
let healingFlashAnimation = null;
let coreOrigin;
let coreAftermath = false;
let nameSurpriseActive = false;
let nameSurpriseTimer;
let previousSecretName = "";
const nameSecrets = { codexisthebest: "Codex Cubie unlocked. Let’s build something!", dingdong: "", cubie: "Hi, I’m Cubie!", boo: "BOO!", starlight: "You’re made of starlight. ✦", pixel: "Every pixel counts!", "1up": "Extra life energy!", "high score": "Your name belongs at the top!" };
// History state survives a real reload without exposing a URL hint or relying
// on browser storage. Consume it immediately so later reloads cannot replay it.
const pendingGaster = history.state?.gasterSequence;
if (pendingGaster) {
  const state = { ...history.state };
  delete state.gasterSequence;
  history.replaceState(state, "");
}
let gasterActive = false;
let gameTimeOffset = 0;
let ready = false;
let loadFailed = false;
let active = false;
let snapshot = null;
let handle = null;
let lastFrame = 0;
let roundSaved = false;
let lastCashReward = 0;
let currentPlayer = "Player";
const keys = new Set();
const joystickKeys = new Set();
let joystickPointer = null;
const storageKey = "microgame-madness.v1";
let saved = { player: "Player", scores: {}, achievements: {}, unlocks: { singularity: false }, minigamesCompleted: 0, cubieHintShown: false };
let storageAvailable = true;
try {
  const value = JSON.parse(localStorage.getItem(storageKey));
  if (value && typeof value === "object") {
    saved.achievements = value.achievements;
    saved.testerTon618 = value.testerTon618 === true;
    saved.shop = value.shop;
    saved.turtleTrail = typeof value.turtleTrail === "string" ? value.turtleTrail : null;
    saved.cubieCustom = typeof value.cubieCustom === "string" ? value.cubieCustom : "classic";
    saved.unlocks.singularity = value.unlocks?.singularity === true;
    saved.minigamesCompleted = Number.isSafeInteger(value.minigamesCompleted) && value.minigamesCompleted >= 0
      ? Math.min(value.minigamesCompleted, 20) : 0;
    saved.cubieHintShown = value.cubieHintShown === true;
    if (typeof value.player === "string")
      saved.player = value.player.slice(0, 24);
    if (
      value.scores &&
      typeof value.scores === "object" &&
      !Array.isArray(value.scores)
    )
      saved.scores = value.scores;
  }
} catch {
  storageAvailable = false;
}
const achievementTracker = new Achievements.Tracker(saved.achievements);

function newCustomNotifications() {
  return CubieCustoms.catalog.filter(item => {
    if (announcedCustoms.has(item.id) || !CubieCustoms.unlocked(item,
      achievementTracker.data.unlocked, saved.shop.owned, saved.testerTon618)) return false;
    announcedCustoms.add(item.id);
    return true;
  }).map(item => ({ ...item, notificationKind: "custom" }));
}

saved.shop = CubieShop.restore(saved.shop, [...CubieCustoms.catalog, ...TurtleTrails.catalog]);
// Seed from the saved closet so reloads never replay old Custom unlocks.
const announcedCustoms = new Set(CubieCustoms.catalog.filter(item =>
  CubieCustoms.unlocked(item, achievementTracker.data.unlocked, saved.shop.owned, saved.testerTon618)
).map(item => item.id));
saved.turtleTrail = TurtleTrails.selected(saved.turtleTrail, saved.shop.owned)?.id || null;
saved.achievements = achievementTracker.data;
$("player").value = saved.player;
function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(saved));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  if (!storageAvailable)
    $("storage-note").textContent =
      "Storage is unavailable. Scores and achievements last for this visit only.";
}
let cubieHintStarted = null;
function countCompletedMinigame() {
  saved.minigamesCompleted = Math.min(20, saved.minigamesCompleted + 1);
  if (saved.minigamesCompleted === 20 && !saved.cubieHintShown) {
    saved.cubieHintShown = true;
    clearKeys();
    cubieHintStarted = performance.now();
    $("cubie-hint").showModal();
    syncMusic();
  }
  persist();
}
$("cubie-hint").addEventListener("cancel", event => event.preventDefault());
$("cubie-hint-okay").onclick = () => {
  if (cubieHintStarted === null) return;
  gameTimeOffset += performance.now() - cubieHintStarted;
  cubieHintStarted = null;
  lastFrame = performance.now();
  clearKeys();
  $("cubie-hint").close();
  syncMusic();
  $("arena").focus({ preventScroll: true });
};
function unlockSingularity(navigate = true) {
  saved.unlocks.singularity = true;
  saved.player = $("player").value.trim() || "Player";
  persist();
  document.querySelector('[data-game="singularity"]').hidden = false;
  $("game-count").textContent = "08";
  $("game-total").textContent = "7 GAMES + JUKEBOX + CLOSET + SHOP / ENDLESS REMATCHES";
  updateAchievements(achievementTracker.secret("gravitron"));
  if (navigate) {
    selectGame("singularity");
    showGameArea();
    $("difficulty-choices").querySelector("button").focus({ preventScroll: true });
  }
}
const achievementCards = new Map();
const achievementQueue = [];
const activeAchievementToasts = new Map();
let achievementToastLimit = 3;
const celebrationTimers = new Map();
const confettiColors = {
  bronze: ["#b87545", "#e6ac7c", "#ffcf9e"],
  silver: ["#a9bacb", "#e2e8f0", "#ffffff"],
  gold: ["#ffd34d", "#ffeab0", "#c58d14"],
  crystal: ["#b67dff", "#dfaaff", "#a34ff0"],
  diamond: ["#55ddff", "#a9f4ff", "#39baff"],
  rainbow: ["#ff5470", "#ff9e42", "#ffe663", "#6ee89b", "#56c7ff", "#bc8bff"],
  empyrorite: ["#2cf5a0", "#a4ffdb", "#00b97b", "#e3fff3", "#65eac6", "#55cc8d"],
  black: ["#000000", "#171717", "#454545"],
};
function empyroriteGem() {
  const gem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  gem.setAttribute("viewBox", "0 0 72 72");
  gem.setAttribute("aria-hidden", "true");
  gem.setAttribute("class", "empyrorite-gem");
  gem.innerHTML = '<path d="M36 6 59 22 53 51 36 66 19 51 13 22Z" fill="#14c98a" stroke="#c3ffe6" stroke-width="1.5"/>'
    + '<path d="M36 6 28 27 13 22Z" fill="#b0ffe0"/><path d="M36 6 59 22 44 27Z" fill="#69f7bc"/>'
    + '<path d="M28 27 44 27 36 66Z" fill="#58ffc2"/><path d="M13 22 28 27 36 66 19 51Z" fill="#078b60"/>'
    + '<path d="M59 22 44 27 36 66 53 51Z" fill="#10b57e"/>'
    + '<path d="M28 27 36 6 44 27Z" fill="#effff7" opacity=".8"/>'
    + '<path d="m57 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2ZM10 46l2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="#d6fff1"/>';
  return gem;
}
function celebrateAchievements(earned) {
  if (!earned.length) return;
  // One clear ding for simultaneous awards; one visual layer per tier.
  if (soundOn) {
    if (audioContext?.state === "running") {
      pendingAchievementDing = false;
      playSound("achievement");
    }
    else pendingAchievementDing = true;
  }
  for (const tier of new Set(earned.map(item => item.tier))) {
    clearTimeout(celebrationTimers.get(tier));
    $("achievement-celebrations").querySelector(`[data-tier="${tier}"]`)?.remove();
    const layer = document.createElement("div");
    layer.className = "achievement-confetti";
    layer.dataset.tier = tier;
    for (let index = 0; index < 40; index++) {
      const piece = document.createElement("i");
      piece.style.setProperty("--confetti-color", confettiColors[tier][index % confettiColors[tier].length]);
      piece.style.setProperty("--x", `${Math.random() * 100}vw`);
      piece.style.setProperty("--y", `${Math.random() * 100}vh`);
      piece.style.setProperty("--drift", `${Math.random() * 24 - 12}vw`);
      piece.style.setProperty("--turn", `${Math.random() * 1080 - 540}deg`);
      piece.style.setProperty("--fall", `${2.5 + Math.random() * 2}s`);
      piece.style.setProperty("--delay", `${-Math.random() * 4.5}s`);
      layer.append(piece);
    }
    $("achievement-celebrations").append(layer);
    celebrationTimers.set(tier, setTimeout(() => {
      layer.remove();
      celebrationTimers.delete(tier);
    }, 5000));
  }
}
function dismissAchievementToast(toast) {
  clearTimeout(activeAchievementToasts.get(toast));
  activeAchievementToasts.delete(toast);
  toast.remove();
  showAchievementToasts();
}
function showAchievementToasts(earned = []) {
  if (!activeAchievementToasts.size && !achievementQueue.length)
    achievementToastLimit = 3;
  if (activeAchievementToasts.size + achievementQueue.length + earned.length > 3)
    achievementToastLimit = 2;
  achievementQueue.push(...earned);
  const stack = $("achievement-toast");
  while (achievementQueue.length && activeAchievementToasts.size < achievementToastLimit) {
    const toast = createAchievementToast(achievementQueue.shift());
    stack.append(toast);
    activeAchievementToasts.set(toast, setTimeout(() => dismissAchievementToast(toast), 4500));
  }
  stack.hidden = !activeAchievementToasts.size;
}
function createAchievementToast(item) {
  const toast = document.createElement("article");
  toast.className = "achievement-toast";
  const isCustom = item.notificationKind === "custom";
  if (isCustom) toast.dataset.customId = item.id;
  else toast.dataset.achievementId = item.id;
  toast.dataset.tier = item.tier;
  const badge = document.createElement("span");
  badge.className = "medal";
  if (isCustom) {
    badge.className = "custom-unlock-art";
    badge.innerHTML = CubieCustoms.svg(item);
  } else if (item.tier === "empyrorite") badge.append(empyroriteGem());
  else badge.textContent = "★";
  badge.setAttribute("aria-hidden", "true");
  const detail = document.createElement("div");
  const label = document.createElement("small");
  label.textContent = isCustom ? `New Cubie unlocked · ${CubieCustoms.tierLabels[item.tier]}` : `${item.tier === "black" ? "Secret" : item.tier} achievement · +${Achievements.points[item.tier]} points`;
  const title = document.createElement("strong");
  title.textContent = isCustom ? item.name : item.title;
  detail.append(label, title);
  const close = document.createElement("button");
  close.textContent = "×";
  close.setAttribute("aria-label", isCustom ? "Dismiss Cubie unlock notification" : "Dismiss achievement notification");
  close.onclick = () => dismissAchievementToast(toast);
  toast.append(badge, detail, close);
  return toast;
}
function matchesCatalogSearch(text, query) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const haystack = text.toLocaleLowerCase();
  return words.every(word => haystack.includes(word));
}
function filterCatalogGrid(gridId, inputId) {
  const cards = [...$(gridId).querySelectorAll(".custom-tile")];
  for (const card of cards)
    card.hidden = !matchesCatalogSearch(card.textContent, $(inputId).value);
  return cards.filter(card => !card.hidden).length;
}
function updateCustomsSearch() {
  const count = filterCatalogGrid("customs-grid", "customs-search");
  $("customs-search-status").textContent = count
    ? `${count} ${count === 1 ? "Custom" : "Customs"} shown`
    : "No Customs match your search and filter.";
}
function updateShopSearch() {
  const customs = filterCatalogGrid("shop-grid", "shop-search");
  const trails = filterCatalogGrid("trail-grid", "shop-search");
  const count = shopCategory === "trails" ? trails : customs;
  $("shop-search-status").textContent = count
    ? `${count} ${shopCategory === "trails" ? "trail" : "Custom"}${count === 1 ? "" : "s"} shown`
    : "No matches in this category. Try another search or category.";
}
function renderAchievements() {
  const unlocked = achievementTracker.data.unlocked;
  $("profile-score").textContent = achievementTracker.score;
  $("achievement-count").textContent = `${Object.keys(unlocked).length} / ${Achievements.catalog.length} achievements unlocked`;
  let visible = 0;
  for (const item of Achievements.catalog) {
    const card = achievementCards.get(item.id);
    const earned = Boolean(unlocked[item.id]);
    const redacted = item.secret && !earned;
    if (!card.firstChild || card.classList.contains("redacted") !== Boolean(redacted))
      populateAchievementCard(card, item, redacted);
    card.classList.toggle("earned", earned);
    if (!redacted) {
      card.querySelector(".achievement-state").textContent = earned
        ? `Unlocked · ${new Date(unlocked[item.id]).toLocaleDateString()}`
        : `Locked · ${achievementTracker.progress(item)} / ${item.target}`;
      card.querySelector("progress").value = earned ? item.target : achievementTracker.progress(item);
    }
    const filter = $("achievement-filter").value;
    card.hidden = (filter === "earned" && !earned) || (filter === "locked" && earned)
      || !matchesCatalogSearch(card.textContent, $("achievement-search").value);
    if (!card.hidden) visible++;
  }
  $("achievement-empty").hidden = visible > 0;
  $("achievement-empty").textContent = "No achievements match your search and filter.";
  $("achievement-search-status").textContent = `${visible} ${visible === 1 ? "achievement" : "achievements"} shown`;
}
function populateAchievementCard(card, item, redacted) {
  card.replaceChildren();
  card.classList.toggle("redacted", Boolean(redacted));
  const content = document.createElement("div");
  content.className = "achievement-content";
  card.append(content);
  if (redacted) {
    delete card.dataset.tier;
    card.setAttribute("aria-label", "Redacted achievement");
    const label = document.createElement("strong");
    label.textContent = "[REDACTED]";
    content.append(label);
    for (let i = 0; i < 3; i++) {
      const bar = document.createElement("span");
      bar.className = "redacted-bar";
      bar.setAttribute("aria-hidden", "true");
      content.append(bar);
    }
    return;
  }
  card.removeAttribute("aria-label");
  card.dataset.tier = item.tier;
  if (item.tier === "empyrorite") content.append(empyroriteGem());
  const tier = document.createElement("small");
  tier.className = "achievement-tier";
  tier.textContent = `★ ${item.tier} · +${Achievements.points[item.tier]} points`;
  const title = document.createElement("h4");
  title.textContent = item.title;
  const description = document.createElement("p");
  description.textContent = item.wingdings ? item.description : `${item.group} · ${item.description}`;
  if (item.wingdings) description.className = "wingdings";
  const progress = document.createElement("progress");
  progress.max = item.target;
  progress.setAttribute("aria-label", item.title);
  const state = document.createElement("small");
  state.className = "achievement-state";
  content.append(tier, title, description, progress, state);
}
function updateAchievements(result) {
  if (!result.changed) return;
  persist();
  renderAchievements();
  celebrateAchievements(result.earned);
  showAchievementToasts([...result.earned, ...newCustomNotifications()]);
  if (selected === "customs") renderCustoms();
}
function initializeAchievements() {
  const visibleCards = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle("in-view", entry.isIntersecting);
  }, { root: $("achievements-list") });
  for (const item of Achievements.catalog) {
    const card = document.createElement("article");
    card.className = "achievement-card";
    card.dataset.achievement = item.id;
    achievementCards.set(item.id, card);
    $("achievements-list").append(card);
    visibleCards.observe(card);
  }
  const tabs = [$("scores-tab"), $("achievements-tab"), $("global-tab")];
  function selectTab(tab) {
    for (const button of tabs) {
      const selected = button === tab;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      $(button.getAttribute("aria-controls")).hidden = !selected;
    }
    if (tab.id === "global-tab") loadGlobalScores();
  }
  tabs.forEach((tab, index) => {
    tab.onclick = () => selectTab(tab);
    tab.onkeydown = event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = tabs[event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      selectTab(next);
      next.focus();
    };
  });
  $("achievement-filter").onchange = renderAchievements;
  $("achievement-search").oninput = renderAchievements;
  updateAchievements(achievementTracker.visit());
  renderAchievements();
}
function applyCubieCustom() {
  const item = CubieCustoms.selected(saved.cubieCustom, achievementTracker.data.unlocked, saved.shop.owned, saved.testerTon618);
  saved.cubieCustom = item.id;
  const cube = $("cube");
  cube.querySelector(".cubie-custom-art")?.remove();
  cube.classList.toggle("custom-equipped", item.id !== "classic");
  cube.dataset.custom = item.id;
  if (item.id !== "classic") cube.insertAdjacentHTML("beforeend", CubieCustoms.svg(item));
  document.querySelector('[data-game="customs"] .card-art').innerHTML = CubieCustoms.svg(item);
  const hint = document.querySelector(".cubie-hint-art .pixel-face");
  hint.querySelector(".cubie-custom-art")?.remove();
  hint.classList.toggle("custom-equipped", item.id !== "classic");
  if (item.id !== "classic") hint.insertAdjacentHTML("beforeend", CubieCustoms.svg(item));
  renderNowPlaying();
}
let previewCustomId = null;
function previewCustom(item) {
  previewCustomId = item.id;
  $("customs-equipped-name").textContent = item.name;
  document.querySelector(".customs-preview").dataset.tier = item.tier;
  $("customs-preview-tier").textContent = `${CubieCustoms.tierLabels[item.tier]} Custom`;
  $("customs-flavor").textContent = item.flavor;
  $("customs-preview-art").innerHTML = CubieCustoms.svg(item);
  const equipped = CubieCustoms.selected(saved.cubieCustom, achievementTracker.data.unlocked, saved.shop.owned, saved.testerTon618);
  $("customs-status").textContent = item.id === equipped.id ? `Now wearing ${item.name}.`
    : CubieCustoms.unlocked(item, achievementTracker.data.unlocked, saved.shop.owned, saved.testerTon618)
      ? "Preview only · Unlocked. Choose Wear Custom to equip."
      : item.price ? "Preview only · Locked. Buy this Custom in the Cubie Shop." : "Preview only · Locked. Earn its achievement to wear this Custom.";
  $("customs-grid").querySelectorAll(".custom-preview-button").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.preview === item.id));
  });
}
function renderCustoms() {
  const medals = achievementTracker.data.unlocked;
  const equipped = CubieCustoms.selected(saved.cubieCustom, medals, saved.shop.owned, saved.testerTon618);
  const count = CubieCustoms.catalog.filter(item => CubieCustoms.unlocked(item, medals, saved.shop.owned, saved.testerTon618)).length;
  $("customs-count").textContent = `${count} / ${CubieCustoms.catalog.length} Customs unlocked`;

  const filter = $("customs-filter").value;
  const cards = CubieCustoms.catalog.filter(item => {
    const unlocked = CubieCustoms.unlocked(item, medals, saved.shop.owned, saved.testerTon618);
    return filter === "all" || (filter === "unlocked" ? unlocked : !unlocked);
  }).map(item => {
    const unlocked = CubieCustoms.unlocked(item, medals, saved.shop.owned, saved.testerTon618);
    const wearing = equipped.id === item.id;
    const card = document.createElement("article");
    card.className = "custom-tile" + (unlocked ? "" : " custom-locked");
    card.dataset.custom = item.id;
    card.dataset.tier = item.tier;
    card.dataset.equipped = String(wearing);
    const art = document.createElement("button");
    art.type = "button";
    art.className = "custom-swatch custom-preview-button";
    art.dataset.preview = item.id;
    art.setAttribute("aria-label", `Preview ${item.name}`);
    art.innerHTML = CubieCustoms.svg(item) + "<span>Preview</span>";
    art.onclick = () => previewCustom(item);
    const title = document.createElement("h5");
    title.textContent = item.name;
    const tier = document.createElement("span");
    tier.className = "custom-tier";
    tier.textContent = `${CubieCustoms.tierLabels[item.tier]} Custom`;
    const requirement = document.createElement("p");
    if (item.id === "classic") requirement.textContent = "Your original arcade buddy. Always yours.";
    else if (item.price) requirement.textContent = `Cubie Shop · ${item.price} Cubie Cash`;
    else if (item.id === "gaster") requirement.textContent = "Some things are better left unexplained.";
    else if (item.id === "pumpkin") requirement.textContent = "Defeat the Pumpkin King in any mode.";
    else {
      const achievement = Achievements.catalog.find(a => a.id === item.achievements[0]);
      requirement.textContent = `${achievement.title} — ${achievement.description}`;
      if (achievement.collectionTier)
        requirement.textContent += ` (${achievementTracker.progress(achievement)} / ${achievement.target})`;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "custom-equip";
    button.disabled = !unlocked;
    button.textContent = wearing ? "Equipped ✓" : unlocked ? "Wear Custom" : "Locked";
    button.setAttribute("aria-label", `${wearing ? "Wearing" : unlocked ? "Wear" : "Locked:"} ${item.name}`);
    button.setAttribute("aria-pressed", String(wearing));
    button.onclick = () => {
      if (!CubieCustoms.unlocked(item, achievementTracker.data.unlocked, saved.shop.owned, saved.testerTon618)) return;
      saved.cubieCustom = item.id;
      previewCustomId = item.id;
      applyCubieCustom();
      persist();
      renderCustoms();
      $("customs-status").textContent = `Now wearing ${item.name}.`;
      $("customs-grid").querySelector(`[data-custom="${item.id}"] .custom-equip`)?.focus({ preventScroll: true });
    };
    card.append(art, title, tier, requirement, button);
    return card;
  });
  $("customs-grid").replaceChildren(...cards);
  previewCustom(CubieCustoms.catalog.find(item => item.id === previewCustomId) || equipped);
  updateCustomsSearch();
}
$("customs-filter").onchange = renderCustoms;
$("customs-search").oninput = updateCustomsSearch;
$("shop-search").oninput = updateShopSearch;

let shopCategory = "customs";
function setShopCategory(category) {
  shopCategory = category;
  $("shop-grid").hidden = category !== "customs";
  $("trail-room").hidden = category !== "trails";
  $("shop-customs-tab").setAttribute("aria-pressed", String(category === "customs"));
  $("shop-trails-tab").setAttribute("aria-pressed", String(category === "trails"));
  updateShopSearch();
}
$("shop-customs-tab").onclick = () => setShopCategory("customs");
$("shop-trails-tab").onclick = () => setShopCategory("trails");
$("trail-remove").onclick = () => {
  saved.turtleTrail = null;
  turtleTrailField.reset();
  persist();
  renderShop();
  $("shop-status").textContent = "Turtle trail removed.";
  $("trail-remove").focus({ preventScroll: true });
};
function renderTrails() {
  const equipped = TurtleTrails.selected(saved.turtleTrail, saved.shop.owned);
  $("trail-equipped").textContent = `Equipped: ${equipped?.name || "No trail"}`;
  $("trail-remove").setAttribute("aria-pressed", String(!equipped));
  $("trail-grid").replaceChildren(...[...TurtleTrails.catalog].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name)).map(item => {
    const owned = saved.shop.owned.includes(item.id), wearing = equipped?.id === item.id;
    const card = document.createElement("article");
    card.className = "custom-tile trail-tile";
    card.dataset.trail = item.id;
    card.dataset.tier = item.tier;
    card.dataset.equipped = String(wearing);
    card.style.setProperty("--trail-color", item.colors[0]);
    const art = document.createElement("div");
    art.className = "trail-preview";
    art.innerHTML = TurtleTrails.preview(item);
    const name = document.createElement("h5"); name.textContent = item.name;
    const type = document.createElement("span"); type.className = "custom-tier"; type.textContent = `${CubieCustoms.tierLabels[item.tier]} Turtle Trail`;
    const flavor = document.createElement("p"); flavor.textContent = item.flavor;
    const price = document.createElement("strong"); price.className = "shop-price";
    price.textContent = owned ? "Owned" : `${item.price.toLocaleString()} Cubie Cash`;
    const button = document.createElement("button"); button.className = "custom-equip";
    button.textContent = wearing ? "Equipped ✓" : owned ? "Equip trail" : `Buy · ${item.price.toLocaleString()} Cash`;
    button.setAttribute("aria-label", `${owned ? "Equip" : "Buy"} ${item.name} trail`);
    button.disabled = wearing || (!owned && CubieShop.balance(saved.shop) < item.price);
    button.onclick = () => {
      if (saved.shop.owned.includes(item.id)) {
        saved.turtleTrail = item.id;
        turtleTrailField.reset();
        $("shop-status").textContent = `${item.name} equipped. Your turtle is ready to leave a trail.`;
      } else {
        if (!CubieShop.buy(saved.shop, item)) return;
        $("shop-status").textContent = `${item.name} is yours! Choose Equip trail to use it.`;
      }
      persist(); renderShop();
      cardFocus(item.id);
    };
    card.append(art, name, type, flavor, price, button);
    return card;
  }));
}
function cardFocus(id) { $("trail-grid").querySelector(`[data-trail="${id}"] button`)?.focus({ preventScroll: true }); }
function renderShop() {
  setShopCategory(shopCategory);
  renderTrails();
  $("shop-balance").textContent = `${CubieShop.balance(saved.shop).toLocaleString()} Cubie Cash`;
  $("shop-progress").textContent = `${(saved.shop.units % 1000 / 10).toLocaleString()} / 100 converted score toward your next Cash.`;
  $("shop-rates").replaceChildren(...Object.entries(CubieShop.rates).map(([mode, rate]) => {
    const p = document.createElement("p");
    p.textContent = `${modes[mode].title}: score × ${rate.base}. ` + Object.entries(rate.modes)
      .map(([difficulty, bonus]) => `${modes[mode].difficulties[difficulty][0]} ×${bonus}`).join(" · ");
    return p;
  }));
  $("shop-grid").replaceChildren(...CubieCustoms.catalog.filter(item => item.price).sort((a, b) => a.price - b.price || a.name.localeCompare(b.name)).map(item => {
    const owned = saved.shop.owned.includes(item.id);
    const wearing = saved.cubieCustom === item.id;
    const card = document.createElement("article");
    card.className = "custom-tile";
    card.dataset.custom = item.id;
    card.dataset.tier = item.tier;
    card.dataset.equipped = String(wearing);
    const art = document.createElement("div");
    art.className = "custom-swatch";
    art.innerHTML = CubieCustoms.svg(item);
    const name = document.createElement("h5");
    name.textContent = item.name;
    const tier = document.createElement("span");
    tier.className = "custom-tier";
    tier.textContent = `${CubieCustoms.tierLabels[item.tier]} Custom`;
    const flavor = document.createElement("p");
    flavor.textContent = item.flavor;
    const price = document.createElement("strong");
    price.className = "shop-price";
    price.textContent = owned ? "In your closet" : `${item.price} Cubie Cash`;
    const button = document.createElement("button");
    button.className = "custom-equip";
    button.disabled = wearing || (!owned && CubieShop.balance(saved.shop) < item.price);
    button.textContent = wearing ? "Equipped ✓" : owned ? "Wear Custom" : `Buy · ${item.price} Cash`;
    button.setAttribute("aria-label", `${owned ? "Wear" : "Buy"} ${item.name}`);
    button.onclick = () => {
      if (saved.shop.owned.includes(item.id)) {
        saved.cubieCustom = item.id;
        applyCubieCustom();
        $("shop-status").textContent = `Now wearing ${item.name}.`;
      } else {
        if (!CubieShop.buy(saved.shop, item)) return;
        $("shop-status").textContent = `${item.name} is yours! Find it in your closet or choose Wear Custom.`;
        showAchievementToasts(newCustomNotifications());
      }
      persist();
      renderShop();
      $("shop-grid").querySelector(`[data-custom="${item.id}"] button`)?.focus({ preventScroll: true });
    };
    card.append(art, name, tier, flavor, price, button);
    return card;
  }));
  updateShopSearch();
}
function scoreKey() {
  return `${selected}:${selectedDifficulty}`;
}
function rankings() {
  if (!selectedDifficulty) return [];
  const entries = saved.scores[scoreKey()];
  if (!Array.isArray(entries)) return [];
  return entries.filter(
    (item) =>
      item &&
      typeof item.player === "string" &&
      Number.isFinite(item.score) &&
      item.score >= 0,
  );
}
function showScores() {
  if (modes[selected].temporary) {
    $("best").textContent = "—";
    const row = document.createElement("li");
    row.textContent = selected === "shop" ? "Play games to earn Cubie Cash. Spend it here on Customs and Turtle Trails." : selected === "customs" ? "Collect Customs through achievements and the Cubie Shop." : selected === "jukebox" ? "Just music. Pick a song and enjoy." : "Temporary practice — records are not saved.";
    $("scores-list").replaceChildren(row);
    return;
  }
  const scores = rankings().sort(
    (a, b) => b.score - a.score || a.player.localeCompare(b.player),
  );
  const player = $("player").value.trim() || "Player";
  $("best").textContent =
    scores.find((item) => item.player === player)?.score ?? "—";
  $("scores-list").replaceChildren();
  if (!scores.length) {
    const row = document.createElement("li");
    row.textContent = selectedDifficulty
      ? "Your name could be first."
      : "Choose a difficulty to see high scores.";
    $("scores-list").append(row);
  }
  scores.slice(0, 5).forEach((entry, index) => {
    const row = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = `${String(index + 1).padStart(2, "0")}  ${entry.player}`;
    const score = document.createElement("strong");
    score.textContent = entry.score;
    row.append(name, score);
    $("scores-list").append(row);
  });
}
function saveRound() {
  if (roundSaved || !snapshot) return;
  roundSaved = true;
  if (snapshot.over && !snapshot.won && ["boss", "pumpkin", "wrath", "singularity", "core_practice"].includes(selected)) playSound("boss_laugh");
  if (modes[selected].temporary) return;
  if (snapshot.over) countCompletedMinigame();
  lastCashReward = CubieShop.reward(saved.shop, selected, selectedDifficulty, snapshot.score);
  const list = rankings();
  const previous = list.find((entry) => entry.player === currentPlayer);
  if (previous) previous.score = Math.max(previous.score, snapshot.score);
  else list.push({ player: currentPlayer, score: snapshot.score });
  saved.scores[scoreKey()] = list;
  persist();
  showScores();
  publishGlobalScore({ mode: selected, difficulty: selectedDifficulty, player: currentPlayer, score: snapshot.score });
}
// The cloud identity uses its own key; never replace the existing local profile.
const leaderboardReady = fetch("./leaderboard-config.json", { cache: "no-store" })
  .then(response => response.ok ? response.json() : {})
  .catch(() => ({}))
  .then(config => new Leaderboards.Client(config));
let globalRequest = 0;
let submissionRequest = 0;
function updateGlobalDifficulties(difficulty) {
  const mode = $("leaderboard-game").value;
  document.querySelector('label[for="leaderboard-difficulty"]').textContent = mode === "wrath" ? "Attack" : "Difficulty";
  $("leaderboard-difficulty").replaceChildren(...Object.entries(modes[mode].difficulties).map(([value, [label]]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  }));
  if (Object.hasOwn(modes[mode].difficulties, difficulty)) $("leaderboard-difficulty").value = difficulty;
}
function initializeGlobalLeaderboards() {
  $("leaderboard-game").replaceChildren(...Object.entries(modes).filter(([, config]) => !config.localOnly).map(([value, config]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = config.title;
    return option;
  }));
  updateGlobalDifficulties();
  $("leaderboard-game").onchange = () => { updateGlobalDifficulties(); loadGlobalScores(); };
  $("leaderboard-difficulty").onchange = loadGlobalScores;
  $("leaderboard-refresh").onclick = async () => {
    await retryGlobalScores();
    loadGlobalScores();
  };
  window.addEventListener("online", async () => {
    await retryGlobalScores();
    if (!$("global-panel").hidden) loadGlobalScores();
  });
  retryGlobalScores();
}
async function loadGlobalScores() {
  const request = ++globalRequest;
  const mode = $("leaderboard-game").value, difficulty = $("leaderboard-difficulty").value;
  $("global-scores").replaceChildren();
  $("global-scores").setAttribute("aria-busy", "true");
  $("leaderboard-status").textContent = "Loading global rankings…";
  try {
    const client = await leaderboardReady;
    const rows = await client.list(mode, difficulty);
    if (request !== globalRequest) return;
    for (const entry of rows) {
      const row = document.createElement("li"), name = document.createElement("span"), score = document.createElement("strong");
      name.textContent = `${String(entry.rank).padStart(2, "0")}  ${entry.player}${entry.is_you ? " (you)" : ""}`;
      score.textContent = `${entry.score}${mode === "keyboard" ? " rounds" : " pts"}`;
      row.classList.toggle("is-you", entry.is_you === true);
      row.append(name, score);
      $("global-scores").append(row);
    }
    $("leaderboard-status").textContent = rows.length ? "Best scores from players everywhere." : "No scores yet. Set the first record!";
  } catch (error) {
    if (request === globalRequest) $("leaderboard-status").textContent = error.message;
  } finally {
    if (request === globalRequest) $("global-scores").setAttribute("aria-busy", "false");
  }
}
async function publishGlobalScore(entry) {
  if (modes[entry.mode]?.localOnly) return;
  const request = ++submissionRequest;
  try {
    const client = await leaderboardReady;
    if (!client.configured) return;
    $("leaderboard-submission").textContent = "Sharing your best score…";
    await client.submit(entry);
    if (request === submissionRequest) $("leaderboard-submission").textContent = "Your best score is on the global leaderboard.";
    if (!$("global-panel").hidden) loadGlobalScores();
  } catch {
    if (request === submissionRequest) $("leaderboard-submission").textContent = "Saved locally. We’ll retry your global score when you reconnect or press Refresh.";
  }
}
async function retryGlobalScores() {
  try {
    const client = await leaderboardReady;
    if (!client.configured || !Object.keys(client.pending).length) return;
    await client.flush();
    $("leaderboard-submission").textContent = "Your best score is on the global leaderboard.";
  } catch {
    $("leaderboard-submission").textContent = "Saved locally. We’ll retry your global score when you reconnect or press Refresh.";
  }
}
function send(action, extra = {}) {
  return JSON.parse(
    handle(JSON.stringify({ action, now: (performance.now() - gameTimeOffset) / 1000, ...extra })),
  );
}
function clearKeys() {
  keys.clear();
  resetJoystick();
  document
    .querySelectorAll("[data-key]")
    .forEach((button) => button.classList.remove("pressed"));
}
function setLocked(value) {
  $("player").disabled = value;
  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.disabled = value || (!ready && selected !== "jukebox");
  });
}
function fitArcade() {
  if ($("game-canvas").hidden) return;
  const heading = document.querySelector(".game-heading");
  const footer = document.querySelector(".game-footer");
  const headingMargin = parseFloat(getComputedStyle(heading).marginBottom);
  const chromeHeight = heading.offsetHeight + headingMargin + footer.offsetHeight
    + $("touch-controls").offsetHeight + $("player-health").offsetHeight + 28;
  const viewportHeight = window.visualViewport?.height ?? innerHeight;
  $("arena").style.setProperty("--player-health-height", `${$("player-health").offsetHeight}px`);
  const height = Math.max(1, viewportHeight - chromeHeight);
  const width = Math.min($("arena").clientWidth - 2, height * 680 / 560);
  $("game-canvas").style.width = `${width}px`;
  $("game-canvas").style.height = `${width * 560 / 680}px`;
}
function showGameArea() {
  fitArcade();
  document.querySelector(".game-main").scrollIntoView({ block: "start", behavior: "instant" });
}
function selectGame(mode) {
  coreAftermath = false;
  if (loadFailed && !["customs", "shop"].includes(mode)) return;
  if (["singularity", "core_practice"].includes(mode) && !saved.unlocks.singularity) return;
  updateAchievements(achievementTracker.abandon());
  resetDamageFeedback();
  turtleTrailField.reset();
  if (active && selected === "keyboard") saveRound();
  active = false;
  snapshot = null;
  clearKeys();
  selected = mode;
  selectedDifficulty = null;
  jukeboxPaused = false;
  $("jukebox-controls").hidden = mode !== "jukebox";
  $("customs-room").hidden = mode !== "customs";
  $("shop-room").hidden = mode !== "shop";
  $("arena").classList.remove("arcade");
  $("player-health").hidden = true;
  const config = modes[mode];
  document.documentElement.style.setProperty("--accent", config.accent);
  document.querySelectorAll("[data-game]").forEach((button) => {
    const chosen = button.dataset.game === (mode === "core_practice" ? "singularity" : mode);
    button.classList.toggle("selected", chosen);
    button.setAttribute("aria-pressed", String(chosen));
  });
  $("game-title").textContent = config.title;
  $("game-category").textContent = config.category;
  const icon = document.querySelector(`[data-game="${mode}"] .card-art svg`);
  if (icon) $("welcome-art").replaceChildren(icon.cloneNode(true));
  else $("welcome-art").textContent = config.art;
  $("welcome-title").textContent = config.heading;
  $("welcome-copy").textContent = config.copy;
  $("difficulty-title").textContent = config.choiceLabel || "Choose a difficulty to play";
  $("game-instruction").textContent = config.controls;
  $("difficulty-choices").replaceChildren(
    ...Object.entries(config.difficulties).map(([value, [label, description]]) => {
      const button = document.createElement("button");
      button.className = "difficulty-choice";
      button.dataset.difficulty = value;
      const title = document.createElement("strong");
      title.textContent = label;
      const detail = document.createElement("span");
      detail.textContent = description;
      button.append(title, detail);
      if (mode === "jukebox") styleSongCard(button, value);
      button.onclick = () => startGame(value);
      return button;
    }),
  );
  [
    "hangman-game",
    "keyboard-game",
    "game-canvas",
    "overlay",
    "pause",
    "exit",
    "touch-controls",
  ].forEach((id) => ($(id).hidden = true));
  $("welcome").hidden = ["customs", "shop"].includes(mode);
  if (mode === "shop") renderShop();
  if (mode === "customs") renderCustoms();
  $("metric").textContent = "—";
  $("score").textContent = "0";
  $("metric-label").textContent =
    mode === "hangman"
      ? "Guesses left"
      : mode === "keyboard"
        ? "Time left"
        : mode === "dodge"
          ? "Survived"
          : "Your HP";
  setLocked(false);
  showScores();
  if (!config.localOnly) {
    $("leaderboard-game").value = mode;
    updateGlobalDifficulties();
    if (!$("global-panel").hidden) loadGlobalScores();
  }
  syncMusic();
}
function startGame(difficulty) {
  coreAftermath = false;
  if (selected === "jukebox" && Object.hasOwn(modes.jukebox.difficulties, difficulty)) {
    selectedDifficulty = difficulty;
    jukeboxPaused = false;
    initializeAudio();
    syncMusic();
    return;
  }
  if (!ready || active || !Object.hasOwn(modes[selected].difficulties, difficulty))
    return;
  if (selected === "singularity" && difficulty === "practice") {
    selectGame("core_practice");
    showGameArea();
    return;
  }
  resetDamageFeedback();
  turtleTrailField.reset();
  selectedDifficulty = difficulty;
  if (!modes[selected].localOnly) {
    $("leaderboard-game").value = selected;
    updateGlobalDifficulties(difficulty);
    if (!$("global-panel").hidden) loadGlobalScores();
  }
  initializeAudio();
  currentPlayer = $("player").value.trim() || "Player";
  $("player").value = currentPlayer;
  saved.player = currentPlayer;
  persist();
  showScores();
  roundSaved = false;
  lastCashReward = 0;
  clearKeys();
  try {
    snapshot = send("start", {
      mode: selected,
      difficulty: selectedDifficulty,
    });
  } catch (error) {
    fail(error);
    return;
  }
  if (!modes[selected].temporary || selected === "core_practice")
    updateAchievements(achievementTracker.start(selected, selectedDifficulty));
  active = true;
  lastFrame = performance.now();
  $("welcome").hidden = true;
  $("overlay").hidden = true;
  $("exit").hidden = false;
  $("hangman-game").hidden = selected !== "hangman";
  $("keyboard-game").hidden = selected !== "keyboard";
  if (selected === "keyboard") {
    touchTypingUpper = false; touchTypingSymbols = false;
    $("typing-input").value = "";
    renderTypingKeys();
  }
  const arcade = ["dodge", "boss", "pumpkin", "wrath", "singularity", "core_practice"].includes(selected);
  $("arena").classList.toggle("arcade", arcade);
  $("game-canvas").hidden = !arcade;
  $("game-canvas").setAttribute("aria-label", `${modes[selected].title}. ${modes[selected].controls}`);
  $("touch-controls").hidden =
    !arcade || !matchMedia("(pointer: coarse)").matches;
  $("touch-fire").hidden = ["dodge", "core_practice"].includes(selected);
  $("touch-fire").textContent = selected === "singularity" ? "Laser" : "Fire";
  $("touch-counter").hidden = !["pumpkin", "wrath"].includes(selected);
  setLocked(true);
  render();
  showGameArea();
  $("arena").focus({ preventScroll: true });
}
function showOverlay(title, copy, button, kicker) {
  $("overlay").classList.toggle("boss-defeat", !!snapshot?.over && !snapshot.won
    && ["boss", "pumpkin", "wrath", "singularity", "core_practice"].includes(selected));
  $("overlay-title").textContent = title;
  $("overlay-copy").textContent = copy;
  $("overlay-action").textContent = button;
  $("overlay-kicker").textContent = kicker;
  $("overlay").hidden = false;
}
function resetDamageFeedback() {
  previousBossHealth = null;
  damageFlashAnimation?.cancel();
  damageFlashAnimation = null;
  healingFlashAnimation?.cancel();
  healingFlashAnimation = null;
}
function updateDamageFeedback(s) {
  if (!["boss", "pumpkin", "wrath", "singularity", "core_practice"].includes(selected)) return;
  if (previousBossHealth && s.healing_collected > previousBossHealth.healing) {
    healingFlashAnimation?.cancel();
    healingFlashAnimation = $("healing-flash").animate(
      [{ opacity: 1 }, { opacity: 0 }], { duration: 340, easing: "ease-out" },
    );
  }
  // Cumulative damage catches a hit even if healing also happens in this frame.
  if (previousBossHealth && (s.lives < previousBossHealth.lives ||
      s.damage_taken > previousBossHealth.damage)) {
    damageFlashAnimation?.cancel();
    damageFlashAnimation = $("damage-flash").animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 340, easing: "ease-out" },
    );
  }
  previousBossHealth = { lives: s.lives, damage: s.damage_taken, healing: s.healing_collected };
}
function render() {
  const s = snapshot;
  updateDamageFeedback(s);
  if (!s.dying && (!modes[selected].temporary || selected === "core_practice")) updateAchievements(achievementTracker.observe(s));
  const hasHealth = ["boss", "pumpkin", "wrath", "singularity", "core_practice"].includes(selected);
  $("player-health").hidden = !hasHealth || s.arena_shattered;
  if (hasHealth) {
    const health = `${s.lives} / ${s.max_lives}`;
    if ($("player-health-value").textContent !== health)
      $("player-health-value").textContent = health;
    $("player-health-fill").style.width = `${100 * s.lives / s.max_lives}%`;
    $("player-health").dataset.low = String(s.lives <= s.max_lives / 3);
  }
  $("score").textContent = s.score;
  $("pause").hidden = !s.can_pause || s.over;
  $("pause").textContent = s.paused ? "Resume · D" : "Pause · D";
  if (selected === "hangman") {
    $("hangman-picture").textContent = s.picture;
    $("word").textContent = s.word;
    $("guess-feedback").textContent =
      s.message || `${s.remaining} wrong guesses left.`;
    $("metric").textContent = s.remaining;
    document
      .querySelectorAll("#alphabet button")
      .forEach(
        (button) =>
          (button.disabled =
            s.over || s.guessed.includes(button.dataset.letter)),
      );
  } else if (selected === "keyboard") {
    $("typing-level").textContent = `ROUND ${s.level}`;
    $("sequence").replaceChildren(
      ...[...s.sequence].map((letter, index) => {
        const span = document.createElement("span");
        span.textContent = letter;
        if (index < s.matched) span.className = "matched";
        else if (index === s.matched) span.className = "next";
        return span;
      }),
    );
    $("typing-feedback").textContent =
      `${s.mistakes} mistakes · ${s.score} rounds completed`;
    $("metric").textContent = `${s.remaining.toFixed(1)}s`;
    $("timer-bar").style.width =
      `${Math.max(0, Math.min(100, (s.remaining / Math.max(4, 8 - (s.level - 1) * 0.25)) * 100))}%`;
  } else {
    draw(s);
    if (selected === "singularity") {
      $("touch-fire").disabled = !s.laser_ready;
      $("touch-fire").textContent = s.laser_firing ? "Firing!" : s.laser_ready ? "FIRE LASER" : "Laser locked";
    } else $("touch-fire").disabled = false;
    $("metric").textContent =
      selected === "dodge" ? `${s.elapsed}s` : `${s.lives} / ${s.max_lives}`;
    $("game-instruction").textContent = s.label || modes[selected].controls;
    for (const event of s.sounds) playSound(event);
  }
  if (s.dying) {
    clearKeys();
    $("pause").hidden = true;
    $("overlay").hidden = true;
  } else if (s.over) {
    active = false;
    clearKeys();
    setLocked(false);
    saveRound();
    $("pause").hidden = true;
    let title = s.won ? "You did it!" : "One more try?";
    let copy = s.death_message || `Score: ${s.score}. Your personal best is saved.`;
    if (selected === "hangman")
      copy = `The word was ${s.word.replaceAll(" ", "")}. Score: ${s.score}.`;
    if (selected === "keyboard") {
      title = "Time’s up!";
      copy = `${s.score} rounds completed. Your fingers earned a rematch.`;
    }
    if (lastCashReward) copy += ` +${(lastCashReward / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })} Cubie Cash earned.`;
    if (selected === "core_practice") {
      if (selectedDifficulty === "final_cutscene") {
        title = "Singularity erased.";
        copy = "Cutscene complete. Watch again or choose a practice attack. No records or achievements awarded.";
      } else {
        copy = `${s.death_message} Choose another attack or try this one again.`;
      }
    }
    if (selected === "singularity" && s.won) {
      title = "Singularity erased.";
      copy = `Score: ${s.score}. All 15 protocols survived. ${s.lives} / 10 HP remaining. The annihilation laser finished the Core.`;
    }
    showOverlay(
      title,
      copy,
      "Play again ↗",
      s.won ? "ROUND COMPLETE" : "GOOD GAME",
    );
  } else if (s.paused)
    showOverlay(
      "Take a breather.",
      "Your game will be right here.",
      "Resume game",
      "PAUSED",
    );
  else $("overlay").hidden = true;
  syncMusic();
}
const turtleTrailField = new TurtleTrails.Field();
const trailReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const ctx = $("game-canvas").getContext("2d");
function draw(s) {
  ctx.clearRect(0, 0, 680, 560);
  ctx.save();
  ctx.translate(340, 280);
  const [left, right, bottom, top] = s.bounds;
  ctx.fillStyle = "#111827";
  ctx.fillRect(left, -top, right - left, top - bottom);
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, -top, right - left, top - bottom);
  ctx.clip();
  for (const command of s.commands) {
    if (command.role === "player" && TurtleTrails.allowedModes.has(s.mode) && !trailReducedMotion.matches)
      turtleTrailField.draw(ctx, TurtleTrails.selected(saved.turtleTrail, saved.shop.owned));
    const c = command.coords;
    if (command.kind === "clip_start") {
      ctx.save();
      ctx.beginPath();
      ctx.rect(c[0], c[1], c[2] - c[0], c[3] - c[1]);
      ctx.clip();
      continue;
    }
    if (command.kind === "clip_end") {
      ctx.restore();
      continue;
    }
    ctx.beginPath();
    ctx.fillStyle = command.fill || "transparent";
    ctx.strokeStyle = command.outline || "transparent";
    ctx.lineWidth = command.width || 1;
    if (command.kind === "rectangle")
      ctx.rect(c[0], c[1], c[2] - c[0], c[3] - c[1]);
    else if (command.kind === "polygon") {
      ctx.moveTo(c[0], c[1]);
      for (let i = 2; i < c.length; i += 2) ctx.lineTo(c[i], c[i + 1]);
      ctx.closePath();
    } else if (command.kind === "oval")
      ctx.ellipse(
        (c[0] + c[2]) / 2,
        (c[1] + c[3]) / 2,
        Math.abs(c[2] - c[0]) / 2,
        Math.abs(c[3] - c[1]) / 2,
        0,
        0,
        Math.PI * 2,
      );
    else if (command.kind === "text") {
      ctx.font = `bold ${command.font?.[1] || 18}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(command.text, c[0], c[1]);
      continue;
    }
    if (command.fill) ctx.fill();
    if (command.outline) ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle =
    selected === "dodge" && s.difficulty === "merciless"
      ? "#ff4565"
      : "#45534b";
  ctx.lineWidth = 2;
  if (!s.arena_shattered) ctx.strokeRect(left, -top, right - left, top - bottom);
  if (s.hp !== null && !["singularity", "core_practice"].includes(selected)) {
    ctx.fillStyle = "#344039";
    ctx.fillRect(-110, -264, 220, 6);
    ctx.fillStyle = modes[selected].accent;
    ctx.fillRect(-110, -264, (220 * s.hp) / s.max_hp, 6);
    ctx.fillStyle = "#d8dfd7";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`BOSS ${s.hp} / ${s.max_hp}`, 0, -270);
  }
  ctx.restore();
}
function guess(letter) {
  if (!active || selected !== "hangman") return;
  snapshot = send("guess", { key: letter });
  render();
}
function type(key) {
  if (!active || selected !== "keyboard") return;
  snapshot = send("key", { key });
  render();
}
function pause() {
  if ($("cubie-hint").open) return;
  if (!active || !snapshot?.can_pause) return;
  clearKeys();
  snapshot = send("pause");
  render();
  lastFrame = performance.now();
}
function fireCoreLaser() {
  if (!active || selected !== "singularity" || !snapshot?.laser_ready || snapshot.paused) return;
  snapshot = send("laser");
  render();
}
function exitGame() {
  if (selected === "keyboard" && active) saveRound();
  selectGame(selected);
}
function fail(error) {
  updateAchievements(achievementTracker.abandon());
  resetDamageFeedback();
  console.error(error);
  loadFailed = true;
  active = false;
  ready = false;
  syncMusic();
  clearKeys();
  setLocked(false);
  $("runtime-status").textContent =
    "Unable to load games. Check your connection and reload.";
  showOverlay(
    "The arcade needs a restart.",
    "Check your internet connection, then reload to try again.",
    "Reload arcade",
    "LOADING PROBLEM",
  );
  $("overlay-action").onclick = () => location.reload();
}
function frame(now) {
  if (active && !gasterActive && !coreOrigin?.open && !$("cubie-hint").open && selected !== "hangman") {
    try {
      snapshot = send("tick", {
        dt: (now - lastFrame) / 1000,
        keys: [...new Set([...keys, ...joystickKeys])],
      });
      turtleTrailField.update((now - lastFrame) / 1000, snapshot,
        TurtleTrails.selected(saved.turtleTrail, saved.shop.owned), trailReducedMotion.matches);
      render();
    } catch (error) {
      fail(error);
    }
  }
  if (!active && ready && snapshot?.over && !snapshot.won && !document.hidden
      && !gasterActive && !coreOrigin?.open && !trailReducedMotion.matches
      && ["boss", "pumpkin", "wrath", "singularity", "core_practice"].includes(selected)) {
    try {
      snapshot = send("defeat_frame", { dt: (now - lastFrame) / 1000 });
      draw(snapshot);
    } catch (error) { fail(error); }
  }
  const noteIcon = document.querySelector('[data-game="jukebox"] .card-art');
  if (noteIcon) {
    const pulse = soundOn && !document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? musicPlayer?.melodyPulse() || 0 : 0;
    noteIcon.style.transform = `scale(${1 + pulse * .22})`;
  }
  lastFrame = now;
  requestAnimationFrame(frame);
}
for (const letter of "abcdefghijklmnopqrstuvwxyz") {
  const button = document.createElement("button");
  button.textContent = letter.toUpperCase();
  button.dataset.letter = letter;
  button.setAttribute("aria-label", `Guess ${letter.toUpperCase()}`);
  button.onclick = () => guess(letter);
  $("alphabet").append(button);
}
document
  .querySelectorAll("[data-game]")
  .forEach(
    (button) => (button.onclick = () => {
      selectGame(button.dataset.game);
      showGameArea();
    }),
  );
let singularityNameTimer;
$("player").oninput = () => {
  clearTimeout(singularityNameTimer);
  showScores();
  const name = $("player").value.trim().toLowerCase();
  if (CubieCustoms.redeemTesterCode(name)) {
    saved.testerTon618 = true;
    showAchievementToasts(newCustomNotifications());
    saved.cubieCustom = "ton_618";
    applyCubieCustom();
    if (selected === "customs") renderCustoms();
    persist();
    $("name-surprise").dataset.secret = "ton618tester";
    $("name-surprise").textContent = "TON 618 tester Custom unlocked. No achievement awarded.";
    $("name-surprise").hidden = false;
    clearTimeout(nameSurpriseTimer);
    nameSurpriseActive = true;
    syncMusic();
    nameSurpriseTimer = setTimeout(() => {
      nameSurpriseActive = false;
      $("name-surprise").hidden = true;
      syncMusic();
    }, 4000);
    previousSecretName = "";
    return;
  }
  if (name === "gravitron") {
    // Allow the longer tester code to be typed without firing its prefix.
    singularityNameTimer = setTimeout(() => {
      if ($("player").value.trim().toLowerCase() !== "gravitron") return;
      unlockSingularity();
      initializeAudio();
      coreOrigin.play();
    }, 800);
    return;
  }
  if (name === "gaster") {
    history.replaceState({ ...history.state, gasterSequence: { soundOn } }, "");
    saved.player = $("player").value.trim();
    persist();
    location.reload();
    return;
  }
  const secret = name === "rocknroy" || Object.hasOwn(nameSecrets, name) ? name : "";
  if (secret && secret !== previousSecretName) {
    updateAchievements(achievementTracker.secret(secret));
    if (secret === "rocknroy") {
      clearTimeout(nameSurpriseTimer);
      nameSurpriseActive = false;
      $("name-surprise").hidden = true;
      pendingRockSong = ArcadeMusic.pickRockTrack().id;
      initializeAudio();
      syncMusic();
    } else {
      $("name-surprise").dataset.secret = secret;
      $("name-surprise").textContent = nameSecrets[secret];
      if (secret === "cubie") blushCubie();
      nameSurpriseActive = true;
      $("name-surprise").hidden = false;
      clearTimeout(nameSurpriseTimer);
      syncMusic();
      nameSurpriseTimer = setTimeout(() => {
        nameSurpriseActive = false;
        $("name-surprise").hidden = true;
        syncMusic();
      }, 4000);
    }
  }
  previousSecretName = secret;
};
let blushTimer;
function blushCubie() {
  $("cube").classList.add("blushing");
  clearTimeout(blushTimer);
  blushTimer = setTimeout(() => $("cube").classList.remove("blushing"), 1800);
  initializeAudio();
  playSound("squeak");
}
$("cube").onclick = () => {
  updateAchievements(achievementTracker.secret("cube"));
  blushCubie();
};
$("exit").onclick = exitGame;
$("pause").onclick = pause;
$("overlay-action").onclick = () => {
  if (snapshot?.paused) pause();
  else {
    selectGame(selected);
    $("difficulty-choices").querySelector("button").focus({ preventScroll: true });
    showGameArea();
  }
};
const arrowMap = {
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
};
window.addEventListener("keydown", (event) => {
  if (gasterActive || coreOrigin?.open || $("cubie-hint").open) return;
  if (event.target.closest("#cube, .profile-tabs, #achievements-panel, #customs-room, #shop-room")) return;
  const input = event.target.closest("input,select,textarea");
  if (input && event.target !== $("typing-input")) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === "Escape") {
    if (selected === "jukebox") {
      $("jukebox-stop").click();
      return;
    }
    if (active || snapshot) {
      event.preventDefault();
      exitGame();
    }
    return;
  }
  if (selected === "hangman" && active && /^[a-z]$/i.test(event.key)) {
    event.preventDefault();
    guess(event.key);
    return;
  }
  if (
    selected === "keyboard" &&
    active &&
    event.key.length === 1 &&
    event.target !== $("typing-input")
  ) {
    event.preventDefault();
    type(event.key);
    return;
  }
  if (["dodge", "boss", "pumpkin", "wrath", "singularity", "core_practice"].includes(selected)) {
    if (
      event.key === " " &&
      !active &&
      ready &&
      event.target.tagName !== "BUTTON"
    ) {
      event.preventDefault();
      selectGame(selected);
      $("difficulty-choices").querySelector("button").focus();
      return;
    }
    if (!active) return;
    if (event.key.toLowerCase() === "d" && !event.repeat) {
      event.preventDefault();
      pause();
      return;
    }
    const key = arrowMap[event.key] || event.key.toLowerCase();
    if (["Up", "Down", "Left", "Right", "f", "e"].includes(key)) {
      event.preventDefault();
      keys.add(key);
      if (key === "f" && !event.repeat) fireCoreLaser();
    }
  }
});
window.addEventListener("keyup", (event) =>
  keys.delete(arrowMap[event.key] || event.key.toLowerCase()),
);
window.addEventListener("blur", () => {
  clearKeys();
  if (active && snapshot?.can_pause && !snapshot.paused) pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearKeys();
    if (active && snapshot?.can_pause && !snapshot.paused) pause();
  }
  syncMusic();
});
let touchTypingUpper = false;
let touchTypingSymbols = false;
function renderTypingKeys() {
  const rows = touchTypingSymbols ? ["1234567890", "!@#$%&", "*?+-="] : ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  $("typing-keys").replaceChildren(...rows.map(row => {
    const group = document.createElement("div");
    group.className = "typing-key-row";
    for (const raw of row) {
      const key = touchTypingUpper && !touchTypingSymbols ? raw.toUpperCase() : raw;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = key;
      button.dataset.typingKey = key;
      button.setAttribute("aria-label", `Type ${key}`);
      button.onpointerdown = event => event.preventDefault();
      button.onclick = () => type(key);
      group.append(button);
    }
    return group;
  }));
  $("typing-shift").setAttribute("aria-pressed", String(touchTypingUpper));
  $("typing-shift").disabled = touchTypingSymbols;
  $("typing-symbols").textContent = touchTypingSymbols ? "ABC" : "123 / Symbols";
  $("typing-symbols").setAttribute("aria-pressed", String(touchTypingSymbols));
}
$("typing-shift").onclick = () => { touchTypingUpper = !touchTypingUpper; renderTypingKeys(); };
$("typing-symbols").onclick = () => { touchTypingSymbols = !touchTypingSymbols; renderTypingKeys(); };
function consumeTypingInput(event) {
  if (event.isComposing) return;
  const value = event.target.value;
  event.target.value = "";
  for (const char of value) type(char);
}
$("typing-input").addEventListener("input", consumeTypingInput);
$("typing-input").addEventListener("compositionend", consumeTypingInput);
// Keep game surfaces from starting selection/long-press callouts. Editable
// fields retain normal caret behavior so players can still enter their name.
document.addEventListener("selectstart", event => {
  if (!event.target.closest?.("input, textarea")) event.preventDefault();
});
document.addEventListener("contextmenu", event => {
  if (matchMedia("(pointer: coarse)").matches && !event.target.closest?.("input, textarea")) event.preventDefault();
});
function resetJoystick() {
  const stick = $("touch-joystick");
  const pointer = joystickPointer;
  joystickPointer = null;
  joystickKeys.clear();
  stick.classList.remove("pressed");
  stick.style.removeProperty("--stick-x");
  stick.style.removeProperty("--stick-y");
  if (pointer !== null && stick.hasPointerCapture(pointer)) stick.releasePointerCapture(pointer);
}
function moveJoystick(event) {
  if (event.pointerId !== joystickPointer) return;
  event.preventDefault();
  const stick = $("touch-joystick");
  const rect = stick.getBoundingClientRect();
  const dx = event.clientX - rect.left - rect.width / 2;
  const dy = event.clientY - rect.top - rect.height / 2;
  const distance = Math.hypot(dx, dy);
  const radius = rect.width / 2 - 23;
  const scale = distance > radius ? radius / distance : 1;
  stick.style.setProperty("--stick-x", `${dx * scale}px`);
  stick.style.setProperty("--stick-y", `${dy * scale}px`);
  joystickKeys.clear();
  if (distance < radius * .25) return;
  // Eight sectors allow diagonals without making cardinal movement twitchy.
  const sector = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  for (const key of [
    ["Right"], ["Right", "Down"], ["Down"], ["Left", "Down"],
    ["Left"], ["Left", "Up"], ["Up"], ["Right", "Up"],
  ][(sector + 8) % 8]) joystickKeys.add(key);
}
$("touch-joystick").addEventListener("pointerdown", event => {
  if (joystickPointer !== null || !active || snapshot?.paused || event.button !== 0) return;
  joystickPointer = event.pointerId;
  $("touch-joystick").setPointerCapture(event.pointerId);
  $("touch-joystick").classList.add("pressed");
  moveJoystick(event);
});
$("touch-joystick").addEventListener("pointermove", moveJoystick);
for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
  $("touch-joystick").addEventListener(type, event => {
    if (event.pointerId === joystickPointer) resetJoystick();
  });
}
document.querySelectorAll("[data-key]").forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    keys.add(button.dataset.key);
    if (button.dataset.key === "f") fireCoreLaser();
    button.classList.add("pressed");
  });
  const release = () => {
    keys.delete(button.dataset.key);
    button.classList.remove("pressed");
  };
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});
let soundOn = pendingGaster?.soundOn !== false;
let audioContext;
let audioMaster;
let musicPlayer;
let sequencePlayer;
let pendingAchievementDing = false;
let pendingRockSong = null;
const soundEffects = new Set();
if (!soundOn) {
  $("sound").textContent = "Sound off";
  $("sound").setAttribute("aria-pressed", "false");
}
$("sound").onclick = () => {
  soundOn = !soundOn;
  if (!soundOn) pendingAchievementDing = false;
  $("sound").textContent = soundOn ? "Sound on" : "Sound off";
  $("sound").setAttribute("aria-pressed", String(soundOn));
  if (audioMaster) {
    audioMaster.gain.cancelAndHoldAtTime(audioContext.currentTime);
    audioMaster.gain.linearRampToValueAtTime(soundOn ? 1 : 0, audioContext.currentTime + .02);
  }
  syncMusic();
  initializeAudio();
};
function syncMusic() {
  if (selected === "jukebox") renderJukebox();
  if (sequencePlayer) {
    const kind = snapshot?.dying ? "death" : snapshot?.laser_firing ? "finale" : null;
    sequencePlayer.sync(active ? kind : null, kind === "death" ? snapshot.death_age : snapshot?.cinematic_age,
      soundOn && !snapshot?.paused && !document.hidden && !gasterActive && !coreOrigin?.open && !loadFailed);
  }
  if (!musicPlayer) return;
  const state = {
    theme: coreAftermath ? "core_aftermath" : selected === "jukebox" && selectedDifficulty ? `jukebox:${selectedDifficulty}`
      : active && ["singularity", "core_practice"].includes(selected) ? "singularity"
      : active && ["pumpkin", "wrath"].includes(selected) ? "pumpkin"
      : active && selected === "keyboard" ? "keyrush"
      : active && selected === "hangman" ? "hangman"
      : active && selected === "dodge" ? `dodge_${selectedDifficulty}`
      : active && selected === "boss" ? `boss_${selectedDifficulty}` : "arcade",
    playing: soundOn && !gasterActive && !coreOrigin?.open && !nameSurpriseActive && !$("cubie-hint").open && !document.hidden && !snapshot?.paused && !loadFailed
      && (coreAftermath || selected !== "jukebox" || !!selectedDifficulty && !jukeboxPaused),
  };
  if (pendingRockSong) {
    musicPlayer.playOnce(pendingRockSong, state);
    pendingRockSong = null;
  } else musicPlayer.setState(state);
}
function renderNowPlaying() {
  const indicator = $("now-playing");
  const track = ArcadeMusic.jukeboxTracks.find(track => track.id === musicPlayer?.current?.track);
  const audible = soundOn && musicPlayer?.playing && audioContext?.state === "running" && track;
  indicator.hidden = !audible;
  const text = audible ? `♫ Now playing: ${track.title}` : "";
  if (indicator.textContent !== text) indicator.textContent = text;
  updateAchievements(achievementTracker.hearMusic(track?.id, saved.cubieCustom, !!audible));
}
function renderJukebox() {
  const title = modes.jukebox.difficulties[selectedDifficulty]?.[0];
  $("jukebox-status").textContent = title
    ? `${!soundOn ? "Muted" : jukeboxPaused ? "Paused" : "Now playing"}: ${title}` : "Choose a song to start listening.";
  $("jukebox-pause").textContent = jukeboxPaused ? "Resume" : "Pause";
  $("jukebox-pause").disabled = $("jukebox-stop").disabled = !title;
  document.querySelectorAll("[data-difficulty]").forEach(button =>
    button.setAttribute("aria-pressed", String(button.dataset.difficulty === selectedDifficulty)));
}
$("jukebox-pause").onclick = () => {
  jukeboxPaused = !jukeboxPaused;
  initializeAudio();
  syncMusic();
};
$("jukebox-stop").onclick = () => {
  selectedDifficulty = null;
  jukeboxPaused = false;
  syncMusic();
};
function initializeAudio() {
  if (!soundOn) return;
  try {
    // Browsers unlock sound on a click/key press. Keep one context and one loop.
    if (!audioContext) {
      audioContext = new AudioContext();
      audioMaster = audioContext.createGain();
      audioMaster.connect(audioContext.destination);
      musicPlayer = new ArcadeMusic.Player(audioContext, audioMaster);
      musicPlayer.onPlaybackChange = renderNowPlaying;
      audioContext.addEventListener("statechange", renderNowPlaying);
      sequencePlayer = new ArcadeEffects.SequencePlayer(audioContext, audioMaster);
    }
    audioContext.resume().then(() => {
      syncMusic();
      if (pendingAchievementDing && soundOn) {
        pendingAchievementDing = false;
        playSound("achievement");
      }
    }).catch(() => {});
    syncMusic();
  } catch {
    soundOn = false;
    $("sound").textContent = "Sound unavailable";
    $("sound").setAttribute("aria-pressed", "false");
  }
}
document.addEventListener("click", initializeAudio);
document.addEventListener("keydown", event => {
  if (!event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) initializeAudio();
});
function playSound(event) {
  if (!soundOn || !audioContext || gasterActive) return;
  if (["turtle_death", "core_laser", "core_implode", "core_destroyed"].includes(event)) return;
  const oscillator = audioContext.createOscillator(),
    gain = audioContext.createGain(),
    now = audioContext.currentTime;
  const laugh = event === "boss_laugh";
  const squeak = event === "squeak";
  const ding = event === "achievement";
  const scare = event === "scare";
  const core = {
    core_teleport: [950, 180, .09, .035],
    core_protocol: [440, 80, .28, .065],
    core_hit: [120, 35, .24, .12],
    core_heal: [520, 1040, .3, .07],
    core_exposed: [330, 1320, .7, .09],
    core_laser: [65, 780, 1.2, .14],
    core_destroyed: [180, 25, 1, .13],
  }[event];
  const duration = laugh ? 1.65 : core ? core[2] : ding ? .7 : squeak ? .24 : scare ? .38 : .36;
  oscillator.type = squeak || ding ? "sine" : "sawtooth";
  if (laugh) {
    // Four voiced ha syllables: a falling pitch and a fresh breath on each.
    oscillator.type = "triangle";
    gain.gain.setValueAtTime(.001, now);
    const base = ["pumpkin", "wrath"].includes(selected) ? 165 : selected === "boss" ? 120 : 75;
    for (let i = 0; i < 4; i++) {
      const t = now + i * .36;
      oscillator.frequency.setValueAtTime(base * (1.3 - i * .07), t);
      oscillator.frequency.exponentialRampToValueAtTime(base * .73, t + .24);
      gain.gain.setValueAtTime(.001, t);
      gain.gain.exponentialRampToValueAtTime(.36, t + .035);
      gain.gain.exponentialRampToValueAtTime(.001, t + .28);
    }
  } else if (core) {
    oscillator.type = ["core_teleport", "core_exposed", "core_heal"].includes(event) ? "sine" : "sawtooth";
    oscillator.frequency.setValueAtTime(core[0], now);
    oscillator.frequency.exponentialRampToValueAtTime(core[1], now + duration * .9);
    gain.gain.setValueAtTime(.001, now);
    gain.gain.exponentialRampToValueAtTime(core[3], now + .01);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
  } else if (scare) {
    oscillator.frequency.setValueAtTime(180, now);
    oscillator.frequency.exponentialRampToValueAtTime(45, now + .37);
    gain.gain.setValueAtTime(.001, now);
    for (const offset of [0, .12, .24]) {
      gain.gain.exponentialRampToValueAtTime(.18, now + offset + .015);
      gain.gain.exponentialRampToValueAtTime(.001, now + offset + .10);
    }
  } else {
    oscillator.frequency.setValueAtTime(ding ? 1568 : squeak ? 650 : event === "slam" ? 65 : 95, now);
    if (squeak) oscillator.frequency.exponentialRampToValueAtTime(1500, now + .07);
    if (!ding) oscillator.frequency.exponentialRampToValueAtTime(squeak ? 900 : 30, now + (squeak ? .2 : .3));
    gain.gain.setValueAtTime(squeak || ding ? .001 : .18, now);
    if (squeak || ding) gain.gain.exponentialRampToValueAtTime(ding ? .12 : .16, now + (ding ? .008 : .015));
    gain.gain.exponentialRampToValueAtTime(ding ? .001 : .003, now + (ding ? .69 : squeak ? .22 : .35));
  }
  oscillator.connect(gain);
  gain.connect(audioMaster);
  soundEffects.add(oscillator);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
    soundEffects.delete(oscillator);
  };
  oscillator.start(now);
  oscillator.stop(now + duration);
}
function startGasterSequence() {
  const started = performance.now();
  const focus = document.activeElement;
  const wasInert = document.body.inert;
  let source;
  let fallback;
  gasterActive = true;
  clearKeys();
  resetDamageFeedback();
  document.body.inert = true;
  document.body.classList.add("gaster-active");
  $("gaster-blackout").hidden = false;
  syncMusic();
  for (const effect of soundEffects) effect.stop();
  function finish() {
    if (!gasterActive) return;
    clearTimeout(fallback);
    if (source) {
      source.onended = null;
      source.stop();
      source.disconnect();
    }
    gameTimeOffset += performance.now() - started;
    lastFrame = performance.now();
    gasterActive = false;
    $("gaster-blackout").hidden = true;
    document.body.classList.remove("gaster-active");
    document.body.inert = wasInert;
    if (focus?.isConnected) focus.focus({ preventScroll: true });
    syncMusic();
    updateAchievements(achievementTracker.completeGaster());
  }
  try {
    if (soundOn && audioContext?.state === "running") {
      const data = ArcadeMusic.composeGaster();
      const buffer = audioContext.createBuffer(1, data.length, 22050);
      buffer.copyToChannel(data, 0);
      source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioMaster);
      source.onended = finish;
      source.start();
    }
  } catch {
    // Audio failure must never leave the page permanently black.
    if (source) {
      source.onended = null;
      source.disconnect();
      source = null;
    }
  }
  // Muted/unavailable audio follows the same duration. The extra second for a
  // playing source is a watchdog for contexts suspended by the browser.
  fallback = setTimeout(finish, (ArcadeMusic.gasterDuration + (source ? 1 : 0)) * 1000);
}
async function initialize() {
  try {
    const pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/",
    });
    const manifest = await fetch("./python-files.json", { cache: "no-store" });
    if (!manifest.ok) throw new Error("Missing Python manifest");
    const files = await manifest.json();
    pyodide.FS.mkdir("/game");
    await Promise.all(
      files.map(async (name) => {
        const response = await fetch(`./python/${name}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Missing ${name}`);
        pyodide.FS.writeFile(`/game/${name}`, await response.text());
      }),
    );
    pyodide.runPython(
      "import sys\nsys.path.insert(0, '/game')\nfrom bridge import handle",
    );
    handle = pyodide.globals.get("handle");
    const practice = send("core_practice_options");
    modes.core_practice.difficulties = Object.fromEntries(practice.attacks.map(attack => [
      attack.id, [`${String(attack.number).padStart(2, "0")} · ${attack.name}`, attack.hint],
    ]));
    modes.core_practice.difficulties.final_cutscene = [
      "Watch final cutscene", "Play the annihilation laser finale immediately. D pauses; Escape returns to practice.",
    ];
    ready = true;
    $("runtime-status").textContent = "● All games ready";
    setLocked(false);
  } catch (error) {
    fail(error);
  }
}
coreOrigin = new CoreOrigin.Film($("core-origin"), {
  audio: () => ({ context: audioContext, destination: audioMaster, enabled: soundOn }),
  toggleSound: () => $("sound").click(),
  onChange: open => { coreAftermath = !open; clearKeys(); syncMusic(); },
});
initializeGlobalLeaderboards();
initializeAchievements();
applyCubieCustom();
selectGame("hangman");
if (saved.unlocks.singularity || saved.player.trim().toUpperCase() === "GRAVITRON")
  unlockSingularity(false);
if (pendingGaster) {
  initializeAudio();
  setTimeout(startGasterSequence, Math.max(0, 5000 - performance.now()));
}
if (!storageAvailable)
  $("storage-note").textContent =
    "Storage is unavailable. Scores and achievements last for this visit only.";
requestAnimationFrame(frame);
const gameLayout = new ResizeObserver(() => fitArcade());
for (const selector of [".game-heading", ".game-footer", "#touch-controls", "#player-health"])
  gameLayout.observe(document.querySelector(selector));
function resizeGameArea() {
  if (!$("game-canvas").hidden) showGameArea();
}
window.addEventListener("resize", resizeGameArea);
window.visualViewport?.addEventListener("resize", resizeGameArea);
initialize();
