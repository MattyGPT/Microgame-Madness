"""Reproducible, legal pre-boss builds for the theater playtest."""
import json, random, sys, os
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from geomayhem import Geomayhem
from geomayhem_weapons import ARMORY
from geomayhem_arenas import ARENAS
out=Path(os.environ.get('THEATER_OUTPUT','artifacts/boss-theater-60-attempts'));out.mkdir(parents=True,exist_ok=True)
attempts=int(os.environ.get('THEATER_TRIALS','3'))
workshop={k:0 for k in ('vitality','power','magnet')};shards=0;trials=[]
for level in range(1,21):
 if level>1:
  prior=level-1
  kills=sum(6+wave*2+prior for wave in range(1,21))
  shards+=100+kills//10
  for tier in range(3):
   for key in workshop:
    cost=[30,120,240][tier];required=[1,4,8][tier]
    if workshop[key]==tier and prior>=required and shards>=cost:
     workshop[key]+=1;shards-=cost
 for attempt in range(1,attempts+1):
  seed=14000+level*100+attempt;rng=random.Random(seed)
  starters=[key for i,key in enumerate(ARMORY) if i//5<=level-1 and key!='geomutilator']
  starter=rng.choice(starters)
  g=Geomayhem(level,starter,rng=random.Random(seed),campaign={'cleared':level-1,'unlocked_level':level,'workshop':dict(workshop)})
  # Full wave clears automatically collect remaining XP; three elite waves give 16 instead of 3.
  xp=sum((6+wave*2+level)*3 for wave in range(1,20))+3*13
  g.xp=xp;g._offer_upgrade();picks=[]
  while g.offers:
   def weight(o):
    key=o['id']
    if key=='weapon' or key.startswith('upgrade:'):return 4
    if key.startswith('acquire:'):return 4 if len(g.loadout)<3 else 2.5
    if key=='heart':return 2.5
    if key=='boots':return 3 if g.upgrades['boots']<2 else 1
    if key=='magnet':return .7
    if key=='repair':return .15
    return 1.8 if key!='relic:glass' else .5
   choice=rng.choices(g.offers,weights=[weight(o) for o in g.offers])[0]['id']
   picks.append(choice);assert g.choose(choice)
  config={'weapons':[{'id':w,'stars':s} for w,s in g.loadout.items()], 'upgrades':g.upgrades,'workshop':dict(workshop),'relics':sorted(g.relics)}
  trials.append({'level':level,'boss':ARENAS[level-1][4],'attempt':attempt,'seed':seed,'config':config,'draft_choices':picks,'xp_budget':xp})
(out/'loadouts.json').write_text(json.dumps(trials,indent=2))
print('Prepared',len(trials),'loadouts')
