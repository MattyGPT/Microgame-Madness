"use strict";
// The same vector illustrations appear on falling tiles and guide previews.
const ChaosArt = (() => {
  const bodyPaths = {
    spike: 'M16 1 31 31H1Z',
    thunder: 'M7 28C-2 28-2 14 6 13C3 3 16-2 21 7C29 3 34 13 29 18C36 25 28 31 23 28Z',
  };
  const paths = {
    bandage: 'M5 13 13 5l14 14-8 8ZM12 12l8 8M9 16l7-7M16 23l7-7',
    medkit: 'M4 10h24v18H4ZM11 10V5h10v5M16 14v10M11 19h10',
    detox: 'M11 3h10M13 3v9L5 26q11 6 22 0l-8-14V3M10 23l4 3 8-9',
    coolant: 'M8 4h16v24H8ZM11 9h10M16 12v12M12 15l8 6M12 21l8-6',
    compass: 'M29 16a13 13 0 1 1-26 0 13 13 0 0 1 26 0M22 8l-4 12-8 4 4-12ZM16 2v4M16 26v4',
    battery: 'M6 7h20v23H6ZM12 2h8v5M17 10l-7 10h7l-1 7 8-11h-8Z',
    snowglobe: 'M24 25a13 13 0 1 0-16 0M7 25h18v5H7ZM16 5v15M10 9l12 8M10 17l12-8',
    sweeper: 'M21 3 11 17M8 14l10 6-5 10-11-6ZM6 27l6-9M10 29l6-9M24 16h6M22 22h5',
    oasis: 'M3 26q13-8 26 0M16 24V10M16 12Q5 0 3 12M16 12Q27 0 29 12M16 12Q10 4 8 5',
    clean_slate: 'M7 3h18v26H7ZM10 19l5 5 10-13M3 6h5M5 4v5M24 2l4 4',
    cinder: 'M17 2q-2 10 6 13 10 13-7 15Q0 29 7 17l4-7 1 10q8-5 5-18ZM6 4l2 3M27 9l-2 3',
    spore: 'M3 17Q2 2 16 3q14 0 13 14ZM12 17v12h8V17M8 10h1M18 7h1M24 12h1',
    sleet: 'M4 10q-3-9 7-7 7-5 12 3 9 0 5 8H5ZM8 18l-3 7M17 18l-3 7M26 18l-3 7',
    dizzy: 'M25 10q-4-11-14-6Q0 9 8 20q8 10 17 0 7-10-4-12-9-1-9 6t8 2M3 29l5-5M25 27l4 3',
    leech: 'M7 4q18-4 18 9-1 10-12 16-10 1-7-8 13-3 12-10-3-5-11-1ZM8 6l3 5M14 4l1 5',
    overload: 'M18 3 7 17h9l-2 12 12-17h-9ZM3 3l4 4M25 25l5 5M2 23l5-3M25 6l5-3',
    nullifier: 'M28 16a12 12 0 1 1-24 0 12 12 0 0 1 24 0M7 7l18 18M10 16h12',
    glass: 'M16 2 28 12 23 28H9L4 12ZM4 12h24M16 2l-5 10 5 16 5-16Z',
    dart: 'M16 30 7 9l9 4 9-4ZM16 13V2M10 2l6 5 6-5',
    anvil: 'M2 7h28l-5 9h-7v8l9 4H5l9-4v-8H8ZM8 7V3h16v4',
    lantern: 'M9 8h14l4 19H5ZM12 8V3h8v5M8 28h16M16 12v10M12 17h8',
    sawtooth: 'M5 3l22 7L5 17l22 7-22 5M4 5V2h5M23 26l5-2-2-5',
    waltz: 'M3 20Q8 0 16 16t13-4M3 27Q8 7 16 23t13-4',
    boomerang: 'M4 4 27 14 18 29l-5-13ZM4 4l9 12M27 14l-14 2',
    blink: 'M2 16q14-21 28 0-14 21-28 0ZM21 16a5 5 0 1 1-10 0 5 5 0 0 1 10 0M5 4l3 4M27 4l-3 4',
    hopper: 'M5 27h22M6 22Q4 2 14 7t12-1M7 21l-2 5 6-1M16 13q8 7 10-7M22 7l4-3 3 4',
    crossbow: 'M16 2v28M2 16h28M11 7l5-5 5 5M25 11l5 5-5 5M11 25l5 5 5-5M7 11l-5 5 5 5',
    diagonal: 'M3 3l26 26M3 29 29 3M3 9V3h6M23 3h6v6M3 23v6h6M23 29h6v-6',
    spinner: 'M24 7a12 12 0 1 0 3 15M24 2v7h-7M16 10v12M10 16h12',
    scatter: 'M16 28V4M16 21 3 8M16 21 29 8M11 9l5-5 5 5M3 14V8h6M23 8h6v6',

    ricochet_shield: 'M16 3 27 7v10q-1 8-11 12Q6 25 5 17V7ZM10 18l6-7 6 7M16 11v12M2 3l4 2M30 3l-4 2',
    blaster: 'M7 10h18v16H7ZM12 5h8v9h-8ZM12 20h8',
    fan: 'M21 16a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
    leafy: 'M5 27Q0 4 27 4q3 23-22 23ZM5 27 24 7M12 20V10M17 15h9',
    turbo: 'M4 5l11 11L4 27M17 5l11 11-11 11',
    elite_leafy: 'M5 27Q0 4 27 4q3 23-22 23ZM5 27 24 7M12 20V10M17 15h9M3 3l5 2-3 5M29 29l-5-2 3-5',
    elite_turbo: 'M4 7l9 9-9 9M16 7l9 9-9 9M6 2h20M6 30h20',
    spike: 'M3 12 7 2l5 10 4-10 4 10 5-10 4 10ZM4 15v13h24V15',
    thunder: 'M18 2 7 18h9l-2 12 12-18h-9Z',
    steaming: 'M4 24h24M8 28h16M8 19c-8-6 8-6 0-13M16 19c-8-6 8-6 0-16M24 19c-8-6 8-6 0-13',
    electric: 'M18 2 7 18h9l-2 12 12-18h-9ZM3 8l3 3M26 24l3 3',
    stinky: 'M6 27q-5-7 3-9 0-8 8-5 9-3 9 6 6 8-4 8ZM10 9Q5 6 10 2M22 9q-5-3 0-7',
    chilly: 'M16 3v26M5 9l22 14M5 23 27 9M12 5l4 4 4-4M12 27l4-4 4 4M5 14l5-2-1-5M23 25l-1-5 5-2',
    mystery: 'M9 10a7 7 0 0 1 14 0c0 5-7 5-7 10M16 25v2',
    pusher: 'M4 4h24v7H4ZM16 11v13M10 18l6 6 6-6M4 28h24',
    vortex: 'M27 16A11 11 0 1 1 16 5q10 0 10 9t-10 9q-8 0-8-7t8-7q6 0 6 6t-6 6q-4 0-4-4t4-4M12 4l4 1-2 4',
    pinball: 'M4 4v24M28 4v24M6 24 23 7M18 7h5v5M22 23a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
    iceburst: 'M16 3v26M5 9l22 14M5 23 27 9M12 5l4 4 4-4M12 27l4-4 4 4M2 3l4 2M30 3l-4 2M2 29l4-2M30 29l-4-2',
    firecracker: 'M9 8h14v20H9ZM9 13h14M9 23h14M16 8V4l7-2M25 1v5M23 3h6M3 15l3 2-3 2M29 15l-3 2 3 2',
    sanctuary: 'M16 2 28 8v12L16 30 4 20V8ZM13 9h6v5h5v6h-5v5h-6v-5H8v-6h5Z',
    vertigo: 'M4 10h23M4 10l6-6M4 10l6 6M28 23H5M28 23l-6-6M28 23l-6 6',

    fire_x: 'M5 5l22 22M27 5 5 27M5 11V5h6M21 5h6v6M5 21v6h6M21 27h6v-6',
    fire_plus: 'M16 2v28M2 16h28M11 7l5-5 5 5M25 11l5 5-5 5M11 25l5 5 5-5M7 11l-5 5 5 5',
    fire_star: 'M16 2v28M2 16h28M5 5l22 22M27 5 5 27M13 2h6M13 30h6M2 13v6M30 13v6',

    wild_seven: 'M7 5h19v5L15 28H9l11-18H7Z M10 17h13',
    gravity_well: 'M16 9 23 13v8l-7 4-7-4v-8ZM9 13l7 4 7-4M16 17v8M1 1l7 7M3 8h5V3M31 1l-7 7M24 3v5h5M1 31l7-7M3 24h5v5M31 31l-7-7M24 29v-5h5',
    force_wave: 'M16 9 23 13v8l-7 4-7-4v-8ZM9 13l7 4 7-4M16 17v8M8 8 1 1M1 6V1h5M24 8l7-7M26 1h5v5M8 24l-7 7M1 26v5h5M24 24l7 7M26 31h5v-5',

    phoenix: 'M16 27 4 14l8 3L8 4l8 9 8-9-4 13 8-3Z M16 13v14',
    aegis: 'M16 3 28 8v9L16 29 4 17V8Z M10 11h12v7l-6 6-6-6Z',
    mint: 'M6 26Q0 6 26 4q4 22-20 22Z M6 26 23 8M12 20l-1-9M16 16h9',
    clockwork: 'M27 16a11 11 0 1 1-22 0 11 11 0 0 1 22 0M16 9v7l5 3M16 1v4M16 27v4M1 16h4M27 16h4',
    repellent: 'M16 6 24 10v9l-8 7-8-7v-9Z M5 6 1 10l4 4M27 6l4 4-4 4M1 10h7M31 10h-7',
    lullaby: 'M22 3Q5 5 15 22 0 18 7 7M22 12v13q-8-3-8 2t8 1M22 12l7 3',
    tar: 'M16 3Q2 18 6 24q10 10 20 0Q30 18 16 3Z M10 20q-2 5 4 6',
    ember: 'M18 3q-1 9 7 14 4 12-9 12Q1 29 6 17l5-6 1 8q7-5 6-16Z',
    rust: 'M5 4h22v24H5Z M11 4l6 8-7 6 10 10M23 9h1M8 23h1M23 21h1',
    drain: 'M5 5h22M8 5v6l8 8 8-8V5M16 19v10M11 24l5 5 5-5',
    frostbite: 'M4 8h24L23 26l-7-11-7 11Z M16 2v8M12 4l8 4M20 4l-8 4',
    crossfire: 'M7 4l18 24M25 4 7 28M4 9h8M20 9h8M4 23h8M20 23h8M16 11l5 5-5 5-5-5Z',
    drill: 'M8 3h16v5l-2 13-6 8-6-8-2-13M9 9l14 5M10 15l12 5M11 21l8 3',
    ribbon: 'M3 8q7-6 13 0t13 0v15q-7 6-13 0T3 23Z M10 7v16M22 10v16',
    corkscrew: 'M23 4Q5 0 7 9t16 8Q5 12 7 23t16 5M16 2v28',
    parachute: 'M3 14a13 11 0 0 1 26 0Z M10 14q0-14 6-11 6-3 6 11M3 14l10 12M29 14 19 26M13 26h6v4h-6Z',
    rocket: 'M16 2q11 8 6 20H10Q5 10 16 2Z M10 15l-7 9 7-2M22 15l7 9-7-2M13 25l3 6 3-6M19 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    skater: 'M10 4h9v12l7 4v5H6V14h4Z M4 29h25M9 25v4M23 25v4M2 7h5M1 11h6',

    zigzag: 'M7 4h18L7 12l18 8L7 28 M20 24l-13 4 3-9',
    feather: 'M6 28 24 5Q12 0 6 12q-4 10 5 11Q30 24 26 4 M11 21l-2-8M15 17h8M18 12V6',
    boulder: 'M4 12 12 4l12 3 5 15-10 7-14-5Z M12 4l3 10-10 10M15 14l9-7M15 14l4 15',
    phase: 'M9 4H4v7M23 4h5v7M4 21v7h5M28 21v7h-5M16 7l9 9-9 9-9-9Z',
    surge: 'M2 18h5l4-11 6 20 5-16 3 7h5',
    rewind: 'M15 7 4 16l11 9ZM28 7l-11 9 11 9Z',
    mender: 'M10 4h12v7h7v10h-7v7H10v-7H3V11h7Z M13 16l3 3 5-6',
    stasis: 'M28 16a12 12 0 1 1-24 0 12 12 0 0 1 24 0 M11 10h3v12h-3z M19 10h3v12h-3z',
    venom_fang: 'M5 8q11-6 22 0l-4 17-6-13h-2L9 25Z M11 5V2M21 5V2',

    block_attractor: 'M12 12h8v8h-8z M2 2l8 8M5 10h5V5 M30 2l-8 8M22 5v5h5 M2 30l8-8M5 22h5v5 M30 30l-8-8M22 27v-5h5',
    block_repulsor: 'M12 12h8v8h-8z M10 10 2 2M2 7V2h5 M22 10l8-8M25 2h5v5 M10 22l-8 8M2 25v5h5 M22 22l8 8M25 30h5v-5',
    chaos_nexus: 'M16 3 29 16 16 29 3 16Z M12 12h8v8h-8z M16 3v6M29 16h-6M16 29v-6M3 16h6',

    curse: 'M8 4h16M8 28h16M10 4v6l12 12v6M22 4v6L10 22v6M5 11l4 3-4 3M27 11l-4 3 4 3M12 25h8',
    glitch: 'M4 5h11v4H8v7H4ZM28 27H17v-4h7v-7h4ZM12 12h8v8h-8ZM1 22h8M23 10h8',
    elite_glitch: 'M3 4h12v4H7v9H3ZM29 28H17v-4h8v-9h4ZM10 11h5v5h-5ZM19 17h5v5h-5ZM11 21l10-10M1 24h7M24 7h7',

    sonic: 'M4 10h8M2 16h7M4 22h8M21 3 11 18h8l-1 11L29 12h-9z',
    snail: 'M22 17a8 8 0 1 1-16 0 8 8 0 0 1 16 0 M17 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M5 25h19q6 0 5-7M24 20v-6m4 6 2-6',
    hourglass: 'M8 4h16M8 28h16M10 4v6l12 12v6M22 4v6L10 22v6M12 8h8M12 25l4-5 4 5Z',
    bubble: 'M28 16a12 12 0 1 1-24 0 12 12 0 0 1 24 0M9 14q0-5 6-6M21 21l2-2',
    ricochet: 'M4 4v24M28 4v24M7 23 24 9 8 9M12 5 8 9l4 4M22 25l3-3',
    pendulum: 'M16 4v4M16 8 6 23M16 8l10 15M10 24a4 4 0 1 1-8 0 4 4 0 0 1 8 0M30 24a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    meteor: 'M13 12 21 3M21 13l8-8M24 21l6-8M6 16l8-4 9 7-3 9-11 1-5-7Z M11 19l4-2 3 5-5 2Z',
    shatter: 'M16 4 26 8v9q-1 7-10 11Q7 24 6 17V8z M19 5l-7 10 8 3-8 9',
    heartburst: 'M16 26 7 17C0 8 11 3 16 11 21 3 32 8 25 17Z M16 1v4M2 5l4 3M30 5l-4 3M2 23l4-1M30 23l-4-1',

    normal: 'M8 8h7v7H8z M17 8h7v7h-7z M8 17h7v7H8z M17 17h7v7h-7z',
    weak: 'M8 7h16v18H8z M18 7l-5 7 6 3-5 8 M8 17l6-3',
    fire: 'M17 4c1 7 8 9 8 15a9 9 0 0 1-18 0c0-4 3-7 5-9l1 6c4-3 5-7 4-12z M16 18c-5 5-3 8 0 8s5-3 0-8z',
    poison: 'M12 5h8 M14 5v8L8 24q-1 3 3 3h10q4 0 3-3l-6-11V5 M11 21h10 M14 17h1 M18 24h1',
    black_hole: 'M22 16a6 6 0 1 1-12 0 6 6 0 0 1 12 0 M6 19C-2 13 30 5 28 12S0 28 4 18 M10 6q10-5 16 5 M6 23q10 8 17 1',
    doom: 'M7 15a9 9 0 0 1 18 0v6l-5 2v5h-8v-5l-5-2z M11 14l3 3m-3 0 3-3 M19 14l3 3m-3 0 3-3 M15 22h2 M16 24v4',
    long: 'M4 12h24v8H4z M10 12v8 M16 12v8 M22 12v8',
    frost: 'M16 4v24 M6 10l20 12 M6 22l20-12 M12 6l4 4 4-4 M12 26l4-4 4 4 M5 14l6-1-1-6 M22 25l-1-6 6-1 M5 18l6 1-1 6 M22 7l-1 6 6 1',
    heal: 'M16 27 6 17C-2 6 11 1 16 10 21 1 34 6 26 17z',
    shield: 'M16 4 26 8v9q-1 7-10 11Q7 24 6 17V8z M11 16l4 4 7-9',
    haste: 'M17 3 7 18h8l-1 11 11-17h-9z',
    heavy: 'M12 9a4 4 0 0 1 8 0 M9 11h14l4 16H5z M12 17v5 M16 15v7 M20 17v5',
    seeker: 'M25 16a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M16 3v7 M16 22v7 M3 16h7 M22 16h7 M19 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    splitter: 'M13 18H5v9h8z M27 18h-8v9h8z M12 4h8v8h-8z M16 12v3 M16 15l-7 3 M16 15l7 3',
    bomb: 'M23 20a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 11V8h5v4 M16 8q0-5 6-3 M25 3v5 M22 5h6 M9 19q0-4 4-5',
    repulsor: 'M20 16a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M16 10V3m-3 3 3-3 3 3 M16 22v7m-3-3 3 3 3-3 M10 16H3m3-3-3 3 3 3 M22 16h7m-3-3 3 3-3 3',
    ghost: 'M7 27V14a9 9 0 0 1 18 0v13l-5-4-4 4-4-4z M12 13v4 M20 13v4 M14 20h4',
    spring: 'M7 5h18 M8 9l16 4-16 4 16 4-16 4 M7 28h18',
    comet: 'M20 21a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M11 12 20 3 M18 13 28 3 M22 19l7-7 M9 22l3-4',
    antidote: 'M10 4h12v6H10z M11 10l-3 5v12h16V15l-3-5 M16 16v7 M12.5 19.5h7',
    thorn: 'M13 28V8a3 3 0 0 1 6 0v20 M13 20H8q-3 0-3-3v-7 M19 16h5q3 0 3-3V7 M10 28h12 M10 11h3 M19 22h3 M2 13h3 M24 9h3',
  };
  const helpfulKinds = new Set(['bandage','medkit','detox','coolant','compass','battery','snowglobe','sweeper','oasis','clean_slate','ricochet_shield', 'sanctuary', 'heal', 'shield', 'antidote', 'bubble', 'hourglass', 'heartburst', 'mender', 'stasis', 'phoenix', 'aegis', 'mint', 'clockwork', 'repellent', 'lullaby']);
  function outlineColor(kind, ghost = false) {
    if (kind === 'thunder') return '#ff4055';
    if (['leafy','elite_leafy'].includes(kind)) return '#ffe45c';
    if (['turbo','elite_turbo'].includes(kind)) return '#57ff75';
    if (ghost || kind === 'weak') return '#b8b8b8';
    return helpfulKinds.has(kind) ? '#57ff75' : '#ff4055';
  }
  function outerOutlineColor(kind, ghost = false) {
    if (ghost) return null;
    if (helpfulKinds.has(kind)) return '#ff1493';
    return kind === 'haste' || kind === 'curse' ? '#ffe45c' : null;
  }
  const cache = new Map();
  const filled = new Set(['fire','heal','shield','ghost','bomb','doom','antidote','poison','heavy']);
  function preview(kind, color, cells = [[0, 0]], cellSize = 28) {
    const canvas = document.createElement('canvas');
    canvas.width = 360; canvas.height = 220;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    const columns = Math.max(...cells.map(cell => cell[0])) + 1;
    const rows = Math.max(...cells.map(cell => cell[1])) + 1;
    const scale = Math.min(1.3, 156 / (columns * cellSize), 86 / (rows * cellSize), kind === 'fan' ? .34 : 1.3);
    const step = cellSize * scale, size = step * .94;
    const left = (180 - (columns - 1) * step) / 2;
    const bottom = (110 + (rows - 1) * step) / 2;
    if (['black_hole', 'repulsor', 'bomb', 'block_attractor', 'block_repulsor', 'chaos_nexus', 'gravity_well', 'force_wave', 'vortex'].includes(kind)) {
      ctx.strokeStyle = color + '66'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(left, bottom, kind === 'bomb' ? 44 : 50, 0, Math.PI*2); ctx.stroke();
    }
    for (const [cx, cy] of cells) tile(ctx, kind, left+cx*step-size/2, bottom-cy*step-size/2, size, color, false);
    draw(ctx, kind, left, bottom, size*.82, false, color, .6);
    return canvas.toDataURL('image/png');
  }
  function previewState(block, age, blocks = []) {
    let kind = block.id, color = block.preview_color || block.color;
    let cells = block.preview_cells || [[0,0]], cellSize = block.preview_size || 28;
    const time = Math.max(0, age), cycle = time % 6;
    if (kind === 'mystery' && cycle >= 2 && blocks.length > 1) {
      const choices = blocks.filter(b => b.id !== 'mystery');
      const revealed = choices[Math.floor(time/6) % choices.length];
      kind = revealed.id; color = revealed.preview_color || revealed.color;
      cells = revealed.preview_cells; cellSize = revealed.preview_size;
    }
    const ghost = kind === 'blink' ? time%1.2 >= .4 : kind === 'ghost' ? time%3 >= 2 : kind === 'phase' ? time%3 >= 1 :
      ['thunder','leafy','turbo','elite_leafy','elite_turbo'].includes(kind);
    const palette = ['#61c9b5','#779ed5','#b58bc9','#cf9894','#c6b76d','#8cbb79'];
    const fill = ['elite_leafy','elite_turbo'].includes(kind) ? palette[Math.floor((time+1e-9)*10)%palette.length] : color;
    let x = Math.sin(time*2)*5, y = ((time * (block.preview_speed || 100)/100)%2-1)*10;
    let warning = false, target = null, strike = false;
    if (['glitch','elite_glitch'].includes(kind)) {
      const duration = kind === 'glitch' ? 1.2 : 1;
      const tick = time%(1+duration*3+1);
      const positions = [[-30,-12],[28,12],[-20,15],[24,-14]];
      const jumps = Math.min(3, Math.max(0, Math.floor((tick-1)/duration)));
      [x,y] = positions[jumps];
      warning = tick >= 1 && tick < 1+duration*3;
      if (warning) target = positions[jumps+1];
    } else if (kind === 'thunder') {
      x = 0; y = -18;
      warning = time >= 1 && time%1 < .25;
      strike = time >= 1 && time%1 >= .25 && time%1 < .5;
    } else if (['fire_x','fire_plus','fire_star'].includes(kind)) {
      x = y = 0;
      warning = cycle >= 1 && cycle < 2.5;
      strike = cycle >= 2.5 && cycle < 3.15;
    } else if (['ricochet','pinball','zigzag','sawtooth','hopper'].includes(kind)) {
      x = (2/Math.PI)*Math.asin(Math.sin(time*(kind==='sawtooth'?6:3)))*30;
      if (kind === 'pinball' || kind === 'hopper') y = 15-Math.abs(Math.sin(time*3))*30;
    } else if (['pendulum','feather','ribbon','corkscrew','waltz'].includes(kind)) {
      x = Math.sin(time*(kind === 'ribbon' || kind === 'corkscrew' ? 6 : kind === 'waltz' ? 1 : 2))*23;
      if (kind === 'corkscrew') y = Math.cos(time*3)*12;
    } else if (['spring','rewind','boomerang'].includes(kind)) {
      y = Math.sin(time*3)*18;
    } else if (kind === 'anvil') {
      y = ((cycle<1.2?cycle*.2:.24+(cycle-1.2)*1.2)%1)*40-20;
    } else if (kind === 'rocket') {
      y = ((cycle < 1 ? cycle*.15 : (cycle-1)*2)%1)*40-20;
    } else if (kind === 'parachute') {
      y = ((cycle < .6 ? cycle*1.5 : .9+(cycle-.6)*.15)%1)*40-20;
    } else if (kind === 'surge' || kind === 'comet') {
      y = ((kind === 'comet' ? cycle*cycle*.2 : time*.7-Math.sin(time*Math.PI)*.2)%1)*36-18;
    }
    return {kind,color,cells,cellSize,ghost,fill,x,y,warning,target,strike,time,cycle};
  }
  function drawPreview(ctx, block, age = 0, blocks = []) {
    const s = previewState(block, age, blocks);
    const {kind,color,cells,cellSize,ghost,fill,time,cycle} = s;
    ctx.save(); ctx.clearRect(0,0,180,110);
    ctx.beginPath(); ctx.rect(0,0,180,110); ctx.clip();
    const columns = Math.max(...cells.map(c=>c[0]))+1, rows = Math.max(...cells.map(c=>c[1]))+1;
    const scale = Math.min(1, 102/(columns*cellSize), 60/(rows*cellSize), kind==='fan' ? .34 : 1);
    const unit = cellSize*scale, size=unit*.94;
    const cx=90+s.x, cy=53+s.y, left=cx-(columns-1)*unit/2, bottom=cy+(rows-1)*unit/2;
    const fields = ['black_hole','repulsor','block_attractor','block_repulsor','gravity_well','force_wave','vortex','chaos_nexus'];
    if (fields.includes(kind) || ['steaming','electric','stinky','chilly'].includes(kind)) {
      const radius = fields.includes(kind) ? 43 : 30;
      ctx.strokeStyle=color+'88'; ctx.lineWidth=1; ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();
      const push = ['repulsor','block_repulsor','force_wave'].includes(kind) || kind==='chaos_nexus' && Math.floor(time)%2;
      for(let i=0;i<6;i++) {
        const angle=i*Math.PI/3+(kind==='vortex'?time:0), progress=(time*.7+i/6)%1;
        const r=8+(push?progress:1-progress)*(radius-8);
        ctx.fillStyle=color;ctx.beginPath();ctx.arc(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r,1.8,0,Math.PI*2);ctx.fill();
      }
      if(kind==='chaos_nexus') {ctx.fillStyle=color;ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(['PULL YOU','PUSH YOU','PULL BLOCKS','PUSH BLOCKS'][Math.floor(time)%4],90,105);}
    }
    if (s.target) {
      ctx.strokeStyle='#fff29e';ctx.setLineDash([3,3]);ctx.strokeRect(90+s.target[0]-size/2,53+s.target[1]-size/2,size,size);ctx.setLineDash([]);
    }
    if (s.warning) {
      ctx.fillStyle='#ffe65b';ctx.font='bold 15px sans-serif';ctx.textAlign='center';ctx.fillText('!!!',cx,kind==='thunder'?cy+size:cy-size/2-6);
    }
    if (kind.startsWith('fire_') && (s.warning || s.strike)) {
      const dirs=kind==='fire_x'?[[1,1],[1,-1]]:kind==='fire_plus'?[[1,0],[0,1]]:[[1,1],[1,-1],[1,0],[0,1]];
      ctx.strokeStyle=s.strike?'#ffb347':'#ffcf75';ctx.lineWidth=s.strike?8:1;ctx.setLineDash(s.strike?[]:[3,4]);
      for(const [dx,dy] of dirs){ctx.beginPath();ctx.moveTo(cx-dx*90,cy-dy*90);ctx.lineTo(cx+dx*90,cy+dy*90);ctx.stroke();}ctx.setLineDash([]);
    }
    if(kind==='thunder' && s.strike){ctx.fillStyle='#ffe600';ctx.fillRect(cx-size/2,cy+size/2,size,size*2);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx+4,cy+size/2);ctx.lineTo(cx-5,cy+size*1.5);ctx.lineTo(cx+5,cy+size*1.3);ctx.lineTo(cx-3,cy+size*2.4);ctx.stroke();}
    if(kind==='bomb'){ctx.strokeStyle=cycle>=2&&cycle<2.35?'#fff3a0':'#ffbd5d88';ctx.lineWidth=cycle>=2&&cycle<2.35?8:1;ctx.beginPath();ctx.arc(cx,cy,36+Math.sin(time*8)*2,0,Math.PI*2);ctx.stroke();}
    const split = ['splitter','iceburst','firecracker'].includes(kind) && cycle>=1.4 && cycle<3;
    if(split){for(let i=-1;i<=1;i++){const shard=kind==='iceburst'?'frost':kind==='firecracker'?'fire':'normal';const sx=cx+i*(10+(cycle-1.4)*24),sy=cy+(cycle-1.4)*12;tile(ctx,shard,sx-6,sy-6,12,color,false);draw(ctx,shard,sx,sy,10,false,color,time);}}
    else {
      for(const [x,y] of cells) tile(ctx,kind,left+x*unit-size/2,bottom-y*unit-size/2,size,color,ghost,fill);
      const cannons=(block.preview_cannons?.length?block.preview_cannons:[Math.PI/2]).map(a=>a+time*(block.preview_rotation_speed||0)+(kind==='scatter'?Math.floor(time/.9)*Math.PI/4:0));
      const [iconX, iconY] = cells[0];
      draw(ctx,kind,left+iconX*unit,bottom-iconY*unit,size*.82,ghost,color,time,cannons);
      if(['blaster','crossbow','diagonal','spinner','scatter'].includes(kind)) for(const a of cannons){const distance=size*.8+(time%(block.preview_shot_interval||.6))*85;ctx.fillStyle='#ffe394';ctx.beginPath();ctx.arc(left+Math.cos(a)*distance,bottom-Math.sin(a)*distance,2.5,0,Math.PI*2);ctx.fill();}
    }
    if(helpfulKinds.has(kind)){ctx.strokeStyle=color+'88';ctx.lineWidth=1;const r=18+(time%1)*22;ctx.globalAlpha=1-time%1;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  // Shared body silhouettes are used by gameplay and guide previews.
  function tile(ctx, kind, x, y, size, color, ghost, fillColor = color) {
    ctx.save();
    ctx.translate(x, y);
    if (kind === 'spike' || kind === 'thunder') {
      ctx.scale(size/32, size/32);
      const shape = new Path2D(bodyPaths[kind]);
      const body = ctx.createLinearGradient(0, 0, 0, 32);
      body.addColorStop(0, kind === 'thunder' ? '#596174' : '#e1e4ed');
      body.addColorStop(1, kind === 'thunder' ? '#242938' : '#727c94');
      ctx.fillStyle = body; ctx.fill(shape);
      ctx.strokeStyle = outlineColor(kind);
      ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 7;
      ctx.lineWidth = 2; ctx.stroke(shape);
      ctx.restore(); return;
    }
    const gradient = ctx.createLinearGradient(0, 0, kind === 'elite_glitch' ? size : size*.3, kind === 'elite_glitch' ? 0 : size);
    if (kind === 'elite_glitch') {
      gradient.addColorStop(0, '#ff466d'); gradient.addColorStop(.49, '#bc214d');
      gradient.addColorStop(.51, '#3276e9'); gradient.addColorStop(1, '#71c2ff');
    } else { gradient.addColorStop(0, fillColor); gradient.addColorStop(1, '#18243b'); }
    ctx.fillStyle = gradient;
    ctx.globalAlpha = ['elite_leafy', 'elite_turbo'].includes(kind) ? .8 : ghost ? .12 : 1;
    ctx.fillRect(0, 0, size, size);
    ctx.globalAlpha = ghost ? .55 : 1;
    ctx.strokeStyle = color; ctx.lineWidth = 1.4;
    ctx.strokeRect(.7, .7, size-1.4, size-1.4);
    ctx.strokeStyle = '#ffffff80'; ctx.lineWidth = Math.max(1, size*.06);
    ctx.beginPath(); ctx.moveTo(2,size*.35); ctx.lineTo(2,2); ctx.lineTo(size-2,2); ctx.stroke();
    ctx.strokeStyle = '#050c2080';
    ctx.beginPath(); ctx.moveTo(2,size-2); ctx.lineTo(size-2,size-2); ctx.lineTo(size-2,size*.35); ctx.stroke();
    if (kind === 'doom' || kind === 'heavy') {
      ctx.strokeStyle = kind === 'doom' ? '#200a17' : '#d8b997'; ctx.lineWidth = 2;
      for (let i=3;i<size-2;i+=6) { ctx.beginPath();ctx.moveTo(i,1);ctx.lineTo(i-2,5);ctx.stroke(); }
    }
    if (kind === 'glitch' || kind === 'elite_glitch') {
      ctx.fillStyle = '#ffffff77'; ctx.fillRect(size*.1,size*.18,size*.35,2);
      ctx.fillStyle = '#10182b88'; ctx.fillRect(size*.55,size*.67,size*.4,3);
    }
    if (kind === 'weak') {
      ctx.strokeStyle = '#18243b';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(size*.7,0);ctx.lineTo(size*.5,size*.4);ctx.lineTo(size*.65,size*.65);ctx.lineTo(size*.35,size);ctx.stroke();
    }
    // Draw the status border last so bevels and textures cannot obscure it.
    ctx.globalAlpha = ghost ? .55 : 1;
    const outer = outerOutlineColor(kind, ghost);
    if (outer) {
      ctx.strokeStyle = ctx.shadowColor = outer;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.strokeRect(-1, -1, size+2, size+2);
    }
    ctx.strokeStyle = outlineColor(kind, ghost);
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = ghost || kind === 'weak' ? 0 : 9;
    ctx.lineWidth = Math.min(4, Math.max(3, size*.11));
    const inset = ctx.lineWidth/2;
    ctx.strokeRect(inset, inset, size-ctx.lineWidth, size-ctx.lineWidth);
    ctx.restore();
  }
  function draw(ctx, kind, x, y, size, ghost = false, color = '#152033', age = 0, cannons = null) {
    if (kind === 'fan' || ['blaster','crossbow','diagonal','spinner','scatter'].includes(kind)) {
      const full = size/.82;
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = color; ctx.strokeStyle = outlineColor(kind); ctx.lineWidth = 2;
      const angles = kind === 'fan' ? [0, 1, 2].map(i => -(age*2*Math.PI*.9/2.4+i*2*Math.PI/3)) : (cannons || [Math.PI/2]).map(a => -a);
      for (const angle of angles) {
        ctx.save(); ctx.rotate(angle); ctx.beginPath();
        if (kind === 'fan') {
          ctx.moveTo(full*.2, full*.12); ctx.lineTo(full*3.2, full*.3); ctx.lineTo(full*3.2, -full*.3);
        } else {
          ctx.rect(full*.2, -full*.13, full*.6, full*.26);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      ctx.restore();
    }
    if (kind === 'spike' || kind === 'thunder') {
      ctx.save();
      // Fit the symbol inside the triangle's broad base or the cloud's center.
      const iconSize = size * (kind === 'spike' ? .5 : .62);
      const iconY = y + size * (kind === 'spike' ? .23 : .04);
      ctx.translate(x-iconSize/2, iconY-iconSize/2);
      ctx.scale(iconSize/32, iconSize/32);
      const symbol = new Path2D(paths[kind]);
      ctx.lineJoin = ctx.lineCap = 'round';
      ctx.strokeStyle = '#10182b'; ctx.lineWidth = 5; ctx.stroke(symbol);
      ctx.strokeStyle = kind === 'thunder' ? '#ffe65b' : '#fff5dc';
      ctx.lineWidth = 2.5; ctx.stroke(symbol);
      ctx.restore(); return;
    }
    if (!cache.has(kind)) cache.set(kind, new Path2D(paths[kind] || paths.normal));
    ctx.save();
    ctx.translate(x-size/2, y-size/2);
    ctx.scale(size/32, size/32);
    ctx.lineCap = ctx.lineJoin = 'round';
    const t = age || 0;
    // Sparse, deterministic particles are attached to their source block.
    if (['fire','poison','frost','comet','heal','antidote','haste','cinder','spore','sleet','lantern'].includes(kind)) {
      for (let i=0;i<3;i++) {
        const progress = (t*.7+i/3)%1;
        const px = 5+i*11 + Math.sin(t*2+i)*2;
        const py = kind === 'poison' ? 28+progress*10 : 4-progress*10;
        ctx.globalAlpha = .7*(1-progress);
        ctx.fillStyle = kind === 'fire' ? '#ffe79b' : color;
        ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.5;
        if (kind === 'comet' || kind === 'haste') {
          ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+4,py-7);ctx.stroke();
        } else if (kind === 'fire') {
          ctx.beginPath();ctx.moveTo(px-2,py+3);ctx.lineTo(px,py-4);ctx.lineTo(px+2,py+3);ctx.fill();
        } else {
          ctx.beginPath();ctx.arc(px,py,1.4+progress,0,Math.PI*2);ctx.fill();
        }
      }
    }
    ctx.globalAlpha = ghost ? .5 : 1;
    if (kind === 'black_hole' || kind === 'repulsor') {
      ctx.save();ctx.translate(16,16);ctx.rotate(t*(kind==='black_hole'?1:-1));
      ctx.strokeStyle = color;ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(0,0,22,9,.4,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#fff5dc';ctx.beginPath();ctx.arc(20,3,2,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    if (kind === 'thorn') {
      ctx.strokeStyle='#fce6a6';ctx.lineWidth=2;
      for(let i=0;i<4;i++) {ctx.save();ctx.translate(16,16);ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.moveTo(-3,-18);ctx.lineTo(0,-22);ctx.lineTo(3,-18);ctx.stroke();ctx.restore();}
    }
    if (kind === 'bomb') {
      ctx.strokeStyle = '#fff4b5';ctx.lineWidth=2;
      const r = 2 + Math.sin(t*5)**2*2;
      ctx.beginPath();ctx.arc(25,5,r,0,Math.PI*2);ctx.stroke();
    }
    if (filled.has(kind) && !ghost) {ctx.fillStyle='#172038';ctx.fill(cache.get(kind));}
    ctx.strokeStyle = '#10182b';ctx.lineWidth=3.6;ctx.stroke(cache.get(kind));
    ctx.strokeStyle = ghost ? color : '#fff5dc';ctx.lineWidth=2;ctx.stroke(cache.get(kind));
    ctx.restore();
  }
  function tabPreview(block, random = Math.random) {
    if (block.id === 'spike' || block.id === 'thunder') {
      const color = block.id === 'thunder' ? '#343b4c' : block.color;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 110"><path transform="translate(58 23) scale(2)" d="${bodyPaths[block.id]}" fill="${color}" stroke="${outlineColor(block.id)}" stroke-width="2"/><path transform="${block.id === 'spike' ? 'translate(77 54) scale(.82)' : 'translate(74 42) scale(1)'}" d="${paths[block.id]}" fill="none" stroke="${block.id === 'thunder' ? '#ffe65b' : '#fff5dc'}" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
      return {src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg), color, shape:block.id};
    }
    // Simple randomized silhouettes with the same identifying icon as gameplay.
    const shapes = [ [[0,0],[1,0],[2,0],[3,0]], [[0,0],[1,0],[0,1],[1,1]],
      [[0,0],[1,0],[2,0],[1,1]], [[0,0],[1,0],[1,1],[2,1]],
      [[0,0],[0,1],[0,2],[1,0]], [[0,0],[1,0],[2,0],[2,1]],
      [[1,0],[0,1],[1,1],[2,1],[1,2]], [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0]] ];
    let cells = shapes[Math.floor(random()*shapes.length)].map(cell=>[...cell]);
    const turns = Math.floor(random()*4);
    for(let i=0;i<turns;i++) cells=cells.map(([x,y])=>[-y,x]);
    const minX=Math.min(...cells.map(c=>c[0])), minY=Math.min(...cells.map(c=>c[1]));
    cells=cells.map(([x,y])=>[x-minX,y-minY]);
    const colors=['#48d9ef','#ffd166','#bb86fc','#69db7c','#ff6b8a','#659bff','#ffa552'];
    const color=['normal','wild_seven'].includes(block.id)?colors[Math.floor(random()*colors.length)]:block.color;
    const columns=Math.max(...cells.map(c=>c[0]))+1, rows=Math.max(...cells.map(c=>c[1]))+1;
    const unit=Math.min(28,150/columns,84/rows), left=(180-columns*unit)/2, top=(110-rows*unit)/2;
    const tileFill = block.id === 'elite_glitch' ? 'url(#elite)' : color;
    const eliteGradient = block.id === 'elite_glitch' ? '<defs><linearGradient id="elite"><stop offset=".49" stop-color="#ff466d"/><stop offset=".51" stop-color="#5599ff"/></linearGradient></defs>' : '';
    const outer = outerOutlineColor(block.id);
    const tiles=cells.map(([x,y])=>{
      const border=outer ? `<rect x="${left+x*unit-1.5}" y="${top+y*unit-1.5}" width="${unit+3}" height="${unit+3}" fill="none" stroke="${outer}" stroke-width="2" style="filter:drop-shadow(0 0 3px ${outer})"/>` : '';
      return border+`<rect x="${left+x*unit+1}" y="${top+y*unit+1}" width="${unit-2}" height="${unit-2}" rx="1" fill="${tileFill}" stroke="${outlineColor(block.id)}" stroke-width="3" style="filter:drop-shadow(0 0 3px ${outlineColor(block.id)})"/>`;
    }).join('');
    const [iconX, iconY] = cells[0];
    const iconSize = unit * .82;
    const icon = `<g transform="translate(${left+iconX*unit+(unit-iconSize)/2} ${top+iconY*unit+(unit-iconSize)/2}) scale(${iconSize/32})" fill="none" stroke="#152033" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[block.id] || paths.normal}"/></g>`;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 110">${eliteGradient}${tiles}${icon}</svg>`;
    return {src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg), color, shape:JSON.stringify(cells)};
  }
  function pickBlock(blocks, random = Math.random) {
    const total = blocks.reduce((sum, block) => sum + block.weight, 0);
    let value = random() * total;
    for (const block of blocks) {
      value -= block.weight;
      if (value < 0) return block;
    }
    return blocks.at(-1);
  }
  return { paths, preview, previewState, drawPreview, draw, tile, pickBlock, tabPreview, outlineColor, outerOutlineColor };
})();
if (typeof module !== 'undefined') module.exports = ChaosArt;
