'use strict';
const CosmeticCollections = (() => {
  const tiers=['bronze','silver','gold','crystal','diamond','rainbow','empyrorite','black','exclusive'];
  function groups(catalog) {
    const all=[{id:'all',title:'All Customs',items:catalog}];
    const add=(id,title,test)=>{const items=catalog.filter(test);if(items.length)all.push({id,title,items});};
    for(const tier of tiers)add(tier,tier==='exclusive'?'Exclusive · #1 Crowns':tier[0].toUpperCase()+tier.slice(1),i=>i.tier===tier);
    const text=i=>`${i.id} ${i.name} ${i.flavor||''}`;
    for(const [id,title,pattern] of [
      ['animals','Animals',/cat|dog|fox|wolf|bunny|rabbit|bear|panda|frog|koi|turtle|butterfly|bird|bee|otter|penguin|axolotl|jellyfish|shark/i],
      ['boss','Boss Crush',/boss|overlord|crush|regent|pumpkin|wrath|royal_slams|bone_gauntlet|magenta_fingers|crown_chess/i],
      ['radiant','Radiant',/radiant|light|solar|sun|spark|glow|prism|crystal/i],
      ['ember','Ember',/ember|fire|flame|phoenix|lava|inferno|cinder/i],
      ['cosmic','Cosmic',/space|astral|cosmic|star|lunar|moon|galact|celestial|orbit|eclipse|singularity/i],
      ['nature','Nature',/fern|leaf|garden|forest|flower|rose|sakura|vine|thorn/i],
      ['arcade','Arcade & Machines',/keyboard|keymaster|retro|pixel|circuit|robot|disco|dbtv|clock|steampunk|signal/i],
    ])add(id,title,i=>pattern.test(text(i)));
    for(const [name,lo,hi] of [['Red',345,375],['Orange',15,50],['Yellow',50,75],['Green',65,165],['Cyan',165,200],['Blue',200,260],['Violet',260,290],['Pink',290,345]]) {
      add(`color-${name.toLowerCase()}`,`${name} Color`,i=>[i.color,...(i.colors||[])].filter(Boolean).some(c=>{
        if(!/^#[\da-f]{6}$/i.test(c))return false;
        const [r,g,b]=[1,3,5].map(n=>parseInt(c.slice(n,n+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
        if(d<.12)return false;
        let h=(max===r?(g-b)/d:max===g?(b-r)/d+2:(r-g)/d+4)*60;h=(h+360)%360;
        return (h>=lo&&h<hi)||(name==='Red'&&h<15);
      }));
    }
    return all;
  }
  function covers(container,catalog,art,onOpen) {
    container.replaceChildren(...groups(catalog).map(group=>{
      const button=document.createElement('button');button.type='button';button.className='collection-cover';button.dataset.group=group.id;
      const stack=document.createElement('span');stack.className='collection-highlights';stack.setAttribute('aria-hidden','true');
      const highlights=[0,Math.floor(group.items.length/2),group.items.length-1].map(i=>group.items[i]);
      for(const item of highlights){const tile=document.createElement('span');tile.innerHTML=art(item);stack.append(tile);}
      const title=document.createElement('strong');title.textContent=group.title;
      const count=document.createElement('span');count.textContent=`${group.items.length} ${group.items.length===1?'Custom':'Customs'} · Explore →`;
      button.append(stack,title,count);button.onclick=()=>onOpen(group);return button;
    }));
  }
  return {groups,covers};
})();
if(typeof module!=='undefined')module.exports=CosmeticCollections;
