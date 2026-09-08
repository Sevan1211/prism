# Core product browser audit — 2026-09-06

Status: local implementation and browser inspection, not public-release acceptance.
The main review build remains available at `http://127.0.0.1:5173/sources`.

## Findings fixed

| Priority | Finding and evidence | Result |
| --- | --- | --- |
| P1 | Resizing a long PDF from desktop to phone width changed the current page from 86 to 219. Pixel scroll position was being interpreted against new page sizes. | Reader retains a page-relative anchor and restores it when viewport, rail, or page dimensions change. The scroll handler checks layout changes before recording a new reading position. Desktop/phone transitions, contents toggling, and zoom retained page 86 in the browser. |
| P1 | PDF zoom was capped by available width, so increasing zoom on a phone did not meaningfully enlarge the page. | Zoom now scales the fitted page size; horizontal scrolling remains inside the PDF pane. Mobile page width increased while the page number stayed stable. |
| P2 | Reader keyboard shortcuts did not exclude open modal dialogs. Escape could also execute the underlying Reader exit action. | Reader shortcuts defer to active dialogs and previously handled events. Browser check: Escape closed help and stayed on the same PDF page. |
| P2 | Library rows overrode native link semantics with `role=listitem`. | List items now contain real links. Main-library navigation and accessible link names were verified in browser and regression checks. |
| P2 | Source filtering lived in a sidebar that disappears at smaller widths. | The main library now has search, a result count, a helpful no-match state, and Clear search. Phone filtering, reset, and opening a source were exercised. |
| P2 | Lesson navigation could retain an earlier lesson while the next one loaded. Failed storage reads resembled missing lessons or composition that had not started. | Lesson sessions reset by identity; reader and draft components show loading/error/retry states. Request sequencing prevents older asynchronous responses from replacing newer results. Regression checks cover navigation and recovery. |
| P2 | Lesson opening put excessive vertical space between title, version, coverage, draft status, and explanation. | Tightened metadata spacing without hiding draft or coverage qualifications. Narrow screens start with contents collapsed; the Contents control remains available. |
| P2 | Lesson creation repeated large introductory headings and opened the form without moving focus to it. | Removed redundant visible heading when no plan is selected, shortened the introduction, moved detailed fidelity guidance into a disclosure, and focused Lesson name on opening. The fidelity contract and defaults are unchanged. |
| P3 | Source overview used abstract instructions and prioritized a large metadata block. | Plain continuation copy and collapsible source information put reading and lessons first. Unindexed source details remain expanded so indexing is discoverable. |
| P3 | Search showed only “0 results”; fit labels were clipped. | Added actionable no-match copy with status semantics and widened the desktop fit control. Workspace skip-link targets are focusable. |

## Browser inspection and exercised flows

Inspection used the in-app Chromium browser through computer-use tooling, with
desktop and 390px phone layouts. Existing libraries were preserved. The other
local origin contained a previously saved, original synthetic packet-switching
fixture and its lesson; this enabled lesson inspection without creating learner
approvals. No private source text or identifiers are copied into this report.

| Surface | Observed or exercised | Limit |
| --- | --- | --- |
| Source library | Populated list, search/no-match/reset, row navigation, responsive header | Empty-library behavior has automated coverage; inspected alternative origins already held prior local data and are not fresh-browser evidence. |
| Source overview | Read/lesson links, indexing status, source details disclosure, visible agent-access boundary and activity | No permission grant/revocation or source deletion was performed. |
| Lesson requests | Empty planning state, saved lesson list, form opening/focus, scope and advanced fields | No request was submitted to a user's real source during this pass. |
| Original PDF | Long-document rendering, remembered-page navigation, page controls, contents, details, search, zoom, viewport transitions | This is a local continuity check, not a representative performance benchmark across devices or all PDF geometries. |
| Reader help | Open, mobile layout, Escape, return to Reader | Keyboard/modal behavior checked in Chromium; no screen-reader application session. |
| Import dialog | File/URL entry surface, rights selector, mobile layout, cancellation and restored focus | No new file import completed in this audit. Fresh import/index/reload remains part of release rehearsal. |
| Saved lesson | Desktop dark and mobile light/dark rendering, equation, definition, diagram relationships, table, worked example, draft/coverage labels | Existing synthetic content was inspected for UI behavior, not certified as a complete faithful lesson. |
| Lesson steps | Next advanced the displayed step; static-sequence alternative present | Reduced-motion and visual renderers also have existing automated coverage; no full assistive-technology certification. |
| Evidence | Citation opened its original page region; full-page Reader opened page 2; returning restored focus to the cited passage | Existing synthetic fixture only; no broad figure-extraction accuracy claim. |
| Refinement | Ask about this opened passage-specific agent request; clearing selection closed it | No request sent to an agent, no revision accepted, and no approval state changed. |
| Storage | Browser-only state, sync unavailable message and disabled unavailable-service actions | Cloud account/recovery, cross-device conflicts, and production service operations were not exercised. |
| Agent status | Help, 32 offered tools, retry/help affordances, registration versus discovery explanation | Registration is not proof of a completed external-agent authoring session. |

Browser error logs for the inspected synthetic lesson were empty. The initial
resize reproduction changed the long-document current position; it was restored
to page 86. Reading navigation can advance the exposure-only “furthest reached”
marker; this audit does not reset it or treat it as learning evidence.

## Validation

- Web lint, TypeScript, regression suite, and production frontend build are required
  after these changes. See the current receipt in [submission readiness](SUBMISSION_READINESS.md).
- New regression coverage targets layout anchoring, modal Escape isolation, main
  library filtering/link semantics, lesson identity changes, and load-error recovery.
- Existing tests cover source/lesson persistence, consent boundaries, proposed-plan
  approval, citations, lesson representation safety, revision/outcome behavior,
  and source-independent startup. Passing mocks do not establish browser acceptance
  for every state.
- Main JavaScript still exceeds the build's 500 kB warning threshold, approximately
  605 kB minified. PDF and rich-text rendering remain separate chunks. Cold-start
  and large-source interaction timing need a representative measured budget.

## Remaining release gates, in order

1. **Run the complete owner rehearsal.** Start with a genuinely empty browser
   profile, visibly import an openly licensed source, save a brief, discover site
   tools from the intended agent, review source scope, obtain learner plan approval,
   compose and inspect the full lesson, request and accept one substantive revision,
   reload, and reopen citations. Record elapsed authoring time and any lost work.
2. **Repeat with a non-computing source.** Use the same core workflow with real
   figures/qualifications. Source fidelity and usefulness need human review, not
   just structural validation.
3. **Finish the approved cloud experience.** The [release plan](FINAL_PORTFOLIO_RELEASE_PLAN.md)
   specifies optional account-backed login/recovery; current visible UI still
   describes an encrypted recovery-key prototype. Decide and implement release
   scope before promising cross-device cloud behavior. This pass does not replace
   the approved architecture with a new sync design.
4. **Completed locally: unfinished editing and plan-list states.** New-lesson
   drafts recover from tab-local session storage after navigation or reload, with
   explicit discard and a storage-unavailable notice. Successful save clears the
   draft; failed save retains it. Form editing is disabled during save. Plan lists
   now distinguish loading, failure/retry, and a missing plan, and reject stale
   asynchronous responses. Review progress counts the union of saved checkpoint
   pages, discloses unresolved visual reviews, and never implies agent execution
   or lesson completion. Closing the tab is outside the draft-retention promise.
5. **Verify deployment and recovery.** Exercise offline reopen, storage-denied and
   quota conditions, interrupted import/indexing, deletion warnings, cloud recovery
   and conflict flows where offered, and deep-link reloads on the actual host.
   Check keyboard-only use and a real screen reader, plus another browser and
   touch device. None of these are implied by local Chromium success.

UI review criteria included keyboard access, semantic controls, predictable focus,
responsive overflow, and actionable error states, informed by the
[Vercel interface guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).
PRISM's own source fidelity, privacy, and learner-approval contracts remain governing.

## Fresh-origin rehearsal follow-up — 2026-09-06

Started an isolated local origin with a visibly empty library. Imported the
project-authored Apache-2.0 five-page packet-switching primer through the browser
file chooser and verified all five pages indexed. This is a fresh storage origin
in the existing Chromium browser, not a new browser installation or profile.

Entered a full-scope request, reloaded before saving, and verified draft recovery.
Saved the request through the form. Site-tool discovery and calls worked; read the
complete source packet and manifest, inspected original pixels, and saved a
five-page review checkpoint. The UI correctly showed five of five reviewed pages
while explicitly withholding a lesson-completion claim. Proposed and opened a
four-section plan: 38 core elements and 15 repeated running labels retained in the
original. No learner approval was performed and no lesson was composed.

The live plan awaits owner approval. Composition, full lesson inspection,
substantive revision acceptance, and persistence/citation checks after composition
remain outstanding. No end-to-end timing or fidelity conclusion is claimed.
Existing user-source consent was not changed; fixture content was not bundled
into production startup.

Follow-up validation: web lint, TypeScript, 174 tests across 47 files, and the
production frontend build passed. The main chunk is approximately 609 kB minified
(173 kB gzip), retaining the existing bundle-size warning. Automated regressions
cover draft isolation/recovery/discard/storage failure, progress counting, and
plan-list retry/missing-plan recovery. Browser verification covers reload and
navigation recovery, discard, visible save, live checkpoint progress, and plan
review. This receipt supplements the earlier inspection matrix above.

## Contents scanner implementation — 2026-09-06

Implemented a derived PDF navigation scanner without changing evidence-index
versions, source bytes, lesson anchors, or access grants. The PDF opens while a
local worker scans; a bounded cache avoids rescanning for each agent cursor.
The pipeline combines geometry, repeated-margin suppression, wrapped titles,
printed-contents matching with corroborated destinations, and authored-bookmark
preservation. Navigation now retains vertical destinations and tracks detected
headings within a page. The agent map is cursor-paged, and the reader discloses
unmatched printed entries under **About these contents**.

Browser checks in the owner's existing local library:

| Source profile | Before | Verified result |
| --- | --- | --- |
| 531-page textbook with weak contents | 306 candidates, predominantly repeated chapter headers plus table/terminal rows | 404 entries; sampled repeated headers and table/terminal false positives absent; chapter starts and the permissions subsection recovered; six printed entries still unresolved |
| 793-page architecture textbook | 665 headings and bookmarks, with repeated running sections and contents-page destinations | 322 entries; each of three previously repeated sections appears once; one sampled click lands at the actual heading with space above it |
| 1122-page textbook with a strong authored outline | 438 native bookmarks | 438 bookmarks and 261 deeply numbered entries retained |

These are navigation checks, not an exhaustive heading-recall benchmark. Counts
do not establish correctness on every page. One chapter-level entry remains
unresolved in the first book; a nearby detected subsection is not proof that its
chapter boundary is correct. Some printed rows in the second source are also
unmatched by the fallback even though native bookmarks may supply navigation.
No private source bytes, source-specific fixtures, or source IDs were added.

Synthetic regressions cover running headers, mini-contents, table/terminal rows,
centered and letter-spaced titles, deep numbering, stable IDs, untouched evidence,
unreadable pages, rejected guessed destinations, bookmark merging, PDF vertical
destinations, cursor continuity, and immediate reading during a pending scan.
Final checks passed: web lint, TypeScript, 187 tests across 49 files, frontend
production build, and documentation validation.
The frontend build retains its existing main-bundle-size warning (approximately
620 kB minified). This is local implementation and browser evidence, not deployment
or a claim of complete universal extraction. OCR, additional format importers,
learner corrections, and a broader independently labeled evaluation corpus remain
follow-up work.
