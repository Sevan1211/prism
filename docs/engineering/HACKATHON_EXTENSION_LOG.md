# WebMCP Challenge extension log

**Status:** living submission evidence  
**Challenge period:** 2026-08-25 through 2026-09-03  
**Baseline commit:** `fe19d9eec6cac1bbec5fcc9a7d4246b93a02dce1` (2026-08-23)  
**Reviewed:** 2026-08-31

## Why this record exists

PRISM existed as a research and document-processing prototype before the challenge.
The submission must therefore make the work added during the challenge explicit. The
baseline contained research documentation, an early source-linked learning flow, a
server-side import/parser foundation, and compiled-package validation. It did not
contain the current browser-local WebMCP learning workspace.

This log describes the meaningful challenge-period extension. Git history remains the
authoritative record for committed work; this document is the readable judge-facing map.

## Challenge-period product extension

| Area | Challenge-period result | Primary evidence |
|---|---|---|
| WebMCP | Eighteen route-stable page tools spanning visible import preparation, source discovery, active routed context, bounded evidence, exact navigation, learner-brief handoff, planning, typed composition, validation, answer analysis, and learner-controlled outcome proposals | `apps/web/src/webmcp/usePrismLibraryTools.ts` |
| Local-first privacy | Personal PDFs persist in OPFS; structured state, indexes, plans, immutable lesson revisions, answer analyses, outcome proposals, consent grants, and metadata-only activity receipts persist in IndexedDB | `apps/web/src/storage/` |
| Agent consent | Private source text fails closed until the learner enables a fingerprint-bound, revocable grant | `apps/web/src/webmcp/context.ts` |
| Reader | Real routed PDF.js Reader with selectable text, bookmarks, search, page URLs, zoom/fit controls, keyboard navigation, and exact highlighted agent navigation | `apps/web/src/Reader.tsx`, `apps/web/src/navigation.ts` |
| Coverage contract | A local learner brief becomes a complete scope manifest and exact-once coverage proposal; the learner alone approves composition | `apps/web/src/lesson/lessonPlans.ts` |
| Safe composition | The agent writes only typed data blocks within an approved plan; PRISM validates provenance, exact excerpts, scope, and optimistic versions | `apps/web/src/lesson/lessonDocuments.ts` |
| Lesson experience | Continuous manuscript rendering for explanations, definitions, excerpts, semantic math, code, worked examples, tables, diagrams, stepwise interactions, summaries, and end questions | `apps/web/src/lesson/LessonDraftPreview.tsx` |
| Evidence and repair | Source-grounded criteria, append-only answer analyses, honest outcome receipts, and learner-approved child repair briefs complete the first local lesson loop without a mastery score | `apps/web/src/lesson/lessonLearning.ts`, `apps/web/src/lesson/LessonDraftPreview.tsx` |
| Cross-domain contract | Computer systems remains the demonstration corpus, while lesson criteria, outcomes, and repair tools are field-agnostic and encode no CS-only assumption | `docs/00_PROJECT_BRIEF.md`, `docs/product/INTERACTIVE_LESSON_SPEC.md` |
| Inspectable fidelity | Every cited lesson block can open the original PDF at its exact page and region, then return keyboard focus to the invoking citation | `apps/web/src/App.tsx`, `apps/web/src/lesson/LessonDraftPreview.tsx` |
| Reliability | A branded boot recovery state replaces the prior unexplained white canvas; WebMCP surface edits force a safe Fast Refresh remount; registration, storage, navigation, Reader, planning, and composition have automated coverage | `apps/web/index.html`, `apps/web/src/webmcp/usePrismLibraryTools.ts`, `apps/web/src/**/*.test.tsx` |

Local release evidence on 2026-08-31: `npm.cmd run quality` passed 23 API tests and
72 web tests together with lint, type checking, production build, schema generation,
and documentation validation. The production build was then served at the same local
origin; the private 1,122-page source reopened from browser storage, all eighteen
WebMCP tools registered, the 438-bookmark Reader outline loaded, and route back/forward
worked without a new production console error. This is local evidence, not a substitute
for the required deployed-origin audit.

A second fresh local origin installed the project-authored five-page Apache-2.0 showcase
with one visible learner action, produced a three-section approved lesson, and opened its
delay, queue, and diagnosis evidence on PDF pages 2, 3, and 4. Reader return restored
focus to the exact invoking evidence button, and the run added no console error. This
proves the local fixture and interaction path, not public deployment or learning efficacy.

## Judge-criteria map

- **WebMCP leverage:** the external agent acts through the learner's live source,
  consent, Reader, brief, approval, and typed document state. A conventional chat API
  would not share those visible browser-local boundaries.
- **Execution:** schemas, local persistence, evidence anchors, approval fingerprints,
  fail-closed content access, activity receipts, and deterministic rendering make the
  workflow inspectable rather than prompt-only.
- **Potential impact:** students can use an agent they already have to reconstruct
  difficult assigned reading without a PRISM inference bill or mandatory account.
- **Creativity and ambition:** PRISM treats the agent as a compiler for durable,
  source-grounded interactive learning artifacts, not as a PDF chatbot or summarizer.

## Submission boundary and remaining proof

The private CSAPP textbook used for local stress testing is not redistributable and must
not appear as the public showcase source. The final demo requires a separately recorded
open-license or original source with attribution.

Before submission, this record must be extended with:

- the deployed HTTPS URL and signed-out browser check;
- the public repository commit used for judging;
- the open-license showcase source and license evidence;
- the final quality command output and deployed network/privacy check;
- the public video URL and duration under three minutes.

Until those items are recorded, deployment and submission readiness remain unverified.
