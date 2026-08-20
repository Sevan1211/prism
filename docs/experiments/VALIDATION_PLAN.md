# Validation plan

## Purpose

PRISM must earn its core claim experimentally. The first research question is not whether users enjoy animation or can tolerate a high display rate. It is whether a semantic stream improves the efficiency of correct, durable understanding relative to fair baselines.

## Governing decision rule

Durable learning is the constraint; speed is optimized inside that constraint. Release decisions should therefore use a learning frontier rather than a single words-per-minute or engagement score:

1. define a meaningful delayed-retention and transfer standard or noninferiority margin;
2. reject variants that fail that learning standard, regardless of display speed;
3. among variants that pass, prefer lower active time and workload;
4. estimate how positions on the Faster ↔ Deeper control and the Auto policy move an individual along the measured frontier.

An efficiency ratio may be reported descriptively, but it must not allow a large learning loss to look favorable because the stream ended quickly.

## Primary hypothesis

For short unfamiliar explanatory nonfiction, a learner-controlled cumulative semantic stream will achieve higher **7-day explanation and application performance per unit of active time** than conventional one-word RSVP and will be noninferior to normal self-paced reading on those 7-day learning outcomes.

The second clause is intentionally demanding. If PRISM is faster but produces meaningfully worse delayed comprehension, it is a Preview tool rather than an Understand tool.

## Initial benchmark corpus

The first mechanism tests use one bounded passage for each of three confirmed concepts:

1. **Database transaction isolation** — precise definitions, anomalies, schedules, and exact conditions.
2. **TCP congestion control** — a causal feedback process that changes over time.
3. **Distributed consensus** — multi-node causality, failure cases, and prerequisite relations.

The candidate sources and current page windows are recorded in the [benchmark corpus](BENCHMARK_CORPUS.md). Before interface comparison, PRISM must acquire and hash the exact source versions, finalize the transaction-isolation window, recheck rights for each selected version, and give every 800–2,000-word passage its own claim map and assessment blueprint. Passage and condition order are counterbalanced; none of the three topics may be confounded with a single presentation condition.

## Experimental conditions

Use the same source passages and outcome bank in all conditions.

### A. Normal self-paced text

- conventional paragraph layout;
- unrestricted scrolling and rereading;
- same typography and screen dimensions where possible.

### B. One-word RSVP

- fixed central location;
- individually calibrated comfortable starting speed;
- punctuation/word-length timing rules documented;
- pause and rewind available so the comparison is humane and realistic.

### C. PRISM semantic stream

- coherent phrase/clause frames;
- recent context visible;
- optional next-phrase preview;
- content-aware timing;
- pause, step, and rewind;
- no generated explanatory content in the first mechanism test.

### D. PRISM plus learning loop

- condition C;
- sparse retrieval/inference checkpoints;
- repair frames;
- delayed review.

Separating C and D reveals whether the player itself helps and whether active learning supplies most of the durable benefit.

## Outcomes

### Primary outcomes

1. Explanation quality at 7 days, scored with a blinded rubric.
2. Near-transfer/application performance at 7 days.
3. Total active learning time, including rereading, checkpoints, and repairs.
4. Active time among conditions that meet the predeclared delayed-learning standard.
5. Delayed comprehension efficiency as a secondary descriptive measure: predeclared weighted delayed score divided by active minutes.

Do not improvise outcome weights after results are visible.

### Secondary outcomes

- immediate literal comprehension;
- immediate inference;
- 24-hour explanation, inference, and near-transfer performance as interim diagnostics;
- exact recall at 7 days when the content blueprint marks precise wording, values, symbols, definitions, or sequences as essential;
- confidence calibration;
- task workload;
- visual fatigue and discomfort;
- usability and preference;
- pause/rewind/replay frequency;
- dropout and interruption recovery;
- time by concept difficulty;
- accessibility-mode outcomes.

### Guardrail outcomes

- no unsafe flash or motion behavior;
- no source-fidelity difference between conditions in the mechanism test;
- no condition receives easier questions or less content;
- no mastery label based only on immediate multiple-choice accuracy;
- no exclusion of slow participants merely because they reduce average speed.

## Assessment construction

PRISM may generate adaptive practice questions automatically. Questions used to compare presentation conditions or support performance claims are a separate measurement instrument: they must be reviewed, versioned, and piloted so the experiment does not validate itself with an unvalidated generator.

Each passage should have a blueprint before interface testing:

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

- experts verify source-to-claim fidelity;
- independent reviewers label semantic boundaries;
- pilot questions for ambiguity and floor/ceiling effects;
- verify playback timing and active-time calculation;
- run accessibility checks.

### Phase 1: usability pilot

Goal: discover confusion, motion discomfort, and control failures—not prove efficacy.

- 6–10 diverse participants;
- think-aloud only after or between short blocks, because speaking changes reading;
- inspect missed frames, recovery, and control discoverability;
- revise before measuring comparative outcomes.

### Phase 1a: owner longitudinal pilot

- the project owner completes repeated, counterbalanced normal-reading, RSVP, and PRISM sessions;
- each session includes 24-hour interim and 7-day explanation/application tests;
- preserve every null and negative result;
- use the evidence to refine mechanisms, not to make population-level claims.

### Phase 2: directional within-subject study

- begin only after a strong owner pilot, using consented remote asynchronous adult participants; no in-person study is required;
- roughly 24–40 participants can provide useful pilot estimates, but the final sample must come from a power analysis using the chosen noninferiority margin and outcome variance;
- counterbalance passage and condition order;
- match passage topic/difficulty;
- include both a 24-hour interim test and the central 7-day explanation/application test;
- preregister exclusions, outcomes, and analysis.

### Phase 3: confirmatory study

- sample size based on Phase 2 variance and smallest effect of interest;
- preregistered primary analysis;
- blinded scoring for open responses;
- report all conditions and attrition;
- publish materials and anonymized data where rights and consent allow.

### Phase 4: textbook section trial

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

## Initial go/no-go gates

These are product decision gates, not claims about universal scientific thresholds.

### Gate 1: semantic stream viability

Proceed if condition C:

- is noninferior to normal text on 7-day explanation and application under the preregistered margin;
- is superior to one-word RSVP on at least one important delayed outcome without worse transfer;
- produces no material increase in discomfort or unrecoverable loss;
- has a plausible path to time savings or focus benefits.

If comprehension is lower but gist is good, reposition the mode as Preview and keep Source/Study modes for depth.

### Gate 0: PDF fidelity

Before learning comparisons use an imported PDF:

- every taught claim resolves to the correct source page and region;
- reading order, headings, captions, code, equations, and tables pass fixture-specific checks;
- unsupported or low-confidence elements are visible and excluded from automatic transformation;
- the source overlay lets a reviewer compare extraction with the rendered page;
- restarting an interrupted full-book import does not duplicate, omit, or renumber content.

A beautiful lesson generated from a faulty extraction is a failed lesson.

### Gate 2: active learning value

Proceed with the mastery loop if condition D improves delayed inference or transfer enough to justify its added time and interruption cost.

### Gate 3: generated representation fidelity

No generated representation ships automatically until:

- essential-claim omission is within a predeclared acceptable bound;
- contradiction rate is below a stringent reviewed threshold;
- diagram relations are source-supported;
- user-facing provenance is understandable;
- human review can block or correct outputs.

### Gate 4: adaptation value

Adaptive pacing must beat or match a transparent personalized fixed policy on delayed outcomes. If it only increases completion rate or nominal speed, it does not pass.

## Ablation roadmap

Test one contribution at a time:

1. phrases vs. isolated words;
2. context visible vs. disappearing context;
3. fixed vs. complexity-weighted timing;
4. manual-only vs. behavioral adaptation;
5. text-only vs. source-provided diagram;
6. source visual vs. generated simplified diagram;
7. no checkpoint vs. literal checkpoint vs. inference checkpoint;
8. same-session review vs. spaced review.

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
