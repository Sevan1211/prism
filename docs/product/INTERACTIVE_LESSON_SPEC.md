# Interactive lesson specification

**Status:** adopted product contract; owner decisions recorded 2026-08-29  
**Reviewed:** 2026-09-03; owner clarified browser-native, Markdown-style lesson output  
**Related:** [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md), [`READER_SPEC.md`](READER_SPEC.md), [`../architecture/DOCUMENT_INTELLIGENCE.md`](../architecture/DOCUMENT_INTELLIGENCE.md), [`../architecture/WEBMCP_INTEGRATION.md`](../architecture/WEBMCP_INTEGRATION.md)

## Product promise

PRISM turns an assigned range of a textbook, technical document, or research paper into a saved, source-grounded, visually composed interactive lesson. The lesson should feel like an unusually good digital textbook or online-course chapter: detailed prose, clear sections and subsections, purposeful visuals, equations, code, worked examples, and optional user-controlled interactions.

This promise is field-agnostic. A computer-systems textbook may be the challenge demo,
but lesson planning and evaluation must also support proofs, data interpretation,
historical or legal arguments, primary-source analysis, case reasoning, spatial material,
processes, classifications, and close reading. Representations are selected because they
clarify the source and objective, not because the product assumes a technical discipline.

The lesson is not a summary, slide deck, flashcard sequence, or queue of disconnected AI answers. It is a coherent teaching artifact that remains attached to the original source and can always open the exact evidence behind a claim or visual.

An agent is required to create, evaluate, or revise a lesson. Without a connected agent, PRISM remains a high-quality Source Reader and can reopen lessons that were already created.

### Output format clarification — 2026-09-03

The owner explicitly rejected agent-generated PDFs as the lesson experience. Lessons
are browser-native reading documents with Markdown-style formatting: paragraphs,
headings and subheadings, emphasis, lists, quotations, tables, math, code, and purposeful
inline visuals. A course or learning route organizes those saved lessons; it is not a
collection of generated PDFs. Original PDFs remain source inputs and evidence views.

Formatting must accompany substantive teaching. Definitions, explanations, worked
examples, qualifications, and conceptual connections in the agreed scope must survive
composition. A small set of labeled representation blocks does not satisfy this
contract merely because its identifiers and citations pass automated checks.

Markdown-style authoring does not authorize executable MDX, raw HTML, agent-authored
scripts, or arbitrary embedded applications. PRISM continues to own rendering and
interactions. Exact source quotations remain verbatim; generated prose and added
examples remain distinguishable from source-authored material.

The current renderer does not yet implement this full rich-text experience. The
implementation audit, proposed redesign, and acceptance gates are recorded in
[`../engineering/LESSON_QUALITY_RESET.md`](../engineering/LESSON_QUALITY_RESET.md).

## Lesson library

Each source owns zero or more lessons. A source page in the library shows the original document first and its saved lessons beneath it.

```text
Source: Computer Networks — A Systems Approach
├── Read original
├── Lesson: Chapter 1 foundations
│   ├── Scope: Chapter 1, pages 1–32
│   ├── Status: completed
│   └── End check: completed; follow-up not required
├── Lesson: TCP slow start for Lab 4
│   ├── Scope: Section 6.3, pages 304–311
│   ├── Status: in progress
│   └── End check: pending
└── Lesson: Repair — congestion window vs. receive window
    ├── Parent: TCP slow start for Lab 4
    └── Status: ready
```

The learner can create, rename, duplicate, reopen, archive, export, or delete a lesson. A lesson card shows its name, source range, objectives, estimated active time, version, status, and any parent or repair relationship.

## Learner assignment handoff

The learner may define the assignment in PRISM before opening an agent conversation. The
local brief records the name, assigned work, desired outcome, exact PDF page range, time
budget, intended depth, and prior knowledge. It is attached to the source in IndexedDB;
it does not copy source text or grant new source access.

A compatible external agent resumes that brief through the read-only
`get_lesson_brief` tool, inventories the full range through the scope manifest, and
proposes coverage. This makes the browser page the durable coordination surface while
leaving model choice, account cost, and conversation history with the learner's agent.
The browser remains useful without an agent, but it does not pretend to compose a lesson
on its own.

## Lesson contract

A saved lesson contains:

- stable lesson and version identifiers;
- source identifier and immutable source fingerprint;
- source range expressed as chapters, sections, pages, and anchored regions;
- learner goal, time budget, intended depth, and relevant prior knowledge;
- learning objectives;
- prerequisites included from outside the selected range;
- a coverage ledger for core, supporting, compressed, omitted, and deferred content;
- ordered sections and subsections;
- semantic frames and typed representation blocks;
- source-authored, reconstructed, and added-explanation assets;
- exact provenance and quality results;
- end-of-lesson questions and source-grounded answer criteria;
- local activity, answer-analysis, repair, and completion records;
- accessibility alternatives and static fallbacks.

Changing factual content, scope, order, representation, or end questions creates a new lesson version. Earlier versions remain addressable while they are referenced by a learner session or agent activity record.

## Lesson creation workflow

### 1. Interpret the assignment

The learner may specify a natural-language assignment, a chapter or section, a page range, or a combination. A typical request is:

> Teach me Chapter 4 for Friday's operating-systems lab. I have 45 minutes and understand processes but not synchronization.

The agent extracts the requested outcome, scope, time constraint, prior knowledge, and required application. If the time budget cannot support the requested coverage, it must propose a narrower or shallower contract rather than silently omitting important content.

### 2. Inspect the complete scope

The agent first obtains a scope manifest covering every detected heading, definition, claim candidate, figure, table, equation, code region, example, exercise, cross-reference, prerequisite, and extraction warning. Search results alone are not enough to establish lesson coverage.

### 3. Build the coverage ledger

Each meaningful source item is assigned one disposition:

- **Core:** teach in enough depth to support the selected objective.
- **Supporting:** include briefly because it enables a core idea.
- **Compressed:** preserve the important qualification or relation in a shorter form.
- **Prerequisite:** import from another source location and disclose the expanded scope.
- **Omitted:** exclude with an inspectable reason.
- **Deferred:** propose as a later lesson.
- **Source only:** parsing or grounding is too uncertain for reconstruction.

Importance is estimated from the learner's objective, assignment language, prerequisite centrality, source emphasis, downstream dependency, application value, likely misconceptions, and the available time. It is never justified by a generic claim that the model knows what matters in every subject.

### 4. Propose a lesson plan

Before any write, the agent shows:

- lesson name and source range;
- objectives and prerequisite assumptions;
- section and subsection sequence;
- planned representations;
- expected time;
- end-question plan;
- coverage and omission summary;
- parsing or grounding warnings.

One learner approval authorizes construction of the accepted plan. Material scope changes, follow-up repair lessons, and later revisions require a new proposal and approval. A clarification normally becomes a proposed update to the same lesson; a separate child lesson is optional.

#### Implemented planning boundary — 2026-08-29

The browser-local planning slice persists lesson briefs and source-owned plan
proposals. The 2026-09-03 update supports section lessons, chapter lessons, and research
briefs. Reading time and target words are soft targets. A proposal classifies its selected
essential evidence and gives every page in the approved range a coverage disposition;
compact page ranges keep a long source from becoming one oversized tool payload. It
preserves source-only boundaries and maps every objective to instruction. Questions are
optional; when requested, their evidence and criteria must be complete. The proof sheet shows
range, time, objectives, section sequence, representation intents, coverage totals,
omission/source-only reasons, and question count before approval.

Approval remains exclusively learner-controlled: there is no WebMCP approval tool.
Approval freezes the proposal with a local fingerprint but does not certify fidelity or
claim learning. The first typed composition slice now begins only after this approval.

### 5. Compose and validate

The agent builds the lesson through typed PRISM tools. PRISM validates identifiers, source support, coverage, representation safety, accessibility, answerability, and immutable version identity before the lesson becomes ready.

#### Implemented composition boundary — 2026-08-31

`apply_lesson_patch` now creates or revises one current local draft with insert, replace,
remove, and move operations. Each request names the expected document version, so stale
agents fail instead of overwriting newer work. Blocks are constrained data, bound to an
approved section and its evidence. The current validator checks planned evidence use,
provenance, exact source-excerpt text, section completeness, representation warnings,
and the approved-plan fingerprint. Since 2026-09-03, `finalize_lesson` explicitly separates
a working draft from a ready reading document. Word/time differences are review warnings,
not reasons to silently remove substantive source material.

`get_lesson_document` returns a compact outline by default and at most one requested
section's content. `validate_lesson` reruns current grounding checks. PRISM renders the
saved draft as a continuous manuscript with visible provenance, typed representation blocks,
user-steppable declarative interactions, and any approved end questions. Original-page
crops, bounded subject-independent scenes, plots with exact data tables, revision proposals,
version history, and learner acceptance are implemented. Revision previews expose both
versions and their citations before acceptance. Runtime quality and accessibility still
require acceptance evidence; structural tests do not establish semantic fidelity. See
[submission readiness](../engineering/SUBMISSION_READINESS.md) for the live workflow gap.

## Lesson reading experience

The primary lesson surface is a scrollable, multi-section reading experience. It should preserve the strengths of a good textbook while improving structure, explanation, visual communication, navigation, and source inspection.

A lesson may contain:

- orientation and objectives;
- prerequisite refreshers;
- detailed explanatory prose;
- definitions and qualifications;
- source figures with annotations;
- reconstructed diagrams and concept maps;
- argument and evidence maps, annotated passages, cases, and exhibits;
- equations and stepwise derivations;
- proofs, quantitative models, charts, maps, and data interpretation;
- code blocks, traces, state tables, and call-stack or memory views;
- comparisons, timelines, processes, and causal models;
- worked examples and boundary cases;
- user-controlled interactive or animated explanations;
- section summaries;
- an end-of-lesson question set;
- source and coverage receipts.

The visual design follows the scholarly-instrument direction: warm paper and neutral editorial surfaces, a compact graphite navigation rail, reading-centered typography, and one restrained vermilion accent for action and focus. It should resemble a carefully designed interactive textbook, not a generic AI dashboard, chat transcript, slide deck, or cinematic presentation.

### Semantic frames

A **semantic frame** is an internal composition unit with one coherent instructional purpose. It can contain several synchronized blocks, such as explanatory text, a source visual, an equation, labels, and provenance. Frames provide stable identifiers for revision, accessibility, provenance, experimental presentation, and targeted repair.

Frames do not force the learner to view one isolated item at a time. In the primary lesson surface, several frames may compose one section and appear as a continuous instructional narrative. Traceable Semantic Relay remains an Experimental alternate renderer for selected frames; it no longer defines the default lesson layout.

### Representation grammar

The agent chooses from constrained, safely rendered block types:

- rich explanatory text;
- source quotation or definition;
- callout, warning, or boundary condition;
- comparison or structured table;
- timeline or process;
- causal or concept graph;
- equation and derivation;
- worked example;
- syntax-highlighted code;
- execution trace, state table, or memory model;
- source-authored figure or selected page region;
- PRISM-reconstructed diagram or chart;
- user-controlled animation sequence;
- section integration summary;
- end-of-lesson question.

The agent never writes arbitrary HTML, JavaScript, SVG, styles, or executable code into a lesson. It submits typed data; PRISM owns safe, deterministic, accessible rendering.

Every block with source anchors exposes visible evidence controls. Activating one opens
the original PDF at the cited page and highlighted region; leaving the Reader returns to
the lesson surface. Equations render through PRISM's trusted semantic math renderer with
MathML and a readable LaTeX fallback rather than displaying raw agent markup.

## Visual provenance

Every visual is visibly classified:

1. **Source-authored:** extracted or cropped from the original source.
2. **PRISM-reconstructed:** generated from source-supported relationships or data.
3. **Added explanation:** an analogy or interpretation not directly authored by the source.

Source-authored visuals retain page, region, caption, legend, and in-text-reference anchors. Reconstructed visuals bind every meaningful node, edge, label, value, and state transition to source claims or explicitly marked PRISM inferences.

Animations are declarative, pausable, replayable, manually stepable, and paired with a complete static and reduced-motion alternative.

## Continuous agent discussion

The connected agent should retain compact lesson context throughout the session:

- active source and lesson version;
- current section and nearby semantic frames;
- objective and coverage ledger;
- visible source and representation anchors;
- learner-approved revisions;
- prior questions and explanations from the current session.

When the learner asks a question in the agent conversation, the agent may retrieve the active section, open exact source evidence, explain the idea, propose a different representation, or propose a lesson revision. Discussion alone does not silently change the lesson. A requested explanation may remain conversational; a durable lesson update creates a new approved version.

## End-of-lesson questions

Questions are optional and chosen in the brief. When requested, a lesson normally ends with three to six questions tied to its objectives, including explanation and application. Other valid forms include prediction, comparison, process or code tracing, error diagnosis, and interpretation of a figure, table, result, or equation. A research brief may contain none.

Questions appear only after the instructional sections. The learner may answer them in Codex or another compatible agent interface rather than in an embedded quiz form.

The agent retrieves the lesson questions and source-grounded criteria, discusses the learner's answers, and records a structured local analysis with these statuses:

- demonstrated;
- partially demonstrated;
- unclear;
- contradicted;
- not attempted.

The analysis stores the learner's answer, criteria used, relevant evidence, uncertainty, and agent identity. It does not collapse the result into a proprietary mastery score.

The agent then:

- completes the lesson;
- asks one clarifying follow-up; or
- proposes a repair lesson.

A learner may request a deeper explanation in the same saved lesson. The agent proposes a revision with inspectable evidence and a before/after comparison; learner acceptance creates the next version and retains history. A separately named child lesson is an option when the learner wants a distinct scope. Neither durable change occurs without learner approval.

#### Implemented learning-loop boundary — 2026-08-31

Each newly proposed end question now carries one to eight source-grounded criteria. The
criteria may express any discipline-appropriate evidence standard, but every cited
source element must remain inside the approved usable coverage. `get_lesson_end_check`
returns questions, criteria, and the latest status for each response without replaying
stored learner-answer text. `record_answer_analysis` appends a version-bound analysis,
classifies every criterion exactly once, and rejects evidence outside that criterion.

After at least one response analysis, the agent may call `propose_lesson_outcome` to
recommend closing, continuing discussion, or creating a named repair. The tool cannot
finalize its own recommendation. PRISM shows the rationale, number of responses reviewed,
open criteria, explicit absence of a mastery claim, and any proposed repair scope. The
learner may accept or dismiss it in the lesson interface. Accepting repair atomically
creates a source-owned child brief linked to the parent lesson, plan, analyses, and
unresolved criteria; it still requires a new coverage plan and learner approval before
composition.

Raw learner answers remain in the browser vault. Activity receipts record only that a
local analysis occurred, not the answer, prompt, or returned source text.

## Quality gate

A lesson cannot become ready when any critical gate fails:

- every factual clause resolves to valid source evidence or is labeled as added explanation;
- every planned objective has an inspectable coverage disposition;
- source qualifiers, exceptions, symbols, units, and uncertainty are preserved;
- prerequisite ordering is coherent;
- source and reconstructed visuals have provenance;
- equations, code, tables, and charts preserve their required semantics;
- end questions are answerable from taught content;
- answer criteria are source-grounded and do not leak into the lesson;
- inaccessible or unsafe representation blocks have equivalent fallbacks;
- unsupported or low-confidence source regions remain source-only;
- lesson and asset identities match their immutable payloads.

Automated checks help reject obvious failures; they do not prove pedagogical quality or learning efficacy. The agent may revise a draft until the gate passes, but it cannot certify its own unsupported content. The implemented UI therefore says **Current checks pass**, not “grounding passed” or “lesson verified.” Current checks enforce typed structure, approved-section evidence, provenance, planned evidence use, and exact source excerpts; they do not yet perform atomic factual-entailment review for every generated clause.

Every accepted patch appends an immutable browser-local lesson revision while updating the current-document pointer. Closing the lesson is also stricter than producing one favorable response: every end question must have a current, criterion-complete analysis, and any unresolved criterion blocks a close recommendation. These records remain evidence receipts, not mastery claims.

## Challenge release boundary

The WebMCP Challenge release proves this contract with one open-license hero source and
one excellent agent-built lesson. The demo may use computer science, while the released
product contracts and tools remain discipline-neutral. It does not claim universal
textbook parsing, general learning efficacy, or complete domain adaptation.

The challenge lesson should demonstrate:

- natural-language assignment intake;
- scope inspection and plan approval;
- multiple sections with detailed prose;
- one source visual;
- one reconstructed visual;
- one equation, code, comparison, or process representation appropriate to the source;
- exact source navigation;
- end questions answered through the agent;
- a completion or repair decision;
- local persistence and reopen behavior.
