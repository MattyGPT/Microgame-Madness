"""Record tuning evidence and distinguish native estimates from browser attempts."""
import json,hashlib,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from geomayhem_bosses import boss_health,BOSS_TEMPO
from geomayhem_arenas import ARENAS
root=Path('artifacts/boss-difficulty-tuning')
rows=[]
for name in ('final-validation','independent-validation'):
 rows+=json.loads((root/(name+'.json')).read_text())
lines=['GEOMAYHEM BOSS DIFFICULTY TUNING','',
 'Native combat-model validation: 120 varied builds/error seeds per boss.',
 '40 Hz physics, decisions every 250 ms, observations delayed one decision.',
 '10% missed reactions, 15% overlooked zones, ordinary aim error and occasional lapses.',
 'Stage-legal starters, actual randomized upgrade offers, affordable workshop tiers.',
 'All trials start at full health; secret Geomutilator unlock is not assumed.',
 'These controllers are not calibrated to average humans. Wins per trial estimate',
 'difficulty; reciprocal win rate is not a guarantee of any player’s retry count.',
 'No forced losses, attempt-based stat changes, or artificial limits on winning.', '',
 'Boss | Armored theater HP | Wins / trials | Approx. trials per win']
summary=[]
for level in range(1,21):
 group=[r for r in rows if r['level']==level];wins=sum(r['win'] for r in group);rate=wins/len(group)
 item={'level':level,'boss':ARENAS[level-1][4],'theater_hp':round(boss_health(level)*1.2),'tempo':BOSS_TEMPO[level-1],'wins':wins,'trials':len(group),'estimated_attempts_per_win':round(1/rate,1) if rate else None}
 summary.append(item);lines.append(f'{level:02}. {item["boss"]} | {item["theater_hp"]} | {wins}/{len(group)} | {item["estimated_attempts_per_win"]}')
lines+=['','ACTUAL BROWSER CHECKS (60 Hz theater, real UI input handlers)','Browser clock accelerated; cosmetic drawing sampled to reduce test cost.']
checks=[]
for path in sorted(root.glob('browser-*/results.json')):
 data=json.loads(path.read_text())['results'];checks+=data
 for r in data:lines.append(f'{r["boss"]}, attempt {r["attempt"]}: {r["outcome"]}, {r["seconds"]:.1f}s, player HP {r["hp"]}/{r["maxHP"]}, boss HP {r["bossHP"]}/{r["bossMaxHP"]}')
(root/'difficulty-report.txt').write_text('\n'.join(lines)+'\n')
(root/'difficulty-summary.json').write_text(json.dumps({'model':summary,'browser':checks,'source_sha256':{name:hashlib.sha256(Path(name).read_bytes()).hexdigest() for name in ('geomayhem.py','geomayhem_bosses.py','geomayhem_weapons.py')}},indent=2))
for item in summary:print(item['level'],item['wins'], '/',item['trials'], 'approx',item['estimated_attempts_per_win'],'attempts/win')
for level in sorted({r['level'] for r in checks}):
 g=[r for r in checks if r['level']==level];w=[r for r in g if r['outcome']=='WIN'];print('Browser',level,'first win',w[0]['attempt'] if w else 'pending','completed',len(g))
