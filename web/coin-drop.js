"use strict";
const CoinDrop = (() => {
  const NanoPack = typeof CoinDropNanoPack !== 'undefined' ? CoinDropNanoPack : require('./coin-drop-nanogames.js');
  const NanoMusic = typeof CoinDropNanoMusic !== 'undefined' ? CoinDropNanoMusic : require('./coin-drop-nano-music.js');
  const Lessons = typeof CoinDropLessons !== 'undefined' ? CoinDropLessons : require('./coin-drop-lessons.js');
  const LIMIT = 1e15;
  const BOARD = Object.freeze({width:840, height:1320, pocketY:1275, slotWidth:120});
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const fmt = n => new Intl.NumberFormat('en', {notation: n >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1}).format(n);
  // Hand-authored board recipes: layout, motion and hazards combine differently on every map.
  const recipes = [
    ['Bluebell Arcade','A classic staggered garden. Chase the golden center.', '#75c5ff','classic',0,1,0],
    ['Honeycomb Hollow','Dense hexagons reward a long, musical bounce.', '#ffd779','honey',0,1,0],
    ['Breezy Boardwalk','A sea breeze pushes your coin to the right.', '#75efdc','wave',65,1,0],
    ['Ruby Quarry','Ruby pegs hide inside a diamond-shaped quarry.', '#ff7397','diamond',0,1,0],
    ['Mushroom Grove','Giant bumpers launch coins back into the canopy.', '#c5ef83','grove',0,.9,0],
    ['Clockwork Crossing','Rows of moving pegs sweep across your path.', '#ffbd77','classic',0,1,24],
    ['Moonlit Steps','Low gravity turns every drop into a slow dance.', '#c1acff','stairs',0,.55,0],
    ['Neon Narrows','Two dense towers frame a high-speed central chute.', '#66f7ee','towers',0,1.2,0],
    ['Portal Post','Violet portals fling coins across the board.', '#c98dff','portal',0,1,0],
    ['Coral Current','An alternating tide weaves through coral fans.', '#ff9eac','fan',95,.85,0],
    ['Pinwheel Plaza','Moving spokes scatter coins in every direction.', '#fce08a','rings',0,1,30],
    ['Glacier Glide','Slippery pegs and a leftward blizzard.', '#aeedff','diamond',-90,.8,0],
    ['Thunder Factory','Heavy gravity. Big bumpers. Fast payouts.', '#a9b2ff','grove',30,1.5,15],
    ['Prism Cathedral','Rainbow arches guard a rich central pocket.', '#fa9fe6','arches',0,.9,20],
    ['Orbit Orchard','Concentric satellites drift in lunar gravity.', '#a6f9bb','rings',25,.6,22],
    ['Ruby Rapids','A ruby-rich zigzag through a strong current.', '#ff6687','stairs',110,1.2,0],
    ['Twin Vortex','Two swirling peg galaxies and crossing portals.', '#b48cff','vortex',-40,.8,28],
    ['Gilded Gauntlet','Dense moving walls demand a deliberate launch.', '#ffde79','towers',65,1.35,22],
    ['Starfall Engine','Cosmic bumpers shower the board in starlight.', '#8bdaff','fan',-85,.65,30],
    ['Cubie Crown','The final machine: arches, portals and ruby rain.', '#ffe4a1','arches',70,1.05,34],
  ];
  const maps = recipes.map((r,i) => ({id:i,name:r[0],hint:r[1],color:r[2],layout:r[3],wind:r[4],gravity:r[5],motion:r[6],goal:120*Math.round(250*1.38**i),value:1.24**i,portal:[8,16,19].includes(i)}));
  const nanogames = [
    {id:'timing',title:'Golden Stop',rules:'Stop the moving marker inside the gold zone. You have 8 seconds.',seconds:8},
    {id:'memory',title:'Ruby Recall',rules:'Remember four symbols, then repeat them in order. Study for 3 seconds, then answer.',seconds:15,ruby:1},
    {id:'stars',title:'Star Scoop',rules:'Catch 5 stars before 10 seconds run out. Each catch moves the next star.',seconds:10,scrap:5},
    {id:'math',title:'Quick Cash',rules:'Solve the addition and choose the correct total within 4 seconds.',seconds:4},
    {id:'odd',title:'Odd Coin Out',rules:'Find the one hollow coin among the solid coins within 3 seconds.',seconds:3,scrap:5},
    {id:'colors',title:'Color Courier',rules:'Read the requested color and deliver the matching parcel within 2 seconds.',seconds:2,scrap:5},
    {id:'reaction',title:'Launch Signal',rules:'Wait for GO, then launch within one second. Launching early loses the bonus.',seconds:8},
    {id:'maze',title:'Pocket Maze',rules:'Reach the ruby in 6 seconds. Use arrow keys or the arrow buttons. Hitting a striped wall or the edge ends the nanogame.',seconds:6,ruby:1},
    {id:'code',title:'Vault Code',rules:'Memorize the three-digit code, then enter it on the keypad. Study for 1 second.',seconds:14,ruby:1},
    {id:'rhythm',title:'Triple Chime',rules:'Stop the marker in gold three times. Wait for the next pass between hits.',seconds:12},
    ...NanoPack.games,
  ];
  const branchData = [
    ['mint','Mint','●','#8bc9ff','All dot payouts +12% per rank.',['Polished Faces','Blue Alloy','Deep Stamping','Cash Resonance','Royal Mint','Diamond Dies','Celestial Press','Infinite Treasury']],
    ['peg','Pegcraft','✦','#f4d98d','Peg-hit dots +2 per rank.',['Soft Chimes','Brass Pins','Bell Garden','Echo Chamber','Golden Contacts','Singing Steel','Starlit Lattice','Endless Echo']],
    ['mini','Minicoins','◌','#91f1d0','More companion minicoins (up to 8); then +10% minicoin yield per rank.',['Tiny Friends','Pocket Change','Coin Nursery','Little Parade','Silver Swarm','Micro Galaxy','Cubie Constellation','Infinite Companions']],
    ['forge','Foundry','⚒','#ffa881','Minicoin scrap +20% per rank. Craft boosts in the forge.',['Scrap Basket','Copper Furnace','Alloy Mixer','Precision Tools','Ruby Crucible','Arc Furnace','Matter Printer','Infinite Foundry']],
    ['ruby','Rubycraft','◆','#ff83a7','Ruby-peg discovery +0.4 percentage points per rank (up to 25%).',['Gem Lens','Red Prospect','Crystal Pick','Vein Reader','Prismatic Drill','Ruby Heart','Scarlet Nebula','Infinite Facets']],
    ['magnet','Magnetism','⌁','#bcadff','Stronger pull toward the gold center pocket.',['Pocket Magnet','Copper Coil','Field Focus','North Star','Flux Tower','Polar Engine','Gravity Well','Infinite Attraction']],
    ['reactor','Reactor','ϟ','#e6ed8c','Drop recharge gets faster with each rank (minimum 0.35s).',['Fresh Battery','Quick Charge','Power Cell','Fusion Spark','Chain Reaction','Star Core','Zero Point','Infinite Energy']],
    ['launch','Launcher','↟','#8cdef7','Every 3 ranks adds a full-value coin per drop (up to 5).',['Twin Rails','Split Gate','Double Trouble','Triple Play','Wide Volley','Meteor Shower','Crown Salvo','Infinite Rain']],
    ['combo','Combos','∞','#ffb3dc','Each unique peg hit adds +1% pocket payout per rank (up to ×12).',['Bounce Counter','Happy Accident','Chain Link','Lucky Rhythm','Perfect Cadence','Encore','Grand Finale','Infinite Rhythm']],
    ['prism','Prisms','◇','#d5b5ff','Critical pocket chance +1% per rank (up to 60%); critical pays ×3.',['Lucky Glint','Mirror Finish','Split Light','Spectrum','Aurora Glass','Rainbow Engine','Supernova','Infinite Brilliance']],
  ];
  const branches = branchData.map(([id,name,icon,color,description,names]) => ({id,name,icon,color,description,names}));
  const nodes = branches.flatMap((b,bi) => b.names.map((name,tier) => ({id:`${b.id}-${tier}`,branch:b.id,name,tier,bi,requires:tier ? `${b.id}-${tier-1}` : null,currency:tier>=6?'rubies':'dots'})));
  function restore(raw) {
    const n = (v,max=LIMIT) => Number.isFinite(v) ? clamp(Math.floor(v),0,max) : 0;
    const p = {dots:n(raw?.dots),rubies:n(raw?.rubies),scrap:n(raw?.scrap),cleared:n(raw?.cleared,20),map:n(raw?.map,19),levels:{},earned:Array.from({length:20},(_,i)=>n(raw?.earned?.[i])),drops:n(raw?.drops),boosts:n(raw?.boosts,10000)};
    p.map=Math.min(p.map,p.cleared,19);
    for(const node of nodes) p.levels[node.id]=n(raw?.levels?.[node.id],1000000);
    return p;
  }
  function rank(p,branch) { return nodes.filter(n=>n.branch===branch).reduce((s,n)=>s+(p.levels[n.id]||0)*(1+n.tier*.25),0); }
  function cost(p,node) { return Math.min(1e12,Math.ceil((node.currency==='rubies'? 6*2**(node.tier-6):35*2.65**node.tier)*1.48**Math.min(100,p.levels[node.id]||0))); }
  function unlocked(p,node) { return !node.requires || p.levels[node.requires]>0; }
  function buy(p,id) { const node=nodes.find(n=>n.id===id); if(!node||!unlocked(p,node)||p.levels[id]>=1000000) return false; const price=cost(p,node); if(p[node.currency]<price) return false; p[node.currency]-=price;p.levels[id]++;return true; }
  function award(p,map,dots,rubies=0,scrap=0) {
    if(!maps[map]) return false;
    const safe=n=>Number.isFinite(n)?clamp(Math.floor(n),0,LIMIT):0;
    p.dots=Math.min(LIMIT,p.dots+safe(dots)); p.rubies=Math.min(LIMIT,p.rubies+safe(rubies));p.scrap=Math.min(LIMIT,p.scrap+safe(scrap));p.earned[map]=Math.min(LIMIT,p.earned[map]+safe(dots));
    if(map===p.cleared&&p.earned[map]>=maps[map].goal) {p.cleared++;p.rubies+=3+map;p.dots+=Math.round(maps[map].goal*.2);return true;} return false;
  }
  function seedPegs(map) {
    const pegs=[];
    for(let row=0;row<9;row++) for(let col=0;col<9;col++) {
      let x=52+col*53+(row%2?23:0),y=130+row*45;
      const u=(x-280)/240,v=(y-310)/200;
      switch(map.layout) {
        case 'honey':x=44+col*55+(row%2?27:0);y=120+row*43;break;
        case 'wave':x+=Math.sin(row*.9)*23;break;
        case 'diamond':if(Math.abs(u)+Math.abs(v)>1.45)continue;break;
        case 'grove':if((row+col)%2)continue;break;
        case 'stairs':x+=row%3*11;if(col%3===row%3)continue;break;
        case 'towers':if(Math.abs(u)<.23)continue;break;
        case 'portal':if(row===4||col===4)continue;break;
        case 'fan':x=280+(col-4)*(25+row*3.5);break;
        case 'rings':case 'vortex': {if(col===8)continue;const a=col*Math.PI/4+row*.22;const radius=35+row*22;x=280+Math.cos(a)*radius;y=325+Math.sin(a)*radius;break;}
        case 'arches':y=150+row*38+Math.abs(col-4)*15;if(row%2&&col%2)continue;break;
      }
      if(x<25||x>535||y>555)continue;
      const bumper=(map.layout==='grove'||map.id===18)&&((row+col)%4===0);
      pegs.push({x,y,r:bumper?15:5.5,bumper,phase:row+col*.6,ruby:(row*9+col+map.id*3)%([3,15,19].includes(map.id)?7:19)===0});
    } return pegs;
  }
  // Three full playfields occupy exactly 3× the original 560×660 board area.
  // Keep coins and pins at their original physical size; this is extra space, not a stretched image.
  function featuresFor(map) {
    const features=[];
    for(let deck=0;deck<3;deck++) {
      const y=120+deck*370, shift=((map.id+deck)%3-1)*32;
      for(let j=0;j<3;j++) features.push({type:'bumper',x:210+j*210+shift,y:y+105+(j%2)*42,r:22,deck});
      for(const side of [-1,1]) {
        features.push({type:'rail',x:420+side*380,y:y+35,x2:420+side*310,y2:y+110,deck});
        features.push({type:'sling',x:420+side*355,y:y+235,x2:420+side*275,y2:y+205,deck});
      }
      features.push({type:'spinner',x:420+shift,y:y+265,length:100,phase:map.id*.37+deck*1.2,deck});
      features.push({type:'gate',x:125,y:y+320,x2:285,y2:y+320,phase:deck+map.id*.2,deck});
      for(let j=0;j<3;j++) features.push({type:'target',x:530+j*65,y:y+310,r:14,letter:'DOT'[j],deck});
      features.push({type:'nano',x:deck%2?690:150,y:y+175,r:25,game:nanogames[map.id*3+deck].id,deck});
      if(map.portal) features.push({type:'portal',x:100,y:y+170,x2:720,y2:y+65,r:24,deck});
    }
    return features.map((f,i)=>({...f,id:i}));
  }
  function segmentFor(f,time) {
    if(f.type==='spinner') {const a=time*1.35+f.phase,dx=Math.cos(a)*f.length/2,dy=Math.sin(a)*f.length/2;return {x:f.x-dx,y:f.y-dy,x2:f.x+dx,y2:f.y+dy};}
    return f;
  }
  function gateOpen(f,time) {return (time+f.phase)%3.8<1.8;}
  function pegsFor(map) {
    const fixtures=featuresFor(map),pegs=[];
    for(let deck=0;deck<3;deck++) for(const pin of seedPegs(map)) {
      const x=(deck%2?560-pin.x:pin.x)*1.5,y=120+deck*370+(pin.y-100)*.68;
      const blocked=fixtures.some(f=>{
        if(f.type==='bumper'||f.type==='target'||f.type==='portal'||f.type==='nano')return Math.hypot(x-f.x,y-f.y)<f.r+pin.r+32+map.motion;
        if(f.type==='spinner')return Math.hypot(x-f.x,y-f.y)<f.length/2+5+pin.r+32+map.motion;
        const dx=f.x2-f.x,dy=f.y2-f.y,t=clamp(((x-f.x)*dx+(y-f.y)*dy)/(dx*dx+dy*dy),0,1);
        return Math.hypot(x-f.x-t*dx,y-f.y-t*dy)<5+pin.r+32+map.motion;
      });
      const phase=pin.phase+deck*2;
      // Moving rows must leave a coin-width passage even at their closest approach.
      const crowded=pegs.some(other=>{
        const relativeSweep=2*map.motion*Math.abs(Math.sin((phase-other.phase)/2));
        return Math.hypot(Math.max(0,Math.abs(x-other.x)-relativeSweep),y-other.y)<pin.r+other.r+32;
      });
      if(!blocked&&!crowded)pegs.push({...pin,x,y,phase});
    }
    return pegs;
  }
  // Circle/segment collision shared by rails, slingshots, timed gates and rotating spinners.
  function hitSegment(c,line,restitution=.65) {
    const dx=line.x2-line.x,dy=line.y2-line.y;
    const t=clamp(((c.x-line.x)*dx+(c.y-line.y)*dy)/(dx*dx+dy*dy),0,1);
    const px=line.x+t*dx,py=line.y+t*dy;let nx=c.x-px,ny=c.y-py,d=Math.hypot(nx,ny);
    if(d>=c.r+5)return false;
    if(d<.001){d=Math.hypot(dx,dy);nx=-dy/d;ny=dx/d;}else{nx/=d;ny/=d;}
    c.x=px+nx*(c.r+5.2);c.y=py+ny*(c.r+5.2);
    const approach=c.vx*nx+c.vy*ny;
    if(approach<0){c.vx-=(1+restitution)*approach*nx;c.vy-=(1+restitution)*approach*ny;}
    return true;
  }
  class Controller {
    constructor(root,{owner=()=> 'guest',sound=()=>true,blocked=()=>false}={}) {
      this.root=root;this.owner=owner;this.sound=sound;this.blocked=blocked;this.coins=[];this.particles=[];this.aim=420;this.charge=1;this.clock=0;this.paused=false;this.visible=false;this.branch='mint';this.tab='board';this.last=0;this.musicStep=0;this.beat=0;
      this.root.innerHTML=`<div class="cd-top"><div><span class="cd-kicker">THE CUBIE CASH MACHINE</span><h3>Coin Drop <span>●</span></h3></div><div class="cd-wallet"><span>● <b id="cd-dots">0</b><small>Cubie Dots</small></span><span>◆ <b id="cd-rubies">0</b><small>Ruby Shards</small></span><span>◌ <b id="cd-scrap">0</b><small>Minicoin scrap</small></span></div></div>
      <nav class="cd-tabs" aria-label="Coin Drop sections"><button data-tab="board">Drop zone</button><button data-tab="maps">20 worlds</button><button data-tab="tree">Upgrade tree · 80</button><button data-tab="forge">Minicoin forge</button></nav>
      <section data-panel="board"><div class="cd-map-heading"><div><span id="cd-map-number" class="cd-kicker"></span><h4 id="cd-map-name"></h4></div><button id="cd-pause">Pause</button></div><p id="cd-hint"></p><div id="cd-nano-lineup" class="cd-nano-lineup" aria-label="This world’s nanogames"></div><div class="cd-progress"><div id="cd-progress-fill"></div></div><div class="cd-progress-caption"><span id="cd-progress-label"></span><div class="cd-world-nav"><button id="cd-prev">← Previous world</button><button id="cd-worlds">World select</button><button id="cd-next">Next world →</button></div></div>
      <div class="cd-table-tools"><span>3× playfield · 60 unique nanogames</span><button id="cd-reset-balls" title="Return active coins to the launcher; keep progress and collected rewards">Reset balls</button><button id="cd-zoom" aria-pressed="false">Zoom table</button></div><div class="cd-board-wrap"><canvas id="cd-board" width="840" height="1320" tabindex="0" aria-label="Coin Drop board. Left and right arrows aim; Space drops a coin. Use the aim slider and Drop button on touchscreens."></canvas><div id="cd-banner" hidden></div></div>
      <div class="cd-controls"><label>Aim <input id="cd-aim" type="range" min="30" max="810" value="420" aria-label="Coin launch position"></label><button id="cd-drop">Drop coin <span>Space</span></button></div><div class="cd-legend"><span>◎ Pop bumpers</span><span>↗ Slingshots</span><span>✳ Spinners</span><span>▰ Timed gates</span><span>DOT Bonus banks</span><span>◉ Nanogame pockets</span></div><p class="cd-note">Land in a purple pocket to play a bonus nanogame, then resume your drop. Complete a DOT bank with one coin for +25% pocket payout. Gates blink open; slingshots launch coins inward. Zoom to explore the table. Free drops. Aim and click the board, or use ← → and Space. Gold pockets pay more; red pegs can reveal Ruby Shards. Each world's goal counts all dots earned there, even after spending.</p></section>
      <section data-panel="maps" hidden><h4>Your 20-world expedition</h4><p>Clear each dot target to unlock the next world. Revisit cleared worlds to collect more resources. Switching worlds retires unfinished drops and keeps all collected rewards.</p><div id="cd-maps" class="cd-maps"></div></section>
      <section data-panel="tree" hidden><h4>A little coin. An enormous future.</h4><p>10 branches · 80 connected discoveries · repeatable ranks. Buy any node once to open the next. Later tiers give stronger ranks; crown nodes cost Ruby Shards.</p><div id="cd-branches" class="cd-branches"></div><div id="cd-tree" class="cd-tree"></div></section>
      <section data-panel="forge" hidden><h4>Small coins. Big ideas.</h4><p>Unlock Tiny Friends in the Minicoins branch. Their pocket landings create scrap as well as dots. Turn that scrap into useful machinery.</p><div class="cd-recipes"><article><span>ϟ</span><h4>Overdrive capsule</h4><p>Double dots for your next 10 drops. Stacks with your upgrades.</p><button data-craft="boost">Craft · 20 scrap</button></article><article><span>◆</span><h4>Ruby synthesis</h4><p>Compress 60 minicoin scrap into 3 rare Ruby Shards.</p><button data-craft="ruby">Synthesize · 60 scrap</button></article><article><span>●</span><h4>Dot condenser</h4><p>Convert 12 scrap into a payout worth 25% of this world's target.</p><button data-craft="dots">Condense · 12 scrap</button></article></div><p id="cd-boosts"></p></section>
      <section data-panel="lab" hidden><span class="cd-kicker">TEMPORARY MICROGAME · PRACTICE ONLY</span><h4>Nano Lab</h4><p>Learn the skills behind each challenge, then test yourself. Lessons are untimed. Wins, losses, and skips here never change your currencies or campaign.</p><div class="cd-lab-filters"><label>World <select id="cd-lab-world"><option value="all">All 20 worlds</option></select></label><label>Find a game <input id="cd-lab-search" type="search" placeholder="Name or challenge…" /></label></div><div id="cd-lab-grid" class="cd-lab-grid"></div><p id="cd-lab-result" role="status" aria-live="polite" hidden>Choose any nanogame to test.</p></section>
      <p id="cd-status" role="status" aria-live="polite">Aim for the gold. Your first world awaits.</p><p id="cd-save" class="cd-note">Progress saves in this browser for your arcade profile.</p>`;
      this.canvas=root.querySelector('canvas');this.ctx=this.canvas.getContext('2d');
      const svg=document.querySelector('.shop-coin-front')?.cloneNode(true);
      if(svg){svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.removeAttribute('class');this.coinImage=new Image();this.coinImage.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg));}
      root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>this.setTab(b.dataset.tab));
      this.$('cd-zoom').onclick=()=>{const zoom=this.root.querySelector('.cd-board-wrap').classList.toggle('cd-zoomed');this.$('cd-zoom').setAttribute('aria-pressed',String(zoom));this.$('cd-zoom').textContent=zoom?'Fit table':'Zoom table';};
      this.$('cd-drop').onclick=()=>this.drop();this.$('cd-pause').onclick=()=>{this.paused=!this.paused;this.render();};
      this.$('cd-prev').onclick=()=>this.go(this.p.map-1);this.$('cd-worlds').onclick=()=>this.setTab('maps');this.$('cd-reset-balls').onclick=()=>this.resetBalls();
      this.$('cd-next').onclick=()=>this.go(Math.min(19,this.p.map+1));
      this.$('cd-aim').oninput=e=>{this.aim=+e.target.value;};
      this.canvas.onpointermove=e=>{this.aim=clamp((e.clientX-this.canvas.getBoundingClientRect().left)/this.canvas.getBoundingClientRect().width*840,30,810);this.$('cd-aim').value=this.aim;};
      this.canvas.onclick=e=>{this.canvas.onpointermove(e);this.canvas.focus({preventScroll:true});this.drop();};
      root.addEventListener('keydown',e=>{if(this.nano||e.defaultPrevented)return;if(this.tab!=='board'||e.target.matches('input,button'))return;if(['ArrowLeft','ArrowRight',' '].includes(e.key)){e.preventDefault();if(e.key===' ') {if(!e.repeat)this.drop();}else this.aim=clamp(this.aim+(e.key==='ArrowLeft'?-24:24),30,810);this.$('cd-aim').value=this.aim;}});
      root.querySelectorAll('[data-craft]').forEach(b=>b.onclick=()=>this.craft(b.dataset.craft));
      document.addEventListener('visibilitychange',()=>{this.last=0;this.silence();});
      this.$('cd-lab-world').append(...maps.map(m=>{const option=document.createElement('option');option.value=m.id;option.textContent=`${m.id+1} · ${m.name}`;return option;}));
      this.$('cd-lab-world').onchange=this.$('cd-lab-search').oninput=()=>this.renderLab();
      this.setupNano();this.load();this.setTab('board');requestAnimationFrame(t=>this.frame(t));
    }
    $(id){return this.root.querySelector('#'+id);}
    load(){this.closeNano();this.identity=this.owner();this.key='microgame-madness.coin-drop.v1:'+this.identity;let raw;try{raw=JSON.parse(localStorage.getItem(this.key));}catch{}this.p=restore(raw);this.coins=[];this.particles=[];this.charge=1;this.pegs=pegsFor(maps[this.p.map]);this.features=featuresFor(maps[this.p.map]);this.render();}
    save(){if(!this.p)return;try{localStorage.setItem(this.key,JSON.stringify(this.p));this.$('cd-save').textContent='Saved in this browser for your arcade profile · Coin Drop currencies are separate from shop Cash.';}catch{this.$('cd-save').textContent='Browser storage unavailable: progress lasts only for this visit.';}}
    setLabMode(on){
      if(this.nano)this.finishNano(false,'closed');this.labMode=on;this.root.classList.toggle('cd-lab-mode',on);this.setTab(on?'lab':'board');if(on)this.renderLab();
    }
    renderLab(){
      const world=this.$('cd-lab-world').value,search=this.$('cd-lab-search').value.trim().toLowerCase();
      this.$('cd-lab-grid').replaceChildren(...nanogames.flatMap((g,i)=>{
        const map=maps[Math.floor(i/3)];if(world!=='all'&&+world!==map.id||search&&!`${g.title} ${g.rules}`.toLowerCase().includes(search))return [];
        const card=document.createElement('article'),tag=document.createElement('small'),title=document.createElement('h4'),rules=document.createElement('p'),button=document.createElement('button');
        tag.textContent=`WORLD ${map.id+1} · POCKET ${i%3+1} · ${g.seconds}s`;title.textContent=g.title;rules.textContent=g.rules;button.textContent='Test nanogame';button.dataset.nanoTest=g.id;button.onclick=()=>this.startNanoTest(g.id);const learn=document.createElement('button');learn.textContent='Learn how';learn.dataset.nanoLearn=g.id;learn.onclick=()=>this.startNanoTest(g.id,true);const actions=document.createElement('div');actions.className='cd-lab-card-actions';actions.append(learn,button);card.append(tag,title,rules,actions);return [card];
      }));
      if(!this.$('cd-lab-grid').children.length)this.$('cd-lab-grid').textContent='No nanogames match this search.';
    }
    startNanoTest(id,lesson=false){
      if(this.blocked()||!this.labMode)return;const index=nanogames.findIndex(g=>g.id===id);if(index<0)return;
      const map=maps[Math.floor(index/3)],pocket=featuresFor(map).find(f=>f.game===id);
      this.enterNano({x:pocket.x,y:pocket.y,r:12,boost:1,age:0},pocket,true);if(lesson){this.$('cd-nano-lesson').open=true;this.$('cd-nano-lesson').querySelector('summary').focus();}
    }
    setVisible(v){this.visible=v;if(v&&this.identity!==this.owner())this.load();if(!v){if(this.nano)this.finishNano(false,'closed');this.save();this.silence();}this.last=0;}
    playable(){return !this.nano&&this.visible&&!this.paused&&!document.hidden&&!this.blocked()&&this.tab==='board'&&!document.querySelector('dialog[open]');}
    setTab(tab){this.tab=tab;this.root.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==tab);this.root.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));this.render();}
    message(text){this.$('cd-status').textContent=text;}
    go(index){if(this.blocked()||index>this.p.cleared||!maps[index])return;this.closeNano();this.coins=[];this.p.map=index;this.pegs=pegsFor(maps[index]);this.features=featuresFor(maps[index]);this.particles=[];this.charge=1;this.paused=false;this.save();this.setTab('board');this.message(`${maps[index].name}: ${maps[index].hint}`);}
    resetBalls(){
      if(this.blocked())return;this.closeNano();
      for(let i=0;i<this.coins.length;i++){
        const c=this.coins[i];c.x=clamp(this.aim+(i%7-3)*16,20,820);c.y=50-Math.floor(i/7)*2;
        c.vx=(i%2?1:-1)*20;c.vy=0;c.age=0;c.stallTime=0;c.anchorX=c.x;c.anchorY=c.y;c.nudges=0;c.deepestY=c.y;c.noProgress=0;
        // Keep hit ledgers, boosts and nanogame eligibility so reset cannot duplicate rewards.
      }
      this.particles=[];this.charge=1;this.paused=true;this.last=0;this.render();
      this.message('Balls returned to the launcher. Press Resume to continue, or choose another unlocked world. Progress and collected rewards are kept.');
    }
    craft(kind){if(this.blocked())return;const price={boost:20,ruby:60,dots:12}[kind];if(this.p.scrap<price){this.message('Collect more minicoin scrap to craft this.');return;}this.p.scrap-=price;if(kind==='boost')this.p.boosts+=10;if(kind==='ruby')this.p.rubies+=3;if(kind==='dots')this.reward(Math.round(maps[this.p.map].goal*.25));this.save();this.render();this.message('Crafted! '+({boost:'10 overdrive drops ready.',ruby:'3 Ruby Shards added.',dots:'Condenser dots collected.'}[kind]));this.tone(880,.2);}
    drop(){if(!this.playable()||this.charge<1||this.coins.length>65)return;this.startAudio();this.charge=0;this.p.drops++;const boost=this.p.boosts>0?2:1;if(this.p.boosts>0)this.p.boosts--;const mains=1+Math.min(4,Math.floor(rank(this.p,'launch')/3));const minis=Math.min(8,Math.ceil(rank(this.p,'mini')));
      for(let i=0;i<mains+minis;i++){const mini=i>=mains;this.coins.push({x:clamp(this.aim+(i-(mains+minis-1)/2)*13,18,822),y:52-(i%3)*12,vx:(Math.random()-.5)*30,vy:10,r:mini?6:12,mini,boost,age:0,hits:new Set(),featureHits:new Set(),banks:new Set(),pocketBonus:1,portal:0,rubyHits:0});}this.save();this.tone(440,.08);this.render();}
    reward(dots,rubies=0,scrap=0){const clear=award(this.p,this.p.map,dots,rubies,scrap);if(clear){this.message(this.p.cleared===20?'CROWN COMPLETE! All 20 worlds conquered. Keep building your infinite machine.':`${maps[this.p.map].name} cleared! Bonus dots and ${3+this.p.map} Ruby Shards. Next world unlocked.`);this.burst(420,650,'#ffdc7b',45);this.tone(1046,.5);}return clear;}
    startAudio(){if(!this.sound())return;try{if(!this.audio){this.audio=new (window.AudioContext||window.webkitAudioContext)();this.master=this.audio.createGain();this.master.gain.value=.12;this.master.connect(this.audio.destination);}if(this.audio.state==='suspended')this.audio.resume().catch(()=>{});}catch{}}
    silence(){if(this.master)this.master.gain.value=0;this.nanoMusic?.silence();}
    tone(freq,duration=.08,type='sine',volume=.35){if(!this.audio||!this.sound()||!this.playable())return;const t=this.audio.currentTime,o=this.audio.createOscillator(),g=this.audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect();};}
    burst(x,y,color,count=8){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(let i=0;i<count;i++)this.particles.push({x,y,vx:(Math.random()-.5)*170,vy:(Math.random()-.7)*170,life:.7,color});if(this.particles.length>220)this.particles.splice(0,this.particles.length-220);}
    setupNano(){
      this.nanoDialog=document.createElement('dialog');this.nanoDialog.className='cd-nano';
      this.nanoDialog.setAttribute('aria-labelledby','cd-nano-title');
      this.nanoDialog.innerHTML=`<span class="cd-kicker">POCKET NANOGAME · BOARD PAUSED</span><h3 id="cd-nano-title"></h3><p id="cd-nano-rules"></p><p id="cd-nano-prize"></p><details id="cd-nano-lesson" class="cd-lesson" hidden><summary>Lesson & reference</summary><div id="cd-nano-lesson-body"></div></details><div id="cd-nano-stage"></div><p id="cd-nano-feedback" role="status" aria-live="polite"></p><div class="cd-nano-actions"><button id="cd-nano-start">Start nanogame</button><button id="cd-nano-skip">Skip & resume drop</button></div>`;
      this.root.append(this.nanoDialog);
      // Keep the actual labels intact for keyboard controls and screen readers; artwork is a visual layer.
      const stage=this.$('cd-nano-stage');
      const paint=()=>stage.querySelectorAll('button,.cd-nano-prompt,.cd-nano-sequence,.cd-pack-flash,.cd-nano-maze span').forEach(node=>{
        const label=node.textContent.trim(),symbols={'●':'coin','○':'ring','◆':'gem','★':'star','☾':'moon','☄':'comet','✹':'mine','↑':'up','←':'left','↓':'down','→':'right','↖':'upleft','↗':'upright','↙':'downleft','↘':'downright','C':'coin'};
        const art=node.querySelector('svg')||this.nano?.config?.variant==='size'?'':symbols[label]||'';
        if(art)node.dataset.nanoArt=art;else delete node.dataset.nanoArt;
        if(!art&&!node.children.length&&/[●○◆★☾☄✹↑←↓→↖↗↙↘]/u.test(label)&&label.length>1){
          const parts=label.split(/([●○◆★☾☄✹↑←↓→↖↗↙↘])/u);
          node.replaceChildren(...parts.map(part=>{if(!symbols[part])return document.createTextNode(part);const token=document.createElement('span');token.className='cd-art-token';token.dataset.nanoArt=symbols[part];token.textContent=part;return token;}));
        }
      });
      this.nanoArtObserver=new MutationObserver(paint);this.nanoArtObserver.observe(stage,{childList:true,subtree:true,characterData:true});
      this.$('cd-nano-start').onclick=()=>this.startNano();this.$('cd-nano-skip').onclick=()=>this.finishNano(false,'closed');
      this.nanoDialog.addEventListener('keydown',e=>{
        if(this.nano?.challenge){this.nano.challenge.key(e);return;}
        const direction={ArrowUp:0,ArrowLeft:1,ArrowDown:2,ArrowRight:3}[e.key];
        if(this.nano?.game!=='maze'||direction===undefined)return;
        e.preventDefault();e.stopPropagation();if(!e.repeat)this.moveNanoMaze(direction);
      });
      this.nanoDialog.addEventListener('keyup',e=>this.nano?.challenge?.key(e));
      this.nanoDialog.addEventListener('cancel',e=>{e.preventDefault();this.finishNano(false,'closed');});
    }
    closeNano(){this.nanoMusic?.stop();this.nano?.challenge?.dispose();if(this.nanoDialog?.open)this.nanoDialog.close();this.nano=null;}
    enterNano(coin,pocket,testing=false){
      if(this.nano)return;coin.nanoPlayed=true;
      this.nano={coin,pocket,testing,game:pocket.game,phase:'ready',elapsed:0,position:.5,sequence:Array.from({length:4},()=>Math.floor(Math.random()*4)),index:0,stars:0,
        prize:Math.ceil(60*maps[this.p.map].value*(1+rank(this.p,'mint')*.12)*coin.boost)};
      const game=nanogames.find(g=>g.id===pocket.game);this.nano.config=game;
      this.nanoDialog.dataset.game=game.id;this.nanoDialog.dataset.kind=game.kind||game.id;const hue=[207,268,164,35,335][Math.floor(nanogames.indexOf(game)/3)%5];this.nanoDialog.style.setProperty('--nano-hue',hue);
      this.nanoDialog.querySelector('.cd-kicker').textContent=testing?'NANO LAB · PRACTICE ONLY':'POCKET NANOGAME · BOARD PAUSED';
      this.$('cd-nano-skip').textContent=testing?'Close test':'Skip & resume drop';
      this.$('cd-nano-title').textContent=game.title;this.$('cd-nano-rules').textContent=game.rules;
      this.$('cd-nano-prize').textContent=`Win: ${fmt(this.nano.prize+(game.ruby||game.scrap?0:20))} Cubie Dots`+(game.ruby?' + 1 Ruby Shard':game.scrap?' + 5 minicoin scrap':'');
      if(testing){this.$('cd-lab-result').hidden=true;this.$('cd-nano-prize').textContent='Nano Lab practice · no rewards or progress changes';}
      this.$('cd-nano-lesson').hidden=!testing;this.$('cd-nano-lesson').open=false;this.$('cd-nano-lesson-body').replaceChildren();if(testing)Lessons.render(this.$('cd-nano-lesson-body'),game);
      this.$('cd-nano-stage').replaceChildren();this.$('cd-nano-feedback').textContent=testing?'Read the lesson or start when you’re ready. No timer is running.':'Your coin is safe. Start when you’re ready.';this.$('cd-nano-start').hidden=false;
      this.nanoDialog.showModal();this.$('cd-nano-start').focus();this.silence();
    }
    startNano(){
      const n=this.nano;if(!n||n.phase!=='ready')return;n.phase='playing';n.elapsed=0;this.$('cd-nano-lesson').hidden=true;this.startAudio();this.syncNanoMusic();this.$('cd-nano-start').hidden=true;const stage=this.$('cd-nano-stage');
      if(n.config.kind){n.challenge=NanoPack.create(n.config,stage,won=>{if(this.nano===n)this.finishNano(won);});return;}
      if(n.game==='timing'||n.game==='rhythm'){
        stage.innerHTML='<div class="cd-nano-meter"><span class="cd-nano-gold"></span><span id="cd-nano-marker"></span></div><button id="cd-nano-stop">Stop marker</button>';
        this.$('cd-nano-stop').onclick=()=>{if(n.game==='rhythm'&&n.elapsed-(n.lastChime??-10)<.6)return;if(n.position<.39||n.position>.61){this.finishNano(false);return;}n.chimes=(n.chimes||0)+1;n.lastChime=n.elapsed;if(n.game==='timing'||n.chimes===3)this.finishNano(true);};this.$('cd-nano-stop').focus();
      }else if(n.game==='memory'){
        stage.innerHTML='<div id="cd-nano-sequence" class="cd-nano-sequence"></div><div id="cd-nano-symbols" class="cd-nano-symbols"></div>';
        const symbols=['●','◆','★','☾'];this.$('cd-nano-sequence').textContent=n.sequence.map(i=>symbols[i]).join('  ');
        this.$('cd-nano-symbols').replaceChildren(...symbols.map((symbol,index)=>{const b=document.createElement('button');b.textContent=symbol;b.setAttribute('aria-label',['Circle','Diamond','Star','Moon'][index]);b.disabled=true;b.onclick=()=>{if(this.nano!==n||n.elapsed<3)return;if(n.sequence[n.index]!==index){this.finishNano(false);return;}n.index++;this.$('cd-nano-sequence').textContent='✓ '.repeat(n.index);if(n.index===4)this.finishNano(true);};return b;}));
      }else if(n.game==='stars'){
        stage.innerHTML='<div class="cd-nano-sky"><button id="cd-nano-star" aria-label="Catch star">★</button></div>';
        this.$('cd-nano-star').onclick=()=>{if(this.nano!==n)return;n.stars++;if(n.stars===5){this.finishNano(true);return;}this.moveNanoStar();};this.moveNanoStar();this.$('cd-nano-star').focus();
      }else this.startExtraNano(n,stage);
    }
    nanoChoices(stage,labels,onChoose){
      const choices=document.createElement('div');choices.className='cd-nano-choices';
      labels.forEach((label,index)=>{const button=document.createElement('button');button.textContent=label;button.onclick=()=>onChoose(index);choices.append(button);});stage.append(choices);choices.firstChild?.focus();return choices;
    }
    startExtraNano(n,stage){
      stage.replaceChildren();
      if(n.game==='math'){
        const a=2+Math.floor(Math.random()*18),b=2+Math.floor(Math.random()*18),answer=a+b;
        const prompt=document.createElement('p');prompt.className='cd-nano-prompt';prompt.textContent=`${a} + ${b} = ?`;stage.append(prompt);
        n.correct=Math.floor(Math.random()*3);const values=[answer-2,answer+3,answer+5];values[n.correct]=answer;
        this.nanoChoices(stage,values,index=>this.finishNano(index===n.correct));
      }else if(n.game==='odd'){
        n.correct=Math.floor(Math.random()*9);const buttons=this.nanoChoices(stage,Array.from({length:9},(_,i)=>i===n.correct?'○':'●'),i=>this.finishNano(i===n.correct));buttons.classList.add('cd-nano-grid');
        [...buttons.children].forEach((b,i)=>b.setAttribute('aria-label',`${i===n.correct?'Hollow':'Solid'} coin ${i+1}`));
      }else if(n.game==='colors'){
        const colors=['Blue','Rose','Gold','Mint'];n.correct=Math.floor(Math.random()*4);const prompt=document.createElement('p');prompt.className='cd-nano-prompt';prompt.textContent=`Deliver ${colors[n.correct]}`;stage.append(prompt);
        const buttons=this.nanoChoices(stage,colors,i=>this.finishNano(i===n.correct));[...buttons.children].forEach((b,i)=>b.style.borderColor=['#82bbff','#ff8bae','#f6d273','#8ae5c0'][i]);
      }else if(n.game==='reaction'){
        n.signalAt=2+Math.random()*2;const button=document.createElement('button');button.id='cd-nano-launch';button.className='cd-nano-signal';button.textContent='WAIT…';button.onclick=()=>this.finishNano(n.elapsed>=n.signalAt&&n.elapsed<=n.signalAt+1);stage.append(button);button.focus();
      }else if(n.game==='maze'){
        n.mazePos=0;n.walls=new Set([1,5,7,9]);stage.innerHTML='<div id="cd-nano-maze" class="cd-nano-maze" aria-label="Maze board"></div>';
        this.renderNanoMaze();this.nanoChoices(stage,['↑','←','↓','→'],direction=>this.moveNanoMaze(direction));
      }else if(n.game==='code'){
        n.code=Array.from({length:3},()=>1+Math.floor(Math.random()*6));n.index=0;stage.innerHTML='<div id="cd-nano-code" class="cd-nano-sequence"></div>';this.$('cd-nano-code').textContent=n.code.join(' ');
        const buttons=this.nanoChoices(stage,[1,2,3,4,5,6],i=>{if(n.elapsed<1)return;if(i+1!==n.code[n.index]){this.finishNano(false);return;}n.index++;this.$('cd-nano-code').textContent='✓ '.repeat(n.index);if(n.index===3)this.finishNano(true);});buttons.classList.add('cd-nano-grid');[...buttons.children].forEach(b=>b.disabled=true);
      }
    }
    moveNanoMaze(direction){
      const n=this.nano;
      if(!n||n.game!=='maze'||n.phase!=='playing'||this.blocked()||document.hidden)return;
      const delta=[[0,-1],[-1,0],[0,1],[1,0]][direction];if(!delta)return;
      const x=n.mazePos%4,y=Math.floor(n.mazePos/4),nx=x+delta[0],ny=y+delta[1],next=ny*4+nx;
      if(nx<0||nx>3||ny<0||ny>3||n.walls.has(next)){
        this.finishNano(false);this.message('Hit a wall! Pocket Maze lost — your coin is back in play.');return;
      }
      n.mazePos=next;this.renderNanoMaze();if(next===15)this.finishNano(true);
    }
    renderNanoMaze(){const n=this.nano;this.$('cd-nano-maze').replaceChildren(...Array.from({length:16},(_,i)=>{const cell=document.createElement('span');cell.className=n.walls.has(i)?'cd-maze-wall':'';cell.textContent=i===n.mazePos?'C':i===15?'◆':'';return cell;}));}
    moveNanoStar(){const star=this.$('cd-nano-star');star.style.left=(8+Math.random()*70)+'%';star.style.top=(8+Math.random()*62)+'%';}
    syncNanoMusic(){
      const n=this.nano;
      if(!n||n.phase!=='playing'){this.nanoMusic?.stop();return;}
      if(!this.audio&&this.sound())this.startAudio();
      if(!this.audio)return;
      if(!this.nanoMusic)this.nanoMusic=new NanoMusic.Player(this.audio);
      if(this.nanoMusic.song?.id!==n.game)this.nanoMusic.start(NanoMusic.score(n.config));
      this.nanoMusic.sync(this.visible&&this.sound()&&!document.hidden&&!this.blocked(),n.elapsed);
    }
    tickNano(dt){
      const n=this.nano;if(!n||n.phase!=='playing'||document.hidden||this.blocked())return;n.elapsed+=dt;
      const limit=n.config.seconds;
      if(n.elapsed>=limit){this.finishNano(false,'timeout');return;}
      if(n.challenge){n.challenge.tick(dt);if(this.nano!==n)return;this.$('cd-nano-feedback').textContent=n.config.kind==='stopwatch'?'Trust your inner clock…':`${Math.ceil(limit-n.elapsed)} seconds left`;return;}
      if(n.game==='timing'||n.game==='rhythm'){n.position=.5+Math.sin(n.elapsed*3.8)*.47;this.$('cd-nano-marker').style.left=n.position*100+'%';}
      if(n.game==='memory'&&n.elapsed>=3&&!n.revealed){n.revealed=true;this.$('cd-nano-sequence').textContent='Your turn';this.$('cd-nano-symbols').querySelectorAll('button').forEach(b=>b.disabled=false);this.$('cd-nano-symbols').querySelector('button').focus();}
      if(n.game==='code'&&n.elapsed>=1&&!n.revealed){n.revealed=true;this.$('cd-nano-code').textContent='Enter code';this.$('cd-nano-stage').querySelectorAll('button').forEach(b=>b.disabled=false);this.$('cd-nano-stage').querySelector('button').focus();}
      if(n.game==='reaction'){if(n.elapsed>n.signalAt+1){this.finishNano(false);return;}if(n.elapsed>=n.signalAt){this.$('cd-nano-launch').textContent='GO!';this.$('cd-nano-launch').classList.add('cd-nano-go');}}
      const feedback=((n.game==='memory'&&n.elapsed<3)||(n.game==='code'&&n.elapsed<1))?'Memorize the sequence…':`${Math.ceil(limit-n.elapsed)} seconds left`+(n.game==='stars'?` · ${n.stars}/5 stars`:n.game==='memory'?` · ${n.index}/4 symbols`:n.game==='rhythm'?` · ${n.chimes||0}/3 chimes`:['timing'].includes(n.game)?' · Aim for gold':'');
      if(this.$('cd-nano-feedback').textContent!==feedback)this.$('cd-nano-feedback').textContent=feedback;
    }
    finishNano(won,reason='result'){
      const n=this.nano;if(!n)return;
      if(n.testing){
        this.closeNano();const result=this.$('cd-lab-result'),outcome=won?'win':reason==='closed'?'closed':'loss';
        result.dataset.outcome=outcome;result.hidden=false;result.replaceChildren();
        const badge=document.createElement('strong'),text=document.createElement('span'),retry=document.createElement('button'),dismiss=document.createElement('button');
        badge.className='cd-result-badge';badge.textContent=outcome.toUpperCase();
        text.textContent=`${n.config.title}: ${won?'won!':outcome==='closed'?'test closed.':reason==='timeout'?'lost — time ran out.':'lost.'} Practice only — no rewards saved.`;
        retry.textContent='Try again';retry.onclick=()=>this.startNanoTest(n.game);dismiss.textContent='Dismiss';dismiss.onclick=()=>{result.hidden=true;};
        result.append(badge,text,retry,dismiss);this.last=0;return;
      }
      n.coin.x=n.pocket.x;n.coin.y=n.pocket.y+n.pocket.r+n.coin.r+6;n.coin.vy=130;n.coin.vx=45;n.coin.age=Math.min(n.coin.age,30);
      this.closeNano();this.nanoCooldown=this.clock+8;
      if(won){this.reward(n.prize+(n.config.ruby||n.config.scrap?0:20),n.config.ruby||0,n.config.scrap||0);this.message(`${n.config.title} won! Bonus collected — resuming your drop.`);this.burst(n.coin.x,n.coin.y,'#d6a0ff',24);this.tone(1046,.3);}
      else this.message('Nanogame finished — your coin is back in play.');
      this.save();this.renderStats();if(this.visible&&this.tab==='board')this.canvas.focus({preventScroll:true});this.last=0;
    }
    update(dt){
      if(!Number.isFinite(dt)||dt<=0||this.nano)return;
      // Bounded steps prevent fast minicoins and moving fixtures tunnelling between frames.
      let remaining=Math.min(dt,.1);
      while(remaining>1e-8&&!this.nano){const step=Math.min(1/240,remaining);this.stepPhysics(step);remaining-=step;}
    }
    stepPhysics(dt){if(this.nano)return;const map=maps[this.p.map],p=this.p;this.clock+=dt;this.charge=Math.min(1,this.charge+dt/Math.max(.35,1.45/(1+rank(p,'reactor')*.1)));this.beat+=dt;
      if(this.beat>.24){this.beat=0;const scale=[0,7,12,16,14,7,4,12,0,7,11,14,12,7,4,2];this.tone(220*2**((scale[this.musicStep%16]+(Math.floor(this.p.map/5)*2))/12),.3,'triangle',.16);if(this.musicStep%4===0)this.tone(110*2**([0,0,5,7][Math.floor(this.musicStep/4)%4]/12),.65,'sine',.25);this.musicStep++;}
      const positions=this.pegs.map(peg=>({...peg,x:peg.x+Math.sin(this.clock*1.1+peg.phase)*map.motion}));
      let changed=false;
      for(const c of this.coins){c.age+=dt;c.vy+=400*map.gravity*dt;c.vx+=(map.wind*Math.cos(this.clock*.7)+(420-c.x)*Math.min(1.5,rank(p,'magnet')*.018))*dt;c.vx*=Math.exp(-.12*dt);c.vx=clamp(c.vx,-450,450);c.vy=clamp(c.vy,-340,650);c.x+=c.vx*dt;c.y+=c.vy*dt;
        if(c.x<c.r+8){c.x=c.r+8;c.vx=Math.abs(c.vx)*.8;}if(c.x>832-c.r){c.x=832-c.r;c.vx=-Math.abs(c.vx)*.8;}if(c.y<25){c.y=25;c.vy=Math.abs(c.vy);}
        positions.forEach((peg,i)=>{let dx=c.x-peg.x,dy=c.y-peg.y,d=Math.hypot(dx,dy),r=c.r+peg.r;if(d>=r)return;if(d<.001){dx=.1;dy=-1;d=Math.hypot(dx,dy);}const nx=dx/d,ny=dy/d;c.x=peg.x+nx*(r+.15);c.y=peg.y+ny*(r+.15);const dot=c.vx*nx+c.vy*ny;if(dot<0){const bounce=peg.bumper?1.05:map.id===11?.85:.57;c.vx-=(1+bounce)*dot*nx;c.vy-=(1+bounce)*dot*ny;c.vx+=nx*12+(Math.abs(nx)<.05?(Math.random()<.5?-18:18):0);c.vy=clamp(c.vy,-240,480);}
          if(!c.hits.has(i)){c.hits.add(i);const val=Math.ceil((1+rank(p,'peg')*2)*map.value*(c.mini?.3:1)*(1+rank(p,'mint')*.12)*c.boost);const ruby=peg.ruby&&Math.random()<Math.min(.25,.035+rank(p,'ruby')*.004)&&c.rubyHits<3?1:0;c.rubyHits+=ruby;this.reward(val,ruby);changed=true;if(ruby)this.message('◆ Ruby Shard discovered!');this.burst(peg.x,peg.y,ruby?'#ff638e':map.color,4);if(this.clock-(this.lastPing||0)>.045){this.tone(440*2**((i%12)/12),.06,'sine',.12);this.lastPing=this.clock;}}
        });
        for(const f of this.features) {
          let contact=false;
          if(f.type==='nano') {
            if(!c.nanoPlayed&&c.vy>0&&this.clock>=(this.nanoCooldown||0)&&Math.hypot(c.x-f.x,c.y-f.y)<f.r){this.coins=this.coins.filter(coin=>!coin.dead);this.save();this.renderStats();this.enterNano(c,f);return;}
          } else if(f.type==='bumper') {
            const dx=c.x-f.x,dy=c.y-f.y,d=Math.hypot(dx,dy),radius=c.r+f.r;
            if(d<radius){const nx=d>.001?dx/d:0,ny=d>.001?dy/d:-1;c.x=f.x+nx*(radius+.5);c.y=f.y+ny*(radius+.5);c.vx=nx*280;c.vy=ny*280-60;contact=true;}
          } else if(f.type==='target') {
            contact=Math.hypot(c.x-f.x,c.y-f.y)<c.r+f.r;
          } else if(f.type==='portal') {
            if(!c.featureHits.has(f.id)&&Math.hypot(c.x-f.x,c.y-f.y)<f.r){c.x=f.x2;c.y=f.y2;c.vx=-110;c.vy=50;contact=true;}
          } else if(f.type!=='gate'||!gateOpen(f,this.clock)) {
            contact=hitSegment(c,segmentFor(f,this.clock),f.type==='sling'?1.05:.6);
            if(contact&&f.type==='sling'){c.vx=f.x<420?280:-280;c.vy=-230;}
            if(contact&&f.type==='spinner'){c.vx+=Math.cos(this.clock*1.35+f.phase)*45;c.vy+=Math.sin(this.clock*1.35+f.phase)*45;}
          }
          if(contact&&!c.featureHits.has(f.id)) {
            c.featureHits.add(f.id);const color=f.type==='target'?'#8ff2bb':'#ffd77c';
            const bonus=Math.ceil(({bumper:4,target:6,spinner:8,sling:3,portal:5,rail:0,gate:0}[f.type])*map.value*(c.mini?.3:1)*c.boost);
            if(bonus)this.reward(bonus);changed=true;this.burst(c.x,c.y,color,6);this.tone(f.type==='target'?990:330,.09,'triangle',.18);
            if(f.type==='target'&&!c.banks.has(f.deck)&&this.features.filter(t=>t.type==='target'&&t.deck===f.deck).every(t=>c.featureHits.has(t.id))) {
              c.banks.add(f.deck);c.pocketBonus+=.25;this.reward(Math.ceil(30*map.value*c.boost));this.message(`DOT bank complete! This coin's pocket payout is now ×${c.pocketBonus.toFixed(2)}.`);this.burst(c.x,c.y,'#8ff2bb',20);
            }
          }
        }
        c.vx=clamp(c.vx,-450,450);c.vy=clamp(c.vy,-340,650);
        // Detect a local perch, then kick free using velocity. Collisions NEVER expire.
        if(c.anchorX===undefined){c.anchorX=c.x;c.anchorY=c.y;c.stallTime=0;}
        if(Math.hypot(c.x-c.anchorX,c.y-c.anchorY)>28){c.anchorX=c.x;c.anchorY=c.y;c.stallTime=0;}
        else c.stallTime+=dt;
        if(c.deepestY===undefined||c.y>c.deepestY+20){c.deepestY=c.y;c.noProgress=0;}else c.noProgress=(c.noProgress||0)+dt;
        if(c.stallTime>1.4||c.noProgress>4.5){c.noProgress=0;c.nudges=(c.nudges||0)+1;c.vx=(c.nudges%2?1:-1)*150;c.vy=-95;c.stallTime=0;}

        if(c.y>=BOARD.pocketY){const slot=clamp(Math.floor(c.x/BOARD.slotWidth),0,6),mult=[2,4,8,16,8,4,2][slot];const crit=Math.random()<Math.min(.6,rank(p,'prism')*.01);const combo=Math.min(12,1+c.hits.size*rank(p,'combo')*.01);const val=Math.ceil(mult*8*map.value*(1+rank(p,'mint')*.12)*combo*c.pocketBonus*(crit?3:1)*(c.mini?.2*(1+rank(p,'mini')*.1):1)*c.boost);const scrap=c.mini?Math.max(1,Math.floor(1+rank(p,'forge')*.2)):0;this.reward(val,0,scrap);c.dead=true;changed=true;this.burst(c.x,1270,crit?'#ff83a7':'#ffdf81',14);this.tone(crit?1320:660,.18);this.particles.push({x:c.x,y:1250,vx:0,vy:-30,life:1.3,color:'#fff1b7',text:`+${fmt(val)}${crit?' CRIT':''}`});}
      }
      this.coins=this.coins.filter(c=>!c.dead);this.particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;});this.particles=this.particles.filter(p=>p.life>0);if(changed){this.save();this.renderStats();}
      this.$('cd-drop').disabled=this.charge<1;this.$('cd-drop').style.setProperty('--charge',`${this.charge*100}%`);
    }
    draw(){const ctx=this.ctx,map=maps[this.p.map];ctx.clearRect(0,0,840,1320);const bg=ctx.createLinearGradient(0,0,840,1320);bg.addColorStop(0,'#142d43');bg.addColorStop(1,'#080e1c');ctx.fillStyle=bg;ctx.fillRect(0,0,840,1320);ctx.strokeStyle=map.color+'18';ctx.lineWidth=1;
      for(let x=0;x<840;x+=28){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1320);ctx.stroke();}for(let y=0;y<1320;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(840,y);ctx.stroke();}
      ctx.fillStyle=map.color;ctx.font='bold 11px monospace';ctx.textAlign='left';ctx.fillText(`SECTOR ${String(map.id+1).padStart(2,'0')} / 20`,20,27);ctx.textAlign='right';ctx.fillText(`${this.coins.length} IN FLIGHT`,820,27);
      ctx.strokeStyle=map.color+'60';ctx.setLineDash([3,7]);ctx.beginPath();ctx.moveTo(this.aim,70);ctx.lineTo(this.aim,112);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=map.color;ctx.beginPath();ctx.moveTo(this.aim-17,40);ctx.lineTo(this.aim+17,40);ctx.lineTo(this.aim,52);ctx.fill();
      for(const peg of this.pegs){const x=peg.x+Math.sin(this.clock*1.1+peg.phase)*map.motion;ctx.beginPath();ctx.arc(x,peg.y,peg.r+4,0,Math.PI*2);ctx.fillStyle=(peg.ruby?'#ff6e99':map.color)+'18';ctx.fill();ctx.beginPath();ctx.arc(x,peg.y,peg.r,0,Math.PI*2);ctx.fillStyle=peg.ruby?'#ff759c':peg.bumper?'#ffe39a':map.color;ctx.fill();ctx.fillStyle='#ffffff99';ctx.beginPath();ctx.arc(x-1.5,peg.y-1.5,peg.r*.28,0,Math.PI*2);ctx.fill();}
      ctx.textAlign='left';ctx.font='bold 12px monospace';
      for(let deck=0;deck<3;deck++){ctx.fillStyle=map.color+'99';ctx.fillText(['01 / BUMPER GARDEN','02 / SPIN ALLEY','03 / BONUS VAULT'][deck],24,105+deck*370);}
      for(const f of this.features) {
        const lit=this.coins.some(c=>c.featureHits.has(f.id));
        ctx.lineWidth=4;ctx.strokeStyle='#8cb4d5';ctx.fillStyle='#122a42';
        if(f.type==='nano') {
          ctx.fillStyle='#080c1a';ctx.strokeStyle='#de9cff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#f0c9ff';ctx.font='bold 20px monospace';ctx.textAlign='center';ctx.fillText((nanogames.find(g=>g.id===f.game).icon||{timing:'ϟ',memory:'◇',stars:'★',math:'+',odd:'◉',colors:'▣',reaction:'!',maze:'⊞',code:'#',rhythm:'♫'}[f.game]),f.x,f.y+7);ctx.font='9px monospace';ctx.fillText(`NANOGAME ${f.deck+1}`,f.x,f.y+f.r+15);
        } else if(f.type==='bumper') {
          ctx.beginPath();ctx.arc(f.x,f.y,f.r+7,0,Math.PI*2);ctx.strokeStyle=lit?'#fff5c9':'#eebc62';ctx.stroke();ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fillStyle=lit?'#fff1a0':'#eab85e';ctx.fill();ctx.fillStyle='#453024';ctx.textAlign='center';ctx.font='bold 18px monospace';ctx.fillText('✦',f.x,f.y+6);
        } else if(f.type==='target') {
          ctx.fillStyle=lit?'#9dffd1':'#153e3a';ctx.strokeStyle='#84e9b1';ctx.fillRect(f.x-14,f.y-16,28,32);ctx.strokeRect(f.x-14,f.y-16,28,32);ctx.fillStyle=lit?'#12432f':'#b0ffcf';ctx.font='bold 19px monospace';ctx.textAlign='center';ctx.fillText(f.letter,f.x,f.y+7);
        } else if(f.type==='portal') {
          ctx.strokeStyle='#c28aff';for(const [x,y] of [[f.x,f.y],[f.x2,f.y2]]){ctx.beginPath();ctx.ellipse(x,y,f.r,12,0,0,Math.PI*2);ctx.stroke();}
        } else {
          const line=segmentFor(f,this.clock),open=f.type==='gate'&&gateOpen(f,this.clock);ctx.strokeStyle=f.type==='sling'?'#ff84aa':f.type==='spinner'?'#9ce9ff':f.type==='gate'?(open?'#7df1be':'#ffbb72'):'#5b83b5';ctx.lineWidth=f.type==='rail'?8:6;ctx.setLineDash(open?[5,12]:[]);ctx.beginPath();ctx.moveTo(line.x,line.y);ctx.lineTo(line.x2,line.y2);ctx.stroke();ctx.setLineDash([]);
          if(f.type==='spinner'){ctx.beginPath();ctx.arc(f.x,f.y,8,0,Math.PI*2);ctx.fillStyle='#d2f6ff';ctx.fill();}
          if(f.type==='gate'){ctx.font='10px monospace';ctx.textAlign='center';ctx.fillStyle=ctx.strokeStyle;ctx.fillText(open?'GATE OPEN':'GATE CLOSED',(f.x+f.x2)/2,f.y+17);}
        }
      }
      [2,4,8,16,8,4,2].forEach((m,i)=>{ctx.fillStyle=i===3?'#eac66f':'#1e3955';ctx.fillRect(i*120+3,1276,114,38);ctx.fillStyle=i===3?'#242029':'#c3dfff';ctx.font='bold 20px monospace';ctx.textAlign='center';ctx.fillText('×'+m,i*120+60,1302);ctx.strokeStyle='#6089af';ctx.beginPath();ctx.moveTo(i*120,1250);ctx.lineTo(i*120,1314);ctx.stroke();});
      for(const c of this.coins){if(this.coinImage?.complete&&this.coinImage.naturalWidth)ctx.drawImage(this.coinImage,c.x-c.r,c.y-c.r,c.r*2,c.r*2);else{ctx.fillStyle='#549de7';ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d4ecff';ctx.font=`bold ${c.r*1.4}px sans-serif`;ctx.textAlign='center';ctx.fillText('C',c.x,c.y+c.r*.5);}}
      for(const p of this.particles){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;if(p.text){ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText(p.text,clamp(p.x,55,785),p.y);}else ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;
      if(!this.coins.length){ctx.fillStyle='#d9ebff99';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText('AIM ABOVE · DROP INTO POSSIBILITY',420,1235);}
      this.$('cd-banner').hidden=!this.paused;this.$('cd-banner').textContent='PAUSED';
    }
    renderStats(){const p=this.p,map=maps[p.map];this.$('cd-dots').textContent=fmt(p.dots);this.$('cd-rubies').textContent=fmt(p.rubies);this.$('cd-scrap').textContent=fmt(p.scrap);this.$('cd-progress-fill').style.width=Math.min(100,p.earned[p.map]/map.goal*100)+'%';this.$('cd-progress-label').textContent=`${fmt(p.earned[p.map])} / ${fmt(map.goal)} dots · ${p.cleared>p.map?'WORLD CLEARED':Math.floor(Math.min(100,p.earned[p.map]/map.goal*100))+'%'}${p.boosts?' · Overdrive: '+p.boosts+' drops':''}`;this.$('cd-prev').disabled=p.map===0;this.$('cd-next').disabled=!(p.cleared>p.map&&p.map<19);}
    render(){if(!this.p)return;this.renderStats();const map=maps[this.p.map];this.root.style.setProperty('--cd-accent',map.color);this.$('cd-map-number').textContent=`WORLD ${String(map.id+1).padStart(2,'0')} / 20`;this.$('cd-map-name').textContent=map.name;this.$('cd-hint').textContent=map.hint;this.$('cd-nano-lineup').replaceChildren(...nanogames.slice(map.id*3,map.id*3+3).map((g,i)=>{const chip=document.createElement('span');chip.textContent=`${i+1} · ${g.title}`;chip.title=g.rules;return chip;}));this.$('cd-pause').textContent=this.paused?'Resume':'Pause';this.$('cd-boosts').textContent=`Overdrive reserves: ${this.p.boosts} drops · ${fmt(this.p.drops)} total launches`;
      if(this.tab==='maps')this.$('cd-maps').replaceChildren(...maps.map(m=>{const b=document.createElement('button');b.disabled=m.id>this.p.cleared;b.style.setProperty('--map-color',m.color);b.innerHTML=`<span>${String(m.id+1).padStart(2,'0')} ${m.id<this.p.cleared?'✓':m.id>this.p.cleared?'· LOCKED':''}</span><strong>${m.name}</strong><small>${fmt(m.goal)} dots · ${m.layout}</small><small class="cd-map-nanos">${nanogames.slice(m.id*3,m.id*3+3).map(g=>g.title).join(" · ")}</small>`;b.onclick=()=>this.go(m.id);return b;}));
      if(this.tab==='tree'){
        this.$('cd-branches').replaceChildren(...branches.map(branch=>{const b=document.createElement('button');b.textContent=`${branch.icon} ${branch.name}`;b.setAttribute('aria-pressed',String(this.branch===branch.id));b.onclick=()=>{this.branch=branch.id;this.render();};return b;}));
        const branch=branches.find(b=>b.id===this.branch);this.$('cd-tree').style.setProperty('--branch-color',branch.color);this.$('cd-tree').replaceChildren(...nodes.filter(n=>n.branch===this.branch).map(n=>{const item=document.createElement('article'),level=this.p.levels[n.id],open=unlocked(this.p,n);item.className='cd-node'+(open?'':' cd-locked');item.innerHTML=`<span class="cd-node-icon">${branch.icon}</span><div><small>TIER ${n.tier+1} · RANK ${level} · ${n.currency==='rubies'?'RUBY':'DOT'} NODE</small><h4>${n.name}</h4><p>${branch.description} This tier gives ${(1+n.tier*.25).toFixed(2)} ranks per purchase.</p><small>${open?'Repeatable upgrade':`Requires ${nodes.find(x=>x.id===n.requires).name} rank 1`}</small></div>`;const b=document.createElement('button');b.textContent=`${level?'Upgrade':'Research'} · ${fmt(cost(this.p,n))} ${n.currency==='rubies'?'◆':'●'}`;b.disabled=!open||this.p[n.currency]<cost(this.p,n);b.onclick=()=>{if(!this.blocked()&&buy(this.p,n.id)){this.save();this.render();this.message(`${n.name} upgraded to rank ${this.p.levels[n.id]}.`);this.tone(740,.12);}};item.append(b);return item;}));
      }
      this.root.querySelectorAll('[data-craft]').forEach(b=>b.disabled=this.p.scrap<({boost:20,ruby:60,dots:12}[b.dataset.craft]));
    }
    frame(t){const dt=this.last?Math.min(.05,(t-this.last)/1000):0;this.last=t;if(this.visible&&this.owner()!==this.identity){this.save();this.load();}if(this.nano)this.tickNano(dt);this.syncNanoMusic();const play=this.playable();if(this.master)this.master.gain.value=play && this.sound() ? .12 : 0;if(play){let remaining=dt;while(remaining>0){const step=Math.min(1/120,remaining);this.update(step);remaining-=step;}}if(this.visible&&this.tab==='board')this.draw();requestAnimationFrame(t=>this.frame(t));}
  }
  return {BOARD,nanogames,featuresFor,segmentFor,gateOpen,hitSegment,maps,branches,nodes,restore,rank,cost,unlocked,buy,award,pegsFor,Controller};
})();
if(typeof module!=='undefined')module.exports=CoinDrop;
