'use strict';
const BalloonPopModel=(()=>{
 const modes={normal:{label:'Normal',multiplier:1,speed:65.6,radius:32,sway:16,frequency:1.8,interval:.82,width:900,colors:['#ff6caa','#9275ec','#46cdb5','#f8bc51','#58b6f1','#ff8366']},hard:{label:'Hard',multiplier:2,speed:90.4,radius:29,sway:31,frequency:2.4,interval:.64,width:900,colors:['#f3bc22','#ffdb43','#eda32b']},merciless:{label:'Merciless',multiplier:3,speed:118.4,radius:23,sway:47,frequency:3.1,interval:.49,width:900,colors:['#ee3c67','#f35c59','#ce305c']},impossible:{label:'Impossible',multiplier:4,speed:146.4,radius:19,sway:63,frequency:3.9,interval:.38,width:1100,colors:['#a46cf2','#eb4b9b','#7859db']}};
 class Run{
  constructor(mode='normal',rng=Math.random){this.mode=mode;this.config=modes[mode]||modes.normal;this.rng=rng;this.width=this.config.width;this.height=650;this.time=0;this.score=0;this.lives=5;this.combo=0;this.bestCombo=0;this.popped=0;this.missed=0;this.quick=0;this.balloons=[];this.events=[];this.untilSpawn=.12;this.lastPop=-10;this.serial=0;this.over=false;}
  get weighted(){return this.score*this.config.multiplier;}
  get interval(){return Math.max(.13,this.config.interval/(1+this.time/42));}
  spawn(){const c=this.config,margin=c.radius+c.sway+14;this.balloons.push({id:++this.serial,baseX:margin+this.rng()*(this.width-margin*2),x:0,y:this.height+c.radius*.5,radius:c.radius,born:this.time,phase:this.rng()*Math.PI*2,speed:c.speed*(.9+this.rng()*.2)*(.6+this.time/95),color:c.colors[Math.floor(this.rng()*c.colors.length)],star:this.serial%12===0});const b=this.balloons.at(-1);b.x=b.baseX+Math.sin(b.phase)*c.sway;}
  tick(dt){if(this.over)return;dt=Math.min(.1,Math.max(0,dt));this.time+=dt;this.untilSpawn-=dt;while(this.untilSpawn<=0){this.spawn();this.untilSpawn+=this.interval;}
   if(this.time-this.lastPop>1.35)this.combo=0;
   for(const b of this.balloons){b.y-=b.speed*dt;b.x=b.baseX+Math.sin((this.time-b.born)*this.config.frequency+b.phase)*this.config.sway;}
   const escaped=this.balloons.filter(b=>b.y+b.radius*1.2<0);this.balloons=this.balloons.filter(b=>b.y+b.radius*1.2>=0);
   for(const b of escaped){if(this.over)break;this.lives--;this.missed++;this.combo=0;this.events.push({type:'miss',x:b.x,y:25});if(this.lives<=0){this.over=true;this.events.push({type:'over'});}}
  }
  pop(x,y,padding=0){if(this.over)return false;const targets=[...this.balloons].reverse(),pad=Number.isFinite(padding)?Math.max(0,Math.min(72,padding)):0,hit=(b,p)=>((x-b.x)/(b.radius+p))**2+((y-b.y)/(b.radius*1.2+p))**2<=1;const b=targets.find(b=>hit(b,0))||(pad?targets.find(b=>hit(b,pad)):null);if(!b){this.combo=0;this.events.push({type:'empty',x,y});return false;}
   this.balloons.splice(this.balloons.indexOf(b),1);this.combo=this.time-this.lastPop<=1.35?this.combo+1:1;this.lastPop=this.time;this.bestCombo=Math.max(this.bestCombo,this.combo);this.popped++;
   const quick=this.time-b.born<.8,bonus=Math.min(20,Math.floor(this.combo/5)*3),points=10+(quick?5:0)+bonus+(b.star?25:0);if(quick)this.quick++;this.score+=points;this.events.push({type:'pop',x:b.x,y:b.y,color:b.color,points,quick,star:b.star,combo:this.combo});return true;
  }
 }
 return {modes,Run};
})();
if(typeof module!=='undefined')module.exports=BalloonPopModel;
