# Validation plan

**Reviewed:** 2026-08-23  
**Research integration:** [`../research/DOSSIER_INTEGRATION_REVIEW.md`](../research/DOSSIER_INTEGRATION_REVIEW.md)  
**Experimental mechanism:** Traceable Semantic Relay (TSR)

## Purpose

PRISM must earn its core claim experimentally. The first research question is not whether users enjoy animation or can tolerate a high display rate. It is whether Traceable Semantic Relay preserves or improves correct seven-day transfer relative to an enhanced static Source Reader and whether any time or workload change remains acceptable.

## Governing decision rule

Durable learning is the constraint; speed is optimized inside that constraint. Release decisions should therefore use a learning frontier rather than a single words-per-minute or engagement score:

1. define a meaningful delayed-retention and transfer standard or noninferiority margin;
2. reject variants that fail that learning standard, regardless of display speed;
3. among variants that pass, prefer lower active time and workload;
4. estimate how positions on the Faster ↔ Deeper control and the Auto policy move an individual along the measured frontier.

An efficiency ratio may be reported descriptively, but it must not allow a large learning loss to look favorable because the stream ended quickly.

## Primary hypothesis and estimand

For bounded unfamiliar technical material, learner-controlled TSR plus a sparse learning loop will be noninferior to an enhanced static Source Reader on **seven-day transfer** and will either improve transfer or reduce active time without crossing the predeclared learning-loss margin.

The primary estimand is the condition difference in seven-day transfer under the preregistered analysis. Active time is a key secondary outcome and a co-primary product interpretation only beside absolute transfer. A ratio cannot make a materially worse learning result look efficient. If TSR is faster but produces meaningfully worse delayed comprehension, it is a Preview mechanism rather than an Understand or Study mechanism.

## Initial benchmark corpus

The first mechanism tests use one bounded passage for each of three confirmed concepts:

1. **Database transaction isolation** — precise definitions, anomalies, schedules, and exact conditions.
2. **TCP congestion control** — a causal feedback process that changes over time.
3. **Distributed consensus** — multi-node causality, failure cases, and prerequisite relations.

The candidate sources and current page windows are recorded in the [benchmark corpus](BENCHMARK_CORPUS.md). Before interface comparison, PRISM must acquire and hash the exact source versions, finalize the transaction-isolation window, recheck rights for each selected version, and give every 800–2,000-word passage its own claim map and assessment blueprint. Passage and condition order are counterbalanced; none of the three topics may be confounded with a single presentation condition.

## Experimental conditions

Use the same source passages and outcome bank in all conditions.

### A. Enhanced static Source Reader

- conventional headings, paragraphs, lists, tables, figures, captions, and source page access;
- unrestricted scrolling, search, navigation, rereading, and source inspection;
- accessible typography and the same content, viewport, device, and outcome instrumentation where possible;
- no TSR frame sequencing, representation replacement, or sparse learning prompt unless a later ablation explicitly adds the loop to Source Reader.

### B. One-word RSVP — optional research-only negative control

- fixed central location;
- individually calibrated comfortable starting speed;
- punctuation/word-length timing rules documented;
- pause and exit available for participant safety;
- no product engineering, efficacy expectation, or roadmap dependency.

This condition may be omitted from an owner or directional protocol when it would displace the primary Source Reader versus TSR comparisons. It exists only to test whether removing ordinary eye movement or scrolling explains an observed effect.

### C. TSR semantic frames

- coherent phrase/clause frames;
- recent context visible;
- optional next-phrase preview;
- learner-controlled step and rewind;
- optional mode-legal timing only if the locked protocol tests it;
- no generated explanatory content in the first mechanism test.

### D. TSR plus sparse learning loop

- condition C;
- sparse retrieval/inference checkpoints;
- repair frames;
- delayed review.

Separating C and D reveals whether the representation relay itself helps and whether the sparse learning loop supplies most of any durable benefit. The primary comparison is D versus A; B is never the competitor PRISM must beat.

## Outcomes

### Primary outcome

1. Near-transfer/application performance at seven days, scored with a preregistered relation rubric by scorers blind to condition.

### Key secondary outcomes

- explanation quality at seven days;
- total active learning time, including rereading, source inspection, checkpoints, and repairs;
- active time among conditions that meet the predeclared delayed-learning standard;
- 24-hour explanation and transfer;
- immediate literal and inferential comprehension;
- confidence calibration;
- workload and fatigue;
- source-fidelity incidents;
- learner-control events and usability;
- representation preference, reported separately from learning.

Delayed score per active minute may be reported descriptively only after absolute scores and time are shown separately.

Do not improvise outcome weights after results are visible.

### Additional secondary outcomes

- exact recall at 7 days when the content blueprint marks precise wording, values, symbols, definitions, or sequences as essential;
- visual fatigue and discomfort;
- pause/rewind/replay frequency;
- dropout and interruption recovery;
- time by concept difficulty;
- accessibility-mode outcomes.

### Guardrail outcomes

- no unsafe flash or motion behavior;
- no source-fidelity difference between conditions in the mechanism test;
- no condition receives easier questions or less content;
- no demonstrated-learning state or mastery language based only on completion, speed, confidence, recognition, or immediate multiple-choice accuracy;
- no exclusion of slow participants merely because they reduce average speed.

## Assessment construction

PRISM may generate adaptive practice questions automatically. Questions used to compare presentation conditions or support performance claims are a separate measurement instrument: they must be reviewed, versioned, and piloted so the experiment does not validate itself with an unvalidated generator.

Each passage should have a blueprint before interface testing. The manually reviewed owner fixture may begin with two literal items, two inferential items, one open explanation, and two transfer items per form. A later directional instrument should expand or revise the bank based on reliability and pilot evidence rather than a fixed count:

- 4–6 literal items covering important claims;
- 4–6 inference items requiring connections across statements;
- 2–4 near-transfer items using a new example;
- at least one open explanation scored with a blinded rubric;
- matched alternate forms for immediate and delayed testing;
- item difficulty pilot data;
- source spans and concept links for every answer.

Avoid trivia questions that reward isolated word recognition. Question authors should not know which presentation condition is expected to win when practical.

## Study sequence

### Phase 0: instrument and content validation

- audit every generated/transformed claim, diagram node and edge, equation or code transition, prompt, answer key, repair claim, and a package-build sample of exact source bindings;
- require zero known critical or major errors and valid source spans;
- use an initial at-least-98-percent fully supported audited-clause gate only as project policy, never as permission for a known consequential error;
- experts verify source-to-claim fidelity;
- independent reviewers label semantic boundaries;
- pilot questions for ambiguity and floor/ceiling effects;
- verify playback timing and active-time calculation;
- run accessibility and recovery checks;
- freeze package, item, rubric, policy, and protocol versions before exposure.

### Phase 1: owner longitudinal pilot

- the project owner completes repeated, counterbalanced Source Reader, semantic-frame, and TSR sessions;
- one-word RSVP is included only if the locked protocol retains its optional negative-control question;
- each session includes a 24-hour interim and seven-day explanation/application test;
- preserve every null and negative result;
- use the evidence to debug fidelity, recovery, instrumentation, frame fragmentation, source inspection, prompt interruption, and delayed item quality—not to make population claims.

### Phase 2: usability pilot

Goal: discover confusion, motion discomfort, control failures, and accessibility barriers—not prove efficacy.

- 6–10 technically oriented adults selected for issue diversity;
- think-aloud only after or between short blocks, because speaking changes reading;
- inspect source recovery, mode interpretation, bundle receipts, focus, transcript parity, and delayed-review discovery;
- require zero unrecoverable states and critical accessibility blockers;
- revise before measuring comparative outcomes.

### Phase 3: directional within-subject study

- begin only after owner and usability gates, using consented remote asynchronous adult participants; no in-person study is required;
- use 36–60 completers only as an initial planning range; final size must come from simulation using pilot variance, assessment reliability, within-person correlation, attrition, the primary contrast, and the justified noninferiority margin;
- counterbalance passage and condition order;
- match passage topic/difficulty;
- include both a 24-hour interim test and the central 7-day explanation/application test;
- preregister exclusions, outcomes, scoring, active time, missing data, fidelity gate, analysis, package hashes, and policy version.

### Phase 4: confirmatory study

- sample size based on Phase 3 variance, assessment reliability, attrition, and the smallest effect of interest;
- preregistered primary analysis;
- blinded scoring for open responses;
- report all conditions and attrition;
- publish materials and anonymized data where rights and consent allow.

### Phase 5: broader textbook section trial

Only after prose passes the mechanism gate:

- include definitions, diagrams, an equation, and a worked example;
- measure prerequisite knowledge;
- assess explanation and problem-solving transfer;
- evaluate source inspection and cross-reference use.

## Analysis principles

- Model participant and passage variation; do not treat all observations as independent.
- Include prior knowledge as a predeclared covariate or moderator.
- Report speed and accuracy separately before any combined efficiency score.
- Use confidence intervals and effect sizes, not only significance tests.
- For equivalence or noninferiority, predeclare a meaningful margin.
- Analyze missing delayed tests and attrition by condition.
- Do not infer that preference means learning or that longer gaze means comprehension.

For the directional study, use a mixed-effects or hierarchical model with condition, period, unit, prior knowledge, and preregistered interactions; include participant and item/unit variation when the data support it. Report raw differences, standardized paired effects, confidence intervals, participant-level distributions, active-time distributions, attrition, and fidelity incidents rather than only p-values.

### Provisional decision values

The dossier proposes these starting values for planning:

- seven-day transfer noninferiority margin no larger than 0.20 standard deviations or five normalized-rubric percentage points, whichever is stricter;
- meaningful median active-time reduction of at least 15 percent;
- directional-study planning range of 36–60 completers;
- at least 98 percent fully supported audited clauses for an owner-pilot package, with zero known critical or major errors.

These values are **project governance proposals**, not established scientific thresholds. Assessment reliability, expert judgment, pilot variance, within-person correlation, attrition, and simulation must justify or replace them before preregistration. A time saving with a transfer loss outside the final margin is failure, not efficiency.

Delayed missingness must be reported by condition and period. The primary analysis follows the preregistered estimand using all eligible randomized observations; complete-case analysis is secondary, and sensitivity analysis must not assume delayed data are missing completely at random.

## Initial go/no-go gates

These are product decision gates, not claims about universal scientific thresholds.

### Gate 0: PDF fidelity

Before learning comparisons use an imported PDF:

- every taught claim resolves to the correct source page and region;
- reading order, headings, captions, code, equations, and tables pass fixture-specific checks;
- unsupported or low-confidence elements are visible and excluded from automatic transformation;
- the source overlay lets a reviewer compare extraction with the rendered page;
- restarting an interrupted full-book import does not duplicate, omit, or renumber content.

A beautiful lesson generated from a faulty extraction is a failed lesson.

### Gate 1: TSR viability

Proceed if condition D:

- is noninferior to the enhanced Source Reader on seven-day transfer under the preregistered margin;
- shows a favorable transfer, active-time, workload, or defined accessibility signal worth replication;
- produces no material increase in discomfort or unrecoverable loss;
- has no source-fidelity, accessibility, learner-control, or calibration penalty.

Condition C is interpreted separately to determine whether semantic frames add value without the sparse loop. One-word RSVP, if present, is a boundary check rather than a gate PRISM must beat.

If comprehension is lower but gist is good, reposition the mode as Preview and keep Source/Study modes for depth.

### Gate 2: sparse learning-loop value

Proceed with the sparse learning loop if D improves delayed inference or transfer over C enough to justify its added time and interruption cost. If D beats C but not A, preserve the learning-loop result and test the loop inside Source Reader while retaining Source Reader as the preferred surface.

### Gate 3: generated representation fidelity

No generated representation ships automatically until:

- essential-claim omission is within a predeclared acceptable bound;
- contradiction rate is below a stringent reviewed threshold;
- diagram relations are source-supported;
- user-facing provenance is understandable;
- human review can block or correct outputs.

### Gate 4: adaptation value

Transparent rule-based adaptation must beat or match a fixed Study bundle on delayed outcomes without a fidelity, accessibility, workload, or control penalty. If it only increases completion rate or nominal speed, it does not pass.

## Ablation roadmap

Test one contribution at a time:

1. enhanced Source Reader versus learner-controlled semantic frames;
2. semantic frames with versus without visible previous-frame context;
3. on-demand source visual versus persistent anchor;
4. static diagram versus user-stepped state sequence;
5. semantic frames versus one concept-boundary integration prompt;
6. prompt-only feedback versus prompt plus representational repair;
7. fixed Study bundle versus transparent rule-based adaptation;
8. manually reviewed package versus AI-compiled package.

One-word RSVP may be run as a bounded negative control, but it is not on the core product ablation path.

This avoids building an impressive bundle whose actual useful mechanism is unknown.

## Failure interpretations

- **Faster, worse delayed learning:** useful Preview mode, failed Understand claim.
- **Same learning, same time, lower workload:** still a meaningful accessibility/focus result.
- **Same immediate score, worse delayed score:** exposure fluency masked weak consolidation.
- **Better recall, no transfer:** frames may promote verbatim encoding without a mental model.
- **High confidence, low score:** metacognitive illusion; add generation/retrieval before confidence.
- **More pauses and better learning:** pauses are functional processing, not automatically friction.
- **Generated visuals preferred but do not improve transfer:** treat them as aesthetic unless they meet another goal.

## Research artifacts to preserve

- exact source passage version;
- segmentation and timing parameters;
- lesson package version;
- question/rubric version;
- randomization and counterbalancing scheme;
- anonymized event schema;
- exclusion log;
- preregistration and analysis code;
- deviations and negative results.
