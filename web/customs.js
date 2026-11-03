"use strict";

// Art is authored locally; achievement IDs are the sole unlock authority.
const CubieCustoms = (() => {
  const achievementCatalog = typeof module !== "undefined" && module.exports
    ? require("./achievements.js").catalog : Achievements.catalog;
  const tierLabels = {
    bronze: "Bronze", silver: "Silver", gold: "Gold", crystal: "Crystal",
    diamond: "Diamond", rainbow: "Rainbow", empyrorite: "Empyrorite", black: "Black",
  };
  const tierOrder = Object.keys(tierLabels);
  const flavorText = {
    gaster: "Probably nothing.",
    medal_bronze: "Twenty small victories. One very proud little square.",
    medal_silver: "Fifteen silver linings, polished into one outfit.",
    medal_gold: "Ten golden moments. Please keep fingerprints to a minimum.",
    medal_crystal: "Five bright memories, caught inside a crystal.",
    medal_diamond: "Three impossible-looking victories. One unbreakable grin.",
    medal_rainbow: "Two rainbows walked into a closet. Cubie walked out.",
    medal_empyrorite: "One legendary achievement. An emerald glow that never forgets.",
    classic: "The original little square with a very big heart.",
    pumpkin: "Won the crown. Kept the pumpkin. Refuses to become pie.",
    bookworm: "Just one more chapter. And maybe a tiny bookmark nap.",
    wizard: "Knows every spell except the one that finds missing socks.",
    detective: "The clues were square. This case just got personal.",
    envelope: "Special delivery: one smile. No postage required.",
    rainbow: "Read so many words, the colors started reading back.",
    typewriter: "Click. Clack. A strongly worded letter asking for more snacks.",
    lightning: "A bright idea with absolutely no indoor voice.",
    racecar: "Zero to zoom before you can say buckle up.",
    rocket: "Mission control says stop waving at every star.",
    turtle: "Home is wherever you bring your shell.",
    lifeguard: "No running by the pool. Floating is encouraged.",
    cactus: "Would love a hug. Still working out the details.",
    astronaut: "One small float for Cubie. One giant craving for moon cheese.",
    ninja: "You saw nothing. Especially that little victory wiggle.",
    comet: "Passing through your sky with a tail full of wishes.",
    knight: "Brave of heart. Squeaky of armor.",
    dragon: "Breathes fire. Blows on hot soup anyway.",
    moon: "Keeps a night-light on for the stars.",
    diamond: "Under all that pressure, Cubie decided to sparkle.",
    champion: "The trophy is Cubie. Please do not put juice in Cubie.",
    samurai: "Twenty perfect fights. One very carefully polished helmet.",
    crown: "By royal decree, everyone gets a snack break.",
    scarecrow: "The crows keep visiting. Cubie is too polite to scare them.",
    ghost: "Boo! Sorry. Was that too loud?",
    star: "A little wish that learned how to smile.",
    pixel: "Low resolution. High enthusiasm.",
    mushroom: "A spare life and a hat with excellent shade.",
    rockstar: "The encore is mostly happy squeaking.",
    vortex: "Pulls in nearby stars, loose buttons, and compliments.",
    jester: "The king asked for a joke. Cubie brought a whole outfit.",
    patchwork: "A few loose stitches. Not a single lost hope.",
    heart: "One hundred pets later, you are still the favorite.",
  };
  const catalog = [];
  const square = '<rect x="20" y="28" width="80" height="80" rx="13.8"/>';
  function add(id, name, achievement, color, detail, body = square, layers = {}) {
    const achievements = achievement ? [].concat(achievement) : [];
    // A Custom with alternative unlocks uses its easiest qualifying tier.
    // Its category stays the same regardless of which unlock the player earns.
    const tier = achievements.map(id => achievementCatalog.find(a => a.id === id).tier)
      .sort((a, b) => tierOrder.indexOf(a) - tierOrder.indexOf(b))[0];
    catalog.push({ id, name, tier, flavor: flavorText[id], achievements, color, detail, body, ...layers });
  }
  add("classic", "Classic Cubie", "welcome", "#c6f783", "");
  add("pumpkin", "Pumpkin Cubie", ["pumpkin_baby", "pumpkin_coward", "pumpkin_phase2", "pumpkin_come_on"], "#ff992f",
    '<path d="M55 34q4-12 0-23l9-4q8 15 1 27" fill="#507b37"/><path d="m59 13 3 15" fill="none" stroke="#88ad50" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M65 27q7-18 24-14-2 17-24 14" fill="#7da94b"/><path d="m67 25 15-8" stroke="#517b37" stroke-width="2"/>' +
    '<path d="M43 32C27 48 27 90 44 103M77 32c16 16 16 58-1 71" fill="none" stroke="#d97721" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M49 34q-8 9-10 21M28 60q-2 13 2 23" fill="none" stroke="#ffca68" stroke-width="3" stroke-linecap="round"/>',
    '<path d="M60 31C48 22 39 28 34 33C13 33 16 91 30 101C39 110 51 109 60 105C69 109 81 110 90 101C104 91 107 33 86 33C81 28 72 22 60 31Z"/>');
  add("bookworm", "Bookworm Cubie", "hangman_win", "#f3d3a0",
    '<path d="M60 32v70M24 94l31 10M96 94l-31 10" stroke="#a87952" stroke-width="4"/><path d="M79 28v24l-6-5-6 5V28" fill="#e77f89"/>',
    '<path d="M15 29q24-10 45 3 21-13 45-3v73q-24-8-45 4-21-12-45-4z"/>');
  add("wizard", "Word Wizard", "hangman_5", "#c6b2f5",
    '<path d="M27 31L60 1l26 30z" fill="#7c5bb8"/><path d="M16 31h86" stroke="#b29be6" stroke-width="8"/><path d="m59 10 2 5 6 1-5 3 1 6-4-4-5 3 2-6-4-3 5-1" fill="#fff1a8"/>');
  add("detective", "Clue Cubie", "hangman_hard", "#d5b88b",
    '<path d="M33 30V17h52v13M20 31h80" fill="#856948" stroke="#856948" stroke-width="8"/><path d="M29 101l13-15 18 17 18-17 13 15" fill="#887458"/><path d="M60 104v-12" stroke="#3b3030" stroke-width="4"/>');
  add("envelope", "Letter Carrier", "hangman_perfect", "#fff0c3",
    '<path d="M22 31l38 28 38-28M22 104l21-20M98 104L77 84" fill="none" stroke="#d9ad68" stroke-width="3"/><rect x="81" y="32" width="13" height="14" fill="#f3a4bd"/>');
  add("rainbow", "Rainbow Reader", "hangman_250", "#f7b0d3",
    '<path d="M20 43h80M20 36h80" stroke="#ffdf91" stroke-width="7"/><path d="M20 99h80M20 91h80" stroke="#85dcd2" stroke-width="7"/><path d="M30 25q30-37 60 0" fill="none" stroke="#b9a2ef" stroke-width="8"/>');
  add("typewriter", "Click Clack", "typing_5", "#a8d9d7",
    '<path d="M37 29V6h46v23" fill="#fff4de" stroke="#467f87" stroke-width="3"/><path d="M45 14h30M45 21h23" stroke="#467f87" stroke-width="2"/><path d="M17 102h86l7 11H10z" fill="#467f87"/><path d="M24 107h72" stroke="#fff4de" stroke-width="3" stroke-dasharray="5 4"/>');
  add("lightning", "Lightning Cubie", "typing_10", "#ffe778",
    '<path d="M26 37L9 58h16L8 84M94 37l17 21H95l17 26" fill="#ffb347" stroke="#ffb347" stroke-width="4"/><path d="m57 5-8 17h12l-4 14 18-23H63l5-8" fill="#f7c538"/>');
  add("racecar", "Turbo Cubie", "typing_15", "#ff7b7b",
    '<g class="turbo-wheels" fill="#26313a">' +
    [ [12, 38], [96, 38], [12, 82], [96, 82] ].map(([x, y]) =>
      `<g class="turbo-wheel"><rect x="${x}" y="${y}" width="12" height="24" rx="4"/>` +
      `<path d="M${x + 3} ${y + 5}v14" stroke="#586472" stroke-width="2" stroke-linecap="round"/>` +
      `<rect x="${x + 8}" y="${y + 7}" width="3" height="10" rx="1" fill="#9aaab7"/></g>`).join('') + '</g>' +
    '<path d="M44 28h8v15h-8zM68 28h8v15h-8zM44 94h8v14h-8zM68 94h8v14h-8z" fill="#fff1cf"/>' +
    '<path d="M28 34h10M82 34h10" stroke="#ffd98b" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M29 27v-7M91 27v-7" stroke="#a74150" stroke-width="4"/>' +
    '<rect x="19" y="15" width="82" height="8" rx="3" fill="#c94a59"/><path d="M24 16h72" stroke="#ffb7a6" stroke-width="2"/>' +
    '<path d="M30 104h9M81 104h9" stroke="#a74150" stroke-width="3" stroke-linecap="round"/>');
  add("rocket", "Rocket Fingers", "typing_30", "#d3e6ee",
    '<path d="M22 73L5 102l20-5M98 73l17 29-20-5" fill="#f77e72"/><path d="M44 107l16 12 16-12" fill="#ffbb55"/><path d="M40 29L60 4l20 25" fill="#f77e72"/>',
    '<path d="M20 99V53q0-27 40-42 40 15 40 42v46z"/>');
  add("turtle", "Shell Cubie", "dodge_30", "#99cb86",
    '<path d="M25 39l16-7M79 32l16 7M25 91l16 9M79 100l16-9" fill="none" stroke="#4b8960" stroke-width="4"/>',
    '<ellipse cx="60" cy="67" rx="43" ry="43"/>', {
      underBody: '<g fill="#619f6c"><ellipse cx="21" cy="48" rx="16" ry="10"/><ellipse cx="99" cy="48" rx="16" ry="10"/>' +
        '<path d="M42 88Q24 87 15 106q-5 10 6 10 14-3 27-18Z"/><path d="M78 88q18-1 27 18 5 10-6 10-14-3-27-18Z"/></g>' +
        '<path d="m19 106 5 3m76-3-5 3" stroke="#a5d898" stroke-width="3" stroke-linecap="round"/>',
    });
  add("lifeguard", "Poolside Cubie", "dodge_60", "#81d7f1",
    '<g fill="none" stroke-linecap="round"><path d="M9 103a51 12 0 0 0 102 0" stroke="#bca77f" stroke-width="12"/>' +
    '<path d="M9 101a51 12 0 0 0 102 0" stroke="#ffedce" stroke-width="9"/>' +
    '<path d="M10 103q3 5 12 7M98 110q9-2 12-7" stroke="#ef746e" stroke-width="9"/>' +
    '<path d="M35 111q25 6 50 0" stroke="#fff8e6" stroke-width="2"/></g>' +
    '<path d="M26 32h68l-13-17H39z" fill="#ffedce"/><path d="M26 32h68" stroke="#d9c59c" stroke-width="3"/>' +
    '<path d="M57 18h6v4h4v6h-4v4h-6v-4h-4v-6h4Z" fill="#287cce"/>', square, {
      back: '<path d="M9 103a51 12 0 0 1 102 0" fill="none" stroke="#c9b58e" stroke-width="11"/>' +
        '<path d="M9 101a51 12 0 0 1 102 0" fill="none" stroke="#ffedce" stroke-width="8"/>',
    });
  add("cactus", "Prickly Pal", "dodge_90", "#98c886",
    '<path d="M21 76H9V51M99 76h12V51" fill="none" stroke="#98c886" stroke-width="13" stroke-linecap="round"/><path d="M29 34l4 6M87 38l4-6M31 91l-4 7M89 91l4 7" stroke="#fff0bd" stroke-width="3"/><circle cx="68" cy="23" r="10" fill="#f5a4bf"/><circle cx="68" cy="23" r="4" fill="#ffdc76"/>');
  add("astronaut", "Space Shell", "dodge_120", "#c2d4f2",
    '<rect x="27" y="38" width="66" height="56" rx="22" fill="#a5b8de" stroke="#eff3ff" stroke-width="5"/><rect x="10" y="52" width="12" height="30" rx="4" fill="#eff3ff"/><rect x="98" y="52" width="12" height="30" rx="4" fill="#eff3ff"/><path d="M38 31v-9h44v9" fill="#eff3ff"/>');
  add("ninja", "Merciless Ninja", "dodge_merciless", "#afbed7",
    '<path d="M20 32h80v16H20zM99 37l17-12-4 22z" fill="#66598c"/><path d="M22 94h76v12H22z" fill="#66598c"/><path d="m56 35 4-5 4 5-4 5z" fill="#ffe4a1"/>');
  add("comet", "Comet Cubie", "dodge_360", "#f4d7b2",
    '<path d="M87 43a34 34 0 0 1 4 46" fill="none" stroke="#fff1bb" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="33" cy="76" r="5" fill="#dcae81"/><circle cx="72" cy="98" r="3" fill="#dcae81"/>',
    '<circle cx="60" cy="68" r="41"/>', {
      back: '<path d="M57 37C23 22 7 6-13-8 0 16-7 42 11 63q11 15 34 19Z" fill="#df7458"/>' +
        '<path d="M57 43C29 34 15 18 1 10 12 29 4 49 24 66l23 7Z" fill="#f5a55e"/>' +
        '<path d="M57 51C37 40 22 30 14 25c9 19 9 33 31 40Z" fill="#ffe39a"/>' +
        '<path d="M10-1 21 10M-6 26l7 13M28 10l9 8" fill="none" stroke="#ffd68c" stroke-width="3" stroke-linecap="round"/>',
    });
  add("knight", "Arena Knight", "boss_win", "#b6c4d5",
    '<path d="M25 36l35-19 35 19M60 18v22" fill="none" stroke="#77899e" stroke-width="6"/><path d="M20 88l-9 15 19 7M100 88l9 15-19 7" fill="#77899e"/><path d="M57 18V5h16" stroke="#e78d9f" stroke-width="8"/>');
  add("dragon", "Cruel Dragon", "boss_cruel", "#b6d88c",
    '<path d="M25 33L22 9l20 20M78 29L98 9l-3 24" fill="#f7dfa7"/><path d="M20 61L3 43v44l18-10M100 61l17-18v44l-18-10" fill="#76a86e"/><path d="M40 98l6 8 7-8 7 8 7-8 7 8 6-8" fill="#82ae6c"/>');
  add("moon", "Dream Cubie", "boss_nightmare", "#c7bdf4",
    '<path d="M31 35Q4 13 32 7q-6 13 6 18" fill="#ffe7a3"/><path d="m86 10 3 7 8 1-6 5 2 8-7-5-6 5 1-8-6-5 8-1" fill="#ffe7a3"/><circle cx="31" cy="92" r="6" fill="#aaa0d9"/><circle cx="86" cy="35" r="4" fill="#aaa0d9"/>',
    '<circle cx="60" cy="68" r="42"/>');
  add("diamond", "Impossible Gem", "boss_impossible", "#9de7ed",
    '<path d="M17 44h86L80 23H40z" fill="#d3ffff"/><path d="M17 44l20 61M103 44l-20 61M40 23l-7 21M80 23l7 21" stroke="#65becd" stroke-width="3"/>',
    '<path d="M40 23h40l25 23-23 59H38L15 46z"/>');
  add("champion", "Champion Cubie", "boss_25", "#ffdc85",
    '<path d="M20 44H5v23q0 18 19 18M100 44h15v23q0 18-19 18" fill="none" stroke="#e0af50" stroke-width="7"/><path d="M48 104v9h24v-9" fill="#e0af50"/><path d="M37 115h46" stroke="#ffe6a6" stroke-width="7"/>');
  add("samurai", "Arena Sovereign", "boss_clean_streak_20", "#c4e7ce",
    '<path d="M20 38L8 14l31 16M100 38l12-24-31 16" fill="#f5da81"/><path d="M22 35q38-36 76 0" fill="#426d65"/><path d="m60 11 9 14-9 13-9-13z" fill="#e9c36c"/>' +
    '<path d="M24 85h19v19H28q-4 0-4-4ZM77 85h19v15q0 4-4 4H77Z" fill="#426d65"/>' +
    '<path d="M27 90h13M80 90h13M27 96h13M80 96h13" stroke="#6c9582" stroke-width="2"/>');
  add("crown", "Royal Cubie", "pumpkin_3", "#ffcfa0",
    '<path d="M27 31L21 5l23 15L60 1l16 19L99 5l-6 26z" fill="#ffcf62" stroke="#d49d3a" stroke-width="3"/><circle cx="60" cy="23" r="5" fill="#ec8c90"/>');
  add("scarecrow", "Harvest Helper", "pumpkin_10", "#e9c69a",
    '<path d="M18 31h84L77 13H43z" fill="#bc8c51"/><path d="M30 25l12-19 31 6 17 13" fill="#d4ab69"/><path d="M21 88L4 83M22 94L6 98M99 88l17-5M98 94l16 4" stroke="#e3bb68" stroke-width="4"/><path d="M30 106l15-16 15 16 15-16 15 16" fill="#b77664"/>');
  add("ghost", "Boo Cubie", "name_boo", "#e0e8ff",
    '<ellipse cx="32" cy="78" rx="9" ry="5" fill="#c9bcf0"/><ellipse cx="88" cy="78" rx="9" ry="5" fill="#c9bcf0"/>',
    '<path d="M18 109V63a42 42 0 0 1 84 0v46l-14-9-14 9-14-9-14 9-14-9z"/>');
  add("star", "Starlight Cubie", "name_starlight", "#ffe5a0",
    '<path d="m96 12 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#fff6cc"/>',
    '<path d="m60 8 17 29 34 7-17 30 4 35-38-11-38 11 4-35L9 44l34-7z"/>');
  add("pixel", "Retro Cubie", "name_pixel", "#a1dcdd",
    '<path d="M24 29h12v12H24M84 29h12v12H84M24 91h12v12H24M84 91h12v12H84" fill="#5d9eb6"/>',
    '<path d="M30 22h60v10h12v62H90v12H30V94H18V32h12z"/>');
  add("mushroom", "One-Up Cubie", "name_1up", "#f3e6c3",
    '<path d="M9 41q0-37 51-37t51 37z" fill="#dc7d83"/><circle cx="40" cy="22" r="8" fill="#fff3d5"/><circle cx="78" cy="23" r="10" fill="#fff3d5"/><path d="M15 42h90" stroke="#a95068" stroke-width="5"/>',
    '<rect x="28" y="34" width="64" height="73" rx="20"/>');
  add("rockstar", "Rockstar Cubie", "name_rocknroy", "#edb6d2",
    '<path d="M20 44L34 9l17 20L71 4l5 26 22-14 2 28" fill="#8362b0"/><path d="M27 102l12-13 21 15 21-15 12 13" fill="#665580"/><circle cx="104" cy="73" r="6" fill="none" stroke="#ffe391" stroke-width="4"/>');
  add("vortex", "Gravity Cubie", "core_win", "#090b17",
    '<circle cx="60" cy="67" r="39" fill="none" stroke="#8065bd" stroke-width="2"/>' +
    '<path d="M27 48a37 37 0 0 1 63-8" fill="none" stroke="#d5c4ff" stroke-width="2" stroke-linecap="round"/>' +
    '<g transform="rotate(-12 60 88)" fill="none"><path d="M2 88a58 14 0 0 0 116 0" stroke="#b85d79" stroke-width="10"/>' +
    '<path d="M2 88a58 14 0 0 0 116 0" stroke="#ffb56d" stroke-width="6"/>' +
    '<path d="M2 88a58 14 0 0 0 116 0" stroke="#fff0b6" stroke-width="2"/></g>',
    '<circle cx="60" cy="67" r="39"/>', {
      faceColor: '#d8e6ff',
      back: '<g transform="rotate(-12 60 88)" fill="none"><ellipse cx="60" cy="88" rx="58" ry="14" stroke="#b85d79" stroke-width="10"/>' +
        '<ellipse cx="60" cy="88" rx="58" ry="14" stroke="#ffb56d" stroke-width="6"/>' +
        '<ellipse cx="60" cy="88" rx="58" ry="14" stroke="#fff0b6" stroke-width="2"/></g>',
    });
  add("jester", "Royal Jester", "wrath_win_5", "#eab4ca",
    '<path d="M24 34L15 8l31 14L60 3l14 19 31-14-9 26" fill="#b2a0e3"/><g fill="#ffe399"><circle cx="15" cy="8" r="5"/><circle cx="60" cy="5" r="5"/><circle cx="105" cy="8" r="5"/></g><path d="M23 98l14 13 13-13 10 13 10-13 13 13 14-13" fill="#b2a0e3"/>');
  add("patchwork", "Never Give Up", "determination", "#cdb5dd",
    '<path d="M20 29h28v16H20M75 89h25v17H75" fill="#f4c988"/><path d="M23 41h24M78 93h19" stroke="#795f8a" stroke-width="3" stroke-dasharray="3 3"/><path d="M26 84l14 10M27 90l11-5" stroke="#795f8a" stroke-width="3"/>');
  add("heart", "Best Friend Cubie", "cube_pet_100", "#ffb6c6",
    '<path d="M45 17c-13-13-24 7 15 21 39-14 28-34 15-21L60 28z" fill="#ec6e97"/><ellipse cx="30" cy="80" rx="9" ry="5" fill="#ee8aa8"/><ellipse cx="90" cy="80" rx="9" ry="5" fill="#ee8aa8"/>');
  add("gaster", "Gaster Cubie", "waste_of_time", "#eeeef2",
    '<path d="M38 28l5 12-7 9 6 9M85 104l-5-13 7-8-5-11" fill="none" stroke="#22232d" stroke-width="3"/>' +
    '<path d="M20 96l18-9 22 12 22-12 18 9v12H20Z" fill="#242530"/>' +
    '<g fill="#f5f5fa" stroke="#242530" stroke-width="2"><ellipse cx="5" cy="78" rx="10" ry="13"/><ellipse cx="115" cy="78" rx="10" ry="13"/></g>' +
    '<g fill="#242530"><ellipse cx="5" cy="78" rx="4" ry="5"/><ellipse cx="115" cy="78" rx="4" ry="5"/></g>');
  add("medal_bronze", "Bronze Cubie", "collect_bronze", "#c58b59",
    '<path d="M26 35h68v65H26Z" fill="none" stroke="#e6b98b" stroke-width="3"/>' +
    '<path d="m28 99 64-64" stroke="#f6ce9d" stroke-width="5" opacity=".35"/>' +
    '<g fill="#7b4e35"><circle cx="29" cy="37" r="3"/><circle cx="91" cy="37" r="3"/><circle cx="29" cy="99" r="3"/><circle cx="91" cy="99" r="3"/></g>');
  add("medal_silver", "Silver Cubie", "collect_silver", "#c9d5df",
    '<path d="M26 33h29L27 96Z" fill="#f2f8ff"/><path d="M94 40v61H65Z" fill="#92a5b7"/>' +
    '<path d="M32 31h56M32 35h48M32 39h40M32 99h57M40 103h49" stroke="#f5faff" stroke-width="1.5"/>' +
    '<path d="m102 14 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#e8f4ff"/>');
  add("medal_gold", "Golden Cubie", "collect_gold", "#f3c94d",
    '<path d="M26 34h34L26 82Z" fill="#fff0a6"/><path d="M95 54v46H62Z" fill="#ce921f"/>' +
    '<path d="M29 101h58M25 37v32" stroke="#fff2b2" stroke-width="3"/>' +
    '<path d="m13 12 3 9 9 3-9 3-3 9-3-9-9-3 9-3Zm91 79 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#ffe9a0"/>');
  add("medal_crystal", "Crystal Cubie", "collect_crystal", "#ba9aeb",
    '<path d="m25 36 30-8-15 28Zm70 0-30-8 15 28ZM25 101l15-19 20 22Zm70 0L80 82l-20 22Z" fill="#e6d7ff"/>' +
    '<path d="M40 28 30 7 20 29M58 28 62 0 74 28M83 28 99 10 100 35" fill="#9f7ad1" stroke="#d5b7ff" stroke-width="2"/>' +
    '<path d="M27 58v30M91 49v28" stroke="#f6edff" stroke-width="3"/>');
  add("medal_diamond", "Diamond Cubie", "collect_diamond", "#84deee",
    '<path d="M20 42 40 28h40l20 14-20 13H40Z" fill="#d4faff"/>' +
    '<path d="m20 42 20 13-10 35-10-15Zm80 0L80 55l10 35 10-15ZM30 90l30 18 30-18-30 7Z" fill="#42b7d4"/>' +
    '<path d="m40 28 20 14 20-14M40 55l20-13 20 13" fill="none" stroke="#fff" stroke-width="2"/>' +
    '<path d="m105 13 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#c5faff"/>');
  add("medal_rainbow", "Rainbow Cubie", "collect_rainbow", "#ec9cc4",
    '<path d="M34 28h14L20 56V42Z" fill="#ffd781"/><path d="M48 28h18L20 74V56Z" fill="#c6ee91"/>' +
    '<path d="M66 28h18L20 92V74Z" fill="#8ce0dd"/><path d="M84 28h4q12 0 12 12L32 108q-12 0-12-16Z" fill="#99b9ef"/>' +
    '<path d="M100 40v20l-48 48H32Z" fill="#b8a1e9"/><path d="M100 60v20l-28 28H52Z" fill="#f3a7cd"/>' +
    '<path d="m13 10 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#fff1be"/>');
  add("medal_empyrorite", "Empyrorite Cubie", "collect_empyrorite", "#42dbab",
    '<path d="M20 42 40 28h40l20 14-16 15H36Z" fill="#a6ffda"/>' +
    '<path d="m20 42 16 15-7 36-9-17Zm80 0L84 57l7 36 9-17ZM29 93l31 15 31-15-31 7Z" fill="#168970"/>' +
    '<path d="m60 2 11 14-11 14-11-14Z" fill="#72ffbf" stroke="#dcffe8" stroke-width="2"/>' +
    '<path d="M8 47 2 67l6 20M112 47l6 20-6 20" fill="none" stroke="#93ffd0" stroke-width="3"/>' +
    '<path d="M38 33h44M27 60v17" stroke="#edfff3" stroke-width="2"/>');
  const unlocked = (item, medals) => item.id === "classic" || item.achievements.some(id => !!medals[id]);
  function selected(id, medals) {
    const item = catalog.find(item => item.id === id);
    return item && unlocked(item, medals) ? item : catalog[0];
  }
  // Bounds of the front silhouettes, excluding hats, wheels, and other trim.
  // Every front is fitted to Classic Cubie's 145px square; accessories can
  // extend past it without shrinking the character or changing its face.
  const bodyBounds = {
    pumpkin: [18.8723, 26.3594, 82.2554, 81.5819],
    bookworm: [15, 24.6522, 90, 81.3478], rocket: [20, 11, 80, 88],
    turtle: [17, 24, 86, 86], comet: [19, 27, 82, 82], moon: [18, 26, 84, 84],
    diamond: [15, 23, 90, 82], ghost: [18, 21, 84, 88], star: [9, 8, 102, 101],
    pixel: [18, 22, 84, 84], mushroom: [28, 34, 64, 73], vortex: [21, 28, 78, 78],
  };
  function sideColor(color) {
    const rgb = color.match(/[a-f\d]{2}/gi).map(channel => parseInt(channel, 16));
    return '#' + rgb.map((channel, index) => Math.round(channel * .54 + [2, 6, 0][index])
      .toString(16).padStart(2, '0')).join('');
  }
  let artId = 0;
  function svg(item) {
    let detail = item.detail;
    if (item.id === 'medal_rainbow') {
      const clipId = `rainbow-body-${++artId}`;
      const colors = ['#ffd781', '#c6ee91', '#8ce0dd', '#99b9ef', '#b8a1e9', '#f3a7cd'];
      const stripes = Array.from({ length: 36 }, (_, i) =>
        `<rect x="${(i - 18) * 18}" y="-240" width="18.1" height="480" fill="${colors[i % colors.length]}"/>`).join('');
      detail = `<defs><clipPath id="${clipId}">${item.body}</clipPath></defs>` +
        `<g clip-path="url(#${clipId})"><g transform="rotate(45 60 68)"><g class="cubie-rainbow-stripes">${stripes}</g></g></g>` +
        '<path d="m13 10 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#fff1be"/>';
    }
    const [x, y, width, height] = bodyBounds[item.id] || [20, 28, 80, 80];
    const fit = `scale(${145 / width} ${145 / height}) translate(${-x} ${-y})`;
    const silhouette = (color, offset, className) =>
      `<g class="${className}" fill="${color}" transform="translate(${offset} ${offset})"><g transform="${fit}">${item.body}</g></g>`;
    return '<svg class="cubie-custom-art" viewBox="0 0 145 145" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<g class="cubie-float">' +
      `<g class="cubie-back" transform="${fit}" stroke-linejoin="round">${item.back || ''}</g>` +
      silhouette('#202b22', 25, 'cubie-shadow') +
      silhouette(item.id === 'classic' ? '#6d8b44' : sideColor(item.color), 13, 'cubie-side') +
      `<g class="cubie-underbody" transform="${fit}" stroke-linejoin="round">${item.underBody || ''}</g>` +
      silhouette(item.color, 0, 'cubie-front') +
      `<g class="cubie-trim" transform="${fit}" stroke-linejoin="round">${detail}</g>` +
      `<g fill="${item.faceColor || '#17251a'}" class="cubie-eyes"><rect x="35" y="48" width="17" height="26"/><rect x="93" y="48" width="17" height="26"/></g>` +
      `<path class="cubie-smile" d="M52 90h9v7h23v-7h9v14H52Z" fill="${item.faceColor || '#17251a'}"/>` +
      '</g></svg>';
  }
  return { catalog, tierLabels, unlocked, selected, svg };
})();
if (typeof module !== "undefined") module.exports = CubieCustoms;
