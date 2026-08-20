# Research-to-product map

**Reviewed:** 2026-08-19  
**Purpose:** connect evidence to an implementable PRISM mechanism and a falsifiable outcome.

## Scientific position

PRISM is not based on a discovery that the brain can absorb arbitrary textbook knowledge from flashes. No such established result exists. The strongest path to a genuinely new interface is to coordinate several defensible mechanisms better than conventional readers do:

1. compile a source into meaning-bearing and dependency-aware units;
2. preserve context while focusing attention;
3. choose representations based on information structure;
4. pace for processing and integration rather than word count;
5. use sparse evidence to detect when the mental model needs repair;
6. learn from delayed explanation and transfer, not engagement;
7. keep the original source one action away.

The combination is PRISM’s research contribution. Each component still has to earn its place through ablation.

## Core evidence-to-feature matrix

| Evidence or constraint | Evidence label | PRISM mechanism | What would falsify or narrow it? |
|---|---|---|---|
| Reading speed trades off with comprehension; extreme speed claims are not credible | **Established** | Optimize time only after a learning threshold; show Preview separately from Understand/Study | Faster modes repeatedly miss delayed explanation or transfer |
| Natural reading uses preview, variable fixation, and regression/repair | **Established** | Stable cumulative context, instant rewind, optional next-context preview, and Source mode | Removing context produces no learning/workload penalty across representative texts |
| Meaning is grouped into phrases, clauses, propositions, and discourse relations | **Promising for this interface** | Semantic frames and content-aware dwell rather than equal-time isolated words | Word RSVP is noninferior on delayed outcomes and easier to use |
| Segmented, learner-paced multimedia often improves retention/transfer but can take longer | **Established with boundary conditions** | Concept boundaries, pause/continue control, and explicit integration frames | Segmentation adds time/workload without improving retained understanding |
| Signaling and spatial/temporal contiguity can guide attention | **Established with boundary conditions** | One visual focus, attached labels, synchronized cueing, minimal highlighting | Cues distract, split attention, or fail to improve relation learning |
| Visual gist can be detected extremely quickly, but detection is not durable relational learning | **Established** | A visual may enter quickly but persists while relations are inspected and integrated | Brief presentation alone supports delayed reconstruction and transfer |
| Retrieval and spacing improve durable access more reliably than passive re-exposure | **Established** | Sparse conceptual checks, source-linked repair, and later review | Added checks harm reading flow and provide no delayed benefit relative to time |
| Learner-generated explanations/visuals can improve organization but can overload novices | **Promising and conditional** | Bounded completion, prediction, one-sentence explanation, or one missing arrow | Open generation produces confusion, poor scoring reliability, or excessive interruption |
| Learning-style matching lacks a defensible basis | **Established constraint** | Adapt from goal, knowledge, performance, behavior, preferences, and accessibility—not fixed types | No product experiment should attempt to “validate” visual/verbal learner labels |
| Long-context models can underuse middle content | **Established model limitation in studied settings** | Hierarchical retrieval of exact sections and dependencies; never rely on a full-book prompt | Representative models pass PRISM’s long-context fidelity suite without retrieval |
| Long multimodal document models still struggle with figures/tables and irrelevant context | **Promising engineering evidence** | Retrieve page-local visual evidence, validate figures/tables separately, and preserve Source mode | A simpler text-only pipeline clears figure/table fidelity and transfer gates |
| Gaze/EEG/pupil signals can correlate with effort or difficulty but do not prove comprehension | **Experimental** | Sensor-free v0; later gaze may propose pace/context changes, always checked by outcomes | Gaze adds no value beyond answers and interaction behavior or creates unacceptable burden |

The supporting papers and authoritative sources are catalogued in `SOURCE_LIBRARY.md`.

## The reading experience, not a quiz layer

Questions are a measurement and repair instrument. They are not the product’s primary content type.

The default flow is:

```text
orient → read/observe → integrate → continue
                         │
                         └── sparse diagnostic only when useful
                                      │
                              pass → continue
                              repair → re-represent → continue
```

The learner should perceive a coherent reading session with occasional moments of prediction or explanation, not a lesson followed by a test bank. A question is justified only if its expected information value exceeds its interruption cost.

### Initial diagnostic policy

Use a check at a concept boundary when at least one is true:

- the relation is prerequisite to the next section;
- the content contains a common misconception or easily missed qualifier;
- recent behavior suggests the learner may have lost the thread;
- the chosen Faster setting needs evidence before pace can increase;
- the system needs to distinguish literal recognition from inference;
- a delayed outcome is due.

Do not ask because a timer expired, a paragraph ended, or the interface needs more “engagement.” This policy is a project inference and must be tested.

## Semantic-frame compiler

### Step 1: recover instructional function

For each source unit identify whether it defines, claims, contrasts, causes, sequences, demonstrates, qualifies, warns, derives, or applies. Preserve negation, scope, exceptions, uncertainty, units, symbols, and exact code behavior.

### Step 2: determine the smallest coherent frame

A frame must carry one recoverable instructional function. It may be:

- a phrase when the relation is locally obvious;
- a full clause or sentence when shortening would break scope;
- two aligned statements for a contrast;
- a persistent equation plus changing variable-role cues;
- a source figure with one region highlighted;
- a program state before/after one operation;
- a small causal or component diagram;
- a worked step with prior state retained.

Frame length is therefore an outcome of meaning, not a universal 2–8 word rule.

### Step 3: carry the minimum useful context

The canvas retains the specific earlier information needed to interpret the current frame: a referent, comparison pole, equation, process state, diagram skeleton, or previous causal step. Unrelated text fades or leaves the canvas to avoid crowding.

This is the **cumulative semantic window** hypothesis: keep semantic working state, not a fixed number of prior words.

### Step 4: assign representation by structure

- exact definition or qualification → source-linked text;
- causal relation → minimal arrow/step structure plus wording;
- topology or part–whole relation → labeled spatial diagram;
- algorithm/process → state trace or ordered frames;
- code → executable-looking but source-faithful code plus state/output;
- equation → persistent expression, symbol mapping, and controlled example;
- multi-attribute comparison → aligned table;
- source visual already adequate → use it rather than regenerate it.

Preference chooses among valid alternatives. It does not turn every concept into a picture.

### Step 5: estimate processing demand

Initial transparent timing features include:

- lexical frequency and technical terms;
- syntactic boundary and dependency length;
- proposition count;
- new concepts and prerequisite distance;
- negation, exception, comparison, or uncertainty;
- visual search area and label count;
- equation/code state changes;
- integration distance to the relevant earlier frame;
- recent learner repair evidence.

The policy selects a dwell range and continuation behavior. The user can always pause or move. A learned timing model is not justified until delayed outcomes exist.

## Faster ↔ Deeper as a constrained policy

The slider should not merely multiply milliseconds. It changes a bundle while preserving the chosen mode’s outcome contract:

| Control effect | Faster direction | Deeper direction |
|---|---|---|
| Dwell | Shorter within validated bounds | More inspection/integration time |
| Context | Less nonessential context | More persistent prerequisites and comparison state |
| Elaboration | Skip optional examples | Add example, boundary case, or alternate explanation |
| Representation | Prefer compact adequate form | Permit a worked trace or multi-step visual |
| Diagnostics | Wider spacing when evidence is strong | More generative/inference evidence |
| Review | Only high-value due concepts | Broader retrieval and application |

Auto searches for the fastest path that still clears the current learning-risk rules. It must not optimize nominal completion, clicks, or user confidence.

## Technical-subject representation patterns

### Databases

- schema/key constraints → table/relationship view with exact definitions;
- query execution → operator pipeline and intermediate relation state;
- transactions/isolation → interleaved schedule plus anomaly relation;
- normalization → functional-dependency trace and decomposition checks.

### Networks

- encapsulation → persistent packet structure across layers;
- routing → topology plus current decision and table entry;
- congestion control → time-series/state loop with causal signals;
- protocol exchange → sequence diagram with message purpose.

### Distributed systems

- replication/consistency → node/time diagram and allowed observations;
- failure model → scenario plus violated/maintained property;
- consensus → state/message trace with assumptions visible;
- partition behavior → competing timelines and client observations.

### Algorithms and operating systems

- algorithm → code/pseudocode, invariant, and state trace;
- complexity → operation count and growth comparison, not decorative charts;
- scheduling/memory → queue/page-frame state carried across transitions;
- concurrency → interleaving, lock/wait relation, and invariant.

### Python, data engineering, cloud, and AI

- code semantics → input, relevant line, state, output, and exception path;
- data pipeline → schema and data state at each transformation;
- distributed/cloud architecture → request/data flow plus failure boundary;
- model concepts → tensor/data shape, objective, or inference flow when source-supported.

These are representation hypotheses, not fixed templates. Each pattern needs comparison against well-designed source reading.

## Frontier tracks

### 1. Gaze-guided pacing and representation

**Experimental.** Eye tracking may estimate rereading, search, unexpected difficulty, or skipped regions. It could propose more context, slower dwell, or a different cue. It cannot certify comprehension. The first sensor study compares gaze-added adaptation with the same policy using only answers and interaction behavior.

### 2. Gaze-guided text easing

**Experimental/preprint.** Recent work has steered text generation using predicted gaze-derived reading time and changed observed reading time/perceived difficulty. For PRISM this supports a separately labeled simplified explanation around an unchanged canonical claim—not silent rewriting. Lexical ease is not the same as conceptual fidelity or durable learning.

### 3. Multimodal long-document retrieval

**Promising engineering direction.** Current benchmarks cover hundreds-page documents with text, figures, and tables and still show modality-specific weaknesses. PRISM should retrieve a small evidence neighborhood, carry stable page coordinates, and test figure/table questions explicitly rather than trusting a large context window.

### 4. Personal knowledge graph

**Experimental.** Link source-grounded concepts across books and courses, then use demonstrated mastery to warn about prerequisites and schedule review. The graph must separate:

- source assertion;
- PRISM mapping/inference;
- learner evidence;
- user correction.

It becomes valuable only if it improves transfer or reduces unnecessary explanation.

### 5. Learned adaptive policy

**Speculative until data exist.** A contextual bandit or constrained policy could select dwell, context, representation, and diagnostic timing. Reward must use delayed explanation/transfer and include time/workload penalties. Accessibility and source-fidelity rules remain hard constraints. Offline evaluation and safe shadow mode precede control of the real player.

## Research sequence

1. Prove PDF/source fidelity on technical fixtures.
2. Compare normal text, one-word RSVP, and cumulative semantic frames with identical source meaning.
3. Ablate context persistence and content-aware timing.
4. Add source-provided technical visuals where structurally appropriate.
5. Add sparse diagnostic/repair and delayed review.
6. Test rule-based Faster ↔ Deeper adaptation.
7. Add generated diagram specifications only after fidelity gates pass.
8. Test full textbook navigation, prerequisites, and cross-reference retrieval.
9. Compare optional local/cloud generation configurations.
10. Study gaze and learned policies only after sensor-free delayed learning is strong.

## What would make PRISM genuinely new?

Novelty should be claimed only if evidence shows a repeatable capability not explained by a prettier reader or by adding quizzes:

- a source compiler that reliably turns heterogeneous technical structure into inspectable semantic frames;
- a cumulative one-screen canvas that preserves or improves delayed mental-model quality while reducing active time or workload;
- an adaptive policy whose decisions improve the individual learner’s speed–learning frontier;
- multimodal transitions that improve transfer because the representation expresses the source structure more efficiently;
- a long-term learner model that reduces redundant explanation without hiding prerequisites.

Until then, these are hypotheses and design contributions. The project can still be valuable if only a subset survives testing.

## Highest-risk assumptions

1. Semantic streaming adds value beyond excellent typography, highlighting, and navigation.
2. The interruption cost of diagnostics can remain low enough that the experience still feels like reading.
3. Automatic representation selection can preserve nuance in technical material.
4. Full-PDF extraction can be made reliable enough for page-level source trust.
5. Personalization learned from one owner generalizes enough to justify remote research.

The implementation roadmap should attack these risks before decorative breadth.
