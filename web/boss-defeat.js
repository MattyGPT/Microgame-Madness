"use strict";
// Original deterministic defeat films. Every frame is seekable; no random flashing.
const BossDefeat=(()=>{
  const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)},noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
  const stories=[
    ['SIGNAL LOST','The last circuit goes dark.'],['THE FURNACE FALLS SILENT','Iron returns to the fire.'],
    ['BLUEPRINT UNDONE','No perfect shape survives forever.'],['WINTER BREAKS','The frozen crown becomes snow.'],
    ['THE LAST HEARTBEAT','Even a rose can weep.'],['THE FINAL DOWNBEAT','The storm loses its conductor.'],
    ['ASHES TO ASHES','The engines can carry it no farther.'],['ALL DOORS OPEN','The keeper has lost the key.'],
    ['THE REFLECTION BREAKS','For a moment, there is only one sky.'],['CONTAINMENT ENDS','The core burns out.'],
    ['THE TIDE RECEDES','The reef returns to the deep.'],['TIME COMES APART','There will be no next second.'],
    ['THE FOREST RESTS','Its roots finally let go.'],['THE MOUNTAIN OPENS','Nothing remains behind the stone.'],
    ['THE STARS GO FREE','The heavens no longer answer.'],['SYSTEM OVERDRIVE','There was never a finish line.'],
    ['THE LAST PAGE','The sea takes back its stories.'],['THE MIRAGE DISSOLVES','A crown of dust. A throne of light.'],
    ['THE LAST NOTE','And then, at last, silence.'],['INFINITY HAS AN END','Twenty worlds. One last dawn.']
  ];
  const duration=level=>level===20?28:8;
  function line(c,pts,color,width=1){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.stroke()}
  function circle(c,x,y,r,fill,stroke,width=1){if(r<=0)return;c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
  function poly(c,pts,fill,stroke,width=1){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
  function glow(c,x,y,r,color){if(r<=0)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');circle(c,x,y,r,g)}
  function withAlpha(c,a,fn){c.save();c.globalAlpha*=clamp(a);fn();c.restore()}
  function fracture(c,x,y,r,p,color,seed=0){
    for(let n=0;n<8;n++){const a=n*TAU/8+seed*.1,pts=[[x,y]];for(let j=1;j<=8;j++){const d=r*j/8*clamp(p),turn=a+(noise(n*8+j+seed)-.5)*.3;pts.push([x+Math.cos(turn)*d,y+Math.sin(turn)*d]);}line(c,pts,color,1.5);if(n%2===0)line(c,[pts[4],[pts[4][0]+Math.cos(a+.65)*r*.24*p,pts[4][1]+Math.sin(a+.65)*r*.24*p]],color,.8);}
  }
  function stars(c,t,amount=170){for(let n=0;n<amount;n++){const d=.3+noise(n+13)*.7,x=noise(n+2)*960,y=(noise(n+200)*600+t*d*2)%600;withAlpha(c,.18+d*.65,()=>circle(c,x,y,d*1.3,'#d8eaff'));}}
  function backdrop(c,level,t){const color=GeomayhemBosses.catalog[level-1].color,g=c.createLinearGradient(0,0,0,600);g.addColorStop(0,'#02040c');g.addColorStop(.65,'#111b2c');g.addColorStop(1,'#03050c');c.fillStyle=g;c.fillRect(0,0,960,600);stars(c,t,90);glow(c,480,300,370,color+'22');
    for(let n=0;n<11;n++){const x=n*100-25,y=215+noise(n+level*12)*110;poly(c,[[x-25,510],[x,y],[x+40,510]],'#070c17',color+'16');}for(let n=0;n<10;n++)line(c,[[0,410+n*n*1.8],[960,410+n*n*1.8]],color+'12');
  }
  function debris(c,level,t,burst=3.1,cx=480,cy=290,count=90){const p=Math.max(0,t-burst),b=GeomayhemBosses.catalog[level-1];if(!p)return;
    for(let n=0;n<count;n++){const a=noise(n+level*41)*TAU,speed=35+noise(n+92)*135,x=cx+Math.cos(a)*speed*p,y=cy+Math.sin(a)*speed*p+p*p*22,sz=(3+noise(n+33)*9)*(1-clamp(p/6));withAlpha(c,1-clamp(p/5),()=>{c.save();c.translate(x,y);c.rotate(n+p*(noise(n)-.5)*4);const color=n%5===0?'#fff5dd':b.color;
      if(level===12){circle(c,0,0,sz*2,'#1c2332',color,2);for(let k=0;k<8;k++){const aa=k*TAU/8;line(c,[[Math.cos(aa)*sz*1.7,Math.sin(aa)*sz*1.7],[Math.cos(aa)*sz*2.4,Math.sin(aa)*sz*2.4]],color,2)}}
      else if([5,13].includes(level)){c.fillStyle=color;c.beginPath();c.ellipse(0,0,sz*.5,sz*1.5,.4,0,TAU);c.fill()}
      else if(level===17){c.fillStyle='#d9e7f1';c.fillRect(-sz,-sz,sz*2,sz*1.4);line(c,[[-sz*.6,-sz*.5],[sz*.6,-sz*.5]],'#24375a',1)}
      else poly(c,[[-sz,-sz*.5],[sz*.3,-sz],[sz,sz*.8],[-sz*.6,sz]],n%3?color:'#172338','#f5e7cd88');c.restore();});}
  }
  function blast(c,x,y,t,color){if(t<0)return;withAlpha(c,1-clamp(t/2.7),()=>{glow(c,x,y,80+t*180,color+'aa');for(let n=0;n<3;n++)circle(c,x,y,Math.max(0,(t-n*.16)*220),null,n?'#ffe8cc88':color,Math.max(1,8-t*3));glow(c,x,y,Math.max(1,130-t*50),'#ffffffbb');});}
  function standard(c,level,t){const b=GeomayhemBosses.catalog[level-1],breakup=ease((t-2)/1.5);backdrop(c,level,t);
    if(level===5){ // A living, grieving flower: sap, tears, a melting silhouette.
      withAlpha(c,1-ease((t-5.3)/1.8),()=>{c.save();c.translate(480,285+breakup*85);c.scale(1+breakup*.5,1-breakup*.65);GeomayhemBosses.portrait(c,5,0,0,145,t*.3,1);c.restore();});
      c.save();c.translate(480,425);c.scale(1,.22);circle(c,0,0,15+ease(t/6)*180,'#64172d','#db4668',2);glow(c,0,0,180,'#f15f9b44');c.restore();
      for(let n=0;n<24;n++){const age=(t*.7+noise(n)*2)%2,x=480+(noise(n+8)-.5)*(100+breakup*100),y=290+age*70;withAlpha(c,1-ease((t-5)/2),()=>{c.fillStyle=n%4?'#c62f56':'#ff9ab6';c.beginPath();c.ellipse(x,y,2+age,5+age*6,0,0,TAU);c.fill()});}
      withAlpha(c,1-ease((t-4.5)/1.5),()=>{for(const side of [-1,1]){const x=480+side*25;line(c,[[x-10,260],[x,255],[x+10,261]],'#260c29',3);const tear=(t*.8)%1;glow(c,x,265+tear*70,6,'#ffeaffbb');}c.strokeStyle='#50192f';c.lineWidth=3;c.beginPath();c.arc(480,290,13,Math.PI,TAU);c.stroke();});debris(c,level,t,3.7,480,300,35);
    }else if(level===16){ // Over-rev, loss of steering, a visible ground impact.
      const dive=ease((t-2.2)/1.7),x=480+Math.sin(t*5)*12*(1-dive)+dive*180,y=260+dive*180;
      if(t<4){for(let n=0;n<18;n++)line(c,[[x-40-n*15,y+n%3*7],[x-170-n*15,y+n%3*7]],n%2?'#ff427f66':'#9ffcff66',2);c.save();c.translate(x,y);c.rotate(dive*1.3);GeomayhemBosses.portrait(c,16,0,0,140,t*4,3);glow(c,-80,15,50+Math.sin(t*6)*15,'#ff456caa');c.restore();}
      if(t>1&&t<3.7){c.fillStyle='#ff7997';c.font='700 17px monospace';c.textAlign='center';c.fillText('CORE TEMP 999°  /  SYSTEM OVERDRIVE',480,150);}
      fracture(c,650,452,220,ease((t-3.7)/.4),'#ff76d8');blast(c,650,425,t-3.8,b.color);debris(c,level,t,3.8,650,425,110);
    }else if(level===12){
      withAlpha(c,1-ease((t-2.4)/1),()=>GeomayhemBosses.portrait(c,12,480,285,150,t*(1+t),3));
      if(t>1.8)for(let n=0;n<12;n++){const a=n*TAU/12+Math.max(0,t-2)*.4,r=105+ease((t-2)/1.6)*180;withAlpha(c,1-ease((t-4.5)/1.5),()=>{c.font='700 22px serif';c.textAlign='center';c.fillStyle=b.color;c.fillText(n+1,480+Math.cos(a)*r,285+Math.sin(a)*r);});}
      for(let n=0;n<2;n++){const a=t*(n?4:-3),r=(n?75:105)+Math.max(0,t-2.2)*90;withAlpha(c,1-ease((t-4)/2),()=>line(c,[[480,285],[480+Math.cos(a)*r,285+Math.sin(a)*r]],'#fff0c0',5));}blast(c,480,285,t-3.2,b.color);debris(c,level,t,2.8);
    }else unique(c,level,t);
  }
  // Each encounter has its own choreography, rather than a recolored shatter.
  const beats=[
    ['SIGNAL CASCADE','NODES DISCONNECT','POWER DOWN'],['PRESSURE CRITICAL','FURNACE RUPTURE','IRON COOLS'],
    ['ALIGNMENT LOST','GEOMETRY UNTHREADS','BLUEPRINT ERASED'],['THE CROWN THAWS','ICE BECOMES SNOW','WINTER ENDS'],
    ['A HEART IN PAIN','PETALS WEEP','THE LAST HEARTBEAT'],['FEEDBACK RISING','LIGHTNING REBOUNDS','THE STORM IS GROUNDED'],
    ['ENGINES STALL','THE GIANT KNEELS','ASHES RISE'],['THE KEY TURNS','DOORS FALL OPEN','THE MAZE UNLOCKS'],
    ['REFLECTIONS DISAGREE','MIRRORS COLLIDE','ONE LAST PRISM'],['CONTAINMENT FAILS','EMERGENCY VENT','CORE EXHAUSTED'],
    ['THE TIDE RISES','THE LEVIATHAN SINKS','CORAL GOES QUIET'],['HANDS RUN WILD','THE CLOCK COMES APART','TIME STOPS'],
    ['ROOTS RELEASE','THE CANOPY FALLS','A SEED REMAINS'],['THE FAULT OPENS','STONE SPLITS','THE MOUNTAIN SETTLES'],
    ['ORBITS UNBIND','CONSTELLATIONS ESCAPE','AN EMPTY OBSERVATORY'],['SYSTEM OVERDRIVE','STEERING FAILURE','TERMINAL IMPACT'],
    ['THE BOOK OPENS','INK TAKES FLIGHT','THE LAST PAGE SINKS'],['THE SUN SETS','THE PALACE WAS SAND','THE MIRAGE DISSOLVES'],
    ['THE NOTE BREAKS','THE VOID INHALES','ABSOLUTE SILENCE']
  ];
  function unique(c,level,t){
    const color=GeomayhemBosses.catalog[level-1].color,p=ease((t-1.6)/2.8),fade=1-ease((t-5.3)/1.3);
    const actor=(x=480,y=290,size=145,alpha=1,angle=0,sx=1,sy=1)=>withAlpha(c,alpha,()=>{c.save();c.translate(x,y);c.rotate(angle);c.scale(sx,sy);GeomayhemBosses.portrait(c,level,0,0,size,t*.3,3);c.restore();});
    const ellipse=(x,y,rx,ry,fill,stroke)=>{c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}};
    switch(level){
      case 1: { // Circuit nodes fail in sequence; the silhouette loses scanlines.
        for(let n=0;n<8;n++){const x=245+n*67,y=420+(n%2)*30,alive=t<.8+n*.43;
          line(c,[[480,290],[x,330],[x,y]],alive?color:'#24323b',2);circle(c,x,y,8,alive?color:'#172631');
          if(alive)glow(c,x,y,20,color+'66');}
        for(let n=0;n<25;n++)if(t<1.3+n*.15){c.save();c.beginPath();c.rect(320,130+n*13,320,11);c.clip();actor(480+Math.sin(n*19+t*5)*p*18);c.restore();}
        withAlpha(c,ease((t-3.8)/.5)*fade,()=>{line(c,[[350,295],[610,295]],'#efffff',3);glow(c,480,295,45*(1-p)+4,color);});break;
      }
      case 2: { // Foundry shell opens to pour molten iron into its cooling mould.
        for(const side of [-1,1]){c.save();c.translate(side*p*100,p*45);c.beginPath();c.rect(side<0?250:480,100,230,360);c.clip();actor(480,285,145,fade,side*p*.18);c.restore();}
        withAlpha(c,ease(t/2)*fade,()=>{glow(c,480,300,70,'#ffbc4688');poly(c,[[469,280],[491,280],[515+p*55,438],[445-p*55,438]],'#ffad38','#fff1a8');});
        ellipse(480,445,50+p*150,12+p*13,t<5?'#f78036':'#493837','#bb7953');
        for(let n=0;n<30;n++){const a=(t+noise(n)*2)%2;withAlpha(c,fade*(1-a/2),()=>circle(c,410+noise(n+30)*140,430-a*110,2,'#ffd78c'));}break;
      }
      case 3: { // An architect is unbuilt into drafting lines, then erased.
        actor(480,290,145,1-ease((t-1.4)/1.2));
        withAlpha(c,ease(t/1.5)*fade,()=>{for(let n=0;n<12;n++){const a=n*TAU/12,x=480+Math.cos(a)*125*(1-p),y=290+Math.sin(a)*125*(1-p),spread=p*(n-5.5)*31;
          line(c,[[x-35*(1-p)-p*145,y+spread],[x+35*(1-p)+p*145,y+spread]],color,2);
          circle(c,x-35*(1-p)-p*145,y+spread,3,'#fff');}
          line(c,[[310,115],[310,465]],'#dccfff55');line(c,[[300,450],[670,450]],'#dccfff55');});
        if(t>4){const x=300+ease((t-4)/1.7)*380;c.fillStyle='#091020';c.fillRect(295,100,x-295,390);line(c,[[x,110],[x,470]],'#faf0ff',2);}break;
      }
      case 4: { // The frozen ruler liquefies, its crown dissolving into snowfall.
        actor(480,290+p*100,145,fade,0,1+p*.25,1-p*.8);
        ellipse(480,430,30+p*190,8+p*16,'#5cb8cf55',color+'88');
        for(let n=0;n<75;n++){const a=clamp((t-1-noise(n)*2)/4),x=480+(noise(n+81)-.5)*(180+a*350),y=145+noise(n+45)*150+a*a*240;
          withAlpha(c,ease((t-1)/2)*(1-a),()=>{line(c,[[x-3,y],[x+3,y]],'#dbfaff');line(c,[[x,y-3],[x,y+3]],'#dbfaff');});}
        for(let n=0;n<5;n++){const a=n*TAU/5-Math.PI/2;withAlpha(c,fade*p,()=>poly(c,[[480+Math.cos(a)*80,170+Math.sin(a)*30],[476+Math.cos(a)*120,120+Math.sin(a)*30+p*90],[488+Math.cos(a)*80,176+Math.sin(a)*30]],'#c5f6ff88',color));}break;
      }
      case 6: { // Broken conducting arcs rebound into the baton, grounding the storm.
        actor(480,290+p*45,145,fade,Math.sin(t*15)*p*.06);
        for(let n=0;n<6;n++){const x=230+n*100,y=150+Math.sin(n)*45;circle(c,x,y,12*(1-p)+2,'#495232',color);
          const pts=[[x,y]];for(let j=1;j<8;j++)pts.push([x+(480-x)*j/7+(noise(j+n*10)-.5)*35, y+(340-y)*j/7]);withAlpha(c,(.3+.7*Math.sin(t*5+n)**2)*fade,()=>line(c,pts,color,2));}
        if(t>3){line(c,[[480,330],[465,365],[493,390],[480,444]],'#fffec5',4);ellipse(480,449,40+(t-3)*55,8,null,color+'88');}break;
      }
      case 7: { // A heavy chassis kneels; failed stacks vent ash instead of fire.
        const kneel=ease((t-1.2)/2.5);actor(480,290+kneel*120,145,fade,kneel*.55,1,1-kneel*.2);
        line(c,[[270,455],[690,455]],'#cc655455',3);
        for(let n=0;n<60;n++){const a=(t*.35+noise(n)*2)%2,x=430+noise(n+50)*140+Math.sin(a*3+n)*30,y=350-a*120;
          withAlpha(c,clamp(t/2)*(1-a/2)*fade,()=>circle(c,x,y,4+a*12,n%4?'#51464b':'#e77b52'));}
        if(t>3.5){ellipse(480,453,80+ease((t-3.5)/2)*160,16,'#312b30');for(let n=0;n<12;n++)circle(c,380+n*18,445+noise(n)*12,2,'#ff9573');}break;
      }
      case 8: { // The keeper becomes a key; six gates swing outward, freeing the maze.
        actor(480,290,145,1-ease((t-1.4)/1.3),p*.5);
        for(let n=0;n<6;n++){const x=160+n*125,opening=ease((t-1.8-n*.2)/2),w=70*(1-opening);
          c.fillStyle='#020611';c.fillRect(x,205,70,225);c.strokeStyle=color+'66';c.strokeRect(x,205,70,225);
          poly(c,[[x,205],[x+w,205+opening*30],[x+w,430-opening*30],[x,430]],'#27334e',color,2);}
        withAlpha(c,ease(t/1.5)*fade,()=>{c.save();c.translate(480,285);c.rotate(p*Math.PI);circle(c,0,-35,24,null,'#fff0bc',5);line(c,[[0,-11],[0,55],[18,55],[18,42]],'#fff0bc',6);c.restore();});break;
      }
      case 9: { // Two incompatible reflections separate, collide, and leave a broken mirror.
        const separation=t<2.5?ease(t/2.5)*180:180*(1-ease((t-2.5)/1));
        if(t<3.6){actor(480-separation,290,135,.72,0,-1,1);actor(480+separation,290,135,.72);}
        for(let n=0;n<28;n++){const a=n*2.3999,q=Math.max(0,t-3.4),r=30+q*(45+noise(n)*85),x=480+Math.cos(a)*r,y=290+Math.sin(a)*r+q*q*15;
          withAlpha(c,ease(q*4)*fade,()=>poly(c,[[x,y-20],[x+15*Math.cos(q+n),y+15],[x-13,y+5]],`hsla(${n*41} 80% 75% / .35)`,'#ffeaff',1.5));}
        line(c,[[480,160],[480,430]],color+ (t<3.5?'88':'22'));break;
      }
      case 10: { // Containment clamps retract, a vertical vent drains the reactor.
        actor(480,300,145,fade,0,1-p*.35,1-p*.1);
        for(let n=0;n<8;n++){const a=n*TAU/8,r=150+p*100;c.save();c.translate(480+Math.cos(a)*r,300+Math.sin(a)*r);c.rotate(a);poly(c,[[-15,-25],[20,-25],[20,25],[-15,25]],'#293d4c','#c9e9ff',2);c.restore();}
        withAlpha(c,ease((t-1.8)/.8)*fade,()=>{const g=c.createLinearGradient(440,0,520,0);g.addColorStop(0,'transparent');g.addColorStop(.5,'#c3edff');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(440,50,80,300);glow(c,480,300,90*(1-p)+12,'#ffffffaa');});
        for(let n=0;n<6;n++)withAlpha(c,fade,()=>ellipse(480,330-((t*90+n*45)%270),55,12,null,color+'55'));break;
      }
      case 11: { // The leviathan sinks beneath a rising tide; coral polyps close behind it.
        const water=435-p*180;actor(480,275+p*200,155,fade,-p*.2);
        c.fillStyle='#12516eaa';c.fillRect(0,water,960,506-water);
        const wave=[];for(let x=0;x<=960;x+=10)wave.push([x,water+Math.sin(x*.025+t*2)*6]);line(c,wave,'#a3fff0',2);
        for(let n=0;n<38;n++){const y=470-((t*65+n*29)%260);if(y>water)circle(c,340+noise(n+6)*290,y,3+n%5,null,'#b9ffff77');}
        for(let n=0;n<12;n++){const x=230+n*45;line(c,[[x,490],[x,450+p*30],[x-12*(1-p),437+p*43]],color,4);}break;
      }
      case 13: { // The canopy sheds leaves, roots release, and a new seed takes its place.
        actor(480,285+p*115,150,fade,p*.85);
        for(let n=0;n<9;n++){const side=n%2?1:-1,x=480+side*(40+n*20);line(c,[[480,415],[x,430],[x+side*45*(1-p),465-p*45]],'#668a54',6*(1-p)+1);}
        for(let n=0;n<65;n++){const q=clamp((t-noise(n)*2)/5),x=480+(noise(n+9)-.5)*300+Math.sin(q*5+n)*q*95,y=130+noise(n)*100+q*280;withAlpha(c,1-q,()=>{c.save();c.translate(x,y);c.rotate(n+q*5);ellipse(0,0,5,12,n%3?color:'#e9cb78');c.restore();});}
        if(t>4.5){glow(c,480,445,40,'#aaff8a44');ellipse(480,445,7,10,'#dae9a1');line(c,[[480,443],[480,443-ease((t-4.5)/2)*24]],'#9cff9b',2);}break;
      }
      case 14: { // A fault shears the mountain in half and swallows the slabs.
        const fault=ease((t-1.5)/2);poly(c,[[480-fault*130,455],[480,420],[480+fault*130,455],[480,500]],'#010207','#ef945e',2);
        for(const side of [-1,1]){c.save();c.translate(side*fault*90,fault*fault*140);c.beginPath();c.rect(side<0?250:480,80,230,380);c.clip();actor(480,280,155,fade,side*fault*.22);c.restore();}
        fracture(c,480,440,250,fault,'#ffad64',14);
        for(let n=0;n<35;n++){const q=clamp((t-2.5)/3),x=480+(noise(n)-.5)*400*(1-q),y=380+q*90;withAlpha(c,fade*q,()=>circle(c,x,y,8+noise(n+5)*18,'#57444188'));}break;
      }
      case 15: { // Orbits unwind, a telescope folds, constellations flee into open sky.
        actor(480,310,145,fade,p*.7,1-p*.35,1-p*.3);
        for(let n=0;n<12;n++){const a=n*2.399+t*.15*(1-p),r=140+p*(190+noise(n)*120),x=480+Math.cos(a)*r,y=280+Math.sin(a)*r*.65-p*90;
          withAlpha(c,fade,()=>{line(c,[[480,280],[x,y]],color+'33');glow(c,x,y,10,'#caffed88');line(c,[[x-6,y],[x+6,y]],'#e6fff3',2);line(c,[[x,y-6],[x,y+6]],'#e6fff3',2);});}
        for(let n=0;n<3;n++){c.save();c.translate(480,280);c.rotate(n*.8+p);withAlpha(c,(1-p)*.7,()=>ellipse(0,0,180+n*25,60,null,color));c.restore();}break;
      }
      case 17: { // Pages tear free, ink swims upward, the empty book closes and sinks.
        actor(480,280+p*140,145,fade,p*.2,1-p*.65,1);
        for(let n=0;n<32;n++){const q=clamp((t-1-noise(n))/4),x=480+(noise(n+2)-.5)*400*q,y=280-q*210+Math.sin(n+q*6)*20;
          withAlpha(c,ease((t-1)/.8)*(1-q),()=>{c.save();c.translate(x,y);c.rotate(Math.sin(q*5+n)*.8);poly(c,[[-12,-17],[12,-14],[15,18],[-10,15]],'#d6e5e9','#8dbaca');for(let j=0;j<3;j++)line(c,[[-6,-7+j*6],[8,-7+j*6]],'#4c6880');c.restore();});}
        for(let n=0;n<25;n++){const q=(t*.24+noise(n))%1;withAlpha(c,fade*.7,()=>ellipse(480+Math.sin(n+q*5)*100,350-q*210,4+q*9,8+q*18,'#071222'));}
        ellipse(480,460,140,15,'#173a5377');break;
      }
      case 18: { // Heat splits the mirage into bands; every band pours into drifting sand.
        for(let n=0;n<18;n++){const dissolve=ease((t-1.2-n*.07)/2.4);withAlpha(c,1-dissolve,()=>{c.save();c.translate(Math.sin(t*2+n)*dissolve*55,dissolve*80);c.beginPath();c.rect(300,130+n*18,360,16);c.clip();actor();c.restore();});}
        for(let n=0;n<160;n++){const q=clamp((t-1.4-noise(n)*1.5)/3),x=480+(noise(n+20)-.5)*250+q*q*230,y=170+noise(n+60)*200+q*130;
          withAlpha(c,ease(q*5)*(1-ease((t-5.5)/1)),()=>circle(c,x,y,1+noise(n)*2,n%3?color:'#fff0c8'));}
        ellipse(560,460,70+p*160,10,'#ad8a5844');withAlpha(c,(1-p)*.35,()=>glow(c,480,180,110,'#ffe9b2'));break;
      }
      case 19: { // A broken note becomes a black aperture that swallows the choir.
        const pull=ease((t-2)/2.5);actor(480,290,145,1-pull,0,1-pull*.8,1+pull*.4);
        for(let n=0;n<8;n++){const r=(200+n*13)*(1-pull)+2;withAlpha(c,fade,()=>{c.save();c.translate(480,290);c.rotate(n*.4+pull*3);ellipse(0,0,r,r*.4,null,color+'88');c.restore();});}
        if(t>1.5){circle(c,480,290,8+Math.sin(pull*Math.PI)*90,'#000107','#cdb5ff',2);glow(c,480,290,20,'#9278c922');}
        for(let n=0;n<35;n++){const a=n*2.399+pull*3,r=220*(1-pull),x=480+Math.cos(a)*r,y=290+Math.sin(a)*r;withAlpha(c,(1-pull)*ease(t),()=>line(c,[[x,y],[x+Math.cos(a)*18,y+Math.sin(a)*18]],color));}
        if(t>5){const q=ease((t-5)/1);line(c,[[380+q*100,290],[580-q*100,290]],'#f1e7ff',2*(1-q)+.1);}break;
      }
    }
  }

  function world(c,t){const zoom=ease((t-13)/3.7),r=1500*(1-zoom)+180*zoom,cx=480,cy=295;const breaking=ease((t-16.2)/3.2),shatter=ease((t-19.1)/1.4),implode=ease((t-20.7)/2.2);
    glow(c,cx,cy,Math.min(800,r*1.25),'#668aff44');
    if(t<20){c.save();circle(c,cx,cy,r);c.clip();const g=c.createRadialGradient(cx-r*.35,cy-r*.45,r*.03,cx,cy,r);g.addColorStop(0,'#7eacc1');g.addColorStop(.35,'#25465e');g.addColorStop(.7,'#132338');g.addColorStop(1,'#030715');circle(c,cx,cy,r,g);
      for(let n=0;n<18;n++){const a=n*2.3999,rr=Math.sqrt(noise(n+40))*.8*r,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;const points=[];for(let j=0;j<9;j++){const b=j*TAU/9,sz=r*(.07+noise(n*9+j)*.14);points.push([x+Math.cos(b)*sz,y+Math.sin(b)*sz*.65]);}poly(c,points,n%2?'#467b7e':'#31586a','#9acbb33a');for(let j=0;j<9;j++)circle(c,x+(noise(n*9+j)-.5)*r*.2,y+(noise(n*9+j+80)-.5)*r*.1,Math.max(.6,r*.002),'#ffe5a577');}
      c.strokeStyle='#94c6e633';c.lineWidth=1;for(let n=-3;n<=3;n++){c.beginPath();c.ellipse(cx,cy+n*r*.22,Math.sqrt(1-(n*.22)**2)*r,r*.08,0,0,TAU);c.stroke();}
      fracture(c,cx,cy,r*1.08,breaking,'#ffffff',42);fracture(c,cx,cy,r*1.07,breaking,'#b1a1ff',42);glow(c,cx,cy,Math.max(1,breaking*r*.6),'#ffffff88');c.restore();circle(c,cx,cy,r,null,'#c8e8ff66',2);
    }
    if(t>18.8&&t<23.3){for(let n=0;n<64;n++){const a=n*2.39996,base=Math.sqrt(noise(n+19))*175,travel=(base+shatter*(60+noise(n)*160))*(1-implode),x=cx+Math.cos(a+implode*2)*travel,y=cy+Math.sin(a+implode*2)*travel*.92,sz=(10+noise(n+5)*29)*(1-implode);c.save();c.translate(x,y);c.rotate(n+shatter*2-implode*4);poly(c,[[-sz,-sz*.3],[sz*.2,-sz],[sz,sz*.8]],n%3?'#274557':'#658c91',`hsl(${n*19} 80% ${55+breaking*30}%)`,1.2);poly(c,[[-sz,-sz*.3],[sz,sz*.8],[sz*.7,sz*1.1]],'#090d1e','#b0c9ff66',.5);c.restore();}}
    if(t>19){glow(c,cx,cy,50+implode*130,'#d3aaff55');circle(c,cx,cy,Math.max(1,25*Math.sin(implode*Math.PI)), '#01030a','#fff0c9',2);}
  }
  function regent(c,t){c.fillStyle='#02040d';c.fillRect(0,0,960,600);stars(c,t,220);const color=h=>`hsl(${h} 100% 76%)`;
    if(t<14){glow(c,480,290,380,'#6d42bd35');for(let n=0;n<5;n++){c.save();c.translate(480,300);c.rotate(n*.4+t*.02);c.scale(1,.55);circle(c,0,0,160+n*36,null,'#cab8f622',1);c.restore();}
      const collapse=ease((t-11)/2.8),size=205*(1-collapse)+15*collapse,y=300;
      withAlpha(c,1-ease((t-12.4)/1.2),()=>RegentArt.draw(c,480,y,size,t*.35,3,false,{hideOrbiters:true,hideInfinity:t>6,hideWings:t>9.6}));
      const unit=size/60;
      if(t<11){for(const side of [-1,1]){const hue=t*100+side*80;glow(c,480+side*6.5*unit,y-27.5*unit,12,color(hue));line(c,[[480+side*3*unit,y-26*unit],[480+side*10*unit,y-29*unit]],color(hue),4);}
        if(t>2.3)for(const side of [-1,1])for(let n=0;n<4;n++){const progress=ease((t-2.3-n*1.1)/1.1);fracture(c,480+side*(83+n*21),y-45+n*22,52,progress,n%2?'#ffffff':'#cdb5ff',n+side*10);}
        if(t>4.8){const light=ease((t-4.8)/4);c.save();c.globalCompositeOperation='screen';for(let n=0;n<11;n++){const a=n*TAU/11+t*.07,r=70+light*480;poly(c,[[480,300],[480+Math.cos(a-.018)*r,300+Math.sin(a-.018)*r],[480+Math.cos(a+.018)*r,300+Math.sin(a+.018)*r]],n%3?'#dce9ff28':'#ffffff77');}glow(c,480,300,20+light*95,'#ffffffbb');c.restore();}
        if(t>6){c.save();c.textAlign='center';c.font='900 96px serif';for(let n=0;n<3;n++){c.save();c.beginPath();c.rect(420,272+n*20,125,18);c.clip();c.fillStyle=color(n*120+t*30);c.fillText('∞',480+Math.sin(t*8+n*5)*14,330);c.restore();}c.restore();}
      }
      for(let n=0;n<19;n++){const start=9+n*.07,p=ease((t-start)/3),a=n*TAU/19+t*.18+p*4,r=245*(1-p),x=480+Math.cos(a)*r,y=300+Math.sin(a)*r*.72;withAlpha(c,1-ease((t-12.7)/.7),()=>{line(c,[[480+Math.cos(a-.12)*r,300+Math.sin(a-.12)*r*.72],[x,y]],color(n*19),1);glow(c,x,y,10*(1-p)+2,color(n*19));poly(c,[[x,y-7],[x+4,y],[x,y+7],[x-4,y]],color(n*19),'#fff');});}
      if(t>8.4&&t<13)for(let n=0;n<58;n++){const p=ease((t-8.4)/3.6),side=n%2?1:-1,x=480+side*(85+noise(n)*130)*(1-p),y=270+(noise(n+65)-.5)*220+p*60;withAlpha(c,1-p,()=>poly(c,[[x,y],[x+side*20*(1-p),y-45*(1-p)],[x+side*8*(1-p),y+10]],color(n*29),'#fff5ca99'));}
    }
    if(t>12.7&&t<23.4)withAlpha(c,ease((t-12.7)/.6),()=>world(c,t));
    if(t>=22){const p=ease((t-22)/1.8),fade=1-ease((t-25)/2.5);c.save();c.globalCompositeOperation='screen';
      for(let n=0;n<7;n++){const width=(11+n*16)*p,gradient=c.createLinearGradient(480-width,0,480+width,0);gradient.addColorStop(0,'transparent');gradient.addColorStop(.35,`hsla(${n*50} 100% 65% / ${.16*fade})`);gradient.addColorStop(.5,`rgba(255,255,255,${.7*fade})`);gradient.addColorStop(.65,`hsla(${n*50+30} 100% 65% / ${.16*fade})`);gradient.addColorStop(1,'transparent');c.fillStyle=gradient;c.fillRect(480-width,0,width*2,600);}
      for(let n=0;n<5;n++){const q=t-22-n*.33;if(q>0)withAlpha(c,(1-clamp(q/4))*fade,()=>{c.save();c.translate(480,295);c.scale(1,.45+n*.08);circle(c,0,0,q*220,null,color(n*65),4-n*.5);c.restore();});}glow(c,480,295,Math.max(1,p*420),'#ffffff66');c.restore();
      for(let n=0;n<100;n++){const a=noise(n)*TAU,r=(t-22)*(40+noise(n+8)*110);withAlpha(c,fade*.7,()=>line(c,[[480+Math.cos(a)*r,295+Math.sin(a)*r],[480+Math.cos(a)*(r+25),295+Math.sin(a)*(r+25)]],color(n*33),1));}
    }
    if(t>25)for(let n=0;n<7;n++){const pts=[];for(let x=0;x<=960;x+=12)pts.push([x,170+n*25+Math.sin(x*.006+t+n)*25]);withAlpha(c,ease((t-25)/2)*.25,()=>line(c,pts,color(n*45),2));}
  }
  function chapter(level,t){if(level!==20)return t>=6?stories[level-1][0]:beats[level-1][t<2?0:t<4?1:2];return t<3?'THE CROWN FALTERS':t<6?'WINGS OF BROKEN LIGHT':t<9?'INFINITY UNRAVELS':t<13?'NINETEEN WORLDS RETURN':t<17?'BEYOND THE THRONE':t<20?'THE WORLD FRACTURES':t<22?'EVERYTHING FALLS INWARD':t<25?'THE LAST LIGHT':'INFINITY HAS AN END';}
  function draw(c,level,time,reduced=false){const w=c.canvas.width,h=c.canvas.height,t=reduced?duration(level)-.6:Math.min(duration(level),Math.max(0,time));c.save();c.scale(w/960,h/600);
    if(reduced){c.fillStyle='#050915';c.fillRect(0,0,960,600);stars(c,0,100);glow(c,480,285,210,GeomayhemBosses.catalog[level-1].color+'33');circle(c,480,285,105,null,'#f2d7a688',1);c.fillStyle='#eee6ff';c.font='70px serif';c.textAlign='center';c.fillText(level===20?'∞':'◇',480,307);}
    else if(level===20)regent(c,t);else standard(c,level,t);
    const shade=c.createRadialGradient(480,280,160,480,280,620);shade.addColorStop(0,'transparent');shade.addColorStop(1,'#01030ad9');c.fillStyle=shade;c.fillRect(0,0,960,600);
    c.fillStyle='#02040ded';c.fillRect(0,0,960,44);c.fillRect(0,506,960,94);c.fillStyle='#b3bfd5';c.font='600 12px sans-serif';c.textAlign='left';c.fillText(GeomayhemBosses.catalog[level-1].name.toUpperCase(),32,27);c.textAlign='right';c.fillStyle='#ead5a4';c.fillText(chapter(level,t),928,27);
    const end=t>(level===20?25:6);c.textAlign='center';c.fillStyle='#fff3dc';c.font=`800 ${level===20?30:27}px sans-serif`;c.fillText(end?stories[level-1][0]:chapter(level,t),480,547,880);c.fillStyle='#aabbd0';c.font='15px sans-serif';c.fillText(end?stories[level-1][1]:level===20?'THE FINAL SOVEREIGN  /  AFTERMATH':'BOSS DEFEATED',480,576,880);
    c.fillStyle=GeomayhemBosses.catalog[level-1].color;c.fillRect(32,596,896*clamp((reduced?duration(level):time)/duration(level)),2);c.restore();
  }
  const endings=[
    [[0,'glitch'],[.8,'disconnect'],[1.65,'disconnect'],[2.5,'disconnect'],[3.4,'disconnect'],[4.5,'powerdown']],
    [[0,'metal'],[1.8,'metal'],[2.4,'pour'],[4.7,'steam'],[6,'resolve']],
    [[0,'glass'],[1.5,'unthread'],[2.8,'unthread'],[4,'erase'],[6,'resolve']],
    [[0,'ice'],[1.8,'ice'],[2.8,'snow'],[4.2,'water'],[6,'resolve']],
    [[0,'fracture'],[1,'cry'],[2.2,'cry'],[3.7,'water'],[4.5,'cry'],[6,'resolve']],
    [[0,'electric'],[1.2,'electric'],[2.5,'electric'],[3.1,'ground'],[4.6,'powerdown']],
    [[0,'engine'],[1.2,'stall'],[2.8,'metal'],[3.5,'impact'],[4.2,'ash'],[6,'resolve']],
    [[0,'lock'],[1.8,'gate'],[2.2,'gate'],[2.6,'gate'],[3,'gate'],[3.4,'gate'],[4.5,'lock'],[6,'resolve']],
    [[0,'glass'],[1.8,'glass'],[3.4,'mirror'],[4.3,'glass'],[6,'resolve']],
    [[0,'alarm'],[1.1,'alarm'],[1.8,'metal'],[2.2,'vent'],[4.6,'powerdown'],[6,'resolve']],
    [[0,'water'],[1.5,'whale'],[2.8,'bubbles'],[4,'water'],[5,'bubbles'],[6,'resolve']],
    [[0,'fracture'],[1,'tick'],[2.2,'tick'],[3.2,'impact'],[4.5,'debris'],[6,'resolve']],
    [[0,'wood'],[1.5,'wood'],[2.6,'leaves'],[3.5,'wood'],[4.6,'seed'],[6,'resolve']],
    [[0,'stone'],[1.6,'stone'],[2.7,'stone'],[3.5,'impact'],[4.7,'ash'],[6,'resolve']],
    [[0,'celestial'],[1.5,'celestial'],[2.7,'celestial'],[4,'space'],[6,'resolve']],
    [[0,'fracture'],[1,'engine'],[2.2,'engine'],[3.8,'impact'],[4.5,'debris'],[6,'resolve']],
    [[0,'page'],[1.2,'page'],[2.1,'page'],[3.2,'ink'],[4.5,'water'],[6,'resolve']],
    [[0,'mirage'],[1.8,'sand'],[3,'sand'],[4.4,'wind'],[6,'resolve']],
    [[0,'choirbreak'],[1.6,'choirbreak'],[2.5,'void'],[4.2,'void'],[5,'silence']]
  ];
  function audioCues(level){if(level===20)return [[0,'fracture'],[2.4,'crack'],[3.5,'crack'],[4.6,'crack'],[5.8,'rise'],[7,'glitch'],[8.2,'glitch'],[9.5,'implode'],[12.5,'impact'],[14,'space'],[16.4,'crack'],[17.6,'crack'],[19,'impact'],[20.7,'implode'],[22,'ray'],[25,'resolve']];return endings[level-1];}
  function soundBuffer(context,level,kind){const rate=context.sampleRate,length=kind==='ray'?4.8:kind==='cry'?2:kind==='space'?3:kind==='implode'?2.5:kind==='resolve'?2:1.8,buffer=context.createBuffer(2,Math.ceil(rate*length),rate);
    for(let ch=0;ch<2;ch++){let seed=level*713+ch*991+kind.length,low=0;const data=buffer.getChannelData(ch);for(let i=0;i<data.length;i++){seed=(1664525*seed+1013904223)>>>0;const n=seed/2147483648-1,t=i/rate,p=t/length;low+=(n-low)*.025;let v=0,env=Math.min(1,t/.025)*(1-p)**2;
      if(kind==='disconnect')v=Math.sin(TAU*(880*t-260*t*t))*Math.exp(-t*8)*.4+n*Math.exp(-t*20)*.2;
      else if(kind==='powerdown'||kind==='stall')v=(Math.sin(TAU*(180*t-42*t*t))+low)*Math.exp(-t*2)*.3;
      else if(kind==='metal'||kind==='gate'||kind==='lock')v=[173,371,811].reduce((a,f,j)=>a+Math.sin(TAU*f*t)*Math.exp(-t*(j+2))/(j+2),0)*.5+low*.2;
      else if(kind==='pour'||kind==='water'||kind==='bubbles'||kind==='ink')v=low*3+Math.sin(TAU*(210*t+8*Math.sin(t*12)))*Math.exp(-t*2)*.12;
      else if(kind==='steam'||kind==='vent')v=(n-low)*.28*Math.sin(Math.PI*p)+low*.8;
      else if(kind==='glass'||kind==='mirror'||kind==='ice'||kind==='celestial')v=[940,1483,2261,3119].reduce((a,f,j)=>a+Math.sin(TAU*(f+level*7)*t+ch*.1)*Math.exp(-t*(j+1.5))/(j+2),0)*.36;
      else if(kind==='unthread'||kind==='erase')v=Math.sin(TAU*(440*t-90*t*t))*Math.exp(-t*2)*.23+(n-low)*.09;
      else if(kind==='electric'||kind==='ground')v=(n*.22+Math.sin(TAU*60*t)*.15)*(Math.sin(t*45)**2)+low*.6;
      else if(kind==='snow'||kind==='ash'||kind==='leaves'||kind==='page'||kind==='sand'||kind==='wind')v=(n-low)*(.08+.17*Math.sin(t*(kind==='page'?18:5))**2)+low*.9;
      else if(kind==='wood'||kind==='stone')v=low*3*Math.exp(-t*2)+n*Math.exp(-t*20)*.4+Math.sin(TAU*83*t)*Math.exp(-t*5)*.3;
      else if(kind==='seed')v=Math.sin(TAU*(440*t+80*t*t))*Math.exp(-t*2)*.25;
      else if(kind==='whale'||kind==='mirage')v=Math.sin(TAU*(100*t+16*Math.sin(t*2))+ch*.1)*.25+low*.5;
      else if(kind==='alarm')v=Math.sin(TAU*(600*t+20*Math.sin(t*8)))*(.12+.08*Math.sin(t*20));
      else if(kind==='choirbreak'||kind==='void'||kind==='silence')v=[1,1.06,1.5].reduce((a,r,j)=>a+Math.sin(TAU*(130*t-22*t*t)*r+ch*.2)/(j+2),0)*.3*(kind==='silence'?Math.exp(-t*9):1);
      else if(kind==='cry')v=(Math.sin(TAU*(310*t-45*t*t)+Math.sin(t*27)*2)+.3*Math.sin(TAU*620*t))*.22;
      else if(kind==='engine')v=(Math.sin(TAU*(40*t+130*t*t))+.3*Math.sin(TAU*(80*t+250*t*t)))*.3+n*.08;
      else if(kind==='tick'||kind==='crack'||kind==='debris')v=n*Math.exp(-t*17)*.8+Math.sin(TAU*(level===12?820:1700)*t)*Math.exp(-t*7)*.24;
      else if(kind==='glitch')v=(Math.sin(TAU*(180+Math.floor(t*12)%4*140)*t)>.3?1:-1)*Math.exp(-t*5)*.2+n*.1;
      else if(kind==='implode'||kind==='rise')v=(Math.sin(TAU*(55*t+100*t*t))+low*3)*.3*Math.sin(Math.PI*p);
      else if(kind==='space'||kind==='resolve')v=[1,1.25,1.5,2].reduce((a,r,j)=>a+Math.sin(TAU*(level===20?110:130)*r*t+ch*.05)/(j+2),0)*.23;
      else if(kind==='ray')v=(low*4+Math.sin(TAU*55*t)*.25+Math.sin(TAU*220*t+ch*.2)*.1)*Math.sin(Math.PI*p);
      else v=(Math.sin(TAU*(65*t-10*t*t))*Math.exp(-t*3)+low*3+n*Math.exp(-t*20))*.5;
      data[i]=Math.tanh(v*env)*.7;
    }}return buffer;
  }
  return {draw,duration,stories,chapter,audioCues,soundBuffer};
})();
if(typeof globalThis!=='undefined')globalThis.BossDefeat=BossDefeat;
if(typeof module!=='undefined')module.exports=BossDefeat;
