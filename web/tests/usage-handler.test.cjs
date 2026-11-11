const { test } = require('node:test');
const assert = require('node:assert/strict');

const TOKEN = 'operator-token-value';
const document = { generated_at: '2026-11-10T00:00:00Z', window_days: 30, days: [], games: [],
  account_runs: [], accounts: {}, totals: { unique_browsers: 2 } };

async function fixture(options = {}) {
  const { createUsageHandler } = await import('../../supabase/functions/usage/handler.mjs');
  const calls = [];
  const transport = async (url, request = {}) => {
    calls.push({ url, ...request, body: request.body ? JSON.parse(request.body) : null });
    if (options.rpcFails) return new Response('{"message":"boom"}', { status: 500 });
    return new Response(JSON.stringify(document), { status: 200 });
  };
  const handler = createUsageHandler({ url: 'https://test.supabase.co', serviceKey: 'server-secret',
    token: options.token === undefined ? TOKEN : options.token, fetch: transport,
    allowedOrigins: ['https://arcade.example'] });
  const request = (path = '/functions/v1/usage?days=30', headers = {}, method = 'GET') =>
    handler(new Request(`https://usage.test${path}`, { method,
      headers: { origin: 'https://arcade.example', authorization: `Bearer ${TOKEN}`, ...headers } }));
  return { request, calls };
}

test('a correct token returns the aggregated document and never the service key', async () => {
  const { request, calls } = await fixture();
  const response = await request();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), document);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://arcade.example');
  // The service key is used upstream but never echoed to the browser.
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://test.supabase.co/rest/v1/rpc/usage_report');
  assert.equal(calls[0].headers.Authorization, 'Bearer server-secret');
  assert.deepEqual(calls[0].body, { p_days: 30 });
  assert.equal(JSON.stringify(document).includes('server-secret'), false);
});

test('a missing or wrong token is refused without reaching the database', async () => {
  const { request, calls } = await fixture();
  for (const authorization of ['', 'Bearer ', 'Bearer wrong', `Bearer ${TOKEN}x`,
      `bearer ${TOKEN.toUpperCase()}`, TOKEN]) {
    const response = await request('/functions/v1/usage', { authorization });
    assert.equal(response.status, 401, authorization);
    assert.equal((await response.json()).error.code, 'unauthorized');
  }
  assert.deepEqual(calls, []);
});

test('an unconfigured function fails closed rather than opening the counters', async () => {
  const { request, calls } = await fixture({ token: '' });
  const response = await request();
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, 'unavailable');
  assert.deepEqual(calls, []);
});

test('the window is bounded and validated before any query', async () => {
  const { request, calls } = await fixture();
  for (const [days, status] of [['7', 200], ['365', 200], ['0', 400], ['366', 400],
      ['1.5', 400], ['abc', 400], ['-3', 400]]) {
    const response = await request(`/functions/v1/usage?days=${days}`);
    assert.equal(response.status, status, `days=${days}`);
  }
  // Defaults to 30 days, and only valid windows reach the database.
  assert.equal((await request('/functions/v1/usage')).status, 200);
  assert.deepEqual(calls.map(call => call.body.p_days), [7, 365, 30]);
});

test('origin, method and upstream failures are handled explicitly', async () => {
  const { request, calls } = await fixture();
  const blocked = await request('/functions/v1/usage', { origin: 'https://evil.example' });
  assert.equal(blocked.status, 403);
  assert.equal((await blocked.json()).error.code, 'origin');
  const preflight = await request('/functions/v1/usage', {}, 'OPTIONS');
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-methods'), 'GET, OPTIONS');
  const posted = await request('/functions/v1/usage', {}, 'POST');
  assert.equal(posted.status, 405);
  assert.deepEqual(calls, []);

  const failing = await fixture({ rpcFails: true });
  const upstream = await failing.request();
  assert.equal(upstream.status, 503);
  assert.equal((await upstream.json()).error.code, 'unavailable');
  assert.equal(failing.calls.length, 1);
});
