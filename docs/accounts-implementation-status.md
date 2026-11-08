# Accounts implementation status

The account implementation is ready for code review and local testing. It has not been deployed to Supabase. Cloud sign-in stays disabled while the public backend configuration is empty; guest play and device saves remain available.

## Implemented

- A profile dialog with optional email-code registration/sign-in, explicit guest import review, preferences, private history, export, sign-out, and account deletion.
- IndexedDB owner isolation, original-save backups, a durable operation queue, retry receipts, dependency ordering, optimistic reconciliation, and visible storage/sync failures.
- Shared progression rules using the existing achievement and shop catalogs. Gameplay checkpoints, final rewards, purchases, and imports have independent duplicate protection.
- Per-tab, reload-stable progression streams. Concurrent tabs do not concatenate streaks or interrupt each other's runs. Duplicate tabs claim separate live identities where Web Locks are available.
- An authenticated Supabase Edge Function and additive Postgres migration. State, wallet entries, results, and operation receipts commit together with revision checks.
- Optional casual leaderboard publication, pagination, nearby placement, minimal public profiles, server-defined seasons, moderation, and deletion fences. Existing ranking callers retain their response format.
- History filters by game, difficulty, and outcome. Page summaries show result/win/loss counts; reported play timestamps remain distinct from server receipt times used for season eligibility.

The [backend runbook](accounts-backend.md) specifies the protocol, setup, privacy boundaries, operational controls, and release checks. The [design](accounts-and-progression-design.md) and [implementation plan](accounts-and-progression-plan.md) remain the review baseline.

## Decisions and limits

Email codes, editable nonunique display names, and casual client-reported scores follow the account design. The Cubie welcome flow now defaults leaderboard sharing and public profiles on, with separate switches to turn either off; previously saved explicit choices are preserved. This supersedes the original opt-in publication defaults in the design and plan documents. The first-visit welcome includes account setup, preferences, and seven skippable gameplay videos (excluding Singularity Core), and can be replayed from Arcade Profile. The temporary setup preview tab has been removed. The greeting song, “Hello, New Friend!”, also appears in the Arcade Jukebox. Email creation requires a configured account backend; disconnected previews support the guest flow. There is no replay verification or competitive anti-cheat claim. The initial guest baseline may bring legacy Cash and purchases once; subsequent imports bring eligible records and unlocks without adding Cash, counters, or streaks. Guest operations retain their IDs when bound to a new account. Merging a new-format guest economy into an existing account remains deferred.

The browser uses direct Auth REST calls rather than adding an SDK dependency. Both leaderboard and account clients share the session adapter. Stream ownership is per tab rather than per installation so concurrent local games cannot reset one another. Page-time intervals are bounded and overlapping intervals are deduplicated.

Public profiles expose only the display name and a neutral Cubie to avoid leaking secret unlocks. Ranking pagination is live and may shift as scores arrive. The history overview provides counts for the displayed page, not a full analytics dashboard. Existing achievement, appearance, and score panels remain the detailed collection views.

No automatic anonymous-account cleanup, event compaction, complete existing-account economy merge, friends, challenges, or social features ship here. Run and receipt storage grows until deletion; capacity, retention, and backup policy need an operational owner before rollout. Local exports include pending work for recovery, but importing an archive is a reviewed progress import rather than replaying another account's raw journal.

## Validation and launch gates

Automated checks cover the Python engine and static packaging; reducer/catalog parity; Auth and sync races; client-to-handler-to-database integration; SQL grants, receipts, visibility, purchases, seasons, and deletion; and desktop/mobile browser flows. Database integration uses the actual migrations in PGlite. Browser Auth flows use a controlled test service.

Before enabling accounts publicly, complete P16/G5 from the plan in a separate Supabase test project:

1. Verify real email delivery, expired/resend codes, anonymous conversion, another-device login, refresh/revocation, and deletion reauthentication.
2. Exercise simultaneous purchases and retries through separate real Postgres connections; PGlite does not establish networked lock/concurrency behavior.
3. Deploy the function and migrations together, inspect hosted RPC grants, and test the GitHub Pages repository path.
4. Configure SMTP, rate limits, allowed origins, retention, backups, moderation ownership, and a restore rehearsal.
5. Enable public connection settings only after those checks; rehearse the server write/import/purchase pause controls.

The implementation PR is intentionally separate from the merged README/documentation PR. Merging frontend code alone does not configure or launch the account service.
