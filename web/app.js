"use strict";

const $ = (id) => document.getElementById(id);
const modes = {
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
      practice: ["Practice attacks (temporary)", "Choose any of the 15 attacks and repeat it while tuning the fight."],
    },
  },
  core_practice: {
    title: "Singularity Core Practice",
    category: "TEMPORARY / ATTACK PRACTICE",
    art: "◎",
    heading: "Choose a protocol. Perfect your escape.",
    copy: "Repeat any of the Core’s 15 attacks with 10 HP and a three-second countdown before each repeat. Galactic healing packs appear every three repeats. Practice does not award achievements or save records.",
    accent: "#65f5ff",
    controls: "Hold arrows to teleport · Release to center · D pauses · Esc picks another attack",
    choiceLabel: "Choose one of the 15 attacks",
    localOnly: true,
    temporary: true,
    // Loaded from the shared Python attacks so edits also update this picker.
    difficulties: {},
  },
};
let selected = "hangman";
let selectedDifficulty = null;
let previousBossHealth = null;
let damageFlashAnimation = null;
let healingFlashAnimation = null;
let nameSurpriseActive = false;
let nameSurpriseTimer;
let previousSecretName = "";
const nameSecrets = { dingdong: "", cubie: "Hi, I’m Cubie!", boo: "BOO!", starlight: "You’re made of starlight. ✦" };
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
let currentPlayer = "Player";
const keys = new Set();
const storageKey = "microgame-madness.v1";
let saved = { player: "Player", scores: {}, achievements: {}, unlocks: { singularity: false } };
let storageAvailable = true;
try {
  const value = JSON.parse(localStorage.getItem(storageKey));
  if (value && typeof value === "object") {
    saved.achievements = value.achievements;
    saved.unlocks.singularity = value.unlocks?.singularity === true;
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
function unlockSingularity(navigate = true) {
  saved.unlocks.singularity = true;
  saved.player = $("player").value.trim() || "Player";
  persist();
  document.querySelector('[data-game="singularity"]').hidden = false;
  $("game-count").textContent = "07";
  $("game-total").textContent = "7 GAMES / ENDLESS REMATCHES";
  updateAchievements(achievementTracker.secret("gravitron"));
  if (navigate) {
    selectGame("singularity");
    showGameArea();
    $("difficulty-choices").querySelector("button").focus({ preventScroll: true });
  }
}
const achievementCards = new Map();
const achievementQueue = [];
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
let toastTimer;
function showAchievementToast() {
  clearTimeout(toastTimer);
  const toast = $("achievement-toast");
  toast.hidden = true;
  toast.replaceChildren();
  const item = achievementQueue.shift();
  if (!item) return;
  toast.dataset.tier = item.tier;
  const badge = document.createElement("span");
  badge.className = "medal";
  if (item.tier === "empyrorite") badge.append(empyroriteGem());
  else badge.textContent = "★";
  badge.setAttribute("aria-hidden", "true");
  const detail = document.createElement("div");
  const label = document.createElement("small");
  label.textContent = `${item.tier === "black" ? "Secret" : item.tier} achievement · +${Achievements.points[item.tier]} points`;
  const title = document.createElement("strong");
  title.textContent = item.title;
  detail.append(label, title);
  const close = document.createElement("button");
  close.textContent = "×";
  close.setAttribute("aria-label", "Dismiss achievement notification");
  close.onclick = showAchievementToast;
  toast.append(badge, detail, close);
  // Restart the fade for each queued award without moving keyboard focus.
  void toast.offsetWidth;
  toast.hidden = false;
  toastTimer = setTimeout(showAchievementToast, 4500);
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
    card.hidden = (filter === "earned" && !earned) || (filter === "locked" && earned);
    if (!card.hidden) visible++;
  }
  $("achievement-empty").hidden = visible > 0;
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
  achievementQueue.push(...result.earned);
  if ($("achievement-toast").hidden) showAchievementToast();
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
  updateAchievements(achievementTracker.visit());
  renderAchievements();
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
    row.textContent = "Temporary practice — records are not saved.";
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
  if (modes[selected].temporary) return;
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
  document
    .querySelectorAll("[data-key]")
    .forEach((button) => button.classList.remove("pressed"));
}
function setLocked(value) {
  $("player").disabled = value;
  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.disabled = value || !ready;
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
  if (loadFailed) return;
  if (["singularity", "core_practice"].includes(mode) && !saved.unlocks.singularity) return;
  updateAchievements(achievementTracker.abandon());
  resetDamageFeedback();
  if (active && selected === "keyboard") saveRound();
  active = false;
  snapshot = null;
  clearKeys();
  selected = mode;
  selectedDifficulty = null;
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
  $("welcome").hidden = false;
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
  if (!ready || active || !Object.hasOwn(modes[selected].difficulties, difficulty))
    return;
  if (selected === "singularity" && difficulty === "practice") {
    selectGame("core_practice");
    showGameArea();
    return;
  }
  resetDamageFeedback();
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
  if (!modes[selected].temporary)
    updateAchievements(achievementTracker.start(selected, selectedDifficulty));
  active = true;
  lastFrame = performance.now();
  $("welcome").hidden = true;
  $("overlay").hidden = true;
  $("exit").hidden = false;
  $("hangman-game").hidden = selected !== "hangman";
  $("keyboard-game").hidden = selected !== "keyboard";
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
  if (selected === "keyboard" && matchMedia("(pointer: coarse)").matches)
    $("typing-input").focus();
  else $("arena").focus({ preventScroll: true });
}
function showOverlay(title, copy, button, kicker) {
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
  if (!modes[selected].temporary) updateAchievements(achievementTracker.observe(s));
  const hasHealth = ["boss", "pumpkin", "wrath", "singularity", "core_practice"].includes(selected);
  $("player-health").hidden = !hasHealth;
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
  if (s.over) {
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
    if (selected === "core_practice")
      copy = `${s.death_message} Choose another attack or try this one again.`;
    if (selected === "singularity" && s.won) {
      title = "Singularity erased.";
      copy = `All 15 protocols survived. ${s.lives} / 10 HP remaining. The annihilation laser finished the Core.`;
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
  ctx.strokeRect(left, -top, right - left, top - bottom);
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
  if (active && !gasterActive && selected !== "hangman") {
    try {
      snapshot = send("tick", {
        dt: (now - lastFrame) / 1000,
        keys: [...keys],
      });
      render();
    } catch (error) {
      fail(error);
    }
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
$("player").oninput = () => {
  showScores();
  const name = $("player").value.trim().toLowerCase();
  if (name === "gravitron") {
    unlockSingularity();
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
  if (gasterActive) return;
  if (event.target.closest("#cube, .profile-tabs, #achievements-panel")) return;
  const input = event.target.closest("input,select,textarea");
  if (input && event.target !== $("typing-input")) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === "Escape") {
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
$("typing-input").addEventListener("input", (event) => {
  for (const char of event.target.value) type(char);
  event.target.value = "";
});
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
  if (!musicPlayer) return;
  const state = {
    theme: active && ["singularity", "core_practice"].includes(selected) ? "singularity"
      : active && ["pumpkin", "wrath"].includes(selected) ? "pumpkin" : "arcade",
    playing: soundOn && !gasterActive && !nameSurpriseActive && !document.hidden && !snapshot?.paused && !loadFailed,
  };
  if (pendingRockSong) {
    musicPlayer.playOnce(pendingRockSong, state);
    pendingRockSong = null;
  } else musicPlayer.setState(state);
}
function initializeAudio() {
  if (!soundOn) return;
  try {
    // Browsers unlock sound on a click/key press. Keep one context and one loop.
    if (!audioContext) {
      audioContext = new AudioContext();
      audioMaster = audioContext.createGain();
      audioMaster.connect(audioContext.destination);
      musicPlayer = new ArcadeMusic.Player(audioContext, audioMaster);
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
  const oscillator = audioContext.createOscillator(),
    gain = audioContext.createGain(),
    now = audioContext.currentTime;
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
  const duration = core ? core[2] : ding ? .7 : squeak ? .24 : scare ? .38 : .36;
  oscillator.type = squeak || ding ? "sine" : "sawtooth";
  if (core) {
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
    ready = true;
    $("runtime-status").textContent = "● All games ready";
    setLocked(false);
  } catch (error) {
    fail(error);
  }
}
initializeGlobalLeaderboards();
initializeAchievements();
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
