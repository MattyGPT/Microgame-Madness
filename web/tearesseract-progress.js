'use strict';
const TearesseractProgress=(()=>{
  let controller,session,client,initialized=false;
  const note=text=>{const node=document.querySelector('#tea-progress');if(node)node.textContent=text;};
  const ready=(async()=>{
    const config=await fetch('./leaderboard-config.json').then(r=>r.ok?r.json():{}).catch(()=>({}));
    session=new AccountSession.Client(config);
    const store=new AccountStore.Store({rules:AccountRules});
    controller=new AccountSync.Controller({config,store,session,rules:AccountRules});
    let legacy;try{legacy=JSON.parse(localStorage.getItem('microgame-madness.v1'));}catch{}
    await controller.initialize(legacy||AccountRules.initial());
    await controller.claimStream(crypto.randomUUID());
    client=new Leaderboards.Client(config);client.accountSession=session;
    client.beforeFlush=async()=>{
      const state=controller.state(),generation=controller.generation;
      if(state.owner!=='guest'||!state.profile.privacy.leaderboard)throw Error('Leaderboard sharing is disabled.');
      await session.ensureAnonymous();const token=await session.token();
      if(generation!==controller.generation)throw Error('The active profile changed.');
      const visible=await client.request('/rest/v1/rpc/set_guest_leaderboard_visibility',{p_visible:true},token);
      if(visible!==true)throw Error('Leaderboard sharing is disabled.');
    };
    window.addEventListener('online',()=>{if(controller.state().owner==='guest')client.flush().catch(()=>{});});
    initialized=true;
    note('Full encounters earn achievements, Cubies, and leaderboard points. Practice tools earn no ranked rewards.');
  })().catch(()=>note('Progress storage is unavailable. Return to the arcade and try again.'));
  async function begin(){
    await ready;
    if(!initialized||!controller?.record||controller.state().importRequired)return null;
    return {id:crypto.randomUUID(),owner:controller.state().owner,generation:controller.generation};
  }
  async function finish(run,score,won){
    if(!run||run.saved||!controller||run.owner!==controller.state().owner||run.generation!==controller.generation)return;
    run.saved=true;let stored=false;
    try{
      await controller.enqueue('arcade',{event:'side-result',mode:'tearesseract',score,won},{id:run.id});stored=true;
      note(`${score} attacks cleared. Achievements and Cubies saved to your profile. Return to Arcade to view them.`);
      if(run.owner!==controller.state().owner||run.generation!==controller.generation)return;
      const state=controller.state();
      if(state.owner!=='guest'){await controller.flush();return;}
      if(score>0&&client.configured&&state.profile.privacy.leaderboard){
        await client.submit({mode:'tearesseract',difficulty:'standard',score,player:state.profile.player,runId:run.id});
      }
    }catch{note(stored?'Progress saved locally. Pending online scores retry when you reconnect or return to Arcade.':'Could not save this result. Browser storage or your active profile is unavailable.');}
  }
  return {begin,finish};
})();
