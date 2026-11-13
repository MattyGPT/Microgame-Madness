"use strict";
const GeomayhemBosses=(()=>{
  const rows=[
    ['Circuit Warden','Mint Circuit','#71f5d2','A green signal wakes the sentinel.','Circuit Lock|Pulse Grid|Node Crossfire','circuit'],
    ['Foundry Colossus','Amber Foundry','#ffba69','The furnace has forged its champion.','Hammerfall|Furnace Bloom|Molten Cascade','forge'],
    ['Array Architect','Violet Array','#b695ff','Every line is part of the trap.','Drafting Cage|Array Rotation|Blueprint Collapse','array'],
    ['Glacier Monarch','Glacier Grid','#a9edff','A frozen throne breaks its silence.','Frozen Crown|Ice Spear March|Glacial Shatter','ice'],
    ['Rose Heart','Rose Reactor','#ff8fa5','Something beneath the petals is beating.','Heartpulse|Thorn Spiral|Petal Closure','rose'],
    ['Volt Conductor','Volt Vault','#f9ff72','The storm awaits its conductor.','Thunder Count|Capacitor Chain|Lightning Encore','volt'],
    ['Cinder Juggernaut','Cinder City','#ff7968','Ash trembles beneath iron footsteps.','Burning Crossroads|Impact Craters|Cinder Run','cinder'],
    ['Labyrinth Keeper','Lunar Labyrinth','#becaff','Every door leads back to the moon.','Moon Gates|Crescent Prison|Doorway Collapse','moon'],
    ['Prism Doppelstar','Prism Rift','#ff9ed9','The reflection moves first.','Mirror Cross|Doppelstar Bloom|Prism Fracture','prism'],
    ['Mayhem Engine','Mayhem Core','#e8f4ff','Containment is no longer possible.','Reactor Spokes|Overload Sequence|Core Meltdown','engine'],
    ['Coral Leviathan','Coral Cascade','#7ee4e1','An ancient shadow rises from the deep.','Tidal Eclipse|Bubble Shoal|Leviathan Wake','coral'],
    ['Brass Timekeeper','Clockwork Keep','#f3ce83','The final second belongs to it.','Minute Hand|Pendulum Echo|Midnight Chime','clock'],
    ['Canopy Colossus','Emerald Canopy','#94e68d','The forest has opened its eyes.','Root March|Seedpod Garden|Thorn Crown','tree'],
    ['Basalt Behemoth','Obsidian Forge','#ec9166','The mountain tears itself apart.','Fault Line|Obsidian Teeth|Basalt Crush','basalt'],
    ['Polar Astronomer','Aurora Observatory','#9ef2dc','The stars have chosen their target.','Star Chart|Meteor Catalogue|Aurora Curtain','stars'],
    ['Neon Pursuer','Neon Speedway','#fc91da','There is no finish line to hide behind.','Overtake|Neon Chicane|Finish Line','racer'],
    ['Drowned Librarian','Sunken Archive','#93c5ee','Some stories should remain submerged.','Sealed Aisles|Inkblot Verse|Last Chapter','book'],
    ['Mirage Sovereign','Mirage Palace','#e8cc9b','The palace was never real.','Sun Court|Mirage Lattice|Solar Decree','sun'],
    ['Hollow Cantor','Void Cathedral','#c0a7f5','One note. Then nothing.','Hollow Hymn|Resonance Cross|Final Silence','cantor'],
    ['Infinity Regent','Infinity Crown','#ffe5a6','Nineteen worlds become one throne.','Crownfall|Infinity Seal|Regent’s Judgment','regent'],
  ];
  const catalog=rows.map(([name,arena,color,line,moves,theme],i)=>({level:i+1,name,arena,color,line,moves:moves.split('|'),theme}));
  function path(c,d,fill,stroke,width=1.2){const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p)}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p)}}
  function circle(c,x,y,r,fill,stroke,width=1){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
  function poly(c,x,y,r,n,fill,stroke,a=0,star=false){let d='';for(let i=0;i<n*(star?2:1);i++){const angle=a+i*Math.PI*2/(n*(star?2:1)),R=star&&i%2?r*.52:r;d+=`${i?'L':'M'}${x+Math.cos(angle)*R} ${y+Math.sin(angle)*R}`}path(c,d+'Z',fill,stroke)}
  function portrait(c,level,x,y,size,time=0,phase=1,reduced=false){
    if(level===20)return RegentArt.draw(c,x,y,size,time,phase,reduced);
    const b=catalog[level-1],a=b.color,t=reduced?0:time;
    c.save();c.translate(x,y);c.scale(size/60,size/60);c.lineJoin='round';c.lineCap='round';
    const metal=c.createLinearGradient(-35,-40,35,45);metal.addColorStop(0,a);metal.addColorStop(.35,'#30425a');metal.addColorStop(.7,'#142236');metal.addColorStop(1,a);
    const jewel=c.createLinearGradient(-15,-20,18,25);jewel.addColorStop(0,'#ffffff');jewel.addColorStop(.4,a);jewel.addColorStop(1,'#354568');
    const P=(d,f=metal,s=a,w=1.2)=>path(c,d,f,s,w), C=(x,y,r,f=null,s=a,w=1)=>circle(c,x,y,r,f,s,w);
    const shard=(x,y,r=8)=>{P(`M${x} ${y-r}l${r*.5} ${r}-${r*.5} ${r}-${r*.5}-${r}Z`,jewel,'#f0faff',.7)};
    // Articulated outer silhouettes, behind the original identity-bearing core.
    const machine=['circuit','forge','volt','cinder','basalt'].includes(b.theme);
    const royal=['ice','moon','stars','book','sun','regent'].includes(b.theme);
    const feather=(x,y,len,angle,color)=>{c.save();c.translate(x,y);c.rotate(angle);P(`M0 0Q-10 ${-len*.5} 0 ${-len}Q9 ${-len*.4} 0 0Z`,color,a,.6);P(`M0 -3V${-len+5}`,null,'#ffffff77',.45);c.restore()};
    if(machine){
      for(const side of [-1,1]){c.save();c.scale(side,1);c.rotate(Math.sin(t*1.4)*.025);
        P('M23 -23L39 -35L56 -23L53 -5L37 1L25 -8Z');P('M34 -28L47 -28L51 -21L37 -15Z',jewel);
        C(43,1,8,'#111a2b',a,2);C(43,1,3,jewel);
        P('M37 7L51 4L57 29L50 39L36 31Z');P('M39 12L48 10L51 26L42 29Z',jewel);
        for(let j=0;j<3;j++)P(`M${38+j*5} 30v7`,null,'#c7d7e7',1.5);
        P('M14 26L28 28L31 47L23 53L9 46Z');P('M12 45L28 44L36 53H8Z');
        for(let j=0;j<3;j++)P(`M38 ${-23+j*4}h9`,null,'#192535',1.5);
        c.restore();
      }
    }
    if(royal){
      for(const side of [-1,1]){c.save();c.scale(side,1);
        P('M12 -24Q40 -23 42 8L53 49L30 42L23 53L9 34Z',metal,a,1.3);
        for(let j=0;j<5;j++)P(`M${20+j*3} -12Q${27+j*3} 16 ${25+j*5} ${42-j%2*5}`,null,j%2?'#050e21':a+'88',.8);
        P('M19 -19L33 -27L45 -16L36 -7L23 -9Z',jewel);
        P('M33 -6L40 11L34 21L28 12Z');C(35,17,4,jewel);
        if(['stars','moon','book','sun'].includes(b.theme)){P('M43 -40V40',null,a,2.2);C(43,-38,8,null,a,1.4);poly(c,43,-38,5,4,jewel,'#fff',t*.2,true)}
        c.restore();
      }
    }
    if(['cantor','regent','prism'].includes(b.theme)){
      for(const side of [-1,1]){c.save();c.scale(side,1);c.rotate(Math.sin(t*.8)*.045);
        for(let j=0;j<8;j++)feather(19+j*4,17+j*2,62-j*3,.24+j*.075,b.theme==='regent'?`hsl(${35+j*31} 55% ${32+j*4}%)`:metal);
        P('M18 20Q33 -9 58 -37',null,a,2);c.restore();}
    }
    if(['rose','tree','coral'].includes(b.theme)){
      for(const side of [-1,1])for(let j=0;j<4;j++){
        c.save();c.scale(side,1);const sway=Math.sin(t*1.2+j)*3;
        P(`M18 ${j*8-10}Q${50+sway} ${j*9-40} ${51+sway} ${j*9+12}Q${40+sway} ${j*8+39} 29 ${j*7+22}`,null,a,3-j*.4);
        for(let k=0;k<3;k++)feather(40+sway,j*9+k*7-10,10+k*3,.8+j*.2,jewel);
        c.restore();
      }
    }
    if(['engine','clock','array'].includes(b.theme)){
      c.save();c.rotate(t*(b.theme==='clock'?.12:-.18));
      for(let j=0;j<16;j++){c.save();c.rotate(j*Math.PI/8);P('M-3 -59H3L5 -48H-5Z',metal,a,.7);C(0,-53,1.3,jewel);c.restore()}
      C(0,0,50,null,a+'88',.7);C(0,0,57,null,a+'55',.7);c.restore();
    }
    if(b.theme==='racer')for(const side of [-1,1]){c.save();c.scale(side,1);P('M22 -22L48 -9L54 37L40 31L31 6Z');P('M44 27Q54 46 43 58Q33 43 38 28Z',jewel);for(let j=0;j<4;j++)P(`M${35+j*3} ${-5+j*5}l8 4`,null,'#fff4',1);c.restore()}
    c.globalAlpha=.14;C(0,0,44,a,null);c.globalAlpha=1;

    switch(b.theme){
      case 'circuit':
        for(let n=0;n<4;n++){c.save();c.rotate(n*Math.PI/2);P('M-13 -31V-47H13V-31M-6 -39H6',metal,a,2);c.restore()}
        P('M-30 -24L-18 -35H18L30 -24V24L18 35H-18L-30 24Z');P('M-24 -15H-13V-24M24 15H13V24',null,a,2);C(0,0,16,jewel);break;
      case 'forge':
        P('M-28 -28H28L35 29L22 40H-22L-35 29Z');P('M-50 -12H-32V27H-51ZM32 -12H50V27H32Z');P('M-18 -17H18V25H-18Z','#ff853a','#ffe1a6');for(let i=-12;i<17;i+=8)P(`M${i} -15V23`,null,'#483a35',3);P('M-24 -38H24L18 -23H-18Z');break;
      case 'array':
        for(let n=0;n<3;n++){c.save();c.rotate(n*Math.PI*2/3+t*.15);P('M0 -54L12 -33L0 -39L-12 -33Z',jewel);P('M0 -38V-22',null,a,2);c.restore()}poly(c,0,0,32,3,metal,a,-Math.PI/2);poly(c,0,0,21,3,null,'#ffffff',Math.PI/2);break;
      case 'ice':
        P('M-22 -20L-37 34L0 47L37 34L22 -20Z');for(let i=-2;i<=2;i++)shard(i*12,-30+Math.abs(i)*5,14);P('M-21 -18L0 -27L21 -18L14 17L0 25L-14 17Z',jewel);break;
      case 'rose':
        for(let n=0;n<8;n++){c.save();c.rotate(n*Math.PI/4+Math.sin(t)*.04);P('M0 -8C-32 -22 -23 -53 0 -44C23 -53 32 -22 0 -8Z',n%2?metal:jewel,a);c.restore()}P('M0 -5C-23 -26 -28 6 0 24C28 6 23 -26 0 -5Z',jewel,'#ffe5ed',2);break;
      case 'volt':
        P('M-22 -24L0 -34L22 -24L27 30H-27Z');P('M-15 -28V-52M-24 -50V-35H-5V-50M15 -28V-52M6 -50V-35H25V-50',null,a,3);P('M4 -23L-13 3H-2L-6 25L15 -5H4Z',jewel);for(const side of [-1,1])C(side*43,10,10,metal,a,2);break;
      case 'cinder':
        P('M-29 -22L0 -36L29 -22L35 34H-35Z');P('M-53 -17H-32V32H-53ZM32 -17H53V32H32Z');P('M-24 -24L-27 -48H-16L-12 -27M12 -27L16 -48H27L24 -24');P('M-15 9L0 27L15 9L0 -11Z','#ff8b50','#ffdf8b',2);break;
      case 'moon':
        C(0,0,43,null,a,2);P('M13 -33A36 36 0 1 0 13 33A31 31 0 0 1 13 -33Z',jewel);P('M-15 -15L0 -28L17 -15V24L0 34L-17 24Z');P('M28 -2H50M44 -2V10M50 -2V6',null,'#fff2bd',3);break;
      case 'prism':
        for(const side of [-1,1]){c.globalAlpha=.35;poly(c,side*30,Math.sin(t+side)*8,25,5,jewel,a,t*.15,true)}c.globalAlpha=1;poly(c,0,0,41,5,metal,a,-Math.PI/2,true);poly(c,0,0,22,5,jewel,'#ffffff',Math.PI/2);break;
      case 'engine':
        for(let n=0;n<3;n++){c.save();c.rotate(t*(n%2?-.2:.15)+n);poly(c,0,0,47-n*8,8,null,n%2?'#ffd8a5':a);c.restore()}C(0,0,22,jewel,'#ffffff',2);for(let n=0;n<4;n++){c.save();c.rotate(n*Math.PI/2);P('M-10 -54H10V-36H-10Z');c.restore()}break;
      case 'coral':
        P('M-38 36C55 48 49 -35 8 -34C-18 -34 -20 -9 2 -7C27 -6 18 24 -9 18Z');P('M-9 -26L-31 -45L-25 -14ZM23 -20L46 -41L42 -5Z',jewel);for(let n=0;n<5;n++)shard(29-n*9,20+Math.sin(n)*9,5);break;
      case 'clock':
        for(let n=0;n<12;n++){c.save();c.rotate(n*Math.PI/6);P('M-5 -47H5V-35H-5Z');c.restore()}C(0,0,36,metal,a,2);C(0,0,28,'#132238','#fff0ba');c.save();c.rotate(t*.2);P('M0 23V-23M0 0L17 8',null,a,3);c.restore();P('M0 37V51',null,a,2);C(0,52,5,jewel);break;
      case 'tree':
        P('M-20 -20L-14 20L-34 44L0 35L34 44L14 20L20 -20Z');for(let n=0;n<5;n++){const x=(n-2)*17;P(`M${x} -5Q${x-28} -35 ${x} -49Q${x+28} -35 ${x} -5Z`,jewel,a)}P('M-12 9L0 26L12 9L0 -6Z',jewel);break;
      case 'basalt':
        P('M-31 -26L-7 -40L27 -30L36 12L20 38L-22 37L-39 7Z');P('M-52 -8L-34 -20L-30 26L-49 36ZM33 -20L51 -7L48 37L28 25Z');P('M-17 -28L-4 -9L-12 5L8 20L3 35M25 -13L4 3',null,'#ffbc76',3);break;
      case 'stars':
        P('M0 -37L17 -15L36 40L0 31L-36 40L-17 -15Z');for(let n=0;n<5;n++){const a0=n*Math.PI*2/5+t*.2;C(Math.cos(a0)*47,Math.sin(a0)*47,5,jewel)}C(0,-14,15,'#101b33',a);poly(c,0,10,12,5,jewel,a,0,true);break;
      case 'racer':
        P('M0 -48L30 -7L19 30L0 20L-19 30L-30 -7Z');P('M-24 -16L-49 23L-29 17L-17 35M24 -16L49 23L29 17L17 35');for(const side of [-1,1])C(side*26,16,14,null,a,3);P('M0 -29L9 -6L0 5L-9 -6Z',jewel);break;
      case 'book':
        P('M-16 -25Q0 -42 16 -25L32 41L0 30L-32 41Z');P('M-36 -12L-4 -5V22L-36 14ZM4 -5L36 -12V14L4 22Z',jewel);for(let n=0;n<3;n++)P(`M-30 ${-5+n*6}L-10 ${n*6}M10 ${n*6}L30 ${-5+n*6}`,null,'#36546c',1);C(0,-20,12,'#112134',a);break;
      case 'sun':
        for(let n=0;n<10;n++){c.save();c.rotate(n*Math.PI/5+t*.08);P('M0 -53L5 -37L-5 -37Z',jewel);c.restore()}P('M-19 -23L-30 35L0 44L30 35L19 -23Z');P('M-20 -26L-25 -43L-8 -37L0 -52L8 -37L25 -43L20 -26Z',jewel);P('M-17 -12Q0 -2 17 -12V13Q0 26 -17 13Z',jewel);break;
      case 'cantor':
        for(const side of [-1,1]){c.save();c.scale(side,1);P('M17 -15L30 -47L31 -16L45 -32L43 9L54 -1L38 38L17 20Z');c.restore()}P('M-14 -27Q0 -40 14 -27L21 31L0 43L-21 31Z',jewel);P('M0 -28L-5 -10L5 3L0 24',null,'#29304d',2);C(0,17,7,'#080a18',a);break;
      case 'regent':
        for(const side of [-1,1]){c.save();c.scale(side,1);P('M18 -16L50 -32L42 20L25 36L13 25Z');c.restore()}P('M-25 -25H25L29 23L0 41L-29 23Z');P('M-24 -28L-29 -48L-12 -40L0 -57L12 -40L29 -48L24 -28Z',jewel);P('M0 1C-27 -24 -27 24 0 1C27 -24 27 24 0 1Z',null,'#fff6ce',3);break;
    }
    // Close-up cel details also survive as clean armor accents in the arena.
    switch(b.theme){
      case 'circuit':P('M-24 -22H-17V-13H-8M24 -22H17V-13H8M-24 22H-17V13M24 22H17V13',null,'#e0fff2',.9);for(const side of [-1,1]){C(side*22,0,3,jewel);P(`M${side*28} -28L${side*39} -18V18L${side*28} 28`,null,a,2)}break;
      case 'forge':P('M-25 29H25M-23 34H23M-45 -7V18M45 -7V18',null,'#ffe4b1',1.2);for(const side of [-1,1]){C(side*23,-21,3,jewel);P(`M${side*36} -12V-31L${side*48} -39`,null,a,3)}break;
      case 'array':poly(c,0,0,12,6,jewel,'#fff');for(let n=0;n<3;n++){c.save();c.rotate(n*Math.PI*2/3);P('M-8 -34L0 -45L8 -34M-5 -19H5',null,'#eadcff',1);c.restore()}break;
      case 'ice':P('M0 -26V25M-21 -18L14 17M21 -18L-14 17M-22 6L-29 29L-12 24M22 6L29 29L12 24',null,'#f1fdff',.9);for(const side of [-1,1])shard(side*35,17,13);break;
      case 'rose':for(let n=0;n<8;n++){c.save();c.rotate(n*Math.PI/4);P('M0 -16Q-12 -29 0 -40Q12 -29 0 -16',null,'#ffd5df',.8);c.restore()}P('M-9 -4Q-13 -12 -17 -6',null,'#fff2ef',2);break;
      case 'volt':for(const side of [-1,1]){P(`M${side*27} -19L${side*40} -30L${side*34} -8L${side*48} -13`,null,'#fffec4',1.8);C(side*43,10,5,jewel);P(`M${side*16} 18V26`,null,a,3)}break;
      case 'cinder':P('M-30 -3L-14 -12L0 -6L14 -12L30 -3M-20 31H20M-47 -8V20M47 -8V20',null,'#ffd4a6',1.5);for(let n=-1;n<=1;n++)P(`M${n*10} 27V34`,null,a,2);break;
      case 'moon':P('M-11 14L0 22L11 14M-12 -18L0 -24L12 -18',null,'#f4eaff',1.1);for(let n=0;n<8;n++){const a0=n*Math.PI/4;C(Math.cos(a0)*43,Math.sin(a0)*43,2,'#fff3cd',null)}break;
      case 'prism':for(let n=0;n<5;n++){const a0=n*Math.PI*2/5-Math.PI/2;P(`M0 0L${Math.cos(a0)*40} ${Math.sin(a0)*40}`,null,'#ffe6fa',.8)}C(0,0,6,'#ffffff',null);break;
      case 'engine':for(let n=0;n<8;n++){c.save();c.rotate(n*Math.PI/4);P('M-3 -34H3M0 -31V-27',null,'#fff1c4',1.4);c.restore()}C(0,0,14,null,'#fff',1);P('M-7 -4L0 -11L7 -4L0 7Z','#fff');break;
      case 'coral':P('M-24 -24L-34 -31M-24 -24L-35 -18M34 -20L45 -27M34 -20L47 -15',null,'#ffe3c4',2);P('M-27 29Q32 37 33 -6',null,'#e2fffa',1.1);break;
      case 'clock':for(let n=0;n<12;n++){c.save();c.rotate(n*Math.PI/6);P('M0 -24V-20',null,'#fff1bb',1.3);c.restore()}C(0,0,4,jewel);break;
      case 'tree':P('M-11 -3L-6 8L-12 25M11 -3L6 8L12 25M0 29V35',null,'#fff6b5',1);for(let n=0;n<5;n++)P(`M${(n-2)*17} -13V-39`,null,'#dcffd1',.8);break;
      case 'basalt':P('M-31 -26L-17 -5L-39 7M27 -30L16 -9L36 12M-22 37L-9 24L20 38',null,'#ffca8c',1);P('M-30 -23L-21 -29M16 -27L23 -23',null,'#ffead2',2);break;
      case 'stars':for(let n=0;n<7;n++){const px=Math.sin(n*2.4)*19,py=5+n*4;poly(c,px,py,2,4,'#e7fff9',null,n,true)}P('M-27 31Q0 9 27 31',null,a,.8);C(0,-14,18,null,a,.8);break;
      case 'racer':P('M-20 -6L-9 18M20 -6L9 18M-12 -18L0 -35L12 -18',null,'#fff0fd',1.1);for(const side of [-1,1])C(side*26,16,8,null,'#fff1fc',1);break;
      case 'book':P('M-7 -28H7M-10 -24H10M-9 -20H9M0 4V21',null,'#dff7ff',1);P('M-15 28Q0 20 15 28M-19 33Q0 25 19 33',null,a,.8);break;
      case 'sun':P('M-12 -6L0 0L12 -6M-17 20Q0 34 17 20',null,'#fff4c6',1.4);for(const side of [-1,1]){shard(side*23,14,6);P(`M${side*23} 20V34`,null,a,1)}break;
      case 'cantor':P('M-12 -20L-7 -15M12 -20L7 -15M-10 28L0 35L10 28',null,'#6b5c92',1.2);for(const side of [-1,1]){c.save();c.scale(side,1);P('M23 10L30 -21M31 19L39 -6M36 25L46 9',null,a,.8);c.restore()}break;
      case 'regent':
        P('M-21 -20H21L24 20L0 34L-24 20ZM-20 -15L-13 -9M20 -15L13 -9M-18 18L-10 24M18 18L10 24',null,'#fff1c8',1.2);
        for(const side of [-1,1]){c.save();c.scale(side,1);P('M25 -11L43 -24L35 16L27 25',null,'#ffedbc',1);shard(36,-4,6);c.restore()}
        for(let n=-1;n<=1;n++)shard(n*15,-38+(n===0?-6:0),5);P('M-10 -13L-3 -11M3 -11L10 -13',null,'#fff',2);break;
    }
    // Fine bevels and engraved surfaces are reserved for cinematic close-ups.
    if(size>85){
      c.save();c.globalAlpha=.24;
      for(let j=0;j<38;j++){const angle=j*2.39996,r=13+Math.sqrt(j)*4,x0=Math.cos(angle)*r,y0=Math.sin(angle)*r;
        P(`M${x0} ${y0}l${2+j%4} -1`,null,j%3?'#fff':'#020916',.4);
      }c.restore();
      for(const side of [-1,1]){C(side*18,20,1.1,'#fff',null);C(side*18,20,2.4,null,a,.4)}
    }
    c.save();c.globalCompositeOperation='screen';
    const bloom=c.createRadialGradient(0,-7,0,0,-7,23);bloom.addColorStop(0,a+'55');bloom.addColorStop(1,a+'00');C(0,-7,23,bloom,null);c.restore();
    // The shared facial treatment keeps the cast coherent while silhouettes differ.
    if(!['rose','engine','clock','prism','regent'].includes(b.theme)){P('M-11 -9L-3 -7M3 -7L11 -9',null,'#f4ffff',2.4)}
    if(phase>=2){c.globalAlpha=.65;for(let n=0;n<phase+2;n++){const a0=n*Math.PI*2/(phase+2)-t*.3;shard(Math.cos(a0)*55,Math.sin(a0)*55,4)}c.globalAlpha=1}
    c.restore();
  }
  function cinematic(c,level,seconds,reduced=false){
    return BossFilm.draw(c,level,seconds,reduced);
  }
  function drawCommand(c,command,reduced=false){const b=catalog[command.level-1],[x,y]=command.coords;
    portrait(c,command.level,x,y,command.radius*1.3,command.time,command.phase,reduced);
    if(command.health!==null){c.fillStyle='#172033';c.fillRect(x-44,y-command.radius-20,88,5);c.fillStyle=b.color;c.fillRect(x-44,y-command.radius-20,88*Math.max(0,Math.min(1,command.health)),5);c.textAlign='center';c.font='bold 10px sans-serif';c.fillStyle='#ffffff';c.fillText(b.name,x,y-command.radius-25);}
  }
  return {catalog,portrait,cinematic,drawCommand};
})();
if(typeof module!=='undefined')module.exports=GeomayhemBosses;
if(typeof globalThis!=='undefined')globalThis.GeomayhemBosses=GeomayhemBosses;
