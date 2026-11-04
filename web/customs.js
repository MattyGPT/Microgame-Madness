"use strict";

// Character note: Cubie's pronouns are they/them and it/its.

// Art is authored locally; achievements and shop purchases unlock Customs.
const CubieCustoms = (() => {
  const achievementModel = typeof module !== "undefined" && module.exports
    ? require("./achievements.js") : Achievements;
  const achievementCatalog = achievementModel.catalog;
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
    bumblebee: "Buzzes past every obstacle. Stops for every flower.",
    pharaoh: "Five flawless words, sealed in the royal archives.",
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
  add("bumblebee", "Bumblebee Cubie", "dodge_close_10", "#f4cb64",
    '<path d="M24 42h72v8H24ZM24 87h72v9H24Z" fill="#67503c"/>' +
    '<path d="M39 30 33 15M81 30l6-15" stroke="#67503c" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="32" cy="12" r="5" fill="#67503c"/><circle cx="88" cy="12" r="5" fill="#67503c"/>' +
    '<path d="M29 35h23M30 101h57" stroke="#fff0b4" stroke-width="3" stroke-linecap="round"/>' +
    '<ellipse cx="30" cy="78" rx="6" ry="3" fill="#e99b71"/><ellipse cx="90" cy="78" rx="6" ry="3" fill="#e99b71"/>', square, {
      back: '<g class="cubie-motion motion-wing" style="transform-origin:36px 52px"><path d="M31 55C-3 52 0 12 18 21q17 7 22 30" fill="#c7e9e8" stroke="#8bbfc7" stroke-width="3"/><path d="m17 30 13 18" stroke="#efffff" stroke-width="3"/></g>' +
        '<g class="cubie-motion motion-wing" style="transform-origin:84px 52px"><path d="M89 55c34-3 31-43 13-34Q85 28 80 51" fill="#c7e9e8" stroke="#8bbfc7" stroke-width="3"/><path d="m103 30-13 18" stroke="#efffff" stroke-width="3"/></g>',
    });
  add("pharaoh", "Pharaoh Cubie", "hangman_perfect_5", "#edc77b",
    '<path d="M22 39 32 18q28-17 56 0l10 21Z" fill="#3e7895"/>' +
    '<path d="M33 19q27-14 54 0M28 28h64M24 37h72" fill="none" stroke="#f9d681" stroke-width="4"/>' +
    '<path d="M21 40h12v57l-16 8ZM87 40h12l4 65-16-8Z" fill="#3e7895"/>' +
    '<path d="M21 50h12M20 62h13M19 74h14M18 86h15M87 50h12M87 62h13M87 74h14M87 86h15" stroke="#f9d681" stroke-width="4"/>' +
    '<path d="M36 97q24 14 48 0" fill="none" stroke="#3e7895" stroke-width="7"/>' +
    '<path d="M38 98q22 12 44 0" fill="none" stroke="#fff0b8" stroke-width="2"/>' +
    '<path d="M56 37V23q0-8 5-8t5 8l-5 4v10Z" fill="#ffdf86"/><circle cx="62" cy="20" r="2" fill="#438baa"/>');
  add("pumpkin", "Pumpkin Cubie", ["pumpkin_baby", "pumpkin_coward", "pumpkin_phase2", "pumpkin_come_on"], "#ff992f",
    '<path d="M55 34q4-12 0-23l9-4q8 15 1 27" fill="#507b37"/><path d="m59 13 3 15" fill="none" stroke="#88ad50" stroke-width="3" stroke-linecap="round"/>' +
    '<g class="cubie-motion motion-sway" style="transform-origin:65px 27px"><path d="M65 27q7-18 24-14-2 17-24 14" fill="#7da94b"/><path d="m67 25 15-8" stroke="#517b37" stroke-width="2"/></g>' +
    '<path d="M43 32C27 48 27 90 44 103M77 32c16 16 16 58-1 71" fill="none" stroke="#d97721" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M49 34q-8 9-10 21M28 60q-2 13 2 23" fill="none" stroke="#ffca68" stroke-width="3" stroke-linecap="round"/>',
    '<path d="M60 31C48 22 39 28 34 33C13 33 16 91 30 101C39 110 51 109 60 105C69 109 81 110 90 101C104 91 107 33 86 33C81 28 72 22 60 31Z"/>');
  add("bookworm", "Bookworm Cubie", "hangman_win", "#f3d3a0",
    '<path d="M60 32v70" stroke="#a87952" stroke-width="4"/>' +
    '<path d="M15 88v6q24-8 45 4M105 88v6q-24-8-45 4" fill="none" stroke="#a87952" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M79 28v24l-6-5-6 5V28" fill="#e77f89"/>',
    '<path d="M15 29q24-10 45 3 21-13 45-3v73q-24-8-45 4-21-12-45-4z"/>', {
      underBody: '<path d="m105 94 8.07 7.29v6" fill="none" stroke="#795237" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    });
  add("wizard", "Word Wizard", "hangman_5", "#c6b2f5",
    '<path d="M28 31L60 1l32 30Z" fill="#7c5bb8"/><path d="M16 31h88" stroke="#b29be6" stroke-width="8"/><path d="M60 10l2.2 5.5 5.8.5-4.5 3.7 1.5 5.8-5-3.2-5 3.2 1.5-5.8L52 16l5.8-.5Z" fill="#fff1a8"/>');
  add("detective", "Clue Cubie", "hangman_hard", "#d5b88b",
    '<path d="M33 30V17h52v13M20 31h80" fill="#856948" stroke="#856948" stroke-width="8"/><path d="M29 101l13-15 18 17 18-17 13 15" fill="#887458"/><path d="M60 104v-12" stroke="#3b3030" stroke-width="4"/>');
  add("envelope", "Letter Carrier", "hangman_perfect", "#fff0c3",
    '<path d="M22 31l38 28 38-28M22 104l21-20M98 104L77 84" fill="none" stroke="#d9ad68" stroke-width="3"/><rect x="81" y="32" width="13" height="14" fill="#f3a4bd"/>');
  add("rainbow", "Rainbow Reader", "hangman_250", "#f7b0d3",
    '<path d="M20 43h80M20 36h80" stroke="#ffdf91" stroke-width="7"/><path d="M20 99h80M20 91h80" stroke="#85dcd2" stroke-width="7"/><path d="M30 25q30-37 60 0" fill="none" stroke="#b9a2ef" stroke-width="8"/>');
  add("typewriter", "Click Clack", "typing_5", "#a8d9d7",
    '<g class="cubie-motion motion-paper"><path d="M37 29V6h46v23" fill="#fff4de" stroke="#467f87" stroke-width="3"/><path d="M45 14h30M45 21h23" stroke="#467f87" stroke-width="2"/></g><path d="M17 102h86l7 11H10z" fill="#467f87"/><path class="cubie-motion motion-keys" d="M24 107h72" stroke="#fff4de" stroke-width="3" stroke-dasharray="5 4"/>');
  add("lightning", "Lightning Cubie", "typing_10", "#ffe778",
    '<path class="cubie-motion motion-energy" d="M26 37L9 58h16L8 84M94 37l17 21H95l17 26" fill="#ffb347" stroke="#ffb347" stroke-width="4"/><path class="cubie-motion motion-energy" style="animation-delay:-1.1s" d="m57 5-8 17h12l-4 14 18-23H63l5-8" fill="#f7c538"/>');
  add("racecar", "Turbo Cubie", "typing_15", "#ff7b7b",
    '<g class="turbo-wheels" fill="#26313a">' +
    [ [12, 38], [96, 38], [12, 82], [96, 82] ].map(([x, y]) =>
      `<g class="turbo-wheel"><rect x="${x}" y="${y}" width="12" height="24" rx="4"/>` +
      `<path class="cubie-motion motion-tread" pathLength="12" stroke-dasharray="2 2" d="M${x + 3} ${y + 5}v14" stroke="#586472" stroke-width="2" stroke-linecap="round"/>` +
      `<rect x="${x + 8}" y="${y + 7}" width="3" height="10" rx="1" fill="#9aaab7"/></g>`).join('') + '</g>' +
    '<path d="M44 28h8v15h-8zM68 28h8v15h-8zM44 94h8v14h-8zM68 94h8v14h-8z" fill="#fff1cf"/>' +
    '<path d="M28 34h10M82 34h10" stroke="#ffd98b" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M29 27v-7M91 27v-7" stroke="#a74150" stroke-width="4"/>' +
    '<rect x="19" y="15" width="82" height="8" rx="3" fill="#c94a59"/><path d="M24 16h72" stroke="#ffb7a6" stroke-width="2"/>' +
    '<path d="M30 104h9M81 104h9" stroke="#a74150" stroke-width="3" stroke-linecap="round"/>');
  add("rocket", "Rocket Fingers", "typing_30", "#d3e6ee",
    '<path d="M22 73L5 102l20-5M98 73l17 29-20-5" fill="#f77e72"/><path class="cubie-motion motion-thrust" style="transform-origin:60px 107px" d="M44 107l16 12 16-12" fill="#ffbb55"/><path d="M40 29L60 4l20 25" fill="#f77e72"/>',
    '<path d="M20 99V53q0-27 40-42 40 15 40 42v46z"/>');
  add("turtle", "Shell Cubie", "dodge_30", "#99cb86",
    '<path d="M25 39l16-7M79 32l16 7M25 91l16 9M79 100l16-9" fill="none" stroke="#4b8960" stroke-width="4"/>',
    '<ellipse cx="60" cy="67" rx="43" ry="43"/>', {
      underBody: '<g fill="#619f6c"><ellipse class="cubie-motion motion-paddle" style="transform-origin:32px 48px" cx="21" cy="48" rx="16" ry="10"/><ellipse class="cubie-motion motion-paddle" style="transform-origin:88px 48px;animation-direction:alternate-reverse" cx="99" cy="48" rx="16" ry="10"/>' +
        '<g class="cubie-motion motion-paddle" style="transform-origin:42px 90px;animation-direction:alternate-reverse"><path d="M42 88Q24 87 15 106q-5 10 6 10 14-3 27-18Z"/><path d="m19 106 5 3" stroke="#a5d898" stroke-width="3"/></g><g class="cubie-motion motion-paddle" style="transform-origin:78px 90px"><path d="M78 88q18-1 27 18 5 10-6 10-14-3-27-18Z"/><path d="m100 106-5 3" stroke="#a5d898" stroke-width="3"/></g></g>',
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
    '<path d="M20 32h80v16H20z" fill="#66598c"/><path class="cubie-motion motion-sway" style="transform-origin:99px 37px" d="M99 37l17-12-4 22z" fill="#66598c"/><path d="M22 94h76v12H22z" fill="#66598c"/><path d="m56 35 4-5 4 5-4 5z" fill="#ffe4a1"/>');
  add("comet", "Comet Cubie", "dodge_360", "#f4d7b2",
    '<path d="M87 43a34 34 0 0 1 4 46" fill="none" stroke="#fff1bb" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="33" cy="76" r="5" fill="#dcae81"/><circle cx="72" cy="98" r="3" fill="#dcae81"/>',
    '<circle cx="60" cy="68" r="41"/>', {
      back: '<path class="cubie-comet-flame comet-outer" d="M57 37C23 22 7 6-13-8 0 16-7 42 11 63q11 15 34 19Z" fill="#df7458"/>' +
        '<path class="cubie-comet-flame comet-middle" d="M57 43C29 34 15 18 1 10 12 29 4 49 24 66l23 7Z" fill="#f5a55e"/>' +
        '<path class="cubie-comet-flame comet-core" d="M57 51C37 40 22 30 14 25c9 19 9 33 31 40Z" fill="#ffe39a"/>' +
        '<path class="cubie-comet-embers" d="M10-1 21 10M-6 26l7 13M28 10l9 8" fill="none" stroke="#ffd68c" stroke-width="3" stroke-linecap="round"/>',
    });
  add("knight", "Arena Knight", "boss_win", "#b6c4d5",
    '<path d="M25 36l35-19 35 19M60 18v22" fill="none" stroke="#77899e" stroke-width="6"/><path d="M20 88l-9 15 19 7M100 88l9 15-19 7" fill="#77899e"/><path d="M57 18V5h16" stroke="#e78d9f" stroke-width="8"/>');
  add("dragon", "Cruel Dragon", "boss_cruel", "#b6d88c",
    '<path d="M25 33L22 9l20 20M78 29L98 9l-3 24" fill="#f7dfa7"/><path class="cubie-motion motion-wing" style="transform-origin:20px 61px;animation-duration:1.6s" d="M20 61L3 43v44l18-10" fill="#76a86e"/><path class="cubie-motion motion-wing" style="transform-origin:100px 61px;animation-duration:1.6s" d="M100 61l17-18v44l-18-10" fill="#76a86e"/><path d="M40 98l6 8 7-8 7 8 7-8 7 8 6-8" fill="#82ae6c"/>');
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
    '<path d="M9 41q0-37 51-37t51 37z" fill="#55c65b"/><circle cx="40" cy="22" r="8" fill="#fff3d5"/><circle cx="78" cy="23" r="10" fill="#fff3d5"/><path d="M15 42h90" stroke="#27883e" stroke-width="5"/>',
    '<rect x="28" y="34" width="64" height="73" rx="20"/>');
  add("rockstar", "Rockstar Cubie", "name_rocknroy", "#e8545c",
    '<path d="M20 44L34 9l17 20L71 4l5 26 22-14 2 28" fill="#8e273d" stroke="#ff9b91" stroke-width="1.2"/>' +
    '<path d="M20 88 35 84l10 13h30l10-13 15 4v8q0 12-14 12H34q-14 0-14-12Z" fill="#252936"/>' +
    '<path d="m23 89 11-3 10 14m53-11-11-3-10 14" fill="none" stroke="#e5d6c6" stroke-width="2"/>' +
    '<path d="M22 99h76v6H22Z" fill="#642d3c"/><rect x="54" y="98" width="12" height="8" rx="1" fill="#ffe391"/><rect x="57" y="100" width="6" height="4" fill="#252936"/>' +
    '<g fill="#d9e2eb"><circle cx="30" cy="102" r="1.5"/><circle cx="40" cy="102" r="1.5"/><circle cx="80" cy="102" r="1.5"/><circle cx="90" cy="102" r="1.5"/></g>' +
    '<path d="M76 99q6 11 16 0" fill="none" stroke="#d9e2eb" stroke-width="1.4"/><circle cx="104" cy="73" r="6" fill="none" stroke="#ffe391" stroke-width="4"/>');
  add("vortex", "Gravity Cubie", "core_win", "#090b17",
    '<circle cx="60" cy="67" r="39" fill="none" stroke="#8065bd" stroke-width="2"/>' +
    '<path d="M27 48a37 37 0 0 1 63-8" fill="none" stroke="#d5c4ff" stroke-width="2" stroke-linecap="round"/>' +
    '<g class="cubie-gravity-ring" transform="rotate(-12 60 88)" fill="none"><path d="M2 88a58 14 0 0 0 116 0" stroke="#b85d79" stroke-width="10"/>' +
    '<path d="M2 88a58 14 0 0 0 116 0" stroke="#ffb56d" stroke-width="6"/>' +
    '<path d="M2 88a58 14 0 0 0 116 0" stroke="#fff0b6" stroke-width="2"/><path class="cubie-gravity-flow" d="M118 88a58 14 0 0 1-116 0" pathLength="50" stroke="#fffbe3" stroke-width="4" stroke-linecap="round"/></g>',
    '<circle cx="60" cy="67" r="39"/>', {
      faceColor: '#d8e6ff',
      back: '<g class="cubie-gravity-ring" transform="rotate(-12 60 88)" fill="none"><ellipse cx="60" cy="88" rx="58" ry="14" stroke="#b85d79" stroke-width="10"/>' +
        '<ellipse cx="60" cy="88" rx="58" ry="14" stroke="#ffb56d" stroke-width="6"/>' +
        '<ellipse cx="60" cy="88" rx="58" ry="14" stroke="#fff0b6" stroke-width="2"/><ellipse class="cubie-gravity-flow" cx="60" cy="88" rx="58" ry="14" pathLength="100" stroke="#fffbe3" stroke-width="4" stroke-linecap="round"/></g>',
    });
  add("jester", "Royal Jester", "wrath_win_5", "#eab4ca",
    '<path d="M24 34L15 8l31 14L60 3l14 19 31-14-9 26" fill="#b2a0e3"/><g class="cubie-motion motion-bells" style="transform-origin:60px 30px" fill="#ffe399"><circle cx="15" cy="8" r="5"/><circle cx="60" cy="5" r="5"/><circle cx="105" cy="8" r="5"/></g><path d="M23 98l14 13 13-13 10 13 10-13 13 13 14-13" fill="#b2a0e3"/>');
  add("patchwork", "Never Give Up", "determination", "#cdb5dd",
    '<path d="M20 29h28v16H20M75 89h25v17H75" fill="#f4c988"/><path d="M23 41h24M78 93h19" stroke="#795f8a" stroke-width="3" stroke-dasharray="3 3"/><path d="M26 84l14 10M27 90l11-5" stroke="#795f8a" stroke-width="3"/>');
  add("heart", "Best Friend Cubie", "cube_pet_100", "#ffb6c6",
    '<path class="cubie-motion motion-heart" style="transform-origin:60px 28px" d="M45 17c-13-13-24 7 15 21 39-14 28-34 15-21L60 28z" fill="#ec6e97"/><ellipse cx="30" cy="80" rx="9" ry="5" fill="#ee8aa8"/><ellipse cx="90" cy="80" rx="9" ry="5" fill="#ee8aa8"/>');
  add("gaster", "Gaster Cubie", "waste_of_time", "#eeeef2",
    '<path d="M38 28l5 12-7 9 6 9M85 104l-5-13 7-8-5-11" fill="none" stroke="#22232d" stroke-width="3"/>' +
    '<path d="M20 96l18-9 22 12 22-12 18 9v12H20Z" fill="#242530"/>' +
    '<g class="cubie-motion motion-hover"><g fill="#f5f5fa" stroke="#242530" stroke-width="2"><ellipse cx="5" cy="78" rx="10" ry="13"/><ellipse cx="115" cy="78" rx="10" ry="13"/></g>' +
    '<g fill="#242530"><ellipse cx="5" cy="78" rx="4" ry="5"/><ellipse cx="115" cy="78" rx="4" ry="5"/></g></g>');
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
    '<path d="m13 12 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="#ffe9a0"/><path d="m104 91 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#ffe9a0"/>');
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
  // Attack-earned outfits use the same silhouette, depth, and face as Cubie.
  const attackArt = {
    pumpkin_color_memory: ['#91d9f5',
      '<path d="M60 28h26q14 0 14 14v52q0 14-14 14H60Z" fill="#ffb86e"/><path class="cubie-motion motion-energy" d="M32 18h12v12H32M52 18h12v12H52M72 18h12v12H72" fill="#72c9ff"/><path class="cubie-motion motion-energy" style="animation-delay:-1.8s" d="M42 9h12v12H42M62 9h12v12H62M82 9h12v12H82" fill="#ffab60"/><path d="M28 97h64" stroke="#fff1cc" stroke-width="4"/>',
      'Blue means still. Orange means dance. Cubie remembers both.'],
    pumpkin_bone_gauntlet: ['#e8dfc1',
      '<g class="cubie-motion motion-hover" style="animation-duration:4.5s" fill="#faf4dc"><path d="M29 25h62v9H29Z"/><circle cx="28" cy="25" r="7"/><circle cx="28" cy="34" r="7"/><circle cx="92" cy="25" r="7"/><circle cx="92" cy="34" r="7"/></g><path d="M24 44v43M96 44v43" stroke="#baa987" stroke-width="5"/><path d="M35 96h50M39 102h42" stroke="#fff9e6" stroke-width="4"/>',
      'A closet full of bones. Somehow still the friendliest skeleton.'],
    pumpkin_rotating_rings: ['#c6a9f1',
      '<g fill="none" stroke-width="5"><path d="M8 78Q60 123 112 78" stroke="#ffb262"/><path d="M8 40Q60 1 112 40" stroke="#70d8f4"/></g><path d="m60 10 9 12-9 12-9-12Z" fill="#ffe4a0"/>',
      'Ten spins later, the outfit is dizzy. Cubie is fine.'],
    pumpkin_magenta_fingers: ['#efa9d5',
      '<path class="cubie-motion motion-sway" style="transform-origin:59px 31px" d="M32 31V15q0-7 7-7t7 7V6q0-6 6-6t6 6v10V8q0-6 6-6t6 6v11-4q0-6 6-6t6 6v16Z" fill="#bf548f"/><path d="M26 92h68v12H26Z" fill="#a94d85"/><path d="M34 98h52" stroke="#ffd4e9" stroke-width="3"/><path d="m10 50-5 10 8-2-3 12M109 50l5 10-8-2 3 12" fill="none" stroke="#ffd38b" stroke-width="3"/>',
      'A tiny high five with extremely good timing.'],
    pumpkin_chaos: ['#edb39d',
      '<path d="M20 42q0-14 14-14h26L20 62Z" fill="#9dcbed"/><path d="M100 83v11q0 14-14 14H60Z" fill="#b5a0e7"/><path class="cubie-motion motion-hover" d="m28 23 9-15 12 14 14-16 10 15 13-9 8 13" fill="none" stroke="#f6df91" stroke-width="5"/><path d="m7 57 8 6-8 6m106 5-8 6 8 6M30 98l13-6 8 9 12-8 8 7 16-6" fill="none" stroke="#874e78" stroke-width="3"/>',
      'All the patterns at once. All the snacks afterward.'],
    pumpkin_royal_slams: ['#d8bd88',
      '<path d="M23 31 19 10l22 12L60 3l19 19 22-12-4 21Z" fill="#f7d16a"/><path d="M18 47h15v38H18ZM87 47h15v38H87Z" fill="#856d60"/><path d="M21 53h9M21 62h9M90 53h9M90 62h9" stroke="#d9c1a1" stroke-width="3"/><path d="M29 95h62v10H29Z" fill="#856d60"/>',
      'The royal hands missed. The royal tailor did not.'],
    pumpkin_haunted_quadrants: ['#b9a9e1',
      '<g fill="#eee1ff"><path d="M22 32V17q0-10 9-10t9 10v15l-5-4-4 4-4-4Z"/><path d="M81 32V17q0-10 9-10t9 10v15l-5-4-4 4-4-4Z"/></g><path d="M27 17h3v4h-3M33 17h3v4h-3M86 17h3v4h-3M92 17h3v4h-3" fill="#584772"/><path d="M25 92h17v12H25M60 92h17v12H60" fill="#78639b"/><path d="M42 92h18v12H42M77 92h18v12H77" fill="#e4d3fa"/>',
      'Checks all four corners before saying boo.'],
    core_railgun_array: ['#a8cbdc',
      '<g fill="#526f83"><rect x="10" y="29" width="15" height="56" rx="4"/><rect x="95" y="29" width="15" height="56" rx="4"/></g><path class="cubie-motion motion-energy" d="M17 33v43M102 33v43" stroke="#81f3ff" stroke-width="4"/><path d="M32 30h56M32 100h56" stroke="#e6f7ff" stroke-width="4"/><path d="M42 15h36v9H42Z" fill="#f7c56d"/>',
      'Reads the warning lights. Never stands on the tracks.'],
    core_accretion_sweep: ['#b49de6',
      '<path d="M13 83Q58 121 110 76" fill="none" stroke="#f4ba8e" stroke-width="6"/><path d="M20 39Q60 4 100 39" fill="none" stroke="#dfe5ff" stroke-width="4"/><path d="m60 8 6 11-6 11-6-11Z" fill="#ffdfa5"/>',
      'A little swirl of cosmic dust, freshly swept.',
      { back: '<ellipse cx="60" cy="67" rx="55" ry="23" fill="none" stroke="#8164aa" stroke-width="7" transform="rotate(-15 60 67)"/>' }],
    core_collapsing_horizons: ['#c6b1ed',
      '<path d="M28 43V32h64v11M28 88v13h64V88" fill="none" stroke="#ede2ff" stroke-width="3"/><path class="cubie-motion motion-horizon" style="transform-origin:60px 67px" d="M12 45V19h96v26M12 86v29h96V86" fill="none" stroke="#9477cb" stroke-width="4"/><path d="M6 49h15M99 49h15" stroke="#f4c791" stroke-width="4"/>',
      'The horizon keeps shrinking. The smile stays the same.'],
    core_target_lock: ['#f3b2a0',
      '<g fill="none" stroke="#b75a63" stroke-width="4"><path d="M30 42V31h14M76 31h14v11M30 92v10h14M76 102h14V92"/><circle cx="60" cy="14" r="10"/><path d="M60 0v9M60 19v9M46 14h9M65 14h9"/></g><circle cx="60" cy="14" r="3" fill="#fff0af"/>',
      'Please aim somewhere else. Preferably very far away.'],
    core_event_lattice: ['#d3a3e5',
      '<g class="cubie-motion motion-energy" fill="none" stroke="#f7ddff" stroke-width="2"><path d="M24 34h72v12H24ZM24 91h72v12H24ZM36 34v12M48 34v12M60 34v12M72 34v12M84 34v12M36 91v12M48 91v12M60 91v12M72 91v12M84 91v12"/></g><path d="M7 54h11v11H7M102 76h11v11h-11" fill="#83ecdf"/>',
      'Found the safe square. Decided to become it.'],
    core_binary_stars: ['#a8bddf',
      '<path d="m34 4 4 9 10 1-8 7 2 10-8-5-9 5 2-10-7-7 10-1Z" fill="#ffdc89"/><path d="m85 7 4 9 10 1-8 7 2 10-8-5-9 5 2-10-7-7 10-1Z" fill="#a2f3ff"/><path d="M24 94Q60 112 96 94" fill="none" stroke="#e7efff" stroke-width="4"/>',
      'Two stars. One orbit. Absolutely no personal space.'],
    core_gravity_guillotine: ['#b9c9df',
      '<path d="M12 28h13v78H12M95 28h13v78H95" fill="#677a94"/><path d="M25 18h70v15L25 48Z" fill="#e6f3ff"/><path d="m25 48 70-15v5L25 53Z" fill="#83a9c7"/><circle cx="60" cy="27" r="4" fill="#819bb7"/><path d="M31 102h58" stroke="#6f829d" stroke-width="4"/>',
      'Keeps a cool head, especially when the ceiling moves.'],
    core_photon_rain: ['#a5dce8',
      '<path d="M14 29Q60-16 106 29q-12-10-23 0-12-10-23 0-12-10-23 0-12-10-23 0Z" fill="#6a8ebf"/><path d="M60 7v22M35 27q6-16 25-20 19 4 25 20" fill="none" stroke="#a3e8ff" stroke-width="2"/><path d="m8 48 5 10-5 5-5-5Zm102 21 5 10-5 5-5-5ZM33 97l4-7 4 7-4 5Z" fill="#e5faff"/>',
      'Forecast: one hundred percent chance of shiny.'],
    core_crossfire_engine: ['#f4b596',
      '<path d="M25 35h17M78 35h17M25 100h17M78 100h17" stroke="#fff0c3" stroke-width="4"/><path d="M45 17h30v12H45Z" fill="#ad5965"/><circle cx="60" cy="23" r="4" fill="#ffdd8b"/>',
      'Crossed every beam. Still refuses to cross the street alone.',
      { back: '<path d="m10 16 100 100M110 16 10 116" stroke="#bb6178" stroke-width="10"/><path d="m10 16 100 100M110 16 10 116" stroke="#ffdcad" stroke-width="3"/>' }],
    core_dark_matter_mines: ['#b2a0d9',
      '<g fill="#5f547e" stroke="#e0caff" stroke-width="2"><path d="m33 10 8 3 3 8-3 8-8 3-8-3-3-8 3-8ZM88 9l8 3 3 8-3 8-8 3-8-3-3-8 3-8Z"/></g><circle class="cubie-motion motion-energy" cx="33" cy="21" r="3" fill="#f3a1da"/><circle class="cubie-motion motion-energy" style="animation-delay:-1.5s" cx="88" cy="20" r="3" fill="#f3a1da"/><path d="m28 99 7-7 7 7 7-7 7 7 7-7 7 7 7-7 7 7 7-7" fill="none" stroke="#6e5b8d" stroke-width="3"/>',
      'The accessories are decorative. Probably.'],
    core_polarity_inversion: ['#95d7ed',
      '<path d="M60 28h26q14 0 14 14v52q0 14-14 14H60Z" fill="#f3a9cb"/><path class="cubie-motion motion-energy" d="M24 35h18M33 29v12M78 35h18" stroke="#fff4e6" stroke-width="3"/><path class="cubie-motion motion-energy" style="animation-delay:-1.5s" d="M12 45v38q0 8 8 8M108 45v38q0 8-8 8" fill="none" stroke="#8e6da3" stroke-width="7"/>',
      'Positive on the left. Positive attitude everywhere.'],
    core_orbital_saws: ['#c5d1d4',
      '<path d="M29 36h62M29 100h62" stroke="#7e919d" stroke-width="4"/><path d="M34 30h12M74 30h12" stroke="#fff2c4" stroke-width="4"/>',
      'A sharp dresser with remarkably soft manners.',
      { back: '<polygon points="' + Array.from({ length: 40 }, (_, i) => { const angle = i * Math.PI / 20; const radius = i % 2 ? 48 : 58; return `${60 + Math.cos(angle) * radius},${68 + Math.sin(angle) * radius}`; }).join(' ') + '" fill="#788d9e"/><circle cx="60" cy="68" r="46" fill="#e2b879"/>' }],
    core_echo_protocol: ['#a3dfde',
      '<path d="M27 37h17M76 37h17M27 98h17M76 98h17" stroke="#e9ffff" stroke-width="3"/><path d="m11 48-6 11 6 11M109 48l6 11-6 11" fill="none" stroke="#74a8c5" stroke-width="3"/>',
      'Hello. Hello. Hello. Yes, all three are Cubie.',
      { back: '<rect x="7" y="10" width="80" height="80" rx="14" fill="#406c82"/><rect x="13" y="19" width="80" height="80" rx="14" fill="#6aa0b6"/>' }],
    core_lens_fracture: ['#d4bdec',
      '<path d="m31 30 13-24 17 24 15-20 18 22Z" fill="#f1e9ff"/><path d="M44 6 48 30h13ZM76 10l7 22h11Z" fill="#a58bc9"/><path d="M25 47 36 38M86 41l9 9M25 90l18 13M76 103l19-13" stroke="#f7edff" stroke-width="4"/><path d="m48 94 12 9 13-10" fill="none" stroke="#9a7abb" stroke-width="3"/>',
      'A thousand reflections. The same little smile in every one.'],
    core_total_collapse: ['#b69ac9',
      '<path d="m29 28 9 13-9 4 8 8M91 28 82 40l10 7-7 7M28 103l12-12-7-4M92 103 80 92l8-6" fill="none" stroke="#654967" stroke-width="4"/><path class="cubie-motion motion-hover" d="m60 0 5 13 14 4-14 5-5 14-5-14-14-5 14-4Z" fill="#ffd5b5"/><path class="cubie-motion motion-energy" d="M10 55 3 68l7 13M110 55l7 13-7 13" fill="none" stroke="#f8a9cf" stroke-width="4"/>',
      'Everything fell apart. Cubie held it together.'],
  };
  for (const reward of achievementModel.attackRewards) {
    const [color, detail, flavor, layers = {}] = attackArt[`${reward.family}_${reward.key}`];
    add(`attack_${reward.family}_${reward.key}`, reward.customName, reward.id, color, detail, square, { flavor, ...layers });
  }
  // Shop Customs keep the same happy face, with their own silhouettes and trim.
  const shopCustoms = [
    ["blue_mint", "Blue Mint Cubie", 150, "bronze", "#2454a8", "Freshly minted. Already spending smiles.", '<circle cx="60" cy="44" r="11" fill="#10347a" stroke="#a7d8ff" stroke-width="2"/><text x="60" y="49" text-anchor="middle" fill="#a7d8ff" font-size="14">C</text>'],
    ["strawberry", "Strawberry Cubie", 200, "bronze", "#ef6683", "Sweet enough to skip the sugar.", '<path d="m35 32 13-15 12 12 12-12 13 15" fill="#68b36d"/>' + '<path d="m30 55 3 5m54-5 3 5m-59 30 3 5m51-5 3 5m-28 10 3 5" stroke="#ffe9a1" stroke-width="3"/>'],
    ["honey", "Honeycomb Cubie", 250, "bronze", "#f2b83f", "Bee yourself. The hive approves.", '<path d="m24 30 10 6v12l-10 6m58-24 12 6v12l-12 6-10-6V36Zm-35 66 10-6 10 6v12H47Z" fill="none" stroke="#b87925" stroke-width="3"/>'],
    ["sushi", "Sushi Cubie", 300, "silver", "#f8ead6", "Soy happy to see you.", '<path d="M20 35q40-32 80 0v9H20Z" fill="#f28f80"/><path d="M48 28h24v19H48ZM48 105h24v3H48Z" fill="#275244"/><path d="m28 30 15 9m0-16 16 13m8-13 17 13" stroke="#ffd1af" stroke-width="3"/>'],
    ["pirate", "Pirate Cubie", 400, "silver", "#c38b63", "The real treasure was this excellent hat.", '<path d="M12 35q12-15 24-9Q60-7 84 26q12-6 24 9Z" fill="#263449" stroke="#e7c47b" stroke-width="3"/><path d="m53 18 14 10m0-10L53 28" stroke="#fff1cf" stroke-width="3"/><path d="M22 98h76v8H22Z" fill="#a93842"/>'],
    ["cloud", "Cloud Cubie", 450, "silver", "#d9efff", "Forecast: a hundred percent chance of happy.", '<path d="M16 36q-2-14 14-14 4-16 19-10 13-17 27 0 18-5 19 12 15 0 13 12" fill="#f4fbff"/><path class="cubie-motion motion-rain" d="m30 101-3 9m30-7-3 9m30-11-3 9" stroke="#79b9ef" stroke-width="3"/>'],
    ["disco", "Disco Cubie", 600, "gold", "#a7a2d7", "The dance floor requested an encore.", '<path d="M40 29v78m20-78v78m20-78v78M21 48h78M21 68h78M21 88h78" stroke="#e5e6ff" stroke-width="2"/><path d="m12 15 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#fff6b4"/>'],
    ["arcade_cabinet", "Cabinet Cubie", 700, "gold", "#bd719b", "One more game? That is literally the job.", '<path d="M22 29h76v15H22Z" fill="#354065"/><path d="M24 99h72l8 13H16Z" fill="#354065"/><circle class="cubie-motion motion-energy" cx="77" cy="105" r="3" fill="#ffe581"/><path class="cubie-motion motion-sway" style="transform-origin:36px 107px;animation-duration:2s" d="M36 107v-8" stroke="#72e5ce" stroke-width="3"/>'],
    ["terrarium", "Terrarium Cubie", 850, "crystal", "#97cfba", "A tiny garden with very big growing plans.", '<path d="M23 93q20-10 37 0t37 0v13H23Z" fill="#43846a"/><path class="cubie-motion motion-sway" style="transform-origin:35px 93px;animation-duration:5s" d="M35 93V79m0 7q-11 0-9-9 10 0 9 9m0-2q11 0 10-10-10 1-10 10" fill="#79bd62" stroke="#3f7a44" stroke-width="2"/><path d="m83 35 10 10" stroke="#e4fff3" stroke-width="5"/>'],
    ["origami", "Origami Cubie", 1000, "crystal", "#eed9ac", "Folded with care. Unfolds into a friend.", '<path d="m20 28 40 18 40-18-15 80-25-12-25 12Z" fill="#f8e8c9"/><path d="m20 28 40 18 40-18M60 46v50m-25 12 25-12 25 12" fill="none" stroke="#bfa77c" stroke-width="2"/>'],
    ["aurora", "Aurora Cubie", 1300, "diamond", "#3c5c90", "Brought the northern lights home before bedtime.", '<path d="M23 40q20-25 40-3t34-7M23 54q20-25 40-3t34-7" fill="none" stroke="#7ef2c6" stroke-width="7" opacity=".75"/><path d="M23 100q20-25 40-3t34-7" fill="none" stroke="#d8a2ef" stroke-width="7"/>'],
    ["prism_pop", "Prism Pop Cubie", 1800, "rainbow", "#f3a9c9", "Every color asked to be the favorite. Cubie said yes.", '<path d="m20 28 40 0-40 40Z" fill="#ffe38c"/><path d="m60 28 40 0v40Z" fill="#8adbd1"/><path d="m20 68 40 40H20Z" fill="#99b9ef"/><path d="m100 68-40 40h40Z" fill="#bba2ef"/><path d="m60 28 40 40-40 40-40-40Z" fill="none" stroke="#fff3d9" stroke-width="2"/>'],
    ["pancake", "Pancake Cubie", 200, "bronze", "#dca460", "Stacks of courage. A little extra syrup.", "<path d=\"M20 40h80M20 96h80\" stroke=\"#fff1b9\" stroke-width=\"5\"/><path d=\"M21 29h78v18q-8 14-14 0-9 18-15 0-8 8-14 0-9 14-15 0H21Z\" fill=\"#aa6436\"/><rect x=\"49\" y=\"29\" width=\"22\" height=\"10\" rx=\"3\" fill=\"#ffe87e\"/>"],
    ["ladybug", "Ladybug Cubie", 250, "bronze", "#ed595e", "Small spots. Enormous garden ambitions.", "<path d=\"M42 29 35 17m43 12 7-12\" stroke=\"#253140\" stroke-width=\"4\"/><circle cx=\"35\" cy=\"16\" r=\"5\" fill=\"#253140\"/><circle cx=\"85\" cy=\"16\" r=\"5\" fill=\"#253140\"/><g fill=\"#253140\"><circle cx=\"28\" cy=\"45\" r=\"5\"/><circle cx=\"92\" cy=\"45\" r=\"5\"/><circle cx=\"28\" cy=\"86\" r=\"5\"/><circle cx=\"92\" cy=\"86\" r=\"5\"/></g>"],
    ["mailbox", "Mailbox Cubie", 350, "silver", "#689aca", "Every letter gets a warm welcome. Even bills.", "<path d=\"M22 35h76v10H22Z\" fill=\"#294f7a\"/><path class=\"cubie-motion motion-mailflag\" style=\"transform-origin:101px 70px\" d=\"M101 70V27h15v13h-15\" fill=\"#e97367\" stroke=\"#d7e7ed\" stroke-width=\"3\"/><rect x=\"44\" y=\"96\" width=\"32\" height=\"11\" fill=\"#f8e6bb\"/><path d=\"m44 96 16 8 16-8\" fill=\"none\" stroke=\"#a88f6d\"/>"],
    ["crayon", "Crayon Cubie", 400, "silver", "#b784d8", "Colors outside the lines. Befriends everyone inside.", "<path d=\"m29 28 31-25 31 25Z\" fill=\"#8a54ac\"/><path d=\"M21 32h78v10H21ZM21 95h78v10H21Z\" fill=\"#50356d\"/><path d=\"m25 37 9-4 9 4 9-4 9 4 9-4 9 4 9-4\" fill=\"none\" stroke=\"#e6c5fa\" stroke-width=\"2\"/>"],
    ["sailor", "Sailor Cubie", 500, "silver", "#b8d9ef", "All aboard the good ship Friendship.", "<path d=\"M24 28h72l-7-17H31Z\" fill=\"#f2f4e7\"/><path d=\"M24 27h72\" stroke=\"#295883\" stroke-width=\"5\"/><path d=\"m23 91 37 17 37-17\" fill=\"none\" stroke=\"#295883\" stroke-width=\"8\"/><path d=\"m60 100-7 13 7-3 7 3Z\" fill=\"#e86a6d\"/>"],
    ["waffle", "Waffle Cubie", 650, "gold", "#e6bc70", "Every little square holds a big breakfast dream.", "<path d=\"M37 29v78m23-78v78m23-78v78M21 44h78M21 67h78M21 90h78\" stroke=\"#c38d44\" stroke-width=\"5\"/><path d=\"m44 19 21-4 9 12-21 4Z\" fill=\"#fff1a0\"/>"],
    ["jellyfish", "Jellyfish Cubie", 750, "gold", "#c68edc", "Goes with the flow. Brings its own night-light.", "<path d=\"M20 43q40-45 80 0\" fill=\"#ecd0fa\"/><path d=\"M28 104q-9 16 2 23m17-23q-8 14 3 25m22-25q9 13-2 23m20-23q10 14-1 25\" fill=\"none\" stroke=\"#ba97e8\" stroke-width=\"5\"/><circle cx=\"40\" cy=\"33\" r=\"3\" fill=\"#fff4ff\"/>"],
    ["clockwork", "Clockwork Cubie", 900, "crystal", "#b99573", "Always makes time for one more friend.", "<g fill=\"none\" stroke=\"#ead2a0\" stroke-width=\"4\"><circle cx=\"29\" cy=\"40\" r=\"12\"/><circle cx=\"91\" cy=\"96\" r=\"12\"/><path d=\"M29 24v32m-16-16h32M91 80v32m-16-16h32\"/></g><circle cx=\"60\" cy=\"24\" r=\"13\" fill=\"#eee4c8\" stroke=\"#765e4c\" stroke-width=\"3\"/><path d=\"M60 16v8l7 4\" fill=\"none\" stroke=\"#5d493d\" stroke-width=\"2\"/>"],
    ["snowglobe", "Snowglobe Cubie", 1100, "crystal", "#a7d5e7", "A tiny winter that never forgets your birthday.", "<path d=\"M17 99h86v13H17Z\" fill=\"#705e99\"/><path d=\"m31 37 9-5m44 10 9 5\" stroke=\"#edfcff\" stroke-width=\"4\"/><path d=\"M22 96q15-12 30 0t46 0\" fill=\"#f3fbff\"/><g fill=\"#fff\"><circle cx=\"30\" cy=\"66\" r=\"2\"/><circle cx=\"87\" cy=\"78\" r=\"2\"/><circle cx=\"67\" cy=\"36\" r=\"2\"/></g>"],
    ["peacock", "Peacock Cubie", 1400, "diamond", "#58b5ba", "Dressed for the occasion. Every occasion.", "<path d=\"M20 65Q-9 5 25 14q18-30 35 2 17-32 35-2 34-9 5 51\" fill=\"#386d9b\"/><g fill=\"#75d6af\" stroke=\"#d5d77c\" stroke-width=\"3\"><ellipse cx=\"22\" cy=\"29\" rx=\"6\" ry=\"10\"/><ellipse cx=\"43\" cy=\"17\" rx=\"6\" ry=\"10\"/><ellipse cx=\"77\" cy=\"17\" rx=\"6\" ry=\"10\"/><ellipse cx=\"98\" cy=\"29\" rx=\"6\" ry=\"10\"/></g>"],
    ["neon_noodle", "Neon Noodle Cubie", 1700, "rainbow", "#4e416e", "Open all night. Serving smiles by the bowl.", "<path d=\"M24 94h72l-10 19H34Z\" fill=\"#ed81b5\"/><path d=\"m35 100 8-7 8 7 8-7 8 7 8-7 8 7\" fill=\"none\" stroke=\"#ffe38f\" stroke-width=\"3\"/><path d=\"m80 100 25-31m-17 31 24-25\" stroke=\"#9be9df\" stroke-width=\"3\"/><path class=\"cubie-motion motion-steam\" d=\"M33 37q-9-8 0-15m23 11q-9-8 0-15m23 19q-9-8 0-15\" fill=\"none\" stroke=\"#b1eff0\" stroke-width=\"3\"/>"],
    ["cosmic_whale", "Cosmic Whale Cubie", 2200, "empyrorite", "#626dba", "Swims through starlight. Stops for every wish.", "<path d=\"M20 82Q-1 55 4 85l16 13m80-16q21-27 16 3l-16 13\" fill=\"#8d9ade\"/><path d=\"M60 28q-18-18-27-10m27 10q18-18 27-10M60 28V9\" fill=\"none\" stroke=\"#b1eaf6\" stroke-width=\"4\"/><path d=\"m30 36 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z\" fill=\"#fff0ad\"/><circle cx=\"88\" cy=\"93\" r=\"3\" fill=\"#fff0ad\"/>"],
    ["toast", "Toast Cubie", 175, "bronze", "#d59c63", "Warm wishes, lightly toasted.", "<path d=\"M25 43q-7-20 12-20 12-11 23-3 11-8 23 3 19 0 12 20v56H25Z\" fill=\"#f8d998\" /><path d=\"M30 45v47m60-47v47\" fill=\"none\" stroke=\"#e7b87e\" stroke-width=\"2\" stroke-linecap=\"round\" /><path d=\"M50 30h20v10H50Z\" fill=\"#fff1a8\" /><circle cx=\"30\" cy=\"80\" r=\"3\" fill=\"#c89456\"/><circle cx=\"90\" cy=\"77\" r=\"2\" fill=\"#c89456\"/>"],
    ["kiwi", "Kiwi Cubie", 225, "bronze", "#a4cd6c", "A little fuzzy. A lot of vitamin C.", "<path d=\"M26 39q34-21 68 0M26 97q34 14 68 0\" fill=\"none\" stroke=\"#dded9b\" stroke-width=\"8\"/><path d=\"m31 36 3 5m12-10 1 6m28-6-1 6m14-2-3 5m-54 51 4-4m13 13 1-6m24 6-1-6m15-3-4-4\" fill=\"none\" stroke=\"#506b36\" stroke-width=\"2\" stroke-linecap=\"round\" />"],
    ["citrus", "Citrus Cubie", 250, "bronze", "#ffbc62", "Always brings a slice of sunshine.", "<path d=\"M25 43q35-27 70 0\" fill=\"#ffeab0\" /><path d=\"M60 30v11m-18-7 7 9m30-9-8 9\" fill=\"none\" stroke=\"#ef9d46\" stroke-width=\"2\" stroke-linecap=\"round\" /><g class=\"cubie-motion motion-sway\" style=\"transform-origin:60px 28px;\"><path d=\"M60 28q-4-23 20-23-1 22-20 23\" fill=\"#68a66a\" /><path d=\"m63 24 10-11\" fill=\"none\" stroke=\"#a9d88b\" stroke-width=\"2\" stroke-linecap=\"round\" /></g><path d=\"M29 98q31 11 62 0\" fill=\"none\" stroke=\"#ffe3a3\" stroke-width=\"3\" stroke-linecap=\"round\" />"],
    ["sprout", "Sprout Cubie", 275, "bronze", "#b6d19b", "Started small. Still reaching for the sun.", "<path d=\"M20 92h80v16H20Z\" fill=\"#b87e61\" /><path d=\"M25 97h70\" fill=\"none\" stroke=\"#e5b38b\" stroke-width=\"3\" stroke-linecap=\"round\" /><g class=\"cubie-motion motion-sway\" style=\"transform-origin:60px 29px;\"><path d=\"M60 29V10\" fill=\"none\" stroke=\"#4a8855\" stroke-width=\"3\" stroke-linecap=\"round\" /><path d=\"M60 22Q30 22 36 7q20-3 24 15M60 17Q84-1 88 14q-9 14-28 3\" fill=\"#78b872\" /></g>"],
    ["chef", "Chef Cubie", 325, "silver", "#f5dfbf", "The secret ingredient is one more try.", "<path d=\"M29 29V15q-7-20 13-16 13-14 23-1 22-7 25 11v20Z\" fill=\"#fff4df\" /><path d=\"M26 26h68v12H26Z\" fill=\"#ded5bf\" /><path d=\"M41 12v12m18-15v15m18-12v12\" fill=\"none\" stroke=\"#d9cdb4\" stroke-width=\"2\" stroke-linecap=\"round\" /><path d=\"m30 97 17-9 13 12 13-12 17 9v11H30Z\" fill=\"#faf2df\" /><circle cx=\"59\" cy=\"103\" r=\"2\" fill=\"#677780\"/>"],
    ["teacup", "Teacup Cubie", 375, "silver", "#c6e0db", "Steeped in patience. Served with a smile.", "<path d=\"M100 50h10q19 18-10 33\" fill=\"none\" stroke=\"#81aead\" stroke-width=\"7\" stroke-linecap=\"round\" /><path d=\"M24 36h72M21 104q39 12 78 0\" fill=\"none\" stroke=\"#f7ebcc\" stroke-width=\"5\" stroke-linecap=\"round\" /><g class=\"cubie-motion motion-steam\" style=\"transform-origin:60px 68px;\"><path d=\"M39 22q-7-7 0-15m21 15q-7-7 0-15m21 15q-7-7 0-15\" fill=\"none\" stroke=\"#d4efe7\" stroke-width=\"2\" stroke-linecap=\"round\" /></g><path d=\"M84 37v18h10V37Z\" fill=\"#f5d08a\" /><path d=\"M88 34v10\" fill=\"none\" stroke=\"#688c8c\" stroke-width=\"1\" stroke-linecap=\"round\" />"],
    ["camper", "Camper Cubie", 425, "silver", "#b9c88b", "Home is wherever the next trail begins.", "<path d=\"M24 32 38 10h44l14 22Z\" fill=\"#8b9c63\" /><path d=\"M11 34h98v7H11Z\" fill=\"#637849\" /><path d=\"M47 27h26v6H47Z\" fill=\"#c6a46a\" /><path d=\"m26 96 23-8 11 12 11-12 23 8-34 12Z\" fill=\"#e5ac67\" /><circle cx=\"60\" cy=\"101\" r=\"4\" fill=\"#789267\"/><path d=\"M12 54v35m96-35v35\" fill=\"none\" stroke=\"#7a8e62\" stroke-width=\"7\" stroke-linecap=\"round\" />"],
    ["penguin", "Penguin Cubie", 550, "silver", "#5e758c", "Waddles into every challenge with confidence.", "<path d=\"M32 42q28-8 56 0v58H32Z\" fill=\"#eaf1df\" /><path d=\"M31 108 22 118h26l-3-10m30 0-3 10h26l-9-10Z\" fill=\"#efbe68\" />", {"back": "<g class=\"cubie-motion motion-paddle\" style=\"transform-origin:60px 62px;\"><path d=\"M22 61Q-2 60 9 92l15-13M98 61q24-1 13 31L96 79Z\" fill=\"#455e78\" /></g>"}],
    ["firefly", "Firefly Cubie", 625, "gold", "#8ead79", "A tiny lantern with places to be.", "<path d=\"M40 30 32 13m48 17 8-17\" fill=\"none\" stroke=\"#4d6753\" stroke-width=\"3\" stroke-linecap=\"round\" /><circle cx=\"32\" cy=\"12\" r=\"4\" fill=\"#f6df8e\"/><circle cx=\"88\" cy=\"12\" r=\"4\" fill=\"#f6df8e\"/><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;\"><path d=\"M27 92q33-10 66 0v11H27Z\" fill=\"#f1e590\" /><path d=\"M35 98h50\" fill=\"none\" stroke=\"#fff7c5\" stroke-width=\"3\" stroke-linecap=\"round\" /></g>", {"back": "<g class=\"cubie-motion motion-wing\" style=\"transform-origin:60px 48px;animation-duration:1.4s\"><path d=\"M26 69Q-6 18 17 21q20 0 23 36M94 69q32-51 9-48-20 0-23 36\" fill=\"#c5e0b6\" stroke=\"#91bba0\" stroke-width=\"2\"/></g>"}],
    ["robot", "Robot Cubie", 725, "gold", "#a5bdc7", "Beep boop. Friendship protocol complete.", "<path d=\"M60 28V10\" fill=\"none\" stroke=\"#617b91\" stroke-width=\"4\" stroke-linecap=\"round\" /><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;\"><circle cx=\"60\" cy=\"8\" r=\"6\" fill=\"#a7eff2\"/></g><path d=\"M10 47h12v35H10Zm88 0h12v35H98Z\" fill=\"#617b91\" /><path d=\"M30 94h60v11H30Z\" fill=\"#547083\" /><path d=\"M38 98v4m11-4v4m11-4v4m11-4v4m11-4v4\" fill=\"none\" stroke=\"#bcebea\" stroke-width=\"2\" stroke-linecap=\"round\" /><circle cx=\"29\" cy=\"35\" r=\"3\" fill=\"#ecdfa9\"/><circle cx=\"91\" cy=\"35\" r=\"3\" fill=\"#ecdfa9\"/>"],
    ["sunflower", "Sunflower Cubie", 800, "gold", "#bdcf8d", "Turns toward sunshine and good company.", "<g class=\"cubie-motion motion-sway\" style=\"transform-origin:60px 35px;\"><g transform=\"translate(21 -8) scale(.65)\"><ellipse cx=\"60\" cy=\"5\" rx=\"9\" ry=\"18\" transform=\"rotate(0 60 30)\" fill=\"#f4c75c\"/><ellipse cx=\"60\" cy=\"5\" rx=\"9\" ry=\"18\" transform=\"rotate(45 60 30)\" fill=\"#ffe297\"/><ellipse cx=\"60\" cy=\"5\" rx=\"9\" ry=\"18\" transform=\"rotate(90 60 30)\" fill=\"#f4c75c\"/><ellipse cx=\"60\" cy=\"5\" rx=\"9\" ry=\"18\" transform=\"rotate(135 60 30)\" fill=\"#ffe297\"/><ellipse cx=\"60\" cy=\"5\" rx=\"9\" ry=\"18\" transform=\"rotate(180 60 30)\" fill=\"#f4c75c\"/><ellipse cx=\"60\" cy=\"5\" rx=\"9\" ry=\"18\" transform=\"rotate(225 60 30)\" fill=\"#ffe297\"/><ellipse cx=\"60\" cy=\"5\" rx=\"9\" ry=\"18\" transform=\"rotate(270 60 30)\" fill=\"#f4c75c\"/><ellipse cx=\"60\" cy=\"5\" rx=\"9\" ry=\"18\" transform=\"rotate(315 60 30)\" fill=\"#ffe297\"/><circle cx=\"60\" cy=\"30\" r=\"13\" fill=\"#a47b4e\"/><circle cx=\"56\" cy=\"27\" r=\"3\" fill=\"#c8a168\"/></g></g><path d=\"M25 95q10-13 21 3m48-3q-10-13-21 3\" fill=\"#749b62\" /><path d=\"M33 102h54\" fill=\"none\" stroke=\"#e2e7ad\" stroke-width=\"3\" stroke-linecap=\"round\" />"],
    ["lantern", "Lantern Cubie", 825, "gold", "#e3a878", "Keeps a warm light on for you.", "<path d=\"M40 29V16q20-22 40 0v13\" fill=\"none\" stroke=\"#7c665d\" stroke-width=\"5\" stroke-linecap=\"round\" /><path d=\"M17 29h86v10H17Zm0 69h86v10H17Z\" fill=\"#795c55\" /><path d=\"M25 40v56m70-56v56\" fill=\"none\" stroke=\"#a17259\" stroke-width=\"4\" stroke-linecap=\"round\" /><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;\"><path d=\"M33 43v48m54-48v48\" fill=\"none\" stroke=\"#fff1b2\" stroke-width=\"4\" stroke-linecap=\"round\" /></g><path d=\"M55 108h10v15H55Z\" fill=\"#c4695a\" />"],
    ["aquarium", "Aquarium Cubie", 950, "crystal", "#88cbd7", "A pocket ocean with excellent neighbors.", "<path d=\"M23 94q15-8 30 0t44 0v12H23Z\" fill=\"#e7d2a6\" /><g class=\"cubie-motion motion-sway\" style=\"transform-origin:27px 99px;\"><path d=\"M27 99V82q-12-8-5-14m5 24q12-8 9-16\" fill=\"#599d84\" stroke=\"#599d84\" stroke-width=\"3\"/></g><g class=\"cubie-motion motion-steam\" style=\"transform-origin:60px 68px;\"><circle cx=\"89\" cy=\"83\" r=\"3\" fill=\"#d9fbf1\"/><circle cx=\"85\" cy=\"96\" r=\"2\" fill=\"#d9fbf1\"/><circle cx=\"90\" cy=\"39\" r=\"2\" fill=\"#d9fbf1\"/></g><path d=\"M27 46V36h17m40 1h9v8\" fill=\"none\" stroke=\"#e3fff5\" stroke-width=\"3\" stroke-linecap=\"round\" />"],
    ["geode", "Geode Cubie", 1050, "crystal", "#aa8cbb", "A quiet outside. A sparkling inner life.", "<path d=\"M25 42 36 29 58 36 83 28 96 45 89 94 69 107 36 99Z\" fill=\"#d9bce7\" /><path d=\"m25 42 21 3-10-16m60 16-24 2 11-19M36 99l15-12 18 20 20-13-17-8Z\" fill=\"#866aa6\" /><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;\"><path d=\"M30 49v35m61-32-4 35\" fill=\"none\" stroke=\"#f5dcff\" stroke-width=\"3\" stroke-linecap=\"round\" /></g><path d=\"m47 29 9-16 13 19Z\" fill=\"#f0dcfa\" />"],
    ["frost", "Frost Cubie", 1150, "crystal", "#b0dfed", "Cool under pressure. Warm at heart.", "<path d=\"M22 33h76l-8 13-7-10-10 12-9-13-12 11-8-11-11 9Z\" fill=\"#e8fbff\" /><path d=\"M24 99 36 86l5 20m39 0 5-20 12 13Z\" fill=\"#7fb8d3\" /><g class=\"cubie-motion motion-spin\" style=\"transform-origin:60px 16px;animation-duration:12s\"><path d=\"M60 4v24M50 10l20 12M70 10 50 22m10-18-4 5m4-5 4 5\" fill=\"none\" stroke=\"#e9fcff\" stroke-width=\"2\" stroke-linecap=\"round\" /></g><path d=\"M27 55v29m66-29v29\" fill=\"none\" stroke=\"#efffff\" stroke-width=\"2\" stroke-linecap=\"round\" />"],
    ["music_box", "Music Box Cubie", 1200, "crystal", "#b69cce", "Tiny songs for very big feelings.", "<path d=\"M23 31h74v10H23ZM23 96h74v11H23Z\" fill=\"#705c99\" /><path d=\"M29 35h62m-62 65h62\" fill=\"none\" stroke=\"#e5c790\" stroke-width=\"2\" stroke-linecap=\"round\" /><path d=\"M100 72h11v-8\" fill=\"none\" stroke=\"#d7b987\" stroke-width=\"4\" stroke-linecap=\"round\" /><circle cx=\"111\" cy=\"62\" r=\"4\" fill=\"#e6cfa4\"/><g class=\"cubie-motion motion-sway\" style=\"transform-origin:60px 27px;\"><path d=\"M50 27V9l25-5v17h-4V11l-17 4v12Z\" fill=\"#f3dba0\" /><circle cx=\"47\" cy=\"27\" r=\"5\" fill=\"#f3dba0\"/><circle cx=\"68\" cy=\"22\" r=\"5\" fill=\"#f3dba0\"/></g>"],
    ["phoenix", "Phoenix Cubie", 1450, "diamond", "#efa278", "Every setback comes with a new sunrise.", "<g class=\"cubie-motion motion-thrust\" style=\"transform-origin:60px 32px;animation-duration:2s\"><path d=\"M38 32 44 8l17 12L77 4l9 28Z\" fill=\"#ffd48a\" /><path d=\"m46 31 9-14 9 12 13-16-3 20Z\" fill=\"#ffe9ad\" /></g><path d=\"M30 99q30 13 60 0\" fill=\"none\" stroke=\"#ffe3a2\" stroke-width=\"4\" stroke-linecap=\"round\" />", {"back": "<g class=\"cubie-motion motion-wing\" style=\"transform-origin:60px 55px;animation-duration:2.5s\"><path d=\"M23 62Q-5 38 4 21l18 14-4-24 29 39M97 62q28-24 19-41l-18 14 4-24-29 39\" fill=\"#d97362\" /><path d=\"M12 35 29 53m79-18-17 18\" fill=\"none\" stroke=\"#ffd395\" stroke-width=\"4\" stroke-linecap=\"round\" /></g>"}],
    ["storm", "Storm Cubie", 1550, "diamond", "#8b9bbb", "Every cloud deserves a dramatic entrance.", "<path d=\"M16 36q-2-17 16-16 6-19 25-11 15-15 27 3 20-3 21 17l4 7Z\" fill=\"#c1c9e2\" /><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;\"><path d=\"m20 73-13 20h12l-5 18 20-26H22Zm82-28-12 20h12l-5 18 20-26h-12Z\" fill=\"#ffe09a\" /></g><path d=\"M30 100h59\" fill=\"none\" stroke=\"#c4d8f0\" stroke-width=\"3\" stroke-linecap=\"round\" />"],
    ["koi", "Koi Cubie", 1600, "diamond", "#efead6", "Swims upstream. Waves to everyone downstream.", "<path d=\"M25 35q15-13 28-4l-8 13-20 4Zm63-6 9 14-13 8-8-16ZM26 94l19-4 7 15H30Z\" fill=\"#e8936d\" /><path d=\"M24 38h10v7H24m53 50h16v9H77Z\" fill=\"#637c85\" /><path d=\"M28 101h32\" fill=\"none\" stroke=\"#fff8e8\" stroke-width=\"2\" stroke-linecap=\"round\" />", {"back": "<g class=\"cubie-motion motion-paddle\" style=\"transform-origin:60px 69px;\"><path d=\"M22 56Q-3 52 8 82l18-9M98 56q25-4 14 26l-18-9M48 105l-9 18 21-8 21 8-9-18Z\" fill=\"#f1bd9a\" stroke=\"#d38d70\" stroke-width=\"2\"/></g>"}],
    ["moon_rabbit", "Moon Rabbit Cubie", 1650, "diamond", "#dfd4ec", "Delivers wishes by moonlight.", "<g class=\"cubie-motion motion-sway\" style=\"transform-origin:36px 33px;\"><path d=\"M28 33Q12-7 29-3q16 4 16 36Z\" fill=\"#e9def2\" /><path d=\"M31 25Q23 3 29 5q7 5 8 20Z\" fill=\"#cca5ca\" /></g><g class=\"cubie-motion motion-sway\" style=\"transform-origin:84px 33px;animation-delay:-1.7s\"><path d=\"M76 33q0-40 17-36 17 7-1 36Z\" fill=\"#e9def2\" /><path d=\"M83 25q1-22 8-20 5 6-1 20Z\" fill=\"#cca5ca\" /></g><path d=\"M26 96q9-14 22 0m24 0q13-14 22 0\" fill=\"#c3acd8\" /><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;\"><circle cx=\"60\" cy=\"25\" r=\"6\" fill=\"#fff0bd\"/></g>"],
    ["kaleidoscope", "Kaleidoscope Cubie", 1900, "rainbow", "#c7b9dd", "Every turn reveals another little wonder.", "<g class=\"cubie-motion motion-spin\" style=\"transform-origin:60px 28px;animation-duration:14s\"><path d=\"M60 28 51 13 60 1 69 13Z\" fill=\"#ed9baf\" transform=\"rotate(0 60 28)\"/><path d=\"M60 28 51 13 60 1 69 13Z\" fill=\"#f3d887\" transform=\"rotate(60 60 28)\"/><path d=\"M60 28 51 13 60 1 69 13Z\" fill=\"#9fdab5\" transform=\"rotate(120 60 28)\"/><path d=\"M60 28 51 13 60 1 69 13Z\" fill=\"#91cfe4\" transform=\"rotate(180 60 28)\"/><path d=\"M60 28 51 13 60 1 69 13Z\" fill=\"#a5adeb\" transform=\"rotate(240 60 28)\"/><path d=\"M60 28 51 13 60 1 69 13Z\" fill=\"#c8a4df\" transform=\"rotate(300 60 28)\"/><circle cx=\"60\" cy=\"28\" r=\"5\" fill=\"#fff2d5\"/></g><g class=\"cubie-motion motion-color\" style=\"transform-origin:60px 68px;\"><path d=\"M24 93 42 88l18 12 18-12 18 5-18 13-18-6-18 6Z\" fill=\"#a2decb\" /><path d=\"M25 37h70\" fill=\"none\" stroke=\"#ffe7a6\" stroke-width=\"4\" stroke-linecap=\"round\" /></g>"],
    ["carnival", "Carnival Cubie", 2000, "rainbow", "#ecb0c1", "The parade starts whenever you smile.", "<path d=\"M16 38 60 1l44 37Z\" fill=\"#ef7f97\" /><path d=\"M60 1 36 38h17Zm0 0 7 37h17Z\" fill=\"#fbe5a4\" /><path d=\"M16 38h88v8H16Z\" fill=\"#a2cfd1\" /><path d=\"M29 97h62\" fill=\"none\" stroke=\"#f5e4b5\" stroke-width=\"5\" stroke-linecap=\"round\" /><g class=\"cubie-motion motion-sway\" style=\"transform-origin:60px 3px;\"><path d=\"M60 3V-8l20 6-20 5Z\" fill=\"#96d7c6\" /></g><circle cx=\"31\" cy=\"100\" r=\"3\" fill=\"#ca83b4\"/><circle cx=\"60\" cy=\"100\" r=\"3\" fill=\"#ca83b4\"/><circle cx=\"89\" cy=\"100\" r=\"3\" fill=\"#ca83b4\"/>"],
    ["solar_seraph", "Solar Seraph Cubie", 2400, "empyrorite", "#e8c98e", "Carries dawn beneath both wings.", "<g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;\"><ellipse cx=\"60\" cy=\"12\" rx=\"24\" ry=\"7\" fill=\"none\" stroke=\"#ffecac\" stroke-width=\"3\"/><path d=\"M26 45v43m68-43v43\" fill=\"none\" stroke=\"#fff5ce\" stroke-width=\"2\" stroke-linecap=\"round\" /></g><path d=\"M23 94 41 88l19 12 19-12 18 6-18 13-19-7-19 7Z\" fill=\"#f6e4bb\" />", {"back": "<g class=\"cubie-motion motion-wing\" style=\"transform-origin:60px 54px;animation-duration:3s\"><path d=\"M23 71Q-5 61 1 20l12 13 1-23 14 22 6-17 13 34M97 71q28-10 22-51l-12 13-1-23-14 22-6-17-13 34\" fill=\"#fff0ce\" stroke=\"#d8b576\" stroke-width=\"2\"/><path d=\"M12 40 27 61m81-21L93 61\" fill=\"none\" stroke=\"#e6c383\" stroke-width=\"2\" stroke-linecap=\"round\" /></g>"}],
    ["star_cartographer", "Star Cartographer Cubie", 2800, "empyrorite", "#637d9b", "Maps every star. Leaves room for new wishes.", "<path d=\"M23 34h74v68H23Z\" fill=\"#405b7a\" /><path d=\"M29 40 45 35l17 8 23-6 7 9M28 92l18 7 22-9 23 10\" fill=\"none\" stroke=\"#86bbcd\" stroke-width=\"1.5\" stroke-linecap=\"round\" /><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-0.0s\"><circle cx=\"29\" cy=\"40\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-0.7s\"><circle cx=\"45\" cy=\"35\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-1.4s\"><circle cx=\"62\" cy=\"43\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-2.0999999999999996s\"><circle cx=\"85\" cy=\"37\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-2.8s\"><circle cx=\"28\" cy=\"92\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-3.5s\"><circle cx=\"46\" cy=\"99\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-4.199999999999999s\"><circle cx=\"68\" cy=\"90\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-4.8999999999999995s\"><circle cx=\"91\" cy=\"100\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-spin\" style=\"transform-origin:60px 15px;animation-duration:18s\"><path d=\"m60-1 4 12 13 4-13 4-4 12-4-12-13-4 13-4Z\" fill=\"#ffe5a3\" /></g><path d=\"M21 33v70m78-70v70\" fill=\"none\" stroke=\"#c7daea\" stroke-width=\"2\" stroke-linecap=\"round\" />", {"faceColor": "#e7f4f1"}],
  ];
  for (const [id, name, price, tier, color, flavor, detail, layers = {}] of shopCustoms)
    add(`shop_${id}`, name, null, color, detail, square, { price, tier, flavor, ...layers });
  const unlocked = (item, medals, owned = []) => item.id === "classic" || (item.price
    ? owned.includes(item.id) : item.achievements.some(id => !!medals[id]));
  function selected(id, medals, owned = []) {
    const item = catalog.find(item => item.id === id);
    return item && unlocked(item, medals, owned) ? item : catalog[0];
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
  function animatedArt(item, uid) {
    const id = name => `${name}-${uid}`;
    const url = name => `url(#${id(name)})`;
    const clip = `<clipPath id="${id('body')}">${item.body}</clipPath>`;
    const sparkle = (x, y, delay, size = 4) => `<g transform="translate(${x} ${y})"><path class="custom-sparkle" style="animation-delay:${delay}s" d="M0 -${size} 1.3 -1.3 ${size} 0 1.3 1.3 0 ${size} -1.3 1.3 -${size} 0 -1.3 -1.3Z" fill="#f5ffed"/></g>`;
    // Animate independent accessories in their own coordinates. Body and face
    // geometry remains shared with Classic Cubie, including in tiny previews.
    const motion = (art, name, origin = '60px 68px', extra = '') =>
      `<g class="cubie-motion ${name}" style="transform-origin:${origin};${extra}">${art}</g>`;
    // Front and rear draw the SAME closed path at the SAME phase. Only the
    // front half is clipped; Cubie's body naturally occludes the rear layer.
    const orbit = (name, path, cy, color, width, angle = 0, upperFront = false, duration = 4.8) => {
      const ring = `<path d="${path}" fill="none" stroke="${color}" stroke-width="${width}"/>` +
        `<path class="cubie-motion cubie-ring-particles" style="animation-duration:${duration}s" d="${path}" pathLength="100" fill="none" stroke="#fff7d9" stroke-width="3" stroke-linecap="round"/>`;
      const group = half => `<g class="cubie-orbit-layer" data-orbit="${name}" data-half="${half}" transform="rotate(${angle} 60 ${cy})">` +
        (half === 'front' ? `<g clip-path="${url(name)}">${ring}</g>` : ring) + '</g>';
      return {
        back: group('back'),
        front: `<defs><clipPath id="${id(name)}"><rect x="-20" y="${upperFront ? -50 : cy}" width="160" height="${upperFront ? cy + 50 : 180}"/></clipPath></defs>` + group('front'),
      };
    };
    if (item.id === 'attack_pumpkin_rotating_rings') {
      const blue = orbit('blue-ring', 'M8 40Q60 1 112 40Q60 79 8 40Z', 40, '#70d8f4', 5, 0, true, 5.4);
      const orange = orbit('orange-ring', 'M8 78Q60 123 112 78Q60 33 8 78Z', 78, '#ffb262', 5);
      return { back: blue.back + orange.back, detail: blue.front + orange.front + '<path d="m60 10 9 12-9 12-9-12Z" fill="#ffe4a0"/>' };
    }
    if (item.id === 'attack_core_accretion_sweep') {
      const ring = orbit('accretion-ring', 'M115 70A55 24 0 1 1 5 70A55 24 0 1 1 115 70Z', 70, '#f4ba8e', 6, -15);
      return { back: ring.back, detail: ring.front + '<path d="M20 39Q60 4 100 39" fill="none" stroke="#dfe5ff" stroke-width="4"/><path d="m60 8 6 11-6 11-6-11Z" fill="#ffdfa5"/>' };
    }
    if (item.id === 'vortex') {
      const ring = orbit('gravity-ring', 'M118 88A58 14 0 1 1 2 88A58 14 0 1 1 118 88Z', 88, '#ffb56d', 8, -12);
      return { back: ring.back, detail: '<circle cx="60" cy="67" r="39" fill="none" stroke="#8065bd" stroke-width="2"/><path d="M27 48a37 37 0 0 1 63-8" fill="none" stroke="#d5c4ff" stroke-width="2" stroke-linecap="round"/>' + ring.front };
    }
    if (item.id === 'attack_pumpkin_haunted_quadrants') {
      const ghosts = [31, 90].map((x, i) => motion(
        `<path d="M${x-9} 32V17q0-10 9-10t9 10v15l-5-4-4 4-4-4Z" fill="#eee1ff"/><path d="M${x-4} 17h3v4h-3m6-4h3v4h-3" fill="#584772"/>`,
        'motion-hover', `${x}px 24px`, `animation-delay:${-i*1.6}s`)).join('');
      return { detail: ghosts + '<path d="M25 92h17v12H25M60 92h17v12H60" fill="#78639b"/><path d="M42 92h18v12H42M77 92h18v12H77" fill="#e4d3fa"/>' };
    }
    if (item.id === 'attack_core_target_lock') return { detail:
      '<path class="cubie-motion motion-energy" d="M30 42V31h14M76 31h14v11M30 92v10h14M76 102h14V92" fill="none" stroke="#b75a63" stroke-width="4"/>' +
      motion('<g fill="none" stroke="#b75a63" stroke-width="4"><circle cx="60" cy="14" r="10"/><path d="M60 0v9M60 19v9M46 14h9M65 14h9"/></g>', 'motion-spin', '60px 14px', 'animation-duration:10s') +
      '<circle cx="60" cy="14" r="3" fill="#fff0af"/>' };
    if (item.id === 'attack_core_binary_stars') return { detail:
      '<path d="M24 94Q60 112 96 94" fill="none" stroke="#e7efff" stroke-width="4"/>' +
      '<g transform="translate(60 17)">' + ['#ffdc89', '#a2f3ff'].map((color, i) =>
        motion(`<path d="m0-12 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" fill="${color}"/>`, 'motion-binary', '0px 0px', `animation-delay:${-i*3}s`)).join('') + '</g>' };
    if (item.id === 'attack_core_gravity_guillotine') return { detail:
      '<path d="M12 28h13v78H12M95 28h13v78H95" fill="#677a94"/>' +
      motion('<path d="M25 18h70v15L25 48Z" fill="#e6f3ff"/><path d="m25 48 70-15v5L25 53Z" fill="#83a9c7"/><circle cx="60" cy="27" r="4" fill="#819bb7"/>', 'motion-blade') +
      '<path d="M31 102h58" stroke="#6f829d" stroke-width="4"/>' };
    if (item.id === 'attack_core_photon_rain') return { detail:
      '<path d="M14 29Q60-16 106 29q-12-10-23 0-12-10-23 0-12-10-23 0-12-10-23 0Z" fill="#6a8ebf"/><path d="M60 7v22M35 27q6-16 25-20 19 4 25 20" fill="none" stroke="#a3e8ff" stroke-width="2"/>' +
      [[8,48],[110,69],[33,92]].map(([x,y], i) => `<g transform="translate(${x} ${y})">` + motion('<path d="m0-5 4 9-4 4-4-4Z" fill="#e5faff"/>', 'motion-rain', '0px 0px', `animation-delay:${-i*.7}s`) + '</g>').join('') };
    if (item.id === 'attack_core_crossfire_engine') return { detail: item.detail, back: motion(item.back, 'motion-energy') };
    if (item.id === 'attack_core_orbital_saws') return { detail: item.detail, back: motion(item.back, 'motion-spin', '60px 68px', 'animation-duration:8s') };
    if (item.id === 'attack_core_echo_protocol') return { detail: item.detail, back:
      motion('<rect x="7" y="10" width="80" height="80" rx="14" fill="#406c82"/>', 'motion-echo') +
      motion('<rect x="13" y="19" width="80" height="80" rx="14" fill="#6aa0b6"/>', 'motion-echo', '60px 68px', 'animation-delay:-1.4s') };
    if (item.id === 'shop_clockwork') {
      const gear = (x,y,reverse) => `<g transform="translate(${x} ${y})">` +
        motion('<circle r="11" fill="none" stroke="#ead2a0" stroke-width="3"/>' +
          Array.from({length:8},(_,i)=>`<path d="M0-8V-15" transform="rotate(${i*45})" stroke="#ead2a0" stroke-width="3"/>`).join('') +
          '<path d="M0-8V8M-8 0H8" stroke="#ead2a0" stroke-width="2"/>', 'motion-spin', '0px 0px', `animation-duration:12s;animation-direction:${reverse?'reverse':'normal'}`) + '</g>';
      return { detail: gear(29,40,false) + gear(91,96,true) +
        '<circle cx="60" cy="24" r="13" fill="#eee4c8" stroke="#765e4c" stroke-width="3"/>' +
        motion('<path d="M60 24V15" stroke="#5d493d" stroke-width="2"/>', 'motion-clock', '60px 24px') +
        motion('<path d="M60 24h6" stroke="#5d493d" stroke-width="2"/>', 'motion-spin', '60px 24px', 'animation-duration:144s') +
        '<circle cx="60" cy="24" r="1.7" fill="#5d493d"/>' };
    }
    if (item.id === 'shop_jellyfish') return { detail:
      motion('<path d="M20 43q40-45 80 0" fill="#ecd0fa"/><circle cx="40" cy="33" r="3" fill="#fff4ff"/>', 'motion-bell', '60px 43px') +
      [28,47,72,90].map((x,i)=>motion(`<path d="M${x} 104q${i%2?9:-9} 14 1 24" fill="none" stroke="#ba97e8" stroke-width="5" stroke-linecap="round"/>`, 'motion-tentacle', `${x}px 104px`, `animation-delay:${-i*.6}s`)).join('') };
    if (['wizard', 'moon', 'star', 'attack_core_lens_fracture'].includes(item.id))
      return { detail: item.detail + sparkle(26,35,-.3,3) + sparkle(94,24,-1.5) + sparkle(89,96,-2.1,3) };
    if (['pharaoh', 'diamond', 'champion', 'crown', 'medal_bronze', 'medal_silver', 'medal_gold', 'medal_crystal', 'medal_diamond', 'attack_pumpkin_royal_slams', 'shop_blue_mint'].includes(item.id))
      return { detail: item.detail + `<defs>${clip}<linearGradient id="${id('polish')}"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff8db" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><g clip-path="${url('body')}">` +
        motion(`<path d="M-45 18h20l65 110H20Z" fill="${url('polish')}"/>`, 'motion-polish') + '</g>' };
    if (['rainbow', 'shop_prism_pop'].includes(item.id)) return { detail: motion(item.detail, 'motion-color') };
    if (item.id === 'shop_cosmic_whale') {
      const stars = Array.from({ length: 26 }, (_, i) => `<circle class="custom-sparkle" style="animation-delay:${-i*.23}s;animation-duration:${2.5+i%4*.4}s" cx="${24 + (i * 29 % 72)}" cy="${32 + (i * 17 % 69)}" r="${i % 3 ? .65 : 1.2}" fill="${i % 2 ? '#b1ecff' : '#ffd9ff'}"/>`).join('');
      return { faceColor: '#f0f6ff', back: `<g class="whale-tail"><path d="M85 40Q116 20 108 1q-16 2-17 18Q83 2 70 7q-3 20 15 33Z" fill="#454b9d" stroke="#9eafff" stroke-width="1.3"/><path d="M85 35q11-14 21-29M85 35q5-16-12-25" fill="none" stroke="#c5bcff" opacity=".65"/></g>` +
        `<g class="whale-fin whale-fin-left"><path d="M24 75Q-7 69 1 92q6 12 26 4Z" fill="#6379cb" stroke="#b9cbff" stroke-width="1.3"/><path d="M5 88q11 6 20-4" fill="none" stroke="#91dff2"/></g><g class="whale-fin whale-fin-right"><path d="M96 75q31-6 23 17-6 12-26 4Z" fill="#6379cb" stroke="#b9cbff" stroke-width="1.3"/></g>`,
        detail: `<defs>${clip}<linearGradient id="${id('ocean')}" x2=".8" y2="1"><stop stop-color="#202d69"/><stop offset=".48" stop-color="#454284"/><stop offset="1" stop-color="#101d45"/></linearGradient><radialGradient id="${id('nebula')}"><stop stop-color="#ffe7fa"/><stop offset=".15" stop-color="#aaaaff"/><stop offset=".5" stop-color="#895ac8" stop-opacity=".7"/><stop offset="1" stop-color="#3356b0" stop-opacity="0"/></radialGradient></defs>` +
          `<g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('ocean')}"/><g class="whale-galaxy"><ellipse cx="60" cy="67" rx="53" ry="22" fill="${url('nebula')}" transform="rotate(-30 60 67)"/><g fill="none" stroke-linecap="round"><path d="M19 78C20 40 93 32 91 66S24 95 38 68 86 50 78 68 52 81 54 68" stroke="#a4b9ff" stroke-width="2" opacity=".55"/><path d="M25 83C35 107 102 70 88 50S33 46 34 69" stroke="#f4a7ef" stroke-width="1.4" opacity=".6"/></g>${stars}</g><path d="M20 93q40 15 80 0v20H20Z" fill="#96c6ee" opacity=".38"/><path d="M30 100q30 7 60 0" fill="none" stroke="#c8e7fa" stroke-width="1.5"/><rect x="22" y="30" width="76" height="76" rx="12" fill="none" stroke="#b6d7ff" stroke-opacity=".55"/></g>` +
          `<g class="whale-spout" fill="none" stroke-linecap="round"><path d="M55 28Q54 12 41 12m14 16Q63 8 77 13m-22 15 4-21" stroke="#87dcf4" stroke-width="2"/><circle cx="59" cy="4" r="2" fill="#e0faff" stroke="none"/></g>` + sparkle(29, 40, 0) + sparkle(89, 83, -1.2) + sparkle(75, 34, -2.1, 3) + sparkle(39, 93, -.7, 3) };
    }
    if (item.id === 'medal_empyrorite') {
      const shards = [[10,40,-.8],[111,43,-1.5],[8,88,-2.3],[112,91,-.2],[60,10,-1.1]].map(([x,y,d]) => `<g transform="translate(${x} ${y})"><g class="empyrorite-shard" style="animation-delay:${d}s"><path d="m0-10 6 10-6 10-6-10Z" fill="#31d7a3" stroke="#b8ffe0"/><path d="M0-10V10L6 0Z" fill="#d4ffec" opacity=".7"/></g></g>`).join('');
      return { back: `<g class="empyrorite-halo" fill="none" stroke="#72fbd3"><circle cx="60" cy="68" r="56" stroke-opacity=".22"/><circle cx="60" cy="68" r="51" stroke-dasharray="30 8 3 8" stroke-width="1.4"/><path d="M60 9 111 38v60l-51 29L9 98V38Z" stroke-opacity=".4"/></g>${shards}`,
        detail: `<defs>${clip}<linearGradient id="${id('emerald')}" x2="1" y2="1"><stop stop-color="#91ffe1"/><stop offset=".35" stop-color="#128879"/><stop offset=".65" stop-color="#24c69b"/><stop offset="1" stop-color="#064d58"/></linearGradient><linearGradient id="${id('shine')}"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#e9fff4" stop-opacity=".65"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>` +
        `<g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('emerald')}"/><path d="M20 28 41 45 60 28 80 45 100 28 89 70 100 108 75 91 60 108 43 91 20 108 31 70Z" fill="#c3ffe6" opacity=".5"/><path d="m20 28 21 17-10 25-11 38M100 28 80 45l9 25 11 38M20 108l23-17 17 17 15-17 25 17" fill="none" stroke="#ebfff3" stroke-width="1.2"/><path d="M41 45h39l9 25-14 21H43L31 70Z" fill="#117967" opacity=".4"/><g class="empyrorite-sheen"><path d="M-45 18h22l65 110H20Z" fill="${url('shine')}"/></g></g><rect x="21" y="29" width="78" height="78" rx="13" fill="none" stroke="#ceffe5" stroke-width="1.4"/>` + sparkle(30,40,-1) + sparkle(86,94,-2) + sparkle(82,35,-.3,3) };
    }
    if (item.id === 'samurai') {
      return { back: `<g class="sovereign-banner"><path d="M15 36 2 18v68l14-8Z" fill="#2b716b" stroke="#e2be6f"/><path d="M105 36 118 18v68l-14-8Z" fill="#2b716b" stroke="#e2be6f"/><path d="M7 32v37m106-37v37" stroke="#6ff3c0" stroke-dasharray="5 4"/></g><g class="sovereign-aura" fill="none" stroke="#f7d27c"><circle cx="60" cy="65" r="55" stroke-dasharray="3 12"/><path d="m0 80 5-9m111 9 5-9m-8-38 5-9M6 30l4-9"/></g>`,
        detail: `<defs>${clip}<linearGradient id="${id('armor')}" x2="1" y2="1"><stop stop-color="#426d68"/><stop offset=".5" stop-color="#172d39"/><stop offset="1" stop-color="#426060"/></linearGradient><linearGradient id="${id('gold')}" x2=".7" y2="1"><stop stop-color="#fff2bc"/><stop offset=".4" stop-color="#d4a54f"/><stop offset=".7" stop-color="#ffe3a0"/><stop offset="1" stop-color="#997035"/></linearGradient></defs><g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('armor')}"/><path d="M20 88h80v20H20Z" fill="#274f50"/><path d="M21 91h78M21 98h78M21 105h78" stroke="#d8be7b" stroke-width="2"/><path d="M36 89v18m24-18v18m24-18v18" stroke="#6be6bb" stroke-width="1.5"/></g><path d="M15 46Q18 13 60 14t45 32l-15-5H30Z" fill="${url('armor')}" stroke="#f2d28b" stroke-width="2"/><path d="M19 34q-17-3-12-24 13 17 36 10m58 14q17-3 12-24-13 17-36 10" fill="${url('gold')}" stroke="#ffeab4" stroke-width="1.3"/><path d="m60 4 10 17-10 18-10-18Z" fill="${url('gold')}"/><path d="m60 12 4 9-4 9-4-9Z" fill="#74ffd0"/><path d="M12 75 26 70v27H9Zm96 0-14-5v27h17Z" fill="${url('armor')}" stroke="#ddc080" stroke-width="1.5"/><path d="M11 82h14M10 89h15m70-7h14m-14 7h15" stroke="#8cf9cf"/>` + sparkle(60,21,-.5,3) + sparkle(19,39,-1.8,3), faceColor: '#dcf8dc' };
    }
    if (item.id === 'shop_peacock') {
      const feathers = [-66,-44,-22,0,22,44,66].map((angle,i) => `<g transform="rotate(${angle} 60 93)"><path d="M60 92Q42 43 50 9q10-14 20 0 8 34-10 83Z" fill="${i%2 ? '#246e7c' : '#235b7e'}" stroke="#88d9c3" stroke-width="1"/><path d="M60 91V21" stroke="#a5d5a0" stroke-width="1.2"/><ellipse cx="60" cy="18" rx="7" ry="11" fill="#d8ce7c"/><ellipse cx="60" cy="18" rx="5" ry="8" fill="#55c2aa"/><ellipse cx="60" cy="18" rx="3" ry="5" fill="#224776"/><circle cx="59" cy="16" r="1.3" fill="#baf1e2"/></g>`).join('');
      return { back: `<g class="peacock-fan">${feathers}</g>`, detail: '<path d="M23 96q37 13 74 0" fill="none" stroke="#b5edd1" stroke-width="2"/><path d="M27 33h66" stroke="#9ae0d0" stroke-width="2"/>' };
    }
    if (item.id === 'shop_snowglobe') {
      const snow = Array.from({length:18},(_,i)=>`<circle class="globe-snow" style="animation-delay:${-i*.37}s;animation-duration:${3+i%4}s" cx="${25+i*23%70}" cy="${30+i*11%60}" r="${.8+i%3*.4}" fill="#fff"/>`).join('');
      return { detail: `<defs>${clip}<linearGradient id="${id('glass')}" x2="1" y2="1"><stop stop-color="#effaff" stop-opacity=".7"/><stop offset=".45" stop-color="#7ab6da" stop-opacity=".15"/><stop offset="1" stop-color="#4f80b0" stop-opacity=".6"/></linearGradient></defs><g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('glass')}"/>${snow}<path d="M20 98q14-10 30-2t50-1v15H20Z" fill="#f0fbff"/></g><path d="M28 53V43q0-9 12-9m43 0 8 5" fill="none" stroke="#f3feff" stroke-width="3" stroke-linecap="round"/><path d="M16 105h88v10q-44 10-88 0Z" fill="#574777" stroke="#c3b3e0" stroke-width="1.5"/><ellipse cx="60" cy="105" rx="44" ry="5" fill="#9a88bd" stroke="#d3c9ee"/><path d="M24 114q36 6 72 0" fill="none" stroke="#c4acd9" stroke-width="1.5"/>` };
    }
    if (item.id === 'shop_aurora') return {detail:`<g class="custom-aurora">${item.detail}</g>`};
    if (item.id === 'shop_disco') return {detail:item.detail + sparkle(30,38,-.8) + sparkle(86,91,-1.9) + sparkle(80,45,-.2,3)};
    return null;
  }
  function twinkleOrnaments(detail) {
    const sparkleStarts = [
      "M60 10l2.2", // Wizard's hat star.
      "m86 10 3 7", // Moon companion star.
      "m96 12 3 8", // Starlight companion sparkle.
      "m13 12 3 9", "m104 91 3 8", // Golden Cubie's two glints.
      "m102 14 2 7", // Silver medal sparkle.
      "m105 13 2 7", // Diamond medal sparkle.
      "m13 10 3 8", // Rainbow medal sparkle.
      "m12 15 3 7", // Disco's original sparkle.
    ];
    let index = 0;
    return detail.replace(/<path\b[^>]*>/g, tag => {
      const path = tag.match(/\bd="([^"]+)"/)?.[1];
      if (!path || !sparkleStarts.some(start => path.startsWith(start))) return tag;
      return tag.replace("<path", `<path class="custom-sparkle" style="animation-delay:${-(index++ * .9 + .4)}s"`);
    });
  }
  function svg(item) {
    const enhanced = animatedArt(item, ++artId);
    let detail = enhanced?.detail || item.detail;
    const back = enhanced?.back ?? item.back ?? "";
    const faceColor = enhanced?.faceColor || item.faceColor || "#17251a";
    if (item.id === 'medal_rainbow') {
      const clipId = `rainbow-body-${++artId}`;
      const colors = ['#ffd781', '#c6ee91', '#8ce0dd', '#99b9ef', '#b8a1e9', '#f3a7cd'];
      const stripes = Array.from({ length: 36 }, (_, i) =>
        `<rect x="${(i - 18) * 18}" y="-240" width="18.1" height="480" fill="${colors[i % colors.length]}"/>`).join('');
      detail = `<defs><clipPath id="${clipId}">${item.body}</clipPath></defs>` +
        `<g clip-path="url(#${clipId})"><g transform="rotate(45 60 68)"><g class="cubie-rainbow-stripes">${stripes}</g></g></g>` +
        '<path d="m13 10 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#fff1be"/>';
    }
    detail = twinkleOrnaments(detail);
    const [x, y, width, height] = bodyBounds[item.id] || [20, 28, 80, 80];
    const fit = `scale(${145 / width} ${145 / height}) translate(${-x} ${-y})`;
    const silhouette = (color, offset, className) =>
      `<g class="${className}" fill="${color}" transform="translate(${offset} ${offset})"><g transform="${fit}">${item.body}</g></g>`;
    return `<svg class="cubie-custom-art${item.id === 'medal_empyrorite' ? ' cubie-empyrorite' : ''}" data-custom="${item.id}" viewBox="0 0 145 145" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">` +
      '<g class="cubie-float">' +
      `<g class="cubie-back" transform="${fit}" stroke-linejoin="round">${back}</g>` +
      silhouette('#202b22', 25, 'cubie-shadow') +
      silhouette(item.id === 'classic' ? '#6d8b44' : sideColor(item.color), 13, 'cubie-side') +
      `<g class="cubie-underbody" transform="${fit}" stroke-linejoin="round">${item.underBody || ''}</g>` +
      silhouette(item.color, 0, 'cubie-front') +
      `<g class="cubie-trim" transform="${fit}" stroke-linejoin="round">${detail}</g>` +
      `<g fill="${faceColor}" class="cubie-eyes"><rect x="35" y="48" width="17" height="26"/><rect x="93" y="48" width="17" height="26"/></g>` +
      `<path class="cubie-smile" d="M52 90h9v7h23v-7h9v14H52Z" fill="${faceColor}"/>` +
      '</g></svg>';
  }
  return { catalog, tierLabels, unlocked, selected, svg };
})();
if (typeof module !== "undefined") module.exports = CubieCustoms;
