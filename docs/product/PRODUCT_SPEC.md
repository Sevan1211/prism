# Product specification

## Product statement

PRISM converts trustworthy source material into a sequence of source-linked semantic frames and plays those frames on a stable, adaptive canvas. It helps a learner preview, understand, and retain information while continuously distinguishing what was shown from what was actually learned.

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

PRISM is an adaptive reading medium. Its default surface is the source map plus semantic stream—not a queue of questions.

- Most active session time should be spent receiving, integrating, and controlling source-grounded representations.
- A check appears only when it can diagnose a high-value relation, expose an illusion of understanding, or choose a useful repair.
- The learner can skip a check and continue reading; PRISM then labels the affected evidence as exposure rather than verified learning.
- Reviews are brief continuations of reading, not a gamified flashcard home screen.
- There are no streaks, leaderboards, assignment dashboards, class rosters, or instructor workflows.

The exact ratio of reading to diagnostic activity is an experimental parameter. The product should not manufacture questions merely to appear interactive.

## Experience model

### 1. Set the goal

The user chooses:

- **Preview:** find structure and main ideas quickly;
- **Understand:** build a coherent mental model;
- **Study:** remember and apply later.

The choice changes pacing, checkpoints, and the definition of completion. PRISM never reports a Preview session as mastery.

Every goal exposes a continuous **Faster ↔ Deeper** slider, with **Auto** as the learning-first default. It does not silently convert Study into Preview. Instead, it changes the path taken within the selected outcome contract.

### 2. Calibrate

A short onboarding passage estimates a comfortable phrase rate and asks a few prior-knowledge questions. The user can skip calibration and use conservative defaults.

Calibration measures:

- comfortable pace;
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

### 4. Play the semantic stream

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

This is one screen, but it is not one disappearing word. The preceding semantic frame sits directly below the active frame for a quick downward skim; it is not rendered as low-contrast background text. On desktop, the most recently introduced source figure or table remains on the left until a new visual appears or a section boundary resets the field. A section boundary without a visual uses a quiet section marker rather than carrying an unrelated diagram forward.

### 5. Integrate

At concept boundaries the stream pauses or slows for one of:

- a concise causal chain;
- a labeled diagram;
- a comparison;
- an equation with variable roles;
- a worked micro-example;
- a prediction prompt.

### 6. Verify

Every few concepts—not every few sentences—the user receives a low-friction check:

- recall the main relation;
- select the missing step;
- predict an outcome;
- explain in one sentence;
- place labels or arrows;
- distinguish an example from a nonexample.

Incorrect or uncertain answers trigger a repair sequence tied to the source.

### 7. Retain

Study mode creates a short review queue. Failed, guessed, or high-value concepts return after an appropriate delay. A later session evaluates retention without simply replaying the exact frame first.

The default validation path includes an interim 24-hour check and a central 7-day explanation/application check. Product use can offer lighter schedules, but no core durable-learning claim is based only on same-session or next-day performance.

## Semantic frame model

A frame is the smallest independently paced unit that carries a coherent instructional function.

Required attributes:

- stable identifier;
- source span(s);
- canonical claim;
- frame type;
- prerequisite concept identifiers;
- estimated novelty and complexity;
- selected representation;
- minimum/initial dwell policy;
- accessible alternative;
- optional checkpoint link;
- generation status and confidence;
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
| Change over time | Segmented animation or ordered static frames |
| Quantity or invariant relationship | Equation plus variable mapping and example |
| Comparison across several attributes | Small table or aligned cards |
| Abstract unfamiliar concept | Definition, concrete example, then boundary/nonexample |
| Procedure | Worked steps with state carried forward |

User preference chooses among valid alternatives; it does not override fidelity or suitability.

## Pacing policy

### Learning-first pace contract

The product objective is ordered rather than collapsed into one opaque score:

1. meet the selected standard for delayed retention and transfer;
2. preserve source fidelity, accessibility, and user control;
3. minimize active learning time and avoid unnecessary workload.

The continuous slider adjusts a bundle of instructional parameters. The labels below describe regions of the control rather than three fixed presets:

| Slider region | Likely adjustments | Outcome contract |
|---|---|---|
| Faster | Shorter dwell, less persistent context, fewer optional examples, wider spacing between checks | Still verifies the selected learning goal; risk is shown and mastery is withheld without evidence |
| Auto | Fastest policy supported by current performance, prior knowledge, content difficulty, and validated bounds | Default learning-first policy |
| Deeper | More context, slower integration frames, additional examples, more generative checks, stronger review | Optimizes robustness, inference, and transfer over session speed |

In Understand and Study, PRISM automatically moves the effective pace toward Deeper when evidence shows that the selected rate is exceeding the learner’s current processing capacity. The change is visible and its reason is inspectable. A user who wants to continue faster can switch to Preview, whose contract is explicitly gist/orientation rather than verified durable learning. PRISM must not silently claim durable learning without later evidence.

Preview mode is a separate contract: it may maximize orientation and gist, but its completion report explicitly says that retention and transfer were not established.

Do not compute dwell time from word count alone. Initial pacing should account for:

- phrase length;
- word frequency and technical vocabulary;
- syntactic boundary and punctuation;
- novelty relative to the learner model;
- number of propositions;
- need to integrate with an earlier frame;
- negation, exception, contrast, or uncertainty;
- equation or visual inspection time;
- preceding checkpoint result;
- user pauses, replays, and manual speed changes.

The MVP can implement these as transparent rules. A learned policy comes only after enough outcome data exist and must be compared with the rules.

### Conservative adaptation rules

- Two rewinds within a concept: slow that concept and expose more context.
- Incorrect literal answer: replay the source-grounded claim with a concrete example.
- Incorrect inference with correct literal answer: show the missing relation, not the same wording.
- Correct fast responses with high confidence across several concepts: gradually shorten noncritical frame dwell.
- Long inactivity or focus loss: pause; never silently skip ahead.
- User moves the slider faster: apply it inside the current validated bound; automatically slow in Understand/Study if learning evidence crosses the risk rule, or allow the user to continue under Preview’s exposure-only contract.
- A Faster setting produces good immediate performance but weak delayed evidence: lower the future Auto pace for comparable content and explain why.
- A Deeper setting adds time without improving delayed outcomes: remove the unproductive elaboration rather than assuming slower is always better.

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
- simple generated diagrams;
- short checkpoints.

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
- adaptive path based on mastery;
- multi-session spacing;
- cumulative problems;
- provenance across editions and sources;
- learner-created corrections and versioned personal overlays.

## MVP scope

### In scope

- paste text or upload `.txt`, Markdown, or a clean text-based PDF, including a large/full-book source within tested resource limits;
- resumable whole-document structural indexing with section-level deep transformation on demand;
- preserve paragraphs and headings;
- semantic chunking into phrases/clauses;
- conventional reading baseline;
- one-word RSVP experimental baseline;
- cumulative semantic stream;
- manual pace and context controls;
- rule-based content-aware timing;
- source highlights;
- text-only and small static-diagram frames;
- lazy source-faithful figure and table regions for clean PDFs, with caption provenance and Source fallback;
- automatic, source-linked practice-question drafts;
- literal, inference, and transfer checks;
- 24-hour and 7-day local review scheduling;
- persistent local learner profile and personal overlays;
- optional complementary narration;
- in-flow note and question capture;
- exportable research data, progress reports, and optional review cards.

### Out of scope

- arbitrary scanned PDFs;
- generated video;
- camera/gaze/EEG adaptation;
- minors or clinical claims;
- high-stakes professional certification;
- automatic publication of copyrighted transformed material;
- claims of faster learning before controlled evaluation.

## Functional requirements

1. The user can pause, resume, step forward, step backward, and jump to a concept at any time.
2. No auto-advance can make content irrecoverable.
3. The user can open the original source context from every instructional frame.
4. The player logs shown duration separately from active attention time when focus state is available.
5. Checkpoints distinguish literal, inferential, and transfer questions.
6. Confidence is recorded only with an answer, never as the sole comprehension signal.
7. The user can choose static/reduced-motion presentation with equivalent information.
8. A session report separates exposure, immediate performance, and later retention.
9. Generated representations carry provenance and status.
10. The system can run the three experimental presentation variants on the same content.

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

Avoid:

- “Upload knowledge into your brain.”
- “Read at 1,000 words per minute with full comprehension.”
- “AI knows your learning style.”
- “Gaze proves you understood.”
