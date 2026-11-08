// Hosted browser verification. No screenshots, traces, videos, or credential logs.
// Run: node --env-file=.env.supabase scripts/verify_hosted_accounts_browser.mjs
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices, expect } = require('@playwright/test');
const { routeLocalRuntime } = require('../web/tests/fixtures/game.cjs');
const project = 'vikuhlqongfqwqhiwwxv';
const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url !== `https://${project}.supabase.co` || !key || !service) throw new Error('Selected project and public/server cleanup credentials required.');
const root = path.resolve('dist'), prefix = '/Microgame-Madness/', origin = 'http://127.0.0.1:8768';
const owners = new Set(), contexts = [], cleanups = [];
let browser, server, stage = 'starting';
const handle = `browser_${randomBytes(6).toString('hex')}`;
const password = `Browser-${randomBytes(20).toString('base64url')}!`;
const replacement = `Reset-${randomBytes(20).toString('base64url')}!`;
const report = message => console.log(`PASS ${message}`);
const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.wasm':'application/wasm', '.py':'text/plain', '.webm':'video/webm', '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml' };
async function admin(pathname, body, method = 'POST') {
  const response = await fetch(`${url}${pathname}`, { method, headers: { apikey:service, Authorization:`Bearer ${service}`, 'Content-Type':'application/json' }, ...(body ? {body:JSON.stringify(body)} : {}), signal:AbortSignal.timeout(30000) });
  return response.ok || response.status === 404;
}
async function pageFor(mobile = false, welcome = false) {
  const context = await browser.newContext(mobile ? devices['Pixel 7'] : { viewport:{width:1440,height:1100} });
  contexts.push(context);
  const page = await context.newPage(); page.setDefaultTimeout(30000);
  await routeLocalRuntime(page);
  await page.route('**/leaderboard-config.json', route => route.fulfill({json:{url,key}}));
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace('HangmanGame(random.choice(rules["words"]), rules["max_attempts"])','HangmanGame("cat", rules["max_attempts"])')});
  });
  if (!welcome) await page.addInitScript(() => localStorage.setItem('microgame-madness.welcome.v1','complete'));
  // Remember only UUIDs, so cleanup also covers an interrupted conversion.
  page.on('response', response => {
    if (response.url() === `${url}/auth/v1/signup` && response.ok()) {
      const task = response.json().then(data => { if(data.user?.id) owners.add(data.user.id); }).catch(() => {}); cleanups.push(task);
    }
  });
  await page.goto(`${origin}${prefix}`);
  await expect(page.locator('#runtime-status')).toContainText('All games ready',{timeout:90000});
  await page.waitForFunction(() => accountApp?.initialized && accountApp?.controller?.state().status !== 'loading');
  return page;
}
async function idle(page, id = 'account-dialog') { await expect(page.locator(`#${id}`)).not.toHaveAttribute('aria-busy','true',{timeout:60000}); }
async function profile(page) { await page.locator('#account-open').click(); await expect(page.locator('#account-dialog')).toBeVisible(); await idle(page); }
async function fill(page, prefix, secret, confirm = false) {
  await page.locator(`#${prefix}-handle`).fill(handle);
  await page.locator(`#${prefix}-password`).fill(secret);
  if(confirm) await page.locator(`#${prefix}-confirm`).fill(secret);
}
async function sync(page) { await page.evaluate(async () => { await accountApp.settle(); await accountApp.controller.flush(); await accountApp.controller.pull(); }); }
try {
  await readFile(path.join(root,'index.html'));
  server = createServer(async (request,response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url,origin).pathname);
      if(!pathname.startsWith(prefix)) { response.writeHead(404).end(); return; }
      const relative = pathname.slice(prefix.length) || 'index.html';
      const filename = path.resolve(root,relative);
      if(!filename.startsWith(`${root}${path.sep}`)) { response.writeHead(403).end(); return; }
      const body = await readFile(filename);
      response.writeHead(200,{'Content-Type':mime[path.extname(filename)] || 'application/octet-stream','Cache-Control':'no-store'}).end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((resolve,reject) => { server.once('error',reject); server.listen(8768,'127.0.0.1',resolve); });
  browser = await chromium.launch();
  stage = 'desktop guest play';
  const desktop = await pageFor(false,true);
  await expect(desktop.locator('#welcome-dialog')).toBeVisible();
  await desktop.locator('#welcome-close').click();
  await desktop.locator('[data-difficulty="easy"]').click();
  for(const letter of ['C','A','T']) await desktop.getByRole('button',{name:`Guess ${letter}`,exact:true}).click();
  await expect(desktop.locator('#overlay')).toBeVisible();
  await expect.poll(() => desktop.evaluate(() => accountApp.controller.state().profile.shop.units)).toBe(40000);
  report('guest browser gameplay earns Cash without registration.');
  stage = 'welcome registration';
  await profile(desktop); await desktop.locator('#account-welcome').click();
  await desktop.locator('#welcome-next').click();
  await fill(desktop,'welcome',password,true); await desktop.locator('#welcome-create').click();
  await expect(desktop.locator('#welcome-recovery-step')).toBeVisible({timeout:60000});
  const recovery = await desktop.locator('#welcome-recovery-code').inputValue(); assert.ok(recovery);
  await idle(desktop,'welcome-dialog');
  const owner = await desktop.evaluate(() => accountApp.session.snapshot().user.id); owners.add(owner);
  await expect(desktop.locator('#welcome-account-success')).toBeVisible();
  await desktop.locator('#welcome-recovery-saved').click(); await desktop.locator('#welcome-next').click();
  await desktop.locator('#welcome-name').fill('Hosted Browser Cubie');
  await desktop.locator('#welcome-sound').uncheck();
  await desktop.locator('#welcome-sharing').uncheck(); await desktop.locator('#welcome-public').uncheck();
  await desktop.locator('#welcome-next').click(); await expect(desktop.locator('#welcome-tour')).toBeVisible();
  await desktop.locator('#welcome-skip-tour').click(); await sync(desktop);
  assert.equal(await desktop.evaluate(() => accountApp.controller.state().profile.shop.units),40000);
  assert.equal(await desktop.evaluate(async () => (await accountApp.controller.history()).runs.length),1);
  report('desktop welcome handle registration preserves guest Cash/history and exposes one-time recovery.');
  stage = 'fresh mobile login';
  const mobile = await pageFor(true,false); await profile(mobile);
  await mobile.locator('#account-login').click(); await fill(mobile,'account',password); await mobile.locator('#account-login').click();
  await expect(mobile.locator('#account-user-actions')).toBeVisible({timeout:60000}); await idle(mobile);
  assert.equal(await mobile.evaluate(() => accountApp.controller.state().profile.shop.units),40000);
  await expect(mobile.locator('#account-name')).toHaveValue('Hosted Browser Cubie');
  await expect(mobile.locator('#account-sound')).not.toBeChecked();
  await expect(mobile.locator('#account-ranking')).not.toBeChecked();
  await expect(mobile.locator('#account-public')).not.toBeChecked();
  await expect(mobile.locator('#account-history')).toContainText('hangman · easy · win');
  await expect(mobile.locator('#account-dialog input[type="email"]')).toHaveCount(0);
  const archive = await mobile.evaluate(async () => JSON.stringify(await accountApp.controller.export()));
  for(const secret of [password,recovery,service]) assert.ok(!archive.includes(secret));
  assert.doesNotMatch(archive,/access_token|refresh_token|provider_identifier|encrypted_password/);
  report('fresh mobile browser signs in with synced wallet/history/preferences; progress export contains no credentials.');
  stage = 'mobile recovery';
  await mobile.locator('#account-signout').click(); await idle(mobile);
  await mobile.locator('#account-recover').click(); await fill(mobile,'account',replacement,true);
  await mobile.locator('#account-recovery').fill(recovery); await mobile.locator('#account-recover').click();
  await expect(mobile.locator('#account-recovery-step')).toBeVisible({timeout:60000});
  const rotated = await mobile.locator('#account-recovery-code').inputValue(); assert.ok(rotated && rotated !== recovery);
  await idle(mobile); await mobile.locator('#account-recovery-saved').click();
  assert.equal(await mobile.evaluate(() => accountApp.controller.state().profile.shop.units),40000);
  const revoked = await desktop.evaluate(async () => { try { await accountApp.controller.pull(); return false; } catch(error) { return error.status === 401; } });
  assert.equal(revoked,true);
  report('mobile recovery retains progress, rotates recovery code, and rejects the first browser’s revoked access token.');
  stage = 'password-confirmed deletion';
  await mobile.getByText('Delete account',{exact:true}).click();
  await mobile.locator('#account-delete-confirm').fill('DELETE');
  await mobile.locator('#account-delete-password').fill('Incorrect-password-123!'); await mobile.locator('#account-delete').click(); await idle(mobile);
  assert.equal(await mobile.evaluate(() => accountApp.controller.state().owner),owner);
  await expect(mobile.locator('#account-message')).not.toHaveText('');
  await mobile.locator('#account-delete-password').fill(replacement); await mobile.locator('#account-delete').click();
  await expect(mobile.locator('#account-message')).toContainText('account was deleted',{timeout:60000});
  assert.equal(await mobile.evaluate(() => accountApp.controller.state().owner),'guest'); owners.delete(owner);
  report('mobile deletion refuses an incorrect password and restores guest play after valid confirmation.');
  console.log(`Hosted browser verification complete for ${project} through ${prefix}.`);
} catch {
  // Browser errors can contain locator values or response credentials. Report only the stage.
  console.error(`Hosted browser verification FAILED during ${stage}. No credential-bearing diagnostics were written.`);
  process.exitCode = 1;
} finally {
  await Promise.allSettled(cleanups);
  for(const context of contexts) await context.close().catch(() => {});
  await browser?.close().catch(() => {});
  if(server) await new Promise(resolve => server.close(resolve));
  for(const owner of owners) {
    const privateRemoved = await admin('/rest/v1/rpc/account_delete',{p_owner:owner}).catch(() => false);
    const authRemoved = await admin(`/auth/v1/admin/users/${owner}`,null,'DELETE').catch(() => false);
    if(!privateRemoved || !authRemoved) { console.error('Disposable browser account cleanup failed.'); process.exitCode=1; }
  }
}
