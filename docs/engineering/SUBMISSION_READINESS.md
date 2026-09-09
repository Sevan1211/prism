# Submission readiness

## Adaptive favicon - 2026-09-09

The favicon now uses a transparent SVG traced from the owner's serif-p and
five-color fan reference. Its letter is dark in light mode and white in dark mode,
using the browser's `prefers-color-scheme` preference. The rainbow stays unchanged.
The previous square-backed SVG is deleted and the HTML points to a new asset URL
so existing browsers can fetch the replacement.

Local Chrome inspection covered 16, 32 and 64 px rendering and light/dark/light
preference changes without reloading the SVG. Pixel checks confirmed transparent
surroundings and letter cutouts, the expected letter colors and an unchanged fan.
Production publishing is recorded by the associated PR and deployment workflow;
these local checks alone do not establish the deployed icon or cached browser tabs.

## Fresh-device cloud restoration - 2026-09-09

The owner reports that a new device restores the library automatically after
sign-in, with an approximately 15-second wait. Inspection found duplicate initial
library lookups, sequential revision downloads, and repeated queued reader reloads.
The updated path shares discovery, downloads four revisions at a time, applies
them in order, and notifies readers once after replay. Restoration is visible
outside the Storage dialog; its manual open control no longer appears while
automatic restoration is underway.

Regression checks exercise an empty browser cache with eight revisions arriving
out of order, a failed download with three others in flight, cached retry, a
single shared lookup, the final authoritative revision and bounded reader refresh.
They establish two download windows for eight single-object revisions, not a
measured fourfold improvement on the owner's device. Independent live-device
timing remains an acceptance check.

Local validation: web lint/typecheck, all 250 tests in 61 files, production web
build and documentation checks passed. Chrome rendered the actual storage
components against a synthetic, gated local transport: progress advanced from
0/8 to 4/8, then the banner disappeared and Storage showed Synced, without opening
the dialog. This is browser UI acceptance with synthetic data, not a live
cross-device latency measurement.

## Authoring, visual review and automatic storage - 2026-09-08

Local validation passed: web lint/typecheck, 244 tests in 60 files, production web
build and documentation checks. Chrome inspection covered source/brief/passage
request-card behavior through the shared component, 390/900 px prompt layouts,
full-precision chart inspection, complete source crops and fitted full pages.
Saved-lesson review exercised all 27 states of six scene sequences, 46 concept
controls, two text sequences, chart filtering and the keyboard delay model.

The reviewed long chapter substantively covers its approved scope, but a tight
source crop and implicit packet-position resets require a learner-reviewed content
revision. Ready lesson content was not overwritten. The application now warns
about implicit resets and guided static sequences; these diagnostics do not prove
semantic correctness. The actual full-page viewer also needed its inherited 50%
minimum width removed so tall pages fit vertically.

The configured account host activates at startup without opening Storage. Existing
account libraries now restore automatically, scheduled local edits upload
without a manual sync action, and visibility/online recovery retries remote reads.
Tests cover automatic uploads, fresh-browser discovery, local-choice races, offline
startup recovery, owner isolation and existing retry/conflict protections. No new
cloud library or original-local-library upload is silently initiated.

Local checks are not deployed acceptance. The associated release PR/Actions run
records publishing; independent deployed-device recovery, provider operation
budgets and a comparable full authoring speed measurement remain outstanding.
Agent timings can now be exported from up to 300 source receipts without source
text or prompts; model and host time are explicitly excluded.


## Sync recovery follow-up — 2026-09-07

PR #7 deployed successfully in GitHub run 34183218757. The hosted Reader opened
the public Mozilla test PDF with cloud identity intact and page navigation working.
The subsequent user report identified unsolicited storage dialogs and an exhausted
account request budget: aggregate remote metadata showed 11 commits, 18 objects
and over 2,800 requests in the active account window. This does not identify every
origin of the earlier traffic; do not infer complete cross-device acceptance.

Background sync errors/conflicts now use the existing Storage attention indicator;
only an explicit open action or an authentication return opens the dialog. Worker
rate-limit responses include their retry interval. The client stores an account-scoped
deadline shared across reloads/tabs, retains the durable outbox, and schedules a retry.
Verified download chunks are cached before proceeding, binary records transfer in
order, and a stalled acknowledgement/reconciliation loop stops after five attempts
without discarding pending edits. Storage shows the queued change count and clears
obsolete errors when a refresh succeeds. Existing rate and storage budgets remain.

Regression coverage includes dismissed dialogs, retained edits across rate-limit
recovery/account rebinding, bounded stalled acknowledgements, and interrupted
multi-object downloads. Live recovery acceptance is pending deployment of this fix.

## Hosted follow-up — 2026-09-07

PR #6 merged as `5962ea5`. GitHub run 34182600002 passed both quality and deployment,
including the live commit, app-route and anonymous-account checks. Cloudflare event
inspection identified Bot Fight Mode as the cause of the previous runner failures.
The owner explicitly approved turning it off for the entire sevanlewispayne.com
zone; the toggle was verified off. Other security controls were not changed.

The public Mozilla PDF.js `basicapi.pdf` fixture imported into the selected cloud
library and reached Evidence ready. Entering Reader then exposed a lifetime bug:
the workspace header owned the account provider, so navigation disconnected cloud
identity. A single app-level storage host now preserves that provider across library,
source, lesson and reader routes. Header controls only open its dialog. A regression
test checks that the activated account is not unmounted when the header leaves or
returns. Web lint, types, 231 tests and build pass. Hosted Reader acceptance of this
follow-up is still pending at this record. Remaining source/Reader wording about
the retired encryption model is corrected to account cloud storage.

## First Cloudflare release candidate — 2026-09-07

The owner authorized public deployment, domain/DNS configuration and merging the
final version to GitHub `main`. Native Wrangler packaging now replaces the Sites
adapter. The workflow includes a quality-dependent production job on `main`,
serialized deployment, private-asset/development-key guards, migration application,
release stamping and post-deploy checks. GitHub `main` protection requires the
quality check and a PR and rejects force pushes/deletion. The previous PR is merged
and this checkout already includes the latest `origin/main`.

Clerk's production instance was created for `prism.sevanlewispayne.com`, with its
authentication domain isolated under `clerk.prism.sevanlewispayne.com`. Its live
public key is set as a GitHub variable; private credentials stay outside Git.
Production signing-key discovery, a two-minute maximum token lifetime, coarse
pre-authentication rate limiting and hourly deleted-account cleanup are implemented.
Public privacy/beta-use notices and a [release runbook](CLOUDFLARE_RELEASE.md) are added.

Local checks: full repository quality passed (23 Python tests, 228 web tests),
26 Worker tests pass, Worker types and native dry-run pass, and documentation links
pass. No production sign-in or cross-device claim follows from those results.

GitHub quality runs 34177208921 (PR) and 34177206819 (branch) passed for candidate
`171995e`; deployment correctly skipped outside `main`. Expanded Cloudflare login
permissions are approved and verified. A dedicated account-owned deployment token
is stored as `CLOUDFLARE_API_TOKEN` in GitHub's `production` environment, restricted
to branch `main`. Its permissions are Workers Scripts Write and D1 Write for the
account, plus Workers Routes Write and Zone Read for `sevanlewispayne.com`.
An initial token exposed in a diagnostic response was rotated before installation;
the replacement was transferred without printing its value. All five Clerk DNS
records are verified and both authentication certificates are issued.

The owner explicitly approved the live Clerk secret transfer, Google's User Data
Policy, public Google sign-in and hiding the unconfigured GitHub provider. Those
steps are complete. Google project `prism-sevan-production` has a production OAuth
client; its original exposed secret was replaced, disabled and deleted. Only the
replacement is installed in Clerk. No private credential is committed.

Candidate `171995e` is hosted at https://prism.sevanlewispayne.com. Exact-version,
homepage/library route and anonymous account-boundary checks passed. The owner
completed real Google sign-in, the Worker verified the account, and an empty cloud
library was created with the 1 GB allowance and Up to date status. No existing
browser PDFs were copied. A complete synthetic PDF transfer across independent
browser caches and password-account verification remain acceptance work; these
are not established by an empty-library check.

The follow-up authentication fix adds explicit Sign in / Create account controls
inside the existing popup. Clerk's duplicate account-portal footer is suppressed;
local sign-in URLs and forced library return URLs prevent the separate account
site and landing-page detour. General dialog button sizing no longer stretches
the password visibility control. Real local forms were switched both ways, with
the password input and visibility button measured at the same vertical center.
Web lint, types, 230 tests and build passed. Release PR #5 merged as `1e085db`.
GitHub run 34181701814 passed quality and uploaded production, but its hosted marker
check failed twice from the GitHub runner. The same exact main marker, app routes
and anonymous 401 check pass from the development machine. Verification now reports
HTTP/challenge failures separately from stale commits and allows three minutes for
propagation; a green automatic deploy remains pending.

Production Google sign-in was repeated after the popup fix: it returned to Library
with Account & storage open and reconnected the cloud library. A temporary folder
was saved, reported Up to date and survived reload; it was then removed. The local
file chooser is blocked until the browser extension has file-URL access. W3C's
sample URL correctly reported a browser download restriction. An older open tab
also encountered a missing lazy-loaded PDF chunk during deployment; refresh loaded
the current bundle. Cross-browser PDF/lesson acceptance remains incomplete.

## Popup regression and account switching — 2026-09-07

Fixed account-specific layout rules leaking into Help and Agent tools. Shared dialogs
now have a bounded reading width, padded scrolling body and stationary header;
the account workspace alone reserves a wider, stable size. Import title typography
matches the other dialogs. Background scrolling is locked while a modal is open.
The reserved page scrollbar gutter is released during that lock, eliminating the
white strip at the right of the backdrop. Signed-out accounts use a compact,
content-sized dialog with a shorter introduction and tighter provider spacing.

Storage and Account & security preserve their mounted panels, scroll positions and
in-progress choices. The active account binding no longer reconnects merely because
Clerk refreshes its token callback. ARIA tabs support arrow/Home/End navigation;
hidden panels are excluded from keyboard navigation and reset when the owner changes.
Clerk's internal `--accent` name collided with PRISM's appearance variable, leaving
the sign-in Continue button transparent. Namespaced account tokens fix that cycle,
and the remaining button gradient is removed without removing provider branding.

Browser checks performed in the in-app browser and a separate Chrome test tab:

- Help and Agent tools: desktop and 390 px layouts, body padding, readable wrapping,
  reachable footer actions, light/dark rendering, Escape dismissal and focus return.
- Account: identical measured dialog/tab geometry across Storage/Profile switches;
  profile editor remains open when switching away/back; profile/security views,
  mobile layout, isolated scrolling, close controls and no horizontal overflow.
- Chrome signed-out account: real provider form in both themes, mobile rendering,
  corrected solid Continue button contrast and no captured console errors.
  The final compact form fits without scrolling at 1280 × 800 and 390 × 844;
  at 390 × 600 the body scrolls safely while the close control stays visible.
  The modal backdrop reaches the viewport edge, with no reserved page gutter.
- Import: inspected layout and Escape/cancel focus return. Source confirmation:
  inspected long title wrapping and cancellation without deleting the source.
  Folder confirmation shares the tested component; cancellation/failure/pending
  behavior also has automated coverage.
- Viewport overrides and theme changes were reset, and the temporary Chrome tab closed.
  Existing sources, account details and agent permissions were not changed.

Regression tests cover panel persistence, owner-switch isolation, token-getter refresh
without reconnect, tab keyboard navigation, and wrapping around visible dialog controls.
The full web quality run passed 228 tests in 59 files; lint, TypeScript and the
frontend build passed again after the final sign-in styling changes. Reader figure/evidence dialogs retain their
independent layout rules and automated coverage; no new complete lesson rehearsal was
performed in this popup pass.

This verifies a local UI correction, not release completion. Production identity,
account lifecycle/security/usage controls and deployed cross-device storage acceptance
remain listed in the [account contract](../architecture/CLOUD_ACCOUNT_PROPOSAL.md).


## Account storage and Cloudflare provisioning — 2026-09-07

Supersedes the older documentation-only hosting entry below: Clerk username/password
and Google, 1 GB/account, 50 active accounts and 50 GB globally are the accepted target.
The account dialog is wider, separates profile/security from storage, removes the
recovery-key workflow, and fixes collapsed mobile header controls hiding open dialogs.
Desktop and 390 px profile layouts were inspected.

The local account-owned API passes 19 Worker tests for session verification,
ownership, immutable objects, quotas, concurrency, retries, deletion and re-enrollment.
Web validation passes 223 tests plus the newly added offline restoration case, with
lint, types and the frontend build. A synthetic PDF/folder client transfer into a
fresh device cache excludes agent grants. The actual signed-in browser created an
empty local account library, saved/synced a test folder, restored it after reload,
and deleted that test library. The original browser PDFs remained available.

With scoped owner approvals, Wrangler authenticated, private R2 `prism-library-files`
was created and D1 `prism-library` was initialized through migration 0002. A synthetic
remote R2 upload/download had matching SHA-256 hashes; the object was removed and
public r2.dev access is disabled. No private source was uploaded remotely.

The app still uses local D1/R2 emulation. No Worker/site/DNS deployment occurred.
Production identity, key rotation/revocation/account cleanup, measured operation/CPU
budgets and independent deployed-device acceptance remain gates. See the
[current account contract](../architecture/CLOUD_ACCOUNT_PROPOSAL.md).


## Hosting direction accepted — 2026-09-07, documentation only

The owner accepted the [Cloudflare/account contract](../architecture/CLOUDFLARE_HOSTING.md):
Worker Static Assets/Worker, Better Auth Google/GitHub login, D1, private R2, and
`prism.sevanlewispayne.com`; initial beta 50 users, 100 MB each, 5 GB globally.
Wrangler 4.129.0 is installed but unauthenticated. The owner is finishing local
changes before hosting. No account implementation, login, provisioning, deployment,
DNS change, or previous-host shutdown occurred in this documentation pass.
Older hosting entries below are historical test evidence, not current instructions.

## Release audit — 2026-09-07, local only

[Current release readiness audit](RELEASE_READINESS_AUDIT_2026-09-07.md) records
the tested checkout, live hosting status, remaining blockers, and current free-tier
account/domain recommendation. Started the latest local development app on port
5173 and rebuilt production app/Worker on 8787. Web checks pass (187 tests in 49
files), as do 23 companion tests, Worker types, full build, 102-page PDF corpus,
and local synthetic sync isolation/retry/revocation/deletion checks. Production
npm dependencies have no reported advisories; development tooling has four moderate
entries in one transitive chain.

A fresh frontend preview on port 4173 started empty, imported the licensed 489-page
regression PDF, rendered its contents destination, and restored page 305 after
reload at phone width. This does not complete lesson/revision owner acceptance,
account recovery, offline startup, security review, or public release. No learner
approval, cloud enrollment, deployment, DNS change, commit, or push was performed.

## Draft recovery and fresh-origin rehearsal — 2026-09-06, local only

- New lesson requests recover across navigation and reload within the same tab;
  explicit discard, save cleanup, and storage-unavailable feedback are implemented.
- Plan lists have loading, local retry, missing-plan recovery and stale-response
  protection. Agent progress reflects saved source-review checkpoints only.
- A visibly empty local origin imported and indexed the original five-page open
  fixture through the file chooser. Reload restored an unfinished request; visible
  save, site-tool discovery, complete source review, live checkpoint progress and
  opening the proposed four-section plan succeeded. Owner approval is pending.
- Web lint, TypeScript, 174 tests in 47 files and production frontend build passed.
  Main JavaScript is approximately 609 kB minified (173 kB gzip); the existing
  bundle warning remains. No deployment or measured startup improvement is claimed.
- This extends the [core product audit](CORE_PRODUCT_RELEASE_AUDIT.md). Full
  composition, revision acceptance and subsequent citation/persistence checks
  remain unverified; the rehearsal is not yet complete.

## Core product UI and continuity — 2026-09-06, local only

- [Browser audit, fixes, inspection matrix, and remaining release gates](CORE_PRODUCT_RELEASE_AUDIT.md).
- Fixed PDF page loss on resizing, effective phone zoom, Reader shortcuts behind
  dialogs, accessible library search/navigation, and stale or failed lesson loads.
  Simplified source overview and lesson creation; tightened saved-lesson spacing.
- Browser checks include desktop/phone Reader continuity and a saved synthetic
  lesson's citations, original-PDF round-trip with focus restoration, step controls,
  passage questions, and light/dark layout. No learner approvals were changed.
- Validation passed: web lint, TypeScript, 166 tests across 44 files, production
  frontend build, sync Worker type checking, and documentation checks (51 files).
  The main frontend chunk remains approximately 605 kB minified and emits the
  existing size warning; this is not a measured cold-start performance result.
- Production release, a fresh import-to-finished-lesson owner rehearsal, substantive
  revision acceptance, and the approved cloud login/recovery flow remain unverified.


## Authoring speed improvements — 2026-09-04, local only

- Added a lossless compact evidence format, saved-state continuation tool and
  single-batch anchor validation for source review checkpoints. The
  [implementation contract](LEARNING_EXPERIENCE_IMPROVEMENTS.md#latency-and-recovery)
  records the exact synthetic transport benchmark and its limits.
- Generic authoring guidance now emphasizes prerequisites, intermediate reasoning,
  worked examples and an early rendered-section check. No reference-source content
  or IDs were added to production code or discovery documents.
- Web quality gate: lint, type checking, 157 tests in 43 files and production
  frontend build passed. After the related-checkpoint selection refinement, all
  19 workspace/App tests passed again and the complete client/server build passed.
  Sync Worker types and all 46 documentation files passed their checks.
- Empty-library behavior passes. Release preparation rejects PDFs, local database
  files, symlinks and literal development source/lesson IDs. A temporary synthetic
  identifier was rejected by the guard and removed; the clean release contains
  276 client files and no bundled PDFs. A production-code scan found no reference
  source IDs or reference-lesson content. Existing browser-local work is untouched.
- The local preview responds on port 5174. No deployment was performed. Main
  JavaScript remains about 599 kB minified and triggers the existing size warning.
  End-to-end authoring latency and learning gains remain unmeasured after this
  change; transport savings must not be reported as a total generation speedup.

## Reading quality and owner-trial preparation — 2026-09-04, local only

The [reading-quality contract](LEARNING_EXPERIENCE_IMPROVEMENTS.md) records the
owner's approved scope. New requests default to preserving substantive content.
Finalization and revision require a source-to-passage coverage map; the reader
exposes that map and the plan's compression or omissions. Passage help now retains
the selected text and exact version, provides a manual-copy fallback, and appears
beside the passage. Background saves preserve the reader's position. Newcomer
guidance and local authoring-stage timings clarify the external-agent workflow.

**Verified locally:** `npm run quality:web` passes lint, TypeScript, 148 tests
across 42 files, and the production frontend build. Sync Worker type checking and
the complete frontend/Worker production build also pass. Markdown link checks
pass. The existing large-bundle warning remains; this pass does not demonstrate an
end-to-end generation-speed improvement. CI now includes Worker type checking and
the complete production build.

**Browser acceptance:** a fresh local library imported the public RLM v3 PDF and
indexed all 43 pages. The complete-paper request was saved with full explanations
and a flexible reading-time preference. The empty-library guidance, source page,
and saved request were inspected at desktop and 390-pixel widths; the saved request
survived reload. This is import, indexing and request-flow evidence, not approval
of a generated lesson or a complete accessibility audit. The publisher's official
geology chapter download failed through browser import and direct download; its
reference lesson remains pending source availability.

The subsequent [RLM authoring receipt](../experiments/REFERENCE_LESSONS.md#rlm-composition-receipt--2026-09-04)
records complete source review, owner-authorized composition and a ready saved
lesson: eight sections, 51 blocks, 96 mapped anchors, version 10 and successful
reopen. A real passage revision, human fidelity review and the geology rehearsal
remain pending. The [owner learning trial](../experiments/OWNER_LEARNING_TRIAL.md)
is prepared but has not started; no immediate, 24-hour or 7-day learning outcome
has been measured. Coverage-map validation checks references and completeness of
the map, not the truth of an explanation. No release was deployed, no remote
library was migrated, and the existing local changes were not committed or pushed.

## WebMCP discovery and authoring pass — 2026-09-04, local only

The owner explicitly withheld deployment. These changes are in the local checkout;
they have not been published to the hosted release described below.

- Registration now recovers from late browser API availability, exposes failures,
  and supports explicit retry. One bounded discovery loop serves all tools.
  App-level registrations survive route changes; React Strict Mode cleanup and
  stale asynchronous rejection are covered by regression tests.
- Agent tools shows browser availability, tools offered, and the last real tool
  call separately. It provides setup and recovery guidance without claiming an
  agent discovered tools just because the API exists.
- Startup context identifies source access, indexing, current work and next calls.
  Copied starter, brief and revision prompts explicitly use WebMCP. Public
  `llms.txt` and Markdown agent guidance derive from the runtime authoring guide.
- Full requested ranges are accepted by `read_source_packet`, with at most eight
  pages loaded per call and an exact `next_call`. Tests reconstruct dense/escaped
  text across continuations, preserve scans and image anchors, reject missing
  pages/corrupt cursors, and transport a 24-page fixture in three calls. This is
  a transport result, not a measured improvement in complete lesson generation.
- Error responses expose `isError`. Missing single-page evidence returns recovery
  guidance. Packet activity labels the requested scope, not all pages as read.
- `inspect_source_visual` accepts 1–4 selected views in a single contact sheet. It
  preserves single-page detail inspection and reports partial rendering failures.
  A native-browser check exposed premature completion before visible paint;
  completion now waits for React visibility and a paint opportunity.
- `get_source_visual_catalog` detects candidate raster/vector regions on demand,
  associates nearby caption previews and returns suggested crops. Caption
  continuation and adjacent body-text boundaries receive conservative handling.
  Bounds remain heuristic, with explicit warnings and full-page fallback. No
  native runtime, source upload, OCR or numerical chart extraction was added.

**Verified locally:** 139 web tests across 37 files, lint, TypeScript and production
web build pass. Generated agent documentation matches its runtime contract; local
Markdown links pass. The existing production bundle-size warning remains.

**Native-browser acceptance:** a fresh page at `localhost:5173` exposed the tool
registry, including the newly added catalog (31 tools in the final registry).
Calls used the actual browser host. `get_active_lesson_context`
worked on the library and after navigation to the 43-page Recursive Language
Models source. A request for pages 1–43 returned bounded evidence with exact
continuation arguments; invoking that continuation succeeded. The first two
packet calls took approximately 5.4 and 3.1 seconds through the host. The visible
application receipts recorded roughly 0.03 seconds for each local evidence
operation; host timing includes additional overhead and is not a model-generation
benchmark. The status dialog was visually inspected and correctly named the last
successful `read_source_packet` call. Existing source/lesson content was preserved.

A four-view render of RLM pages 2–5 completed in approximately 3.7 seconds through
the host, with all images visible in the immediate screenshot after the paint fix.
Cataloging those four pages took approximately 4.7 seconds and returned both raster
and vector candidates. Subsequent original-pixel inspection checked the detected
Figure 1 vector chart and Figure 2 raster diagram. The latter exposed a truncated
caption crop, which was corrected to include contiguous caption lines. Chart panels,
axes and the complete caption were visible in the checked Figure 1 crop. This is
specific acceptance evidence, not a universal segmentation or figure-quality result.

The local sync service was not running during this read-only browser-vault check;
this pass does not revalidate encrypted transport. No fresh end-to-end lesson was
generated, and no claim is made that every model automatically selects these
tools. Host support, host permissions and agent behavior remain prerequisites.
See [the integration contract](../architecture/WEBMCP_INTEGRATION.md) for primary
guidance and the distinction between registration, discovery and actual use.

## Final UI and recovery pass — 2026-09-03

The owner requested this pass before recording or submitting. Folder mode is
retired; browser-only storage and encrypted cloud sync are the two release modes.
Existing device folders are not deleted. Recovery-key downloads are available
during setup; an already connected browser can verify and export a pasted saved
key without sending its secret to the server. It cannot recreate a lost key.

Fixed the revoked-blob Reader reopen race by tying each PDF URL to its mounted
Reader session. Cancelled loads release their URL, retry creates a new session,
and failed outline metadata no longer blocks the original PDF. Loading surfaces
describe what is happening and provide back/retry controls instead of a letter P.

Narrowed Reader toolbar CSS so storage dialogs retain normal button dimensions.
Mobile controls use two rows, storage actions stack, and the guide remains
reachable on small screens. Overview and Lessons now share header typography,
spacing and actions. New lesson requests start with all source pages, keep the
request prominent, and put optional depth/length/prior-knowledge controls in a
disclosure. The understanding-questions checkbox is correctly sized.

Local browser acceptance used a real 43-page Physical Geology PDF in a disposable
Chrome profile, without creating a synced library or altering personal content.
Widths 1440, 390 and 320 pixels passed. Three Reader reopen cycles rendered PDFs
without page errors, header coordinates matched across source tabs, and a
disposable key downloaded with the expected `.txt` filename. Screenshots were
visually inspected. The sync availability response was stubbed in this isolated
UI check; it is not new evidence of production transport or full offline support.

Current automated gates: 119 web tests across 34 files, 23 API tests, web/Worker
type checks, lint and build pass. The older counts below include retired folder
tests. Hosted final verification and release references are appended after deploy.

The video and submission are deliberately pending. Earlier limits on independent
security review, offline/PWA support, browsers not exercised, and full live
lesson/revision conflict acceptance remain candidly recorded below.

The hosted native-browser check then exposed a concurrent Reader-position
conflict. Reading progress now merges automatically: the latest dated position
wins, while the furthest page from either browser is preserved. Authored content
and deletion conflicts still require a decision. A regression test exercises a
pending write chain, retained progress, ciphertext-cache invalidation, and refusal
to auto-merge deletions or lesson content. This is a correction to the final pass,
not evidence that arbitrary concurrent edits can be merged safely.

**Historical hosted verification:** Prototype v10 deployed successfully at
`2026-09-04T04:36:36Z` to the previous public preview.
The native browser remembered the existing encrypted library, automatically
cleared the reading-progress conflict, returned to Synced, and rendered the
489-page textbook after exit and immediate reopen. Its numbered, nested contents
contained 181 headings/bookmarks. The corrected storage dialog was visually
inspected in the native Reader. A clean Chrome profile opened `/sources` with
HTTP 200 and no sign-in, showed the mobile connection UI without folder controls,
and received the available sync-service response. Local mobile acceptance also
used a separate real non-CS PDF; no lesson or source was preinstalled.

Runtime changes are pushed to canonical `sevan-dev` through `fe0a3f6` in seven
focused commits. Historical publishing source: `e189a11a4542af96dbb97dde5f796ec271648e2a`.
Deployment: `appgdep_6a9a4aca12988191b4737f6e6c93d41f`. Build archives contain no
PDFs, keys or local state. Git contains one explicitly licensed public textbook
fixture solely for repeatable parser tests, not a learner-library seed.

**Date:** 2026-09-03  
**Status:** implementation and acceptance in progress; not yet submission-ready

## Agreed product contract

The owner approved this direction after the read-only audit. PRISM opens with an
empty library. A user imports their own document and works with an external agent
through WebMCP to create a section lesson, a chapter lesson, or a synthesis of a
long source. Length and reading time are soft targets; essential qualifications,
methods, examples, and reasoning must survive deliberate compression. The result
is a saved, formatted reading document, not an agent-generated PDF.

The agent may inspect original pages using browser vision while WebMCP controls
source selection, evidence retrieval, visual inspection, composition, and revision.
Showing an image does not prove the model has seen or understood it. Page inspection
must be exercised in the actual host. A source caption is not a substitute for pixels.

After reading, users can request a deeper explanation of a specific concept. The
agent updates the same lesson with a reviewable change and recoverable history.
Source expansion outside the agreed range still needs a new approved scope.

## Implementation sequence and acceptance

1. Remove the production sample installer and make the optional companion explicit.
2. Add bounded page inspection and resumable source reviews for long-scope planning.
3. Support soft length targets, optional questions, and compact range coverage.
4. Add subject-independent declarative visuals, accessible controls, and source crops.
5. Add proposed revisions, learner acceptance, stale-version rejection, and recovery.
6. Run the actual WebMCP workflow on independent sources and review its fidelity.
7. Validate a fresh public origin, persistence, keyboard/mobile use, privacy, and recovery.
8. Prepare public hosting, the open-source repository, and an authentic video under
   three minutes with audio. Publish only a reviewable, tested build.

All generated explanations and source-specific visual content are authored through
WebMCP. Reusable renderers and synthetic engineering fixtures are application code;
prewritten textbook lessons are not part of the released library.

## Evidence boundaries

Structural validation, agent semantic review, and human acceptance are distinct.
Neither valid citations nor a completed extraction implies correct interpretation.
Keep the original Reader available for every page, including scans and damaged text.
No claim of general PDF coverage or improved learning efficacy is warranted by two
successful demonstrations. Diverse held-out documents are required for broader claims.

The demonstration sources are [Recursive Language Models](https://arxiv.org/abs/2512.24601)
and the new judge-rehearsal source, [Global Carbon Budget 2025](https://essd.copernicus.org/articles/18/3211/2026/).
The [Physical Geology, second edition](https://opentextbc.ca/physicalgeology2ed/)
chapter remains part of the parser regression corpus, not a completed lesson demonstration.
Check each reused figure's license and attribution. PRISM remains free and requires
no account; external agent access and inference follow the user's provider terms.

## Related contracts

- [Lesson contract](../product/INTERACTIVE_LESSON_SPEC.md)
- [Document intelligence](../architecture/DOCUMENT_INTELLIGENCE.md)
- [Prior implementation evidence](LESSON_QUALITY_RESET.md)
- [Challenge plan](WEBMCP_CHALLENGE_PLAN.md)
- [Reading release execution plan](READING_RELEASE_EXECUTION.md)

## Acceptance log

- `npm run quality:web`: 104 tests in 27 files pass; ESLint, TypeScript, and Vite production build pass. Adds lossless evidence-packet continuation, retry identity, direct lesson routing, bounded figure rendering, raster header limits and public PDF download failure cases. The build reports a main JavaScript chunk slightly above 500 kB; runtime lesson-generation latency remains a separate measurement.
- `npm run quality:api`: 23 tests pass; Ruff and mypy pass. This is the optional companion, not a required hosted backend.
- `npm run audit:pdf`: 102 real PDF pages across RLM v3, Physical Geology chapter 10, and BERT pass the specified regression assertions. See the [corpus report](../../benchmarks/PDF_CORPUS.md) for document hashes, metrics, and limits. The corpus does not establish broad OCR or semantic correctness.
- `npm run check:docs`: local document links and fences pass. `git diff --check` passes.
- Browser/WebMCP: after actual owner approval, the full 43-page RLM source was composed through WebMCP into a seven-section, 29-block lesson, saved for reading at version 11. It contains four original figures and was reviewed by the owner as a useful start with speed and visual-quality problems. The earlier pages 1–17 proposal is a separate, narrower plan. The developer's existing library is not the production initial state.
- The app now registers 30 tools. A warm-index sequential `read_source_packet` run retrieved all 43 pages in 13 calls over 38.934 seconds: 809 elements, 137,084 extracted-text characters, and a largest response of 38,387 characters. This is about 70% fewer calls than a minimum one-call-per-page workflow. It measures transport including host tool overhead, not model reading, visual interpretation, generation, approval, or final review. No end-to-end 2–4 minute claim has been established.
- Original figure rendering now responds to display size and zoom, with memory limits, fit-width and uncropped-page context. The existing saved lesson opens at its own `/lessons/:id` URL. Public PDF imports use the same local import pipeline, bounded HTTPS downloads and local-file fallback for browser access restrictions. AI-generated PNG/JPEG attachments have an unconditional visible label and explanatory provenance; actual generation depends on the external agent's image capability.
- Earlier approval failure: automatic review correctly rejected agent self-approval during testing. Subsequent owner approval authorized the full-paper composition above. Agents still cannot approve new plans or accept revisions on the learner's behalf.
- Browser rendering check: the original page-2 figure rendered at 933 x 586 pixels at fit width and 1866 x 1172 pixels at 200% zoom, both reaching a stable ready state. Full-page context rendered successfully. Escape closed the viewer and restored focus to its trigger. Selecting the full-paper lesson from the source collection resolved to that exact dedicated lesson URL.
- Hosting: the owner-only deployment succeeded on the previous preview origin on 2026-09-04 at 00:45 UTC. The initial browser response is the preview host's expected sign-in gate; application behavior behind that gate remains to be verified. This private preview is not yet the no-login public submission. The static archive contains 274 files, excludes PDFs/local state, and carries same-origin PDF.js resources. Its source snapshot is limited to the web application. The first broad-source upload was blocked by automatic approval review; a smaller payload and connector-verified owner-only destination passed the subsequent review. Canonical GitHub release and public access remain outstanding.
- New non-CS rehearsal: the 78-page carbon assessment exposed an indexing-worker startup failure. The explicit PDF.js worker-port/resource-fetch repair allowed the original import to finish all 78 pages. Full packet retrieval and an approximately 3,800-word draft are complete; the seven-section plan awaits learner approval. About 20 minutes to this point fails the speed target. See the [execution record](READING_RELEASE_EXECUTION.md#judge-rehearsal---2026-09-03) for evidence and exclusions. No completed-generation or accepted-revision claim yet.

Outstanding release evidence: fresh hosted-origin persistence and source inspection;
approved non-CS composition and live same-lesson revision; timed complete generation; human review of
instructional depth and visual usefulness; full keyboard/mobile acceptance; final public
access check; public repository release; recorded video and submission. These remain
requirements, not completion claims.

### Public access and storage correction — 2026-09-03

At the owner's request, the previous preview's audience became public. A fresh HTTP
request with no cookies or authorization returned status 200 at
the previous preview's `/sources` route, with the PRISM application
shell/assets and no sign-in gate or redirect. Public access is verified; this does
not publish browser-vault sources or establish every application acceptance gate.

The owner rejected browser-profile isolation as the final meaning of local storage.
Chrome and the Codex in-app browser were inspected at the same hosted URL: Chrome
contains the imported 489-page textbook, Codex is empty. The empty-library default
works, but a device-owned shared library remains an architecture gap. See
[storage and approval decisions](../decisions/OPEN_QUESTIONS.md#device-owned-library-and-approval-friction).


### Shared folder and Reader contents — 2026-09-03

Implemented a learner-selected physical library folder, with PDFs and binary assets
in ordinary files and source/lesson/revision records in append-only JSON history.
Browser caches can be reconstructed from that folder. The connection dialog explains
native permissions, browser compatibility, initial migration, logical deletion,
cloud-provider storage, offline availability and one-editor-at-a-time use.
A new folder preserves the original browser library. Existing populated folders
open without implicitly merging unrelated browser records. Source-agent grants are
not transferred between browsers.

Reader navigation now displays numbered nested branches, per-branch disclosure,
expand/collapse all, ancestor-preserving search and current location. The parser no
longer caps bookmark depth at four. Missing subheadings are supplemented only under
matching source-numbered parents; source numbering and fallback outline numbering
are distinguished in the UI.

Validation: 111 tests in 29 files, TypeScript, ESLint and the production build pass.
New tests cover independent cache restoration (including binary figures and record
deletions), exclusion of agent grants, interrupted disk writes, stale writers,
concurrent-branch detection, aborted database transactions and six-level navigation.
The Library storage dialog was opened and visually inspected in the actual local
Codex browser. Live native-folder selection, cross-browser reuse and multi-device
cloud sync remain unverified pending learner selection. Conflict recovery stops
editing and retains both histories; automated conflict merging is not implemented.
The universal source/task approval inbox remains separate unfinished work.


Destination-flow correction: the learner selects a destination, and PRISM creates
or reopens its own `PRISM/` subfolder. Selecting an existing library folder directly
also reopens it without adding a nested folder. Protected destinations can still be
blocked by the browser. Cancelled or blocked selection now displays an explanation;
PDF copying and record saving show explicit progress. The earlier silent abort was
observed by the owner; a successful native picker round trip remains unverified.


Public release: the folder/destination and Reader contents update deployed
successfully to the existing public PRISM site on 2026-09-04 at 01:40 UTC. The
validated static archive contains 274 files, including hosting metadata, with no
personal sources or library data. Canonical GitHub history was not changed. A final
Reader toolbar fit correction passed ESLint, TypeScript and a fresh production
build after the 111-test run. Native-folder and cloud-provider acceptance remain
pending; deployment success is not evidence that the browser granted folder access.


### Protected destination correction — 2026-09-03

The learner reproduced Chromium's native restricted-directory dialog at the
Documents root. Chromium explicitly blocks selecting entire Documents, Desktop,
Downloads and home folders while allowing appropriate descendants. This occurs
before PRISM receives a directory handle. Therefore the previous automatic
parent-destination flow cannot create PRISM under those protected roots.

The corrected picker starts in Documents as a browsing location. The learner
selects an existing PRISM library or uses the native picker's New folder control
once. Empty folders named PRISM are used directly without creating PRISM/PRISM;
other allowed destinations still receive a PRISM child. Existing nonempty folders
without a manifest are not overwritten. The app cannot suppress the browser dialog,
automatically create a child of a blocked parent, or grant its own folder access.
The agent can prepare a dedicated folder on this owner's machine, but that local
assistance is not a capability available to arbitrary website visitors.

Primary evidence: [Chromium protected-path rules](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/file_system_access/chrome_file_system_access_permission_context.cc).


Protected-folder correction validation: 112 tests across 29 files, ESLint,
TypeScript, production build and documentation checks pass. The new regression
covers direct reuse of a freshly created PRISM folder and preservation of unrelated
files in a nonempty same-named folder. An empty Documents/PRISM folder was created
on the owner's device through the local development host; no browser access grant
or source import was performed on the learner's behalf.

### Embedded-browser folder retry — 2026-09-03

The owner confirmed the picker opens but selecting PRISM fails. The live page
remained in its original browser-only state, showing a picker rejection before
PRISM received a folder handle. This is distinct from the earlier Documents-root
restriction. The exact host failure remains unverified.

Implemented separate selection and write permission, same-session permission retry
using the selected handle, stage-specific native diagnostics, controls/errors near
the top of the dialog, and shared initialization for concurrent restore callers.
No browser restriction is bypassed. Live native-folder success and reopening across
app restarts remain acceptance gates; controlled tests do not establish host support.

Validation for the folder retry change: 12 focused tests across folder journaling,
permission recovery and the storage dialog pass, along with ESLint, TypeScript,
the production build and all 37 documentation-link checks. The updated dialog was
inspected in the running local in-app browser. Native selection requires the
learner's next attempt; it was not simulated or granted on their behalf.
The folder retry update deployed successfully to the existing public site at
2026-09-04 02:07 UTC. The static release contains 274 files and no personal library
data. Native embedded-browser folder acceptance remains unverified.

### Release blocker: desktop directory access — 2026-09-03

The owner reproduced failure with the read-only picker in public release 5. Local
inspection of the installed ChatGPT/Codex desktop build 26.901.1978.0 found the
in-app browser session's permission handlers reject `fileSystem` requests. The
picker API is exposed and opens a Windows dialog, but no directory handle is
returned. Direct folder access in this host is blocked, not merely untested.
Do not ask the owner to keep reselecting the same folder or report this fixed by
PRISM-side picker changes. See the verified host evidence in
[device-local architecture](../architecture/DEVICE_LOCAL_WEB_ARCHITECTURE.md#confirmed-desktop-host-restriction--2026-09-03).
The owner rejected a companion and a browser-peer dependency. The replacement
[synced-library design](../architecture/SYNCED_LIBRARY.md) specifies independent
native-browser access, encrypted cloud storage, account-free enrollment, and real
cross-browser lesson-revision acceptance. The owner approved encrypted remote
copies; implementation and measured results are recorded below.

### Encrypted independent-browser sync — September 3

Implemented a prototype Worker with D1 authorization/revision metadata and private R2
encrypted chunks, browser Web Crypto, atomic local outbox, resumable uploads,
idempotent commit retries, per-record conflict detection, revocation and deletion.
Recovery-key enrollment replaces folder permissions in the main sync workflow.
Source grants remain separate. Local and folder originals are retained during opt-in.

The hosted native browser imported and indexed the 43-page Physical Geology
chapter (12.34 MB). Chrome connected to the same library, received its index,
downloaded/decrypted its PDF and rendered the original photograph and caption.
With Chrome's test tab closed, native WebMCP created a source-bound brief. A new
Chrome tab remembered its enrollment and displayed the same brief ID
`brief_d7d28f74-f721-4a70-8833-26240bafb522`. No lesson content was seeded in code.
This proves a source/brief vertical slice, not complete lesson/revision acceptance.

Hosted transport/security checks passed encryption round trip, isolated-library
authorization, competing-head rejection, retry idempotency, device revocation,
cross-origin rejection and deletion in 6.58 seconds, excluding final cleanup.
The earlier full suite passed 124 tests across 33 files; final App/storage-dialog
regressions passed 13 tests. Lint, web and Worker types, build and 38 documentation
checks passed. Anonymous public access was verified without cookies or sign-in.

Live testing found that Workers require an explicit SPA asset fallback on the previous host;
using `/index.html` then caused a redirect to `/`. The final fallback serves `/`
internally so the user's exact source/lesson route is preserved. Final deployment
and manual-redirect checks are recorded in the sync architecture document.

Still open: complete lesson/revision synchronization with learner acceptance,
browser-level interrupted transfer and conflict recovery, full offline/PWA
behavior, Firefox/Safari/Edge and an independent security review. The new protocol
must not be described as audited or universally browser-compatible. The local
Wrangler background process also exited intermittently during rebuilds; the
hosted service works independently of it. Existing personal libraries have not
been automatically uploaded into the test library.

### Upload access and incremental review — September 8

The owner explicitly replaced the import checkbox with automatic source access
on successful visible upload. Import disclosure, per-source revocation, plan
approval and revision acceptance remain. Draft coverage checkpoints, pending
review diagnostics, targeted reads and a larger bounded section response reduce
repeated transport. Finalization still requires complete coverage and an agent
semantic review; invalidated entries cannot be reused.

Local checks cover 247 web tests, lint/typecheck, build, documentation and release
privacy checks. Browser inspection confirmed the import disclosure and absence of
the checkbox. The deterministic 13-section read workload fell from 39 to 13 calls;
this is not an end-to-end generation benchmark. PR/CI and live release evidence
must be checked before claiming publication. The owner identified Astra low. The original task trace confirms direct WebMCP
and browser controls: 39 outer tool calls total 264.687 seconds of its 1,779.974
second composition turn. The remaining 1,515.287 seconds is outside recorded
tool execution; the trace does not separate generation, reasoning and host delay.
