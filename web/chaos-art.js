"use strict";
// The same vector illustrations appear on falling tiles and guide previews.
const ChaosArt = (() => {
  const paths = {
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
  const helpfulKinds = new Set(['sanctuary', 'heal', 'shield', 'antidote', 'bubble', 'hourglass', 'heartburst', 'mender', 'stasis', 'phoenix', 'aegis', 'mint', 'clockwork', 'repellent', 'lullaby']);
  function outlineColor(kind, ghost = false) {
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
    const scale = Math.min(1.3, 156 / (columns * cellSize), 86 / (rows * cellSize));
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
  // Texture the existing tile rectangle; cosmetics never change collision bounds.
  function tile(ctx, kind, x, y, size, color, ghost) {
    ctx.save();
    ctx.translate(x, y);
    const gradient = ctx.createLinearGradient(0, 0, kind === 'elite_glitch' ? size : size*.3, kind === 'elite_glitch' ? 0 : size);
    if (kind === 'elite_glitch') {
      gradient.addColorStop(0, '#ff466d'); gradient.addColorStop(.49, '#bc214d');
      gradient.addColorStop(.51, '#3276e9'); gradient.addColorStop(1, '#71c2ff');
    } else { gradient.addColorStop(0, color); gradient.addColorStop(1, '#18243b'); }
    ctx.fillStyle = gradient;
    ctx.globalAlpha = ghost ? .12 : 1;
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
  function draw(ctx, kind, x, y, size, ghost = false, color = '#152033', age = 0) {
    if (!cache.has(kind)) cache.set(kind, new Path2D(paths[kind] || paths.normal));
    ctx.save();
    ctx.translate(x-size/2, y-size/2);
    ctx.scale(size/32, size/32);
    ctx.lineCap = ctx.lineJoin = 'round';
    const t = age || 0;
    // Sparse, deterministic particles are attached to their source block.
    if (['fire','poison','frost','comet','heal','antidote','haste'].includes(kind)) {
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
  return { paths, preview, draw, tile, pickBlock, tabPreview, outlineColor, outerOutlineColor };
})();
if (typeof module !== 'undefined') module.exports = ChaosArt;
