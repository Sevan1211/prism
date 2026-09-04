# Reading release execution plan

**Agreed:** 2026-09-03. **Status:** judge rehearsal in progress; generation, revision acceptance and hosted checks remain open.

## Outcome and boundaries

A person imports a PDF, states a goal, approves its coverage, and quickly receives a
substantive, editable reading document at its own URL. The agent authors every
source-specific explanation and visual through WebMCP. PDFs remain original evidence.
The public library starts empty. Browser storage remains local, with no required account
or PRISM-funded inference. Existing documents and approved lessons must survive changes.

The product is domain-neutral. Visual frequency follows explanatory value, not a quota.
Text-heavy and visual-heavy lessons are both valid. Support exact tables and charts,
relationships and processes, original figure regions, and imported raster illustrations.
AI-generated images always carry a visible, non-optional label and explanatory provenance;
they never become original evidence, measured data, or a substitute for a source figure.
Generation is supplied by a capable external agent, not silently purchased by PRISM.

## 1. Reduce authoring round trips

- Add a bounded multi-page evidence read with compact stable citations, extraction
  warnings, continuation, and explicit evidence completeness. Do not silently skip text
  to fit a response, or replace the source with an unreviewed summary.
- Include caption candidates and page-image anchors in the same read. Inspect relevant
  original pixels; uncertainty remains visible. Existing one-page reads remain compatible.
- Keep patch receipts small even while an incomplete draft has many validation errors.
  A committed write must not be reported as a response-size failure. Expose counts and
  bounded actionable details. Provide a safe retry identity for section writes.
- Reuse indexed source data and saved reviews. Revise only the affected lesson section.
- Show progressively saved sections and source coverage. Keep user approval separate
  from agent validation. Record elapsed tool time without source text in activity records.

**Gate:** a representative 43-page source needs materially fewer reads; complete text and
anchors survive cursor traversal; no oversized write receipt or duplicate retry writes.
Compare cold import and warm index separately. Proposed warm-index targets with a fixed
host/model: first useful section in 30–60 seconds, completed detailed lesson in 2–4 minutes.
Do not publish these as measured claims until a timed real WebMCP run meets fidelity gates.

## 2. Preserve source visual quality

- Render PDF crops at display-size/device-density resolution, with bounded memory.
- A proper viewer offers zoom, fit width, full original-page context, and scrolling/panning.
  Enlarging must request additional PDF detail rather than stretch a small bitmap.
- Keep axes, legends and captions available. Provide original-page context when a crop
  cuts something off; suggested regions are candidates, never guaranteed detections.
- Keep stable region references available to the agent; allow agent/user correction through
  normal composition/revision flows. Never overwrite an approved lesson silently.

**Gate:** paper figures, dense tables and a textbook illustration are legible at intended
sizes; enlarged rendering gains pixels; errors retry; keyboard close restores focus.

## 3. Dedicated reading navigation

- Separate the source's lesson collection from an individual reading route.
- Give lessons stable URLs, section anchors, title/breadcrumbs and missing-record handling.
- Preserve old plan links; resolve to the exact record instead of silently choosing another.
- Provide a wide reading workspace, readable prose measure, full-width figures/tables,
  collapsible contents, and a route back from evidence to the same lesson location.
- Check direct load, refresh, back/forward, small screens and hosted SPA fallback.

**Gate:** opening any saved lesson lands on that lesson; no stale dropdown or unrelated
fallback; existing old links work; source inspection returns to the invoking passage.

## 4. Purposeful, extensible visuals

- Strengthen the authoring guide with task-based representation choices and no quotas.
- Extend the domain-neutral chart grammar where a concrete useful comparison needs it.
  Exact data, units, assumptions, captions and static tables remain inspectable.
- Avoid text slides disguised as animations. Use steps for changes in state, structure,
  causality or evidence; static views must contain the equivalent explanation.
- Add local image assets that agents can attach through a bounded WebMCP ingestion path.
  Validate raster bytes/dimensions, reject executable formats, enforce provenance, and
  retain alt text, attribution and an unconditional AI-generated label when applicable.
- No arbitrary agent JavaScript, HTML, remote tracking images or source-specific code.

**Gate:** generated images cannot masquerade as source-authored; missing assets fail
  visibly; charts preserve exact values; reduced-motion and keyboard paths remain useful.

## 5. Continuous import and revision

- Preserve the lesson request through visible local-file selection and indexing.
- Support public PDF URL import where browser access permits, with bounded downloads,
  cancellation, clear failure and local-file fallback. Do not bypass browser file access.
- Use one import pipeline for user and agent entry points; access consent stays distinct.
- Demonstrate same-lesson revision, stale-version handling and recovery after refresh.
- Prioritize portable local export/import if separate browser stores obstruct the rehearsal.

## 6. Release evidence and publication

Run focused contract tests for each risky boundary, then the web quality gate and relevant
PDF corpus checks. Rehearse through actual WebMCP on a fresh library, a two-column paper,
a non-CS textbook chapter, equation-heavy content and a scan. Report unsupported extraction
honestly; valid anchors do not prove interpretation. Check both light/dark and narrow/wide
reading, input focus, original figures, loading, missing files and cancellation.

Update [submission readiness](SUBMISSION_READINESS.md) with actual evidence. Public hosting,
repository release and a short authentic video remain separate gates. Do not confuse a
local build, a registered Sites project or structural checks with a submitted entry.

## Change record

- Implemented: eight-page evidence packets with lossless continuation; compact patch
  receipts and retry IDs; separate activity notifications and tool duration receipts;
  dedicated lesson URLs and a wide reading workspace; responsive PDF rendering,
  zoom/pan and full-page context; line/bar/scatter/area charts with exact data tables;
  bounded local AI illustration assets with enforced labels and provenance; public
  URL import in the visible UI and WebMCP through the existing local import pipeline.
- Verified transport: the existing 43-page RLM index required 13 sequential WebMCP
  calls in 38.934 seconds, preserving 809 elements and 137,084 extracted characters.
  Largest response: 38,387 characters. This excludes model interpretation/composition.
- Current web gate: 104 tests pass, including lossless continuation, duplicate retry
  prevention, raster input limits and download failures; lint, TypeScript and build pass.
- Next acceptance gate: time a complete lesson with the improved workflow, inspect a
  non-CS lesson and its original figures, demonstrate a learner-accepted revision, then
  verify the exact hosted origin. Browser portability/export and automatic visual-region
  discovery are not implemented. Scans still require original-image interpretation.

- 2026-09-03: user approved this execution direction after reviewing a full-paper lesson.
  Observed problems: 25m13s generation, unnecessary interactions, clipped/blurry source
  figures, narrow presentation and inadequate individual-lesson navigation.
- Implement this sequence on `sevan-dev`; retain existing uncommitted work. No source PDF,
  browser state, generated lesson, credentials or build artifacts enters Git.

## Judge rehearsal - 2026-09-03

The owner selected a motivated beginner with high-school science/math knowledge.
Video production is explicitly deferred until the product work is finished.
The new source is [Global Carbon Budget 2025](https://essd.copernicus.org/articles/18/3211/2026/),
published 13 May 2026, CC BY 4.0. Use the final publisher PDF, not a preprint.
Record import, indexing, evidence review, plan approval, composition, semantic review
and revision separately. Time spent waiting for learner input is recorded separately.

The first direct browser PDF import failed because of publisher browser-download
restrictions. The visible local-file fallback was opened for the owner. The run has
not been restarted or replaced by an easier source. It has not yet passed.

UI corrections: fullscreen removed; wordmark replaces boxed initial; shared header
height is 60px (previous library reserved space exceeded the rendered header);
scene/chart dimensions now have viewport-height limits and original images use a
bounded inline height with detail available in their viewer.

The manual import exposed a real worker initialization failure: PDF.js display
setup referenced `document` inside the indexing worker. Supplying an explicit
parser worker port and worker resource-fetch policy repaired this path. The same
import then reached 78/78 indexed pages; no source replacement or synthetic index
was used. A source-library BroadcastChannel notification and focus refresh also
repair stale library status between tabs of the same browser origin. These do not
synchronize different browser profiles or hosted and localhost origins.

The authoring retry retrieved 43 lossless packets covering all 78 pages and inspected
four selected source visuals plus critical methods/results pages. A seven-section
plan and approximately 3,800-word draft were prepared through browser/WebMCP calls.
The draft is not yet saved: visible learner plan approval is pending. Approximately
20 minutes elapsed through draft preparation, including evidence review and a failed
coverage proposal. This is a failed speed target, not a fast-generation success.
Do not subtract overlapping authoring time just because an approval request was open.
The paper's 2025 table and narrative disagree on atmospheric growth, land uptake and
ocean uptake; the draft discloses these differences rather than inventing a correction.
Unselected model tables/maps and bibliography are retained in the source.

After the worker and tab-refresh fixes, the web gate passes again: 104 tests in
27 files, ESLint, TypeScript and production build. Live revision acceptance and
complete-generation timing remain open until the learner-approved workflow finishes.

Private hosting succeeded at [PRISM](https://prism-reading.sevan4355.chatgpt.site)
on 2026-09-04 at 00:45 UTC. The browser reached the owner-only sign-in gate.
This is deployment evidence, not yet application acceptance on the hosted origin or
public submission readiness. The canonical GitHub working tree remains uncommitted;
the separate Sites source snapshot includes only the web app and required build files.
