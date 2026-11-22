"use strict";
// Worlds 101–1000: distinct seeded challenges, shared accessible control mechanics.
const CoinDropFrontier = (() => {
  const regions=['Solar','Lunar','Opal','Obsidian','Sapphire','Jade','Copper','Silver','Pearl','Topaz','Garnet','Quartz','Neon','Plasma','Comet','Nebula','Quantum','Gravity','Clockwork','Crystal','Storm','Frost','Bloom','Dune','Abyssal','Celestial','Prismatic','Infinity','Dream','Zenith'];
  const places=['Landing','Wharf','Gardens','Workshop','Aqueduct','Library','Bazaar','Foundry','Canopy','Bridge','Reservoir','Archives','Reef','Spire','Crossroads','Grotto','Orchard','Gallery','Station','Cascade','Atrium','Vault','Summit','Temple','Labyrinth','Palace','Horizon','Nexus','Crown','Finale'];
  const layouts=['wave','stairs','rings','diamond','grove','honey','towers','arches','fan','vortex'];
  const color=h=>'#'+[0,120,240].map(offset=>Math.round(190+55*Math.cos((h-offset)*Math.PI/180)).toString(16).padStart(2,'0')).join('');
  const worlds=regions.flatMap((region,r)=>places.map((place,p)=>[`${region} ${place}`,`${region} expedition ${p+1}: navigate ${layouts[(p+r)%10]} pegs and shifting currents.`,color((r*47+p*3)%360),layouts[(p+r)%10],((r*31+p*19)%221)-110,.6+((r*13+p*7)%21)*.04,8+(r*11+p*3)%11]));
  // Each family describes a different objective; world/slot seeds vary its actual puzzle.
  const families=[
    ['balance','Balance Reactor','equation','Find the missing weight in the balanced equation.','Subtract the known weight from the total.'],
    ['remainder','Remainder Recycler','equation','Choose the remainder after dividing the shipment.','Remove complete groups; count what remains.'],
    ['area','Panel Planner','equation','Calculate the area of the rectangular panel.','Multiply width by height.'],
    ['average','Average Analyzer','equation','Find the average of the three readings.','Add the readings and divide by three.'],
    ['sequence','Sequence Scanner','equation','Find the next reading in the increasing pattern.','The gap grows by one each step.'],
    ['percent','Discount Depot','equation','Find the sale price after the displayed discount.','Subtract the discount from the original price.'],
    ['binary','Binary Beacon','equation','Convert the binary signal to a decimal number.','From right to left, the places are 1, 2, 4, 8, 16, 32, 64, 128.'],
    ['clock','Time Tunnel','equation','Find the number of minutes until the next signal.','Count forward from the first time to the second.'],
    ['descending','Reverse Freight','sort','Load the negative temperatures from coldest to warmest.','A more negative number is colder.'],
    ['fractions','Decimal Dock','sort','Load decimal weights from smallest to largest.','Compare whole numbers first, then decimal places.'],
    ['budget','Three Crate Budget','sum','Choose crates matching the exact budget, then dispatch.','A solution always exists; try combining three crates.'],
    ['echo','Signal Archive','recall','Memorize the sector code and repeat it after it disappears.','Read the digits left to right; the keypad opens after the preview.'],
    ['trail','Asteroid Survey','route','Visit numbered survey sites in order, avoiding blocked cells.','Start at 1 and finish at the highest number.'],
    ['compass','Gyroscope Garage','dial','Rotate each gyroscope to its displayed heading, then lock.','Each click rotates the selected gyroscope clockwise.'],
    ['dock','Comet Catch','pulse','Dock the comet while its marker is inside the gold window.','Wait for a pass through the window, then press Dock.'],
    ['pairs','Specimen Partners','pairs','Uncover all matching specimens before time runs out.','Remember uncovered positions; mismatched cards turn back over.'],
    ['relay','Flight Director','arrows','Follow each flight command in order.','Use the arrow buttons or press and release arrow keys.'],
    ['switch','Power Blueprint','circuit','Set the switches to the target blueprint, then connect.','Every switch toggles independently.'],
  ];
  const examples=['? + 12 = 27: the missing weight is 15.','17 ÷ 5 leaves a remainder of 2.','A 12 × 4 panel has area 48.','The average of 10, 13 and 16 is 13.','10, 13, 17, 22 continues with 28 (gaps 3, 4, 5, 6).','100 dots with 20% off costs 80 dots.','Binary 1010 means 8 + 2 = 10.','09:45 to 10:15 is 30 minutes.','−15, −10, −5 goes from coldest to warmest.','1.2, 1.5, 2.1 is increasing order.','For 19 dots, choose crates worth 10, 6 and 3.','For code 2 5 1 4, press 2, 5, 1, then 4.','Visit 1, 2, 3 in that order; avoid × cells.','To turn ↑ into ↓, click twice.','A marker at 50% fits a window from 40% to 60%.','Two diamonds match; a diamond and a star do not.','For ↑ then →, press Up then Right.','ON OFF ON means switch on only the first and third.'];
  const games=worlds.flatMap((world,w)=>Array.from({length:3},(_,slot)=>{
    const [variant,name,renderer,rules,tip]=families[(w*3+slot)%families.length];
    return {id:`frontier_${w+101}_${slot+1}`,title:`${world[0]} · ${name}`,kind:'frontier',variant,renderer,seed:w*3+slot+1,level:Math.floor(w/100),seconds:renderer==='pairs'?30:['recall','route','sort','dial','arrows'].includes(renderer)?24:20,icon:'✧',rules,lesson:{steps:[rules,tip],example:examples[(w*3+slot)%families.length]},...(slot===0?{ruby:1}:slot===1?{scrap:5}:{})};
  }));
  const shuffle=(a,r)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  function puzzle(game){
    let seed=game.seed;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const int=(a,b)=>a+Math.floor(random()*(b-a+1)),a=int(12,90),b=int(3,12),n=4+Math.min(2,Math.floor(game.level/3));
    switch(game.variant){
      case 'balance':return {prompt:`? + ${a} = ${a+b*3}`,answer:b*3};
      case 'remainder':return {prompt:`${a} ÷ ${b}: remainder?`,answer:a%b};
      case 'area':return {prompt:`Panel ${a} × ${b} units: area?`,answer:a*b};
      case 'average':return {prompt:`Average of ${a-b}, ${a}, ${a+b}?`,answer:a};
      case 'sequence':return {prompt:`${a}, ${a+b}, ${a+2*b+1}, ${a+3*b+3}, ?`,answer:a+4*b+6};
      case 'percent':{const price=a*10,discount=int(1,5)*10;return {prompt:`${price} dots, ${discount}% off: sale price?`,answer:price*(100-discount)/100};}
      case 'binary':return {prompt:`Binary ${a.toString(2)} = ?`,answer:a};
      case 'clock':{const start=int(0,1100),duration=int(15,180),time=m=>`${Math.floor(m/60).toString().padStart(2,'0')}:${(m%60).toString().padStart(2,'0')}`;return {prompt:`${time(start)} → ${time(start+duration)}: how many minutes?`,answer:duration};}
      case 'descending':return {values:shuffle(Array.from({length:n},(_,i)=>-a-i*b),random)};
      case 'fractions':return {values:shuffle(Array.from({length:n},(_,i)=>(a+i*b)/10),random)};
      case 'budget':{const c=int(2,20),target=a+b+c;return {target,values:shuffle([a,b,c,target+1,target+7,1],random)};}
      case 'echo':return {sequence:Array.from({length:n},()=>int(1,6)),preview:3};
      case 'trail':return {path:shuffle(Array.from({length:16},(_,i)=>i),random).slice(0,n+3)};
      case 'compass':{const targets=Array.from({length:n},()=>int(0,3));return {targets,values:targets.map(v=>(v+int(1,3))%4)};}
      case 'dock':return {center:int(20,80)/100,width:.22-game.level*.008,speed:1.3+game.level*.08};
      case 'pairs':return {values:shuffle(shuffle(['◆','★','●','☾','▲','✚','⬟','✿'],random).slice(0,n-1).flatMap(v=>[v,v]),random)};
      case 'relay':return {commands:Array.from({length:n+3},()=>int(0,3))};
      case 'switch':{const targets=Array.from({length:n+2},()=>!!int(0,1));targets[0]=true;return {targets,values:targets.map(()=>false)};}
      default:throw new Error(`Unknown frontier challenge: ${game.variant}`);
    }
  }
  function create(game,host,finish,random=Math.random){
    const expansion=typeof CoinDropExpansion!=='undefined'?CoinDropExpansion:require('./coin-drop-expansion.js');
    return expansion.create({...game,variant:game.renderer},host,finish,random,()=>puzzle(game));
  }
  return {worlds,games,puzzle,create};
})();
if(typeof module!=='undefined')module.exports=CoinDropFrontier;
