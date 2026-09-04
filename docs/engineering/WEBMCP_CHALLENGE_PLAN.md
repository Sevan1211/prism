# WebMCP submission plan

**Updated:** 2026-09-03  
**Status:** full-paper composition completed after owner approval; complete release rehearsal and publication still pending.

The [official challenge page](https://openai.com/webmcp-challenge/) lists the submission deadline as September 4, 2026, 1:00 a.m. Pacific (3:00 a.m. America/Chicago). Submission needs a hosted project, public source repository, and a video under three minutes with audio. Verify the form and terms again before final submission. Preparing the project does not submit the entry or accept legal terms for the owner.

## Product to demonstrate

A person brings a document, asks for a useful explanation at an appropriate depth, reviews a transparent coverage plan, and receives a saved reading document with inspectable source evidence. When a concept is still unclear, the agent proposes an improvement to the same lesson and the reader accepts it.

The public library starts empty. No textbook, paper, lesson, or document-specific visual is preinstalled. Application code supplies renderers and contracts; an external agent authors subject-specific content through WebMCP. No server inference or required PRISM account enters the core flow.

## Current architecture

- Static React application, PDF.js workers, OPFS source files, IndexedDB structured state.
- Bounded evidence reads and original-page inspection; browser vision supplies actual visual understanding when available.
- Small-scope element coverage or long-scope page reviews plus explicit coverage ranges.
- Soft word/time targets; optional end questions.
- Typed Markdown, source crops, equations, tables, worked examples, declarative visual scenes, and numeric charts.
- Progressive draft saves, finalization with a candid agent review, proposed revisions, learner acceptance, stale-version checks, and immutable history.
- Explicit agent access for private/unknown sources and metadata-only activity receipts.

## Acceptance before publishing

1. Complete the live plan → composition → source inspection → revision workflow with actual owner approval. An agent clicking its own approval control does not satisfy the learner-only boundary.
2. Read the rendered result for accuracy, omissions, usefulness, citation placement, and visual legibility. Structural validation alone is insufficient.
3. Exercise a non-CS textbook chapter. Keep parser evaluation broader than the demo, including held-out layouts and recovery cases.
4. Build the exact static source version. Confirm no private files, local state, credentials, source PDFs, or generated caches enter the release archive.
5. Deploy privately, inspect the exact origin, then obtain approval to publish publicly. Verify a signed-out visitor can load it without an account.
6. Verify route refresh, empty library, import, persistence, consent, original-page rendering, keyboard controls, responsive layout, and failure recovery on the deployed origin.
7. Record an authentic video with audio, publish the public source repository through the required Git workflow, and prepare the submission fields for the owner.

See [submission readiness](SUBMISSION_READINESS.md) for dated evidence. Items not recorded there as verified remain open.

## Video storyboard — proposed, not yet recorded

| Time | Screen action | What it establishes |
|---|---|---|
| 0:00–0:15 | Empty library; import the recent AI paper | The app starts with the user's source |
| 0:15–0:40 | Ask for a detailed research brief; inspect the source and coverage plan | Real WebMCP evidence reads and intentional compression |
| 0:40–1:25 | Read the saved brief, step through one meaningful visual, inspect a chart and original figure | Useful teaching and inspectable provenance |
| 1:25–2:05 | Ask about one confusing concept; review and accept an expansion of the same lesson | The reading document improves through collaboration |
| 2:05–2:35 | Open a geology chapter lesson; inspect its source figure | The same workflow applies beyond CS |
| 2:35–2:55 | Reload saved work; show local storage and the public project/repository | Persistence and a usable free core |

Use [Recursive Language Models v3](https://arxiv.org/abs/2512.24601) and [Physical Geology, second edition](https://opentextbc.ca/physicalgeology2ed/). Check figure-specific credits before reuse. The completed paper lesson covers all 43 pages in seven sections, including appendix methods and failure traces. An earlier pages 1–17 proposal remains a separate plan and must not be confused with the full-paper lesson.

Record actual tool calls and generated results. If waiting is cut or accelerated, disclose that in the video. Do not present a prewritten result as live generation or claim universal parsing, guaranteed accuracy, or measured learning improvements.

## Deferred rather than implied

Browser OCR, universal mathematical reconstruction, verified table extraction, arbitrary agent-authored applications, cross-device sync, and validated learning efficacy remain outside the demonstrated release. Scanned or uncertain pages retain original-image access. Project-level multi-source routing is a longer-term direction, not a completed submission feature.
