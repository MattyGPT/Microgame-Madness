"use strict";

const $ = (id) => document.getElementById(id);
const modes = {
  guide: {
    title: "Block Guide", category: "12 / CHAOS FIELD GUIDE", art: "▦",
    heading: "Know what is falling.", copy: "Meet the blocks in Turtle Dodge Chaos.",
    accent: "#c7a6ff", controls: "Browse block pictures, abilities and spawn chances below.",
    localOnly: true, temporary: true, difficulties: {},
  },
  geomayhem: {
    title: "Geomayhem", category: "11 / ROGUELIKE CAMPAIGN", art: "◇",
    heading: "Small Cubie. Maximum mayhem.",
    copy: "Clear 20 waves to unlock the next arena. Each run rolls a combat modifier: find weapons, collect relics, and build four weapons up to five stars. Defeat resets your run, but shards and arena unlocks stay. Spend shards in the workshop and unlock more starters as you progress. Yellow warnings turn into dangerous red zones; dodge sideways from charge lines. Clearing waves collects leftover XP. Campaign progress saves in this browser for your current profile. Earn 28 achievements and 16 tiered Cubies through combat, evolutions, relics, and arena victories.",
    accent: "#71f5d2", controls: "WASD / arrows move · Aim with mouse · Hold left click to fire · R pauses",
    choiceLabel: "Your expedition · Clear arenas in order", localOnly: true, temporary: true, difficulties: {},
  },
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
      random: ["Random", "A word from any difficulty. Its difficulty is revealed at the end."],
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
      impossible: ["Impossible", "An even smaller arena. Smaller white blocks fall faster and sway harder. White edges kill. No pausing."],
      chaos: ["Chaos", "Easy-size arena. 8 HP, +1 HP every 8 seconds. Wild blocks and escalating spawns. See the Block Guide!"],
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
let geomayhemArmory = [];
let geomayhemArenas = [];
let geomayhemFiring = false;
const geomayhemMovementKeys = new Map();
let geomayhemAim = null;
let geomayhemPointer = null;
let geomayhemCanvasWidth = 680;
let geomayhemOfferKey = "";
let geomayhemLoadoutKey = "";
const geomayhemStores = new Map();
let geomayhemRun = null;
let geomayhemResult = null;
function geomayhemStore() {
  const owner = accountApp?.controller?.state().owner || "guest";
  if (!geomayhemStores.has(owner)) {
    let storage;
    try { storage = window.localStorage; } catch { /* Store reports memory-only mode. */ }
    geomayhemStores.set(owner, new GeomayhemProgress.Store(owner, storage));
  }
  return geomayhemStores.get(owner);
}
function renderGeomayhemHub() {
  const store = geomayhemStore(), progress = store.read();
  $("geomayhem-campaign").textContent = `${progress.cleared}/${GeomayhemProgress.arenaCount} arenas cleared · ${progress.shards} shards · ${progress.runs} expeditions. `
    + (store.available ? "Saved in this browser for this profile." : "Browser storage unavailable: progress lasts only for this visit.");
  const selectedWeapon = $("geomayhem-weapon").value;
  $("geomayhem-weapon").replaceChildren(...geomayhemArmory.map((weapon, index) => {
    const required = GeomayhemProgress.starterRequirement(index);
    const option = document.createElement("option");
    option.value = weapon.id;
    option.disabled = required > progress.cleared;
    option.textContent = `${weapon.name} · ${option.disabled ? `Clear arena ${required} to start with this` : weapon.automatic ? "Auto companion" : weapon.kind}`;
    return option;
  }));
  if (geomayhemArmory.some((w, i) => w.id === selectedWeapon && GeomayhemProgress.starterRequirement(i) <= progress.cleared))
    $("geomayhem-weapon").value = selectedWeapon;
  renderGeomayhemWeapon();
  $("geomayhem-workshop").replaceChildren(...Object.entries(GeomayhemProgress.upgrades).map(([key, upgrade]) => {
    const button = document.createElement("button"), tier = progress.workshop[key];
    const cost = GeomayhemProgress.cost(progress, key);
    const required = GeomayhemProgress.requiredClear(progress, key);
    button.dataset.workshop = key;
    button.textContent = `${upgrade.name} ${tier}/3 · ${tier === 3 ? "MAX" : `${cost} shards${progress.cleared < required ? ` · Clear arena ${required}` : ""}`} — ${upgrade.description}`;
    button.disabled = tier === 3 || progress.shards < cost || progress.cleared < required;
    button.onclick = () => { geomayhemStore().purchase(key); renderGeomayhemHub(); showScores(); };
    return button;
  }));
  document.querySelectorAll("[data-difficulty]").forEach(button => {
    const level = Number(button.dataset.difficulty.replace("level_", ""));
    const locked = !GeomayhemProgress.unlocked(progress, level);
    button.dataset.campaignLocked = String(locked);
    button.disabled = locked || !ready;
    button.querySelector("span").textContent = locked ? `Locked · Clear arena ${level - 1} first`
      : level <= progress.cleared ? "CLEARED · Replay for shards and a different build"
      : `NEXT ARENA · 20 waves · Best: ${progress.best[level]}/20 cleared`;
    if (!locked) button.querySelector("span").textContent += ` · ${geomayhemArenas[level-1]?.hazard || ""}`;
  });
}
function initializeGeomayhem(catalog) {
  geomayhemArmory = catalog.weapons;
  geomayhemArenas = catalog.levels;
  modes.geomayhem.difficulties = Object.fromEntries(catalog.levels.map((level, i) => [
    level.id, [`${String(i + 1).padStart(2, "0")} · ${level.name}`, `20 waves · ${i === 0 ? "Start here" : "Threat " + (i + 1)} · Elite every 5 waves`],
  ]));
  if (selected === "geomayhem") selectGame("geomayhem");
}
function renderGeomayhemWeapon() {
  const weapon = geomayhemArmory.find(item => item.id === $("geomayhem-weapon").value);
  if (!weapon) return;
  $("geomayhem-weapon-description").textContent = weapon.description;
  $("geomayhem-evolution-three").textContent = `★★★ ${weapon.third}`;
  $("geomayhem-evolution-five").textContent = `★★★★★ ${weapon.fifth}`;
  const shapes = { bolt: "▲", fan: "◆", ring: "✳", beam: "▰", orbit: "✹", mine: "⬟", boomerang: "❯", nova: "◎", drone: "✣" };
  $("geomayhem-weapon-preview").replaceChildren(...[1, 3, 5].map(stars => {
    const form = document.createElement("span");
    form.className = `geomayhem-weapon-icon tier-${stars}`;
    form.style.setProperty("--weapon-color", weapon.color);
    form.textContent = shapes[weapon.kind];
    const label = document.createElement("small");
    label.textContent = "★".repeat(stars);
    form.append(label);
    return form;
  }));
}
$("geomayhem-weapon").addEventListener("change", renderGeomayhemWeapon);
function renderGeomayhem(s) {
  setTextIfChanged("geomayhem-run-info", `${s.arena.hazard} · ${s.anomaly.name}. Relics: ${s.relics.map(r => r.name).join(", ") || "none yet"}`);
  $("geomayhem-run-info").title = `${s.anomaly.description} Yellow warnings lock in before red zones activate. Dodge sideways when enemies wind up.`;
  setTextIfChanged("geomayhem-upgrade-status", `LEVEL UP · ${s.pending_levelups} upgrade${s.pending_levelups === 1 ? "" : "s"} remaining · ACTION PAUSED`);
  const bossChanged = $("geomayhem-boss").hidden === !!s.boss;
  $("geomayhem-boss").hidden = !s.boss;
  if (s.boss) {
    setTextIfChanged("geomayhem-boss-name", `${s.boss.name} · Phase ${s.boss.phase}`);
    $("geomayhem-boss-health").max = s.boss.max_hp;
    $("geomayhem-boss-health").value = s.boss.hp;
  }
  if (bossChanged) fitArcade();
  setTextIfChanged("geomayhem-reroll", `Reroll · ${s.rerolls} left`);
  $("geomayhem-reroll").disabled = s.rerolls === 0;
  setTextIfChanged("geomayhem-wave", `LEVEL ${s.level}/${s.total_levels} · WAVE ${s.wave}/20`);
  setTextIfChanged("geomayhem-build", `${s.loadout.length}/${s.weapon_slots} weapons`);
  const loadoutKey = s.loadout.map(weapon => `${weapon.id}:${weapon.stars}`).join();
  if (loadoutKey !== geomayhemLoadoutKey) {
    geomayhemLoadoutKey = loadoutKey;
    $("geomayhem-inventory").replaceChildren(...s.loadout.map(weapon => {
      const slot = document.createElement("span");
      slot.dataset.weapon = weapon.id;
      slot.setAttribute("role", "listitem");
      slot.style.setProperty("--weapon-color", weapon.color);
      slot.textContent = `${weapon.form} ${"★".repeat(weapon.stars)}${"☆".repeat(5-weapon.stars)}`;
      slot.title = weapon.automatic ? "Automatic companion" : "Hold left click or Fire to attack";
      return slot;
    }));
    fitArcade();
  }
  setTextIfChanged("geomayhem-rank", `Rank ${s.rank} · ${s.kills} KOs`);
  $("geomayhem-xp").max = s.xp_needed;
  $("geomayhem-xp").value = Math.min(s.xp, s.xp_needed);
  $("geomayhem-upgrade").hidden = !s.offers.length || s.over;
  const offerKey = s.offers.length ? `${s.rank}:${s.offers.map(offer => offer.id).join()}` : "";
  if (offerKey !== geomayhemOfferKey) {
    geomayhemOfferKey = offerKey;
    if (offerKey) {
      clearKeys();
      $("geomayhem-upgrade-choices").replaceChildren(...s.offers.map(offer => {
        const button = document.createElement("button");
        const name = document.createElement("strong");
        const detail = document.createElement("span");
        button.dataset.upgrade = offer.id;
        name.textContent = offer.name;
        detail.textContent = offer.description;
        button.append(name, detail);
        button.onclick = () => {
          clearKeys();
          snapshot = send("upgrade", { choice: offer.id });
          render();
          if (!snapshot.offers.length) $("arena").focus({ preventScroll: true });
        };
        return button;
      }));
      // The choices are real buttons: mouse, touch and keyboard all work.
      $("geomayhem-upgrade-choices").querySelector("button")?.focus({ preventScroll: true });
    }
  }
}
$("geomayhem-reroll").onclick = () => {
  if (!active || selected !== "geomayhem" || snapshot?.paused || !snapshot?.offers.length) return;
  clearKeys();
  snapshot = send("reroll");
  render();
};
function geomayhemCamera(s) {
  const [left, right, bottom, top] = s.bounds;
  const width = geomayhemCanvasWidth;
  const scale = Math.max(Math.min(620 / (right-left), 470 / (top-bottom)), Math.min(1.6, 18*680/(28*width)));
  const halfWidth = Math.min((right-left)/2, 310/scale), halfHeight = Math.min((top-bottom)/2, 235/scale);
  return { scale, x: Math.max(left+halfWidth, Math.min(right-halfWidth, s.player.x)),
    y: Math.max(bottom+halfHeight, Math.min(top-halfHeight, s.player.y)) };
}
function aimGeomayhem(event) {
  geomayhemPointer = [event.clientX, event.clientY];
  const rect = $("game-canvas").getBoundingClientRect();
  const camera = snapshot?.mode === "geomayhem" ? geomayhemCamera(snapshot) : {scale:1,x:0,y:0};
  geomayhemAim = [((event.clientX - rect.left) * 680 / rect.width - 340) / camera.scale + camera.x,
    (280 - (event.clientY - rect.top) * 560 / rect.height) / camera.scale + camera.y];
}
$("game-canvas").addEventListener("pointermove", event => {
  if (selected === "geomayhem" && event.pointerType === "mouse") aimGeomayhem(event);
});
$("game-canvas").addEventListener("pointerdown", event => {
  if (selected !== "geomayhem" || !active || snapshot?.paused || snapshot?.offers?.length
      || event.pointerType !== "mouse" || event.button !== 0) return;
  event.preventDefault();
  aimGeomayhem(event);
  geomayhemFiring = true;
  $("game-canvas").setPointerCapture(event.pointerId);
  $("arena").focus({ preventScroll: true });
  snapshot = send("tick", { dt: 0, keys: [...keys, ...geomayhemMovementKeys.values(), "f"], aim: geomayhemAim });
  render();
});
window.addEventListener("pointerup", () => { geomayhemFiring = false; });
window.addEventListener("pointercancel", () => { geomayhemFiring = false; });
$("game-canvas").addEventListener("lostpointercapture", () => { geomayhemFiring = false; });

// Each sleeve has its own palette; related songs share a visual motif.
const songSleeves = {
  cubie_hello: ["#c6f783", "#79d7b0", "cubie"],
  chaos_carnival: ["#ffe78a", "#f5a5dc", "bubbles"],
  ...Object.fromEntries(ArcadeMusic.geomayhemTracks.map(track =>
    [track.id, [track.color, "#7284cf", "circuit"]])),
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
  starlight_soda: ["#8ff5ed", "#e588e8", "soda"],
  comet_courier: ["#ffbd7a", "#f16c80", "comet"],
  lavender_lobby: ["#d6b8ff", "#8b79cb", "moon"],
  copper_carousel: ["#edb783", "#bf7958", "carousel"],
  laser_lemonade: ["#f4f77f", "#77d89b", "lemon"],
  cloudsave_cruise: ["#b2e6ff", "#829de2", "cloud"],
  midnight_pinball: ["#f195e9", "#7974df", "pinball"],
  prism_picnic: ["#a8f4ca", "#dca4ee", "crystal"],
  bonus_round_boulevard: ["#ffdb76", "#ef9c58", "coin"],
  aurora_afterparty: ["#91ffd4", "#a18af3", "aurora"],
  compass_rose: ["#f2d49a", "#459f9b", "compass"],
  jellyfish_jam: ["#f2a9ee", "#526ddd", "jellyfish"],
  kite_runner: ["#ffab91", "#66c4dd", "kite"],
  sands_of_time: ["#e9c17e", "#b4776b", "hourglass"],
  tape_deck_daydream: ["#f4b6c3", "#8a7ec0", "cassette"],
  mushroom_meadow: ["#d5ed9a", "#c47d61", "mushroom"],
  last_train_to_neon: ["#8ee8e1", "#cf69c4", "train"],
  snowglobe_shuffle: ["#d3efff", "#7899df", "snowflake"],
  anchor_point: ["#adcde6", "#507c9c", "anchor"],
  butterfly_byte: ["#e8adff", "#dd817e", "butterfly"],
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
  dragon_dance: ["#ffb584", "#79cfa4", "flame"],
  lantern_market: ["#ffd48c", "#ce779b", "lantern"],
  rain_on_glass: ["#afdfff", "#a6a0de", "rain"],
  sunwheel_parade: ["#ffe18b", "#ec9675", "sunrise"],
};
const sleevePaths = {
  compass: "M56 32a24 24 0 1 1-48 0 24 24 0 0 1 48 0Z M41 16l-4 21-14 11 4-21Z M27 27l10 10 M32 8v5m0 38v5M8 32h5m38 0h5",
  jellyfish: "M11 30a21 21 0 0 1 42 0q-5 6-10 0-5 6-11 0-6 6-11 0-5 6-10 0Z M24 13q-6 6-6 13 M19 36q-7 7 0 13t0 11 M32 36q8 6 0 13t0 11 M45 36q-7 7 0 13t0 11",
  kite: "M31 5 49 23 31 44 13 23Z M31 5v39M13 23h36 M31 44q-12 7 0 12t10 5 M28 48l-6-1 2 6m11 1 6-2-1 6",
  hourglass: "M15 6h34M15 58h34 M19 6v10q0 8 13 16-13 8-13 16v10m26-52v10q0 8-13 16 13 8 13 16v10 M22 16h20l-10 10Z M22 52l10-11 10 11Z M32 33v3",
  cassette: "M11 12h42q4 0 4 4v34q0 4-4 4H11q-4 0-4-4V16q0-4 4-4Z M16 21h32v17H16Z M27 29a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z M47 29a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z M27 29h10 M17 54l5-10h20l5 10 M13 17h1m36 0h1",
  mushroom: "M6 34C7 17 19 8 32 8s25 9 26 26Z M25 34l-4 19q11 7 22 0l-4-19 M25 20a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z M45 25a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z M31 10v6 M11 58l3-7m38 7-3-7",
  train: "M20 7h24q7 0 7 7v29q0 6-7 6H20q-7 0-7-6V14q0-7 7-7Z M20 17h24v15H20Z M32 17v15 M22 40h3m14 0h3 M21 49l-9 11m31-11 9 11 M17 55h30 M27 11h10",
  snowflake: "M32 5v54M9 18l46 28M9 46l46-28 M24 10l8 7 8-7m-16 44 8-7 8 7 M10 27l9-3-1-10m36 23-9 3 1 10 M18 50l1-10-9-3m36-23-1 10 9 3 M32 24l7 4v8l-7 4-7-4v-8Z",
  anchor: "M38 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z M32 18v39 M21 26h22 M8 36q0 18 24 21 24-3 24-21 M8 36l-3 10m3-10 10 6 M56 36l3 10m-3-10-10 6",
  butterfly: "M30 29C21 8 6 4 7 22q0 15 21 15C7 31 9 59 23 53l9-13 9 13c14 6 16-22-5-16q21 0 21-15c1-18-14-14-23 7 M32 24v21m0-21-7-9m7 9 7-9 M17 20l6 6m24-6-6 6",
  soda: "M18 24h28l-4 33H22Z M17 24h30 M35 24l4-15h11 M25 34h14 M29 42v8m-4-4h8 M12 7v10m-5-5h10 M51 31v8m-4-4h8",
  carousel: "M8 25 32 8l24 17Z M10 29h44 M32 8V3h10l-10 5 M32 29v24 M18 29v14m28-14v14 M12 45h12m16 0h12 M15 53h34l6 6H9Z",
  lemon: "M10 44C9 22 28 10 48 17l6-2-2 7C55 44 32 57 16 48l-7 1Z M18 40c0-12 11-20 23-19 M38 6l-7 12h9l-5 12",
  cloud: "M18 43a12 12 0 0 1-2-24 17 17 0 0 1 32-2 13 13 0 0 1 0 26 M32 48V27m-8 8 8-8 8 8 M13 55h38",
  pinball: "M17 6h30l8 51H9Z M28 21a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z M46 30a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z M40 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M17 46l11 5m19-5-11 5 M30 33l-6 6",
  aurora: "M7 42C17 5 23 48 32 18S48 8 57 27 M7 51C17 14 23 57 32 27S48 17 57 36 M7 33C17-4 23 39 32 9 M13 10v8m-4-4h8 M48 46v10m-5-5h10",
  cubie: "M18 8h28q10 0 10 10v28q0 10-10 10H18Q8 56 8 46V18Q8 8 18 8ZM22 24v8m20-8v8M23 41q9 9 18 0",
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
  const [color, glow, motif] = songSleeves[id] || ["#9bd7f5", "#8795e8", "waves"];
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
let accountApp = null;
let applyingAccountProfile = false;
let snapshot = null;
let handle = null;
let lastFrame = 0;
let roundSaved = false;
let roundNewPersonalBest = false;
let chaosTurtleAngle = 0;
let chaosTurtleTarget = 0;
let lastCashReward = 0;
let currentPlayer = "Player";
const keys = new Set();
const joystickKeys = new Set();
let joystickPointer = null;
const storageKey = "microgame-madness.v1";
let saved = { player: "Player", scores: {}, achievements: {}, unlocks: { singularity: false }, minigamesCompleted: 0, cubieHintShown: false };
let storageAvailable = true;
let persistedProfileJSON = null;
try {
  persistedProfileJSON = localStorage.getItem(storageKey);
  const value = JSON.parse(persistedProfileJSON);
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
  if (accountApp?.resetting) return;
  if (!applyingAccountProfile) accountApp?.preferences(saved);
  try {
    const json = JSON.stringify(saved);
    if (!accountApp?.accountBound) localStorage.setItem(storageKey, json);
    persistedProfileJSON = json;
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
    accountApp?.arcade("hint");
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
function syncSingularityCard() {
  const unlocked = !!saved.unlocks.singularity;
  document.querySelector('[data-game="singularity"]').hidden = !unlocked;
  $("singularity-rift").hidden = unlocked;
  $("game-count").textContent = unlocked ? "12" : "11";
  $("game-total").textContent = `${unlocked ? 8 : 7} GAMES + JUKEBOX + CLOSET + SHOP + GUIDE / ENDLESS REMATCHES`;
}
function unlockSingularity(navigate = true) {
  saved.unlocks.singularity = true;
  saved.player = $("player").value.trim() || "Player";
  persist();
  syncSingularityCard();
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
  // Playtime saves do not change Customs; keep previews and focused cards intact.
  if (selected === "customs" && result.earned.length) renderCustoms();
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
    button.onclick = async () => {
      if (saved.shop.owned.includes(item.id)) {
        saved.turtleTrail = item.id;
        turtleTrailField.reset();
        $("shop-status").textContent = `${item.name} equipped. Your turtle is ready to leave a trail.`;
      } else {
        if (accountApp?.initialized && accountApp.controller) {
          try { await accountApp.purchase(item.id); }
          catch (error) { $("shop-status").textContent = error.message; return; }
        } else if (!CubieShop.buy(saved.shop, item)) return;
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
    button.onclick = async () => {
      if (saved.shop.owned.includes(item.id)) {
        saved.cubieCustom = item.id;
        applyCubieCustom();
        $("shop-status").textContent = `Now wearing ${item.name}.`;
      } else {
        if (accountApp?.initialized && accountApp.controller) {
          try { await accountApp.purchase(item.id); }
          catch (error) { $("shop-status").textContent = error.message; return; }
        } else if (!CubieShop.buy(saved.shop, item)) return;
        $("shop-status").textContent = `${item.name} is yours! Find it in your closet or choose Wear Custom.`;
        announcedCustoms.delete(item.id);
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
  if (selected === "geomayhem") {
    const progress = geomayhemStore().read();
    $("best").textContent = `${progress.cleared}/${GeomayhemProgress.arenaCount}`;
    const row = document.createElement("li");
    row.textContent = `${progress.shards} shards · ${progress.runs} expeditions. Clear arenas to unlock the next level and new starters. Run weapons and relics reset; workshop upgrades stay.`;
    $("scores-list").replaceChildren(row);
    return;
  }
  if (modes[selected].temporary) {
    $("best").textContent = "—";
    const row = document.createElement("li");
    row.textContent = selected === "guide" ? "Learn the Chaos blocks here, then choose Turtle Dodge → Chaos to play." : selected === "shop" ? "Play games to earn Cubie Cash. Spend it here on Customs and Turtle Trails." : selected === "customs" ? "Collect Customs through achievements and the Cubie Shop." : selected === "jukebox" ? "Just music. Pick a song and enjoy." : "Temporary practice — records are not saved.";
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
  if (selected === "geomayhem") {
    accountApp?.finish(snapshot, snapshot.over ? (snapshot.won ? "win" : "loss") : "exit");
    roundSaved = true;
    if (geomayhemRun) {
      roundNewPersonalBest = snapshot.cleared > (geomayhemRun.store.read().best[snapshot.level] || 0);
      geomayhemResult = geomayhemRun.store.finish(geomayhemRun.id, snapshot);
    }
    return;
  }
  accountApp?.finish(snapshot, snapshot.over ? (snapshot.won ? "win" : "loss") : "exit");
  roundSaved = true;
  if (snapshot.over && !snapshot.won && ["boss", "pumpkin", "wrath"].includes(selected)) playSound("boss_laugh");
  if (modes[selected].temporary) return;
  if (snapshot.over) countCompletedMinigame();
  lastCashReward = CubieShop.reward(saved.shop, selected, selectedDifficulty, snapshot.score);
  const list = rankings();
  const previous = list.find((entry) => entry.player === currentPlayer);
  roundNewPersonalBest = snapshot.score > (previous?.score || 0);
  if (previous) previous.score = Math.max(previous.score, snapshot.score);
  else list.push({ player: currentPlayer, score: snapshot.score });
  saved.scores[scoreKey()] = list;
  persist();
  showScores();
  publishGlobalScore({ mode: selected, difficulty: selectedDifficulty, player: currentPlayer, score: snapshot.score,
    runId: accountApp?.lastFinishedRun?.id });
}
// The cloud identity uses its own key; never replace the existing local profile.
const leaderboardReady = fetch("./leaderboard-config.json", { cache: "no-store" })
  .then(response => response.ok ? response.json() : {})
  .catch(() => ({}))
  .then(config => new Leaderboards.Client(config));
let globalRequest = 0;
let leaderboardOffset = 0;
let leaderboardAroundMe = false;
let submissionRequest = 0;
function updateGlobalMultipliers() {
  const mode = $("leaderboard-game").value;
  const labels = Object.entries(Leaderboards.multipliers[mode]).map(([difficulty, multiplier]) =>
    `${modes[mode].difficulties[difficulty][0]} ×${multiplier}`);
  $("leaderboard-multipliers").textContent = mode === "wrath" ? "All practice attacks ×1." : labels.join(" · ");
}
function initializeGlobalLeaderboards() {
  $("leaderboard-game").replaceChildren(...Object.entries(modes).filter(([, config]) => !config.localOnly).map(([value, config]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = config.title;
    return option;
  }));
  updateGlobalMultipliers();
  $("leaderboard-game").onchange = () => { leaderboardOffset = 0; leaderboardAroundMe = false; updateGlobalMultipliers(); loadGlobalScores(); };
  $("leaderboard-season").onchange = () => { leaderboardOffset = 0; leaderboardAroundMe = false; loadGlobalScores(); };
  $("leaderboard-previous").onclick = () => { leaderboardOffset = Math.max(0, leaderboardOffset - 10); leaderboardAroundMe = false; loadGlobalScores(); };
  $("leaderboard-next").onclick = () => { leaderboardOffset += 10; leaderboardAroundMe = false; loadGlobalScores(); };
  $("leaderboard-near").onclick = () => {
    if (!accountApp?.signedIn) { $("leaderboard-status").textContent = "Sign in to see your position across devices."; return; }
    leaderboardAroundMe = true; leaderboardOffset = 0; loadGlobalScores();
  };
  leaderboardReady.then(async client => {
    for (const season of await client.seasons()) {
      const option = document.createElement("option"); option.value = season.id;
      option.textContent = season.name || season.title || season.id;
      $("leaderboard-season").append(option);
    }
  });
  $("leaderboard-refresh").onclick = async () => {
    await retryGlobalScores();
    loadGlobalScores();
  };
  window.addEventListener("online", async () => {
    await retryGlobalScores();
    if (!$("global-panel").hidden) loadGlobalScores();
  });
  accountApp.ready.then(() => retryGlobalScores());
}
async function loadGlobalScores() {
  const request = ++globalRequest;
  const mode = $("leaderboard-game").value;
  $("global-scores").replaceChildren();
  $("global-scores").setAttribute("aria-busy", "true");
  $("leaderboard-status").textContent = "Loading global rankings…";
  try {
    const client = await leaderboardReady;
    const rows = await client.listGame(mode, { offset: leaderboardOffset,
      season: $("leaderboard-season").value || null, aroundMe: leaderboardAroundMe });
    if (request !== globalRequest) return;
    for (const entry of rows) {
      const row = document.createElement("li"), name = document.createElement(entry.public_id ? "button" : "span"), score = document.createElement("strong");
      if (entry.public_id) {
        name.type = "button"; name.className = "quiet-button";
        name.onclick = async () => {
          try {
            const profile = await client.request("/rest/v1/rpc/get_account_public_profile", { p_public_id: entry.public_id });
            if (!profile) { $("leaderboard-status").textContent = "This profile is private or unavailable."; return; }
            let dialog = $("public-player-dialog");
            if (!dialog) {
              dialog = document.createElement("dialog"); dialog.id = "public-player-dialog"; dialog.className = "account-dialog";
              dialog.setAttribute("aria-labelledby", "public-player-name");
              const title = document.createElement("h2"); title.id = "public-player-name";
              const note = document.createElement("p"); note.textContent = "Public arcade profile. Game history and account details remain private.";
              const close = document.createElement("button"); close.textContent = "Close"; close.onclick = () => dialog.close();
              dialog.append(title, note, close); document.body.append(dialog);
            }
            $("public-player-name").textContent = profile.player;
            dialog.showModal();
          } catch (error) { $("leaderboard-status").textContent = error.message; }
        };
      }
      name.textContent = `${String(entry.rank).padStart(2, "0")}  ${entry.player}${entry.is_you ? " (you)" : ""}`;
      score.textContent = `${entry.score}${mode === "keyboard" ? " rounds" : " pts"}`;
      row.classList.toggle("is-you", entry.is_you === true);
      row.append(name, score);
      $("global-scores").append(row);
    }
    $("leaderboard-previous").disabled = leaderboardOffset === 0 || leaderboardAroundMe;
    $("leaderboard-next").disabled = rows.length < 10 || leaderboardAroundMe;
    $("leaderboard-status").textContent = rows.length ? "All difficulties combined. Weighted lifetime total, rounded to the nearest whole number." : "No scores yet. Set the first record!";
  } catch (error) {
    if (request === globalRequest) $("leaderboard-status").textContent = error.message;
  } finally {
    if (request === globalRequest) $("global-scores").setAttribute("aria-busy", "false");
  }
}
async function publishGlobalScore(entry) {
  if (modes[entry.mode]?.localOnly) return;
  if (accountApp?.controller) {
    if (!accountApp.controller.state().profile.privacy?.leaderboard) {
      if (!accountApp.accountBound) {
        const client = await leaderboardReady;
        await client.submit(entry, { defer: true });
      }
      $("leaderboard-submission").textContent = "Saved privately. Enable sharing in your profile to add these rounds to your lifetime rankings.";
      return;
    }
    if (accountApp.signedIn) {
      await accountApp.chain;
      try { await accountApp.controller.flush(); $("leaderboard-submission").textContent = "Your account scores are synced."; }
      catch { $("leaderboard-submission").textContent = "Saved on this device. Sharing will resume when you reconnect."; }
      return;
    }
  }
  const request = ++submissionRequest;
  try {
    const client = await leaderboardReady;
    if (!client.configured) return;
    $("leaderboard-submission").textContent = "Adding this round to your lifetime score…";
    await client.submit(entry);
    if (request === submissionRequest) $("leaderboard-submission").textContent = "Your lifetime score is on the global leaderboard.";
    if (!$("global-panel").hidden) loadGlobalScores();
  } catch {
    if (request === submissionRequest) $("leaderboard-submission").textContent = "Saved locally. We’ll retry your global score when you reconnect or press Refresh.";
  }
}
async function retryGlobalScores() {
  try {
    if (!await syncGuestLeaderboardPrivacy()) return;
    const client = await leaderboardReady;
    if (!client.configured || !Object.keys(client.pending).length) return;
    await client.flush();
    $("leaderboard-submission").textContent = "Your lifetime score is on the global leaderboard.";
  } catch {
    $("leaderboard-submission").textContent = "Saved locally. We’ll retry your global score when you reconnect or press Refresh.";
  }
}
async function syncGuestLeaderboardPrivacy() {
  await accountApp.ready;
  if (accountApp.signedIn || accountApp.accountBound) return false;
  const client = await leaderboardReady;
  if (!client.configured) return false;
  const visible = !!accountApp.controller.state().profile.privacy?.leaderboard;
  const user = accountApp.session.snapshot().user;
  if ((!user && !visible) || (user && !user.is_anonymous)) return false;
  const generation = accountApp.controller.generation;
  await accountApp.session.ensureAnonymous();
  const token = await accountApp.session.token();
  accountApp.checkIdentity(generation);
  const effective = await client.request('/rest/v1/rpc/set_guest_leaderboard_visibility', { p_visible: visible }, token);
  accountApp.checkIdentity(generation);
  if (typeof effective !== 'boolean') throw new Error('Leaderboard privacy could not be confirmed. Try syncing again.');
  return effective && visible;
}
function send(action, extra = {}) {
  return JSON.parse(
    handle(JSON.stringify({ action, now: (performance.now() - gameTimeOffset) / 1000, ...extra })),
  );
}
function clearKeys() {
  keys.clear();
  geomayhemMovementKeys.clear();
  geomayhemFiring = false;
  resetJoystick();
  document
    .querySelectorAll("[data-key]")
    .forEach((button) => button.classList.remove("pressed"));
}
function setLocked(value) {
  $("player").disabled = value;
  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.disabled = value || button.dataset.campaignLocked === "true" || (!ready && selected !== "jukebox");
  });
}
function fitArcade() {
  if ($("game-canvas").hidden) return;
  const heading = document.querySelector(".game-heading");
  const footer = document.querySelector(".game-footer");
  const headingMargin = parseFloat(getComputedStyle(heading).marginBottom);
  const chromeHeight = heading.offsetHeight + headingMargin + footer.offsetHeight
    + $("touch-controls").offsetHeight + $("player-health").offsetHeight + $("geomayhem-hud").offsetHeight + 28;
  // Pinch zoom shrinks the visual viewport in CSS pixels, not the page's
  // layout. Undo that scale so zoom magnifies the fight instead of shrinking it.
  const viewport = window.visualViewport;
  const viewportHeight = viewport ? Math.round(viewport.height * viewport.scale) : innerHeight;
  $("arena").style.setProperty("--player-health-height", `${$("player-health").offsetHeight}px`);
  const height = Math.max(1, viewportHeight - chromeHeight);
  const width = Math.min($("arena").clientWidth - 2, height * 680 / 560);
  geomayhemCanvasWidth = width;
  $("game-canvas").style.width = `${width}px`;
  $("game-canvas").style.height = `${width * 560 / 680}px`;
}
function showGameArea() {
  fitArcade();
  document.querySelector(".game-main").scrollIntoView({ block: "start", behavior: "instant" });
}
let chaosGuideCanvases = [], chaosGuideVisible = new Set(), chaosGuideObserver = null, chaosGuideFrame = 0;
let chaosGuideBlocks = [], chaosGuideIcon = null, chaosGuideLastChange = 0, chaosGuideScanner = null;
function animateChaosGuide(now, initial = false) {
  if (selected === 'guide' && !document.hidden && now-chaosGuideFrame >= 1000/30) {
    const age = trailReducedMotion.matches || saved.preferences?.reducedMotion ? 0 : now/1000;
    for (const entry of chaosGuideCanvases) if (chaosGuideVisible.has(entry.canvas)) {
      ChaosArt.drawPreview(entry.context, entry.block, age, chaosGuideBlocks);
    }
    chaosGuideFrame = now;
  }
  if (!chaosGuideScanner || document.hidden) return;
  chaosGuideScanner.lastChange = chaosGuideLastChange;
  chaosGuideScanner.tick(now, trailReducedMotion.matches || !!saved.preferences?.reducedMotion, initial);
  chaosGuideLastChange = chaosGuideScanner.lastChange;
}
function initializeChaosGuide(blocks) {
  chaosGuideBlocks = blocks;
  $("block-guide-count").textContent = blocks.length;
  chaosGuideObserver?.disconnect();
  chaosGuideCanvases = []; chaosGuideVisible.clear();
  chaosGuideObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) chaosGuideVisible.add(entry.target);
      else chaosGuideVisible.delete(entry.target);
    }
  });
  chaosGuideScanner = guidePreviewBootstrap.scanner || new GuideScanner.Scanner(
    document.querySelector('[data-game="guide"] .card-art'), blocks);
  chaosGuideScanner.blocks = blocks;
  chaosGuideIcon = chaosGuideScanner.icon;
  chaosGuideLastChange = chaosGuideScanner.lastChange;
  animateChaosGuide(performance.now());
  $("block-guide-grid").replaceChildren(...blocks.map(block => {
    const card = document.createElement("article");
    card.className = "block-guide-card";
    card.style.setProperty("--block-color", block.color);
    card.dataset.block = block.id;
    const icon = document.createElement("canvas");
    icon.className = "block-guide-icon";
    icon.setAttribute('role', 'img');
    icon.setAttribute('aria-label', `${block.name} animated preview`);
    icon.width = 360; icon.height = 220;
    const context = icon.getContext('2d'); context.scale(2, 2);
    ChaosArt.drawPreview(context, block, 0, blocks);
    chaosGuideCanvases.push({canvas: icon, context, block});
    chaosGuideObserver.observe(icon);
    const title = document.createElement("h4");
    title.textContent = block.name;
    const rarity = document.createElement("p");
    rarity.className = "block-rarity";
    rarity.append(`${block.rarity} · `);
    const chance = document.createElement('span');
    chance.className = 'block-exact-chance';
    chance.textContent = `${block.chance}%`;
    rarity.append(chance, ' of spawns');
    const detail = document.createElement("p");
    detail.textContent = block.description;
    const disposition = document.createElement("p");
    disposition.className = "block-disposition";
    disposition.dataset.disposition = block.disposition;
    disposition.textContent = block.disposition[0].toUpperCase() + block.disposition.slice(1);
    const collectible = document.createElement('p');
    collectible.className = 'block-collectible';
    collectible.textContent = block.collectible ? 'Collectible' : 'Not collectible';
    const solidity = document.createElement('p');
    solidity.className = 'block-solidity';
    solidity.textContent = block.solidity;
    card.append(icon, title, rarity, disposition, collectible, solidity, detail);
    return card;
  }));
}
const dodgeBorderSizes = new ResizeObserver(entries => {
  for (const { target, contentRect } of entries) {
    target.style.setProperty("--flight-width", contentRect.width + "px");
    target.style.setProperty("--flight-height", contentRect.height + "px");
  }
});
const dodgeBorderVisibility = new IntersectionObserver(entries => {
  for (const entry of entries) entry.target.classList.toggle("border-in-view", entry.isIntersecting);
});
document.addEventListener("visibilitychange", () => {
  document.documentElement.classList.toggle("border-page-hidden", document.hidden);
});
const dodgeBorderSprites = new Map();
function dodgeBorderSprite(index, color) {
  const shapes = [
    [[0,0],[1,0],[2,0],[3,0]], [[0,0],[1,0],[0,1],[1,1]],
    [[0,0],[1,0],[2,0],[1,1]], [[0,0],[1,0],[1,1],[2,1]],
    [[1,0],[2,0],[0,1],[1,1]], [[0,0],[1,0],[2,0],[0,1]],
    [[0,0],[1,0],[2,0],[2,1]],
  ];
  const colors = ["#48d9ef", "#ffd166", "#bb86fc", "#69db7c", "#ff6b8a", "#659bff", "#ffa552"];
  const fill = color || colors[index], key = index + fill;
  if (!dodgeBorderSprites.has(key)) {
    const cells = shapes[index], width = (Math.max(...cells.map(c => c[0])) + 1) * 7;
    const height = (Math.max(...cells.map(c => c[1])) + 1) * 7;
    const rects = cells.map(([x,y]) => `<rect x="${(30-width)/2+x*7}" y="${(30-height)/2+y*7}" width="6.5" height="6.5" fill="${fill}" stroke="#14191c" stroke-width=".7"/>`).join("");
    dodgeBorderSprites.set(key, "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">${rects}</svg>`));
  }
  return dodgeBorderSprites.get(key);
}
function decorateDodgeDifficulty(button, difficulty) {
  const presets = {
    easy: [20, 18, null, 22], normal: [35, 14, null, 22],
    hard: [38, 10, "#ffdf00", 22], merciless: [40, 7, "#ff3030", 22],
    impossible: [48, 5, "#ffffff", 16], chaos: [55, 10, "#a68cbe", 25],
  };
  const [count, seconds, color, size] = presets[difficulty];
  const titleColors = { easy: "#78df91", normal: "#ffa552", hard: "#ffdf00",
    merciless: "#ff5050", impossible: "#ffffff" };
  if (titleColors[difficulty]) button.style.setProperty("--difficulty-title-color", titleColors[difficulty]);
  button.classList.add("dodge-border-card");
  if (difficulty === "chaos") {
    button.classList.add("chaos-difficulty");
    const rainbow = ["#ff557c", "#ffa64b", "#ffe66d", "#6ee88b", "#4bdcf1", "#688dff", "#bd79f5"];
    for (let i = rainbow.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rainbow[i], rainbow[j]] = [rainbow[j], rainbow[i]];
    }
    button.style.setProperty("--chaos-rainbow", [...rainbow, rainbow[0]].join(", "));
  }
  if (["merciless", "impossible", "chaos"].includes(difficulty))
    button.style.borderColor = color;
  const orbit = document.createElement("span");
  orbit.className = "chaos-border-flight";
  orbit.setAttribute("aria-hidden", "true");
  for (let i = 0; i < count; i++) {
    const chaos = difficulty === "chaos";
    const block = chaos ? ChaosArt.pickBlock(chaosGuideBlocks) : null;
    const image = document.createElement("img");
    image.alt = "";
    if (chaos) {
      image.src = ChaosArt.tabPreview(block).src;
      image.alt = "";
      image.dataset.block = block.id;
    } else {
      image.src = dodgeBorderSprite(Math.floor(Math.random() * 7), color);
    }
    image.className = "chaos-border-block";
    const duration = seconds * (1 + Math.random() * .15);
    image.style.setProperty("--flight-time", duration + "s");
    image.style.setProperty("--flight-delay", -(i / count + Math.random() / count) * duration + "s");
    const side = Math.floor(Math.random() * 4), position = Math.random() * 100;
    image.style.setProperty("--flight-x", (side === 0 ? position : side === 1 ? 100 : side === 2 ? position : 0) + "%");
    image.style.setProperty("--flight-y", (side === 0 ? 0 : side === 1 ? position : side === 2 ? 100 : position) + "%");
    image.style.setProperty("--block-size", size + Math.random() * (chaos ? 5 : 2) + "px");
    image.style.setProperty("--block-turn", Math.random() * 360 + "deg");
    image.style.animationDirection = Math.random() < .5 ? "normal" : "reverse";
    orbit.append(image);
  }
  button.append(orbit);
  dodgeBorderSizes.observe(orbit);
  dodgeBorderVisibility.observe(orbit);
}
function selectGame(mode) {
  coreAftermath = false;
  if (loadFailed && !["customs", "shop"].includes(mode)) return;
  if (["singularity", "core_practice"].includes(mode) && !saved.unlocks.singularity) return;
  if (active && selected === "geomayhem") saveRound();
  accountApp?.finish(snapshot, active && selected === "keyboard" ? "exit" : "interrupted");
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
  $("block-guide-room").hidden = mode !== "guide";
  $("geomayhem-loadout").hidden = mode !== "geomayhem";
  $("geomayhem-hud").hidden = true;
  $("geomayhem-upgrade").hidden = true;
  geomayhemOfferKey = "";
  geomayhemLoadoutKey = "";
  geomayhemAim = null;
  geomayhemPointer = null;
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
  setTextIfChanged("game-instruction", config.controls);
  dodgeBorderSizes.disconnect();
  dodgeBorderVisibility.disconnect();
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
      if (mode === "dodge") decorateDodgeDifficulty(button, value);
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
  $("welcome").hidden = ["customs", "shop", "guide"].includes(mode);
  if (mode === "shop") renderShop();
  if (mode === "customs") renderCustoms();
  setTextIfChanged("metric", "—");
  setTextIfChanged("score", "0");
  $("metric-label").textContent =
    mode === "hangman"
      ? "Guesses left"
      : mode === "keyboard"
        ? "Time left"
        : mode === "dodge"
          ? "Survived"
          : "Your HP";
  setLocked(false);
  if (mode === "geomayhem") renderGeomayhemHub();
  showScores();
  if (!config.localOnly) {
    $("leaderboard-game").value = mode;
    updateGlobalMultipliers();
    if (!$("global-panel").hidden) loadGlobalScores();
  }
  syncMusic();
}
function startGame(difficulty) {
  if (accountApp?.blocked) return;
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
  let campaign;
  if (selected === "geomayhem") {
    const store = geomayhemStore(), progress = store.read();
    const index = geomayhemArmory.findIndex(w => w.id === $("geomayhem-weapon").value);
    if (!GeomayhemProgress.unlocked(progress, Number(difficulty.split("_")[1]))
        || index < 0 || GeomayhemProgress.starterRequirement(index) > progress.cleared) return;
    campaign = { cleared: progress.cleared, unlocked_level: Math.min(GeomayhemProgress.arenaCount, progress.cleared + 1), workshop: progress.workshop };
    geomayhemRun = { id: crypto.randomUUID(), store };
    geomayhemResult = null;
  }
  resetDamageFeedback();
  turtleTrailField.reset();
  selectedDifficulty = difficulty;
  if (!modes[selected].localOnly) {
    $("leaderboard-game").value = selected;
    updateGlobalMultipliers();
    if (!$("global-panel").hidden) loadGlobalScores();
  }
  initializeAudio();
  currentPlayer = $("player").value.trim() || "Player";
  $("player").value = currentPlayer;
  saved.player = currentPlayer;
  persist();
  showScores();
  roundSaved = false;
  roundNewPersonalBest = false;
  chaosTurtleAngle = chaosTurtleTarget = 0;
  lastCashReward = 0;
  clearKeys();
  try {
    snapshot = send("start", {
      mode: selected,
      difficulty: selectedDifficulty,
      ...(selected === "geomayhem" ? { weapon: $("geomayhem-weapon").value, campaign } : {}),
    });
  } catch (error) {
    fail(error);
    return;
  }
  if (!modes[selected].temporary || ["core_practice", "geomayhem"].includes(selected)) {
    if (selected === "hangman" && snapshot.random_mode) selectedDifficulty = snapshot.difficulty;
    accountApp?.startRun(selected, selectedDifficulty);
    updateAchievements(achievementTracker.start(selected, selectedDifficulty));
  }
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
  const arcade = ["dodge", "boss", "pumpkin", "wrath", "singularity", "core_practice", "geomayhem"].includes(selected);
  $("arena").classList.toggle("arcade", arcade);
  $("game-canvas").hidden = !arcade;
  $("game-canvas").setAttribute("aria-label", `${modes[selected].title}. ${modes[selected].controls}`);
  $("touch-controls").hidden =
    !arcade || !matchMedia("(pointer: coarse)").matches;
  $("touch-fire").hidden = ["dodge", "core_practice"].includes(selected);
  $("touch-fire").textContent = selected === "singularity" ? "Laser" : "Fire";
  $("touch-counter").hidden = !["pumpkin", "wrath"].includes(selected);
  $("geomayhem-hud").hidden = selected !== "geomayhem";
  setLocked(true);
  render();
  showGameArea();
  $("arena").focus({ preventScroll: true });
}
function showOverlay(title, copy, button, kicker) {
  $("overlay").classList.toggle("boss-defeat", !!snapshot?.over && !snapshot.won
    && ["boss", "pumpkin", "wrath"].includes(selected));
  $("overlay-title").textContent = title;
  $("overlay-copy").textContent = copy;
  $("overlay-action").textContent = button;
  $("overlay-kicker").textContent = kicker;
  $("overlay").hidden = false;
}
function resetDamageFeedback() {
  updateChaosEffects(null);
  previousBossHealth = null;
  damageFlashAnimation?.cancel();
  damageFlashAnimation = null;
  healingFlashAnimation?.cancel();
  healingFlashAnimation = null;
}
function updateDamageFeedback(s) {
  if (!(selected === "dodge" && s.difficulty === "chaos") && !["boss", "pumpkin", "wrath", "singularity", "core_practice"].includes(selected)) return;
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
// Small persistent pixel-style badges; only active effects occupy a slot.
const chaosStatusDefinitions = [
  ['regeneration_left', 'Regeneration', '#65f2ba', 'M4 0h4v4h4v4H8v4H4V8H0V4h4Z'],
  ['leafy_active', 'Leafy slow', '#79cf88', 'M1 11Q0 1 11 1q1 10-10 10ZM1 11l8-8'],
  ['turbo_active', 'Turbo', '#ffbf67', 'M1 1l5 5-5 5M6 1l5 5-5 5'],
  ['pellet_freeze_left', 'Frozen pellets', '#efbe62', 'M2 0h8l2 6-2 6H2L0 6ZM4 4h4v4H4Z'],
  ['target_lock_left', 'Target lock', '#ee9c9c', 'M1 1h10v10H1ZM6 0v12M0 6h12'],
  ['danger_edge_left', 'Lethal edges', '#ff6b83', 'M0 0h12v12H0ZM5 3h2v4H5ZM5 9h2v2H5Z'],
  ['arena_shrink_left', 'Small arena', '#c69be9', 'M0 0h4v2H2v2H0ZM8 0h4v4h-2V2H8ZM0 8h2v2h2v2H0ZM10 8h2v4H8v-2h2Z'],
  ['vertigo_left', 'Reversed', '#e4a2f1', 'M0 3l3-3v2h7v2H3v2ZM12 9l-3-3v2H2v2h7v2Z'],
  ['shield', 'Shielded', '#91baff', 'M2 1h8v6H9v2H8v1H7v1H5v-1H4V9H3V7H2Z'],
  ['haste_left', 'Speed', '#fff080', 'M6 0h4L7 5h3l-6 7 1-5H2Z'],
  ['frost_left', 'Slowness', '#a8eaff', 'M5 0h2v4h1V3h2v2H8v2h2v2H8V8H7v4H5V8H4v1H2V7h2V5H2V3h2v1h1Z'],
  ['burn_ticks', 'Burning', '#ffab60', 'M6 0h2v4h2v2h1v4H9v2H3v-2H1V6h2V4h2v3h1Z'],
  ['poison_ticks', 'Poison', '#b4ed70', 'M4 0h4v2H7v3h2v2h2v4H1V7h2V5h2V2H4Z'],
  ['invulnerable', 'Protection', '#e2eeff', 'M3 0h6v1h2v2h1v6h-1v2H9v1H3v-1H1V9H0V3h1V1h2ZM4 3v6h4V3Z'],
  ['curse_left', 'Fast fall', '#dd9cff', 'M2 1h3v5h2V1h3v6H8v2H7v2H5V9H4V7H2Z'],
  ['slowfall_left', 'Slow fall', '#e8c7ff', 'M1 1h10v2H9v2H7v2h2v2h2v2H1V9h2V7h2V5H3V3H1Z'],
  ['stasis_left', 'Stasis', '#86e0ff', 'M2 1h3v10H2ZM7 1h3v10H7Z'],
  ['repellent_left', 'Field immunity', '#b6b5ff', 'M2 1h8v6H9v2H7v2H5V9H3V7H2ZM0 4h2v3H0ZM10 4h2v3h-2Z'],
];
function updateChaosStatusBadges(s) {
  const root = $('chaos-status-badges');
  const show = s?.mode === 'dodge' && s.difficulty === 'chaos' && !s.over;
  const activeEffects = show ? chaosStatusDefinitions.filter(([key]) => s[key] > 0) : [];
  const wanted = new Set(activeEffects.map(([key]) => key));
  for (const badge of [...root.children]) if (!wanted.has(badge.dataset.effect)) badge.remove();
  for (const [key, label, color, path] of activeEffects) {
    let badge = root.querySelector(`[data-effect="${key}"]`);
    if (!badge) {
      badge = document.createElement('li');
      badge.dataset.effect = key;
      badge.style.setProperty('--effect-color', color);
      badge.innerHTML = `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="${path}"/></svg><span>${label}</span><small></small>`;
      root.append(badge);
    }
    const seconds = key === 'burn_ticks' ? s.burn_in + (s.burn_ticks-1)*2
      : key === 'poison_ticks' ? s.poison_in + (s.poison_ticks-1)*3 : s[key];
    const detail = ['shield','leafy_active','turbo_active'].includes(key) ? '' : `${Math.ceil(seconds)}s`;
    if (badge.lastElementChild.textContent !== detail) badge.lastElementChild.textContent = detail;
  }
  root.classList.toggle("many-effects", activeEffects.length > 6);
  root.hidden = activeEffects.length === 0;
  document.body.classList.toggle("chaos-status-active", activeEffects.length > 0);
}
const chaosScreenMotion = {
  regeneration_left: 'regeneration',
  leafy_active: 'leaves', turbo_active: 'speed', pellet_freeze_left: 'amber',
  target_lock_left: 'target', danger_edge_left: 'danger', arena_shrink_left: 'shrink',
  vertigo_left: 'reverse', shield: 'shield', burn_ticks: 'embers', poison_ticks: 'bubbles',
  protection_left: 'protection', curse_left: 'fall', slowfall_left: 'float',
  stasis_left: 'stasis', repellent_left: 'repellent'
};
const chaosScreenDescriptions = {
  regeneration_left: ['Mint rising health crosses', 'Regeneration restores 1 HP each second for 4 seconds, up to maximum health.'],
  leafy_active: ['Green drifting leaves', 'Move 50% slower while touching Leafy or Elite Leafy.'],
  turbo_active: ['Orange arrow streaks', 'Move 50% faster while touching Turbo or Elite Turbo.'],
  pellet_freeze_left: ['Amber boxed symbols', 'Pellets are frozen in place, but can still hurt you.'],
  target_lock_left: ['Rose crosshairs and focusing border', 'Blocks steer toward you horizontally.'],
  danger_edge_left: ['Red dashed border and warning symbols', 'Touching an arena edge instantly kills you.'],
  arena_shrink_left: ['Purple inward-moving border', 'The arena is temporarily shrunk to Merciless size.'],
  vertigo_left: ['Pink sideways arrows', 'Your movement controls are reversed.'],
  shield: ['Blue breathing shield border', 'A shield is ready to absorb a hit.'],
  haste_left: ['Yellow lightning', 'Haste makes you move 45% faster.'],
  frost_left: ['Icy blue snow', 'Freezing makes you move 50% slower.'],
  burn_ticks: ['Orange rising embers', 'Burning deals 1 damage every 2 seconds.'],
  poison_ticks: ['Lime green rising bubbles', 'Poison deals 1 damage every 3 seconds.'],
  invulnerable: ['White bubbles and double border', 'Pickup-granted protection blocks ordinary contact damage.'],
  curse_left: ['Violet falling arrows', 'Curse makes blocks fall 40% faster.'],
  slowfall_left: ['Lavender drifting hourglasses', 'Blocks fall 40% slower.'],
  stasis_left: ['Cyan pause symbols and dashed border', 'Falling blocks pause; horizontal blocks keep moving.'],
  repellent_left: ['Periwinkle expanding border', 'You are immune to pushing and pulling fields.']
};
function initializeChaosScreenKey() {
  $('chaos-screen-key-list').replaceChildren(...chaosStatusDefinitions.map(([key, label, color, path]) => {
    const [appearance, meaning] = chaosScreenDescriptions[key];
    const item = document.createElement('li');
    item.dataset.effect = key === 'invulnerable' ? 'protection_left' : key;
    item.style.setProperty('--effect-color', color);
    item.innerHTML = `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="${path}"/></svg><div><strong>${label}</strong><span class="chaos-key-appearance">${appearance}</span><p>${meaning}</p></div>`;
    return item;
  }));
}
const chaosScreenLayers = new Map();
function updateChaosScreenLayers(s, visible) {
  const host = $('chaos-status-screen-effects');
  let activeCount = 0;
  for (const [status, label, color, path] of chaosStatusDefinitions) {
    if (status === 'haste_left' || status === 'frost_left') continue;
    const key = status === 'invulnerable' ? 'protection_left' : status;
    const active = !!(visible && s[key] > 0);
    let layer = chaosScreenLayers.get(key);
    if (!layer && active) {
      layer = document.createElement('div');
      layer.className = `chaos-screen-effect chaos-status-layer chaos-screen-${chaosScreenMotion[key]}`;
      layer.dataset.effect = key;
      layer.style.setProperty('--status-color', color);
      layer.innerHTML = '<div class="chaos-effect-frame"></div>' + Array.from({length:8}, (_, i) =>
        `<span class="chaos-effect-particle" style="--particle:${i};--delay:${-i*.63}s"><svg viewBox="0 0 12 12"><path d="${path}"/></svg></span>`).join('');
      host.append(layer); chaosScreenLayers.set(key, layer);
    }
    if (layer) layer.hidden = !active;
    if (active) activeCount++;
  }
  host.style.setProperty('--status-strength', String(1/Math.sqrt(Math.max(1,activeCount))));
}
function updateChaosEffects(s) {
  updateChaosStatusBadges(s);
  const visible = s?.mode === "dodge" && s.difficulty === "chaos" && !s.over && !s.paused && !document.hidden;
  updateChaosScreenLayers(s, visible);
  const haste = visible && s.haste_left > 0, frost = visible && s.frost_left > 0;
  $("chaos-electric").hidden = !haste;
  $("chaos-frost").hidden = !frost;
  $("arena").classList.toggle("chaos-haste", !!haste);
  $("arena").classList.toggle("chaos-frozen", !!frost);
  const reduced = trailReducedMotion.matches || !!saved.preferences?.reducedMotion;
  document.body.classList.toggle("chaos-motion-off", reduced);
}
function render() {
  const s = snapshot;
  updateChaosEffects(s);
  updateDamageFeedback(s);
  if (!s.dying && (!modes[selected].temporary || ["core_practice", "geomayhem"].includes(selected))) {
    const progress = achievementTracker.observe(s);
    accountApp?.observe(s, progress.changed, achievementTracker.observedAt);
    updateAchievements(progress);
  }
  const hasHealth = (selected === "dodge" && s.difficulty === "chaos") || ["boss", "pumpkin", "wrath", "singularity", "core_practice", "geomayhem"].includes(selected);
  $("player-health").hidden = !hasHealth || s.arena_shattered;
  if (hasHealth) {
    const health = `${s.lives} / ${s.max_lives}`;
    if ($("player-health-value").textContent !== health)
      $("player-health-value").textContent = health;
    $("player-health-fill").style.width = `${100 * s.lives / s.max_lives}%`;
    $("player-health").dataset.low = String(s.lives <= s.max_lives / 3);
  }
  setTextIfChanged("score", s.score);
  $("pause").hidden = !s.can_pause || s.over;
  setTextIfChanged("pause", `${s.paused ? "Resume" : "Pause"} · ${selected === "geomayhem" ? "R" : "D"}`);
  if (selected === "geomayhem") renderGeomayhem(s);
  if (selected === "hangman") {
    $("hangman-picture").textContent = s.picture;
    $("word").textContent = s.word;
    $("guess-feedback").textContent =
      s.message || `${s.remaining} wrong guesses left.`;
    setTextIfChanged("metric", s.remaining);
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
    setTextIfChanged("metric", `${s.remaining.toFixed(1)}s`);
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
    setTextIfChanged("game-instruction", s.label || modes[selected].controls);
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
      copy = `The word was ${s.word.replaceAll(" ", "")}.${s.random_mode ? ` Difficulty: ${modes.hangman.difficulties[s.difficulty][0]}.` : ""} Score: ${s.score}.`;
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
    if (selected === "geomayhem") {
      title = s.won ? (s.level === s.total_levels ? "Mayhem mastered!" : "Arena conquered!") : "Cubie will be back.";
      copy = s.won ? `${s.level_name} cleared! All 20 waves survived with ${s.loadout.length} weapons. ` : `${s.death_message} `;
      copy += `+${geomayhemResult?.reward || 0} shards. `;
      if (geomayhemResult?.firstClear) copy += s.level < s.total_levels ? `Arena ${s.level + 1} unlocked. ` : `All ${s.total_levels} arenas conquered! `;
      copy += "Visit the workshop, then start a fresh expedition.";
      if (!geomayhemRun?.store.available) copy += " Storage is unavailable; progress lasts only for this visit.";
    }
    if (!s.won && roundNewPersonalBest) title = "NEW PERSONAL BEST";
    showOverlay(
      title,
      copy,
      selected === "geomayhem" ? "Return to expedition hub ↗" : "Play again ↗",
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
// Keep repeated geometry in the browser; Python sends positions and rotations.
const geomayhemPaths = new Map();
let geomayhemBackdrop = null;
function geomayhemPath(sides, star) {
  const key = `${sides}:${star}`;
  if (!geomayhemPaths.has(key)) {
    const path = new Path2D(), count = star ? sides * 2 : sides;
    for (let i = 0; i < count; i++) {
      const a = i * Math.PI * 2 / count, r = star && i % 2 ? .52 : 1;
      if (i) path.lineTo(Math.cos(a)*r, -Math.sin(a)*r);
      else path.moveTo(Math.cos(a)*r, -Math.sin(a)*r);
    }
    path.closePath();
    geomayhemPaths.set(key, path);
  }
  return geomayhemPaths.get(key);
}
function paintGeomayhemPolygon(context, x, y, radius, sides, fill, outline, angle=0, star=false, width=2) {
  if (radius <= 0) return;
  context.save();
  context.translate(x,y); context.rotate(-angle); context.scale(radius,radius);
  const path = geomayhemPath(sides,star);
  if (fill) { context.fillStyle=fill; context.fill(path); }
  if (outline) { context.strokeStyle=outline; context.lineWidth=width/radius; context.stroke(path); }
  context.restore();
}
function drawGeomayhemCommand(context, command) {
  const c = command.coords;
  context.globalAlpha = command.opacity ?? 1;
  context.setLineDash(command.dash || []);
  if (command.kind === "geomayhem_polygon") {
    paintGeomayhemPolygon(context,c[0],c[1],command.radius,command.sides,command.fill,command.outline,
      command.angle,command.star,command.width);
    return;
  }
  if (command.kind === "geomayhem_enemy") {
    const {radius,sides,fill:color,angle,star,burn,health}=command;
    paintGeomayhemPolygon(context,c[0],c[1],radius,sides,color,"#fff0dc",angle,star);
    if (burn) {
      context.beginPath();context.arc(c[0],c[1],radius+3,0,Math.PI*2);
      context.strokeStyle="#ff8a42";context.lineWidth=2;context.stroke();
    }
    context.fillStyle="#152033";
    context.fillRect(c[0]-5.5,c[1]-4,3,4);context.fillRect(c[0]+2.5,c[1]-4,3,4);
    if (health !== null) {
      context.fillStyle="#44283d";context.fillRect(c[0]-radius,c[1]-radius-7.5,radius*2,3);
      context.fillStyle=color;context.fillRect(c[0]-radius,c[1]-radius-7.5,radius*2*health,3);
    }
    return;
  }
  if (command.kind === "geomayhem_effect") {
    const {radius,stars,fill:color,life,end}=command;
    if (command.effect === "line") {
      context.beginPath();context.moveTo(c[0],c[1]);context.lineTo(end[0],-end[1]);
      context.strokeStyle=color;context.lineWidth=radius;context.stroke();
      if (stars >= 3) {context.strokeStyle="#ffffff";context.lineWidth=2;context.stroke();}
      if (stars >= 5) for (const t of [.15,.4,.7])
        paintGeomayhemPolygon(context,c[0]+(end[0]-c[0])*t,c[1]+(-end[1]-c[1])*t,14,4,"",color,0,true);
    } else {
      const r=radius*(1.3-life);
      context.beginPath();context.arc(c[0],c[1],r,0,Math.PI*2);
      context.strokeStyle=color;context.lineWidth=2;context.stroke();
      if (stars >= 3) paintGeomayhemPolygon(context,c[0],c[1],r*.8,6,"","#ffffff");
      if (stars >= 5) paintGeomayhemPolygon(context,c[0],c[1],r*1.1,10,"",color,0,true);
    }
    return;
  }
  if (command.kind === "geomayhem_weapon") {
    const {stars,angle,size,fill:color,weapon_kind:kind} = command;
    const sides = {bolt:3,fan:4,ring:8,beam:4,orbit:6,mine:5,boomerang:3,nova:10,drone:6}[kind];
    if (stars >= 5) {
      paintGeomayhemPolygon(context,c[0],c[1],size+8,8,"",color,angle,true);
      context.beginPath(); context.arc(c[0],c[1],size+3,0,Math.PI*2);
      context.strokeStyle="#ffffff";context.lineWidth=1;context.stroke();
    } else if (stars >= 3) paintGeomayhemPolygon(context,c[0],c[1],size+4,6,"",color,-angle);
    paintGeomayhemPolygon(context,c[0],c[1],size,sides,color,stars>=3?"#efffff":"#183042",angle,["ring","orbit","nova"].includes(kind));
    if (stars >= 3) paintGeomayhemPolygon(context,c[0],c[1],size*.42,4,"#ffffff","",angle);
    return;
  }
  context.beginPath();
  context.fillStyle=command.fill || "transparent";
  context.strokeStyle=command.outline || "transparent";
  context.lineWidth=command.width || 1;
  if (command.kind === "rectangle") context.rect(c[0],c[1],c[2]-c[0],c[3]-c[1]);
  else if (command.kind === "polygon") {
    context.moveTo(c[0],c[1]);
    for (let i=2;i<c.length;i+=2) context.lineTo(c[i],c[i+1]);
    context.closePath();
  } else if (command.kind === "oval") context.ellipse((c[0]+c[2])/2,(c[1]+c[3])/2,Math.abs(c[2]-c[0])/2,Math.abs(c[3]-c[1])/2,0,0,Math.PI*2);
  else if (command.kind === "text") {
    context.font=`bold ${command.font?.[1] || 18}px Arial`;
    context.textAlign="center";context.textBaseline="middle";
    context.fillText(command.text,c[0],c[1]);return;
  }
  if (command.fill) context.fill();
  if (command.outline) context.stroke();
}
function cacheGeomayhemBackdrop(s) {
  if (!s.background) return;
  const [left,right,bottom,top] = s.bounds;
  const canvas = document.createElement("canvas");
  // One arena at a time, at twice world resolution for the mobile camera.
  canvas.width=(right-left)*2;canvas.height=(top-bottom)*2;
  const context=canvas.getContext("2d");
  context.scale(2,2);context.translate(-left,top);
  for (const command of s.background) drawGeomayhemCommand(context,command);
  geomayhemBackdrop=canvas;
}
function setTextIfChanged(id, value) {
  const node=$(id), text=String(value);
  if (node.textContent !== text) node.textContent=text;
}
const ctx = $("game-canvas").getContext("2d");
function draw(s) {
  if (s.mode === "geomayhem") cacheGeomayhemBackdrop(s);
  ctx.clearRect(0, 0, 680, 560);
  ctx.save();
  ctx.translate(340, 280);
  if (s.mode === "geomayhem") {
    const camera = geomayhemCamera(s);
    ctx.beginPath(); ctx.rect(-310,-235,620,470); ctx.clip();
    ctx.scale(camera.scale, camera.scale);
    ctx.translate(-camera.x, camera.y);
  }
  const [left, right, bottom, top] = s.bounds;
  ctx.fillStyle = "#111827";
  ctx.fillRect(left, -top, right - left, top - bottom);
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, -top, right - left, top - bottom);
  ctx.clip();
  if (s.mode === "geomayhem" && geomayhemBackdrop)
    ctx.drawImage(geomayhemBackdrop,left,-top,right-left,top-bottom);
  for (const command of s.commands) {
    if (command.role === "player" && TurtleTrails.allowedModes.has(s.mode) && !(trailReducedMotion.matches || saved.preferences?.reducedMotion))
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
    if (command.kind === 'fire_ray') {
      ctx.save();
      ctx.lineCap = 'butt';
      ctx.setLineDash(command.warning ? [8, 7] : []);
      ctx.strokeStyle = command.warning ? '#ffcf75' : '#ff632f';
      ctx.lineWidth = command.warning ? 4 : 24;
      ctx.shadowColor = '#ff752f'; ctx.shadowBlur = command.warning ? 0 : 12;
      ctx.beginPath();ctx.moveTo(c[0],c[1]);ctx.lineTo(c[2],c[3]);ctx.stroke();
      if (!command.warning) {
        ctx.strokeStyle = '#fff2a1';ctx.lineWidth = 8;ctx.shadowBlur = 0;ctx.stroke();
      }
      ctx.restore();continue;
    }
    if (command.chaos_kind) {
      ChaosArt.tile(ctx, command.chaos_kind, c[0], c[1], c[2]-c[0], command.fill || command.outline, command.ghost,
        trailReducedMotion.matches || saved.preferences?.reducedMotion ? command.fill || command.outline : command.fill_color);
      continue;
    }
    if (command.kind === "block_icon") {
      ChaosArt.draw(ctx, command.block, c[0], c[1], command.size, command.ghost, command.color,
        trailReducedMotion.matches || saved.preferences?.reducedMotion ? 0 : command.age, command.cannons);
      continue;
    }
    if (s.mode === "geomayhem") {
      drawGeomayhemCommand(ctx,command);
      continue;
    }
    const turningTurtle = command.role === "player" && s.mode === "dodge" && s.difficulty === "chaos";
    if (turningTurtle) {
      ctx.save();
      ctx.translate(s.player.x, -s.player.y);
      ctx.rotate(chaosTurtleAngle);
      ctx.translate(-s.player.x, s.player.y);
    }
    ctx.beginPath();
    ctx.globalAlpha = command.opacity ?? 1;
    ctx.setLineDash(command.dash || []);
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
    if (turningTurtle) ctx.restore();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
  ctx.strokeStyle =
    selected === "dodge" && s.danger_edge_left > 0 ? "#ff4565"
      : selected === "dodge" && s.difficulty === "impossible" ? "#ffffff"
      : selected === "dodge" && s.difficulty === "merciless"
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
  if (s.mode === "geomayhem" && geomayhemCamera(s).scale > .75) {
    ctx.save();
    const map = { x: 545, y: 52, w: 100, h: 76 };
    const project = (x,y) => [map.x+(x-left)/(right-left)*map.w, map.y+(top-y)/(top-bottom)*map.h];
    ctx.fillStyle = "#08141ddd"; ctx.fillRect(map.x,map.y,map.w,map.h);
    ctx.strokeStyle = "#99b7b0"; ctx.strokeRect(map.x,map.y,map.w,map.h);
    ctx.fillStyle = "#ff647c";
    for (const threat of s.threats) { const [x,y] = project(threat.x,threat.y); ctx.fillRect(x-1,y-1,2,2); }
    const [x,y] = project(s.player.x,s.player.y);
    ctx.fillStyle = "#c5ff9b"; ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
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
  accountApp?.finish(snapshot, "interrupted");
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
  jackpotMachine.tick(now);
  animateChaosGuide(now);
  if (active && !gasterActive && !coreOrigin?.open && !$("cubie-hint").open && selected !== "hangman"
      && !(selected === "geomayhem" && (snapshot?.paused || snapshot?.offers.length))) {
    try {
      if (selected === "geomayhem" && geomayhemPointer)
        aimGeomayhem({clientX:geomayhemPointer[0],clientY:geomayhemPointer[1]});
      const previousPlayer = snapshot?.player;
      snapshot = send("tick", {
        dt: (now - lastFrame) / 1000,
        keys: [...new Set([...keys, ...joystickKeys, ...geomayhemMovementKeys.values(), ...(selected === "geomayhem" && geomayhemFiring ? ["f"] : [])])],
        ...(selected === "geomayhem" ? { aim: geomayhemAim } : {}),
      });
      if (selected === "dodge" && selectedDifficulty === "chaos" && snapshot.player && previousPlayer && !snapshot.paused) {
        const dx = snapshot.player.x - previousPlayer.x, dy = snapshot.player.y - previousPlayer.y;
        if (Math.hypot(dx, dy) > .001) chaosTurtleTarget = Math.atan2(dx, dy);
        const difference = Math.atan2(Math.sin(chaosTurtleTarget - chaosTurtleAngle), Math.cos(chaosTurtleTarget - chaosTurtleAngle));
        chaosTurtleAngle += difference * (trailReducedMotion.matches || saved.preferences?.reducedMotion ? 1 : 1 - Math.exp(-14 * Math.min(.1, Math.max(0, (now - lastFrame) / 1000))));
      }
      turtleTrailField.update((now - lastFrame) / 1000, snapshot,
        TurtleTrails.selected(saved.turtleTrail, saved.shop.owned), trailReducedMotion.matches || !!saved.preferences?.reducedMotion);
      render();
    } catch (error) {
      fail(error);
    }
  }
  if (!active && ready && snapshot?.over && !snapshot.won && !document.hidden
      && !gasterActive && !coreOrigin?.open && !(trailReducedMotion.matches || saved.preferences?.reducedMotion)
      && ["boss", "pumpkin", "wrath"].includes(selected)) {
    try {
      snapshot = send("defeat_frame", { dt: (now - lastFrame) / 1000 });
      draw(snapshot);
    } catch (error) { fail(error); }
  }
  const noteIcon = document.querySelector('[data-game="jukebox"] .card-art');
  if (noteIcon) {
    const pulse = soundOn && !document.hidden && !(trailReducedMotion.matches || saved.preferences?.reducedMotion)
      ? musicPlayer?.melodyPulse() || 0 : 0;
    noteIcon.style.transform = `scale(${1 + pulse * .275})`;
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
function runArcadeCode(rawName, separate = false) {
  clearTimeout(singularityNameTimer);
  showScores();
  const name = rawName.trim().toLowerCase();
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
      if (!separate && $("player").value.trim().toLowerCase() !== "gravitron") return;
      unlockSingularity();
      initializeAudio();
      coreOrigin.play();
    }, 800);
    return;
  }
  if (name === "gaster") {
    history.replaceState({ ...history.state, gasterSequence: { soundOn } }, "");
    if (!separate) saved.player = $("player").value.trim();
    persist();
    const pendingSave = accountApp ? accountApp.ready.then(() => accountApp.settle()) : Promise.resolve();
    pendingSave.then(() => location.reload());
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
}
$("player").oninput = () => {
  if (!accountApp?.signedIn) runArcadeCode($("player").value);
  else { saved.player = $("player").value.trim() || "Player"; persist(); }
};
$("arcade-code-submit").onclick = () => {
  if (active) return;
  runArcadeCode($("arcade-code").value, true);
  $("arcade-code").value = "";
};
$("arcade-code").addEventListener("keydown", event => {
  if (event.key === "Enter") { event.preventDefault(); $("arcade-code-submit").click(); }
});
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
  if (["dodge", "boss", "pumpkin", "wrath", "singularity", "core_practice", "geomayhem"].includes(selected)) {
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
    if (selected === "geomayhem") {
      const movement = arrowMap[event.key] || { w: "Up", a: "Left", s: "Down", d: "Right" }[event.key.toLowerCase()];
      if (movement) {
        event.preventDefault();
        // Keep aliases separate: releasing W must not release a held Up arrow.
        geomayhemMovementKeys.set(event.code || event.key.toLowerCase(), movement);
        return;
      }
    }
    if (event.key.toLowerCase() === (selected === "geomayhem" ? "r" : "d") && !event.repeat) {
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
window.addEventListener("keyup", (event) => {
  geomayhemMovementKeys.delete(event.code || event.key.toLowerCase());
  keys.delete(arrowMap[event.key] || event.key.toLowerCase());
});
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
// Playback intent belongs to this browser. Cloud snapshots must not undo a click.
const soundPreferenceKey = "microgame-madness.sound.v2";
let localSoundPreference = null;
try {
  const stored = localStorage.getItem(soundPreferenceKey);
  if (stored === "true" || stored === "false") localSoundPreference = stored === "true";
} catch { /* Keep the choice in memory when storage is unavailable. */ }
let soundOn = localSoundPreference ?? (pendingGaster?.soundOn !== false);
function rememberSoundChoice(value) {
  localSoundPreference = value;
  try { localStorage.setItem(soundPreferenceKey, String(value)); } catch {}
}
let pendingSoundChoice = null;
let soundSettingChain = Promise.resolve();
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
  rememberSoundChoice(!soundOn);
  setSoundEnabled(localSoundPreference);
  if (!applyingAccountProfile) {
    const choice = pendingSoundChoice = { value: soundOn };
    soundSettingChain = soundSettingChain.then(async () => {
      await accountApp.ready;
      await accountApp.setting({ soundOn: choice.value }, { localSoundIntent: false });
    }).catch(error => accountApp.message(error.message)).finally(() => {
      if (pendingSoundChoice === choice) pendingSoundChoice = null;
    });
  }
};
function setSoundEnabled(value) {
  soundOn = value;
  if (!soundOn) pendingAchievementDing = false;
  $("sound").textContent = soundOn ? "Sound on" : "Sound off";
  $("sound").setAttribute("aria-pressed", String(soundOn));
  if (audioMaster && audioContext.state !== "closed") {
    if (audioMaster.gain.cancelAndHoldAtTime) audioMaster.gain.cancelAndHoldAtTime(audioContext.currentTime);
    else audioMaster.gain.cancelScheduledValues(audioContext.currentTime);
    audioMaster.gain.linearRampToValueAtTime(soundOn ? 1 : 0, audioContext.currentTime + .02);
  }
  syncMusic();
  initializeAudio();
}
function syncMusic() {
  if (selected === "jukebox") renderJukebox();
  if (sequencePlayer) {
    const kind = snapshot?.dying ? "death" : snapshot?.laser_firing ? "finale" : null;
    sequencePlayer.sync(active ? kind : null, kind === "death" ? snapshot.death_age : snapshot?.cinematic_age,
      soundOn && !snapshot?.paused && !document.hidden && !gasterActive && !coreOrigin?.open && !loadFailed);
  }
  if (!musicPlayer) return;
  const welcoming = !!document.querySelector("#welcome-dialog")?.open;
  const state = {
    theme: welcoming ? "cubie_hello" : coreAftermath ? "core_aftermath" : selected === "jukebox" && selectedDifficulty ? `jukebox:${selectedDifficulty}`
      : active && ["singularity", "core_practice"].includes(selected) ? "singularity"
      : active && ["pumpkin", "wrath"].includes(selected) ? "pumpkin"
      : active && selected === "geomayhem" ? `geomayhem_level_${snapshot.level}`
      : active && selected === "keyboard" ? "keyrush"
      : active && selected === "hangman" ? "hangman"
      : active && selected === "dodge" && selectedDifficulty === "chaos" ? "chaos_carnival"
      : active && selected === "dodge" ? `dodge_${selectedDifficulty}`
      : active && selected === "boss" ? `boss_${selectedDifficulty}` : "arcade",
    playing: soundOn && !gasterActive && !coreOrigin?.open && !nameSurpriseActive && !$("cubie-hint").open && !document.hidden && !snapshot?.paused && !loadFailed
      && (welcoming || coreAftermath || selected !== "jukebox" || !!selectedDifficulty && !jukeboxPaused),
  };
  if (pendingRockSong && !welcoming) {
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
    // Cubie’s welcome intro attempts autoplay; interaction resumes it if blocked.
    if (!audioContext || audioContext.state === "closed") {
      const context = new AudioContext();
      try {
        const master = context.createGain();
        master.connect(context.destination);
        const music = new ArcadeMusic.Player(context, master);
        const sequence = new ArcadeEffects.SequencePlayer(context, master);
        music.onPlaybackChange = renderNowPlaying;
        context.addEventListener("statechange", renderNowPlaying);
        audioContext = context;
        audioMaster = master;
        musicPlayer = music;
        sequencePlayer = sequence;
      } catch (error) {
        context.close().catch(() => {});
        throw error;
      }
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
    // A temporary browser/audio error is not a request to mute. The next
    // interaction retries initialization, including partially failed setup.
    renderNowPlaying();
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
    chaos_fire_warning: [880, 880, .1, .065],
    chaos_fire_burst: [140, 45, .35, .1],
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
    oscillator.type = ["core_teleport", "core_exposed", "core_heal", "chaos_fire_warning"].includes(event) ? "sine" : "sawtooth";
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
    initializeGeomayhem(send("geomayhem_options"));

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
  reducedMotion: () => !!saved.preferences?.reducedMotion,
  audio: () => ({ context: audioContext, destination: audioMaster, enabled: soundOn }),
  toggleSound: () => $("sound").click(),
  onChange: open => { coreAftermath = !open; clearKeys(); syncMusic(); },
});
let appliedAccountOwner;
let appliedSoundPreference;
function applyAccountProfile(profile) {
  if (!profile || active) return;
  const owner = accountApp?.controller?.state().owner;
  const editingName = owner === appliedAccountOwner && document.activeElement === $("player");
  appliedAccountOwner = owner;
  applyingAccountProfile = true;
  try {
    saved = profile;
    // A delayed snapshot must not roll back an already-applied sound setting.
    // Revisions belong to the profile owner, so switching accounts resets this.
    const soundRevision = saved.preferenceRevisions?.soundOn || 0;
    if (!appliedSoundPreference || appliedSoundPreference.owner !== owner
        || soundRevision > appliedSoundPreference.revision) {
      appliedSoundPreference = { owner, revision: soundRevision,
        value: saved.preferences?.soundOn !== false };
    } else {
      saved.preferences = { ...saved.preferences, soundOn: appliedSoundPreference.value };
      saved.preferenceRevisions = { ...saved.preferenceRevisions,
        soundOn: appliedSoundPreference.revision };
    }
    saved.unlocks ||= { singularity: false };
    achievementTracker.data = new Achievements.Tracker(saved.achievements).data;
    achievementTracker.round = null;
    saved.achievements = achievementTracker.data;
    saved.shop = CubieShop.restore(saved.shop, [...CubieCustoms.catalog, ...TurtleTrails.catalog]);
    saved.cubieCustom ||= "classic";
    if (!editingName) $("player").value = saved.player || "Player";
    announcedCustoms.clear();
    for (const item of CubieCustoms.catalog)
      if (CubieCustoms.unlocked(item, saved.achievements.unlocked, saved.shop.owned, saved.testerTon618)) announcedCustoms.add(item.id);
    syncSingularityCard();
    const desiredSound = localSoundPreference ?? (saved.preferences?.soundOn !== false);
    if (!pendingSoundChoice && soundOn !== desiredSound) setSoundEnabled(desiredSound);
    document.documentElement.classList.toggle("account-reduced-motion", !!saved.preferences?.reducedMotion);
    renderAchievements(); applyCubieCustom(); showScores();
    if (selected === "shop") renderShop();
    if (selected === "customs") renderCustoms();
    if (selected === "geomayhem") renderGeomayhemHub();
    persist();
  } finally { applyingAccountProfile = false; }
}
accountApp = new AccountApp.App({ getProfile: () => saved, applyProfile: applyAccountProfile,
  getSoundPreference: () => soundOn,
  onSoundPreference: value => { rememberSoundChoice(value); setSoundEnabled(value); },
  isPlaying: () => active, config: leaderboardReady.then(client => ({ url: client.url, key: client.key })),
  onIdentityLoss: () => { active = false; snapshot = null; clearKeys(); selectGame("hangman"); } });
accountApp.onVisibilityChange = syncGuestLeaderboardPrivacy;
let resetStep = 0;
let resetPending = false;
function playResetSound(stage) {
  if (!soundOn) return Promise.resolve();
  initializeAudio();
  if (!audioContext || !audioMaster) return Promise.resolve();
  const source = audioContext.createBufferSource();
  source.buffer = ArcadeEffects.resetBuffer(audioContext, stage);
  source.connect(audioMaster);
  return new Promise(resolve => {
    source.onended = () => { source.disconnect(); resolve(); };
    source.start();
    // A suspended audio device must never prevent the reset from finishing.
    setTimeout(resolve, Math.ceil(source.buffer.duration * 1000) + 150);
  });
}
$("reset-open").onclick = () => {
  playResetSound(0);
  resetStep = 0;
  $("reset-heading").textContent = "REALLY reset?";
  $("reset-description").textContent = "This will reset the entire arcade and start over.";
  $("reset-password-label").hidden = true;
  $("reset-password").value = "";
  $("reset-error").textContent = "";
  $("reset-dialog").showModal();
  $("reset-no").focus();
};
$("reset-no").onclick = () => $("reset-dialog").close();
$("reset-dialog").addEventListener("close", () => { $("reset-password").value = ""; });
$("reset-dialog").addEventListener("cancel", event => {
  if (resetPending) event.preventDefault();
});
$("reset-yes").onclick = async () => {
  if (resetPending) return;
  if (resetStep === 0) {
    playResetSound(1);
    resetStep = 1;
    $("reset-heading").textContent = "Are you 100% sure?";
    $("reset-description").textContent = "This resets ALL progress, deletes your signed-in account and its cloud data, and clears all saved arcade profiles, settings, preferences, and other arcade data in this browser. This cannot be undone. The page will reload and replay Cubie’s introduction.";
    await accountApp.ready;
    $("reset-password-label").hidden = !accountApp.accountBound;
    $("reset-no").focus();
    return;
  }
  if (accountApp.accountBound && !$("reset-password").value) {
    $("reset-error").textContent = "Enter your account password to delete your account and reset everything.";
    $("reset-password").focus();
    return;
  }
  resetPending = true;
  $("reset-yes").disabled = $("reset-no").disabled = true;
  const resetSoundFinished = playResetSound(2);
  try {
    await accountApp.resetDeviceProgress($("reset-password").value);
    $("reset-password").value = "";
    await resetSoundFinished;
    location.reload();
  } catch (error) {
    $("reset-error").textContent = error.message || "Could not reset. Please try again.";
    resetPending = false;
    $("reset-yes").disabled = $("reset-no").disabled = false;
  }
};
const arcadeWelcome = new ArcadeWelcome.Guide(accountApp);
window.addEventListener('arcade-welcome-change', () => {
  if (arcadeWelcome.dialog.open) initializeAudio();
  syncMusic();
});
accountApp.ready.then(async () => {
  const client = await leaderboardReady;
  if (accountApp.session) client.accountSession = accountApp.session;
  client.beforeFlush = async () => {
    if (!await syncGuestLeaderboardPrivacy()) throw new Error('Leaderboard sharing is disabled for this profile.');
  };
});
for (const [method, makeEvent] of Object.entries({
  visit: () => ["visit", {}],
  secret: name => ["secret", { name }],
  slotResult: (symbols, custom, visible) => ["slots", { symbols, visible }],
  hearMusic: (track, custom, audible) => ["music", { track, audible }],
  completeGaster: () => ["gaster", {}],
  spendTime: seconds => { const end = Date.now(); return ["time", { start: end - Math.min(seconds, 60) * 1000, end }]; },
})) {
  const original = achievementTracker[method].bind(achievementTracker);
  achievementTracker[method] = (...args) => {
    const result = original(...args);
    if (result.changed) {
      const [event, payload = {}] = makeEvent(...args);
      accountApp.arcade(event, payload, { occurredAt: achievementTracker.observedAt });
    }
    return result;
  };
}
initializeGlobalLeaderboards();
initializeAchievements();
// Save elapsed open-page time across visits; a fresh load starts a fresh clock.
let websiteTimeCheckpoint = performance.now();
function saveWebsiteTime() {
  if (accountApp?.resetting) return;
  const now = performance.now();
  // A timer/pagehide save must not replace a newer profile written by another
  // tab or an import with this page's older in-memory copy.
  try {
    if (storageAvailable && localStorage.getItem(storageKey) !== persistedProfileJSON) {
      websiteTimeCheckpoint = now;
      return;
    }
  } catch { /* Existing storage handling keeps this visit usable in memory. */ }
  const seconds = Math.floor((now - websiteTimeCheckpoint) / 1000);
  if (seconds <= 0) return;
  websiteTimeCheckpoint += seconds * 1000;
  updateAchievements(achievementTracker.spendTime(seconds));
}
setInterval(saveWebsiteTime, 10000);
document.addEventListener("visibilitychange", saveWebsiteTime);
window.addEventListener("pagehide", saveWebsiteTime);
// A page restored from the back/forward cache starts another visit interval.
window.addEventListener("pageshow", event => {
  if (event.persisted) websiteTimeCheckpoint = performance.now();
});
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
const jackpotMachine = new JackpotSlots.Controller({
  equipped: () => saved.cubieCustom,
  reducedMotion: () => trailReducedMotion.matches || !!saved.preferences?.reducedMotion,
  onResult: symbols => updateAchievements(achievementTracker.slotResult(symbols, saved.cubieCustom, true)),
});
requestAnimationFrame(frame);
const gameLayout = new ResizeObserver(() => fitArcade());
for (const selector of [".game-heading", ".game-footer", "#touch-controls", "#player-health"])
  gameLayout.observe(document.querySelector(selector));
let arenaLayoutWidth = document.documentElement.clientWidth;
let arenaLayoutHeight = innerHeight;
function resizeGameArea() {
  const width = document.documentElement.clientWidth, height = innerHeight;
  const layoutChanged = width !== arenaLayoutWidth || height !== arenaLayoutHeight;
  arenaLayoutWidth = width; arenaLayoutHeight = height;
  // Refit/recenter on real window or orientation changes, but never on pinch
  // zoom: the visual viewport changes while the underlying layout stays put.
  if (layoutChanged && !$("game-canvas").hidden && (window.visualViewport?.scale ?? 1) === 1)
    showGameArea();
  else fitArcade();
}
window.addEventListener("resize", resizeGameArea);
window.visualViewport?.addEventListener("resize", resizeGameArea);
guidePreviewBootstrap.stop();
initializeChaosGuide(JSON.parse($("chaos-bootstrap").textContent));
initializeChaosScreenKey();
initialize();


// Pause decorative card animations outside the viewport and in background tabs.
const animatedGameCards = [...document.querySelectorAll(".game-card")];
const visibleGameCards = new Set();
function syncCardDecorationVisibility() {
  for (const card of animatedGameCards)
    card.classList.toggle("card-effects-paused", document.hidden || !visibleGameCards.has(card));
}
const cardDecorationObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) visibleGameCards.add(entry.target);
    else visibleGameCards.delete(entry.target);
  }
  syncCardDecorationVisibility();
});
animatedGameCards.forEach(card => cardDecorationObserver.observe(card));
document.addEventListener("visibilitychange", syncCardDecorationVisibility);

// Seven reused actors draw from every sea creature before reshuffling the pool.
const oceanSpecies = [...document.querySelectorAll('symbol[id^="ocean-"]')].map(n => n.id);
let oceanCreatureBag = [];
function randomizeOceanCreature(actor) {
  if (!oceanCreatureBag.length) {
    oceanCreatureBag = [...oceanSpecies];
    for (let i = oceanCreatureBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [oceanCreatureBag[i], oceanCreatureBag[j]] = [oceanCreatureBag[j], oceanCreatureBag[i]];
    }
  }
  const species = oceanCreatureBag.pop();
  const size = 16 + Math.random() * 18;
  actor.dataset.species = species;
  actor.style.setProperty("--swim-depth", (34 + Math.random() * 98) + "px");
  actor.style.color = ["#76b5c9", "#6f9dc0", "#90c6c1", "#ae9ecb", "#7ab8d9"][Math.floor(Math.random() * 5)];
  actor.style.opacity = String(.3 + Math.random() * .25);
  const art = actor.querySelector("use");
  art.setAttribute("href", "#" + species);
  art.setAttribute("width", size);
  art.setAttribute("height", size * .7);
}
const oceanScene = document.querySelector('[data-game="dodge"] .ocean-creatures');
for (let i = 0; i < 7; i++) {
  const actor = document.createElementNS("http://www.w3.org/2000/svg", "g");
  actor.classList.add("ocean-swimmer");
  const leftward = i % 2 === 1;
  if (leftward) actor.classList.add("ocean-swimmer-left");
  const turn = document.createElementNS("http://www.w3.org/2000/svg", "g");
  if (leftward) turn.setAttribute("transform", "scale(-1 1)");
  turn.classList.add("ocean-swim-bob");
  const art = document.createElementNS("http://www.w3.org/2000/svg", "use");
  turn.append(art); actor.append(turn);
  actor.style.setProperty("--swim-duration", (18 + Math.random() * 16) + "s");
  actor.style.setProperty("--swim-delay", (-i * 4) + "s");
  actor.style.setProperty("--ocean-rest-x", (12 + i * 32) + "px");
  randomizeOceanCreature(actor);
  actor.addEventListener("animationiteration", event => {
    if (event.target === actor) randomizeOceanCreature(actor);
  });
  oceanScene.append(actor);
}
