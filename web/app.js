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
};
let selected = "hangman";
let selectedDifficulty = null;
let previousBossHealth = null;
let damageFlashAnimation = null;
let nameSurpriseActive = false;
let nameSurpriseTimer;
let nameWasDingdong = false;
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
let saved = { player: "Player", scores: {}, achievements: {} };
let storageAvailable = true;
try {
  const value = JSON.parse(localStorage.getItem(storageKey));
  if (value && typeof value === "object") {
    saved.achievements = value.achievements;
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
const achievementCards = new Map();
const achievementQueue = [];
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
  badge.textContent = "★";
  badge.setAttribute("aria-hidden", "true");
  const detail = document.createElement("div");
  const label = document.createElement("small");
  label.textContent = `${item.tier} achievement · +${Achievements.points[item.tier]} points`;
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
    card.classList.toggle("earned", earned);
    card.querySelector(".achievement-state").textContent = earned
      ? `Unlocked · ${new Date(unlocked[item.id]).toLocaleDateString()}`
      : `Locked · ${achievementTracker.progress(item)} / ${item.target}`;
    card.querySelector("progress").value = earned ? item.target : achievementTracker.progress(item);
    const filter = $("achievement-filter").value;
    card.hidden = (filter === "earned" && !earned) || (filter === "locked" && earned);
    if (!card.hidden) visible++;
  }
  $("achievement-empty").hidden = visible > 0;
}
function updateAchievements(result) {
  if (!result.changed) return;
  persist();
  renderAchievements();
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
    card.dataset.tier = item.tier;
    const tier = document.createElement("small");
    tier.className = "achievement-tier";
    tier.textContent = `★ ${item.tier} · +${Achievements.points[item.tier]} points`;
    const title = document.createElement("h4");
    title.textContent = item.title;
    const description = document.createElement("p");
    description.textContent = `${item.group} · ${item.description}`;
    const progress = document.createElement("progress");
    progress.max = item.target;
    progress.setAttribute("aria-label", item.title);
    const state = document.createElement("small");
    state.className = "achievement-state";
    const content = document.createElement("div");
    content.className = "achievement-content";
    content.append(tier, title, description, progress, state);
    card.append(content);
    achievementCards.set(item.id, card);
    $("achievements-list").append(card);
    visibleCards.observe(card);
  }
  const tabs = [$("scores-tab"), $("achievements-tab")];
  function selectTab(tab) {
    for (const button of tabs) {
      const selected = button === tab;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      $(button.getAttribute("aria-controls")).hidden = !selected;
    }
  }
  tabs.forEach((tab, index) => {
    tab.onclick = () => selectTab(tab);
    tab.onkeydown = event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = tabs[event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - index];
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
  const list = rankings();
  const previous = list.find((entry) => entry.player === currentPlayer);
  if (previous) previous.score = Math.max(previous.score, snapshot.score);
  else list.push({ player: currentPlayer, score: snapshot.score });
  saved.scores[scoreKey()] = list;
  persist();
  showScores();
}
function send(action, extra = {}) {
  return JSON.parse(
    handle(JSON.stringify({ action, now: performance.now() / 1000, ...extra })),
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
    const chosen = button.dataset.game === mode;
    button.classList.toggle("selected", chosen);
    button.setAttribute("aria-pressed", String(chosen));
  });
  $("game-title").textContent = config.title;
  $("game-category").textContent = config.category;
  $("welcome-art").textContent = config.art;
  $("welcome-title").textContent = config.heading;
  $("welcome-copy").textContent = config.copy;
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
  syncMusic();
}
function startGame(difficulty) {
  if (!ready || active || !Object.hasOwn(modes[selected].difficulties, difficulty))
    return;
  resetDamageFeedback();
  selectedDifficulty = difficulty;
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
  updateAchievements(achievementTracker.start(selected, selectedDifficulty));
  active = true;
  lastFrame = performance.now();
  $("welcome").hidden = true;
  $("overlay").hidden = true;
  $("exit").hidden = false;
  $("hangman-game").hidden = selected !== "hangman";
  $("keyboard-game").hidden = selected !== "keyboard";
  const arcade = ["dodge", "boss", "pumpkin"].includes(selected);
  $("arena").classList.toggle("arcade", arcade);
  $("game-canvas").hidden = !arcade;
  $("touch-controls").hidden =
    !arcade || !matchMedia("(pointer: coarse)").matches;
  $("touch-fire").hidden = selected === "dodge";
  $("touch-counter").hidden = selected !== "pumpkin";
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
}
function updateDamageFeedback(s) {
  if (selected !== "boss" && selected !== "pumpkin") return;
  // Cumulative damage catches a hit even if healing also happens in this frame.
  if (previousBossHealth && (s.lives < previousBossHealth.lives ||
      s.damage_taken > previousBossHealth.damage)) {
    damageFlashAnimation?.cancel();
    damageFlashAnimation = $("damage-flash").animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 340, easing: "ease-out" },
    );
  }
  previousBossHealth = { lives: s.lives, damage: s.damage_taken };
}
function render() {
  const s = snapshot;
  updateDamageFeedback(s);
  updateAchievements(achievementTracker.observe(s));
  const hasHealth = selected === "boss" || selected === "pumpkin";
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
  if (s.hp !== null) {
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
function exitGame() {
  if (selected === "keyboard" && active) saveRound();
  selectGame(selected);
}
function fail(error) {
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
  if (active && selected !== "hangman") {
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
  const isDingdong = $("player").value.trim().toUpperCase() === "DINGDONG";
  if (isDingdong && !nameWasDingdong) {
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
  nameWasDingdong = isDingdong;
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
  if (event.target.closest(".profile-tabs, #achievements-panel")) return;
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
  if (["dodge", "boss", "pumpkin"].includes(selected)) {
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
let soundOn = true;
let audioContext;
let audioMaster;
let musicPlayer;
$("sound").onclick = () => {
  soundOn = !soundOn;
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
  musicPlayer.setState({
    theme: active && selected === "pumpkin" ? "pumpkin" : "arcade",
    playing: soundOn && !nameSurpriseActive && !document.hidden && !snapshot?.paused && !loadFailed,
  });
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
    audioContext.resume().then(syncMusic).catch(() => {});
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
  if (!soundOn || !audioContext) return;
  const oscillator = audioContext.createOscillator(),
    gain = audioContext.createGain(),
    now = audioContext.currentTime;
  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(event === "slam" ? 65 : 95, now);
  oscillator.frequency.exponentialRampToValueAtTime(30, now + 0.3);
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.003, now + 0.35);
  oscillator.connect(gain);
  gain.connect(audioMaster);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  oscillator.start(now);
  oscillator.stop(now + 0.36);
}
async function initialize() {
  try {
    const pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/",
    });
    const manifest = await fetch("./python-files.json");
    if (!manifest.ok) throw new Error("Missing Python manifest");
    const files = await manifest.json();
    pyodide.FS.mkdir("/game");
    await Promise.all(
      files.map(async (name) => {
        const response = await fetch(`./python/${name}`);
        if (!response.ok) throw new Error(`Missing ${name}`);
        pyodide.FS.writeFile(`/game/${name}`, await response.text());
      }),
    );
    pyodide.runPython(
      "import sys\nsys.path.insert(0, '/game')\nfrom bridge import handle",
    );
    handle = pyodide.globals.get("handle");
    ready = true;
    $("runtime-status").textContent = "● All games ready";
    setLocked(false);
  } catch (error) {
    fail(error);
  }
}
initializeAchievements();
selectGame("hangman");
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
