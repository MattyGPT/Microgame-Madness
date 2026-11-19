'use strict';
(() => {
 const $=id=>document.getElementById(id), dialog=$('news-dialog');
 let config, moderator=false, localModerator=false, teamMember=false, posts=[], tab='posts', busy=false, observer;
 const timers=new Map();
 let read=new Set(), readOwner='';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function session(){return typeof accountApp!=='undefined'?accountApp?.session:null;}
 function key(){return 'microgame.news.seen.'+(session()?.snapshot()?.user?.id||'guest');}
 function seen(){if(readOwner!==key()){readOwner=key();read=new Set();}try{return new Set([...JSON.parse(localStorage.getItem(key())||'[]'),...read]);}catch{return read;}}
 async function rpc(name,body={}) {
  config ||= await fetch('./leaderboard-config.json').then(r=>r.json());
  const headers={'Content-Type':'application/json',apikey:config.key};
  if(session()?.snapshot()?.user)headers.Authorization='Bearer '+await session().token();
  const r=await fetch(config.url+'/rest/v1/rpc/'+name,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw Error(name==='news_action'?'Sign in to participate, then try again.':'News is unavailable. Please try again.');
  return r.json();
 }
 async function localAdmin(body){const r=await fetch('/__news',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error);return data;}
 async function admin(body){
  if(teamMember)return rpc('news_team',{action:body.action,target:body.id||null,title:body.title||null,body:body.body||null});
  return localAdmin(body);
 }
 async function permissions(){
  const previous=moderator;
  try{teamMember=Boolean(session()?.snapshot()?.user&&(await rpc('news_team')).moderator);}catch{teamMember=false;}
  moderator=localModerator||teamMember;
  $('news-publish').hidden=tab!=='posts'||!moderator;
  $('news-moderation').hidden=!moderator;
  $('news-creator-label').textContent=teamMember?'Aidan’s moderator desk':'Nate’s creator desk';
  window.dispatchEvent(new CustomEvent('news-access',{detail:{allowed:moderator}}));
  if(previous!==moderator&&dialog.open)refresh();
 }
 globalThis.NewsCommunity={rpc,session,allowed:()=>moderator,chat:body=>teamMember?rpc('news_chat',body===undefined?{}:{body}):localAdmin({action:'chat',...(body===undefined?{}:{body})})};
 let subscribed=null;
 function watchIdentity(){
  const current=session();
  if(current&&current!==subscribed){subscribed=current;current.subscribe(()=>{teamMember=false;moderator=localModerator;window.dispatchEvent(new CustomEvent('news-access',{detail:{allowed:moderator,identityChanged:true}}));permissions();});}
  permissions();
 }
 function badge(){const n=posts.filter(p=>!p.seen&&!seen().has(p.id)).length;$('news-badge').textContent=n;$('news-badge').hidden=!n;$('news-open').setAttribute('aria-label',`Microgame News, ${n} unread posts`);}
 function stop(){timers.forEach(clearTimeout);timers.clear();observer?.disconnect();}
 function observe(){
  stop();if(!dialog.open||tab!=='posts'||document.hidden)return;
  observer=new IntersectionObserver(entries=>entries.forEach(e=>{
   const id=e.target.dataset.post;
   if(!e.isIntersecting||e.intersectionRatio<=0){clearTimeout(timers.get(id));timers.delete(id);return;}
   if(seen().has(id)||timers.has(id))return;
   timers.set(id,setTimeout(async()=>{
    timers.delete(id);if(document.hidden||!dialog.open||tab!=='posts')return;
    read.add(id);try{localStorage.setItem(key(),JSON.stringify([...seen()]));}catch{}
    const p=posts.find(p=>p.id===id);if(p)p.seen=true;badge();
    if(session()?.snapshot()?.user)try{await rpc('news_action',{action:'seen',target:id});}catch{}
   },5000));
  }),{threshold:[0],root:$('news-scroll')});
  dialog.querySelectorAll('[data-post]').forEach(el=>observer.observe(el));
 }
 function art(id){return CubieCustoms.svg(CubieCustoms.catalog.find(c=>c.id===id)||CubieCustoms.catalog[0]);}
 async function refresh(){
  try{
   const data=await rpc('news_feed');posts=data.posts;badge();
   $('news-list').innerHTML=tab==='posts'?posts.map(p=>`<article class="news-entry ${p.author_label==='Aidan, the gametester'?'news-fire':'news-galaxy'}" data-post="${esc(p.id)}"><p class="eyebrow">${esc(p.author_label||'Nate, the creator')} · ${esc(new Date(p.created_at).toLocaleDateString())}</p><h3>${esc(p.title)}</h3><p class="news-body">${esc(p.body)}</p><button data-like="${p.id}" aria-pressed="${p.liked}">${p.liked?'♥ Liked':'♡ Like'} · ${p.likes}</button>${moderator?` <button data-delete-post="${p.id}">Delete post</button>`:''}</article>`).join('')||'<p class="news-empty">Fresh from the arcade, soon.<br>Updates and bug fixes will appear here.</p>':
   data.comments.map(c=>`<article class="news-entry"><header class="news-author"><span class="news-avatar">${art(c.cubie)}</span><div><strong>${esc(c.name)}</strong><div>${c.medals.map(m=>`${['','🥇','🥈','🥉'][m.place]} ${esc(m.game)}`).join(' · ')}</div><small>${esc(new Date(c.created_at).toLocaleString())}</small></div></header><p class="news-body">${esc(c.body)}</p>${moderator?`<button data-delete="${c.id}">Delete for everyone</button> <button data-block="${c.id}">Block commenting</button>`:''}</article>`).join('')||'<p class="news-empty">What should we make next?<br>Be the first to share an idea.</p>';
   $('news-status').textContent='';observe();
  }catch(e){$('news-status').textContent=e.message;}
 }
 async function act(fn){if(busy)return;busy=true;try{await fn();}catch(e){$('news-status').textContent=e.message;}finally{busy=false;}}
 $('news-open').onclick=()=>{dialog.showModal();refresh();};
 $('news-close').onclick=()=>dialog.close();dialog.addEventListener('close',stop);
 document.addEventListener('visibilitychange',observe);
 $('news-refresh').onclick=refresh;
 for(const name of ['posts','suggestions'])$('news-'+name).onclick=()=>{tab=name;for(const t of ['posts','suggestions'])$('news-'+t).setAttribute('aria-selected',String(t===tab));$('news-compose').hidden=tab!=='suggestions';$('news-publish').hidden=tab!=='posts'||!moderator;refresh();};
 $('news-list').onclick=e=>act(async()=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.like)await rpc('news_action',{action:'like',target:b.dataset.like});
  for(const [field,action] of [['delete','delete'],['block','block'],['deletePost','deletePost']])if(b.dataset[field]){
   if(!confirm(action==='block'?'Block this player from commenting?':'Delete this for everyone?'))return;
   await admin({action,id:b.dataset[field]});
  }
  await refresh();
 });
 $('news-compose').onsubmit=e=>{e.preventDefault();act(async()=>{
  const result=await rpc('news_action',{action:'comment',body:$('news-comment').value});
  if(result.kind){$('news-kind-art').innerHTML=art('classic');$('news-kind-message').textContent=`You will be temporarily banned from commenting for ${result.hours?'24 hours':'10 minutes'}. Please keep the arcade friendly. Five violations lead to a 24-hour commenting ban.`;$('news-kind').showModal();}
  else if(result.error)throw Error(result.error);
  else{$('news-comment').value='';await refresh();}
 });};
 $('news-kind-close').onclick=()=>$('news-kind').close();
 $('news-publish').onsubmit=e=>{e.preventDefault();act(async()=>{await admin({action:'publish',title:$('news-title').value,body:$('news-body').value});$('news-publish').reset();await refresh();});};
 $('news-blocked').onclick=()=>act(async()=>{
  const rows=await admin({action:'blocked'});$('news-block-list').replaceChildren();
  for(const row of rows){const b=document.createElement('button');b.textContent='Unblock '+(row.handle||'player');b.onclick=()=>act(async()=>{await admin({action:'unblock',id:row.owner});b.remove();});$('news-block-list').append(b);}
  if(!rows.length)$('news-block-list').textContent='No blocked players.';
 });
 if(['localhost','127.0.0.1'].includes(location.hostname))localAdmin({action:'status'}).then(()=>{localModerator=true;permissions();}).catch(()=>{});
 watchIdentity();setInterval(watchIdentity,10000);
 refresh();setInterval(()=>{if(!document.hidden&&!busy)refresh();},60000);
})();
