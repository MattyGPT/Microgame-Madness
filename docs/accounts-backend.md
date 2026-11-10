# Accounts backend operation

Implemented November 8, 2026. Optional accounts now use handles and passwords without asking for real email addresses, phone numbers or names. Supabase Auth hashes passwords behind the trusted `identity` adapter; its internal identifiers use the reserved `.invalid` domain. Guest play remains available.

The browser stays static. The `accounts` Edge Function validates sessions and reduces operations using the browser's shared catalogs; Postgres commits state, history, wallet entries and receipts atomically. Public rankings are casual client-reported results, not replay-verified scores. See the [authentication contract](accounts-auth-contract.md) and [implementation evidence](accounts-implementation-status.md).

## Selected deployment and setup

Only project `vikuhlqongfqwqhiwwxv` is authorized for these scripts. Seven migrations through `20261110000000_handle_accounts.sql` and both functions are deployed there. The tracked `leaderboard-config.json` remains empty; no GitHub Pages account activation is included. The local preview may use public connection values in ignored `dist/`.

The owner-readable ignored `.env.supabase` supplies `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ACCESS_TOKEN`. Never print these values, add them to Git, include administrative keys in browser assets, or run credentialed checks in untrusted pull-request jobs.

From the repository root:

```sh
npm run accounts:inspect
npm run accounts:migrate
node --env-file=.env.supabase scripts/hosted_accounts_admin.mjs configure
npm run accounts:deploy -- identity
npm run accounts:deploy -- accounts
npm run test:accounts:hosted
node --env-file=.env.supabase scripts/verify_hosted_accounts_browser.mjs
node --env-file=.env.supabase scripts/verify_hosted_identity.mjs
node --env-file=.env.supabase scripts/verify_hosted_pause.mjs
```

The helper validates the exact project URL and scopes every management path. Migration application is transactional, recorded with a SHA-256 checksum in the private `accounts_deploy.migrations` ledger, and skips matching applied files. It refuses changed applied migrations. Function deployment uploads an explicit source allowlist, including shared rules and the identity helper; environment files never enter the bundle. Both functions disable the legacy gateway JWT check and perform their own Auth/session verification.

`configure` enables anonymous and password-capable email provider primitives, disables phone/OAuth entry points and phone/TOTP MFA, sets a minimum 12-character provider password, disables email notifications and enables two rejecting hooks:

- `pg-functions://postgres/public/identity_before_user_created` rejects direct contact signup.
- `pg-functions://postgres/public/identity_send_email` rejects every outbound email attempt.

The deferred `auth.users` credential trigger additionally blocks contact fields and direct password/provider-identifier changes without a fresh server-only mutation ticket. It validates final transaction metadata because Auth updates password/email and metadata in separate statements. No SMTP setup is needed or permitted for this flow. The adapter enforces a 72-byte UTF-8 password ceiling to avoid bcrypt truncation.

The allowlisted origins are `https://microgame-madness.com`, `https://mattygpt.github.io`, `http://localhost:8777`, `http://127.0.0.1:8777`, and the hosted-browser test origin `http://127.0.0.1:8768`. Origins exclude repository paths. Browser automation verifies `/Microgame-Madness/` without publishing account configuration to Pages.

Official provider references: [Auth hooks](https://supabase.com/docs/guides/auth/auth-hooks), [email hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook), and [Management API function deployment](https://supabase.com/docs/reference/api/v1-deploy-a-function).

## Provider proof history

The preserved `scripts/probe_supabase_auth.mjs` established anonymous conversion, password login, refresh, password replacement and deletion before deployment. It used disposable synthetic identifiers and printed stage descriptions only. The deployed credential guard intentionally rejects its old unrestricted administrative conversion path; use the current hosted verification scripts above. Its four local tests remain useful for cleanup/redaction behavior. The initial empty project had anonymous sign-in disabled; the user enabled it and later supplied management access. No other project was contacted by implementation deployment.

## Private protocol

Send JSON by POST to `/functions/v1/accounts`, using the publishable key as `apikey` and the user's session token as `Authorization: Bearer ...`. Every response has `Cache-Control: no-store`. The authenticated user determines ownership; request-body owner IDs never determine which account is read or changed.

| Action | Request fields | Result |
| --- | --- | --- |
| `snapshot` | None | `state`, `revision`, `public_id` |
| `operations` | `operations`: 1–50 versioned semantic operations | Per-operation receipts plus latest state/revision/public ID |
| `history` | Optional `limit` (1–100), opaque numeric `cursor`, `mode`, `difficulty`, `outcome` | `runs`, `next_cursor` |
| `export` | None | Versioned state, all stored runs, and wallet records; no credentials |
| `delete` | `confirmation: "DELETE"`, `password`; current-password verification | `deleted: true` after private cleanup and Auth removal |

Operations use `{id,kind,streamId,runId?,version:1,payload,occurredAt?}`. Occurrence timestamps describe private history and achievement dates; server receipt time alone determines seasons. Finite timestamps before 2000 or more than five minutes ahead of the server are normalized to receipt time and marked `timeAdjusted`, so a skewed device clock does not discard otherwise valid earnings. Missing timestamps use receipt time. The reducer also accepts the documented snake-case aliases. Terminal receipt states are `applied`, `duplicate`, or `rejected`; rejections contain `{code,message}`. Operations can declare up to 32 `dependsOn` operation IDs. A missing or rejected dependency returns nonterminal `blocked`; the dependent work remains pending while unrelated work can continue. Valid-envelope semantic rejections are durably remembered. Retry the same immutable operation after transient failures. HTTP 426 with code `unsupported_version` retains the queue until the client/server version mismatch is resolved. A previously used ID with a different payload returns `operation_conflict`.

Network interruption after one operation in a batch commits may produce a failed HTTP response for the entire batch. Retrying the batch is safe because the database returns the earlier receipts. Revision conflicts are recomputed internally up to five times; a busy account then returns a retryable HTTP 409. No partially computed profile is committed.

## Security boundaries

All account tables live in an unexposed `accounts_private` schema, with row-level security enabled and no browser-role grants. The `account_read`, `account_receipt`, `account_dependencies`, `account_reject`, `account_commit`, `account_history`, `account_export`, `account_delete`, `account_moderate`, and `account_set_season` RPCs are executable only by the trusted service role. Browser clients cannot submit an arbitrary computed balance or projection.

The gateway uses the shared reducer and validated caller, then a database commit compares the exact profile revision. The same transaction records the result, final run, wallet delta, import receipt, personal best, lifetime score total, and applicable seasonal total. A separate unique `(owner, run_id)` history key protects finalization independently of operation IDs. Profile locks serialize commits; stale revisions must be recomputed.

Accepted and terminally rejected operations are limited to 600 new receipts per account per minute. Requests are limited to 1 MiB, including streamed requests without Content-Length; individual operations are also limited by the reducer. Protect anonymous signup and refresh with Auth's separate rate limits; email sending is rejected by the hook. Credential attempts have durable action/network/handle-or-owner counters, retaining only salted hashes for at most two days of activity. Database RPCs cannot authenticate an operator merely from a client-supplied tester flag.

The original `get_leaderboard` response shape remains compatible. Its visibility filter now honors opt-out, suppression, and deletion. Once an account profile exists, its results must use the trusted operation path; the legacy submit RPC rejects writes from that identity. Legacy guest identities without a profile retain the earlier casual-score behavior.

Guests withdraw or restore their previously published results through `set_guest_leaderboard_visibility(p_visible boolean)`. This authenticated-only RPC derives ownership solely from `auth.uid()`; callers cannot select another identity. It returns effective visibility, which remains false under moderation. A private guest preference hides existing rows from both ranking APIs and blocks legacy submissions. Historical identities without a preference retain their existing visibility. The client persists its desired preference locally when offline and reconciles it before submitting or retrying scores; an offline opt-out takes effect publicly once that request reaches the server. Once an account profile exists, only its account privacy settings govern visibility, and this guest RPC rejects changes. Deletion removes the guest preference and the permanent tombstone prevents recreation.

## Rankings and seasons

Public RPCs:

- `get_account_leaderboard(p_mode, p_difficulty, p_season, p_offset, p_limit, p_around_me)` returns `rank`, `player`, `score`, `is_you`, `public_id`, and `cubie`. Defaults are all-time, offset zero, ten rows, and no around-me window. Around-me uses the caller's authenticated identity and includes nearby positions.
- `get_account_public_profile(p_public_id)` returns the opted-in display name and neutral Cubie, or null for a private/suppressed/deleted profile. It does not reveal history or locked achievements.
- `get_account_seasons()` lists server-configured season windows/rules versions, including archived seasons.

Neutral public Cubies intentionally avoid revealing secret appearance unlocks. Rankings use score descending, original server achievement time, and an internal stable identity. Renaming and equal resubmissions do not change the tie time.

Operators create a season through the service-only `account_set_season` RPC or SQL editor. For example, with the intended UTC dates reviewed:

```sql
select public.account_set_season(
  'winter-2026', 'Winter 2026',
  '2026-12-01 00:00:00+00', '2027-01-01 00:00:00+00', '1'
);
```

Season definitions are immutable. The server records eligible completed results received within the window and matching rules version. Local/imported bests do not create runs or season entries; late offline uploads cannot backdate the receipt. Results can still contribute to private history and eligible all-time casual records.

## Moderation and deletion

An authorized operator can call `account_moderate(owner, true, reason)` to suppress an identity and restrict its new account submissions. `false` restores it. Supply a useful reason including the operator/ticket reference; the database retains the action and time. These functions have no browser role grants. Suppression affects legacy and seasonal boards as well as public profiles. Users can still read/export their private data and request deletion.

Deletion first writes a permanent minimal owner-ID tombstone, hides/deletes private data and scores, then removes the Auth user through the admin API. If Auth removal fails, private data remains removed and the tombstone rejects new writes; retrying deletion completes Auth cleanup. If the final response is lost after Auth removal, the identity can no longer authenticate and its data is already gone. Re-registering creates a different identity.

The tombstone retains an opaque UUID and deletion time to prevent stale-session resurrection, not an email or gameplay history. Account history, wallet records, and receipts remain until account deletion. There is no automatic anonymous-account cleanup or raw-event compaction in this release. Decide anonymous cleanup, operational logs, and backup expiry policy before launch; backup retention is managed by the deployment, not this migration.

## Disable writes safely

Server-side controls accept the string `false` to pause a category:

- `ACCOUNTS_WRITES_ENABLED`
- `ACCOUNTS_IMPORTS_ENABLED`
- `ACCOUNTS_PURCHASES_ENABLED`

Paused commands return HTTP 503 with code `paused`; clients retain pending work rather than treating it as a permanent validation rejection. Reads, export, and deletion remain available. Missing controls default to enabled. Apply frontend feature controls separately for presentation.

If rollback is needed, disable the affected writes and keep the new schema and receipts. Do not run an old whole-save writer against migrated profiles or delete acknowledged wallet/import data. Existing guest play remains local. No down migration is provided because discarding account data is not a safe rollback.

## Validation and release evidence

Local checks cover all migrations in PGlite, identity/account handlers, durable browser/session state, and desktop/mobile account flows. `deno check supabase/functions/accounts/index.ts supabase/functions/identity/index.ts` verifies both entry points.

The hosted scripts use disposable generated identities and cleanup on failure. They verify guest ownership, actual cloud sync/history/settings, public rankings, committed-response loss/retry, overlapping Postgres connections, concurrent spending, refresh/revocation, one-use recovery, password changes and deletion. Browser checks use real Auth/Edge requests at a repository subpath. No hosted credential screenshots, traces, or response payloads are recorded.

Operational release limits remain explicit: no provider backup was listed at inspection, PITR was disabled, no restore rehearsal was performed, and platform request-log retention/moderation ownership still require review before public activation. PostgreSQL Auth audit logging is disabled; this does not erase infrastructure logs. Existing run/wallet storage remains unbounded until deletion. An uncertain recovery can consume its code before password mutation completes; see the authentication contract for the fail-closed limitation. Public Pages account activation and merging are separate review steps.

## Lifetime leaderboard totals

`20261111000000_lifetime_leaderboards.sql` adds exact integer totals alongside personal bests. Account finalization adds each eligible run once inside the existing receipt transaction. Guest clients queue every round with a persistent UUID and call `submit_leaderboard_run`; its owner/run receipt makes retries idempotent. Games and difficulties remain separate, and seasonal totals include only runs received during that season. Public reads retain privacy, moderation, and deletion filters.

Migration reconstructs account totals from retained eligible history, using the larger of that sum or the known legacy best as the opening balance. Guest history was not retained, so only its known best can be preserved. Old clients can still submit best scores through the legacy RPC without lowering totals or repeatedly adding the same best. New clients add every new round, and queued private guest rounds wait for sharing to be enabled.

## Combined game rankings

`20261112000000_combined_leaderboards.sql` introduces `get_game_leaderboard`, with one row per identity per game across all difficulties. Raw totals and personal bests are preserved; both historical and new totals are weighted on every read. Integer quarter-multipliers and PostgreSQL numeric arithmetic avoid floating-point rounding drift. The sum is rounded once to the nearest integer (halves up). Seasons, pagination, nearby rankings, privacy, and deletion filters still apply. Legacy difficulty endpoints remain available to older clients.

| Game | Multipliers, easiest to hardest |
| --- | --- |
| Hangman | Easy ×1, Medium (Normal) ×2.5, Hard ×4 |
| Turtle Dodge | Easy ×1, Normal ×1.75, Chaos ×2.5, Hard ×3.5, Merciless ×4.75, Impossible ×5.5 |
| Boss Crush | Mean ×1, Cruel ×2.25, Nightmare ×3.75, Impossible ×5.75 |
| Pumpkin King | Come On ×1, Baby ×1.75, Coward ×2.5, Impossible Phase 2 ×3.5 |
| Key Rush | ×1 |
| King's Wrath | All practice attacks ×1 |
