const { test } = require('node:test');
const assert = require('node:assert/strict');

const projectRef = 'abcdefghijklmnopqrst';
const owner = '00000000-0000-4000-8000-000000000001';
const config = { url: `https://${projectRef}.supabase.co`, projectRef, publicKey: 'public-key', serviceKey: 'server-secret' };

function provider({ conversionFails = false, cleanupFails = false } = {}) {
  const calls = [], reports = [];
  let password, deleted = false, revoked = false, count = 0;
  const session = anonymous => ({ user: { id: owner, is_anonymous: anonymous,
    email_confirmed_at: anonymous ? null : '2026-11-08T00:00:00Z' }, access_token: `access-${++count}`, refresh_token: `refresh-${count}` });
  const fetch = async (url, options) => {
    const route = url.split('/auth/v1/')[1], body = options.body ? JSON.parse(options.body) : {};
    calls.push({ route, method: options.method, body, headers: options.headers });
    let status = 200, result = {};
    if (route === 'signup') result = session(true);
    else if (route === `admin/users/${owner}`) {
      assert.equal(options.headers.Authorization, 'Bearer server-secret');
      if (options.method === 'PUT') {
        if (conversionFails) { status = 422; result = { message: 'server-secret sensitive provider body' }; }
        else password = body.password;
      } else if (options.method === 'DELETE') { if (cleanupFails) status = 500; else deleted = true; }
      else if (options.method === 'GET') status = deleted ? 404 : 200;
    } else if (route === 'token?grant_type=password') {
      if (body.password !== password) status = 400;
      else result = session(false);
    } else if (route === 'token?grant_type=refresh_token') {
      if (revoked) status = 400;
      else result = session(false);
    } else if (route === 'logout?scope=global') revoked = true;
    else assert.fail(`Unexpected route ${route}`);
    return new Response(JSON.stringify(result), { status });
  };
  return { fetch, report: message => reports.push(message), calls, reports };
}

test('hosted probe exercises ownership, password replacement, refresh revocation and cleanup without printing secrets', async () => {
  const { probe } = await import('../../scripts/probe_supabase_auth.mjs');
  const fake = provider();
  await probe({ ...config, ...fake });
  assert.ok(fake.calls.some(call => call.method === 'DELETE'));
  const conversion = fake.calls.find(call => call.body.email_confirm);
  assert.match(conversion.body.email, /^probe-[a-f0-9]+@accounts\.invalid$/);
  const output = fake.reports.join('\n');
  for (const value of [owner, config.serviceKey, conversion.body.email, conversion.body.password])
    assert.equal(output.includes(value), false);
  assert.ok(output.includes('Provider primitives passed'));
});

test('hosted probe refuses mismatched destinations before contacting Auth', async () => {
  const { probe } = await import('../../scripts/probe_supabase_auth.mjs');
  await assert.rejects(probe({ ...config, url: 'https://other.example', fetch: () => assert.fail('must not contact provider') }), /exactly match/);
});

test('failed conversion still removes the disposable user and redacts provider errors', async () => {
  const { probe } = await import('../../scripts/probe_supabase_auth.mjs');
  const fake = provider({ conversionFails: true });
  await assert.rejects(probe({ ...config, ...fake }), { message: 'Auth provider returned HTTP 422.' });
  assert.ok(fake.calls.some(call => call.method === 'DELETE'));
});

test('failed cleanup is a failure, never reported as a successful provider proof', async () => {
  const { probe } = await import('../../scripts/probe_supabase_auth.mjs');
  const fake = provider({ cleanupFails: true });
  await assert.rejects(probe({ ...config, ...fake }), /cleanup failed/);
  assert.equal(fake.reports.some(message => message.includes('Provider primitives passed')), false);
});
