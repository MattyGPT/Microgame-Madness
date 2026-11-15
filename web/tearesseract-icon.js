'use strict';
(() => {
  const card=document.querySelector('.tearesseract-card');
  const svg=card?.querySelector('svg');
  if(!svg)return;
  const ns='http://www.w3.org/2000/svg';
  const node=(tag,attrs,parent=svg)=>{const el=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);parent.append(el);return el;};
  svg.replaceChildren();svg.setAttribute('viewBox','0 0 160 140');
  const faces=node('g',{}),edges=node('g',{'stroke-linecap':'round'}),stars=node('g',{});
  const vertices=Array.from({length:16},(_,i)=>[0,1,2,3].map(bit=>(i>>bit&1)?1:-1));
  const links=[];
  for(let i=0;i<16;i++)for(let bit=0;bit<4;bit++)if(!(i&(1<<bit)))links.push({a:i,b:i|(1<<bit),el:node('path',{'fill':'none'},edges)});
  const panels=[];
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)for(let v=0;v<16;v++)if(!(v&(1<<a))&&!(v&(1<<b)))panels.push({ids:[v,v|(1<<a),v|(1<<a)|(1<<b),v|(1<<b)],el:node('polygon',{},faces)});
  const dots=vertices.map(()=>node('circle',{r:1.4,fill:'#d6fff7'},stars));
  node('circle',{cx:80,cy:70,r:3,fill:'#edfff9'},stars);
  node('path',{d:'M73 70H87M80 63V77',stroke:'#b0ffe9','stroke-width':.7,opacity:.7},stars);
  const rotate=(v,a,b,angle)=>{const x=v[a],y=v[b],c=Math.cos(angle),s=Math.sin(angle);v[a]=x*c-y*s;v[b]=x*s+y*c;};
  function render(time){
    const points=vertices.map(original=>{
      const v=[...original];
      rotate(v,0,3,time*.53+.4);rotate(v,1,3,time*.31+.6);rotate(v,2,3,time*.19);
      rotate(v,0,2,time*.22+.5);rotate(v,1,2,.35);rotate(v,0,1,time*.09);
      const perspective4=2.8/(3.6-v[3]);
      const x=v[0]*perspective4,y=v[1]*perspective4,z=v[2]*perspective4;
      const perspective3=4.8/(5.8-z);
      return {x:80+x*perspective3*25,y:70+y*perspective3*25,z:z+v[3]*.35};
    });
    for(const face of panels){face.el.setAttribute('points',face.ids.map(i=>`${points[i].x.toFixed(2)},${points[i].y.toFixed(2)}`).join(' '));face.el.setAttribute('fill',face.ids[0]&8?'#856bff':'#3df6d8');face.el.setAttribute('fill-opacity',.045);}
    for(const edge of links){const a=points[edge.a],b=points[edge.b],depth=Math.max(0,Math.min(1,((a.z+b.z)/2+2)/4));edge.el.setAttribute('d',`M${a.x.toFixed(2)} ${a.y.toFixed(2)}L${b.x.toFixed(2)} ${b.y.toFixed(2)}`);edge.el.setAttribute('stroke',edge.a&8?'#a99bff':'#7affdf');edge.el.setAttribute('stroke-opacity',(.3+depth*.7).toFixed(2));edge.el.setAttribute('stroke-width',(.65+depth*1.1).toFixed(2));}
    dots.forEach((el,i)=>{el.setAttribute('cx',points[i].x);el.setAttribute('cy',points[i].y);});
  }
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,frame=0,last=0,time=0,paint=0;
  const enabled=()=>visible&&!document.hidden&&!reduced.matches&&!document.documentElement.classList.contains('account-reduced-motion')&&!card.classList.contains('card-effects-paused');
  function tick(now){frame=0;if(!enabled())return;time+=last?Math.min(.05,(now-last)/1000):0;last=now;if(now-paint>=1000/30){render(time);paint=now;}frame=requestAnimationFrame(tick);}
  function sync(){if(enabled()){if(!frame){last=0;frame=requestAnimationFrame(tick);}}else{cancelAnimationFrame(frame);frame=0;last=0;}}
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(card);
  const observer=new MutationObserver(sync);observer.observe(card,{attributes:true,attributeFilter:['class']});observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);render(.8);
})();
