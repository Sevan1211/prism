# Username/password and Google cloud accounts

**Researched and accepted:** 2026-09-07. **Status:** development Clerk application
connected; owner login and authenticated local Worker verification confirmed.
Account-owned storage is implemented and tested locally. The remote D1 database and private R2 bucket are provisioned; the Worker and website are not deployed.

The owner now explicitly requires username/password login alongside a real OAuth
provider and a service free for users with minimized owner costs. Keep Cloudflare hosting, local reading,
privacy and quota boundaries in [the hosting contract](CLOUDFLARE_HOSTING.md).
The accepted Clerk choice supersedes the earlier Better Auth target. The owner
requested local integration first, then supplied and authorized connecting an existing
Clerk application. Its development instance is now linked through the Clerk CLI.

## Recommendation

Use Clerk Hobby for identity, Cloudflare Worker Static Assets for the existing
frontend, a Worker for library authorization, D1 for library ownership and revision
metadata, and private R2 Standard for PDFs and library objects. Retain
`prism.sevanlewispayne.com` as the intended public origin.

Clerk's current free plan includes usernames, passwords, up to three social
connections, account linking, email authentication, bot protection and brute-force
protection. Its limit is 50,000 monthly retained users per application, not an
unlimited service. A retained user returns at least 24 hours after signup. Free
sessions have a fixed seven-day lifetime; removing branding, production MFA and
passkeys require a paid plan. Keep the integration on Hobby; do not enable paid features.
[Clerk pricing](https://clerk.com/pricing),
[sign-in configuration](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options).

Better Auth supports actual username/password authentication through its username
plugin, so functionality is not the problem. Its default scrypt hashing is
deliberately expensive, whereas Workers Free allows 10 ms CPU per invocation.
That makes a zero-cost password service on this runtime a performance risk that
must be measured, not assumed away. Do not weaken hashing parameters to fit the
free tier. Hosted identity avoids running password hashing in PRISM's Worker;
token validation and ordinary library operations still need CPU measurements.
[Better Auth usernames](https://better-auth.com/docs/plugins/username),
[password hashing](https://better-auth.com/docs/authentication/email-password),
[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/).

Supabase Auth is another managed option with 50,000 monthly active users free,
but adds a second database platform and its free projects may pause after one week
of inactivity. Clerk directly includes the requested username sign-in behavior.
[Supabase pricing](https://supabase.com/pricing).

## Account and library experience

1. Keep the empty local library fully usable without an account.
2. Offer **Create account** with username, email and password, or **Continue with
   Google**. Email supports verification and recovery; it is not a replacement
   for the requested username login. Use provider SDK flows, including reset,
   verification, expiry, loading and error states, with PRISM's monochrome styling.
3. Allow **Username or email** plus password on return. A Google user can choose a
   username; connect another login method only through the provider's verified
   account-linking flow. Do not merge libraries based on a client-supplied email.
4. After login, explicitly choose what to store in the cloud. Explain which files,
   lessons, folders, revisions and reading state transfer. Signing in alone must
   not upload an existing local library or change source-agent grants.
5. On another device, authenticate to the same PRISM account and recover opted-in
   work. Cache files on demand. Show local, syncing, synced and attention states;
   never claim a pending local write is already remotely durable.
6. Provide account settings, sign-out, session revocation, export and deletion.
   Account switching must isolate local caches and pending uploads by owner.
   Never attach the previous user's outbox to the next user's account.

Google production setup needs the owner's OAuth client, exact authorized callback
URLs and a public homepage/privacy policy. Request identity scopes only, not
Drive access. Verify sign-in in the actual desktop browser: Google restricts
embedded user-agents. If that environment rejects OAuth, provide password sign-in
there and test a supported browser flow; do not bypass the restriction or assume
signing in to Chrome also signs in a separate browser profile.
[Clerk Google setup](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google),
[Google OAuth policy](https://developers.google.com/identity/protocols/oauth2/policies).

## Server boundary and migration

- Verify sessions on every cloud request, including signature, issuer, expiry and
  authorized party/origin as appropriate. Resolve a stable provider subject to an
  internal PRISM account. Do not accept a user ID from the client as authentication.
- Check account ownership for every requested library, revision and file. Use
  private objects with bounded authorized transfer. Keep secrets server-side and
  source text out of authentication metadata, logs and identity-provider webhooks.
- Treat webhooks as untrusted until their signatures are verified; process retries
  idempotently. Specify revocation latency rather than promising that an already
  issued token becomes invalid instantly. Use stronger session checks for sensitive
  account actions and test deletion against outstanding transfers.
- The active `/api/cloud` backend derives ownership from the verified Clerk subject.
  Recovery-key UI, cryptography and enrollment handlers have been removed; old
  `/api/sync` requests fail with 410. Existing legacy tables and local files are
  retained without automatic conversion or upload.
- The accepted ordinary account mode uses encryption in transit and at rest and
  does not claim end-to-end encryption. Existing encrypted libraries need a separate
  explicit migration that explains the changed privacy boundary. Preserve the
  original files until an explicitly selected transfer is verified. There is no
  active recovery-key enrollment or automatic legacy-library conversion.

## Keeping operating cost low

Use the revised initial ceiling: 50 cloud users, 1 GB per user, 50 GB globally.
`shared/cloudPolicy.ts` supplies byte and library ceilings to the account-owned
Worker and account UI. Atomic enrollment allows one active library per verified
Clerk subject, up to 50 active libraries.
Count retained versions, generated objects and concurrent upload reservations.
Large textbooks and retained versions can fill that allowance; show the limit before upload and
preserve local reading when it is exceeded.

Current provider allowances:

| Component | Free allowance relevant to PRISM |
| --- | --- |
| Clerk Hobby | 50,000 monthly retained users per application |
| Worker | 100,000 dynamic requests/day; 10 ms CPU/invocation |
| Static Assets | Free unlimited static asset requests |
| D1 | 5 million rows read/day; 100,000 rows written/day; 5 GB total storage |
| R2 Standard | 10 GB-month storage; 1 million Class A and 10 million Class B operations/month; free egress |

[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/),
[R2 pricing](https://developers.cloudflare.com/r2/pricing/).

All other projects in the provider account consume shared allowances where
applicable. Use atomic intake/storage reservations, request and object-operation
budgets, abuse protection, cached reads and idle sync backoff. Stop new cloud
intake or pause transfers before budgets are exhausted. Preserve local edits,
existing cloud data, deletion and export routes when imposing limits. Reserve
capacity for those operations. Alerts supplement enforcement; they are not caps.
R2 is metered and does not become a hard zero-bill service just because storage is
below its free allowance. Do not advertise unlimited free cloud storage or promise
zero owner cost under every traffic pattern. The owner accepts small usage costs;
at 50 GB stored all month, storage alone is about $0.60/month after the free allowance.
No subscription activation is authorized. No exact all-service monthly ceiling has
been chosen; before deployment, present measured operation/compute estimates and
the intake thresholds. Keep accounts and parsing off paid compute where possible.
PRISM also does not fund the learner's external AI provider or domain renewal.

## Implementation order and release proof

### Implemented and verified locally — 2026-09-07

- The wider Account & storage dialog separates Storage from Account & security.
  Clerk profile details fit desktop and phone widths without horizontal clipping.
  Both sections stay mounted in a stable workspace; tab switching preserves drafts
  and does not rebind the cloud identity. Sign-in uses isolated PRISM color tokens
  to avoid a Clerk variable collision, with solid controls and provider branding.
- Username/password, Google and the owner's existing GitHub connection are enabled
  in the Clerk development application. A real owner session was verified against
  the local Worker. Profile inspection shows a linked GitHub account; this does not
  independently prove password, Google, email recovery or production OAuth flows.
- Every cloud API request requires a signed, unexpired Clerk session with the exact
  issuer, authorized origin and completed session state. Library/object/commit paths
  independently check ownership. No client-supplied owner, recovery key or persistent
  bearer token grants library access. Source-agent grants remain device-local.
- Explicit account-library enrollment, optional local-library copying, folders,
  records, revision commits, chunked PDF transfer, lazy downloads, conflict handling,
  offline outboxes and confirmed cloud-library deletion are implemented. Creating a
  new library after deletion uses a fresh ID. Old cached libraries are never merged
  into another account. Original browser-local records remain intact.
- Per-owner cache pointers restore opted-in account data after the identity provider
  restores that owner. Cached reading can continue through a network failure; a fresh
  sign-in still needs the provider. Signing out switches back to the original browser
  library. Downloaded copies remain on the device, as disclosed in the UI.
- SHA-256 verification checks immutable file chunks. Atomic reservations enforce
  1 GB/account and 50 GB globally, including retained versions and unfinished uploads.
  Polling is every two minutes while visible, with immediate write/focus/online sync.
  Expired rate counters are cleaned once per account rate window rather than per poll.
- Local Worker tests cover actual JWT verification, SQLite ownership/quotas,
  corrupt objects, missing chunks, retries, conflicts, cross-account denial and
  deletion/re-enrollment. Client tests exercise a synthetic PDF and folder transfer
  into a fresh device cache, grants remaining local, identity-switch cancellation,
  and offline cache restoration. These are software tests, not a deployed-device test.

### Cloudflare setup evidence — 2026-09-07

The owner approved scoped Wrangler login and initialization of the new PRISM database.
Wrangler authenticated successfully. Existing R2 service was already enabled; no plan
upgrade was made and the unrelated existing bucket was not changed.

| Resource | Verified state |
| --- | --- |
| D1 `prism-library` | Created in WNAM; migrations 0000, 0001 and 0002 applied remotely |
| Private R2 `prism-library-files` | Created; public r2.dev access disabled |
| R2 byte transfer | Synthetic upload/download matched SHA-256; test object deleted |
| Local app | Vite at 127.0.0.1:5173 proxies account/cloud API to Wrangler at 8787 |
| Local storage | D1/R2 emulators; visibly labelled as a local test in the account dialog |
| Hosted API/site/DNS | Release and DNS work authorized; production setup in progress, deployment not yet verified |

The real local database uses the same migrations. `.dev.vars.example` documents the
public JWT key, issuer, exact origin, enable flag and local-mode flag. Local key/env
files are ignored. The frontend receives only a Clerk publishable key; passwords,
secret keys and bearer tokens are not committed or placed in `VITE_` configuration.
R2 CLI success proves bucket access, not the browser's end-to-end deployed API path.

### Remaining release gates

1. Native Cloudflare packaging and release guards now replace the old publishing
   adapter. The GitHub workflow deploys only after checks pass on `main`; credentials
   and the first successful deployed run still need verification. See
   [release operations](../engineering/CLOUDFLARE_RELEASE.md).
2. Configure a Clerk production instance and production Google credentials/callbacks.
   Verify username/password, Google, verification/reset and linked-account flows in
   supported browsers. Desktop and 390 px profile layouts were inspected; a collapsed-menu bug hiding
   open dialogs on narrow screens was fixed.
3. Production now uses SDK remote signing-key discovery and enforces session tokens
   with lifetimes at most 120 seconds. An hourly job checks for deleted Clerk accounts
   and resumes pending cloud deletion; provider failures preserve data. These paths
   have automated tests; hosted rotation, scheduling and deletion still need acceptance.
4. Measure Worker CPU, D1 rows and R2 operations. The byte/enrollment caps and per-account
   rate limits are implemented, but they are not a hard all-service spending cap.
   Define global operational cutoffs, abuse handling and quota reclamation for retained
   history/abandoned chunks. Ordinary source deletion retains revision history; deleting
   the entire cloud library releases its stored objects.
5. After hosting is explicitly resumed, configure production origin/issuer/bindings,
   enable cloud storage in remote mode and deploy a restricted preview. Verify two
   independent browsers with a synthetic PDF, lesson, revision and reading position,
   including restart, interrupted upload, concurrent edits, account switching and
   deletion. Only then enable public access and change DNS.

The current implementation must not be described as fully live cross-device storage.
No user PDF was uploaded to remote R2 during setup. Existing encrypted prototype data
is neither deleted nor automatically migrated into the different privacy model.

## WebMCP observation during this investigation

The screenshot's **0 tools offered; 27 waiting** and absent browser interface mean
the page had no callable `document.modelContext.registerTool` at that observation.
This is distinct from registration rejection and unrelated to PRISM cloud login.

In the existing PRISM `/sources` tab available to this task, real in-app browser
discovery subsequently exposed all 27 tools. A `get_authoring_guide` core call through
the browser's WebMCP capability succeeded, and the UI showed **27 tools offered**
and **get_authoring_guide — completed**. No source contents, learner grants or saved
lessons were changed. This verifies current discovery and one read in this task's
browser, not the separate chat/session in the screenshot or every authoring tool.

For an unavailable session, check Settings > Browser > Permissions > Enable site
tools, update the desktop app and reload/retry the tab. OpenAI's current documentation
names GPT-5.6 Sol and Terra for site tools; it does not establish Astra support in
the screenshot's session. Workspace restrictions and rollout also apply. Check the
address-bar Site tools inventory before concluding that a model can invoke them.
[OpenAI site-tools documentation](https://learn.chatgpt.com/docs/webmcp).
