'use strict';
globalThis.BalloonProgress=(()=>{
 let controller,client,session,initialized=false;
 const note=t=>{const n=document.getElementById('balloon-cloud-status');if(n)n.textContent=t;};
 async function board(){try{const rows=await client.listGame('balloon',{offset:0,season:null});document.getElementById('balloon-leaderboard').replaceChildren(...rows.slice(0,5).map(r=>{const li=document.createElement('li');li.textContent='#'+r.rank+' '+r.player+' · '+r.score+' points';return li;}));}catch{note('Leaderboard unavailable. Completed runs remain saved locally.');}}
 const ready=(async()=>{const config=await fetch('../leaderboard-config.json').then(r=>r.json());session=new AccountSession.Client(config);const store=new AccountStore.Store({rules:AccountRules});controller=new AccountSync.Controller({config,store,session,rules:AccountRules});await controller.initialize(AccountRules.initial());await controller.claimStream(crypto.randomUUID());client=new Leaderboards.Client(config);client.accountSession=session;
 client.beforeFlush=async()=>{const state=controller.state(),generation=controller.generation;if(state.owner!=='guest'||!state.profile.privacy.leaderboard)throw Error('Leaderboard sharing is disabled.');await session.ensureAnonymous();const token=await session.token();if(generation!==controller.generation)throw Error('Profile changed');const visible=await client.request('/rest/v1/rpc/set_guest_leaderboard_visibility',{p_visible:true},token);if(!visible)throw Error('Leaderboard sharing is disabled.');};
 initialized=true;note('Public ranking: total difficulty-weighted points. Hold #1 to equip the Diamond Sky Balloon Cubie, Turtle and Trail from the Exclusive collection.');await board();
 })().catch(()=>note('Sign in from the arcade to save runs online.'));
 async function begin(){await ready;if(!initialized||controller.state().importRequired)return null;return{id:crypto.randomUUID(),owner:controller.state().owner,generation:controller.generation,saved:false};}
 async function finish(pending,score,difficulty){const run=await pending;if(!run||run.saved||run.owner!==controller.state().owner||run.generation!==controller.generation)return;run.saved=true;try{await controller.enqueue('arcade',{event:'balloon-result',score,difficulty},{id:run.id});if(run.owner!=='guest')await controller.flush();else if(score>0&&controller.state().profile.privacy.leaderboard)await client.submit({mode:'balloon',difficulty,score,player:controller.state().profile.player,runId:run.id});note('Run saved. Difficulty multiplier applies once on the public leaderboard.');await board();}catch{note('Run saved locally; online sync needs attention in the arcade.');}}

 return{begin,finish};
})();
