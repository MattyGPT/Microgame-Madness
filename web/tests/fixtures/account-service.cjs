const Rules = require('../../../shared/account-rules.js');

// These routes emulate provider transport only. Real client storage/sessions,
// semantic game operations, and the shared trusted reducer remain in use.
// Database authorization/transactions are covered by account backend tests.
async function accountService(page, { loseOneResultResponse = false } = {}) {
  const config = { url: 'https://accounts.test', key: 'sb_publishable_account_browser_test' };
  const userId = '00000000-0000-0000-0000-000000000123';
  const service = { state: Rules.initial(), revision: 0, receipts: new Map(), runs: new Map(), auth: [],
    commands: [], anonymous: true, email: null, signupCount: 0, dropped: false };
  const user = () => ({ id: userId, is_anonymous: service.anonymous, email: service.email,
    email_confirmed_at: service.anonymous ? null : '2026-11-07T12:00:00Z', last_sign_in_at: new Date().toISOString() });
  const session = () => ({ access_token: service.anonymous ? 'guest-access' : 'account-access',
    refresh_token: 'refresh-one', expires_in: 3600, user: user() });
  const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'apikey,authorization,content-type',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS' };
  const snapshot = () => ({ state: service.state, revision: service.revision, public_id: 'public-test-player' });
  await page.route('**/leaderboard-config.json', route => route.fulfill({ json: config }));
  await page.route('https://accounts.test/**', async route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const body = request.postData() ? request.postDataJSON() : {};
    if (url.pathname.startsWith('/auth/')) {
      service.auth.push({ path: url.pathname, method: request.method(), body });
      if (url.pathname.endsWith('/signup')) {
        service.signupCount++;
        return route.fulfill({ headers, json: session() });
      }
      if (url.pathname.endsWith('/user')) {
        if (request.method() === 'PUT') service.email = body.email;
        return route.fulfill({ headers, json: user() });
      }
      if (url.pathname.endsWith('/otp')) {
        if (body.email !== service.email || body.create_user !== false)
          return route.fulfill({ status: 400, headers, json: { message: 'Unknown account' } });
        return route.fulfill({ headers, json: {} });
      }
      if (url.pathname.endsWith('/verify')) {
        if (body.token !== '123456') return route.fulfill({ status: 400, headers, json: { message: 'Code is invalid or expired.' } });
        if (body.email !== service.email || !['email_change', 'email'].includes(body.type))
          return route.fulfill({ status: 400, headers, json: { message: 'Verification did not match the request.' } });
        service.anonymous = false;
        return route.fulfill({ headers, json: session() });
      }
      if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204, headers });
      if (url.pathname.endsWith('/token')) return route.fulfill({ headers, json: session() });
      return route.fulfill({ status: 404, headers, json: { message: 'Unknown auth route' } });
    }
    if (url.pathname === '/functions/v1/accounts') {
      if (request.headers().authorization !== 'Bearer account-access' || service.anonymous)
        return route.fulfill({ status: 401, headers, json: { error: { code: 'sign_in_required', message: 'Sign in first.' } } });
      if (body.action === 'snapshot') {
        await service.snapshotWait;
        return route.fulfill({ headers, json: snapshot() });
      }
      if (body.action === 'history') {
        const runs = [...service.runs.values()].filter(run => (!body.mode || run.mode === body.mode)
          && (!body.outcome || run.outcome === body.outcome) && (!body.difficulty || run.difficulty === body.difficulty));
        return route.fulfill({ headers, json: { runs: runs.slice(0, body.limit || 20), next_cursor: null } });
      }
      if (body.action === 'operations') {
        const receipts = [];
        let includesResult = false;
        for (const operation of body.operations) {
          service.commands.push(operation);
          const existing = service.receipts.get(operation.id);
          if (existing) {
            if (existing.payload !== JSON.stringify(operation))
              receipts.push({ id: operation.id, status: 'rejected', error: { code: 'conflict', message: 'Operation changed' } });
            else receipts.push({ ...existing.receipt, status: 'duplicate' });
            continue;
          }
          try {
            const applied = Rules.apply(service.state, operation, { now: Date.now() });
            service.state = applied.state; service.revision++;
            if (applied.run) { service.runs.set(applied.run.id, applied.run); includesResult = true; }
            const receipt = { id: operation.id, status: 'applied', result: applied.result };
            service.receipts.set(operation.id, { payload: JSON.stringify(operation), receipt });
            receipts.push(receipt);
          } catch (error) {
            const receipt = { id: operation.id, status: 'rejected', error: { code: error.code || 'invalid', message: error.message } };
            service.receipts.set(operation.id, { payload: JSON.stringify(operation), receipt });
            receipts.push(receipt);
          }
        }
        // The write succeeds before the response is lost, exercising retry
        // receipts rather than treating a transport failure as a rolled-back run.
        if (loseOneResultResponse && includesResult && !service.dropped) {
          service.dropped = true;
          return route.abort('failed');
        }
        return route.fulfill({ headers, json: { ...snapshot(), receipts } });
      }
      if (body.action === 'export') return route.fulfill({ headers, json: { version: 1, ...snapshot(), runs: [...service.runs.values()] } });
      return route.fulfill({ status: 400, headers, json: { error: { code: 'invalid', message: 'Unknown account command' } } });
    }
    if (url.pathname.endsWith('/get_account_seasons')) return route.fulfill({ headers, json: [] });
    if (url.pathname.endsWith('/get_leaderboard')) return route.fulfill({ headers, json: [] });
    return route.fulfill({ status: 404, headers, json: { error: 'Unexpected endpoint' } });
  });
  return service;
}

module.exports = { accountService };
