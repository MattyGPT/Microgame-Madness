'use strict';
const JukeboxSearch=(()=>{
  const normalize=value=>String(value).toLowerCase().replace(/[_—–-]/g,' ').replace(/\s+/g,' ').trim();
  function matches(track,query){
    let text=normalize(query),tempo=null;
    // Accept natural language ranges, comparisons, and exact tempos.
    const suffix=/(\d+(?:\.\d+)?)\s*bpm(?:\s*(?:and\s+)?(below|under|less|lower|above|over|more|higher))?/;
    const prefix=/(<=|>=|<|>|under|below|over|above|at most|at least)\s*(\d+(?:\.\d+)?)\s*(?:bpm)?/;
    const pre=text.match(prefix),post=!pre&&text.match(suffix);
    if(pre){const op=pre[1],value=Number(pre[2]);tempo=bpm=>op==='<'||op==='under'?bpm<value:op==='>'||op==='over'?bpm>value:['<=','below','at most'].includes(op)?bpm<=value:bpm>=value;text=text.replace(pre[0],' ');}
    else if(post){const value=Number(post[1]),direction=post[2];tempo=bpm=>!direction?bpm===value:['below','under','less','lower'].includes(direction)?bpm<=value:bpm>=value;text=text.replace(post[0],' ');}
    const haystack=normalize(`${track.title} ${track.category} ${track.id} ${track.bpm} bpm`);
    return (!tempo||(track.bpm>0&&tempo(track.bpm)))&&text.trim().split(/\s+/).filter(Boolean).every(word=>haystack.includes(word));
  }
  function suggestions(tracks,query){
    const presets=['100 BPM and below','120 BPM and below','150 BPM and above','180 BPM and above'];
    const pool=[...new Set([...tracks.map(t=>t.category),...presets,...tracks.map(t=>t.title)])];
    const words=normalize(query).split(' ').filter(Boolean);
    return pool.filter(label=>words.every(word=>normalize(label).includes(word))).slice(0,8);
  }
  function mount(root,tracks,cards){
    const input=root.querySelector('input'),list=root.querySelector('.jukebox-suggestions'),count=root.querySelector('[role="status"]'),clear=root.querySelector('.jukebox-search-clear');
    const byId=new Map(tracks.map(track=>[track.id,track]));
    const close=()=>{list.hidden=true;};
    function refresh(showSuggestions=false){
      let visible=0;
      for(const card of cards.querySelectorAll('.jukebox-song-item')){
        const track=byId.get(card.querySelector('[data-difficulty]').dataset.difficulty);
        card.hidden=!matches(track,input.value);if(!card.hidden)visible++;
      }
      count.textContent=visible?`${visible} of ${tracks.length} songs`:'No songs found. Try a song name, category, or BPM range.';
      clear.hidden=!input.value;
      list.replaceChildren();
      if(showSuggestions&&input.value.trim())for(const label of suggestions(tracks,input.value)){
        const button=document.createElement('button');button.type='button';button.textContent=label;
        button.onclick=()=>{input.value=label;refresh();input.focus();close();};list.append(button);
      }
      list.hidden=!list.childElementCount;
    }
    input.addEventListener('input',()=>refresh(true));
    input.addEventListener('focus',()=>refresh(true));
    clear.onclick=()=>{input.value='';refresh();input.focus();};
    root.addEventListener('focusout',event=>{if(!root.contains(event.relatedTarget))close();});
    root.addEventListener('keydown',event=>{
      if(event.key==='Escape'){close();input.focus();close();event.stopPropagation();return;}
      const buttons=[...list.querySelectorAll('button')];
      if(list.hidden||!buttons.length)return;
      const index=buttons.indexOf(document.activeElement);
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();const next=event.key==='ArrowDown'?(index+1)%buttons.length:(index<=0?buttons.length-1:index-1);buttons[next].focus();
      }
    });
    return {refresh};
  }
  return {matches,suggestions,mount};
})();
if(typeof module!=='undefined')module.exports=JukeboxSearch;
