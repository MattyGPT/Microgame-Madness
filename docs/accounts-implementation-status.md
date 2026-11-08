# Accounts implementation status

Implemented and reviewed locally November 8, 2026. Optional **handle/password accounts are implemented in both the welcome flow and Arcade Profile**, and the backend is deployed to the user-selected project `vikuhlqongfqwqhiwwxv`. Guest play remains complete. The tracked public connection configuration stays empty: this branch does not activate accounts on GitHub Pages and is not merged.

The [authentication contract](accounts-auth-contract.md), [backend runbook](accounts-backend.md), [design](accounts-and-progression-design.md), and [H0–H4 plan](accounts-and-progression-plan.md#november-8-authentication-revision) describe the implementation and review boundary. Original uncommitted design/probe work was retained and incorporated.

## Delivered

- Unique case-insensitive handles with reserved names, password-manager support, accessible visibility controls, confirmation and oversize rejection. No real email, phone or name field; editable public nicknames remain separate.
- Supabase-managed password hashing behind a service-only random `.invalid` identifier mapping; password-required changes/deletion; one-use high-entropy recovery codes with one-time save/download steps. Progress exports never include credentials.
- Transactional handle reservation and credential mutation leases, durable abuse counters, blocked contact signup/email sending/direct credential updates, and active-session checks that reject revoked tokens before JWT expiry.
- Preserved guest UUID, original-save backups, explicit import review, durable operation IDs and isolated account queues. Lost registration responses can retry after Supabase revokes the original guest token: independent password proof must still return the original owner. Reload resumes pending guest import review.
- Existing shared progression, sync retries/receipts, purchases, private history/filters, settings, export, signout, account deletion, casual rankings/public profiles, seasons and moderation remain integrated.
- Project-scoped deployment and hosted verification scripts, reproducible migration checksums, and a local-only connected preview build command.

## Hosted deployment and evidence

Seven migrations are applied in filename order, from `20261101000000_leaderboards.sql` through `20261110000000_handle_accounts.sql`. The deployment ledger records source SHA-256 digests and refuses edited applied migrations. The handle migration digest is `502d80628c9ba742d1a3e4270c66c9c2bae4bf9dcb172b0691fa716770214851`.

At final infrastructure inspection the `identity` function is ACTIVE version **7** and `accounts` ACTIVE version **9**. Supabase increments deployment versions when function secrets change; the identity source fix was initially deployed as version 3. Both functions authenticate their own requests. All tests use this project only and disposable generated identities.

| Check | Result |
| --- | --- |
| Python engine/build suite | 282 passed |
| Full JavaScript suite | 257 passed before the final registration-retry regression additions; affected suites rerun below |
| Final session/identity-handler suites | 47 passed (41 client + 6 identity handler) |
| Final registration/signout browser regression rerun | 4 passed across desktop/mobile after revoked-guest retry fix |
| Deno entry-point checks | Both passed |
| Account/welcome/storage browser suites | 36 passed across desktop/mobile |
| Real hosted API journey | Passed: guest UUID + baseline + earned journal, lost registration and committed-operation response retries, second-device login, history/settings, ranking/profile, export, refresh, password change/recovery/rotation/deletion |
| Real concurrent Postgres connections | Distinct backend PIDs with deliberately overlapping same-revision transactions: one applied, one revision conflict |
| Real concurrent purchases | Only affordable debit applied, balance nonnegative, retries did not charge again |
| Real hosted browser journey | Passed: desktop guest win + welcome registration; isolated mobile login/history/settings/export, recovery, stale-token rejection and password-required deletion at `/Microgame-Madness/` |
| Hostile hosted identity checks | Passed: duplicate handle race, anonymous cloud-save rejection, lost registration response, direct password/contact-update rejection, blocked email paths, concurrent recovery single winner, replay rejection, revoked access/refresh credentials, rate-limit enforcement |
| Pause rehearsal | Imports/purchases paused while normal writes worked; global writes paused while reads/export/deletion worked; all controls restored to enabled |
| Hosted RPC grants | No browser-role execution grants on private account/identity RPCs |

Browser mocks cover deterministic UI behavior; they are not substituted for the separately executed real hosted browser checks. No hosted traces/screenshots or credentials were recorded. Final cleanup inspection found zero Auth users, account profiles and identity mappings. Private-key scans passed across tracked/untracked source candidates and `dist/`; port 8777 was verified to serve this workspace build. Local artifacts use isolated test ports/output directories. A stale browser fixture tried reopening an already modal profile and was corrected; an integration fixture lacked the service role and was updated. The full checks then passed.

Reproduce hosted checks with the scripts named in the runbook. `npm run accounts:build-preview` invokes `python3 scripts/build_web.py` with **only public** connection settings; ignored `dist/` is served at `http://localhost:8777/`. The checked-in `leaderboard-config.json` and GitHub Pages settings remain disabled.

## Decisions and remaining release limits

- Leaderboard sharing and minimal public profiles default on in the existing welcome flow, with separate controls; saved explicit choices are preserved. This is the prior accepted override to the original opt-in design. Public profiles expose only nickname and a neutral Cubie, without history or secret unlocks.
- These are casual client-reported scores. Transactional integrity is tested; competitive anti-cheat/replay verification is not claimed.
- The initial guest baseline may bring legacy Cash/purchases once. Later imports bring eligible records/unlocks, without extra Cash/counters/streaks. Merging an established account with a new-format guest economy remains deferred; its guest save stays separate.
- Recovery spans Postgres and Auth. A code is consumed before password mutation. If a successful mutation response is lost, sign in with the chosen replacement password and generate another recovery code. If the provider mutation failed after consumption and the original password is also lost, operator investigation may be necessary. There is no contact-based or progress-export bypass.
- The credential trigger depends on provider transaction behavior. Current hosted flows pass. Rehearse Auth upgrades/password-hash re-encryption changes: an unanticipated provider rehash may be rejected by the guard. Unsupported OAuth, phone authentication, phone MFA and TOTP MFA enrollment are disabled for this release.
- **Public activation still needs operating review:** inspection listed zero available backups and PITR disabled; no restore rehearsal was performed. An operating/moderation owner, capacity/retention decisions, and provider infrastructure-log retention need confirmation. PostgreSQL Auth audit logging is disabled; this is not a claim that infrastructure request/IP logs are absent.
- Account history, wallet records and receipts grow until deletion; no automatic anonymous cleanup or raw-event compaction ships. Abuse counters retain salted hashes and prune expired buckets when requests arrive. Tombstones retain opaque deleted owner IDs to prevent resurrection.
- Public Pages account activation and PR merge remain explicit review steps. Backend deployment alone has not launched public accounts.

## Historical pre-implementation evidence

The targeted account client, UI adapter, handler, integration and database suites passed: **46 tests**, using `node --test web/tests/accounts-client.test.cjs web/tests/accounts-app.test.cjs web/tests/accounts-handler.test.cjs web/tests/accounts-integration.test.cjs web/tests/accounts-database.test.cjs`. These validate the existing email-based implementation and save foundation, not the proposed handle/password flow. The provider-probe suite adds **4 passing local tests** for destination checks, cleanup, redaction and the success path.

## Historical hosted provider proof

The user selected `vikuhlqongfqwqhiwwxv` as an empty project intended for production and supplied credentials through the ignored local environment file. The initial probe failed with `anonymous_provider_disabled`; the user enabled anonymous sign-in. The subsequent run of `scripts/probe_supabase_auth.mjs` completed successfully:

- Created a disposable anonymous Auth user.
- Assigned a generated `.invalid` identifier and password through Auth administration; password login retained the original UUID and returned a permanent account.
- Refreshed the session without changing ownership and rejected an incorrect password.
- Replaced the password, accepted the replacement and rejected the old password.
- Globally signed out and verified that refresh credentials from both tested sessions were rejected.
- Deleted the disposable Auth user and verified it was no longer retrievable.

No game database migrations, Edge Functions or public browser configuration were deployed by this check. Access-token expiry/revocation, real-address bypass restrictions, handle uniqueness, abuse controls, one-use recovery and actual saved-progress integration remain open H0–H4 work. Project-management access is needed for infrastructure deployment and configuration inspection; a service-role key alone does not provide it.

## Original implementation-session handoff (preserved)

The ignored, owner-readable `.env.supabase` now contains `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ACCESS_TOKEN`. Do not display or commit their values or include administrative keys in browser builds. The management token was verified with successful project, Auth configuration and Edge Function listing requests. The selected project reported `ACTIVE_HEALTHY`; the latest function listing was empty. Scope all management operations to `vikuhlqongfqwqhiwwxv`, even though the user supplied a full-access token after the dashboard did not offer scoped creation. Recheck current state before deploying. The Supabase GitHub connection alone has not activated accounts in the game.

The user has requested implementation, not further planning alone. Finish H0–H4, reusing the save foundation. Deliver optional handle/password accounts, recovery, guest preservation, history/settings/leaderboard integration, deployment automation and end-to-end evidence. Do not activate the existing email UI as an interim solution. Keep the production browser configuration disabled until the revised backend and client pass the release checks. Preserve the uncommitted documentation revisions and provider probe files already in this checkout. Follow `AGENTS.md`: rebuild with `python3 scripts/build_web.py` and serve this workspace's `dist` at port 8777 for the user preview; tests use separate ports.
