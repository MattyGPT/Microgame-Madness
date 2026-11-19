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
    ['geomayhem','Geomayhem','Prismatic Conqueror','#70f5d2','#d4a5ff','comet','circuit'],
    ['coindrop','Coin Drop','Infinite Treasury','#ffd77c','#ff91be','rune','sun'],
    ['nanolab','Nano Lab','Microverse Luminary','#c6a0ff','#a9f6ff','note','circuit'],
    ['tearesseract','Tearesseract','Unbound Dimension','#86fff0','#d8b6ff','comet','moon'],
    ['treasure','Treasure Trove','Fortune Sovereign','#7ffff0','#ffe39a','rune','wave'],
  ].map(([mode,game,name,color,accent,shape,motif])=>({mode,game,name,color,accent,shape,motif}));
  let owner=null, granted=new Set(), expires=0, generation=0, choices={}, announced=new Set(), serial=0;
  const key=()=>`microgame-madness.crown-loadout:${owner}`;
  const noticeKey=()=>`microgame-madness.crown-celebrations:${owner}`;
  function saveNotices(){try{localStorage.setItem(noticeKey(),JSON.stringify([...announced]));}catch{}}
  function celebrations(){return games.filter(g=>has(g.mode)&&!announced.has(g.mode));}
  function acknowledge(modes){for(const mode of modes)if(has(mode))announced.add(mode);saveNotices();}
  function identity(next) {
    if(next===owner)return false;
    owner=next;granted.clear();expires=0;generation++;
    announced=new Set();
    try{const stored=JSON.parse(localStorage.getItem(noticeKey()));if(Array.isArray(stored))announced=new Set(stored.filter(mode=>games.some(g=>g.mode===mode)));}catch{}
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
    // A confirmed loss allows a new celebration on regaining #1. Network failures do not.
    for(let i=0;i<games.length;i++)if(results[i].status==='fulfilled'&&!granted.has(games[i].mode))announced.delete(games[i].mode);
    saveNotices();
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
      body=`<path d="${bodies[g.mode]||'M38 43L75 31 112 43 119 106 75 124 31 106Z'}" fill="url(#${uid}-body)" stroke="${a}" stroke-width="2"/><path d="M45 53L74 43 103 54 104 101 76 111 45 99Z" fill="none" stroke="${c}"/><path d="M54 70h9v13h-9ZM89 70h9v13h-9Z" fill="${a}"/><path d="M65 92q11 13 22 0" fill="none" stroke="${a}" stroke-width="3"/>`;
      if(g.mode==='dodge')body+=`<g class="crown-orbit"><ellipse cx="75" cy="80" rx="62" ry="19" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="70 20 10 20"/></g>`;
      if(g.mode==='boss')body+=`<path d="M32 64L9 48l9 34-8 20 25-10M117 64l23-16-9 34 8 20-25-10" fill="#471c29" stroke="${c}"/><path class="crown-stream" d="M45 49l20 17-9 19 19-5 13 30" stroke="${a}" fill="none" stroke-width="2"/>`;
      if(g.mode==='pumpkin')body+=`<path d="M68 43q-9-26 15-27l-5 25M51 51q-17 33 0 57M98 51q17 33 0 57" fill="none" stroke="${a}" stroke-width="3"/><g class="crown-orbit"><ellipse cx="75" cy="77" rx="65" ry="46" fill="none" stroke="${c}" stroke-dasharray="2 9" stroke-width="3"/></g>`;
      if(g.mode==='wrath')body+=`<path class="crown-vine" d="M34 114Q6 95 24 57L12 42l17 6Q37 18 64 36M113 115q30-29 10-54l15-18-21 7Q98 19 86 37" fill="none" stroke="${a}" stroke-width="3"/>`;
    }
    if(kind==='cubie'&&['geomayhem','coindrop','nanolab','tearesseract','treasure'].includes(g.mode)) {
      const metal=`url(#${uid}-gold)`,shell=`url(#${uid}-body)`;
      const face=`<g fill="${a}"><rect x="55" y="68" width="9" height="15" rx="1"/><rect x="88" y="68" width="9" height="15" rx="1"/></g><path d="M65 94v6h21v-6" fill="none" stroke="${a}" stroke-width="4"/><g fill="#fff" opacity=".8"><rect x="57" y="70" width="2" height="3"/><rect x="90" y="70" width="2" height="3"/></g>`;
      const jewel=(x,y,r=8)=>`<path d="m${x} ${y-r} ${r*.7} ${r} ${-r*.7} ${r} ${-r*.7} ${-r}Z" fill="${a}" stroke="#fff4d8"/><path d="M${x} ${y-r}v${r*2}" stroke="${c}"/>`;
      const token=(x,y,r=9)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${metal}" stroke="#fff4c8"/><circle cx="${x}" cy="${y}" r="${r*.65}" fill="none" stroke="#9e703e"/><path d="M${x} ${y-r*.4}v${r*.8}" stroke="#fff4c8" stroke-width="2"/>`;
      if(g.mode==='geomayhem')body=`<g class="crown-orbit"><path d="M75 13 132 110H18Z" fill="none" stroke="${a}" stroke-dasharray="15 7"/>${jewel(75,15,7)}${jewel(19,111,7)}${jewel(131,111,7)}</g><path d="M75 36 92 60 134 47 115 82 141 113 99 106 75 135 51 106 9 113 35 82 16 47 58 60Z" fill="${shell}" stroke="${metal}" stroke-width="3"/><path d="M75 43 75 124M24 54 75 82 126 54M19 108 75 82 131 108" fill="none" stroke="${a}" stroke-width="1.4"/><path d="M49 62 101 62 108 88 75 109 42 88Z" fill="#0b2430" stroke="${c}" stroke-width="2"/><g transform="translate(14 19) scale(.81)">${face}</g><g class="reward-shards">${jewel(28,84,9)}${jewel(122,84,9)}</g><path class="crown-stream" d="M56 113 45 137M94 113l11 24" stroke="${c}" stroke-width="4"/>`;
      if(g.mode==='coindrop')body=`<g class="reward-bob">${token(19,54,9)}${token(127,112,11)}${token(22,121,7)}</g><ellipse cx="81" cy="81" rx="49" ry="51" fill="#875120" stroke="${a}" stroke-width="2"/><path d="M115 48h9m-4 11h11m-8 13h8m-8 13h8m-10 13h8m-14 12h8" stroke="#ffdb7e" stroke-width="2"/><circle cx="72" cy="79" r="49" fill="${metal}" stroke="#fff6cf" stroke-width="2"/><circle cx="72" cy="79" r="40" fill="${shell}" stroke="#ffd68b" stroke-width="2"/><circle cx="72" cy="79" r="44" fill="none" stroke="#9b6327" stroke-dasharray="2 5" stroke-width="2"/><g transform="translate(-4 0)">${face}</g><path d="M45 113h54" stroke="#fff0ac" stroke-width="2"/><g class="reward-mint">${token(117,43,9)}</g><path class="crown-stream" d="M14 70v28m124-28v25" stroke="${a}" stroke-width="2" stroke-dasharray="3 7"/>`;
      if(g.mode==='nanolab')body=`<g class="crown-orbit"><ellipse cx="75" cy="87" rx="66" ry="24" transform="rotate(-30 75 87)" fill="none" stroke="${a}" stroke-width="1.5"/>${jewel(18,115,7)}</g><path d="M60 33h30v28c48 15 47 69-15 69S12 76 60 61Z" fill="${shell}" stroke="${a}" stroke-width="2.5"/><path d="M56 34h38v9H56Z" fill="${metal}" stroke="#fff3c8"/><path d="M62 45v20Q26 79 38 109" fill="none" stroke="#efffff" stroke-opacity=".6" stroke-width="3"/><path class="reward-surf" d="M35 97q20-10 40 0t40 0q-5 28-40 28T35 97" fill="${c}" opacity=".5"/><g transform="translate(15 24) scale(.8)">${face}</g><g class="reward-bob" fill="none" stroke="${a}" stroke-width="2"><circle cx="53" cy="112" r="4"/><circle cx="101" cy="103" r="5"/><circle cx="77" cy="55" r="3"/><circle cx="99" cy="33" r="4"/></g><path d="M115 59l13-15m-5-5 10 10" stroke="${metal}" stroke-width="4"/>`;
      if(g.mode==='tearesseract')body=`<g class="reward-shards" fill="none" stroke="${metal}" stroke-width="3"><path d="M38 58 17 42 7 62 16 103 31 110M112 58l21-16 10 20-9 41-15 7"/><path d="M16 55l14 10-8 25m112-35-14 10 8 25" stroke="${a}" stroke-width="1"/></g><g class="crown-dimension" fill="#10172e99" stroke="${c}" stroke-width="2"><path d="M75 32 117 56v49l-42 25-42-25V56Z"/><path d="M33 56l42 25 42-25M75 81v49" fill="none"/><path d="M75 54 98 68v27l-23 14-23-14V68Z" stroke="${a}"/><path d="M52 68l23 14 23-14M75 82v27M75 32v22M117 56 98 68m19 37-19-10M75 130v-21M33 105l19-10M33 56l19 12" fill="none" stroke="${a}" stroke-width="1"/></g><g transform="translate(28 32) scale(.62)">${face}</g><g class="reward-core" style="transform-origin:75px 81px"><path d="M75 70l8 11-8 11-8-11Z" fill="${a}" opacity=".5"/></g><path class="crown-stream" d="M56 124q-9 9-5 18m18-12-2 13m14-13 2 13m11-19q9 9 5 18" fill="none" stroke="${c}" stroke-width="2"/>`;
      if(g.mode==='treasure')body=`<g class="reward-sail" style="transform-origin:75px 110px"><path d="M20 115V43m0 0Q-2 62 20 82Z" fill="${a}" stroke="${metal}" stroke-width="2"/></g><path d="M27 76 37 39Q75 20 113 39l10 37Z" fill="#452c39" stroke="${metal}" stroke-width="3"/><path d="M38 68 44 44q31-13 62 0l7 24Z" fill="#0c2029" stroke="${a}"/><g class="reward-prism" style="transform-origin:75px 60px">${jewel(75,59,19)}${jewel(51,68,11)}${jewel(99,68,11)}</g><path d="M24 77h102l-10 43q-41 14-82 0Z" fill="${shell}" stroke="${metal}" stroke-width="3"/><path d="M39 80l6 42m66-42-6 42" stroke="${metal}" stroke-width="7"/><path d="M28 89h94M32 110h86" stroke="#ce9e5d" stroke-width="1"/><g transform="translate(23 46) scale(.68)">${face}</g><rect x="69" y="77" width="12" height="13" rx="2" fill="${metal}" stroke="#fff4bf"/><path d="M75 81v5" stroke="#624023" stroke-width="2"/><g class="reward-bob">${token(128,109,8)}${token(20,128,7)}</g><path class="reward-surf" d="M15 137q15-9 30-2t30 0 30 0 30-2" fill="none" stroke="${c}" stroke-width="2"/>`;
    }
    if(kind==='turtle') {
      const emblems={
        hangman:'<path d="M54 65q11-6 21 0 11-6 21 0v28q-11-6-21 0-11-6-21 0Z M75 65v28"/>',
        keyboard:'<path d="M58 63h34v30H58Z M65 63v30m9-30v30m9-30v30M58 78h34"/>',
        dodge:'<path d="M49 75q13-15 26 0t26 0M49 88q13-15 26 0t26 0"/>',
        boss:'<path d="m79 58-20 25h15l-3 17 22-27H78Z"/>',
        pumpkin:'<path d="M75 66c-25-14-32 32 0 31 32 1 25-45 0-31Zm0 0q-5-13 6-14M65 72l5 7m15-7-5 7M66 87q9 7 18 0"/>',
        wrath:'<path d="M53 66l5 29h34l5-29-14 12-8-18-8 18Z"/>',
        geomayhem:'<path d="m75 58 22 13v26H53V71Z M53 71l22 13 22-13M75 84v20"/>',
        coindrop:'<circle cx="75" cy="80" r="20"/><path d="M75 65v30m-8-23h16m-16 16h16"/>',
        nanolab:'<path d="M66 59h18m-14 0v16L58 97h34L80 75V59M64 86h22"/>',
        tearesseract:'<path d="m75 56 23 14v27l-23 13-23-13V70Z m-12 20 12-7 12 7v14l-12 7-12-7Z M52 70l23 13 23-13M75 83v27"/>',
        treasure:'<path d="m75 59 23 19-23 26-23-26Z M52 78h46M75 59v45"/>',
      };
      body=`<g class="crown-turtle" stroke="${a}" stroke-width="2"><path d="m67 112 8 20 8-20" fill="${c}"/><g fill="url(#${uid}-body)"><ellipse cx="35" cy="66" rx="12" ry="22" transform="rotate(-38 35 66)"/><ellipse cx="115" cy="66" rx="12" ry="22" transform="rotate(38 115 66)"/><ellipse cx="40" cy="109" rx="11" ry="17" transform="rotate(35 40 109)"/><ellipse cx="110" cy="109" rx="11" ry="17" transform="rotate(-35 110 109)"/></g><ellipse cx="75" cy="39" rx="17" ry="20" fill="${c}"/><ellipse cx="75" cy="83" rx="39" ry="38" fill="url(#${uid}-body)"/><ellipse cx="75" cy="83" rx="33" ry="32" fill="none"/><g fill="none" stroke="${a}" stroke-width="2.5" stroke-linejoin="round">${emblems[g.mode]}</g><g fill="#091526" stroke="none"><circle cx="68" cy="38" r="3"/><circle cx="82" cy="38" r="3"/></g><path d="M70 47q5 5 10 0" fill="none" stroke="#153b3d"/></g>`;
    }
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
  return {games,identity,has,equip,equipped,refresh,art,install,celebrations,acknowledge};
})();
if(typeof module!=='undefined')module.exports=CrownPacks;
