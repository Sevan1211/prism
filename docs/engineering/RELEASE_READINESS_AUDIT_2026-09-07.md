# Release readiness audit — 2026-09-07

**Subsequent owner decision, same day:** The recommended Cloudflare/Better Auth
approach, subdomain and initial beta limits were accepted after this audit. The
[hosting/account contract](../architecture/CLOUDFLARE_HOSTING.md) now governs them.
Recommendations marked pending below describe the audit-time state. Local cleanup
comes first; accounts and deployment remain unimplemented by this documentation pass.

**Verdict:** current local implementation passes the executed engineering checks and
Reader smoke test. The account-backed portfolio release is not ready for public cutover.
This is an audit and local startup; no deployment, account enrollment, DNS change,
commit, or push was performed.

## Audited baseline and local runtime

- Branch: `sevan-dev`, HEAD `320c2e81041b70d51f248d3142f263c46af1e28d`.
  Remote `sevan-dev` matches this commit. The current working tree additionally
  contained 68 modified tracked files and 43 untracked entries before audit edits;
  nothing was staged. All existing changes were preserved.
- Remote `main`: `0300b219b61dd99d50e9c71e0a69296de76c850e`.
  Most recent PR, [#4](https://github.com/Sevan1211/prism/pull/4), merged August 26.
  [Latest sevan-dev CI](https://github.com/Sevan1211/prism/actions/runs/33837539330)
  succeeded for the September 4 baseline; it does not cover uncommitted changes.
- No PRISM service answered on ports 5173, 5174, 4173, or 8787 initially.
  Started current development source at `http://127.0.0.1:5173/`, the local
  Worker and rebuilt frontend at `http://127.0.0.1:8787/`, and a frontend-only
  production preview at `http://127.0.0.1:4173/`.
- The development `/api/sync/status` proxy returns HTTP 200 and `available: true`.
  The Worker serves direct source and lesson routes with HTTP 200. These are local
  emulated D1/R2 bindings; starting them does not enable production cloud accounts.
- Fresh production main chunk: `index-BuenuBlE.js`, 620.47 kB minified / 177.77 kB
  gzip. Production HTML SHA-256:
  `F7F0C57FCE9C17B9014C904C8F12237175F0CF58BCDAFFB818E03224D79E2EEF`.
  The current SVG landing and contents worker are present in this build.

To restart locally, run `npm run dev:web` and `npm run dev:sync` in separate
terminals from the repository. Rebuild with `npm run build` before evaluating
production assets. On this Windows agent host, Wrangler required execution outside
the restricted sandbox to load its compiler and write its tool logs.

## Evidence from this audit

| Check | Result |
| --- | --- |
| Web lint, TypeScript, tests, production frontend | Pass; 187 tests in 49 files |
| Optional Python companion lint, types, tests | Pass; 23 tests |
| Sync Worker TypeScript | Pass |
| Full frontend/Worker build and release guard | Pass; 278 client files, no bundled PDFs or detected literal development source/lesson IDs |
| PDF regression corpus | Pass; 3 documents, 102 pages; parser evidence, not semantic fidelity |
| Local synthetic sync service exercise | Pass; 1 MiB encrypted round trip, upload/commit retry identity, cross-library isolation, anonymous denial, concurrent-head rejection, device revocation, cross-site rejection, deletion/read denial |
| Documentation and whitespace | Pass before audit; rechecked after documentation updates |
| npm production dependency audit | Zero reported vulnerabilities |
| npm complete dependency audit | Four moderate entries in one Drizzle Kit → esbuild dependency chain; zero high/critical |
| Limited credential-pattern scan | No matches in scanned source/docs; not a full historical secret audit |

The dependency issue is [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99),
in the older development-only esbuild nested under `@esbuild-kit/core-utils`.
Do not apply the audit tool's suggested major downgrade blindly. Review an updated
migration-tool dependency path separately. No clean dependency reinstall, Python
advisory scan, complete license inventory, or independent security assessment was
performed in this audit.

Browser evidence used the real in-app Chromium browser and built production assets:

- Landing rendered with the current prism SVG and working library navigation.
- Port 4173 visibly started empty and browser-only, without account or library seeds.
  The existing port-8787 browser library was not a fresh-origin test.
- Imported the unchanged, licensed 21.2 MB Computer Networks v6.1 regression PDF
  through the visible file chooser into the empty browser-only preview. All 489
  pages became evidence-ready. The fixture remains excluded from production assets.
- Reader displayed the original PDF and 165 contents entries. Selecting section
  6.3 reached PDF page 305 / printed page 301, with the matching section visible.
- Reload restored the same source and page 305. At 390 × 844, the toolbar fitted
  and the PDF rendered. Temporary viewport override was reset. No captured browser
  console errors were reported for this smoke test.
- The browser disclosed that persistent-storage protection had not been granted.
  Reload success is not protection against browser eviction or cleared site data.

This does not establish full keyboard/screen-reader acceptance, all browsers,
offline startup, end-to-end authoring speed, human lesson fidelity, accepted revision
continuity, or improved learning. No learner plan or revision was approved by the agent.

## Release blockers, in order

1. **Complete the product acceptance workflow.** Run the current build through an
   openly licensed source → approved plan → useful detailed lesson → learner-approved
   substantive revision → reload → exact source return. Existing historical evidence
   and passing structural tests do not close the current owner-review and non-CS
   rehearsal gates. See [acceptance log](SUBMISSION_READINESS.md).
2. **Complete deployed acceptance of account-backed cloud mode.**
   The [account panel](../../apps/web/src/account/CloudStoragePanel.tsx) now uses
   Clerk identity and explicit storage opt-in. The [Worker](../../apps/sync/worker.ts)
   enforces signed account ownership; recovery-key enrollment is retired. D1/R2 are
   provisioned, while the API and site remain undeployed. See the updated
   [account evidence](../architecture/CLOUD_ACCOUNT_PROPOSAL.md).
   Prove two-account isolation, two-browser recovery, deletion without resurrection,
   interrupted uploads, migration consent, and readable conflict recovery.
3. **Finish security and operating controls before cloud signups.** No
   Content-Security-Policy header was present on the local production or current
   public `/sources` response, and no CSP was found in the app hosting source.
   Add and validate the required policy with PDF workers, inline bootstrap code,
   fonts, and approved agent integration. Complete privacy/deletion/support wording,
   cloud restore testing, and realistic quota/abuse testing.
4. **Reduce idle sync cost.**
   [syncedLibrary.ts](../../apps/web/src/storage/syncedLibrary.ts) checks visible
   connected tabs every five seconds. Each request enters the Worker's D1-backed
   rate limiter, which writes a counter and performs cleanup even for reads.
   Calculated example: 50 tabs × 2 hours/day × 720 polls/hour = 72,000 polls/day,
   before edits, uploads, auth, index maintenance, cleanup, or other account use.
   This approaches the Free plan's 100,000 daily D1 row writes and Worker requests.
   Add idle backoff, immediate sync on edits/focus/reconnect, cross-tab coordination,
   bounded retries, indexed queries, and operation-level cutoffs. This calculation
   is a capacity warning, not a measured load result.
5. **Create a reviewed release and deployment.** Separate the large working tree
   into focused changes, exclude generated `output/` files unless intentionally
   selected, reconcile `sevan-dev` with `origin/main`, run CI, and release through
   the required PR path. Then verify the deployed origin and rollback procedure.
   Startup/interaction performance remains unmeasured; the large bundle warning
   remains. Add canonical/social metadata for the selected public origin.

## Accounts and a free operating tier

**Recommended fit for this repository:** Cloudflare Worker Static Assets + a small
Worker API + D1 account/library/revision metadata + private R2 Standard objects.
Use Better Auth with Google first and GitHub second, using its supported database
adapter path. This keeps the existing React/Worker storage investment. Prove the
chosen version, D1 adapter, OAuth redirects, sessions, and CPU consumption in a
small integration before adopting it. Better Auth documents
[social login](https://better-auth.com/docs/basic-usage),
[Drizzle](https://better-auth.com/docs/adapters/drizzle), and
[D1 through a Kysely dialect](https://better-auth.com/docs/adapters/other-relational-databases).

Keep reading and existing lessons available without login; sign-in is only for
explicit cloud opt-in. OAuth handles identity, while PRISM must still check account
ownership on every object and revision operation. Prefer host-only secure HttpOnly
session cookies, private objects, short-lived object-scoped transfer permissions,
and bounded uploads. Keep cloud-storage consent separate from agent disclosure.
Do not promise zero-knowledge recovery for ordinary account storage or silently
replace an existing encrypted library without a reviewed migration.

Current published allowances, checked September 7 (shared provider-account usage
and the owner's actual subscriptions must still be checked before launch):

| Component | Free allowance / qualification |
| --- | --- |
| [Static assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) | Asset requests free and unlimited; requests invoking the Worker consume its quota |
| [Workers](https://developers.cloudflare.com/workers/platform/pricing/) | 100,000 requests/day, 10 ms CPU/invocation; Paid starts at $5/month |
| [D1](https://developers.cloudflare.com/d1/platform/pricing/) | 5 million rows read/day, 100,000 written/day, 5 GB total storage |
| [R2 Standard](https://developers.cloudflare.com/r2/pricing/) | 10 GB-month, 1 million Class A and 10 million Class B operations/month; no egress charge |

R2 is a [metered subscription](https://developers.cloudflare.com/r2/get-started/),
not an automatic zero-dollar spending cap. Storage beyond the included allowance
costs $0.015/GB-month; operations also have overage charges. A zero-cost beta is
plausible within allowances, but not a guarantee of free hosting at arbitrary scale.

Suggested initial policy, **not yet approved or implemented**: 50 beta accounts,
100 MB cloud data each including retained versions, and a 5 GB global stored-plus-
reserved ceiling. Fifty fully used allowances equal 5 GB; retain provider headroom
for other usage and interrupted objects. Enforce reservations and cleanup, per-file
limits, upload/read-operation budgets, an intake cutoff, and source-free monitoring.
When limits are reached, preserve local work and explain why cloud writes paused.
Measure OAuth CPU against Workers Free's 10 ms limit; use the $5 paid baseline if
needed while keeping the product free for users. PRISM-funded AI remains excluded.

[Supabase Free](https://supabase.com/pricing) is the simpler managed all-in-one
alternative: 50,000 MAU, 500 MB database, 1 GB files, 5 GB egress, plus listed cached
egress allowance; projects pause after one inactive week. Its lower file allowance
and inactivity policy make it a weaker fit for this PDF-heavy portfolio app, though
it would be reasonable if fastest managed-auth setup outweighed those tradeoffs.

## Domain and live hosting

Use **prism.sevanlewispayne.com** for v1. It associates the project with its author
and needs no additional domain registration. Buy a standalone domain when there is
a settled independent brand and sustained demand. Both support the same app and
account architecture. Cloudflare [Worker Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
support domains and subdomains and issue certificates for an active owned zone.

Audit-time checks of the previous preview: public access, latest version 10,
anonymous `/sources` HTTP 200 without a sign-in redirect, and zero attached custom
domains. This is historical baseline evidence, not the selected hosting target.
`prism.sevanlewispayne.com` did not resolve from this machine during the audit.
The current local changes have not been published there.

Choose the permanent origin before onboarding cloud users. Browser-local PDFs,
IndexedDB, and OPFS belong to their origin; an HTTP redirect does not move them.
Verify an explicit transfer/reimport or opted-in sync recovery route before retiring
the old host. Keep the current site as rollback until the new deployment passes.
