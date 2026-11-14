"""Summarize the browser's recorded theater attempts without inferring outcomes."""
import json
from pathlib import Path
from collections import Counter
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from geomayhem_weapons import ARMORY
from geomayhem import RELICS
root=Path('artifacts/boss-theater-60-attempts')
parts=list(root.glob('worker-*/results.json'))
rows=sorted((r for part in parts for r in json.loads(part.read_text())['results']),key=lambda r:(r['level'],r['attempt']))
assert len({(r['level'],r['attempt']) for r in rows})==len(rows)
data={'method':json.loads((root/'method.json').read_text()),'results':rows}
(root/'results.json').write_text(json.dumps(data,indent=2))
lines=['BOSS THEATER: THREE ATTEMPTS PER BOSS', '', 'METHOD', 'Actual browser theater, keyboard and pointer events; browser clock accelerated.', 'Controller decides every 250 ms from the preceding observation; 10% missed reactions,', '15% chance to overlook each danger zone per decision, normal aim error +/-8 degrees,', '8% aim lapses up to +/-26 degrees, and 4% firing gaps. Not calibrated to human players.', 'Each fight starts at full health with a fresh fixed loadout. No mid-fight upgrades.', 'Loadouts use a legal starter and randomized real level-up offers from a nominal', '19-wave XP budget. Workshop upgrades are purchased within cumulative clear rewards.', 'Random weapon drops can include later weapons even in arena 1, per existing game rules.', 'No Geomutilator: its optional secret unlock is not assumed. Each fight has a 300-second limit.', 'Three independent attempts, not three guaranteed victories.', '', 'RESULTS', f'{len(rows)} attempts recorded: {dict(Counter(r["outcome"] for r in rows))}', '']
for r in rows:
 c=r['config'];percent=100*r['bossHP']/r['bossMaxHP']
 lines += [f'{r["level"]:02}. {r["boss"]} — attempt {r["attempt"]}: {r["outcome"]}',f'  Time: {r["seconds"]:.1f}s; player HP: {r["hp"]}/{r["maxHP"]}; boss HP: {r["bossHP"]}/{r["bossMaxHP"]} ({percent:.1f}% remaining)', '  Weapons: '+', '.join(f'{ARMORY[w["id"]].name} {w["stars"]} stars' for w in c['weapons']),f'  Passive tiers: {c["upgrades"]}; workshop tiers: {c["workshop"]}', '  Relics: '+(', '.join(RELICS[k][0] for k in c['relics']) or 'None'),f'  Damage taken: {r["damageTaken"]:.1f}; kills: {r["kills"]}; firing events: {r["shots"]}',f'  Missed reactions: {r["missedReactions"]}; aim lapses: {r["aimLapses"]}; seed: {r["seed"]}', '']
(root/'attempt-report.txt').write_text('\n'.join(lines))
print(f'{len(rows)}/60 attempts: {dict(Counter(r["outcome"] for r in rows))}')
for level in range(1,21):
 group=[r for r in rows if r['level']==level]
 if not group:continue
 def cell(r):
  duration=f'{r["seconds"]:.0f}s'
  return f'Win {duration}, {r["hp"]:g} HP' if r['outcome']=='WIN' else f'{r["outcome"].title()} {duration}, boss {100*r["bossHP"]/r["bossMaxHP"]:.1f}%'
 print('| '+group[0]['boss']+' | '+' | '.join(cell(r) for r in group)+' |')
