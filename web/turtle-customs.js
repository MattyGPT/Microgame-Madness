"use strict";
const TurtleCustoms = (() => {
  const tiers = ['bronze','silver','gold','crystal','diamond','rainbow','empyrorite'];
  const titles = ['Garden','Polished','Royal','Prismatic','Radiant','Astral','Sovereign'];
  const prices = [150,300,550,850,1200,1800,2800];
  const themes = [
    ['Fern','#45965b','#bcff90','leaf'], ['Lagoon','#237fa0','#8cfff0','wave'],
    ['Ember','#b64f32','#ffcf70','flame'], ['Lunar','#6c63a3','#e8ddff','moon'],
    ['Rose','#ad4779','#ffbfdc','flower'], ['Glacier','#429ab1','#e2ffff','crystal'],
    ['Circuit','#426b86','#80ffe2','circuit'], ['Solar','#b98628','#fff09b','sun'],
  ];
  const qualities = ['Matte shell · engraved emblem','Brushed silver shell · inset panels · soft shine','Polished gold trim · engraved armor · moving shine','Luminous facets · layered aura · glowing gems','Crystal clusters · jeweled shell · orbiting sparks','Rainbow armor · spectral crystals · aurora rings','Aurora mantle · jeweled wings · royal filigree · comet halo'];
  const catalog = tiers.flatMap((tier, level) => themes.map(([theme,color,accent,motif], variant) => ({
    id:`turtle_${tier}_${theme.toLowerCase()}`, name:`${titles[level]} ${theme}`, tier, level, variant,
    color, accent, motif, price:prices[level]+variant*[15,25,30,40,60,90,150][level],
    flavor: qualities[level],
  })));
  catalog.push({id:'turtle_empyrorite_terrastrial_angel', name:'Terrastrial Angel',
    tier:'empyrorite', level:6, variant:8, angel:true, color:'#f9fcff', accent:'#ffffff',
    motif:'sun', price:5000,
    flavor:'Eight elemental crystal guardians crown a pearl-white seraph. Six articulated pearl wings, engraved opal armor, faceted guardian crystals, aurora ribbons, and a luminous star heart.',
  });
  const motifs = {
    leaf:'M0 8Q-12 -3 7 -10Q13 4 0 8M0 7L5 -6',
    wave:'M-9 -5Q-4 -11 0 -5T9 -5M-9 2Q-4 -4 0 2T9 2M-7 8Q0 2 7 8',
    flame:'M0 10C-14 5 -6 -4 -2 -8L0 -1Q6 -6 4 -12C17 2 8 11 0 10Z',
    moon:'M5 -10A11 11 0 1 0 5 10A10 10 0 0 1 5 -10Z',
    flower:'M0 -3C-13 -18 -15 4 -4 2C-17 12 3 19 2 5C17 14 16 -6 4 -2C12 -17 -4 -18 0 -3Z',
    crystal:'M0 -12L9 -3L5 9L0 12L-8 3L-9 -5ZM0 -12V12M-9 -5L9 -3L-8 3L5 9',
    circuit:'M-9 -9H0V0H9V9M-9 9V0H0V-9H9M-6 -6H-3M3 6H6',
    sun:'M0 -7A7 7 0 1 0 0 7A7 7 0 1 0 0 -7M0 -14V-10M0 10V14M-14 0H-10M10 0H14M-10 -10L-7 -7M7 7L10 10M10 -10L7 -7M-7 7L-10 10',
  };
  // Empyrorite uses its own silhouette and materials in both the shop and game.
  function sovereignShapes(item, time) {
    const {color,accent,motif}=item, parts=[];
    const add=(d,fill,stroke='none',width=1,motion='')=>parts.push({d,fill,stroke,width,motion});
    const wings={
      leaf:'M20 -15Q29 -44 48 -37Q46 -19 26 -5M24 0Q45 -18 48 -4Q44 12 25 14M25 15Q43 9 39 29Q28 31 19 23',
      wave:'M20 -17C40 -49 58 -23 40 -17Q49 -31 37 -29Q28 -27 26 -9M25 0Q53 -12 46 10Q42 0 35 7L24 17M23 20Q43 15 38 33L17 27',
      flame:'M20 -18Q35 -20 37 -45Q52 -27 42 -15L51 -24Q53 0 30 11L45 4Q44 27 20 29L23 8Z',
      moon:'M20 -17Q48 -44 49 -15Q40 -32 29 -11M25 -2Q54 -13 46 18Q43 3 27 13M23 18Q42 17 35 35Q34 25 17 28',
      flower:'M20 -17C19 -45 42 -43 36 -19C54 -42 61 -12 29 -5C58 -12 51 18 26 12C49 20 32 42 18 25Z',
      crystal:'M20 -17L32 -45L36 -24L48 -34L42 -5L53 -9L36 18L40 30L19 27Z',
      circuit:'M20 -17H28V-32H43V-19H36V-6H48V8H35V20H40V30H22V17H28V3H21ZM32 -28H39V-23H32ZM39 -2H44V3H39Z',
      sun:'M20 -19L28 -45L32 -23L48 -35L39 -12L53 -10L37 4L48 16L32 16L36 35L18 25Z',
    };
    // Broken concentric rings frame the wings without obscuring the player.
    for(let ring=0;ring<2;ring++) for(let n=0;n<6;n++) {
      const r=49+ring*5,a=n*Math.PI/3+time*(ring?-.16:.22),b=a+.72;
      add(`M${Math.cos(a)*r} ${Math.sin(a)*r}A${r} ${r} 0 0 1 ${Math.cos(b)*r} ${Math.sin(b)*r}`,
        'none',ring?'#e3c7ff':accent,ring?.6:1.2,ring?'reverse':'orbit');
    }
    // Fine radial engraving and a translucent aurora mantle behind the wings.
    add('M0 -48Q52 -40 48 8Q35 47 0 48Q-35 47 -48 8Q-52 -40 0 -48Z',`${accent}12`,'none',1,'aura');
    for(let n=0;n<16;n++) {
      const a=n*Math.PI/8,r=n%2?51:48,R=55;
      add(`M${Math.cos(a)*r} ${Math.sin(a)*r}L${Math.cos(a)*R} ${Math.sin(a)*R}`,'none',n%2?accent:'#fff1bf',.65,'glint');
    }
    // Mirrored elemental wings: each of the eight themes has a unique outline.
    for(const side of [1,-1]) {
      parts.push({d:wings[motif],fill:'@wing',stroke:accent,width:.8,motion:'wing',mirror:side});
      for(let n=0;n<3;n++) {
        const x=31+n%2*7,y=-21+n*20;
        parts.push({d:`M${x} ${y-7}l4 7-4 7-4-7Z`,fill:'@gem',stroke:'#fff4cf',width:.8,motion:'gem',mirror:side});
        parts.push({d:`M${x} ${y-7}v14l-4-7Z`,fill:'#ffffff55',stroke:'none',width:0,mirror:side});
      }
      parts.push({d:'M24 -14Q33 -19 39 -30M26 3L39 -2M23 20L32 25',fill:'none',stroke:'#ffffff90',width:.7,mirror:side});
    }
    add('M-8 -28Q-12 -47 0 -48Q12 -47 8 -28Z','@shell',accent,1);
    add('M-17 17L-27 30L-15 27M17 17L27 30L15 27M-5 26L0 39L5 26','@gold','#fff0bd',1);
    add('M0 -32C33 -32 33 34 0 33C-33 34 -33 -32 0 -32Z','@gold','#fff1c9',1);
    add('M0 -29C28 -29 29 30 0 30C-29 30 -28 -29 0 -29Z','@shell',accent,.8);
    // Inlaid shell panels, fine gold filigree, and a floating central gemstone.
    add('M0 -27L16 -17L21 3L13 22L0 28L-13 22L-21 3L-16 -17ZM0 -27V-17M16 -17L10 -10M21 3L13 3M13 22L8 14M0 28V19M-13 22L-8 14M-21 3H-13M-16 -17L-10 -10','none','#ffe7a8',.9);
    add('M-18 -14Q-8 -22 -9 -9M18 -14Q8 -22 9 -9M-18 12Q-8 22 -9 9M18 12Q8 22 9 9M-7 -23Q0 -16 7 -23M-7 24Q0 17 7 24','none','#fff0bd',.8);
    add('M0 -21L16 0L0 22L-16 0Z','@gem','#fff4d6',1.1,'gem');
    add('M0 -21L0 0L-16 0ZM0 0L16 0L0 22Z','#ffffff30');
    add(motifs[motif],'#ecfff4',accent,.6);
    add('M-18 -5Q-21 -23 -5 -26L-11 -18Z','#ffffff90','none',1,'glint');
    for(let n=0;n<8;n++) {
      const a=n*Math.PI/4, x=Math.cos(a)*21,y=Math.sin(a)*26;
      add(`M${x} ${y-2}l2 2-2 2-2-2Z`,'#fff2c6',accent,.5,'gem');
    }
    add('M-13 -32L-16 -45L-7 -40L0 -52L7 -40L16 -45L13 -32Z','@gold','#fff8df',1);
    add('M0 -47L4 -41L0 -35L-4 -41Z','@gem','#ffffff',.7,'gem');
    add('M-13 -37L-10 -40L-7 -37L-10 -34ZM7 -37L10 -40L13 -37L10 -34Z','@gem','#fff7de',.6,'gem');
    add('M-11 -34H11','none','#fff9e2',1.5,'glint');
    add('M-5 -30h2v3h-2ZM3 -30h2v3H3Z','#0d1d28');
    for(let n=0;n<4;n++) {
      const a=n*Math.PI/2+time*.35,r=53,b=a-.24;
      add(`M${Math.cos(b)*r} ${Math.sin(b)*r}Q${Math.cos(a-.12)*57} ${Math.sin(a-.12)*57} ${Math.cos(a)*r} ${Math.sin(a)*r}`,'none',accent,1.2,'orbit');
    }
    for(let n=0;n<8;n++) {
      const a=n*Math.PI/4+time*.35,r=46+(n%2)*7,x=Math.cos(a)*r,y=Math.sin(a)*r;
      add(`M${x} ${y-2.8}l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z`,n%2?'#fff0bf':accent,'none',1,'orbit');
    }
    return parts;
  }
  // Positive angles move clockwise in canvas/SVG screen coordinates (Y points down).
  const angelOrbitSpeed=Math.PI*2/25.132741;
  const spectrum=['#ff8cac','#ffbb79','#fff29a','#a5ffc2','#88f4ff','#9bbdff','#c2a0ff','#f5abff'];
  function angelShapes(item,time) {
    const parts=[];
    const add=(d,fill,stroke='none',width=1,motion='',transform=null)=>parts.push({d,fill,stroke,width,motion,transform});
    // Five distinct layers: aurora rings, feather wings, opal armor, elemental crystals, stardust.
    for(let ring=0;ring<3;ring++) for(let n=0;n<8;n++) {
      const r=53+ring*10,a=n*Math.PI/4+time*(ring%2?-.18:.22),b=a+.58;
      add(`M${Math.cos(a)*r} ${Math.sin(a)*r}A${r} ${r} 0 0 1 ${Math.cos(b)*r} ${Math.sin(b)*r}`,'none',spectrum[(n+ring)%8],ring===1?1.2:.5,ring%2?'reverse':'orbit');
    }
    // A six-wing silhouette with long aurora ribbons behind the pearl feathers.
    for(const side of [-1,1]) {
      for(let layer=0;layer<3;layer++) {
        const y=-27+layer*24;
        add(`M18 ${y}Q49 ${y-22} 55 ${y-34}Q57 ${y-4} 30 ${y+15}Z`,'@pearl',spectrum[layer*2],.8,'wing',{x:0,y:0,sx:side,sy:1});
      }
      add('M12 23C55 39 13 51 37 70C4 59 34 42 6 33Z','@rainbow','#ffffff80',.5,'shimmer',{x:0,y:0,sx:side,sy:1});
      add('M15 29Q40 44 22 58','none','#fff7dd',.8,'glint',{x:0,y:0,sx:side,sy:1});
    }
    for(const side of [-1,1]) for(let feather=0;feather<6;feather++) {
      const x=22+feather*4,y=-36+feather*10;
      add(`M18 ${-13+feather*5}Q${x} ${y-8} ${x+12} ${y-16}Q${x+15} ${y+5} 22 ${10+feather*3}Z`,
        '@pearl',spectrum[feather],.65,'wing',{x:0,y:0,sx:side,sy:1});
      const wingTransform={x:0,y:0,sx:side,sy:1};
      // Recessed feather vanes and a bright raised shaft give each plume depth.
      add(`M20 ${-11+feather*5}Q${x+5} ${y+2} ${x+12} ${y-16}`,'none','#8d9fc980',1.5,'wing',wingTransform);
      add(`M21 ${-12+feather*5}Q${x+6} ${y+1} ${x+12} ${y-16}`,'none','#ffffff',.65,'wing',wingTransform);
      for(let barb=0;barb<3;barb++) {
        const q=barb/3,bx=23+(x-18)*q,by=(-10+feather*5)*(1-q)+(y-5)*q;
        add(`M${bx-2} ${by+4}Q${bx+2} ${by+2} ${bx+5} ${by-2}`,'none',spectrum[(feather+2)%8]+'88',.45,'wing',wingTransform);
      }
    }
    add('M-8 -28Q-13 -47 0 -49Q13 -47 8 -28Z','@pearl','#d1eaff',1);
    add('M-18 18L-29 32L-13 27M18 18L29 32L13 27M-5 25L0 40L5 25','@pearl','#ffffff',1);
    add('M0 -32C34 -32 34 34 0 34C-34 34 -34 -32 0 -32Z','@rainbow','#ffffff',1.5,'shimmer');
    add('M0 -29C29 -29 29 31 0 31C-29 31 -29 -29 0 -29Z','@pearl','#ffffff',1);
    for(let n=0;n<8;n++) {
      const a=n*Math.PI/4,x=Math.cos(a)*22,y=Math.sin(a)*27;
      add(`M0 0L${x} ${y}L${Math.cos(a+.7)*22} ${Math.sin(a+.7)*27}Z`,n%2?'#e3c9ff35':'#a8f5ff40',spectrum[n],.45);
      add(`M${x} ${y-2.7}l2 2.7-2 2.7-2-2.7Z`,spectrum[n],'#ffffff',.5,'gem');
    }
    // Pearl-inlaid scrollwork surrounds the central cut gemstone.
    for(const side of [-1,1]) {
      const engraving={x:0,y:0,sx:side,sy:1};
      add('M5 -25Q19 -25 19 -13Q19 -6 14 -9Q10 -13 16 -15M17 9Q22 19 11 24Q6 25 8 20Q11 16 14 20','none','#9b91bd',1.1,'',engraving);
      add('M5 -26Q18 -26 18 -14Q18 -7 14 -10M17 10Q21 18 11 23','none','#fff6da',.6,'',engraving);
      add('M22 -7Q27 0 22 8','none','#ffffff',1,'glint',engraving);
    }
    add('M0 -23L15 -3L10 15L0 23L-10 15L-15 -3Z','@rainbow','#ffffff',1,'shimmer');
    add('M0 -23L0 23L-15 -3Z','#ffffff75');
    add('M0 -23L15 -3L10 15L0 23L5 4Z','#5862aa55');
    add('M0 -23L5 -5L15 -3L3 2L0 23L-4 3L-15 -3L-4 -6Z','none','#ffffffbb',.55);
    add('M-12 -3L0 -20L3 -6Z','#ffffff55','none',1,'glint');
    add('M0 -18L6 -6L18 0L6 6L0 18L-6 6L-18 0L-6 -6Z','none','#ffffff',.7,'glint');
    add('M0 -12L3 -3L11 0L3 3L0 13L-3 3L-11 0L-3 -3Z','#ffffff','none',1,'gem');
    add('M-16 -16Q-19 -25 -4 -27L-10 -19Z','#ffffff','none',1,'glint');
    add('M0 -57L4 -52L0 -47L-4 -52Z','@rainbow','#ffffff',.8,'gem');
    add('M-16 -51Q0 -63 16 -51M-12 -54Q0 -60 12 -54','none','#fff2bc',.9,'glint');
    add('M-13 -37Q0 -43 13 -37Q0 -31 -13 -37ZM-16 -39Q0 -48 16 -39','none','#fffbdc',1.7,'glint');
    add('M-5 -43h2v3h-2ZM3 -43h2v3H3Z','#6787b0');
    // Every guardian crystal carries a different turtle element emblem.
    themes.forEach((theme,n)=>{
      const a=n*Math.PI/4+time*angelOrbitSpeed,r=66,transform={x:Math.cos(a)*r,y:Math.sin(a)*r,rotation:a+Math.PI/2};
      add('M0 15Q-16 19 -20 37Q-7 25 3 19Z',`${spectrum[n]}55`,'none',1,'angel-orbit',transform);
      add('M0 16Q-12 22 -16 31','none',spectrum[n],.8,'angel-orbit',transform);
      add('M0 -15L9 -5L7 9L0 16L-7 9L-9 -5Z',`@element${n}`,'#ffffff',.8,'angel-orbit',transform);
      add('M0 -15L9 -5L7 9L0 16L3 3Z','#18224f66','none',1,'angel-orbit',transform);
      add('M0 -15L-9 -5L-7 9L-3 3Z','#ffffff88','none',1,'angel-orbit',transform);
      add('M0 -15V16L-9 -5ZM0 -15L9 -5H-9','none','#ffffffaa',.7,'angel-orbit',transform);
      add('M-6 -5L0 -12L6 -5L4 7L0 12L-4 7Z','none','#ffffff88',.4,'angel-orbit',transform);
      add('M-6 -8L-3 -8M-4.5 -9.5V-6.5','none','#ffffff',.8,'angel-orbit',transform);
      add(motifs[theme[3]],'#ffffff','#344875',.7,'angel-orbit',{...transform,sx:.43,sy:.43});
    });
    for(let n=0;n<32;n++) {
      const a=n*2.399+time*(n%2?.13:-.16),r=37+(n%5)*9,x=Math.cos(a)*r,y=Math.sin(a)*r;
      const size=1+(.5+.5*Math.sin(time*2+n))*1.3;
      add(`M${x} ${y-size}l.5 ${size-.5} ${size-.5} .5-${size-.5} .5-.5 ${size-.5}-.5-${size-.5}-${size-.5}-.5 ${size-.5}-.5Z`,n%3?spectrum[n%8]:'#ffffff','none',1,'sparkle');
    }
    for(const part of parts) if(part.motion==='wing' && part.transform) {
      part.transform={...part.transform,rotation:part.transform.sx*Math.sin(time*1.25)*.035};
    }
    return parts;
  }
  function rainbowTint(base, color, amount) {
    const channel=(hex,i)=>parseInt(hex.slice(i,i+2),16);
    return '#'+[1,3,5].map(i=>Math.round(channel(base,i)*(1-amount)+channel(color,i)*amount).toString(16).padStart(2,'0')).join('');
  }
  const materials = item => ({
    shell:item.level===5?spectrum:item.level===6
      ?[item.accent,...spectrum.map(c=>rainbowTint(item.color,c,.42)),item.color]
      :[item.accent,item.color,'#101c38'],
    silver:['#f1f7ff','#91a7ba','#dbe8f2','#526b82'],
    spectrum,
    gold:['#fff9dc','#e6bd66','#80532d'],
    gem:item.level===5?spectrum:['#ffffff',item.accent,'#6179cd'],
    wing:item.level===6
      ?[item.accent,...spectrum.map(c=>rainbowTint(item.color,c,.52)),item.color]
      :[item.accent,item.color,'#192242'],
    ...(item.angel ? {pearl:['#ffffff',...spectrum.map(c=>rainbowTint('#ffffff',c,.2)),'#e4e6ff'],rainbow:spectrum,
      ...Object.fromEntries(themes.map((theme,n)=>[`element${n}`,['#ffffff',spectrum[n],theme[1]]]))} : {}),
  });
  function shapes(item, time = 0) {
    if(item.angel) return angelShapes(item,time);
    if(item.level===6) return sovereignShapes(item,time);
    const {level:l,color,accent} = item, parts=[];
    const add=(d,fill,stroke='none',width=1,motion='')=>parts.push({d,fill,stroke,width,motion});
    if(l>=5) for(let ring=0;ring<l-4;ring++) {
      const r=43+ring*5;
      add(`M0 ${-r}A${r} ${r} 0 1 0 0 ${r}A${r} ${r} 0 1 0 0 ${-r}`, 'none', ring?'#e5c3ff':accent,.7);
    }
    if(l===5) {
      const ribbons=Array.from({length:8},(_,n)=>{
        const a=n*Math.PI/4,b=a+.55,r=49,R=52;
        return `M${Math.cos(a)*r} ${Math.sin(a)*r}A${r} ${r} 0 0 1 ${Math.cos(b)*r} ${Math.sin(b)*r}L${Math.cos(b)*R} ${Math.sin(b)*R}A${R} ${R} 0 0 0 ${Math.cos(a)*R} ${Math.sin(a)*R}Z`;
      }).join('');
      add(ribbons,'@spectrum','none',1,'spectrum');
      add('M0 -33L5 -43L0 -52L-5 -43Z','@spectrum','#ffffff',.7,'gem');
    }
    if(l>=3) {
      add('M0 -35C40 -35 40 40 0 40C-40 40 -40 -35 0 -35Z',`${accent}14`,'none',1,'aura');
      add('M0 -32C35 -32 35 35 0 35C-35 35 -35 -32 0 -32Z',`${accent}22`,accent,.6,'aura');
    }
    if(l>=4) for(const side of [-1,1]) for(let n=0;n<3;n++) {
      const x=side*(26+n%2*3),y=-19+n*18,tip=x+side*(13+n%2*4);
      add(`M${x} ${y+9}L${tip} ${y-13}L${tip+side*3} ${y+1}L${x+side*7} ${y+13}Z`,'@gem',accent,1,'gem');
      add(`M${x} ${y+9}L${tip} ${y-13}L${x+side*5} ${y+4}Z`,'#ffffff70','#ffffff',.45);
    }
    add('M-17 -20Q-38 -35 -30 -11L-19 -5M17 -20Q38 -35 30 -11L19 -5M-17 15Q-36 25 -27 29L-12 22M17 15Q36 25 27 29L12 22M-5 27L0 36L5 27',color,accent,1.5);
    add('M-9 -26Q-13 -46 0 -47Q13 -46 9 -26Z',color,accent,1.5);
    add('M-24 0C-24 -42 24 -42 24 0C24 40 -24 40 -24 0Z',l===1?'@silver':l>=2?'@shell':color,l>=2?'#ffe4a3':'#142638',2);
    if(l===1) {
      add('M0 -28C27 -28 27 28 0 29C-27 28 -27 -28 0 -28Z','none','#e5f2ff',1);
      add('M-18 -5Q-18 -24 -3 -27L-11 -15Z','#ffffff70','none',1,'silver-shine');
    }
    if(l>=2) {
      add('M0 -28C27 -28 27 28 0 29C-27 28 -27 -28 0 -28Z','none','#fff0b4',1.3);
      add('M-17 -18L-11 -22M11 -22L17 -18M-20 -3L-18 8M20 -3L18 8M-12 22L-5 25M12 22L5 25','none','#e6bd66',2);
      add('M-10 -29L-12 -36L-5 -33L0 -39L5 -33L12 -36L10 -29Z','@gold','#fff4cb',.8);
    }
    if(l>=1) add('M-12 -16L0 -24L12 -16L17 0L10 19L-10 19L-17 0ZM-12 -16L-20 -23M12 -16L20 -23M17 0H24M-17 0H-24M10 19L17 24M-10 19L-17 24','none',accent,1);
    if(l>=3) add('M0 -24L17 0L0 12L-17 0ZM0 12L10 19L-10 19Z','#ffffff20',accent,.6);
    if(l>=2) add('M-18 -6Q-19 -27 -3 -28Q-13 -20 -13 -5Z',`rgba(255,255,255,${.3+Math.sin(time*2)*.15})`,'none',1,'glint');
    add(motifs[item.motif],l===2?'@gold':l>=2?accent:'none',l===2?'#fff4cb':accent,1.3);
    if(l>=3) for(let n=0,count=l>=4?8:l;n<count;n++) {
      const a=n*Math.PI*2/count, x=Math.cos(a)*20,y=Math.sin(a)*25;
      add(`M${x} ${y-3}l3 3-3 3-3-3Z`,accent,'#ffffff',.5,'gem');
    }
    if(l>=4) for(let n=0;n<(l-3)*4;n++) {
      const a=time*(.45+l*.08)+n*Math.PI*2/((l-3)*4),r=35+(n%2)*5;
      const x=Math.cos(a)*r,y=Math.sin(a)*r;
      add(`M${x} ${y-2}l1 1 2 1-2 1-1 2-1-2-2-1 2-1Z`,l>=5?['#aaffdb','#ffd482','#e9b3ff'][n%3]:accent,'none',1,'orbit');
    }
    if(l===6) add('M-14 -29L-17 -40L-7 -35L0 -45L7 -35L17 -40L14 -29Z',accent,'#fff4d1',1);
    add('M-5 -40h2v3h-2ZM3 -40h2v3H3Z','#101b2b');
    return parts;
  }
  let previewSerial=0;
  function preview(item) {
    const prefix=`turtle-material-${previewSerial++}`;
    const defs=Object.entries(materials(item)).map(([key,colors])=>`<linearGradient id="${prefix}-${key}" x1="0" y1="0" x2="1" y2="1">${colors.map((color,i)=>`<stop offset="${i/(colors.length-1)}" stop-color="${color}"/>`).join('')}</linearGradient>`).join('');
    const fill=p=>p.fill.startsWith('@')?`url(#${prefix}-${p.fill.slice(1)})`:p.fill;
    const art=shapes(item).map(p=>{
      const t=p.transform;
      const transform=t?`translate(${t.x} ${t.y}) rotate(${(t.rotation||0)*180/Math.PI}) scale(${t.sx??1} ${t.sy??1})`:p.mirror?`scale(${p.mirror} 1)`:'';
      const path=`<path class="turtle-${p.motion==='angel-orbit'?'still':p.motion||'still'}" transform="${transform}" d="${p.d}" fill="${fill(p)}" stroke="${p.stroke}" stroke-width="${p.width}"/>`;
      if(item.angel && p.motion==='wing') return `<g class="turtle-angel-feather" style="--wing-direction:${p.transform?.sx||1}">${path}</g>`;
      return p.motion==='angel-orbit'?`<g class="turtle-angel-orbit">${path}</g>`:path;
    }).join('');
    return `<svg class="turtle-custom-art turtle-level-${item.level}${item.angel?' turtle-angel':''}" viewBox="${item.angel?'-88 -88 176 176':'-60 -60 120 120'}" aria-hidden="true"><defs>${defs}</defs><g>${art}</g></svg>`;
  }
  const paths = new Map();
  function draw(ctx,item,x,y,time=0,angle=0,reduced=false) {
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(.37,.37);
    if(item.level>=1&&!reduced) {const pulse=1+Math.sin(time*2)*.018;ctx.scale(pulse,pulse);}
    if(item.level>=3) {ctx.shadowColor=item.accent;ctx.shadowBlur=(item.level===3?3.5:item.level-2)*(reduced?1:1+Math.sin(time*2)*.2);}
    const paints={};
    if(item.level>=1) for(const [key,colors] of Object.entries(materials(item))) {
      const gradient=ctx.createLinearGradient(-25,-30,25,32);
      colors.forEach((color,i)=>gradient.addColorStop(i/(colors.length-1),color));paints[key]=gradient;
    }
    for(const p of shapes(item,reduced?0:time)) {
      ctx.save();
      if(p.mirror) ctx.scale(p.mirror,1);
      if(p.transform) {const t=p.transform;ctx.translate(t.x,t.y);ctx.rotate(t.rotation||0);ctx.scale(t.sx??1,t.sy??1);}
      if(p.motion==='silver-shine'&&!reduced) ctx.globalAlpha=.65+Math.sin(time*1.5)*.25;
      if(p.motion==='spectrum'&&!reduced) ctx.globalAlpha=.8+Math.sin(time)*.2;
      if(item.angel) {
        ctx.shadowBlur=reduced?0:(p.motion==='sparkle'?4:p.motion==='gem'?2:0);
        ctx.shadowColor=p.motion==='sparkle'?p.fill:'#e9f4ff';
        if(p.motion==='shimmer'&&!reduced) ctx.globalAlpha=.82+Math.sin(time*1.5)*.18;
      }
      // Only static geometry is cached; orbit positions change every frame.
      let path=paths.get(p.d);if(!path){path=new Path2D(p.d);if(paths.size<1500)paths.set(p.d,path);}
      if(p.fill!=='none'){ctx.fillStyle=p.fill.startsWith('@')?paints[p.fill.slice(1)]:p.fill;ctx.fill(path);}
      if(p.stroke!=='none'){ctx.strokeStyle=p.stroke;ctx.lineWidth=p.width;ctx.stroke(path);}
      ctx.restore();
    }
    ctx.restore();
  }
  function selected(id,owned=[]) {return catalog.find(item=>item.id===id&&owned.includes(id))||null;}
  return {catalog,selected,preview,draw,shapes};
})();
if(typeof module!=="undefined") module.exports=TurtleCustoms;
if(typeof globalThis!=="undefined") globalThis.TurtleCustoms=TurtleCustoms;
