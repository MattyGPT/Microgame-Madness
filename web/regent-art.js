"use strict";
// Dedicated final-boss illustration. Decorative wings never alter the combat hitbox.
const RegentArt=(()=>{
  const TAU=Math.PI*2;
  function draw(c,x,y,size,time=0,phase=1,reduced=false,options={}){
    const t=reduced?0:time,quality=size>80,ascension=phase-1;
    c.save();c.translate(x,y);c.scale(size/60,size/60);c.lineJoin='round';c.lineCap='round';
    const path=(d,fill,stroke='#fce5aa',width=.65)=>{const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p)}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p)}};
    const circle=(x,y,r,fill,stroke,width=.6)=>{c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}};
    const gradient=(x1,y1,x2,y2,stops)=>{const g=c.createLinearGradient(x1,y1,x2,y2);stops.forEach(([n,color])=>g.addColorStop(n,color));return g};
    const gold=gradient(-30,-45,35,45,[[0,'#fffde3'],[.18,'#e6be70'],[.36,'#72502f'],[.52,'#fff0bb'],[.69,'#c9954d'],[1,'#382c35']]);
    const armor=gradient(-25,-35,25,40,[[0,'#e5e4ff'],[.18,'#4c6087'],[.4,'#152439'],[.6,'#080f20'],[.83,'#6575a2'],[1,'#d0b1ef']]);
    const white=gradient(-10,-20,10,30,[[0,'#ffffff'],[.45,'#c7edff'],[.7,'#8a99ca'],[1,'#f3d2ff']]);
    const glow=(x,y,r,color)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');circle(x,y,r,g)};
    const jewel=(x,y,r,hue)=>{
      const g=gradient(x-r,y-r,x+r,y+r,[[0,'#ffffff'],[.25,`hsl(${hue} 95% 84%)`],[.65,`hsl(${hue+35} 75% 48%)`],[1,'#211d52']]);
      path(`M${x} ${y-r}L${x+r*.6} ${y}L${x} ${y+r}L${x-r*.6} ${y}Z`,g,'#fff2db',.45);
      path(`M${x} ${y-r}V${y+r}M${x-r*.6} ${y}H${x+r*.6}`,null,'#ffffff88',.35);
    };
    glow(0,0,72+ascension*5,'#b186ff24');glow(0,-25,35,'#ffe6a533');
    // Three independently precessing astrolabes, behind the wings and figure.
    for(let ring=0;ring<3;ring++){
      c.save();c.rotate(t*(ring%2?-.13:.1)+ring*.8);c.scale(1,.58+ring*.14);
      circle(0,0,56+ring*6,null,ring%2?'#c4b0ff77':'#ffe7a577',.6);
      const ticks=quality?36:18;
      for(let n=0;n<ticks;n++){c.save();c.rotate(n*TAU/ticks);path(`M0 ${-55-ring*6}v${n%3===0?-4:-1.8}`,null,n%3?'#b6b1dd77':'#fff0babb',.6);c.restore()}
      c.restore();
    }
    // Nineteen fractured world sigils orbit the final sovereign.
    if(!options.hideOrbiters)for(let n=0;n<19;n++){
      const angle=n*TAU/19+t*.12,r=63+Math.sin(n*3+t*.6)*3;
      c.save();c.translate(Math.cos(angle)*r,Math.sin(angle)*r*.74);c.rotate(angle+Math.PI/2);
      jewel(0,0,n%3===0?3.4:2.1,n*19+t*10);c.restore();
    }
    // A feather is a jointed stained-glass blade, with a gold spine and facets.
    const wing=(side,row)=>{
      c.save();c.scale(side,1);c.translate(15,3+row*9);
      c.rotate(-.05+row*.23+Math.sin(t*1.35+row*.9)*(.05+phase*.012));
      const extension=1+ascension*.06;
      c.scale(extension,1);
      path('M0 13Q18 -27 57 -48Q42 -6 12 24Z',armor,'#cfb77e',1);
      for(let n=0;n<9;n++){
        const rootX=7+n*2.8,rootY=18-n*1.1,tipX=18+n*5.5,tipY=-39+n*3.5-row*3;
        const hue=(190+n*19+row*50+t*13)%360;
        const g=gradient(rootX,rootY,tipX,tipY,[[0,'#111b39'],[.3,`hsl(${hue} 65% 38%)`],[.68,`hsl(${hue+25} 90% 65%)`],[.92,'#e1f5ff'],[1,'#fff9de']]);
        path(`M${rootX} ${rootY}Q${rootX+10} ${tipY+18} ${tipX} ${tipY}L${tipX-2} ${tipY+17}Q${rootX+18} ${rootY+4} ${rootX} ${rootY}Z`,g,'#e7d6ad',.5);
        path(`M${rootX+2} ${rootY-3}L${tipX} ${tipY}L${rootX+7} ${rootY-3}`,null,'#ffffff77',.35);
        if(quality){path(`M${rootX+4} ${rootY-9}l5 -6 3 4-5 6Z`,null,'#fff2c277',.35);}
      }
      path('M1 13Q20 -10 57 -48',null,gold,2);circle(4,10,4,gold);jewel(4,10,2,210+row*50);
      c.restore();
    };
    if(!options.hideWings)for(let row=phase===3?2:phase===2?1:0;row>=0;row--)for(const side of [-1,1])wing(side,row);
    // Flowing royal mantle, with independently waving hems and stitched constellations.
    for(const side of [-1,1]){
      c.save();c.scale(side,1);const sway=Math.sin(t*1.4+side)*3;
      path(`M11 -19Q31 -15 31 14L${36+sway} 46L24 39L17 52L4 25Z`,armor,gold,1.1);
      for(let n=0;n<4;n++)path(`M${15+n*3} -7Q${17+n*3} 19 ${17+n*5+sway*.4} ${39-n*2}`,null,n%2?'#f0d2a588':'#080c24',.8);
      if(quality)for(let n=0;n<5;n++){const yy=8+n*5;path(`M${20+n*.8} ${yy}l2 2-2 2-2-2Z`,null,'#e9d9ff88',.4)}
      c.restore();
    }
    // Floating greaves, gauntlets and overlapping beveled breastplate.
    for(const side of [-1,1]){
      c.save();c.scale(side,1);
      path('M8 24L19 23L20 39L13 44L7 35Z',armor,gold,1);path('M10 30L16 29L16 36L12 39Z',gold,null);
      path('M20 -19L32 -26L42 -17L33 -7L22 -9Z',gold,'#fff5d0',.8);
      path('M24 -18L32 -22L37 -17L31 -11Z',armor,'#ffe5a0',.5);jewel(31,-17,3,170+side*35+t*10);
      path('M26 -6L34 -9L37 10L31 17L25 9Z',armor,gold,.9);path('M28 2L34 0L35 10L30 13Z',gold);
      path('M27 15L33 14L35 21L30 24L26 20Z',white,gold,.6);
      c.restore();
    }
    path('M-20 -22L0 -29L20 -22L23 10L13 27L0 34L-13 27L-23 10Z',gold,'#fff6d1',1);
    path('M-17 -19L0 -25L17 -19L19 8L10 23L0 29L-10 23L-19 8Z',armor,'#a6b2d4',.7);
    path('M-17 -17L-6 -9L0 -13L6 -9L17 -17M-18 8L-7 13L0 26L7 13L18 8',null,gold,1.3);
    for(const side of [-1,1])for(let n=0;n<3;n++)path(`M${side*(6+n*3)} ${15+n*2}l${side*3} -3`,null,'#ffecb7',.45);
    // An animated infinity heart sits beneath a transparent faceted shield.
    glow(0,1,17,phase===3?'#e5caff88':'#b6efff55');
    if(!options.hideInfinity){c.save();c.translate(0,1);c.scale(1,.8+Math.sin(t*2)*.035);
    path('M0 0C-22 -21 -22 21 0 0C22 -21 22 21 0 0Z',null,'#fff2bf',2.5);
    path('M0 0C-22 -21 -22 21 0 0C22 -21 22 21 0 0Z',null,'#ffffff',.65);c.restore();}
    path('M0 -16L17 0L0 20L-17 0Z','#a9e4ff0d','#ddf4ff66',.5);
    // Sculpted helmet: brow, luminous eye slits, inset cheek plates, five crown jewels.
    path('M-15 -36L0 -42L15 -36L12 -20L0 -15L-12 -20Z',armor,gold,1);
    path('M-14 -34L-2 -29L0 -33L2 -29L14 -34L10 -25L0 -19L-10 -25Z',white,gold,.6);
    path('M-10 -29L-3 -26M3 -26L10 -29',null,'#10152e',2.6);
    path('M-10 -29L-3 -26M3 -26L10 -29',null,phase===3?'#fff3ff':'#a6f6ff',.8);
    path('M-18 -38L-23 -55L-11 -47L-8 -60L0 -51L8 -60L11 -47L23 -55L18 -38Z',gold,'#fff8d5',.9);
    path('M-17 -39Q0 -46 17 -39L15 -35Q0 -40 -15 -35Z',armor,gold,.7);
    for(let n=-2;n<=2;n++)jewel(n*8,-44-Math.abs(n%2)*8,3.3,40+n*55+t*8);
    // Phase three reveals a second floating crown and a star-lit coronation halo.
    if(phase>=2){c.save();c.translate(0,-64-Math.sin(t)*2);c.scale(1,.33);circle(0,0,23,null,'#fff0bb',1.8);circle(0,0,27,null,'#c7b1ff99',.7);c.restore();}
    if(phase===3){for(let n=0;n<7;n++){const a=n*Math.PI/6-Math.PI;jewel(Math.cos(a)*32,-56+Math.sin(a)*21,3.8,n*45+t*12)}}
    if(quality)for(let n=0;n<34;n++){
      const a=n*2.39996+t*.14,r=35+(n*17)%38,px=Math.cos(a)*r,py=Math.sin(a)*r;
      c.globalAlpha=.25+.3*Math.sin(t*1.7+n)**2;path(`M${px-1.4} ${py}h2.8M${px} ${py-1.4}v2.8`,null,n%2?'#fff4bd':'#e2c8ff',.45);
    }
    c.restore();
  }
  return {draw};
})();
if(typeof globalThis!=='undefined')globalThis.RegentArt=RegentArt;
