# Usage analytics

Lightweight, first-party usage counters that answer "how many people are logging
in to play". Everything is aggregate. There is no third-party analytics script, no
cookie, no event log, and no identifier that can be traced back to a player.

## What is collected

| Stored | Never stored |
| --- | --- |
| Day (UTC) | IP address or any request metadata |
| Event kind: `visit`, `login`, `register`, `play`, `finish` | Handle, display name, or player nickname |
| Game and difficulty for `play`/`finish` | Auth user id, session id, or refresh token |
| Outcome for `finish`: `win`, `loss`, `exit`, `interrupted` | Score value, run payload, or game save |
| Integer counters per day/kind/game/difficulty/outcome | Password, recovery code, or any credential |
| One SHA-256 hash of a random per-browser id, per day | The random id itself, or any raw event row |

The per-browser id is 16 random bytes generated in the browser and kept in
`localStorage` under `microgame-madness.usage.v1.visitor`. Only its hash is stored,
salted with a fixed project prefix, so the table cannot be joined to
`auth.users`. Clearing site data starts a new counted browser.

A `visit` is one page load. A `login` is a credential sign-in to a different
account than the browser currently had; a `register` is an anonymous guest
converting to an account. A cached session restored at page load is **not** a
`login` — it is a `visit` with `scope = 'account'`, which is what makes "distinct
signed-in players per day" work without counting silent token refreshes.

`scope` (`guest` or `account`) is reported by the client and upgrades the day's
row once, never downgrades. It is an analytics label, not an authorization
decision. The authoritative record of signed-in play is `accounts_private.runs`.

## Where it lives

`supabase/migrations/20261110100000_usage_stats.sql` creates schema
`stats_private` with three tables — `daily_events` (counters), `daily_players`
(one hashed browser per day), `call_limits` (abuse buckets). All three have row
level security enabled and every privilege revoked from `public`, `anon`, and
`authenticated`. Browsers reach them only through `public.record_usage`, which is
`security definer`, validates every field against a closed allowlist, and caps a
report at 32 events. `public.prune_usage` is granted to `service_role` only.

Abuse limits are per reported browser (12 calls/minute, 400/day) because no IP is
collected and guests have no server-side identity. A hostile client can therefore
inflate counters. It cannot read anything, write anywhere else, or exceed the
allowlist. Treat these numbers as trends: if totals run far above distinct
players, something is hammering the endpoint.

## Reading the numbers

```
npm run usage:report              # last 30 days
npm run usage:report -- --days 7  # any window, 1–365
npm run usage:report -- --json    # machine-readable
```

`scripts/usage_report.mjs` is read-only and reuses the Management API credentials
in `.env.supabase`. It prints:

1. **Visits and players per day** — page loads, distinct browsers, how many were
   signed in, logins, registrations, plays, finishes, wins.
2. **Games** — plays, days played, finishes by outcome, finish and win rates.
3. **Signed-in players with synced runs** — the authoritative cross-check for
   row 1, from `accounts_private.runs`.
4. **Accounts** — active handles, new handles, total and new accounts, accounts
   that signed in recently, anonymous users, deletions.
5. **Totals since collection began** — unique browsers, how many ever signed in,
   cumulative visits and plays, leaderboard rows.

Every query is executed against a seeded PGlite database by
`web/tests/usage-report.test.cjs`, so the report cannot silently drift from the
schema.

## Operator dashboard

The same document is rendered as charts at an unlinked URL:

```
https://microgame-madness.com/ops/usage.html     # production
http://127.0.0.1:8777/ops/usage.html              # local preview
```

Nothing in the arcade links to it, it carries `noindex, nofollow, noarchive`, and
it shows a token gate before reading anything. The token is the
`USAGE_REPORT_TOKEN` project secret; the page stores it in `localStorage` and
sends it as a bearer header to the `usage` Edge Function, which exchanges it for
the aggregate document. **The service key never reaches the browser**: the
function compares SHA-256 digests of the presented token in constant time,
enforces `ACCOUNTS_ALLOWED_ORIGINS`, answers `Cache-Control: no-store`, and
bounds the window to 1–365 days before querying.

Setting it up:

```
npm run usage:token    # uploads USAGE_REPORT_TOKEN from .env.supabase, or
                       # generates one, uploads it, and prints it exactly once
npm run usage:deploy   # deploys supabase/functions/usage
```

Rotate by changing `USAGE_REPORT_TOKEN` in `.env.supabase` and re-running
`usage:token`; the page's "Forget token" button clears only the browser copy.

What it shows, in order: a compact strip of headline numbers each labeled with
its window or denominator; a line chart of visits versus distinct browsers; a
stacked column chart of signed-in versus guest browsers (the guest segment is
striped as well as colored); logins versus registrations; plays per game as a
sorted bar chart; win rate per game with its denominator on every bar; then the
full daily, per-game, and signed-in-run tables; and a closing list of the
counters' blind spots. Chart marks use two validated colors on the dark surface
plus dash patterns, direct end labels, and the tables, so nothing depends on hue
alone. `web/tests/usage-dashboard.test.cjs` covers the chart maths in Node and
`web/tests/usage-dashboard.spec.cjs` covers the page in a browser, including the
token gate, a rejected token, an outage, and the unlinked-build guarantee in
`test_web.py`.

## Client behaviour

`web/usage.js` is self-contained and wired in three places in
`web/accounts/app.js`: `initialize()` creates it and reports the `visit`,
`startRun()` reports a `play`, and `finish()` reports the outcome. Nothing in
`web/app.js` changed.

- Honors `Do Not Track` and `Global Privacy Control`: no id is generated, nothing
  is stored, nothing is sent.
- Sends no `Authorization` header, so it never triggers a token refresh and never
  creates an anonymous auth user (which would consume provider MAU).
- Batches gameplay events and flushes on `pagehide`, `visibilitychange` (hidden),
  `online`, or after 20 s. Only the initial `visit` is sent immediately, so a
  bounce still counts.
- Uses `fetch(..., { keepalive: true })` so the last batch survives navigation.
- Never throws into gameplay: a failed report is requeued once, the buffer is
  capped at 96 events, and every error is dropped.

## Deploying

The counters need the migration before the client build reaches players; until
then every report fails and is silently dropped, and `npm run usage:report` says
so explicitly.

```
npm run accounts:migrate   # applies 20261110100000_usage_stats.sql
npm run build              # ships web/usage.js into dist/
```

Nothing is deployed to the Edge Functions: `record_usage` is a plain Postgres RPC
called with the existing publishable key from `leaderboard-config.json`. It goes
through `/rest/v1`, which answers `Access-Control-Allow-Origin: *`, so the
`ACCOUNTS_ALLOWED_ORIGINS` secret does not gate it and needs no change.

## Retention and limits

Nothing is deleted automatically. `daily_players` grows by roughly one row per
active browser per day and `daily_events` by a few dozen rows per day, so a year
of a small arcade is well under a megabyte. To set a window, as `service_role`:

```sql
select public.prune_usage(365);  -- days to keep; returns what was removed
```

Known blind spots, by design:

- Only games routed through `AccountApp.startRun` are counted. Temporary modes —
  the jukebox, shop, customs room, and block guide — are not.
- Geomayhem and Singularity practice count as plays; their campaign progress is
  local-only and is not otherwise synced.
- A browser with JavaScript disabled, or an ad blocker that blocks the Supabase
  domain, is not counted at all. Raw page loads for those visitors are visible
  only in the Cloudflare dashboard for the static-assets app.
- Distinct players means distinct browsers, not distinct people: one player on
  two devices counts twice, and two players sharing a browser count once.

This matches the privacy goals in
[accounts-and-progression-design.md](accounts-and-progression-design.md): no
contact details, no real-world identity, minimized logs, and no credentials in
analytics or logs.
