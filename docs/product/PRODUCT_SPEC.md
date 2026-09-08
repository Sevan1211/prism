# Product specification

**Status:** adopted product direction  
**Reviewed:** 2026-08-31  
**Project and route contract:** [`PROJECT_UNDERSTANDING_WORKSPACE.md`](PROJECT_UNDERSTANDING_WORKSPACE.md)  
**Detailed lesson contract:** [`INTERACTIVE_LESSON_SPEC.md`](INTERACTIVE_LESSON_SPEC.md)  
**Reader contract:** [`READER_SPEC.md`](READER_SPEC.md)  
**Experimental mechanism:** Traceable Semantic Relay (TSR), retained as an alternate semantic-frame renderer rather than the primary lesson surface

## Product statement

PRISM is a local-first, project-based understanding workspace for dense sources: textbooks, scholarly documents, technical manuals, research papers, and later other technical materials. A learner brings a goal-bound source collection into a private Project, reviews a transparent learning route, and uses the original documents alongside source-grounded interactive lessons.

The reconstructed lesson should feel like an exceptionally clear digital textbook or online-course chapter: detailed prose, meaningful sections and subsections, source and reconstructed visuals, equations, code, worked examples, user-controlled interactions, and exact links back to the original source.

PRISM remains honest about the difference between source exposure, a same-session answer, and durable learning. It does not claim that completion establishes mastery or that an agent-generated lesson is automatically correct.

## Primary user job

> Help me build a usable mental model from dense material for my goal and available time, while showing what is covered, what is omitted, what depends on what, and the original source behind every important explanation.

The first audience is the project owner and later college and adult learners using desktop or laptop browsers. Computing sources are the first benchmark and challenge-demo family; the released document, lesson, evaluation, and repair contracts remain domain-neutral.

## Product surfaces

### Project Workspace

A Project is the private boundary for a learner's goal, selected source collection, time and depth preferences, route history, notes/hypotheses, and approved repairs. Knowledge remains project-local by default. Adding a source does not grant an agent access to its content; every source retains its own rights and consent policy.

### Project Map and Learning Route

The Project Map makes source structure, candidate dependencies, evidence, uncertainty, and visible conflicts navigable without pretending to perfectly understand the source collection. A learner-approved Learning Route sequences bounded source steps for a stated goal and time budget. The route exposes prerequisites, coverage, omissions, uncertainty, and exact source anchors. In the first release, every generated lesson remains bound to one primary source and range even when the route spans a collection.

### Source Reader

The original document is always available. The Reader provides faithful PDF rendering, outline and page navigation, exact and conceptual search, selectable and copyable text, local highlights and notes, visual-region copy, reading progress, and bidirectional links between source anchors and lessons.

Reader progress is exposure evidence only. It never produces a comprehension or mastery claim.

### Lesson Library

Each source can contain multiple named lessons. A lesson records its chapter, section, page, and region coverage; objectives; planned duration; status; version; end-question state; and parent or repair relationship.

### Interactive Lesson

The primary lesson surface is a scrollable, multi-section interactive textbook. It is not a chat transcript, summary card stack, slide deck, or forced one-frame-at-a-time player.

Semantic frames remain the smallest independently versioned instructional units. Several frames can compose one coherent lesson section. The Experimental TSR canvas may render selected frames when a focused state sequence or persistent anchor materially improves the explanation.

### Agent Collaboration

The agent operates through focused WebMCP tools on the same live source and lesson. It can inspect source structure, search, navigate, propose plans, compose typed representations, discuss the active lesson section, analyze end-question answers, and propose revisions or repair lessons.

Without an agent, PRISM remains a complete Source Reader and can display lessons already saved locally. It does not generate or adapt new lessons.

## Lesson creation contract

1. The learner supplies a natural-language assignment, source scope, or both.
2. PRISM produces a complete scope manifest rather than relying only on search.
3. The agent classifies content as core, supporting, compressed, prerequisite, omitted, deferred, or source-only.
4. The agent proposes a lesson name, objectives, sequence, representations, time estimate, coverage ledger, end-question plan, and warnings.
5. One learner approval authorizes construction of that plan.
6. The agent composes the lesson through constrained representation tools.
7. PRISM runs source, coverage, accessibility, safety, and identity gates.
8. The lesson is saved under its source and remains reopenable without an agent.
9. Later scope changes, material revisions, and repair lessons require a new proposal and approval.

The full object and lifecycle are specified in [`INTERACTIVE_LESSON_SPEC.md`](INTERACTIVE_LESSON_SPEC.md).

## Coverage-aware compression

PRISM covers the objectives accepted in the lesson plan, preserves required prerequisites and qualifications, compresses supporting detail when appropriate, and discloses omissions. It does not promise to preserve every sentence or treat every paragraph as equally important.

Importance is estimated from:

- the learner's objective and assignment language;
- source emphasis and structural role;
- prerequisite and downstream dependency;
- definitions, central claims, mechanisms, theorems, methods, results, and limitations;
- application or transfer value;
- likely misconceptions;
- the available time.

The coverage ledger remains inspectable throughout the lesson.

## Representation policy

Representation is selected by the information structure and task before personal preference.

| Information structure | Preferred representation |
|---|---|
| Precise claim, definition, qualification | Detailed prose with persistent key terms and source evidence |
| Part-whole or spatial relation | Labeled source visual or reconstructed diagram |
| Causal mechanism | Causal graph, process view, or user-stepped animation plus prose |
| Change over time | Timeline, state sequence, chart, or reversible animation |
| Quantity or invariant | LaTeX equation, variable map, derivation, and worked example |
| Comparison | Table or aligned explanatory sections |
| Procedure or algorithm | Ordered steps, code, trace, and visible state |
| Research evidence | Method, result, figure/table, limitation, and interpretation |
| Abstract concept | Definition, governing relation, example, boundary case, and application |

Source-authored visuals, PRISM-reconstructed visuals, and added explanations are visibly distinct. The agent produces typed specifications; it never injects arbitrary HTML, JavaScript, SVG, styles, or executable code.

## Continuous discussion and revision

The agent keeps compact context for the active source, lesson version, section, nearby semantic frames, objectives, coverage ledger, source anchors, and current-session discussion. The learner can ask for clarification at any time.

The agent may answer conversationally, open exact evidence, demonstrate another representation, or propose a lesson revision. Conversation does not silently alter the saved lesson. A durable change creates a new learner-approved version.

## End-of-lesson questions

Questions appear after instruction, not as interruptions distributed through the lesson. A complete lesson normally ends with three to six source-grounded questions, including at least one explanation and one application task where the content supports them.

The learner may answer in Codex or another compatible agent conversation. The agent analyzes the answers against source-grounded criteria and records demonstrated, partially demonstrated, unclear, contradicted, or not attempted evidence with uncertainty.

The agent then proposes closing the lesson, continuing discussion, or creating a separately saved repair lesson. The learner accepts or dismisses that proposal in PRISM. The resulting receipt discloses how much immediate evidence was reviewed and never awards a universal mastery score.

## Source and trust

Every factual lesson block offers **Show source** and distinguishes:

- source verbatim;
- source paraphrase;
- source-authored visual;
- PRISM reconstruction;
- PRISM inference;
- added analogy or explanation;
- learner or reviewer addition.

If a lesson combines nonadjacent evidence, all anchors are available. If extraction or grounding is uncertain, PRISM keeps the region source-only and explains the limitation.

## Privacy and persistence

The hosted application stores personal source bytes, indexes, lessons, annotations, answers, and activity on the learner's device. The challenge release requires no account. Browser persistence is same-origin, same-browser, and same-device; export and restore provide portability.

Private-source content is not exposed to an agent until the learner grants per-source consent. Agent content calls return bounded text spans or page regions, never unrestricted raw PDF bytes. Reader-only use shares no source content with the agent.

See [`../architecture/DEVICE_LOCAL_WEB_ARCHITECTURE.md`](../architecture/DEVICE_LOCAL_WEB_ARCHITECTURE.md).

## Functional requirements

1. Add a source without storing its bytes on PRISM's server.
2. Reopen sources, annotations, lessons, and progress on the same device and production origin.
3. Read, select, copy, search, highlight, annotate, and navigate the original source without an agent.
4. Create multiple named lessons under one source with inspectable content ranges.
5. Approve a lesson plan once and let the agent construct only that accepted scope.
6. Render detailed prose, source visuals, diagrams, equations, code, tables, charts, and safe user-controlled animations.
7. Open the exact original page and region behind every factual block.
8. Discuss the active section with the agent without losing lesson context.
9. Revise only the selected lesson content and preserve earlier versions.
10. Present end questions after instruction and support answer discussion through the agent.
11. Save structured answer analysis and learner-approved repairs locally.
12. Keep completed lessons usable when the agent or network is unavailable.
13. Expose extraction, grounding, and coverage limitations rather than fabricating completeness.

## Accessibility and safety requirements

- WCAG 2.2 AA target;
- keyboard-complete Reader and lesson operation;
- correct screen-reader structure and meaningful reading order;
- text and controls usable at 200 percent zoom;
- full reduced-motion and static alternatives;
- no unsafe flashing or full-field flicker;
- captions, long descriptions, and semantic alternatives for visuals;
- KaTeX/MathML or equivalent accessible mathematics;
- code and tables with navigable semantics;
- no arbitrary executable agent output.

## Challenge scope

The challenge release demonstrates one open-license hero source, browser-local persistence, a genuinely excellent multi-section lesson, source and reconstructed visuals, exact agent navigation, plan-level approval, end-question discussion, and a completion or repair decision.

It does not claim universal PDF understanding, broad learning efficacy, cross-device sync, OCR completeness, arbitrary code execution, automatic video generation, or a generalized course-management platform.

## Product language

Use:

- “Turn assigned reading into a source-grounded interactive lesson.”
- “See the source behind every explanation.”
- “Stored locally on this device.”
- “Coverage-aware compression with disclosed omissions.”
- “Build a mental model, one meaningful frame at a time.”

Avoid:

- “Upload knowledge into your brain.”
- “Learn twice as fast.”
- “AI knows what matters in every subject.”
- “Completion means mastery.”
- “Every PDF is parsed perfectly.”
