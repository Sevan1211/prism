# Conceptual system design

## Design goal

Create a pipeline in which every presented representation is traceable, versioned, measurable, and replaceable. The architecture must support fair experiments: the same canonical content can be rendered as normal text, one-word RSVP, or PRISM semantic frames without changing what is tested.

## System flow

```text
Source
  ↓
structure-preserving ingestion
  ↓
canonical document model
  ↓
claims + concepts + relations + prerequisites
  ↓
semantic frame plan
  ↓
representation generation / selection
  ↓
fidelity and accessibility checks
  ↓
versioned lesson package
  ↓
adaptive player ↔ learner state
  ↓
checkpoints + delayed review + research outcomes
```

## Component boundaries

### 1. Ingestion

Responsibilities:

- accept pasted text, `.txt`, Markdown, and clean text-based PDFs, including large full-book sources within tested resource limits;
- preserve headings, paragraphs, lists, captions, tables, equations, and figure references;
- record page/section/character offsets;
- store source hashes and content rights metadata;
- reject or flag low-confidence extraction.

The ingestion layer never summarizes. Its output is a canonical document that can be reprocessed without re-uploading or silently changing the source. Large books become progressively available: Source first, then search/structure, then section-level lessons on demand.

PDF support is confidence-gated. v0 accepts PDFs whose text order and page structure can be recovered reliably. Scanned/OCR-heavy, multi-column, or otherwise ambiguous pages fall back to Source mode or are rejected; PRISM must not silently flatten an uncertain extraction.

The detailed import, page-window, resumption, security, and extraction-quality contract is in `PDF_PIPELINE.md`.

### 2. Structural parser

Responsibilities:

- recover document hierarchy;
- associate figures with captions and mentions;
- distinguish examples, definitions, notes, warnings, and exercises;
- preserve equation tokens and symbol definitions;
- detect cross-references.

The clean-PDF slice supports headings, prose, exact-caption detection, and source-faithful rendered regions for detectable figures and tables. Front matter and back matter remain indexed but are excluded from playback by default. Equation semantics, table cell structure, fragmented vector reconstruction, OCR, and figure interpretation remain explicit capability flags rather than partially working magic.

### 3. Knowledge mapper

Responsibilities:

- extract canonical claims;
- identify concepts and aliases;
- connect relations such as `causes`, `contrasts_with`, `part_of`, `precedes`, `defined_as`, and `example_of`;
- identify required earlier claims;
- distinguish explicit source claims from generated inferences.

Each node and edge includes source spans. No edge created only by the model is marked “explicit.”

For a full textbook, source structure and learner knowledge remain separate graphs. The source graph represents chapters, references, and claims; the learner graph represents observed evidence across those claims.

### 4. Frame planner

Responsibilities:

- segment content at semantic and instructional boundaries;
- choose frame type;
- order frames without violating source logic or prerequisites;
- insert integration and retrieval points;
- generate a deterministic baseline plan.

Hard segmentation constraints:

- do not split named entities or multiword terminology;
- keep negation with its scope;
- keep comparison poles available together;
- preserve condition–consequence relationships;
- do not separate an equation from symbol definitions;
- do not show a pronoun without a recoverable referent;
- preserve source ordering unless a reordering is explicit and validated.

### 5. Representation service

Responsibilities:

- render canonical text frames;
- select an existing source visual when it is adequate;
- generate simple diagrams from explicit relations and clearly label any inferred relation;
- create examples or analogies as separately labeled additions;
- produce accessible alternatives;
- store representation provenance and generation parameters.

The service should prefer programmatic, inspectable diagrams for early versions. Generated decorative imagery adds little instructional value and creates fidelity risk.

### 6. Quality gate

Before a lesson is playable, checks evaluate:

- coverage: were essential claims omitted?
- entailment: is each paraphrase supported by its source span?
- contradiction: does any frame conflict with the source or another frame?
- relation fidelity: are diagram arrows and labels justified?
- ordering: are prerequisites available before dependent frames?
- accessibility: is equivalent text present, and are motion/flash constraints met?
- answerability: can each checkpoint be answered from taught content?

Automated checks assist but do not prove correctness. A lesson can have `draft`, `reviewed`, or `verified` status.

Automatic practice questions may ship in a draft lesson after grounding and answerability checks. Outcome-measure questions used for performance claims require reviewed, versioned, and piloted status.

### 7. Lesson package

A versioned lesson package contains:

- source metadata and content hash;
- canonical document version;
- concept graph version;
- ordered frames;
- representation variants;
- checkpoint bank and rubrics;
- presentation configurations;
- accessibility alternatives;
- content and generation licenses;
- verification status.

Once prepared, the package is self-contained enough for offline playback, note capture, assessment, and review scheduling.

Changing segmentation, a diagram, or a question creates a new package version so experimental results remain interpretable.

### 8. Adaptive player

The player controls:

- which representation variant is shown;
- active/persistent/preview frame regions;
- dwell time and boundary pauses;
- the continuous Faster ↔ Deeper control and Auto policy;
- manual controls;
- repair sequences;
- focus and visibility pauses;
- accessibility modes;
- event logging.

It does not change the canonical claim. Adaptation changes timing, context, explanation, example, or review—not factual content.

In Understand and Study, a versioned safety rule can automatically slow effective presentation when correctness, confidence, latency, or repair behavior crosses the configured learning-risk threshold. The event and reason are logged and inspectable. Continuing without that guardrail requires the explicit Preview contract.

### 9. Learner model

Initial learner state should be small and explainable:

- content goal;
- prior-knowledge results;
- concept status: unseen, exposed, retrieved, inferred, transferred, retained;
- latest correctness and confidence;
- response latency;
- pause/rewind/replay history;
- preferred pace and context window;
- accessibility settings.

v0 persists this state in a local profile without an account. v1 may add optional encrypted synchronization. A longer-term personal knowledge graph connects mastered, weak, and prerequisite concepts across lesson packages without weakening source-level provenance.

Avoid a single “comprehension score.” A learner can recall a definition while failing inference or application.

### 10. Assessment and review

Assessment items link to concepts, source claims, and outcome type:

- literal;
- inferential;
- near transfer;
- far transfer, when valid;
- delayed retention;
- metacognitive calibration.

Feedback should explain the governing relationship and reopen the source. It should not merely reveal an answer letter.

Practice items can be generated automatically and versioned with their source links and answer rationale. Research instruments remain a separate reviewed collection so PRISM does not grade its own learning claims with an unvalidated question generator.

## Conceptual data contracts

### Source span

```yaml
source_span:
  document_version: string
  section_path: [string]
  start_offset: integer
  end_offset: integer
  extracted_text: string
```

### Canonical claim

```yaml
claim:
  id: string
  proposition: string
  source_spans: [source_span]
  status: explicit | inferred | added_explanation
  qualifiers: [string]
  concepts: [concept_id]
```

### Semantic frame

```yaml
frame:
  id: string
  claim_ids: [string]
  type: definition | proposition | contrast | causal | process | example | equation | visual | integration | retrieval | repair
  prerequisite_frame_ids: [string]
  representation_variant_ids: [string]
  pacing_features:
    lexical_difficulty: number
    proposition_count: integer
    novelty: number
    integration_distance: integer
  minimum_dwell_ms: integer
  auto_advance_allowed: boolean
  verification_status: draft | reviewed | verified
```

### Learner concept state

```yaml
concept_state:
  concept_id: string
  exposure_count: integer
  literal_status: unknown | incorrect | correct
  inference_status: unknown | incorrect | correct
  transfer_status: unknown | incorrect | correct
  retention_status: untested | incorrect | correct
  confidence: number | null
  due_at: timestamp | null
```

## Rule-based adaptation before machine learning

The first adaptive engine should be a versioned policy table. Reasons:

- behavior is inspectable;
- experiments can attribute effects;
- sparse early data will not support a robust learned policy;
- errors are easier to reproduce;
- accessibility and minimum dwell constraints remain enforceable.

A learned policy becomes reasonable only after PRISM has many consented sessions with delayed outcomes. Its objective must include retained performance, not clicks, session completion, or speed alone.

## Textbook-specific requirements

Textbook ingestion adds structural obligations:

- definitions must remain exact where wording matters;
- figures, captions, legends, and in-text references form one unit;
- equations require symbol tables, assumptions, and dimensional checks;
- worked examples require state persistence across steps;
- tables need header semantics and meaningful comparisons;
- sidebars must be classified as essential, enrichment, warning, or example;
- prerequisites may be outside the current section;
- exercises and solutions must remain separated to avoid leakage.

The system should refuse unsupported elements and fall back to Source mode rather than flattening them incorrectly.

## Privacy and sensitive signals

MVP event data can be useful without biometrics:

- frame shown/hidden timestamps;
- pause, rewind, replay, and speed controls;
- answers, confidence, and latency;
- browser visibility state;
- accessibility settings.

Gaze, webcam, pupil, EEG, heart rate, or electrodermal signals require a separate research protocol, explicit consent, minimal retention, a no-penalty opt-out, and clear statements that the signal estimates attention or workload rather than reading thoughts.

If sensor research proceeds, gaze is the first track. Broader biosignals remain out of scope until gaze adds value beyond answers and interaction behavior.

## Runtime and cloud boundary

v0 is a local Windows web application:

- canonical documents, lesson packages, profiles, notes, events, and review schedules remain local;
- completed lesson playback and assessment work offline;
- approved cloud AI may receive only the minimum source content needed for generation;
- provider, model, prompt/configuration version, cost, and returned artifacts are logged;
- monthly external-service spending is capped at $25 during v0 development;
- providers remain replaceable, and a cloud failure never prevents access to an existing lesson or source.

The model-routing, structured-output, local-model, cost, and cloud-consent rules are specified in `AI_STRATEGY.md`. The proposed implementation stack and dependency boundaries are in `TECH_STACK.md`.

Explicitly opted-in, anonymized interaction data may later support model research. Research consent is separate from normal use, and personal learning data is never sold.

## Failure behavior

- Low-confidence extraction → show source and request correction.
- Unsupported equation/table/figure → keep it intact in Source mode; do not fabricate a transformation.
- Fidelity check failure → block publication of the representation.
- Adaptation uncertainty → use conservative pacing and preserve more context.
- Lost focus → pause automatically if the user enabled that option.
- Assessment ambiguity → remove the item from scoring and flag it for review.
- Missing delayed data → report immediate results only; do not infer retention.

## Build sequence

1. Representative clean computing-PDF fixture, immutable source storage, and canonical page records.
2. PDF.js Source mode, page-region provenance, and extraction confidence gates.
3. Deterministic semantic segmentation plus normal-reading and RSVP baselines.
4. Stable cumulative semantic player with pause, step, rewind, context, and reduced motion.
5. Source traceability, deterministic lesson packages, and research event logging.
6. Resumable full-book structure/search indexing with section-level compilation on demand.
7. Persistent local learner profile, notes, and overlays.
8. Outcome-labeled sparse checkpoints plus 24-hour and 7-day retests.
9. Rule-based Faster ↔ Deeper adaptation, automatic slowdown, and repair.
10. Typed relation/code/process diagrams with inference labels.
11. Equation, table, figure, and mixed/OCR page adapters behind explicit capability gates.
12. Learned adaptation after adequate consented delayed-outcome data.
13. Optional gaze research as a separate track.
