# Accounts and progression implementation plan

Status: Handle/password implementation and hosted backend deployed; public rollout pending review
Date: November 8, 2026
Design: [Optional accounts and progression](accounts-and-progression-design.md)

See [implementation status](accounts-implementation-status.md) for delivered scope, decisions, and remaining launch gates. The packages below retain the original review and acceptance checklist.

Build optional accounts and dependable saves first, then expand personal history and rankings. Keep guest play available throughout. The first integration milestone is a real guest-to-account journey: play a round, retain progress through a retry, sign in on another device, and see the same acknowledged progress.

This plan uses the design's recommended defaults as planning assumptions. It does not mark unresolved decisions approved. Design IDs `D01`–`D18` and acceptance IDs `A01`–`A30` refer to the specification. Gate G0 resolves the foundation decisions before implementation work depends on them. Future challenge and social features remain design work, not silently added first-release scope.

## November 8 authentication revision

The user has replaced email codes with handles and passwords and does not want real email addresses, phone numbers or real names collected. The auth client, welcome wizard and profile dialog now use handles and passwords. The packages below describe the implemented work; see the evidence and remaining operating gates in the implementation status. Existing save ownership, reducers, transactions, outbox, history and leaderboards should be reused.

| Package | Change | Required evidence |
| --- | --- | --- |
| H0 — provider proof and contract | Choose a maintained username/password provider or validate a Supabase handle adapter using opaque synthetic provider identifiers. Specify session claims, password policy, recovery-code contract, handle normalization, abuse limits and provider log retention. Real-address fallback and outbound auth mail are prohibited. | Test-project proof of registration, anonymous conversion, login, refresh, password reset, revocation and deletion; no contact details requested or transmitted |
| H1 — identity backend | Add unique canonical handles mapped to stable owner IDs, transactional reservation/conversion, rate-limited credential endpoints, one-use recovery verifiers, password reauthentication and session revocation. Keep password hashing with the selected auth implementation. | Concurrent duplicate handles, interrupted registration, generic login failures, recovery replay, deletion and authorization tests |
| H2 — session adapter | Replace `requestCode`/`verifyCode` with register/login/change-password/recover operations; retain async-generation fences, owner isolation, logout and refresh behavior. Remove collected-email fields from cached session projections. | Another-device login, stale responses, tab races, offline queues and existing guest/account ownership tests |
| H3 — both account UIs | Replace email and code forms in `web/accounts/app.js` and `web/accounts/welcome.js`. Add handle/password fields, accessible password visibility controls, password-manager support and a recovery-code save step. Keep guest play optional and complete. | Desktop/mobile/keyboard flows; no email prompts, email autocomplete, email resend controls, or misleading recovery promises |
| H4 — integration and release | Update Auth fixtures, browser tests, privacy copy, the runbook and status report. Exercise actual hosted auth and separate Postgres connections. Inspect configured email providers/hooks and request logging for bypasses or unwanted collection. | Guest progress retained, cloud sync on another device, recovery and deletion verified, no credentials in exports/logs, no real-address signup path, release evidence recorded |

H0 freezes the contract before dependent code changes. H1 and H2 can use separate ownership boundaries after H0; H3 follows the session contract; H4 integrates the complete flow. The previous P04/P07 email acceptance criteria are superseded. The detailed historical work packages remain useful for the save/backend foundation. Recovery codes are the recommended no-contact recovery mechanism and their UX remains reviewable.

## Deliverables and planning assumptions

| Release | Deliverable | Boundary |
| --- | --- | --- |
| R1 | Optional handle/password accounts, cloud progression/settings, transactional wallet, guest migration, minimal recent history, export/delete, existing casual rankings with participation controls | No seasons, friend system, replay verification, or new Singularity leaderboard |
| R2 | Filtered history, personal statistics, pagination/nearby rank, opt-in profiles, seasons, richer moderation tools | No cross-game score aggregation or implied anti-cheat guarantee |
| R3 | Separate reviewed designs for daily challenges, friends, showcases, or replay validation | No implementation assignment until each design is approved |

Apply these assumptions consistently across work packages:

- **D01–D03 and D12:** handle/password with no contact-detail collection; optional guest/account ranking publication; unique login handles, editable display nicknames and opaque public identifiers; private history and profiles by default.
- **D04–D05:** one initial legacy baseline, closed after onboarding; later legacy imports can add permitted personal bests/unlocks but cannot add balances, cumulative counters, or streaks. Imported entitlements have casual provenance and confer no privileged role.
- **D06:** account purchases require a connection and acknowledged balance. Guests retain local purchases; account earnings can queue offline.
- **D07:** unfinished streaks stay within a tab's ordered stream and survive reloads. Earned achievements sync. Tabs have distinct streams, including when Duplicate Tab copies sessionStorage; streams never concatenate.
- **D08:** time credit must not multiply across tabs/devices. G0 must resolve offline clock handling and interval overlap; no subagent invents a competing rule.
- **D09–D10:** separate Arcade codes input; explicit handling of pending work during sign-out, with owner-isolated storage.
- **D11:** include a basic recent-results list in R1, with full filtering/statistics in R2. Record results from the start.
- **D13 and D17:** decide retention, service targets, backup recovery, and operating ownership before production launch. Do not choose an infrastructure plan from an assumed free-tier allowance.
- **D14–D15:** preserve deterministic score/tie ordering; seasonal submission closes on server time; all initial boards are casual.
- **D16 and D18:** defer social features and automatic merging of new-format guest economies into established accounts. Keep such guest profiles separate and recoverable.

R1 must preserve new-format progress when its current guest creates a new account. Deferring an existing-account merge does not permit losing that guest's journal, wallet, or recent history. Convert ownership through an explicit, acknowledged mapping and preserve operation IDs.

## Technical approach

### Keep the existing game and hosting model

Retain the Python game rules, Pyodide browser runtime, static GitHub Pages site, and Python build script. Add focused modules around the existing JavaScript application. Do not combine the account feature with a frontend framework rewrite or broad renderer changes.

The current build allowlists browser assets in `scripts/build_web.py`; new modules and SDK assets need deliberate packaging. Choose and pin a reproducible Supabase client distribution in G0. Update local commands, CI, and Pages consistently if that choice adds a build dependency. No unversioned runtime SDK downloads. Package shared module imports with a consistent version strategy so a stale entry point cannot load incompatible new modules.

### Share progression rules and keep commits transactional

Extract portable progression/reward rules into shared JavaScript modules consumable by the browser, Node tests, and the trusted backend handler. Preserve the current public wrappers in `web/achievements.js` and `web/shop.js` where useful to reduce integration churn. Use fixtures captured from current behavior to prove parity before switching writes.

Use authenticated backend commands for state changes, Postgres for durable data and atomic commits, and explicit read endpoints/projections for private account data and public rankings. Proposed implementation: a Supabase function validates the caller and operation, reads the current revision, runs the shared reducer, and invokes a restricted database commit function. SQL handles receipts, uniqueness, revision checks, wallet/inventory consistency, and all-or-nothing updates. Purchases use a trusted catalog and transactional balance check.

If computation occurs outside the transaction, commit must compare the exact revision read by the handler. On a conflict, reload and recompute the entire affected change. Never apply a stale projection with a fresh wallet debit. Use one commit boundary per operation; a network batch can contain independently acknowledged operations with explicit dependency ordering.

The trusted commit function must not be executable by browser roles with arbitrary computed state. Privileged clients bypassing row-level security require explicit owner checks at every read and write. Derive ownership from the validated session, not a request-body owner field. Keep ordinary public/private reads protected separately. Supabase documents [database functions and privileges](https://supabase.com/docs/guides/database/functions) and [function authentication](https://supabase.com/docs/guides/functions/auth); G0 pins the exact supported APIs and configuration for the target environment.

### Use durable local state

Use IndexedDB for guest/account state, history, import backups, and pending operations. Commit a local state change and its outbox operation in the same transaction. Keep session credentials in the auth client's supported storage; do not include them in exports, migration manifests, or diagnostic logs.

Maintain separate confirmed state and pending operations. Rebuild optimistic state by applying remaining pending operations over the latest confirmed projection after an acknowledgement or rejection. Replacing confirmed state must not erase other pending rewards or count them twice.

## Shared contracts to freeze

G0/G1 produce a small contract document and executable fixtures. Freeze field meanings and behavior before assigning dependent modules; exact filenames below are proposed ownership boundaries, not existing files.

| Contract | Required content |
| --- | --- |
| Session context | Profile kind, stable local owner key, authenticated owner when available, session generation, auth/refresh status; guest binding and sign-out transitions |
| Operation envelope | Schema version, operation ID, immutable owner binding, stream ID/sequence, operation kind, dependencies, optional run ID, payload, relevant rules versions |
| Acknowledgement | Applied/duplicate/rejected/conflict status, operation ID, stable error code, authoritative revision and receipt, retry classification; duplicate returns original result |
| Run lifecycle | Start/checkpoint/final outcome; checkpoint high-water marks; allowed outcomes, eligibility, interruption recovery, rules-version selection |
| Progress rules | Current-mode inventory, secrets/music/Cubie/time events, streak order, achievement conditions, point retiering, reward units and limits |
| Local store | Atomic append, pending listing, acknowledgement/rebase, owner switching, export, quota failures, legacy migration marker, multi-tab behavior |
| Preferences | Typed fields, default values, local overrides, base revisions, conflict replies; accessibility always respected |
| Purchase | Stable request ID, catalog version/item ID; server price, balance check, ownership, receipt; pending credits cannot be spent |
| Import | Preview manifest, immutable source lineage and cutoff, destination, chosen categories/nicknames, payload digest, receipt, retry and source-lock behavior |
| Reads | Private snapshot and paged history; public ranking/profile allowlists, suppression/participation filters, stable cursor shape |
| Versions | Storage, protocol, game/scoring, rewards, catalog; supported old-client window and unsupported-version responses |
| Deletion | Recent-auth requirement, deletion intent, write fencing, resumable cleanup, session revocation, terminal client state |

Every operation ID must retain the same payload on retry. Stream sequencing is an ordering aid, not authentication. Authoritative receipts and import lineage must survive data compaction sufficiently to reject replay. Define how a rejected operation advances or blocks its stream so unrelated operations do not stall indefinitely.

## Subagent execution model

Use one coordinator/integrator and up to three implementation subagents concurrently. The coordinator maintains the dependency graph, reviews contract changes, owns shared integration files, and performs the cross-component checks. Each subagent receives one bounded package at a time, with its dependencies already satisfied.

Prefer separate worktrees when simultaneous work would touch shared files. In a shared checkout, enforce exclusive file ownership and do not revert another agent's changes. Reserve migration filenames centrally so two packages cannot choose the same order. Commit or otherwise capture the pre-existing work before a future implementation run; this documentation change does not create those checkpoints automatically.

| Lane | Exclusive implementation surface | Coordinator-owned integration |
| --- | --- | --- |
| Backend | Reserved new SQL migrations, `supabase/functions/`, backend tests | Migration ordering, production configuration, rollout |
| State and identity | `web/accounts/session.*`, `store.*`, `sync.*`, `migration.*`, their isolated tests | Hooks in `web/app.js`, legacy leaderboard auth replacement |
| Rules and UI | First shared rules/adapters, then profile/history UI after handoff | Existing catalogs/wrappers, `web/index.html`, `web/style.css`, shared event wiring |
| Coordinator | Contract fixtures initially; `web/app.js`, `web/leaderboards.js`, shared wrappers, HTML/CSS, build/package/CI files, documentation | Final integration and release gates |

Use dedicated styles such as `web/accounts/profile.css` to keep UI work independent. Backend packages and UI packages on the same lane execute sequentially unless their precise file ownership is split in the task prompt. Tests shared by multiple packages have a named owner; adding assertions is still a file edit.

Each task handoff must state:

1. Package ID, objective, prerequisite commits/contracts, and acceptance IDs.
2. Owned files and prohibited shared-file edits; proposed new dependencies go to the coordinator.
3. Required fixtures, command interfaces, and explicit non-goals.
4. Focused validation commands and expected failure cases.
5. Completion evidence: changed files, tests and results, migration effects, known gaps, and requested integration edits.

A task is not complete when its isolated tests pass if it changes an unintegrated contract. The coordinator integrates, runs the relevant cross-component scenario, and only then releases dependent tasks. If a worker discovers a design ambiguity, pause that dependent change, document a proposed resolution, and continue only independent assigned work.

## Dependency schedule

| Wave | Packages | Parallelism and gate |
| --- | --- | --- |
| 0 | P00 baseline/environment review, P01 contracts and rule extraction | Sequential; G0 decisions precede G1 contract freeze |
| 1 | P02 local store, P03 backend foundation, P04 session adapter | Up to three workers using frozen fixtures |
| 2 | P05 sync coordinator, P06 game adapters, P07 account/profile UI | Up to three workers; prerequisites must be integrated |
| 3 | Coordinator integrates a Hangman result, retry, account conversion, and second-device read | G2 proves a narrow end-to-end path before broad UI work is accepted |
| 4 | P08 migration, P09 purchases/preferences, P10 export/deletion | Backend/shared files assigned in sequence; separate worker surfaces may overlap |
| 5 | P11 all-mode integration, P12 fault/concurrency/security verification | Independent test authors can work alongside integration; G3 closes R1 |
| 6 | P13 history/statistics, P14 rankings/profiles, P15 seasons/moderation | P13/P14 parallel where contracts permit; P15 follows P14; G4 closes R2 |
| 7 | P16 environment rehearsal and rollout | R1 and R2 each require their own staged rollout gate G5 |

G2 uses a new-format guest with no legacy baseline to keep the first path narrow. P08 then proves legacy preservation before any R1 launch. P09's polish must not delay basic wallet credit correctness needed for G2. P12 adversarial fixtures should begin as soon as the relevant modules exist, not wait for every screen to be finished.

## Work packages

### P00 Baseline and environment review

**Owner:** coordinator. **Dependencies:** design and this plan. **Scope:** foundation decisions, environment inventory, baseline evidence.

- Record the accepted or amended D01–D12/D18 decisions, including the deferred merge policy. For D08, produce executable examples for duplicate intervals, clock rollback, skewed devices, offline intervals, and the existing time cap. For D07, define per-tab streams and interrupted-run recovery without concatenating concurrent streaks.
- Inventory all writes in `web/app.js`, achievement observers, shop purchases, secret entry, and leaderboard queues. List every supported mode/difficulty and existing exclusions; include King's Wrath, Core practice, Key Rush exit, and mid-run counters.
- Audit configured backend migrations, auth settings, public keys, session shape, and existing rows in the intended test environment. Do not log production tokens or private payloads. If hosted access is unavailable, mark the hosted release gate pending while local development proceeds.
- Run existing checks and record pre-existing failures separately. Freeze representative anonymized/synthetic legacy saves and gameplay traces for parity tests.
- Select SDK packaging and backend runtime versions; define flags for account UI, new writes, imports, purchases, and ranking changes. Identify configuration required for GitHub Pages' repository subpath.

**Exit G0:** decisions affecting contracts are recorded; environment limitations and baseline failures are known; packaging and source ownership are settled. No migration is applied to production by this package.

### P01 Contracts and shared progression rules

**Owner:** coordinator with a rules worker. **Dependencies:** P00. **Owns:** proposed `shared/progression/`, contract fixtures, `docs/accounts-api-contracts.md`; coordinator updates existing wrappers/build hooks.

- Implement the frozen envelopes, validation/error taxonomy, and a pure reducer over versioned state and semantic events.
- Extract reward rates, integer arithmetic, achievement catalog/rules, entitlements, and item prices without duplicating independently maintained business rules. Keep rendering and browser globals out of shared modules.
- Model checkpoint high-water marks, finalization, and independent final reward deduplication. Include non-game events and reviewed time/streak semantics.
- Compare reducer outputs with existing achievement/shop behavior over representative traces, including imported unlocks and retiering. A historical unlock must not fire a new celebration.
- Define deterministic fixtures for duplicate/reordered delivery, rejected operations, preference conflicts, legacy manifests, and private/public views.

**Exit G1:** shared rules match the existing game where design has not explicitly changed behavior; contract fixtures run in the selected runtimes. **Acceptance:** A07–A08, A13–A14, A25, A27, A29.

### P02 Local store and durable outbox

**Owner:** state worker. **Dependencies:** P01. **Owns:** `web/accounts/store.*`, local schema/version utilities, store tests.

- Create IndexedDB stores for owner-scoped confirmed state, pending operations, recent history, backups/import metadata, and installation/stream data.
- Implement transactional local mutation/outbox append, receipt acknowledgement, optimistic rebase, pending retention, and multi-tab notifications after commit.
- Add revision guards and tests for two tabs writing simultaneously. Make schema upgrade blocking visible to old tabs and preserve original localStorage data.
- Provide memory-only fallback with truthful status on denied/unavailable storage. Handle quota exhaustion without deleting pending records.

**Exit:** restart after each transaction boundary preserves either the old state or the complete new mutation plus queue. **Acceptance:** A02, A11–A12, A16, A18, A24, A28.

### P03 Backend schema and atomic commands

**Owner:** backend worker. **Dependencies:** P01. **Owns:** reserved additive migrations, trusted command handlers, backend tests.

- Add profile/preferences, streams, runs/checkpoints, progress projection, wallet/inventory, operation/import receipts, visibility, and version metadata. Preserve existing leaderboard rows and stable tie times.
- Add a single atomic commit path with operation digest checks and revision comparison. Enforce one final result and one earning per eligible run independently of request IDs.
- Provide the minimal new-format guest-to-new-account binding needed by G2: preserve the guest's operation IDs, establish a single owner mapping, and deduplicate any already-accepted anonymous results. Legacy snapshot imports and transfers into existing accounts remain P08 work.
- Authenticate commands, enforce account/guest eligibility, validate shared schemas, and invoke the trusted reducer. Keep computed projections and privileged functions inaccessible to browser writes.
- Supply bounded private snapshot/history reads and protected public projections. Ensure both old and new ranking endpoints honor visibility/deletion/moderation fences.
- Add catalog-driven purchase transaction support, even before the UI switches to it. Add deletion/write-fence fields needed later rather than allowing P10 to invent another status model.
- Extend PGlite auth fixtures for the new claims/columns; retain separate tests against real Postgres/Supabase for locking and role behavior.

**Exit:** duplicate results, forged owners, illegal direct writes, and two competing purchases have tested outcomes. **Acceptance:** A07–A10, A12–A13, A21–A22, A27.

### P04 Shared session adapter

**Owner:** identity worker. **Dependencies:** P01. **Owns:** `web/accounts/session.*`, SDK adapter, session tests; coordinator owns package/build edits and leaderboard wiring.

- Implement guest, anonymous-authenticated, permanent-account, refresh-required, and signed-out states, with generation checks for late async responses.
- Adopt the old leaderboard session only through a supported, validated path. Preserve its user ID and pending queue; failed refresh must not silently create a replacement.
- Implement handle/password registration/login, recovery, and same-identity anonymous upgrade or reviewed ownership transfer. Distinguish handle reservation conflicts from signing into an existing account. Follow the auth revision packages below.
- Coordinate new-account binding with the store and backend so local-only guest operations acquire their authenticated owner once through the explicit mapping. Preserve their original lineage; do not relabel operations at transmission time or discard them at sign-in.
- Expose one auth authority to sync and leaderboards. Explicit guest leaderboard opt-in can create an anonymous identity; merely browsing rankings does not.
- Cover resend/expiry/error behavior and cancellation without losing the guest save. SDK event callbacks must not create reentrant sign-in/refresh loops.

**Exit:** session contract passes local tests and the first hosted sign-in/linking exercise where credentials are available. **Acceptance:** A03, A16–A17, A26. Hosted verification remains mandatory for release.

### P05 Sync coordinator

**Owner:** state worker after P02. **Dependencies:** P02–P04. **Owns:** `web/accounts/sync.*`, transport adapter and fault-injection tests.

- Flush immutable owner-bound operations in bounded dependency-aware batches; use stable IDs through timeouts and retries.
- Apply acknowledgements, recompute optimistic state over remaining operations, and expose save-status transitions. Handle rejection, revision conflict, auth expiry, network errors, and unsupported schemas distinctly.
- Reconcile on reconnect/focus/refresh; prevent duplicate active flush loops and stop safely on sign-out/deletion.
- Never block gameplay for network activity. Backoff can be interrupted by restored connectivity without starting competing submissions.

**Exit:** server commit followed by lost response survives reload and converges exactly once; later pending work remains intact. **Acceptance:** A02, A07–A08, A11–A12, A15–A18, A24.

### P06 Game and arcade event adapters

**Owner:** rules worker. **Dependencies:** P01–P02. **Owns:** `web/accounts/progress-adapter.*`, lifecycle fixtures/tests; coordinator integrates `web/app.js` and existing trackers.

- Allocate run IDs at start and convert snapshots into semantic events rather than sending frames. Capture mid-run checkpoint increases without double-counting final results.
- Preserve completed/exit/interrupted outcomes and the full eligibility matrix. Include page-time, pet, music, secret, hint, healing, and death events where applicable.
- Implement local guest operation recording and the same reducer used by account optimistic state. Define recovery for a run whose start was persisted but finalization was not.
- Move secret dispatch behind an explicit Arcade codes action while keeping existing effects and revising discovery hints/tests coherently.

**Exit:** replay fixtures produce matching progress for every mode and special path; no network request occurs in the frame loop. **Acceptance:** A01, A13–A14, A25, A29.

### P07 Account UI and minimal history

**Owner:** UI worker. **Dependencies:** P01 interfaces; P02/P04/P05 for integrated completion. **Owns:** `web/accounts/profile-ui.*`, dedicated CSS, isolated UI tests; coordinator edits main HTML/styles.

- Add profile entry point, guest/save-progress/sign-in flows, handle/password and recovery UI, save states, current appearance, basic recent results, and privacy/participation settings.
- Show confirmed versus pending Cash distinctly. Surface preference conflicts and local storage limitations with specific recovery actions.
- Design imports and export/delete entry points around P08/P10 interfaces; keep unavailable functionality hidden or explicitly disabled until integrated.
- Support keyboard focus restoration, status announcements without repeated chatter, mobile width, reduced motion, and mode-specific pause/defer behavior.

**Exit:** usable account flow against real adapters, not just mocked screens. **Acceptance:** A03, A15–A17, A24, A26, A30.

### G2 Early end-to-end integration

The coordinator combines P02–P07 behind disabled-by-default release controls. Use an isolated test backend to play Hangman as a guest, create a new account preserving its identity/journal, submit the result, lose a response, reload, and sign in from a separate browser context. Confirm one result/reward and matching settings/progress. Repeat while offline after the game loads, then reconnect.

Do not expand the rollout until this path works. If hosted credentials are unavailable, complete the local integrated path and record G2's hosted portion as pending; mocks alone do not close it.

### P08 Legacy migration and guest conversion

**Owner:** state worker, with separately assigned backend support. **Dependencies:** G2 and P03 receipt/transfer contracts. **Owns:** `web/accounts/migration.*`, migration fixtures/tests; backend worker owns reserved import routines.

- Read and validate the legacy profile without overwriting it. Preview chosen score names and indivisible shared wallet/achievement categories, with an exportable backup and digest.
- Establish a migration cutoff between baseline snapshot and queued events. Apply one opening balance, permitted unlocks, counters, and personal bests atomically; close the baseline opportunity after onboarding even if declined.
- Preserve legacy cloud identities/bests and process old highest-score queues without inventing runs or issuing rewards.
- For a new-format guest creating a new account, preserve source operation IDs and journal lineage through ownership binding. Do not seed from a snapshot and replay the same earnings again.
- For an existing account, enforce the limited legacy import policy. Keep full new-format guest economies separate under D18. Any cloud source transfer requires proof of both identities and a destination-bound, single-use authorization.
- Add stale-tab fencing so the old localStorage writer cannot overwrite the new store, and preserve access to the legacy archive.

**Exit:** interrupted conversion/import resumes safely before/after commit, with no duplicate baseline, missing purchases, or unintended public records. **Acceptance:** A03–A06, A16–A18, A20, A25, A28.

### P09 Purchases and settings across devices

**Owner:** UI/state worker with backend tests assigned separately. **Dependencies:** P03, P05–P07; P08 for legacy-wallet scenarios. **Owns:** account purchase/preferences adapters and tests; coordinator wires shop and sound controls.

- Switch account purchases to trusted transactions; retain local guest purchase behavior. Use a stable request ID until a terminal result is known.
- Make acknowledged balance spendable and pending rewards visible. Equip only owned items and apply ownership updates without duplicate notifications.
- Implement per-field preference revisions and explicit conflict resolution. Keep sound device overrides and operating-system reduced motion authoritative.
- Verify two-device spending with real database transactions and lost responses; do not treat a sequential unit test as a concurrency test.

**Exit:** no double debit, negative balance, lost independent preference, or forced inaccessible animation. **Acceptance:** A09–A11, A15, A25, A27, A30.

### P10 Export, sign-out, and deletion

**Owner:** backend worker plus bounded UI/state follow-up. **Dependencies:** P03–P05, P07–P08. **Owns:** lifecycle handlers, export module, lifecycle tests; no concurrent edits to files owned by P08/P09.

- Export a versioned private archive without credentials; restoration follows migration rules and cannot create a new opening balance.
- Offer sync-or-retain handling for pending work at sign-out, clear ordinary synced account caches, and restore a separate guest profile. Explicit removal explains pending-data loss.
- Implement recent-auth deletion, durable intent/write fence, immediate public suppression, auth revocation, and resumable cleanup. Retry safely if auth deletion succeeds before all cleanup completes or vice versa.
- Reject late writes and prevent automatic account-data recreation. Capture backup expiry and deletion behavior in the operating guide.

**Exit:** account switches, sign-out, export/restore, and interrupted deletion satisfy private-data isolation. **Acceptance:** A16–A18, A21–A23, A28.

### P11 Integrate every game and compatibility path

**Owner:** coordinator. **Dependencies:** P06–P10. **Owns:** shared application wiring, existing wrappers, packaging, versioned config, documentation.

- Replace scattered whole-profile writes with the new store/adapters, and remove competing reward/session authorities. Keep existing renderer and Python rule behavior intact.
- Run the mode inventory against every full game, each Wrath attack/Random Order, Core practice and finale replay, Key Rush exit, secrets, jukebox rewards, and one-time hints.
- Preserve old scores/achievements and test mixed old/new browser builds. Old RPCs must not bypass opted-out publication or deletion fences.
- Package only allowed public assets; keep server code, credentials, tests, personal saves, and exports out of `dist/`. Update build/check workflows and concise setup documentation.

**Exit:** every progression source has an accountable write path, no duplicated handler, and regression coverage. **Acceptance:** A01–A03, A13–A14, A18, A22, A25–A27, A29–A30.

### P12 Fault, concurrency, and security verification

**Owner:** verification worker without implementation ownership for the surface under review. **Dependencies:** begin after P03/P05; complete after P11. **Owns:** dedicated adversarial/browser tests and a traceable verification report.

- Exercise commit-before-response failures, reconnect/reload, duplicate IDs with altered content, malformed/oversized operations, stream gaps, stale revisions, quota errors, and account switches during requests.
- Use separate contexts for two devices and separate tabs for one device. Cover pending operations while another device changes equipment, preferences, or wallet state.
- Test anonymous/permanent users, other owners, direct table access, privileged commit function grants, guessed public IDs, old endpoints, hidden spoilers, and moderated entries.
- Verify supported browser persistence/session behavior, mobile layouts, focus, audio activation, reduced motion, and pause rules. Record any browser support limitations.
- Reconcile every applicable acceptance ID with a passing check or a specific blocked release gate; do not replace integration evidence with mocked success.

**Exit G3:** R1 acceptance coverage closes except explicitly R2-specific behavior. No unresolved data-loss, double-spend, cross-account access, or migration defect. P16 must still close the production rollout gate.

### P13 History and personal statistics

**Owner:** UI worker with read-endpoint support. **Dependencies:** G3. **Owns:** history UI/read modules and related tests; backend changes use a separately reserved package.

- Add paged filters for game, difficulty, outcome, and time; distinguish interrupted/practice activity and imported bests from completed games.
- Show personal bests and progress charts only across comparable rulesets/metrics. Do not invent old dates or round histories.
- Define stable pagination under newly arriving results and representative volume targets. Test query plans/indexes and UI rendering with production-shaped synthetic data.

**Exit:** R1 history is fully browsable without privacy or version-comparison errors. **Acceptance:** A19–A21, A26–A28 as applicable.

### P14 Expanded rankings and public profiles

**Owner:** backend/rankings worker with later UI handoff. **Dependencies:** G3; read contracts may be shared with P13. **Owns:** reserved ranking migrations, ranking client/UI modules and tests; coordinator integrates legacy entry points.

- Add top-page, cursor, and around-me reads with consistent filters. Derive display names/current permitted appearance from the profile while retaining stable tie timestamps.
- Publish opted-in profile sections through an allowlist; hide private history, auth identifiers, and spoilers. Use a neutral avatar where required.
- Make opt-out and moderation effective across every board, pagination path, profile route, and legacy RPC. Define read consistency when entries change during pagination.

**Exit:** users outside top ten see accurate personal placement and no visibility bypass. **Acceptance:** A19, A21–A22, A26.

### P15 Seasons and moderation workflow

**Owner:** backend worker, then UI worker. **Dependencies:** P14 and reviewed D14/D15/D17. **Owns:** season definitions/queries, operator tools, audit tests, season UI.

- Add board identity by mode/difficulty, ruleset, season, and trust category; preserve legacy all-time records separately where needed.
- Enforce server receipt deadlines, allowed outcomes, and rulesets. Late uploads retain eligible private/all-time effects without becoming seasonal records.
- Provide authorized operators with suppress-name/entry, restrict-submission, and receipt-inspection operations. Audit actions; browser flags never grant these roles.
- Label rankings as casual. Keep future replay-validated categories unavailable until their separate validation design is implemented.

**Exit G4:** R2 acceptance, publication, tie, deadline, and suppression rules pass integrated checks. **Acceptance:** A19–A22, A27.

### P16 Rehearsal, rollout, and recovery

**Owner:** coordinator/operator. **Dependencies:** G3 for R1 or G4 for R2; D13/D17 resolved. **Owns:** deployment/runbook and environment changes within the eventual authorized rollout scope.

- Rehearse additive migrations on an isolated environment with representative legacy rows, including backup restoration. Verify hosted registration, login, recovery-code expiry/replay policy, session adoption, account conversion, reauthentication, and revocation.
- Test the actual packaged site under the repository subpath with allowed auth redirect URLs. Confirm that static-site deployment and backend deployment are separate controlled steps.
- Deploy compatible backend support first, then disabled frontend flags, then enable for test accounts and a limited cohort. Observe pending queue age, rejection/import rates, purchase conflicts, and auth errors against agreed thresholds.
- Define rollback actions per flag. Keep accepted wallet/import transactions and new-format records; disable unsafe mutations without reverting to an old whole-save writer. Test a mixed-client period explicitly.
- Record retention jobs, backup expiry, deletion completion, moderation access, support/recovery instructions, and operational ownership. Monitor usage before increasing cohorts.

**Exit G5:** hosted checks and recovery rehearsal pass, the operating owner accepts the runbook, and staged behavior meets the agreed targets. Release approval concerns the concrete built artifact and reviewed migrations; this plan itself does not deploy them.

## Acceptance coverage

The following map prevents criteria from disappearing between agent handoffs. Detailed test names belong in the implementation verification report.

| Acceptance IDs | Primary packages | Required release |
| --- | --- | --- |
| A01–A03 | P04–P07, P08, P11, P12 | R1 |
| A04–A06 | P08, P12 | R1 |
| A07–A08 | P01, P03, P05, P12 | R1 |
| A09–A11 | P03, P05, P09, P12 | R1 |
| A12–A14 | P01–P03, P05–P06, P11–P12 | R1 |
| A15–A18 | P02, P04–P05, P08–P12 | R1 |
| A19 | P14–P15 | R2 |
| A20 | P08 import restrictions; P15 seasonal deadlines | R1 restrictions, R2 full scenario |
| A21–A22 | P03, P10–P12; P14–P15 for new public surfaces | R1 baseline, R2 expanded surfaces |
| A23–A24 | P02, P05, P07, P10, P12 | R1 |
| A25–A26 | P01, P06–P12 | R1; repeat for R2 UI |
| A27 | P01, P03, P09, P11; P15 board versions | R1 version handling, R2 seasons |
| A28–A30 | P01–P02, P06, P08–P12 | R1 |

Basic suppression and operator access checks are required in R1 because casual public rankings already exist. R2 adds a richer moderation workflow; it must not be the first opportunity to hide abusive new account entries.

## Validation and integration practice

Each package runs focused checks for its changes. The coordinator runs the full relevant suite at integration gates, then repeats only when changes or unresolved failures warrant it. Use real concurrency tests where transactions are the requirement and hosted Auth tests where provider behavior is the requirement.

Existing repository commands:

```sh
python3 -m unittest discover -v
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:browser
```

The implementation adds explicit commands for shared-rule parity, backend handler tests, real-Postgres transaction tests, and hosted integration; they do not exist yet. The coordinator owns these additions to `package.json`, lockfiles, and CI. Keep hosted credentials out of untrusted pull-request jobs, and make a skipped hosted suite visible rather than reporting it as passed.

PGlite remains useful for migration and policy tests, but its existing auth fixture is deliberately minimal. It cannot alone prove provider linking, credential/recovery behavior, session refresh/revocation, or multi-connection locking behavior. Extend fixture claims carefully and test all migrations in filename order as the current database suite does.

For every gate, record the exact revision, applied migration set, contracts/version configuration, checks run, outcomes, unresolved defects, and owner of the next action. A worker's completion message is evidence for review, not release authorization.

## Deferred planning and remaining risks

- **Time and streak policy:** resolve before adapters ship. Parallel workers cannot independently define order across devices or credit overlapping browser time.
- **Legacy ownership:** imported shared-browser data cannot be reliably split among real people; the preview and conservative baseline policy are intentional limits.
- **Client-reported gameplay:** transactions establish consistency but cannot make casual earnings or scores cheat-proof. Do not expand to valuable trading or prizes without another design.
- **Catalog parity:** shared JavaScript rules require a supported browser/backend module boundary; avoid maintaining a second hand-written catalog in SQL.
- **Old clients:** retaining old RPC compatibility must not retain a privacy/deletion bypass. Removing compatibility needs an explicit upgrade experience.
- **Operating environment:** target budgets, retention periods, load/latency targets, moderation ownership, and hosted access remain G0/G5 inputs. Do not fabricate delivery dates before those are known.
- **R3:** daily challenges need attempt/seed/deadline rules; friends need invitation/removal/blocking; replay validation needs deterministic gameplay and processing limits. Create separate specs and work packages after choosing the next feature.

The implementation critical path is P00 → P01 → the integrated P02/P03/P04 foundation → P05/P06/P07 → G2 → migration and lifecycle completion → P11/P12 → hosted rollout. Parallelism should shorten independent module work while preserving these integration checkpoints.
