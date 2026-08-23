# Product specification

**Reviewed:** 2026-08-23  
**Research integration:** [`../research/DOSSIER_INTEGRATION_REVIEW.md`](../research/DOSSIER_INTEGRATION_REVIEW.md)  
**Experimental mechanism:** Traceable Semantic Relay (TSR)

## Product statement

PRISM provides an enhanced static Source Reader and may compile trustworthy source material into source-linked semantic frames for a learner-controlled Traceable Semantic Relay canvas. It helps a learner preview, understand, and retain information while continuously distinguishing source exposure, immediate task evidence, and delayed learning evidence.

## Primary user job

> “Help me understand this unfamiliar explanatory text efficiently enough that I can explain it and use it later, without losing access to the original.”

For the first prototype, “later” means the project owner can still explain the governing idea and apply it to a new example seven days after learning. Exact recall is added where content requires precision.

## Initial user and content assumptions

- the project owner as the first primary and longitudinal user;
- later generalization to English-reading adult and college learners;
- desktop/laptop web browser;
- computing and AI-related PDFs first, with a bounded learning unit of roughly 800–2,000 words for the initial experiments;
- an initial benchmark trio of database transaction isolation, TCP congestion control, and distributed consensus, chosen to exercise different forms of technical reasoning;
- the uploaded source may be a large born-digital PDF or full textbook even when the current unit is one section;
- content the learner is allowed to upload or that PRISM is licensed to process;
- low-to-moderate domain knowledge;
- no required eye tracker, camera, wearable, or biometric device.

These assumptions are the v0 validation boundary, not the long-range format limit.

## Reading-centered contract

PRISM is an adaptive reading medium. Source Reader is a first-class surface and the evidence baseline; TSR is an Experimental transformation surface—not a queue of questions.

- Most active session time should be spent receiving, integrating, and controlling source-grounded representations.
- A check appears only when it can diagnose a high-value relation, expose an illusion of understanding, or choose a useful repair.
- The learner can skip a check and continue reading; PRISM then labels the affected evidence as exposure rather than demonstrated learning.
- Reviews are brief continuations of reading, not a gamified flashcard home screen or mastery dashboard.
- There are no streaks, leaderboards, assignment dashboards, class rosters, or instructor workflows.

The exact ratio of reading to diagnostic activity is an experimental parameter. The product should not manufacture questions merely to appear interactive.

## Experience model

### 1. Set the goal

The user chooses:

- **Preview:** find structure and main ideas quickly;
- **Understand:** build a coherent mental model;
- **Study:** remember and apply later.

The choice changes representation, support, checkpoints, and the definition of completion. PRISM never reports a Preview session as demonstrated understanding or retention.

Every goal exposes a **Faster ↔ Deeper** bundle control, with **Auto** as the learning-first recommendation. It does not silently convert Study into Preview. Each change lists the exact frames, examples, anchors, checks, transitions, and estimated time affected and can be undone.

### 2. Calibrate

A short onboarding passage checks interaction access, preferred information density, optional Preview transition comfort, and a few content-relevant prior-knowledge questions. The user can skip calibration and use conservative learner-stepped defaults. It does not assign a universal reading rate or learning trait.

Calibration measures:

- comfortable bundle depth and optional Preview transition pace;
- preferred amount of visible context;
- ability to pause/advance with keyboard or pointer;
- optional reduced-motion, contrast, font, and text-to-speech settings;
- brief content-relevant prior knowledge.

### 3. Preview the map

Before streaming, PRISM shows a compact map:

- topic and source;
- learning objective;
- section sequence;
- 3–7 key concepts;
- prerequisite warnings;
- one guiding question.

This creates a scaffold for incoming details.

### 4. Use Traceable Semantic Relay

The central canvas keeps stable spatial zones:

```text
┌──────────────────────────────────────────────────────────────┐
│ Topic > Section > current concept              progress  34% │
│                                                              │
│  persistent source visual  │  CURRENT SEMANTIC FRAME         │
│  or section field          │                                  │
│                            │  just passed: previous sentence  │
│                                                              │
│      rewind     pause/continue     source     faster/deeper   │
└──────────────────────────────────────────────────────────────┘
```

This is one screen, but it is not one disappearing word. TSR cycles through **Anchor, Advance, Integrate, and Repair**. The preceding semantic frame sits directly below the active frame for a quick downward skim; it is not rendered as low-contrast background text. On desktop, one relevant source figure, table, equation, code region, or structural marker may remain on the left while it supports the active relation. It resets when irrelevant or at a section boundary rather than carrying unrelated material forward.

Advancement is learner-controlled by default. Preview may offer optional autoplay, off by default. Understand autoplay is off by default and never advances through equations, code traces, tables, source inspection, prompts, or repairs. Study has no automatic advancement through instructional frames in v0.

### 5. Integrate

At concept boundaries the stream pauses or slows for one of:

- a concise causal chain;
- a labeled diagram;
- a comparison;
- an equation with variable roles;
- a worked micro-example;
- a prediction prompt.

### 6. Verify

At selected concept boundaries—not on a fixed clock—the user may receive one low-friction check:

- recall the main relation;
- select the missing step;
- predict an outcome;
- explain in one sentence;
- place labels or arrows;
- distinguish an example from a nonexample.

An answer that misses or reverses a specific governing relation may trigger one source-linked repair and one recheck. A skip or “not ready” response remains meaningful and does not create a learner trait.

### 7. Retain

Study mode creates a short review queue. Failed, guessed, or high-value concepts return after an appropriate delay. A later session evaluates retention without simply replaying the exact frame first.

The default validation path includes an interim 24-hour check and a central 7-day explanation/application check. Product use can offer lighter schedules, but no core durable-learning claim is based only on same-session or next-day performance.

## Semantic frame model

A frame is the smallest independently controlled unit that carries one coherent instructional function.

Required attributes:

- stable identifier;
- source span(s) for every factual clause;
- canonical claim and primary relation identifiers;
- explicit content origin for every visible block;
- frame type;
- prerequisite concept identifiers;
- estimated novelty and complexity;
- selected representation and inspectable selection reason;
- expected-active-time range as a UX estimate, never a mastery estimate;
- accessible alternative;
- optional checkpoint link;
- extraction, grounding, review, and publication states kept separate;
- provenance and quality-check bundle;
- learner events and outcome references.

Proposed frame types:

- proposition;
- definition;
- contrast;
- causal relation;
- sequence/process step;
- example/nonexample;
- equation;
- diagram focus;
- table comparison;
- integration summary;
- retrieval prompt;
- feedback/repair.

## Representation policy

Representation is selected by the idea and task before user preference.

| Information structure | Default representation |
|---|---|
| Precise claim, definition, qualification | Text with persistent key terms |
| Spatial relationship or part–whole structure | Labeled static diagram |
| Causal chain | Node-link or step diagram plus short text |
| Change over time | Ordered static or user-stepped state frames; short reversible animation only when continuous change is essential |
| Quantity or invariant relationship | Equation plus variable mapping and example |
| Comparison across several attributes | Small table or aligned cards |
| Abstract unfamiliar concept | Definition, concrete example, then boundary/nonexample |
| Procedure | Worked steps with state carried forward |

User preference chooses among valid alternatives; it does not override fidelity or suitability. The default representation budget is one active representation plus at most one source or structural anchor. If highlighted source content already expresses the relation well, PRISM should not redraw it.

## Faster, Deeper, and advancement policy

### Learning-first bundle contract

The product objective is ordered rather than collapsed into one opaque score:

1. meet the selected standard for delayed retention and transfer;
2. preserve source fidelity, accessibility, and user control;
3. minimize active learning time and avoid unnecessary workload.

The control adjusts a bundle of instructional parameters and always produces an itemized, reversible receipt:

| Bundle direction | Allowed adjustments | Guard |
|---|---|---|
| Faster | Merge adjacent micro-frames that express one relation, hide optional examples, reduce optional checks, shorten transition delays, collapse already demonstrated definitions | Never removes qualifiers, source links, learner control, accessibility content, required evidence, or the selected goal |
| Auto | Recommend the least costly currently supported bundle from goal, accessibility settings, prior-knowledge evidence, task evidence, and delayed results | Recommendation remains explainable and reversible; no silent mode change |
| Deeper | Split a dense frame, keep the source anchor longer, add a worked contrast/example, show a different representation, insert a boundary prompt or prerequisite repair | Added time and content are shown; more is not presumed better |

In Understand and Study, PRISM may **offer** a Deeper bundle when task evidence shows that a governing relation is unresolved. Explicit learner choice applies immediately and outranks behavioral inference. An automatic content change is not permitted merely because the learner paused, rewound, replayed, inspected the source, responded slowly, or lost focus.

Preview mode is a separate contract: it may maximize orientation and gist, but its completion report explicitly says that retention and transfer were not established.

Do not compute a learning claim or an auto-advance decision from word count alone. Frame planning and expected-active-time estimates may account for:

- phrase length;
- word frequency and technical vocabulary;
- syntactic boundary and punctuation;
- novelty relative to the learner model;
- number of propositions;
- need to integrate with an earlier frame;
- negation, exception, contrast, or uncertainty;
- equation or visual inspection time;
- preceding checkpoint result;
- source/representation inspection demands.

The MVP implements transparent, versioned rules and a fixed nonadaptive Study bundle. A learned policy comes only after adequate randomized delayed-outcome data and must beat the fixed and deterministic policies under fidelity, accessibility, workload, and control constraints.

### Conservative adaptation rules

- Required-prerequisite miss: offer a short prerequisite, exact source definition, or skip.
- High-confidence governing-relation error: offer a contrastive repair with exact source evidence.
- Low-confidence correct answer: offer one confirmation case or continue; do not mark the response wrong.
- Repeated navigation **plus** a failed or “not ready” task: offer a representation switch or Deeper bundle and state both evidence types used.
- Two distinct successful items including application: offer, never silently apply, one Faster step.
- Long inactivity: stop active-time accumulation; make no content inference.
- Focus loss: pause optional autoplay and offer prior context on return; do not infer distraction.
- Manual Faster, Deeper, Source, transcript, or accessibility choice: apply immediately when safe and do not reverse it automatically in the same concept.
- Seven-day failure: use a new case and representation rather than merely replaying the original wording.
- Repeated rejection of one recommendation: suppress that recommendation class for the session.

## Source view and trust

Every frame offers “show source.” The view highlights the exact originating spans and distinguishes:

- source text;
- faithful paraphrase;
- generated explanation;
- generated analogy;
- generated visual;
- reviewer- or learner-added material.

If a frame synthesizes nonadjacent source spans, all spans are shown. If a diagram represents an inference rather than an explicit source claim, it is labeled as an interpretation.

## Textbook progression

### Stage 1: explanatory prose

- headings and paragraphs;
- definitions and causal relations;
- source-provided static images and captions;
- manually authored or reviewed typed diagrams only where source text is inadequate;
- one sparse concept-boundary checkpoint and repair in the gold lesson.

### Stage 2: textbook sections

- prerequisites and learning objectives;
- equations and symbol definitions;
- tables and figure references;
- worked examples;
- terminology index;
- end-of-section exercises;
- cross-section concept graph.

### Stage 3: textbook systems

- chapter dependencies;
- adaptive path based on concept-specific immediate and delayed evidence;
- multi-session spacing;
- cumulative problems;
- provenance across editions and sources;
- learner-created corrections and versioned personal overlays.

## MVP scope

### In scope

- paste text or upload `.txt`, Markdown, or a clean text-based PDF, including a large/full-book source within tested resource limits;
- resumable whole-document structural indexing with section-level deep transformation on demand;
- preserve and inspect paragraphs, headings, regions, and extraction status;
- first-class enhanced static Source Reader and conventional-reading baseline;
- one manually reviewed transaction-isolation lesson package;
- learner-controlled Traceable Semantic Relay frames;
- manual Faster/Deeper bundles with itemized receipts;
- source highlights and one-action exact context inspection;
- text, source-region, annotated-source, table-lens, and reviewed typed-diagram frames;
- lazy source-faithful figure and table regions for clean PDFs, with caption provenance and Source fallback;
- one reviewed, source-linked explanation/application prompt, rubric, and repair;
- 24-hour and 7-day local review scheduling;
- persistent local concept evidence without a single mastery probability;
- in-flow note capture that remains outside model payloads by default;
- source-free research export and an evidence-labeled progress report.

### Out of scope

- arbitrary scanned PDFs;
- one-word RSVP as a product feature; it is an optional research-only negative control;
- generated video;
- open-ended generated images;
- camera/gaze/EEG adaptation;
- learned pacing or representation policy;
- user accounts, sync, mobile, social, instructor, or course-management features;
- minors or clinical claims;
- high-stakes professional certification;
- automatic publication of copyrighted transformed material;
- claims of faster learning before controlled evaluation.

## Functional requirements

1. The user can step forward, step backward, pause optional Preview/Understand autoplay, open Source Reader, and jump to a concept at any time.
2. Study has no automatic instructional-frame advancement in v0, and no permitted auto-advance can make content irrecoverable.
3. The user can open the original source context from every instructional frame.
4. The player logs presentation and focus state needed for a versioned active-time derivation; it never labels focused time as attention.
5. Checkpoints distinguish literal, inferential, and transfer questions.
6. Confidence is recorded only with an answer, never as the sole comprehension signal.
7. The user can choose static/reduced-motion presentation with equivalent information.
8. A session report separates exposure, immediate task evidence, 24-hour evidence, seven-day evidence, and unmeasured outcomes.
9. Every transformed block carries origin, source support, quality, provenance, and publication status.
10. The system can compare enhanced Source Reader, semantic frames without the sparse loop, and full TSR on the same canonical content. One-word RSVP may be added only to a locked research protocol.

## Nonfunctional requirements

- keyboard-complete operation;
- responsive but desktop-first layout;
- no unsafe flashing and no full-field flicker;
- WCAG 2.2 AA target, with reduced-motion behavior designed toward AAA animation guidance;
- deterministic playback for a given content version and parameter set;
- versioned source, chunking, representation, and question data;
- exportable anonymized research events;
- local Windows lesson/player/profile storage with optional approved cloud AI generation;
- completed lesson packages remain usable offline;
- no biometric collection in the default product.

## Product language

Use:

- “Build a mental model, one meaningful frame at a time.”
- “See the source behind every explanation.”
- “Optimize for what you can still explain later.”
- “Traceable Semantic Relay is an experimental way to move between source evidence, representations, integration, and repair.”

Avoid:

- “Upload knowledge into your brain.”
- “Read at 1,000 words per minute with full comprehension.”
- “AI knows your learning style.”
- “Gaze proves you understood.”
- “Completion means mastery.”
