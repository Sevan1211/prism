# PRISM Research and Implementation Dossier

**Personalized Representation and Information Streaming for Meaning**  
**Research cutoff:** August 21, 2026  
**Product boundary:** Private, local-first desktop web application for difficult technical learning  
**Initial benchmark domains:** Database transaction isolation, TCP congestion control, and distributed consensus

> **Decision in one sentence:** Build PRISM as a source-grounded semantic compiler and learner-controlled technical reader, not as a speed-reading system, and require it to beat an enhanced static reader on seven-day transfer before making any learning-efficiency claim.

## How to read this dossier

Every substantive recommendation is labeled:

- **Established:** Supported by converging reviews, meta-analyses, or strong replicated evidence, though the exact PRISM implementation may still require validation.
- **Promising:** Supported by relevant evidence, but direct evidence for PRISM's target population, content, or interaction is incomplete.
- **Experimental:** A testable PRISM design inference with a plausible mechanism but no direct proof as a complete product intervention.
- **Speculative:** A longer-term research bet with weak or indirect evidence.

The dossier also separates four kinds of statements:

1. **Finding:** What the external research directly supports.
2. **Project inference:** What follows when that evidence is applied to PRISM.
3. **Implementation recommendation:** What the product should do.
4. **Original PRISM hypothesis:** What must be tested rather than presented as known.

The source brief defines PRISM as a system for reaching a correct, durable, usable mental model with less wasted time. It explicitly rejects one-word RSVP as the core product, requires source traceability and learner control, and treats seven-day explanation and transfer as the main durable-learning standard.

---

# 1. Executive conclusion

## 1.1 The strongest defensible thesis

**PRISM can be scientifically defensible if it becomes a constrained representation-and-pacing layer over the source, not a replacement for reading and not a machine for flashing compressed information.**

The strongest evidence-backed design is a hybrid:

1. Preserve ordinary, self-paced source reading as the control surface and fallback.
2. Transform only conceptually dense passages into coherent semantic frames.
3. Keep one stable source or structural anchor visible when it genuinely helps.
4. Insert sparse integration and retrieval events at concept boundaries.
5. Repair misunderstanding by switching representation, restoring source context, or showing a worked contrast.
6. Maintain clause-level provenance for every published claim.
7. Use deterministic playback, validation, permissions, and adaptation rules before any learned policy.

The product's causal theory is not “faster exposure causes faster learning.” Its theory is:

> **Better selection, organization, integration, retrieval, and repair may reduce unproductive rereading and representation-switching while preserving the productive rereading and effort needed for durable learning.**

That distinction is foundational. Reading research shows a speed-accuracy tradeoff and an important role for regressions. Learning research supports retrieval practice, spacing, self-explanation, worked examples, signaling, and well-integrated verbal and visual representations. It does not establish that an automatically generated one-screen semantic sequence will outperform a good static technical reader.

## 1.2 What to build now, test first, defer, and reject

| Decision class | Items |
|---|---|
| **[Build Now]** | Enhanced static source reader; pasted text and Markdown import; clean born-digital PDF import; source elements and spans; deterministic lesson-player state machine; manual lesson authoring path; evidence-locked semantic frames; source inspection; provenance; accessible keyboard operation; reduced-motion and static transcript modes; transaction-isolation golden fixture; local SQLite and content-addressed files. |
| **[Experiment First]** | Phrase or proposition frame sizing; persistent source anchor; progressive diagram focus; concept-boundary integration pause; sparse retrieval and repair; Faster to Deeper bundles; AI-generated faithful paraphrases; typed generated diagrams; transparent rule-based adaptation. |
| **[Defer]** | Scanned and hostile PDFs; arbitrary textbook-wide transformation; learned pacing policies; contextual bandits; Bayesian or deep knowledge tracing; mobile; social or classroom features; cloud-first processing; automatic note generation; broad nonfiction support; open-ended image generation. |
| **[Reject]** | One-word RSVP for mastery; forced continuous playback; “learning style” profiles; confidence-only mastery; gaze or completion as learning; gamified streak optimization; arbitrary generated illustrations; opaque mastery scores; claims that Preview equals understanding; claims that PRISM “uploads” knowledge or preserves comprehension at extreme display rates. |

## 1.3 Is the one-screen semantic canvas worth pursuing?

**Yes, as an Experimental interaction model under six constraints:**

1. The canvas is stable and spatially predictable.
2. Advancement is learner-controlled by default.
3. The previous frame and source are recoverable in one action.
4. Persistent visuals are used only when they clarify structure, state, sequence, causality, comparison, quantity, or procedure.
5. Generated content is evidence-locked and typed.
6. The experience falls back to Source mode whenever fidelity, accessibility, or pedagogical confidence is insufficient.

The canvas is not justified merely because it looks calmer than a reader or more advanced than a PDF viewer. It earns continuation only if it improves delayed transfer, reduces active time without reducing learning, or provides a meaningful accessibility or comprehension benefit for a defined subgroup.

## 1.4 What PRISM is and is not

**PRISM is:**

- A private technical-learning reader.
- A source-grounded semantic compiler.
- A deterministic playback system for text, equations, code, tables, and diagrams.
- A sparse learning loop that diagnoses and repairs specific misunderstandings.
- A research instrument for comparing representations and pacing policies.

**PRISM is not:**

- A speed-reading app.
- An AI summary generator with a theatrical player.
- A quiz site, flashcard system, course platform, or tutor chatbot.
- A replacement for textbooks or source inspection.
- A system that infers intelligence, disability, emotion, motivation, or a fixed learning style.
- A product that can claim faster learning before delayed, transfer-sensitive evidence exists.

## 1.5 Evidence-weighted product verdict

| Question | Verdict | Label |
|---|---|---|
| Should PRISM preserve self-paced reading and regressions? | Yes. | **Established** |
| Should it present coherent semantic units instead of isolated words? | Yes as a design constraint, but optimal unit size must be tested. | **Promising / Experimental** |
| Should diagrams and text coexist? | Yes when integrated, relevant, signaled, and task-appropriate. | **Established** |
| Should all content be animated or progressively revealed? | No. Static or user-stepped states should be the default. | **Established / Promising** |
| Should retrieval and self-explanation appear? | Yes, sparsely and at meaningful boundaries. | **Established components; Experimental integration** |
| Should behavior drive automatic personalization immediately? | No. Start with transparent, reversible rules. | **Promising** |
| Should AI independently decide what the source means? | No. It may propose typed candidates, never self-certify them. | **Implementation requirement** |
| Can the full semantic canvas be advertised as superior? | Not yet. | **Experimental** |

---

# 2. Research synthesis and evidence map

## 2.1 Cognitive and linguistic foundations

### 2.1.1 Reading is active control, not passive intake

**Finding, Established.** Skilled reading includes variable fixation durations, forward movements, regressions, rereading, and strategic allocation of attention. A major review of speed-reading claims concluded that very large increases in reading rate generally trade off against comprehension. Experiments that made previously read text unavailable impaired comprehension, especially when sentences required reinterpretation.

**Boundary conditions.** Readers can skim effectively for gist or known information. Previewing can be efficient when the goal is orientation. The problem is not speed itself. The problem is claiming unchanged comprehension when the display removes access to linguistic information and reader control.

**PRISM implication.** Preview may use faster, larger semantic frames, but Understand and Study must retain rewind, replay, pause, source inspection, and stable context. A timed stream must never be the only path.

Primary sources:
- Rayner et al. (2016): https://doi.org/10.1177/1529100615623267
- Schotter, Tran, and Rayner (2014): https://doi.org/10.1177/0956797614531148
- Acklin and Papesh (2017): https://pubmed.ncbi.nlm.nih.gov/29461715/

### 2.1.2 Comprehension requires a coherent mental model

**Finding, Established.** Discourse-comprehension theories distinguish the surface wording, a textbase of propositions, and a situation or mental model that integrates relations, inferences, prior knowledge, entities, goals, time, space, and causality. Coherence is constructed, not delivered as a sequence of recognized words.

**Boundary conditions.** More explicit text is not always uniformly better. Prior knowledge interacts with coherence and with the inferences learners generate. Over-simplification can remove productive inferential work or conceal important qualifications.

**PRISM implication.** The player should be planned around concepts and relations, not token count. It should preserve causal and conditional links, mark unresolved references, and avoid “simplifying” away exceptions. Prior-knowledge support should be a reversible scaffold, not permanent simplification.

Primary sources:
- Kintsch (1988): https://doi.org/10.1037/0033-295X.95.2.163
- Zwaan and Radvansky (1998): https://doi.org/10.1037/0033-2909.123.2.162
- Perfetti and Stafura (2014): https://doi.org/10.1080/10888438.2013.827687
- McNamara et al. (1996): https://doi.org/10.1207/s1532690xci1401_1

### 2.1.3 “Semantic chunking” is plausible, but direct evidence is limited

**Finding, Promising.** Linguistic processing is incremental and organized around meaningful phrases, clauses, propositions, and discourse relations. Phrase-aware layouts and chunked presentation can reduce some low-level parsing demands. However, there is no mature evidence base establishing a universally optimal semantic-frame length for difficult college-level technical learning.

**Disconfirming evidence.** Any forced sequential format can create transient-information costs, remove parafoveal preview, disrupt rereading, and fragment cross-sentence integration. A longer chunk can overload working memory, while a shorter one can destroy coherence.

**PRISM implication.** Frame boundaries require an explicit planner and empirical tuning. The MVP should test at least three sizes:

- **Micro:** one proposition, usually 15 to 35 words.
- **Meso:** a coherent relation or mini-explanation, usually 35 to 90 words.
- **Macro:** a worked step, code trace, or integrated example, up to about 140 words.

These are engineering starting ranges, not psychological constants.

### 2.1.4 Prior knowledge changes what support helps

**Finding, Established.** Prior knowledge affects inference generation, use of diagrams, benefit from explanatory detail, and the amount of guidance required. Supports that help novices can become redundant or distracting for more knowledgeable learners.

**PRISM implication.** A short concept precheck and an explicit learner-selected goal should control scaffold availability. PRISM should not permanently label the learner as novice or expert. The state belongs to a concept, source, and time.

### 2.1.5 Metacognitive confidence is useful only when paired with performance

**Finding, Established.** Learners can be miscalibrated, especially when judgments are made immediately after fluent exposure. Confidence, familiarity, completion, and recognition are not substitutes for explanation or transfer.

**PRISM implication.** Ask confidence only after an answer, then pair it with correctness and delayed results. High-confidence errors are especially useful repair signals. Never increase pace merely because the learner reports confidence.

Sources:
- Dunlosky and Rawson (2012): https://doi.org/10.1016/j.learninstruc.2011.08.003
- Dunlosky et al. (2013): https://doi.org/10.1177/1529100612453266

## 2.2 Learning science

### 2.2.1 Retrieval practice

**Finding, Established.** Practice testing improves later retention, with effects that are often larger after a delay. Transfer beyond the practiced form is possible but more variable than simple retention.

**Limitations.** Retrieval is not automatically beneficial. Poor questions, missing feedback, excessive interruption, and trivial fact prompts can waste time or induce errors. Test-enhanced learning evidence does not imply that every screen should end in a quiz.

**PRISM implication.** Use one sparse, diagnostic prompt at a concept boundary, not a constant quiz cadence. Prefer explanation, prediction, causal completion, code-state prediction, or a new-case decision over recognition-only multiple choice.

Sources:
- Rowland (2014): https://doi.org/10.1037/a0037559
- Adesope, Trevisan, and Sundararajan (2017): https://doi.org/10.3102/0034654316689306
- Pan and Rickard (2018): https://doi.org/10.1037/bul0000151

### 2.2.2 Spacing

**Finding, Established.** Distributed practice improves long-term retention relative to massing, and the useful spacing interval depends partly on the desired retention interval.

**PRISM implication.** The seven-day check is not an optional analytics feature. It is part of the product's learning claim. The first product should schedule a small set of concept-level prompts at 24 hours and seven days while keeping all data local.

Sources:
- Cepeda et al. (2006): https://doi.org/10.1037/0033-2909.132.3.354
- Cepeda et al. (2008): https://doi.org/10.1111/j.1467-9280.2008.02209.x

### 2.2.3 Self-explanation

**Finding, Established.** A meta-analysis of 64 reports and 69 effects found a positive mean effect for induced self-explanation, with substantial variation across tasks and implementations.

**Boundary conditions.** Prompts can impose unnecessary load, elicit shallow restatement, or help one outcome while harming another. Generated prompts must be answerable from the current lesson state.

**PRISM implication.** Use constrained prompts such as “Why can both transactions commit here?” or “What event changes the congestion window next?” Score against a relation rubric rather than lexical overlap.

Source:
- Bisra et al. (2018): https://doi.org/10.1007/s10648-018-9434-x
- Chi et al. (1989): https://doi.org/10.1207/s15516709cog1302_1

### 2.2.4 Worked examples and fading

**Finding, Established for many novice problem-solving contexts.** Well-designed worked examples can reduce unproductive search and help learners acquire schemas. Guidance should often fade as competence increases.

**PRISM implication.** For equations, code, transaction schedules, and protocol traces, display a fully worked state transition before asking for an independent prediction. Fade labels or intermediate states only after successful explanation.

Source:
- Atkinson et al. (2000): https://doi.org/10.3102/00346543070002181
- Renkl et al. (1998): https://doi.org/10.1006/ceps.1997.0959

### 2.2.5 Interleaving

**Finding, Promising and domain-sensitive.** Interleaving can improve discrimination and later performance, but effects differ sharply by domain and task. It is not a universal replacement for blocked practice.

**PRISM implication.** Do not interleave during initial model construction. Later, compare neighboring concepts that learners commonly confuse, such as snapshot isolation versus serializability or slow start versus congestion avoidance.

Source:
- Brunmair and Richter (2019): https://doi.org/10.1037/bul0000209

## 2.3 Multimedia learning, visual cognition, and diagrams

### 2.3.1 Relevant words plus relevant visuals

**Finding, Established with conditions.** Meta-analytic evidence supports learning from coordinated words and graphics over words alone on average. Benefits depend on the graphic's relevance, integration, signaling, complexity, and the learner's ability to interpret it. The 2025 meta-analysis of Mayer's research corpus covered 92 articles, 181 studies, and 591 effects, with a positive overall average but strong variation by principle and medium.

**Disconfirming evidence.** Adding decorative visuals, redundant representations, or poorly integrated diagrams can increase load. Animation, games, simulations, and immersive formats do not produce uniform benefits merely because they are dynamic.

**PRISM implication.** Every representation candidate must state what relation it clarifies. “Looks engaging” is an invalid justification.

Sources:
- Cromley and Chen (2025): https://doi.org/10.1016/j.edurev.2025.100730
- Noetel et al. (2022): https://doi.org/10.3102/00346543211052329
- Guo et al. (2020): https://doi.org/10.1177/2332858420901696

### 2.3.2 Signaling, coherence, and contiguity

**Finding, Established.** Signaling relevant structure and keeping mutually dependent text and visuals close can improve learning. Removing seductive or irrelevant details often helps.

**PRISM implication.** Highlight the currently discussed nodes and edges, keep explanation adjacent to the visual, and avoid decorative UI. The stable editorial visual language is not merely aesthetic. It should reduce extraneous selection demands.

### 2.3.3 Static, stepped, and animated representations

**Finding, Mixed.** Meta-analyses have found average advantages for animation over static graphics in some contexts, but effects are highly moderated. Dynamic content can show continuous change that static images cannot. It can also create transient-information costs, split attention, and loss of state.

**PRISM implication.** Use this order of preference:

1. Static source visual.
2. Static annotated visual.
3. User-stepped state sequence.
4. Short, reversible animation only when continuous change is itself the concept.

Automatic looping animation is rejected. Every animation needs a static equivalent and explicit play control.

Sources:
- Höffler and Leutner (2007): https://doi.org/10.1016/j.learninstruc.2007.09.013
- Berney and Bétrancourt (2016): https://doi.org/10.1016/j.compedu.2015.12.020
- Ayres and Paas (2007): https://doi.org/10.1002/acp.1343

### 2.3.4 Diagram efficiency is conditional

**Finding, Established as a mechanism.** Diagrams can make certain relations computationally accessible by grouping information and supporting perceptual inference. This does not make every diagram superior to prose.

**PRISM implication.** Prefer diagrams for topology, causality, state transitions, timing, containment, dependency, and comparison. Prefer prose for qualifications, definitions with exceptions, and arguments whose logical force depends on wording.

Source:
- Larkin and Simon (1987): https://doi.org/10.1111/j.1551-6708.1987.tb00863.x

### 2.3.5 Multiple external representations

**Finding, Promising.** A 2024 meta-analysis found small average performance benefits when learners received more than two representations rather than exactly two, with high heterogeneity and support as an important moderator. There is no universal “more is better” rule.

**PRISM implication.** One active representation plus one stable anchor should be the default. Additional representations should appear only on request or for repair.

Source:
- Rexigel et al. (2024): https://doi.org/10.1007/s10648-024-09958-y

### 2.3.6 Visual working memory and change blindness

**Finding, Established at the general level.** Visual working memory is sharply limited, and people can miss substantial changes when attention is disrupted.

**PRISM implication.** Keep location, scale, orientation, labels, and object identity stable across frame transitions. Animate emphasis rather than rearranging the scene. When a diagram changes state, show changed elements and permit before/after comparison.

Sources:
- Luck and Vogel (1997): https://doi.org/10.1038/36846
- Rensink (2002): https://doi.org/10.1146/annurev.psych.53.100901.135125

## 2.4 HCI and spatial orientation

### 2.4.1 Stable context is a design hypothesis with supporting mechanisms

Digital reading can make spatial location less memorable, particularly when interfaces rely on continuous scrolling without stable landmarks. A semantic canvas can potentially restore landmarks, but the complete PRISM layout has not been validated.

**PRISM implication.** Keep topic, section, current concept, concept position, source-page location, and prior frame in stable positions. Do not repaginate or reorganize already seen content without an explicit mode change.

### 2.4.2 Learner control is necessary but not sufficient

Learner control can improve agency and permit strategic processing, but learners do not always choose optimal pacing or support. Prior knowledge and orientation matter.

**PRISM implication.** Preserve control while offering transparent defaults and recommendations. The system may say “A boundary check is recommended because this concept introduces a new causal rule,” but the learner can skip it.

### 2.4.3 Progressive disclosure is not a learning guarantee

Progressive disclosure can simplify a surface and support task focus, but direct evidence that it reduces cognitive load or improves learning is mixed.

**PRISM implication.** Use it as an information-management pattern, not as a scientific claim. Never hide prerequisites, exceptions, provenance, or controls needed for understanding.

## 2.5 Adaptive learning and learner modeling

### 2.5.1 Intelligent tutoring has positive average effects, but PRISM is not yet an ITS

Meta-analyses of intelligent tutoring systems report positive average learning effects. Those results cover diverse systems with explicit domain models, feedback loops, curricula, and substantial engineering. They do not validate behavioral pacing adaptation in a document reader.

Sources:
- Kulik and Fletcher (2016): https://doi.org/10.3102/0034654315581420
- Ma et al. (2014): https://doi.org/10.1037/a0037123
- Steenbergen-Hu and Cooper (2014): https://doi.org/10.1037/a0034752

### 2.5.2 Trace data are ambiguous

A pause may indicate confusion, note-taking, distraction, or productive integration. Fast responses may reflect fluency or guessing. Rewinds may signal difficulty or healthy verification.

**PRISM implication.** No single behavioral event should update mastery. Combine behavior with correctness, task context, confidence after answering, and delayed outcome. Keep explanations visible and rules reversible.

### 2.5.3 Learned policies are premature

Bayesian knowledge tracing and deep knowledge tracing model sequences of opportunities and responses. Contextual bandits and reinforcement learning can optimize action selection. They require valid actions, outcomes, coverage, and careful off-policy evaluation.

**PRISM implication.** The MVP has none of those prerequisites at adequate scale. Learned policy work should begin only after stable content schemas, reliable item scoring, delayed labels, action logging, and evidence that deterministic adaptation is leaving meaningful value on the table.

Sources:
- Corbett and Anderson (1994): https://doi.org/10.1007/BF01099821
- Piech et al. (2015): https://papers.nips.cc/paper_files/paper/2015/hash/bac9162b47c56fc8a4d2a519803d51b3-Abstract.html

## 2.6 AI, NLP, document intelligence, and grounding

### 2.6.1 PDF parsing remains a bounded engineering problem, not solved infrastructure

OmniDocBench evaluates diverse PDF parsing with fine-grained annotations. Newer 2026 benchmarks emphasize long documents, tables, figures, formulas, evidence regions, and visually complex or failure-selected documents. Answer accuracy can conceal wrong evidence attribution.

**PRISM implication.** Limit v0 to pasted text, Markdown, text files, and clean born-digital PDFs. Treat every extracted element type independently. A page can pass prose extraction but fail a table or equation. Failed elements force Source mode rather than silent approximation.

Sources:
- OmniDocBench, CVPR 2025: https://openaccess.thecvf.com/content/CVPR2025/html/Ouyang_OmniDocBench_Benchmarking_Diverse_PDF_Document_Parsing_with_Comprehensive_Annotations_CVPR_2025_paper.html
- CiteVQA, preprint: https://arxiv.org/abs/2605.12882
- DocScope, preprint: https://arxiv.org/abs/2605.08888
- XL-DocBench, preprint: https://arxiv.org/abs/2608.00036

### 2.6.2 Structured output is necessary but insufficient

A JSON-schema-valid answer can still contain unsupported claims, incorrect mappings, missing qualifications, or evidence spans that do not entail the text. Constrained decoding improves syntax reliability, not semantic truth.

**PRISM implication.** Validation requires separate gates:

1. Schema validity.
2. Referenced source ID existence.
3. Span normalization and substring or region validity.
4. Clause-level support check.
5. Contradiction check.
6. Omission and qualification check.
7. Representation answerability check.
8. Deterministic rendering safety.
9. Human review for benchmark and uncertain cases.

Sources:
- JSONSchemaBench, preprint: https://arxiv.org/abs/2501.10868
- ALCE: https://aclanthology.org/2023.emnlp-main.398/
- JSON Schema 2020-12: https://json-schema.org/draft/2020-12

### 2.6.3 Provenance must be first-class data

**Finding and implementation standard.** Provenance should identify source objects, transformations, agents, versions, and derivation relations. W3C PROV provides a useful conceptual basis.

**PRISM implication.** Every lesson package must preserve the document hash, parser version, compiler-pass versions, model/provider identifiers, prompts, schema versions, source spans, check results, and approval status.

Source:
- W3C PROV-O: https://www.w3.org/TR/prov-o/

### 2.6.4 Models should propose, not decide

Use LLMs or VLMs for candidate extraction, relation proposals, faithful paraphrase candidates, practice drafts, and typed diagram specifications. Keep permissions, storage, identifiers, spans, state transitions, publishing gates, rendering, and learner-policy enforcement deterministic.

## 2.7 Accessibility

Accessibility is a release gate, not a later compatibility pass.

**Required standards and implications:**

- Full keyboard operation and logical focus order.
- Visible focus indicators.
- Reflow and zoom without loss of information or operation.
- Reduced-motion behavior and static equivalents.
- No unsafe flashing.
- Text alternatives for diagrams and source visuals.
- Controls with clear labels and predictable locations.
- Screen-reader-accessible frame transcript and source links.
- No time limit required for Understand or Study.
- Progress and current location exposed semantically.

Primary standards:
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WAI-ARIA 1.2: https://www.w3.org/TR/wai-aria-1.2/
- Cognitive and Learning Disabilities Accessibility Guidance: https://www.w3.org/TR/coga-usable/

## 2.8 Privacy, security, and copyright

### 2.8.1 Local-first must mean actual local control

Browser local storage is not an appropriate repository for sensitive source text because successful script injection can expose it. Local-first should use a loopback backend with SQLite, content-addressed files, least-privilege file access, and explicit deletion.

Sources:
- OWASP HTML5 Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- NIST Privacy Framework: https://www.nist.gov/privacy-framework

### 2.8.2 Cloud transformation requires granular consent

Before a cloud pass runs, PRISM should display:

- Provider.
- Exact source regions leaving the device.
- Purpose.
- Retention policy known to PRISM.
- Whether the payload may be used for training under the selected provider configuration.
- Expected cost.
- Local alternative.
- A deny option that preserves core functionality.

### 2.8.3 Copyright requires constrained product behavior

Copyright and fair-use determinations are fact-specific. PRISM should not claim that all user-uploaded textbooks may lawfully be transformed or redistributed.

**Implementation recommendation:**

- Keep the MVP private and learner-only.
- Do not publish transformed lessons or source visuals by default.
- Record the user's asserted source basis and any license metadata.
- Minimize retained copies.
- Provide complete deletion.
- Separate source facts from protected expressive text.
- Avoid long verbatim excerpts in generated frames unless necessary and user-authorized.
- Seek legal review before public sharing, collaboration, or hosted textbook libraries.

Sources:
- U.S. Copyright Office Fair Use Index: https://www.copyright.gov/fair-use/
- Copyright basics: https://www.copyright.gov/what-is-copyright/

## 2.9 Technical STEM reading: dedicated findings and product implications

| Material | Main cognitive task | Common failure | PRISM representation | Evidence status |
|---|---|---|---|---|
| Technical prose | Build propositions and causal model | Fluent paraphrase without governing relation | Proposition, contrast, causal frame, integration summary | **Established mechanisms; Experimental packaging** |
| Code | Simulate state, control flow, data flow, abstraction | Reading syntax without tracking state | Code trace with synchronized state table and one-step prediction | **Promising** |
| Equations | Coordinate symbols, quantities, assumptions, transformations | Manipulating symbols without conceptual meaning | Equation map, symbol ledger, worked step, dimensional or invariant check | **Promising** |
| Diagrams | Decode notation and map elements to relations | Looking without knowing what to inspect | Diagram focus with labels, relation cue, and source region | **Established conditional value** |
| Tables | Compare dimensions and exceptions | Serially reading cells without comparison plan | Table comparison frame with highlighted row/column and explicit question | **Promising** |
| Processes and protocols | Track temporal and causal state | Losing prior state or confusing triggers | User-stepped state sequence with persistent state ledger | **Strong mechanism, Experimental implementation** |
| Distributed systems | Coordinate local views, messages, failures, and invariants | Treating global narration as if every node knows it | Multi-lane timeline, local-state panels, message edges, failure injection | **Promising / Experimental** |
| Database schedules | Track interleavings, reads, writes, visibility, anomalies | Conflating isolation guarantee with implementation | Transaction lanes, version visibility, conflict relation, counterexample | **Promising / Experimental** |

### Rules for code

1. Never replace runnable source code with only prose.
2. Keep line numbers and source mapping.
3. Synchronize current line, call stack, variables, heap objects, and output.
4. Permit free stepping and direct source inspection.
5. Use predictions only at semantically meaningful points.
6. Label any generated code as generated.
7. Execute generated examples in a sandbox before publication.

### Rules for equations

1. Preserve the source equation exactly.
2. Maintain a symbol table with source definitions.
3. Separate algebraic transformation from conceptual interpretation.
4. Never generate a derivation that cannot be checked step-by-step.
5. Render MathML or accessible LaTeX with a spoken-text alternative.
6. Fail closed when extraction confidence is inadequate.

### Rules for distributed-system reasoning

1. Separate real time, logical order, and causal order.
2. Show each participant's local state, not only an omniscient narration.
3. Attach every transition to an event and rule.
4. Keep safety properties separate from liveness properties.
5. Make assumptions visible.
6. Use counterexamples and nonexamples to expose hidden conditions.

## 2.10 Claims PRISM must never make

| Prohibited claim | Why it is unsupported or misleading | Acceptable replacement |
|---|---|---|
| “Read 3x faster with full comprehension.” | Speed and comprehension trade off, and PRISM has no such evidence. | “Preview more quickly, then choose where to study.” |
| “Learn by watching information flash.” | Exposure is not durable learning. | “Use learner-controlled frames to organize and inspect difficult ideas.” |
| “Scientifically proven semantic streaming.” | The complete interaction is untested. | “Experimental semantic framing informed by reading and learning research.” |
| “AI guarantees faithful explanations.” | Structured outputs and citations do not guarantee support. | “AI drafts are checked against source spans and may revert to Source mode.” |
| “PRISM detects your learning style.” | Fixed learning-style matching lacks adequate evidence. | “PRISM adapts transparent supports to this concept, task, and observed performance.” |
| “Completion means mastery.” | Completion is an activity measure. | “Mastery requires delayed explanation and application.” |
| “Confidence means understanding.” | Confidence may be miscalibrated. | “Confidence is interpreted only with answer quality and delayed outcomes.” |
| “The diagram makes it easier.” | Visuals can help or harm depending on integration and task. | “This diagram is intended to clarify the state transition; switch to text if it does not.” |
| “Your pauses show confusion.” | Pause meaning is ambiguous. | “You rewound twice and missed the checkpoint, so PRISM is offering a deeper explanation.” |
| “Your data never leaves the device.” | False whenever approved cloud processing occurs. | “This pass is local” or “These exact spans will be sent to this provider with your approval.” |
| “Any uploaded book can be transformed legally.” | Copyright depends on facts and jurisdiction. | “Use content you are authorized to process; private transformation does not resolve every copyright question.” |

## 2.11 Evidence map

| Finding | Population or task base | Result direction | Confidence | Key limitation | Exact PRISM implication |
|---|---|---:|---|---|---|
| Extreme speed-reading claims conflict with normal comprehension processes | Adult reading, eye movement, speed-reading literature | Negative for preserved deep comprehension at extreme rates | High | Preview/skimming goals differ from mastery | Reject one-word RSVP as default |
| Regressions support comprehension | Sentence reading with gaze-contingent masking | Removing access harms comprehension | High | Laboratory sentences | Always preserve rewind and source |
| Mental-model construction requires integration | Discourse-comprehension theory and experiments | Coherent relation building predicts understanding | High | Theory does not specify UI | Plan concepts and relations, not token streams |
| Words plus relevant graphics can improve learning | Broad multimedia-learning studies | Positive average effect | High | Heterogeneous media and topics | Use task-relevant visuals with signaling |
| Animation is not uniformly better | Meta-analyses across learning materials | Mixed and moderated | Medium-high | Content and implementation vary | Default to static or user-stepped states |
| Retrieval practice improves delayed retention | Broad educational studies | Positive average effect | High | Transfer effects more variable | Sparse concept-boundary retrieval |
| Self-explanation prompts improve learning | 64 reports, 69 effects | Positive average effect | High | Prompt quality and outcome differ | Use answerable relation prompts |
| Spacing improves long-term retention | Broad verbal-learning studies | Positive average effect | High | Optimal gap depends on retention goal | Include 24-hour and seven-day checks |
| Multiple representations require support | STEM representation studies | Small, heterogeneous average benefit from additional representations | Medium | No universal optimal count | Default to one active plus one anchor |
| ITSs can improve outcomes | Diverse tutoring systems | Positive average effect | Medium-high | Not equivalent to document adaptation | Do not borrow ITS effect sizes for PRISM |
| Trace signals are ambiguous | Self-regulated learning and analytics literature | Single events have weak construct validity | Medium-high | Instrumentation varies | Combine signals and explain rules |
| PDF parsing and evidence grounding remain error-prone | Diverse document benchmarks | Large model and document variation | High | Benchmarks evolve quickly | Restrict v0 sources and fail closed |
| Schema validity is not factual validity | Constrained generation benchmarks | Syntax can pass while semantics fail | High | Model-specific performance changes | Layer semantic fidelity gates |
| Accessibility requires nonvisual, nonmotion paths | W3C standards and guidance | Normative requirement | High | Compliance is necessary, not sufficient usability | Keyboard, transcript, reduced motion, source access |
| Full PRISM semantic canvas improves seven-day transfer | No direct evidence | Unknown | Low | Central product hypothesis | Test before claiming or scaling |

---

# 3. Competing-design decision matrix

Ratings are relative to the target task: difficult, college-level technical material studied for delayed explanation and application.

| Design | Source fidelity | Initial comprehension | 7-day retention | Transfer | Learner control | Workload risk | Accessibility | Engineering risk | Evidence strength | Decision |
|---|---|---|---|---|---|---|---|---|---|---|
| Normal self-paced source reading | High | Medium to high | Medium | Medium to high | High | Medium | High when reader is accessible | Low | High baseline | **Retain as baseline and fallback** |
| One-word RSVP | Medium at token level, low at discourse level | Low for difficult material | Low or unknown | Low | Low | High | Low to medium | Low | Strong evidence against broad claims | **Reject for mastery** |
| Phrase or clause stream | Medium to high | Unknown to medium | Unknown | Unknown | Medium | Medium to high | Medium | Medium | Limited direct evidence | **Experiment only** |
| Enhanced static reader | High | High | Medium | Medium to high | High | Low to medium | High | Medium | Strong component evidence | **Build baseline** |
| Semantic canvas with persistent source visual | High if grounded | Potentially high | Unknown | Potentially high | High | Medium | Medium to high | Medium-high | Indirect | **Experiment** |
| Semantic canvas plus sparse retrieval and repair | High if grounded | Potentially high | Potentially high | Potentially high | High | Medium | Medium to high | High | Strong components, untested package | **Primary experimental condition** |
| Generated simplified visual as default | Medium to low | Unknown | Unknown | Unknown | Medium | High misrepresentation risk | Variable | High | Weak | **Reject as default** |
| Source visual plus typed annotation | High | Medium to high | Unknown to medium | Medium | High | Low to medium | High with alternative text | Medium | Stronger | **Preferred** |
| Transparent fixed pacing | High | Medium | Unknown | Unknown | High | Low | High | Low | Limited direct learning evidence, low risk | **Build first** |
| Transparent rule-based adaptation | High | Potentially medium-high | Unknown | Unknown | High | Medium | High if user can override | Medium | Indirect | **Build after instrumentation** |
| Learned adaptive policy | Variable | Unknown | Unknown | Unknown | Potentially low | High | Unknown | Very high | No PRISM-specific evidence | **Defer** |

## 3.1 Decision logic

The enhanced static reader is not a throwaway control. It is a credible product and may be the optimal outcome. It combines source fidelity, learner control, integrated visuals, search, annotations, and semantic navigation without imposing temporal sequencing.

The semantic canvas must justify its extra complexity by one of four outcomes:

1. Better seven-day transfer at similar active time.
2. Noninferior seven-day transfer with meaningfully lower active time.
3. Lower workload or confusion for a defined learner/content subgroup.
4. Better accessibility for a defined need without harming learning.

Aesthetic preference, completion rate, and immediate familiarity do not count.

---

# 4. Proposed PRISM interaction model

## 4.1 Experimental concept: Traceable Semantic Relay

**Status: Experimental**

**Provisional name:** Traceable Semantic Relay, or TSR.

A relay is a sequence of controlled handoffs. In PRISM, each handoff transfers a concept from source evidence to a learner-manipulable representation, then back to evidence when needed.

### Four-stage cycle

1. **Anchor**
   - Establish where the concept lives in the source.
   - Display the relevant source visual, table, code region, equation, or quiet structural marker.
   - State the current concept and its relation to the previous concept.

2. **Advance**
   - Present one coherent semantic frame.
   - Preserve the previous frame below it.
   - Use text, a typed diagram, a code trace, an equation step, or a table comparison according to the relation being taught.

3. **Integrate**
   - At a meaningful boundary, ask the learner to reconstruct a governing relation, predict the next state, explain a contrast, or apply the rule.
   - Do not ask at every frame.
   - Permit skip, source inspection, and “not ready.”

4. **Repair**
   - If the answer reveals a specific misconception, switch representation.
   - Show the exact source evidence.
   - Present a contrast, nonexample, worked trace, or smaller causal chain.
   - Recheck once, then return control rather than trapping the learner in remediation.

## 4.2 Causal mechanism

The proposed mechanism is a combination of established components:

- Stable context reduces orientation cost.
- Coherent segmentation reduces arbitrary fragmentation.
- Relevant, signaled representations support selection and organization.
- Integration prompts require construction of relations.
- Retrieval creates a diagnostic opportunity and strengthens access.
- Source-linked repair addresses an observed misconception.
- Full learner control preserves productive rereading and self-pacing.

The package is still unproven. The mechanism may fail because the sequential player adds navigation cost, because generated frames weaken source coherence, or because sparse checks interrupt learning.

## 4.3 Differentiation from prior art

PRISM is not differentiated merely by using AI, summarizing documents, displaying phrases, or drawing concept maps. Those functions already exist in e-readers, document assistants, tutoring systems, adaptive textbooks, RSVP tools, and systems such as iSTART and AutoTutor.

The proposed differentiation is the **combination of evidence locking and representation relay**:

- A canonical claim graph derived from exact source spans.
- A frame planner that can choose ordinary source reading as the winning representation.
- A stable source anchor with recoverable spatial location.
- Typed, source-linked representation changes.
- Sparse integration checks at concept boundaries.
- Repair by representational contrast, not generic chatbot explanation.
- A deterministic, inspectable player and learner-policy trace.
- Delayed transfer as the primary product gate.

This combination should be treated as a research contribution candidate, not as a novelty or patentability claim.

## 4.4 Falsification conditions

Traceable Semantic Relay is falsified as the preferred design if any of the following persist after reasonable iteration:

1. It is inferior to the enhanced static reader on seven-day transfer by a practically meaningful margin.
2. It consumes more active time and increases workload without improving delayed outcomes.
3. Learners spend substantial time recovering context or switching to Source mode.
4. Frame transformations introduce unsupported, distorted, or materially incomplete claims above the fidelity threshold.
5. The persistent anchor is ignored, misunderstood, or increases split attention.
6. Sparse checkpoints improve practiced answers but not new-case transfer.
7. Benefits disappear when presentation time is controlled.
8. Only users who already prefer the interface benefit, suggesting preference rather than learning mechanism.

## 4.5 Minimal falsification experiment

Use a within-subject Latin-square design with matched technical topics.

- **A:** Enhanced static reader.
- **B:** Semantic frames with source access, no persistent anchor or checks.
- **C:** Semantic frames plus persistent anchor.
- **D:** Full Traceable Semantic Relay with sparse integration and repair.

Primary outcome: seven-day transfer score scored blind to condition.

Secondary outcomes: active time, immediate literal and inferential comprehension, 24-hour retention, workload, confidence calibration, source-inspection events, rewinds, and source-fidelity errors.

The crucial comparisons are D versus A and D versus C. If D beats C but not A, the learning loop helps streaming but the static reader remains the product benchmark. If C harms performance, the anchor should be removed or made optional.

## 4.6 Graceful fallback

PRISM must maintain four fallback levels:

1. **Representation fallback:** generated diagram to source visual or text.
2. **Frame fallback:** transformed frame to exact source passage.
3. **Lesson fallback:** semantic player to enhanced static reader.
4. **Pipeline fallback:** automated compilation to manual or no transformation.

Fallback is not an error message. It is a normal, first-class state with preserved progress.


# 5. Desktop semantic-canvas UX specification

## 5.1 Global layout model

PRISM uses one stable application shell with three reading surfaces:

1. **Source Reader:** Enhanced static reading with structure, search, source visuals, and source spans.
2. **Semantic Canvas:** Learner-controlled sequence of source-grounded frames.
3. **Review Surface:** Delayed retrieval and concept-level progress, never a gamified dashboard.

At 1440 CSS pixels, use a centered application shell with a maximum content width of 1360 pixels and 40-pixel outer margins. The canvas has four stable zones:

- **Header strip, 72 px:** source, section, concept, mode, and position.
- **Anchor rail, 360 to 420 px:** source visual, table, equation, code region, or quiet section map.
- **Active rail, 720 to 800 px:** current frame and preceding frame.
- **Control strip, 72 to 88 px:** navigation, source, depth bundle, notes, and accessibility.

The shell should not resize when frame type changes. Content inside a zone may change, but zone locations remain stable.

### Responsive minimum

The full semantic canvas requires at least 1024 CSS pixels.

- **1280 px and above:** two-column canvas.
- **1024 to 1279 px:** anchor rail narrows to 320 px and active rail uses the remainder.
- **Below 1024 px:** switch to a one-column “stacked study” layout. The anchor becomes a sticky collapsible region above the active frame. The product should display that this is a reduced-layout mode.
- **Below 768 px:** Source Reader remains available, but the full PRISM semantic-canvas experiment is not supported in v0.

No information may become inaccessible at narrower widths. Collapsing is allowed; deletion is not.

## 5.2 Information hierarchy

Priority order:

1. Current concept and governing relation.
2. Active semantic frame.
3. Relevant source anchor.
4. Previous frame or prior state.
5. Immediate controls.
6. Source provenance and quality status.
7. Optional notes, concept map, and adaptation explanation.

The interface should never make progress percentage visually more prominent than the concept. The learner is not optimizing completion.

## 5.3 Persistent and transient regions

| Region | Persistence | Rule |
|---|---|---|
| App shell and controls | Session-persistent | Never move between frames |
| Topic, section, concept | Concept-persistent | Update only at explicit boundary |
| Source anchor | Relation-persistent | Keep while it supports the active relation; fade to quiet marker when irrelevant |
| Active frame | Transient | Replaced only by learner action or approved autoplay |
| Previous frame | One-step persistent | Always recoverable below or by keyboard |
| Provenance status | Frame-persistent | Compact indicator always visible |
| Source-inspection panel | Modal or side-sheet | Opens without losing player state |
| Notes | Optional persistent | Local-only by default |
| Concept map | On demand | Never overlays active content without user action |

## 5.4 Annotated wireframes

### 5.4.1 Import and source-permission state

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ PRISM                                                        Local workspace ●               │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Import a source                                                                              │
│                                                                                              │
│  [ Paste text ]  [ Choose .md/.txt ]  [ Choose clean PDF ]                                   │
│                                                                                              │
│  ┌──────────────────────────────────────────────┐  ┌───────────────────────────────────────┐ │
│  │ Source preview                               │  │ Processing boundary                   │ │
│  │                                              │  │                                       │ │
│  │ Title: Database System Concepts              │  │ Local passes                          │ │
│  │ Type: born-digital PDF                       │  │ ✓ hash, index, text extraction        │ │
│  │ Pages: 1,370                                 │  │ ✓ element detection                   │ │
│  │ Detected: prose, figures, tables, equations  │  │ ✓ source-region rendering             │ │
│  │                                              │  │                                       │ │
│  │ Selected section: 17.6 Isolation Levels      │  │ Optional cloud pass                   │ │
│  │ Pages 782–791                                │  │ Provider: [ none selected ▼ ]         │ │
│  │                                              │  │ Payload: selected section only        │ │
│  │ [ Inspect extraction ]                       │  │ Purpose: claims + frame proposals     │ │
│  └──────────────────────────────────────────────┘  │ Retention: [provider statement]       │ │
│                                                    │ Estimated cost: $0.04–$0.12           │ │
│                                                    │ [ ] Allow this source section         │ │
│                                                    └───────────────────────────────────────┘ │
│                                                                                              │
│  Copyright reminder: process material you are authorized to use. Lessons remain private.     │
│                                                                                              │
│  [ Cancel ]                                 [ Build local reader ] [ Compile selected section ]│
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Behavior**

- Cloud permission is unchecked by default.
- “Compile selected section” remains disabled until source inspection passes and any chosen provider permission is explicit.
- The user can build the enhanced static reader with no AI.
- The interface lists exact page or span boundaries that would leave the device.
- Permission is per source section, provider, and purpose. A previous permission is not silently reused after payload, provider, or retention changes.

### 5.4.2 Preview map

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Transaction Isolation  ›  Preview                           Goal: orientation, not mastery     │
├───────────────────────────────┬──────────────────────────────────────────────────────────────┤
│ SOURCE STRUCTURE              │ CONCEPT MAP                                                  │
│                               │                                                              │
│ 17.6 Isolation Levels         │  [Concurrent transactions]                                   │
│  ├─ anomalies                 │           │                                                   │
│  ├─ serializability           │           ▼                                                   │
│  ├─ SQL isolation levels      │  [Visibility + ordering rules]                               │
│  ├─ snapshot isolation        │       ┌──────┴────────┐                                      │
│  └─ implementation notes      │       ▼               ▼                                      │
│                               │ [Anomalies]     [Isolation guarantees]                        │
│ Key source visuals            │       │               │                                      │
│  fig. 17.12 schedule          │       └──────┬────────┘                                      │
│  table 17.4 levels            │              ▼                                                │
│                               │     [Counterexample tests]                                    │
│ Estimated study path          │                                                              │
│  18–28 min Understand         │ Selected section in one sentence:                            │
│  35–50 min Study              │ Isolation constrains which interleavings and observations     │
│                               │ are permitted, but the names of levels do not by themselves    │
│ [Open source]                 │ identify every anomaly prevented.                             │
│                               │                                                              │
│                               │ [Start Understand] [Start Study] [Read source normally]        │
├───────────────────────────────┴──────────────────────────────────────────────────────────────┤
│ Preview may omit details. It is not evidence of understanding.                               │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Behavior**

- Preview shows concept structure, not a compressed substitute for the section.
- Every map node links to source spans.
- Estimated times are ranges based on content size and selected bundle, not performance promises.
- The learner can enter Source Reader at any concept.

### 5.4.3 Active Understand or Study canvas

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Isolation › Snapshot isolation › Write skew                       Concept 4 of 9  [Study]      │
├───────────────────────────────┬──────────────────────────────────────────────────────────────┤
│ SOURCE ANCHOR                 │ ACTIVE FRAME                                                 │
│                               │                                                              │
│  T1              T2           │ Snapshot isolation can allow both transactions to commit     │
│  read A=on       read A=on    │ when each writes a different row, even though the combined    │
│  read B=on       read B=on    │ result violates a cross-row rule.                             │
│  write A=off     write B=off  │                                                              │
│  commit          commit       │ Governing relation                                            │
│                               │ Same snapshot + disjoint writes does not imply serializability.│
│  Invariant: A OR B             │                                                              │
│  must remain on                │ Source support  2 spans  [inspect]                           │
│                               │                                                              │
│  Current focus: disjoint       │ [Why this matters] [Show exact wording]                      │
│  writes highlighted           │                                                              │
│                               ├──────────────────────────────────────────────────────────────┤
│ [source figure] [static text] │ PREVIOUS FRAME                                               │
│                               │ Snapshot isolation prevents many read anomalies by giving... │
├───────────────────────────────┴──────────────────────────────────────────────────────────────┤
│  ← Back   Space Pause   → Next   S Source   D Deeper   F Faster   N Note   ? Shortcuts         │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Behavior**

- The source anchor uses labels, not color alone.
- The frame states one primary relation.
- “Source support” exposes the number and type of source spans.
- The previous frame is visibly subordinate but readable.
- Autoplay is off by default in Understand and Study.
- The active frame receives keyboard focus only when it contains an interaction. Ordinary navigation does not repeatedly move screen-reader focus into changing content without warning.

### 5.4.4 Source-inspection mode

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Source inspection                                                    [Close and return] Esc   │
├──────────────────────────────────────────────────────┬───────────────────────────────────────┤
│ PAGE / TEXT                                          │ FRAME CLAIMS AND SUPPORT              │
│                                                      │                                       │
│ p. 786                                               │ Claim C-014                           │
│ “Under snapshot isolation, each transaction reads…”  │ Type: faithful paraphrase             │
│ [highlighted span 1]                                 │ Status: approved                       │
│                                                      │                                       │
│ p. 787                                               │ Supported clauses                     │
│ “However, two transactions that update disjoint…”    │ 1. each reads one snapshot            │
│ [highlighted span 2]                                 │ 2. writes can be disjoint              │
│                                                      │ 3. both can commit                     │
│ [Open full page image]                               │                                       │
│                                                      │ Qualification                         │
│                                                      │ Does not claim all implementations     │
│                                                      │ exhibit identical conflict handling.  │
│                                                      │                                       │
│                                                      │ [Report mismatch] [Copy citation]      │
└──────────────────────────────────────────────────────┴───────────────────────────────────────┘
```

**Behavior**

- Exact source wording is not overwritten by the paraphrase.
- The inspection panel preserves player time and state.
- A screen-reader transcript lists source span, page, heading, and claim relation.
- The user can report a mismatch locally. The report creates a quality event and disables automatic approval for the same compiler version on that fixture.

### 5.4.5 Concept-boundary integration state

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Isolation › Boundary integration                                      No timer               │
├───────────────────────────────┬──────────────────────────────────────────────────────────────┤
│ RELATION MAP                  │ EXPLAIN THE CONNECTION                                      │
│                               │                                                              │
│ snapshot ──provides──▶ reads  │ Why does a consistent snapshot fail to guarantee a serial    │
│    │                          │ outcome in the write-skew schedule?                           │
│    └─does not imply─▶ serial  │                                                              │
│                               │ [ Type 1–3 sentences here                                  ] │
│ disjoint writes ──permit──▶   │                                                              │
│ both commits                  │ Confidence after answering: 1 2 3 4                          │
│                               │                                                              │
│ [Open prior frames]           │ [Not ready: review relation] [Submit explanation]            │
├───────────────────────────────┴──────────────────────────────────────────────────────────────┤
│ This check is used to choose the next explanation. It is not a grade.                        │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Behavior**

- No countdown or completion pressure.
- Confidence appears only after the learner has produced an answer.
- “Not ready” is a meaningful response, not a failure.
- The prompt is tied to a rubric of required relations.
- Exact wording is not required.

### 5.4.6 Checkpoint and repair state

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Repair: serializability versus snapshot consistency                        [Why shown?]       │
├───────────────────────────────┬──────────────────────────────────────────────────────────────┤
│ CONTRASTIVE TRACE             │ WHAT YOUR ANSWER SHOWED                                     │
│                               │                                                              │
│ Schedule A                    │ You correctly identified the common snapshot.                │
│ T1: r(A), w(B)                │ The missing relation was that disjoint writes can avoid a     │
│ T2: r(A), w(C)                │ direct write conflict while jointly violating an invariant.  │
│ Result: both commit           │                                                              │
│                               │ Source evidence                                              │
│ Schedule B                    │ p. 787, paragraphs 2–3  [inspect]                            │
│ T1: r(A), w(B)                │                                                              │
│ T2: r(B), w(B)                │ One-step repair                                              │
│ Result: one aborts            │ Which property distinguishes A from B?                       │
│                               │ [ Same snapshot ] [ Disjoint write sets ] [ Commit order ]    │
│ [toggle state labels]         │                                                              │
│                               │ [Return to source] [Continue after answer]                    │
└───────────────────────────────┴──────────────────────────────────────────────────────────────┘
```

**Behavior**

- The repair explicitly names what was correct and what was missing.
- It does not infer a trait or broad weakness.
- One repair opportunity is offered. Repeated failure returns to Source mode or a worked example rather than increasing pressure.

### 5.4.7 Session report and delayed-review state

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Session report: Transaction Isolation                                  Stored locally         │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Today                                                                                        │
│ Active study time        31 min          Source reading        9 min                          │
│ Concepts encountered     8               Concepts checked      4                              │
│ Source inspections       6               Rewinds               11                             │
│                                                                                              │
│ Evidence available                                                                           │
│ ✓ immediate explanation: 3/4 relation points                                                  │
│ ✓ new-case application: 2/3 rubric points                                                     │
│ ? seven-day durability: not measured                                                         │
│                                                                                              │
│ Suggested next action                                                                         │
│ Review one counterexample for write skew, then stop.                                           │
│ [Do 3-minute repair] [Schedule local reminder] [Finish]                                        │
│                                                                                              │
│ Upcoming local checks                                                                          │
│ Tomorrow: 2 prompts       In 7 days: 3 prompts        [edit]                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ No streaks, percentile rankings, or mastery badge.                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Behavior**

- The report distinguishes observed evidence from unmeasured durability.
- Session time excludes backgrounded intervals and idle periods after a configurable threshold.
- No motivational interpretation is made from activity.
- Delayed prompts are locally scheduled and can be exported or deleted.

## 5.5 Frame-transition and timing rules

### Default transition behavior

- Transition begins only after explicit Next, a semantic-key action, or approved autoplay.
- Use a 120 to 180 ms opacity and position transition for ordinary frames.
- The previous frame settles into its reserved region rather than disappearing.
- Layout coordinates do not shift during the transition.
- No parallax, zoom, rotation, bouncing, or continuous ambient motion.
- A changed diagram element may use a 250 to 450 ms emphasis pulse, but not flashing.
- Reduced-motion mode uses an immediate state replacement with a textual “Frame N of M” update.
- The user can disable all transition animation independently of system settings.

Timing values are interaction defaults, not claims about cognitive optimality.

### Autoplay

- **Preview:** Optional, off by default, minimum 4 seconds per micro-frame and 8 seconds per meso-frame, always pausable.
- **Understand:** Off by default. If enabled, advancement waits for estimated reading time plus a user-set buffer and never advances through an equation, code trace, table comparison, source inspection, prompt, or repair.
- **Study:** No automatic advancement through instructional frames in v0.
- A learner can press and hold the Next key to skim, but the UI labels this as rapid preview.

## 5.6 Focus management

1. Global controls remain in a stable keyboard order.
2. Next and Back do not steal focus from a note field, answer field, source panel, or open dialog.
3. Frame changes produce a polite live-region update with concept, frame type, and position. Full frame content is not automatically re-announced unless the user selects “read frame.”
4. Opening Source inspection moves focus to its heading; closing returns focus to the invoking control.
5. Repair feedback uses `aria-describedby` and a visible heading, not color or toast alone.
6. Keyboard traps are prohibited.
7. The player exposes a transcript region where all frames are ordinary document content.
8. Screen-reader users can choose sequential transcript navigation instead of the spatial canvas.

## 5.7 Progressive disclosure rules

Reveal a detail only when all three conditions hold:

1. It is not required to interpret the current frame.
2. Its absence cannot produce a materially false generalization.
3. The learner can reveal it in one action with a descriptive label.

Never progressively hide:

- Preconditions.
- Exceptions that reverse the rule.
- Source status.
- Uncertainty.
- Required axis labels, units, or legend.
- Code or equation definitions.
- The reason a repair appeared.
- Cloud-processing status.

## 5.8 Semantic-frame contracts

### 5.8.1 Proposition

**Purpose:** One source-supported assertion.

**Required fields:** subject, predicate, object or complement, qualifiers, source spans.

**Display rule:** One primary claim, up to two short qualification lines. Do not stack several independent claims.

**Typical active text:** 20 to 60 words.

**Interaction:** Optional “show exact wording” or “why this follows.”

### 5.8.2 Definition

**Purpose:** Bind a term to necessary meaning in the source context.

**Display rule:** Term, concise definition, scope, and one nonexample or contrast when confusion is likely.

**Prohibition:** Do not convert an operational description into a universal definition.

### 5.8.3 Contrast

**Purpose:** Distinguish concepts along a defined dimension.

**Display rule:** Two-column or matrix layout with a named comparison dimension. Keep common features separate from differentiators.

**Prompt:** Ask which condition changes the outcome, not which paragraph sounds familiar.

### 5.8.4 Causal relation

**Purpose:** Connect trigger, mechanism, and outcome.

**Display rule:** `condition -> mechanism -> consequence`, with qualifiers and competing causes when relevant.

**Visual:** Typed causal graph only if the graph reduces relational load.

**Prompt:** Prediction or counterfactual.

### 5.8.5 Sequence or process

**Purpose:** Explain ordered or stateful change.

**Display rule:** Persistent state ledger plus current transition. Use user-stepped states.

**Prohibition:** Do not animate steps faster than the learner can inspect or remove access to prior state.

### 5.8.6 Example and nonexample

**Purpose:** Show category boundary or rule application.

**Display rule:** Use minimally different pairs when possible. State which feature determines classification.

**Source status:** Clearly label source-provided, faithful derivative, or generated example.

### 5.8.7 Equation

**Purpose:** Map symbols, assumptions, transformations, and meaning.

**Display rule:**
- Source equation at top.
- Symbol ledger in anchor.
- One transformation or interpretive move per frame.
- Accessible spoken form.
- Units and domain restrictions visible.

**Prompt:** Predict sign, compare magnitude, identify invariant, or complete a justified step.

### 5.8.8 Code trace

**Purpose:** Coordinate code and runtime state.

**Display rule:**
- Source code with line numbers.
- Current line highlighted by noncolor marker.
- State panel for stack, bindings, heap, output, and relevant control state.
- One execution transition per step.

**Prompt:** Predict next state, output, branch, or invariant.

### 5.8.9 Diagram focus

**Purpose:** Direct attention to a source visual or approved typed diagram.

**Display rule:** Preserve scale and orientation. Add overlay labels without modifying source pixels. Show caption and alt text.

**Prompt:** Locate relation, compare states, or explain a highlighted edge.

### 5.8.10 Table comparison

**Purpose:** Extract a comparison that requires several cells.

**Display rule:** Keep original table available. Highlight a row, column, or cell set and state the comparison question. Preserve units and footnotes.

**Prompt:** Explain the observed difference or choose the relevant condition.

### 5.8.11 Integration summary

**Purpose:** Combine several frames into a coherent relation graph.

**Display rule:** No more than five primary nodes and seven edges in the default view. Link every node and edge to source claims.

**Prompt:** Reconstruct one missing edge or explain the governing relation.

### 5.8.12 Retrieval prompt

**Purpose:** Diagnose and strengthen access.

**Display rule:** One prompt, no timer, response area, “not ready,” source review, then confidence.

**Scoring:** Rubric-based relation coverage. Do not use semantic similarity alone.

### 5.8.13 Repair

**Purpose:** Address one observed misconception or omission.

**Display rule:** State what was correct, what was missing, source evidence, alternative representation, and one recheck.

**Prohibition:** No generic “try again,” trait label, or escalating punishment.

## 5.9 Quantitative presentation rules

These are implementation defaults to test, not universal cognitive constants.

| Variable | Default | Allowed range | Notes |
|---|---:|---:|---|
| Active prose line length | 55 to 72 characters | 45 to 80 | User adjustable through text scale and rail width |
| Active frame prose | 20 to 90 words | 8 to 140 | Larger only for worked examples or source excerpts |
| Previous-frame excerpt | 30 to 80 words | Full on demand | Never remove recoverability |
| Paragraph count | 1 to 3 | 1 to 5 | Prefer visible hierarchy over dense blocks |
| Diagram nodes in active view | 3 to 7 | Up to 12 | Larger graphs collapse to overview or source |
| Table cells actively highlighted | 2 to 12 | Up to 20 | Larger comparisons need a dedicated table mode |
| Persistent colors | 3 semantic accents maximum | Plus neutral tones | Meaning must not depend on color |
| Automatic motion | None | Short reversible transitions | Reduced-motion equivalent required |
| Checkpoint frequency | 1 per 3 to 7 frames or concept boundary | Never fixed globally | Driven by conceptual structure |
| Reading idle threshold | 90 seconds default | User configurable | Does not imply disengagement |

## 5.10 Color and visual language

Retain the proposed warm optical editorial direction:

- Mineral-paper background.
- Near-black ink.
- Restrained vermilion for selected or changed state.
- Spectral blue for source and provenance links.
- Neutral grays for hierarchy.

Rules:

1. Minimum WCAG contrast for text and controls.
2. Never use vermilion versus blue as the sole distinction.
3. Do not assign “correct” and “incorrect” solely by red and green.
4. No decorative gradients behind text.
5. No animated background.
6. Source, generated, inferred, and outside-enrichment statuses use icons, text labels, and shape in addition to color.
7. Focus rings remain highly visible and are never suppressed.

## 5.11 Keyboard map

| Key | Action | Guard |
|---|---|---|
| `Space` | Pause or resume optional autoplay | Does not fire while typing |
| `Right Arrow` or `J` | Next frame | Disabled at unresolved required interaction only when user chose a guided path |
| `Left Arrow` or `K` | Previous frame | Always available |
| `S` | Open source inspection | Returns focus on close |
| `Shift+S` | Open full Source Reader | Preserves player state |
| `F` | Apply one Faster bundle step | Announces exact changes |
| `D` | Apply one Deeper bundle step | Announces exact changes |
| `N` | Open local note | Never sent to model by default |
| `M` | Open concept map | On-demand overlay or side panel |
| `R` | Replay current state transition | No effect for static frames |
| `T` | Open transcript | Accessible linear equivalent |
| `?` | Shortcut help | Modal, keyboard closable |
| `Esc` | Close current layer | Never exits session without confirmation |

Shortcuts must be remappable and may be disabled.

## 5.12 Screen-reader and static equivalents

Every lesson package must include:

- Ordered frame transcript.
- Heading hierarchy.
- Source links with page, section, and span descriptions.
- Text descriptions for visual state.
- Data-table markup for tables.
- Accessible math representation.
- Code language and line numbers.
- State-change announcements.
- A nonanimated sequence for every animation.
- A text explanation of color or spatial cues.
- An optional “describe current canvas” command.

The transcript is not a degraded backup. It is a first-class player view that preserves frame order, source grounding, checkpoints, and repair.

## 5.13 Faster versus Deeper control

The control is a bundle selector, not a speed slider.

### Faster changes

A single Faster step may:

- Merge adjacent micro-frames that share one governing relation.
- Hide optional examples.
- Reduce integration checks.
- Prefer source visuals without progressive overlays.
- Shorten transition delays.
- Collapse previously mastered definitions.
- Switch Study to Understand, or Understand to Preview, only after explicit confirmation.

It may not:

- Remove qualifiers.
- Prevent rewind.
- Hide source links.
- Skip required accessibility content.
- Reduce fidelity checks.
- Silently change the user's goal.

### Deeper changes

A single Deeper step may:

- Split a frame.
- Add a worked example or nonexample.
- Keep the source anchor persistent longer.
- Add a causal or state diagram.
- Insert a boundary explanation prompt.
- Add a prerequisite repair.
- Switch to a source excerpt or full Source Reader.

### Visible explanation

When the control changes, show a concise receipt:

```text
Deeper 2 applied:
+ split long explanation into 2 frames
+ keep transaction schedule visible
+ add one prediction check
Estimated additional active time: 3–6 minutes
[Undo]
```

The estimate is descriptive, not a learning promise.

## 5.14 UX acceptance tests

A semantic-canvas build is not releasable until:

1. A keyboard-only user completes import, playback, source inspection, checkpoint, repair, and report.
2. A screen-reader user can access the same claims, source links, and controls in transcript mode.
3. Reduced-motion mode contains no automatic spatial transition.
4. Browser zoom to 200 percent preserves operation and content.
5. Every frame can be recovered after navigation, refresh, or process restart.
6. Source inspection returns to the exact frame and focus location.
7. A failed diagram, equation, table, or code extraction visibly reverts to source.
8. Faster and Deeper changes are enumerated, reversible, and logged.
9. There is no path that turns Preview completion into a mastery statement.
10. No test requires color recognition or timed response.


# 6. Content and semantic data model

## 6.1 Design principles

The schema is not an internal serialization convenience. It is the main safety boundary between source, AI proposals, review, rendering, learner behavior, and research analysis.

Core rules:

1. **Immutable source layer:** Imported bytes, normalized text, page images, and source coordinates never change in place.
2. **Stable identifiers:** Every document, element, span, claim, concept, relation, frame, item, model run, and policy decision has a stable ID.
3. **Clause-level grounding:** A generated frame cannot cite only a section or page when its clauses depend on different evidence.
4. **Origin is explicit:** Source fact, paraphrase, inference, explanation, analogy, visual, and outside enrichment are never collapsed into one “generated content” category.
5. **Confidence is typed:** Extraction confidence, model confidence, grounding confidence, reviewer confidence, and learner-state uncertainty are different fields.
6. **State transitions are append-only:** Approval or rejection produces a new record, preserving the prior proposal.
7. **No implicit inheritance:** A frame does not inherit support merely because it belongs to a concept that has supported claims.
8. **Fail closed:** Missing support, invalid spans, unsafe diagrams, or unknown element fidelity lead to Source mode or draft status.

## 6.2 Required enums

```python
class SourceKind(str, Enum):
    pasted_text = "pasted_text"
    markdown = "markdown"
    text_file = "text_file"
    born_digital_pdf = "born_digital_pdf"

class ElementKind(str, Enum):
    heading = "heading"
    paragraph = "paragraph"
    list = "list"
    code_block = "code_block"
    equation = "equation"
    table = "table"
    figure = "figure"
    caption = "caption"
    footnote = "footnote"
    page_header = "page_header"
    page_footer = "page_footer"
    unknown = "unknown"

class ContentOrigin(str, Enum):
    source_verbatim = "source_verbatim"
    source_fact = "source_fact"
    faithful_paraphrase = "faithful_paraphrase"
    prism_inference = "prism_inference"
    generated_explanation = "generated_explanation"
    analogy = "analogy"
    generated_visual = "generated_visual"
    outside_enrichment = "outside_enrichment"

class SupportStatus(str, Enum):
    not_checked = "not_checked"
    supported = "supported"
    partially_supported = "partially_supported"
    unsupported = "unsupported"
    contradicted = "contradicted"
    unanswerable = "unanswerable"
    requires_human_review = "requires_human_review"

class PublicationStatus(str, Enum):
    draft = "draft"
    schema_valid = "schema_valid"
    span_valid = "span_valid"
    grounded = "grounded"
    reviewed = "reviewed"
    approved = "approved"
    rejected = "rejected"
    source_fallback = "source_fallback"
    superseded = "superseded"

class EvidenceLabel(str, Enum):
    established = "established"
    promising = "promising"
    experimental = "experimental"
    speculative = "speculative"

class FrameKind(str, Enum):
    proposition = "proposition"
    definition = "definition"
    contrast = "contrast"
    causal_relation = "causal_relation"
    sequence = "sequence"
    example = "example"
    nonexample = "nonexample"
    equation = "equation"
    code_trace = "code_trace"
    diagram_focus = "diagram_focus"
    table_comparison = "table_comparison"
    integration_summary = "integration_summary"
    retrieval_prompt = "retrieval_prompt"
    repair = "repair"
    source_excerpt = "source_excerpt"

class RepresentationKind(str, Enum):
    text = "text"
    source_region = "source_region"
    annotated_source_region = "annotated_source_region"
    typed_diagram = "typed_diagram"
    state_sequence = "state_sequence"
    code_trace = "code_trace"
    equation_walkthrough = "equation_walkthrough"
    table_lens = "table_lens"
    static_transcript = "static_transcript"

class ReviewDecision(str, Enum):
    pass_ = "pass"
    warn = "warn"
    fail = "fail"
    abstain = "abstain"
```

## 6.3 Source records

### 6.3.1 `SourceDocument`

```python
class SourceDocument(BaseModel):
    id: UUID
    content_hash_sha256: str
    kind: SourceKind
    title: str | None
    authors: list[str]
    language: Literal["en"]
    original_filename: str | None
    local_object_path: str
    imported_at: datetime
    page_count: int | None
    rights_basis: Literal[
        "user_owned_copy",
        "open_license",
        "public_domain",
        "institutional_access",
        "user_asserted_other",
        "unknown"
    ]
    license_uri: str | None
    processing_permissions: list["ProcessingPermission"]
    parser_run_id: UUID | None
    deleted_at: datetime | None
```

**Contracts**

- `content_hash_sha256` identifies exact bytes.
- Imported source bytes are read-only.
- `rights_basis` is user-supplied metadata, not a legal determination.
- Deleting a document must cascade to derived local artifacts unless the learner explicitly exports an independent, source-free research record.

### 6.3.2 `SourceElement`

```python
class SourceElement(BaseModel):
    id: UUID
    document_id: UUID
    kind: ElementKind
    ordinal: int
    parent_element_id: UUID | None
    page_start: int | None
    page_end: int | None
    normalized_text: str | None
    raw_text: str | None
    language: str
    bounding_regions: list["BoundingRegion"]
    asset_object_hash: str | None
    caption_element_ids: list[UUID]
    cross_reference_labels: list[str]
    extraction_confidence: float
    extraction_status: Literal[
        "accepted",
        "warning",
        "failed",
        "manual"
    ]
    parser_metadata: dict[str, Any]
```

**Contracts**

- Confidence is in `[0, 1]` and means parser confidence, not correctness.
- Figures, tables, equations, and code blocks require a rendered source-region fallback.
- `failed` elements are visible in the reader but unavailable for semantic transformation.
- Headers and footers are retained but excluded from claim extraction by default.

### 6.3.3 `SourceSpan`

```python
class SourceSpan(BaseModel):
    id: UUID
    document_id: UUID
    element_id: UUID
    start_char: int | None
    end_char: int | None
    page: int | None
    bbox: tuple[float, float, float, float] | None
    text_snapshot: str | None
    region_hash: str | None
    locator_version: str
```

**Validation**

- Character spans must be inside `normalized_text`.
- Region coordinates must be inside the page coordinate system.
- `text_snapshot` must match normalized source after documented whitespace normalization.
- Region hash catches changed or incorrectly remapped PDF renderings.
- Span resolution is deterministic and unit-tested.

## 6.4 Canonical claims

A canonical claim is the smallest proposition PRISM is willing to reason over, cite, relate, or place in a frame.

```python
class CanonicalClaim(BaseModel):
    id: UUID
    lesson_scope_id: UUID
    text: str
    clauses: list["ClaimClause"]
    origin: ContentOrigin
    claim_kind: Literal[
        "definition",
        "property",
        "condition",
        "cause",
        "effect",
        "comparison",
        "procedure_step",
        "constraint",
        "exception",
        "example_fact",
        "interpretation"
    ]
    qualifiers: list[str]
    polarity: Literal["affirmed", "negated", "conditional"]
    source_span_ids: list[UUID]
    derived_from_claim_ids: list[UUID]
    external_source_ids: list[UUID]
    support_status: SupportStatus
    extraction_confidence: float | None
    grounding_confidence: float | None
    publication_status: PublicationStatus
    compiler_run_id: UUID
```

```python
class ClaimClause(BaseModel):
    id: UUID
    text: str
    source_span_ids: list[UUID]
    support_status: SupportStatus
    omitted_qualifier_risk: Literal["none", "low", "medium", "high"]
```

**Publication rules**

- `source_fact` requires at least one valid source span for every clause.
- `faithful_paraphrase` requires bidirectional entailment or human review: source supports paraphrase, and paraphrase does not broaden source scope.
- `prism_inference` must list premises as claim IDs and be visibly labeled.
- `generated_explanation` must specify whether it restates source relations or introduces an explanatory bridge.
- `analogy` is never published as source fact and must identify where the mapping breaks.
- `outside_enrichment` requires an external source record and explicit learner permission if retrieved through cloud tools.
- A partially supported claim cannot appear in a normal frame. It may appear in a review queue with highlighted unsupported clauses.

## 6.5 Concepts, relations, and prerequisites

```python
class Concept(BaseModel):
    id: UUID
    canonical_name: str
    display_name: str
    aliases: list[str]
    definition_claim_ids: list[UUID]
    governing_claim_ids: list[UUID]
    boundary_claim_ids: list[UUID]
    source_element_ids: list[UUID]
    estimated_complexity: Literal["low", "medium", "high"]
    status: PublicationStatus
```

```python
class ConceptRelation(BaseModel):
    id: UUID
    source_concept_id: UUID
    target_concept_id: UUID
    relation_type: Literal[
        "is_a",
        "part_of",
        "causes",
        "prevents",
        "enables",
        "contrasts_with",
        "depends_on",
        "precedes",
        "implements",
        "violates",
        "preserves",
        "measured_by",
        "example_of"
    ]
    directionality: Literal["directed", "symmetric"]
    claim_ids: list[UUID]
    source_span_ids: list[UUID]
    origin: ContentOrigin
    support_status: SupportStatus
    status: PublicationStatus
```

```python
class PrerequisiteEdge(BaseModel):
    id: UUID
    prerequisite_concept_id: UUID
    target_concept_id: UUID
    strength: Literal["required", "helpful", "optional"]
    rationale_claim_ids: list[UUID]
    origin: ContentOrigin
    evidence: Literal["source_explicit", "compiler_inference", "human_authored"]
    status: PublicationStatus
```

**Important boundary**

A concept graph is not automatically a teaching graph. The teaching graph adds:

- Learner goal.
- Order constraints.
- Representation candidates.
- Checkpoints.
- Repair paths.
- Known misconceptions.
- Source-fidelity gates.

## 6.6 Semantic frames

```python
class SemanticFrame(BaseModel):
    id: UUID
    lesson_package_id: UUID
    concept_id: UUID
    sequence_index: int
    frame_kind: FrameKind
    title: str | None
    body_blocks: list["FrameBlock"]
    claim_ids: list[UUID]
    primary_relation_ids: list[UUID]
    representation_candidate_ids: list[UUID]
    selected_representation_id: UUID
    anchor_binding: "AnchorBinding | None"
    prior_frame_context: Literal["visible", "collapsed", "none"]
    expected_active_seconds: tuple[int, int] | None
    interaction: "FrameInteraction | None"
    accessibility: "AccessibilityPayload"
    provenance_record_id: UUID
    evidence_label: EvidenceLabel
    publication_status: PublicationStatus
```

```python
class FrameBlock(BaseModel):
    kind: Literal[
        "heading", "paragraph", "callout", "math",
        "code", "list", "table", "diagram", "source_quote"
    ]
    text: str | None
    claim_ids: list[UUID]
    origin: ContentOrigin
    source_span_ids: list[UUID]
    generated_asset_id: UUID | None
```

**Contracts**

- The frame's visible factual content must be covered by `claim_ids`.
- Every block declares origin and support.
- Only `approved` or `source_fallback` frames enter a published package.
- A frame has one primary instructional purpose.
- A frame may include several claims only when they form one coherent relation.
- `expected_active_seconds` is a UX estimate, not a mastery estimate.
- Frames are immutable inside a versioned package.

## 6.7 Representation candidates

```python
class RepresentationCandidate(BaseModel):
    id: UUID
    frame_id: UUID
    kind: RepresentationKind
    pedagogical_intent: Literal[
        "define", "compare", "show_causality", "show_sequence",
        "show_state", "show_quantity", "show_topology",
        "trace_execution", "inspect_source", "retrieve", "repair"
    ]
    clarifies_relation_ids: list[UUID]
    source_element_ids: list[UUID]
    asset_spec_id: UUID | None
    generated_by_run_id: UUID | None
    source_fidelity_risk: Literal["low", "medium", "high"]
    accessibility_status: ReviewDecision
    render_safety_status: ReviewDecision
    answerability_status: ReviewDecision
    selection_reason: str
    rejection_reason: str | None
    status: PublicationStatus
```

The selection reason must be inspectable. “Model chose diagram” is invalid. A valid reason is:

> “The source describes a four-step state transition whose prior state must remain visible; a user-stepped state sequence was selected over prose because it preserves trigger, state, and consequence.”

## 6.8 Safe source-asset binding

```python
class AnchorBinding(BaseModel):
    source_element_id: UUID
    source_region_ids: list[UUID]
    binding_type: Literal[
        "exact_source",
        "cropped_source",
        "source_with_overlay",
        "typed_reconstruction",
        "text_marker"
    ]
    crop_preserves_caption: bool
    overlay_spec_id: UUID | None
    transformation_notes: list[str]
    requires_source_side_by_side: bool
    alt_text: str
    long_description: str | None
    status: PublicationStatus
```

Rules by element:

- **Figure:** Preserve image aspect ratio, caption, labels, and source location. Overlays may highlight but not erase.
- **Table:** Preserve header hierarchy, units, footnotes, and empty-cell meaning. A table lens references exact cells.
- **Equation:** Preserve exact source expression and symbol definitions. Any rewritten equation is a separate generated object.
- **Code:** Preserve text, indentation, language, and line numbers. Generated traces reference execution fixture IDs.
- **Diagram:** A typed reconstruction is visibly labeled and remains adjacent to the original source region when fidelity risk is medium or high.
- **Cross-page item:** Bind all component regions and display that the object is composite.
- **Low-confidence extraction:** Use source-region rendering only.

## 6.9 Typed diagram grammar

The default renderer accepts a constrained JSON grammar and produces sanitized SVG. It does not accept arbitrary SVG, HTML, JavaScript, CSS, or model-generated image bytes.

```python
class DiagramSpec(BaseModel):
    schema_version: Literal["1.0"]
    id: UUID
    diagram_type: Literal[
        "causal_graph",
        "state_machine",
        "sequence_lanes",
        "dependency_graph",
        "comparison_matrix",
        "timeline",
        "set_relation"
    ]
    title: str
    nodes: list["DiagramNode"]
    edges: list["DiagramEdge"]
    groups: list["DiagramGroup"]
    states: list["DiagramState"]
    layout: Literal[
        "left_to_right",
        "top_to_bottom",
        "lanes",
        "grid",
        "manual_normalized"
    ]
    legend: list["LegendItem"]
    alt_text: str
    long_description: str
    source_claim_ids: list[UUID]
    source_element_ids: list[UUID]
```

```python
class DiagramNode(BaseModel):
    id: str
    label: str
    role: Literal[
        "entity", "state", "event", "condition",
        "process", "value", "concept"
    ]
    claim_ids: list[UUID]
    source_span_ids: list[UUID]
    group_id: str | None
    shape: Literal["rectangle", "rounded_rectangle", "circle", "diamond"]
    normalized_position: tuple[float, float] | None

class DiagramEdge(BaseModel):
    id: str
    source_node_id: str
    target_node_id: str
    label: str | None
    relation_id: UUID
    directed: bool
    style: Literal["solid", "dashed", "double"]
```

Renderer constraints:

- Maximum 20 nodes and 30 edges in v0; default active view maximum is lower.
- Text only from validated fields.
- No external URLs.
- No scripts, filters, embedded fonts, foreign objects, or arbitrary path data.
- Fixed shape vocabulary.
- Deterministic layout seed.
- WCAG-compatible contrast tokens.
- Noncolor edge labels.
- Generated long description required.
- Every node and edge maps to claims or relations.
- Invalid diagram falls back to a textual relation list.

## 6.10 Quality checks

```python
class QualityCheck(BaseModel):
    id: UUID
    target_type: Literal[
        "element", "claim", "relation", "frame",
        "diagram", "practice_item", "lesson_package"
    ]
    target_id: UUID
    check_type: Literal[
        "schema",
        "span_integrity",
        "source_entailment",
        "scope_preservation",
        "contradiction",
        "omitted_qualification",
        "cross_reference",
        "answerability",
        "rubric_coverage",
        "diagram_grounding",
        "render_safety",
        "accessibility",
        "copyright_boundary",
        "human_review"
    ]
    implementation: Literal["deterministic", "model", "human"]
    decision: ReviewDecision
    score: float | None
    threshold: float | None
    findings: list[str]
    evidence_span_ids: list[UUID]
    run_id: UUID
    created_at: datetime
```

No aggregate quality score may hide a failed critical check. Publication requires all critical checks to pass:

- Schema.
- Span integrity.
- No contradiction.
- Scope preservation.
- Accessibility.
- Render safety.
- Answerability for prompts.
- Human review for golden fixtures and high-risk transformations.

## 6.11 Practice, rubric, and repair records

```python
class PracticeItem(BaseModel):
    id: UUID
    concept_id: UUID
    item_type: Literal[
        "explanation",
        "prediction",
        "new_case",
        "contrast",
        "state_trace",
        "equation_step",
        "code_state"
    ]
    prompt: str
    claim_ids: list[UUID]
    source_span_ids: list[UUID]
    rubric: "ScoringRubric"
    generated_example_status: Literal[
        "source_provided", "validated_generated", "human_authored"
    ]
    answerability_status: ReviewDecision
    leakage_check: ReviewDecision
    status: PublicationStatus

class ScoringRubric(BaseModel):
    dimensions: list["RubricDimension"]
    maximum_score: float
    minimum_evidence_for_success: float
    unacceptable_claims: list[str]
    scoring_method: Literal[
        "human",
        "deterministic",
        "model_assisted_human",
        "model_with_audit"
    ]
```

Repair selection must name the missing or incorrect rubric dimension. It cannot be triggered by a low embedding similarity alone.

## 6.12 Learner events

```python
class LearnerEvent(BaseModel):
    id: UUID
    session_id: UUID
    timestamp_monotonic_ms: int
    wall_clock_utc: datetime
    event_type: Literal[
        "session_start", "session_end",
        "frame_enter", "frame_leave",
        "next", "back", "pause", "resume",
        "source_open", "source_close",
        "rewind", "replay",
        "depth_change", "pace_change",
        "note_open", "note_save",
        "browser_blur", "browser_focus",
        "prompt_start", "prompt_submit",
        "confidence_submit", "not_ready",
        "repair_offer", "repair_accept", "repair_skip",
        "representation_switch",
        "accessibility_setting_change",
        "quality_report"
    ]
    lesson_package_id: UUID
    concept_id: UUID | None
    frame_id: UUID | None
    payload: dict[str, Any]
    policy_version: str
    local_only: bool = True
```

Rules:

- Do not log keystroke content except submitted learner answers and explicitly saved notes.
- Notes are not included in AI payloads unless separately authorized.
- Browser blur means only “not focused,” not distracted.
- Active-time computation remains derivable and versioned.
- Raw events remain local by default.
- Research export is opt-in, minimized, de-identified where possible, and separable from source text.

## 6.13 Learner concept state

```python
class LearnerConceptState(BaseModel):
    learner_profile_id: UUID
    concept_id: UUID
    source_scope_id: UUID
    goal_mode: Literal["preview", "understand", "study"]
    prior_knowledge_evidence: list["EvidenceRecord"]
    immediate_evidence: list["EvidenceRecord"]
    delayed_evidence: list["EvidenceRecord"]
    confidence_calibration: "CalibrationState | None"
    recommended_supports: list[str]
    disabled_supports: list[str]
    state_label: Literal[
        "unseen",
        "oriented",
        "building",
        "demonstrated_immediate",
        "needs_repair",
        "durability_unmeasured",
        "demonstrated_24h",
        "demonstrated_7d",
        "uncertain"
    ]
    uncertainty_reason: list[str]
    last_updated_at: datetime
```

This record intentionally avoids a single mastery probability in v0.

## 6.14 Lesson package and provenance

```python
class LessonPackage(BaseModel):
    id: UUID
    schema_version: str
    package_version: str
    source_document_id: UUID
    source_scope_element_ids: list[UUID]
    goal_modes_supported: list[Literal["preview", "understand", "study"]]
    concept_ids: list[UUID]
    relation_ids: list[UUID]
    frame_ids: list[UUID]
    practice_item_ids: list[UUID]
    repair_path_ids: list[UUID]
    asset_ids: list[UUID]
    fallback_reader_manifest_id: UUID
    accessibility_manifest_id: UUID
    provenance_bundle_id: UUID
    quality_summary_id: UUID
    published_at: datetime | None
    status: PublicationStatus
```

```python
class ProvenanceRecord(BaseModel):
    id: UUID
    entity_type: str
    entity_id: UUID
    activity_type: str
    parent_entity_ids: list[UUID]
    source_document_hashes: list[str]
    source_span_ids: list[UUID]
    software_component: str
    software_version: str
    schema_version: str
    model_provider: str | None
    model_identifier: str | None
    model_revision: str | None
    decoding_parameters: dict[str, Any] | None
    prompt_template_hash: str | None
    prompt_instance_hash: str | None
    local_or_cloud: Literal["local", "approved_cloud", "deterministic"]
    permission_record_id: UUID | None
    created_at: datetime
```

## 6.15 State transitions

### Claim lifecycle

```text
draft
  -> schema_valid
  -> span_valid
  -> grounded
  -> reviewed
  -> approved
```

Any stage may transition to:

```text
rejected
source_fallback
superseded
```

An approved item can never be edited in place. A correction creates a new version and marks the old one superseded.

### Lesson lifecycle

```text
imported
  -> extracted
  -> source_inspected
  -> compiling
  -> needs_review
  -> ready_for_owner_pilot
  -> research_locked
  -> archived
```

“Research locked” freezes package, assessments, policy, and instrumentation for a study.

## 6.16 Confidence rules

1. Display no generated numeric confidence to the learner unless it has a calibrated interpretation.
2. Do not average extraction confidence with grounding confidence.
3. A model's self-reported confidence is metadata, never publication evidence.
4. `grounding_confidence >= threshold` cannot override a contradiction or scope failure.
5. High-risk content requires human review even when model scores are high:
   - Equations.
   - Code semantics.
   - Distributed-system safety and liveness claims.
   - Legal or safety content.
   - Novel generated diagrams.
6. Low confidence triggers abstention, smaller source scope, or Source mode.

## 6.17 Example object: transaction isolation

```json
{
  "concept": {
    "id": "concept:write-skew",
    "canonical_name": "write_skew_under_snapshot_isolation",
    "display_name": "Write skew under snapshot isolation",
    "definition_claim_ids": ["claim:ws-1"],
    "governing_claim_ids": ["claim:ws-2", "claim:ws-3"],
    "boundary_claim_ids": ["claim:ws-4"],
    "status": "approved"
  },
  "claims": [
    {
      "id": "claim:ws-2",
      "text": "Two transactions can read the same snapshot and update disjoint items.",
      "origin": "faithful_paraphrase",
      "claim_kind": "condition",
      "qualifiers": ["in the illustrated snapshot-isolation schedule"],
      "source_span_ids": ["span:p786:a", "span:p787:b"],
      "support_status": "supported",
      "publication_status": "approved"
    },
    {
      "id": "claim:ws-3",
      "text": "Because the writes are disjoint, both may commit while their combined result violates a cross-item invariant.",
      "origin": "faithful_paraphrase",
      "claim_kind": "effect",
      "qualifiers": ["assuming conflict detection checks direct write-write conflict"],
      "source_span_ids": ["span:p787:b", "span:p787:c"],
      "support_status": "supported",
      "publication_status": "approved"
    }
  ],
  "relation": {
    "id": "relation:ws-causal",
    "source_concept_id": "concept:disjoint-writes",
    "target_concept_id": "concept:write-skew",
    "relation_type": "enables",
    "claim_ids": ["claim:ws-2", "claim:ws-3"],
    "origin": "source_fact",
    "support_status": "supported",
    "status": "approved"
  },
  "frame": {
    "id": "frame:ws-4",
    "sequence_index": 4,
    "frame_kind": "causal_relation",
    "claim_ids": ["claim:ws-2", "claim:ws-3"],
    "primary_relation_ids": ["relation:ws-causal"],
    "selected_representation_id": "rep:ws-lanes",
    "anchor_binding": {
      "source_element_id": "figure:schedule-17-12",
      "binding_type": "source_with_overlay",
      "requires_source_side_by_side": true,
      "status": "approved"
    },
    "evidence_label": "experimental",
    "publication_status": "approved"
  },
  "retrieval_item": {
    "id": "item:ws-explain-1",
    "item_type": "explanation",
    "prompt": "Why can both transactions commit even though the final state violates the invariant?",
    "claim_ids": ["claim:ws-2", "claim:ws-3"],
    "rubric": {
      "dimensions": [
        {"name": "common_snapshot", "points": 1},
        {"name": "disjoint_writes", "points": 1},
        {"name": "joint_invariant_violation", "points": 1}
      ],
      "maximum_score": 3,
      "minimum_evidence_for_success": 2.5
    },
    "status": "approved"
  }
}
```

## 6.18 Example object: TCP congestion control

```json
{
  "concept": {
    "id": "concept:slow-start-threshold",
    "canonical_name": "ssthresh_transition",
    "display_name": "Transition from slow start to congestion avoidance",
    "governing_claim_ids": ["claim:tcp-11", "claim:tcp-12"],
    "status": "approved"
  },
  "claims": [
    {
      "id": "claim:tcp-11",
      "text": "During slow start, the congestion window grows rapidly as acknowledgments arrive.",
      "origin": "faithful_paraphrase",
      "claim_kind": "procedure_step",
      "qualifiers": ["for the algorithm and notation used in this source section"],
      "source_span_ids": ["span:tcp:p34:a"],
      "support_status": "supported",
      "publication_status": "approved"
    },
    {
      "id": "claim:tcp-12",
      "text": "When the congestion window reaches the slow-start threshold, the sender enters congestion avoidance and growth becomes approximately linear per round-trip time.",
      "origin": "faithful_paraphrase",
      "claim_kind": "condition",
      "qualifiers": ["implementation details and byte-counting rules can differ"],
      "source_span_ids": ["span:tcp:p34:b", "span:tcp:p35:a"],
      "support_status": "supported",
      "publication_status": "approved"
    }
  ],
  "frame": {
    "id": "frame:tcp-7",
    "frame_kind": "sequence",
    "claim_ids": ["claim:tcp-11", "claim:tcp-12"],
    "selected_representation_id": "rep:cwnd-state-sequence",
    "anchor_binding": {
      "source_element_id": "figure:cwnd-curve",
      "binding_type": "source_with_overlay",
      "requires_source_side_by_side": true,
      "alt_text": "Congestion window growth is steep before the threshold and shallower after it.",
      "status": "approved"
    },
    "publication_status": "approved"
  },
  "diagram_spec": {
    "schema_version": "1.0",
    "diagram_type": "state_machine",
    "title": "Window-growth state transition",
    "nodes": [
      {"id": "slow", "label": "Slow start", "role": "state", "claim_ids": ["claim:tcp-11"]},
      {"id": "threshold", "label": "cwnd reaches ssthresh", "role": "condition", "claim_ids": ["claim:tcp-12"]},
      {"id": "avoid", "label": "Congestion avoidance", "role": "state", "claim_ids": ["claim:tcp-12"]}
    ],
    "edges": [
      {
        "id": "e1",
        "source_node_id": "slow",
        "target_node_id": "avoid",
        "label": "threshold condition",
        "relation_id": "relation:tcp-transition",
        "directed": true,
        "style": "solid"
      }
    ],
    "alt_text": "The sender transitions from slow start to congestion avoidance when the congestion window reaches the threshold.",
    "source_claim_ids": ["claim:tcp-11", "claim:tcp-12"]
  },
  "retrieval_item": {
    "id": "item:tcp-predict-2",
    "item_type": "prediction",
    "prompt": "The congestion window has just reached ssthresh without a loss event. What growth regime should appear next, and how should its slope differ?",
    "claim_ids": ["claim:tcp-12"],
    "status": "approved"
  }
}
```

## 6.19 Storage mapping

Use the requested stack:

- **SQLite WAL:** metadata, normalized entities, event log, states, versions, permissions, review records, and package manifests.
- **Content-addressed local files:** original documents, page renders, extracted assets, immutable package JSON, diagram renders, exports, and cached model payloads when permitted.
- **Pydantic:** canonical backend contracts and JSON Schema emission.
- **TypeScript:** generated types from versioned JSON Schema, plus runtime validation at package load.
- **FastAPI:** local loopback API with explicit endpoints for import, compile, review, package, play-state, telemetry, export, and delete.

SQLite WAL is appropriate for a single-user local application. Do not expose the database file through the frontend or support multi-device synchronization in v0.

# 7. End-to-end AI, ML, and document pipeline

## 7.1 Architecture: a bounded semantic compiler

PRISM should compile one selected learning unit at a time. A whole textbook may be imported, indexed, searched, and structurally mapped, but only the chosen 800 to 2,000 word unit enters deep transformation.

The compiler is a directed acyclic job graph with:

- Immutable inputs.
- Content-hash cache keys.
- Versioned pass contracts.
- Deterministic retries.
- Bounded model context.
- Per-pass permissions.
- Explicit abstention.
- Human-review queues.
- Reproducible lesson-package outputs.

A model never receives the entire library by default. It receives the minimum source scope required for a declared pass.

## 7.2 Pipeline overview

```text
source bytes
  -> ingestion and permission record
  -> structural extraction
  -> element classification and source-region binding
  -> selected-unit segmentation
  -> atomic claim proposals
  -> concept and relation proposals
  -> prerequisite proposals
  -> frame plan
  -> representation candidates
  -> practice and repair candidates
  -> layered fidelity and accessibility review
  -> immutable lesson package
  -> deterministic player
  -> local telemetry
  -> immediate and delayed evaluation
```

## 7.3 Pass-by-pass specification

| Pass | Input | Output | Responsibility | Main fidelity risk | Validation | Fallback | Location |
|---|---|---|---|---|---|---|---|
| 0. Permission and import | User file or pasted text | Source document, hash, rights metadata, processing permission | Deterministic | Sending more content than authorized; losing exact bytes | Hash, MIME and extension checks, payload preview | Local reader only | Local |
| 1. Structural extraction | Source bytes | Pages, text runs, headings, elements, coordinates, rendered regions | Deterministic parser first | Reading order errors; missing symbols; bad crops | Round-trip inspection, text density, coordinate checks, fixture tests | Page image and Source mode | Local |
| 2. Element classification | Extracted runs and regions | Typed paragraphs, tables, equations, code, figures, captions | Rules plus optional model proposal | Misclassifying equation or code as prose; detaching caption | Geometry rules, syntax checks, cross-reference checks, human fixture review | Mark unknown; source-region only | Local preferred; approved cloud optional for ambiguous regions |
| 3. Unit selection and normalization | Structure tree and user selection | Bounded learning unit, neighboring context, glossary candidates | Deterministic | Cutting prerequisite or qualification at boundary | Heading and reference closure checks; user preview | Expand scope or read source | Local |
| 4. Atomic claim extraction | Unit elements and exact spans | Canonical claim candidates with clause spans | Model proposal plus deterministic span binding | Invented claims; broadened scope; merged exceptions | Exact span validity, entailment, contradiction, qualifier checks | Verbatim source claims or manual authoring | Local model or approved cloud |
| 5. Concept and relation mapping | Approved claims | Concept candidates, aliases, typed relations | Model proposal, deterministic ontology constraints | Unsupported relation; collapsing distinct concepts | Every relation maps to claims; cycle and type checks; human benchmark review | Flat claim list | Local model or approved cloud |
| 6. Prerequisite analysis | Claims, concepts, neighboring context | Required, helpful, optional prerequisite edges | Model proposal plus rules | Inventing curriculum requirements; over-scaffolding | Source-explicit tag; rationale; learner precheck; review | No automatic prerequisite | Local or approved cloud |
| 7. Frame planning | Approved graph, goal mode, source assets | Ordered frame plan and source-reader fallback points | Model proposal within deterministic grammar | Fragmenting coherence; excessive frames; removing learner control | Coverage, ordering constraints, boundary and qualification checks | Enhanced static reader | Local or approved cloud |
| 8. Representation proposal | Frame intent, claims, source elements | Candidate text, source binding, typed diagram, trace, table lens | Model proposal; deterministic renderer | Misleading visual; split attention; decorative complexity | Relation-clarification declaration, diagram grounding, accessibility, render safety | Text or exact source region | Local or approved cloud |
| 9. Practice and repair draft | Concepts, misconception library, frame history | Prompt, rubric, answer key, repair path | Model proposal plus deterministic templates | Unanswerable item; leakage; testing trivia; wrong rubric | Answerability from lesson state, independent solution, rubric coverage, human fixture review | No checkpoint or human-authored item | Local or approved cloud |
| 10. Fidelity review | All candidates and source | Check records and publication decisions | Deterministic, independent model, and human | Reviewer model shares generator bias; false pass | Diverse check types, source-first review, threshold and critical-fail logic | Reject candidate; source fallback | Local plus separately approved cloud reviewer if used |
| 11. Lesson packaging | Approved entities and assets | Immutable package, transcript, manifest, provenance | Deterministic | Version mismatch or missing asset | Referential integrity, schema, snapshot tests, package signature | Refuse to publish | Local |
| 12. Playback | Lesson package and user controls | Deterministic state transitions | Deterministic | Hidden adaptation; unrecoverable state | State-machine tests, crash recovery, accessibility automation | Source Reader | Local |
| 13. Telemetry and learner state | Player events and assessment results | Local event log, evidence records, transparent recommendations | Deterministic v0 policy | Treating behavior as mastery; privacy leakage | Rule traces, user explanation, unit tests, deletion/export tests | Fixed user-selected bundle | Local |
| 14. Evaluation | Locked package, assessments, conditions | Fidelity, usability, comprehension, transfer, retention results | Research protocol | Flexible analysis; condition leakage; biased scoring | Preregistration, blinded rubrics, counterbalancing, audit | No product claim | Local collection; opt-in export |

## 7.4 Pass 0: import, rights, and processing permission

### Input

- Pasted text.
- Markdown or text file.
- Clean born-digital PDF.

### Deterministic work

1. Sniff file type instead of trusting extension.
2. Compute SHA-256.
3. Store immutable bytes in content-addressed storage.
4. Create source metadata and user-stated rights basis.
5. Render a permission preview.
6. Record selected section, provider, purpose, retention statement, and cost estimate for any cloud pass.

### Rejections in v0

- Encrypted PDF without user-provided access.
- Scanned PDF with no reliable text layer.
- PDF with widespread text extraction mismatch.
- Unsupported embedded media.
- Source whose selected unit cannot be located reproducibly.

A rejection still permits page-image viewing if lawful and technically safe, but no deep compilation.

## 7.5 Pass 1: structural extraction

Use `pypdfium2` for page rendering, text access, and source coordinates, with explicit fixture testing against the PDF types PRISM supports. Documentation: https://pypdfium2.readthedocs.io/

### Required outputs

- Page dimensions and rotation.
- Text runs and characters where available.
- Heading candidates.
- Paragraph and list blocks.
- Code, equation, table, figure, caption, footnote, header, footer, and unknown region candidates.
- Reading order.
- Page image and region render.
- Cross-page continuation links.
- Text-to-region mapping.

### Deterministic heuristics

- Font-size and weight changes.
- Spatial alignment and indentation.
- Repeated header and footer patterns.
- Monospace and syntax features for code.
- Rule lines and grid alignment for tables.
- Caption patterns and nearby region geometry.
- Equation density, symbol classes, and alignment.
- Heading numbering and table-of-contents matches.
- Column detection.
- Hyphenation normalization with original-text preservation.

### Quality metrics

Per page and per element:

- Text-character recovery ratio.
- Replacement-character rate.
- Reading-order violations.
- Unmatched page text.
- Region overlap.
- Caption association confidence.
- Equation symbol-loss indicators.
- Table header connectivity.
- Code whitespace preservation.
- Manual visual spot-check status.

No page-level aggregate can conceal a failed equation, table, or code block.

## 7.6 Pass 2: element classification and OCR boundary

OCR is out of scope for v0. “Clean PDF” should mean:

- Searchable text layer.
- Stable character mapping.
- Conventional page geometry.
- Usable source coordinates.
- No widespread glyph corruption.
- Tables and figures can at least be preserved as source regions.

If an individual figure contains text that the parser cannot extract, keep the image and caption, mark internal visual text unavailable, and do not ask a model to reconstruct it silently.

A future OCR extension requires a separate benchmark, permission disclosure, language policy, math and code evaluation, and a source-image comparison UI.

Relevant document-intelligence references:

- DocLayNet: https://arxiv.org/abs/2206.01062
- PubTables-1M: https://arxiv.org/abs/2110.00061
- TableBank: https://arxiv.org/abs/1903.01949
- Donut: https://arxiv.org/abs/2111.15664
- LayoutLMv3: https://arxiv.org/abs/2204.08387
- Nougat: https://arxiv.org/abs/2308.13418
- OmniDocBench: https://openaccess.thecvf.com/content/CVPR2025/html/Ouyang_OmniDocBench_Benchmarking_Diverse_PDF_Document_Parsing_with_Comprehensive_Annotations_CVPR_2025_paper.html

These systems and datasets show useful methods, but they do not justify treating arbitrary textbook parsing as solved.

## 7.7 Pass 3: selected-unit closure

The user chooses a section. The compiler adds the minimum neighboring context required for fidelity.

### Closure algorithm

1. Include selected elements.
2. Include heading ancestry.
3. Include definitions referenced by unresolved local terms when found in a bounded neighborhood.
4. Include captions for selected visuals.
5. Include footnotes attached to selected claims.
6. Include prior equation or code definitions referenced in the unit.
7. Include cross-page continuations.
8. Record excluded references that remain unresolved.

If closure exceeds a configured ceiling, ask the user to expand the unit or proceed in Source mode. Do not silently summarize missing prerequisites.

## 7.8 Pass 4: atomic claim extraction

### Prompt contract

The model receives:

- Exact normalized source text.
- Element and span IDs.
- Source order.
- A schema.
- Instructions to abstain when a claim cannot be tied to spans.
- A prohibition against outside knowledge.
- A requirement to preserve conditions, modality, negation, exceptions, and scope.

The model returns candidates, not approved claims.

### Deterministic postprocessing

- Validate JSON.
- Resolve each span.
- Ensure quoted evidence exactly maps.
- Split multi-clause claims.
- Detect unsupported nouns, numbers, proper names, and technical terms.
- Compare modal terms such as “may,” “must,” “usually,” and “only.”
- Reject claims whose evidence lies outside the authorized unit.

### Independent review

A reviewer receives source evidence first, then the candidate claim. It answers:

1. Does every clause follow?
2. Is the scope equal or narrower?
3. Is a qualification missing?
4. Does the paraphrase introduce a causal relation not stated or supported?
5. Does another source span contradict or limit it?
6. Is the claim too broad to be atomic?

The reviewer should be a different model family or a human for benchmark fixtures when practical, but model diversity is not proof of independence.

## 7.9 Pass 5: concept and relation mapping

The concept mapper cannot create facts. It organizes approved claims.

### Allowed operations

- Merge aliases that demonstrably refer to the same concept in the source.
- Propose concept boundaries.
- Type relations using the fixed relation vocabulary.
- Identify governing, boundary, definition, and example claims.
- Propose a compact map.

### Forbidden operations

- Invent missing steps to make the graph look complete.
- Turn chronological adjacency into causation.
- Merge source-level and implementation-level concepts.
- Convert a disputed interpretation into fact.
- Infer prerequisites without a rationale.
- Treat an analogy as an ontological relation.

### Graph checks

- Every edge has at least one support claim.
- Directed relation types have valid direction.
- Symmetric relations are stored once.
- Contradictory edges are surfaced.
- Cycles are allowed only for relation types where they make sense.
- Concepts with no governing claims remain unpublishable.
- Relation labels are human-readable and source-inspectable.

## 7.10 Pass 6: prerequisite analysis

Use three tiers:

- **Required:** Without it, the current relation cannot reasonably be interpreted.
- **Helpful:** It reduces effort or ambiguity.
- **Optional:** It enriches but is not required.

The initial compiler may propose prerequisites from:

- Explicit source references.
- Definitions used but not locally explained.
- Symbol or API dependencies.
- Known benchmark-domain dependency maps curated by a human.
- Learner precheck failures.

Do not infer a stable learner deficit. A prerequisite recommendation is local to this source, concept, goal, and evidence.

## 7.11 Pass 7: semantic frame planning

The planner receives only approved claims, relations, source elements, goal mode, and frame grammar.

### Objective hierarchy

1. Preserve source meaning.
2. Preserve conceptual coherence.
3. Preserve learner control and source access.
4. Select the simplest adequate representation.
5. Minimize unnecessary transitions.
6. Support the selected learning goal.
7. Minimize estimated active time only after the above constraints.

### Planner outputs

- Frame sequence.
- Frame purpose and kind.
- Claim coverage.
- Primary relation.
- Source anchor.
- Representation candidates.
- Boundary points.
- Optional retrieval points.
- Fallback points.
- Required qualification display.
- Preview, Understand, and Study variants.

### Coverage checks

- Every governing claim appears or remains available in source-only content.
- Every exception that changes interpretation appears.
- No concept is introduced before a required prerequisite without a repair path.
- Frame ordering does not reverse causal or procedural dependencies.
- The planner may choose a single source-reading segment rather than frames.

### Complexity checks

Reject or replan when:

- More than three consecutive micro-frames express one relation.
- More than 12 frames are produced per 1,000 source words without a strong reason.
- A frame contains unrelated claims.
- A visual changes on nearly every frame.
- The same source excerpt is paraphrased repeatedly.
- The plan introduces checks more frequently than conceptual boundaries.

## 7.12 Pass 8: representation proposal

The proposal step first asks: **What relation is hard to infer from the source presentation?**

Then it chooses among:

- Exact source text.
- Source excerpt with signaling.
- Exact source visual.
- Source visual with non-destructive overlay.
- Typed causal graph.
- User-stepped state sequence.
- Sequence lanes.
- Code trace.
- Equation walkthrough.
- Table lens.
- Text-only frame.
- No transformation.

### Representation scoring rubric

| Dimension | Question | Critical? |
|---|---|---|
| Fidelity | Does it preserve every relevant entity, relation, condition, and direction? | Yes |
| Need | Does it solve a documented representational problem? | Yes |
| Integration | Can the learner coordinate it with explanatory text without searching? | Yes |
| Stability | Can state and object identity remain stable? | Yes for dynamic views |
| Accessibility | Is there an equivalent nonvisual and nonmotion path? | Yes |
| Density | Is the active view interpretable without excessive selection? | Yes |
| Source recoverability | Can the learner inspect the original in one action? | Yes |
| Added value | Is it better than highlighted source text? | No, but required for selection |
| Render safety | Can deterministic software render it without executable content? | Yes |

If a source visual already satisfies the purpose, do not redraw it.

## 7.13 Pass 9: practice and repair drafting

### Item construction procedure

1. Select a governing relation or common confusion.
2. Define the exact evidence target.
3. Choose an item type aligned with transfer.
4. Draft prompt.
5. Draft rubric before answer wording.
6. Generate or select a new case.
7. Verify the case against the source model.
8. Check that no visible frame directly leaks the answer.
9. Solve independently.
10. Review ambiguity.
11. Attach one repair path per likely missing relation.

### Preferred item types

- Explain why.
- Predict the next state.
- Identify which condition changes an outcome.
- Apply the rule to a minimally changed case.
- Distinguish two related concepts.
- Trace state through code or protocol.
- Complete an equation step and justify it.
- Locate a violated invariant.

### Avoid

- Vocabulary recognition unless the definition itself is the target.
- Trick questions.
- Questions relying on outside facts.
- Generated numerical examples that have not been executed or checked.
- Grading based solely on embeddings.
- Prompts asking for exact source wording.
- Repeated prompts that turn the app into a quiz flow.

## 7.14 Pass 10: layered fidelity review

### Gate A: structural validity

- Schema.
- Referential integrity.
- Enum values.
- Required source IDs.
- No orphaned assets.
- Deterministic parser.

### Gate B: span validity

- Character and region bounds.
- Source hash.
- Quoted text match.
- Correct page.
- Correct element type.

### Gate C: semantic support

- Clause-level entailment.
- No contradiction.
- Scope and modality preserved.
- Qualifications retained.
- Numbers, symbols, and directions checked.
- Cross-reference resolution.

### Gate D: instructional validity

- Frame purpose is coherent.
- Representation clarifies the declared relation.
- Prompt is answerable.
- Rubric matches the source.
- Repair targets the missing relation.
- No preview-to-mastery confusion.

### Gate E: accessibility and rendering

- Keyboard.
- Transcript.
- Alt and long descriptions.
- Math accessibility.
- Data-table structure.
- Reduced motion.
- Contrast.
- Sanitized rendering.

### Gate F: human review

Required for:

- Golden fixtures.
- First lesson in each new domain.
- High-risk parser paths.
- Novel diagram template.
- Equation derivations.
- Code execution explanations.
- Package intended for a study.
- Any item with model disagreement or abstention.

## 7.15 Package construction and reproducibility

The package builder:

1. Freezes all approved IDs and versions.
2. Copies only needed source regions and assets.
3. Produces a transcript.
4. Includes a source-reader manifest.
5. Includes policy defaults and allowed variants.
6. Stores provenance and quality-check bundle.
7. Computes a package hash.
8. Runs schema and snapshot tests.
9. Signs the local manifest or records a trusted local hash.
10. Stores the package immutably.

A research condition references an exact package hash. A changed frame creates a new package and cannot be mixed into an ongoing study without protocol amendment.

## 7.16 Local versus approved-cloud execution

| Capability | Local default | Cloud allowed with permission | Reason |
|---|---|---|---|
| File hashing, storage, page rendering | Yes | No need | Deterministic and privacy-sensitive |
| Text and region extraction | Yes | Only as explicit future fallback | Source bytes should remain local |
| Element heuristics | Yes | Ambiguous-region proposal only | Most classification is local |
| Claim extraction | Local model when adequate | Yes, selected unit only | Quality may require stronger models |
| Concept graph | Local model when adequate | Yes | Bounded structured task |
| Frame planning | Local model when adequate | Yes | Bounded structured task |
| Typed diagram proposal | Local model when adequate | Yes | Must be validated and deterministically rendered |
| Source-fidelity reviewer | Local | Yes, separately disclosed | Independent check may improve quality |
| Practice draft | Local | Yes | Still requires answerability validation |
| Rendering, publishing, policy, telemetry | Yes | No | Must be deterministic and private |
| Learner answers and notes | Yes | Only explicit per-action permission | Highly sensitive |
| Research export | Yes | User-selected destination | Separate opt-in action |

Cloud permission must not be bundled into account setup or implied by opening a source.

## 7.17 Model-provider adapter

```python
class ModelRequest(BaseModel):
    task: Literal[
        "element_classification",
        "claim_extraction",
        "claim_review",
        "concept_mapping",
        "prerequisite_proposal",
        "frame_planning",
        "representation_proposal",
        "practice_draft",
        "answer_scoring"
    ]
    schema_id: str
    source_scope_ids: list[UUID]
    prompt_template_id: str
    prompt_template_hash: str
    payload_hash: str
    max_output_tokens: int
    temperature: float
    seed: int | None
    privacy_class: Literal["source_text", "source_visual", "learner_answer"]
    permission_record_id: UUID | None
```

```python
class ModelResponse(BaseModel):
    provider: str
    model_identifier: str
    model_revision: str | None
    request_id: str | None
    output_text_hash: str
    parsed_object_ids: list[UUID]
    token_usage: dict[str, int] | None
    latency_ms: int
    estimated_cost_usd: float | None
    finish_reason: str | None
    schema_valid: bool
    retries: int
    provider_metadata: dict[str, Any]
```

The adapter must support:

- Local and cloud implementations.
- Timeouts and cancellation.
- Cost ceilings.
- Retry limits.
- Schema validation.
- No silent provider fallback.
- Redacted logs.
- Provider-specific retention disclosure.
- Deterministic replay when API behavior permits.
- Stored raw response only under local retention policy.

## 7.18 Model-selection criteria

Do not hard-code a permanent “best model.” Maintain a task-specific evaluation registry.

### Required dimensions

| Dimension | Measurement |
|---|---|
| Source support precision | Fraction of published clauses fully supported by cited spans |
| Unsupported-claim rate | Critical, measured per clause |
| Scope-preservation rate | Human or high-quality audited review |
| Structured-output reliability | Valid first-pass outputs and repair rate against production schema |
| Abstention quality | Whether uncertain cases are declined rather than invented |
| Long-context robustness | Performance across unit sizes and cross-page references |
| Visual grounding | Correct region, caption, table cell, equation, and figure association |
| Technical reasoning | Domain-specific fixture performance |
| Prompt sensitivity | Variance across paraphrased instructions |
| Reproducibility | Variance across repeated calls and provider revisions |
| Latency | Median and p95 per pass |
| Cost | Cost per accepted lesson unit, not cost per raw call |
| Privacy | Retention, training use, region, logging, and enterprise controls |
| Version stability | Ability to pin or identify revisions |
| Local feasibility | RAM, VRAM, latency, and quality on target hardware |

### Selection rule

Choose the lowest-cost, lowest-exposure model that clears the pass-specific fidelity threshold. A model that is excellent at claim extraction may not be selected for visual grounding or answer scoring.

### Regression policy

Re-evaluate when:

- Provider changes model revision.
- Prompt or schema changes.
- New source type enters scope.
- A critical fidelity incident occurs.
- Cost or latency changes materially.
- A study package is about to be locked.

## 7.19 Cost control

- Compile only selected units.
- Cache by source hash, pass version, prompt hash, schema, provider, and model revision.
- Use deterministic local prefilters.
- Batch independent small claims only when source boundaries remain explicit.
- Stop the pipeline immediately after a critical failure.
- Run expensive visual review only on visual elements.
- Show projected cost before permission.
- Set per-source and monthly hard caps.
- Never reduce fidelity checks to save cost without an explicit user-visible mode.

Track **cost per approved frame**, **cost per approved learning unit**, and **cost per fidelity incident**, not only token cost.

## 7.20 Failure containment

| Failure | Detection | Containment |
|---|---|---|
| Garbled text extraction | Character and visual fixture mismatch | Page image and Source mode |
| Wrong reading order | Layout checks and human inspection | Reorder manually or reject unit |
| Unsupported claim | Clause support gate | Reject claim and dependent frames |
| Missing qualification | Scope and omission check | Add qualification or source excerpt |
| Invented graph edge | Edge without supported claim | Remove edge |
| Misleading diagram | Grounding or human failure | Text/source fallback |
| Unanswerable prompt | Independent solution fails | Remove checkpoint |
| Model outage | Timeout | Resume from cached pass or local-only path |
| Cloud permission mismatch | Permission hash mismatch | Block request |
| Package corruption | Manifest hash or referential failure | Refuse load; restore prior version |
| Crash during study | State checkpoint | Resume exact frame locally |
| Policy misfire | Rule trace and user override | Undo and use fixed bundle |
| Accessibility failure | Automated and manual gate | Block release |

## 7.21 Evaluation datasets and golden fixtures

PRISM needs two layers: public benchmarks for component sanity and purpose-built golden fixtures for product validity.

### Public component datasets

| Capability | Candidate dataset | Use | Limitation |
|---|---|---|---|
| Page layout | DocLayNet | Element detection and layout diversity | Does not test PRISM teaching fidelity |
| Tables | PubTables-1M, TableBank | Structure and cell association | Technical-textbook tables remain diverse |
| Document VQA | DocVQA | Visual document grounding | Answering differs from faithful lesson compilation |
| Charts | ChartQA | Chart reasoning and data extraction | Not a full technical diagram benchmark |
| Math conversion | Nougat-related corpora | Equation and scholarly-document conversion | Generated markup can still be wrong |
| Diverse PDF parsing | OmniDocBench | End-to-end parsing comparison | Benchmark scores do not guarantee source-specific safety |
| Long multimodal documents | CiteVQA, DocScope, XL-DocBench preprints | Evidence-region and long-document stress | New preprints; methods and results may change |

Links:
- DocVQA: https://arxiv.org/abs/2007.00398
- ChartQA: https://aclanthology.org/2022.findings-acl.177/
- CiteVQA, preprint: https://arxiv.org/abs/2605.12882
- DocScope, preprint: https://arxiv.org/abs/2605.08888
- XL-DocBench, preprint: https://arxiv.org/abs/2608.00036

### PRISM golden fixture suite

Create a version-controlled fixture for each type:

1. **Prose:** 1,200-word isolation-level section with definitions, exceptions, and a misleading near-synonym.
2. **Diagram:** Transaction schedule with two lanes, arrows, caption, and cross-page explanation.
3. **Table:** Isolation-level comparison with footnotes and “implementation-dependent” caveat.
4. **Equation:** TCP window-growth equation with symbols defined in nearby prose.
5. **Code:** Python concurrency or lock example with indentation and output.
6. **Mixed layout:** Two-column textbook spread with figure, caption, equation, footnote, and cross-reference.
7. **Distributed systems:** Raft or consensus explanation separating terms, log replication, safety, liveness, and failure cases.
8. **Adversarial prose:** Negation, nested conditions, “may” versus “must,” and exceptions.
9. **Extraction failure:** Deliberately malformed or unsupported page that must fail closed.
10. **Accessibility:** Same lesson exercised through transcript, keyboard, zoom, and reduced motion.

For each fixture, store:

- Exact source bytes or legally redistributable synthetic source.
- Human-reviewed source elements.
- Gold spans.
- Atomic claims and qualifications.
- Concept and relation graph.
- Accepted and rejected frame examples.
- Diagram specifications.
- Practice rubrics.
- Known misconceptions.
- Expected fallback behavior.
- Accessibility expectations.

Use openly licensed or synthetic fixtures in the repository. Keep copyrighted personal textbook fixtures outside version control.

## 7.22 Pipeline acceptance thresholds for an owner pilot

These are conservative initial gates and should be revised with evidence:

- 100 percent valid source references.
- 100 percent critical schema and render-safety checks passed.
- 0 known contradicted published clauses.
- At least 98 percent of audited clauses fully supported.
- 100 percent of equations, code traces, and generated diagrams manually reviewed.
- 100 percent prompt answerability on fixture review.
- 100 percent package recovery after forced restart tests.
- 100 percent keyboard path completion.
- No cloud request outside the recorded permission scope.
- All failed or uncertain elements visibly fall back to Source mode.

The source-support threshold should become stricter, not looser, before external study.

# 8. Adaptation and learner-model policy

## 8.1 Policy objective

The v0 policy does not try to infer an invisible, stable learner type. It decides whether to offer one of a small set of reversible supports for the current concept.

Priority order:

1. Respect explicit learner goal and accessibility settings.
2. Preserve source fidelity.
3. Respond to demonstrated task evidence.
4. Minimize unnecessary interruption.
5. Explain every adaptation.
6. Permit immediate undo.
7. Optimize delayed explanation and transfer only after those outcomes exist.

## 8.2 Inputs

### High-value inputs

- Selected goal: Preview, Understand, or Study.
- Explicit accessibility settings.
- Short prerequisite response.
- Rubric-scored correctness.
- Confidence submitted after an answer.
- Delayed outcome.
- Manual Faster or Deeper change.
- Explicit representation preference for the current frame.
- “Not ready” response.

### Supporting, ambiguous inputs

- Response time.
- Pause duration.
- Rewind.
- Replay.
- Source inspection.
- Frame backtracking.
- Browser focus state.
- Skipped optional checks.

These inputs may modify a recommendation only when paired with task evidence. They never independently produce a mastery, confusion, motivation, or ability claim.

## 8.3 V0 state model

For each concept, maintain evidence rather than a single latent mastery score.

```text
unseen
  -> oriented
  -> building
  -> demonstrated_immediate
  -> durability_unmeasured
  -> demonstrated_24h
  -> demonstrated_7d
```

Any state may also carry:

```text
needs_repair
uncertain
```

A state transition requires explicit evidence:

| Transition | Minimum evidence |
|---|---|
| unseen to oriented | Preview or source exposure |
| oriented to building | Started Understand or Study |
| building to demonstrated_immediate | Meets immediate explanation or application rubric |
| demonstrated_immediate to durability_unmeasured | Session ends without delayed evidence |
| durability_unmeasured to demonstrated_24h | Meets 24-hour rubric on a nonidentical item |
| demonstrated_24h to demonstrated_7d | Meets seven-day explanation and transfer standard |
| any to needs_repair | Specific incorrect or missing governing relation |
| any to uncertain | Conflicting, missing, or low-quality evidence |

Completion never triggers `demonstrated_immediate`.

## 8.4 Transparent rule set

Thresholds below are initial engineering policy values, not psychological constants. They must be versioned and audited.

### Rule 1: Required prerequisite offer

**Trigger**

- Required prerequisite precheck is below 60 percent of rubric points, or
- Learner selects “not ready” and the current concept references an unresolved required prerequisite.

**Action**

Offer a 2 to 5 minute prerequisite path, source definition, or skip.

**Explanation**

> “This section assumes you can distinguish a serial schedule from a concurrent one. Your precheck did not yet show that distinction, so PRISM is offering a short prerequisite.”

**No inference**

Do not label the learner weak at databases.

### Rule 2: High-confidence error

**Trigger**

- Answer is below 50 percent of rubric points.
- Confidence is 3 or 4 on a four-point scale.
- At least one governing relation is incorrect, not merely omitted.

**Action**

Offer contrastive repair and show exact source evidence. Suppress automatic Faster recommendation for this concept.

**Explanation**

> “Your answer was confident but reversed the role of disjoint writes. PRISM is showing a contrast and the supporting source spans.”

### Rule 3: Low-confidence correct answer

**Trigger**

- Answer meets the success threshold.
- Confidence is 1 or 2.

**Action**

Do not force repair. Offer one short confirmation example or continue.

**Explanation**

> “Your explanation covered the required relations, but your confidence was low. You can confirm with one new case or continue.”

This prevents low confidence from being treated as failure.

### Rule 4: Repeated navigation plus task difficulty

**Trigger**

Within one concept:

- At least two rewinds, source inspections, or replay actions, and
- A failed or “not ready” boundary prompt.

**Action**

Recommend a representation switch or Deeper bundle.

**Explanation**

> “You revisited this relation several times and the checkpoint was unresolved. PRISM can keep the source schedule visible and walk through one state transition.”

Navigation alone does not trigger the action.

### Rule 5: Rapid correct performance

**Trigger**

- Two distinct items for the concept meet rubric thresholds.
- Confidence is calibrated or at least not high-confidence wrong.
- No source-fidelity or accessibility issue.
- At least one item requires application, not recognition.

**Action**

Offer, never apply, one Faster bundle step for this concept.

**Explanation**

> “You explained and applied this concept in two different cases. You can merge the remaining examples or keep the current depth.”

### Rule 6: Manual learner override

**Trigger**

Learner selects Faster, Deeper, Source, static transcript, reduced motion, or representation switch.

**Action**

Apply immediately if safe. Log the bundle receipt. Do not reverse it automatically during the same concept unless the learner requests a recommendation.

Explicit user control outranks behavioral inference.

### Rule 7: Productive pause protection

**Trigger**

Long pause without task evidence.

**Action**

Exclude backgrounded time from active-time estimates. Make no content change.

A pause never independently invokes remediation.

### Rule 8: Focus-state handling

**Trigger**

Browser loses focus.

**Action**

Stop active-time accumulation after a short grace period and pause optional autoplay. On return, offer “continue” or “show previous frame.”

Do not infer distraction, multitasking, or effort.

### Rule 9: Delayed failure

**Trigger**

Seven-day response is below the transfer or explanation threshold.

**Action**

Set `needs_repair`, select a different case and representation, and avoid merely replaying the original sequence.

**Explanation**

> “The seven-day response did not yet show the relation between the threshold event and the change in window growth. PRISM is using a new trace rather than repeating the same wording.”

### Rule 10: Repeated policy rejection

**Trigger**

Learner dismisses or undoes the same recommendation twice in one session.

**Action**

Suppress that recommendation class for the session and expose a preference control.

Do not interpret dismissal as low motivation.

## 8.5 Representation-selection rules

| Observed evidence | Candidate action | Guard |
|---|---|---|
| Definition error | Show source definition plus nonexample | Preserve source scope |
| Causal link omitted | Typed causal chain or counterfactual | Edge must map to approved relation |
| State transition error | User-stepped state sequence | All states validated |
| Equation symbol confusion | Symbol ledger and source equation | No generated derivation without review |
| Code-state error | Executed code trace | Fixture must reproduce exact result |
| Table comparison error | Table lens on exact cells | Headers, units, footnotes preserved |
| Visual appears unused but answer correct | Offer text-only, do not force | Preference is not learning |
| Visual plus answer error | Switch to source text or simpler representation | Do not add more visuals automatically |
| Source inspection resolves answer | Continue with source anchor | Do not classify inspection as failure |

## 8.6 Adaptation explanation surface

The live canvas shows only a compact “Why this?” link. Opening it displays:

```text
Current recommendation: Deeper one step

Evidence used:
- boundary explanation missed 1 of 3 required relations
- 2 source inspections in this concept
- learner goal is Study

Evidence not used:
- total session completion
- browser focus loss
- reading speed
- profile or demographic data

Change:
- keep the TCP state diagram visible
- add one worked transition
- add one prediction prompt

[Apply] [Not now] [Do not suggest this again today]
```

The explanation is generated from a deterministic policy trace, not an LLM narrative.

## 8.7 What to log

### Required local event data

- Session and package IDs.
- Monotonic and wall-clock timestamps.
- Concept and frame IDs.
- Navigation and control actions.
- Browser focus state.
- Selected goal and bundle.
- Accessibility setting changes.
- Prompt IDs and submitted answers.
- Rubric dimension scores.
- Confidence after answering.
- Offered and accepted repairs.
- Immediate, 24-hour, and seven-day outcomes.
- Policy version, rule triggered, evidence used, action, and user override.
- Source-fidelity reports.

### Derived data

- Active time under a versioned rule.
- Frame dwell distributions.
- Revisit count.
- Source-inspection duration.
- Calibration error.
- Delayed transfer per active minute.
- Policy acceptance and reversal.
- Missing-rubric-relation patterns.

Derived fields must be reproducible from raw events and versioned transformations.

## 8.8 What remains private and local

By default, all of the following remain local:

- Source bytes and extracted content.
- Lesson package.
- Learner answers.
- Notes.
- Event log.
- Concept state.
- Accessibility settings.
- Model prompts and responses.
- Provider cost history.
- Research results.

Opt-in research export should support separate toggles for:

1. Aggregated outcomes only.
2. Event traces without source text.
3. De-identified learner answers.
4. Package metadata.
5. Source-derived content, only when redistribution is authorized.

A user must be able to inspect and delete each category.

## 8.9 What PRISM must never infer

PRISM must not infer or store:

- Intelligence or general ability.
- Fixed learning style.
- Disability or diagnosis.
- Mental health or emotional state.
- Motivation, laziness, diligence, or attention.
- Socioeconomic status.
- Race, ethnicity, religion, gender identity, sexual orientation, political view, or other protected or sensitive identity.
- Cheating or dishonesty from response behavior.
- Medical, legal, or employment suitability.
- Personality.
- Global subject competence from one source or session.
- Intent from browser focus loss.
- Confusion from pauses alone.
- Mastery from speed, completion, or confidence alone.

The system may record an explicit accessibility setting without inferring why it is needed.

## 8.10 Preventing proxy optimization

PRISM should use a constrained scorecard, not a single reward.

### Primary research outcome

Seven-day transfer rubric score.

### Co-primary efficiency interpretation

Seven-day transfer relative to active time, reported alongside absolute transfer. Never collapse the two into a proprietary score without showing both.

### Safety constraints

- Source-fidelity error rate.
- Accessibility failures.
- Learner-control violations.
- Workload and fatigue.
- Immediate comprehension.
- Attrition.
- Cloud-permission violations.
- Calibration harm.

### Metrics that cannot be optimized as goals

- Session completion.
- Time in app.
- Streaks.
- Frames viewed.
- Number of checks answered.
- Self-reported confidence.
- Model-rated engagement.
- Click-through on recommendations.

A candidate policy is rejected if it improves completion while reducing delayed transfer, learner control, fidelity, or accessibility.

## 8.11 Learned-policy roadmap

### Phase A: deterministic rules

Requirements:

- Stable event schema.
- Stable lesson packages.
- Human-audited assessments.
- Delayed outcomes.
- Rule traces.
- User overrides.
- At least two benchmark domains.

No learned action selection.

### Phase B: observational analysis

Questions:

- Which signals predict delayed outcomes after controlling for concept, package, prior knowledge, and goal?
- Which signals are mostly consequences of content difficulty?
- Where do rules trigger but users reject them?
- Which representation switches correlate with recovery?

Use mixed-effects or hierarchical models for analysis, not automatic policy.

### Phase C: randomized micro-experiments

Randomize only low-risk, reversible actions:

- Offer versus do not offer a worked contrast.
- Persistent anchor versus on-demand anchor.
- One versus no boundary prompt.
- Two frame sizes.
- Static sequence versus short user-controlled animation.

Do not randomize source-fidelity gates, accessibility, permission, or learner control.

### Phase D: contextual bandit in shadow mode

Internal gate, labeled **Project policy rather than a universal statistical rule**:

- At least 1,000 valid concept episodes with delayed outcomes.
- At least 100 outcome-bearing episodes for every candidate action in each major content stratum where it might be deployed.
- Overlap between contexts and actions sufficient for off-policy evaluation.
- Stable assessment reliability.
- No unresolved critical fidelity incidents.
- Predefined minimum detectable effect and safety constraints.
- Independent review of confounding and missingness.

The bandit first recommends in shadow mode while deterministic rules continue to act.

### Phase E: limited online bandit

Only after shadow evaluation:

- Actions remain reversible.
- Exploration probability is bounded and disclosed in research mode.
- No exploration on high-risk content.
- Reward uses delayed transfer with active-time and safety constraints.
- A deterministic safe action is always available.
- Rollback is immediate.
- A holdout group preserves causal evaluation.

### Knowledge tracing

Use Bayesian knowledge tracing only when:

- Concepts have repeated, independently scored opportunities.
- Items have stable relation to concepts.
- Guess and slip behavior can be investigated.
- The output is interpretable and calibrated.

Deep knowledge tracing is **Defer** until it demonstrates better calibrated delayed-outcome prediction than simpler models under strict holdout by learner, content, and time.

### Reinforcement learning

**Reject for the foreseeable product roadmap.** Long-horizon rewards, sparse delayed labels, evolving content, small samples, and safety constraints make end-to-end reinforcement learning poorly justified.

## 8.12 Adaptation acceptance tests

1. Every action can display its rule trace.
2. Removing any ambiguous signal alone does not block learning.
3. A pause without task evidence produces no remediation.
4. A high-confidence wrong answer triggers a source-linked repair.
5. A low-confidence correct answer is not marked wrong.
6. Manual Source or Deeper choice is not automatically reversed.
7. Preview never advances concept state beyond oriented.
8. Seven-day state cannot be awarded by immediate answers.
9. Policy replay on the same events produces the same actions.
10. Deleting learner data removes raw events, derived state, and scheduled reviews.
11. No sensitive trait field exists in schema or analytics.
12. A fixed nonadaptive bundle remains available at all times.

# 9. Implementation roadmap

## 9.1 Three-month objective

At 5 to 10 hours per week, the credible target is not a general AI textbook platform. It is:

> **A local desktop web application that imports one clean technical section, preserves exact source regions, plays one manually reviewed semantic lesson on transaction isolation, offers source inspection and one sparse repair loop, logs research-grade local events, survives restart, and supports an enhanced static-reader control condition.**

Expected capacity is roughly 60 to 120 focused hours. The plan therefore uses one golden concept first and postpones automation that cannot be validated.

## 9.2 Architecture to preserve

- React, TypeScript, and Vite frontend.
- Python, FastAPI, and Pydantic backend.
- SQLite in WAL mode.
- Content-addressed local files.
- `pypdfium2` for supported clean PDFs.
- Replaceable model-provider adapters.
- Versioned JSON Schema and generated TypeScript types.
- Deterministic player and policy.
- Local-first data and explicit cloud permission.

No migration is recommended.

## 9.3 Smallest credible vertical slice

### Scope

One synthetic or openly licensed transaction-isolation source with:

- 1,000 to 1,500 words.
- One two-lane transaction schedule.
- One comparison table.
- One governing counterexample.
- Six to ten semantic frames.
- One boundary explanation.
- One repair.
- One 24-hour and one seven-day prompt.
- Source Reader and semantic-player conditions.

### Manual-first rule

The initial package is authored in typed JSON by the developer and reviewed against the source. AI compilation comes after the player, provenance, accessibility, and fidelity model work.

This prevents the project from spending its first month generating content for a player whose learning logic has not been tested.

## 9.4 Milestone plan

### Milestone 0, Week 1: research lock and repository foundation

**Classification:** [Build Now]

**Deliverables**

- Product decision record.
- Repository scaffold.
- Python and TypeScript schema generation.
- Initial SQLite migrations.
- Fixture licensing and source selection.
- Threat and privacy boundary.
- Local run command.

**Dependencies**

- Finalized v0 schema subset.
- One redistributable transaction-isolation fixture.

**Acceptance tests**

- `make dev` or equivalent launches frontend and backend.
- Backend exposes health and schema-version endpoints.
- TypeScript compiles against generated contracts.
- Database enables WAL and applies migrations.
- Original fixture hash is stored and reproducible.
- No network request occurs during local launch.

**Risks**

- Overbuilding schema.
- Spending time on visual polish.
- Choosing a copyrighted fixture that cannot enter the repo.

**Done means**

A new clone runs locally with one command and loads a typed empty workspace.

### Milestone 1, Weeks 2 to 3: source import and enhanced static reader

**Classification:** [Build Now]

**Deliverables**

- Paste, Markdown, text, and one clean-PDF import path.
- Content-addressed storage.
- Document, page, element, and span records.
- PDF page rendering.
- Basic structure tree.
- Source Reader with page and text synchronization.
- Extraction-inspection screen.
- Delete and export manifest.

**Dependencies**

- pypdfium2 integration.
- Storage and permission schemas.

**Acceptance tests**

- Importing the same file does not duplicate bytes.
- A selected text span opens the correct page and region.
- Refresh and backend restart preserve the source.
- Deleting a source removes derived local artifacts.
- A deliberately malformed fixture is rejected or marked Source-only.
- Keyboard navigation reaches headings, source text, page controls, and delete flow.

**Risks**

- Reading-order defects.
- File-path assumptions.
- PDF scope creep.

**Done means**

The user can study the golden source in an accessible enhanced reader without AI.

### Milestone 2, Weeks 4 to 5: deterministic lesson package and player

**Classification:** [Build Now]

**Deliverables**

- Manual lesson-package loader.
- Deterministic player state machine.
- Stable 1440-pixel canvas.
- Active frame, previous frame, anchor rail, controls.
- Source inspection that returns to exact state.
- Preview, Understand, and Study labels.
- Static transcript.
- Crash and refresh recovery.
- Faster and Deeper bundle receipts, initially user-selected only.

**Dependencies**

- Typed package schema.
- Source span and asset bindings.

**Acceptance tests**

- Golden package has no orphaned reference.
- Every frame links to source.
- Back, Next, Source, transcript, and restart are lossless.
- Preview cannot write mastery evidence.
- Reduced-motion mode has no animated transitions.
- An invalid diagram or frame causes source fallback.
- State-machine property tests prevent impossible transitions.

**Risks**

- UI complexity before learning value is known.
- Source modal losing position.
- Hidden layout shifts.

**Done means**

The manually authored transaction-isolation lesson is usable end to end and can be compared with the static reader.

### Milestone 3, Week 6: accessibility and recovery gate

**Classification:** [Build Now]

**Deliverables**

- Full keyboard map.
- Focus-management tests.
- Screen-reader transcript behavior.
- Accessible tables, code, math placeholder path, and diagrams.
- Browser zoom and responsive minimum.
- Forced-crash recovery tests.
- Data deletion and local export.
- Accessibility test checklist.

**Dependencies**

- Stable player shell.

**Acceptance tests**

- Keyboard-only completion of all paths.
- Automated accessibility scan has no critical violations.
- Manual screen-reader smoke test succeeds.
- 200 percent zoom retains operation.
- Reduced motion and no-color tests pass.
- Force-killing backend during a session recovers the exact frame after restart.
- Permission and source state remain consistent after failure.

**Risks**

- Treating automated scans as sufficient.
- Transcript divergence from visual player.

**Done means**

Accessibility and recovery defects block further feature work.

### Milestone 4, Weeks 7 to 8: bounded compiler and provider layer

**Classification:** [Experiment First]

**Deliverables**

- Model-provider interface.
- Local and one optional cloud adapter.
- Per-source cloud permission.
- Atomic claim proposal pass.
- Span validator.
- Claim-review queue.
- Concept and relation proposal.
- Provenance record.
- Cost and latency record.
- Abstention and source-fallback path.

**Dependencies**

- Stable source layer and schema.
- Human gold claims.

**Acceptance tests**

- No candidate without valid spans can enter review.
- Cloud adapter refuses requests without matching permission.
- Payload preview exactly matches transmitted scope.
- Same cached request is not charged twice.
- Unsupported, broadened, or contradicted seeded candidates are rejected.
- Provider timeout leaves the reader usable.
- Model response is stored locally only according to configured policy.

**Risks**

- Generator and reviewer share error.
- Cloud semantics or retention change.
- Temptation to automate publication.

**Done means**

The compiler can propose claims for the golden fixture, but a human still publishes them.

### Milestone 5, Week 9: frame planner and typed representation

**Classification:** [Experiment First]

**Deliverables**

- Frame-plan proposal.
- Coverage and qualification checks.
- Representation candidate records.
- Typed causal or sequence diagram grammar.
- Sanitized SVG renderer.
- Source visual plus overlay.
- Accessibility description generation and review.

**Dependencies**

- Approved claim and relation graph.
- Stable player frame types.

**Acceptance tests**

- Diagram cannot include arbitrary SVG or scripts.
- Every node and edge maps to claims or relations.
- Renderer is deterministic.
- Invalid or over-dense diagrams fall back to text.
- A source visual is selected over a redraw when it already satisfies the purpose.
- Frame plan covers governing and boundary claims.

**Risks**

- Visually attractive but semantically weak diagrams.
- Over-segmentation.
- Generated alt text with unsupported claims.

**Done means**

The golden lesson can be recompiled into the same approved frame plan with auditable proposals.

### Milestone 6, Week 10: sparse learning loop and transparent adaptation

**Classification:** [Experiment First]

**Deliverables**

- One explanation prompt.
- Relation rubric.
- Confidence after answer.
- One contrastive repair.
- “Why this?” rule trace.
- User override.
- Fixed and rule-based policy variants.
- No LLM scoring in the primary pilot unless audited.

**Dependencies**

- Approved item and repair.
- Event schema.

**Acceptance tests**

- High-confidence seeded error triggers the expected repair.
- Low-confidence correct answer does not trigger failure.
- Navigation without failed task evidence does not trigger repair.
- User override persists for the concept.
- Prompt is answerable from viewed content.
- Repair names exact missing relation and source.

**Risks**

- Scoring free text unreliably.
- Too many interruptions.
- Implicit mastery claims.

**Done means**

One complete Anchor, Advance, Integrate, Repair cycle works deterministically.

### Milestone 7, Week 11: research instrumentation and delayed review

**Classification:** [Build Now]

**Deliverables**

- Local event log.
- Active-time derivation.
- Condition assignment.
- Immediate assessment.
- 24-hour and seven-day local review queue.
- Exportable research bundle without source text.
- Package and protocol lock.
- Analysis notebook or script.
- Audit view for fidelity incidents.

**Dependencies**

- Stable player and assessment.
- Privacy export controls.

**Acceptance tests**

- Event replay reconstructs state.
- Browser blur is excluded from active time under the versioned rule.
- Delayed item cannot appear early.
- Research export omits source and notes by default.
- Condition assignment is reproducible and counterbalanced.
- Assessment scorer is blind to condition in exported data.

**Risks**

- Flexible post hoc metrics.
- Missing delayed data.
- Condition leakage through UI.

**Done means**

The owner can run a reproducible single-person crossover pilot and inspect results.

### Milestone 8, Week 12: owner pilot, adversarial review, and scope decision

**Classification:** [Experiment First]

**Deliverables**

- Locked owner-pilot protocol.
- At least two matched concepts.
- Fidelity audit.
- Usability notes.
- Immediate and delayed results if calendar permits.
- Incident log.
- Next-quarter decision memo.

**Dependencies**

- All prior release gates.

**Acceptance tests**

- No package changes after first exposure.
- Conditions are assigned before study.
- Scoring rubric is fixed.
- Source-fidelity audit is complete.
- Negative results are recorded without feature reinterpretation.
- Next build decision follows go or no-go rules.

**Risks**

- Founder expectancy and self-scoring bias.
- Insufficient delayed window within the final week.
- Treating one owner result as general evidence.

**Done means**

The project has a working research instrument and an honest decision about whether to expand.

## 9.5 Weekly time allocation

At five hours:

- 3 hours implementation.
- 1 hour tests and fixture review.
- 30 minutes documentation.
- 30 minutes research and issue triage.

At ten hours:

- 5.5 hours implementation.
- 2 hours tests and accessibility.
- 1 hour fixture and fidelity review.
- 1 hour research instrumentation.
- 30 minutes documentation.

Do not trade test or fidelity time for more generated features.

## 9.6 Scope-control rules

During the three-month build:

- One domain first.
- One PDF class.
- One source language.
- One user.
- One local workspace.
- One optional cloud provider.
- One diagram grammar.
- One repair path.
- No authentication.
- No synchronization.
- No mobile.
- No social feature.
- No recommendation feed.
- No generic chatbot.
- No open-ended image generation.
- No learned policy.

A new feature enters only when it is necessary to test the core causal hypothesis.

## 9.7 Proposed repository structure

```text
prism/
├─ README.md
├─ LICENSE
├─ Makefile
├─ pyproject.toml
├─ package.json
├─ pnpm-workspace.yaml
├─ .env.example
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  ├─ reader/
│  │  │  ├─ player/
│  │  │  ├─ review/
│  │  │  ├─ accessibility/
│  │  │  └─ research/
│  │  └─ tests/
│  └─ api/
│     ├─ prism_api/
│     │  ├─ routes/
│     │  ├─ dependencies/
│     │  └─ main.py
│     └─ tests/
├─ prism_core/
│  ├─ domain/
│  ├─ schemas/
│  ├─ storage/
│  ├─ importers/
│  ├─ pdf/
│  ├─ compiler/
│  │  ├─ claims/
│  │  ├─ concepts/
│  │  ├─ frames/
│  │  ├─ representations/
│  │  ├─ practice/
│  │  └─ review/
│  ├─ providers/
│  ├─ policy/
│  ├─ telemetry/
│  └─ provenance/
├─ packages/
│  ├─ contracts-ts/
│  ├─ player-engine/
│  ├─ diagram-renderer/
│  └─ ui-tokens/
├─ migrations/
├─ fixtures/
│  ├─ open/
│  │  ├─ transaction-isolation/
│  │  ├─ tcp-congestion/
│  │  └─ distributed-consensus/
│  └─ synthetic/
├─ studies/
│  ├─ protocols/
│  ├─ assessments/
│  ├─ rubrics/
│  ├─ preregistrations/
│  └─ analysis/
├─ docs/
│  ├─ architecture/
│  ├─ adr/
│  ├─ research/
│  ├─ accessibility/
│  ├─ privacy/
│  ├─ threat-model/
│  ├─ claims/
│  └─ operations/
└─ scripts/
   ├─ generate_contracts.py
   ├─ validate_package.py
   ├─ audit_grounding.py
   └─ export_research_bundle.py
```

## 9.8 Documentation set

Required before owner pilot:

- `PRODUCT_BOUNDARY.md`
- `EVIDENCE_LABELS.md`
- `SOURCE_FIDELITY_POLICY.md`
- `CLOUD_PERMISSION_MODEL.md`
- `ACCESSIBILITY_RELEASE_GATE.md`
- `LESSON_PACKAGE_SCHEMA.md`
- `PLAYER_STATE_MACHINE.md`
- `ADAPTATION_POLICY_V0.md`
- `RESEARCH_METRICS.md`
- `CLAIMS_AND_DISCLOSURES.md`
- `INCIDENT_RESPONSE.md`
- Architecture decision records for major choices.

## 9.9 Epic and issue breakdown

### Epic A: Local source foundation

- A1 content-addressed object store.
- A2 SQLite WAL migrations.
- A3 import permission record.
- A4 PDF page renderer.
- A5 element and span inspector.
- A6 delete and export.

### Epic B: Enhanced reader

- B1 structure navigation.
- B2 synchronized page and text.
- B3 source-region highlighting.
- B4 keyboard and screen-reader path.
- B5 responsive and zoom behavior.

### Epic C: Lesson contracts

- C1 Pydantic schemas.
- C2 JSON Schema export.
- C3 generated TypeScript types.
- C4 package validator.
- C5 provenance bundle.
- C6 status transitions.

### Epic D: Semantic player

- D1 state machine.
- D2 shell and rails.
- D3 frame renderers.
- D4 Source inspection.
- D5 transcript.
- D6 recovery.
- D7 Faster and Deeper bundles.

### Epic E: Compiler

- E1 provider adapter.
- E2 claim proposal.
- E3 span validation.
- E4 concept and relation proposal.
- E5 frame plan.
- E6 representation proposal.
- E7 layered review.
- E8 package builder.

### Epic F: Learning loop

- F1 practice schema.
- F2 rubric scorer.
- F3 confidence capture.
- F4 repair selector.
- F5 rule trace.
- F6 delayed review.

### Epic G: Research

- G1 event schema.
- G2 active-time derivation.
- G3 condition assignment.
- G4 assessment export.
- G5 fidelity audit.
- G6 analysis and visualization.
- G7 protocol lock.

### Epic H: Safety and quality

- H1 accessibility gate.
- H2 privacy and threat model.
- H3 cloud-permission tests.
- H4 package corruption recovery.
- H5 parser failure fixtures.
- H6 claims review.
- H7 dependency and security updates.

## 9.10 Definition of done for every issue

An issue is done only when:

- Code is merged.
- Contract and migration impact are documented.
- Unit or integration tests pass.
- Failure path is tested.
- Accessibility impact is reviewed.
- Privacy and cloud boundary are reviewed.
- Relevant fixture is added or updated.
- User-facing claim is accurate.
- Documentation is updated.
- No hidden network call is introduced.

# 10. Validation and research plan

## 10.1 Research claim ladder

PRISM should earn claims in this order:

1. **Source fidelity:** The system preserves and exposes source meaning.
2. **Technical usability:** Learners can control and recover the interface.
3. **Immediate comprehension:** The representation does not impair literal or inferential understanding.
4. **Delayed retention:** Learning remains detectable after 24 hours and seven days.
5. **Transfer:** Learners can apply the governing relation to a new case.
6. **Efficiency:** Delayed transfer is maintained or improved with less active time.
7. **Generalization:** Effects replicate across learners, topics, sources, and implementations.

Failure at an earlier level blocks claims at later levels.

## 10.2 Study conditions

Use four primary conditions:

### Condition A: normal self-paced source reading

- Source content in the enhanced static reader.
- Search, navigation, source visuals, and accessibility.
- No semantic frame transformation.
- No retrieval or adaptive repair during the initial study period.

This is the true product baseline.

### Condition B: one-word RSVP, research-only negative control

- One word at a time in a fixed central location.
- Moderate, preregistered rate.
- Pause and exit are available for participant safety.
- No claim that this is a product candidate.
- Short technical unit only.
- Source available after the study period for debrief, not during the timed exposure if the protocol requires a clear comparison.

This condition exists because the brief requests the comparison and because it tests whether merely removing eye movements or scrolling explains any effect. It should not consume core product engineering time.

### Condition C: semantic stream

- Coherent semantic frames.
- Learner-controlled Next, Back, and Source.
- Previous frame visible.
- No sparse retrieval, scoring, or repair.
- Source visual shown only according to the locked frame plan.

### Condition D: semantic stream plus sparse learning loop

- Same semantic frames as C.
- Concept-boundary integration prompt.
- Confidence after answering.
- Source-linked repair when rubric evidence warrants.
- Transparent deterministic rule.

The primary comparison is D versus A. B is a boundary condition, not the competitor PRISM must beat.

## 10.3 Outcome framework

### Primary outcome

**Seven-day transfer score** on one or more new cases, scored with a preregistered relation rubric by raters blind to condition.

### Key secondary outcomes

- Seven-day explanation score.
- Total active learning time.
- 24-hour transfer and explanation.
- Immediate inferential comprehension.
- Immediate literal comprehension.
- Workload.
- Fatigue.
- Confidence calibration.
- Source-fidelity errors.
- Learner-control events.
- Usability.
- Representation preference, reported separately from learning.

### Measurement table

| Construct | Measure | Timing | Notes |
|---|---|---|---|
| Literal comprehension | Source-dependent factual items | Immediate, 24 h, 7 d | Avoid wording copied from frames |
| Inferential comprehension | Why, condition, and consequence items | Immediate and delayed | Rubric-scored |
| Transfer | Structurally similar but surface-different case | Immediate, 24 h, 7 d | Primary at seven days |
| Active time | Focus-adjusted monotonic event time | Initial study and review | Report rule and sensitivity analysis |
| Workload | Raw NASA-TLX dimensions or preregistered short form | After each condition | Do not collapse without rationale |
| Fatigue | Brief visual analog rating | Before and after each condition | Distinguish eye strain and mental fatigue |
| Usability | Task success, errors, interview, SUS as secondary | Pilot and study | Preference is not efficacy |
| Calibration | Confidence versus rubric success | Each assessment | Brier score or absolute calibration error |
| Control | Back, pause, source, speed/depth, representation switch | During study | Descriptive and exploratory |
| Fidelity | Error count and severity per generated clause or asset | Before exposure and incident reports | Critical gate |
| Retention | Repeated explanation and application | 24 h and 7 d | Use alternate items |

## 10.4 Assessment construction

### Blueprint

For each concept, specify:

- Governing relation.
- Required conditions.
- Mechanism.
- Consequence.
- Boundary or exception.
- Common confusion.
- Source-dependent literal details.
- One near-transfer case.
- One farther-transfer case where feasible.

### Item set

A typical unit should have:

- Two literal items.
- Two inferential items.
- One explanation.
- Two new-case transfer items.
- One confidence judgment after each scored response.
- Alternate forms for immediate, 24-hour, and seven-day testing.

Do not reuse the exact practice item as the outcome.

### Rubric example: write skew transfer, 0 to 4

| Dimension | Point |
|---|---:|
| Identifies that transactions read a compatible or common snapshot | 1 |
| Identifies disjoint writes or lack of direct write conflict | 1 |
| Identifies the cross-item invariant or joint constraint | 1 |
| Correctly concludes that both commits can violate the invariant without a serial equivalent | 1 |

Incorrect claims can subtract points only under a preregistered rule. Stylistic quality and source wording do not affect score.

### Item quality review

- Domain expert review.
- Cognitive interview with at least two target learners.
- Answerability check.
- Alternate-form similarity.
- Leakage check against frame wording.
- Ambiguity review.
- Pilot item difficulty and discrimination.
- Rater training and adjudication.

## 10.5 Stage 0: source-fidelity gate

No learner study begins until every experimental lesson clears this gate.

### Review sample

Audit:

- Every generated claim in the initial fixture.
- Every diagram node and edge.
- Every equation transformation.
- Every code-state transition.
- Every prompt and answer key.
- Every repair claim.
- A random sample of exact source bindings after package build.

### Severity scale

| Severity | Definition | Example | Decision |
|---|---|---|---|
| Critical | Reverses, fabricates, or materially changes the governing idea | Says snapshot isolation guarantees serializability | Block package |
| Major | Omits a condition or exception that changes application | Removes the disjoint-write condition | Block package |
| Moderate | Imprecise but unlikely to reverse the current conclusion | Overgeneralizes implementation detail | Revise |
| Minor | Wording or locator defect without conceptual consequence | Slightly broad source highlight | Fix before study when feasible |

### Gate

- Zero critical and major known errors.
- All source spans valid.
- All high-risk assets manually reviewed.
- At least 98 percent fully supported audited clauses, with the remaining 2 percent limited to minor or explicitly labeled interpretation.
- Reviewer disagreements adjudicated.
- Package frozen after approval.

The 98 percent value is an internal launch threshold, not a statement that 2 percent conceptual error is acceptable. Any critical error blocks exposure.

## 10.6 Stage 1: owner longitudinal pilot

**Purpose:** Debug protocol, interface, event logging, delayed review, and obvious learning harm. It cannot establish general efficacy.

### Design

- N of 1.
- At least eight matched units over four to six weeks if continuing beyond the first three-month build.
- Randomized condition order.
- Alternate assessment forms.
- Seven-day testing.
- External or delayed blind scoring when possible.
- Package locked before exposure.

### Questions

- Does state recover correctly?
- Are frames too fragmented?
- Is source inspection fast enough?
- Do prompts interrupt model construction?
- Are delayed items answerable?
- Does the owner remember source wording rather than relation?
- Does the static reader outperform the canvas?

### Decision

Proceed only if:

- No critical fidelity or recovery failure.
- Delayed testing workflow functions.
- Semantic conditions are not consistently worse than static reading.
- Workload is tolerable.
- The owner can describe concrete reasons for source or representation switches.

## 10.7 Stage 2: usability pilot

**Purpose:** Identify interaction and accessibility failures, not estimate learning efficacy.

### Participants

A planning range of 6 to 10 technically oriented adults with variation in prior knowledge, reading preferences, and accessibility needs. Final number is driven by issue saturation, not statistical significance.

### Tasks

- Import a provided source.
- Choose goal.
- Use Source Reader.
- Complete semantic frames.
- Inspect provenance.
- Change Faster or Deeper.
- Complete one boundary prompt and repair.
- Recover after simulated interruption.
- Find delayed review.
- Use keyboard-only or transcript path for at least part of the session.

### Measures

- Task success.
- Critical error count.
- Time to source evidence.
- Navigation failures.
- Focus and announcement defects.
- Misinterpretation of modes.
- Think-aloud comments.
- Post-task interview.
- Workload and usability scale as secondary descriptors.

### Gate

- 90 percent or better success on core tasks after one brief orientation.
- Zero unrecoverable states.
- Zero critical accessibility blockers.
- Learners correctly understand that Preview is not mastery.
- Source evidence can be opened and interpreted.
- At least 80 percent can explain Faster and Deeper bundle changes.

These are product thresholds, not population estimates.

## 10.8 Stage 3: within-subject directional study

### Purpose

Estimate direction and plausible magnitude, discover mechanism, and decide whether a larger study is justified.

### Participants

Planning target: 36 to 60 completers, with 48 as a practical center. The final target must come from simulation using pilot outcome variance, within-person correlation, attrition, chosen noninferiority margin, and primary contrast. This study is directional, not definitive if confidence intervals remain wide.

### Design

- Four-period within-subject crossover.
- Four matched technical units.
- Each participant receives each condition once.
- Williams or balanced Latin-square counterbalancing.
- Unit-condition assignments rotated.
- Prior-knowledge pretest.
- No participant studies the same concept twice.
- Seven-day assessments scheduled relative to each unit.
- Raters blind to condition and order.
- Package and analysis plan locked before recruitment.

### Randomization

- Computer-generated.
- Block by broad prior-knowledge band if needed.
- Allocation generated before exposure.
- Conceal future condition from participant until session start.
- Record any technical override.

### Timing

Use self-paced study for the main efficiency question. Set a generous maximum only to prevent runaway sessions. Time pressure must be identical across conditions.

A later equal-time study may isolate representation from self-pacing, but it should not replace the practical self-paced comparison.

### Analysis model

Primary model:

- Mixed-effects regression or hierarchical model.
- Fixed effects: condition, period, unit, prior knowledge, and preregistered interactions.
- Random intercept for participant.
- Random effect for item or unit when data support it.
- Robust or ordinal model if rubric distribution warrants.
- Primary contrast D versus A at seven days.

Report:

- Raw mean difference.
- Standardized paired effect.
- 95 percent confidence interval.
- Participant-level distribution.
- Active-time distribution.
- Fidelity incidents.
- Sensitivity analyses.

Do not report only p-values.

## 10.9 Noninferiority and equivalence logic

The most credible early efficiency claim is:

> Semantic stream plus learning loop is not meaningfully worse in seven-day transfer and uses less active time than self-paced source reading.

### Initial project decision margins

These are proposed governance thresholds to be revised from pilot reliability and expert judgment:

- Seven-day transfer noninferiority margin: no worse than 0.20 standard deviations or five percentage points on the normalized rubric, whichever is stricter.
- Meaningful time reduction: at least 15 percent median active time.
- Superiority signal: point estimate at least 0.25 standard deviations with a confidence interval excluding zero for a confirmatory claim.

For noninferiority, the lower confidence bound for D minus A must remain above the negative margin. For equivalence, use two one-sided tests or the equivalent confidence-interval criterion within the preregistered equivalence bounds.

A shorter time with a transfer loss outside the margin is failure, not efficiency.

## 10.10 Attrition and missing data

Delayed studies are vulnerable to nonrandom missingness.

### Required reporting

- Randomized.
- Started each condition.
- Completed initial assessment.
- Completed 24-hour assessment.
- Completed seven-day assessment.
- Excluded with exact reason.
- Technical failure.
- Withdrawal.

### Analysis

- Primary analysis follows the preregistered estimand and includes all available randomized observations under the mixed model.
- Complete-case analysis is secondary.
- Conduct sensitivity bounds for missing delayed scores.
- Model completion probability for inverse-probability sensitivity analysis if sample permits.
- Do not impute perfect retention or assume data are missing completely at random.
- Report attrition by condition and period.
- A condition that causes higher attrition or fatigue cannot claim efficiency without addressing it.

## 10.11 Confidence calibration

Collect confidence after each response, not after study exposure.

Measures:

- Mean confidence for correct and incorrect responses.
- Calibration curve.
- Brier score when outcomes are binary.
- Absolute confidence minus normalized rubric performance.
- High-confidence error rate.

A condition that raises confidence without raising performance may be harmful even if learners prefer it.

## 10.12 Source-fidelity outcome

Maintain a separate safety endpoint:

- Unsupported clauses per 100 generated clauses.
- Major or critical errors per lesson.
- Wrong source-region links.
- Diagram edge errors.
- Equation or code-state errors.
- Learner-reported mismatches.
- Time to detect and recover.

Any critical error is reported by condition and package. Learning results from a compromised lesson are not interpreted as evidence about the interaction mechanism.

## 10.13 Ablation sequence

Run ablations in this order so the project discovers what helps.

1. **Static source reader versus semantic frames.**
   - Tests whether sequential transformation adds value.
2. **Semantic frames with versus without previous-frame context.**
   - Tests local recoverability.
3. **On-demand source visual versus persistent anchor.**
   - Tests spatial anchor and split-attention tradeoff.
4. **Static diagram versus user-stepped state sequence.**
   - Tests dynamic state benefit.
5. **Semantic stream versus semantic stream plus one integration prompt.**
   - Tests retrieval and interruption.
6. **Prompt only versus prompt plus representational repair.**
   - Tests targeted repair.
7. **Fixed Study bundle versus transparent rule-based adaptation.**
   - Tests adaptation beyond good defaults.
8. **Manual reviewed package versus AI-compiled package.**
   - Tests whether automation preserves outcome and fidelity.

Do not test every combination at once in the first study. Use sequential decisions and locked hypotheses.

## 10.14 Preregistration

Before the directional study, preregister:

- Primary and secondary outcomes.
- Conditions.
- Inclusion and exclusion.
- Randomization and counterbalancing.
- Assessment forms.
- Rubrics.
- Scoring and rater process.
- Active-time rule.
- Noninferiority margin.
- Primary contrast.
- Analysis model.
- Missing-data handling.
- Fidelity gate.
- Stopping rules.
- Confirmatory versus exploratory interactions.
- Package hashes.
- Policy version.
- Deviations procedure.

Host the preregistration in a timestamped public or private repository before data collection, then make it public when legal and privacy constraints allow.

## 10.15 Interpretation of results

| Result pattern | Interpretation | Product action |
|---|---|---|
| D improves seven-day transfer and time | Strong directional support | Replicate with larger and broader study |
| D is noninferior and at least 15 percent faster | Supports an efficiency hypothesis | Confirm before public claim |
| D improves immediate but not delayed outcomes | Fluency or short-term support only | Do not market learning efficiency; revise retrieval/spacing |
| D improves practiced items but not transfer | Overfitting to checks | Redesign prompts and repair |
| C equals A, D beats C | Sparse loop adds value, frames alone do not | Simplify canvas and retain loop |
| C or D worse than A | Static reader remains preferred | Revert product emphasis to enhanced reader |
| Persistent anchor raises workload or lowers outcomes | Split-attention or clutter cost | Make anchor on-demand or remove |
| One-word RSVP is worse | Confirms rejection boundary | Do not spend product effort on it |
| Null with wide interval | Inconclusive | Improve measurement or sample; no claim |
| Null with narrow interval inside equivalence bounds | No meaningful efficacy difference | Choose simpler, safer design |
| Benefit only in exploratory subgroup | Hypothesis-generating | Preregister replication; no personalized claim |
| Fidelity incidents occur | Safety failure | Stop, repair pipeline, invalidate affected lesson |

## 10.16 Go and no-go gates

### Gate 1: source fidelity

**Go:** Zero critical or major known errors and all assets traceable.  
**No-go:** Any unsupported governing claim, wrong equation, wrong code trace, or misleading diagram.

### Gate 2: usability and accessibility

**Go:** Core tasks recoverable, keyboard and transcript paths work, Preview distinction understood.  
**No-go:** Learners lose source context, cannot recover frames, or encounter accessibility blockers.

### Gate 3: owner pilot

**Go:** Protocol functions and semantic condition is not consistently harmful.  
**No-go:** Static reading clearly wins or the learning loop causes excessive interruption.

### Gate 4: directional study

**Go to larger study:** D versus A is favorable or plausibly noninferior with meaningful time reduction, no safety penalty, and confidence interval justifies further investment.  
**No-go:** Delayed transfer is outside the noninferiority margin, workload materially increases without benefit, or fidelity risk remains high.

### Gate 5: public efficacy claim

Requires a preregistered, adequately powered confirmatory study, independent or external replication where practical, validated assessments, acceptable attrition, fidelity audit, and a claim limited to tested populations, topics, conditions, and time horizon.

## 10.17 Later remote asynchronous adult study

Run only after the directional study clears Gate 4.

Requirements:

- Stable installer or local web runtime.
- Automated environment checks.
- Consent and data minimization.
- Technical support process.
- Tamper-evident package and protocol version.
- Reliable reminder and delayed-assessment delivery.
- Attention and data-quality checks that do not equate speed with engagement.
- Sample-size simulation, likely well above the directional study.
- Preplanned heterogeneity analysis.
- Independent scoring audit.
- Compensation that does not depend on performance.

Remote scale is not a substitute for content fidelity or validated outcome measures.

# 11. Risks, ethics, accessibility, privacy, and claims discipline

## 11.1 Risk register

| Risk | Category | Likelihood before controls | Impact | Leading indicator | Mitigation | Fail-closed condition |
|---|---|---:|---:|---|---|---|
| Semantic sequencing fragments discourse | Cognitive | High | High | Frequent Back and Source use, lower inference score | Stable prior frame, learner control, static-reader baseline, frame-coverage review | Revert passage or lesson to Source Reader |
| Persistent visual creates split attention | Cognitive/HCI | Medium | Medium-high | High workload, ignored anchor, gaze-independent navigation errors | One active visual, adjacency, on-demand option, ablation | Remove persistent anchor |
| Animation causes transient-information loss | Cognitive/accessibility | Medium | High | Replays, missed state changes, motion complaints | Static or user-stepped default, reduced motion | Replace with static sequence |
| Retrieval interrupts model construction | Pedagogical | Medium | Medium-high | Lower immediate inference, irritation, skips | Boundary-only prompts, no timer, optional skip | Disable checks for concept or bundle |
| Prompt teaches to the test | Pedagogical | Medium | High | Practice gain without transfer | New-case outcomes, alternate forms, sparse prompts | Redesign or remove item |
| Confidence inflates without learning | Metacognitive | Medium | High | Higher confidence, unchanged or lower score | Confidence after answer, calibration reporting | Remove confidence-driven adaptation |
| Parser silently corrupts source | Technical/model | Medium | Critical | Glyph loss, region mismatch | Per-element checks, source render, fixture suite | Source-only page or reject PDF |
| Model invents or broadens a claim | Model | High without controls | Critical | Unsupported clause, missing modality | Clause grounding, independent review, human audit | Reject dependent graph and frames |
| Generated diagram misstates relation | Model/visual | Medium | Critical | Wrong edge or object identity | Typed grammar, claim binding, source side-by-side | Text or exact source visual |
| Generated code trace or equation is wrong | Technical/model | Medium | Critical | Execution mismatch or invalid derivation | Execute code, step-check equations, human review | No generated walkthrough |
| Reviewer model rubber-stamps generator | Model governance | Medium | High | High agreement despite seeded errors | Different prompts/models, adversarial fixtures, human review | Manual review required |
| Cloud request exceeds consent | Privacy | Low with controls | Critical | Payload hash mismatch | Permission records, exact preview, request guard | Block network request |
| Local data exposed through web security flaw | Security/privacy | Medium | Critical | XSS, open bind, path traversal | Loopback-only, strict CSP, input sanitization, random session token, least privilege | Shut down API or disable import |
| PDF exploits parser or renderer | Security | Low-medium | Critical | Crash, unexpected process or file access | Dependency updates, process isolation, resource limits, malicious fixtures | Reject source and quarantine bytes |
| Notes or answers enter model payload | Privacy | Medium without controls | High | Payload contains learner text | Separate permission class, payload inspection | Block request |
| Deleted source leaves derived copies | Privacy | Medium | High | Orphan object hashes | Dependency graph and deletion audit | Mark deletion incomplete and block claim |
| Copyrighted transformation is shared | Legal | Medium | High | Export contains source expression or visuals | Private default, rights metadata, no public library, export warnings | Block sharing feature in v0 |
| Accessibility transcript diverges | Accessibility | Medium | High | Different claims or order | Generate from same package, snapshot test | Disable visual package release |
| Color or motion is required | Accessibility | Low-medium | High | Keyboard or reduced-motion test failure | Semantic labels, static equivalents | Block release |
| Learned policy optimizes completion | Ethics/ML | High if introduced early | High | More completion, worse transfer | No learned policy v0, constrained outcomes | Roll back to fixed bundle |
| Research result is overclaimed | Scientific | High founder risk | High | Marketing before delayed replication | Claim review, preregistration, public limitations | No efficacy language |
| Owner-only result is generalized | Scientific | High | High | Product copy cites n-of-1 | Label as debugging evidence | Block external claim |
| Small sample yields unstable subgroup story | Scientific | High | Medium-high | Post hoc subgroup benefit | Confirmatory/exploratory separation | No personalization claim |
| Product becomes a generic AI tutor | Product | Medium | Medium-high | Chat features dominate reader | Reading-centered scope and issue gate | Reject feature |
| Architecture becomes too large for solo schedule | Delivery | High | High | Many unfinished passes, no vertical slice | Manual-first package, one fixture, weekly scope review | Cut automation |

## 11.2 Security controls for a local desktop web app

Local-first does not mean automatically secure. The loopback application processes untrusted files and sensitive text.

### Required controls

1. Bind the API to `127.0.0.1` or equivalent loopback only, never all interfaces.
2. Use a random per-launch bearer or origin token between frontend and backend.
3. Strict allowlist for CORS and Host headers.
4. Content Security Policy that blocks inline script and untrusted origins.
5. Sanitize rendered Markdown and generated rich text.
6. Never render arbitrary model-generated HTML or SVG.
7. Normalize and validate every filesystem path.
8. Store files by content hash, not user-controlled path.
9. Enforce upload size, page count, render time, memory, and model payload limits.
10. Process PDF parsing and rendering with timeouts and resource limits. Consider a separate worker process.
11. Do not launch embedded PDF actions, JavaScript, attachments, or external links automatically.
12. Keep dependencies patched and maintain a software bill of materials.
13. Redact source content and learner answers from ordinary logs.
14. Encrypt data at rest only if key management is honest and usable. Do not advertise encryption when the key is stored beside the database.
15. Make backups explicit and local. Deletion must cover backups under PRISM's control.
16. Test malicious and oversized fixtures.
17. Require explicit action before opening an external link from source content.
18. Verify exported package manifests and never import executable lesson content.

Relevant guidance:
- OWASP HTML5 Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- NIST Generative AI Profile: https://doi.org/10.6028/NIST.AI.600-1

## 11.3 Model-risk controls

### Risk classes

- **Confabulation:** Unsupported factual text.
- **Attribution error:** Correct statement tied to wrong span.
- **Scope drift:** “May” becomes “does,” or one implementation becomes universal.
- **Omission:** A condition, exception, footnote, or negative case disappears.
- **Relation invention:** Correlation or order becomes causation.
- **Visual invention:** Diagram creates a node or edge not justified by source.
- **Rubric error:** Practice key is wrong or incomplete.
- **Self-consistency illusion:** Repeated model agreement hides shared bias.
- **Version drift:** Provider changes behavior without package changes.
- **Prompt injection from source:** Source text attempts to change compiler instructions.
- **Data exposure:** Model receives unauthorized source or learner content.

### Controls

- Source text is data, never instruction.
- Separate system instructions and source payload in adapters.
- Do not grant compiler tools that can modify files or permissions.
- Use fixed schemas.
- Validate source IDs.
- Review claims clause by clause.
- Use seeded adversarial errors.
- Keep provider and model revision in provenance.
- Lock packages.
- Require human review for critical content.
- Maintain a visible “generated and reviewed” status.
- Preserve source fallback.

## 11.4 Accessibility release gate

A release fails when any of these are true:

- Core task cannot be completed with keyboard.
- Focus is lost or trapped.
- Visual player and transcript differ in claims or order.
- Reduced-motion mode still depends on movement.
- A diagram has no useful long description.
- A table loses header associations.
- Math cannot be accessed in text or speech.
- Meaning depends only on color, position, or animation.
- A timed response is required.
- Text cannot reflow or zoom.
- Source evidence is inaccessible to assistive technology.
- Error and repair messages are not announced.
- A control has an ambiguous accessible name.

WCAG 2.2 is the minimum standard, not the full usability target: https://www.w3.org/TR/WCAG22/

## 11.5 Privacy model

### Data categories

| Category | Examples | Default retention | Cloud status |
|---|---|---|---|
| Source | PDF, extracted text, page images | Until user deletes | Never without per-source permission |
| Derived lesson | Claims, frames, diagrams, prompts | Until user deletes or package superseded | Generated locally or with approved cloud pass |
| Learner response | Answers, confidence, notes | Local until deleted | Separate per-action permission |
| Behavioral | Pause, rewind, Source, focus state | Local, configurable | No cloud need |
| Research | Scores, events, condition | Local until opt-in export | User-selected export |
| Operational | Cost, latency, model revision | Local, minimized | Provider returns metadata |
| Security | Error and audit records | Local, time-limited | Redacted |

### User controls

- Inspect stored documents and derived artifacts.
- Inspect cloud permissions and prior payload classes.
- Revoke future permission.
- Delete source and all derivatives.
- Export source-free research data.
- Disable telemetry while retaining reading.
- Disable model use.
- Clear model caches.
- Set local retention period.
- See whether a lesson was compiled locally or in cloud.
- See provider, purpose, and date.

### Disclosure language

Use exact language:

> “PRISM is local-first, not always-local. The source remains on this device unless you approve a named cloud pass. Before approval, PRISM shows the exact section and purpose. Learner answers and notes are excluded unless separately authorized.”

Do not say “private by design” without listing actual boundaries.

## 11.6 Copyright and source-use discipline

This dossier is not legal advice. Product behavior should remain conservative.

### V0

- Private, learner-only use.
- No public lesson marketplace.
- No shared transformed-text library.
- No public source visuals.
- No hosted copyrighted textbooks.
- Export warns when it contains source expression.
- The user records an asserted rights basis.
- The application does not certify fair use.
- Generated frames favor concise paraphrase and relation structure over long quotations.
- Citation and source inspection do not imply redistribution permission.

### Before sharing features

Obtain legal review on:

- User-to-user lesson sharing.
- Cloud storage of textbooks.
- Institutional deployment.
- Derivative lesson ownership.
- Model-provider rights and retention.
- Accessibility copies and exceptions.
- Copyright management information.
- Takedown procedures.
- Licensing of benchmark materials.

Official U.S. Copyright Office resources:
- https://www.copyright.gov/fair-use/
- https://www.copyright.gov/what-is-copyright/

## 11.7 User-facing disclosures

At first use:

> PRISM is an experimental technical-reading system. Generated frames may be incomplete or wrong. Use Source to inspect exact evidence. Preview supports orientation and is not evidence of mastery.

At generated content:

> Faithful paraphrase, supported by 2 source spans. Reviewed under compiler version X.

At inference:

> PRISM inference. This relation is derived from source claims rather than stated verbatim.

At analogy:

> Analogy. It is intended to clarify one relation and does not preserve every property.

At outside enrichment:

> Outside source. This content is not from the uploaded document.

At cloud permission:

> The selected pages and regions will leave this device for the stated pass. Notes and learner answers are excluded.

At delayed report:

> Seven-day performance is evidence from these items, not a general intelligence or course-mastery score.

## 11.8 Fail-closed and Source-mode rules

Immediately revert to Source mode when:

- Source span cannot be resolved.
- Parser confidence fails a critical element threshold.
- Claim is unsupported, contradicted, or materially incomplete.
- Figure or table binding is ambiguous.
- Equation symbols differ from source.
- Code trace has not been executed or verified.
- Diagram relation lacks an approved edge.
- Prompt lacks an approved answer and rubric.
- Accessibility equivalent is absent.
- Cloud permission is missing or stale.
- Package or provenance hash fails.
- Policy cannot explain its action.
- User asks to see original context.
- Model is unavailable and no approved cache exists.

Source mode is never framed as failure by the learner.

## 11.9 Evidence required for a public “faster learning” claim

A defensible claim requires all of the following:

1. A precise claim such as “For adults with low to moderate prior knowledge studying 1,000-word technical units, PRISM Study produced noninferior seven-day transfer with 18 percent lower median active time than the tested source reader.”
2. Preregistered primary outcome and analysis.
3. Adequately powered confirmatory study.
4. Validated, alternate-form assessments.
5. Seven-day delayed explanation and transfer.
6. Active-time definition and sensitivity analysis.
7. Source-fidelity audit.
8. Acceptable and balanced attrition.
9. No material workload, accessibility, or confidence-calibration harm.
10. Confidence interval that clears a justified noninferiority or superiority threshold.
11. Replication across more than one topic and source.
12. External or independent replication before broad “faster learning” marketing.
13. Public protocol, materials where legally possible, effect sizes, confidence intervals, and null findings.
14. Claim limited to the tested population, content, goal mode, and interface version.
15. Continued post-release monitoring and correction.

Immediate comprehension, completion rate, preference, or owner performance alone cannot support the claim.

## 11.10 Adversarial self-review

### Failure reason 1: The semantic canvas may be a worse reader

The sequential frame model could remove useful spatial context, parafoveal preview, and self-directed comparison. The stable canvas may feel calm while increasing navigation and integration cost.

**Revision made**

- Enhanced static reading is a first-class product and control.
- Autoplay is off.
- Previous frame and Source are always recoverable.
- The planner may select ordinary reading.
- Static reader versus semantic frames is the first ablation.
- The canvas is abandoned as default if delayed transfer or workload is worse.

### Failure reason 2: AI transformation may create an epistemically unsafe layer

A small rate of subtle source distortion is dangerous in systems, databases, networking, equations, and code. Provenance can create false reassurance if support checking is weak.

**Revision made**

- Immutable source layer and clause-level support.
- Typed origin categories.
- Critical checks cannot be averaged away.
- Manual-first golden lesson.
- Human review of high-risk assets.
- Source side-by-side for risky reconstructions.
- No study or publishing with critical or major errors.
- Model selection based on audited accepted output, not vendor benchmark claims.

### Failure reason 3: Strong component evidence may not survive integration

Retrieval, self-explanation, diagrams, signaling, and spacing each have evidence, but combining them can increase interruption, workload, and development complexity. Benefits may come entirely from the sparse prompt rather than the canvas.

**Revision made**

- One prompt at concept boundaries, not continuous quizzing.
- Explicit ablation sequence.
- Delayed transfer is primary.
- Workload and calibration are safety outcomes.
- Semantic stream without learning loop is a separate condition.
- Adaptation remains deterministic.
- The project stops expanding if the static reader or simpler condition performs as well.

### Additional failure reason: Solo scope may prevent scientific quality

A sophisticated compiler, accessible reader, model pipeline, and research protocol can exceed the available time.

**Revision made**

- One fixture and manual package first.
- Three-month goal is a research instrument, not a general product.
- Automation is added pass by pass.
- No mobile, sync, OCR, social, learned policy, or generic tutor.
- Each milestone has a hard definition of done and a fallback.

## 11.11 Ethical bottom line

PRISM is ethically preferable to many AI-learning concepts only if it is willing to:

- Show uncertainty.
- Preserve the source.
- Let ordinary reading win.
- Abstain.
- Avoid trait inference.
- Keep data local.
- Test delayed transfer.
- Publish negative results.
- Refuse claims that exceed evidence.

The system's boldness should come from the rigor of the experiment, not the confidence of the interface.

# 12. Final prioritized decision log

## 12.1 Top 10 decisions

| Priority | Decision | Rationale | Evidence label | Owner or role | Implementation implication | Validation needed | Reversal cost |
|---:|---|---|---|---|---|---|---|
| 1 | Build an enhanced static Source Reader before the semantic canvas | It is both the safest useful product and the baseline the canvas must beat | **Established baseline** | Product engineer + HCI | Import, structure, visuals, spans, navigation, accessibility | Source fidelity, keyboard, usability | Low |
| 2 | Make every published clause evidence-locked to immutable source spans | AI output and citations can still be unsupported; this is the core epistemic boundary | **Implementation requirement** | ML/NLP + backend | Canonical claims, clause spans, support checks, provenance | Audited clause support and seeded errors | Medium if done now, prohibitive if delayed |
| 3 | Implement the semantic experience as Traceable Semantic Relay, not RSVP | It preserves source, context, control, integration, and repair while remaining falsifiable | **Experimental** | Product + learning scientist | Anchor, Advance, Integrate, Repair cycle | Static reader comparison and ablations | Medium |
| 4 | Keep all advancement learner-controlled by default | Regressions and strategic rereading matter; forced timing risks comprehension | **Established / Promising** | Frontend + accessibility | Next, Back, pause, Source, transcript, no Study autoplay | Interaction logs, workload, delayed outcomes | Low |
| 5 | Use one active representation plus at most one stable anchor | Relevant integrated visuals can help, while extra representations and motion can overload | **Promising** | HCI + visual designer | Source visual first, typed diagram second, persistent anchor optional | Anchor ablation, workload, source use | Low-medium |
| 6 | Build one manually reviewed transaction-isolation lesson before automating compilation | It tests the player and learning hypothesis without hiding behind model quality | **Implementation strategy** | Principal engineer + domain reviewer | Manual JSON package, gold graph, item, repair | End-to-end pilot and package integrity | Low |
| 7 | Use sparse concept-boundary retrieval with source-linked repair | Retrieval and self-explanation are strong components, but interruption must be minimized | **Established components / Experimental package** | Learning scientist + frontend | One rubric-scored prompt, confidence after answer, one repair | D versus C condition, transfer not item repetition | Low |
| 8 | Use transparent deterministic adaptation only | Behavioral traces are ambiguous and outcome data are absent | **Promising / risk-controlled** | ML + research | Versioned rules, explanation receipt, override, fixed fallback | Rule replay, error cases, delayed outcomes | Low |
| 9 | Treat accessibility, privacy, and failure recovery as release gates | A dynamic technical reader can exclude users or expose sensitive sources if these are deferred | **Established standards / implementation requirement** | Accessibility + security + backend | Transcript, keyboard, reduced motion, loopback security, deletion, cloud permission | Manual and automated gate, threat tests | Medium if done now, high if delayed |
| 10 | Make seven-day transfer the primary product gate and forbid efficacy marketing before confirmation | Immediate fluency, preference, and completion can be misleading | **Established measurement principle / project governance** | Research lead + product owner | Delayed review, locked assessments, preregistration, claim review | Directional then confirmatory study | Low technically, high strategically |

## 12.2 Decision details

### Decision 1: Enhanced static reader

**Default:** Every supported source can be used without semantic compilation.  
**Revisit when:** The semantic canvas shows clear and replicated delayed benefit.  
**Failure signal:** Product team treats the reader as a temporary fallback and underinvests in it.

### Decision 2: Evidence locking

**Default:** No generated factual clause without source support.  
**Revisit when:** Never remove the rule. Future work may improve automation or calibration.  
**Failure signal:** A page-level citation is accepted for a multi-claim frame.

### Decision 3: Traceable Semantic Relay

**Default:** Experimental condition only until evidence.  
**Revisit when:** Static reader, phrase stream, or simpler frame sequence performs better.  
**Failure signal:** Team describes the interaction as proven or universally faster.

### Decision 4: Learner control

**Default:** Understand and Study are step-based.  
**Revisit when:** A narrow autoplay option is tested without loss and remains optional.  
**Failure signal:** Timing changes become hidden adaptation.

### Decision 5: Representation budget

**Default:** Text plus one relevant anchor.  
**Revisit when:** A specific task demonstrates benefit from a third coordinated representation.  
**Failure signal:** Visuals are added for engagement or branding.

### Decision 6: Manual first

**Default:** Gold package precedes AI package.  
**Revisit when:** Compiler passes match the human package on fidelity and package validity.  
**Failure signal:** The team measures model output quantity instead of approved lesson quality.

### Decision 7: Sparse loop

**Default:** One diagnostic boundary event per major relation.  
**Revisit when:** Ablation indicates prompts interrupt more than they help.  
**Failure signal:** The player becomes a sequence of questions.

### Decision 8: Deterministic adaptation

**Default:** Rule-based and reversible.  
**Revisit when:** Randomized delayed-outcome data meet the internal learned-policy gate.  
**Failure signal:** A recommendation cannot show exact inputs and rule.

### Decision 9: Release gates

**Default:** Accessibility, privacy, security, recovery, and fidelity failures block release.  
**Revisit when:** Standards evolve, to strengthen rather than weaken.  
**Failure signal:** “We will fix it after the pilot.”

### Decision 10: Claims discipline

**Default:** Describe mechanics and experimental intent, not learning acceleration.  
**Revisit when:** Confirmatory evidence supports a precise population and outcome claim.  
**Failure signal:** Marketing uses immediate scores or owner anecdotes.

## Build first

1. Enhanced static Source Reader.
2. Immutable source elements and spans.
3. Typed package contracts and provenance.
4. Manual transaction-isolation lesson.
5. Deterministic accessible player.
6. Source inspection and fallback.
7. One sparse explanation and repair.
8. Local telemetry and delayed-review scheduler.
9. Recovery, deletion, and permission tests.
10. Owner pilot protocol.

## Measure before building

1. Whether semantic frames outperform static reading.
2. Whether a persistent anchor helps or splits attention.
3. Optimal micro, meso, and macro frame boundaries.
4. Whether the previous frame is sufficient context.
5. Whether one boundary prompt improves seven-day transfer.
6. Whether repair adds value beyond feedback.
7. Whether Faster and Deeper bundles are understood and useful.
8. Whether transparent rule-based adaptation beats a fixed Study bundle.
9. Which source types can meet the fidelity gate.
10. Cost per approved lesson unit.

## Do not build yet

1. OCR for scanned textbooks.
2. Mobile, AR, VR, eye tracking, EEG, camera, or wearables.
3. User accounts, cloud sync, collaboration, or instructor dashboards.
4. Generic AI tutor chat.
5. Public lesson sharing.
6. Gamification, streaks, leaderboards, or engagement feeds.
7. Open-ended generated images.
8. Automatic note or essay generation.
9. Knowledge tracing in production.
10. Contextual bandits, deep learner models, or reinforcement learning.
11. Broad nonfiction support.
12. Public “faster learning” claims.

## Open research bets

1. **Traceable Semantic Relay:** Can evidence-locked representation handoffs improve delayed technical transfer?
2. **Persistent source anchor:** Can stable spatial context help without causing split attention?
3. **Relation-sensitive frame sizing:** Can frame size be selected from discourse structure rather than word count?
4. **Representation repair:** Does switching representation after a diagnosed relation error outperform replay?
5. **Source inspection as productive behavior:** Which patterns indicate verification rather than difficulty?
6. **Confidence-error repair:** Can high-confidence errors be corrected without reducing agency?
7. **Technical-state canvases:** Do local-state lanes improve distributed-system reasoning?
8. **Safe document compilation:** Can clause-level grounding reach a fidelity level suitable for unsupervised personal use?
9. **Noninferior learning with less active time:** Can PRISM save time without sacrificing seven-day transfer?
10. **Ordinary reading selection:** Can a planner learn when not to transform a passage while remaining interpretable?

---

# 13. Annotated bibliography

## How sources were selected

The bibliography favors systematic reviews, meta-analyses, strong primary experiments, foundational cognitive theories, peer-reviewed technical papers, standards bodies, and official technical documentation. Preprints and non-peer-reviewed technical sources are explicitly labeled. A source's inclusion does not mean every claim in it is accepted without qualification. It means the source materially informs a PRISM decision, boundary condition, benchmark, or implementation control.

## 13.1 Reading, discourse comprehension, and metacognition

### 1. Rayner, K., Schotter, E. R., Masson, M. E. J., Potter, M. C., and Treiman, R. (2016). *So Much to Read, So Little Time: How Do We Read, and Can Speed Reading Help?*

- **Evidence type:** Peer-reviewed integrative review in *Psychological Science in the Public Interest*.
- **Annotation:** Synthesizes eye-movement science, reading-rate evidence, skimming, RSVP, and commercial speed-reading claims. It argues that language processing and visual acquisition impose real constraints, and that very large speed gains generally involve a comprehension tradeoff.
- **PRISM relevance:** Provides the clearest basis for rejecting one-word RSVP and unsupported “full comprehension at extreme speed” claims while retaining Preview as a distinct gist goal.
- **Direct link:** https://doi.org/10.1177/1529100615623267

### 2. Schotter, E. R., Tran, R., and Rayner, K. (2014). *Don't Believe What You Read (Only Once): Comprehension Is Supported by Regressions During Reading.*

- **Evidence type:** Peer-reviewed controlled eye-tracking experiment.
- **Annotation:** Used gaze-contingent text changes to prevent useful rereading. Comprehension suffered when readers could not recover previously viewed material, particularly when reinterpretation was needed.
- **PRISM relevance:** Makes rewind, replay, visible prior context, and one-action source recovery non-negotiable in Understand and Study.
- **Direct link:** https://doi.org/10.1177/0956797614531148

### 3. Acklin, D., and Papesh, M. H. (2017). *Modern Speed-Reading Apps Do Not Foster Reading Comprehension.*

- **Evidence type:** Peer-reviewed experimental study.
- **Annotation:** Compared app-like rapid presentation with conventional reading and found no basis for claiming that modern speed-reading presentation preserves comprehension while greatly increasing rate.
- **PRISM relevance:** Supports using any timed semantic stream as an experimental representation rather than the default learning mechanism.
- **Direct link:** https://pubmed.ncbi.nlm.nih.gov/29461715/

### 4. Kintsch, W. (1988). *The Role of Knowledge in Discourse Comprehension: A Construction-Integration Model.*

- **Evidence type:** Foundational peer-reviewed cognitive theory with empirical grounding.
- **Annotation:** Describes comprehension as construction and integration of propositions into a coherent representation, constrained by knowledge and context rather than simple accumulation of sentences.
- **PRISM relevance:** Motivates canonical claims, concept relations, integration boundaries, and checks that target the governing relation rather than word recognition.
- **Direct link:** https://doi.org/10.1037/0033-295X.95.2.163

### 5. Zwaan, R. A., and Radvansky, G. A. (1998). *Situation Models in Language Comprehension and Memory.*

- **Evidence type:** Peer-reviewed theoretical review.
- **Annotation:** Reviews how readers build representations of entities, goals, causality, time, and space across discourse. It helps distinguish remembered wording from a usable model of the described situation.
- **PRISM relevance:** Supports designing technical frames around state, causality, sequence, and local viewpoints, especially for protocols and distributed systems.
- **Direct link:** https://doi.org/10.1037/0033-2909.123.2.162

### 6. Perfetti, C., and Stafura, J. (2014). *Word Knowledge in a Theory of Reading Comprehension.*

- **Evidence type:** Peer-reviewed theoretical synthesis.
- **Annotation:** Places lexical quality and word knowledge inside a broader reading-systems framework. Technical comprehension can fail because a key term or symbolic expression is weakly represented even when the surrounding prose appears fluent.
- **PRISM relevance:** Supports concept-local definitions, symbol ledgers, and prerequisite checks without treating vocabulary support as the whole learning problem.
- **Direct link:** https://doi.org/10.1080/10888438.2013.827687

### 7. McNamara, D. S., Kintsch, E., Songer, N. B., and Kintsch, W. (1996). *Are Good Texts Always Better? Interactions of Text Coherence, Background Knowledge, and Levels of Understanding in Learning From Text.*

- **Evidence type:** Peer-reviewed experimental research.
- **Annotation:** Shows that the effect of text coherence depends on learner knowledge and the level of understanding being measured. More explicit prose is not uniformly superior for every learner and outcome.
- **PRISM relevance:** Warns against indiscriminate simplification. PRISM should preserve qualifications and use scaffolds that can be faded or bypassed.
- **Direct link:** https://doi.org/10.1207/s1532690xci1401_1

### 8. Sweller, J. (1988). *Cognitive Load During Problem Solving: Effects on Learning.*

- **Evidence type:** Foundational peer-reviewed experimental and theoretical paper.
- **Annotation:** Distinguishes successful task completion from schema acquisition and explains how means-ends search can consume resources without producing efficient learning.
- **PRISM relevance:** Supports worked traces, explicit state models, and reduction of unproductive navigation while cautioning against using “cognitive load” as a vague label for anything visually complex.
- **Direct link:** https://doi.org/10.1207/s15516709cog1202_4

### 9. Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., and Willingham, D. T. (2013). *Improving Students' Learning With Effective Learning Techniques: Promising Directions From Cognitive and Educational Psychology.*

- **Evidence type:** Peer-reviewed broad evidence review.
- **Annotation:** Rates common learning techniques and identifies practice testing and distributed practice as high-utility approaches, while highlighting limitations of rereading, highlighting, and other familiar strategies.
- **PRISM relevance:** Justifies sparse retrieval and delayed review, but also warns against presenting polished summaries as sufficient study.
- **Direct link:** https://doi.org/10.1177/1529100612453266

### 10. Dunlosky, J., and Rawson, K. A. (2012). *Overconfidence Produces Underachievement: Inaccurate Self Evaluations Undermine Students' Learning and Retention.*

- **Evidence type:** Peer-reviewed experimental study.
- **Annotation:** Demonstrates how inaccurate judgments can cause learners to stop studying before material is actually learned.
- **PRISM relevance:** Supports pairing confidence with scored performance and delayed outcomes rather than using confidence as a mastery signal or speed-control trigger.
- **Direct link:** https://doi.org/10.1016/j.learninstruc.2011.08.003

### 11. Pashler, H., McDaniel, M., Rohrer, D., and Bjork, R. (2008). *Learning Styles: Concepts and Evidence.*

- **Evidence type:** Peer-reviewed critical review.
- **Annotation:** Finds inadequate evidence for matching instruction to fixed visual, auditory, or similar learning-style categories using the required crossover design.
- **PRISM relevance:** Rules out “visual learner” or “text learner” profiling. Representation choices should be tied to concept structure, accessibility needs, task goals, and observed outcomes.
- **Direct link:** https://doi.org/10.1111/j.1539-6053.2009.01038.x

## 13.2 Retrieval, spacing, self-explanation, examples, and organization

### 12. Rowland, C. A. (2014). *The Effect of Testing Versus Restudy on Retention: A Meta-Analytic Review of the Testing Effect.*

- **Evidence type:** Peer-reviewed meta-analysis.
- **Annotation:** Synthesizes evidence that retrieval practice improves later retention relative to restudy across many conditions, with moderators that matter for implementation.
- **PRISM relevance:** Supports concept-boundary retrieval, especially when followed by useful feedback, while not implying that every frame needs a question.
- **Direct link:** https://doi.org/10.1037/a0037559

### 13. Adesope, O. O., Trevisan, D. A., and Sundararajan, N. (2017). *Rethinking the Use of Tests: A Meta-Analysis of Practice Testing.*

- **Evidence type:** Peer-reviewed meta-analysis.
- **Annotation:** Finds a positive average effect of practice testing and evaluates moderators such as format, feedback, and retention interval.
- **PRISM relevance:** Supports sparse diagnostic checks and feedback, with item design selected for the governing relation rather than quiz volume.
- **Direct link:** https://doi.org/10.3102/0034654316689306

### 14. Pan, S. C., and Rickard, T. C. (2018). *Transfer of Test-Enhanced Learning: Meta-Analytic Review and Synthesis.*

- **Evidence type:** Peer-reviewed meta-analysis.
- **Annotation:** Examines whether retrieval benefits transfer to different questions or contexts. Transfer is positive on average but less automatic and more variable than retention of practiced material.
- **PRISM relevance:** Requires PRISM's primary outcome to include new-case application, not only repeated or paraphrased checkpoint items.
- **Direct link:** https://doi.org/10.1037/bul0000151

### 15. Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., and Rohrer, D. (2006). *Distributed Practice in Verbal Recall Tasks: A Review and Quantitative Synthesis.*

- **Evidence type:** Peer-reviewed meta-analysis.
- **Annotation:** Provides broad evidence that spacing study events improves long-term retention relative to massing.
- **PRISM relevance:** Justifies delayed review as part of the product's learning loop and not merely an optional reminder feature.
- **Direct link:** https://doi.org/10.1037/0033-2909.132.3.354

### 16. Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., and Pashler, H. (2008). *Spacing Effects in Learning: A Temporal Ridgeline of Optimal Retention.*

- **Evidence type:** Peer-reviewed large-scale experimental study.
- **Annotation:** Shows that the relationship between study gap and retention depends on the desired retention interval.
- **PRISM relevance:** Supports evaluating a 24-hour checkpoint separately from the seven-day durable-learning standard.
- **Direct link:** https://doi.org/10.1111/j.1467-9280.2008.02209.x

### 17. Bisra, K., Liu, Q., Nesbit, J. C., Salimi, F., and Winne, P. H. (2018). *Inducing Self-Explanation: A Meta-Analysis.*

- **Evidence type:** Peer-reviewed meta-analysis of 64 reports and 69 effects.
- **Annotation:** Finds a positive average effect of induced self-explanation with meaningful variation by task, prompt, and outcome.
- **PRISM relevance:** Supports brief causal or relational explanation prompts, but requires answerable, source-grounded rubrics and restraint in prompt frequency.
- **Direct link:** https://doi.org/10.1007/s10648-018-9434-x

### 18. Chi, M. T. H., Bassok, M., Lewis, M. W., Reimann, P., and Glaser, R. (1989). *Self-Explanations: How Students Study and Use Examples in Learning to Solve Problems.*

- **Evidence type:** Seminal peer-reviewed observational and experimental work.
- **Annotation:** Shows that successful learners often generate explanations that connect worked steps to principles rather than merely restating them.
- **PRISM relevance:** Motivates relation-based explanation prompts and repair that reveals why a step follows, particularly in code, equations, and transaction schedules.
- **Direct link:** https://doi.org/10.1207/s15516709cog1302_1

### 19. Atkinson, R. K., Derry, S. J., Renkl, A., and Wortham, D. (2000). *Learning From Examples: Instructional Principles From the Worked Examples Research.*

- **Evidence type:** Peer-reviewed review.
- **Annotation:** Synthesizes worked-example research and design principles, including example-problem sequencing, explanation, and fading.
- **PRISM relevance:** Supports fully worked state transitions before independent prediction for novice technical learners.
- **Direct link:** https://doi.org/10.3102/00346543070002181

### 20. Brunmair, M., and Richter, T. (2019). *Similarity Matters: A Meta-Analysis of Interleaved Learning and Its Moderators.*

- **Evidence type:** Peer-reviewed meta-analysis.
- **Annotation:** Finds that interleaving effects vary substantially and are especially connected to discrimination demands and similarity among categories.
- **PRISM relevance:** Supports later contrast practice between confusable technical concepts, not interleaving during initial mental-model construction by default.
- **Direct link:** https://doi.org/10.1037/bul0000209

### 21. Nesbit, J. C., and Adesope, O. O. (2006). *Learning With Concept and Knowledge Maps: A Meta-Analysis.*

- **Evidence type:** Peer-reviewed meta-analysis.
- **Annotation:** Finds positive average effects for concept and knowledge maps, with variation by use and instructional context.
- **PRISM relevance:** Supports a Preview map and relation graph as navigational and integrative aids, while not establishing that a map should replace source reading.
- **Direct link:** https://doi.org/10.3102/00346543076003413

## 13.3 Multimedia learning, diagrams, animation, and visual cognition

### 22. Noetel, M., Griffith, S., Delaney, O., Sanders, T., Parker, P., del Pozo Cruz, B., and Lonsdale, C. (2022). *Multimedia Design for Learning: An Overview of Reviews With Meta-Meta-Analysis.*

- **Evidence type:** Peer-reviewed overview of 29 reviews covering 1,189 studies and 78,177 participants.
- **Annotation:** Finds positive meta-analytic support for several multimedia design principles, with especially strong evidence for signaling and spatial or temporal contiguity in the included literature.
- **PRISM relevance:** Supports coordinated text and visuals, but also demonstrates that “multimedia” is a set of design decisions rather than a treatment that is automatically beneficial.
- **Direct link:** https://doi.org/10.3102/00346543211052329

### 23. Cromley, J. G., and Chen, R. (2025). *A Meta-Analysis of Richard Mayer's Multimedia Learning Research: Searching for Boundary Conditions of Design Principles Across Multiple Media Types.*

- **Evidence type:** Peer-reviewed meta-analysis of 92 articles, 181 studies, and 591 effects.
- **Annotation:** Reassesses multimedia-learning principles across different media and searches for boundary conditions rather than assuming uniform effects.
- **PRISM relevance:** Supports an evidence-weighted representation planner and reinforces that medium, learner, content, and implementation moderate outcomes.
- **Direct link:** https://doi.org/10.1016/j.edurev.2025.100730

### 24. Schneider, S., Beege, M., Nebel, S., and Rey, G. D. (2018). *A Meta-Analysis of How Signaling Affects Learning With Media.*

- **Evidence type:** Peer-reviewed meta-analysis.
- **Annotation:** Reports positive average effects of signaling on retention and transfer, while also examining learning time, cognitive load, and visual attention.
- **PRISM relevance:** Supports restrained highlighting of the active relation, diagram node, code line, or table dimension. It does not justify excessive color, motion, or simultaneous cues.
- **Direct link:** https://doi.org/10.1016/j.edurev.2017.11.001

### 25. Ginns, P. (2006). *Integrating Information: A Meta-Analysis of the Spatial Contiguity and Temporal Contiguity Effects.*

- **Evidence type:** Peer-reviewed meta-analysis.
- **Annotation:** Synthesizes evidence that mutually dependent information is generally learned better when presented near each other in space or time rather than forcing mental integration across separated sources.
- **PRISM relevance:** Supports keeping explanation adjacent to the relevant code, equation, table, or diagram region and minimizing unnecessary visual search.
- **Direct link:** https://doi.org/10.1016/j.learninstruc.2006.10.001

### 26. Schroeder, N. L., and Cenkci, A. T. (2018). *Spatial Contiguity and Spatial Split-Attention Effects in Multimedia Learning Environments: A Meta-Analysis.*

- **Evidence type:** Peer-reviewed meta-analysis.
- **Annotation:** Examines the benefit of integrating corresponding verbal and visual information rather than spatially separating it.
- **PRISM relevance:** Supports a persistent visual only when the active text can remain perceptually associated with the relevant visual region. A distant decorative sidebar is not enough.
- **Direct link:** https://doi.org/10.1007/s10648-018-9435-9

### 27. Höffler, T. N., and Leutner, D. (2007). *Instructional Animation Versus Static Pictures: A Meta-Analysis.*

- **Evidence type:** Peer-reviewed meta-analysis.
- **Annotation:** Finds an average animation advantage under some conditions, with important moderation by representational and instructional characteristics.
- **PRISM relevance:** Supports animation only when motion or continuous change is part of the concept, not as a general engagement treatment.
- **Direct link:** https://doi.org/10.1016/j.learninstruc.2007.09.013

### 28. Berney, S., and Bétrancourt, M. (2016). *Does Animation Enhance Learning? A Meta-Analysis.*

- **Evidence type:** Peer-reviewed meta-analysis.
- **Annotation:** Reports a modest average benefit for animation while emphasizing heterogeneity and design conditions.
- **PRISM relevance:** Supports static or learner-stepped state sequences as the default and short reversible animations only when they add information that a static comparison cannot convey efficiently.
- **Direct link:** https://doi.org/10.1016/j.compedu.2015.12.020

### 29. Ayres, P., and Paas, F. (2007). *Can the Cognitive Load Approach Make Instructional Animations More Effective?*

- **Evidence type:** Peer-reviewed theoretical review grounded in experimental evidence.
- **Annotation:** Develops the transient-information explanation: earlier information disappears while later information is processed, creating integration demands that can overwhelm learners.
- **PRISM relevance:** Directly motivates user-controlled stepping, visible previous state, replay, static alternatives, and avoidance of forced continuous animation.
- **Direct link:** https://doi.org/10.1002/acp.1343

### 30. Larkin, J. H., and Simon, H. A. (1987). *Why a Diagram Is (Sometimes) Worth Ten Thousand Words.*

- **Evidence type:** Foundational peer-reviewed cognitive analysis.
- **Annotation:** Explains how diagrams can group related information and make some inferences perceptually efficient, while recognizing that their advantage depends on the task and representation.
- **PRISM relevance:** Supports diagrams for topology, state, containment, timing, and causality, but not for qualifications whose force depends on precise language.
- **Direct link:** https://doi.org/10.1111/j.1551-6708.1987.tb00863.x

### 31. Rexigel, E., Kuhn, J., Becker, S., and Malone, S. (2024). *The More the Better? A Systematic Review and Meta-Analysis of the Benefits of More Than Two External Representations in STEM Education.*

- **Evidence type:** Peer-reviewed systematic review and meta-analysis.
- **Annotation:** Finds a small average benefit for more than two representations with high heterogeneity and meaningful moderation by instructional support.
- **PRISM relevance:** Supports optional representational repair and comparison, while arguing against displaying every available representation at once.
- **Direct link:** https://doi.org/10.1007/s10648-024-09958-y

### 32. Luck, S. J., and Vogel, E. K. (1997). *The Capacity of Visual Working Memory for Features and Conjunctions.*

- **Evidence type:** Seminal peer-reviewed experimental study.
- **Annotation:** Demonstrates sharply limited visual working-memory capacity under the tested conditions.
- **PRISM relevance:** Supports a quiet canvas, stable object identity, limited simultaneous emphasis, and low visual density. It does not provide a universal “four items” interface rule for all tasks.
- **Direct link:** https://doi.org/10.1038/36846

### 33. Rensink, R. A. (2002). *Change Detection.*

- **Evidence type:** Peer-reviewed review of change blindness and visual attention.
- **Annotation:** Reviews evidence that substantial scene changes can go unnoticed when attention and continuity are disrupted.
- **PRISM relevance:** Supports stable coordinates, explicit change cues, before-and-after comparison, and avoidance of unexplained diagram rearrangement.
- **Direct link:** https://doi.org/10.1146/annurev.psych.53.100901.135125

### 34. Mayer, R. E. (2023). *The Past, Present, and Future of the Cognitive Theory of Multimedia Learning.*

- **Evidence type:** Peer-reviewed theoretical review by the theory's principal developer.
- **Annotation:** Reviews the evolution, evidence base, open questions, and future direction of the cognitive theory of multimedia learning.
- **PRISM relevance:** Provides a coherent framework for selecting, organizing, and integrating representations while leaving PRISM's complete interaction model as an empirical question.
- **Direct link:** https://doi.org/10.1007/s10648-023-09842-1

## 13.4 Adaptive learning, intelligent tutoring, and learner models

### 35. Kulik, J. A., and Fletcher, J. D. (2016). *Effectiveness of Intelligent Tutoring Systems: A Meta-Analytic Review.*

- **Evidence type:** Peer-reviewed meta-analysis.
- **Annotation:** Finds positive average effects for intelligent tutoring systems across a heterogeneous body of studies and systems.
- **PRISM relevance:** Shows that adaptive, feedback-rich systems can help, but does not license applying ITS effect sizes to a document reader with a lightweight learner model.
- **Direct link:** https://doi.org/10.3102/0034654315581420

### 36. Ma, W., Adesope, O. O., Nesbit, J. C., and Liu, Q. (2014). *Intelligent Tutoring Systems and Learning Outcomes: A Meta-Analysis.*

- **Evidence type:** Peer-reviewed meta-analysis.
- **Annotation:** Synthesizes learning outcomes across intelligent tutoring systems and compares them with several instructional alternatives.
- **PRISM relevance:** Supports eventually testing targeted adaptation, while emphasizing that positive effects emerge from complete instructional systems rather than opaque pacing alone.
- **Direct link:** https://doi.org/10.1037/a0037123

### 37. Steenbergen-Hu, S., and Cooper, H. (2014). *A Meta-Analysis of the Effectiveness of Intelligent Tutoring Systems on College Students' Academic Learning.*

- **Evidence type:** Peer-reviewed meta-analysis focused on college learners.
- **Annotation:** Examines ITS effects in higher education, making it more population-relevant than many K-12 tutoring studies.
- **PRISM relevance:** Offers indirect support for diagnostic guidance in PRISM's initial college-learner population, but not for any specific semantic-canvas policy.
- **Direct link:** https://doi.org/10.1037/a0034752

### 38. Corbett, A. T., and Anderson, J. R. (1994). *Knowledge Tracing: Modeling the Acquisition of Procedural Knowledge.*

- **Evidence type:** Foundational peer-reviewed modeling paper.
- **Annotation:** Introduces Bayesian knowledge tracing for estimating latent skill acquisition from sequences of practice opportunities and responses.
- **PRISM relevance:** Defines one later modeling option, but also exposes why PRISM v0 lacks the repeated, well-labeled skill opportunities required for credible use.
- **Direct link:** https://doi.org/10.1007/BF01099821

### 39. Piech, C., Bassen, J., Huang, J., Ganguli, S., Sahami, M., Guibas, L. J., and Sohl-Dickstein, J. (2015). *Deep Knowledge Tracing.*

- **Evidence type:** Peer-reviewed NeurIPS conference paper.
- **Annotation:** Applies recurrent neural networks to sequences of learner responses and stimulated extensive later work on predictive learner modeling.
- **PRISM relevance:** A useful later benchmark, but inappropriate for v0 because predictive accuracy alone does not establish causal instructional value, interpretability, or fairness.
- **Direct link:** https://papers.nips.cc/paper_files/paper/2015/hash/bac9162b47c56fc8a4d2a519803d51b3-Abstract.html

### 40. Baker, R. S., and Inventado, P. S. (2014). *Educational Data Mining and Learning Analytics.*

- **Evidence type:** Scholarly book chapter and field overview.
- **Annotation:** Reviews common educational trace-data methods and the interpretation problems involved in inferring learner states from behavior.
- **PRISM relevance:** Supports cautious telemetry design, construct validation, and resistance to interpreting a pause, rewind, or fast answer as a direct mental-state measurement.
- **Direct link:** https://doi.org/10.1007/978-1-4614-3305-7_4

## 13.5 Document parsing, multimodal document intelligence, and grounding

The model papers in this section are evidence about methods and failure surfaces, not permanent product recommendations. PRISM should select providers against its own golden fixtures and rerun evaluations whenever a model, parser, or prompt changes.

### 41. Huang, Y. et al. (2022). *LayoutLMv3: Pre-Training for Document AI With Unified Text and Image Masking.*

- **Evidence type:** Peer-reviewed ACM Multimedia paper.
- **Annotation:** Presents a multimodal pretraining method that integrates text and image information for document-understanding tasks.
- **PRISM relevance:** Demonstrates why layout, visual regions, and text should remain linked in document representations. It does not remove the need for deterministic source objects and page-region validation.
- **Direct link:** https://arxiv.org/abs/2204.08387

### 42. Kim, G. et al. (2022). *OCR-Free Document Understanding Transformer.*

- **Evidence type:** Peer-reviewed ECCV paper, commonly known as Donut.
- **Annotation:** Shows an end-to-end visual document understanding approach that can avoid a separate OCR stage for selected tasks.
- **PRISM relevance:** Provides a useful fallback candidate for visually complex pages, while reinforcing that end-to-end outputs still require region-level evidence checks before publication.
- **Direct link:** https://arxiv.org/abs/2111.15664

### 43. Pfitzmann, B. et al. (2022). *DocLayNet: A Large Human-Annotated Dataset for Document-Layout Analysis.*

- **Evidence type:** Peer-reviewed KDD workshop or dataset paper with released annotations.
- **Annotation:** Provides diverse page-layout annotations across multiple document categories, including scientific and technical material.
- **PRISM relevance:** Useful for evaluating or fine-tuning element classification and for constructing difficult mixed-layout fixtures beyond clean prose pages.
- **Direct link:** https://arxiv.org/abs/2206.01062

### 44. Smock, B., Pesala, R., and Abraham, R. (2021). *PubTables-1M: Towards Comprehensive Table Extraction From Unstructured Documents.*

- **Evidence type:** Peer-reviewed CVPR paper and large dataset.
- **Annotation:** Introduces a large dataset and canonicalization process for table detection, structure recognition, and functional analysis in scientific documents.
- **PRISM relevance:** Supports separate table-region, structure, and cell-mapping gates. A table cannot be treated as ordinary reading-order text.
- **Direct link:** https://arxiv.org/abs/2110.00061

### 45. Li, M. et al. (2019). *TableBank: Table Benchmark for Image-Based Table Detection and Recognition.*

- **Evidence type:** Peer-reviewed LREC paper and benchmark dataset.
- **Annotation:** Provides document images and structural information for table detection and recognition across Word and LaTeX sources.
- **PRISM relevance:** Useful as an auxiliary table fixture source, though its synthetic source-generation characteristics differ from arbitrary textbooks.
- **Direct link:** https://arxiv.org/abs/1903.01949

### 46. Blecher, L., Cucurull, G., Scialom, T., and Stojnic, R. (2023). *Nougat: Neural Optical Understanding for Academic Documents.*

- **Evidence type:** Peer-reviewed ICLR 2024 paper.
- **Annotation:** Presents a visual transformer approach for converting academic document pages into markup, including mathematical expressions.
- **PRISM relevance:** Demonstrates the potential of page-image-to-markup systems for equations and scientific structure, while leaving equation verification and source-image fallback mandatory.
- **Direct link:** https://arxiv.org/abs/2308.13418

### 47. Mathew, M., Karatzas, D., and Jawahar, C. V. (2021). *DocVQA: A Dataset for VQA on Document Images.*

- **Evidence type:** Peer-reviewed WACV paper and benchmark.
- **Annotation:** Formalizes question answering over document images and provides a benchmark for visually grounded document understanding.
- **PRISM relevance:** Useful for provider evaluation, but answer accuracy alone is insufficient because PRISM also needs exact source attribution and faithful transformation.
- **Direct link:** https://arxiv.org/abs/2007.00398

### 48. Masry, A. et al. (2022). *ChartQA: A Benchmark for Question Answering About Charts With Visual and Logical Reasoning.*

- **Evidence type:** Peer-reviewed Findings of ACL paper and benchmark.
- **Annotation:** Evaluates visual and arithmetic reasoning over charts using both human-written and generated questions.
- **PRISM relevance:** Provides fixtures for chart interpretation and highlights the need to preserve quantitative values, labels, units, and source regions.
- **Direct link:** https://aclanthology.org/2022.findings-acl.177/

### 49. Ouyang, L. et al. (2025). *OmniDocBench: Benchmarking Diverse PDF Document Parsing With Comprehensive Annotations.*

- **Evidence type:** Peer-reviewed CVPR 2025 paper and benchmark.
- **Annotation:** Evaluates PDF parsing across nine document sources with fine-grained annotations for diverse layouts and content types.
- **PRISM relevance:** Strong evidence that document parsing should be measured by element and source class rather than treated as a solved binary import step.
- **Direct link:** https://openaccess.thecvf.com/content/CVPR2025/html/Ouyang_OmniDocBench_Benchmarking_Diverse_PDF_Document_Parsing_with_Comprehensive_Annotations_CVPR_2025_paper.html

### 50. Zhang, J. et al. (2025). *OCR Hinders RAG: Evaluating the Cascading Impact of OCR on Retrieval-Augmented Generation.*

- **Evidence type:** Peer-reviewed ICCV 2025 paper introducing OHRBench.
- **Annotation:** Measures how OCR errors propagate through retrieval and question answering over unstructured PDFs rather than evaluating OCR in isolation.
- **PRISM relevance:** Supports end-to-end golden fixtures and fail-closed behavior. A parser can appear adequate at character level while still corrupting downstream explanation and evidence selection.
- **Direct link:** https://openaccess.thecvf.com/content/ICCV2025/html/Zhang_OCR_Hinders_RAG_Evaluating_the_Cascading_Impact_of_OCR_on_ICCV_2025_paper.html

### 51. Ma, D. et al. (2026). *CiteVQA: Benchmarking Evidence Attribution for Trustworthy Document Intelligence.*

- **Evidence type:** **Preprint, not peer reviewed as of the research cutoff.**
- **Annotation:** Requires both an answer and element-level bounding-box citations, exposing cases where a model answers correctly while citing the wrong evidence.
- **PRISM relevance:** Closely matches PRISM's fidelity problem and supports strict attributed accuracy rather than answer-only evaluation.
- **Direct link:** https://arxiv.org/abs/2605.12882

### 52. Feng, X. et al. (2026). *DocScope: Benchmarking Verifiable Reasoning for Trustworthy Long-Document Understanding.*

- **Evidence type:** **Preprint, not peer reviewed as of the research cutoff.**
- **Annotation:** Evaluates a structured reasoning trajectory with evidence pages, evidence regions, factual statements, and final answers over long visually rich documents.
- **PRISM relevance:** Supports evaluating each grounding stage independently rather than accepting a final lesson because its prose sounds correct.
- **Direct link:** https://arxiv.org/abs/2605.08888

### 53. Wei, H. et al. (2026). *XL-DocBench: Benchmarking Evidence-Grounded Extra-Long Document Understanding.*

- **Evidence type:** **Preprint, not peer reviewed as of the August 21, 2026 cutoff.**
- **Annotation:** Targets extra-long document understanding with human-verified questions and evidence grounding across professional domains.
- **PRISM relevance:** Informs later textbook-scale retrieval evaluation, but does not justify transforming an entire large book in one model call.
- **Direct link:** https://arxiv.org/abs/2608.00036

### 54. Gao, T. et al. (2023). *Enabling Large Language Models to Generate Text With Citations.*

- **Evidence type:** Peer-reviewed EMNLP paper introducing the ALCE benchmark and evaluation framework.
- **Annotation:** Evaluates citation correctness, completeness, and answer quality for long-form generation supported by retrieved evidence.
- **PRISM relevance:** Supports clause-level citation and completeness checks while showing that fluent cited generation still requires dedicated attribution evaluation.
- **Direct link:** https://aclanthology.org/2023.emnlp-main.398/

### 55. Geng, S. et al. (2025). *JSONSchemaBench: A Rigorous Benchmark of Structured Outputs for Language Models.*

- **Evidence type:** **Preprint, not peer reviewed as of the research cutoff.**
- **Annotation:** Evaluates schema-constrained generation and the reliability of structured outputs under varied schemas and methods.
- **PRISM relevance:** Supports provider-specific schema testing and demonstrates that syntactic validity must be measured separately from source fidelity and pedagogical quality.
- **Direct link:** https://arxiv.org/abs/2501.10868

### 56. Moreau, L., and Missier, P., editors (2013). *PROV-O: The PROV Ontology.*

- **Evidence type:** W3C Recommendation, not an empirical learning study.
- **Annotation:** Defines a standard vocabulary for entities, activities, agents, derivations, attribution, and provenance relationships.
- **PRISM relevance:** Provides the conceptual foundation for source, parser, compiler-pass, model, approval, and lesson-package provenance.
- **Direct link:** https://www.w3.org/TR/prov-o/

### 57. JSON Schema (2020-12). *JSON Schema Core and Validation Specifications.*

- **Evidence type:** Open technical specification, not peer reviewed.
- **Annotation:** Defines a portable vocabulary for structural and validation constraints on JSON documents.
- **PRISM relevance:** Supports versioned lesson-package contracts and provider-independent validation, while not addressing factual support.
- **Direct link:** https://json-schema.org/draft/2020-12

### 58. pypdfium2 project. *Python Bindings to PDFium Documentation.*

- **Evidence type:** Official open-source technical documentation, not peer reviewed.
- **Annotation:** Documents PDF rendering, text-page access, coordinate conversion, bitmap handling, and PDFium resource management.
- **PRISM relevance:** Supports the chosen clean-PDF extraction and source-region layer. The API must be wrapped behind PRISM's own versioned source-element interface.
- **Direct link:** https://pypdfium2.readthedocs.io/

### 59. SQLite project. *Write-Ahead Logging.*

- **Evidence type:** Official technical documentation, not peer reviewed.
- **Annotation:** Documents WAL behavior, concurrency characteristics, checkpoints, limitations, and operational considerations.
- **PRISM relevance:** Supports the chosen local persistence architecture and identifies recovery, checkpoint, backup, and network-filesystem constraints that tests must cover.
- **Direct link:** https://www.sqlite.org/wal.html

### 60. FastAPI project. *Response Model and Data Validation Documentation.*

- **Evidence type:** Official technical documentation, not peer reviewed.
- **Annotation:** Describes typed request and response validation and automatic schema generation in the selected backend framework.
- **PRISM relevance:** Supports contract enforcement at API boundaries, with the caveat that Pydantic-valid content can still be pedagogically or factually wrong.
- **Direct link:** https://fastapi.tiangolo.com/tutorial/response-model/

## 13.6 Accessibility, privacy, security, copyright, and prior art

### 61. World Wide Web Consortium (2023). *Web Content Accessibility Guidelines (WCAG) 2.2.*

- **Evidence type:** W3C Recommendation and normative accessibility standard, not an empirical learning study.
- **Annotation:** Defines testable success criteria for keyboard access, focus, contrast, reflow, motion, timing, flashing, input, and other accessibility requirements.
- **PRISM relevance:** Establishes the minimum release gate for the player, Source mode, prompts, reports, and generated representations.
- **Direct link:** https://www.w3.org/TR/WCAG22/

### 62. World Wide Web Consortium (2021). *Accessible Rich Internet Applications (WAI-ARIA) 1.2.*

- **Evidence type:** W3C Recommendation.
- **Annotation:** Defines roles, states, and properties for exposing dynamic web application semantics to assistive technologies.
- **PRISM relevance:** Supports semantic frame status, progress, prompts, dialogs, controls, and live updates, while reinforcing the rule to prefer native HTML where possible.
- **Direct link:** https://www.w3.org/TR/wai-aria-1.2/

### 63. World Wide Web Consortium. *WAI-ARIA Authoring Practices Guide.*

- **Evidence type:** Official implementation guidance, not a normative standard or empirical study.
- **Annotation:** Provides keyboard and focus patterns for common interactive widgets.
- **PRISM relevance:** Helps implement predictable dialogs, tabs, disclosures, tooltips, and composite controls without inventing inaccessible interaction conventions.
- **Direct link:** https://www.w3.org/WAI/ARIA/apg/

### 64. World Wide Web Consortium (2021). *Making Content Usable for People With Cognitive and Learning Disabilities.*

- **Evidence type:** W3C Working Group Note and user-centered guidance.
- **Annotation:** Covers clear language, predictable interfaces, orientation, help, memory support, and reduction of unnecessary cognitive barriers.
- **PRISM relevance:** Supports stable placement, visible context, plain control labels, error recovery, and user control while avoiding the claim that a single canvas is inherently cognitively accessible.
- **Direct link:** https://www.w3.org/TR/coga-usable/

### 65. World Wide Web Consortium. *Media Queries Level 5: prefers-reduced-motion.*

- **Evidence type:** Web platform specification.
- **Annotation:** Defines the user preference signal that allows interfaces to reduce nonessential motion.
- **PRISM relevance:** Required for replacing transitions and animation with immediate state changes or static sequences without losing information.
- **Direct link:** https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion

### 66. World Wide Web Consortium (2018). *Scalable Vector Graphics (SVG) 2.*

- **Evidence type:** W3C Candidate Recommendation and technical specification.
- **Annotation:** Defines interoperable vector graphics, text, structure, coordinate systems, and accessibility-relevant elements for the web.
- **PRISM relevance:** Supports rendering the typed diagram grammar as inspectable browser-native vectors rather than arbitrary generated images.
- **Direct link:** https://www.w3.org/TR/SVG2/

### 67. World Wide Web Consortium. *MathML Core.*

- **Evidence type:** Web platform specification.
- **Annotation:** Defines a browser-oriented subset of MathML for accessible mathematical layout and semantics.
- **PRISM relevance:** Supports equation rendering with machine-readable structure and screen-reader alternatives, while source LaTeX remains preserved for fidelity.
- **Direct link:** https://www.w3.org/TR/mathml-core/

### 68. National Institute of Standards and Technology. *NIST Privacy Framework.*

- **Evidence type:** Official risk-management framework.
- **Annotation:** Organizes privacy risk around identifying, governing, controlling, communicating, and protecting data processing.
- **PRISM relevance:** Supports local data inventories, purpose limitation, transparent cloud permissions, deletion, and user control over processing.
- **Direct link:** https://www.nist.gov/privacy-framework

### 69. National Institute of Standards and Technology (2023). *Artificial Intelligence Risk Management Framework (AI RMF 1.0).* 

- **Evidence type:** Official voluntary risk-management framework.
- **Annotation:** Defines governance and lifecycle practices for trustworthy AI systems, including validity, reliability, transparency, privacy, fairness, and accountability.
- **PRISM relevance:** Supports provider evaluation, version control, monitoring, documented limitations, and human authority over release decisions.
- **Direct link:** https://doi.org/10.6028/NIST.AI.100-1

### 70. National Institute of Standards and Technology (2024). *Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile, NIST AI 600-1.*

- **Evidence type:** Official NIST profile, not an empirical benchmark.
- **Annotation:** Applies AI RMF practices to generative-AI risks such as confabulation, data privacy, information integrity, human oversight, and evaluation.
- **PRISM relevance:** Supports treating generated explanations and diagrams as untrusted candidates and defining measurable fidelity gates and fail-closed behavior.
- **Direct link:** https://doi.org/10.6028/NIST.AI.600-1

### 71. OWASP Foundation. *HTML5 Security Cheat Sheet.*

- **Evidence type:** Practitioner security guidance, not peer reviewed.
- **Annotation:** Warns against storing sensitive information in browser local storage and documents common web-platform security concerns.
- **PRISM relevance:** Supports a loopback backend, protected local files, a restrictive Content Security Policy, and no source-text persistence in localStorage.
- **Direct link:** https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html

### 72. U.S. Copyright Office. *Fair Use Index and Copyright Basics.*

- **Evidence type:** Official legal information, not legal advice and not a substitute for counsel.
- **Annotation:** Explains that fair use is fact-specific and summarizes the rights granted by copyright law.
- **PRISM relevance:** Supports private-by-default processing, no automatic redistribution, minimal verbatim generation, license metadata, deletion, and legal review before public lesson sharing.
- **Direct links:** https://www.copyright.gov/fair-use/ and https://www.copyright.gov/what-is-copyright/

### 73. Kleppmann, M. et al. (2019). *Local-First Software: You Own Your Data, in Spite of the Cloud.*

- **Evidence type:** Influential technical essay and design manifesto, not peer reviewed.
- **Annotation:** Defines local-first principles including offline capability, user data ownership, longevity, and optional collaboration.
- **PRISM relevance:** Clarifies that local-first is a product architecture and control model, not merely a marketing statement that data happens to be cached locally.
- **Direct link:** https://www.inkandswitch.com/local-first/

### 74. McNamara, D. S., Levinstein, I. B., and Boonthum, C. (2004). *iSTART: Interactive Strategy Training for Active Reading and Thinking.*

- **Evidence type:** Peer-reviewed system and early evaluation paper.
- **Annotation:** Describes a web-based system that trains self-explanation and active reading strategies for science text and adapts feedback to learner performance.
- **PRISM relevance:** Important prior art for source-centered comprehension support, self-explanation, and adaptive feedback. PRISM must differentiate through evidence-locked representation relay and a quieter learner-controlled reading surface, not by claiming to invent automated reading support.
- **Direct link:** https://doi.org/10.3758/BF03195567

### 75. Graesser, A. C. et al. (2004). *AutoTutor: A Tutor With Dialogue in Natural Language.*

- **Evidence type:** Peer-reviewed system paper.
- **Annotation:** Describes a natural-language tutoring environment that uses dialogue, feedback, and pedagogical agents.
- **PRISM relevance:** Important prior art for open-ended responses and conversational repair. It supports keeping PRISM reading-centered rather than turning the product into a generic tutor chatbot.
- **Direct link:** https://pubmed.ncbi.nlm.nih.gov/15354683/

### 76. De Bra, P., Aerts, A., Berden, B., de Lange, B., Rousseau, B., Santic, T., Smits, D., and Stash, N. (2003). *AHA! The Adaptive Hypermedia Architecture.*

- **Evidence type:** Peer-reviewed ACM Hypertext conference paper.
- **Annotation:** Describes a general adaptive hypermedia engine that maintains a user model and changes page or link presentation.
- **PRISM relevance:** Prior art for user-model-driven content adaptation. PRISM's distinctive burden is to make each rule inspectable, evidence-seeking, reversible, and evaluated against delayed transfer.
- **Direct link:** https://doi.org/10.1145/900051.900068

### 77. Spritz Technology. *Serial Text Display for Optimal Recognition Apparatus and Method.*

- **Evidence type:** Published patent application, legal prior-art source, not evidence of learning effectiveness.
- **Annotation:** Describes RSVP-style serial presentation with an aligned recognition position and related display methods.
- **PRISM relevance:** Establishes commercial and technical prior art for one-location word presentation. PRISM should not claim novelty for serial text display and should distinguish itself through semantic relations, source grounding, learner control, and delayed learning evaluation.
- **Direct link:** https://patents.google.com/patent/US20140016867A1/en

## Bibliography coverage note

The bibliography contains 77 sources and standards across reading science, discourse comprehension, metacognition, learning science, multimedia learning, visual cognition, adaptive systems, document AI, evidence grounding, structured output, provenance, accessibility, privacy, security, copyright, and product prior art. Preprints, patents, specifications, and practitioner documentation are labeled so they are not mistaken for settled peer-reviewed evidence.

---

# Closing research position

PRISM has a credible path precisely because it is willing to discover that ordinary reading wins. The project should proceed as a source-fidelity system, an accessible technical reader, and a controlled experiment before it proceeds as an adaptive AI learning product.

The first meaningful success is not a dramatic animation or a complete textbook conversion. It is a single transaction-isolation lesson in which every transformed clause can be inspected, every state can be recovered, every representation can fail closed, and a seven-day transfer result can be compared honestly with an enhanced static source reader.

If that vertical slice works, PRISM earns the right to automate more of the compiler. If it does not, the research still produces a valuable result: a better source reader, a validated data model, a document-fidelity benchmark, and clear evidence about which representation mechanisms should be removed.
