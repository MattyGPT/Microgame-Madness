# Accounts backend operation

The browser remains static. Supabase Auth provides email-code sessions, the `accounts` Edge Function validates and reduces operations with the same JavaScript catalogs as the browser, and Postgres commits state, history, wallet entries, and receipts atomically. Public ranking RPCs expose only a display name, score, placement, and opted-in public identifier. These are casual client-reported results, not replay-verified scores.

The repository's backend connection settings are empty by default. Applying this code does not create or configure a Supabase project, send email, apply a production migration, or deploy a function.

## Setup

1. Use a separate test project first. Apply all SQL files in `supabase/migrations/` in filename order, including `20261107000000_accounts.sql`. The migration is additive and preserves legacy scores.
2. Enable anonymous sign-in and email sign-in. Configure email templates to display the code; anonymous conversion uses the email-change confirmation flow, while subsequent sign-in uses the email OTP flow. Configure production SMTP and Auth rate limits before public rollout. Test both flows using the deployed browser origin.
3. From the repository root, deploy with `supabase functions deploy accounts --project-ref YOUR_TEST_PROJECT_REF`. This deploys `supabase/functions/accounts/`. Its imports reference the canonical repository `web/` catalogs and `shared/account-rules.js`; deploy from the repository with those files present. The function has no external SDK dependency. `supabase/config.toml` disables the legacy gateway JWT check because the handler authenticates every non-OPTIONS request through the project's `/auth/v1/user` endpoint before processing it.
4. The function environment needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Supabase supplies these to hosted functions. Never put the service-role key in a browser config, build artifact, export, log, or Git commit.
5. Set `ACCOUNTS_ALLOWED_ORIGINS` to a comma-separated list of exact origins, for example `https://mattygpt.github.io,http://localhost:8770`. Origins have no repository path or trailing slash. If omitted, CORS allows all origins, but every private operation still requires a valid user session. Configure production origins explicitly.
6. Populate the browser's public connection configuration according to the application setup. Connect it only after the account migration and function are ready; empty connection settings leave cloud sign-in disabled. Verify the repository subpath and auth redirect settings where applicable.
7. Run the hosted checks below before wider rollout. GitHub Pages deployment alone does not deploy the function or database.

Provider setup references: [anonymous conversion](https://supabase.com/docs/guides/auth/auth-anonymous), [email codes](https://supabase.com/docs/guides/auth/auth-email-passwordless), and [function authentication](https://supabase.com/docs/guides/functions/auth).

## Private protocol

Send JSON by POST to `/functions/v1/accounts`, using the publishable key as `apikey` and the user's session token as `Authorization: Bearer ...`. Every response has `Cache-Control: no-store`. The authenticated user determines ownership; request-body owner IDs never determine which account is read or changed.

| Action | Request fields | Result |
| --- | --- | --- |
| `snapshot` | None | `state`, `revision`, `public_id` |
| `operations` | `operations`: 1–50 versioned semantic operations | Per-operation receipts plus latest state/revision/public ID |
| `history` | Optional `limit` (1–100), opaque numeric `cursor`, `mode`, `difficulty`, `outcome` | `runs`, `next_cursor` |
| `export` | None | Versioned state, all stored runs, and wallet records; no credentials |
| `delete` | `confirmation: "DELETE"`; sign in again within ten minutes | `deleted: true` after private cleanup and Auth removal |

Operations use `{id,kind,streamId,runId?,version:1,payload,occurredAt?}`. Occurrence timestamps describe private history and achievement dates; server receipt time alone determines seasons. Finite timestamps before 2000 or more than five minutes ahead of the server are normalized to receipt time and marked `timeAdjusted`, so a skewed device clock does not discard otherwise valid earnings. Missing timestamps use receipt time. The reducer also accepts the documented snake-case aliases. Terminal receipt states are `applied`, `duplicate`, or `rejected`; rejections contain `{code,message}`. Operations can declare up to 32 `dependsOn` operation IDs. A missing or rejected dependency returns nonterminal `blocked`; the dependent work remains pending while unrelated work can continue. Valid-envelope semantic rejections are durably remembered. Retry the same immutable operation after transient failures. HTTP 426 with code `unsupported_version` retains the queue until the client/server version mismatch is resolved. A previously used ID with a different payload returns `operation_conflict`.

Network interruption after one operation in a batch commits may produce a failed HTTP response for the entire batch. Retrying the batch is safe because the database returns the earlier receipts. Revision conflicts are recomputed internally up to five times; a busy account then returns a retryable HTTP 409. No partially computed profile is committed.

## Security boundaries

All account tables live in an unexposed `accounts_private` schema, with row-level security enabled and no browser-role grants. The `account_read`, `account_receipt`, `account_dependencies`, `account_reject`, `account_commit`, `account_history`, `account_export`, `account_delete`, `account_moderate`, and `account_set_season` RPCs are executable only by the trusted service role. Browser clients cannot submit an arbitrary computed balance or projection.

The gateway uses the shared reducer and validated caller, then a database commit compares the exact profile revision. The same transaction records the result, final run, wallet delta, import receipt, best score, and applicable seasonal score. A separate unique `(owner, run_id)` history key protects finalization independently of operation IDs. Profile locks serialize commits; stale revisions must be recomputed.

Accepted and terminally rejected operations are limited to 600 new receipts per account per minute. Requests are limited to 1 MiB, including streamed requests without Content-Length; individual operations are also limited by the reducer. Protect anonymous signup and email sending with Auth's separate rate limits. Database RPCs cannot authenticate an operator merely from a client-supplied tester flag.

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

Local checks implemented here:

```sh
node --test web/tests/accounts-database.test.cjs web/tests/accounts-handler.test.cjs
deno check supabase/functions/accounts/index.ts
```

Database tests exercise the actual migrations with browser/service roles, immutable receipts, stale purchase revisions, independent run finalization, history pagination, import restrictions, public visibility, seasons, moderation, and deletion. Handler tests cover token validation, owner forgery, bounded bodies, CAS retry, canonical operation digests, rejection receipts, CORS, and interrupted deletion. The database tests use PGlite; they do not claim to test simultaneous networked Postgres connections. On the development machine, PostgreSQL client tools were available but no server binaries were installed, and access to the Docker daemon was denied; real multi-connection tests remain pending rather than reported as passed.

Before production, use a real test project and two browser contexts to verify email delivery/expiry/resend, anonymous-to-permanent linking, login on another device, refresh/revocation, simultaneous spending, response loss/retry, import recovery, deletion reauthentication, and the deployed repository subpath. Confirm service RPC grants in the hosted environment and verify no private/service keys appear in `dist/`. Test backup restore and assign an operating owner. Local mock/Auth tests are not a substitute for this release gate.
