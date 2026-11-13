"use strict";
// World-space scenery, shared by campaign and theater; never changes collision geometry.
const BossArena=(()=>{
  const TAU=Math.PI*2;
  function draw(c,{level,bounds,time=0,phase=1,reduced=false,radius=null}){
    const [left,right,bottom,top]=bounds,w=right-left,h=top-bottom,t=reduced?0:time;
    const power=(level-1)/19,beat=BossAudio.profiles[level-1].bpm/60;
    const pulse=reduced?.5:.5+.5*Math.sin(t*beat*Math.PI*.5);
    const hue=(level*47+t*7)%360,cx=(left+right)/2,cy=-(top+bottom)/2;
    c.save();c.beginPath();if(radius)c.arc(0,0,radius,0,TAU);else c.rect(left,-top,w,h);c.clip();c.translate(cx,cy);
    c.fillStyle='rgba(3,6,20,.45)';c.fillRect(-w/2,-h/2,w,h);
    const glow=c.createRadialGradient(0,0,20,0,0,w*.67);
    glow.addColorStop(0,'#090e2444');glow.addColorStop(.6,`hsla(${hue},75%,24%,.5)`);glow.addColorStop(1,`hsla(${hue+90},80%,35%,.6)`);
    c.fillStyle=glow;c.fillRect(-w/2,-h/2,w,h);
    // Breathing kaleidoscope tunnel: progressively deeper, with more colorful lobes.
    const layers=5+level,lobes=3+level%6;
    for(let n=layers-1;n>=0;n--){
      const travel=((n/layers+t*(.018+power*.012))%1),radius=35+travel*w*.8;
      c.beginPath();
      for(let j=0;j<=96;j++){
        const a=j*TAU/96,twist=t*.08*(n%2?1:-1)+level*.21;
        const r=radius*(1+(.035+power*.09)*Math.sin(a*lobes+twist));
        const x=Math.cos(a+twist*.2)*r,y=Math.sin(a+twist*.2)*r*.65;
        if(j===0)c.moveTo(x,y);else c.lineTo(x,y);
      }
      c.closePath();c.strokeStyle=`hsla(${hue+n*(8+power*13)},85%,${42+pulse*10}%,${(.12+power*.14)*(1-travel*.6)})`;
      c.lineWidth=1+power*1.5+pulse*.7;c.stroke();
    }
    // Flowing aurora ribbons are concentrated near the edges of the arena.
    for(let n=0;n<2+Math.floor(level/4);n++){
      c.beginPath();const side=n%2?1:-1;
      for(let j=0;j<=48;j++){
        const x=-w/2+j*w/48;
        const y=side*h*(.34+.05*Math.sin(j*.13+t*.4+n))+Math.sin(j*.18-t*.6+n*1.7)*(14+power*18);
        if(j===0)c.moveTo(x,y);else c.lineTo(x,y);
      }
      c.strokeStyle=`hsla(${hue+n*39+70},85%,58%,${.12+power*.09})`;c.lineWidth=9+power*12;c.stroke();
      c.strokeStyle=`hsla(${hue+n*39+90},85%,74%,.25)`;c.lineWidth=1;c.stroke();
    }
    // Each arena has a different constellation; later fights add orbiting starbursts.
    for(let n=0;n<18+level*3;n++){
      const angle=n*2.39996+level+t*.025,r=80+(n*73%(w*.65));
      const x=Math.cos(angle)*r,y=Math.sin(angle)*r*.7,star=1+(n%5===0?power*3:0);
      c.fillStyle=`hsla(${hue+n*17},80%,80%,${.14+.15*pulse})`;c.fillRect(x-star/2,y-star/2,star,star);
      if(level>=10&&n%7===0){c.strokeStyle=c.fillStyle;c.lineWidth=.7;c.beginPath();c.moveTo(x-4,y);c.lineTo(x+4,y);c.moveTo(x,y-4);c.lineTo(x,y+4);c.stroke();}
    }
    if(level===20){
      // The Regent's arena becomes a rotating celestial clock, behind all hazards.
      c.save();c.rotate(t*.035);c.strokeStyle='#f7dba333';c.lineWidth=1;
      const r=Math.min(w,h)*.44;
      for(let n=0;n<19;n++){
        const a=n*TAU/19,x=Math.cos(a)*r,y=Math.sin(a)*r;
        c.beginPath();c.moveTo(x,y);c.lineTo(Math.cos(a+TAU*7/19)*r,Math.sin(a+TAU*7/19)*r);c.stroke();
        c.save();c.translate(x,y);c.rotate(a+t*.06);c.strokeStyle=`hsla(${n*19+t*6},80%,75%,.38)`;c.strokeRect(-4,-4,8,8);c.restore();
      }
      c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();c.restore();
    }
    // Dark center preserves projectile / yellow-warning contrast at every tier.
    const shade=c.createRadialGradient(0,0,w*.1,0,0,w*.55);shade.addColorStop(0,'#050a1855');shade.addColorStop(1,'#050a1800');c.fillStyle=shade;c.fillRect(-w/2,-h/2,w,h);
    c.strokeStyle=`hsla(${hue+phase*25},90%,70%,${.4+pulse*.2})`;c.lineWidth=2+phase;if(radius){c.beginPath();c.arc(0,0,radius-3,0,TAU);c.stroke();}else c.strokeRect(-w/2+3,-h/2+3,w-6,h-6);
    c.restore();
  }
  return {draw};
})();
if(typeof globalThis!=='undefined')globalThis.BossArena=BossArena;
