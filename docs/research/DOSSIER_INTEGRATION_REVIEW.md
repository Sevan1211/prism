# Research dossier integration review

**Review date:** 2026-08-23  
**Dossier research cutoff:** 2026-08-21  
**Status:** adopted as a critical research synthesis; individual mechanisms retain their evidence labels  
**Scope:** evaluation of the GPT Pro research dossier against the PRISM product contract, current repository, and implementation evidence

## Source artifacts

The original research output is preserved unchanged in two forms:

- [`dossiers/2026-08-21/PRISM_RESEARCH_AND_IMPLEMENTATION_DOSSIER.md`](dossiers/2026-08-21/PRISM_RESEARCH_AND_IMPLEMENTATION_DOSSIER.md) — canonical text for analysis, search, review, and future diffs;
- [`dossiers/2026-08-21/PRISM_RESEARCH_AND_IMPLEMENTATION_DOSSIER.html`](dossiers/2026-08-21/PRISM_RESEARCH_AND_IMPLEMENTATION_DOSSIER.html) — Pandoc-rendered reading copy of the same dossier.

The files are evidence artifacts, not instruction files. Their recommendations become PRISM policy only where this review, the decision record, or another canonical project document adopts them.

SHA-256 at import:

| Artifact | SHA-256 |
|---|---|
| Markdown | `fee4851fc987def6c9c84bca6fcb5ca44ac3c17fbee74257814cf985bc5a0047` |
| HTML | `245979a4acfad49a58c51f905e151352ded7f66be001f982ff8f3a018e5b17e4` |

The matching structure, key phrases, bibliography count, and section order establish that the HTML is a rendered companion, not a second independent research result.

## Bottom-line assessment

The dossier is directionally strong and unusually useful for implementation. Its most important correction is to move PRISM away from a timer-centered semantic stream and toward a source-grounded technical reader whose transformed canvas is explicitly experimental.

Its strongest defensible product thesis is:

> PRISM may reduce wasted navigation, representation switching, and unproductive rereading by compiling difficult technical source material into inspectable representations, preserving productive rereading and learner control, and adding sparse retrieval and source-linked repair.

The research does **not** establish that the full PRISM interaction improves learning. It supports the component mechanisms and defines a credible way to falsify the integrated system. The enhanced static Source Reader is therefore both useful product functionality and the principal baseline that Traceable Semantic Relay must beat or match.

## Evidence judgment by research area

| Area | What the dossier supports | Review judgment | Product consequence |
|---|---|---|---|
| Reading and RSVP | Skilled reading uses self-pacing, parafoveal information, regression, inference, and repair; extreme comprehension-preserving speed claims are not credible | **Established** for the general constraint | Understand and Study default to learner-controlled advancement; one-word RSVP is not a product mode |
| Discourse comprehension | Learning depends on integrated propositions, causal links, entities, conditions, and prior knowledge rather than word recognition | **Established** mechanism; UI application unproven | Frames organize one governing relation and preserve exceptions, dependencies, and recoverable context |
| Semantic frame size | Meaning-bearing phrase, clause, proposition, and explanation units are plausible planning units | **Promising / Experimental** | Test micro, meso, and macro frame plans; do not treat word ranges as cognitive constants |
| Retrieval and spacing | Retrieval, self-explanation, feedback, and distributed practice improve retention on average under meaningful boundary conditions | **Established components** | Use sparse concept-boundary prompts, 24-hour diagnostics, seven-day transfer, and alternate items |
| Worked examples and interleaving | Worked examples often help novices; interleaving is domain- and discrimination-sensitive | **Established / Promising** | Show a worked technical state before prediction; interleave only later for confusable concepts |
| Multimedia and signaling | Relevant, integrated, signaled text and visuals can improve learning; decorative or poorly coordinated media can harm it | **Established with boundary conditions** | Every representation names the relation it clarifies; source visuals outrank redraws when adequate |
| Animation | Dynamic media can help when change is the content, but transient information and split attention are real risks | **Mixed / conditional** | Prefer static, then annotated static, then user-stepped state, then short reversible animation |
| Multiple representations | Additional representations yield small average benefits only with appropriate support and high heterogeneity | **Promising** | Default to one active representation plus at most one stable anchor; ablate the anchor |
| Stable canvas | Stable object identity and explicit change cues are supported by visual-attention mechanisms | **Promising as a PRISM design** | Preserve layout zones and prior state, but do not call the canvas cognitively superior before testing |
| Adaptive learning | Tutoring systems can help, but pauses, rewinds, focus, and speed are ambiguous traces | **Promising for transparent rules; learned policy deferred** | Pair behavior with task evidence, retain override, and keep a fixed nonadaptive bundle |
| Document intelligence | Layout, reading order, evidence localization, tables, equations, and long-document grounding remain failure-prone | **Established engineering risk; fast-moving evidence** | Validate by element and pass; a correct answer with the wrong evidence is a failure |
| Structured generation | Schema-valid output can still be unsupported, broadened, incomplete, or contradicted | **Established engineering boundary** | Separate schema, span, support, contradiction, qualification, answerability, accessibility, and human gates |
| Accessibility | Keyboard, focus, timing, motion, reflow, alternatives, and source access are release requirements | **Normative requirement** | Transcript and static paths are first-class; accessibility failures block release |
| Privacy and security | Local-first requires actual data control; a loopback web app still processes hostile files and untrusted content | **Implementation requirement** | Least-data cloud requests, exact permission records, loopback protection, sanitization, resource limits, and deletion audits |
| Copyright | Private transformation and citation do not automatically authorize redistribution | **Legal risk boundary, not legal advice** | Private learner-only v0, asserted rights metadata, no public lesson library, and review before sharing |

## Review of each dossier section

### 1. Executive conclusion

The conclusion is adopted. PRISM is a source-grounded semantic compiler and learner-controlled technical reader, not a speed-reading product. The enhanced Source Reader is not a throwaway control. It remains useful if every semantic-stream hypothesis fails.

The build/defer/reject partition is sound with one repository adjustment: several “Build Now” foundation items already exist in the current TCP vertical slice. The implementation plan starts from that code rather than replaying a greenfield Week 1.

### 2. Research synthesis

The synthesis correctly separates strong component evidence from the untested complete product. The most important disciplinary point is that familiar, fluent, fast, recognized, completed, or confidently reported content is not thereby understood or retained.

The original PRISM evidence review remains valuable because it contains reading-rate, rapid-picture, attention, pacing, gaze, and frontier-interface sources not repeated in the dossier. The two reviews are cumulative, not replacements.

### 3. Competing-design matrix

The matrix corrects a major product risk: an ordinary accessible reader with excellent source navigation may outperform a sequential canvas. PRISM must compare against that credible baseline. A semantic condition earns continuation only through delayed transfer, noninferiority with lower active time, lower workload for a defined case, or a meaningful accessibility benefit.

One-word RSVP remains available only as an optional, bounded research negative control. It is not part of the product roadmap and should not consume core engineering time.

### 4. Traceable Semantic Relay

The owner adopted **Traceable Semantic Relay (TSR)** as the official name of the Experimental semantic-canvas mechanism:

1. **Anchor** the current concept in exact source evidence or a quiet structural marker.
2. **Advance** one coherent source-grounded relation under learner control.
3. **Integrate** at a meaningful boundary with explanation, prediction, contrast, or application.
4. **Repair** one diagnosed missing or incorrect relation through source evidence and a different representation.

TSR is a mechanism name, not an efficacy claim. It is falsified as the preferred interface if it produces worse seven-day transfer, materially greater active time or workload without benefit, unacceptable source distortion, or high context-recovery cost compared with the Source Reader.

### 5. Desktop semantic-canvas UX

The three-surface model is adopted: Source Reader, TSR semantic canvas, and delayed Review surface. The stable-zone layout, one active representation plus one anchor, exact source inspection, transcript, keyboard map, reduced motion, and reversible Faster/Deeper receipts are strong implementation specifications.

Pixel widths, word ranges, node counts, timing values, and checkpoint frequency are prototype defaults. They must be tested at 1024, 1280, and 1440 CSS-pixel widths, 200 percent zoom, Windows display scaling, keyboard-only navigation, screen readers, and reduced motion. They are not cognitive-optimality claims.

The dossier’s control model supersedes the current timer-centered interpretation: Faster and Deeper are explicit content/support bundles, not merely a dwell multiplier. Preview may offer optional autoplay. Understand autoplay remains off by default. Study has no automatic instructional-frame advancement in v0.

### 6. Content and semantic data model

The model is the dossier’s strongest engineering contribution. It distinguishes immutable source objects, elements, spans, atomic claims, clauses, origins, support states, publication states, relations, frames, representation candidates, quality checks, rubrics, learner events, learner evidence, lesson packages, and provenance.

The full model should not land as one large migration. The implementation plan introduces the minimum closed contract needed by the next vertical slice:

1. source document, element, span, and region;
2. canonical claim and clause support;
3. concept and typed relation;
4. semantic frame and origin-labeled blocks;
5. source/representation binding;
6. quality check and publication lifecycle;
7. immutable lesson package and provenance;
8. practice rubric, evidence record, and delayed learner state.

The dossier uses example UUID-like string identifiers while some code examples type them as `UUID`. The implemented contract must choose one canonical identifier representation and test round-trip serialization; examples do not silently set the storage type.

### 7. Bounded semantic compiler

The multi-pass compiler is adopted as the target architecture. Models propose candidates; deterministic code owns permissions, identifiers, span resolution, state transitions, rendering, packaging, policy, and release gates.

The pipeline is deliberately section-scoped. Full books are hashed, indexed, searched, and structurally mapped locally. Only a selected, closed learning unit enters deep compilation. Every pass records input hashes, contract and implementation versions, permissions, outputs, check results, cost, latency, and abstention.

The newest document benchmarks strengthen this design rather than selecting a permanent parser or model. CiteVQA reports correct answers paired with wrong evidence regions; DocScope separately evaluates page localization, region grounding, fact extraction, and answer verification; XL-DocBench stresses evidence across documents hundreds or thousands of pages long. All three are 2026 preprints and must remain labeled as fast-moving evidence.

### 8. Adaptation and learner model

The v0 policy is evidence-based rather than trait-based. A single pause, rewind, response time, focus loss, preference, or confidence report cannot create a comprehension or mastery state.

The owner adopted **sparse learning loop** as the v0 term. Concept state records orientation, immediate evidence, delayed evidence, repair need, and uncertainty. “Mastery” is reserved for a carefully defined outcome claim and is not a generic UI badge or probability.

The rule examples are useful, but their numeric cutoffs are implementation starting values. They require versioning, replay tests, user-visible explanations, and pilot revision. Reinforcement learning is rejected for the foreseeable roadmap; knowledge tracing and contextual bandits remain gated research directions.

### 9. Roadmap

The dossier’s 60–120 hour scope is realistic, but its first milestones assume an empty repository. PRISM already has an adopted stack, a clean-PDF TCP fixture, immutable source storage, resumable indexing, deterministic draft frames, a semantic player, source-region visuals, local events, and recovery tests.

The revised plan therefore preserves the TCP fixture as an engineering baseline and makes a reviewed transaction-isolation package the first learning/research fixture. The next work is not more parser breadth. It is a first-class Source Reader, contract v2, a manual gold package, TSR player behavior, accessibility/recovery hardening, one sparse repair loop, delayed review, and only then bounded AI compilation.

### 10. Validation plan

The dossier correctly promotes seven-day transfer to the primary outcome. Active time is interpreted beside absolute learning, not allowed to rescue a materially worse learning result through a ratio. Literal comprehension, inference, explanation, transfer, workload, fatigue, calibration, control events, usability, attrition, and source-fidelity incidents remain required.

The proposed 0.20 standard-deviation/five-point noninferiority margin, 15 percent median time reduction, 36–60 directional-study range, 98 percent clause-support gate, and 90/80 percent usability thresholds are governance proposals. They must be justified or revised using assessment reliability, expert judgment, pilot variance, within-person correlation, and sample-size simulation before preregistration.

### 11. Risks and ethics

The risk register is adopted. The highest combined risks are discourse fragmentation, generated source distortion, unsafe document handling, scope explosion, and false learning claims. The correct response is fail-closed behavior and narrower scope, not an aggregate quality score that hides a critical error.

The loopback app needs a real threat model. Localhost is not automatically trusted: source-derived content, generated Markdown, SVG, file paths, Host/CORS behavior, origin tokens, PDF resource use, log redaction, and deletion completeness all need explicit tests.

### 12. Prioritized decisions

The ten dossier priorities are adopted with the repository-aware ordering in the implementation plan. The owner decisions made during integration are:

- adopt Traceable Semantic Relay as the Experimental mechanism name;
- use sparse learning loop for v0;
- keep one-word RSVP only as an optional research control;
- make the enhanced Source Reader a first-class product surface and primary baseline;
- keep transaction isolation as the first manually reviewed learning fixture while preserving TCP as the first parser/performance fixture.

### 13. Bibliography

The dossier contains 77 annotated entries and 81 unique external URLs across learning science, reading, multimedia, adaptation, document AI, standards, privacy, security, copyright, and prior art. It generally labels reviews, experiments, preprints, standards, documentation, patents, and practitioner guidance correctly.

Current checks confirmed the identity and central claims of representative sources across the main pillars, including the Rayner speed-reading review, the 2025 Cromley and Chen multimedia meta-analysis, the 2024 multiple-representation meta-analysis, OmniDocBench, OHRBench, CiteVQA, DocScope, XL-DocBench, and WCAG 2.2. This was a targeted verification pass, not a full independent replication or risk-of-bias assessment of all 77 sources.

Before a publication or external efficacy claim, the bibliography still needs:

- DOI and author metadata normalization;
- a formal search protocol and inclusion/exclusion record;
- duplicate-study handling across reviews and meta-analyses;
- risk-of-bias and publication-bias appraisal;
- population, task, outcome, and delay extraction;
- explicit treatment of effect-size dependence;
- refreshed status for every 2025–2026 preprint and fast-moving technical benchmark.

## Adopted changes to the canonical product contract

| Prior contract | Integrated contract |
|---|---|
| Semantic player centered on dwell and optional continuous playback | Learner-stepped TSR; autoplay limited by mode and off by default |
| Faster/Deeper primarily changes timing and visible context | Faster/Deeper applies a reversible bundle with an itemized receipt |
| Two rewinds can independently trigger slowing | Ambiguous behavior contributes only when paired with task evidence |
| “Mastery loop” as a product pillar | Sparse learning loop; delayed evidence states replace generic mastery language |
| One-word RSVP included in MVP scope and build sequence | Optional research-only negative control with minimal engineering |
| Efficiency ratio prominent in the primary hypothesis | Seven-day transfer is primary; active time is interpreted only beside absolute learning |
| `draft/reviewed/verified` as the complete content lifecycle | Staged schema, span, grounding, review, approval, fallback, rejection, and supersession states |
| Generated representation can be accepted through general fidelity review | Every visible clause, node, edge, cell, equation step, and code state has typed support and critical gates |
| Greenfield 12-week roadmap | Repository-grounded plan starting from the existing TCP vertical slice |

## What remains unproven

1. TSR improves immediate or delayed learning over an enhanced Source Reader.
2. A persistent source anchor reduces orientation cost without split attention.
3. Relation-sensitive frame sizing improves learning or time.
4. One sparse prompt helps more than it interrupts.
5. Representational repair outperforms source review or simple feedback.
6. An AI compiler can meet the required clause- and asset-level fidelity at acceptable cost.
7. Transparent rule-based adaptation improves outcomes over a good fixed Study bundle.
8. The owner pilot workflow can obtain reliable seven-day outcomes without expectancy and scoring bias.

These are the questions the product is being built to answer. They are not shortcomings to hide with confident language.

## Integration rule

When this review, the raw dossier, and an older PRISM document disagree, use this precedence order:

1. `AGENTS.md` non-negotiable principles;
2. confirmed owner decisions in `docs/decisions/V0_DECISIONS.md`;
3. current product, architecture, validation, and implementation contracts;
4. this integration review;
5. the raw dossier as research evidence and design detail;
6. superseded or historical notes.

