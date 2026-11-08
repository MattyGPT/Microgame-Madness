// Enable this workspace's ignored dist only; tracked Pages configuration stays empty.
import {spawnSync} from 'node:child_process';
const {SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:key}=process.env;
if(url!=='https://vikuhlqongfqwqhiwwxv.supabase.co'||!key)throw new Error('Selected project public configuration is required.');
const env=Object.fromEntries(Object.entries(process.env).filter(([name])=>!name.startsWith('SUPABASE_')));
const result=spawnSync('python3',['scripts/build_web.py'],{stdio:'inherit',env:{...env,SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:key}});
process.exitCode=result.status??1;
