"""Fast combat-model trials with the browser playtest's imperfect-controller rules.
Uses rendered command observations at 250 ms intervals; 40 Hz physics. No future timers.
"""
import math,json,random,sys,os,copy
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import geomayhem
from geomayhem import Geomayhem
from geomayhem_bosses import boss_pressure as original_pressure
from geomayhem_arenas import contains
ROOT=Path('artifacts/boss-difficulty-tuning')

def distance(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
def segment(p,a,b):
 dx,dy=b[0]-a[0],b[1]-a[1];u=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy or 1)))
 return distance(p,(a[0]+dx*u,a[1]+dy*u))
def zone_distance(p,c):
 q=c['coords'];kind=c['kind']
 if kind=='oval':
  center=((q[0]+q[2])/2,(q[1]+q[3])/2);r=(q[2]-q[0])/2
  return distance(p,center)-r if c.get('fill') else abs(distance(p,center)-r)-c.get('width',1)/2
 if kind=='rectangle':return max(q[0]-p[0],p[0]-q[2],q[1]-p[1],p[1]-q[3])
 if kind=='polygon':
  inside=False;nearest=10000;j=len(q)-2
  for i in range(0,len(q),2):
   a,b=q[j:j+2],q[i:i+2];nearest=min(nearest,segment(p,a,b))
   if (a[1]>p[1])!=(b[1]>p[1]) and p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]:inside=not inside
   j=i
  return -nearest if inside else nearest
 return 1000
class Controller:
 def __init__(self,seed,speed):self.seed=seed;self.speed=speed;self.previous=None;self.keys=set();self.aim=None
 def random(self):
  self.seed=(1664525*self.seed+1013904223)&0xffffffff
  return self.seed/4294967296
 def decide(self,g):
  s=g.snapshot(compact=True,include_background=False)
  seen={'p':(g.x,-g.y),'commands':s['commands'],'radius':g.boss_arena_radius}
  obs=self.previous;self.previous=seen
  if obs is None or self.random()<.1:return
  p=obs['p'];enemies=[c for c in obs['commands'] if c['kind'] in ('geomayhem_enemy','geomayhem_boss')]
  bullets=[((c['coords'][0]+c['coords'][2])/2,(c['coords'][1]+c['coords'][3])/2) for c in obs['commands'] if c['kind']=='oval' and c.get('fill')=='#ff3557']
  zones=[c for c in obs['commands'] if c['kind']!='text' and (c.get('fill') in ('#ffce65','#ff526a','#ffd36d') or c.get('outline') in ('#ffce65','#ff526a'))]
  enemies.sort(key=lambda e:distance(p,e['coords']));target=enemies[0] if enemies else None;boss=next((e for e in enemies if e['kind']=='geomayhem_boss'),None)
  if boss and (not target or distance(p,target['coords'])>130):target=boss
  if target:
   lapse=self.random()<.08;a=math.atan2(target['coords'][1]-p[1],target['coords'][0]-p[0])+(self.random()-.5)*(.9 if lapse else .28);r=distance(p,target['coords'])
   self.aim=(p[0]+math.cos(a)*r,-p[1]-math.sin(a)*r)
  zones=[z for z in zones if self.random()>.15];best=None
  for n in range(9):
   a=n*math.pi/4;dx=0 if n==8 else math.cos(a);dy=0 if n==8 else math.sin(a);q=(p[0]+dx*self.speed*.4,p[1]+dy*self.speed*.4)
   edge=obs['radius']-math.hypot(*q);cost=max(0,40-edge)**2*.3
   for e in enemies:cost+=max(0,100-(distance(q,e['coords'])-e['radius']))**2*.045
   for b in bullets:cost+=max(0,45-segment(b,p,q))**2*.22
   for z in zones:cost+=max(0,18-zone_distance(q,z))**2*(.12 if z.get('dash') else .28)
   if target:cost+=abs(distance(q,target['coords'])-150)*.22
   cost+=(8 if n==8 else 0)+self.random()*12
   if best is None or cost<best[0]:best=(cost,dx,dy)
  keys=set() if self.random()<.04 else {'f'}
  _,dx,dy=best
  if dx>.3:keys.add('Right')
  if dx<-.3:keys.add('Left')
  if dy>.3:keys.add('Down')
  if dy<-.3:keys.add('Up')
  self.keys=keys

def trial(args):
 t,hp_scale,tempo=args;level=t['level'];c=t['config']
 def pressure(level,phase=1):
  result=original_pressure(level,phase)
  result['cast_interval']/=tempo;result['volley_interval']/=tempo
  return result
 geomayhem.boss_pressure=pressure
 # boss_attack calls its module's pressure too.
 import geomayhem_bosses
 geomayhem_bosses.boss_pressure=pressure
 g=Geomayhem(level,rng=random.Random(42));g.anomaly='armored';g.wave=20;g.break_left=0;g._spawn();g.boss_intro_left=0;g.spawned=g.quota
 boss=g.enemies[0];boss.x=0;boss.y=120;boss.hp*=hp_scale;boss.max_hp=boss.hp
 g.loadout={w['id']:w['stars'] for w in c['weapons']};g.weapon=next(iter(g.loadout));g.cooldowns={w:0 for w in g.loadout}
 g.max_lives+=c['workshop']['vitality']*10;g.magnet+=c['workshop']['magnet']*12;g.damage_multiplier*=1+c['workshop']['power']*.05;g.lives=g.max_lives
 for key,count in c['upgrades'].items():
  for _ in range(count):g.offers=[{'id':key}];g.choose(key)
 for key in c['relics']:g.offers=[{'id':'relic:'+key}];g.choose('relic:'+key)
 g.lives=g.max_lives;g.offers=[];controller=Controller(t['seed'],g.speed)
 for tick in range(12000):
  if tick%10==0:controller.decide(g)
  g.offers=[];g.update(.025,controller.keys,controller.aim);g.offers=[];g.xp=0
  if not g.alive or boss.hp<=0:break
 return {'level':level,'attempt':t['attempt'],'win':g.alive and boss.hp<=0,'seconds':round(g.elapsed,2),'hp':round(g.lives,1),'boss_percent':round(max(0,boss.hp)/boss.max_hp*100,1),'hp_scale':hp_scale,'tempo':tempo}
if __name__=='__main__':
 count=int(os.environ.get('COUNT','12'));scales=json.loads(os.environ.get('SCALES','[1,1]'));name=os.environ.get('RUN_NAME','baseline');levels=json.loads(os.environ.get('LEVELS','[]'))
 trials=[t for t in json.loads((ROOT/'loadouts.json').read_text()) if int(os.environ.get('START','1'))<=t['attempt']<=count and (not levels or t['level'] in levels)]
 tasks=[(t,*(scales.get(str(t['level']),[1,1]) if isinstance(scales,dict) else scales)) for t in trials]
 with ProcessPoolExecutor(max_workers=8) as pool:results=list(pool.map(trial,tasks))
 (ROOT/(name+'.json')).write_text(json.dumps(results,indent=2))
 for level in sorted({r['level'] for r in results}):
  group=[r for r in results if r['level']==level];wins=[r for r in group if r['win']]
  print(level, f'{len(wins)}/{len(group)} wins', 'first win',wins[0]['attempt'] if wins else 'none',flush=True)
