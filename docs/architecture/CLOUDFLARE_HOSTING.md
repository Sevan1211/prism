# Cloudflare hosting and cloud accounts

## Automatic account-library recovery - 2026-09-08

Signed-in browsers automatically reopen an existing account library, including a
fresh browser with no cached pointer. When accounts are configured, the hidden
account host activates at startup without opening Storage. This does not create a cloud library or copy
an original browser library: initial creation/copying remains explicit. Choosing
"Use browser library" persists an owner-specific opt-out. Account changes and a
local-library selection during restoration cancel the pending reopen.

Local cloud-library writes retain the durable outbox and schedule upload after one
second. Visible tabs retrieve changes every 30 seconds and on focus, restored page
visibility, reconnect, and browser history restoration. Hidden tabs do not poll.
Existing account retry deadlines, quotas, conflict handling and access-grant
isolation remain enforced. At steady idle this adds at most 120 polls per hour per
visible tab, excluding focus/reconnect events; it is not a provider-budget or
cross-device acceptance claim. Storage's manual action is now "Check for updates".
Direct lesson links wait for account-library restoration before reporting absence.


**Decision:** accepted by the owner on 2026-09-07.  
**Implementation:** account-owned storage implemented and tested locally; D1 and private R2 provisioned; remote API acceptance pending.  
**Deployment:** public release and DNS setup authorized on 2026-09-07; preparation in progress. See [release operations](../engineering/CLOUDFLARE_RELEASE.md) for CI/CD and required live evidence.

This is the authoritative hosting/account direction for the next PRISM release.
It supersedes earlier hosting targets and recovery-key enrollment as the default
public cloud experience. Historical deployment receipts are not launch instructions.
See the [release plan](../engineering/FINAL_PORTFOLIO_RELEASE_PLAN.md) and
[readiness audit](../engineering/RELEASE_READINESS_AUDIT_2026-09-07.md).

## Accepted choices

**Updated owner decision, 2026-09-07:** Use Clerk Hobby for username/password
and Google sign-in, with 1 GB per user for the initial 50-user beta. Keep owner
costs as low as practical; exact zero is no longer required. The owner subsequently
authorized connecting the existing Clerk development application locally. See the
[account implementation plan](CLOUD_ACCOUNT_PROPOSAL.md).

| Responsibility | Decision |
| --- | --- |
| Canonical public address | `https://prism.sevanlewispayne.com` |
| Frontend | Existing React/Vite app served by Cloudflare Worker Static Assets |
| Server | Small Cloudflare Worker API on the same origin |
| Identity and sessions | Clerk Hobby; username/password, verified email/recovery, Google sign-in |
| Metadata | D1 for PRISM account mapping, library ownership, revisions, quotas, deletion state; Clerk manages identity/sessions |
| File storage | Private R2 Standard bucket for source PDFs and larger library objects |
| Free local core | No account for importing, reading, local saving, or reading saved lessons |
| Optional cloud | Account required only when a learner chooses cloud storage |
| Initial beta | Up to 50 cloud users, 1 GB per user, 50 GB global ceiling |
| AI | Learner supplies a compatible agent; PRISM does not fund inference |

The account Worker enforces byte/library ceilings and ownership on every transfer. This is not a capacity guarantee.
GB are decimal units. Per-user usage includes retained
versions; the global ceiling includes stored bytes and reserved in-flight uploads.
All provider-account usage, including other projects, counts toward the cost budget.

Minimize owner hosting cost while keeping the product free for users. At 50 GB
stored throughout the month, R2 Standard storage alone is approximately $0.60/month
after the 10 GB free allowance, assuming it is available to PRISM. Actual occupancy,
operations and other services determine the bill. The earlier roughly $25/month
ceiling is historical planning context, not authorization to activate a subscription.
If measured session-verification CPU or traffic
requires Workers Paid or another charge, present the actual cost before enabling it.
R2 is metered; storage quotas and billing alerts alone are not a spending cap.
The [audit](../engineering/RELEASE_READINESS_AUDIT_2026-09-07.md#accounts-and-a-free-operating-tier)
records dated provider allowances and primary pricing links. Recheck them before launch.

## Learner experience and privacy

1. Start with an empty browser-local library and read without signing in.
2. Choose cloud storage and sign in with username/password or Google. Explain the destination,
   selected sources/data, storage allowance, and deletion behavior before transfer.
   Logging in does not automatically upload the existing library.
3. Reopen opted-in work in another browser using the same account. Use provider
   recovery and normal sessions; no recovery-key file is required for this mode.
4. Display whether work is saved locally, syncing, synced, offline, or needs attention.
   If cloud limits are reached, preserve local edits and explain the paused transfer.
5. Offer sign-out, device/session revocation, export/recovery, and explicit cloud
   deletion with tested handling of offline browsers and retained copies.

Use HTTPS, private objects, account authorization on every library/object operation,
provider-supported secure session handling, restrictive CORS and CSP, bounded request
bodies, and short-lived object-scoped upload/download permissions. Identity alone
does not establish ownership of a requested library. Do not build password storage
or account recovery from scratch.

This mode uses transport and storage encryption; it does not claim end-to-end,
zero-knowledge, or independently audited security. Cloud storage and agent disclosure
are separate permissions. Agent access to private or unknown-rights source text and
images still requires the learner's source-specific authorization.

## Implementation sequence after local cleanup

1. Finish the owner's remaining local UI/product changes and the core lesson/revision
   acceptance workflow. Keep the current local app running during this work.
2. Replace the legacy publishing adapter with the native Wrangler build/deploy path.
   Remove the obsolete publishing manifest/plugin and adapter-only packaging logic;
   preserve empty-library, source-file, identifier, secret, and artifact release guards.
   `wrangler.jsonc` now names the provisioned PRISM D1/R2 resources. Local development
   still uses emulation; naming remote bindings does not publish the API.
3. Prove Clerk's production username/password, verification/recovery, Google callbacks, session
   handling, and Worker CPU use. Keep authentication separate from library access checks.
4. Complete deployed acceptance of the implemented account libraries, consented
   transfer, resumable objects, revisions and deletion. Legacy data is not auto-migrated.
5. Enforce the accepted quotas atomically, including concurrent upload reservations,
   retained versions, abandoned objects, and retries. Add request/operation budgets,
   intake cutoff, abuse controls, source-free monitoring, idle polling backoff, and
   cross-tab coordination. Five-second polling with a D1 write per poll is not the
   intended launch behavior.
6. Wrangler login and isolated D1/R2 setup are complete with owner approval.
   After hosting resumes, verify the production domain zone and Clerk configuration.
   Prepare a concrete validated release through `sevan-dev` → PR → CI → `main`.
7. Deploy a restricted preview only when hosting is authorized. Complete acceptance
   before the owner approves public release and the domain switch.

Wrangler 4.129.0 is authenticated with owner-approved permissions. The private
`prism-library-files` bucket passed a synthetic byte round-trip, and `prism-library`
has the account schema initialized. See [setup evidence](CLOUD_ACCOUNT_PROPOSAL.md#cloudflare-setup-evidence--2026-09-07).
Tokens and local environment files remain out of Git. No Worker or website was published.

## Acceptance before public release

- Signed-out Reader works from an empty library and direct routes without a login wall.
- Two independent accounts cannot access each other's records or objects.
- Two browsers reopen an opted-in PDF, finished lesson, accepted revision, and exact
  source position after restart and clearing one browser's local data.
- Session expiration/revocation, interrupted uploads, stale versions, concurrent edits,
  quota boundaries, provider-limit failure, deletion, and restoration are tested.
- PDF workers, fonts, source inspection, compatible agents, keyboard access, and mobile
  reading work with production security headers.
- No private sources, secrets, cached library state, or hardcoded lesson/source IDs ship.
- Observed requests, CPU, database writes, object operations, and storage fit the budget.
- Canonical URL, OAuth redirects, cookie scope, metadata, documentation, and release
  evidence agree. Code rollback and data recovery are documented separately.

## Origin transition

The previous public preview remains unchanged until explicit cutover. Its domain
does not become the target again merely because historical evidence mentions it.
Browser-local data belongs to its browser profile and origin: redirects cannot move
IndexedDB or OPFS. Verify an explicit transfer/reimport or opted-in cloud recovery
before retiring the old origin. Do not silently upload existing local or encrypted
prototype libraries, delete them, or change their privacy properties.

The initial CLI/database authorization was followed by the owner's explicit
2026-09-07 request to configure DNS, publish the website and deploy from GitHub
main. The earlier website/DNS hold is superseded. Paid-plan upgrades and unrelated
old-host shutdown still require their own authorization.
