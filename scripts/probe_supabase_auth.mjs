// Hosted provider proof, not an account implementation or production activation.
// node --env-file=.env.supabase scripts/probe_supabase_auth.mjs --project-ref REF
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export async function probe({ url, publicKey, serviceKey, projectRef, fetch: transport = globalThis.fetch, report = () => {} }) {
  if (!/^[a-z]{20}$/.test(projectRef || '') || url !== `https://${projectRef}.supabase.co`)
    throw new Error('Project URL must exactly match the explicitly selected hosted project reference.');
  if (!publicKey || !serviceKey || publicKey === serviceKey)
    throw new Error('Distinct public and service-role keys are required.');
  let owner;
  let primaryFailure;
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const request = async (path, { method = 'POST', body, admin = false, token, reject = false } = {}) => {
    let response;
    try {
      response = await transport(`${url}/auth/v1/${path}`, {
        method, headers: { apikey: admin ? serviceKey : publicKey,
          ...(admin || token ? { Authorization: `Bearer ${admin ? serviceKey : token}` } : {}),
          'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(15000),
      });
    } catch { throw new Error('Auth request failed or timed out; inspect the project for an unfinished probe user.'); }
    // Never surface provider response bodies, which can contain credentials.
    if (reject) {
      assert([400, 401, 403, 404, 422].includes(response.status), 'Expected credentials to be rejected.');
      return;
    }
    assert(response.ok, `Auth provider returned HTTP ${response.status}.`);
    if (response.status === 204) return null;
    return response.json();
  };
  const session = (data, anonymous = false) => {
    assert(data?.user?.id === owner && Boolean(data.access_token) && Boolean(data.refresh_token), 'Session did not preserve owner or credentials.');
    assert(data.user.is_anonymous === anonymous, 'Provider did not complete anonymous conversion.');
    return data;
  };
  const password = () => `Aa1!${randomBytes(24).toString('base64url')}`;
  const email = `probe-${randomBytes(16).toString('hex')}@accounts.invalid`;
  const initialPassword = password(), replacementPassword = password();
  try {
    const guest = await request('signup', { body: { data: { account_provider_probe: true } } });
    owner = guest?.user?.id;
    assert(typeof owner === 'string' && /^[0-9a-f-]{36}$/.test(owner), 'Anonymous signup did not return an owner.');
    session(guest, true); report('Anonymous identity created.');
    await request(`admin/users/${owner}`, { method: 'PUT', admin: true,
      body: { email, email_confirm: true, password: initialPassword } });
    const login = session(await request('token?grant_type=password', { body: { email, password: initialPassword } }));
    assert(Boolean(login.user.email_confirmed_at), 'Synthetic provider identifier was not confirmed.');
    report('Password login preserves the guest owner and produces a permanent account.');
    const refreshed = session(await request('token?grant_type=refresh_token', { body: { refresh_token: login.refresh_token } }));
    report('Refresh preserves account ownership.');
    await request('token?grant_type=password', { body: { email, password: password() }, reject: true });
    report('Incorrect password rejected.');
    await request(`admin/users/${owner}`, { method: 'PUT', admin: true, body: { password: replacementPassword } });
    await request('token?grant_type=password', { body: { email, password: initialPassword }, reject: true });
    const reset = session(await request('token?grant_type=password', { body: { email, password: replacementPassword } }));
    report('Administrative password replacement works and rejects the old password.');
    await request('logout?scope=global', { token: reset.access_token });
    await request('token?grant_type=refresh_token', { body: { refresh_token: reset.refresh_token }, reject: true });
    await request('token?grant_type=refresh_token', { body: { refresh_token: refreshed.refresh_token }, reject: true });
    report('Global logout revokes refresh credentials across sessions.');
  } catch (failure) { primaryFailure = failure; }
  finally {
    if (owner) {
      try {
        await request(`admin/users/${owner}`, { method: 'DELETE', admin: true });
        await request(`admin/users/${owner}`, { method: 'GET', admin: true, reject: true });
        report('Disposable Auth user deleted and deletion verified.');
      } catch { primaryFailure = new Error('Probe cleanup failed. Inspect Auth users marked account_provider_probe before rerunning.'); }
    }
  }
  if (primaryFailure) throw primaryFailure;
  report('Provider primitives passed. Handle uniqueness, recovery codes, abuse controls, email-path restrictions, and save integration still require separate validation.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--project-ref') {
    console.error('Usage: node --env-file=.env.supabase scripts/probe_supabase_auth.mjs --project-ref REF');
    process.exitCode = 1;
  } else {
    try {
      await probe({ url: process.env.SUPABASE_URL, publicKey: process.env.SUPABASE_PUBLISHABLE_KEY,
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY, projectRef: args[1], report: message => console.log(message) });
    } catch (failure) { console.error(failure.message); process.exitCode = 1; }
  }
}
