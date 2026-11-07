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
    santa: "Checking the list twice. Everyone gets a little joy.",
    gaster: "Probably nothing.",
    medal_bronze: "Twenty small victories. One very proud little square.",
    medal_silver: "Fifteen silver linings, polished into one outfit.",
    medal_gold: "Ten golden moments. Please keep fingerprints to a minimum.",
    medal_crystal: "Five bright memories, caught inside a crystal.",
    medal_diamond: "Three impossible-looking victories. One unbreakable grin.",
    medal_rainbow: "Two rainbows walked into a closet. Cubie walked out.",
    medal_empyrorite: "One legendary achievement. An emerald glow that never forgets.",
    classic: "The original little square with a very big heart.",
    trooper: "A few scuffs. Still ready for one more try.",
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
    ton_618: "No hits. Just an unreasonable amount of gravity.",
    phantom_king: "Not a scratch. Not a quiet moment in the afterlife.",
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
  add("party", "Party Cubie", "website_10_hours", "#7555b5",
    '<path d="M35 31 60-14 85 31Z" fill="#ed8dce"/>', square,
    { faceColor: "#fff5cf", flavor: "Ten hours together. Every moment deserves confetti." });
  add("choo_choo", "Choo Choo Cubie", "website_5_hours", "#408bc0",
    '<path d="M21 34h78v12H21Z" fill="#173f66"/><path d="M25 43h70v47H25Z" fill="#78c7e0" stroke="#e7b85c" stroke-width="2"/>' +
    '<path d="M22 94h76v13H22Z" fill="#ce4758"/><path d="M14 107h92l10 13H4Z" fill="#324c69" stroke="#a5bed2" stroke-width="2"/>' +
    '<path d="M22 110 16 118m23-8-3 8m24-8v8m21-8 3 8m14-8 6 8" stroke="#d5e7ee" stroke-width="2"/>' +
    ['#ff617c','#ffac45','#ffdf5c','#7ee2a5','#66cfff','#b894ff'].map((color,i) => `<rect x="${24+i*12}" y="96" width="12" height="5" fill="${color}"/>`).join('') +
    [25,95].map(x => `<g transform="translate(${x} 110)"><g class="choo-wheel"><circle r="10" fill="#1e334c" stroke="#f3c35f" stroke-width="2.5"/><path d="M-7 0H7M0-7V7m-5-5 10 10m0-10L-5 5" stroke="#aacbdf" stroke-width="1.5"/><circle r="3" fill="#f2ba51"/></g></g>`).join(''), square, {
      flavor: "Five hours of adventures. Next stop: another smile!", faceColor: "#17374b",
      back: '<path d="M22 32V12h21v20M18 10h29v8H18Z" fill="#263f5b" stroke="#f3c35f" stroke-width="2"/><path d="M69 29V17h21v12" fill="#dc5866"/><path d="M14 28h92l-7-9H21Z" fill="#db5364" stroke="#ffb28f" stroke-width="1.5"/>' +
        [0,1,2].map(i => `<circle class="choo-steam" style="animation-delay:${-i*.8}s" cx="33" cy="7" r="${5+i*2}" fill="#e4f6ff"/>`).join(''),
    });
  add("three_d", "3D Cubie", "cube_pet_500", "#c6f783",
    '<path d="M60 20 104 45v50l-44 25-44-25V45Z" fill="#c6f783"/>', square,
    { flavor: "Five hundred clicks opened up a whole new dimension." });
  add("chocolate", "Chocolate Cubie", "healing_20", "#64351f",
    '<rect x="23" y="31" width="74" height="74" rx="7" fill="#442518"/>' +
    Array.from({length:9}, (_, i) => {
      const x = 26 + i%3*23, y = 34 + Math.floor(i/3)*23;
      return `<rect x="${x}" y="${y}" width="20" height="20" rx="2" fill="${i%2 ? '#875034' : '#79442c'}"/><path d="M${x+2} ${y+17}v-15h15" fill="none" stroke="#b87a51" stroke-width="1.3"/><path d="M${x+4} ${y+18}h14v-14" fill="none" stroke="#542a1a" stroke-width="1.5"/>`;
    }).join('') +
    '<path d="M19 88 31 94 43 88 56 96 69 91 82 98 101 87v22H19Z" fill="#bbc9d9" stroke="#eff6ff" stroke-width="1"/><path d="m22 90 9 14 12-14 13 17 13-14 13 15 16-17" fill="none" stroke="#8397ae" stroke-width="1.2"/><path d="M18 101q42 9 84 0v14H18Z" fill="#9e4661"/><path d="M24 109h72" stroke="#e8a8b3" stroke-width="1.4"/>',
    '<path d="M27 28H70Q67 39 79 39Q75 51 88 50Q87 61 100 59V101Q100 108 93 108H27Q20 108 20 101V35Q20 28 27 28Z"/>',
    { faceColor: "#fff0cc", flavor: "Twenty little pick-me-ups. One very sweet smile." });
  add("satellite", "Satellite Cubie", "play_singularity", "#bac7d8",
    '<rect x="26" y="34" width="68" height="68" rx="9" fill="#d6e0ea" stroke="#71859e" stroke-width="1.5"/><path d="M32 39h56M31 96h58" stroke="#f5fbff" stroke-width="2"/>' +
    '<g class="cubie-motion motion-sway" style="transform-origin:60px 28px"><path d="M60 29V10l12-7" fill="none" stroke="#92a9c2" stroke-width="3"/><circle cx="73" cy="3" r="4" fill="#86e6ff" stroke="#e0faff" stroke-width="1.2"/><path d="M48 15q12 12 24 0" fill="#8da1bb" stroke="#e4efff" stroke-width="1.5"/></g>' +
    '<g fill="#71859e"><circle cx="31" cy="39" r="1.5"/><circle cx="89" cy="39" r="1.5"/><circle cx="31" cy="96" r="1.5"/><circle cx="89" cy="96" r="1.5"/></g>', square, {
      flavor: "A tiny signal from a very friendly corner of space.",
      back: '<path d="M-8 65h136" stroke="#71859e" stroke-width="5"/>' +
        [-1, 1].map(side => `<g transform="translate(${side < 0 ? -16 : 106} 40)"><g class="cubie-motion motion-sway" style="transform-origin:15px 25px;animation-delay:${side < 0 ? '-.8' : '-2'}s"><rect width="30" height="50" rx="2" fill="#204777" stroke="#a6c7eb" stroke-width="2"/><path d="M10 1v48M20 1v48M1 10h28M1 20h28M1 30h28M1 40h28" stroke="#60b6ee" stroke-width="1"/><path d="M3 3h24" stroke="#d1f2ff" stroke-width="1.5"/></g></g>`).join(''),
    });
  add("trooper", "Trooper Cubie", "dodge_early_death", "#a9cbb9",
    '<path d="M29 36h20M27 40h11" fill="none" stroke="#d5efe0" stroke-width="3" stroke-linecap="round"/>' +
    '<g transform="rotate(-14 75 39)"><rect x="58" y="32" width="34" height="14" rx="5" fill="#8b6446" opacity=".25" transform="translate(0 2)"/><rect x="58" y="32" width="34" height="14" rx="5" fill="#edc69f" stroke="#b4815a" stroke-width="1.2"/><rect x="69" y="34" width="12" height="10" rx="2" fill="#ffe2bf"/><path d="M71 36h8m-8 3h8m-8 3h8" stroke="#e6bb90" stroke-width=".9"/><g fill="#b4815a"><circle cx="62" cy="37" r=".8"/><circle cx="65" cy="41" r=".8"/><circle cx="85" cy="37" r=".8"/><circle cx="88" cy="41" r=".8"/></g></g>' +
    '<path d="m27 78 7-3m-7 9 10-4M87 60l5-3" fill="none" stroke="#75998b" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M28 94h17v10H32q-4-2-4-10Z" fill="#799d91"/><path d="M30 97h12m-10 4h9" stroke="#c9e2d5" stroke-width="1.3" stroke-dasharray="2 2"/>' +
    '<path d="m77 93-3 15 8-4 6 4-1-15Z" fill="#9c6e51"/><path d="m78 95-1 9 5-3 4 3-1-9Z" fill="#e4b58d"/>' +
    '<circle cx="82" cy="90" r="9" fill="#8c5d40"/><circle cx="82" cy="89" r="8" fill="#c59167" stroke="#f4d2ae" stroke-width="1.5"/>' +
    '<path d="m82 83 1.6 3.5 3.9.4-2.9 2.6.8 3.8-3.4-1.9-3.4 1.9.8-3.8-2.9-2.6 3.9-.4Z" fill="#ffe1aa"/>');
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
    '<path d="M60 32v74" fill="none" stroke="#a87952" stroke-width="2"/>' +
    '<path d="M15 29v73q24-8 45 4 21-12 45-4V29" fill="none" stroke="#a87952" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M79 28v24l-6-5-6 5V28" fill="#e77f89"/>',
    '<path d="M15 29q24-10 45 3 21-13 45-3v73q-24-8-45 4-21-12-45-4z"/>');
  add("wizard", "Word Wizard", "hangman_5", "#c6b2f5",
    '<path d="M28 31L60 1l32 30Z" fill="#7c5bb8"/><path d="M16 31h88" stroke="#b29be6" stroke-width="8"/><path d="M60 10l2.2 5.5 5.8.5-4.5 3.7 1.5 5.8-5-3.2-5 3.2 1.5-5.8L52 16l5.8-.5Z" fill="#fff1a8"/>');
  add("detective", "Clue Cubie", "hangman_hard", "#d5b88b",
    '<path d="M33 30V17h52v13M20 31h80" fill="#856948" stroke="#856948" stroke-width="8"/>' +
    '<path d="M20 86 38 84 50 89h20l12-5 18 2v8q0 14-14 14H34q-14 0-14-14Z" fill="#887052"/>' +
    '<path d="M48 88h24l-12 17Z" fill="#f6e4bc"/><path d="m57 92 3-3 3 3-2 4 3 9-4 3-4-3 3-9Z" fill="#493b34"/>' +
    '<path d="m38 84 14 5 8 19-19-13 4-3-9-3ZM82 84l-14 5-8 19 19-13-4-3 9-3Z" fill="#b99a72" stroke="#6c563e" stroke-width="1" stroke-linejoin="round"/>' +
    '<path d="M27 99h11m44 0h11M27 101h11m44 0h11" fill="none" stroke="#d0af81" stroke-width="1"/><path d="M60 104v4" stroke="#584632" stroke-width="1"/><g fill="#493b34"><circle cx="48" cy="102" r="1.3"/><circle cx="72" cy="102" r="1.3"/></g>');
  add("envelope", "Letter Carrier", "hangman_perfect", "#fff0c3",
    '<path d="M22 31l38 28 38-28M22 104l21-20M98 104L77 84" fill="none" stroke="#d9ad68" stroke-width="3"/><rect x="81" y="32" width="13" height="14" fill="#f3a4bd"/>');
  add("santa", "Santa Cubie", "santa_song", "#d94c55",
    '<path d="M24 68Q29 77 39 73Q50 68 60 75Q70 68 81 73Q91 77 96 68Q98 87 88 98L83 96Q79 110 70 110L60 119 50 110Q41 110 37 96L32 98Q22 87 24 68Z" fill="#fff8e7" stroke="#ddcdb5" stroke-width="1.5"/><path d="M60 75Q47 67 38 80Q48 84 60 77Q72 84 82 80Q73 67 60 75Z" fill="#fffdf5"/><path d="M34 85q3 14 12 17m40-17q-3 14-12 17M54 100l6 9 6-9" fill="none" stroke="#e8ddc7" stroke-width="1.2" stroke-linecap="round"/><path d="M25 29Q35-8 68 4q25 3 31 24L83 22Q70 7 63 18L56 30Z" fill="#ce3546" stroke="#8b283f" stroke-width="2"/><rect x="20" y="23" width="80" height="13" rx="6" fill="#fff8e7"/><circle cx="100" cy="29" r="9" fill="#fff8e7"/><path d="M28 28h60" stroke="#fff" stroke-width="3" stroke-linecap="round"/>');
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
    '<path d="M23 35Q60 28 97 35L100 47Q60 41 20 47Z" fill="#66598c"/><path d="M27 36Q60 31 93 36" fill="none" stroke="#9689b6" stroke-width="1.5" stroke-linecap="round"/><path d="M23 45Q60 40 97 45" fill="none" stroke="#50446f" stroke-width="1.2"/>' +
    '<path d="M20 91Q60 97 100 91V94Q100 108 86 108H34Q20 108 20 94Z" fill="#66598c"/><path d="M23 96Q60 102 97 96" fill="none" stroke="#9689b6" stroke-width="1.5" stroke-linecap="round"/><path d="M25 103Q60 108 95 103" fill="none" stroke="#50446f" stroke-width="1" stroke-linecap="round"/>' +
    '<path d="M57 33Q60 29 63 33L65 36Q60 43 55 36Z" fill="#ffe4a1"/><path d="M94 36Q104 31 107 39Q108 47 99 48L95 44Z" fill="#77679e"/><path d="M99 36q-3 6 2 10" fill="none" stroke="#a294c3" stroke-width="1.3" stroke-linecap="round"/>', square, {
      back: '<path class="cubie-motion ninja-bandana-tail ninja-bandana-lower" d="M99 40C112 40 113 57 133 51L125 65C108 67 108 47 98 47Z" fill="#51436f" stroke="#83729f" stroke-width="1" stroke-linejoin="round"/>' +
        '<path class="cubie-motion ninja-bandana-tail" d="M98 37C112 22 126 39 141 22L137 40C121 51 110 33 99 44Z" fill="#77679e" stroke="#ac9bcd" stroke-width="1" stroke-linejoin="round"/>',
    });
  add("comet", "Comet Cubie", "dodge_360", "#f4d7b2",
    '<path d="M87 43a34 34 0 0 1 4 46" fill="none" stroke="#fff1bb" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="33" cy="76" r="5" fill="#dcae81"/><circle cx="72" cy="98" r="3" fill="#dcae81"/>',
    '<circle cx="60" cy="68" r="41"/>', {
      back: '<path class="cubie-comet-flame comet-outer" d="M57 37C23 22 7 6-13-8 0 16-7 42 11 63q11 15 34 19Z" fill="#df7458"/>' +
        '<path class="cubie-comet-flame comet-middle" d="M57 43C29 34 15 18 1 10 12 29 4 49 24 66l23 7Z" fill="#f5a55e"/>' +
        '<path class="cubie-comet-flame comet-core" d="M57 51C37 40 22 30 14 25c9 19 9 33 31 40Z" fill="#ffe39a"/>' +
        '<path class="cubie-comet-embers" d="M10-1 21 10M-6 26l7 13M28 10l9 8" fill="none" stroke="#ffd68c" stroke-width="3" stroke-linecap="round"/>',
    });
  add("boss", "Boss Cubie", "boss_10", "#9865cc",
    '<path d="M34 46 51 51M69 51 86 46" fill="none" stroke="#111014" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M27 35h20M26 39v9" fill="none" stroke="#c9a5ed" stroke-width="2" stroke-linecap="round"/>', square, {
      flavor: "Cubie drew those angry eyebrows on with dry erase marker. Still smiling underneath.",
    });
  add("knight", "Arena Knight", "boss_win", "#b6c4d5",
    '<path d="M25 36l35-19 35 19M60 18v22" fill="none" stroke="#77899e" stroke-width="6"/><path d="M20 88l-9 15 19 7M100 88l9 15-19 7" fill="#77899e"/><path d="M57 18V2" fill="none" stroke="#77899e" stroke-width="3" stroke-linecap="round"/><path class="cubie-motion knight-flag" d="M58 3C69-10 83 13 96-2L91 13C78 29 68 3 58 14Z" fill="#e78d9f" stroke="#f7b9c7" stroke-width="1" stroke-linejoin="round"/>');
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
    '<path d="M18 31h84L77 13H43Z" fill="#bc8c51"/><path d="M30 25l12-19 31 6 17 13" fill="#d4ab69"/><path d="M34 22q26 6 51 0" fill="none" stroke="#8c623e" stroke-width="4"/><path d="m44 11-4 7m12-5-3 7m12-5-2 6m11-4v5M25 29h68" fill="none" stroke="#f1d28e" stroke-width="1" stroke-linecap="round"/>' +
    '<path d="M21 88L4 83M22 94L6 98M99 88l17-5M98 94l16 4" stroke="#e3bb68" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M20 86Q60 90 100 86V94Q100 108 86 108H34Q20 108 20 94Z" fill="#b77664"/><path d="M23 92h74M25 99h70M29 87v16M39 88v18M81 88v18M91 87v16" fill="none" stroke="#e7ab83" stroke-width="1" opacity=".75"/>' +
    '<path d="M33 91H87V108H34Q30 108 30 104V96Z" fill="#507a79"/><path d="M26 80h8l8 18-8 3ZM86 80h8l-8 21-8-3Z" fill="#507a79"/><path d="m29 82 9 16m53-16-9 16M34 105h48" fill="none" stroke="#a6bba0" stroke-width=".9" stroke-dasharray="2 2"/>' +
    '<rect x="33" y="92" width="7" height="6" rx="1.4" fill="#e4bd6d" stroke="#8c6d3e" stroke-width=".8"/><rect x="80" y="92" width="7" height="6" rx="1.4" fill="#e4bd6d" stroke="#8c6d3e" stroke-width=".8"/><path d="M35 94h3m44 0h3" stroke="#fff0b5" stroke-width="1"/>' +
    '<path d="M49 95h22v7q-11 8-22 0Z" fill="#406565" stroke="#acc0a2" stroke-width=".8" stroke-dasharray="2 1.5"/><path d="M51 98h18" stroke="#274e50" stroke-width="1"/><path d="m74 100 9-1 1 7-9 1Z" fill="#d9ab77" stroke="#795b46" stroke-width=".7"/><path d="m76 101 1 4m3-4 1 4" stroke="#fff0c2" stroke-width=".7"/>');
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
  add("codex", "Codex Cubie", "name_codexisthebest", "#858b98",
    '<rect x="26" y="34" width="68" height="68" rx="3" fill="#343b46" stroke="#b9c0ca" stroke-width="1.5"/>' +
    '<rect x="30" y="38" width="60" height="60" rx="1" fill="#c6f783"/>' +
    '<path d="m34 41 4 3-4 3m7 0h5" fill="none" stroke="#30452b" stroke-width="1.5" stroke-linecap="square"/>' +
    '<path d="M32 51h56M32 57h56M32 63h56M32 69h56M32 75h56M32 81h56M32 87h56M32 93h56" stroke="#84b958" stroke-width=".5" opacity=".2"/>' +
    '<rect x="44" y="108" width="32" height="7" rx="1" fill="#626a79"/><rect x="35" y="114" width="50" height="7" rx="2" fill="#969fad" stroke="#4a5260" stroke-width="1.5"/><path d="M39 116h42" stroke="#c7ced8" stroke-width="1.5"/>',
    '<rect x="20" y="28" width="80" height="80" rx="5"/>', {
      flavor: "A little code. A lot of possibility.",
      back: '<g fill="#9562d2" stroke="#dcc2ff" stroke-width="1.2" stroke-linejoin="round"><path d="M23 80 3 100-13 65-9 23 5 38 12 10 26 52Z"/><path d="M97 80 117 100 133 65 129 23 115 38 108 10 94 52Z"/></g>' +
        '<g fill="#c09af4"><path d="M12 10 7 60 23 80 26 52Z"/><path d="m-9 23 16 37-20 5Z"/><path d="m108 10 5 50-16 20-3-28Z"/><path d="m129 23-16 37 20 5Z"/></g>' +
        '<g fill="#684296"><path d="m7 60-4 40 20-20Z"/><path d="m113 60 4 40-20-20Z"/></g>' +
        '<path d="m12 10-5 50-20 5m20-5 16 20M108 10l5 50 20 5m-20-5-16 20" fill="none" stroke="#e5d5ff" stroke-width="1"/>',
    });
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
  add("ton_618", "TON 618", "core_flawless", "#10070e",
    '<circle cx="60" cy="67" r="38" fill="none" stroke="#ff354f" stroke-width="2"/>',
    '<circle cx="60" cy="67" r="39"/>', { faceColor: '#ff304c' });
  add("phantom_king", "Phantom King Cubie", "pumpkin_flawless", "#e77925",
    '<path d="M43 32C27 48 27 90 44 103M77 32c16 16 16 58-1 71" fill="none" stroke="#843b27" stroke-width="3"/>',
    catalog.find(item => item.id === 'pumpkin').body, { tier: 'rainbow', faceColor: '#fff18a' });
  add("phantom_emperor", "Phantom Emperor Cubie", "pumpkin_flawless_10", "#ed9c42",
    '<path d="M25 94Q60 116 95 94" stroke="#bdffac" fill="none"/>',
    catalog.find(item => item.id === 'pumpkin').body,
    { flavor: "Ten untouched crowns. An entire afterlife cheering for one little pumpkin." });
  add("living_grimoire", "Living Grimoire Cubie", "hangman_perfect_100", "#53458a",
    '<path d="M25 33H95V103H25Z" fill="#53458a"/>', square,
    { flavor: "A hundred perfect words. The book is now writing compliments about you." });
  add("tempest_seraph", "Tempest Seraph Cubie", "typing_100", "#4679aa",
    '<path d="m60 30 30 38-30 38-30-38Z" fill="#4679aa"/>', square,
    { flavor: "Types so fast the thunder arrives after the victory screen." });
  add("celestial_forge", "Celestial Forge Cubie", "boss_100", "#b35e39",
    '<path d="M23 90 60 105 97 90" stroke="#ffdb84" fill="none"/>', square,
    { flavor: "Forged in a hundred victories. Still warm enough to toast a marshmallow." });
  add("abyssal_leviathan", "Abyssal Leviathan Cubie", "dodge_merciless_420", "#205a77",
    '<path d="M20 92Q60 112 100 92" stroke="#79fff2" fill="none"/>', square,
    { flavor: "Seven minutes beneath the impossible. Even the deep sea held its breath." });
  add("jester", "Royal Jester", "wrath_win_5", "#eab4ca",
    '<g class="cubie-motion motion-sway" style="transform-origin:34px 29px;animation-duration:4s"><path d="M22 31Q10 28 9 17Q6 0 26 6Q43 10 48 30Z" fill="#9874c5" stroke="#674788" stroke-width="1.2"/><path d="M16 14Q24 7 36 21" fill="none" stroke="#c9acee" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="18" r="5" fill="#f6ce71" stroke="#ad7e37" stroke-width="1"/><path d="M7 17h4m-2 0v4" stroke="#a97832" stroke-width=".8"/><circle cx="7.5" cy="16" r="1.2" fill="#fff5c9"/></g>' +
    '<g class="cubie-motion motion-sway" style="transform-origin:84px 29px;animation-duration:4.4s;animation-delay:-1s"><path d="M73 30Q81 6 100 6Q117 6 111 22Q103 16 98 32Z" fill="#c95b85" stroke="#904063" stroke-width="1.2"/><path d="M83 22Q95 7 106 13" fill="none" stroke="#f09fbb" stroke-width="2" stroke-linecap="round"/><circle cx="111" cy="22" r="5" fill="#f6ce71" stroke="#ad7e37" stroke-width="1"/><path d="M109 21h4m-2 0v4" stroke="#a97832" stroke-width=".8"/><circle cx="109.5" cy="20" r="1.2" fill="#fff5c9"/></g>' +
    '<g class="cubie-motion motion-sway" style="transform-origin:60px 28px;animation-duration:4.8s;animation-delay:-.5s"><path d="M43 30Q40 7 54-4Q71-17 79 3L75 9Q63-3 65 13L74 30Z" fill="#7552ab" stroke="#54397d" stroke-width="1.2"/><path d="M49 23Q47 4 60-3" fill="none" stroke="#b597de" stroke-width="2" stroke-linecap="round"/><circle cx="77" cy="8" r="5" fill="#f6ce71" stroke="#ad7e37" stroke-width="1"/><path d="M75 7h4m-2 0v4" stroke="#a97832" stroke-width=".8"/><circle cx="75.5" cy="6" r="1.2" fill="#fff5c9"/></g>' +
    '<path d="M22 27Q60 20 98 27L100 37Q60 31 20 37Z" fill="#76529c" stroke="#e8c16f" stroke-width="1.3"/><path d="M25 29Q60 23 95 29" fill="none" stroke="#c6a5df" stroke-width="1"/><path d="m55 28 5-4 5 4-5 5Z" fill="#ffe3a0"/>' +
    '<path d="M20 87Q60 93 100 87V94Q100 108 86 108H34Q20 108 20 94Z" fill="#8c65b1"/><path d="M60 91Q80 90 100 87V94Q100 108 86 108H60Z" fill="#c1628b"/><path d="M60 96v11" stroke="#e9b775" stroke-width="1"/>' +
    '<path d="M22 86 37 89 48 86 60 90 72 86 83 89 98 86 90 99 78 94 69 101 60 95 51 101 42 94 30 99Z" fill="#fff0c5" stroke="#c59858" stroke-width="1" stroke-linejoin="round"/>' +
    '<g fill="#f7d581" stroke="#b28341" stroke-width=".6"><circle cx="30" cy="99" r="1.7"/><circle cx="51" cy="101" r="1.7"/><circle cx="69" cy="101" r="1.7"/><circle cx="90" cy="99" r="1.7"/></g><path d="m39 100 3-3 3 4-3 4Zm36 1 3-4 3 3-3 5Z" fill="#e9bfeb"/><path d="M29 105Q60 110 91 105" fill="none" stroke="#f3d18d" stroke-width="1.3" stroke-linecap="round"/>');
  add("patchwork", "Never Give Up", "determination", "#cdb5dd",
    '<path d="M20 29h28v16H20M75 89h25v17H75" fill="#f4c988"/><path d="M23 41h24M78 93h19" stroke="#795f8a" stroke-width="3" stroke-dasharray="3 3"/><path d="M26 84l14 10M27 90l11-5" stroke="#795f8a" stroke-width="3"/>');
  add("heart", "Best Friend Cubie", "cube_pet_100", "#ffb6c6",
    '<path class="cubie-motion motion-heart" style="transform-origin:60px 28px" d="M45 17c-13-13-24 7 15 21 39-14 28-34 15-21L60 28z" fill="#ec6e97"/><ellipse cx="30" cy="80" rx="9" ry="5" fill="#ee8aa8"/><ellipse cx="90" cy="80" rx="9" ry="5" fill="#ee8aa8"/>');
  add("merciful", "Merciful Cubie", "pumpkin_merciful", "#f5b2d0",
    '<path d="M26 37q34-14 68 0" fill="none" stroke="#fff0f6" stroke-width="3"/>', square,
    { flavor: "Five minutes. Not one shot. A softer kind of strength." });
  add("speedrunner", "Speedrunner Cubie", "pumpkin_speedrunner", "#70d8db",
    '<path d="m68 31-24 38h17l-9 34 29-45H63Z" fill="#fff4a9"/>', square,
    { flavor: "The King was still finishing the dramatic entrance." });
  add("golden_hand", "Hand Cubie", "magenta_counter_100", "#e5b84f",
    '<path d="M39 80q16-12 40-2M44 92q13-7 30-3" fill="none" stroke="#a67924" stroke-width="2"/>',
    '<path d="M34 105Q23 98 20 84L11 64Q7 54 14 51q6-3 12 8l8 12V21q0-14 10-14 9 0 9 14v33V12q0-13 10-13 10 0 10 13v43V22q0-13 9-13 10 0 10 13v39V39q0-12 9-12 9 0 9 12v43q0 17-17 25l-2 5H37Z"/>',
    { flavor: "A hundred royal replies. Every one delivered by hand." });
  add("prismatic", "Prismatic Cubie", "collect_prismatic", "rgba(220,248,255,.025)",
    '<path d="M35 28h50l15 15v50l-15 15H35L20 93V43Z" fill="none" stroke="#e7fcff"/>',
    '<path d="M35 28h50l15 15v50l-15 15H35L20 93V43Z"/>',
    { flavor: "Every triumph leaves a little light inside." });
  add("creeper", "Creeper Cubie", "arcade_deaths_10", "#69bb57",
    '<path d="M22 30h18v16H22m55-16h21v20H77ZM22 86h16v20H22m58-16h18v16H80Z" fill="#408c43"/><path d="M43 31h15v12H43m23 49h12v13H66Z" fill="#a3db75"/>', square,
    { flavor: "Ten dramatic exits. Still sneaking back for another game." });
  add("tetris", "Tetris Cubie", "dodge_square_deaths_50", "#ffd655",
    '<path d="M60 28v80M20 68h80" stroke="#b78921" stroke-width="3"/>',
    '<rect x="20" y="28" width="80" height="80" rx="2"/>',
    { flavor: "Fifty square encounters. Finally on your side." });
  add("forever_friend", "Forever Friend Cubie", "cube_pet_1000", "#a5e5cb",
    '<path d="m25 35-5-22 22 12L60 8l18 17 22-12-5 22Z" fill="#f8d791" stroke="#c49a58" stroke-width="2"/><g class="cubie-motion motion-heart" style="transform-origin:60px 22px"><path d="M60 29C35 17 48 6 60 17 72 6 85 17 60 29Z" fill="#ed87b4"/></g><ellipse cx="30" cy="80" rx="8" ry="5" fill="#f3afbd"/><ellipse cx="90" cy="80" rx="8" ry="5" fill="#f3afbd"/><path d="m22 96 21-5 17 9 17-9 21 5-8 12H30Z" fill="#f8d791"/><path d="M60 105c-20-10-10-20 0-10 10-10 20 0 0 10Z" fill="#ed87b4"/>', square,
    { flavor: "A thousand little hugs. A friendship without an ending.", back: '<g class="cubie-motion motion-wing" style="transform-origin:60px 62px;animation-duration:4s"><path d="M29 83Q-3 73 1 32l13 12 2-19 17 26 10 17M91 83q32-10 28-51l-13 12-2-19-17 26-10 17" fill="#d5fff0" stroke="#80c9b1" stroke-width="2"/><path d="m8 49 19 20m85-20L93 69" stroke="#f8d791" stroke-width="3"/></g>' });
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
    '<path d="M30 32 38 7 46 32ZM52 32 60 0 68 32ZM74 32 82 7 90 32Z" fill="#9f7ad1" stroke="#d5b7ff" stroke-width="2"/>' +
    '<path d="M38 7v25h8ZM60 0v32h8ZM82 7v25h8Z" fill="#c5a6ee"/>' +
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
      '<path class="cubie-motion prism-orange" d="M60 28h26q14 0 14 14v52q0 14-14 14H60Z" fill="#ffb86e"/><path class="cubie-motion prism-blue" d="M32 18h12v12H32M52 18h12v12H52M72 18h12v12H72" fill="#72c9ff"/><path class="cubie-motion prism-orange" d="M42 9h12v12H42M62 9h12v12H62M82 9h12v12H82" fill="#ffab60"/><path d="M28 97h64" stroke="#fff1cc" stroke-width="4"/>',
      'Blue means still. Orange means dance. Cubie remembers both.'],
    pumpkin_bone_gauntlet: ['#e8dfc1',
      '<g class="cubie-motion motion-hover" style="animation-duration:4.5s" fill="#faf4dc"><path d="M29 25h62v9H29Z"/><circle cx="28" cy="25" r="7"/><circle cx="28" cy="34" r="7"/><circle cx="92" cy="25" r="7"/><circle cx="92" cy="34" r="7"/></g><path d="M24 44v43M96 44v43" stroke="#baa987" stroke-width="5"/><path d="M35 96h50M39 102h42" stroke="#fff9e6" stroke-width="4"/>',
      'A closet full of bones. Somehow still the friendliest skeleton.'],
    pumpkin_rotating_rings: ['#c6a9f1',
      '<g fill="none" stroke-width="5"><path d="M8 78Q60 123 112 78" stroke="#ffb262"/><path d="M8 40Q60 1 112 40" stroke="#70d8f4"/></g><path d="m60 10 9 12-9 12-9-12Z" fill="#ffe4a0"/>',
      'Ten spins later, the outfit is dizzy. Cubie is fine.'],
    pumpkin_magenta_fingers: ['#efa9d5',
      '<path class="cubie-motion motion-sway" style="transform-origin:59px 31px" d="M32 31V15q0-7 7-7t7 7V6q0-6 6-6t6 6v10V8q0-6 6-6t6 6v11-4q0-6 6-6t6 6v16Z" fill="#bf548f"/><path d="M26 92h68v12H26Z" fill="#a94d85"/><path d="M34 98h52" stroke="#ffd4e9" stroke-width="3"/><g fill="none" stroke="#ffd38b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path class="cubie-motion counter-shock" d="m10 50-5 10 8-2-3 12"/><path class="cubie-motion counter-shock" style="animation-delay:-.6s" d="m109 50 5 10-8-2 3 12"/></g>',
      'A tiny high five with extremely good timing.'],
    pumpkin_chaos: ['#edb39d',
      '<path class="cubie-motion chaos-cosmetic" style="--chaos-x:2px;--chaos-y:1px;--chaos-tilt:5deg" d="M20 42q0-14 14-14h26L20 62Z" fill="#53caff"/>' +
      '<path class="cubie-motion chaos-cosmetic" style="--chaos-x:-2px;--chaos-y:-1px;--chaos-tilt:-5deg;animation-delay:-.3s,-.45s" d="M100 83v11q0 14-14 14H60Z" fill="#cf77ff"/>' +
      '<path class="cubie-motion chaos-cosmetic" style="--chaos-x:1px;--chaos-y:-5px;--chaos-tilt:6deg;--chaos-speed:.65s;animation-delay:-.1s,-.2s" d="m28 23 9-15 12 14 14-16 10 15 13-9 8 13" fill="none" stroke="#ffce49" stroke-width="5" stroke-linejoin="round"/>' +
      '<path class="cubie-motion chaos-cosmetic" style="--chaos-x:-4px;--chaos-y:-3px;--chaos-tilt:-12deg;--chaos-speed:.55s;animation-delay:0s,-.35s" d="m7 57 8 6-8 6" fill="none" stroke="#e367b8" stroke-width="3" stroke-linecap="round"/>' +
      '<path class="cubie-motion chaos-cosmetic" style="--chaos-x:4px;--chaos-y:3px;--chaos-tilt:12deg;--chaos-speed:.7s;animation-delay:-.2s,-.6s" d="m113 74-8 6 8 6" fill="none" stroke="#71d7ff" stroke-width="3" stroke-linecap="round"/>' +
      '<path class="cubie-motion chaos-cosmetic" style="--chaos-x:1px;--chaos-y:2px;--chaos-tilt:-4deg;--chaos-speed:.8s;animation-delay:-.4s,-.75s" d="M30 98l13-6 8 9 12-8 8 7 16-6" fill="none" stroke="#a769d4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
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
    ["cloud", "Cloud Cubie", 450, "silver", "#d9efff", "Forecast: a hundred percent chance of happy.", '<path d="M25 57Q23 45 36 47M40 38Q47 29 55 38M64 34Q77 27 82 42M29 91Q37 101 47 96M66 103Q78 106 83 96" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path class="cubie-motion motion-rain" d="m33 113-3 9m30-5-3 9m30-13-3 9" fill="none" stroke="#79b9ef" stroke-width="2.5" stroke-linecap="round"/>', { body: '<path d="M34 44C30 29 47 23 56 34C66 19 86 26 86 42C104 39 112 58 100 69C113 84 100 101 86 97C81 113 63 115 54 104C41 116 22 108 25 95C8 96 6 74 20 67C7 54 18 39 34 44Z"/>' }],
    ["disco", "Disco Cubie", 600, "gold", "#a7a2d7", "The dance floor requested an encore.", '<path d="M40 29v78m20-78v78m20-78v78M21 48h78M21 68h78M21 88h78" stroke="#e5e6ff" stroke-width="2"/><path d="m12 15 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#fff6b4"/>'],
    ["arcade_cabinet", "Cabinet Cubie", 700, "gold", "#bd719b", "One more game? That is literally the job.", '<path d="M22 43h76v62H22Z" fill="#172c42"/>', { body: '<path d="M23 18H97L104 33V101L110 111V132H10V111L16 101V33Z"/>' }],
    ["terrarium", "Terrarium Cubie", 850, "crystal", "#97cfba", "A tiny garden with very big growing plans.", '<path d="M23 93Q42 83 60 93T97 93V95Q97 105 86 105H34Q23 105 23 95Z" fill="#43846a"/><path class="cubie-motion motion-sway" style="transform-origin:35px 93px;animation-duration:5s" d="M35 93V79m0 7q-11 0-9-9 10 0 9 9m0-2q11 0 10-10-10 1-10 10" fill="#79bd62" stroke="#3f7a44" stroke-width="2"/><path d="m83 35 10 10" stroke="#e4fff3" stroke-width="5"/>'],
    ["origami", "Origami Cubie", 1000, "crystal", "#eed9ac", "Folded with care. Unfolds into a friend.", '<path d="m20 28 40 18 40-18-15 80-25-12-25 12Z" fill="#f8e8c9"/><path d="m20 28 40 18 40-18M60 46v50m-25 12 25-12 25 12" fill="none" stroke="#bfa77c" stroke-width="2"/>'],
    ["aurora", "Aurora Cubie", 1300, "diamond", "#3c5c90", "Brought the northern lights home before bedtime.", '<path d="M23 40q20-25 40-3t34-7M23 54q20-25 40-3t34-7" fill="none" stroke="#7ef2c6" stroke-width="7" opacity=".75"/><path d="M23 100q20-25 40-3t34-7" fill="none" stroke="#d8a2ef" stroke-width="7"/>'],
    ["prism_pop", "Prism Pop Cubie", 1800, "rainbow", "#f3a9c9", "Every color asked to be the favorite. Cubie said yes.", '<path d="m20 28 40 0-40 40Z" fill="#ffe38c"/><path d="m60 28 40 0v40Z" fill="#8adbd1"/><path d="m20 68 40 40H20Z" fill="#99b9ef"/><path d="m100 68-40 40h40Z" fill="#bba2ef"/><path d="m60 28 40 40-40 40-40-40Z" fill="none" stroke="#fff3d9" stroke-width="2"/>'],
    ["pancake", "Pancake Cubie", 200, "bronze", "#dca460", "Stacks of courage. A little extra syrup.", "<path d=\"M20 40h80M20 96h80\" stroke=\"#fff1b9\" stroke-width=\"5\"/><path d=\"M22 40C22 33 29 29 38 29H82C91 29 98 33 98 40V45C98 49 96 51 93 51S88 49 88 45C88 42 82 42 82 46V51C82 59 73 59 73 51V47C73 43 67 43 67 47C67 54 58 54 58 47C58 43 52 43 52 47V49C52 57 43 57 43 49V46C43 42 37 42 37 46C37 52 28 52 28 46C28 43 22 45 22 40Z\" fill=\"#aa6436\"/><rect x=\"49\" y=\"29\" width=\"22\" height=\"10\" rx=\"3\" fill=\"#ffe87e\"/>"],
    ["ladybug", "Ladybug Cubie", 250, "bronze", "#ed595e", "Small spots. Enormous garden ambitions.", "<path d=\"M42 29 35 17m43 12 7-12\" stroke=\"#253140\" stroke-width=\"4\"/><circle cx=\"35\" cy=\"16\" r=\"5\" fill=\"#253140\"/><circle cx=\"85\" cy=\"16\" r=\"5\" fill=\"#253140\"/><g fill=\"#253140\"><circle cx=\"28\" cy=\"45\" r=\"5\"/><circle cx=\"92\" cy=\"45\" r=\"5\"/><circle cx=\"28\" cy=\"86\" r=\"5\"/><circle cx=\"92\" cy=\"86\" r=\"5\"/></g>"],
    ["mailbox", "Mailbox Cubie", 350, "silver", "#689aca", "Every letter gets a warm welcome. Even bills.", "<path d=\"M22 35h76v10H22Z\" fill=\"#294f7a\"/><path class=\"cubie-motion motion-mailflag\" style=\"transform-origin:101px 70px\" d=\"M101 70V27h15v13h-15\" fill=\"#e97367\" stroke=\"#d7e7ed\" stroke-width=\"3\"/><rect x=\"44\" y=\"96\" width=\"32\" height=\"11\" fill=\"#f8e6bb\"/><path d=\"m44 96 16 8 16-8\" fill=\"none\" stroke=\"#a88f6d\"/>"],
    ["crayon", "Crayon Cubie", 400, "silver", "#b784d8", "Colors outside the lines. Befriends everyone inside.", "<path d=\"m29 28 31-25 31 25Z\" fill=\"#8a54ac\"/><path d=\"M21 32h78v10H21ZM21 95h78v10H21Z\" fill=\"#50356d\"/><path d=\"m25 37 9-4 9 4 9-4 9 4 9-4 9 4 9-4\" fill=\"none\" stroke=\"#e6c5fa\" stroke-width=\"2\"/>"],
    ["sailor", "Sailor Cubie", 500, "silver", "#b8d9ef", "All aboard the good ship Friendship.", "<path d=\"M24 28h72l-7-17H31Z\" fill=\"#f2f4e7\"/><path d=\"M24 27h72\" stroke=\"#295883\" stroke-width=\"5\"/><path d=\"m23 91 37 17 37-17\" fill=\"none\" stroke=\"#295883\" stroke-width=\"8\"/><path d=\"m60 100-7 13 7-3 7 3Z\" fill=\"#e86a6d\"/>"],
    ["waffle", "Waffle Cubie", 650, "gold", "#e6bc70", "Every little square holds a big breakfast dream.", "<path d=\"M37 29v78m23-78v78m23-78v78M21 44h78M21 67h78M21 90h78\" stroke=\"#c38d44\" stroke-width=\"5\"/><path d=\"M39 36q4-7 13-5l20-1q12-2 14 5 1 6-12 7l-23 2q-13 0-12-8Z\" fill=\"#f4d56c\"/><path d=\"M44 27 68 23q5-1 7 3l3 9q1 4-4 5l-24 4q-5 0-6-4l-3-8q-1-4 3-5Z\" fill=\"#dfad43\"/><path d=\"m44 24 24-4q5-1 7 3l2 7q1 4-4 5l-24 4q-5 0-6-4l-2-6q-1-4 3-5Z\" fill=\"#ffec94\"/><path d=\"m46 26 21-3q4 0 5 3\" fill=\"none\" stroke=\"#fff8ce\" stroke-width=\"2\" stroke-linecap=\"round\"/>"],
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
    ["storm", "Storm Cubie", 1550, "diamond", "#8b9bbb", "Every cloud deserves a dramatic entrance.", '<path d="M25 57Q23 45 36 47M40 38Q47 29 55 38M64 34Q77 27 82 42M29 91Q37 101 47 96M66 103Q78 106 83 96" fill="none" stroke="#dce5ff" stroke-width="1.8" stroke-linecap="round"/><g class="cubie-motion motion-energy" style="transform-origin:60px 68px"><path d="m20 73-13 20h12l-5 18 20-26H22Zm82-28-12 20h12l-5 18 20-26h-12Z" fill="#ffe09a" stroke="#fff0c4" stroke-width=".6"/></g>', { body: '<path d="M34 44C30 29 47 23 56 34C66 19 86 26 86 42C104 39 112 58 100 69C113 84 100 101 86 97C81 113 63 115 54 104C41 116 22 108 25 95C8 96 6 74 20 67C7 54 18 39 34 44Z"/>' }],
    ["koi", "Koi Cubie", 1600, "diamond", "#efead6", "Swims upstream. Waves to everyone downstream.", '<path d="M39 30q21-8 40 5l-9 15-25-5Z" fill="#e96c43"/>', { body: '<path d="M60 28C35 28 19 43 24 65C28 86 45 98 53 108H67C75 98 92 86 96 65C101 43 85 28 60 28Z"/>' }],
    ["moon_rabbit", "Moon Rabbit Cubie", 1650, "diamond", "#dfd4ec", "Delivers wishes by moonlight.", "<g class=\"cubie-motion motion-sway\" style=\"transform-origin:36px 33px;\"><path d=\"M28 33Q12-7 29-3q16 4 16 36Z\" fill=\"#e9def2\" /><path d=\"M31 25Q23 3 29 5q7 5 8 20Z\" fill=\"#cca5ca\" /></g><g class=\"cubie-motion motion-sway\" style=\"transform-origin:84px 33px;animation-delay:-1.7s\"><path d=\"M76 33q0-40 17-36 17 7-1 36Z\" fill=\"#e9def2\" /><path d=\"M83 25q1-22 8-20 5 6-1 20Z\" fill=\"#cca5ca\" /></g><path d=\"M26 96q9-14 22 0m24 0q13-14 22 0\" fill=\"#c3acd8\" /><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;\"><circle cx=\"60\" cy=\"25\" r=\"6\" fill=\"#fff0bd\"/></g>"],
    ["kaleidoscope", "Kaleidoscope Cubie", 1900, "rainbow", "#c7b9dd", "Every turn reveals another little wonder.", "<g class=\"cubie-motion motion-spin\" style=\"transform-origin:60px 28px;animation-duration:14s\"><path d=\"M60 28 51 13 60 1 69 13Z\" fill=\"#ed9baf\" transform=\"rotate(0 60 28)\"/><path d=\"M60 28 51 13 60 1 69 13Z\" fill=\"#f3d887\" transform=\"rotate(60 60 28)\"/><path d=\"M60 28 51 13 60 1 69 13Z\" fill=\"#9fdab5\" transform=\"rotate(120 60 28)\"/><path d=\"M60 28 51 13 60 1 69 13Z\" fill=\"#91cfe4\" transform=\"rotate(180 60 28)\"/><path d=\"M60 28 51 13 60 1 69 13Z\" fill=\"#a5adeb\" transform=\"rotate(240 60 28)\"/><path d=\"M60 28 51 13 60 1 69 13Z\" fill=\"#c8a4df\" transform=\"rotate(300 60 28)\"/><circle cx=\"60\" cy=\"28\" r=\"5\" fill=\"#fff2d5\"/></g><g class=\"cubie-motion motion-color\" style=\"transform-origin:60px 68px;\"><path d=\"M24 93 42 88l18 12 18-12 18 5-18 13-18-6-18 6Z\" fill=\"#a2decb\" /><path d=\"M25 37h70\" fill=\"none\" stroke=\"#ffe7a6\" stroke-width=\"4\" stroke-linecap=\"round\" /></g>"],
    ["carnival", "Carnival Cubie", 2000, "rainbow", "#ecb0c1", "The parade starts whenever you smile.", "<path d=\"M16 38 60 1l44 37Z\" fill=\"#ef7f97\" /><path d=\"M60 1 36 38h17Zm0 0 7 37h17Z\" fill=\"#fbe5a4\" /><path d=\"M16 38h88v8H16Z\" fill=\"#a2cfd1\" /><path d=\"M29 97h62\" fill=\"none\" stroke=\"#f5e4b5\" stroke-width=\"5\" stroke-linecap=\"round\" /><g class=\"cubie-motion motion-sway\" style=\"transform-origin:60px 3px;\"><path d=\"M60 3V-8l20 6-20 5Z\" fill=\"#96d7c6\" /></g><circle cx=\"31\" cy=\"100\" r=\"3\" fill=\"#ca83b4\"/><circle cx=\"60\" cy=\"100\" r=\"3\" fill=\"#ca83b4\"/><circle cx=\"89\" cy=\"100\" r=\"3\" fill=\"#ca83b4\"/>"],
    ["prism_moth", "Prism Moth Cubie", 2100, "rainbow", "#b8a0df", "Follows every color of light. Always finds a friend.",
      '<path d="M42 31 35 12m43 19 7-19" fill="none" stroke="#eadbff" stroke-width="3" stroke-linecap="round"/><circle cx="35" cy="12" r="4" fill="#ffb5cf"/><circle cx="85" cy="12" r="4" fill="#a5f2de"/><path d="m30 96 15-7 15 11 15-11 15 7-15 10-15-6-15 6Z" fill="#ffe6a0"/>',
      { back: '<g class="cubie-motion motion-wing" style="transform-origin:60px 64px;animation-duration:3s"><path d="M35 65Q-7 54 2 13q33 1 45 35M85 65q42-11 33-52-33 1-45 35" fill="#f69dbe" stroke="#ffe9ce" stroke-width="2"/><path d="M31 65Q-8 75 9 113q26-3 38-27M89 65q39 10 22 48-26-3-38-27" fill="#91dce4" stroke="#e4faff" stroke-width="2"/><path d="M7 23q21 7 29 28L13 43Zm106 0q-21 7-29 28l23-8Z" fill="#ffe49a"/><path d="m10 80 24-6-15 23Zm100 0-24-6 15 23Z" fill="#b6a0f4"/><circle cx="16" cy="35" r="5" fill="#a9e7ba"/><circle cx="104" cy="35" r="5" fill="#a9e7ba"/></g>' }],
    ["rainbow_sundae", "Rainbow Sundae Cubie", 2150, "rainbow", "#ffe2bd", "Seven scoops of happiness. The cherry is a bonus.",
      '<path d="M17 41q-7-20 14-24 6-19 24-9 18-15 30 3 23-2 20 30Z" fill="#ffaacb"/><path d="M22 39q-5-15 11-19 13-3 19 19Z" fill="#ffe294"/><path d="M45 39q-3-23 14-23 19-2 20 23Z" fill="#a5e6c0"/><path d="M73 39q-1-18 14-17 17 0 15 17Z" fill="#a7c7ff"/><path d="M20 38h80v7q-8 12-15 0-8 17-16 0-8 11-17 0-8 15-16 0-9 8-16 0Z" fill="#fff3e4"/><g class="cubie-motion motion-hover" style="transform-origin:60px 9px;animation-duration:3s"><circle cx="60" cy="9" r="8" fill="#e96b94"/><path d="M60 2q0-10 10-10" fill="none" stroke="#73b893" stroke-width="3"/><circle cx="57" cy="6" r="2" fill="#ffe8ed"/></g><path d="M18 96h84l-13 17H31Z" fill="#b6a0e4"/><path d="M31 101h58" stroke="#e9d8ff" stroke-width="3" stroke-linecap="round"/><path d="m29 31 5 2m21-9 3 4m25 3 4-2" stroke="#dd86b5" stroke-width="3" stroke-linecap="round"/>'],
    ["matrix", "Matrix Cubie", 2225, "rainbow", "#030806", "The code says hello. Cubie waves back.", '<path d="M25 34v68m70-68v68" stroke="#146b3b" stroke-width="1"/>', { faceColor: "#ffffff" }],
    ["cyber", "Cybercubie", 900, "crystal", "#413d69", "Behind the neon mask: one very friendly smile.", '<path d="M24 43q36-15 72 0v48q-36 23-72 0Z" fill="#1b2947" stroke="#9debe9" stroke-width="2"/>', { faceColor: "#b7fff0" }],
    ["solar_seraph", "Solar Seraph Cubie", 2400, "empyrorite", "#e8c98e", "Carries dawn beneath both wings.", "<g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;\"><ellipse cx=\"60\" cy=\"12\" rx=\"24\" ry=\"7\" fill=\"none\" stroke=\"#ffecac\" stroke-width=\"3\"/><path d=\"M26 45v43m68-43v43\" fill=\"none\" stroke=\"#fff5ce\" stroke-width=\"2\" stroke-linecap=\"round\" /></g><path d=\"M23 94 41 88l19 12 19-12 18 6-18 13-19-7-19 7Z\" fill=\"#f6e4bb\" />", {"back": "<g class=\"cubie-motion motion-wing\" style=\"transform-origin:60px 54px;animation-duration:3s\"><path d=\"M23 71Q-5 61 1 20l12 13 1-23 14 22 6-17 13 34M97 71q28-10 22-51l-12 13-1-23-14 22-6-17-13 34\" fill=\"#fff0ce\" stroke=\"#d8b576\" stroke-width=\"2\"/><path d=\"M12 40 27 61m81-21L93 61\" fill=\"none\" stroke=\"#e6c383\" stroke-width=\"2\" stroke-linecap=\"round\" /></g>"}],
    ["star_cartographer", "Star Cartographer Cubie", 2800, "empyrorite", "#637d9b", "Maps every star. Leaves room for new wishes.", "<path d=\"M23 34h74v68H23Z\" fill=\"#405b7a\" /><path d=\"M29 40 45 35l17 8 23-6 7 9M28 92l18 7 22-9 23 10\" fill=\"none\" stroke=\"#86bbcd\" stroke-width=\"1.5\" stroke-linecap=\"round\" /><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-0.0s\"><circle cx=\"29\" cy=\"40\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-0.7s\"><circle cx=\"45\" cy=\"35\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-1.4s\"><circle cx=\"62\" cy=\"43\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-2.0999999999999996s\"><circle cx=\"85\" cy=\"37\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-2.8s\"><circle cx=\"28\" cy=\"92\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-3.5s\"><circle cx=\"46\" cy=\"99\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-4.199999999999999s\"><circle cx=\"68\" cy=\"90\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-energy\" style=\"transform-origin:60px 68px;animation-delay:-4.8999999999999995s\"><circle cx=\"91\" cy=\"100\" r=\"2.7\" fill=\"#fff1bd\"/></g><g class=\"cubie-motion motion-spin\" style=\"transform-origin:60px 15px;animation-duration:18s\"><path d=\"m60-1 4 12 13 4-13 4-4 12-4-12-13-4 13-4Z\" fill=\"#ffe5a3\" /></g><path d=\"M21 33v70m78-70v70\" fill=\"none\" stroke=\"#c7daea\" stroke-width=\"2\" stroke-linecap=\"round\" />", {"faceColor": "#e7f4f1"}],
  ];
  for (const [id, name, price, tier, color, flavor, detail, layers = {}] of shopCustoms)
    add(`shop_${id}`, name, null, color, detail, square, { price, tier, flavor, ...layers });
  add("shop_puzzle_cube", "Puzzle Cube Cubie", null, "#548eea",
    '<path d="M20 54h80M20 81h80M47 28v80M73 28v80" stroke="#172027" stroke-width="3"/>', square,
    { price: 2000, tier: "rainbow", flavor: "One more turn. Almost there. Forever." });
  const everydayShopCubies = [
    ['moon', 'Moon Cubie', 900, 'crystal', '#bec9e4', 'A pocket-sized moon. Every crater holds a wish.', '<circle cx="60" cy="68" r="40"/>'],
    ['sun', 'Sun Cubie', 1100, 'diamond', '#ffbe45', 'Brings the sunshine, even on your rainy days.', '<circle cx="60" cy="68" r="40"/>'],
    ['ice_cream', 'Ice Cream Cubie', 750, 'gold', '#ffbbd4', 'One scoop of smiles. Extra sprinkles, please.', '<path d="M20 76V66a40 38 0 0 1 80 0v22q-7 15-14 1-6 20-15 4-9 20-18 0-10 17-17 0-16 7-16-17Z"/>'],
    ['ice', 'Ice Cubie', 850, 'crystal', '#99e5f5', 'Cool little corners. Warm little heart.', '<path d="M30 28h59l11 11v58l-11 11H30L20 97V39Z"/>'],
    ['sugar', 'Sugar Cubie', 550, 'silver', '#f5edf8', 'A tiny cube of sweetness with a crunchy sparkle.', '<rect x="20" y="28" width="80" height="80" rx="5"/>'],
    ['lightbulb', 'Lightbulb Cubie', 1000, 'diamond', '#ffe5a0', 'Had a bright idea. It was becoming your friend.', '<path d="M60 28c-24 0-40 15-40 35 0 20 15 25 20 36v9h40v-9c5-11 20-16 20-36 0-20-16-35-40-35Z"/>'],
  ];
  for (const [key,name,price,tier,color,flavor,body] of everydayShopCubies)
    add(`shop_${key}`, name, null, color, `<path d="M30 43q8-9 19-9" fill="none" stroke="${color}" stroke-width="2"/>`, body, { price, tier, flavor });
  add("shop_rainbow_crayon", "Rainbow Crayon Cubie", null, "#b984ed",
    '<path d="M22 28 60-9 98 28Z" fill="#ffbd65"/>',
    '<rect x="20" y="28" width="80" height="80" rx="8"/>', {
      price: 2026, tier: "rainbow", faceColor: "#292347",
      flavor: "Every color in one little friend. Draw something wonderful.",
    });
  add("shop_balloon", "Balloon Cubie", null, "#ef769f",
    '<path d="M55 105 52 114q8 4 16 0l-5-9" fill="#cb477d" stroke="#ffb8d2" stroke-width="1"/><path class="balloon-string" d="M60 116c-15 13 15 18 0 32" fill="none" stroke="#e8dbea" stroke-width="1.5" stroke-linecap="round"/>',
    '<path d="M60 28C36 28 20 43 20 64c0 23 19 39 40 44 21-5 40-21 40-44 0-21-16-36-40-36Z"/>', {
      price: 500, tier: "gold", faceColor: "#65233f",
      flavor: "Full of happy thoughts. Please hold the string.",
    });
  add("shop_loco", "Loco Cubie", null, "#ef3448",
    '<path d="M27 49v-8q0-6 7-6h43" fill="none" stroke="#ff9c98" stroke-width="2" stroke-linecap="round"/>', square, {
      price: 685, tier: "gold", faceColor: "#fff071",
      flavor: "A little dizzy. A lot of wiggle.",
    });
  add("shop_hacker", "Hacker Cubie", null, "#858b98",
    '<path d="M60 28 56 42 64 49 57 58 63 66 55 77 62 84 58 96 63 108" fill="none" stroke="#b28fff" stroke-width="3"/>',
    '<rect x="20" y="28" width="80" height="80" rx="5"/>', {
      price: 4000, tier: "empyrorite", flavor: "Half hello, half system error. Do not shake the hand.",
    });
  add("shop_crabby", "Crabby Cubie", null, "#123c79",
    '<path d="M28 43q0-8 8-8h48M27 85v10q0 6 7 6h49" fill="none" stroke="#3677b5" stroke-width="2"/><path d="M33 36h47" stroke="#78b9df" stroke-width="1.2"/><g fill="#2c64a0"><circle cx="29" cy="77" r="2"/><circle cx="91" cy="77" r="2"/></g>' +
    [0, 1].map(side => `<g transform="${side ? 'translate(120 0) scale(-1 1)' : 'translate(0 0)'}"><g transform="translate(-6 52)"><path d="M29 17C17 13 15 0 1 4C-7 6-8 17-1 22" fill="none" stroke="#143c73" stroke-width="14" stroke-linecap="round"/><path d="M27 16Q14 2 2 7" fill="none" stroke="#3474aa" stroke-width="5" stroke-linecap="round"/><g class="cubie-motion crabby-claw" style="animation-delay:${side ? '-1.1' : '0'}s"><g class="cubie-motion crabby-pincer crabby-pincer-left" style="animation-delay:${side ? '-1.1' : '0'}s"><path d="M-4 7C-22 8-27 25-21 39C-17 48-9 54-2 55C-8 45-11 36-7 31C-2 25 2 16-4 7Z" fill="#245e9a" stroke="#397bb3" stroke-width="1"/><path d="M-21 39C-17 48-9 54-2 55C-6 48-9 41-9 36Q-16 33-21 39Z" fill="#e74a53"/><path d="M-19 25Q-21 35-15 41" fill="none" stroke="#74a6c5" stroke-width="1.5" stroke-linecap="round"/></g><g class="cubie-motion crabby-pincer crabby-pincer-right" style="animation-delay:${side ? '-1.1' : '0'}s"><path d="M3 8C19 8 24 22 21 34C19 44 11 51 4 54C9 43 12 34 8 30C2 24-2 16 3 8Z" fill="#2869a2" stroke="#397bb3" stroke-width="1"/><path d="M21 34C19 44 11 51 4 54C8 45 10 39 10 34Q16 30 21 34Z" fill="#f05c61"/><path d="M18 35Q17 42 12 46" fill="none" stroke="#ffa2a2" stroke-width="1.3" stroke-linecap="round"/></g><path d="M-12 15C-19 1-9-9 3-7C17-5 20 7 12 19Q1 29-12 15Z" fill="#22598f"/><path d="M-10 4Q-4-3 5 0" fill="none" stroke="#5994bd" stroke-width="2" stroke-linecap="round"/><g fill="#3975a6"><circle cx="-6" cy="12" r="1.4"/><circle cx="3" cy="15" r="1"/><circle cx="8" cy="7" r="1.3"/></g></g></g></g>`).join(''), square, {
      price: 1020, tier: "diamond", faceColor: "#e2f5ff",
      flavor: "Six little steps. Two big hugs. Mind the pincers.",
      back: [0, 1].map(side => `<g transform="${side ? 'translate(120 0) scale(-1 1)' : 'translate(0 0)'}">` +
        ['M25 65Q8 51-5 62Q-14 68-17 79', 'M23 79Q2 72-8 83Q-17 91-18 101', 'M26 93Q6 96 0 110Q-4 118-2 124'].map((d,i) => `<g class="crabby-leg"><path d="${d}" fill="none" stroke="#0c2855" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${i%2 ? '#3d76ae' : '#285b96'}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('') + '</g>').join(''),
    });
  const spaceJunkShards = [
    'M21 31 43 28 39 42 24 48 19 40Z',
    'M47 29 67 30 72 42 56 48 43 42Z',
    'M72 29 96 33 100 45 80 49 76 41Z',
    'M22 52 38 47 49 55 44 68 23 70 19 62Z',
    'M53 51 72 47 78 61 68 72 49 67Z',
    'M82 53 99 49 98 69 80 74 75 66Z',
    'M22 75 43 73 49 85 37 94 20 88Z',
    'M49 73 67 77 76 73 80 88 67 95 51 89Z',
    'M85 79 99 74 100 94 86 101 80 91Z',
    'M23 94 38 99 45 94 51 107 29 108 20 103Z',
    'M55 96 67 100 77 96 81 107 57 108Z',
    'M87 105 98 99 100 108 86 110Z',
  ];
  add("shop_space_junk", "Space Junk Cubie", null, "none",
    spaceJunkShards.map(d => `<path d="${d}"/>`).join(''),
    spaceJunkShards.map(d => `<path d="${d}"/>`).join(''),
    { price: 1230, tier: "diamond", faceColor: "#baf5ff", flavor: "Some assembly required. The smile arrived intact." });
  add("singularity", "Singularity Cubie", "core_clutch", "#03040c",
    '<circle cx="60" cy="67" r="39" fill="none" stroke="#c3a5ff" stroke-width="2"/>',
    '<circle cx="60" cy="67" r="39"/>',
    { faceColor: "#d4faff", flavor: "One tiny heartbeat. One enormous smile." });
  // Code grants are permanent; the achievement remains an independent unlock.
  const testerCodeActive = false;
  const redeemTesterCode = name => testerCodeActive && typeof name === "string"
    && name.trim().toLowerCase() === "gravitron618";
  const unlocked = (item, medals, owned = [], testerTon618 = false) => item.id === "classic"
    || (testerTon618 === true && item.id === "ton_618") || (item.price
    ? owned.includes(item.id) : item.achievements.some(id => !!medals[id]));
  function selected(id, medals, owned = [], testerTon618 = false) {
    const item = catalog.find(item => item.id === id);
    return item && unlocked(item, medals, owned, testerTon618) ? item : catalog[0];
  }
  // Bounds of the front silhouettes, excluding hats, wheels, and other trim.
  // Every front is fitted to Classic Cubie's 145px square; accessories can
  // extend past it without shrinking the character or changing its face.
  const bodyBounds = {
    golden_hand: [9, -1, 101, 113],
    pumpkin: [18.8723, 26.3594, 82.2554, 81.5819],
    phantom_emperor: [18.8723, 26.3594, 82.2554, 81.5819],
    phantom_king: [18.8723, 26.3594, 82.2554, 81.5819],
    shop_cloud: [12, 24, 96, 88], shop_storm: [12, 24, 96, 88], shop_arcade_cabinet: [10, 18, 100, 114],
    bookworm: [15, 24.6522, 90, 81.3478], rocket: [20, 11, 80, 88],
    turtle: [17, 24, 86, 86], comet: [19, 27, 82, 82], moon: [18, 26, 84, 84],
    diamond: [15, 23, 90, 82], ghost: [18, 21, 84, 88], star: [9, 8, 102, 101],
    pixel: [18, 22, 84, 84], mushroom: [28, 34, 64, 73], vortex: [21, 28, 78, 78], ton_618: [21, 28, 78, 78], singularity: [21, 28, 78, 78],
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
    if (everydayShopCubies.some(([key]) => item.id === `shop_${key}`)) {
      const key = item.id.slice(5);
      const palette = {
        moon: ['#f3f5ff','#b7c4e0','#7388b2'], sun: ['#fff6b2','#ffc94d','#ef8a2d'],
        ice_cream: ['#fff1f4','#ffbdd5','#df7eae'], ice: ['#f2ffff','#9ce8f7','#4fadd6'],
        sugar: ['#ffffff','#f3eaf5','#c9bbd5'], lightbulb: ['#fffef0','#ffe9a3','#e4ae4b'],
      }[key];
      let back = '', trim = '';
      if (key === 'moon') {
        trim = [[34,46,6],[82,39,4],[88,87,7],[35,90,5],[65,99,3],[26,70,3]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#94a7cd" opacity=".65"/><path d="M${x-r*.7} ${y}q0 ${-r*.8} ${r*.8} ${-r*.8}" fill="none" stroke="#eff5ff" stroke-width="1.5"/>`).join('');
        back = '<g class="shop-six-twinkle"><path d="m10 32 2-5 2 5 5 2-5 2-2 5-2-5-5-2Zm98 61 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" fill="#fff0b2"/></g>';
      } else if (key === 'sun') {
        back = '<g class="shop-sun-rays">' + Array.from({length:12},(_,i)=>`<path transform="rotate(${i*30} 60 68)" d="M55 22 60 7 65 22Q60 27 55 22Z" fill="${i%2?'#ffd86c':'#f8a53b'}" stroke="#fff0a4" stroke-width="1"/>`).join('') + '</g>';
        trim = '<path d="M31 49q7-13 20-15" fill="none" stroke="#fff8c1" stroke-width="2.8" stroke-linecap="round"/><ellipse cx="30" cy="77" rx="5" ry="3" fill="#ee8e53" opacity=".6"/><ellipse cx="90" cy="77" rx="5" ry="3" fill="#ee8e53" opacity=".6"/>';
      } else if (key === 'ice_cream') {
        back = '<path d="M28 82h64l-28 54q-4 6-8 0Z" fill="#db9d57" stroke="#ffda95" stroke-width="1.5"/><path d="m36 91 35 28m-28-32 33 25m-24-29 30 23m-2-16-34 28m26-31-31 24m22-28-27 21" stroke="#ad713d" stroke-width="1.1"/><path d="M31 89h58" stroke="#ffe3ac" stroke-width="3"/>';
        trim = '<path d="M31 50q8-15 23-14" fill="none" stroke="#fff6fa" stroke-width="3" stroke-linecap="round"/>' + [[38,44],[62,36],[81,46],[28,62],[91,64],[44,91],[77,92]].map(([x,y],i)=>`<path d="m${x} ${y} 3 2" stroke="${['#69ccbd','#ffdf6d','#ac88e4'][i%3]}" stroke-width="2.5" stroke-linecap="round"/>`).join('');
      } else if (key === 'ice') {
        trim = '<path d="M30 28 36 37h48l5-9M20 39l9 5v48l-9 5m80-58-9 5v48l9 5m-70 11 6-9h48l5 9" fill="#eaffff" opacity=".65"/><path d="M31 48 44 37h17L31 67Zm42 51 17-17v9l-7 8Z" fill="#fff" opacity=".35"/><path d="M81 35 73 44l6 7-7 5M27 87l8-7-4-6" fill="none" stroke="#eaffff" stroke-width="1.2"/>';
        back = '<g class="shop-six-twinkle" stroke="#c6faff" stroke-width="1.4"><path d="M9 49h12m-6-6v12m-4-10 8 8m0-8-8 8M104 91h12m-6-6v12m-4-10 8 8m0-8-8 8"/></g>';
      } else if (key === 'sugar') {
        trim = Array.from({length:90},(_,i)=>{const x=23+i*17%74,y=31+i*29%74;return `<path d="m${x} ${y} 1.7-1 1 1.7-1.7 1Z" fill="${i%3?'#fff':'#cfc1d9'}" opacity="${i%3?'.75':'.45'}"/>`;}).join('') + '<path d="M25 48V34h58M95 87v15H36" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>';
      } else {
        back = '<g class="shop-bulb-glow" fill="none" stroke="#ffdd79" stroke-width="2.5" stroke-linecap="round"><path d="M60 15V5M25 25l-7-8M95 25l7-8M8 60H0m112 0h8M13 94l-7 6m101-6 7 6"/></g>';
        trim = '<path d="M31 52q3-13 17-17" fill="none" stroke="#fffef3" stroke-width="3.5" stroke-linecap="round"/><path d="M48 99 43 87m29 12 5-12" stroke="#dda745" stroke-width="1.5"/><path d="M39 101h42v17q-21 9-42 0Z" fill="#8797b2" stroke="#d6e2f0" stroke-width="1.3"/><path d="m40 105 40-3m-40 9 40-3m-40 9 40-3" stroke="#dce8ef" stroke-width="2"/><path d="M49 122h22q-11 12-22 0Z" fill="#45546e"/>';
      }
      return { sideOffset: ['ice','sugar'].includes(key)?7:0, shadowOffset: ['ice','sugar'].includes(key)?11:0, sideColor: palette[2], shadowColor: palette[2],
        back, detail: `<defs><radialGradient id="${id('everyday-gloss')}" cx=".28" cy=".2" r=".95"><stop stop-color="${palette[0]}"/><stop offset=".55" stop-color="${palette[1]}"/><stop offset="1" stop-color="${palette[2]}"/></radialGradient></defs><g fill="${url('everyday-gloss')}">${item.body}</g>${trim}`,
      };
    }
    if (item.id === 'shop_rainbow_crayon') {
      const colors = ['#ff527e','#ff9c35','#ffe653','#65e892','#47d6f5','#8b85ff','#da81ed'];
      const stops = colors.map((color,i)=>`<stop offset="${i/6}" stop-color="${color}"/>`).join('');
      return { sideOffset: 6, shadowOffset: 10, sideColor: '#70529c', shadowColor: '#32294b',
        detail: `<defs><linearGradient id="${id('crayon-rainbow')}" x1="0" y1="0" x2="1" y2=".15">${stops}</linearGradient><linearGradient id="${id('crayon-shade')}" x2="1" y2="0"><stop stop-color="#fff" stop-opacity=".4"/><stop offset=".22" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#30204f" stop-opacity="0"/><stop offset="1" stop-color="#30204f" stop-opacity=".3"/></linearGradient>${clip}</defs>` +
          `<g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('crayon-rainbow')}"/><rect x="20" y="28" width="80" height="80" fill="${url('crayon-shade')}"/><path d="M20 34h80v10H20Zm0 56h80v10H20Z" fill="#42325e"/>` +
          '<path d="m23 39 6-2 6 2 6-2 6 2 6-2 6 2 6-2 6 2 6-2 6 2 6-2 6 2M24 95h72" fill="none" stroke="#f9dcff" stroke-width="1.2" opacity=".8"/><path d="M26 49v35M94 49v35" stroke="#fff" stroke-width="1.2" opacity=".5"/></g>' +
          `<path d="M20 28 55-8q5-5 10 0l35 36Z" fill="${url('crayon-rainbow')}" stroke="#fce0ff" stroke-width="1.2" stroke-linejoin="round"/><path d="M60-11 100 28H73Z" fill="#59376a" opacity=".2"/><path d="M26 25 56-5" stroke="#fff5db" stroke-width="2" stroke-linecap="round" opacity=".8"/><path d="M23 29h74" stroke="#fff4cf" stroke-width="1.6"/>` +
          [[13,39],[107,59],[10,93]].map(([x,y],i)=>`<g class="rainbow-crayon-sparkle" style="animation-delay:${-i*.7}s"><path d="m${x} ${y-4} 1.5 2.5 2.5 1.5-2.5 1.5-1.5 2.5-1.5-2.5-2.5-1.5 2.5-1.5Z" fill="${colors[i*2]}"/></g>`).join(''),
      };
    }
    if (item.id === 'party') {
      const colors = ['#ff81bc', '#ffe59b', '#8affd9', '#86ddff', '#c7a4ff'];
      const star = (x,y,r=3) => `M${x} ${y-r} ${x+r*.3} ${y-r*.3} ${x+r} ${y} ${x+r*.3} ${y+r*.3} ${x} ${y+r} ${x-r*.3} ${y+r*.3} ${x-r} ${y} ${x-r*.3} ${y-r*.3}Z`;
      const defs = `<defs>
        <linearGradient id="${id('party-shell')}" x2=".85" y2="1"><stop stop-color="#edc7ff"/><stop offset=".18" stop-color="#a977e4"/><stop offset=".48" stop-color="#624099"/><stop offset=".75" stop-color="#372958"/><stop offset="1" stop-color="#a768af"/></linearGradient>
        <linearGradient id="${id('party-gold')}" x2=".8" y2="1"><stop stop-color="#fff9d9"/><stop offset=".22" stop-color="#ffe49c"/><stop offset=".48" stop-color="#be792d"/><stop offset=".65" stop-color="#ffdf8a"/><stop offset="1" stop-color="#8a502d"/></linearGradient>
        <linearGradient id="${id('party-ribbon')}" x2="1" y2=".3"><stop stop-color="#62d4ee"/><stop offset=".3" stop-color="#b6a0ff"/><stop offset=".62" stop-color="#ff9bd1"/><stop offset="1" stop-color="#a465d1"/></linearGradient>
        <radialGradient id="${id('party-aura')}"><stop stop-color="#bd83ff" stop-opacity=".32"/><stop offset=".6" stop-color="#7844bb" stop-opacity=".18"/><stop offset="1" stop-color="#7844bb" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id('party-glass')}"><stop stop-color="#ffffff" stop-opacity="0"/><stop offset=".48" stop-color="#fff5de" stop-opacity=".6"/><stop offset=".53" stop-color="#d2f8ff" stop-opacity=".18"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
        <clipPath id="${id('party-body')}">${item.body}</clipPath>
        <clipPath id="${id('party-hat-clip')}"><path d="M34 31 58-18Q60-22 62-18L86 31Q60 42 34 31Z"/></clipPath>
      </defs>`;
      const fireworks = [[7,16,-1.2],[113,5,-5.2]].map(([x,y,delay],index) => {
        const rays = Array.from({length:10},(_,i) => {
          const angle = i*Math.PI/5;
          const x1=(Math.cos(angle)*8).toFixed(2), y1=(Math.sin(angle)*8).toFixed(2);
          const x2=(Math.cos(angle)*16).toFixed(2), y2=(Math.sin(angle)*16).toFixed(2);
          return `<path d="M${x1} ${y1} ${x2} ${y2}" stroke="${colors[(i+index)%5]}"/><circle cx="${x2}" cy="${y2}" r=".8" fill="#fff4cf" stroke="none"/>`;
        }).join('');
        return `<g transform="translate(${x} ${y})"><g class="party-firework" style="animation-delay:${delay}s" fill="none" stroke-width="1.2" stroke-linecap="round">${rays}<path d="${star(0,0,3)}" fill="#fff3bd" stroke="none"/></g></g>`;
      }).join('');
      const confetti = Array.from({length:28},(_,i) => {
        const side = i%2 ? 1 : -1, x=60+side*(49+i%4*3), y=62-(i%7)*9;
        const shape = i%4 === 0 ? `<path d="${star(0,0,2.5)}"/>`
          : i%4 === 1 ? '<path d="M-2-3Q3-2 1 0T2 4" fill="none" stroke="currentColor" stroke-width="1.5"/>'
          : '<path d="M-1.5-2.5h3v5h-3Z"/>';
        return `<g transform="translate(${x} ${y})"><g class="party-confetti" style="--party-drift:${side*(4+i%4)}px;--party-twist:${side*(100+i*13)}deg;animation-delay:${-i*.31}s;color:${colors[i%5]}" fill="currentColor">${shape}</g></g>`;
      }).join('');
      const ribbons = [-1,1].map(side => `<g transform="translate(${side<0?16:104} 65) scale(${side} 1)"><g class="party-ribbon"><path d="M0 0C20-10 29 9 12 16S-1 38 18 43" fill="none" stroke="${url('party-gold')}" stroke-width="4"/><path d="M0-1C20-11 29 8 12 15S-1 37 18 42" fill="none" stroke="#fff0bd" stroke-width=".7"/><path d="M7-12C25-22 31-3 18 1S15 20 28 21" fill="none" stroke="${url('party-ribbon')}" stroke-width="2.5"/></g></g>`).join('');
      const poppers = [-1,1].map(side => `<g transform="translate(${side<0?9:111} 81) rotate(${side*24})"><g class="party-popper" style="animation-delay:${side<0?0:-4}s"><path d="M-7-10 7-10 4 10H-4Z" fill="${url('party-gold')}" stroke="#ffe7ab" stroke-width=".8"/><path d="M-6-5H6L5 0H-5ZM-4 5H4L3 9H-3Z" fill="${url('party-ribbon')}"/><ellipse cy="-10" rx="7" ry="2.5" fill="#352547" stroke="#ffdc8b" stroke-width="1.2"/><path d="M0-15V-24m-5 12-5-8m15 8 5-8" fill="none" stroke="#ffe6ac" stroke-width="1.3" class="party-popper-flash"/></g></g>`).join('');
      const gems = Array.from({length:9},(_,i) => `<path d="M${27+i*8} 34l2-2 2 2-2 2Z" fill="${colors[i%5]}" stroke="#fff4ce" stroke-width=".45"/>`).join('');
      const sequins = Array.from({length:18},(_,i) => {
        const x=i%2?94:26, y=44+Math.floor(i/2)*6;
        return `<path class="party-sparkle" style="animation-delay:${-i*.37}s" d="${star(x,y,i%3===0?2:1)}" fill="${colors[i%5]}"/>`;
      }).join('');
      return {
        sideColor: '#654086', shadowColor: '#251b3d',
        eyeHighlights: '<path d="M38 51h4v7h-4m58-7h4v7h-4" fill="#fff" opacity=".9"/>',
        back: defs + `<ellipse class="party-aura" cx="60" cy="62" rx="71" ry="75" fill="${url('party-aura')}"/>`
          + `<g class="party-orbit"><ellipse cx="60" cy="68" rx="59" ry="49" fill="none" stroke="#c19aee" stroke-width=".6" stroke-dasharray="1 7"/><path d="${star(1,68,3)}${star(119,68,3)}" fill="#ffe6a1"/></g>`
          + fireworks + ribbons + confetti,
        detail: `<g fill="${url('party-shell')}">${item.body}</g>`
          + `<g clip-path="${url('party-body')}"><path d="M20 28 74 28 20 90ZM100 28V108H64Z" fill="#e2b7ff" opacity=".1"/><path d="M20 28 46 47 100 28M20 108 41 86 100 108" fill="none" stroke="#e9bfff" stroke-width=".7" opacity=".35"/><g class="party-sheen"><path d="M-25 20H-4L64 115H43Z" fill="${url('party-glass')}"/></g></g>`
          + `<path d="M23 48V34q0-3 3-3h68q3 0 3 3v14M23 88v14q0 3 3 3h68q3 0 3-3V88" fill="none" stroke="${url('party-gold')}" stroke-width="2"/><path d="M27 46V37h19m47 57v7H74" fill="none" stroke="#fff3cf" stroke-width=".8"/>${sequins}`
          + `<path d="M21 92 36 86 60 103 84 86 99 92v14H21Z" fill="#281f46"/><path d="M23 92 36 88l18 15-20-6Zm74 0-13-4-18 15 20-6Z" fill="${url('party-gold')}"/><g class="party-bow"><path d="M60 99 47 92q-3 7 0 14l13-5 13 5q3-7 0-14Z" fill="${url('party-ribbon')}" stroke="#ffcced" stroke-width=".8"/><path d="m60 97 4 3-4 4-4-4Z" fill="${url('party-gold')}"/><path d="M49 95l7 4m15-4-7 4" stroke="#fff1da" stroke-width=".7"/></g>`
          + `<g class="party-edge-glow" fill="none" stroke="${url('party-gold')}" stroke-width="1.1" opacity=".8">${item.body}</g>`
          + `<g class="party-hat"><path d="M34 31 58-18Q60-22 62-18L86 31Q60 42 34 31Z" fill="${url('party-ribbon')}" stroke="${url('party-gold')}" stroke-width="1.4"/><g clip-path="${url('party-hat-clip')}"><path d="M29 21Q65 40 88 14M37 5Q62 23 79 1M47-10Q60 3 71-12" fill="none" stroke="${url('party-gold')}" stroke-width="5"/><path d="M37 29 59-17 61-14 47 32Z" fill="#fff" opacity=".25"/><g class="party-hat-shine"><path d="M20-25h8l51 65h-8Z" fill="#fff7db" opacity=".5"/></g></g><ellipse cx="60" cy="32" rx="27" ry="5" fill="${url('party-gold')}"/><path d="M34 32Q60 39 86 32" fill="none" stroke="#fff5cb" stroke-width="1"/>${gems}<g transform="translate(60 -20)"><g class="party-topper"><path d="M0-9 3-3 9 0 3 3 0 9-3 3-9 0-3-3Z" fill="${url('party-gold')}" stroke="#fff4c8" stroke-width=".8"/><path d="M0-9V9M-9 0H9" stroke="#fff4c8" stroke-width=".6"/><circle r="2" fill="#fff8e1"/></g></g></g>`
          + poppers + [[30,39],[90,42],[28,90],[92,87]].map(([x,y],i)=>`<path class="party-sparkle" style="animation-delay:${-i*1.3}s" d="${star(x,y,3)}" fill="#fff3cf"/>`).join(''),
      };
    }
    if (item.id === 'shop_balloon') return {
      sideOffset: 0, shadowOffset: 0, sideColor: '#cf4a81', shadowColor: '#cf4a81',
      detail: `<defs><radialGradient id="${id('balloon-gloss')}" cx=".32" cy=".24" r=".85"><stop stop-color="#ffb4d3"/><stop offset=".48" stop-color="#f576a4"/><stop offset="1" stop-color="#c73773"/></radialGradient></defs><g fill="${url('balloon-gloss')}">${item.body}</g>` +
        '<path d="M31 53q3-14 17-16" fill="none" stroke="#fff0f7" stroke-width="4" stroke-linecap="round" opacity=".85"/><ellipse cx="29" cy="62" rx="2" ry="3" fill="#fff0f7" opacity=".65"/>' + item.detail,
    };
    if (item.id === 'shop_loco') {
      const spiral = Array.from({length:97}, (_,i) => {
        const angle = i / 96 * Math.PI * 4.5;
        const radius = 1 + i / 96 * 15;
        return `${i ? 'L' : 'M'}${(Math.cos(angle)*radius).toFixed(2)} ${(Math.sin(angle)*radius).toFixed(2)}`;
      }).join(' ');
      return { eyes: '<g class="cubie-eyes">' + [43.5,101.5].map(x =>
        `<g transform="translate(${x} 61)"><path d="${spiral}" fill="none" stroke="#ffe82f" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('') + '</g>' };
    }
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
    if (item.id === 'attack_core_event_lattice') {
      const rails = 'M27 41V35h66v66H27V41';
      const nodes = [27,40,53,67,80,93].flatMap((x,i) => [35,101].map((y,j) =>
        `<g class="cubie-motion lattice-node" style="animation-delay:${-(i+j*3)*.24}s"><circle cx="${x}" cy="${y}" r="3.6" fill="#62eaff" opacity=".22"/><rect x="${x-1.5}" y="${y-1.5}" width="3" height="3" rx=".5" fill="#d3fff6"/></g>`)).join('');
      const tiles = [[5,51,-.2],[105,73,-1.1]].map(([x,y,delay]) =>
        `<g transform="translate(${x} ${y})"><g class="cubie-motion lattice-tile" style="animation-delay:${delay}s"><path d="M0 0h12v12H0Z" fill="#254f79" stroke="#8affed" stroke-width="1.2"/><path d="M3 3h6v6H3Z" fill="#70dedf"/><path d="M0 0 3 3m9-3-3 3M0 12l3-3m9 3-3-3" stroke="#b5fff1" stroke-width=".7"/></g></g>`).join('');
      return { faceColor: '#effff6', sideColor: '#53537f', shadowColor: '#282b4c',
        detail: `<defs>${clip}<linearGradient id="${id('lattice-shell')}" x2=".8" y2="1"><stop stop-color="#bd9de0"/><stop offset=".35" stop-color="#8665b3"/><stop offset="1" stop-color="#444a80"/></linearGradient><linearGradient id="${id('lattice-scan')}" x2="0" y2="1"><stop stop-color="#82ffee" stop-opacity="0"/><stop offset=".85" stop-color="#82ffee" stop-opacity=".12"/><stop offset="1" stop-color="#bffff6" stop-opacity=".4"/></linearGradient></defs><g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('lattice-shell')}"/>` +
          `<path d="M28 43H92M28 55H92M28 67H92M28 79H92M28 91H92M39 36V100M51 36V100M63 36V100M75 36V100M87 36V100" fill="none" stroke="#a9d9ef" stroke-width=".6" opacity=".22"/><g class="cubie-motion lattice-scan"><rect x="24" y="15" width="72" height="18" fill="${url('lattice-scan')}"/><path d="M24 33H96" stroke="#b5fff1" stroke-width="1" opacity=".6"/></g><path d="${rails}" fill="none" stroke="#384c72" stroke-width="4" stroke-linejoin="round"/><path d="${rails}" fill="none" stroke="#8fcbe8" stroke-width="1.2"/><path class="cubie-motion lattice-current" d="${rails}" pathLength="100" fill="none" stroke="#b5fff1" stroke-width="2.2" stroke-dasharray="5 20" stroke-linecap="round"/>${nodes}<path d="M24 47V40q0-8 8-8h48M96 87v9q0 8-8 8H43" fill="none" stroke="#e6d8ff" stroke-width="1.2" opacity=".8"/></g>${tiles}` };
    }
    if (item.id === 'shop_arcade_cabinet') {
      return { sideOffset: 7, shadowOffset: 11, sideColor: '#4f345e', shadowColor: '#242338', faceColor: '#b9ffe7',
        detail: `<defs><linearGradient id="${id('cabinet-shell')}" x2="1" y2=".7"><stop stop-color="#ef93bc"/><stop offset=".24" stop-color="#b9568b"/><stop offset=".72" stop-color="#813f78"/><stop offset="1" stop-color="#452e58"/></linearGradient><linearGradient id="${id('cabinet-screen')}" x2=".6" y2="1"><stop stop-color="#244859"/><stop offset=".4" stop-color="#153242"/><stop offset="1" stop-color="#091e30"/></linearGradient><linearGradient id="${id('cabinet-deck')}" x2="0" y2="1"><stop stop-color="#7790b3"/><stop offset=".24" stop-color="#414e79"/><stop offset="1" stop-color="#202b4b"/></linearGradient><radialGradient id="${id('cabinet-button')}" cx=".3" cy=".2"><stop stop-color="#fff3bf"/><stop offset=".4" stop-color="#ffd56f"/><stop offset="1" stop-color="#b97131"/></radialGradient><clipPath id="${id('cabinet-screen-clip')}"><rect x="26" y="47" width="68" height="54" rx="7"/></clipPath></defs>` +
          `<g fill="${url('cabinet-shell')}">${item.body}</g><path d="M20 98V34l6-11h68M14 113v15h34" fill="none" stroke="#ffc7df" stroke-width="1.2" stroke-linecap="round"/><path d="M101 37v63M106 116v13H76" stroke="#301e42" stroke-width="2"/>` +
          `<path d="M24 23h72l4 16H20Z" fill="#1d2b46" stroke="#efb6cd" stroke-width="1.1"/><path d="M28 26h64l2 10H26Z" fill="#38556b"/><text x="60" y="34" text-anchor="middle" fill="#fff0b4" font-family="monospace" font-size="8" font-weight="bold" letter-spacing="2">CUBIE</text><path d="M32 25h56" stroke="#8effe5" stroke-width=".8"/>` +
          `<rect x="21" y="42" width="78" height="64" rx="9" fill="#192339" stroke="#f6b3d3" stroke-width="1"/><rect x="24" y="45" width="72" height="58" rx="8" fill="#528b9c"/><rect x="26" y="47" width="68" height="54" rx="7" fill="${url('cabinet-screen')}"/><g clip-path="${url('cabinet-screen-clip')}">` +
          Array.from({length:18},(_,i)=>`<path d="M26 ${49+i*3}H94" stroke="#b5ffe9" stroke-width=".35" opacity=".09"/>`).join('') +
          `<path d="M28 49H51L29 79Z" fill="#d6ffff" opacity=".07"/><path class="cubie-motion cabinet-scan" d="M26 48H94" stroke="#b1ffe5" stroke-width="1.5" opacity=".16"/></g><path d="M29 62v-8q0-4 4-4h12M91 89v5q0 4-4 4H77" fill="none" stroke="#8fcaca" stroke-width=".8" opacity=".7"/>` +
          `<path d="M16 106H104L110 116H10Z" fill="${url('cabinet-deck')}" stroke="#aeb5d5" stroke-width=".9"/><path d="M12 116h96v6H12Z" fill="#1e2847"/><path d="M15 117h90" stroke="#7de9da" stroke-width="1.2"/><ellipse cx="36" cy="112" rx="9" ry="2.7" fill="#17243c"/><g class="cubie-motion motion-sway" style="transform-origin:36px 112px;animation-duration:2.4s"><path d="M36 111v-8" stroke="#b7d9e7" stroke-width="2.5"/><circle cx="36" cy="102" r="4.5" fill="#64dbc8" stroke="#1b756f" stroke-width=".8"/><path d="M33 101q1-3 4-2" fill="none" stroke="#ddfff0" stroke-width="1.2" stroke-linecap="round"/></g>` +
          [70,84].map((x,i)=>`<ellipse cx="${x}" cy="112" rx="5" ry="3" fill="#152139"/><ellipse cx="${x}" cy="110.5" rx="4" ry="2.5" fill="${i?'#ec80ab':url('cabinet-button')}" stroke="${i?'#ffc7e3':'#fff1b4'}" stroke-width=".6"/>`).join('') +
          `<rect x="45" y="124" width="30" height="6" rx="1.4" fill="#18263e" stroke="#d79bbd" stroke-width=".7"/><path d="M51 127h11" stroke="#a9c1cf" stroke-width="1.4"/><circle class="cubie-motion motion-energy" cx="69" cy="127" r="1.4" fill="#a0ffe0"/><path d="M19 124h17m-17 3h17m48-3h17m-17 3h17" stroke="#583052" stroke-width="1"/>` };
    }
    if (item.id === 'shop_cloud' || item.id === 'shop_storm') {
      const storm = item.id === 'shop_storm';
      return { sideOffset: 3, shadowOffset: 6, sideColor: storm ? '#657899' : '#a8cce6', shadowColor: storm ? '#3c4964' : '#7299b7',
        detail: `<defs><linearGradient id="${id('cloud-body')}" x2=".2" y2="1"><stop stop-color="${storm ? '#c9d2ec' : '#fff'}"/><stop offset=".45" stop-color="${storm ? '#a0afce' : '#f0faff'}"/><stop offset="1" stop-color="${storm ? '#7183a7' : '#bfdff3'}"/></linearGradient></defs><g fill="${url('cloud-body')}">${item.body}</g>${item.detail}` };
    }
    if (item.id === 'bookworm') {
      return { sideOffset: 0, shadowOffset: 0, sideColor: 'transparent', shadowColor: 'transparent',
        back: `<g transform="translate(0 7)" fill="#795237">${item.body}</g><g transform="translate(0 3.5)" fill="#e6c38f">${item.body}</g><path d="M15 102v7m45-3v7m45-11v7" fill="none" stroke="#a87952" stroke-width="1"/>`,
        detail: item.detail };
    }
    if (item.id === 'chocolate') {
      const wrapperStart = item.detail.indexOf('<path d="M19 88');
      return { sideOffset: 5, shadowOffset: 9, sideColor: '#442518', shadowColor: '#2e1a13',
        detail: `<defs>${clip}</defs><g clip-path="${url('body')}">${item.detail.slice(0, wrapperStart)}</g><path d="M70 28Q67 39 79 39Q75 51 88 50Q87 61 100 59" fill="none" stroke="#b78053" stroke-width="1.5" stroke-linecap="round"/>${item.detail.slice(wrapperStart)}` };
    }
    if (item.id === 'shop_koi') {
      const fin = `<path d="M29 58Q7 52-2 77Q9 88 30 75Z" fill="#f2d1ad" stroke="#ba9c7d" stroke-width="1.1"/><path d="M27 62 3 77M27 66 8 81M27 70l-12 12" fill="none" stroke="#fff4dc" stroke-width="1"/>`;
      return { sideOffset: 2, shadowOffset: 4, sideColor: '#c7bd9b', shadowColor: '#807e69',
        back: `<g class="cubie-motion koi-fin" style="transform-origin:28px 65px">${fin}</g><g transform="translate(120 0) scale(-1 1)"><g class="cubie-motion koi-fin" style="transform-origin:28px 65px;animation-delay:-.7s">${fin}</g></g><g class="cubie-motion koi-tail" style="transform-origin:60px 103px"><path d="M53 101Q45 115 33 125L34 140 60 125 86 140 87 125Q75 115 67 101Z" fill="#f3d6b7" stroke="#bc9d7c" stroke-width="1.2"/><path d="M55 109 39 132M59 113l-7 15M65 109l16 23M61 113l7 15" stroke="#fff8e8" stroke-width="1.2"/><path d="M53 101h14l7 12-14 7-14-7Z" fill="#e67b4b"/></g>`,
        detail: `<defs>${clip}<linearGradient id="${id('koi-pearl')}" x2="1" y2=".2"><stop stop-color="#c8c1a5"/><stop offset=".35" stop-color="#fff9e5"/><stop offset=".7" stop-color="#f0e8cc"/><stop offset="1" stop-color="#c4b89a"/></linearGradient></defs><g clip-path="${url('body')}"><path d="M15 25h90v88H15Z" fill="${url('koi-pearl')}"/><path d="M34 29Q56 19 80 34L73 46Q58 52 43 42Z" fill="#e66a3c"/><path d="M18 57Q32 48 43 61L38 80 24 82Z" fill="#ed8051"/><path d="M83 64Q103 60 102 83L85 97 74 84Z" fill="#e56338"/><path d="M45 94Q56 87 67 98L71 113H49Z" fill="#ed7b43"/><path d="M29 41 38 38 44 46 34 51ZM82 53l14-6 5 12-10 8ZM31 84l12-4 6 10-8 6Z" fill="#394b50"/><path d="M28 60Q24 42 43 34M85 40q10 12 7 23" fill="none" stroke="#fffdf0" stroke-width="1.5"/><path d="M49 54q10-5 20 0M47 61q12-5 24 0M47 68q13-5 26 0" fill="none" stroke="#b8ab8a" stroke-width=".6" opacity=".4"/></g><path d="M34 39Q20 28 16 37M86 39q14-11 18-2" fill="none" stroke="#e7d5af" stroke-width="1.8" stroke-linecap="round"/>` };
    }
    if (item.id === 'merciful') {
      return { sideColor: '#bd709c', faceColor: '#8e4169',
        eyes: '<g class="cubie-eyes" fill="none" stroke="#8e4169" stroke-width="6" stroke-linecap="round"><path d="M34 63q10-17 20 0M92 63q10-17 20 0"/></g>',
        detail: `<defs>${clip}<linearGradient id="${id('mercy')}" x2=".6" y2="1"><stop stop-color="#ffe8f3"/><stop offset=".5" stop-color="#f4b0d0"/><stop offset="1" stop-color="#d97faf"/></linearGradient></defs><g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('mercy')}"/><path d="M25 52V42q0-9 10-9h43" fill="none" stroke="#fff6f9" stroke-width="2"/><ellipse cx="30" cy="77" rx="8" ry="4" fill="#e97cab"/><ellipse cx="90" cy="77" rx="8" ry="4" fill="#e97cab"/><path d="M21 99q39-15 78 0v10H21Z" fill="#fff0e5"/></g>` +
          motion('<path d="M60 26C29 9 44-8 60 6 76-8 91 9 60 26Z" fill="#f28bb6" stroke="#ffe5ef" stroke-width="2"/><path d="M46 7q4-5 8-1" fill="none" stroke="#fff6f9" stroke-width="2" stroke-linecap="round"/>', 'motion-heart', '60px 12px') +
          '<path d="M58 99 41 91v16l17-5m4-3 17-8v16l-17-5" fill="#d883b2"/><circle cx="60" cy="101" r="4" fill="#ffe4ed"/>',
        back: motion('<path d="M22 76Q0 65 4 47q15 1 23 17M98 76q22-11 18-29-15 1-23 17" fill="#fff2ec" stroke="#efbfce" stroke-width="1.5"/>', 'motion-wing') };
    }
    if (item.id === 'speedrunner') {
      return { sideColor: '#287f91',
        back: motion('<path d="M15 53H-9m24 13H-1m15 14H-5" stroke="#b7f6f2" stroke-width="3" stroke-linecap="round"/>', 'motion-thrust'),
        detail: `<defs>${clip}<linearGradient id="${id('runner')}" x2=".8" y2="1"><stop stop-color="#bbffef"/><stop offset=".45" stop-color="#55c5d2"/><stop offset="1" stop-color="#277998"/></linearGradient></defs><g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('runner')}"/><path d="m85 29-14 22h10l-8 24 23-34H85l9-12Z" fill="#fff0aa"/><path d="M20 93h80v15H20Z" fill="#effaf1"/>${Array.from({length:8},(_,i)=>`<path d="M${20+i*10} ${i%2?100:93}h10v8h-10Z" fill="#255769"/>`).join('')}</g><path d="M19 38q41-10 82 0v7q-41-10-82 0Z" fill="#f6dc80"/><path d="m98 40 20 3-8 8 12 7-24-9" fill="#e5a858"/>` +
          '<rect x="54" y="-1" width="12" height="6" rx="2" fill="#f3d487"/><circle cx="60" cy="17" r="15" fill="#e7d394" stroke="#fff5ca" stroke-width="2"/><circle cx="60" cy="17" r="11" fill="#18485a"/><path d="M60 8v3m-9 6h3m15 0h-3m-6 9v-3" stroke="#b9f5eb" stroke-width="1.5"/>' +
          motion('<path d="M60 17v-7" stroke="#fff0a3" stroke-width="2" stroke-linecap="round"/>', 'motion-spin', '60px 17px', 'animation-duration:3s') + '<circle cx="60" cy="17" r="2" fill="#fff0a3"/>' };
    }
    if (item.id === 'golden_hand') {
      return { sideColor: '#a27422', shadowColor: '#342919',
        eyes: '<g class="cubie-eyes" fill="#694813"><path d="M58 99v10h7V99Zm27 0v10h7V99Z"/></g>',
        mouth: '<path class="cubie-smile" d="M67 118v5h17v-5" fill="none" stroke="#694813" stroke-width="4" stroke-linejoin="round"/>',
        detail: `<defs>${clip}<linearGradient id="${id('hand-gold')}" x2=".9" y2=".5"><stop stop-color="#8e5b15"/><stop offset=".17" stop-color="#f4cc66"/><stop offset=".36" stop-color="#fff3bb"/><stop offset=".55" stop-color="#dba83a"/><stop offset=".78" stop-color="#fff1a5"/><stop offset="1" stop-color="#b68020"/></linearGradient></defs><g clip-path="${url('body')}"><rect x="0" y="-4" width="115" height="120" fill="${url('hand-gold')}"/><path d="M39 65V21q0-8 5-8m15 42V11q0-7 5-7m15 57V22q0-7 5-7m14 55V39q0-6 5-6M26 75 15 58" fill="none" stroke="#fff6c6" stroke-width="2" stroke-linecap="round"/><path d="M34 71q16-8 21 8m-14 9q19-13 44-5M46 96q12-8 32-5M53 48h-9m28-5h-9m28 9h-8m26 11h-8" fill="none" stroke="#a77524" stroke-width="1.3" opacity=".8"/><path d="M34 103h62v12H34Z" fill="#805522"/><path d="M35 104h60v6H35Z" fill="#f8d573"/><path d="m64 102 6 5-6 5-6-5Z" fill="#f795d9" stroke="#fff2c2"/></g>${sparkle(43,12,-.4,3)}${sparkle(84,76,-1.8,3)}` };
    }
    if (item.id === 'prismatic') {
      const outline = 'M35 28h50l15 15v50l-15 15H35L20 93V43Z';
      const inset = 'M38 35h44l11 11v44l-11 11H38L27 90V46Z';
      const facets = ['M35 28h50l-3 7H38Z', 'M85 28l15 15-7 3-11-11Z',
        'M100 43v50l-7-3V46Z', 'M100 93l-15 15-3-7 11-11Z',
        'M85 108H35l3-7h44Z', 'M35 108 20 93l7-3 11 11Z',
        'M20 93V43l7 3v44Z', 'M20 43l15-15 3 7-11 11Z'];
      const spectrum = ['#ff245b','#ff8a00','#ffec00','#24ff83','#00dfff','#5850ff','#ed35ff'];
      return { sideColor: 'transparent', shadowColor: 'transparent', sideOffset: 0, shadowOffset: 0,
        eyes: `<g class="cubie-eyes" fill="${url('prism-face')}" stroke="#f1fdff" stroke-width="1.15"><path d="m38 48 11 0 3 4v18l-3 4H38l-3-4V52Z"/><path d="m96 48 11 0 3 4v18l-3 4H96l-3-4V52Z"/><path d="M38 54v15m58-15v15" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M42 51h6m52 0h6" stroke="#a9eaff" stroke-width=".7"/></g>`,
        mouth: `<path class="cubie-smile" d="M52 90h9v7h23v-7h9v14H52Z" fill="${url('prism-face')}" stroke="#f1fdff" stroke-width="1.1"/>`,
        back: `<g transform="translate(6 7)" fill="none" stroke="#a9d9f3" stroke-width=".6" opacity=".25"><path d="${outline}"/><path d="M35 28 85 108M85 28 35 108" stroke-dasharray="1 4" opacity=".35"/></g>`,
        detail: `<defs>${clip}<linearGradient id="${id('prism-glass')}" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".12"/><stop offset=".25" stop-color="#d8f5ff" stop-opacity=".01"/><stop offset=".7" stop-color="#cde3ff" stop-opacity=".015"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><linearGradient id="${id('prism-face')}" x2="1" y2=".4"><stop stop-color="#fff" stop-opacity=".65"/><stop offset=".23" stop-color="#c5edff" stop-opacity=".06"/><stop offset=".72" stop-color="#d7dcff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient><linearGradient id="${id('prism-bevel')}" x2=".8" y2="1"><stop stop-color="#fff" stop-opacity=".65"/><stop offset=".2" stop-color="#c5efff" stop-opacity=".14"/><stop offset=".48" stop-color="#aaa5ff" stop-opacity=".04"/><stop offset=".75" stop-color="#d5faff" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity=".7"/></linearGradient><linearGradient id="${id('prism-spectrum')}" x2="1" y2="0">${spectrum.map((c,i)=>`<stop offset="${i/6}" stop-color="${c}" stop-opacity="1"/>`).join('')}</linearGradient></defs>` +
          `<g clip-path="${url('body')}"><path d="${outline}" fill="${url('prism-glass')}"/>${facets.map((d,i)=>`<path d="${d}" fill="${url('prism-bevel')}" opacity="${i%3 ? '.65' : '.95'}" stroke="#d6f5ff" stroke-opacity=".35" stroke-width=".4"/>`).join('')}<path d="${inset}" fill="none" stroke="${url('prism-spectrum')}" stroke-width="1.8"/><path d="M29 48 40 37h40M91 86l-11 13H40" fill="none" stroke="#fff" stroke-width=".65" opacity=".75"/><path d="M30 46 41 36 88 90 79 99Z" fill="#e7faff" opacity=".025"/><g class="prismatic-shine"><path d="M-63 20h7L44 120h-7Z" fill="${url('prism-spectrum')}" opacity=".8"/><path d="M-54 20h1.2L47 120h-1.2Z" fill="#fff" opacity=".65"/><path d="M-49 20h2L53 120h-2Z" fill="#c2eaff" opacity=".18"/></g><g transform="translate(120 136) scale(-1 -1)"><g class="prismatic-shine prismatic-reflection"><path d="M-65 20h4L39 120h-4Z" fill="${url('prism-spectrum')}" opacity=".65"/></g></g></g>` +
          `<path d="${outline}" fill="none" stroke="${url('prism-spectrum')}" stroke-width="2.8" opacity=".95"/><path d="${outline}" fill="none" stroke="#f3fdff" stroke-width=".8"/><path d="M35 29h49l14 14M21 46v44l14 16M87 105l11-12V78" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><path d="M35 28 41 35M85 28l-3 7M100 93l-7-3M35 108l3-7" stroke="#fff" stroke-width=".8"/>${sparkle(35,28,-.3,3.5)}${sparkle(99,92,-2,2.7)}${sparkle(85,29,-1.1,1.7)}${sparkle(28,93,-3.1,1.5)}` };
    }
    if (item.id === 'shop_sprout') {
      const leaves = item.detail.slice(item.detail.indexOf('<g'));
      return { detail: leaves + `<defs><linearGradient id="${id('sprout-clay')}" x2="1" y2=".3"><stop stop-color="#ac634b"/><stop offset=".35" stop-color="#e3a37b"/><stop offset="1" stop-color="#a9634a"/></linearGradient></defs>` +
        `<path d="M20 94H108L102 124Q101 130 94 130H34Q27 130 26 124Z" fill="${url('sprout-clay')}" stroke="#955640" stroke-width="1.4"/>` +
        '<path d="M31 106 34 120q1 4 6 4" fill="none" stroke="#f1bc93" stroke-width="2.5" stroke-linecap="round"/>' +
        '<rect x="13" y="91" width="102" height="16" rx="7" fill="#ce8a67" stroke="#9f6048" stroke-width="1.4"/>' +
        '<ellipse cx="64" cy="93" rx="49" ry="6" fill="#edb18b"/><path d="M22 100q42 6 84 0" fill="none" stroke="#f3c5a1" stroke-width="2" stroke-linecap="round"/>' };
    }
    if (item.id === 'shop_camper') {
      return { back: `<defs><linearGradient id="${id('camp-pack')}" x2="1" y2="1"><stop stop-color="#dd955f"/><stop offset="1" stop-color="#80503e"/></linearGradient></defs>` +
        `<rect x="91" y="40" width="35" height="66" rx="12" fill="${url('camp-pack')}" stroke="#664637" stroke-width="2"/>` +
        '<path d="M99 42v61m18-60v58" stroke="#ebbc8c" stroke-width="3"/><rect x="104" y="64" width="23" height="25" rx="5" fill="#a56b49" stroke="#e4aa79"/><path d="M106 70h19" stroke="#f1c99d" stroke-width="2"/><rect x="88" y="30" width="39" height="15" rx="7" fill="#6c9c93" stroke="#426e66" stroke-width="1.5"/><path d="M99 31v13m17-13v13" stroke="#e9d9ab" stroke-width="3"/><rect x="8" y="59" width="13" height="35" rx="5" fill="#79a4a7" stroke="#446f76" stroke-width="1.5"/><path d="M11 57h7" stroke="#d8e0c5" stroke-width="4"/>',
        detail: `<defs>${clip}<linearGradient id="${id('camp-hat')}" x2=".7" y2="1"><stop stop-color="#f2d49b"/><stop offset=".55" stop-color="#c7a169"/><stop offset="1" stop-color="#a27f50"/></linearGradient></defs>` +
        `<g clip-path="${url('body')}"><path d="M20 41 34 43 38 87 47 96v12H20Zm80 0-14 2-4 44-9 9v12h27Z" fill="#65764a"/><path d="M26 45 31 86m63-41-5 41" stroke="#d6bf87" stroke-width="4"/><path d="M20 93h80v15H20Z" fill="#718051"/><rect x="24" y="96" width="21" height="10" rx="2" fill="#8e9b65" stroke="#d0ce9a"/><rect x="75" y="96" width="21" height="10" rx="2" fill="#8e9b65" stroke="#d0ce9a"/><path d="M25 99h19m32 0h19" stroke="#d6d3a4"/></g>` +
        '<path d="m29 88 20 1 11 9 11-9 20-1-16 15-15-4-15 4Z" fill="#e89b63"/><path d="m60 97-8 17 11-3 6 3-4-17" fill="#c7744d"/><rect x="56" y="96" width="9" height="8" rx="3" fill="#f4d58b"/>' +
        `<ellipse cx="60" cy="35" rx="49" ry="9" fill="#9c7e52" stroke="#e4c48b" stroke-width="1.5"/><path d="M29 32 34 12Q36 5 46 8l14 5 14-5q10-3 12 4l5 20Q60 42 29 32Z" fill="${url('camp-hat')}" stroke="#a88454" stroke-width="1.3"/>` +
        '<path d="M31 25q29 9 58 0l2 7q-31 10-62 0Z" fill="#65543e"/><rect x="54" y="27" width="13" height="8" rx="2" fill="#e6c780"/><path d="m57 32 3-3 4 3" fill="none" stroke="#74835b" stroke-width="1.5"/><path d="M40 12 59 17l20-6" fill="none" stroke="#ffe6b4" stroke-width="1.3"/>' };
    }
    if (item.id === 'shop_penguin') {
      const flipper = '<path d="M22 61Q-6 55 5 96q12-4 21-17Z" fill="#455e78" stroke="#8fa9bb" stroke-width="1.3"/>';
      return { back: '', detail: item.detail +
        motion(flipper, 'motion-paddle', '22px 62px') +
        '<g transform="translate(120 0) scale(-1 1)">' +
        motion(flipper, 'motion-paddle', '22px 62px') + '</g>' };
    }
    if (item.id === 'shop_aquarium') {
      return { detail: `<defs>${clip}<linearGradient id="${id('aquarium-water')}" x2=".7" y2="1"><stop stop-color="#bcf3ee" stop-opacity=".45"/><stop offset="1" stop-color="#3b98bc" stop-opacity=".35"/></linearGradient></defs>` +
        `<g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('aquarium-water')}"/>` +
        '<path d="M16 97C30 88 42 92 57 96S85 87 104 94v18H16Z" fill="#e7d2a6"/><path d="M22 101q19-5 37 0t38-3" fill="none" stroke="#f7e8c7" stroke-width="2" stroke-linecap="round"/>' +
        motion('<path d="M36 98Q34 85 37 70" fill="none" stroke="#3b826f" stroke-width="2.5" stroke-linecap="round"/><path d="M36 87Q23 85 27 76q10 0 9 11M37 79q13-2 12-12-11 1-12 12M37 72Q29 65 34 59q9 6 3 13M36 96q13-1 12-10-10 0-12 10" fill="#59aa83" stroke="#3b826f" stroke-width="1"/>', 'motion-sway', '36px 98px', 'animation-duration:5s') +
        motion('<g fill="#e7ffff" fill-opacity=".28" stroke="#d9fbff" stroke-width="1"><circle cx="86" cy="81" r="3.5"/><circle cx="82" cy="95" r="2"/><circle cx="88" cy="47" r="3"/></g>', 'motion-steam') +
        '<ellipse cx="49" cy="101" rx="4" ry="2" fill="#c6b78f"/><ellipse cx="76" cy="103" rx="3" ry="1.7" fill="#c6b78f"/></g>' +
        '<rect x="23" y="31" width="74" height="74" rx="11" fill="none" stroke="#d8faff" stroke-width="1.4" opacity=".8"/><path d="M28 51V43q0-7 8-7h8M86 36h3q4 0 4 6" fill="none" stroke="#efffff" stroke-width="2.5" stroke-linecap="round"/>' };
    }
    if (item.id === 'creeper') {
      const pixels = Array.from({length: 8}, (_, row) => Array.from({length: 8}, (_, col) => {
        const colors = ['#86cb64', '#58a54a', '#6fbb53', '#a4d77b', '#438b43'];
        return `<rect x="${20+col*10}" y="${28+row*10}" width="10" height="10" fill="${colors[(row*7+col*3+row*col)%5]}"/>`;
      }).join('')).join('');
      return { detail:`<defs>${clip}</defs><g clip-path="${url('body')}">${pixels}</g>`, faceColor:'#142e1a',
        eyes:'<g class="cubie-eyes" fill="#142e1a"><rect x="31" y="45" width="25" height="25"/><rect x="90" y="45" width="25" height="25"/></g>',
        mouth:'<path class="cubie-smile" d="M61 70h24v13h13v36H84v-15H62v15H48V83h13Z" fill="#142e1a"/>' };
    }
    if (item.id === 'tetris') {
      const tiles = [[20,28],[60,28],[20,68],[60,68]].map(([x,y]) =>
        `<rect x="${x+1}" y="${y+1}" width="38" height="38" rx="1" fill="#ffdb56" stroke="#bd8e20" stroke-width="1.5"/><path d="M${x+4} ${y+34}V${y+4}h30" fill="none" stroke="#fff3ae" stroke-width="3"/><path d="M${x+36} ${y+6}v30H${x+6}" fill="none" stroke="#e2aa29" stroke-width="3"/>`).join('');
      return { sideColor:'#c28e22', detail:tiles };
    }
    if (item.id === 'shop_cyber') return { sideColor:'#292546', faceColor:'#c1fff5',
      back:'<rect x="10" y="49" width="13" height="35" rx="5" fill="#243550" stroke="#77e8e2" stroke-width="1.5"/><rect x="97" y="49" width="17" height="35" rx="5" fill="#243550" stroke="#e7a0ef" stroke-width="1.5"/>',
      detail:`<defs><linearGradient id="${id('cyber-mask')}" x2="1" y2="1"><stop stop-color="#334b66"/><stop offset=".55" stop-color="#152238"/><stop offset="1" stop-color="#4b2f5c"/></linearGradient></defs><path d="M23 43Q60 24 97 43v43q0 14-37 23-37-9-37-23Z" fill="${url('cyber-mask')}" stroke="#8dd9e2" stroke-width="1.5"/>` +
        '<path d="M26 44 37 24l13 12m44 8L83 24 70 36" fill="#384a68" stroke="#cea3ef" stroke-width="1.5"/><path d="m32 40 6-9 5 6m45 3-6-9-5 6" fill="#7de9df"/><path d="M28 47v25m64-25v25" stroke="#72e8e5" stroke-width="2" stroke-linecap="round"/><path d="M30 87h10m40 0h10M33 92h7m40 0h7" stroke="#eaa4e9" stroke-width="2" stroke-linecap="round"/><path d="M51 101h18" stroke="#77d9df" stroke-width="2"/>' +
        motion('<circle cx="16" cy="58" r="2" fill="#adfff0"/><circle cx="106" cy="58" r="2" fill="#ffc2ef"/>', 'motion-energy'),
      eyes:'<g class="cubie-eyes" fill="none" stroke="#c3fff2" stroke-width="5" stroke-linecap="round"><path d="M35 63q10-16 20 0M91 63q10-16 20 0"/></g>',
      mouth:'<path class="cubie-smile" d="M59 91q13 17 26 0" fill="none" stroke="#c3fff2" stroke-width="4" stroke-linecap="round"/>' };
    if (item.id === 'shop_matrix') {
      const symbols = ['0', '1', '7', '+', '∑', '9', '⊕', '3'];
      const columns = Array.from({ length: 8 }, (_, column) => {
        const glyphs = Array.from({ length: 24 }, (_, row) => {
          const phase = row % 8;
          const color = phase === 7 ? '#bbffd0' : '#29ec78';
          return `<text x="${26 + column * 9.5}" y="${-68 + row * 12}" fill="${color}" opacity="${.2 + phase * .1}">${symbols[(phase * 3 + column * 5) % symbols.length]}</text>`;
        }).join('');
        return `<g class="matrix-code-column" style="animation-duration:${2.8 + column * .23}s;animation-delay:${-column * .63}s">${glyphs}</g>`;
      }).join('');
      return { sideColor: '#0b2116', faceColor: '#ffffff', detail:
        `<defs>${clip}</defs><g clip-path="${url('body')}" font-family="monospace" font-size="8" text-anchor="middle">${columns}</g>` +
        '<rect x="21" y="29" width="78" height="78" rx="13" fill="none" stroke="#267749" stroke-width=".8"/>' };
    }
    if (item.id === 'shop_honey') {
      const cells = Array.from({ length: 7 }, (_, row) =>
        Array.from({ length: 7 }, (_, column) => {
          const x = 11.34 + column * 17.32 + (row % 2) * 8.66;
          const y = 23 + row * 15;
          const color = ['#f6c653', '#efb438', '#f9cd65'][(row + column) % 3];
          return `<path d="M${x} ${y-10}l8.66 5v10l-8.66 5-8.66-5V${y-5}Z" fill="${color}" stroke="#b87925" stroke-width="1.6"/>`;
        }).join('')).join('');
      return { detail: `<defs>${clip}</defs><g clip-path="${url('body')}">${cells}</g>` };
    }
    if (item.id === 'forever_friend') {
      const heart = 'M0 9C-24-4-16-23 0-12C16-23 24-4 0 9Z';
      const jewel = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})"><path d="${heart}" fill="${url('friend-ruby')}" stroke="#ffe5ae" stroke-width="1.4"/><path d="M0-12-12-13-8-3 0 9 8-3 12-13Z" fill="#ffb2d5" opacity=".55"/><path d="m0-12-8 9h16Z" fill="#fff0ef" opacity=".7"/><path d="M-12-12-15-7" stroke="#fff8f0" stroke-width="2" stroke-linecap="round"/></g>`;
      const wing = `<path d="M32 86C0 81-16 47-9 4Q4 24 15 30L13 8Q36 27 42 61Z" fill="${url('friend-feather')}" stroke="#74bba8" stroke-width="1.1"/>` +
        Array.from({ length: 6 }, (_, i) => {
          const x = -8 + i * 5, y = 12 + i * 7;
          return `<path d="M${x} ${y}Q${x+1} ${y+32} 32 ${84-i*3}Q${17+i*2} ${62-i*3} ${x+8} ${y+8}Z" fill="${url('friend-feather')}" stroke="#7bbba9" stroke-width=".7"/><path d="M${x+3} ${y+10}Q${x+8} ${y+30} 30 ${79-i*3}" fill="none" stroke="#f1fff3" stroke-width=".8"/>`;
        }).join('') + `<path d="M17 43Q33 51 35 78" fill="none" stroke="${url('friend-gold')}" stroke-width="4"/><circle cx="23" cy="53" r="3" fill="#eafded" stroke="#c7a05c"/>`;
      const feathers = `<g>${motion(wing, 'motion-wing', '34px 77px', 'animation-duration:4.8s')}</g><g transform="translate(120 0) scale(-1 1)">${motion(wing, 'motion-wing', '34px 77px', 'animation-duration:4.8s')}</g>`;
      const motes = [[-5,57,.65],[114,35,.5],[8,98,.4],[104,102,.55]].map(([x,y,s],i) => `<g transform="translate(${x} ${y})">${motion(jewel(0,0,s), 'motion-hover', '0px 0px', `animation-delay:${-i*1.2}s;animation-duration:5s`)}</g>`).join('');
      return { faceColor: '#173e39', sideColor: '#257963', shadowColor: '#152e2d',
        back: `<defs><linearGradient id="${id('friend-feather')}" x2=".8" y2="1"><stop stop-color="#fffce3"/><stop offset=".35" stop-color="#e6fff0"/><stop offset=".7" stop-color="#8fd6bc"/><stop offset="1" stop-color="#367f7a"/></linearGradient><linearGradient id="${id('friend-gold')}" x2=".6" y2="1"><stop stop-color="#fff9cd"/><stop offset=".25" stop-color="#ebca79"/><stop offset=".5" stop-color="#fff1b1"/><stop offset=".73" stop-color="#b5833e"/><stop offset="1" stop-color="#f6d595"/></linearGradient><linearGradient id="${id('friend-ruby')}" x2=".7" y2="1"><stop stop-color="#ffd5e8"/><stop offset=".3" stop-color="#f67fad"/><stop offset=".7" stop-color="#bd3d83"/><stop offset="1" stop-color="#6c2e6a"/></linearGradient><radialGradient id="${id('friend-aura')}"><stop offset=".25" stop-color="#b8ffe0" stop-opacity=".25"/><stop offset="1" stop-color="#75e7b9" stop-opacity="0"/></radialGradient></defs><ellipse cx="60" cy="58" rx="77" ry="76" fill="${url('friend-aura')}"/><ellipse cx="60" cy="25" rx="32" ry="10" fill="none" stroke="${url('friend-gold')}" stroke-width="1.5" opacity=".7"/>${feathers}${motes}`,
        detail: `<defs>${clip}<linearGradient id="${id('friend-shell')}" x2=".85" y2="1"><stop stop-color="#e5ffe9"/><stop offset=".22" stop-color="#a4eccc"/><stop offset=".6" stop-color="#60bca0"/><stop offset="1" stop-color="#287e72"/></linearGradient></defs><g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('friend-shell')}"/><path d="M25 57V43q0-10 10-10h47M95 75v20q0 8-9 8H41" fill="none" stroke="#ecffe1" stroke-width="1.4" opacity=".8"/><path d="M28 87q5-5 9 0m46 0q5-5 9 0" fill="none" stroke="#ffc4d1" stroke-width="4" stroke-linecap="round"/><path d="M20 95Q40 87 60 100Q80 87 100 95v15H20Z" fill="${url('friend-gold')}"/><path d="M23 98q18-7 37 7 19-14 37-7" fill="none" stroke="#fff3ce" stroke-width="1"/></g>` +
          `<path d="M25 35 20 10 40 23 46 8 60 20 74 8 80 23 100 10 95 35Z" fill="${url('friend-gold')}" stroke="#956d39" stroke-width="1"/><path d="m27 28-3-12 16 12 7-14 13 13 13-13 7 14 16-12-3 12" fill="none" stroke="#fff6cc" stroke-width="1.2"/><path d="M25 32q35-8 70 0v7q-35-8-70 0Z" fill="${url('friend-gold')}" stroke="#a67c40" stroke-width=".7"/>` +
          [31,42,78,89].map(x => `<circle cx="${x}" cy="33" r="2" fill="#ebfff0" stroke="#9d773f" stroke-width=".7"/>`).join('') +
          motion(jewel(60,20,.85), 'motion-heart', '60px 20px', 'animation-duration:3.6s') + jewel(60,100,.45) +
          `<path d="M29 43q7-5 12-3m38 0q5-2 12 3" fill="none" stroke="#ebffe9" stroke-width="1" opacity=".8"/>${sparkle(23,13,-.7,3)}${sparkle(93,33,-2.1,3)}${sparkle(35,101,-1.3,2)}` };
    }
    if (item.id === 'attack_pumpkin_rotating_rings') {
      const blue = orbit('blue-ring', 'M8 40Q60 1 112 40Q60 79 8 40Z', 40, '#70d8f4', 5, 0, true, 5.4);
      const orange = orbit('orange-ring', 'M8 78Q60 123 112 78Q60 33 8 78Z', 78, '#ffb262', 5);
      return { back: blue.back + orange.back, detail: blue.front + orange.front + '<path d="m60 10 9 12-9 12-9-12Z" fill="#ffe4a0"/>' };
    }
    if (item.id === 'attack_core_accretion_sweep') {
      const ring = orbit('accretion-ring', 'M115 70A55 24 0 1 1 5 70A55 24 0 1 1 115 70Z', 70, '#f4ba8e', 6, -15);
      return { back: ring.back, detail: ring.front + '<path d="M20 39Q60 4 100 39" fill="none" stroke="#dfe5ff" stroke-width="4"/><path d="m60 8 6 11-6 11-6-11Z" fill="#ffdfa5"/>' };
    }
    if (item.id === 'phantom_emperor') {
      const base = animatedArt({ ...item, id: 'phantom_king' }, uid);
      const sigils = Array.from({length: 12}, (_, i) => `<g transform="rotate(${i*30} 60 68)"><path d="m60 5 3 5-3 5-3-5Z" fill="#d8ffb7"/><path d="M57 19h6" stroke="#bb89ff"/></g>`).join('');
      const embers = Array.from({length: 16}, (_, i) => `<g transform="translate(${7+i*7} ${103-i%4*17})"><circle class="emperor-ember" style="animation-delay:${-i*.31}s" r="${1+i%3*.4}" fill="${i%2 ? '#ddabff' : '#c9ff90'}"/></g>`).join('');
      return { ...base,
        back: base.back + `<g class="emperor-corona" fill="none" stroke="#ba9aff" stroke-width="1.4"><path d="M19 96C-5 85 4 56-3 36Q18 44 14 65M101 96c24-11 15-40 22-60-21 8-17 29-17 29"/><path d="M10 89Q-6 67 5 49M110 89q16-22 5-40" stroke="#caffc1" stroke-width="2.5"/></g><g class="emperor-seal" fill="none" stroke="#a9fba5"><circle cx="60" cy="68" r="61" stroke-opacity=".35"/><circle cx="60" cy="68" r="55" stroke-dasharray="19 5 2 5"/>${sigils}</g><g class="emperor-mantle"><path d="M30 40Q2 47 2 109L22 101 32 121 60 105 88 121 98 101 118 109Q118 47 90 40Z" fill="#28183f" stroke="#af85e9" stroke-width="1.3"/><path d="M26 51Q8 75 12 100M94 51q18 24 14 49" fill="none" stroke="#98e3ad" stroke-width="2"/></g>` + embers,
        detail: base.detail + `<defs><linearGradient id="${id('emperor-gold')}" x2=".7" y2="1"><stop stop-color="#fff9cb"/><stop offset=".4" stop-color="#e6b76a"/><stop offset=".7" stop-color="#8e513c"/><stop offset="1" stop-color="#ffe3a1"/></linearGradient></defs><g class="emperor-crown"><path d="m34 25-6-22 17 11L60-4l15 18L92 3l-6 22-26 5Z" fill="${url('emperor-gold')}" stroke="#fff2bf"/><path d="m38 19 7-5 15 9 15-9 7 5M35 25h50" fill="none" stroke="#6f3b60"/><path d="m60 4 5 9-5 8-5-8Z" fill="#a3ffbd" stroke="#f0ffdc"/>${sparkle(30,5,-.3,4)}${sparkle(88,5,-1.5,4)}</g><path d="m26 94 10-5 8 12 16-6 16 6 8-12 10 5" fill="none" stroke="#d9ffbc" stroke-width="1.6"/>${embers}<g class="emperor-soul-ring" fill="none"><ellipse cx="60" cy="107" rx="57" ry="11" stroke="#9470cf" stroke-width="4" opacity=".4"/><ellipse cx="60" cy="107" rx="57" ry="11" stroke="#ccffac" stroke-width="1.5" stroke-dasharray="14 8 2 8"/></g>`,
      };
    }
    if (['living_grimoire', 'tempest_seraph', 'celestial_forge', 'abyssal_leviathan'].includes(item.id)) {
      const palette = {
        living_grimoire: ['#d1b9ff','#6b4c9f','#251d48','#ffe9a8'],
        tempest_seraph: ['#d4faff','#438cc9','#192d65','#b4f7ff'],
        celestial_forge: ['#ffe7ac','#c37845','#442440','#ffdc85'],
        abyssal_leviathan: ['#a3fff0','#25839c','#112d56','#7bffe0'],
      }[item.id];
      const [light,mid,dark,glow] = palette;
      const defs = `<defs>${clip}<linearGradient id="${id('relic-shell')}" x2=".8" y2="1"><stop stop-color="${light}"/><stop offset=".3" stop-color="${mid}"/><stop offset=".75" stop-color="${dark}"/><stop offset="1" stop-color="${mid}"/></linearGradient><linearGradient id="${id('relic-metal')}" x2=".5" y2="1"><stop stop-color="#fff7dc"/><stop offset=".45" stop-color="${glow}"/><stop offset=".7" stop-color="${mid}"/><stop offset="1" stop-color="#fff7dc"/></linearGradient></defs>`;
      let back = '', ornament = '';
      if (item.id === 'living_grimoire') {
        // The face is the cover: page edges sit behind its right and bottom edges.
        back = `<path d="M26 32h76q7 0 7 7v70q0 7-8 7H28Z" fill="#32223d" stroke="#c5a46d" stroke-width="1.5"/><path d="M97 34h8v73H30v-5h67Z" fill="#f7e2b0"/><path d="M100 39v65H34m69-62v65H36" fill="none" stroke="#ba9d77" stroke-width=".8"/><g class="grimoire-glyphs" fill="none" stroke="#dfbcff" stroke-width="1.4"><path d="m12 32 4 7-4 7-4-7Zm99-20 5 8-5 8-5-8ZM5 81h12m-6-6v12M108 83l7 7-7 7"/></g>`;
        ornament = `<rect x="21" y="29" width="78" height="78" rx="8" fill="none" stroke="#e1c18c" stroke-width="2"/><rect x="37" y="35" width="55" height="66" rx="5" fill="none" stroke="#ab8a66" stroke-width=".8"/><path d="M22 30h12v75H22Z" fill="#30213f"/><path d="M25 32v70M32 32v70M22 42h12M22 52h12M22 84h12M22 94h12" stroke="#dfbb80" stroke-width="1.4"/><path d="m39 36 10 0-10 10Zm53 0-10 0 10 10ZM39 100h10l-10-10Zm53 0H82l10-10Z" fill="${url('relic-metal')}"/><g class="grimoire-glyphs" fill="none" stroke="#edccff"><path d="m60 32 5 6-5 6-5-6Zm-11 64h30m-23-4 4-4 4 4m-4-4v10"/></g><path d="M97 60h8v16h-8Z" fill="${url('relic-metal')}" stroke="#fff0c4"/><circle cx="101" cy="68" r="2" fill="#9e72d1"/><g class="grimoire-ribbon"><path d="M81 105v20l6-5 6 5v-20" fill="#bf7198" stroke="#efb4cb"/><path d="M87 107v10" stroke="#f8d1c8"/></g>`;
      } else if (item.id === 'tempest_seraph') {
        back = [-1,1].map(side => `<g transform="translate(${side<0 ? 120 : 0} 0) scale(${side} 1)"><g class="tempest-wing"><path d="M29 84C2 68-8 37 5 5L19 36 22 12 34 43 43 27 47 65Z" fill="${url('relic-metal')}" stroke="#dbfaff"/><path d="M8 23 28 64 36 48M16 53l13 23" fill="none" stroke="#498bb7" stroke-width="2"/></g></g>`).join('') + `<g class="tempest-bolt" fill="none" stroke="#e3ffff" stroke-width="2"><path d="m9 26 8 13-10 15 10 11-5 21M111 26l-8 13 10 15-10 11 5 21"/></g>`;
        ornament = `<ellipse class="emperor-soul-ring" cx="60" cy="13" rx="27" ry="8" fill="none" stroke="${glow}" stroke-width="2" stroke-dasharray="28 5"/><path d="m21 94 17-6 22 12 22-12 17 6-17 12-22-7-22 7Z" fill="${url('relic-metal')}"/><path d="m58 29-8 13h9l-2 11 14-17H60l3-7Z" fill="#edffff"/>`;
      } else if (item.id === 'celestial_forge') {
        back = `<g class="forge-gear" fill="none" stroke="${glow}"><circle cx="60" cy="68" r="56" stroke-width="6" stroke-dasharray="12 6"/><circle cx="60" cy="68" r="48" stroke-width="1.5"/>${Array.from({length:8},(_,i)=>`<path transform="rotate(${i*45} 60 68)" d="M60 10v14m-4-9h8" stroke-width="2"/>`).join('')}</g><g class="forge-plume"><path d="M28 41Q4 20 17 5q-2 20 22 16L60 0l21 21q24 4 22-16 13 15-11 36Z" fill="#ffb55b" opacity=".75"/><path d="M40 30 60 8 80 30" fill="#fff5b6"/></g>`;
        ornament = `<path d="M22 31 38 29l-6 24-10 4M98 31l-16-2 6 24 10 4M22 84l17 5 21 14 21-14 17-5v19H22Z" fill="${url('relic-metal')}" stroke="#ffe7b3"/><path d="m60 86 9 9-9 10-9-10Z" fill="#ff8d45" stroke="#fff8c4"/><g class="relic-breathe"><path d="m60 89 4 6-4 5-4-5Z" fill="#fff7ce"/></g>`;
      } else {
        back = `<g class="leviathan-fins"><path d="M29 43Q5 23-3 46L9 51-2 64l16 3-5 18 23-9M91 43q24-20 32 3l-12 5 11 13-16 3 5 18-23-9" fill="${url('relic-metal')}" stroke="#9fffea"/><path d="M11 47 26 61 14 74M109 47 94 61l12 13" fill="none" stroke="#237d94" stroke-width="1.5"/></g><g class="leviathan-tail"><path d="M76 96q35 12 36-4l-12-9 20-5-2 25q-16 28-55 7Z" fill="${url('relic-shell')}" stroke="#91f5de"/></g><path d="M60 30Q39 6 65 6q17 1 11 14" fill="none" stroke="#66b8b9" stroke-width="3"/><circle class="relic-breathe" cx="75" cy="20" r="6" fill="#caffce"/>`;
        ornament = `<path d="M23 88q9-9 18 0t19 0 19 0 18 0M25 97q8-8 16 0t19 0 19 0 16 0" fill="none" stroke="#9dfbe4" stroke-width="1.5"/>` + [29,91].map(x=>`<g class="relic-breathe" fill="#c7ffdf"><circle cx="${x}" cy="43" r="2"/><circle cx="${x}" cy="80" r="2"/></g>`).join('');
      }
      const motes = Array.from({length: 10}, (_, i) => `<g transform="translate(${i%2 ? 108+i%3*4 : 8-i%3*4} ${30+i*8})"><circle class="relic-drift" style="animation-delay:${-i*.47}s" r="${.8+i%3*.45}" fill="${glow}"/></g>`).join('');
      back += motes;
      if (item.id === 'tempest_seraph') {
        back += [-1,1].map(side => `<g transform="translate(${side<0 ? 120 : 0} 0) scale(${side} 1)"><g class="tempest-wing" fill="none" stroke="#f2ffff" stroke-width=".9"><path d="M7 13 23 54 29 69M22 24l10 31 4 12M34 42l7 17M12 45l11 18M17 64l9 9"/><path class="tempest-bolt" d="M2 32 13 39 9 47 19 54 14 61" stroke-width="2"/></g></g>`).join('');
        ornament += `<path d="m23 34 15 3-8 15M97 34l-15 3 8 15" fill="none" stroke="#cdf6ff" stroke-width="1.5"/><g class="relic-breathe"><path d="m31 93 7-2 22 12 22-12 7 2-7 5-22 11-22-11Z" fill="#e0ffff" opacity=".6"/></g>`;
      } else if (item.id === 'celestial_forge') {
        back += `<g class="forge-inner-gear" fill="none" stroke="#d98553"><circle cx="60" cy="68" r="62" stroke-width="2" stroke-dasharray="8 18"/><circle cx="60" cy="68" r="51" stroke-width="2" stroke-dasharray="2 7"/></g>`;
        ornament += `<g class="forge-veins" fill="none" stroke="#ffe69b" stroke-width="1.4"><path d="m24 41 9 11-6 10 7 13-7 12M96 41l-9 11 6 10-7 13 7 12"/></g><g fill="#fff1c9">${[27,93].map(x=>`<circle cx="${x}" cy="34" r="1.6"/><circle cx="${x}" cy="98" r="1.6"/>`).join('')}</g>`;
      } else if (item.id === 'abyssal_leviathan') {
        back += `<g class="leviathan-fins" fill="none" stroke="#b6ffe4" stroke-width=".8"><path d="M1 46 25 61 8 64M12 77l13-16M119 46 95 61l17 3M108 77 95 61"/></g>`;
        ornament += `<g clip-path="${url('body')}" class="leviathan-caustics" fill="none" stroke="#83f8dd" stroke-width=".8" opacity=".45"><path d="M16 39q12-12 23 0t23 0 23 0 23 0M15 97q12-12 23 0t23 0 23 0 23 0M25 28q-10 11 0 22t0 22 0 22M94 28q-10 11 0 22t0 22 0 22"/></g><path d="M36 30q24-8 48 0" fill="none" stroke="#c2fff0" stroke-width="2"/>`;
      }
      return { faceColor: '#efffdf', sideColor: item.id === 'living_grimoire' ? '#c4ac84' : dark, shadowColor: dark, sideOffset: item.id === 'living_grimoire' ? 7 : 13, shadowOffset: item.id === 'living_grimoire' ? 13 : 25, back: defs + back,
        detail: `<g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('relic-shell')}"/><path d="M24 48V39q0-7 7-7h53M96 83v14q0 7-7 7H35" fill="none" stroke="${light}" stroke-width="1.3"/><g class="empyrorite-sheen"><path d="m-45 18 16-5 65 110H20Z" fill="#fff" opacity=".18"/></g></g>${ornament}${sparkle(22,34,-.5)}${sparkle(96,96,-1.8)}${sparkle(90,20,-2.4,3)}` };
    }
    if (item.id === 'phantom_king') {
      const flame = (x, y, i) => `<g transform="translate(${x} ${y})"><g class="phantom-flame" style="animation-delay:${-i*.41}s;animation-duration:${2.2+i%3*.4}s"><path d="M0 12C-15 3-12-9-5-18Q-7-5 0-3C7-11 1-22 8-32C6-16 21-8 11 7Z" fill="${url(i%2 ? 'phantom-purple' : 'phantom-green')}"/><path d="M0 10Q-7 1-2-8Q-1 1 4-4Q11 3 0 10Z" fill="${i%2 ? '#edbaff' : '#d2ff96'}" opacity=".9"/></g></g>`;
      const fire = [[14,77],[105,79],[24,43],[94,43],[43,28],[73,27],[59,21]].map(([x,y],i)=>flame(x,y,i)).join('');
      const ghosts = [
        ['M-4 60C0 9 114 6 126 63C131 120 1 128 -4 60Z', 12.7, -2.1],
        ['M116 25C149 81 51 141 7 101C-22 51 74-11 116 25Z', 16.3, -8.2],
        ['M7 22C56-13 141 56 115 107C70 143-25 66 7 22Z', 19.1, -13.5],
      ].map(([path,duration,delay],i)=>`<g class="phantom-ghost-orbit" style="offset-path:path('${path}');animation-duration:${duration}s;animation-delay:${delay}s"><g class="phantom-ghost-bob" style="animation-delay:${-i*.7}s"><path d="M-8 7V-3C-8-15 8-15 8-3V7L4 4 1 8-3 4-8 7Z" fill="${url('phantom-ghost')}" stroke="${i%2 ? '#cf9bff' : '#b9f8cf'}" stroke-width=".8"/><path d="M-4-4h2v4h-2M2-4h2v4H2" fill="#42315c"/><ellipse cx="0" cy="3" rx="1.5" ry="2" fill="#674a7a"/><path d="M-6-4Q-6-10-1-10" fill="none" stroke="#fff" stroke-width=".8"/></g></g>`).join('');
      return { faceColor: '#fff597',
        back: `<defs><linearGradient id="${id('phantom-green')}" x2=".2" y2="1"><stop stop-color="#e1ff8e"/><stop offset=".4" stop-color="#75f367"/><stop offset="1" stop-color="#117e63" stop-opacity=".35"/></linearGradient><linearGradient id="${id('phantom-purple')}" x2=".2" y2="1"><stop stop-color="#f7c1ff"/><stop offset=".45" stop-color="#b064ff"/><stop offset="1" stop-color="#59279b" stop-opacity=".4"/></linearGradient><linearGradient id="${id('phantom-ghost')}" x2=".3" y2="1"><stop stop-color="#fffef1"/><stop offset=".55" stop-color="#d5e4ed"/><stop offset="1" stop-color="#c1a6ed" stop-opacity=".35"/></linearGradient><radialGradient id="${id('phantom-aura')}"><stop offset=".4" stop-color="#7a4eb4" stop-opacity="0"/><stop offset=".7" stop-color="#6bcb80" stop-opacity=".2"/><stop offset="1" stop-color="#a866d9" stop-opacity="0"/></radialGradient></defs><ellipse cx="60" cy="65" rx="65" ry="63" fill="${url('phantom-aura')}"/>${fire}${ghosts}`,
        detail: `<defs>${clip}<linearGradient id="${id('phantom-pumpkin')}" x2=".8" y2="1"><stop stop-color="#ffd277"/><stop offset=".3" stop-color="#ef8a2c"/><stop offset=".7" stop-color="#be4e22"/><stop offset="1" stop-color="#6d293c"/></linearGradient></defs><g clip-path="${url('body')}"><rect x="15" y="25" width="90" height="86" fill="${url('phantom-pumpkin')}"/><path d="M43 32C27 48 27 90 44 103M77 32c16 16 16 58-1 71" fill="none" stroke="#8c3529" stroke-width="3"/><path d="M39 37Q24 64 37 91M80 38Q94 62 84 87" fill="none" stroke="#ffd585" stroke-width="1.3"/><path d="M25 89Q60 115 96 89" fill="none" stroke="#8e3a35" stroke-width="2"/><path d="M20 58Q17 82 29 96M99 56Q103 82 92 97" fill="none" stroke="#a9ea75" stroke-width="2" opacity=".8"/></g><path d="M54 32q4-12 0-23l9-4q8 15 1 27" fill="#48714b" stroke="#bdd580" stroke-width="1"/><path d="M65 26Q72 6 88 13Q85 27 65 26Z" fill="#7d4aa0" stroke="#c9a0df"/><path d="m67 24 15-8" stroke="#dfa9fa"/>` +
          `<defs><clipPath id="${id('phantom-front')}"><rect x="-25" y="77" width="180" height="90"/></clipPath></defs><g clip-path="${url('phantom-front')}">${ghosts}</g>`,
        eyeEffects: [43.5,101.5].map((x,i)=>`<g transform="translate(${x} 59)"><g class="phantom-eye-fire" style="animation-delay:${-i*.6}s"><path d="M-7 4C-13-8-6-15-7-27C-1-22 0-14 3-10Q8-15 6-22C18-7 8 4 7 8Z" fill="#ffcc37" opacity=".8"/><path d="M-4 4Q-7-5-2-12Q0-3 4-6Q9 3 3 7Z" fill="#fffbd0"/></g></g>`).join('') };
    }
    if (item.id === 'shop_space_junk') {
      return { sideOffset: 0, shadowOffset: 0, sideColor: 'none', shadowColor: 'none',
        detail: spaceJunkShards.map((d, i) => `<g class="cubie-motion space-junk-fragment" style="animation-delay:${-i*.43}s;animation-duration:${2.6+i%4*.45}s;--junk-x:${[-3, 1, 3, -4, 0, 4, -3, 0, 3, -2, 1, 3][i]}px;--junk-y:${[-3, -4, -3, -1, -2, 1, 2, 2, 2, 3, 4, 3][i]}px;--junk-turn:${i%2 ? 7 : -7}deg"><path d="${d}" fill="${['#28374e', '#3c4e68', '#25344a'][i%3]}" stroke="#65cfff" stroke-width="1.2" stroke-linejoin="bevel"/><path d="${d}" fill="none" stroke="#b1edff" stroke-width=".5" stroke-dasharray="6 32"/></g>`).join('') };
    }
    if (item.id === 'singularity') {
      const pieces = Array.from({length: 8}, (_, i) => {
        const angle = i * 45;
        return `<g transform="translate(60 67) rotate(${angle})"><g class="cubie-motion space-metal-drift" style="animation-delay:${-i*.47}s;animation-duration:${3.2+i%3*.7}s"><path d="M43-10 58-12 62 10 44 12Z" fill="${i%2 ? '#293a56' : '#43526c'}" stroke="#65cfff" stroke-width="1.3"/><path d="M46-6 54-7 56-2M47 7l7-2" fill="none" stroke="#9beaff" stroke-width="1"/><path d="M44 0 51 2 48 5" fill="none" stroke="#121e36" stroke-width="1.4"/><circle cx="55" cy="5" r="1.2" fill="#65f5ff"/></g></g>`;
      }).join('');
      return { sideOffset: 0, shadowOffset: 0,
        back: `<ellipse cx="60" cy="72" rx="65" ry="16" fill="none" stroke="#a488ff" stroke-width="3" opacity=".7"/>${pieces}`,
        detail: `<circle cx="60" cy="67" r="38" fill="#03040c" stroke="#59647d" stroke-width="3"/><circle cx="60" cy="67" r="34" fill="none" stroke="#c3a5ff" stroke-width="1.5"/><g class="cubie-motion motion-spin" style="transform-origin:60px 67px;animation-duration:18s"><circle cx="60" cy="67" r="36" fill="none" stroke="#65f5ff" stroke-width="1.7" stroke-dasharray="1 8"/></g><path d="M-5 72Q60 105 125 72" fill="none" stroke="#a488ff" stroke-width="2"/><path d="M-5 72Q60 105 125 72" fill="none" stroke="#65f5ff" stroke-width="1" stroke-dasharray="3 9"/>` };
    }
    if (item.id === 'ton_618') {
      const rings = [88].map((cy, i) => {
        const path = `M119 ${cy}A59 13 0 1 1 1 ${cy}A59 13 0 1 1 119 ${cy}Z`;
        const art = `<path d="${path}" fill="none" stroke="#ff123e" stroke-width="14" opacity=".45" filter="${url('ton-mist')}"/><path d="${path}" fill="none" stroke="#870d2b" stroke-width="10"/><path d="${path}" fill="none" stroke="#ff3658" stroke-width="8"/><path d="${path}" fill="none" stroke="${url('ton-ivory')}" stroke-width="5.5"/><path d="${path}" fill="none" stroke="#ffffff" stroke-width=".7"/>` +
          `<path class="ton-ring-flow" style="animation-duration:${i ? 4.7 : 3.3}s;animation-direction:${i ? 'reverse' : 'normal'}" d="${path}" pathLength="100" fill="none" stroke="#ff6277" stroke-width="1.2" stroke-dasharray="3 12 1 9" stroke-linecap="round"/>`;
        return { back: art, front: `<defs><clipPath id="${id('ton-ring-' + i)}"><rect x="-20" y="${cy}" width="160" height="100"/></clipPath></defs><g clip-path="${url('ton-ring-' + i)}">${art}</g>` };
      });
      // Unequal periods and differently shaped paths keep the meteor pattern
      // changing, while matching front/back copies preserve body occlusion.
      const paths = [
        'M125 65C115 108 16 128 -6 65C-17 16 112 6 125 65Z',
        'M110 25C150 63 64 137 15 100C-25 63 57 -12 110 25Z',
        'M9 25C62 -8 147 67 107 105C64 142 -27 64 9 25Z',
        'M124 78C90 120 4 105 -5 57C8 8 140 26 124 78Z',
      ];
      const meteors = paths.map((path, i) => `<g class="ton-meteor" style="offset-path:path('${path}');animation-duration:${[7.3, 11.7, 9.1, 13.9][i]}s;animation-delay:${[-1.2, -5.8, -3.1, -8.2][i]}s"><path d="M-25 0Q-13-6 2-3L5 0 1 4Q-12 5-25 0Z" fill="${url('ton-tail')}"/><path d="M-18 0Q-8-2 1-1" fill="none" stroke="#ffb2a0" stroke-width=".8"/><path d="m-4-2 3-3 5 2 2 4-4 3-5-2Z" fill="${url('ton-stone')}" stroke="#ffbdac" stroke-width=".7"/><path d="m-1-5 2 4 3-2M1-1l-3 5m3-5 5 2" fill="none" stroke="#4f3545" stroke-width=".6"/><path d="m-1-4 3 1-1 2-2-1Z" fill="#ffebd7"/><circle cx="-9" cy="3" r=".7" fill="#ffa07f"/><circle cx="-16" cy="-2" r=".5" fill="#ff7479"/></g>`).join('');
      const gas = [0, 73, 151].map((angle, i) => `<g transform="rotate(${angle} 60 67)"><g class="ton-gas" style="animation-delay:${-i * 4.7}s;animation-duration:${22+i*7}s"><path d="M4 74C-5 25 77 1 111 39C137 69 105 118 54 119C94 108 120 77 105 48C86 12 10 35 4 74Z" fill="${url('ton-plasma')}"/><path d="M7 72C-1 33 68 9 101 35M18 95C46 125 111 97 114 60" fill="none" stroke="#ff244f" stroke-width="5" opacity=".28" filter="${url('ton-mist')}"/><path d="M9 60C19 30 65 18 91 31M22 105C50 116 90 102 105 82" fill="none" stroke="#ff7d8b" stroke-width=".9" opacity=".6"/><path d="M12 49C27 26 60 20 79 26M31 112Q82 115 107 81" fill="none" stroke="#ed294d" stroke-width="1.4" opacity=".65"/></g></g>`).join('');
      const dust = Array.from({length:24}, (_,i) => `<circle cx="${60+Math.cos(i*2.4)*(45+i%3*5)}" cy="${67+Math.sin(i*2.4)*(43+i%4*3)}" r="${i%4 ? .5 : .9}" fill="${i%3 ? '#ff6375' : '#ffe1c8'}" class="custom-sparkle" style="animation-delay:${-i*.27}s"/>`).join('');
      const jet = `<g class="ton-jet"><path d="M50 35Q59 6 55-16L65-16Q61 8 71 35Z" fill="${url('ton-jet-color')}"/><path d="M57 33Q64 8 59-13M64 32Q57 7 62-10" fill="none" stroke="#ff6a85" stroke-width="1" opacity=".8"/><path d="M60 32V-10" stroke="#fff0ef" stroke-width="1.2"/><path class="ton-jet-stream" d="M60 29V-9" stroke="#fff" stroke-width="2.2" stroke-dasharray="3 11" opacity=".8"/></g>`;
      const jets = `<g transform="rotate(16 60 67)">${jet}<g transform="rotate(180 60 67)">${jet}</g></g>`;
      const embers = Array.from({length:9},(_,i)=>`<g transform="rotate(${i*40} 60 67)"><g transform="translate(60 67)"><path class="ton-infall" style="animation-delay:${-i*.53}s" d="M0-3 .7 0 0 3-.7 0Z" fill="${i%3 ? '#ff476d' : '#ffe6da'}"/></g></g>`).join('');
      const lens = `<g class="ton-lens-shimmer"><path d="M20 67A40 40 0 0 1 100 67" fill="none" stroke="#ff244e" stroke-width="4" opacity=".6" filter="${url('ton-mist')}"/><path d="M20 67A40 40 0 0 1 100 67" fill="none" stroke="#ffe0df" stroke-width="1.4"/><path d="M23 67A37 37 0 0 1 97 67" fill="none" stroke="#ff556f" stroke-width=".6"/></g>`;
      const flares = [1,119].map((x,i)=>`<g transform="translate(${x} 88)"><g class="ton-disk-flare" style="animation-delay:${-i*2.4}s"><path d="M-12 0-2-1 0-7 2-1 12 0 2 1 0 7-2 1Z" fill="#fff1eb"/><ellipse rx="5" ry="1.3" fill="#fff"/></g></g>`).join('');
      const interior = `<defs><clipPath id="${id('ton-interior')}"><circle cx="60" cy="67" r="37.5"/></clipPath><radialGradient id="${id('ton-depth')}"><stop stop-color="#01020a" stop-opacity=".7"/><stop offset=".35" stop-color="#05020b" stop-opacity=".3"/><stop offset=".8" stop-color="#10040d" stop-opacity="0"/><stop offset="1" stop-color="#030208" stop-opacity=".65"/></radialGradient></defs>` +
        `<g clip-path="${url('ton-interior')}"><g class="ton-inner-swirl" fill="none" stroke-linecap="round"><g filter="${url('ton-mist')}" opacity=".32"><path d="M25 48C52 15 102 42 90 76S37 100 42 70 81 46 76 68 51 82 56 68" stroke="#a82843" stroke-width="9"/><path d="M93 92C61 119 13 85 32 52S88 35 85 60 51 86 49 64" stroke="#701c35" stroke-width="7"/></g><path d="M26 49C50 22 96 40 88 72S42 97 42 73 77 49 77 65 57 81 55 70" stroke="#c34a5d" stroke-width=".65" opacity=".25"/><path d="M30 88C53 110 95 86 88 58S48 35 40 58 59 86 69 72" stroke="#ac334c" stroke-width="1.2" opacity=".2"/><path d="M28 61C35 27 80 27 92 55M33 92C64 110 95 81 91 66" stroke="#e16b79" stroke-width=".45" opacity=".2"/></g>` +
        `<g class="ton-inner-swirl ton-inner-counter" fill="none"><path d="M27 67C22 38 74 20 91 50S63 104 42 87 44 48 63 52" stroke="#9f2041" stroke-width="5" opacity=".16" filter="${url('ton-mist')}"/>` +
        Array.from({length:22},(_,i)=>`<circle cx="${60+Math.cos(i*2.4)*(12+i%6*4)}" cy="${67+Math.sin(i*2.4)*(12+i%6*4)}" r="${i%4 ? .35 : .6}" fill="#d06577" opacity="${i%3 ? .2 : .35}"/>`).join('') +
        `</g><circle cx="60" cy="67" r="38" fill="${url('ton-depth')}"/></g>`;
      return { sideOffset: 0, shadowOffset: 0, sideColor: '#310d25', shadowColor: '#160915', eyeHighlights: '<path d="M37 50h4v20h-4M95 50h4v20h-4" fill="#ff9aaa" opacity=".8"/>', faceColor: '#ff304c',
        back: `<defs><linearGradient id="${id('ton-jet-color')}" x2="0" y2="1"><stop stop-color="#ff2152" stop-opacity="0"/><stop offset=".38" stop-color="#ff3e70" stop-opacity=".45"/><stop offset=".8" stop-color="#fff0eb" stop-opacity=".85"/><stop offset="1" stop-color="#d71342" stop-opacity=".1"/></linearGradient><linearGradient id="${id('ton-ivory')}" x2="0" y2="1"><stop stop-color="#fff"/><stop offset=".45" stop-color="#ffb4bd"/><stop offset=".65" stop-color="#fff"/><stop offset="1" stop-color="#ffe6e4"/></linearGradient><linearGradient id="${id('ton-plasma')}" x2="1" y2="1"><stop stop-color="#fe1f4e" stop-opacity="0"/><stop offset=".35" stop-color="#ff5367" stop-opacity=".5"/><stop offset=".6" stop-color="#a00036" stop-opacity=".25"/><stop offset="1" stop-color="#e3214a" stop-opacity="0"/></linearGradient><linearGradient id="${id('ton-stone')}" x2=".6" y2="1"><stop stop-color="#ecac9e"/><stop offset=".45" stop-color="#827382"/><stop offset="1" stop-color="#312436"/></linearGradient><radialGradient id="${id('ton-void')}" cx=".4" cy=".35" r=".7"><stop stop-color="#03040b"/><stop offset=".75" stop-color="#120916"/><stop offset="1" stop-color="#52112d"/></radialGradient><filter id="${id('ton-mist')}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.6"/></filter><radialGradient id="${id('ton-aura')}"><stop offset=".45" stop-color="#f01743" stop-opacity="0"/><stop offset=".7" stop-color="#e71947" stop-opacity=".4"/><stop offset="1" stop-color="#a50028" stop-opacity="0"/></radialGradient><linearGradient id="${id('ton-tail')}"><stop stop-color="#e5153b" stop-opacity="0"/><stop offset=".65" stop-color="#ff3e54"/><stop offset="1" stop-color="#fff1cf"/></linearGradient></defs><circle cx="60" cy="67" r="64" fill="${url('ton-aura')}"/>${jets}${gas}${dust}${embers}${meteors}${rings.map(r => r.back).join('')}`,
        detail: `<circle cx="60" cy="67" r="38.5" fill="${url('ton-void')}" stroke="#bf294a" stroke-width="1.3"/>${interior}<circle cx="60" cy="67" r="36.8" fill="none" stroke="#ff8a97" stroke-width=".5" opacity=".4"/><path d="M24 58A37 37 0 0 1 87 42" fill="none" stroke="#ffe1dc" stroke-width="1.4"/><path d="M25 80A36 36 0 0 0 85 94" fill="none" stroke="#ff375c" stroke-width="1"/>${lens}${rings.map(r => r.front).join('')}${flares}<defs><clipPath id="${id('ton-meteor-front')}"><rect x="-25" y="67" width="180" height="100"/></clipPath></defs><g clip-path="${url('ton-meteor-front')}">${meteors}</g>` };
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
    if (item.id === 'attack_core_crossfire_engine') {
      const beams = ['M10 16 110 116', 'M110 16 10 116'].map((path, i) =>
        `<g class="crossfire-sweep crossfire-sweep-${i}"><path d="${path}" fill="none" stroke="${i ? '#ff9172' : '#ed719e'}" stroke-width="14" opacity=".18"/>` +
        `<g class="crossfire-pulse" style="animation-delay:${-i*.8}s"><path d="${path}" fill="none" stroke="#d66888" stroke-width="8"/><path d="${path}" fill="none" stroke="#ffe4b7" stroke-width="3"/></g>` +
        `<path class="crossfire-flow" style="animation-delay:${-i*.4}s" d="${path}" pathLength="100" fill="none" stroke="#fffef0" stroke-width="4" stroke-linecap="round" stroke-dasharray="4 18"/>` +
        `<circle cx="${i ? 110 : 10}" cy="16" r="5" fill="#fff0c3"/><circle cx="${i ? 10 : 110}" cy="116" r="5" fill="#fff0c3"/></g>`).join('');
      return { back: beams, detail: item.detail +
        '<g class="crossfire-pulse"><circle cx="60" cy="23" r="7" fill="#ffcd8a" opacity=".3"/><circle cx="60" cy="23" r="3" fill="#fff9d9"/></g>' };
    }
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
      `<defs><radialGradient id="${id('jelly-bell')}" cx=".38" cy=".2" r=".9"><stop stop-color="#fff1ff" stop-opacity=".95"/><stop offset=".45" stop-color="#e3b6f5" stop-opacity=".85"/><stop offset="1" stop-color="#9273d2" stop-opacity=".9"/></radialGradient></defs>` +
      motion(`<path d="M10 39C13 14 33-3 60-3s47 17 50 42Q60 52 10 39Z" fill="${url('jelly-bell')}" stroke="#f3d7ff" stroke-width="1.5"/>` +
        '<path d="M38 39C31 22 42 4 54 0M62 0c16 6 26 23 20 39" fill="none" stroke="#fff1ff" stroke-width="1.4" opacity=".45"/>' +
        '<ellipse cx="60" cy="39" rx="49" ry="8" fill="#9875c9" stroke="#efd0ff" stroke-width="1.4"/>' +
        '<path d="M13 39q8 10 16 1 8 12 16 2 8 12 16 1 8 11 16-1 8 9 16-2 8 6 14-1" fill="none" stroke="#efbcf5" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M23 24Q32 9 46 7" fill="none" stroke="#fff8ff" stroke-width="3" stroke-linecap="round" opacity=".85"/>' +
        '<ellipse cx="33" cy="19" rx="4" ry="2" fill="#fff" opacity=".7"/><circle cx="83" cy="23" r="3" fill="#fbe7ff"/><circle cx="91" cy="29" r="1.6" fill="#fbe7ff"/>', 'motion-bell', '60px 43px') +
      [28,47,72,90].map((x,i)=>motion(`<path d="M${x} 104q${i%2?9:-9} 14 1 24" fill="none" stroke="#ba97e8" stroke-width="5" stroke-linecap="round"/>`, 'motion-tentacle', `${x}px 104px`, `animation-delay:${-i*.6}s`)).join('') };
    if (['wizard', 'moon', 'star', 'attack_core_lens_fracture'].includes(item.id))
      return { detail: item.detail + sparkle(26,35,-.3,3) + sparkle(94,24,-1.5) + sparkle(89,96,-2.1,3) };
    if (['pharaoh', 'diamond', 'champion', 'crown', 'medal_bronze', 'medal_silver', 'medal_gold', 'medal_crystal', 'medal_diamond', 'attack_pumpkin_royal_slams', 'shop_blue_mint'].includes(item.id))
      return { detail: item.detail + `<defs>${clip}<linearGradient id="${id('polish')}"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff8db" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><g clip-path="${url('body')}">` +
        motion(`<path d="M-45 18h20l65 110H20Z" fill="${url('polish')}"/>`, 'motion-polish') + '</g>' };
    if (item.id === 'shop_neon_noodle') return { detail:
      `<defs><linearGradient id="${id('noodle-bowl')}" x2=".7" y2="1"><stop stop-color="#ffb4d6"/><stop offset=".4" stop-color="#da6aaf"/><stop offset="1" stop-color="#794b91"/></linearGradient></defs>` +
      `<path d="M23 96h74q-4 17-17 20H40Q27 113 23 96Z" fill="${url('noodle-bowl')}" stroke="#ffd0e7" stroke-width="1.2"/>` +
      '<ellipse cx="60" cy="96" rx="37" ry="7" fill="#59324e" stroke="#ffb9d9" stroke-width="2"/><ellipse cx="60" cy="96" rx="31" ry="4.5" fill="#ab664f"/>' +
      '<g class="neon-noodles" fill="none" stroke-linecap="round"><path d="M32 96q5-8 10 0t10 0 10 0 10 0 10 0 8-1M37 100q5-8 10-1t11-1 11 1 12-1" stroke="#ffcf66" stroke-width="2.4"/><path d="M35 95q5-6 9 0m12 0q4-5 8 0m11 0q4-5 8 0" stroke="#fff9bd" stroke-width="1"/></g>' +
      '<path d="M31 105q29 13 58 0" fill="none" stroke="#ffbfde" stroke-width="1.5"/><path d="M48 113h24" stroke="#f7c5e2" stroke-width="2"/><g fill="#8ce9ad"><ellipse cx="42" cy="94" rx="3" ry="1.2" transform="rotate(-25 42 94)"/><ellipse cx="70" cy="99" rx="3" ry="1.2" transform="rotate(20 70 99)"/></g>' +
      '<path d="m81 100 24-32m-17 32 23-25" stroke="#51a7b5" stroke-width="4" stroke-linecap="round"/><path d="m81 100 24-32m-17 32 23-25" stroke="#bdfff0" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path class="cubie-motion motion-steam" d="M33 37q-9-8 0-15m23 11q-9-8 0-15m23 19q-9-8 0-15" fill="none" stroke="#b1eff0" stroke-width="2" stroke-linecap="round"/>'
    };
    if (item.id === 'rainbow') return { detail: motion(item.detail, 'motion-color') };
    if (item.id === 'shop_solar_seraph') {
      const feathers = Array.from({ length: 7 }, (_, i) => {
        const x = 3 + i * 4, y = 4 + i * 3;
        return `<path d="M35 76Q${x - 12} 49 ${x} ${y}Q${x + 5} ${y + 27} 42 52Z" fill="${url('ivory')}" stroke="#c6974e" stroke-width=".8"/><path d="M34 66Q${x} 37 ${x + 1} ${y + 10}" fill="none" stroke="#fff9df" stroke-width=".9"/>`;
      }).join('');
      const wing = `<g class="seraph-wing">${feathers}<path d="M35 76Q10 63 16 36Q27 50 43 48Z" fill="${url('gold')}" stroke="#fff0b9"/><path d="M23 48 35 62M22 55l12 13" stroke="#fff3ce" fill="none"/></g>`;
      const rays = Array.from({ length: 16 }, (_, i) => `<path transform="rotate(${i * 22.5} 60 62)" d="M60 9V3" stroke="#f7cf79" stroke-width="${i % 2 ? 1 : 2}"/>`).join('');
      return { faceColor: '#543923',
        back: `<defs><linearGradient id="${id('ivory')}" x2="1" y2="1"><stop stop-color="#fffdf0"/><stop offset=".45" stop-color="#f6e5bf"/><stop offset="1" stop-color="#ba8a48"/></linearGradient><linearGradient id="${id('gold')}" x2=".8" y2="1"><stop stop-color="#fff5c7"/><stop offset=".28" stop-color="#e7ba5b"/><stop offset=".55" stop-color="#fff1b1"/><stop offset="1" stop-color="#a1652c"/></linearGradient><radialGradient id="${id('dawn')}"><stop stop-color="#fff5cc" stop-opacity=".7"/><stop offset="1" stop-color="#f8a943" stop-opacity="0"/></radialGradient></defs>` +
          `<circle cx="60" cy="62" r="63" fill="${url('dawn')}"/><g class="seraph-sunwheel"><circle cx="60" cy="62" r="52" fill="none" stroke="#f3ce81" stroke-opacity=".5"/>${rays}</g>${wing}<g transform="translate(120 0) scale(-1 1)">${wing}</g>`,
        detail: `<defs>${clip}<linearGradient id="${id('porcelain')}" x2=".8" y2="1"><stop stop-color="#fff9df"/><stop offset=".45" stop-color="#f4dc9e"/><stop offset="1" stop-color="#bc8144"/></linearGradient></defs>` +
          `<g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('porcelain')}"/><path d="M20 28 38 43 30 83 20 108M100 28 82 43 90 83 100 108" fill="${url('gold')}"/><path d="M25 36 35 45 28 85m67-49-10 9 7 40" fill="none" stroke="#fff9df" stroke-width="1.5"/><path d="M20 94 38 89 60 101 82 89 100 94v14H20Z" fill="${url('gold')}" stroke="#fff0bc"/><path d="M30 101 39 97 60 108 81 97l9 4" fill="none" stroke="#b68443"/><g class="empyrorite-sheen"><path d="M-45 18h12l65 110H20Z" fill="#fff" opacity=".22"/></g></g>` +
          `<rect x="21" y="29" width="78" height="78" rx="13" fill="none" stroke="#fff0c2" stroke-width="1.5"/><g class="seraph-halo"><ellipse cx="60" cy="10" rx="23" ry="7" fill="none" stroke="#af762f" stroke-width="5"/><ellipse cx="60" cy="8" rx="23" ry="7" fill="none" stroke="#fff0ac" stroke-width="2.5"/><ellipse cx="60" cy="8" rx="17" ry="4" fill="none" stroke="#fff9e3" stroke-width=".8"/></g><path d="m60 23 6 9-6 10-6-10Z" fill="#fff7c6" stroke="#c99943"/><path d="m60 27 3 5-3 5-3-5Z" fill="#75d9c0"/>` + sparkle(38, 6, -.4, 3) + sparkle(88, 38, -1.4, 3) + sparkle(29, 96, -2.4, 3) };
    }
    if (item.id === 'shop_star_cartographer') {
      const stars = Array.from({ length: 35 }, (_, i) => `<circle class="custom-sparkle" style="animation-delay:${-i * .19}s" cx="${24 + i * 19 % 72}" cy="${32 + i * 31 % 72}" r="${i % 5 ? .55 : 1}" fill="${i % 3 ? '#b6daed' : '#ffe7ab'}"/>`).join('');
      const ticks = Array.from({ length: 24 }, (_, i) => `<path transform="rotate(${i * 15} 60 67)" d="M60 13v${i % 3 ? 3 : 6}" stroke="#dbbd79" stroke-width="${i % 3 ? .7 : 1.3}"/>`).join('');
      const ring = orbit('celestial-equator', 'M116 72A56 16 0 1 1 4 72A56 16 0 1 1 116 72Z', 72, '#d5b77c', 2, -24, false, 9);
      return { faceColor: '#f3f5dd',
        back: `<defs><linearGradient id="${id('brass')}" x2="1" y2="1"><stop stop-color="#fff0b4"/><stop offset=".4" stop-color="#b28b4b"/><stop offset=".7" stop-color="#f8dc95"/><stop offset="1" stop-color="#725230"/></linearGradient></defs><g class="cartographer-astrolabe"><circle cx="60" cy="67" r="55" fill="none" stroke="${url('brass')}" stroke-width="2"/><circle cx="60" cy="67" r="49" fill="none" stroke="#81b9cc" stroke-width=".7" stroke-dasharray="2 5"/>${ticks}</g>` + ring.back,
        detail: `<defs>${clip}<linearGradient id="${id('midnight-map')}" x2=".8" y2="1"><stop stop-color="#233c64"/><stop offset=".5" stop-color="#102940"/><stop offset="1" stop-color="#393654"/></linearGradient><radialGradient id="${id('map-nebula')}"><stop stop-color="#8a9fdf" stop-opacity=".5"/><stop offset="1" stop-color="#615090" stop-opacity="0"/></radialGradient></defs>` +
          `<g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('midnight-map')}"/><ellipse cx="70" cy="53" rx="47" ry="34" fill="${url('map-nebula')}"/><g fill="none" stroke="#82b8d0" stroke-width=".55" opacity=".3"><ellipse cx="60" cy="68" rx="23" ry="45"/><ellipse cx="60" cy="68" rx="42" ry="20"/><path d="M20 48h80M20 88h80M40 28v80M80 28v80"/></g>${stars}<g class="cartographer-constellations" fill="none" stroke="#c5dcec" stroke-width=".9"><path d="m27 44 12-9 16 8 19-10 17 12M27 91l14 9 18-8 17 8 16-9"/></g><path d="M22 43V30h15M83 30h15v13M22 92v14h15m46 0h15V92" fill="none" stroke="${url('brass')}" stroke-width="4"/><rect x="25" y="33" width="70" height="70" rx="8" fill="none" stroke="#b3d7dd" stroke-width=".5" opacity=".6"/></g>` + ring.front +
          `<g transform="translate(60 12)"><circle r="14" fill="#132e42" stroke="${url('brass')}" stroke-width="2"/><circle r="10" fill="none" stroke="#82aebd" stroke-width=".6"/><g class="cartographer-compass"><path d="M0-18 4-4 18 0 4 4 0 18-4 4-18 0-4-4Z" fill="${url('brass')}" stroke="#fff0c6" stroke-width=".6"/><path d="M0-18V0L4-4ZM18 0H0l4 4ZM0 18V0l-4 4ZM-18 0H0l-4-4Z" fill="#7caebf"/><circle r="3" fill="#b9fff0" stroke="#fff3c8"/></g></g>` + sparkle(39, 35, -.5, 3) + sparkle(74, 33, -1.4, 3) + sparkle(41, 100, -2.2, 3) + sparkle(92, 91, -.9, 3) };
    }
    if (item.id === 'shop_hacker') {
      const fingers = [
        ['M114 58 122 62 121 83 115 103 111 95 115 80Z', 'M118 65 118 81 114 94', 118, 64],
        ['M122 61 132 63 135 90 130 119 124 108 127 89Z', 'M128 68 131 90 128 108', 128, 65],
        ['M132 59 141 57 149 82 147 111 140 101 141 83Z', 'M138 64 145 83 144 100', 138, 62],
        ['M140 53 147 50 157 71 160 96 151 87 150 73Z', 'M145 57 154 72 156 85', 145, 55],
      ];
      const fingerArt = fingers.map(([shape, ridge, x, y], i) => `<g class="hacker-finger" style="--finger-angle:${i%2 ? 3 : -3}deg;transform-origin:${x}px ${y}px;animation-delay:${-i*.35}s"><path d="${shape}" fill="${url('hacker-hand-metal')}" stroke="#ff3655" stroke-width="1.5"/><path d="${ridge}" fill="none" stroke="#df8397" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="2.7" fill="#151a27" stroke="#ff7084" stroke-width=".8"/><path d="M${x-2} ${y+13}h5" stroke="#e23d65" stroke-width="1.1"/></g>`).join('');
      const hand = `<defs><linearGradient id="${id('hacker-hand-metal')}" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#6c526d"/><stop offset=".25" stop-color="#293043"/><stop offset=".58" stop-color="#101522"/><stop offset=".8" stop-color="#433047"/><stop offset="1" stop-color="#130d1e"/></linearGradient><radialGradient id="${id('hacker-palm-core')}"><stop stop-color="#ffafbc"/><stop offset=".3" stop-color="#ff3356"/><stop offset="1" stop-color="#69243d"/></radialGradient></defs>` +
        `<path d="M96 46q5-16 15-18l18 9-7 9-11-6-12 15" fill="${url('hacker-hand-metal')}" stroke="#ff3b60" stroke-width="1.5"/><path d="M99 47q9-15 15-13l10 6" fill="none" stroke="#bd687b" stroke-width="1"/>` +
        `<path d="M110 31 126 28l10 11 11 11-8 17-19 4-13-16Z" fill="${url('hacker-hand-metal')}" stroke="#ff3b60" stroke-width="1.7"/><path d="m112 34 13-3 9 11-4 19-10 6-9-13Z" fill="#393047" stroke="#9e5571" stroke-width=".7"/><path d="m113 37 10-3 7 9-3 15-8 4-5-10Z" fill="#151a2c"/><path d="M123 38v17m-6-9 12 4m-11 8 9-11" stroke="#a25678" stroke-width=".8"/><circle cx="123" cy="48" r="4.4" fill="${url('hacker-palm-core')}"/><path d="m108 44-12 8-4 20 8 10 1-16 12-10Z" fill="${url('hacker-hand-metal')}" stroke="#ff3655" stroke-width="1.5"/><path d="m107 49-8 7-3 15" fill="none" stroke="#f08b9e" stroke-width="1.1"/>${fingerArt}` +
        `<g class="hacker-hand-noise" fill="#ff5476"><rect x="110" y="41" width="21" height="1.4"/><rect x="137" y="78" width="20" height="1.8"/><rect x="117" y="99" width="16" height="1.3"/></g>`;
      const crack = 'M60 29 56 42 64 49 57 58 63 66 55 77 62 84 58 96 63 107';
      return {
        back: `<g opacity=".9">${catalog.find(c => c.id === 'codex').back}</g><g transform="translate(0 18)"><g class="hacker-claw"><path class="hacker-claw-echo" d="M111 31 126 28 147 50 160 96m-22-34 9 49m-20-45 3 53m-13-54-2 38" fill="none" stroke="#76deff" stroke-width="2"/>${hand}</g></g>`,
        detail: `<defs><linearGradient id="${id('hacker-lcd')}" x2=".8" y2="1"><stop stop-color="#edffbd"/><stop offset=".45" stop-color="#b6ee70"/><stop offset="1" stop-color="#72b74a"/></linearGradient><linearGradient id="${id('hacker-metal')}" x2="1" y2="1"><stop stop-color="#b0b7c5"/><stop offset=".45" stop-color="#626b7c"/><stop offset="1" stop-color="#343c4d"/></linearGradient><linearGradient id="${id('hacker-rift')}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ff577b"/><stop offset=".18" stop-color="#ffc96b"/><stop offset=".35" stop-color="#c7ff76"/><stop offset=".53" stop-color="#5af5df"/><stop offset=".72" stop-color="#8095ff"/><stop offset="1" stop-color="#ee79fc"/></linearGradient><clipPath id="${id('hacker-screen')}"><rect x="30" y="38" width="60" height="60" rx="1"/></clipPath></defs>` +
          `<rect x="20" y="28" width="80" height="80" rx="5" fill="${url('hacker-metal')}" stroke="#bac2cf" stroke-width="1"/><rect x="25" y="33" width="70" height="70" rx="3" fill="#202633" stroke="#d1d4dd" stroke-width="1.2"/><rect x="30" y="38" width="60" height="60" fill="${url('hacker-lcd')}"/><path d="M60 38 56 42 64 49 57 58 63 66 55 77 62 84 58 96 60 98H90V38Z" fill="#050710"/>` +
          `<g clip-path="${url('hacker-screen')}"><path d="M31 51h58M31 58h58M31 65h58M31 72h58M31 79h58M31 86h58M31 93h58" stroke="#7cce76" stroke-width=".5" opacity=".22"/><g class="hacker-screen-noise" fill="#a874db" opacity=".4"><path d="M70 44h18v2H70ZM62 69h13v2H62ZM78 91h12v2H78Z"/></g><path class="hacker-scan" d="M30 38h60v2H30Z" fill="#d6ffe9" opacity=".2"/></g><path d="m34 41 4 3-4 3m7 0h5" fill="none" stroke="#30452b" stroke-width="1.5"/>` +
          `<path d="M22 31h73M22 31v72M25 106h71" fill="none" stroke="#e2e7ed" stroke-width=".7" opacity=".7"/><path d="M98 34v67" stroke="#252b3b" stroke-width="2"/><path d="M33 40h20l-20 24Z" fill="#fff" opacity=".18"/><path d="m63 40 11 3 3 8h10m-20 18h9l4 5h8m-24 17 8-3 6 5h8" fill="none" stroke="#543052" stroke-width=".7"/><path d="m58 42-10-5 5 15m9 14 9 2-4 9m-9 19-8-6 3 9" fill="#c2e5ed" opacity=".28"/><g class="hacker-rift"><path d="${crack}" fill="none" stroke="#22182e" stroke-width="6"/><path d="${crack}" fill="none" stroke="${url('hacker-rift')}" stroke-width="3"/><path d="M60 29 56 42 64 49 57 58 63 66 55 77 62 84 58 96" fill="none" stroke="#f4efff" stroke-width=".7"/><path d="m57 58-9-5m15 13 10-5m-18 16-9 5m16 2 10 6" fill="none" stroke="${url('hacker-rift')}" stroke-width="1.2"/></g><g class="hacker-screen-noise" fill="${url('hacker-rift')}"><rect x="51" y="43" width="16" height="2"/><rect x="53" y="74" width="20" height="2.5"/><rect x="54" y="96" width="13" height="2"/></g>` +
          '<g fill="#c8d0df"><circle cx="23" cy="31" r="1"/><circle cx="97" cy="31" r="1"/><circle cx="23" cy="105" r="1"/><circle cx="97" cy="105" r="1"/></g><rect x="44" y="108" width="32" height="7" fill="#454c5d"/><rect x="35" y="114" width="50" height="7" rx="2" fill="#778193" stroke="#b7c2d1"/><path d="M56 114l5 3-4 4" fill="none" stroke="#d68cf4" stroke-width="1.5"/>',
        eyes: '<g class="cubie-eyes"><rect x="35" y="48" width="17" height="26" fill="#17251a"/><path d="m94 49 17 23m0-23-17 23" fill="none" stroke="#fff5f5" stroke-width="5" stroke-linecap="square"/></g>',
        mouth: '<g class="cubie-smile"><path d="M52 90h9v7h12v7H52Z" fill="#17251a"/><path d="M74 91 115 85 111 107 73 104Z" fill="#fff5f5"/><path d="m75 95 5 6 4-8 5 7 5-8 5 7 5-9 4 8 6-9-5 15-35-3Z" fill="#050710"/></g>',
      };
    }
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
      return { sideOffset: 0, shadowOffset: 0, sideColor: '#8ebbd5', shadowColor: '#658eae', detail: `<defs>${clip}<linearGradient id="${id('glass')}" x2="1" y2="1"><stop stop-color="#effaff" stop-opacity=".7"/><stop offset=".45" stop-color="#7ab6da" stop-opacity=".15"/><stop offset="1" stop-color="#4f80b0" stop-opacity=".6"/></linearGradient></defs><g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('glass')}"/>${snow}<path d="M20 98q14-10 30-2t50-1v15H20Z" fill="#f0fbff"/></g><path d="M28 53V43q0-9 12-9m43 0 8 5" fill="none" stroke="#f3feff" stroke-width="3" stroke-linecap="round"/><path d="M16 105h88v10q-44 10-88 0Z" fill="#574777" stroke="#c3b3e0" stroke-width="1.5"/><ellipse cx="60" cy="105" rx="44" ry="5" fill="#9a88bd" stroke="#d3c9ee"/><path d="M24 114q36 6 72 0" fill="none" stroke="#c4acd9" stroke-width="1.5"/>` };
    }
    if (item.id === 'shop_aurora') {
      const ribbons = [
        ['M0 46Q30 10 60 35T120 29', '#84ffd4', 0],
        ['M0 65Q30 29 60 54T120 48', '#79ddff', -2.3],
        ['M0 108Q30 72 60 97T120 91', '#dfa8ff', -4.6],
      ].map(([path, color, delay]) => `<g class="aurora-ribbon" style="animation-delay:${delay}s">` +
        `<path d="${path}" fill="none" stroke="${color}" stroke-width="17" opacity=".2" filter="${url('aurora-blur')}"/>` +
        `<path d="${path}" fill="none" stroke="${color}" stroke-width="6" opacity=".75"/>` +
        `<path d="${path}" fill="none" stroke="#e2fff5" stroke-width="1.2" opacity=".85"/>` +
        `<path class="aurora-current" style="animation-delay:${delay}s" d="${path}" pathLength="100" fill="none" stroke="#effffa" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="2 24"/></g>`).join('');
      return { faceColor: '#eafff4', sideColor: '#294c73',
        back: `<defs><radialGradient id="${id('aurora-halo')}"><stop offset=".25" stop-color="#7ef2c6" stop-opacity=".32"/><stop offset=".7" stop-color="#93b7ff" stop-opacity=".15"/><stop offset="1" stop-color="#c19aff" stop-opacity="0"/></radialGradient></defs><ellipse class="aurora-halo" cx="60" cy="68" rx="66" ry="65" fill="${url('aurora-halo')}"/>`,
        detail: `<defs>${clip}<filter id="${id('aurora-blur')}" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="3"/></filter><linearGradient id="${id('aurora-night')}" x2=".7" y2="1"><stop stop-color="#273753"/><stop offset=".6" stop-color="#314d75"/><stop offset="1" stop-color="#4e396f"/></linearGradient></defs>` +
          `<g clip-path="${url('body')}"><rect x="20" y="28" width="80" height="80" fill="${url('aurora-night')}"/>${ribbons}` +
          [[29,38],[78,33],[90,78],[31,89],[68,99]].map(([x,y],i)=>sparkle(x,y,-i*.8,1.5)).join('') +
          '</g><path d="M25 49V40q0-7 8-7m54 70h3q5 0 5-6" fill="none" stroke="#9cf2dd" stroke-width="1.2" opacity=".7"/>' };
    }
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
  // Shared material treatment, with attack-specific hardware and light effects.
  // Keep the existing animated accessories and unlock catalog as the source.
  function polishAttackArt(item, enhanced, uid) {
    if (!item.id.startsWith('attack_') || item.id === 'attack_core_event_lattice') return enhanced;
    const key = item.id.slice(7);
    const id = name => `attack-${name}-${uid}`;
    const url = name => `url(#${id(name)})`;
    const tint = (hex, target, amount) => '#' + hex.slice(1).match(/../g).map((part, i) =>
      Math.round(parseInt(part, 16) * (1-amount) + target[i] * amount).toString(16).padStart(2,'0')).join('');
    const light = tint(item.color, [255,255,255], .6);
    const dark = tint(item.color, [20,30,55], .55);
    const accent = key.startsWith('pumpkin') ? '#ffe6b0' : '#acfff1';
    const pulse = (art, delay = 0) => `<g class="cubie-motion attack-glimmer" style="animation-delay:${delay}s">${art}</g>`;
    const flow = (d, color = accent) => `<path class="cubie-motion attack-energy-flow" d="${d}" pathLength="100" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="3 17" stroke-linecap="round"/>`;
    const rivet = (x,y) => `<circle cx="${x}" cy="${y}" r="2" fill="${dark}" stroke="${light}" stroke-width=".6"/><path d="M${x-1} ${y}h2" stroke="${light}" stroke-width=".6"/>`;
    const gem = (x,y,color) => `<g transform="translate(${x} ${y})"><path d="M0-5 4 0 0 5-4 0Z" fill="${color}" stroke="#f4ffff" stroke-width=".65"/><path d="M0-5V5L4 0Z" fill="#fff" opacity=".25"/></g>`;
    let extra = '', rear = '';
    switch (key) {
      case 'pumpkin_color_memory':
        extra = '<path d="M60 32v68" stroke="#efffff" stroke-width=".8" opacity=".55"/>' +
          [32,52,72].map(x=>`<path d="M${x+2} 28v-8h8M${x+12} 19v-8h8" fill="none" stroke="#efffff" stroke-width=".9" opacity=".85"/>`).join('') +
          flow('M28 97H92');
        break;
      case 'pumpkin_bone_gauntlet':
        extra = '<path d="M26 46v39M94 46v39" stroke="#fff9e3" stroke-width="1.4" stroke-linecap="round"/>' +
          [24,96].map(x=>[45,84].map(y=>`<ellipse cx="${x}" cy="${y}" rx="4" ry="3" fill="#f6ebd0" stroke="#9c917d" stroke-width=".7"/>`).join('')).join('') +
          '<path d="M38 95h44M42 101h36" stroke="#c9bda0" stroke-width=".8"/>' + pulse(gem(60,22,'#f8e9b8'));
        break;
      case 'pumpkin_rotating_rings':
        extra = flow('M8 78Q60 123 112 78','#fff3b0') + flow('M8 40Q60 1 112 40','#dbffff') +
          '<path d="M8 81Q60 126 112 81M8 37Q60-2 112 37" fill="none" stroke="#d9beff" stroke-width=".7" opacity=".7"/>' + pulse(gem(60,22,'#ffd480'));
        rear = '<ellipse class="cubie-motion attack-orbit-halo" cx="60" cy="68" rx="58" ry="50" fill="none" stroke="#b2eaff" stroke-width=".7" stroke-dasharray="1 7"/>';
        break;
      case 'pumpkin_magenta_fingers':
        extra = '<path d="M37 27V16M49 25V9M61 26V12M73 26v-9" stroke="#ffc3e9" stroke-width="1.2" stroke-linecap="round"/><path d="M35 29q23-7 43 0" fill="none" stroke="#783265" stroke-width="1.4"/>' +
          rivet(30,98) + rivet(90,98) + flow('M37 98H83','#fff0c8');
        break;
      case 'pumpkin_chaos':
        extra = '<g class="cubie-motion chaos-cosmetic" style="--chaos-x:1px;--chaos-y:-2px;--chaos-tilt:5deg">' +
          '<path d="M24 41q0-9 10-9h15M96 88v6q0 10-10 10H75" fill="none" stroke="#ddffff" stroke-width="1.3"/><path d="m29 24 8-12 12 14 14-16 10 15 13-9 7 10" fill="none" stroke="#fff1bc" stroke-width=".8"/></g>';
        break;
      case 'pumpkin_royal_slams':
        extra = '<path d="M25 29 23 17 42 28 60 10 78 28 97 17 95 29" fill="none" stroke="#fff1b2" stroke-width="1.3"/><path d="M20 49h10v34H20M90 49h10v34H90" fill="none" stroke="#ede1c4" stroke-width=".8"/>' +
          [38,60,82].map((x,i)=>pulse(gem(x,28,i===1?'#ff8b9d':'#82dfef'),-i*.7)).join('') +
          rivet(34,100)+rivet(86,100)+flow('M41 100H79','#fff0b2');
        break;
      case 'pumpkin_haunted_quadrants':
        extra = '<path d="M27 94h13v8H27M44 94h14v8H44M62 94h13v8H62M79 94h13v8H79" fill="none" stroke="#fff0ff" stroke-width=".6"/>' +
          [8,112].map((x,i)=>`<g transform="translate(${x} 63)"><g class="cubie-motion motion-hover" style="animation-delay:${-i*1.4}s"><path d="M-4 7V-3q0-8 5-8t5 8V7L3 4 0 7Z" fill="#d9d6ff" opacity=".55"/><path d="M-1-3v3m4-3v3" stroke="#746490" stroke-width="1"/></g></g>`).join('');
        break;
      case 'core_railgun_array':
        extra = '<path d="M12 34v46M23 34v46M97 34v46M108 34v46" stroke="#d0e5f4" stroke-width=".8"/>' +
          [17,102].map(x=>flow(`M${x} 76V34`,'#eeffff')+rivet(x,81)).join('') +
          '<path d="M45 18h30v4H45Z" fill="#5f7589"/>' + pulse('<path d="M49 20h22" stroke="#fff4b8" stroke-width="1.6"/>');
        break;
      case 'core_accretion_sweep':
        extra = '<path d="M13 80Q58 118 110 73" fill="none" stroke="#fff1d7" stroke-width="1.2"/>' + flow('M13 83Q58 121 110 76','#fff6d8') +
          flow('M20 39Q60 4 100 39','#d9ffff') + pulse(gem(60,19,'#ffe2b4'));
        rear = '<ellipse class="cubie-motion attack-orbit-halo" cx="60" cy="67" rx="62" ry="45" fill="none" stroke="#d5b4ff" stroke-width=".7" stroke-dasharray="2 9"/>';
        break;
      case 'core_collapsing_horizons':
        extra = '<path d="M30 40v-6h60v6M30 94v5h60v-5" fill="none" stroke="#f4eaff" stroke-width=".8"/>' +
          flow('M12 45V19H108V45M12 86V115H108V86','#ceffff') +
          [12,108].map(x=>pulse(gem(x,49,'#ffcfa0'),-x/80)).join('');
        break;
      case 'core_target_lock':
        extra = '<circle cx="60" cy="14" r="7" fill="none" stroke="#ffe2cd" stroke-width=".9"/><path d="M32 41v-8h11M77 33h11v8M32 93v7h11M77 100h11v-7" fill="none" stroke="#ffe7d6" stroke-width="1"/>' +
          pulse('<circle cx="60" cy="14" r="4" fill="#fff0a9"/><circle cx="60" cy="14" r="14" fill="none" stroke="#ffb891" stroke-width=".6"/>');
        break;
      case 'core_binary_stars':
        extra = flow('M24 94Q60 112 96 94','#d8ffff') +
          '<ellipse cx="60" cy="17" rx="36" ry="14" fill="none" stroke="#b9dced" stroke-width=".6" opacity=".7"/>' +
          [0,1].map(i=>`<g transform="translate(60 17)"><g class="cubie-motion motion-binary" style="animation-delay:${-i*3}s"><path d="M0-8 2 0 0 8-2 0Z" fill="#fff" opacity=".85"/></g></g>`).join('');
        break;
      case 'core_gravity_guillotine':
        extra = '<path d="M14 32v70M23 32v70M97 32v70M106 32v70" stroke="#d2e5f1" stroke-width=".8"/>' +
          `<g class="cubie-motion motion-blade"><path d="M28 21h63v9L28 44Z" fill="none" stroke="#fff" stroke-width=".85"/><path d="m29 42 62-13" stroke="#b8ffff" stroke-width="1.5"/></g>` +
          [18,102].map(x=>[36,98].map(y=>rivet(x,y)).join('')).join('');
        break;
      case 'core_photon_rain':
        extra = '<path d="M20 25Q60-10 100 25M37 24Q43 10 59 9M63 9Q79 11 84 24" fill="none" stroke="#d5ffff" stroke-width="1.1"/>' +
          [[7,40],[111,60],[19,93],[101,97]].map(([x,y],i)=>`<g transform="translate(${x} ${y})"><g class="cubie-motion motion-rain" style="animation-delay:${-i*.5}s"><path d="M0-7V2" stroke="#adf6ff" stroke-width=".8"/><circle cy="4" r="1.5" fill="#f1ffff"/></g></g>`).join('');
        break;
      case 'core_crossfire_engine':
        extra = '<path d="M47 19h26v7H47Z" fill="none" stroke="#ffe6d1" stroke-width=".8"/>' +
          [27,93].map(x=>rivet(x,35)+rivet(x,100)).join('') + pulse(gem(60,23,'#ffe3ab'));
        break;
      case 'core_dark_matter_mines':
        extra = [33,88].map((x,i)=>`<g class="cubie-motion attack-glimmer" style="animation-delay:${-i*.8}s"><circle cx="${x}" cy="20" r="12" fill="none" stroke="#e1bdff" stroke-width=".7" stroke-dasharray="2 3"/><circle cx="${x}" cy="20" r="5" fill="none" stroke="#ffa6e5" stroke-width="1"/><path d="M${x-2} 18h4v4h-4Z" fill="#fff0ff"/></g>`).join('') + flow('M28 99l7-7 7 7 7-7 7 7 7-7 7 7 7-7 7 7 7-7','#efc9ff');
        break;
      case 'core_polarity_inversion':
        extra = '<path d="M60 31v72" stroke="#e8ffff" stroke-width=".8" opacity=".6"/><path d="M10 45v38q0 10 10 10M110 45v38q0 10-10 10" fill="none" stroke="#e3d6ff" stroke-width=".8"/>' +
          flow('M12 45V83Q12 91 20 91','#a3ffff') + flow('M108 45V83Q108 91 100 91','#ffb8ea') +
          pulse('<path d="M25 35h16M33 30v10M79 35h16" stroke="#fff" stroke-width="1"/>');
        break;
      case 'core_orbital_saws':
        rear = '<g class="cubie-motion motion-spin" style="transform-origin:60px 68px;animation-duration:8s"><circle cx="60" cy="68" r="49" fill="none" stroke="#e8f5ff" stroke-width="1"/>' +
          Array.from({length:20},(_,i)=>`<path d="M60 13l3 8" transform="rotate(${i*18} 60 68)" stroke="#d4e5ee" stroke-width="1"/>`).join('') + '</g>';
        extra = [34,86].map(x=>rivet(x,36)+rivet(x,100)).join('') + flow('M40 100H80','#c4ffff');
        break;
      case 'core_echo_protocol':
        rear = [0,1].map(i=>`<g class="cubie-motion motion-echo" style="animation-delay:${-i*1.4}s"><rect x="${7+i*6}" y="${10+i*9}" width="80" height="80" rx="14" fill="none" stroke="#c7fff6" stroke-width="1" opacity=".6"/></g>`).join('');
        extra = [7,113].map((x,i)=>`<g transform="translate(${x} 60)"><g class="cubie-motion attack-glimmer" style="animation-delay:${-i}s"><path d="M-2-12q-9 12 0 24M3-17q-14 17 0 34" fill="none" stroke="#c5ffff" stroke-width=".8"/></g></g>`).join('');
        break;
      case 'core_lens_fracture':
        extra = '<path d="M34 29 44 10 56 28M66 28 76 14 90 29M44 10l4 18M76 14l7 15" fill="none" stroke="#fff" stroke-width="1"/>' +
          '<path d="M24 44 39 33 47 48M96 87 82 103 75 91" fill="none" stroke="#b8ffff" stroke-width=".7"/>' +
          [0,1].map(i=>pulse(gem(i?108:12,i?85:50,i?'#d4b7ff':'#a6efff'),-i*1.3)).join('');
        break;
      case 'core_total_collapse':
        extra = '<path d="m29 28 9 13-9 4 8 8M91 28 82 40l10 7-7 7M28 103l12-12-7-4M92 103 80 92l8-6" fill="none" stroke="#ffdcf3" stroke-width="1"/>' +
          [0,1,2,3].map(i=>`<g transform="translate(${i%2?111:9} ${38+Math.floor(i/2)*54})"><g class="cubie-motion motion-hover" style="animation-delay:${-i*.8}s"><path d="M0-5 4-1 2 5-4 2Z" fill="#ba82c0" stroke="#ffd8ed" stroke-width=".8"/></g></g>`).join('');
        rear = '<ellipse class="cubie-motion attack-orbit-halo" cx="60" cy="67" rx="61" ry="55" fill="none" stroke="#d39bd7" stroke-width="1" stroke-dasharray="2 8"/>';
        break;
    }
    // Give each accessory its own beveled material instead of flattening the
    // entire character with a filter. CSS color swaps still override these fills.
    let materialDefs = '', index = 0;
    const materials = new Map();
    const polish = markup => markup.replace(/fill="(#[a-f\d]{6})"/gi, (_, color) => {
      if (!materials.has(color)) {
        const name = `material-${index++}`;
        materials.set(color, name);
        materialDefs += `<linearGradient id="${id(name)}" x2=".75" y2="1"><stop stop-color="${tint(color,[255,255,255],.45)}"/><stop offset=".32" stop-color="${color}"/><stop offset=".78" stop-color="${tint(color,[12,23,45],.22)}"/><stop offset="1" stop-color="${tint(color,[255,255,255],.18)}"/></linearGradient>`;
      }
      return `fill="${url(materials.get(color))}"`;
    });
    const detail = polish(enhanced?.detail || item.detail);
    const back = polish(enhanced?.back ?? item.back ?? '') + rear;
    const shell = key === 'pumpkin_color_memory'
      ? `<rect x="20" y="28" width="80" height="80" fill="${url('clear-shade')}"/>`
      : `<rect x="20" y="28" width="80" height="80" fill="${url('shell')}"/>`;
    const defs = `<defs><clipPath id="${id('body')}">${item.body}</clipPath>${materialDefs}<linearGradient id="${id('shell')}" x2=".7" y2="1"><stop stop-color="${light}"/><stop offset=".35" stop-color="${item.color}"/><stop offset="1" stop-color="${tint(item.color,[25,35,65],.35)}"/></linearGradient><linearGradient id="${id('clear-shade')}" x2=".8" y2="1"><stop stop-color="#fff" stop-opacity=".25"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#142741" stop-opacity=".22"/></linearGradient></defs>`;
    const finish = `<g class="attack-finish" clip-path="${url('body')}"><path d="M25 48V41q0-8 9-8h45M95 86v9q0 8-9 8H43" fill="none" stroke="${light}" stroke-width="1.1" opacity=".8"/><path d="M23 51v43q0 11 11 11h49" fill="none" stroke="${dark}" stroke-width=".7" opacity=".65"/></g>`;
    return { ...enhanced, sideColor: tint(item.color,[22,35,58],.48), shadowColor: tint(item.color,[15,23,40],.75),
      back: defs + back,
      detail: `<g clip-path="${url('body')}">${shell}</g>${detail}${finish}<g class="attack-fine-detail">${extra}</g>` };
  }
  function faceBlush(item) {
    const [left, right, y, rx, ry] = item.id === 'golden_hand' ? [50, 101, 113, 9, 5]
      : ['diamond', 'star'].includes(item.id) ? [36, 109, 84, 10, 6]
      : item.id === 'shop_space_junk' ? [40, 103, 84, 8, 5]
      : item.id === 'shop_hacker' ? [30, 119, 80, 10, 5]
      : [30, 115, 86, 14.5, 8];
    return `<g class="cubie-blush" fill="#f17f99"><ellipse cx="${left}" cy="${y}" rx="${rx}" ry="${ry}"/><ellipse cx="${right}" cy="${y}" rx="${rx}" ry="${ry}"/></g>`;
  }
  function puzzleCubeSvg() {
    const palette = ['#ee5254', '#f5a43c', '#ffe064', '#55c780', '#548eea', '#f1f3ef'];
    // A fixed, balanced scramble keeps previews stable across renders and reloads.
    const stickers = Array.from({length:54}, (_,i) => palette[Math.floor(i/9)]);
    let seed = 72841;
    for (let i = stickers.length-1; i > 0; i--) {
      seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;
      const j = seed % (i+1);
      [stickers[i],stickers[j]] = [stickers[j],stickers[i]];
    }
    let sticker = 0;
    const sides = ['front','right','back','left','top','bottom'];
    const layers = [0,1,2].map(row => {
      const faces = sides.map(side => {
        const cap = side === 'top' || side === 'bottom';
        const external = !cap || (side === 'top' ? row === 0 : row === 2);
        const height = cap ? 108 : 36;
        const tiles = external ? Array.from({length: cap ? 9 : 3}, (_,i) => {
          const color = stickers[sticker++], x = i%3*36, y = Math.floor(i/3)*36;
          return `<rect class="puzzle-sticker" data-color="${color}" x="${x+.65}" y="${y+.65}" width="34.7" height="34.7" rx="1.5" fill="${color}"/><path d="M${x+3} ${y+13}V${y+4}q0-1 1-1h25" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width=".7"/><path d="M${x+33} ${y+22}v9q0 2-2 2H${x+9}" fill="none" stroke="#101820" stroke-opacity=".16" stroke-width=".7"/>`;
        }).join('') : '';
        return `<div class="puzzle-face puzzle-face-${side}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 ${height}"><rect width="108" height="${height}" fill="${external ? '#64717b' : '#424e59'}"/>${tiles}</svg></div>`;
      }).join('');
      return `<div class="puzzle-layer puzzle-layer-${row}" style="top:${row*36-54}px">${faces}</div>`;
    }).join('');
    // The expression is composited above the solid slices, so no rotating
    // edge can carry an eye away or draw a seam across Cubie's smile.
    const expression = '<div class="puzzle-face-overlay"><div class="puzzle-face-anchor"><div class="puzzle-expression"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 145 145"><g class="cubie-eyes" fill="#17251a" stroke="#fff4d5" stroke-width="1" paint-order="stroke"><rect x="35" y="48" width="17" height="26"/><rect x="93" y="48" width="17" height="26"/></g><path class="cubie-smile" d="M52 90h9v7h23v-7h9v14H52Z" fill="#17251a" stroke="#fff4d5" stroke-width="1" paint-order="stroke"/><g class="cubie-blush" fill="#f17f99"><ellipse cx="30" cy="86" rx="14.5" ry="8"/><ellipse cx="115" cy="86" rx="14.5" ry="8"/></g></svg></div></div></div>';
    return `<svg class="cubie-custom-art" data-custom="shop_puzzle_cube" viewBox="0 0 145 145" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g class="cubie-float"><foreignObject width="145" height="145" class="puzzle-volume"><div xmlns="http://www.w3.org/1999/xhtml" class="puzzle-scene"><div class="puzzle-cube">${layers}</div>${expression}</div></foreignObject></g></svg>`;
  }
  function discoSphereSvg() {
    const colors = ['#b6bbc4', '#d0d3d9', '#a6adb8', '#c3c6cd', '#dde0e5', '#b5b8c5'];
    const radius = 62, rows = 12, columns = 24;
    const radians = Math.PI / 180;
    const halfLongitude = Math.PI / columns;
    const fixed = value => Number(value.toFixed(4));
    const tiles = [];
    for (let row = 0; row < rows; row++) {
      const top = (90 - row * 180 / rows) * radians;
      const bottom = top - Math.PI / rows;
      const yTop = -radius * Math.sin(top), yBottom = -radius * Math.sin(bottom);
      const zTop = radius * Math.cos(top) * Math.cos(halfLongitude);
      const zBottom = radius * Math.cos(bottom) * Math.cos(halfLongitude);
      const topWidth = 2 * radius * Math.cos(top) * Math.sin(halfLongitude);
      const bottomWidth = 2 * radius * Math.cos(bottom) * Math.sin(halfLongitude);
      const width = Math.max(topWidth, bottomWidth);
      const height = Math.hypot(yBottom - yTop, zBottom - zTop);
      const tilt = Math.atan2(zBottom - zTop, yBottom - yTop) / radians;
      // Trapezoids share exact spherical corner positions, including the poles.
      const points = [[(width-topWidth)/2,0],[(width+topWidth)/2,0],
        [(width+bottomWidth)/2,height],[(width-bottomWidth)/2,height]]
        .map(point => point.map(fixed).join(',')).join(' ');
      for (let column = 0; column < columns; column++) {
        const longitude = -180 + (column + .5) * 360 / columns;
        const eye = Math.abs(longitude) === 22.5 && (row === 3 || row === 4);
        const smile = (row === 7 && Math.abs(longitude) <= 22.5)
          || (row === 6 && Math.abs(longitude) === 22.5);
        const tile = `<polygon points="${points}" fill="${colors[(row*3+column)%colors.length]}" stroke="#747d8b" stroke-width=".6"/>`;
        const face = eye ? `<g class="cubie-eyes"><polygon points="${points}" fill="#253449"/></g>`
          : smile ? `<polygon class="cubie-smile" points="${points}" fill="#253449"/>` : '';
        const blush = row === 5 && [37.5, 52.5].includes(Math.abs(longitude))
          ? `<g class="cubie-blush"><polygon points="${points}" fill="#f17f99"/></g>` : '';
        const transform = `translate(-50%, -50%) rotateY(${longitude}deg) translate3d(0, ${fixed((yTop+yBottom)/2)}px, ${fixed((zTop+zBottom)/2)}px) rotateX(${fixed(tilt)}deg)`;
        tiles.push(`<div class="disco-tile" style="width:${fixed(width)}px;height:${fixed(height)}px;transform:${transform}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fixed(width)} ${fixed(height)}">${tile}${face}${blush}</svg></div>`);
      }
    }
    return `<svg class="cubie-custom-art" data-custom="shop_disco" viewBox="0 0 145 145" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g class="cubie-float"><foreignObject x="0" y="0" width="145" height="145" class="disco-volume"><div xmlns="http://www.w3.org/1999/xhtml" class="disco-scene"><div class="disco-sphere">${tiles.join('')}</div><div class="disco-shading"></div></div></foreignObject></g></svg>`;
  }
  function threeDCubieSvg() {
    return '<svg class="cubie-custom-art" data-custom="three_d" viewBox="0 0 145 145" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<g class="cubie-3d-float"><path d="M72 8 132 40 72 72 12 40Z" fill="#dfffad" stroke="#eaffc9" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M72 72 132 40V106L72 138Z" fill="#719e47" stroke="#517c34" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M12 40 72 72V138L12 106Z" fill="#b8eb77" stroke="#8dbb55" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M12 40 72 72 132 40M72 72V138" fill="none" stroke="#efffc9" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<g transform="matrix(.413793 .220690 0 .455172 12 40)"><g class="cubie-eyes" fill="#263c22"><rect x="35" y="48" width="17" height="26"/><rect x="93" y="48" width="17" height="26"/></g>' +
      '<path class="cubie-smile" d="M52 90h9v7h23v-7h9v14H52Z" fill="#263c22"/>' +
      '<g class="cubie-blush" fill="#f17f99"><ellipse cx="30" cy="86" rx="14.5" ry="8"/><ellipse cx="115" cy="86" rx="14.5" ry="8"/></g></g></g></svg>';
  }
  function svg(item) {
    if (item.id === 'shop_puzzle_cube') return puzzleCubeSvg();
    if (item.id === 'three_d') return threeDCubieSvg();
    if (item.id === 'shop_disco') return discoSphereSvg();
    const uid = ++artId;
    const enhanced = polishAttackArt(item, animatedArt(item, uid), uid);
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
      (item.id === 'shop_koi' ? '<g class="koi-orientation" transform="rotate(180 72.5 72.5)">' : '') +
      `<g class="cubie-back" transform="${fit}" stroke-linejoin="round">${back}</g>` +
      silhouette(enhanced?.shadowColor || '#202b22', enhanced?.shadowOffset ?? 25, 'cubie-shadow') +
      silhouette(enhanced?.sideColor || (item.id === 'classic' ? '#6d8b44' : sideColor(item.color)), enhanced?.sideOffset ?? 13, 'cubie-side') +
      `<g class="cubie-underbody" transform="${fit}" stroke-linejoin="round">${item.underBody || ''}</g>` +
      silhouette(item.color, 0, 'cubie-front') +
      `<g class="cubie-trim" transform="${fit}" stroke-linejoin="round">${detail}</g>` +
      (item.id === 'shop_koi' ? '<g class="koi-face" transform="translate(0 -18) rotate(180 72.5 76)">' : '') +
      (enhanced?.eyes || `<g fill="${faceColor}" class="cubie-eyes"><rect x="35" y="48" width="17" height="26"/><rect x="93" y="48" width="17" height="26"/>${enhanced?.eyeHighlights || ""}</g>`) +
      (enhanced?.eyeEffects || "") +
      (enhanced?.mouth || `<path class="cubie-smile" d="M52 90h9v7h23v-7h9v14H52Z" fill="${faceColor}"/>`) +
      faceBlush(item) +
      (item.id === 'shop_koi' ? '</g>' : '') +
      (item.id === 'shop_koi' ? '</g>' : '') +
      '</g></svg>';
  }
  return { catalog, tierLabels, unlocked, selected, svg, testerCodeActive, redeemTesterCode };
})();
if (typeof module !== "undefined") module.exports = CubieCustoms;

// Portable catalog access for the shared browser/server account rules.
if (typeof globalThis !== "undefined") globalThis.CubieCustoms = CubieCustoms;
