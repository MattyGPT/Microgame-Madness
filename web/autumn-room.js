'use strict';
(() => {
 const $=id=>document.getElementById(id),room=$('autumn-room');
 let allowed=false, timer=null, loading=false, generation=0, lastIds=null, audio=null, musicTimer=null, master=null;
 const api=()=>globalThis.NewsCommunity;
 function stopMusic(){clearInterval(musicTimer);musicTimer=null;if(audio){audio.close().catch(()=>{});audio=null;master=null;}$('autumn-music').textContent='♫ Play lo-fi';$('autumn-music').setAttribute('aria-pressed','false');}
 async function startMusic(){
  const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw Error('Audio is unavailable in this browser.');
  const started=audio=new Context();await started.resume();if(audio!==started||!room.open)return;
  master=audio.createGain();master.gain.value=Number($('autumn-volume').value)/100*.45;
  const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2600;master.connect(filter);filter.connect(audio.destination);
  const chords=[[48,55,59,62,67],[45,52,55,59,64],[41,48,52,57,60],[43,50,53,57,62]];
  const beat=60/72;let bar=0,next=audio.currentTime+.08;
  function note(midi,at,duration,volume,type='sine'){
   const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type=type;oscillator.frequency.value=440*2**((midi-69)/12);
   gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.025);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
   oscillator.connect(gain);gain.connect(master);oscillator.start(at);oscillator.stop(at+duration+.03);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
  function brush(at,volume){const buffer=audio.createBuffer(1,audio.sampleRate*.11,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length)**3;const source=audio.createBufferSource(),gain=audio.createGain(),f=audio.createBiquadFilter();source.buffer=buffer;f.type='highpass';f.frequency.value=2500;gain.gain.value=volume;source.connect(f);f.connect(gain);gain.connect(master);source.start(at);source.onended=()=>{source.disconnect();f.disconnect();gain.disconnect();};}
  function schedule(){if(!audio)return;while(next<audio.currentTime+1){const chord=chords[bar%4];chord.forEach((n,i)=>note(n,next+i*.018,beat*3.8,.08,'triangle'));note(chord[0]-12,next,beat*1.7,.24);note(chord[0]-12,next+beat*2.15,beat*1.5,.16);for(let n=0;n<4;n++){note(31,next+n*beat,.17,n%2?.07:.2);brush(next+n*beat+beat*.57,.1);if(n%2)brush(next+n*beat+.025,.3);}note(chord[3]+12,next+beat*1.55,beat,.08);note(chord[2]+12,next+beat*2.65,beat*1.2,.07);bar++;next+=beat*4;}}
  schedule();musicTimer=setInterval(schedule,200);$('autumn-music').textContent='Ⅱ Pause lo-fi';$('autumn-music').setAttribute('aria-pressed','true');
 }
 function render(rows){
  const ids=rows.map(r=>r.id).join(',');if(ids===lastIds)return;
  const list=$('autumn-messages'),atBottom=list.scrollHeight-list.scrollTop-list.clientHeight<65;
  const first=!lastIds;lastIds=ids;list.replaceChildren();
  for(const row of rows){const article=document.createElement('article');article.className='autumn-message'+(row.mine?' is-mine':'');const label=document.createElement('strong');label.textContent=row.label;const time=document.createElement('time');time.dateTime=row.created_at;time.textContent=new Date(row.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});const body=document.createElement('p');body.textContent=row.body;article.append(label,time,body);list.append(article);}
  if(atBottom||first)list.scrollTop=list.scrollHeight;
 }
 async function refresh(manual=false){if(!room.open||document.hidden||!allowed||loading)return;loading=true;$('autumn-refresh').disabled=true;$('autumn-refresh').textContent='↻ Refreshing…';const version=generation;try{const rows=await api().chat();if(version!==generation||!room.open)return;render(rows);$('autumn-status').textContent=manual===true?'Room refreshed · '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';}catch(e){if(version===generation)$('autumn-status').textContent=e.message;}finally{loading=false;$('autumn-refresh').disabled=false;$('autumn-refresh').textContent='↻ Refresh the room';}}
 window.addEventListener('news-access',e=>{allowed=e.detail.allowed;$('autumn-open').hidden=!allowed;if(!allowed||e.detail.identityChanged){generation++;room.close();$('autumn-messages').replaceChildren();$('autumn-message').value='';lastIds=null;stopMusic();}});
 $('autumn-open').onclick=()=>{if(!allowed)return;room.showModal();document.dispatchEvent(new Event('autumn-room-state'));startMusic().catch(()=>{stopMusic();$('autumn-status').textContent='Tap Play lo-fi to start the music.';});refresh();clearInterval(timer);timer=setInterval(refresh,5000);};
 $('autumn-refresh').onclick=()=>refresh(true);
 $('autumn-close').onclick=()=>room.close();
 room.addEventListener('close',()=>{generation++;clearInterval(timer);stopMusic();document.dispatchEvent(new Event('autumn-room-state'));});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMusic();else refresh();});
 $('autumn-music').onclick=async()=>{try{if(audio)stopMusic();else await startMusic();}catch{stopMusic();$('autumn-status').textContent='Could not start audio. Please try again.';}};
 $('autumn-volume').oninput=()=>{if(master&&audio)master.gain.setTargetAtTime(Number($('autumn-volume').value)/100*.45,audio.currentTime,.08);};
 $('autumn-compose').onsubmit=async e=>{
  e.preventDefault();if(!allowed)return;const button=e.submitter,version=generation;button.disabled=true;
  try{const rows=await api().chat($('autumn-message').value);if(version!==generation)return;render(rows);$('autumn-message').value='';$('autumn-status').textContent='';$('autumn-messages').scrollTop=$('autumn-messages').scrollHeight;}
  catch(err){if(version===generation)$('autumn-status').textContent=err.message;}finally{button.disabled=false;}
 };
})();
