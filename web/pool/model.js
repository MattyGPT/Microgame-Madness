(function(root){
 const W=1000,H=550,R=12,pockets=[[28,28],[500,20],[972,28],[28,522],[500,530],[972,522]];
 class Table{
 constructor(mode=false){this.mode=mode===true||mode==="practice"?"practice":mode==="local"?"local":"bot";this.practice=this.mode==="practice";this.time=0;this.score=0;this.shots=0;this.scratches=0;this.turn=0;this.groups=[null,null];this.breakShot=true;this.shot=null;this.ballInHand=false;this.winner=null;this.message='You break. Pocket a ball or drive four object balls to rails.';this.events=[];this.over=false;this.balls=[{id:0,x:260,y:275,vx:0,vy:0}];const rack=[1,9,2,10,8,3,4,11,5,12,6,13,7,14,15];let index=0;for(let row=0;row<5;row++)for(let col=0;col<=row;col++)this.balls.push({id:rack[index++],x:690+row*22,y:275+(col-row/2)*25,vx:0,vy:0});}
 get moving(){return this.balls.some(b=>Math.hypot(b.vx,b.vy)>2);}
 get cue(){return this.balls.find(b=>b.id===0);}
 playerName(index){return this.mode==="local"?"Player "+(index+1):this.practice?"You (solo)":index===0?"You":"Penguin (bot)";}
 group(id){return id>0&&id<8?'solids':id>8?'stripes':null;}
 legalBalls(){if(this.practice)return this.balls.filter(b=>b.id).map(b=>b.id);const group=this.groups[this.turn];const own=this.balls.filter(b=>this.group(b.id)&&(!group||this.group(b.id)===group));return own.length?own.map(b=>b.id):[8];}
 placeCue(x,y){if(!this.ballInHand||this.moving||x<40||x>960||y<40||y>510||this.balls.some(b=>b.id&&Math.hypot(b.x-x,b.y-y)<26))return false;let cue=this.cue;if(!cue){cue={id:0,vx:0,vy:0};this.balls.unshift(cue);}cue.x=x;cue.y=y;this.ballInHand=false;return true;}
 shoot(angle,power,callBall=null,callPocket=null){if(this.over||this.moving||this.shot||this.ballInHand||!this.cue||!Number.isFinite(angle)||!Number.isFinite(power))return false;
 const legal=this.legalBalls();if(!this.breakShot&&(!legal.includes(callBall)||!Number.isInteger(callPocket)||callPocket<0||callPocket>5))return false;
 this.shot={player:this.turn,first:null,rail:false,rails:new Set(),pots:[],legal,callBall,callPocket,break:this.breakShot};
 const speed=160+Math.max(0,Math.min(1,power))*850;this.cue.vx=Math.cos(angle)*speed;this.cue.vy=Math.sin(angle)*speed;this.shots++;this.events.push({type:'shot'});return true;}
 placeBotCue(){
 if(this.mode!=="bot"||this.turn!==1||!this.ballInHand||this.moving||this.over||this.shot)return false;
 const objects=this.balls.filter(b=>b.id),legal=this.legalBalls();
 const valid=(x,y)=>x>=40&&x<=960&&y>=40&&y<=510&&!objects.some(b=>Math.hypot(b.x-x,b.y-y)<26);
 const clear=(x,y,tx,ty,target)=>{const dx=tx-x,dy=ty-y,d2=dx*dx+dy*dy;if(!d2)return false;return !objects.some(b=>{if(b.id===target)return false;const t=Math.max(0,Math.min(1,((b.x-x)*dx+(b.y-y)*dy)/d2));return Math.hypot(b.x-x-t*dx,b.y-y-t*dy)<26;});};
 let best=null;
 // Set up a straight pot: put the cue behind a legal target, away from its pocket.
 for(const b of objects.filter(b=>legal.includes(b.id)))for(const [px,py] of pockets){
  const distance=Math.hypot(px-b.x,py-b.y);if(!distance||!clear(b.x,b.y,px,py,b.id))continue;
  const nx=(px-b.x)/distance,ny=(py-b.y)/distance;
  for(const gap of [70,110,180,250]){const x=b.x-nx*gap,y=b.y-ny*gap;if(!valid(x,y)||!clear(x,y,b.x-nx*24,b.y-ny*24,b.id))continue;
   const cost=distance+gap;if(!best||cost<best.cost)best={x,y,cost};
  }
 }
 // If no straight pot is available, choose safe space with the clearest nearby target.
 if(!best)for(let x=50;x<=950;x+=30)for(let y=50;y<=500;y+=30){if(!valid(x,y))continue;for(const b of objects.filter(b=>legal.includes(b.id))){const cost=Math.hypot(b.x-x,b.y-y)+(clear(x,y,b.x,b.y,b.id)?0:2000);if(!best||cost<best.cost)best={x,y,cost};}}
 return best?this.placeCue(best.x,best.y):false;
 }

 resolveShot(){const shot=this.shot;if(!shot)return;this.shot=null;this.breakShot=false;
 const scratch=shot.pots.some(p=>p.id===0),eight=shot.pots.find(p=>p.id===8),objects=shot.pots.filter(p=>p.id);
 if(this.practice){this.turn=0;this.groups=[null,null];this.ballInHand=scratch;this.message=scratch?'Solo practice · place the cue ball on clear ice.':'Solo practice · take your next shot.';if(!this.balls.some(b=>b.id)){this.over=true;this.winner=0;this.message='Practice table cleared!';}this.events.push({type:'turn'});return;}

 let foul=scratch?'Cue-ball scratch':shot.first===null?'No object ball hit':!shot.break&&!shot.legal.includes(shot.first)?'Wrong ball hit first':!objects.length&&!shot.rail?'No rail after contact':shot.break&&!objects.length&&shot.rails.size<4?'Illegal break (four object balls must reach rails)':'';
 if(foul&&!scratch)this.events.push({type:'foul',reason:foul,player:shot.player});
 if(eight&&!shot.break){const win=!foul&&shot.legal.includes(8)&&shot.callBall===8&&shot.callPocket===eight.pocket;this.winner=win?shot.player:1-shot.player;this.score=this.winner===0?1:0;this.over=true;this.message=win?'8 ball pocketed legally!':'Illegal 8 ball — rack lost.';return;}
 if(eight&&shot.break){let x=690;while(this.balls.some(b=>Math.hypot(b.x-x,b.y-275)<26)&&x<945)x+=26;this.balls.push({id:8,x,y:275,vx:0,vy:0});}
 const called=shot.pots.find(p=>p.id===shot.callBall&&p.pocket===shot.callPocket);
 if(!foul&&!shot.break&&!this.groups[shot.player]&&called&&this.group(called.id)){this.groups[shot.player]=this.group(called.id);this.groups[1-shot.player]=this.groups[shot.player]==='solids'?'stripes':'solids';}
 const keep=!foul&&(shot.break?objects.length>0:Boolean(called));
 if(!keep)this.turn=1-shot.player;
 if(foul){this.ballInHand=true;this.message=foul+' · '+this.playerName(this.turn)+' ball in hand. Tap clear ice to place the cue ball.';}
 else this.message=(this.playerName(this.turn)+'’s turn')+' · '+(this.groups[this.turn]||'open table')+'. Call a ball and pocket.';
 this.events.push({type:'turn'});
 }
 tick(dt){if(this.over)return;dt=Math.min(dt,.05);this.time+=dt;const steps=Math.max(1,Math.ceil(dt*240));for(let step=0;step<steps;step++){const d=dt/steps;
 for(const b of this.balls){b.x+=b.vx*d;b.y+=b.vy*d;const speed=Math.hypot(b.vx,b.vy),f=speed?Math.max(0,(speed-(65+speed*.08)*d)/speed):0;b.vx*=f;b.vy*=f;b.roll=(b.roll||0)+speed*d/R;if(Math.hypot(b.vx,b.vy)<2)b.vx=b.vy=0;
 const pocket=pockets.findIndex(([x,y])=>Math.hypot(b.x-x,b.y-y)<25);if(pocket>=0){b.potted=true;b.pocket=pocket;continue;}
 if(b.x<R+27||b.x>W-R-27){b.x=Math.max(R+27,Math.min(W-R-27,b.x));b.vx*=-.8;b.vy*=.985;if(this.shot?.first!==null&&this.shot){this.shot.rail=true;if(b.id)this.shot.rails.add(b.id);}}
 if(b.y<R+27||b.y>H-R-27){b.y=Math.max(R+27,Math.min(H-R-27,b.y));b.vy*=-.8;b.vx*=.985;if(this.shot?.first!==null&&this.shot){this.shot.rail=true;if(b.id)this.shot.rails.add(b.id);}}
 }
 for(let i=0;i<this.balls.length;i++)for(let j=i+1;j<this.balls.length;j++){const a=this.balls[i],b=this.balls[j];if(a.potted||b.potted)continue;const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);if(dist>0&&dist<2*R){const nx=dx/dist,ny=dy/dist,over=(2*R-dist)/2;a.x-=nx*over;a.y-=ny*over;b.x+=nx*over;b.y+=ny*over;const hit=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(hit>0){if(this.shot&&this.shot.first===null&&(a.id===0||b.id===0))this.shot.first=a.id===0?b.id:a.id;a.vx-=hit*nx*.97;a.vy-=hit*ny*.97;b.vx+=hit*nx*.97;b.vy+=hit*ny*.97;if(hit>60)this.events.push({type:'hit',strength:hit});}}}
 for(const b of this.balls.filter(b=>b.potted)){if(this.shot)this.shot.pots.push({id:b.id,pocket:b.pocket});if(b.id===0){this.scratches++;this.events.push({type:'scratch',player:this.shot?.player??this.turn});}else this.events.push({type:'pot',id:b.id,x:b.x,y:b.y,player:this.shot?.player??this.turn});}
 this.balls=this.balls.filter(b=>!b.potted);
 }
 if(!this.moving&&this.shot)this.resolveShot();
 if(!this.practice&&this.time>=600&&!this.over){this.over=true;this.winner=this.mode==='bot'?1:null;this.score=0;this.message=this.mode==='bot'?'Time expired — Penguin (bot) wins the rack.':'Time expired — local match is a draw.';this.events.push({type:'time'});}

 }
 }
 const api={Table,W,H,R,pockets};if(typeof module!=='undefined')module.exports=api;else root.PoolModel=api;
})(globalThis);
