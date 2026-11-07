// Portable handler: tested with injected transport, deployed by index.ts.
// Every computed state write goes through service-only account_commit with CAS.
/** @param {{url?: string, serviceKey?: string, rules: any, fetch?: typeof globalThis.fetch, now?: () => number, allowedOrigins?: string[], writesEnabled?: boolean, importsEnabled?: boolean, purchasesEnabled?: boolean}} options */
export function createHandler({ url, serviceKey, rules, fetch: transport = globalThis.fetch, now = Date.now, allowedOrigins = [], writesEnabled = true, importsEnabled = true, purchasesEnabled = true }) {
  const base = String(url || '').replace(/\/$/, '');
  const maxBody = 1024 * 1024;
  const safeError = (code, message, status = 400) => Object.assign(new Error(message), { code, status });
  const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
    : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
  const digest = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value)))))
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
  const rpc = async (name, body) => {
    const response = await transport(`${base}/rest/v1/rpc/${name}`, { method: 'POST', headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    let data;
    try { data = await response.json(); } catch { throw safeError('unavailable', 'Account service is unavailable. Your pending progress stays on this device.', 503); }
    if (!response.ok) {
      if (data?.message?.includes('account_deleted')) throw safeError('account_deleted', 'This account has been deleted.', 410);
      if (data?.message?.includes('rate_limited')) throw safeError('rate_limited', 'Too many updates. Please try again shortly.', 429);
      if (data?.message?.includes('submissions_restricted')) throw safeError('restricted', 'Account submissions are restricted.', 403);
      throw safeError('unavailable', 'The account change could not be saved. Please retry.', 503);
    }
    return data;
  };
  const snapshot = owner => rpc('account_read', { p_owner: owner, p_initial: rules.initial() });
  const command = async (owner, operation) => {
    try { rules.validate(operation); }
    catch (error) {
      if (error.code === 'unsupported_version') throw safeError('unsupported_version', error.message, 426);
      return { id: typeof operation?.id === 'string' ? operation.id : null, status: 'rejected', error: { code: error.code || 'invalid', message: error.message } };
    }
    const hash = await digest(operation);
    const existing = await rpc('account_receipt', { p_owner: owner, p_operation_id: operation.id, p_digest: hash });
    if (existing) return existing;
    if (!writesEnabled || (operation.kind === 'import' && !importsEnabled) || (operation.kind === 'purchase' && !purchasesEnabled))
      throw safeError('paused', 'This account change is temporarily paused. Your pending progress stays on this device.', 503);
    if (operation.dependsOn?.length) {
      const dependencies = await rpc('account_dependencies', { p_owner: owner, p_operation_ids: operation.dependsOn });
      if (operation.dependsOn.some(id => dependencies[id] !== 'applied')) {
        const rejected = operation.dependsOn.some(id => dependencies[id] === 'rejected');
        return { id: operation.id, status: 'blocked', error: { code: rejected ? 'dependency_rejected' : 'dependency_pending',
          message: rejected ? 'An earlier required change needs review. This operation is still pending.' : 'Waiting for an earlier required change to sync.' } };
      }
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      const current = await snapshot(owner);
      let next;
      try { next = rules.apply(current.state, operation, { now: now() }); }
      catch (error) {
        const rejected = await rpc('account_reject', { p_owner: owner, p_operation_id: operation.id, p_digest: hash,
          p_expected_revision: current.revision, p_error: { code: error.code || 'invalid', message: error.message } });
        if (rejected.status === 'revision_conflict') continue;
        return rejected;
      }
      const receipt = await rpc('account_commit', { p_owner: owner, p_operation_id: operation.id, p_digest: hash,
        p_expected_revision: current.revision, p_state: next.state, p_result: next.result, p_run: next.run || null, p_kind: operation.kind });
      if (receipt.status !== 'revision_conflict') return receipt;
    }
    throw safeError('busy', 'Your account changed on another device. Please retry this update.', 409);
  };
  return async request => {
    const origin = request.headers.get('origin');
    const permittedOrigin = !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin);
    const cors = { 'Access-Control-Allow-Origin': allowedOrigins.length ? (permittedOrigin && origin ? origin : allowedOrigins[0]) : '*',
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin', 'Cache-Control': 'no-store' };
    const respond = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (!permittedOrigin) return respond({ error: { code: 'origin', message: 'This origin is not permitted.' } }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return respond({ error: { code: 'method', message: 'Use POST.' } }, 405);
    try {
      if (!base || !serviceKey || !rules) throw safeError('unavailable', 'Accounts are not configured.', 503);
      if (Number(request.headers.get('content-length')) > maxBody) throw safeError('too_large', 'This request is too large.', 413);
      const token = request.headers.get('authorization') || '';
      if (!/^Bearer \S+$/.test(token)) throw safeError('auth_required', 'Sign in to access your account.', 401);
      // Auth validates the token against the account; a decoded JWT alone is not authentication.
      const authResponse = await transport(`${base}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: token }, signal: AbortSignal.timeout(10000) });
      if (!authResponse.ok) throw safeError('auth_required', 'Sign in again to sync your progress.', 401);
      const user = await authResponse.json();
      if (!user?.id || !/^[0-9a-f-]{36}$/i.test(user.id)) throw safeError('auth_required', 'Sign in again to sync your progress.', 401);
      // Bound streaming bodies too: Content-Length can be omitted or forged.
      const reader = request.body?.getReader();
      const chunks = []; let size = 0;
      if (reader) while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > maxBody) { await reader.cancel(); throw safeError('too_large', 'This request is too large.', 413); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size); let position = 0;
      for (const chunk of chunks) { bytes.set(chunk, position); position += chunk.length; }
      let body;
      try { body = JSON.parse(new TextDecoder().decode(bytes)); }
      catch { throw safeError('invalid', 'Request must be JSON.'); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw safeError('invalid', 'Request must be an object.');
      const owner = user.id; // Never accept body.owner, even when using a privileged database client.
      if (body.action === 'delete') {
        if (body.confirmation !== 'DELETE') throw safeError('confirmation_required', 'Type DELETE to confirm account deletion.');
        const signedIn = Date.parse(user.last_sign_in_at || '');
        if (!Number.isFinite(signedIn) || signedIn > now() + 60000 || now() - signedIn > 600000)
          throw safeError('reauth_required', 'Sign in with a fresh email code before deleting your account.', 401);
        await rpc('account_delete', { p_owner: owner });
        // If Auth cleanup fails, the persistent tombstone already hides data and blocks writes.
        // Calling delete again resumes safely while the auth identity still exists.
        const response = await transport(`${base}/auth/v1/admin/users/${encodeURIComponent(owner)}`, { method: 'DELETE',
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ should_soft_delete: false }), signal: AbortSignal.timeout(15000) });
        if (!response.ok && response.status !== 404) throw safeError('deletion_pending', 'Your data is hidden and deletion has started. Retry to finish account removal.', 503);
        return respond({ deleted: true });
      }
      if (!['snapshot', 'operations', 'history', 'export'].includes(body.action)) throw safeError('invalid', 'Unknown account action.');
      const current = await snapshot(owner);
      if (body.action === 'snapshot') return respond(current);
      if (body.action === 'export') return respond(await rpc('account_export', { p_owner: owner }));
      if (body.action === 'history') {
        if (body.cursor !== undefined && body.cursor !== null && !/^[0-9]{1,19}$/.test(String(body.cursor))) throw safeError('invalid', 'Invalid history cursor.');
        for (const key of ['mode','difficulty','outcome']) if (body[key] !== undefined && body[key] !== null && (typeof body[key] !== 'string' || body[key].length > 80))
          throw safeError('invalid', 'Invalid history filter.');
        return respond(await rpc('account_history', { p_owner: owner, p_limit: Number.isSafeInteger(body.limit) ? Math.min(100,Math.max(1,body.limit)) : 20,
          p_before: body.cursor || null, p_mode: body.mode || null, p_difficulty: body.difficulty || null, p_outcome: body.outcome || null }));
      }
      if (!Array.isArray(body.operations) || body.operations.length < 1 || body.operations.length > 50)
        throw safeError('invalid', 'Submit between 1 and 50 account operations.');
      const receipts = [];
      for (const operation of body.operations) receipts.push(await command(owner, operation));
      return respond({ receipts, ...await snapshot(owner) });
    } catch (error) {
      return respond({ error: { code: error.code || 'unavailable', message: error.code ? error.message : 'Account service is unavailable. Your pending progress stays on this device.' } }, error.status || (error.code ? 400 : 503));
    }
  };
}
