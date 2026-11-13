"use strict";
// One hundred authored themes. Each collection has its own silhouette and trim;
// each character has an individual emblem, palette, name, and fixed price.
const CubieExpansion = (() => {
  const tiers=['bronze','silver','gold','crystal','diamond','rainbow','empyrorite'];
  const levels=[0,0,1,1,2,3,4,5,6,6];
  const collections=[
    ['pantry','Sugar Kitchen','#edb47b','#fff1c5',[
      ['Butter Biscuit','M-10-7H10V8H-10ZM-5-3H-3M3-3H5M-5 3H-3M3 3H5','Always leaves a crumb trail home.'],
      ['Berry Tart','M-11 0H11L8 9H-8ZM-8-1Q-10-10-3-8Q0-14 4-7Q13-9 9 0','A little pastry with a berry big smile.'],
      ['Cinnamon Swirl','M-10 7Q-15-10 2-10Q15-10 10 3Q5 12-3 6Q-10 0-2-3Q5-6 5 1','Gets dizzy just thinking about breakfast.'],
      ['Caramel Flan','M-8-9H8L12 8H-12ZM-8-6Q0-2 8-6M-13 10H13','Wobbles proudly. Never spills a smile.'],
      ['Pistachio Macaron','M-11-2Q-9-13 0-12Q10-12 11-2ZM-11 2H11Q9 12 0 12Q-10 12-11 2Z','Two tiny cookies and one enormous dream.'],
      ['Sugar Geode','M0-13L11-5L9 9L-3 13L-12 3L-8-9ZM0-8L6-2L3 7L-5 3Z','Cracked open a sweet little universe.'],
      ['Royal Bonbon','M-7-7H7V7H-7ZM-7-4L-13-8V8L-7 4M7-4L13-8V8L7 4','Every wrapper opens with a royal flourish.'],
      ['Aurora Sorbet','M-10-4Q-12-14 0-14Q12-14 10-4ZM-10-1H10L0 13Z','Scooped a rainbow and kept it cold.'],
      ['Celestial Souffle','M-10 0Q-14-10-5-9Q0-17 5-9Q14-10 10 0ZM-9 2H9L7 12H-7Z','Rises a little higher than the stars.'],
      ['Confection Emperor','M-12-9L-6-3L0-13L6-3L12-9L9 9H-9ZM-5 4H5','Rules a kingdom where dessert comes first.'],
    ]],
    ['garden','Secret Garden','#80b791','#dbffbf',[
      ['Dewdrop Clover','M0 1C-18-2-9-16 0-7C9-16 18-2 0 1C-8 15-17 4 0 1C17 4 8 15 0 1V13','Keeps a lucky drop of morning dew.'],
      ['Terracotta Bud','M-8 1H8L6 12H-6ZM0 1V-10M0-4Q-12-13-9-4Q-5 0 0-4M0-8Q12-15 8-5','A small pot with very big plans.'],
      ['Lavender Sachet','M-8-1Q0-7 8-1L10 11H-10ZM-6-4L-8-12M0-4V-14M6-4L8-12','Carries the smell of a sleepy garden.'],
      ['Acorn Scout','M-9-3Q0-12 9-3V2Q7 11 0 13Q-7 11-9 2ZM-11-3H11M0-8V-13','Packed a whole forest in one pocket.'],
      ['Orchid Dancer','M0 0C-17-18-16 6-4 4C-10 17 10 17 4 4C16 6 17-18 0 0ZM0-2V-12','Practices graceful steps among the petals.'],
      ['Dewglass Fern','M0 13V-13M0-6L-9-11M0-2L9-8M0 3L-11-3M0 7L10 1','Every leaf remembers the morning rain.'],
      ['Moonlit Magnolia','M0 5Q-17-2-9-10Q-2-9 0 5Q17-2 9-10Q2-9 0 5M0 5V14','Blooms when everyone else is dreaming.'],
      ['Rainbow Canopy','M-12 0Q-14-9-5-8Q0-17 6-8Q15-9 12 0ZM0 0V13M-6 13H6','Offers shade in every color.'],
      ['Worldtree Keeper','M0 14V-12M0-7L-9-13M0-2L11-10M0 5L-12-3M0 10L8 3M0 12L-8 15M0 12L8 15','Tends the roots that hold the sky.'],
      ['Eden Seraph','M0-10L4 1L0 12L-4 1ZM-4 0Q-18-14-13 5L-5 9M4 0Q18-14 13 5L5 9','Even the flowers stop to watch them pass.'],
    ]],
    ['reef','Coral Court','#72bdcf','#d0ffed',[
      ['Pebble Crab','M-8-4H8V6H-8ZM-8 0L-14-7L-12-12M8 0L14-7L12-12M-8 5L-13 10M8 5L13 10','A sideways stroll is still progress.'],
      ['Bubble Guppy','M-10 0Q0-12 9 0Q0 12-10 0ZM9 0L15-7V7ZM-4-2H-3','Has a bubble for every happy thought.'],
      ['Seashell Post','M0 12Q-18 0-10-9Q-3-16 0-8Q3-16 10-9Q18 0 0 12ZM0 9V-7M-2 8L-8-6M2 8L8-6','Delivers little letters from the sea.'],
      ['Kelp Courier','M0 14Q-7 3 0-8Q7-16 9-9M0 6Q-14 5-9-3M0-2Q14 0 10-8','Never gets tangled in the delivery route.'],
      ['Pearl Diver','M-12 3Q0 18 12 3L8-9L0-4L-8-9ZM-4 2A4 4 0 1 0 4 2A4 4 0 1 0-4 2','Found treasure and made friends with it.'],
      ['Tidal Chalice','M-11-10H11Q12 3 2 5V11H8V14H-8V11H-2V5Q-12 3-11-10Z','A cup full of moonlit ocean.'],
      ['Coral Cathedral','M-11 12V-7L-6-12L-1-7V12M2 12V-2L7-10L12-2V12M-6-6V0M7 0V6','Built a tiny palace for passing fish.'],
      ['Prism Nautilus','M11 10Q-13 15-13-3Q-13-16 2-13Q15-10 9 2Q3 10-4 3Q-9-4-2-6Q5-8 4 0','Every chamber holds another color.'],
      ['Abyssal Oracle','M-14 0Q0-16 14 0Q0 16-14 0ZM-5 0A5 5 0 1 0 5 0A5 5 0 1 0-5 0M0-5V5','Knows what the quietest ocean is thinking.'],
      ['Leviathan Regent','M-12 9Q-3-8 8-7L13-13V-1L7-2Q0 2-2 10M-10 10L-13 14M-4 10L0 14','A gentle ruler of very deep waters.'],
    ]],
    ['forge','Clockwork Foundry','#b88b74','#ffe8b9',[
      ['Copper Rivet','M-9-8H9V8H-9ZM-3-3H3V3H-3M-6-5H-5M5 5H6','Holds everything together with enthusiasm.'],
      ['Pocket Wrench','M-2-3L-11 10L-7 14L4 1Q14 0 10-11L5-5L0-10Q-6-5-2-3Z','Can fix anything except bedtime.'],
      ['Brass Compass','M0-13L11 0L0 13L-11 0ZM0-8L4 0L0 8L-4 0Z','Always points toward the next adventure.'],
      ['Ticktock Teapot','M-8-5H7V7Q-1 14-8 7ZM7-3Q17-5 12 4L7 5M-8-3L-14-7L-12 3M-5-8H5M0-8V-12','Tea is ready precisely whenever you are.'],
      ['Steam Aviator','M-13-3H-2V5H-13ZM2-3H13V5H2ZM-2 0H2M-9-8Q0-14 9-8','Clouds are just a very soft runway.'],
      ['Chronoglass','M-10-12H10M-8-10Q-8-3 0 0Q8 3 8 10H-8Q-8 3 0 0Q8-3 8-10ZM-10 12H10','Keeps the best moments in a glass pocket.'],
      ['Platinum Dynamo','M0-14L5-5L13-3L7 4L8 13L0 9L-8 13L-7 4L-13-3L-5-5ZM0-4V5','Runs entirely on bright ideas.'],
      ['Aurora Automaton','M-9-7H9V9H-9ZM0-7V-13M-12-3H-9M9-3H12M-5-2H-3M3-2H5M-4 5H4','Learned to dream in full color.'],
      ['Epoch Architect','M-12 12V-7L0-14L12-7V12ZM-6 12V-3H6V12M-10-7H10','Builds tomorrow with tiny golden tools.'],
      ['Infinity Engine','M0 0C-18-18-18 18 0 0C18-18 18 18 0 0M-12-12L-8-8M12 12L8 8','Still going. Still smiling. Forever.'],
    ]],
    ['studio','Dream Studio','#c38fbd','#ffe4f4',[
      ['Chalk Doodle','M-11 9L5-12L11-7L-5 13ZM-11 9L-12 14L-5 13M3-8L8-4','Draws a smile on every spare corner.'],
      ['Origami Finch','M-13 3L-3-1L4-13L7-2L14 1L5 4L1 12L-3 5Z','Folded a little courage into each wing.'],
      ['Indigo Inkpot','M-7-6H7L11 10H-11ZM-5-12H5V-6H-5ZM0 4V8','Every thought deserves a beautiful line.'],
      ['Velvet Violin','M0-14V10M-5-8Q-12-7-5 0Q-14 8-5 12H5Q14 8 5 0Q12-7 5-8ZM-2-14H2','Plays lullabies for the moon.'],
      ['Porcelain Muse','M-10-10H10V2Q7 13 0 14Q-7 13-10 2ZM-6-3H-3M3-3H6M-4 5Q0 9 4 5','Every expression is a small masterpiece.'],
      ['Stained Glass Poet','M0-14L11-7V7L0 14L-11 7V-7ZM0-14V14M-11-7L11 7M11-7L-11 7','Writes verses in sunlight and color.'],
      ['Diamond Ballet','M-7-11L0-6L7-11L3 0L12 8Q0 14-12 8L-3 0ZM0 10V15','Never misses a step among the stars.'],
      ['Spectrum Maestro','M-12 9L9-12M-4-10Q5-3 12-3M-2 12Q7 12 10 6','Conducts the colors into perfect harmony.'],
      ['Dreamweaver Loom','M-11-12H11V12H-11ZM-6-12V12M0-12V12M6-12V12M-11-5Q0 2 11-5M-11 5Q0-2 11 5','Weaves a warm blanket out of dreams.'],
      ['Opus Eternal','M-11-8Q-4-13 0-8Q4-13 11-8V10Q4 5 0 10Q-4 5-11 10ZM0-8V10','The final page is always a new beginning.'],
    ]],
    ['sky','Weather Station','#8db8de','#e7f6ff',[
      ['Paper Kite','M0-13L10-3L0 10L-10-3ZM0-13V10M-10-3H10M0 10Q8 12 2 16','Borrows a little wind for the afternoon.'],
      ['Rainboot Rover','M-7-12H3V3H10Q15 12 8 12H-7ZM-7-7H3','Every puddle is a whole new world.'],
      ['Snowbell','M0-14V14M-12-7L12 7M-12 7L12-7M-4-10L0-6L4-10M-4 10L0 6L4 10','Makes the quietest little winter chime.'],
      ['Sunshower','M-10 0Q-14-9-5-9Q0-16 6-8Q15-8 12 0ZM-7 5L-9 11M0 5L-2 13M7 5L5 11','Brings rainbows along with the rain.'],
      ['Golden Forecast','M0-7A7 7 0 1 0 0 7A7 7 0 1 0 0-7M0-14V-10M0 10V14M-14 0H-10M10 0H14','Tomorrow looks bright. So does today.'],
      ['Frost Cathedral','M-11 12V-6L-6-13L0-6L6-13L11-6V12ZM-6-6V7M6-6V7M0 0V12','A winter palace small enough to hug.'],
      ['Thunder Opal','M3-14L-10 2H-2L-5 14L11-4H2Z','Keeps thunder tucked inside a gemstone.'],
      ['Polar Ribbon','M-13-9Q-4-16 0-4Q4 8 13 1V10Q4 17 0 5Q-4-7-13 0Z','Ties the northern lights into a bow.'],
      ['Skyborne Citadel','M-12 6V-5H-7V-11H-2V0H3V-14H8V-4H12V6ZM-14 10Q0 17 14 10','A floating home for wandering clouds.'],
      ['Tempest Archon','M0-13L5-3L0 13L-5-3ZM-5-2L-14-10L-10 8L-4 6M5-2L14-10L10 8L4 6','Calm at the heart of every storm.'],
    ]],
    ['gem','Mineral Museum','#a29bd2','#eee7ff',[
      ['River Agate','M-11-5Q0-15 11-5Q15 8 0 13Q-15 8-11-5ZM-6-3Q0-9 6-3Q9 5 0 8Q-9 5-6-3Z','Polished by a thousand gentle rivers.'],
      ['Amber Beetle','M0-12Q11-12 10 3Q9 13 0 14Q-9 13-10 3Q-11-12 0-12ZM0-12V14M-10-3L-14-8M10-3L14-8','A golden memory with six little feet.'],
      ['Malachite Marble','M0-12A12 12 0 1 0 0 12A12 12 0 1 0 0-12M-7-9Q10-4-7 3Q-12 7 0 12','A whole green landscape in one swirl.'],
      ['Rose Quartz Heart','M0 12C-24-3-8-19 0-7C8-19 24-3 0 12ZM0-7V12','A heart that keeps its soft edges.'],
      ['Garnet Sentinel','M0-14L12-5L8 9L0 14L-8 9L-12-5ZM0-14V14M-12-5L8 9M12-5L-8 9','Guards every tiny treasure with a smile.'],
      ['Aquamarine Prism','M-7-10L4-14L11-6V9L-4 14L-11 6V-7ZM-7-10L-4 1L11-6M-4 1V14','Turns ordinary light into ocean dreams.'],
      ['Diamond Reliquary','M-12-4L-6-12H6L12-4L0 14ZM-12-4H12M-6-12L0 14L6-12','Keeps the best memories under crystal.'],
      ['Opal Mirage','M0-14L9-8L13 3L5 13L-6 12L-13 1L-8-10ZM-8-10L5 13M9-8L-6 12','Looks different in every happy light.'],
      ['Star Sapphire Throne','M-11 12V-3H-6V-12H6V-3H11V12M-6 3H6M0-9L2-5L0-1L-2-5Z','A small seat beneath a very large sky.'],
      ['Crown of Continents','M-13-9L-6-3L0-15L6-3L13-9L9 11H-9ZM-9 6H9M-3 1L0-4L3 1L0 5Z','Carries the colors of the whole world.'],
    ]],
    ['fable','Storybook Realm','#b598ca','#fff0bd',[
      ['Button Goblin','M-10-5L-14-12L-3-9H3L14-12L10-5V8H-10ZM-6-2H-3M3-2H6M-4 5H4','Collects lost buttons and excellent jokes.'],
      ['Candle Scribe','M-6-1H6V13H-6ZM0-14Q-10-5 0-2Q10-5 0-14ZM0-1V3','Writes warm stories after sunset.'],
      ['Moss Familiar','M-10-6L-10-14L-3-9H3L10-14V5Q0 15-10 5ZM-5-2H-3M3-2H5','Purrs softly whenever the forest grows.'],
      ['Potion Apprentice','M-5-13H5V-5Q16 5 9 12H-9Q-16 5-5-5ZM-9 4H9','The recipe says one pinch of wonder.'],
      ['Sunlit Paladin','M0-14L11-8V1Q9 10 0 14Q-9 10-11 1V-8ZM0-8V8M-5-1H5','Brave enough to be kind first.'],
      ['Runestone Warden','M-9-12H8L12 9L3 14L-11 8ZM0-8V9M0-5L6-1L0 3L-5-1Z','Listens to the oldest stories in stone.'],
      ['Crystal Wyvern','M-12 8L-5-2L-8-12L2-7L10-13L8-3L13 2L5 5L0 13Z','A tiny dragon with a very shiny hoard.'],
      ['Prismatic Phoenix','M0-13L4-3L14-9L9 4L3 8L0 15L-3 8L-9 4L-14-9L-4-3Z','Every sunrise is a fresh start.'],
      ['Mythic Gatekeeper','M-12 13V-3Q0-22 12-3V13ZM-6 13V-2Q0-12 6-2V13M0 1V13','Every door leads to another adventure.'],
      ['Fable Sovereign','M-13-11L-6-4L0-15L6-4L13-11L10 9H-10ZM-7 13H7M-3 2L0-3L3 2L0 6Z','Knows that every hero needs a friend.'],
    ]],
    ['orbit','Starlight Observatory','#839dce','#d7f3ff',[
      ['Moon Pebble','M5-12A13 13 0 1 0 5 12A11 11 0 0 1 5-12ZM-6-4H-5M-5 5H-4','A souvenir from a very quiet moon.'],
      ['Tin Telescope','M-12-4L8-10L11-1L-9 5ZM0 3V13M0 8L-7 14M0 8L7 14','Spots a friend in every constellation.'],
      ['Satellite Penpal','M-5-5H5V5H-5ZM-14-4H-7V4H-14ZM7-4H14V4H7M0-5V-12M-4-12H4','Sends little hellos around the planet.'],
      ['Meteor Scout','M-7 2L6-13M-2 6L13-9M-10-1L-1-13M-10 2Q-16 5-10 12Q-3 16 1 8Q3 0-5-2Z','Arrives with a trail of bright ideas.'],
      ['Solar Sailor','M0-14L12 5H-12ZM0-14V12M-10 9Q0 17 10 9','Sails wherever the sunlight goes.'],
      ['Nebula Lantern','M-8-8H8L11 8H-11ZM-5-8V-13H5V-8M0-4L3 2L0 6L-3 2M-8 12H8','Keeps a baby nebula warm and cozy.'],
      ['Pulsar Navigator','M0-7A7 7 0 1 0 0 7A7 7 0 1 0 0-7M0-15V-9M0 9V15M-15 0H-9M9 0H15M-11-11L-7-7M7 7L11 11','Follows the heartbeat of the stars.'],
      ['Galaxy Carousel','M-14 0Q0-12 14 0Q0 12-14 0ZM0-14Q12 0 0 14Q-12 0 0-14M-3 0H3','One more turn around the Milky Way.'],
      ['Eventide Celestial','M0-15L4-5L14-8L8 1L13 10L3 8L0 15L-3 8L-13 10L-8 1L-14-8L-4-5Z','Saves the last glow of every sunset.'],
      ['Cosmos Custodian','M0-13L11-6V6L0 13L-11 6V-6ZM-11-6L0 0L11-6M0 0V13M-15 10L-10 15M10-15L15-10','Tidies up the stars before bedtime.'],
    ]],
    ['festival','Festival of Lights','#d79b9d','#fff1ac',[
      ['Ribbon Parcel','M-11-6H11V12H-11ZM-13-6V-1H13V-6ZM0-6V12M0-6Q-13-17-10-8ZM0-6Q13-17 10-8Z','The best part is giving it away.'],
      ['Paper Lantern','M-8-9H8L12 0L8 9H-8L-12 0ZM-5-13H5M-5 13H5M0 9V16','A little light for a long evening.'],
      ['Confetti Captain','M-10 10L0-12L10 10ZM-5 0H5M-12-8L-8-6M10-10L13-13M-13 4H-10','Declared every Tuesday a celebration.'],
      ['Firecracker Fox','M-11-5L-12-14L-3-8H3L12-14L11-5L0 13ZM-7-3L-2 0M7-3L2 0M-2 8H2','A spark of mischief and a warm smile.'],
      ['Golden Masquerade','M-13-7Q0-2 13-7V4Q8 11 0 5Q-8 11-13 4ZM-9-2H-4M4-2H9','Everyone is invited to the dance.'],
      ['Chandelier Waltz','M0-13V5M-12-4Q-12 6 0 5Q12 6 12-4M-12-8V-5M12-8V-5M-7 7L-7 12M7 7V12M0 7V15','Turns every room into a ballroom.'],
      ['Diamond Jubilee','M-12-5L-6-12H6L12-5L0 13ZM-12-5H12M-6-12L0 13L6-12M-14 10L-11 13M11 13L14 10','Celebrates every little victory in style.'],
      ['Carnival Aurora','M-13 10L-9-8L-3 0L0-14L3 0L9-8L13 10ZM-13 10H13M-8 4H-6M6 4H8','Brought the northern lights to the parade.'],
      ['Lantern Constellation','M-12-8H-4V2H-12ZM4-2H12V8H4ZM-8 2L0 13L8 8M-8-8L0-14L8-2','Connects every wish with a little light.'],
      ['Jubilation Monarch','M-14-10L-8-2L0-15L8-2L14-10L10 10H-10ZM-6 14H6M0-5L4 2L0 8L-4 2Z','Wears a crown made of happy moments.'],
    ]],
  ];
  const palette=['#f2c58c','#e9a9a2','#a7cbb5','#b9bce2','#e9c477','#a5d6e9','#bfcdf0','#d3a9e2','#b2e9d8','#ebd7ac'];
  const priceRows=[[111,122,361,378,811,1409,2309,3509,5501,5580],[133,144,395,412,834,1446,2352,3568,5659,5738],[155,166,429,446,857,1483,2395,3627,5817,5896],[177,188,463,480,880,1520,2438,3686,5975,6054],[199,210,497,514,903,1557,2481,3745,6133,6212],[221,232,531,548,926,1594,2524,3804,6291,6370],[243,254,565,582,949,1631,2567,3863,6449,6528],[265,276,599,616,972,1668,2610,3922,6607,6686],[287,298,633,651,995,1705,2653,3981,6765,6844],[309,320,667,684,1018,1742,2696,4040,6923,7002]];
  const slug=name=>name.toLowerCase().replace(/[^a-z0-9]+/g,'_');
  const bodyFor=family=>[
    '<rect x="20" y="28" width="80" height="80" rx="21"/>',
    '<path d="M35 28H85Q100 28 100 44V94Q100 108 85 108H35Q20 108 20 94V44Q20 28 35 28Z"/>',
    '<path d="M60 28Q100 28 100 61V93Q100 108 85 108H35Q20 108 20 93V61Q20 28 60 28Z"/>',
    '<path d="M31 28H89L100 39V97L89 108H31L20 97V39Z"/>',
    '<rect x="20" y="28" width="80" height="80" rx="10"/>',
    '<path d="M35 28H85Q100 28 100 45V91Q100 108 83 108H37Q20 108 20 91V45Q20 28 35 28Z"/>',
    '<path d="M38 28H82L100 46V90L82 108H38L20 90V46Z"/>',
    '<path d="M30 28H90L100 40V95L87 108H33L20 95V40Z"/>',
    '<rect x="20" y="28" width="80" height="80" rx="26"/>',
    '<path d="M30 28H90Q100 28 100 40V96Q100 108 88 108H32Q20 108 20 96V40Q20 28 30 28Z"/>',
  ][family];
  const catalog=collections.flatMap(([family,collection,color,accent,rows],f)=>rows.map(([name,emblem,flavor],i)=>({
    id:`shop_atelier_${slug(name)}`,name:`${name} Cubie`,tier:tiers[levels[i]],price:priceRows[f][i],
    color:palette[(i+f)%palette.length],accent,baseColor:color,flavor,achievements:[],body:bodyFor(f),
    expansion:true,collection,family:f,design:i,level:levels[i],emblem,
    detail:`<g transform="translate(60 25)" fill="none" stroke="${accent}" stroke-width="2" stroke-linejoin="round"><path d="${emblem}"/></g>`,
  })));
  const path=(d,fill,stroke='none',width=1)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const group=(art,kind,level)=>`<g class="atelier-${kind} atelier-level-${level}" style="transform-origin:60px 68px">${art}</g>`;
  function art(item,uid,simple=false) {
    const l=item.level,f=item.family,id=`atelier-${uid}`,accent=item.accent;
    const metal=['#bd8d6e','#d9e7ef','#f5d284','#bfeaff','#ebfaff','#f0c6ff','#e2ffe8'][l];
    const defs=`<defs><linearGradient id="${id}-body" x2=".8" y2="1"><stop stop-color="${accent}"/><stop offset=".4" stop-color="${item.color}"/><stop offset="1" stop-color="${item.baseColor}"/></linearGradient><linearGradient id="${id}-metal" x2="1" y2=".7"><stop stop-color="#fffbea"/><stop offset=".3" stop-color="${metal}"/><stop offset=".65" stop-color="${item.baseColor}"/><stop offset="1" stop-color="${metal}"/></linearGradient><linearGradient id="${id}-prism"><stop stop-color="#9ef4df"/><stop offset=".33" stop-color="#a4c8ff"/><stop offset=".66" stop-color="#e9b4ee"/><stop offset="1" stop-color="#fff0af"/></linearGradient><clipPath id="${id}-clip">${item.body}</clipPath></defs>`;
    const fill=l?`url(#${id}-body)`:item.color;
    let detail=defs+`<g fill="${fill}">${item.body}</g>`;
    // Ten different material treatments, each confined to the character body.
    const texture=[
      path('M22 40Q30 31 38 41T54 41T70 41T86 41T100 40V28H20Z',item.baseColor)+path('M28 96Q60 109 92 96','none',accent,2),
      path('M23 99Q33 76 27 48M97 99Q87 76 93 48','none',item.baseColor,3)+path('M26 85Q12 68 26 70M94 85Q108 68 94 70',accent),
      path('M20 96Q30 89 40 96T60 96T80 96T100 96V108H20Z',item.baseColor)+path('M27 90Q37 83 47 90T67 90T87 90','none',accent,1.2),
      path('M23 43H34V91H23M97 43H86V91H97','none',item.baseColor,3)+[30,90].map(x=>`<circle cx="${x}" cy="36" r="2" fill="${metal}"/><circle cx="${x}" cy="99" r="2" fill="${metal}"/>`).join(''),
      path('M20 91L36 105L53 97L72 106L100 88V108H20Z',item.baseColor)+path('M27 38L38 32M85 34L93 42','none',accent,3),
      path('M20 95Q27 83 35 95Q44 82 53 95Q63 81 72 95Q82 82 91 95Q99 84 100 97V108H20Z',accent),
      path('M20 46L38 28L33 52L20 90ZM82 28L100 46L87 53ZM20 90L38 108L49 95L82 108L100 90L84 98Z',item.baseColor)+path('M38 28L33 52M82 28L87 53M38 108L49 95','none',accent,1),
      path('M22 44L34 35V99L22 93ZM98 44L86 35V99L98 93Z',item.baseColor)+path('M25 99Q60 87 95 99','none',metal,2),
      path('M20 91Q60 118 100 91M20 96Q60 120 100 96','none',accent,1)+path('M27 35L31 43L39 47L31 50L27 58L24 50L16 47L24 43Z',accent),
      path('M22 98L34 91L46 98L60 91L74 98L86 91L98 98V108H22Z',item.baseColor)+path('M26 38L33 33M87 33L94 38','none',metal,2),
    ][f];
    detail+=`<g clip-path="url(#${id}-clip)">${texture}</g>`;
    if(l>=1) detail+=path('M27 85V44Q27 35 37 35H84','none',accent,1.5);
    if(l>=2) detail+=path('M28 100H92M26 48V87M94 48V87','none',`url(#${id}-metal)`,2.4);
    if(l>=3) detail+=`<g clip-path="url(#${id}-clip)">${path('M20 28L42 28L20 70ZM100 65L100 108L78 108Z','#ffffff33')}${path('M25 31L42 31L25 58M95 79V103H81','none','#ffffffaa',.7)}</g>`;
    if(l>=4) for(const side of [-1,1]) {
      const x=60+side*32;
      detail+=path(`M${x} 85l5 8-5 9-5-9Z`,`url(#${id}-metal)`,accent,.7);
      detail+=path(`M${x} 85v17l-5-9Z`,'#ffffff77');
    }
    if(l>=5) detail+=group(path('M23 45V38Q23 31 32 31H88Q97 31 97 40V91Q97 105 88 105H32Q23 105 23 96','none',`url(#${id}-prism)`,2),'iridescent',l);
    if(l>=6) {
      detail+=path('M30 43Q34 37 40 41M80 41Q86 37 90 43M34 91Q43 86 45 96Q42 103 36 98M86 91Q77 86 75 96Q78 103 84 98','none',metal,1.1);
      detail+=group(path('M31 37L35 43L31 49L27 43ZM89 37L93 43L89 49L85 43Z',accent),'pulse',l);
    }
    // Individual signature ornament: unique to every one of the 100 characters.
    const emblem=`<g transform="translate(60 24)">${path(item.emblem,l>=2?item.baseColor:'none',l>=2?metal:accent,l>=3?1.4:2)}</g>`;
    detail+=simple?emblem:group(emblem,l===0?'still':l===1?'sway':l===2?'bob':'pulse',l);
    if(l>=2&&!simple) detail+=group(path('M30 35Q39 31 47 33','none','#ffffffbb',2),'shine',l);
    let back='';
    if(l>=3) {
      // Different silhouettes per collection: petals, fins, gear teeth, sails, etc.
      const mantles=[
        'M21 54L8 43L11 72L21 80ZM99 54L112 43L109 72L99 80Z',
        'M22 48Q-1 34 9 64Q12 77 22 84ZM98 48Q121 34 111 64Q108 77 98 84Z',
        'M22 44L7 57L15 65L5 77L22 91ZM98 44L113 57L105 65L115 77L98 91Z',
        'M22 43H12V53H7V65H13V77H8V89H22ZM98 43H108V53H113V65H107V77H112V89H98Z',
        'M22 45Q2 43 11 63Q-1 76 22 92ZM98 45Q118 43 109 63Q121 76 98 92Z',
        'M22 48Q0 44 11 58Q-6 66 10 73Q1 89 22 88ZM98 48Q120 44 109 58Q126 66 110 73Q119 89 98 88Z',
        'M22 44L11 34L7 62L17 69L6 91L22 87ZM98 44L109 34L113 62L103 69L114 91L98 87Z',
        'M22 42L5 32L12 56L3 70L14 75L9 94L22 86ZM98 42L115 32L108 56L117 70L106 75L111 94L98 86Z',
        'M22 43L4 48L13 67L4 87L22 91ZM98 43L116 48L107 67L116 87L98 91Z',
        'M22 42Q-2 49 11 61Q-4 78 22 94ZM98 42Q122 49 109 61Q124 78 98 94Z',
      ];
      back=path(mantles[f],item.baseColor,metal,1);
      if(l>=4) back+=path('M19 49L12 57L19 66M101 49L108 57L101 66M17 75L13 84M103 75L107 84','none',accent,1);
      if(l>=5&&!simple) {
        const satellites=Array.from({length:l===6?6:4},(_,n)=>{
          const a=n*Math.PI*2/(l===6?6:4),x=60+Math.cos(a)*52,y=68+Math.sin(a)*52;
          return path(`M${x} ${y-3}l2 3-2 3-2-3Z`,['#ffb6cd','#9cebe6','#ffe5a0','#b9baff'][n%4]);
        }).join('');
        back+=group(satellites,'orbit',l);
      }
      if(l===6&&!simple) back+=group(path('M14 39Q-5 68 14 97M106 39Q125 68 106 97','none',accent,1.2),'pulse',l);
    }
    return {detail,back,faceColor:l>=5?'#302b52':'#26333c',sideColor:item.baseColor};
  }
  return {catalog,art};
})();
if(typeof module!=="undefined") module.exports=CubieExpansion;
if(typeof globalThis!=="undefined") globalThis.CubieExpansion=CubieExpansion;
