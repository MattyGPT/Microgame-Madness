'use strict';
const TearesseractDeath=(()=>{
  let running=false;
  function scream(rate,duration,offset=0){
    const data=new Float32Array(Math.ceil(rate*duration));let phase=0,held=0,noise=0;
    for(let i=0;i<data.length;i++){
      const local=i/rate,t=local+offset;
      const pitch=[260,195,390,225,310,170][Math.floor(t*13)%6];
      phase+=2*Math.PI*(pitch+55*Math.sin(t*37)+24*Math.sin(t*89))/rate;
      if(i%Math.max(1,Math.round(rate/6500))===0){
        noise=Math.sin(i*127.1+phase*19)*.16;
        held=Math.sin(phase)+.55*Math.sin(phase*2.013)+.28*Math.sin(phase*3.97)+noise;
      }
      const chop=Math.sin(t*83)>-.2?1:.28;
      const growl=.35*Math.sin(2*Math.PI*78*t+Math.sin(t*21)*2);
      const envelope=Math.min(1,local/.012,(duration-local)/.022);
      data[i]=Math.tanh((held*chop+growl)*1.8)*.58*envelope;
    }
    return data;
  }
  function distort(started,home,context,muted){
    if(running)return;running=true;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const style=document.createElement('style');style.textContent=`html.tea-breach{scroll-behavior:auto!important}html.tea-breach body{filter:drop-shadow(14px 0 #e859a6) drop-shadow(-14px 0 #48d8e5) saturate(1.8)}.tea-breach-overlay{position:fixed;inset:0;z-index:2147483647;pointer-events:none;background:repeating-linear-gradient(0deg,#09051433 0 3px,transparent 3px 8px);color:#dca7ed;font:bold 22px monospace;display:grid;place-items:center;text-shadow:3px 0 #743d94,-3px 0 #155b6e}.tea-breach-tear{position:absolute;left:-5%;width:110%;height:5%;background:linear-gradient(90deg,#4ddaff20,#d07aff38,transparent);border-top:2px solid #82e8fa77;backdrop-filter:invert(.12) hue-rotate(75deg);box-shadow:0 5px 0 #06041480;transform:skewX(-14deg)}.tea-breach-overlay span{position:relative;z-index:1;background:#080612de;padding:20px;border:1px solid #bb78dd}`;
    document.documentElement.append(style);document.documentElement.classList.add('tea-breach');
    const overlay=document.createElement('div');overlay.className='tea-breach-overlay';overlay.innerHTML='<span>CONNECTION SEVERED // REALITY BREACH</span>';document.documentElement.append(overlay);
    const tears=[];if(!reduced)for(let i=0;i<7;i++){const tear=document.createElement('i');tear.className='tea-breach-tear';overlay.append(tear);tears.push(tear);}
    let sound=context;
    if(!muted)try{
      sound??=new (window.AudioContext||window.webkitAudioContext)();sound.resume().catch(()=>{});
      const duration=Math.max(.01,(started+3000-Date.now())/1000),buffer=sound.createBuffer(1,Math.ceil(sound.sampleRate*duration),sound.sampleRate),data=buffer.getChannelData(0);
      data.set(scream(sound.sampleRate,duration,(Date.now()-started)/1000));
      const source=sound.createBufferSource(),gain=sound.createGain();source.buffer=buffer;gain.gain.value=.9;source.connect(gain).connect(sound.destination);source.start();
    }catch{}
    const timer=setInterval(()=>{
      const elapsed=Date.now()-started;
      if(elapsed>=3000){clearInterval(timer);document.documentElement.classList.remove('tea-breach');overlay.remove();style.remove();const url=new URL(location.href);url.searchParams.delete('tearesseract-breach');url.searchParams.delete('breach-muted');history.replaceState(null,'',url);location.reload();return;}
      if(!reduced){document.body?.style.setProperty('translate',`${Math.round((Math.random()-.5)*64)}px ${Math.round((Math.random()-.5)*28)}px`);document.body?.style.setProperty('transform',`skewX(${(Math.random()-.5)*3}deg) scale(1.025)`);overlay.style.clipPath=`inset(${Math.random()*3}% 0 ${Math.random()*3}% 0)`;for(const tear of tears){tear.style.top=`${Math.random()*100}%`;tear.style.height=`${1+Math.random()*9}%`;tear.style.translate=`${(Math.random()-.5)*90}px 0`;}if(home)scrollTo({top:Math.random()*Math.max(0,document.documentElement.scrollHeight-innerHeight),behavior:'instant'});}
      overlay.querySelector('span').textContent=elapsed%400<150?'TEARESSERACT // SIGNAL CORRUPTED':'CONNECTION SEVERED // REALITY BREACH';
    },45);
    if(!home)setTimeout(()=>{location.replace(`./?tearesseract-breach=${started}${muted?'&breach-muted=1':''}`);},950);
  }
  function start(context,muted=false){distort(Date.now(),false,context,muted);}
  const query=new URLSearchParams(location.search),stamp=Number(query.get('tearesseract-breach'));
  if(stamp>0&&Date.now()-stamp<10000)distort(stamp,true,null,query.has('breach-muted'));
  return {start,scream};
})();
