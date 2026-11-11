import { fault, sha256 } from '../_shared/identity.mjs';

// Operator-only read of the aggregate usage counters. The browser never holds the
// service key: it presents USAGE_REPORT_TOKEN, and this function exchanges that for
// the pre-aggregated document built by public.usage_report(). Nothing here widens
// what the counters hold — the database still refuses browser roles directly.
/** @param {{url?: string, serviceKey?: string, token?: string, fetch?: typeof globalThis.fetch, allowedOrigins?: string[]}} options */
export function createUsageHandler({ url, serviceKey, token, fetch: transport = globalThis.fetch, allowedOrigins = [] }) {
  const base = String(url || '').replace(/\/$/, '');
  let expected = null;
  // Digests make the comparison constant time and stop it leaking token length.
  const authorized = async presented => {
    if (!token || typeof presented !== 'string' || !presented) return false;
    expected ||= await sha256(token);
    const digest = await sha256(presented);
    let difference = 0;
    for (let index = 0; index < digest.length; index++)
      difference |= digest.charCodeAt(index) ^ expected.charCodeAt(index);
    return difference === 0;
  };
  return async request => {
    const origin = request.headers.get('origin');
    const permitted = !origin || !allowedOrigins.length || allowedOrigins.includes(origin);
    const headers = {
      'Access-Control-Allow-Origin': allowedOrigins.length ? (permitted && origin ? origin : allowedOrigins[0]) : '*',
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS', Vary: 'Origin',
      'Cache-Control': 'no-store', 'Content-Type': 'application/json',
    };
    const respond = (value, status = 200) => new Response(JSON.stringify(value), { status, headers });
    if (!permitted) return respond({ error: { code: 'origin', message: 'This origin is not permitted.' } }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'GET') return respond({ error: { code: 'method', message: 'Use GET.' } }, 405);
    try {
      if (!base || !serviceKey || !token) throw fault('unavailable', 'Usage reporting is not configured.', 503);
      const bearer = /^Bearer (.+)$/.exec(request.headers.get('authorization') || '');
      if (!bearer || !await authorized(bearer[1]))
        throw fault('unauthorized', 'Enter the operator token to view usage.', 401);
      const requested = Number(new URL(request.url).searchParams.get('days') ?? 30);
      if (!Number.isSafeInteger(requested) || requested < 1 || requested > 365)
        throw fault('invalid', 'Choose a window between 1 and 365 days.', 400);
      const response = await transport(`${base}/rest/v1/rpc/usage_report`, { method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_days: requested }), signal: AbortSignal.timeout(15000) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data !== 'object' || Array.isArray(data))
        throw fault('unavailable', 'The usage counters could not be read.', 503);
      return respond(data);
    } catch (error) {
      return respond({ error: { code: error.code || 'unavailable',
        message: error.code ? error.message : 'The usage counters are temporarily unavailable.' } },
        error.status || 503);
    }
  };
}
