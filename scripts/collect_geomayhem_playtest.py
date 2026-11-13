"""Collect actual browser-run logs into a live report; never edit game results."""
import csv,html,json,os,pathlib,signal,subprocess,sys,time
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
from geomayhem_arenas import ARENAS
root=pathlib.Path('artifacts/geomayhem-playtest')
while True:
    rows=[];all_done=True
    for level in range(1,21):
        p=root/('results.json' if level==1 else f'arena-{level}/results.json')
        try:d=json.loads(p.read_text())
        except (OSError,ValueError):d={}
        wins=[r for r in d.get('results',[]) if r['level']==level]
        attempts=[r for r in d.get('attempts',[]) if r['level']==level]
        done=len(wins)>=3 or d.get('done',False)
        all_done &= done
        s=d.get('status',{})
        counts=[];boss_deaths=wave_deaths=0
        for attempt in attempts:
            if attempt['won']:
                counts.extend([boss_deaths+1,wave_deaths]);boss_deaths=wave_deaths=0
            elif attempt['wave']==20:boss_deaths+=1
            else:wave_deaths+=1
        counts.extend(['']*(6-len(counts)))
        rows.append([level,ARENAS[level-1][4],*counts,boss_deaths,wave_deaths,len(attempts),s.get('wave',''), 'Complete' if len(wins)>=3 else d.get('error') or d.get('reason') or 'Playing full runs'])
        if level==1 and len(wins)>=3:
            # The first worker started before per-arena scheduling was configured.
            try:
                if pathlib.Path('/proc/45515/cmdline').read_bytes().startswith(b'node\x00scripts/playtest_geomayhem.cjs\x00'):
                    os.kill(45515,signal.SIGTERM)
            except (OSError,ProcessLookupError):pass
    headings=['Arena','Boss','Boss attempts: win 1','Wave deaths before win 1','Boss attempts: win 2','Wave deaths before win 2','Boss attempts: win 3','Wave deaths before win 3','Boss deaths since last win','Wave deaths since last win','Completed full-run attempts','Current / last wave','Status']
    with (root/'attempt-counts.csv').open('w') as f:
        w=csv.writer(f);w.writerow(headings);w.writerows(rows)
    cells=lambda values:''.join('<td>'+html.escape(str(v) if v!='' else 'Pending')+'</td>' for v in values)
    table='<table><thead><tr>'+''.join('<th>'+h+'</th>' for h in headings)+'</tr></thead><tbody>'+''.join('<tr>'+cells(r)+'</tr>' for r in rows)+'</tbody></table>'
    page='''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="refresh" content="30"><title>Geomayhem full-run playtest</title><style>body{font:16px system-ui;background:#0b1324;color:#e3edf9;padding:30px}h1{color:#a2f2da}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:12px;border:1px solid #33415c;text-align:left}th{background:#24334d}p{max-width:950px;line-height:1.5}</style><h1>Geomayhem full-run playtest</h1><p>Live recorded results, refreshed every 30 seconds. All attempts start at wave 1. Boss-attempt counts include deaths during wave 20 plus the successful fight. Deaths in waves 1–19 are counted separately for each win. Boss encounters include their reinforcements and arena hazards. Pending means the requested victory has not been recorded. This is browser-controlled play with delayed reactions and aim errors, not measured average-human performance. Separate test profiles unlock arena selection only; all combat upgrades and purchases are earned through play.</p>'''+table
    (root/'progress.html').write_text(page)
    pathlib.Path('dist/playtest-progress.html').write_text(page)
    if all_done:break
    time.sleep(30)
