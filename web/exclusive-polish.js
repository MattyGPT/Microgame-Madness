'use strict';
const ExclusivePolish=(()=>{
 const rainbow=['#ff759f','#ffd775','#aef593','#6ee8ee','#8daaff','#d79aff'];
 const stars=(seed=0,count=28)=>Array.from({length:count},(_,i)=>{const x=9+(i*37+seed)%132,y=12+(i*53+seed)%125;return `<path class="ex-twinkle" style="animation-delay:-${i*.23}s" d="M${x-1.3} ${y}h2.6m-1.3-1.3v2.6" stroke="${rainbow[i%6]}" stroke-width=".7"/>`;}).join('');
 function coin(x,y,r,uid,i=0){return `<g transform="translate(${x} ${y}) rotate(${i%2?23:-28})"><g class="ex-coin" style="animation-delay:-${i*.31}s"><ellipse cy="2" rx="${r}" ry="${r*.65}" fill="#86521c" stroke="#ffe49a" stroke-width=".6"/><path d="M${-r} 0v2m${r*2} 0v-2" stroke="#fff0b2"/><ellipse rx="${r}" ry="${r*.65}" fill="url(#${uid}-gold)" stroke="#fff4c4" stroke-width=".8"/><ellipse rx="${r*.7}" ry="${r*.43}" fill="none" stroke="#a76e25" stroke-width=".6"/><path d="M0-3v6m-2-4h4m-4 2h4" stroke="#fff5bd" stroke-width=".7"/></g></g>`;}
 function gear(x,y,r,i,uid){return `<g transform="translate(${x} ${y})"><g class="ex-gear" style="animation-direction:${i%2?'reverse':'normal'};animation-duration:${3+i%4}s"><path d="${Array.from({length:32},(_,n)=>{const a=n*Math.PI/16,rr=n%4<2?r:r*.82;return `${n?'L':'M'}${Math.cos(a)*rr} ${Math.sin(a)*rr}`;}).join('')}Z" fill="url(#${uid}-gold)" stroke="#4e361e" stroke-width=".5"/><circle r="${r*.57}" fill="#57432b" stroke="#fff0b7" stroke-width=".7"/><path d="M${-r*.5} 0H${r*.5}M0 ${-r*.5}V${r*.5}" stroke="#dcb66b"/><circle r="${r*.18}" fill="#edeee6" stroke="#534535" stroke-width=".6"/></g></g>`;}
 function balloon(uid){
 const swarm=Array.from({length:50},(_,i)=>`<g class="ex-balloon-orbit" style="animation-delay:-${i*.41}s;animation-duration:${13+i%7}s"><g transform="rotate(${i*137.5} 75 75)"><g transform="translate(${75+58+i%5*2} 75) rotate(${-i*137.5})"><ellipse class="ex-satellite-balloon" rx="${2.2+i%3*.45}" ry="${3+i%3*.5}" fill="${rainbow[i%6]}" stroke="#ffffffb0" stroke-width=".4"/><ellipse class="ex-satellite-sheen" rx="${2.2+i%3*.45}" ry="${3+i%3*.5}" fill="url(#${uid}-prism)" opacity=".48" style="animation-delay:-${i*.17}s"/><path d="M0 3.5q-2 3 0 6" fill="none" stroke="${rainbow[(i+2)%6]}" stroke-width=".45"/><path d="M-1-2v1" stroke="#fff" stroke-width=".7"/></g></g></g>`).join('');
 return `<defs><linearGradient id="${uid}-prism" x2="1" y2="1">${rainbow.map((c,i)=>`<stop offset="${i/5}" stop-color="${c}"/>`).join('')}</linearGradient><linearGradient id="${uid}-crystal" x2="1" y2=".8"><stop stop-color="#fff"/><stop offset=".23" stop-color="#ffd6eb"/><stop offset=".45" stop-color="#a3a1f5"/><stop offset=".62" stop-color="#caffda"/><stop offset="1" stop-color="#e6c0ff"/></linearGradient><radialGradient id="${uid}-amber"><stop stop-color="#fff5b7"/><stop offset=".4" stop-color="#ffc65e"/><stop offset="1" stop-color="#d45c29"/></radialGradient><clipPath id="${uid}-envelope"><path d="M75 30 100 37 113 57 108 80 92 100H58L42 80 37 57 50 37Z"/></clipPath></defs>${swarm}<g class="ex-airship"><path d="M75 30 100 37 113 57 108 80 92 100H58L42 80 37 57 50 37Z" fill="url(#${uid}-crystal)" stroke="#eaffff" stroke-width="1.8"/><path d="M75 30 62 54 37 57 60 76 58 100 75 91 92 100 90 76 113 57 88 54Z" fill="#d4faff" fill-opacity=".35" stroke="#fff" stroke-width=".8"/><path d="M50 37 62 54 60 76 42 80m58-43L88 54l2 22 18 4M62 54h26L75 91Zm13-24v24m-15 22 15 15 15-15" fill="none" stroke="#9de8ff" stroke-width="1.2"/><g clip-path="url(#${uid}-envelope)"><path class="ex-rainbow-glare" d="M-30 130 80 0h18L-12 130Z" fill="url(#${uid}-prism)" opacity=".6"/><path class="ex-reflection" d="M-10 130 100 0h12L2 130Z" fill="url(#${uid}-prism)" opacity=".8"/></g><path d="M58 99l6 25m28-25-6 25M64 102l4 22m18-22-4 22" stroke="#ffe5aa" stroke-width="1.5"/><path class="ex-flame" d="M75 120c-16-7-7-15-5-22 2 7 10 6 6-5 13 12 14 22-1 27Z" fill="url(#${uid}-amber)" stroke="#ffe6a4"/><path d="m61 123 14-5 14 5-4 15H65Z" fill="url(#${uid}-gold)" stroke="#fff0c7"/><path d="M65 125h20m-19 4h18m-17 4h16m-13-9v12m10-12v12" stroke="#815123" stroke-width=".8"/><g fill="#233550"><rect x="60" y="65" width="7" height="11" rx="3"/><rect x="83" y="65" width="7" height="11" rx="3"/></g><path d="M68 82q7 8 14 0" fill="none" stroke="#283856" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="56" cy="79" rx="5" ry="2" fill="#ff91c0" opacity=".7"/><ellipse cx="94" cy="79" rx="5" ry="2" fill="#ff91c0" opacity=".7"/><path d="M62 67v2m23-2v2" stroke="#fff" stroke-width="1.5"/></g>`;
 }
 const face=(x=75,y=80,color='#e9f8ff')=>`<g class="ex-live-face" transform="translate(${x} ${y})" fill="${color}"><g class="ex-blink"><rect x="-15" y="-10" width="6" height="11" rx="3"/><rect x="9" y="-10" width="6" height="11" rx="3"/></g><path d="M-7 8q7 8 14 0" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/><path d="M-13-8v2m24-2v2" stroke="#fff" stroke-width="1.2"/></g>`;
 function galaxy(uid,x=75,y=82,r=30){return `<defs><radialGradient id="${uid}-nebula"><stop stop-color="#e1dcff"/><stop offset=".12" stop-color="#a697ff"/><stop offset=".38" stop-color="#41309d"/><stop offset=".72" stop-color="#142f73"/><stop offset="1" stop-color="#070c27"/></radialGradient><clipPath id="${uid}-galaxy-clip"><circle cx="${x}" cy="${y}" r="${r}"/></clipPath></defs><g clip-path="url(#${uid}-galaxy-clip)"><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${uid}-nebula)"/><g transform="translate(${x} ${y})"><g class="ex-galaxy-detail">${Array.from({length:150},(_,i)=>{const t=i*.31,rr=2+i*.19,a=t+(i%3)*2.094;return `<circle cx="${Math.cos(a)*rr}" cy="${Math.sin(a)*rr*.58}" r="${.22+i%4*.18}" fill="${['#ece9ff','#929dff','#6680ed','#bc94ff'][i%4]}" opacity="${.35+i%5*.13}"/>`;}).join('')}<ellipse rx="${r*.85}" ry="${r*.22}" fill="none" stroke="#b3a3ff" stroke-width="1.5" opacity=".5"/></g></g>${stars(18,32)}</g>`;}
 function regalia(g,uid){
  const gold=`url(#${uid}-gold)`,gem=(x,y,c,r=3)=>`<path d="m${x} ${y-r} ${r} ${r} ${-r} ${r} ${-r}-${r}Z" fill="${c}" stroke="#fff5d4" stroke-width=".55"/>`;
  const band=`<path d="M51 31q24 7 48 0v7q-24 7-48 0Z" fill="${gold}" stroke="#ffe9a2"/><path d="M54 34q21 6 42 0" fill="none" stroke="#76431e"/>`;
  let art='';
  if(g.mode==='keyboard')art=`<path d="M48 33V18h7v7h8V14h7v7h4V8h7v13h5v-7h7v11h8v-7h6v19H48Z" fill="#171530" stroke="#7afff3" stroke-width="1.4"/><path d="M51 31h50v7H51Z" fill="#b64dce" stroke="#ffbbfa"/><path class="ex-circuit" d="M55 28v-7m11 7v-9m12 9V13m11 15v-9m11 9v-7M58 34h12m8 0h18" stroke="#74fff1" stroke-width="2"/>${[57,67,78,89,99].map((x,i)=>`<rect class="ex-pixel" style="animation-delay:-${i*.2}s" x="${x}" y="${i===2?8:16}" width="3" height="3" fill="${rainbow[i]}"/>`).join('')}`;
  else if(g.mode==='treasure')art=`<path d="M44 34Q29 16 49 20Q75-10 101 20Q121 16 106 34Q75 25 44 34Z" fill="#211a2c" stroke="${gold}" stroke-width="3"/><path d="M45 30q30-15 60 0M56 20q19-16 38 0" fill="none" stroke="#e4bd68" stroke-width="1.3"/>${gem(75,22,'#74fff2',5)}<path d="M106 24q24-27 28-13-8 0-18 15m-5-4 13-10" fill="#a4e5ee" stroke="#ffe0a3"/><path d="M48 35q27-7 54 0" stroke="${gold}" stroke-width="5"/>`;
  else if(g.mode==='nanolab')art=`<path d="M66 9h18v10l9 12q6 13-18 13T57 31l9-12Z" fill="#191b4b" stroke="#d5f8ff" stroke-width="1.5"/><clipPath id="${uid}-hat-liquid"><path d="M61 28h28v11H61Z"/></clipPath><g clip-path="url(#${uid}-hat-liquid)"><path class="ex-hat-liquid" d="M51 32q9-7 18 0t18 0 18 0v15H51Z" fill="#b981ff"/><path class="ex-hat-liquid" d="M51 32q9-7 18 0t18 0 18 0" fill="none" stroke="#98efff"/></g><path d="M64 8h22v4H64Z" fill="${gold}"/>${[69,77,83].map((x,i)=>`<circle class="ex-bubble" style="animation-delay:-${i*.5}s" cx="${x}" cy="34" r="1" fill="#f2daff"/>`).join('')}`;
  else if(g.mode==='tearesseract')art=`<g class="ex-glitch-crown" fill="none" stroke="#b69bff" stroke-width="1.2"><path d="M48 35 52 15 65 28 75 7 86 28 100 15 104 35ZM52 35l17-5 6-19 6 19 19 5M49 39h53"/><path d="M46 24h10m8-7h13m9 18h21M58 39l-4-16m39 17 4-15" stroke="#5984ff" stroke-dasharray="3 2"/>${[52,65,75,86,100].map((x,i)=>`<rect x="${x-2}" y="${[14,27,7,27,14][i]}" width="4" height="4"/>`).join('')}</g>`;
  else if(g.mode==='boss')art=`<g class="ex-fire-crown">${[49,60,74,88,100].map((x,i)=>`<path class="ex-flame" style="animation-delay:-${i*.16}s" d="M${x} 34q-10-12 1-${19+i%3*5} 0 11 10 13 3 25Z" fill="#ff582c" stroke="#ffca6c"/>`).join('')}<path d="m48 35 3-20 12 12L75 5l12 22 12-12 5 20-29 7Z" fill="#100e1b" stroke="#a85443" stroke-width="1.5"/><path d="m51 35 12-8 12 15V5m0 37 12-15 17 8" fill="none" stroke="#ff8c44" stroke-width=".8"/></g>`;
  else if(g.mode==='pumpkin')art=`<path d="m48 35 1-22 14 12L75 6l12 19 14-12 1 22Z" fill="#151020" stroke="#927ba5" stroke-width="1.5"/><g fill="#04080f" stroke="#b89bca">${[59,75,91].map(x=>`<ellipse cx="${x}" cy="29" rx="4" ry="6"/>`).join('')}</g>${Array.from({length:7},(_,i)=>`<g class="ex-spirit" style="animation-delay:-${i*.6}s;--sx:${55+i*6}px"><path d="M-3 0q0-8 4-8t4 8l-1 5-3-2-3 2Z" fill="#d1c9ff" opacity=".8"/><path d="M0-3h1m2 0h1" stroke="#18112d"/></g>`).join('')}`;
  else if(g.mode==='pool')art=`<g transform="translate(75 37) scale(1 .58) translate(-75 -30)"><path d="m48 33 4-18 13 10 10-20 10 20 13-10 4 18Z" fill="#b4eaf5" stroke="#f1ffff" stroke-width="2"/><path d="m52 31 13-6 10 9 10-9 13 6M75 5v29" fill="none" stroke="#669bc6"/>${band}${gem(75,28,'#ecffff',4)}</g>`;
  else if(g.mode==='balloon')art=`<g transform="translate(75 31) scale(.78) translate(-75 -31)"><path d="m49 33 3-21 13 13 10-22 10 22 13-13 3 21Z" fill="#edfbff" stroke="#fff" stroke-width="1.5"/><path d="m52 12 6 21 7-8 10 12V3m0 34 10-12 7 8 6-21" fill="none" stroke="#b19bff"/>${band}${gem(75,28,'#e3b4ff',4)}</g>`;
  else if(g.mode==='dodge'||g.mode==='geomayhem')art=`<path d="M48 35 45 18 63 26 75 7 87 26 105 18 102 35Z" fill="#202654" stroke="${gold}" stroke-width="2"/><path d="m50 31 13-5 12 10 12-10 13 5M75 10v19" fill="none" stroke="#b7a8ff"/>${[54,64,75,86,96].map((x,i)=>gem(x,29-i%2*8,rainbow[(i+3)%6],2)).join('')}<path class="ex-wisp" d="M47 29Q26 9 42 13M104 29q21-20 5-16" fill="none" stroke="#c2b4ff" stroke-width="1.1"/>${g.mode==='geomayhem'?'<path d="M52 35h9v4h7m14 0h7v-4h9" fill="none" stroke="#75fff2"/>':''}`;
  else {
   art=`<path d="M46 34 43 16 56 22 60 8 69 22 75 3 81 22 90 8 94 22 107 16 104 34Z" fill="${gold}" stroke="#fff1be" stroke-width="1.3"/><path d="M47 29 57 27 61 15 69 28 75 11 81 28 89 15 94 27 103 29M48 32h54M53 36h44" fill="none" stroke="#76441c" stroke-width="1"/>${band}${Array.from({length:23},(_,i)=>`<path d="M${49+i*2.3} 33v3m0-7 1 2" stroke="${i%2?'#fff9d7':'#9d661f'}" stroke-width=".55"/>`).join('')}${[55,65,75,85,95].map((x,i)=>gem(x,i===2?23:29,g.mode==='coindrop'?rainbow[i]:'#baf2ff',i===2?4:2.5)).join('')}`;
   if(g.mode==='wrath')art+=`<path class="ex-infected" d="M47 35q17-20 31-8t26-3M57 27l-8-10 12 5m22 5 7-12-1 15M70 30l-5 10" fill="none" stroke="#965eab" stroke-width="2"/>${[52,71,93].map(x=>gem(x,33,'#9aefb4',2)).join('')}`;
   if(g.mode==='coindrop')art+=`<path d="M48 36q27 12 54 0" fill="none" stroke="#fff3b9" stroke-width="2" stroke-dasharray="1 1"/>${Array.from({length:11},(_,i)=>gem(50+i*5,38+Math.sin(i*Math.PI/10)*4,rainbow[i%6],1.5)).join('')}`;
   if(g.mode==='hangman')art+=`<path d="M44 32h62v4H44Zm5 7h52v3H49Z" fill="${gold}" stroke="#fff2c1"/>${[53,64,86,97].map((x,i)=>gear(x,25,3.1,i,uid)).join('')}`;
  }
  return `<g class="crown-regalia ex-regalia-${g.mode}">${art}</g>`;
 }
 function dropGroups(body,classes){
  for(const name of classes){let start;const opening=new RegExp('<g class="'+name+'"[^>]*>');
   while((start=body.search(opening))>=0){const tags=/<\/?g\b[^>]*>/g;tags.lastIndex=start;let depth=0,tag,end=start;
    while((tag=tags.exec(body))){depth+=tag[0].startsWith('</')?-1:1;if(!depth){end=tags.lastIndex;break;}}
    if(end===start)break;body=body.slice(0,start)+body.slice(end);
   }
  }return body;
 }
 function apply(body,g,kind,uid){
  if(g.mode==='balloon'){
   if(kind==='cubie')return balloon(uid);
   if(kind==='trail')return `<g class="ex-rainbow-trail">${rainbow.map((c,i)=>`<path d="M8 ${109+i*3}Q46 ${12+i*7} 80 ${88+i*2}T142 ${30+i*5}" fill="none" stroke="${c}" stroke-width="2.2"/>`).join('')}</g>${Array.from({length:12},(_,i)=>`<g transform="translate(${12+i*11} ${95-Math.sin(i*.5)*25})"><ellipse class="ex-twinkle" style="animation-delay:-${i*.2}s" rx="3" ry="4" fill="${rainbow[i%6]}"/><path d="M0 4v5" stroke="#fff" stroke-width=".5"/></g>`).join('')}`;
   return body+`<path d="m75 60 18 20-18 22-18-22Z" fill="#b9ecff" stroke="#fff"/><path d="m75 60-6 20 6 22 6-22Zm-18 20h36" fill="none" stroke="#a993f2"/>${stars(12,14)}`;
  }
  if(kind!=='cubie')return body;
  if(g.mode==='keyboard'){
   const moods=Array.from({length:20},(_,i)=>({eye:[0,-3,1,0,-2,2,0,-1,0,2,0,1,-2,0,-1,2,0,-3,0,1][i],smile:[8,12,4,9,6,11,7,3,8,2,10,-2,12,9,6,11,10,4,8,12][i]}));
   const values=fn=>moods.flatMap((m,i)=>[fn(m,i),fn(m,i)]).concat(fn(moods[0],0)).join(';');
   const times=moods.flatMap((_,i)=>[i*.05,i*.05+.043]).concat(1).join(';');
   const morph=(attr,fn)=>`<animate class="ex-face-morph" attributeName="${attr}" dur="100s" repeatCount="indefinite" keyTimes="${times}" values="${values(fn)}"/>`;
   const eyePath=(x,m)=>{const h=Math.max(.7,4+m.eye);return `M${x} ${75-h}Q${x+3} ${73-h} ${x+6} ${75-h}L${x+6} ${75+h}Q${x+3} ${77+h} ${x} ${75+h}Z`;};
   const animated=`<g class="ex-face-idle" data-expression-count="20"><g class="ex-blink" fill="#8ffff4" stroke="#8ffff4" stroke-width=".7" stroke-linecap="round"><path d="${eyePath(64,moods[0])}">${morph('d',m=>eyePath(64,m))}</path><path d="${eyePath(85,moods[0])}">${morph('d',m=>eyePath(85,m))}</path></g><path d="M70 87Q78 95 86 87" fill="none" stroke="#ff9be3" stroke-width="2.2" stroke-linecap="round">${morph('d',m=>`M70 87Q78 ${87+m.smile} 86 87`)}</path><path class="ex-cheeks" d="M60 83h5m26 0h5" stroke="#f9a3d8" stroke-width="1.6"/></g>`;
   body=body.replace(/<g class="crown-face"[\s\S]*?<\/g>/,animated);
   return body+`<path class="ex-neon" d="M29 35v81l9 13h83V41M33 38h79" fill="none" stroke="#72faff" stroke-width="1.6"/>`;
  }
  if(g.mode==='hangman'){
   // Structural beams, diagonal braces and intermeshing gear trains belong to the gallows.
   const wheels=[[27,38,9],[41,30,7],[54,36,7],[68,29,8],[83,33,7],[98,28,8],[111,38,9],[27,56,8],[25,72,7],[29,88,9],[26,108,10],[41,119,8],[58,123,8],[76,120,9],[94,124,8],[112,119,10],[16,91,6],[14,74,7],[39,64,10],[45,83,7],[39,43,4],[36,97,6],[106,109,4],[69,134,4],[88,136,5],[39,105,4],[99,42,4],[50,128,3]];
   return `<path d="M26 119V29h86v37M26 60l31-31M27 115l20-16m65-65-21 20" fill="none" stroke="#533923" stroke-width="10"/><path d="M26 119V29h86v37M26 60l31-31" fill="none" stroke="url(#${uid}-gold)" stroke-width="4"/><path class="ex-belt" d="M24 40v67q0 14 17 14h66q13 0 10-19V54M42 30l27-1 30 2" fill="none" stroke="#d3a965" stroke-width="3" stroke-dasharray="3 2"/><path d="M91 34v13q-17 0-17 14m-4-11 8 3m-8 1 8 3" stroke="#a78555" stroke-width="2"/><path d="M47 61h53v43H47Z" fill="#322a29" stroke="url(#${uid}-gold)" stroke-width="3"/><path d="M50 65h46M51 100h44" stroke="#d8b978"/>${face(74,81,'#ffdf89')}${wheels.map(([x,y,r],i)=>gear(x,y,r,i,uid)).join('')}<path d="M9 134h132M17 129h116" stroke="url(#${uid}-gold)" stroke-width="5"/><path class="ex-belt" d="M34 135h74" stroke="#53442f" stroke-width="4" stroke-dasharray="4 2"/><path d="M114 106h20v23h-20Z" fill="#43302b" stroke="#d4a55c"/><path class="ex-flame" d="m118 123 2-12 4 7 3-9 4 14Z" fill="#ffad55"/><path d="M125 106V94h-9M112 40v15q-10 14 0 14t0-14" fill="none" stroke="#ead49d" stroke-width="2"/>${Array.from({length:20},(_,i)=>`<circle cx="${i<10?24+i*.3:44+(i-10)*8}" cy="${i<10?35+i*9:133}" r="1" fill="#f1dfb1"/>`).join('')}`;
  }
  if(g.mode==='dodge'){
   body=body.replace('<path d="M43 103',galaxy(uid)+'<path d="M43 103').replace('class="crown-orbit" style="transform-origin:75px 82px"','class="ex-wheel-rock"').replace('stroke="#b77742"','stroke="url(#'+uid+'-gold)"');
   return body+`<circle cx="75" cy="82" r="54" fill="none" stroke="#ffe6a3" stroke-width=".8"/><circle cx="75" cy="82" r="48" fill="none" stroke="#ffe6a3" stroke-width=".8"/>`;
  }
  if(g.mode==='boss'){
   body=dropGroups(body,['crown-face']);
   body=body.replace('fill="#241a2b"','fill="#100d19"');
   const cracks=Array.from({length:12},(_,i)=>{const x=29+i*8;return `<path d="M${x} ${40+i%3*5}l${i%2?5:-5} 9-4 8 7 9-3 8"/>`;}).join('');
   return `<defs><filter id="${uid}-heat" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".04 .09" numOctaves="1" seed="6"><animate attributeName="baseFrequency" values=".04 .09;.055 .07;.04 .09" dur="4s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" scale="2.5"/><feGaussianBlur stdDeviation=".45"/></filter></defs><g class="ex-shockwave"><ellipse cx="75" cy="83" rx="68" ry="60" fill="none" stroke="#ff713b" stroke-width="3"/></g>${Array.from({length:28},(_,i)=>`<path class="ex-ember" style="animation-delay:-${i*.13}s;--drift:${(i%7-3)*3}px" d="m${10+i*4.8} ${105+i%4*7} 2-5 1 6-2 2Z" fill="${i%2?'#ffc365':'#ff522f'}"/>`).join('')}<g class="ex-obsidian-breathe">${body}<g fill="none" stroke="#ff642e" stroke-width="3" opacity=".75" filter="url(#${uid}-heat)">${cracks}</g><g class="ex-magma" fill="none" stroke="#ffb766" stroke-width=".9">${cracks}</g>${face(76,83,'#ffe3ab')}</g><path class="ex-lightning" d="M17 51 7 70l12-3-7 29m122-42 8 20-10-4 10 25" fill="none" stroke="#ffb158" stroke-width="2"/>`;
  }
  if(g.mode==='pumpkin'){
   body=body.replace(/<path d="M103 34[\s\S]*?\/>/,'').replace('fill="url(#'+uid+'-body)"','fill="#342039"');
   return `<g class="ex-eclipse-moon"><path d="M125 42C100 1 27 4 12 64 18 24 78 6 99 44Z" fill="#dbd4f3" stroke="#fff1d2"/><path d="M24 38q20-24 49-23M32 28l4 1m10-8 6 2" fill="none" stroke="#8d83b4" stroke-width="2"/></g>${body}<path d="M54 53q-22 33-2 58m44-59q23 33 2 58" fill="none" stroke="#64415a" stroke-width="2"/><g fill="#ded6ff">${[37,109].map(x=>`<path class="ex-ghost" d="M${x} 94q-7-13 0-16t7 12l-2 6-2-3Z"/>`).join('')}</g>`;
  }
  if(g.mode==='wrath'){
   body=dropGroups(body,['crown-face']);
   // Each thorn's root is projected onto a cylinder; back-facing roots are occluded.
   const thorns=Array.from({length:18},(_,i)=>{const y=58+Math.floor(i/6)*20,phase=(i%6)*2.094+Math.floor(i/6)*.45;const frames=Array.from({length:49},(_,n)=>{const a=phase+n*Math.PI/24,x=75+Math.sin(a)*20,z=Math.cos(a),tip=x+Math.sin(a)*11;return {d:`M${x-2} ${y}Q${tip} ${y-4} ${tip} ${y-10}L${x+2} ${y+3}Z`,o:z<-.12?0:1};});return `<path class="ex-surface-thorn" d="${frames[0].d}" fill="#9e6db4" stroke="#e5c6fb" stroke-width=".7"><animate attributeName="d" values="${frames.map(f=>f.d).join(';')}" dur="7s" repeatCount="indefinite"/><animate attributeName="opacity" values="${frames.map(f=>f.o).join(';')}" dur="7s" repeatCount="indefinite"/></path>`;}).join('');
   return body+`<path d="M58 61q18-9 36 0M57 82q18-9 38 0M56 102q19-9 40 0" fill="none" stroke="#a77fbb" stroke-width="1.5"/>${thorns}${face(76,80,'#dbffe9')}`;
  }
  if(g.mode==='geomayhem')return `<g class="ex-starfield">${stars(41,30)}</g><g class="ex-lasers"><path class="ex-laser-one" d="M0 47 150 104" stroke="#ff527c" stroke-width="2"/><path class="ex-laser-two" d="M0 121 150 36" stroke="#ffd282" stroke-width="2"/></g>${body}<g class="ex-tip-exhaust">${Array.from({length:12},(_,i)=>`<circle class="ex-tip-dot" style="animation-delay:-${i*.08}s;--dx:${(i%5-2)*2}px" cx="75" cy="132" r="${1+i%3*.4}" fill="${rainbow[(i+2)%6]}"/>`).join('')}</g>`;
  if(g.mode==='coindrop'){
   // Replace the upright orbit tokens with independently tilted minted coins.
   body=dropGroups(body,['reward-coin-turn','reward-mint']);
   return `<g transform="rotate(-11 75 80)"><g class="ex-treasury-tilt">${body}</g></g>`+Array.from({length:18},(_,i)=>{const t=i*Math.PI/9;return coin(75+Math.cos(t)*60,82+Math.sin(t)*55,4+i%4,uid,i);}).join('');
  }
  if(g.mode==='nanolab'){
   body=dropGroups(body,['crown-shared-face']);
   const liquid=`<defs><clipPath id="${uid}-sloshing"><path d="M34 88q41-14 82 0v20q-8 23-41 23t-41-23Z"/></clipPath></defs><g clip-path="url(#${uid}-sloshing)">${galaxy(uid,75,108,45)}<path class="ex-liquid" d="M12 94q19-21 38-6t38 0 38 0 38 0v55H12Z" fill="#6a42b9" opacity=".7"/><path class="ex-liquid ex-liquid-second" d="M12 96q19-21 38-6t38 0 38 0 38 0" fill="none" stroke="#bff9ff" stroke-width="2.5"/>${Array.from({length:24},(_,i)=>`<circle class="ex-bubble" style="animation-delay:-${i*.13}s" cx="${37+(i*17)%77}" cy="${108+i%4*5}" r="${.5+i%4*.6}" fill="${rainbow[(i+3)%6]}"/>`).join('')}</g>`;
   return body+liquid+`<path class="ex-splash" d="M48 91q-6-16-11-11m39 14q3-30 9-24m12 20q13-15 17-8" fill="none" stroke="#d2c8ff" stroke-width="2"/>${face(75,91,'#efffff')}`;
  }
  if(g.mode==='tearesseract'){
   body=dropGroups(body,['crown-shared-face']);
   const spiral=Array.from({length:5},(_,arm)=>`<path d="${Array.from({length:90},(_,i)=>{const r=4+i*.28,a=i*.095+arm*1.256;return `${i?'L':'M'}${Math.cos(a)*r} ${Math.sin(a)*r*.83}`;}).join('')}" fill="none" stroke="${['#596cf0','#8e66e9','#657ffc','#b49bff','#694acc'][arm]}" stroke-width="${arm%2?1.1:1.8}" opacity=".75"/>`).join('');
   const vortex=`<g transform="translate(75 82)"><ellipse rx="30" ry="27" fill="#080a23"/><g class="ex-vortex">${spiral}${Array.from({length:40},(_,i)=>`<circle cx="${Math.cos(i*2.4)*(10+i*.5)}" cy="${Math.sin(i*2.4)*(10+i*.4)}" r=".45" fill="#aaa4ff"/>`).join('')}</g><ellipse rx="4" ry="3" fill="#09081f" stroke="#a69aff" stroke-width=".6"/></g>`;
   return body.replace(/<g class="reward-core"[\s\S]*?<\/g>/,'')+vortex+face(75,88,'#ddd5ff');
  }
  if(g.mode==='pool')return body+`<g class="ex-ice-crystals" fill="#bdeeff" stroke="#f3ffff" stroke-width=".7">${Array.from({length:14},(_,i)=>{const x=16+i*9,y=130+i%3*3;return `<path class="ex-ice-shimmer" style="animation-delay:-${i*.2}s" d="m${x} ${y} 3-${7+i%4*3} 5 10-5 7Z"/><path d="m${x+3} ${y-7-i%4*3} 0 16"/>`;}).join('')}</g><g fill="#132238" stroke="#fff4ca" stroke-width="1.2"><rect x="60" y="87" width="8" height="13" rx="3"/><rect x="82" y="87" width="8" height="13" rx="3"/></g><path d="M62 89v3m22-3v3" stroke="#fff" stroke-width="1.7"/>${Array.from({length:10},(_,i)=>{let row=0;while((row+1)*(row+2)/2<=i)row++;const x=75+(i-row*(row+1)/2-row/2)*25,y=59+row*21;return `<path class="ex-twinkle" style="animation-delay:-${i*.3}s" d="M${x-7} ${y-6}h4m-2-2v4" stroke="#fffce3" stroke-width=".9"/>`;}).join('')}`;
  if(g.mode==='treasure'){
   const pile=Array.from({length:31},(_,i)=>{const row=Math.floor(i/9),n=i%9;return coin(34+n*9+(row%2)*3,77-row*4-Math.sin(n/8*Math.PI)*8,3.4+(i*7%5)*.45,uid,i);}).join('');
   return body.replace('<g class="reward-prism"',`<g class="ex-treasure-pile">${pile}</g><g class="reward-prism"`);
  }
  return body;
 }
 return{apply,regalia};
})();
globalThis.ExclusivePolish=ExclusivePolish;
if(typeof module!=='undefined')module.exports=ExclusivePolish;

// Pause SVG geometry animations alongside CSS when reduced motion is requested.
if(typeof document!=='undefined'){
 let queued=false;const states=new WeakMap();
 const sync=()=>{queued=false;const pause=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.settingMotion==='true'||document.documentElement.classList.contains('account-reduced-motion');
  for(const svg of document.querySelectorAll('.crown-art'))if(svg.querySelector('animate')&&states.get(svg)!==pause){states.set(svg,pause);if(pause){svg.pauseAnimations?.();svg.setCurrentTime?.(0);}else svg.unpauseAnimations?.();}
 };
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(sync);}};
 new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.crown-art')||n.querySelector?.('.crown-art')))))schedule();}).observe(document.documentElement,{childList:true,subtree:true});
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['class','data-setting-motion']});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',schedule);document.addEventListener('arcade-settings-change',schedule);schedule();
}
