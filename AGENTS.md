# AGENTS.md

## Project purpose

PRISM stands for **Personalized Representation and Information Streaming for Meaning**. It converts source material into a source-grounded sequence of semantic frames and adapts their pacing and representation to help a learner understand and retain the material efficiently.

## Current phase

The project is documentation-first. Before implementing a product, preserve and refine the research claims, product contract, data model, and validation plan in `docs/`.

## Repository structure

- `docs/research/`: evidence reviews and annotated sources
- `docs/product/`: product requirements and experience design
- `docs/architecture/`: system boundaries and data contracts
- `docs/experiments/`: validation methods and acceptance gates
- `docs/decisions/`: open questions and durable decisions

## Non-negotiable principles

1. **Durable learning outranks display speed.** Seek the fastest pace that preserves the selected durable-learning outcome. Users may move toward Faster or Deeper presentation, but the tradeoff must be visible and words per minute must never be the primary outcome.
2. **Source fidelity is inspectable.** Every generated claim, summary, diagram, or explanation must be traceable to source spans or clearly labeled as an added analogy or interpretation.
3. **Do not equate exposure, recognition, confidence, or immediate recall with learning.** Evaluate inference, transfer, and delayed retention.
4. **Preserve learner control.** Pause, replay, rewind, inspect context, and return to the source must remain available.
5. **Use meaningful units.** Default to phrases, clauses, propositions, equations, or coherent visual events—not an uninterrupted stream of isolated words.
6. **Representations must earn their place.** Add a diagram, image, animation, or equation only when it clarifies structure, causality, space, change, comparison, or quantity.
7. **Accessibility is a release gate.** Provide reduced-motion and static alternatives, full keyboard control, screen-reader semantics, captions/alt text, contrast compliance, and no unsafe flashing.
8. **Personalization is evidence-seeking, not learning-style matching.** Adapt from prior knowledge, task goal, performance, behavior, preferences, and accessibility needs. Do not claim fixed “visual learner” or “auditory learner” types.
9. **AI output is untrusted until checked.** Preserve provenance, run contradiction/omission checks, and make uncertainty visible.
10. **Privacy by default.** Interaction traces, gaze, camera, EEG, or other biosignals are optional sensitive data. Do not collect them for the MVP unless explicitly justified and consented to.
11. **Remain reading-centered and learner-only.** Sparse checks may diagnose and repair understanding, but do not turn PRISM into a quiz, flashcard, classroom, instructor, or course-management product.
12. **Large sources are progressive.** A full textbook is indexed and compiled section by section; never treat it as one prompt or claim successful transformation when page fidelity is uncertain.
11. **The frontier goal stays ambitious and testable.** PRISM aims to establish a genuinely new way to absorb and learn information quickly, but must label unvalidated mechanisms as experimental or speculative and earn claims through delayed retention and transfer evidence.

## Evidence labels

Use these labels in research and product documents:

- **Established:** supported by convergent evidence, strong review, or replicated findings.
- **Promising:** supported by relevant studies but with meaningful boundary conditions.
- **Experimental:** plausible and testable, but not sufficiently validated for a product claim.
- **Speculative:** long-range idea that must not drive near-term promises.

Clearly distinguish direct findings from project inferences.

## Required evaluation outcomes

Any experiment comparing presentation modes must record:

- total learning time;
- immediate literal comprehension;
- immediate inferential comprehension;
- transfer/application performance;
- delayed retention, normally at least 24 hours and preferably again at 7 days;
- learner control events such as pauses and rewinds;
- perceived workload, fatigue, and usability;
- source-fidelity errors for generated representations.

Report the speed–accuracy tradeoff. Do not hide slower completion time when comprehension improves, or lower comprehension when speed improves.

## Product-writing rules

- Use “semantic stream” or “semantic frame” for PRISM’s proposed unit.
- Reserve “RSVP” for the established rapid serial visual presentation paradigm or an explicit experimental baseline.
- Avoid claims such as “learn twice as fast,” “read without eye movements,” or “guaranteed comprehension” without preregistered evidence.
- Prefer “one-screen canvas” over “flashing,” because PRISM should use stable layout and safe transitions.
- Treat textbooks as structured systems of definitions, prerequisites, explanations, worked examples, equations, diagrams, tables, and exercises—not as flat prose.

## Git and pull-request workflow

- The canonical remote is `https://github.com/Sevan1211/prism.git`.
- `main` is the integration branch. Never commit on or push ordinary changes directly to `main`.
- `sevan-dev` is the permanent working branch. Make every local project commit from `sevan-dev`, and verify the active branch before staging or committing.
- The initial repository baseline is the one-time direct-push exception. After that baseline, every change reaches `main` through a pull request from `sevan-dev`.
- Keep each pull request focused on one coherent, reviewable outcome. Multiple commits in one pull request are acceptable; unrelated work and very large file batches are not. Split broad work into independently valid contract, implementation, UI, parser, or documentation changes instead of accumulating a roughly 50-file pull request.
- Do not delete `sevan-dev` after merge. Before starting the next change, update it from `origin/main` and confirm the previous pull request is merged or closed so scopes do not overlap.
- Before a push or pull request, inspect staged and unstaged changes, run the relevant validation, and confirm that secrets, private source documents, local application state, dependency trees, caches, logs, databases, and generated build artifacts are excluded.
- Do not force-push or rewrite published history unless the user explicitly authorizes that exact operation.

## Change workflow

1. Read `docs/00_PROJECT_BRIEF.md` and the relevant specialized document.
2. State the user outcome and affected evidence or product contract.
3. Make the smallest coherent change.
4. Update cross-references if a decision changes scope, terminology, metrics, or system boundaries.
5. Check Markdown links and search for contradictory claims.
6. Record unresolved product choices in `docs/decisions/OPEN_QUESTIONS.md` rather than silently deciding high-impact scope.

## Validation before handoff

- All local document links resolve.
- External research citations use a DOI, publisher, repository, or standards-body URL when possible.
- Every quantitative claim names its population or study context.
- Cutting-edge preprints and small-sample studies are labeled as such.
- No generated representation is presented as source-authored unless it is directly grounded.
- Implementation work also follows `docs/engineering/ENGINEERING_STANDARDS.md`: remove obsolete code in the same change, justify dependencies, and validate recovery and performance in proportion to risk.
