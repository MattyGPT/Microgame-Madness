"use strict";
// Original cel-shaded films with depth layers, staged reveals and timed action beats.
const BossFilm=(()=>{
  const duration=14,TAU=Math.PI*2;
  const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)},noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
  const stories=[
    ['SIGNAL DETECTED','THE GRID AWAKENS','SENTINEL ONLINE','The circuit remembers every step.'],
    ['BELOW THE FOUNDRY','CHAINS UNDER STRAIN','IRON TAKES A BREATH','Forged in a furnace that never sleeps.'],
    ['AN EMPTY BLUEPRINT','THE LINES CONVERGE','A PERFECT TRAP','There is no angle it has not considered.'],
    ['THE FROZEN THRONE','A CRACK IN ETERNITY','WINTER RISES','Even the light has learned to freeze.'],
    ['A SINGLE PETAL','THE FIRST HEARTBEAT','THE REACTOR BLOOMS','Beautiful things can still be dangerous.'],
    ['BEFORE THE STORM','THE BATON RISES','THUNDER ANSWERS','Every bolt is part of the score.'],
    ['FOOTSTEPS IN ASH','THE EXHAUST IGNITES','NOTHING WILL STOP IT','The city shakes before it arrives.'],
    ['A THOUSAND DOORS','ONE IMPOSSIBLE KEY','THE KEEPER TURNS','The way out has changed.'],
    ['A STILL REFLECTION','THE MIRROR BLINKS','REALITY FRACTURES','Which one was looking at you first?'],
    ['CONTAINMENT CHAMBER','THE RINGS UNLOCK','CRITICAL MASS','The warning came too late.'],
    ['UNDER THE SURFACE','A SHADOW BELOW','THE OCEAN RISES','An entire reef has begun to move.'],
    ['ONE LAST SECOND','THE HAND TURNS BACK','MIDNIGHT ARRIVES','Time is a debt it intends to collect.'],
    ['THE SILENT CANOPY','ROOTS LEAVE THE EARTH','THE FOREST STANDS','That was never a mountain.'],
    ['BLACK GLASS','THE FIRST FRACTURE','STONE BREAKS FREE','Something inside the mountain is angry.'],
    ['THE EMPTY OBSERVATORY','A STAR MOVES','THE HEAVENS POINT DOWN','Your position has been written in the stars.'],
    ['AT THE STARTING LINE','RED BECOMES VIOLET','FULL THROTTLE','There will be no second lap.'],
    ['A BOOK UNDERWATER','THE INK RISES','THE ARCHIVE OPENS','Some stories refuse to end.'],
    ['A PALACE IN THE HEAT','THE WORLD SHIMMERS','THE VEIL LIFTS','The crown is real. Everything else is negotiable.'],
    ['THE EMPTY CATHEDRAL','ONE IMPOSSIBLE NOTE','THEN SILENCE','The last thing you hear is your own heartbeat.'],
    ['NINETEEN FALLEN WORLDS','A THRONE ASSEMBLES','THE CROWN RETURNS','The end of every road has been waiting here.'],
  ];
  function line(c,pts,color,width=1){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke()}
  function circle(c,x,y,r,fill,stroke,width=1){if(r<=0)return;c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
  function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');circle(c,x,y,r,g)}
  function polygon(c,x,y,r,n,fill,stroke,angle=0){c.beginPath();for(let i=0;i<n;i++){const a=angle+i*TAU/n;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}}
  function environment(c,b,t,w,h,reduced){
    const a=b.color,seed=b.level*57;
    const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#030610');sky.addColorStop(.6,'#151c30');sky.addColorStop(1,'#050a14');c.fillStyle=sky;c.fillRect(0,0,w,h);
    glow(c,w*.56,h*.4,w*.5,a+'30');glow(c,w*.2,h*.2,w*.35,'#72559a18');
    // Three depth planes: distant architecture, lit middle ground, foreground debris.
    for(let layer=0;layer<3;layer++){
      const drift=(reduced?0:Math.sin(t*.12+b.level))*(layer+1)*8;
      c.save();c.translate(drift,0);c.globalAlpha=.35+layer*.2;
      for(let n=0;n<14;n++){
        const x=n*w/13-20,y=h*(.28+noise(n+seed)*.28),height=h-y;
        c.fillStyle=layer===0?'#1d273c':layer===1?'#111b2c':'#08101c';
        if(['circuit','forge','cinder','racer','engine'].includes(b.theme)){
          c.fillRect(x,y+layer*65,32+noise(n)*30,height);c.strokeStyle=a+'25';c.strokeRect(x,y+layer*65,32+noise(n)*30,height);
          for(let j=0;j<5;j++){c.fillStyle=a+(j%2?'22':'55');c.fillRect(x+7,y+layer*65+14+j*24,3,9)}
        }else if(['ice','basalt','tree','coral'].includes(b.theme)){
          c.beginPath();c.moveTo(x-45,h);c.lineTo(x,y+layer*45);c.lineTo(x+noise(n+7)*75,h);c.fill();line(c,[[x,y+layer*45],[x+10,h]],a+'25',1);
          if(b.theme==='tree'||b.theme==='coral')for(let j=0;j<4;j++)line(c,[[x,y+layer*45+j*37],[x+(j%2?35:-35),y+layer*45+j*37-20]],a+'33',4-layer);
        }else if(['moon','book','cantor','sun','regent'].includes(b.theme)){
          c.fillRect(x,y+layer*45,14,height);c.beginPath();c.moveTo(x,y+layer*45);c.quadraticCurveTo(x+28,y-70+layer*45,x+56,y+layer*45);c.strokeStyle=a+'30';c.lineWidth=3;c.stroke();
        }else{
          const radius=60+n*24;c.save();c.translate(w/2,h*.44);c.scale(1,.47);c.rotate(n*.08+(reduced?0:t*.025));polygon(c,0,0,radius,b.theme==='array'?3:b.theme==='prism'?5:12,null,a+'20');c.restore();
        }
      }c.restore();
    }
    // A lit floor places the character in a world rather than on a flat title card.
    const floor=c.createLinearGradient(0,h*.62,0,h);floor.addColorStop(0,'#101a2c00');floor.addColorStop(1,'#02050bee');c.fillStyle=floor;c.fillRect(0,h*.6,w,h*.4);
    for(let n=0;n<10;n++){const y=h*.62+(n/10)**2*h*.38;line(c,[[0,y],[w,y]],a+'13')}
    for(let n=-8;n<=8;n++)line(c,[[w*.5,h*.62],[w*.5+n*w*.16,h]],a+'13');
    const organic=['coral','rose','tree','book'].includes(b.theme);
    for(let n=0;n<110;n++){
      const depth=.25+noise(n+seed)*.75,x=(noise(n+33+seed)*w+(reduced?0:t*(organic?8:15)*depth))%w;
      const y=(noise(n+110)*h+(reduced?0:t*(b.theme==='coral'?-12:8)*depth)+h*2)%h;
      c.globalAlpha=.15+depth*.35;
      if(n%7===0)glow(c,x,y,3+depth*3,a+'77');else circle(c,x,y,.5+depth,a);
    }c.globalAlpha=1;
  }
  function setpiece(c,b,t,w,h,reduced){
    const a=b.color,p=ease((t-1)/4),pulse=reduced?1:.75+.25*Math.sin(t*2),cx=w*.52,cy=h*.46;
    c.save();
    switch(b.theme){
      case 'circuit':for(let n=0;n<10;n++){const y=h*.15+n*h*.07;line(c,[[0,y],[w*.2,y],[w*.3,y+35],[cx,y+35]],a+'88',2);glow(c,(t*170+n*70)%w,y,12,a+'88')}break;
      case 'forge':case 'cinder':for(const side of [-1,1]){const x=cx+side*w*.23;for(let n=0;n<12;n++){circle(c,x,n*28-(reduced?0:t*20)%28,9,null,'#8e91a6',3)}glow(c,x,h*.7,120,'#ff642655');for(let n=0;n<25;n++){const y=h*.8-((t*90+n*37)%280);line(c,[[x+Math.sin(n)*65,y],[x+Math.sin(n)*65+3,y-8]],'#ffd290',1)}}break;
      case 'array':for(let n=0;n<8;n++){polygon(c,cx,cy,80+n*25,3,null,a+'66',t*.09+n*.12);line(c,[[cx-250,cy+n*20-70],[cx+250,cy+n*20-70]],a+'22')}break;
      case 'ice':for(let n=0;n<12;n++){const angle=n*TAU/12;line(c,[[cx,cy],[cx+Math.cos(angle)*120,cy+Math.sin(angle)*120],[cx+Math.cos(angle+.15)*280*p,cy+Math.sin(angle+.15)*280*p]],'#e4fcff66',1.5)}glow(c,cx,cy,190,a+'30');break;
      case 'rose':for(let n=0;n<16;n++){const angle=n*TAU/16+t*.08;c.save();c.translate(cx,cy);c.rotate(angle);c.beginPath();c.ellipse(0,-130*p,30,90,0,0,TAU);c.fillStyle=a+'22';c.fill();c.strokeStyle=a+'66';c.stroke();c.restore()}glow(c,cx,cy,90*pulse,a+'66');break;
      case 'volt':for(let n=0;n<8;n++){const x=n*w/7;let points=[[x,0]];for(let j=1;j<8;j++)points.push([x+Math.sin(j*7+n+t*3)*25,j*h/8]);line(c,points,a+'66',2);line(c,points,'#ffffdf77',.6)}break;
      case 'moon':case 'book':case 'cantor':for(let n=0;n<5;n++){const z=.5+n*.3+(reduced?0:t*.04);c.save();c.translate(cx,cy);c.scale(z,z);c.beginPath();c.moveTo(-120,200);c.lineTo(-120,-80);c.quadraticCurveTo(0,-260,120,-80);c.lineTo(120,200);c.strokeStyle=a+'55';c.lineWidth=2;c.stroke();if(b.theme==='book'){for(let j=0;j<4;j++)line(c,[[-80,j*30],[80,j*30-8]],a+'44')}c.restore()}break;
      case 'prism':for(let n=0;n<9;n++){const angle=n*TAU/9,r=150+(1-p)*160;polygon(c,cx+Math.cos(angle)*r,cy+Math.sin(angle)*r,45,3,a+'11',a+'99',angle+t*.1)}break;
      case 'engine':case 'clock':for(let n=0;n<3;n++){c.save();c.translate(cx,cy);c.rotate((n%2?-1:1)*t*.13);c.scale(1,.65+n*.15);circle(c,0,0,100+n*45,null,a+'88',3);for(let j=0;j<24;j++){const angle=j*TAU/24;line(c,[[Math.cos(angle)*(94+n*45),Math.sin(angle)*(94+n*45)],[Math.cos(angle)*(106+n*45),Math.sin(angle)*(106+n*45)]],a+'88',2)}c.restore()}break;
      case 'coral':for(let n=0;n<9;n++){const y=h*.5+n*20;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(w*.3,y+Math.sin(t+n)*50,w*.6,y-30,w,y);c.strokeStyle=a+'55';c.lineWidth=2;c.stroke();}for(let n=0;n<30;n++)circle(c,noise(n)*w,(h-(t*40+n*27)%h),3+n%4,null,a+'66');break;
      case 'tree':for(let n=0;n<10;n++){const x=n*w/9;line(c,[[x,h],[cx+(x-cx)*.6,h*.65],[cx+(x-cx)*.4,h*.5]],a+'66',4);polygon(c,x,((t*20+n*73)%h),9,4,a+'44',a+'55',n)}break;
      case 'basalt':for(let n=0;n<10;n++){const x=n*w/9;line(c,[[x,h],[x-30,h*.7],[x+35,h*.55],[x,h*.35]],'#ffb36c77',2)}break;
      case 'stars':for(let n=0;n<12;n++){const angle=n*TAU/12+t*.1,x=cx+Math.cos(angle)*240,y=cy+Math.sin(angle)*150;glow(c,x,y,12,a+'88');if(n%2===0)line(c,[[x,y],[cx+Math.cos(angle+1)*240,cy+Math.sin(angle+1)*150]],a+'55')}break;
      case 'racer':for(let n=0;n<22;n++){const x=((t*600+n*57)%w),y=h*.25+n*h*.025;line(c,[[x,y],[x-180,y+12]],n%2?a+'55':'#ffffff44',2)}break;
      case 'sun':glow(c,cx,cy,250,'#ffcd6855');for(let n=0;n<18;n++){const angle=n*TAU/18+t*.05;line(c,[[cx+Math.cos(angle)*110,cy+Math.sin(angle)*110],[cx+Math.cos(angle)*270,cy+Math.sin(angle)*270]],a+'44',3)}break;
      case 'regent':for(let n=0;n<19;n++){const angle=n*TAU/19+t*.08,r=190+(1-p)*180;polygon(c,cx+Math.cos(angle)*r,cy+Math.sin(angle)*r*.7,13+n%4*3,3+n%5,GeomayhemBosses.catalog[n].color+'55',GeomayhemBosses.catalog[n].color,angle)}break;
    }c.restore();
  }
  function signature(c,b,t,w,h){
    if(t<8||t>10.8)return;
    const p=ease((t-8)/2.8),a=b.color,x=w*.52,y=h*.45,r=45+p*320;
    c.save();c.globalAlpha=Math.sin(Math.PI*p)*.8;
    const ray=(angle,length,color=a)=>{const end=[x+Math.cos(angle)*length,y+Math.sin(angle)*length*.65];line(c,[[x,y],end],color,2+p*3);glow(c,...end,10,color+'99')};
    switch(b.theme){
      case 'circuit':for(let j=0;j<7;j++){const yy=h*.2+j*50;line(c,[[0,yy],[w*p,yy]],a,2);circle(c,w*p,yy,5,'#fff')}break;
      case 'forge':c.save();c.translate(x,h*p*.8);c.rotate(-.4+p*.4);c.fillStyle='#d7a876';c.fillRect(-8,-190,16,180);c.fillStyle='#fff1cf';c.fillRect(-65,-30,130,55);c.restore();circle(c,x,h*.75,r,null,a,4);break;
      case 'array':for(let j=0;j<6;j++){polygon(c,x,y,r+j*17,3,null,a,p*2+j*.12)}break;
      case 'ice':for(let j=0;j<11;j++){const xx=j*w/10;c.beginPath();c.moveTo(xx-25,h*.8);c.lineTo(xx,h*.8-r*(.5+noise(j)));c.lineTo(xx+25,h*.8);c.closePath();c.fillStyle=a+'66';c.fill();c.strokeStyle='#efffff';c.stroke()}break;
      case 'rose':for(let j=0;j<20;j++){const angle=j*TAU/20+p*2;c.save();c.translate(x+Math.cos(angle)*r,y+Math.sin(angle)*r*.65);c.rotate(angle);c.fillStyle=a;c.beginPath();c.ellipse(0,0,18,6,0,0,TAU);c.fill();c.restore()}break;
      case 'volt':for(let j=0;j<9;j++){const xx=j*w/8;line(c,[[x,y],[xx+35,h*.3],[xx-20,h*.55],[xx,h]],a,4);line(c,[[x,y],[xx+35,h*.3],[xx-20,h*.55],[xx,h]],'#fff',1)}break;
      case 'cinder':for(let j=0;j<7;j++){const xx=x+(j-3)*80;glow(c,xx,h*.7,35+p*60,'#ff883399');line(c,[[xx,h*.8],[xx,h*.8-r]],'#ffc277',5)}break;
      case 'moon':for(let j=0;j<5;j++){const xx=j*w/4;circle(c,xx,y,r*.35,null,a,4);circle(c,xx+12,y-7,r*.28,null,'#ffffff',1)}break;
      case 'prism':for(let j=0;j<5;j++){c.globalAlpha=Math.sin(Math.PI*p)*.35;GeomayhemBosses.portrait(c,b.level,x+Math.cos(j*TAU/5)*r,y+Math.sin(j*TAU/5)*r*.6,55+p*25,t,1)}break;
      case 'engine':for(let j=0;j<12;j++)ray(j*TAU/12+p,r*1.5);circle(c,x,y,r,null,'#fff',3);break;
      case 'coral':for(let j=0;j<8;j++){c.beginPath();c.ellipse(x,y,r+j*18,(r+j*18)*.35,0,0,TAU);c.strokeStyle=a;c.lineWidth=3;c.stroke()}break;
      case 'clock':for(let j=0;j<12;j++){ray(j*TAU/12,r);c.fillStyle='#fff0c3';c.font='20px serif';c.textAlign='center';c.fillText(String(j+1),x+Math.cos(j*TAU/12)*r,y+Math.sin(j*TAU/12)*r*.65)}break;
      case 'tree':for(let j=0;j<9;j++){const xx=j*w/8;line(c,[[xx,h],[xx+30,h*.8-r*.5],[xx-20,h*.8-r]],a,8);line(c,[[xx+30,h*.8-r*.5],[xx+65,h*.7-r*.6]],a,4)}break;
      case 'basalt':for(let j=0;j<13;j++){const angle=j*TAU/13;polygon(c,x+Math.cos(angle)*r,y+Math.sin(angle)*r*.65,12+j%3*9,5,'#302b32','#ffad70',angle+p)}break;
      case 'stars':for(let j=0;j<9;j++){const xx=noise(j+9)*w,yy=p*h+j*23-h*.2;line(c,[[xx-60,yy-100],[xx,yy]],a,2);glow(c,xx,yy,18,'#ffffffaa')}break;
      case 'racer':for(let j=0;j<4;j++){const xx=p*w*1.6-j*120;line(c,[[xx-300,h*.6+j*17],[xx,h*.45+j*17]],a,6);glow(c,xx,h*.45+j*17,22,'#ffddff99')}break;
      case 'book':for(let j=0;j<18;j++){const angle=j*TAU/18+p;const xx=x+Math.cos(angle)*r,yy=y+Math.sin(angle)*r*.65;c.save();c.translate(xx,yy);c.rotate(angle);c.fillStyle='#bed8ee';c.fillRect(-12,-16,24,32);for(let k=0;k<4;k++)line(c,[[-8,-9+k*5],[8,-9+k*5]],'#233f66',1);c.restore()}break;
      case 'sun':for(let j=0;j<18;j++)ray(j*TAU/18,r*1.4,'#fff0af');glow(c,x,y,r,'#ffcf7755');break;
      case 'cantor':for(let j=0;j<5;j++){c.save();c.translate(x,y);c.scale(1,.55);circle(c,0,0,r+j*23,null,a,2);c.restore()}line(c,[[x,0],[x,h]],'#eee4ff',5);break;
      case 'regent':for(let j=0;j<19;j++){const angle=j*TAU/19;ray(angle,r,GeomayhemBosses.catalog[j].color);polygon(c,x+Math.cos(angle)*r,y+Math.sin(angle)*r*.65,12,4,GeomayhemBosses.catalog[j].color,'#fff',angle)}break;
    }c.restore();
  }
  function draw(c,level,seconds,reduced=false){
    const b=GeomayhemBosses.catalog[level-1],w=c.canvas.width,h=c.canvas.height,t=reduced?12:Math.min(duration,seconds),story=stories[level-1];
    c.save();environment(c,b,reduced?0:t,w,h);setpiece(c,b,reduced?5:t,w,h,reduced);
    const chapter=t<2.5?0:t<5.2?1:t<10.8?2:3;
    let size=h*.28,x=w*.52,y=h*.48,alpha=1;
    if(t<2.5){size=h*.16;alpha=.12+.25*ease(t/2.5);y=h*.52;}
    else if(t<5.2){const p=ease((t-2.5)/2.7);size=h*(.18+.15*p);y=h*(.65-.17*p);alpha=.4+.6*p;}
    else if(t<8){size=h*(.62-.07*ease((t-5.2)/2.8));x=w*(.47+.06*Math.sin(level));y=h*.62;}
    else if(t<10.8){const p=ease((t-8)/2.8);size=h*(.36-.04*p);x=w*(.4+.12*p);y=h*.46;}
    else{size=h*.32;y=h*.44;}
    if(level===20){
      // The final encounter gets its own coronation stage and cinematic lighting.
      c.save();
      for(let n=0;n<7;n++){
        const xx=w*(.14+n*.12),drift=reduced?0:Math.sin(t*.3+n)*18;
        const light=c.createLinearGradient(xx,0,xx,h*.8);light.addColorStop(0,'#e4d5ff22');light.addColorStop(1,'#edc57e00');
        c.fillStyle=light;c.beginPath();c.moveTo(xx-6,0);c.lineTo(xx+6,0);c.lineTo(xx+80+drift,h*.8);c.lineTo(xx-80+drift,h*.8);c.closePath();c.fill();
      }
      c.translate(w*.52,h*.74);c.scale(1,.24);
      for(let n=0;n<4;n++){circle(c,0,0,110+n*33,null,n%2?'#baa3ed66':'#ffe5a688',2);}
      for(let n=0;n<19;n++){const a=n*TAU/19+(reduced?0:t*.08);polygon(c,Math.cos(a)*190,Math.sin(a)*190,8,4,GeomayhemBosses.catalog[n].color+'99','#fff2bb88',a);}
      c.restore();
      if(t>=10.8){size=h*.28;y=h*.46;}
    }
    // The impact shot has controlled camera motion, not repeated flashing.
    if(!reduced&&t>=8&&t<8.35){x+=Math.sin(t*50)*5*(1-(t-8)/.35);y+=Math.cos(t*43)*3;}
    c.globalAlpha=alpha;
    glow(c,x,y,size*1.25,b.color+'33');
    if(t>=5.2&&t<8){c.save();c.beginPath();c.rect(0,h*.2,w,h*.55);c.clip();GeomayhemBosses.portrait(c,level,x,y,size,reduced?0:t,2,reduced);c.restore();}
    else GeomayhemBosses.portrait(c,level,x,y,size,reduced?0:t,level===20&&t>=10.8?3:t>8?2:1,reduced);
    c.globalAlpha=1;
    if(t>8&&t<10.8&&!reduced){const age=t-8;for(let n=0;n<36;n++){const a=n*TAU/36,r=80+age*180;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.65;line(c,[[px,py],[px+Math.cos(a)*35,py+Math.sin(a)*25]],b.color+'77',n%3?1:2)}}
    if(!reduced)signature(c,b,t,w,h);
    if(level===20&&t>=10.8){
      c.save();c.globalAlpha=.35;
      for(let n=0;n<3;n++){
        c.beginPath();for(let j=0;j<=120;j++){const a=j*TAU/120,xx=w*.52+Math.sin(a)*(170+n*24),yy=h*.46+Math.sin(2*a)*(55+n*13);j?c.lineTo(xx,yy):c.moveTo(xx,yy);}
        c.strokeStyle=['#ffe7ae','#cfb8ff','#a6edff'][n];c.lineWidth=.8;c.stroke();
      }c.restore();
    }
    // Foreground atmospheric layers and a vignette unify the composition.
    const vignette=c.createRadialGradient(w*.5,h*.43,h*.2,w*.5,h*.43,w*.65);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#01030be6');c.fillStyle=vignette;c.fillRect(0,0,w,h);
    c.fillStyle='#030610';c.fillRect(0,0,w,h*.085);c.fillRect(0,h*.82,w,h*.18);
    c.textAlign='left';c.font=`600 ${w*.014}px sans-serif`;c.fillStyle=b.color;c.fillText(`${String(level).padStart(2,'0')} / ${b.arena.toUpperCase()}`,w*.04,h*.052);
    c.textAlign='right';c.fillStyle='#adbcd3';c.fillText(story[Math.min(chapter,2)],w*.96,h*.052);
    c.textAlign='center';c.fillStyle='#f3f6ff';c.font=`900 ${w*(chapter===3?.047:.027)}px sans-serif`;
    c.fillText(chapter===3?b.name.toUpperCase():story[Math.min(chapter,2)],w*.5,h*.895,w*.92);
    c.font=`400 ${w*.017}px sans-serif`;c.fillStyle=b.color;c.fillText(chapter===3?story[3]:b.line,w*.5,h*.945,w*.9);
    c.fillStyle=b.color+'88';c.fillRect(w*.04,h*.985,w*.92*clamp(t/duration),2);
    c.restore();
  }
  return {draw,duration,stories};
})();
if(typeof globalThis!=='undefined')globalThis.BossFilm=BossFilm;
if(typeof module!=='undefined')module.exports=BossFilm;
