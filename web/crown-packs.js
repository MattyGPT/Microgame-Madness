'use strict';
// Temporary cosmetics: never purchase or write these into permanent ownership.
const CrownPacks = (() => {
  const games = [
    ['hangman','Hangman','Lexicon Sovereign','#ffd77c','#fff4c9','rune','sun'],
    ['keyboard','Keyboard','Chromatic Keymaster','#ff5bc9','#70f4ff','note','circuit'],
    ['dodge','Turtle Dodge','Eventide Navigator','#58ffd5','#a5caff','comet','wave'],
    ['boss','Boss Crush','Obsidian Overlord','#ff7255','#ffe4a1','bolt','flame'],
    ['pumpkin','Pumpkin King','Harvest Eclipse','#ffb449','#d795ff','flame','moon'],
    ['wrath','Wrath of the Pumpkin King','Thorncourt Regent','#db82ff','#aaffcf','crown','flower'],
  ].map(([mode,game,name,color,accent,shape,motif])=>({mode,game,name,color,accent,shape,motif}));
  let owner=null, granted=new Set(), expires=0, generation=0, choices={}, serial=0;
  const key=()=>`microgame-madness.crown-loadout:${owner}`;
  function identity(next) {
    if(next===owner)return false;
    owner=next;granted.clear();expires=0;generation++;
    try { choices=JSON.parse(localStorage.getItem(key()))||{}; } catch { choices={}; }
    return true;
  }
  function has(mode) { return !!owner && Date.now()<expires && granted.has(mode); }
  function equip(slot,id) {
    if(id && !has(games.find(g=>id===`crown_${g.mode}_${slot}`)?.mode))return false;
    choices[slot]=id;
    try {localStorage.setItem(key(),JSON.stringify(choices));}catch{}
    return true;
  }
  function equipped(slot,fallback) {
    const id=choices[slot],game=games.find(g=>id===`crown_${g.mode}_${slot}`);
    return game&&has(game.mode)?id:fallback;
  }
  async function refresh(client,identityKey) {
    identity(identityKey);const ticket=++generation;
    if(!owner||!client.configured){granted.clear();expires=0;return;}
    const results=await Promise.allSettled(games.map(g=>client.listGame(g.mode,{offset:0,season:null})));
    if(ticket!==generation)return;
    granted=new Set(games.filter((g,i)=>results[i].status==='fulfilled' && results[i].value.some(r=>Number(r.rank)===1&&r.is_you===true)).map(g=>g.mode));
    expires=Date.now()+45000;
  }
  function art(item,kind='cubie') {
    const g=games.find(g=>g.mode===item.crown),uid=`crown-art-${++serial}`,c=g.color,a=g.accent;
    const orbit=Array.from({length:12},(_,i)=>`<g transform="rotate(${i*30} 75 75)"><path d="M75 5l2 5-2 5-2-5Z" fill="${i%2?a:c}"/><path d="M75 17v4" stroke="${a}"/></g>`).join('');
    const sparks=Array.from({length:14},(_,i)=>`<circle class="crown-spark" style="--delay:${-i*.37}s" cx="${13+(i*47)%124}" cy="${20+(i*29)%114}" r="${i%3===0?1.8:.8}" fill="${a}"/>`).join('');
    const crown='<path d="M57 34l-5-16 14 7 9-17 9 17 14-7-5 16Z" fill="url(#'+uid+'-gold)" stroke="#fff3cb"/><path d="M61 30h28" stroke="#68431f"/>';
    let body='';
    if(kind==='trail') {
      body=`<g fill="none" stroke-linecap="round">${[0,1,2].map((n)=>`<path class="crown-stream" style="--delay:${-n}s" d="M8 ${96+n*9}C40 ${12+n*15} 82 ${152-n*8} 139 ${47+n*10}" stroke="${n===1?a:c}" stroke-width="${4-n}"/>`).join('')}</g>${Array.from({length:8},(_,i)=>`<g transform="translate(${23+i*15} ${87+Math.sin(i)*23}) scale(.2)"><path d="M0-15L10 0 0 15-10 0Z" fill="${a}"/><circle r="20" fill="none" stroke="${c}" stroke-width="2"/></g>`).join('')}`;
    } else if(g.mode==='hangman') {
      body=`<g class="crown-pendulum"><path d="M30 118V30h78v22" fill="none" stroke="#795124" stroke-width="9"/><path d="M30 118V30h78v22M30 57l27-27" fill="none" stroke="${c}" stroke-width="3"/><circle cx="108" cy="65" r="13" fill="none" stroke="${a}" stroke-width="3"/></g><path d="M40 49Q73 38 108 49v66Q74 104 40 116Z" fill="url(#${uid}-gold)" stroke="${a}" stroke-width="2"/><path d="M48 55v52M98 54v49M53 60h37M53 65h31M53 98h35" stroke="#8c582c" stroke-width="1.5"/><text x="74" y="87" text-anchor="middle" font-family="serif" font-size="24" fill="#52331c">Aa</text>${[0,1,2].map(i=>`<g class="crown-gear" style="transform-origin:${24+i*47}px 119px"><circle cx="${24+i*47}" cy="119" r="10" fill="#6d4824" stroke="${c}" stroke-width="3" stroke-dasharray="4 3"/><circle cx="${24+i*47}" cy="119" r="4" fill="${a}"/></g>`).join('')}`;
    } else if(g.mode==='keyboard') {
      body=`<rect x="33" y="39" width="87" height="87" rx="8" fill="#26183f" stroke="${a}" stroke-width="2"/><path d="M34 123l-8-9V32h85l9 7" fill="#623b88" stroke="${c}"/>`+Array.from({length:16},(_,i)=>{const colors=['#ff62cb','#64eaff','#ac70ff','#ed39dd'];return `<g class="crown-key" style="--delay:${-i*.19}s" transform="translate(${39+i%4*19} ${45+Math.floor(i/4)*19})"><rect width="16" height="16" rx="3" fill="${colors[i%4]}" stroke="#ffffff99"/><text x="8" y="11" text-anchor="middle" font-size="${i>11?4:8}" font-family="monospace" fill="#201035">${['Q','W','E','R','A','S','D','F','Z','X','C','V','SHIFT','CTRL','SPACE','ENTER'][i]}</text></g>`;}).join('');
    } else {
      const bodies={dodge:'M37 55L62 37 108 47 119 93 91 119 43 108Z',boss:'M36 44L58 35 104 42 120 64 111 112 77 123 36 106Z',pumpkin:'M75 42C20 25 20 122 53 118Q75 132 96 118C130 120 131 28 75 42Z',wrath:'M42 42L72 32 110 45 116 106 78 120 35 107Z'};
      body=`<path d="${bodies[g.mode]}" fill="url(#${uid}-body)" stroke="${a}" stroke-width="2"/><path d="M45 53L74 43 103 54 104 101 76 111 45 99Z" fill="none" stroke="${c}"/><path d="M54 70h9v13h-9ZM89 70h9v13h-9Z" fill="${a}"/><path d="M65 92q11 13 22 0" fill="none" stroke="${a}" stroke-width="3"/>`;
      if(g.mode==='dodge')body+=`<g class="crown-orbit"><ellipse cx="75" cy="80" rx="62" ry="19" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="70 20 10 20"/></g>`;
      if(g.mode==='boss')body+=`<path d="M32 64L9 48l9 34-8 20 25-10M117 64l23-16-9 34 8 20-25-10" fill="#471c29" stroke="${c}"/><path class="crown-stream" d="M45 49l20 17-9 19 19-5 13 30" stroke="${a}" fill="none" stroke-width="2"/>`;
      if(g.mode==='pumpkin')body+=`<path d="M68 43q-9-26 15-27l-5 25M51 51q-17 33 0 57M98 51q17 33 0 57" fill="none" stroke="${a}" stroke-width="3"/><g class="crown-orbit"><ellipse cx="75" cy="77" rx="65" ry="46" fill="none" stroke="${c}" stroke-dasharray="2 9" stroke-width="3"/></g>`;
      if(g.mode==='wrath')body+=`<path class="crown-vine" d="M34 114Q6 95 24 57L12 42l17 6Q37 18 64 36M113 115q30-29 10-54l15-18-21 7Q98 19 86 37" fill="none" stroke="${a}" stroke-width="3"/>`;
    }
    if(kind==='turtle')body=`<path d="M40 52L15 36l7 30 17 8M110 52l25-16-7 30-17 8M42 103l-25 18 25-2M108 103l25 18-25-2" fill="url(#${uid}-body)" stroke="${a}"/><ellipse cx="75" cy="31" rx="13" ry="16" fill="${c}"/><circle cx="70" cy="25" r="2"/><circle cx="80" cy="25" r="2"/>${body}`;
    return `<svg class="crown-art${kind==='cubie'?' cubie-custom-art':''}" data-custom="${item.id}" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="${uid}-gold" x2="1" y2="1"><stop stop-color="#fff8ce"/><stop offset=".25" stop-color="#c99235"/><stop offset=".52" stop-color="#ffed9c"/><stop offset="1" stop-color="#9c5723"/></linearGradient><linearGradient id="${uid}-body" x2="1" y2="1"><stop stop-color="${c}"/><stop offset=".4" stop-color="#26213f"/><stop offset="1" stop-color="#080e20"/></linearGradient><radialGradient id="${uid}-halo"><stop stop-color="${c}" stop-opacity=".28"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs><circle cx="75" cy="75" r="74" fill="url(#${uid}-halo)"/><g class="crown-orbit">${orbit}</g><g class="crown-body">${body}${kind==='trail'?'':crown}</g>${sparks}</svg>`;
  }
  function install(cubies,turtles,trails) {
    cubies.tierLabels.exclusive='Exclusive';
    for(const g of games) {
      const base={crown:g.mode,tier:'exclusive',color:g.color,accent:g.accent,price:0,achievements:[],flavor:`Hold #1 in ${g.game}'s all-time combined leaderboard. This pack leaves when your crown does.`};
      cubies.catalog.push({...base,id:`crown_${g.mode}_cubie`,name:`${g.name} Cubie`});
      turtles.catalog.push({...base,id:`crown_${g.mode}_turtle`,name:`${g.name} Turtle`,level:6,motif:g.motif,variant:0});
      trails.catalog.push({...base,id:`crown_${g.mode}_trail`,name:`${g.name} Wake`,colors:[g.color,g.accent,'#ffffff'],shape:g.shape,size:5,lifetime:.5});
    }
    const unlocked=cubies.unlocked,svg=cubies.svg,gameSvg=cubies.gameSvg;
    cubies.unlocked=(item,...args)=>item.crown?has(item.crown):unlocked(item,...args);
    cubies.selected=(id,...args)=>{const item=cubies.catalog.find(i=>i.id===id);return item&&cubies.unlocked(item,...args)?item:cubies.catalog[0];};
    cubies.svg=item=>item.crown?art(item):svg(item);
    cubies.gameSvg=item=>item.crown?art(item):gameSvg(item);
    for(const [api,kind] of [[turtles,'turtle'],[trails,'trail']]) {
      const selected=api.selected,preview=api.preview;
      api.selected=(id,...args)=>{const item=api.catalog.find(i=>i.id===id);return item?.crown?(has(item.crown)?item:null):selected(id,...args);};
      api.preview=item=>item.crown?art(item,kind):preview(item);
    }
  }
  return {games,identity,has,equip,equipped,refresh,art,install};
})();
if(typeof module!=='undefined')module.exports=CrownPacks;
