"use strict";
// Each entry has its own objective and appears in exactly one campaign pocket.
const CoinDropNanoPack = (() => {
  const definitions = [
    ['change','Change Please','quiz','Subtract the price from the coin value.',6,'−'],
    ['multiply','Mint Multiplier','quiz','Multiply the two numbers.',6,'×'],
    ['divide','Equal Shares','quiz','Divide the dots equally between the bags.',6,'÷'],
    ['even','Even Exchange','quiz','Choose the only even number.',4,'2'],
    ['prime','Prime Prospect','quiz','Choose the only prime number.',6,'P'],
    ['fraction','Fraction Forge','quiz','Choose the largest fraction.',7,'½'],
    ['clock','Clock In','quiz','Read the clock hands: short is hours, long is minutes.',7,'◷'],
    ['roman','Ancient Mint','quiz','Translate the Roman numeral into a number.',6,'V'],
    ['binary','Bit Bank','quiz','Translate the four binary bits into a number.',7,'01'],
    ['count','Star Census','quiz','Count the stars, ignoring all the moons.',5,'★'],
    ['missing','Sequence Station','quiz','Find the next number in the repeating step pattern.',6,'…'],
    ['mirror','Mirror Mail','quiz','Choose the horizontal mirror image. For diagonals, hold two arrow keys together, then release.',4,'↔'],
    ['opposite','Opposite Day','quiz','Choose the color opposite the named color: red/green, blue/orange.',5,'◐'],
    ['sides','Corner Counter','quiz','Count the sides of the pictured shape.',5,'⬡'],
    ['word','Dictionary Dash','quiz','Choose the word that comes first alphabetically.',5,'A'],
    ['weight','Balance the Books','quiz','Find the missing weight that balances the equation.',7,'='],
    ['ascending','Number Ladder','order','Tap all five numbers from smallest to largest.',8,'↑'],
    ['descending','Countdown Crew','order','Tap all five numbers from largest to smallest.',8,'↓'],
    ['alphabet','Letter Line','order','Put the five letters in alphabetical order.',7,'AZ'],
    ['week','Weekend Express','order','Order the weekdays from Monday to Friday.',8,'W'],
    ['rainbow','Rainbow Rails','order','Order the colors: red, orange, yellow, green, blue.',8,'🌈'],
    ['size','Small Beginnings','order','Tap the circles from smallest to largest.',7,'◌'],
    ['compass','Compass Circuit','order','Travel clockwise: north, east, south, west. Arrow keys also select directions.',6,'N'],
    ['months','Season Sort','order','Put these months in calendar order.',8,'☀'],
    ['reverse','Backwards Bank','recall','Study four digits for 2 seconds, then enter them backwards.',10,'↶'],
    ['missing_memory','Vanishing Gem','recall','Study four symbols for 2 seconds. Choose the symbol that disappears.',7,'?'],
    ['location','Lucky Locker','recall','Remember the lit locker for 1 second, then select it.',5,'▣'],
    ['pairs','Twin Treasury','pairs','Find all three matching pairs. Unmatched cards turn back over.',14,'≋'],
    ['flash','Blink Budget','recall','Count the light flashes, then choose how many you saw.',10,'☼'],
    ['reverse_arrows','Return Route','recall','Study three arrows for 2 seconds, then repeat them backwards using buttons or arrow keys.',9,'↩'],
    ['edge','Edge of Fortune','meter','Stop the marker in the far-right gold zone.',7,'▸'],
    ['left','Left Field','meter','Stop the marker in the far-left gold zone.',7,'◂'],
    ['orbit','Orbit Lock','meter','Lock the orbiting satellite inside the green arc.',8,'◎'],
    ['windows','Double Door','meter','Stop in either of the two gold windows.',6,'Ⅱ'],
    ['brake','Brake Check','meter','The marker accelerates. Brake inside the center gold zone.',7,'!'],
    ['lights','Lights Out','lights','Turn every light off. Each press toggles itself and its orthogonal neighbors.',14,'⊞'],
    ['slide','Tile Transit','slide','Restore 1–8 order. Click adjacent tiles or use arrow keys to move the empty square.',18,'▦'],
    ['wires','Wire Works','wires','Point all wires right. Click to rotate, or use ←/→ to select a wire and ↑/↓ to rotate it.',10,'⌁'],
    ['path','Safe Steps','path','Follow the numbered path from 1 to 5. Any other square ends the game.',7,'⋯'],
    ['mines','Ruby Rescue','mines','Collect all five marked gems. Touching a bomb ends the game.',6,'◆'],
    ['sum','Perfect Ten','sum','Select numbers totaling exactly 10, then bank them.',8,'10'],
    ['taps','Seven Strikes','taps','Tap the coin exactly seven times, then bank it. An eighth tap loses.',6,'7'],
    ['alternate','Left Right Left','alternate','Alternate LEFT and RIGHT eight times, beginning with LEFT. Buttons or arrow keys work.',6,'⇄'],
    ['hold','Pressure Valve','hold','Hold the valve for 1 to 1.5 seconds, then release. Space also works.',7,'◉'],
    ['signal','Green Only','signal','Tap GO during three green signals. A red signal is a trap.',10,'●'],
    ['catch','Comet Catch','catch','Catch the moving comet three times. Avoid the decoy moons.',9,'☄'],
    ['shield','Shield Shift','shield','Choose the shield facing the incoming arrow. Block four attacks with buttons or arrow keys.',7,'◇'],
    ['arrows','Arrow Sprint','arrows','Match each displayed arrow with buttons or arrow keys. Finish five commands.',6,'➜'],
    ['balance','Steady Hands','balance','Keep the slider inside the moving green band for 2 continuous seconds.',10,'⚖'],
    ['stopwatch','Inner Clock','stopwatch','Start your clock, then stop between 2.5 and 3.5 seconds. The clock is hidden.',8,'◴'],
  ];
  const games=definitions.map(([id,title,kind,rules,seconds,icon],i)=>({id:`nano_${id}`,variant:id,title,kind,rules,seconds,icon,...(i%3===0?{ruby:1}:i%3===1?{scrap:5}:{})}));
  const shuffle=(a,random=Math.random)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const int=(a,b,r)=>a+Math.floor(r()*(b-a+1));
  function quiz(variant,r=Math.random){
    let prompt,answer,choices,clock;
    const a=int(3,9,r),b=int(2,5,r);
    switch(variant){
      case 'change':prompt=`${a+10} coins − ${b} coins = ?`;answer=a+10-b;break;
      case 'multiply':prompt=`${a} × ${b} = ?`;answer=a*b;break;
      case 'divide':prompt=`${a*b} dots ÷ ${b} bags = ?`;answer=a;break;
      case 'even':prompt='Find the EVEN number';answer=a*2;choices=[answer,3,11,17];break;
      case 'prime':prompt='Find the PRIME number';answer=shuffle([7,11,13,17],r)[0];choices=[answer,9,15,21];break;
      case 'fraction':prompt='Which fraction is largest?';answer='3/4';choices=['3/4','1/2','2/3','1/4'];break;
      case 'clock':clock={hour:a,minute:b%4*15};prompt='What time is shown?';answer=`${a}:${String(clock.minute).padStart(2,'0')}`;choices=[answer,`${a+1}:${String(clock.minute).padStart(2,'0')}`,`${a}:${String((clock.minute+15)%60).padStart(2,'0')}`,`${a}:${String((clock.minute+30)%60).padStart(2,'0')}`];break;
      case 'roman':{const roman={3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX'};prompt=`${roman[a]} = ?`;answer=a;break;}
      case 'binary':prompt=`${a.toString(2).padStart(4,'0')} in binary = ?`;answer=a;break;
      case 'count':prompt=shuffle([...Array(a).fill('★'),...Array(b).fill('☾')],r).join(' ');answer=a;break;
      case 'missing':prompt=`${a}, ${a+b}, ${a+2*b}, ?`;answer=a+3*b;break;
      case 'mirror':prompt='Mirror this arrow horizontally: ↗';answer='↖';choices=['↖','↘','↙','↗'];break;
      case 'opposite':{const pair=shuffle([['Red','Green'],['Blue','Orange']],r)[0];prompt=`Opposite of ${pair[0]}?`;answer=pair[1];choices=['Red','Green','Blue','Orange'];break;}
      case 'sides':{const shape=shuffle([['△',3],['□',4],['⬟',5],['⬡',6]],r)[0];prompt=`How many sides? ${shape[0]}`;answer=shape[1];choices=[3,4,5,6];break;}
      case 'word':prompt='Which word comes first?';answer='Coin';choices=['Coin','Comet','Cubie','Crystal'];break;
      case 'weight':prompt=`${a} + ? = ${a+b}`;answer=b;break;
      default:throw new Error(`Unknown quiz: ${variant}`);
    }
    if(!choices)choices=[answer,answer+1,answer+3,Math.max(0,answer-2)];
    choices=[...new Set(choices.map(String))];let filler=1;while(choices.length<4){if(!choices.includes(String(filler)))choices.push(String(filler));filler++;}
    return {prompt,answer:String(answer),choices:shuffle(choices,r),clock};
  }
  function order(variant,r=Math.random){
    const sequences={ascending:['2','5','9','14','20'],descending:['20','14','9','5','2'],alphabet:['B','D','J','M','S'],week:['Monday','Tuesday','Wednesday','Thursday','Friday'],rainbow:['Red','Orange','Yellow','Green','Blue'],size:['1','2','3','4','5'],compass:['North','East','South','West'],months:['January','March','June','September','December']};
    return {sequence:sequences[variant],choices:shuffle(sequences[variant],r)};
  }
  const neighbors=i=>[i,...[i%2?i-1:i+1,i<2?i+2:i-2]];
  function create(game,host,finish,random=Math.random){
    const state={elapsed:0,ended:false,index:0,variant:game.variant,kind:game.kind};
    const win=ok=>{if(state.ended)return;state.ended=true;finish(ok);};
    const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
    host.replaceChildren();
    const prompt=el('p','','cd-nano-prompt');host.append(prompt);
    const area=el('div',undefined,'cd-pack-area');host.append(area);
    const status=el('p','','cd-pack-status');host.append(status);
    const buttons=(labels,action,grid=false)=>{
      area.replaceChildren();area.className='cd-pack-area cd-nano-choices'+(grid?' cd-nano-grid':'');
      labels.forEach((label,i)=>{const button=el('button',label);button.type='button';button.onclick=()=>{if(!state.ended)action(i,button);};area.append(button);});area.firstChild?.focus();return [...area.children];
    };
    const submit=(text,action)=>{const b=el('button',text,'cd-pack-submit');b.onclick=()=>{if(!state.ended)action();};host.append(b);return b;};
    let tick=()=>{};
    if(game.kind==='quiz'){
      Object.assign(state,quiz(game.variant,random));prompt.textContent=state.prompt;
      if(state.clock){const clock=el('div',undefined,'cd-pack-clock');clock.setAttribute('aria-label','Analog clock');const hour=el('i',undefined,'cd-clock-hour'),minute=el('i',undefined,'cd-clock-minute');hour.style.transform=`rotate(${state.clock.hour*30+state.clock.minute/2}deg)`;minute.style.transform=`rotate(${state.clock.minute*6}deg)`;clock.append(hour,minute);for(const [text,x,y]of [['12',50,8],['3',90,50],['6',50,90],['9',10,50]]){const label=el('span',text);label.style.left=x+'%';label.style.top=y+'%';clock.append(label);}host.insertBefore(clock,area);}
      buttons(state.choices,i=>win(state.choices[i]===state.answer));
    }else if(game.kind==='order'){
      Object.assign(state,order(game.variant,random));prompt.textContent='Build the correct order';
      const controls=buttons(state.choices,(i,b)=>{if(state.choices[i]!==state.sequence[state.index]){win(false);return;}b.disabled=true;state.index++;status.textContent=`${state.index}/${state.sequence.length} placed`;if(state.index===state.sequence.length)win(true);else area.querySelector('button:not(:disabled)')?.focus();});
      if(game.variant==='size')controls.forEach((b,i)=>{b.textContent='●';b.style.fontSize=(12+Number(state.choices[i])*5)+'px';b.setAttribute('aria-label',`Circle size ${state.choices[i]}`);});
    }else if(game.kind==='recall'){
      state.reveal=game.variant==='location'?1:2;state.revealed=false;
      if(game.variant==='reverse'||game.variant==='reverse_arrows'){
        state.symbols=game.variant==='reverse'?['1','2','3','4','5','6']:['↑','←','↓','→'];state.sequence=Array.from({length:game.variant==='reverse'?4:3},()=>int(0,state.symbols.length-1,random));state.answer=state.sequence.slice().reverse();
        prompt.textContent=state.sequence.map(i=>state.symbols[i]).join(' ');
      }else if(game.variant==='missing_memory'){
        state.symbols=shuffle(['★','◆','☾','●','▲','■'],random).slice(0,4);state.answer=int(0,3,random);prompt.textContent=state.symbols.join(' ');
      }else if(game.variant==='location'){
        state.answer=int(0,8,random);prompt.textContent='Remember the lit locker';buttons(Array.from({length:9},(_,i)=>i===state.answer?'◆':'□'),()=>{},true);
      }else if(game.variant==='flash'){
        state.answer=int(3,6,random);state.reveal=state.answer*.55+.3;prompt.textContent='Count the flashes';area.append(el('div','●','cd-pack-flash'));
      }
      tick=()=>{
        if(game.variant==='flash'&&!state.revealed)area.firstChild.style.opacity=state.elapsed<state.answer*.55&&state.elapsed%.55<.25?'1':'.12';
        if(state.elapsed<state.reveal||state.revealed)return;state.revealed=true;
        if(['reverse','reverse_arrows'].includes(game.variant)){
          prompt.textContent='Repeat backwards';buttons(state.symbols,i=>{if(i!==state.answer[state.index]){win(false);return;}state.index++;status.textContent='✓ '.repeat(state.index);if(state.index===state.answer.length)win(true);});
        }else if(game.variant==='missing_memory'){
          prompt.textContent=state.symbols.filter((_,i)=>i!==state.answer).join(' ');buttons(state.symbols,i=>win(i===state.answer));
        }else if(game.variant==='location'){
          prompt.textContent='Which locker was lit?';buttons(Array.from({length:9},(_,i)=>String(i+1)),i=>win(i===state.answer),true);
        }else{prompt.textContent='How many flashes?';buttons(['3','4','5','6'],i=>win(i+3===state.answer));}
      };
    }else if(game.kind==='pairs'){
      state.cards=shuffle(['★','★','◆','◆','☾','☾'],random);state.open=[];state.matched=new Set();prompt.textContent='Find three pairs';
      const cards=buttons(Array(6).fill('?'),(i,b)=>{if(state.open.length===2||state.open.includes(i)||state.matched.has(i))return;b.textContent=state.cards[i];state.open.push(i);if(state.open.length===2){const [a,c]=state.open;if(state.cards[a]===state.cards[c]){state.matched.add(a);state.matched.add(c);cards[a].disabled=cards[c].disabled=true;state.open=[];if(state.matched.size===6)win(true);}else state.hideAt=state.elapsed+.65;}},true);
      tick=()=>{if(state.open.length===2&&state.elapsed>=state.hideAt){state.open.forEach(i=>cards[i].textContent='?');state.open=[];}};
    }else if(game.kind==='meter'){
      state.position=0;state.zones=game.variant==='edge'?[[.78,.95]]:game.variant==='left'?[[.05,.22]]:game.variant==='windows'?[[.16,.29],[.71,.84]]:[[.42,.58]];
      prompt.textContent=game.variant==='orbit'?'Lock the satellite':'Stop in gold';area.className='cd-pack-area';
      const track=el('div',undefined,game.variant==='orbit'?'cd-pack-orbit':'cd-nano-meter');area.append(track);
      for(const [a,b]of state.zones){const zone=el('span',undefined,'cd-pack-zone');zone.style.left=a*100+'%';zone.style.width=(b-a)*100+'%';track.append(zone);}
      const marker=el('span',undefined,'cd-pack-marker');track.append(marker);
      submit(game.variant==='brake'?'Brake!':'Lock!',()=>win(state.zones.some(([a,b])=>state.position>=a&&state.position<=b)));
      tick=()=>{state.position=game.variant==='brake'?(state.elapsed*.14+state.elapsed**2*.09)%1:game.variant==='orbit'?(state.elapsed*.45)%1:.5+Math.sin(state.elapsed*3.2)*.48;if(game.variant==='orbit'){marker.style.left=(50+Math.cos(state.position*Math.PI*2)*40)+'%';marker.style.top=(50+Math.sin(state.position*Math.PI*2)*40)+'%';}else marker.style.left=state.position*100+'%';};
      if(game.variant==='orbit'){state.zones=[[.2,.3]];track.querySelector('.cd-pack-zone').remove();track.append(el('span','LOCK','cd-pack-orbit-goal'));}
    }else if(game.kind==='lights'){
      state.lights=[false,false,false,false];for(const i of [0,1,3])for(const j of neighbors(i))state.lights[j]=!state.lights[j];prompt.textContent='Turn all four lights off';
      const paint=()=>[...area.children].forEach((b,i)=>{b.textContent=state.lights[i]?'☀':'·';b.setAttribute('aria-label',`Light ${i+1} ${state.lights[i]?'on':'off'}`);b.classList.toggle('cd-pack-lit',state.lights[i]);});
      buttons(Array(4).fill(''),i=>{for(const j of neighbors(i))state.lights[j]=!state.lights[j];paint();if(state.lights.every(v=>!v))win(true);},true);area.style.gridTemplateColumns='repeat(2,1fr)';paint();
    }else if(game.kind==='slide'){
      state.tiles=[1,2,3,4,0,6,7,5,8];prompt.textContent='Restore 1–8 order';
      const paint=()=>[...area.children].forEach((b,i)=>b.textContent=state.tiles[i]||'·');
      buttons(Array(9).fill(''),i=>{const z=state.tiles.indexOf(0);if(Math.abs(i%3-z%3)+Math.abs(Math.floor(i/3)-Math.floor(z/3))!==1)return;[state.tiles[i],state.tiles[z]]=[state.tiles[z],state.tiles[i]];paint();if(state.tiles.every((v,i)=>v===(i+1)%9))win(true);},true);paint();
    }else if(game.kind==='wires'){
      state.turns=[0,1,2,0];state.wireIndex=0;const arrows=['↑','→','↓','←'];prompt.textContent='Connect the circuit →';
      state.rotate=(i,delta)=>{state.wireIndex=i;state.turns[i]=(state.turns[i]+delta+4)%4;area.children[i].textContent=arrows[state.turns[i]];area.children[i].focus();status.textContent=`Wire ${i+1} selected · ↑ clockwise · ↓ counterclockwise`;if(state.turns.every(v=>v===1))win(true);};
      buttons(state.turns.map(i=>arrows[i]),i=>state.rotate(i,1));
    }else if(game.kind==='path'){
      state.path=[0,3,4,7,8];prompt.textContent='Follow 1 → 5';buttons(Array.from({length:9},(_,i)=>state.path.includes(i)?String(state.path.indexOf(i)+1):'×'),(i,b)=>{if(i!==state.path[state.index]){win(false);return;}b.disabled=true;state.index++;if(state.index===5)win(true);},true);
    }else if(game.kind==='mines'){
      state.gems=new Set(shuffle([0,1,2,3,4,5,6,7,8],random).slice(0,5));prompt.textContent='Rescue every ◆';buttons(Array.from({length:9},(_,i)=>state.gems.has(i)?'◆':'✹'),(i,b)=>{if(!state.gems.has(i)){win(false);return;}b.disabled=true;state.index++;if(state.index===5)win(true);},true);
    }else if(game.kind==='sum'){
      state.values=shuffle([2,3,5,7,8,9],random);state.selected=new Set();prompt.textContent='Total: 0 / 10';buttons(state.values,(i,b)=>{if(state.selected.has(i))state.selected.delete(i);else state.selected.add(i);b.setAttribute('aria-pressed',String(state.selected.has(i)));state.sum=[...state.selected].reduce((v,j)=>v+state.values[j],0);prompt.textContent=`Total: ${state.sum} / 10`;});submit('Bank total',()=>win(state.sum===10));
    }else if(game.kind==='taps'){
      state.taps=0;prompt.textContent='Count seven strikes, then bank them.';
      const [coin]=buttons(['C'],()=>{state.taps++;if(state.taps>7)win(false);});
      coin.className='cd-strike-coin';coin.setAttribute('aria-label','Strike Cubie Cash coin');area.classList.add('cd-strike-area');
      const face=document.querySelector('.shop-coin-front')?.cloneNode(true);
      if(face){
        face.removeAttribute('class');face.setAttribute('aria-hidden','true');
        // Give the copied metal gradients their own IDs so the shop and game stay independent.
        face.querySelectorAll('[id]').forEach(node=>{const old=node.id,next='cd-strike-'+old;node.id=next;face.querySelectorAll('[fill],[stroke]').forEach(part=>{for(const attr of ['fill','stroke'])if(part.getAttribute(attr)===`url(#${old})`)part.setAttribute(attr,`url(#${next})`);});});
        coin.replaceChildren(face);
      }
      submit('Bank seven',()=>win(state.taps===7));
    }else if(game.kind==='alternate'){
      prompt.textContent='LEFT first';buttons(['LEFT','RIGHT'],i=>{if(i!==state.index%2){win(false);return;}state.index++;prompt.textContent=`${state.index}/8 · ${state.index%2?'RIGHT':'LEFT'} next`;if(state.index===8)win(true);});
    }else if(game.kind==='hold'){
      prompt.textContent='Hold 1–1.5 seconds';const b=el('button','Hold valve','cd-pack-valve');area.append(b);b.focus();
      state.press=()=>{if(state.pressedAt===undefined){state.pressedAt=state.elapsed;b.textContent='Holding…';}};state.release=()=>{if(state.pressedAt===undefined)return;const held=state.elapsed-state.pressedAt;win(held>=1&&held<=1.5);};
      b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);state.press();};b.onpointerup=()=>state.release();b.onpointercancel=()=>win(false);
      tick=()=>{if(state.pressedAt!==undefined){const held=state.elapsed-state.pressedAt;status.textContent=`${held.toFixed(1)} seconds`;if(held>1.5)win(false);}};
    }else if(game.kind==='signal'){
      prompt.textContent='Wait for green';buttons(['WAIT'],()=>{if(!state.green){win(false);return;}state.index++;state.green=false;state.used=state.cycle;if(state.index===3)win(true);});area.firstChild.classList.add('cd-pack-signal');
      tick=()=>{state.cycle=Math.floor(state.elapsed/2);state.green=state.elapsed%2>=1&&state.elapsed%2<1.65&&state.used!==state.cycle;area.firstChild.textContent=state.green?'GO':'WAIT';area.firstChild.classList.toggle('cd-pack-lit',state.green);status.textContent=`${state.index}/3 signals`;};
    }else if(game.kind==='catch'){
      prompt.textContent='Catch the comet, avoid moons';area.className='cd-pack-sky';const comet=el('button','☄','cd-pack-comet');comet.setAttribute('aria-label','Catch comet');area.append(comet);comet.onclick=()=>{state.index++;if(state.index===3)win(true);};
      for(const [left,top] of [[10,25],[70,65]]){const b=el('button','☾','cd-pack-decoy');b.style.left=left+'%';b.style.top=top+'%';b.onclick=()=>win(false);area.append(b);}
      tick=()=>{comet.style.left=(40+Math.sin(state.elapsed*2.2)*23)+'%';comet.style.top=(35+Math.cos(state.elapsed*1.7)*25)+'%';status.textContent=`${state.index}/3 comets`;};
    }else if(game.kind==='shield'||game.kind==='arrows'){
      state.commands=Array.from({length:game.kind==='shield'?4:5},()=>int(0,3,random));const arrows=['↑','←','↓','→'];prompt.textContent=arrows[state.commands[0]];
      state.move=i=>{if(i!==state.commands[state.index]){win(false);return;}state.index++;if(state.index===state.commands.length){win(true);return;}prompt.textContent=arrows[state.commands[state.index]];status.textContent=`${state.index}/${state.commands.length}`;};buttons(arrows,state.move);
    }else if(game.kind==='balance'){
      state.steady=0;state.target=.5;prompt.textContent='Track the green band for 2 seconds';area.className='cd-pack-area';const meter=el('div',undefined,'cd-nano-meter'),zone=el('span',undefined,'cd-pack-zone');zone.style.background='#62d6a5';meter.append(zone);area.append(meter);const slider=el('input');slider.type='range';slider.min='0';slider.max='100';slider.value='50';slider.setAttribute('aria-label','Balance position');area.append(slider);slider.focus();
      tick=dt=>{state.target=.5+Math.sin(state.elapsed*1.5)*.22;zone.style.left=(state.target-.14)*100+'%';zone.style.width='28%';state.steady=Math.abs(Number(slider.value)/100-state.target)<=.14?state.steady+dt:0;status.textContent=`Steady: ${state.steady.toFixed(1)} / 2 seconds`;if(state.steady>=2)win(true);};
    }else if(game.kind==='stopwatch'){
      prompt.textContent='Feel three seconds';state.startedAt=null;buttons(['Start clock'],(_,b)=>{if(state.startedAt===null){state.startedAt=state.elapsed;b.textContent='Stop clock';prompt.textContent='Clock running…';}else{const t=state.elapsed-state.startedAt;win(t>=2.5&&t<=3.5);}});
    }else throw new Error(`Unknown nanogame kind: ${game.kind}`);
    const held=new Set();
    const clickChoice=label=>{const button=[...area.querySelectorAll('button')].find(b=>b.textContent===label);if(button&&!button.disabled)button.click();};
    function key(e){
      if(state.ended)return;
      const direction={ArrowUp:0,ArrowLeft:1,ArrowDown:2,ArrowRight:3}[e.key];
      const directional=state.move||['mirror','compass','reverse_arrows'].includes(game.variant)||['alternate','wires','slide'].includes(game.kind);
      if(direction!==undefined&&directional){
        e.preventDefault();e.stopPropagation();
        if(game.variant==='mirror'){
          if(e.type==='keydown'&&!e.repeat){held.add(e.key);const vertical=held.has('ArrowUp')?'up':held.has('ArrowDown')?'down':null,horizontal=held.has('ArrowLeft')?'left':held.has('ArrowRight')?'right':null;if(vertical&&horizontal)state.diagonal={upleft:'↖',upright:'↗',downleft:'↙',downright:'↘'}[vertical+horizontal];}
          if(e.type==='keyup'){held.delete(e.key);if(state.diagonal){const answer=state.diagonal;state.diagonal=null;held.clear();clickChoice(answer);}else status.textContent='Hold an up/down key and a left/right key together, then release.';}
          return;
        }
        // One physical press makes one move. Keyup and autorepeat must never submit another command.
        if(e.type!=='keydown'||e.repeat)return;
        if(state.move)state.move(direction);
        else if(game.variant==='reverse_arrows'){if(state.revealed)clickChoice(['↑','←','↓','→'][direction]);}
        else if(game.variant==='compass')clickChoice(['North','West','South','East'][direction]);
        else if(game.kind==='alternate'){if(direction===1||direction===3)clickChoice(direction===1?'LEFT':'RIGHT');}
        else if(game.kind==='wires'){
          if(direction===1||direction===3){state.wireIndex=(state.wireIndex+(direction===1?3:1))%4;area.children[state.wireIndex].focus();status.textContent=`Wire ${state.wireIndex+1} selected · ↑ clockwise · ↓ counterclockwise`;}
          else state.rotate(state.wireIndex,direction===0?1:-1);
        }else if(game.kind==='slide'){
          const z=state.tiles.indexOf(0),[dx,dy]=[[0,-1],[-1,0],[0,1],[1,0]][direction],x=z%3+dx,y=Math.floor(z/3)+dy;
          if(x>=0&&x<3&&y>=0&&y<3)area.children[y*3+x].click();
        }
      }
      if(game.kind==='hold'&&e.code==='Space'){e.preventDefault();e.stopPropagation();if(e.type==='keyup')state.release();else if(!e.repeat)state.press();}
    }
    return {state,tick(dt){if(state.ended)return;state.elapsed+=dt;tick(dt);},key,dispose(){state.ended=true;held.clear();}};
  }
  return {games,quiz,order,create};
})();
if(typeof module!=='undefined')module.exports=CoinDropNanoPack;
