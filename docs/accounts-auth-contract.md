# Handle authentication contract

November 8, 2026. The account UI is optional; the checked-in public connection configuration remains empty pending review. This contract replaces the previous email-code flow. Existing save operations and stable owner IDs remain unchanged.

- Handles: case-insensitive ASCII letters, digits and underscores, 3–24 characters, stored lowercase; system/moderator names reserved. A handle is immutable in this release. Editable display nicknames are independent.
- Passwords: at least 12 characters and at most 72 UTF-8 bytes. The byte limit avoids bcrypt truncation; non-ASCII characters may take multiple bytes. Supabase Auth performs password hashing. The application never stores passwords.
- Provider identifiers: random 256-bit identifiers under `accounts.invalid`, held in a service-only identity mapping. They are not supplied by players. The browser's cached user projection contains only ID, handle, anonymous status and last sign-in time. Direct provider responses can contain this synthetic identifier; it is not a contact address.
- Recovery: random 256-bit code, displayed once and optionally downloaded separately from progress. Only its SHA-256 verifier is stored. Reset atomically replaces the verifier before contacting Auth, preventing concurrent reuse. A reset revokes sessions and returns a new password session and replacement code. If both password and recovery code are lost, recovery is unavailable.
- Registration: convert the authenticated anonymous owner in place. Unique database indexes serialize reservations. An interrupted conversion can retry for the same owner and handle; completed conversion retries require the password. The client retains a nonsecret owner/handle intent across reloads to preserve the original guest import and operation IDs.
- Session authorization: validate the token with Auth, then check that its session ID still exists for the same owner. Password reset/change revocation therefore also fences otherwise unexpired access tokens at the application gateway.
- Sensitive changes: password changes, recovery replacement and deletion require the current password. Deletion also requires explicit `DELETE` confirmation. Provider `last_sign_in_at` is not accepted as password proof.
- Abuse controls: durable database counters cover action, network and handle, alongside provider anonymous-signup and refresh limits. Only salted hashes enter the short-lived abuse table. Bodies are bounded; errors never echo provider payloads or credentials.
- Contact restrictions: provider hooks reject nonanonymous direct signup and outbound email. A deferred credential trigger requires the adapter's one-use server metadata ticket for password/provider-identifier changes and rejects phone/email-change fields. Browser metadata cannot authorize credential mutations.

`POST /functions/v1/identity`, JSON, public `apikey`; bearer required for registration and authenticated credential changes:

| Action | Input | Response |
| --- | --- | --- |
| `register` | `handle`, `password` | `session`, `recoveryCode` |
| `login` | `handle`, `password` | `session` |
| `recover` | `handle`, `recoveryCode`, `newPassword` | `session`, replacement `recoveryCode` |
| `change_password` | `password`, `newPassword` | replacement `session` |
| `rotate_recovery` | `password` | `session`, replacement `recoveryCode` |
| `reauthenticate` | `password` | `session` |

Deletion remains `POST /functions/v1/accounts` with `action: "delete"`, `confirmation: "DELETE"`, and `password`.

Registration and recovery bridge a database and Auth request. Recovery consumes its code before provider mutation and fails closed if the outcome is uncertain. If the new password was committed but the response was lost, sign in with the chosen new password and replace the recovery code. If provider mutation never committed and the old password is unknown, an interrupted recovery can require operator investigation; no contact-based or progress-export bypass is provided. Registration reservations and credential mutation leases expire after 60 seconds, and retry behavior is explicitly tested.

Hosted evidence and operational release limits are recorded in [implementation status](accounts-implementation-status.md). This contract does not claim replay verification, competitive anti-cheat, provider-log erasure, or a completed backup restoration rehearsal.
