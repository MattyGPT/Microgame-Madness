'use strict';
const TreasureTrove=(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function difficulty(round){return {count:Math.min(8,3+Math.floor((round-1)/3)),swaps:Math.min(36,5+round*2),seconds:Math.max(.22,.92*Math.pow(.94,round-1))};}
  class Round {
    constructor(round=1,random=Math.random){this.round=round;this.random=random;this.settings=difficulty(round);this.order=Array.from({length:this.settings.count},(_,i)=>i);this.target=Math.floor(random()*this.order.length);this.phase='reveal';this.age=0;this.step=0;this.move=null;this.picked=null;}
    plan(){
      const n=this.order.length,a=Math.floor(this.random()*n);let b=(a+1+Math.floor(this.random()*(n-1)))%n;
      const from=[...this.order],to=[...from];let type='Crossing swap';
      if(this.round>=9&&this.step%5===4){type='Double crossing';[to[a],to[b]]=[to[b],to[a]];const rest=from.map((_,i)=>i).filter(i=>i!==a&&i!==b);[to[rest[0]],to[rest[1]]]=[to[rest[1]],to[rest[0]]];}
      else if(this.round>=6&&this.step%4===2){type='Three-chest carousel';let d=(b+1)%n;while(d===a||d===b)d=(d+1)%n;[to[a],to[b],to[d]]=[from[d],from[a],from[b]];}
      else if(this.round>=3&&this.step%4===1){type='False swap';}
      else [to[a],to[b]]=[to[b],to[a]];
      this.move={from,to,a,b,type};this.age=0;this.phase='shuffle';
    }
    advance(dt){
      if(!['reveal','close','shuffle','settle'].includes(this.phase))return;
      this.age+=Math.min(.05,Math.max(0,dt));
      if(this.phase==='reveal'&&this.age>=1.7){this.phase='close';this.age=0;}
      else if(this.phase==='close'&&this.age>=.45)this.plan();
      else if(this.phase==='shuffle'&&this.age>=this.settings.seconds){this.order=this.move.to;this.step++;this.age=0;if(this.step>=this.settings.swaps){this.phase='settle';this.move=null;}else this.plan();}
      else if(this.phase==='settle'&&this.age>=.35){this.phase='choose';this.age=0;}
    }
    choose(slot){if(this.phase!=='choose'||!Number.isInteger(slot)||slot<0||slot>=this.order.length)return null;this.picked=this.order[slot];this.phase=this.picked===this.target?'won':'lost';return this.phase==='won';}
    positions(){
      const n=this.order.length,cols=Math.min(4,n),rows=Math.ceil(n/cols);
      const point=slot=>{const row=Math.floor(slot/cols),rowCount=Math.min(cols,n-row*cols);return {x:(slot%cols+1)/(rowCount+1),y:rows===1?.51:row===0?.29:.72};};
      return Array.from({length:n},(_,id)=>{
        const slot=this.order.indexOf(id);let start=point(slot),end=start,progress=0,lift=0;
        if(this.phase==='shuffle'){
          const m=this.move;start=point(m.from.indexOf(id));end=point(m.to.indexOf(id));progress=clamp(this.age/this.settings.seconds,0,1);
          if(m.type==='False swap'&&(slot===m.a||slot===m.b)){end=point(slot===m.a?m.b:m.a);progress=Math.sin(progress*Math.PI)*.78;}
          const eased=(1-Math.cos(progress*Math.PI))/2;lift=Math.sin(progress*Math.PI)*(id%2?1:-1)*.15;
          if(start.x===end.x&&start.y===end.y)lift=0;
          return {id,slot,x:start.x+(end.x-start.x)*eased,y:start.y+(end.y-start.y)*eased+lift,lift};
        }
        return {id,slot,...start,lift};
      });
    }
  }
  function chest(){return `<svg viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="60" cy="104" rx="47" ry="9" fill="#020c1988"/><g class="trove-treasure"><ellipse cx="60" cy="68" rx="36" ry="28" fill="#ffdf6b33"/><path d="M60 42l18 17-18 22-18-22Z" fill="#7ffff0" stroke="#eefff6" stroke-width="2"/><path d="M42 59h36M60 42v39" stroke="#21bdb0" stroke-width="2"/><circle cx="38" cy="79" r="8" fill="#ffd469"/><circle cx="79" cy="79" r="8" fill="#ffe39b"/></g><path d="M16 58h88v39l-9 8H25l-9-8Z" fill="#4b281f" stroke="#d9a858" stroke-width="3"/><path d="M21 65h78M21 77h78M21 89h78" stroke="#865338" stroke-width="3"/><path d="M29 60v43M91 60v43" stroke="#e4b55f" stroke-width="9"/><g class="trove-lid"><path d="M16 60V43Q17 19 40 18h40q23 1 24 25v17Z" fill="#75442b" stroke="#f1c671" stroke-width="3"/><path d="M19 47h82M26 32h67" stroke="#b07743" stroke-width="4"/><path d="M31 59V39q0-13 12-20M89 59V39q0-13-12-20" fill="none" stroke="#edbe64" stroke-width="9"/><path d="M16 57h88" stroke="#ffe09a" stroke-width="6"/><rect x="50" y="50" width="20" height="23" rx="3" fill="#deb45f" stroke="#fff0b2" stroke-width="2"/><circle cx="60" cy="58" r="3" fill="#4b331f"/><path d="M60 58v7" stroke="#4b331f" stroke-width="3"/></g><g fill="#fff2c0"><circle cx="30" cy="92" r="2"/><circle cx="90" cy="92" r="2"/><circle cx="30" cy="67" r="2"/><circle cx="90" cy="67" r="2"/></g></svg>`;}
  class Game {
    constructor(root,{owner=()=> 'guest'}={}){
      this.root=root;this.owner=owner;this.visible=false;this.paused=false;this.round=null;this.frame=0;this.last=0;this.buttons=[];this.ownerKey=null;
      root.innerHTML=`<div class="trove-heading"><div><p class="eyebrow">FOLLOW THE FORTUNE</p><h3>Treasure Trove</h3></div><div class="trove-record">Best streak <strong id="trove-best">0</strong></div></div><p class="trove-instructions">Watch the glowing gem, follow its chest through the shuffle, then choose where it ended up. Each round adds speed and new tricks.</p><div class="trove-hud"><span id="trove-round">Round 1</span><span id="trove-technique">Ready to sail?</span><button id="trove-pause" type="button" disabled>Pause</button></div><div class="trove-stage"><div class="trove-compass" aria-hidden="true">✧</div><div class="trove-chests"></div></div><div class="trove-progress" aria-hidden="true"><span></span></div><p id="trove-status" role="status" aria-live="polite">Start a voyage. Keep your eyes on the treasure.</p><button id="trove-next" type="button">Start voyage</button><p class="trove-help">Tap or click a chest · Tab + Enter also works · No guessing timer</p>`;
      this.stage=root.querySelector('.trove-chests');this.next=root.querySelector('#trove-next');this.pause=root.querySelector('#trove-pause');
      this.next.onclick=()=>this.start(this.round?.phase==='won'?this.round.round+1:1);
      this.pause.onclick=()=>{this.paused=!this.paused;this.pause.textContent=this.paused?'Resume':'Pause';this.last=0;this.paint();};

      document.addEventListener('visibilitychange',()=>{this.last=0;});
    }
    storageKey(){return `microgame-madness.treasure-trove:${this.owner()}`;}
    best(){try{return Math.max(0,Number(localStorage.getItem(this.storageKey()))||0);}catch{return 0;}}
    setVisible(value){
      this.visible=value;this.root.hidden=!value;cancelAnimationFrame(this.frame);this.last=0;
      if(value){const owner=this.owner();if(owner!==this.ownerKey){this.ownerKey=owner;this.round=null;this.stage.replaceChildren();this.next.hidden=false;this.next.textContent='Start voyage';this.pause.disabled=true;this.root.querySelector('#trove-status').textContent='Start a voyage. Keep your eyes on the treasure.';}
        this.root.querySelector('#trove-best').textContent=this.best();this.frame=requestAnimationFrame(now=>this.tick(now));}
    }
    start(number){this.round=new Round(number);this.paused=false;this.pause.textContent='Pause';this.pause.disabled=false;this.next.hidden=true;this.stage.replaceChildren();this.buttons=[];
      for(let id=0;id<this.round.order.length;id++){const button=document.createElement('button');button.type='button';button.className='trove-chest';button.innerHTML=chest();button.onclick=()=>this.choose(this.round.order.indexOf(id));this.stage.append(button);this.buttons.push(button);}
      this.last=0;this.paint();
    }
    choose(slot){if(!this.round||this.paused)return;const won=this.round.choose(slot);if(won===null)return;
      if(won)try{localStorage.setItem(this.storageKey(),String(Math.max(this.best(),this.round.round)));}catch{}
      this.root.querySelector('#trove-best').textContent=this.best();this.paint();this.next.focus({preventScroll:true});
    }
    tick(now){if(!this.visible)return;this.frame=requestAnimationFrame(time=>this.tick(time));const dt=this.last?(now-this.last)/1000:0;this.last=now;
      if(!document.hidden&&!this.paused){this.round?.advance(dt);this.paint();}}
    paint(){const game=this.round;if(!game)return;
      this.root.classList.toggle('trove-paused',this.paused);
      this.root.querySelector('#trove-round').textContent=`Round ${game.round} · ${game.order.length} chests`;
      this.root.querySelector('#trove-technique').textContent=this.paused?'Paused':game.phase==='shuffle'?`${game.move.type} · ${game.step+1}/${game.settings.swaps}`:game.phase==='choose'?'Choose your chest':game.phase==='reveal'?'Remember the gem':'Treasure secured?';
      const copy=this.paused?'Paused. Resume when you are ready.':({reveal:'There’s the treasure! Follow this chest.',close:'Lids down. Watch closely.',shuffle:'Follow the chest—not the empty space.',settle:'The chests are coming to rest…',choose:'Which chest holds the gem?',won:'Treasure found! Ready for a harder round?',lost:`The glowing chest held the treasure. Your streak: ${game.round-1}.`})[game.phase];
      const status=this.root.querySelector('#trove-status');if(status.textContent!==copy)status.textContent=copy;
      const ended=['won','lost'].includes(game.phase);this.next.hidden=!ended;this.next.textContent=game.phase==='won'?'Next round →':'Try again';this.pause.disabled=ended;
      this.root.querySelector('.trove-progress span').style.width=`${game.phase==='choose'||ended?100:game.step/game.settings.swaps*100}%`;
      for(const point of game.positions()){
        const button=this.buttons[point.id];button.style.left=point.x*100+'%';button.style.top=point.y*100+'%';button.style.zIndex=String(Math.round(point.y*100));button.style.setProperty('--chest-width',`${game.order.length>4?21:26}%`);
        button.disabled=game.phase!=='choose'||this.paused;button.setAttribute('aria-label',`${point.y<.4?'Upper ':point.y>.6?'Lower ':''}${point.x<.4?'left':point.x>.6?'right':'middle'} treasure chest`);
        const open=(game.phase==='reveal'&&point.id===game.target)||(ended&&(point.id===game.target||point.id===game.picked));
        button.classList.toggle('open',open);button.classList.toggle('has-treasure',open&&point.id===game.target);button.classList.toggle('wrong',game.phase==='lost'&&point.id===game.picked);
      }
    }
  }
  return {Round,difficulty,Game,chest};
})();
if(typeof module!=='undefined')module.exports=TreasureTrove;
