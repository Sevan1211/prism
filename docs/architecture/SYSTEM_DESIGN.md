# Conceptual system design

**Reviewed:** 2026-08-23  
**Research integration:** [`../research/DOSSIER_INTEGRATION_REVIEW.md`](../research/DOSSIER_INTEGRATION_REVIEW.md)  
**Implementation sequence:** [`../engineering/IMPLEMENTATION_PLAN.md`](../engineering/IMPLEMENTATION_PLAN.md)

## Design goal

Create a pipeline in which every presented representation is traceable, versioned, measurable, and replaceable. The architecture must support fair experiments: the same canonical content can be rendered as normal self-paced text, the enhanced Source Reader, or Traceable Semantic Relay (TSR) without changing what is taught. One-word RSVP is an optional research-only negative control, not a product architecture requirement.

## System flow

```text
Source
  ↓
structure-preserving ingestion
  ↓
canonical document model
  ↓
claims + concepts + relations + prerequisites
  ├──────────────────────────────→ enhanced Source Reader
  ↓                                      ↕ exact source location
semantic frame plan → representation candidates
  ↓
deterministic selection + fidelity/accessibility gates
  ↓
immutable lesson package + static transcript
  ↓
TSR player: Anchor → Advance → Integrate → Repair
  ↓
sparse learning loop ↔ versioned learner evidence
  ↓
24-hour / 7-day review + research export
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

Each node and edge includes source spans or an explicit project-inference label. No edge created only by the model is marked `source_explicit`, and no model-created record becomes approved through self-review.

For a full textbook, source structure and learner knowledge remain separate graphs. The source graph represents chapters, references, and claims; the learner graph represents observed evidence across those claims.

### 4. Frame planner

Responsibilities:

- segment content at semantic and instructional boundaries;
- choose frame type;
- order frames without violating source logic or prerequisites;
- insert integration and retrieval points;
- generate a deterministic baseline plan.

The planner emits the TSR roles explicitly:

- **Anchor:** the definition, relation, diagram skeleton, equation, code state, or comparison pole that must remain recoverable;
- **Advance:** the next coherent proposition, worked state, or source visual change;
- **Integrate:** a boundary frame that makes the governing relation or changed mental model inspectable;
- **Repair:** a source-linked contrast or re-representation triggered only by direct task evidence or a learner request.

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
- locator closure: do all selected-unit claims, visual relations, prompts, answers, and repairs resolve to immutable source evidence?
- publication authority: did an allowed deterministic rule or human reviewer—not a generator—make the state transition?

Automated checks assist but do not prove correctness. Publication and support are separate axes: a record may be `draft`, `needs_review`, `approved`, `rejected`, or `superseded`, while clause support may be `supported`, `partially_supported`, `unsupported`, or `not_applicable`. “Verified” must name exactly what was checked and by whom rather than acting as a universal badge.

**Implemented deterministic baseline, 2026-08-23:** the source-verbatim compiler now rejects a draft package before storage when an exact text offset or region does not match its indexed element, a claim/visual/prerequisite reference is orphaned or forward-pointing, an accessible equivalent is empty, a dwell order is invalid, or the package identity does not match its content. The package hash covers the complete stable instructional payload rather than only an ID list, and a rejected recompilation leaves the last valid stored lesson unchanged. These checks establish locator and graph integrity for the current baseline; they do not establish semantic entailment, essential-claim coverage, or human approval.

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
- a static transcript rendered from the same ordered records;
- accessibility alternatives;
- source-reader fallback bindings;
- content and generation licenses;
- publication, support, provenance, and quality-check states.

Once prepared, the package is self-contained enough for offline playback, note capture, assessment, and review scheduling.

Changing segmentation, a diagram, or a question creates a new package version so experimental results remain interpretable.

### 8. Adaptive player

The player controls:

- which representation variant is shown;
- active/persistent/preview frame regions;
- learner-stepped transitions and any mode-legal timing;
- the itemized Faster ↔ Deeper bundle and its reversible receipt;
- manual controls;
- repair sequences;
- focus and visibility pauses;
- accessibility modes;
- event logging.

It does not change the canonical claim. Adaptation changes timing, context, explanation, example, or review—not factual content.

Preview may offer autoplay, but it is off by default. Understand is learner-stepped by default; any later autoplay experiment is off by default and prohibited for interactive or high-inspection frames. Study has no instructional autoplay in v0. A policy may recommend more context, a source check, or a slower bundle after direct task evidence, but the receipt and undo remain inspectable. Pause, rewind, dwell, source opening, focus loss, and response latency are observations—not comprehension diagnoses by themselves.

### 9. Learner model

Initial learner state should be small and explainable:

- content goal;
- prior-knowledge results;
- concept evidence: unseen, exposed, literal response, inference response, transfer response, delayed response, each with task/version/time and scoring evidence;
- latest correctness and confidence;
- response latency;
- pause/rewind/replay/source/focus history as ambiguous interaction traces;
- preferred pace and context window;
- accessibility settings.

v0 persists this state in a local profile without an account. v1 may add optional encrypted synchronization. A longer-term personal knowledge graph connects demonstrated, weak, and prerequisite concepts across lesson packages without weakening source-level provenance.

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
  id: string
  source_hash: string
  document_version: string
  element_id: string
  section_path: [string]
  start_offset: integer
  end_offset: integer
  page_index: integer | null
  region_normalized: [number, number, number, number] | null
  extracted_text: string
  text_snapshot_hash: string
  locator_version: integer
```

### Canonical claim

```yaml
claim:
  id: string
  clauses:
    - text: string
      source_span_ids: [string]
      support_status: supported | partially_supported | unsupported | not_applicable
  content_origin: source_verbatim | source_paraphrase | prism_inference | added_explanation
  publication_status: draft | needs_review | approved | rejected | superseded
  qualifiers: [string]
  polarity: positive | negative
  modality: string | null
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
  inspection_level: low | medium | high | interactive
  publication_status: draft | needs_review | approved | rejected | superseded
  accessibility_alternative_ids: [string]
  source_fallback_ids: [string]
```

### Learner concept state

```yaml
concept_evidence:
  id: string
  concept_id: string
  outcome_type: exposure | literal | inference | transfer | delayed_transfer
  task_id: string | null
  rubric_version: string | null
  score: number | null
  confidence: number | null
  observed_at: timestamp
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
- pause, rewind, replay, Source, mode, and bundle controls;
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

The repository-grounded milestone and test plan is authoritative in [`../engineering/IMPLEMENTATION_PLAN.md`](../engineering/IMPLEMENTATION_PLAN.md). Its dependency order is:

1. lock documentation and contract-v2 migration decisions;
2. build the enhanced Source Reader and local security envelope on the existing TCP import foundation;
3. author an evidence-locked transaction-isolation package with clause-level support;
4. replace timer-first playback with learner-stepped TSR and complete accessibility/recovery gates;
5. add one sparse prompt/repair path, active-time derivation, and 24-hour/seven-day review;
6. run the owner pilot before automating compilation;
7. add bounded AI proposal passes and one typed representation grammar only after the manual path passes;
8. widen PDF classes, full-book navigation, and learned/sensor adaptation only through separate evidence gates.
