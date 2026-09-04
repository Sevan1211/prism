# Submission readiness

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

Current automated gates: 118 web tests across 33 files, 23 API tests, web/Worker
type checks, lint and build pass. The older counts below include retired folder
tests. Hosted final verification and release references are appended after deploy.

The video and submission are deliberately pending. Earlier limits on independent
security review, offline/PWA support, browsers not exercised, and full live
lesson/revision conflict acceptance remain candidly recorded below.

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
- Hosting: the owner-only Sites deployment succeeded at [PRISM](https://prism-reading.sevan4355.chatgpt.site) on 2026-09-04 at 00:45 UTC. The initial browser response is the expected ChatGPT sign-in gate; application behavior behind that gate remains to be verified. This private preview is not yet the no-login public submission. The static archive contains 274 files, excludes PDFs/local state, and carries same-origin PDF.js resources. Its source snapshot is limited to the web application. The first broad-source upload was blocked by automatic approval review; a smaller payload and connector-verified owner-only destination passed the subsequent review. Canonical GitHub release and public access remain outstanding.
- New non-CS rehearsal: the 78-page carbon assessment exposed an indexing-worker startup failure. The explicit PDF.js worker-port/resource-fetch repair allowed the original import to finish all 78 pages. Full packet retrieval and an approximately 3,800-word draft are complete; the seven-section plan awaits learner approval. About 20 minutes to this point fails the speed target. See the [execution record](READING_RELEASE_EXECUTION.md#judge-rehearsal---2026-09-03) for evidence and exclusions. No completed-generation or accepted-revision claim yet.

Outstanding release evidence: fresh hosted-origin persistence and source inspection;
approved non-CS composition and live same-lesson revision; timed complete generation; human review of
instructional depth and visual usefulness; full keyboard/mobile acceptance; final public
access check; public repository release; recorded video and submission. These remain
requirements, not completion claims.

### Public access and storage correction — 2026-09-03

At the owner's request, the existing Sites audience is now public. A fresh HTTP
request with no cookies or authorization returned status 200 at
`https://prism-reading.sevan4355.chatgpt.site/sources`, with the PRISM application
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

Implemented a Sites Worker with D1 authorization/revision metadata and private R2
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

Live testing found that Workers require an explicit SPA asset fallback on Sites;
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
