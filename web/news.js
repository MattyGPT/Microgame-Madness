'use strict';
(() => {
 const $=id=>document.getElementById(id), dialog=$('news-dialog');
 let config, moderator=false, localModerator=false, teamMember=false, posts=[], tab='posts', busy=false, observer;

 const timers=new Map();let feedCache=null, localLikeCache=new Set(), refreshGen=0, closingDialog=false;
 let read=new Set(), readOwner='';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function postBody(body){
  const text=String(body||''),video=text.match(/^https:\/\/microgame-madness\.com\/media\/[a-z0-9-]+\.mp4$/m);
  if(!video)return `<p class="news-body">${esc(text)}</p>`;
  const idx=text.indexOf(video[0]),before=text.slice(0,idx),after=text.slice(idx+video[0].length);
  return `<p class="news-body">${esc(before.trim())}</p><figure class="news-video"><video controls playsinline preload="metadata" src="${esc(video[0])}" poster="${esc(video[0].replace('.mp4','.jpg'))}" aria-label="Gameplay preview"></video><figcaption>Gameplay sneak peek · <a href="${esc(video[0])}" target="_blank" rel="noopener">Open video ↗</a></figcaption></figure><p class="news-body">${esc(after.trim())}</p>`;
 }
 function session(){return typeof accountApp!=='undefined'?accountApp?.session:null;}
 function signedInUser(){const user=session()?.snapshot()?.user;return user&&!user.is_anonymous?user:null;}
 function key(){return 'microgame.news.seen.'+(signedInUser()?.id||'guest');}
 function seen(){if(readOwner!==key()){readOwner=key();read=new Set();}try{return new Set([...JSON.parse(localStorage.getItem(key())||'[]'),...read]);}catch{return read;}}
 async function rpc(name,body={}) {
  config ||= await fetch('./leaderboard-config.json').then(r=>r.json());
  const headers={'Content-Type':'application/json',apikey:config.key};
  if(signedInUser())headers.Authorization='Bearer '+await session().token();
  const r=await fetch(config.url+'/rest/v1/rpc/'+name,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
  if(!r.ok){const err=Error(['news_action','news_suggestion_like'].includes(name)?'Sign in to participate, then try again.':name==='news_discussion'?'Sign in to comment or like. Reading discussions is public.':'News is unavailable. Please try again.');err.status=r.status;throw err;}
  return r.json();
 }
 async function localAdmin(body){const r=await fetch('/__news',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error);return data;}
 async function admin(body){
  if(teamMember)return rpc('news_team',{action:body.action,target:body.id||null,title:body.title||null,body:body.body||null});
  return localAdmin(body);
 }
 async function permissions(){
  const previous=moderator;
  const user=signedInUser();
  if(!user){teamMember=false;}
  else{try{teamMember=Boolean((await rpc('news_team')).moderator);}catch(err){if(err?.status===401||err?.status===403)teamMember=false;}}
  moderator=localModerator||teamMember;
  $('news-publish').hidden=tab!=='posts'||!moderator;
  $('news-moderation').hidden=!moderator;
  $('news-creator-label').textContent=teamMember?'Aidan’s moderator desk':'Nate’s creator desk';
  window.dispatchEvent(new CustomEvent('news-access',{detail:{allowed:moderator}}));
  if(previous!==moderator&&dialog.open)refresh();
 }
 globalThis.NewsCommunity={rpc,session,allowed:()=>moderator,chat:body=>teamMember?rpc('news_chat',body===undefined?{}:{body}):localAdmin({action:'chat',...(body===undefined?{}:{body})})};
 let subscribed=null,feedIdentity=key();
 function watchIdentity(){
  const current=session();
  if(current&&current!==subscribed){subscribed=current;current.subscribe(()=>{if(feedIdentity!==key()){if(popup.open)popup.close();feedIdentity=key();feedCache=null;posts=[];badge();refresh();}teamMember=false;moderator=localModerator;window.dispatchEvent(new CustomEvent('news-access',{detail:{allowed:moderator,identityChanged:true}}));permissions();});}
  if(!document.hidden)permissions();
 }
 function badge(){const news=posts.filter(p=>!p.seen&&!seen().has(p.id)).length,suggestions=(feedCache?.comments||[]).reduce((n,c)=>n+(Number(c.unread_count)||0),0),total=news+suggestions;
 for(const [id,n] of [['news-badge',total],['news-posts-badge',news],['news-suggestions-badge',suggestions]]){const el=$(id);el.textContent=n;el.hidden=!n;}
 $('news-open').setAttribute('aria-label',`Microgame News, ${news} unread posts, ${suggestions} new comments on your suggestions`);
 $('news-posts').setAttribute('aria-label',`News, ${news} unread posts`);$('news-suggestions').setAttribute('aria-label',`Suggestions, ${suggestions} new comments on your suggestions`);
 }
 function creatorLikes(row){const names=[...new Set(row.creator_likes||[])];return names.length?`<span class="news-creator-like">★ Liked by ${names.length} creator${names.length===1?'':'s'} (${names.map(esc).join(', ')})</span>`:row.creator_liked?'<span class="news-creator-like">★ Liked by a creator</span>':'';}

 function musicState(){document.dispatchEvent(new Event('news-room-state'));}
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
    if(signedInUser())try{await rpc('news_action',{action:'seen',target:id});}catch{}
   },5000));
  }),{threshold:[0],root:$('news-scroll')});
  dialog.querySelectorAll('[data-post]').forEach(el=>observer.observe(el));
 }
 function art(id){return CubieCustoms.svg(CubieCustoms.catalog.find(c=>c.id===id)||CubieCustoms.catalog[0]);}
 function discussionButton(kind,id,count,unread=0){const n=Number(count)||0,u=Number(unread)||0;return `<button type="button" class="news-comments-button" data-discussion="${esc(id)}" data-kind="${esc(kind)}">Comments · ${n}${u?` <span class="news-count">${u} new</span>`:''}</button>`;}
 const popup=document.createElement('dialog');popup.id='news-comments-dialog';popup.className='news-dialog news-discussion';
 popup.innerHTML=`<header class="news-discussion-heading"><h2>Comments</h2><button type="button" id="discussion-close" aria-label="Close comments">✕</button></header><p id="discussion-context"></p><div id="discussion-list" aria-live="polite"></div><form id="discussion-form"><p id="discussion-parent"></p><label for="discussion-body">Join the conversation</label><textarea id="discussion-body" maxlength="1000" required placeholder="Kind words and bright ideas…"></textarea><small>One comment every 3 seconds.</small><p><button type="submit">Post comment</button></p></form><p id="discussion-status" role="alert"></p>`;
 document.body.append(popup);
 let discussion=null,discussionRows=[],discussionBusy=false,replyTo=null,nextComment=0;
 const discussionDrafts=new Map();
 const discussionKey=()=>discussion?discussion.storageKey:'';
 async function discuss(action,target,body,parent){return localModerator?localAdmin({action:'discussion',operation:action,id:target,kind:discussion.kind,...(body===undefined?{}:{body}),parent}):rpc('news_discussion',{action,target,kind:discussion.kind,body:body??null,parent:parent||null});}
 function kindNotice(result){$('news-kind-art').innerHTML=art('classic');$('news-kind-message').textContent=`You will be temporarily banned from commenting for ${result.hours?'24 hours':'10 minutes'}. Please keep the arcade friendly. Five violations lead to a 24-hour commenting ban.`;$('news-kind').showModal();}
 function replyBanner(){const row=discussionRows.find(r=>r.id===replyTo);$('discussion-parent').innerHTML=row?`Replying to <strong>${esc(row.label)}</strong> <button type="button" id="discussion-cancel-reply">Cancel</button>`:'';if($('discussion-cancel-reply'))$('discussion-cancel-reply').onclick=()=>{replyTo=null;replyBanner();};}
 async function loadDiscussion(){const currentKey=discussionKey(),rows=await discuss('list',discussion.id);if(currentKey!==discussionKey()||!popup.open)return;discussionRows=rows;
  $('discussion-list').innerHTML=rows.map(r=>{const parent=rows.find(p=>p.id===r.parent);return `<article class="news-reply ${r.creator?(r.label==='Nate'?'news-reply-nate':'news-reply-aidan'):''} ${parent?'news-discussion-child':''}"><header><strong>${esc(r.label)} ${r.creator?'<span>★ CREATOR</span>':''}</strong><small>${esc(new Date(r.created_at).toLocaleString())}</small></header>${parent?`<small>↳ Replying to ${esc(parent.label)}</small>`:''}<p class="news-body">${esc(r.body)}</p><button type="button" data-comment-like="${esc(r.id)}" aria-pressed="${Boolean(r.liked)}">${r.liked?'♥':'♡'} ${Number(r.likes)||0}</button>${creatorLikes(r)} <button type="button" data-comment-reply="${esc(r.id)}">Reply</button>${r.can_delete?` <button type="button" data-comment-delete="${esc(r.id)}">Delete</button>`:''}</article>`;}).join('')||'<p class="news-empty">Start the conversation!</p>';replyBanner();
  if(discussion.kind==='suggestion'&&signedInUser()&&!document.hidden){await rpc('news_discussion_seen',{target:discussion.id,seen_replies:rows.map(r=>r.id)});if(currentKey===discussionKey()&&popup.open){const c=feedCache?.comments?.find(c=>c.id===discussion.id);if(c)c.unread_count=0;badge();}}
 }
 async function openDiscussion(id,kind){discussion={id,kind,storageKey:key()+kind+id};replyTo=null;discussionRows=[];$('discussion-list').textContent='Loading comments…';$('discussion-status').textContent='';$('discussion-body').value=discussionDrafts.get(discussionKey())||'';$('discussion-context').textContent=kind==='post'?(posts.find(p=>p.id===id)?.title||'News discussion'):'Suggestion discussion';replyBanner();dialog.querySelectorAll('video').forEach(v=>v.pause());popup.showModal();try{await loadDiscussion();}catch(e){$('discussion-status').textContent=e.message;}}
 $('discussion-close').onclick=()=>popup.close();
 popup.addEventListener('close',()=>{if(discussion)discussionDrafts.set(discussion.storageKey,$('discussion-body').value);discussion=null;if(!closingDialog&&dialog.open)refresh();});
 $('discussion-body').oninput=()=>{if(discussion)discussionDrafts.set(discussion.storageKey,$('discussion-body').value);};
 $('discussion-list').onclick=async e=>{const b=e.target.closest('button');if(!b||discussionBusy)return;if(b.dataset.commentReply){replyTo=b.dataset.commentReply;replyBanner();$('discussion-body').focus();return;}discussionBusy=true;try{if(b.dataset.commentLike)await discuss('like',b.dataset.commentLike);else if(b.dataset.commentDelete){if(!await ArcadeDialogs.ask({title:'Delete this comment?',message:'This removes the comment for everyone. This cannot be undone.',acceptLabel:'Delete comment',danger:true}))return;await discuss('delete',b.dataset.commentDelete);}else return;await loadDiscussion();}catch(error){$('discussion-status').textContent=error.message;}finally{discussionBusy=false;}};
 $('discussion-form').onsubmit=async e=>{e.preventDefault();if(discussionBusy)return;if(!localModerator&&!signedInUser()){$('discussion-status').textContent='Sign in to join the conversation.';return;}if(Date.now()<nextComment){$('discussion-status').textContent='Please wait 3 seconds between comments.';return;}discussionBusy=true;const button=e.target.querySelector('[type=submit]');button.disabled=true;
  try{const result=await discuss('create',discussion.id,$('discussion-body').value,replyTo);if(result.kind){kindNotice(result);return;}if(result.error)throw Error(result.error);nextComment=Date.now()+3000;discussionDrafts.delete(discussionKey());$('discussion-body').value='';replyTo=null;$('discussion-status').textContent='Comment posted.';await loadDiscussion();}
  catch(error){$('discussion-status').textContent=error.message;}finally{discussionBusy=false;button.disabled=false;}
 };
 async function refresh(useCache=false){
  const gen=++refreshGen;
  try{
   const owner=key(),data=useCache===true&&feedCache?feedCache:await rpc('news_feed');if(gen!==refreshGen||owner!==key())return;feedCache=data;posts=data.posts;badge();
   if(useCache!==true)$('news-updated').textContent='Updated '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
   const query=$('news-search').value.trim().toLowerCase(),filter=$('news-filter').value;
   const rows=(tab==='posts'?posts:data.comments).filter(row=>[row.title,row.body,row.name,row.author_label].some(text=>String(text||'').toLowerCase().includes(query))).filter(row=>filter==='unread'&&tab==='posts'?!row.seen&&!seen().has(row.id):filter==='creator'&&tab==='suggestions'?row.creator_liked:true).slice().sort((a,b)=>$('news-sort').value==='popular'?(b.likes||0)-(a.likes||0)||Date.parse(b.created_at)-Date.parse(a.created_at):Date.parse(b.created_at)-Date.parse(a.created_at));
   $('news-results').textContent=`${rows.length} ${tab==='posts'?'updates':'ideas'} · Latest 100 on the board`;
   $('news-list').setAttribute('aria-labelledby','news-'+tab);
   let localLikes=new Set();
   if(localModerator&&tab==='suggestions'){if(useCache!==true){const fetched=new Set((await localAdmin({action:'suggestionLikes'})).map(row=>row.comment));if(gen!==refreshGen||owner!==key())return;localLikeCache=fetched;}localLikes=localLikeCache;}
   $('news-reward').hidden=tab!=='suggestions';
   $('news-reward-art').innerHTML=art('news_anchor');$('news-reward-progress').value=data.reward?.earned?10:Math.min(10,data.reward?.approved||0);
   $('news-reward-copy').textContent=data.reward?.earned?'Front-Page Thinker achievement earned · Empyrorite News Cubie unlocked!':`Empyrorite News Cubie · ${data.reward?.approved||0}/10 suggestions liked by Nate or Aidan. Each suggestion counts once. Sign in to save your reward.`;
   if(useCache!==true&&data.reward&&signedInUser()&&typeof accountApp!=='undefined'&&(data.reward.earned?(!saved.shop.owned.includes('news_anchor')||!saved.achievements.unlocked.news_ideas_10):saved.achievements.stats.creatorApprovedIdeas!==Number(data.reward.approved))){
    try{await accountApp.controller.flush();await accountApp.controller.pull();if(gen===refreshGen&&owner===key())accountApp.applyCurrent();}catch{}
   }
   if(gen!==refreshGen||owner!==key())return;
   dialog.querySelectorAll('video').forEach(video=>video.pause());
   $('news-list').innerHTML=tab==='posts'?rows.map(p=>`<article class="news-entry ${p.author_label==='Aidan, the gametester'?'news-fire':'news-galaxy'}" data-post="${esc(p.id)}"><p class="eyebrow">${esc(p.author_label||'Nate, the creator')} · ${esc(new Date(p.created_at).toLocaleDateString())}</p><h3>${esc(p.title)}</h3>${postBody(p.body)}<button data-like="${esc(p.id)}" aria-pressed="${Boolean(p.liked)}">${p.liked?'♥ Liked':'♡ Like'} · ${Number(p.likes)||0}</button>${discussionButton('post',p.id,p.comment_count)}${moderator?` <button data-delete-post="${esc(p.id)}">Delete post</button>`:''}</article>`).join('')||'<p class="news-empty">Fresh from the arcade, soon.<br>Updates and bug fixes will appear here.</p>':
   rows.map(c=>`<article class="news-entry news-suggestion"><header class="news-author"><span class="news-avatar">${art(c.cubie)}</span><div><strong>${esc(c.name)}</strong><div>${(c.medals||[]).map(m=>`${['','🥇','🥈','🥉'][m.place]||''} ${esc(m.game)}`).join(' · ')}</div><small>${esc(new Date(c.created_at).toLocaleString())}</small></div></header><p class="news-body">${esc(c.body)}</p><button data-suggestion-like="${esc(c.id)}" aria-pressed="${Boolean(localModerator?localLikes.has(c.id):c.liked)}">${(localModerator?localLikes.has(c.id):c.liked)?'♥ Liked':'♡ Like'} · ${Number(c.likes)||0}</button>${creatorLikes(c)} ${moderator?`<button data-delete="${esc(c.id)}">Delete for everyone</button> <button data-block="${esc(c.id)}">Block commenting</button>`:''}${discussionButton('suggestion',c.id,c.replies?.length,c.unread_count)}</article>`).join('')||'<p class="news-empty">What should we make next?<br>Be the first to share an idea.</p>';
   if(!rows.length&&(query||filter!=='all'))$('news-list').innerHTML='<p class="news-empty">No matches yet. Try another search or choose Everything.</p>';
   $('news-status').textContent='';observe();musicState();
  }catch(e){if(gen===refreshGen)$('news-status').textContent=e.message;}
 }
 async function act(fn){if(busy)return;busy=true;try{await fn();}catch(e){$('news-status').textContent=e.message;}finally{busy=false;}}
 $('news-open').onclick=()=>{$('news-sort').value=globalThis.ArcadeSettings?.get('newsSort')||'newest';$('news-filter').value=globalThis.ArcadeSettings?.get('newsFilter')||'all';dialog.showModal();musicState();refresh();};
 $('news-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{closingDialog=true;if(popup.open)popup.close();closingDialog=false;stop();dialog.querySelectorAll('video').forEach(video=>video.pause());musicState();});
 for(const event of ['play','pause','ended','emptied'])dialog.addEventListener(event,e=>{if(e.target.tagName==='VIDEO'){if(event==='play')dialog.querySelectorAll('video').forEach(video=>{if(video!==e.target)video.pause();});musicState();}},true);
 document.addEventListener('visibilitychange',observe);
 $('news-refresh').onclick=()=>act(async()=>{const button=$('news-refresh');button.disabled=true;button.textContent='Refreshing…';try{await refresh();}finally{button.disabled=false;button.textContent='Refresh';}});
 for(const id of ['news-search','news-sort','news-filter'])$(id).addEventListener(id==='news-search'?'input':'change',()=>refresh(true));
 for(const name of ['posts','suggestions'])$('news-'+name).onclick=()=>{tab=name;for(const t of ['posts','suggestions'])$('news-'+t).setAttribute('aria-selected',String(t===tab));$('news-compose').hidden=tab!=='suggestions';$('news-publish').hidden=tab!=='posts'||!moderator;refresh();};
 $('news-list').onclick=e=>{act(async()=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.discussion){await openDiscussion(b.dataset.discussion,b.dataset.kind);return;}
  if(b.dataset.suggestionLike){if(localModerator)await localAdmin({action:'suggestionLike',id:b.dataset.suggestionLike});else await rpc('news_suggestion_like',{target:b.dataset.suggestionLike});}
  if(b.dataset.like)await rpc('news_action',{action:'like',target:b.dataset.like});
  for(const [field,action] of [['delete','delete'],['block','block'],['deletePost','deletePost']])if(b.dataset[field]){
   if(!await ArcadeDialogs.ask({title:action==='block'?'Block this player?':'Delete this post or suggestion?',message:action==='block'?'This player will no longer be able to comment until a moderator unblocks them.':'This removes it for everyone. This cannot be undone.',acceptLabel:action==='block'?'Block commenting':'Delete for everyone',danger:true}))return;
   await admin({action,id:b.dataset[field]});
  }
  await refresh();
 });};
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
 watchIdentity();
 if(typeof accountApp!=='undefined'&&accountApp?.ready?.then)accountApp.ready.then(watchIdentity, ()=>{});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)watchIdentity();});
 setInterval(watchIdentity,10000);
 refresh();setInterval(()=>{if(!document.hidden&&!busy&&!popup.open&&![...dialog.querySelectorAll('video')].some(video=>!video.paused&&!video.ended))refresh();},60000);
})();
