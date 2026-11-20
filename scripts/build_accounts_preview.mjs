// Enable this workspace's ignored dist only; tracked Pages configuration stays empty.
import {existsSync,cpSync,readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const {SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:key}=process.env;
if(url!=='https://vikuhlqongfqwqhiwwxv.supabase.co'||!key)throw new Error('Selected project public configuration is required.');
const env=Object.fromEntries(Object.entries(process.env).filter(([name])=>!name.startsWith('SUPABASE_')));
const result=spawnSync('python3',['scripts/build_web.py'],{stdio:'inherit',env:{...env,SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:key}});
if(result.status===0 && existsSync('local-games/balloon-pop/index.html')){
 cpSync('local-games/balloon-pop','dist/balloon-pop',{recursive:true,filter:source=>!source.endsWith('.test.cjs')});
 const file='dist/index.html';const html=readFileSync(file,'utf8').replace('<nav class="game-grid" aria-label="Games">','<nav class="game-grid" aria-label="Games"><a class="game-card" href="./balloon-pop/index.html" style="--accent:#f5a5c7;text-decoration:none;background:linear-gradient(145deg,#243f50,#364959)"><span class="card-top">LOCAL PLAYTEST · UNRELEASED</span><span class="card-art" aria-hidden="true">🎈</span><span class="card-title">Balloon Pop ↗</span><span class="card-description">Four skies. Five lives. Catch the colour before it catches the clouds.</span></a>');
 writeFileSync(file,html);
}
process.exitCode=result.status??1;
