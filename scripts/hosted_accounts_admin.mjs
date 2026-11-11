// Project-scoped infrastructure helpers. Never print provider responses or secrets.
// Sole exception: usage-token prints a freshly generated dashboard token once.
import { readFile, readdir } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
export const projectRef = 'vikuhlqongfqwqhiwwxv';
export function environment() {
  const env = process.env;
  if (env.SUPABASE_URL !== `https://${projectRef}.supabase.co` || !env.SUPABASE_ACCESS_TOKEN)
    throw new Error('Selected project URL and management credentials are required.');
  return env;
}
export async function management(path, { method = 'GET', body } = {}) {
  const env = environment();
  if (!path.startsWith(`/v1/projects/${projectRef}`)) throw new Error('Project scope rejected.');
  const response = await fetch(`https://api.supabase.com${path}`, { method,
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, ...(body instanceof FormData ? {} : {'Content-Type':'application/json'}) },
    ...(body === undefined ? {} : {body: body instanceof FormData ? body : JSON.stringify(body)}), signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Management ${method} ${path.split('/').slice(-2).join('/')} returned HTTP ${response.status}.`);
  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}
export const query = query => management(`/v1/projects/${projectRef}/database/query`, {method:'POST',body:{query}});
export async function inspect() {
  const project = await management(`/v1/projects/${projectRef}`);
  const config = await management(`/v1/projects/${projectRef}/config/auth`);
  const functions = await management(`/v1/projects/${projectRef}/functions`);
  const tables = await query("select schemaname, tablename from pg_tables where schemaname in ('public','accounts_private','supabase_migrations') order by 1,2");
  const safeConfig = Object.fromEntries(Object.entries(config).filter(([key,value]) =>
    typeof value === 'boolean' || /^rate_limit_|^password_min_length$|^jwt_exp$|^hook_.*_uri$/.test(key)));
  return {project:projectRef,status:project.status,config:safeConfig,functions:functions.map(f=>({slug:f.slug,status:f.status,version:f.version})),tables};
}
// A dedicated ledger guards reruns and refuses edits to already applied migrations.
export async function migrate() {
  await query("create schema if not exists accounts_deploy; revoke all on schema accounts_deploy from public, anon, authenticated; create table if not exists accounts_deploy.migrations(name text primary key, sha256 text not null, applied_at timestamptz not null default now());");
  const applied = new Map((await query('select name, sha256 from accounts_deploy.migrations')).map(row => [row.name,row.sha256]));
  for (const name of (await readdir('supabase/migrations')).filter(n=>/^\d+_[a-z_]+\.sql$/.test(n)).sort()) {
    const sql = await readFile(`supabase/migrations/${name}`,'utf8');
    const hash = createHash('sha256').update(sql).digest('hex');
    if(applied.has(name)) {
      if(applied.get(name)!==hash) throw new Error(`Applied migration checksum differs: ${name}`);
      continue;
    }
    await query(`begin; ${sql}\ninsert into accounts_deploy.migrations(name,sha256) values ('${name}','${hash}'); commit;`);
    console.log(`Applied ${name}`);
  }
}
export async function configure() {
  // No SMTP configuration or outbound notifications. These hooks reject all mail.
  await management(`/v1/projects/${projectRef}/config/auth`,{method:'PATCH',body:{
    external_anonymous_users_enabled:true,external_email_enabled:true,external_phone_enabled:false,
    mfa_phone_enroll_enabled:false,mfa_phone_verify_enabled:false,mfa_totp_enroll_enabled:false,mfa_totp_verify_enabled:false,
    ...Object.fromEntries(['apple','azure','bitbucket','discord','facebook','figma','github','gitlab','google','kakao','keycloak','linkedin_oidc','slack','notion','spotify','twitch','twitter','x','workos','web3_solana','web3_ethereum','zoom'].map(provider=>[`external_${provider}_enabled`,false])),
    password_min_length:12,mailer_autoconfirm:false,mailer_allow_unverified_email_sign_ins:false,
    hook_before_user_created_enabled:true,hook_before_user_created_uri:'pg-functions://postgres/public/identity_before_user_created',
    hook_send_email_enabled:true,hook_send_email_uri:'pg-functions://postgres/public/identity_send_email',
    mailer_notifications_password_changed_enabled:false,mailer_notifications_email_changed_enabled:false,
    mailer_notifications_phone_changed_enabled:false,mailer_notifications_mfa_factor_enrolled_enabled:false,
    mailer_notifications_mfa_factor_unenrolled_enabled:false,mailer_notifications_identity_linked_enabled:false,
    mailer_notifications_identity_unlinked_enabled:false,security_manual_linking_enabled:false,
    jwt_exp:900,rate_limit_anonymous_users:30,rate_limit_token_refresh:150,rate_limit_email_sent:2,
    audit_log_disable_postgres:true
  }});
  await management(`/v1/projects/${projectRef}/secrets`,{method:'POST',body:[
    {name:'ACCOUNTS_ALLOWED_ORIGINS',value:'https://microgame-madness.com,https://mattygpt.github.io,http://localhost:8777,http://127.0.0.1:8777,http://127.0.0.1:8768'},
    {name:'ACCOUNTS_WRITES_ENABLED',value:'true'},{name:'ACCOUNTS_IMPORTS_ENABLED',value:'true'},{name:'ACCOUNTS_PURCHASES_ENABLED',value:'true'}
  ]});
  console.log('Configured contact restrictions, provider policy and exact allowed origins.');
}
export async function deploy(slug) {
  if(!['accounts','identity','usage'].includes(slug)) throw new Error('Unknown function.');
  const body = new FormData();
  const entry = `supabase/functions/${slug}/index.ts`;
  body.set('metadata',JSON.stringify({name:slug,entrypoint_path:entry,verify_jwt:false}));
  // Only explicit source files; never bundle environment, archives, tests, or credentials.
  const files = [entry,`supabase/functions/${slug}/handler.mjs`,'supabase/functions/_shared/identity.mjs'];
  if(slug==='accounts') files.push('web/achievements.js','web/customs.js','web/shop.js','web/trails.js','shared/account-rules.js');
  for(const name of files) body.append('file',new Blob([await readFile(name)],{type:'application/typescript'}),name);
  const result = await management(`/v1/projects/${projectRef}/functions/deploy?slug=${slug}`,{method:'POST',body});
  console.log(`Deployed ${slug} version ${result.version}, ${result.status}`);
}
// The usage dashboard's only credential. Reuse USAGE_REPORT_TOKEN from the
// environment when set; otherwise generate one and print it a single time, the
// same way a recovery code is shown once. It unlocks aggregate counters only.
export async function configureUsage() {
  const provided = process.env.USAGE_REPORT_TOKEN;
  const token = provided || randomBytes(32).toString('hex');
  await management(`/v1/projects/${projectRef}/secrets`,{method:'POST',body:[{name:'USAGE_REPORT_TOKEN',value:token}]});
  console.log(provided ? 'Uploaded USAGE_REPORT_TOKEN from the environment.'
    : `Uploaded a generated USAGE_REPORT_TOKEN. Copy it now; it is not shown again:\n${token}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv[2] === 'configure') await configure();
    else if (process.argv[2] === 'migrate') await migrate();
    else if(process.argv[2] === 'deploy') await deploy(process.argv[3]);
    else if (process.argv[2] === 'usage-token') await configureUsage();
    else if (process.argv[2] === 'inspect') console.log(JSON.stringify(await inspect(), null, 2));
    else throw new Error('Use inspect. Deployment actions are explicit exported functions.');
  } catch (error) { console.error(error.message); process.exitCode=1; }
}
