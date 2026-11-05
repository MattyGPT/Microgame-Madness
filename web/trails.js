"use strict";
const TurtleTrails = (() => {
  const paths = {
    spark: 'M0 -1 L.22 -.22 L1 0 L.22 .22 L0 1 L-.22 .22 L-1 0 L-.22 -.22 Z',
    star: 'M0 -1 L.28 -.35 L.95 -.31 L.45 .15 L.59 .81 L0 .48 L-.59 .81 L-.45 .15 L-.95 -.31 L-.28 -.35 Z',
    diamond: 'M0 -1 L.7 0 L0 1 L-.7 0 Z',
    heart: 'M0 .9 C-1 .25 -1 -.5 -.5 -.65 C-.2 -.8 0 -.5 0 -.35 C0 -.5 .2 -.8 .5 -.65 C1 -.5 1 .25 0 .9 Z',
    leaf: 'M-.75 .8 Q-1 -1 .85 -.85 Q1 1 -.75 .8 M-.6 .65 L.6 -.6',
    bolt: 'M.2 -1 L-.8 .1 L-.1 .1 L-.3 1 L.8 -.25 L.1 -.25 Z',
    snow: 'M0 -1 L0 1 M-.87 -.5 L.87 .5 M-.87 .5 L.87 -.5 M-.2 -.7 L0 -.5 L.2 -.7 M-.2 .7 L0 .5 L.2 .7',
    moon: 'M.4 -.9 A1 1 0 1 0 .4 .9 A.9 .9 0 0 1 .4 -.9 Z',
    note: 'M-.15 .55 A.36 .25 0 1 1 -.5 .3 L.1 .3 L.1 -.9 L.8 -.65 L.8 -.25 L.25 -.5 L.25 .5 Z',
    butterfly: 'M0 .6 C-1.5 .7 -1 -.25 -.25 -.05 C-1.4 -1.5 .1 -1.2 0 -.1 C-.1 -1.2 1.4 -1.5 .25 -.05 C1 -.25 1.5 .7 0 .6 Z',
    flame: 'M0 1 C-1 .7 -.9 -.1 -.3 -.6 L-.2 -.1 Q.4 -.5 .1 -1 Q1.6 .4 0 1 Z',
    petal: 'M0 1 C-1.3 -.2 -.6 -1.2 0 -.55 C.6 -1.2 1.3 -.2 0 1 Z',
    pixel: 'M-.8 -.8 H.8 V.8 H-.8 Z',
    crown: 'M-.8 .65 L-1 -.5 L-.4 -.1 L0 -.85 L.4 -.1 L1 -.5 L.8 .65 Z',
    candy: 'M-.5 -.35 L-1 -.65 V.65 L-.5 .35 Q0 1 .5 .35 L1 .65 V-.65 L.5 -.35 Q0 -1 -.5 -.35 Z',
    feather: 'M-.65 1 Q-.3 -.2 .6 -1 Q1.3 .7 -.65 1 M-.65 1 L.55 -.8',
    hex: 'M0 -1 L.87 -.5 V.5 L0 1 L-.87 .5 V-.5 Z',
    ripple: 'M-1 .1 Q-.5 -.6 0 .1 T1 .1 M-.8 .6 Q-.4 .2 0 .6 T.8 .6',
    rune: 'M-.6 .8 V-.8 L.6 0 L-.6 .8 M-.6 0 L.6 -.8 M-.6 0 L.6 .8',
    comet: 'M1 -1 L.45 .55 Q-.25 1.3 -.8 .75 Q-1.2 .2 -.55 -.45 Z',
  };
  const rows = [
    ['Mint Mist','dot',['#a3ff80','#60dbb8'],50,'A soft mint wake for your first adventure.'],
    ['Blue Bubbles','ring',['#65ceff','#b0f1ff'],65,'Tiny bubbles pop softly in your footsteps.'],
    ['Peach Fizz','dot',['#ffb18c','#ffdba3'],80,'A little peach soda wherever you go.'],
    ['Pixel Dash','pixel',['#79ffac','#d7ff8c'],95,'Leave a short stream of arcade pixels.'],
    ['Golden Dust','spark',['#ffd56b','#fff3ba'],110,'Warm flecks of gold, gone in a blink.'],
    ['Rose Petals','petal',['#ffa0c4','#ee6f99'],125,'A tiny shower of drifting rose petals.'],
    ['Citrus Zest','diamond',['#ffb531','#ddff70'],145,'Fresh lime and orange in every dash.'],
    ['Lavender Haze','dot',['#c4a0ff','#f0ceff'],165,'A gentle lavender cloud behind your shell.'],
    ['Cherry Hearts','heart',['#ff5b80','#ffb4c9'],185,'Small hearts with a cherry-red glow.'],
    ['Dewdrop','ring',['#7affe3','#d4fff7'],210,'Cool droplets that shimmer and vanish.'],
    ['Firefly Flight','spark',['#d9ff55','#80d950'],235,'Little lanterns follow your every turn.'],
    ['Autumn Leaves','leaf',['#eeb64a','#ed7747','#cd494e'],260,'Amber leaves tumble along your path.'],
    ['Candy Sprinkle','candy',['#ff89c9','#79dcff','#ffe48d'],285,'A pocketful of colorful wrapped sweets.'],
    ['Ocean Foam','ripple',['#59c9e8','#e7ffff'],310,'Rolling seafoam follows your shell.'],
    ['Frost Flakes','snow',['#a8dfff','#f4fdff'],340,'Delicate snowflakes melt almost instantly.'],
    ['Neon Circuit','pixel',['#4df6da','#7f85ff'],370,'Bright circuit fragments trace your route.'],
    ['Honeycomb','hex',['#ffcc50','#ffedaa'],400,'Golden hexagons with a honey glow.'],
    ['Lucky Clover','butterfly',['#6bea83','#baff9a'],435,'Four soft wings of emerald luck.'],
    ['Moon Dust','moon',['#c8c6ff','#e6edff'],470,'Little crescents from a quiet night sky.'],
    ['Coral Bloom','petal',['#ff8f83','#ffc9ac'],510,'Warm coral petals drift in your wake.'],
    ['Electric Blue','bolt',['#5d9eff','#8effff'],550,'Quick blue bolts crackle behind you.'],
    ['Ruby Shards','diamond',['#ff4069','#ff9aab'],590,'Polished ruby fragments catch the light.'],
    ['Jellyfish Glow','ring',['#e78cff','#8bafff'],630,'Soft violet rings from the deep ocean.'],
    ['Starlight Steps','star',['#c2dbff','#fff3a8'],675,'A short constellation with every step.'],
    ['Music Notes','note',['#ffb7ed','#a0b4ff'],720,'A little melody you can see.'],
    ['Sakura Breeze','petal',['#ffd4eb','#f094cb','#ffffff'],770,'Blossoms dance gently behind your shell.'],
    ['Butterfly Garden','butterfly',['#b9a0ff','#ffa4c9','#83e9d5'],820,'A colorful flutter that never gets in your way.'],
    ['Copper Clockwork','hex',['#dc9964','#ffe1aa'],875,'Tiny copper pieces with a mechanical shine.'],
    ['Aqua Prism','diamond',['#53e1e9','#90b7ff','#d4faff'],930,'Sea-glass prisms scatter cool color.'],
    ['Solar Embers','flame',['#ff803d','#ffd069'],990,'Small glowing embers cool as you move.'],
    ['Royal Procession','crown',['#e8c35f','#b79aff'],1050,'A procession of tiny golden crowns.'],
    ['Aurora Drift','ripple',['#65ffd6','#7fb3ff','#c498ff'],1110,'A little northern sky follows your route.'],
    ['Meteor Shower','comet',['#ffc27e','#ff8067'],1175,'Warm miniature meteors burn out behind you.'],
    ['Emerald Wings','feather',['#45dcb1','#c6ffb2'],1240,'Light emerald feathers catch the breeze.'],
    ['Crimson Runes','rune',['#ff697e','#ffb094'],1310,'Crimson symbols vanish before they can be read.'],
    ['Glacier Glass','diamond',['#91f1ff','#d1d8ff','#ffffff'],1380,'Sharp little crystals with a cool glow.'],
    ['Dreamcatcher','moon',['#db99ff','#ffb8de'],1450,'Pastel moons trail through a waking dream.'],
    ['Thunderstorm','bolt',['#baafff','#f1eaff','#78b6ff'],1525,'A miniature storm with quick violet sparks.'],
    ['Phoenix Flight','feather',['#ff6840','#ffbd53','#fff2a6'],1600,'Fiery feathers fade into golden ash.'],
    ['Deep Space','star',['#9479ff','#e8b3ff','#75c9ff'],1680,'Violet stars from far beyond the arcade.'],
    ['Rainbow Ribbon','ripple',['#ff7595','#ffc365','#f1f58c','#7ceeb1','#8bd8ff','#be9aff'],1760,'A quick rainbow wake follows every turn.'],
    ['Platinum Sparks','spark',['#effbff','#9bbfe0','#d6caff'],1840,'Bright silver sparks with a soft blue edge.'],
    ['Enchanted Forest','leaf',['#51e5af','#9cffb4','#e6ffad'],1925,'Glowing leaves from a moonlit forest.'],
    ['Supernova','comet',['#ffc0e6','#fff1bd','#9dc5ff'],2010,'Tiny bursts of starlight in warm and cool colors.'],
    ['Prismatic Hearts','heart',['#ff89ae','#ffc87c','#8cedc7','#a3b3ff'],2100,'Every little heart catches a different color.'],
    ['Celestial Crown','crown',['#fff3bb','#b9ddff','#dcbdff'],2200,'A crown of stars for your turtle.'],
    ['Chrono Echo','rune',['#7df5ef','#c5a1ff','#edf7ff'],2300,'Fleeting symbols mark where you just were.'],
    ['Spectrum Finale','star',['#ff82ba','#ffca78','#b6f28b','#75e3f3','#ab9eff','#f2bbff'],2400,'A complete spectrum of tiny trailing stars.'],
  ];
  const catalog = rows.map(([name, shape, colors, price, flavor], index) => ({
    id: `trail_${name.toLowerCase().replaceAll(' ', '_')}`, name, shape, colors, price, flavor,
    size: ['heart','butterfly','candy','crown','note'].includes(shape) ? 5 : 4,
    lifetime: .32 + (index % 4) * .025,
  }));
  function selected(id, owned = []) { return catalog.find(item => item.id === id && owned.includes(id)) || null; }
  const allowedModes = new Set(['dodge', 'boss', 'pumpkin', 'wrath']);
  class Field {
    constructor() { this.reset(); }
    reset() { this.particles = []; this.last = null; this.carry = 0; this.serial = 0; this.itemId = null; this.mode = null; }
    update(dt, snapshot, item, reducedMotion = false) {
      if (!item || !allowedModes.has(snapshot?.mode) || !snapshot.player?.visible || snapshot.over || reducedMotion) { this.reset(); return; }
      if (this.itemId !== item.id || this.mode !== snapshot.mode) { this.reset(); this.itemId = item.id; this.mode = snapshot.mode; }
      if (snapshot.paused) return;
      dt = Math.max(0, Math.min(Number.isFinite(dt) ? dt : 0, .1));
      this.particles = this.particles.filter(p => (p.age += dt) < item.lifetime);
      const point = { x: snapshot.player.x, y: -snapshot.player.y };
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) { this.reset(); return; }
      if (this.last) {
        const dx = point.x - this.last.x, dy = point.y - this.last.y, distance = Math.hypot(dx, dy);
        if (distance > 100) { this.particles = []; this.carry = 0; }
        else if (distance > .001) {
          const spacing = 5;
          for (let d = spacing - this.carry; d <= distance; d += spacing) {
            const n = this.serial++, offset = Math.sin(n * 2.399) * 2.4;
            this.particles.push({ x: this.last.x + dx * d / distance - dy / distance * offset,
              y: this.last.y + dy * d / distance + dx / distance * offset,
              age: dt * (1 - d / distance), rotation: n * 2.399, color: item.colors[n % item.colors.length] });
          }
          this.carry = (this.carry + distance) % spacing;
        }
      }
      this.last = point;
      if (this.particles.length > 80) this.particles.splice(0, this.particles.length - 80);
    }
    draw(ctx, item) {
      if (!item || this.itemId !== item.id) return;
      ctx.save();
      for (const p of this.particles) {
        const life = Math.max(0, 1 - p.age / item.lifetime), size = item.size * (.35 + life * .65);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
        ctx.globalAlpha = life * .65; ctx.scale(size, size);
        ctx.fillStyle = p.color; ctx.strokeStyle = p.color; ctx.lineWidth = .24;
        if (item.shape === 'dot' || item.shape === 'ring') {
          ctx.beginPath(); ctx.arc(0, 0, .8, 0, Math.PI * 2);
          item.shape === 'ring' ? ctx.stroke() : ctx.fill();
        } else {
          const path = getPath(item.shape);
          ['snow','ripple','rune'].includes(item.shape) ? ctx.stroke(path) : ctx.fill(path);
        }
        ctx.restore();
      }
      ctx.restore();
    }
  }
  const pathCache = new Map();
  function getPath(shape) {
    if (!pathCache.has(shape)) pathCache.set(shape, new Path2D(paths[shape]));
    return pathCache.get(shape);
  }
  function preview(item) {
    const marks = Array.from({ length: 12 }, (_, i) => {
      const color = item.colors[i % item.colors.length], x = 20 + i * 9, y = 45 + Math.sin(i * .7) * 8;
      const opacity = .12 + i / 12 * .8;
      const stroke = ['ring','snow','ripple','rune'].includes(item.shape);
      const shape = ['ring','dot'].includes(item.shape) ? '<circle r=".8"/>' : `<path d="${paths[item.shape]}"/>`;
      return `<g transform="translate(${x} ${y}) rotate(${i * 27}) scale(${3 + i / 12 * 2})" opacity="${opacity}"><g class="trail-preview-mark" style="--delay:${-i * .075}s" fill="${stroke ? 'none' : color}" stroke="${stroke ? color : 'none'}" stroke-width=".24">${shape}</g></g>`;
    }).join('');
    return `<svg viewBox="0 0 170 90" aria-hidden="true"><path d="M13 69 H157" stroke="#ffffff0b"/>${marks}<g transform="translate(140 44) rotate(90)"><ellipse rx="8" ry="11" fill="#87c966" stroke="#c1f5a4" stroke-width="1.3"/><circle cy="-15" r="4" fill="#b6ed93"/><path d="M-7 -6 L-12 -9 M7 -6 L12 -9 M-7 7 L-11 11 M7 7 L11 11" stroke="#b6ed93" stroke-width="4" stroke-linecap="round"/><path d="M0 -7 L5 -3 V4 L0 8 L-5 4 V-3 Z" fill="none" stroke="#4e8c4e" stroke-width="1.3"/></g></svg>`;
  }
  return { catalog, selected, Field, preview, allowedModes };
})();
if (typeof module !== 'undefined') module.exports = TurtleTrails;
