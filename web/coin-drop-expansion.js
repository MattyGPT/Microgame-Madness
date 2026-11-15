"use strict";
const CoinDropExpansion = (() => {
  const regions = [
    ['Amber','Desert machinery and warm crosswinds.','#ffc078'],['Tidal','Ocean currents curl between coral machines.','#70e6e0'],
    ['Verdant','Living pinball gardens with gentle gravity.','#98e897'],['Cobalt','Electric factories with moving pin arrays.','#8cb7ff'],
    ['Aurora','Polar light, icy rails and drifting coins.','#b6a3ff'],['Ember','Volcanic foundries and heavy drops.','#ff9584'],
    ['Astral','Satellite gardens beneath unfamiliar stars.','#e7a2ed'],['Eternal','The final expedition beyond the crown.','#ffe6a3'],
  ];
  const places=['Harbor','Terraces','Observatory','Labyrinth','Conservatory','Causeway','Citadel','Sanctuary','Skyway','Throne'];
  const layouts=['wave','stairs','rings','diamond','grove','honey','towers','arches','fan','vortex'];
  const worlds=regions.flatMap(([region,hint,color],r)=>places.map((place,j)=>[
    `${region} ${place}`,hint,color,layouts[(j+r)%layouts.length],((j*29+r*17)%181)-90,.65+((r*7+j*3)%19)*.045,(j+r)%3===0?12+(r+j)%15:0,
  ]));
  const families=[
    ['equation','Reactor Equation','Solve the displayed two-step calculation.','Work out the multiplication first, then add the final number.','3 × 4 + 2 = 14.'],
    ['sort','Cargo Queue','Select all cargo weights from lightest to heaviest.','Compare the weights and choose the smallest remaining one each time.','7, 2, 5 must be loaded as 2, 5, 7.'],
    ['sum','Exact Shipment','Select cargo totaling the requested weight, then dispatch.','Selecting a weight again removes it. Dispatch only when the total matches.','For a target of 11, select 4 and 7.'],
    ['recall','Beacon Echo','Study the beacon digits, then repeat them in order.','Read left to right during the preview. The keypad opens after the digits disappear.','If the beacons show 3 1 4, press 3, then 1, then 4.'],
    ['route','Courier Trail','Follow the numbered trail in order. Avoid the blocked cells.','Tap the square labeled 1 first, then 2 and so on until the finish.','A trail labeled 1, 2, 3 must be followed in that order.'],
    ['dial','Compass Array','Rotate each dial until it matches its target arrow, then lock.','Every click turns a dial clockwise. Match the target above each dial.','A dial pointing ↑ needs one click to match →.'],
    ['pulse','Pulse Dock','Stop the shuttle inside the illuminated docking zone.','Watch its position along the bar and press Dock while it is inside gold.','A marker at 50% fits a target spanning 40% to 60%.'],
    ['pairs','Cargo Twins','Find all matching cargo pairs. Wrong pairs turn back over.','Remember the positions of cards you uncover. Match every pair before time runs out.','Two stars make a pair; a star and a moon do not.'],
    ['arrows','Signal Relay','Follow the arrow commands in order with buttons or arrow keys.','Read the next command after every correct press. Holding a key does not repeat it.','For ↑ → ↓, press Up, Right, Down.'],
    ['circuit','Circuit Copy','Toggle the switches to match the displayed target pattern, then connect.','Each switch changes only itself. The target tells you whether each switch should be on or off.','For ON OFF ON, light the first and third switches only.'],
    ['count','Crystal Survey','Count only the requested symbol and choose its total.','Ignore every other symbol; scan the survey one row at a time.','◆ ★ ◆ has two diamonds.'],
    ['cipher','Letter Vault','Decode the letter using the displayed alphabet shift.','Move forward by the stated number of letters, wrapping from Z back to A.','With a shift of 2, A becomes C and Z becomes B.'],
  ];
  const games=worlds.flatMap((world,w)=>Array.from({length:3},(_,slot)=>{
    const index=w*3+slot, [family,name,rules,tip,example]=families[index%families.length],level=Math.floor(index/families.length);
    return {id:`expedition_${w+21}_${slot+1}`,title:`${world[0]} · ${name}`,kind:'expedition',variant:family,level,
      seconds:['pairs','recall','route','sort','arrows'].includes(family)?20:14,icon:['+','↑','Σ','▣','⋯','↻','◎','≋','➜','ϟ','◆','A'][index%12],
      rules,lesson:{steps:[rules,tip],example},...(slot===0?{ruby:1}:slot===1?{scrap:5}:{})};
  }));
  const shuffle=(a,r)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  function puzzle(game,random=Math.random){
    const l=game.level,offset=1+Math.floor(random()*5),n=4+l%3,base=l+offset;
    switch(game.variant){
      case 'equation':{const a=3+l%8,b=2+offset,c=l+2;return {prompt:`${a} × ${b} + ${c} = ?`,answer:a*b+c};}
      case 'cipher':{const shift=1+l%9,start=(l+offset)%26;return {prompt:`Shift forward ${shift}: ${String.fromCharCode(65+start)} → ?`,answer:String.fromCharCode(65+(start+shift)%26)};}
      case 'count':{const target=['◆','★','●','☾'][l%4],answer=3+l%9;return {target,answer,symbols:shuffle([...Array(answer).fill(target),...Array(3+offset).fill(['◆','★','●','☾'][(l+1)%4])],random)};}
      case 'sort':return {values:shuffle(Array.from({length:n},(_,i)=>base+i*(2+l%4)),random)};
      case 'sum':{const a=2+l,b=3+offset;return {target:a+b,values:shuffle([a,b,a+b+1,a+b+3,1],random)};}
      case 'recall':return {sequence:Array.from({length:n},()=>1+Math.floor(random()*6)),preview:2.5};
      case 'route':return {path:shuffle(Array.from({length:16},(_,i)=>i),random).slice(0,5+l%4)};
      case 'dial':return {targets:Array.from({length:n},(_,i)=>(l+i)%4),values:Array.from({length:n},(_,i)=>(l+i+1+offset%3)%4)};
      case 'pulse':return {center:.18+(l%6)*.125,width:.20-(l%4)*.015,speed:1.4+l*.035};
      case 'pairs':return {values:shuffle(Array.from({length:3+l%3},(_,i)=>['◆','★','●','☾','▲'][i]).flatMap(x=>[x,x]),random)};
      case 'arrows':return {commands:Array.from({length:5+l%4},()=>Math.floor(random()*4))};
      case 'circuit':return {targets:Array.from({length:n},(_,i)=>(l>>(i%4))%2===0),values:Array(n).fill(false)};
      default:throw new Error(`Unknown expedition challenge: ${game.variant}`);
    }
  }
  function create(game,host,finish,random=Math.random){
    const state={...puzzle(game,random),elapsed:0,index:0,ended:false};
    const done=won=>{if(!state.ended){state.ended=true;finish(won);}};
    const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
    host.replaceChildren();const prompt=el('p',game.rules,'cd-nano-prompt'),area=el('div',undefined,'cd-nano-choices cd-expansion-grid'),status=el('p','','cd-pack-status');host.append(prompt,area,status);
    const buttons=(labels,fn)=>{area.replaceChildren();return labels.map((label,i)=>{const b=el('button',String(label));b.type='button';b.onclick=()=>{if(!state.ended)fn(i,b);};area.append(b);return b;});};
    const submit=(label,fn)=>{const b=el('button',label,'cd-pack-submit');b.type='button';b.onclick=()=>{if(!state.ended)fn();};host.append(b);};
    const progress=total=>{status.textContent=`${state.index} / ${total}`;if(state.index===total)done(true);};
    let tick=()=>{};
    if(['equation','cipher','count'].includes(game.variant)){
      prompt.textContent=state.prompt||`Count ${state.target}: ${state.symbols.join(' ')}`;
      const answer=state.answer,choices=typeof answer==='number'?[answer,answer+1,answer+3,Math.max(0,answer-1)]:[answer,...[1,3,5].map(d=>String.fromCharCode(65+(answer.charCodeAt(0)-65+d)%26))];
      state.choices=shuffle(choices,random);buttons(state.choices,i=>done(state.choices[i]===answer));
    }else if(game.variant==='sort'){
      state.sequence=state.values.slice().sort((a,b)=>a-b);buttons(state.values,(i,b)=>{if(state.values[i]!==state.sequence[state.index])return done(false);b.disabled=true;state.index++;progress(state.sequence.length);});
    }else if(game.variant==='sum'){
      state.selected=new Set();const update=()=>{state.total=[...state.selected].reduce((v,i)=>v+state.values[i],0);prompt.textContent=`Shipment ${state.total} / ${state.target}`;};
      buttons(state.values,(i,b)=>{if(state.selected.has(i))state.selected.delete(i);else state.selected.add(i);b.setAttribute('aria-pressed',String(state.selected.has(i)));update();});update();submit('Dispatch',()=>done(state.total===state.target));
    }else if(game.variant==='recall'){
      prompt.textContent=state.sequence.join(' · ');const bs=buttons([1,2,3,4,5,6],i=>{if(!state.revealed)return;if(i+1!==state.sequence[state.index])return done(false);state.index++;progress(state.sequence.length);});bs.forEach(b=>b.disabled=true);
      tick=()=>{if(!state.revealed&&state.elapsed>=state.preview){state.revealed=true;prompt.textContent='Repeat the beacon digits';bs.forEach(b=>b.disabled=false);bs[0].focus();}};
    }else if(game.variant==='route'){
      area.style.gridTemplateColumns='repeat(4,minmax(0,1fr))';buttons(Array.from({length:16},(_,i)=>state.path.includes(i)?state.path.indexOf(i)+1:'×'),(i,b)=>{if(i!==state.path[state.index])return done(false);b.disabled=true;state.index++;progress(state.path.length);});
    }else if(game.variant==='dial'){
      const arrows=['↑','→','↓','←'];const draw=(i,b)=>{b.textContent=`Target ${arrows[state.targets[i]]} / Dial ${arrows[state.values[i]]}`;};
      const bs=buttons(state.values,(i,b)=>{state.values[i]=(state.values[i]+1)%4;draw(i,b);});bs.forEach((b,i)=>draw(i,b));submit('Lock array',()=>done(state.values.every((v,i)=>v===state.targets[i])));
    }else if(game.variant==='pulse'){
      area.className='cd-pack-area';const meter=el('div',undefined,'cd-nano-meter'),zone=el('span',undefined,'cd-pack-zone'),marker=el('span',undefined,'cd-expansion-marker');zone.style.left=(state.center-state.width/2)*100+'%';zone.style.width=state.width*100+'%';meter.append(zone,marker);area.append(meter);state.position=.5;
      submit('Dock shuttle',()=>done(Math.abs(state.position-state.center)<=state.width/2));tick=()=>{state.position=.5+Math.sin(state.elapsed*state.speed)*.47;marker.style.left=state.position*100+'%';};tick();
    }else if(game.variant==='pairs'){
      state.open=[];state.matched=new Set();const bs=buttons(state.values.map(()=>'?'),(i,b)=>{if(state.matched.has(i)||state.open.includes(i)||state.open.length===2)return;state.open.push(i);b.textContent=state.values[i];if(state.open.length===2){const [a,c]=state.open;if(state.values[a]===state.values[c]){state.matched.add(a);state.matched.add(c);bs[a].disabled=bs[c].disabled=true;state.open=[];if(state.matched.size===state.values.length)done(true);}else state.hideAt=state.elapsed+.65;}});
      tick=()=>{if(state.open.length===2&&state.elapsed>=state.hideAt){state.open.forEach(i=>bs[i].textContent='?');state.open=[];}};
    }else if(game.variant==='arrows'){
      const arrows=['↑','←','↓','→'];prompt.textContent=arrows[state.commands[0]];state.move=i=>{if(i!==state.commands[state.index])return done(false);state.index++;progress(state.commands.length);if(!state.ended)prompt.textContent=arrows[state.commands[state.index]];};buttons(arrows,state.move);
    }else if(game.variant==='circuit'){
      prompt.textContent=`Target: ${state.targets.map(v=>v?'ON':'OFF').join(' · ')}`;buttons(state.values.map(()=> 'OFF'),(i,b)=>{state.values[i]=!state.values[i];b.textContent=state.values[i]?'ON':'OFF';b.setAttribute('aria-pressed',String(state.values[i]));});submit('Connect',()=>done(state.values.every((v,i)=>v===state.targets[i])));
    }
    area.querySelector('button:not(:disabled)')?.focus();
    return {state,tick(dt){if(!state.ended){state.elapsed+=dt;tick(dt);}},key(e){const i={ArrowUp:0,ArrowLeft:1,ArrowDown:2,ArrowRight:3}[e.key];if(state.move&&i!==undefined){e.preventDefault();e.stopPropagation();if(!state.ended&&e.type==='keydown'&&!e.repeat)state.move(i);}},dispose(){state.ended=true;}};
  }
  return {worlds,games,puzzle,create};
})();
if(typeof module!=='undefined')module.exports=CoinDropExpansion;
