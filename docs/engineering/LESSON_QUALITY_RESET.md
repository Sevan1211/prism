# Lesson quality reset

**Date:** 2026-09-03  
**Status:** implementation in progress; paused at owner request for discussion; not submission-ready  
**Authority:** owner correction in this session; [lesson contract](../product/INTERACTIVE_LESSON_SPEC.md), [project contract](../product/PROJECT_UNDERSTANDING_WORKSPACE.md), [challenge plan](WEBMCP_CHALLENGE_PLAN.md)

## User outcome

Open PRISM and read a substantial, beautifully formatted lesson immediately. Follow a
coherent explanation, explore an inline visual where it helps, inspect the original
evidence without losing the reading position, and ask the agent to improve a specific
part of the same saved lesson. A course is an organized route through these lessons.
The agent does not generate lesson PDFs.

The owner prioritizes quality over an arbitrary implementation time budget. This does
not authorize silent source compression, new inference charges, publishing private
sources, or bypassing learner approval. The challenge deadline is September 4 at
1 a.m. Pacific / 3 a.m. Central, verified from the
[official announcement](https://openai.com/webmcp-challenge/).

## Initial findings before the implementation below

The audit inspected the working tree on `sevan-dev`, the rendered local library and
bundled showcase, and the code below. Existing broad uncommitted work was preserved.
The audit installed only the public bundled fixture on the separate `localhost:5173`
origin; it did not open or transmit the private textbook on `127.0.0.1:5173`.

| Finding | Evidence | User consequence |
|---|---|---|
| The sample has six content blocks across three sections and no prose blocks | `installShowcase.ts` (removed from production), `composeShowcaseLesson` | Definitions, an equation, a diagram, a stepper, a table, and a worked example do not form the promised detailed teaching narrative. |
| Prose renders as one plain paragraph | [LessonDraftPreview.tsx](../../apps/web/src/lesson/LessonDraftPreview.tsx), `LessonBlockBody` | The agent cannot express the desired Markdown-style section hierarchy and inline formatting through prose. |
| The lesson follows source chrome, assignment controls, the plan, coverage counts, and sequence | [LessonPlanPanel.tsx](../../apps/web/src/lesson/LessonPlanPanel.tsx), confirmed in browser | The product opens like a composition administration screen. The reading document is several screens below the entry point at the inspected narrow width. |
| Animation is a label/description stepper; diagrams list nodes and individual relations | [lessonDocumentTypes.ts](../../apps/web/src/lesson/lessonDocumentTypes.ts), [LessonDraftPreview.tsx](../../apps/web/src/lesson/LessonDraftPreview.tsx) | Visuals have limited explanatory power and cannot currently represent a parameterized model. |
| Evidence membership is mistaken for a sufficient content gate | [lessonDocuments.ts](../../apps/web/src/lesson/lessonDocuments.ts), `validateDocument` | Citing every planned element passes this check even if a paraphrase omits its qualifications or does not teach its content. Exact excerpts have stronger text verification; ordinary paraphrases do not. |
| Missing planned representations produce warnings, while readiness depends only on errors | [lessonDocuments.ts](../../apps/web/src/lesson/lessonDocuments.ts) | A planned visual can be absent while the document still passes its current readiness test. |
| The sample shows 25 core and 29 compressed source items, but the disclosure filter excludes compressed items | Browser sample and [LessonPlanPanel.tsx](../../apps/web/src/lesson/LessonPlanPanel.tsx) | A learner sees a compression count without a useful explanation of what was shortened. |
| The project generates its own five-page demo source PDF | `build_showcase_pdf.py` (removed), `installShowcase.ts` (removed from production) | Useful as a controlled engineering fixture, weak evidence of transforming a substantial independent source. It is not the actual lesson output. |

These findings explain the rejection more directly than a new color palette. The
storage, original Reader, approval boundary, citation navigation, and typed mutations
are useful foundations. Their existence does not establish teaching quality.

## Proposed experience

### A document first

The selected lesson opens with its title, a concise orientation, and the first useful
paragraph. A compact outline provides section navigation. The main column carries
readable, continuous prose; visuals and worked examples sit beside the explanation
they clarify. Source and revision details are available through local controls.

Proposed document structure:

1. Orientation: the problem, goal, and necessary prior knowledge.
2. Explanation: definitions, reasoning, qualifications, and connections.
3. A purposeful visual next to the relevant explanation.
4. A worked example with intermediate reasoning and an interpreted result.
5. A boundary case or common confusion where the source warrants it.
6. Integration with earlier ideas, followed by sparse final application questions.

This is a quality rubric, not a mandatory repetitive template for every subsection.
Length follows the approved material. Do not pad prose or impose an arbitrary word
count. A reading estimate is an estimate, not permission to discard content.

### In-place source inspection and agent help

Evidence opens in an adjacent panel on a wide screen and a focused sheet on a narrow
screen, with exact location, clear close/return behavior, and the original Reader still
available. Keep added analogies and interpretations visible as such. Consolidate
repeated generic evidence buttons into meaningful references without hiding provenance.

The distinctive interaction is a learner selecting a specific explanation and asking
for a different representation or a missing prerequisite. The agent receives that
bounded context, proposes a targeted change, and the learner can inspect and approve
the saved revision. Demonstrate the actual state change and persistence through
WebMCP. Do not simulate a successful agent action with a timed animation.

### Visuals with an explanatory job

Build a small, reusable visual grammar, selected by the material: an annotated source
figure, a causal graph, a comparison, a timeline, or a parameterized model. For a
network-delay example, changing packet size or link rate can update a transmission
interval while a fixed propagation interval stays visible. Explain the assumptions;
the model is an added teaching representation, not a measurement from the source.

The frontend owns the implementation. Agents supply validated parameters, labels,
relations, source references, and permitted states. No agent-authored executable code
enters a lesson. Every interaction has keyboard access, a readable static equivalent,
and reduced-motion behavior. A general simulation platform is outside this slice.

## Proposed implementation sequence

| Order | Coherent change | Acceptance evidence |
|---|---|---|
| 1 | Rich text and a dedicated reading surface | Existing plain-text documents still render literally. New formatted text supports headings, emphasis, lists, links, quotes, code, and tables. Quotes preserve exact text. Unsafe markup/URLs are rejected or rendered inert. A selected lesson opens on instruction; plan and activity controls remain reachable. |
| 2 | One complete reference lesson from a substantial independent, redistributable source | A human reviews source-to-lesson coverage for the agreed range: definitions, examples, conditions, figures, and causal steps. The lesson is coherent without requiring the reader to reconstruct it from blocks. Original-source attribution is visible. |
| 3 | One reusable interactive visual plus source-figure support | Its data contract, source support, assumptions, static alternative, keyboard path, and deterministic calculations are checked. It can be authored through the same lesson tools, not only a hard-coded demo route. |
| 4 | Contextual agent revision with learner review | Selection survives navigation; the agent reads the correct bounded block/section; a proposed material change is reviewable and version-checked; accepting preserves an earlier version and rejecting leaves the lesson intact. |
| 5 | Agent authoring and quality gates | The authoring guidance requires full-scope inspection, substantive connected explanations, worked reasoning, and explicit compression. Separate structural validation from semantic review and owner acceptance. Missing required representations block readiness or visibly narrow the approved plan. |
| 6 | Public-origin acceptance and submission materials | Fresh signed-out load, live WebMCP discovery/composition/revision, source inspection and return, refresh/reopen, narrow-screen/keyboard checks, and network/privacy observations on the deployed origin. Record the actual commit, source license, URL, and video. |

Preserve the existing local-first/no-required-login/external-agent model. Avoid spending
this cycle on a new provider backend, generalized course management, a universal
knowledge graph, unrelated Reader features, or a cosmetic homepage overhaul. A broader
course route can organize lessons after the lesson itself meets the quality bar.

## Authoring and validation details

- Prefer a versioned rich-text content type or explicit format discriminator. Do not
  silently reinterpret legacy plain-text blocks as Markdown.
- Keep source anchors and typed visuals outside the Markdown string so formatting
  cannot invent provenance or inject an executable component.
- Use a maintained Markdown parser with a constrained element/URL policy; do not
  create a regex-only Markdown parser or enable raw HTML/MDX.
- Preserve atomic section-level coherence while using bounded patches and optimistic
  versions. Make partial composition visible and resumable.
- Replace citation-count proxies with a reviewable mapping from source concepts,
  qualifications, and examples to the passages that actually teach them. Automated
  membership checks remain useful, but semantic fidelity requires separate review.
- Distinguish structural checks, agent content review, and human acceptance in both
  data and UI. A green structural result must not imply verified teaching quality.
- Explicitly disclose compressed material and its rationale. Do not infer that a
  standard-depth selection authorizes all non-core material to disappear.

## Submission narrative

Show the completed reading experience first, then the agent collaboration that makes
it useful. A representative sequence is: read a difficult explanation, inspect its
source, vary an inline model, ask for a targeted clarification, review the proposed
change, accept it, and reopen the saved result. Follow with the brief source-to-plan
origin story. A precomposed sample must be identified as such; the live agent segment
must genuinely use the exposed tools.

The official challenge evaluates usefulness, originality, execution, thoughtful use
of WebMCP, and the human-agent experience. These priorities are taken from the
[challenge page](https://openai.com/webmcp-challenge/); the proposed demo sequence is a
project judgment, not a guarantee of selection.

## Current handoff boundary

The owner subsequently authorized implementation, then requested a pause for questions.
The working tree now contains these integrated changes:

- Browser-native rich Markdown, semantic math, safe links, tables, and inert code;
  no raw HTML, remote Markdown images, MDX, or executable agent code.
- A reading-first lesson layout with section navigation, quieter plan controls,
  grouped page references, a native source-preview dialog, and focus restoration.
- Exact PDF source-figure crops and a keyboard-operable network-delay model with
  explicit assumptions, deterministic readouts, and reset.
- A substantial three-section, 13-block reference lesson using PDF pages 41–43 of
  Peterson and Davie's independent, 489-page textbook. The original is redistributed
  under CC BY 4.0; see [source attribution](../../benchmarks/fixtures/README.md).
  The lesson is precomposed; it is not presented as a live agent generation.
- Learner-selected block context exposed through WebMCP, bounded revision, readable
  changed-paragraph review, and learner-only restoration that creates a new version.
  Patches save immediately within an approved plan; a separate pending-edit acceptance
  stage is not implemented. Do not describe this as an implemented approve-every-edit flow.
- Parser v4 corrects rotated text bounds, touching word fragments, font-change false
  column warnings, and prose falsely classified as code. Suspect character maps,
  scans, complex layouts, and page extraction failures retain source-only fallbacks.
  Worker batches wait for durable writes; failures resume after the last saved batch.
  Completed supported indexes remain immutable to preserve existing lesson anchors.
- Bounded evidence reads fetch only the requested pages, prioritize requested
  passages, and explicitly report missing passages when the output budget fills.
- Reader rendering uses each page's own dimensions, exposes render retry, and guards
  stale search results. Lesson citation return preserves the selected plan.

Live local acceptance used only the openly licensed reference source on localhost.
The original figure and citation dialog rendered; Escape restored reference focus.
The model produced 16 ms at 1 Mb/s and 5 ms at 12 Mb/s, and reset returned 6 Mb/s.
Real registered WebMCP calls read the active selection and bounded source evidence,
saved a deeper explanation as version 2, and read the restored version 3 after the
visible recovery control. History preserved the original and the agent edit.

Still open: a fresh production-origin rehearsal; mobile and complete Reader acceptance;
semantic coverage review against the full approved range; the final answer/repair demo;
public deployment; video with audio; submission; obsolete sample cleanup; and focused
Git integration. The owner confirmed there is no existing hosting project or public URL.
No hosting project was created, no source was pushed, and nothing was submitted.
The development server remains available at localhost:5173 for discussion.

Validation at the pause: `npm run quality:web` passed lint, TypeScript, all 83
tests in 17 files, and the production build. `npm run check:docs` passed 34 Markdown
files with no broken local links, unbalanced fences, or conflict markers. Browser
acceptance remains limited to the local actions recorded above; these checks do not
establish universal PDF fidelity, teaching efficacy, or final submission quality.
