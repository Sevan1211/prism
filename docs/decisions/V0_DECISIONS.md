# PRISM v0 decision record

**Decision sessions:** 2026-08-19, 2026-08-23, 2026-08-26, and product alignment on 2026-08-29  
**Status:** confirmed unless explicitly marked open  
**Owner:** project owner

This is the current source of truth for PRISM’s v0 product and research direction. Evidence requirements in `AGENTS.md` and the validation plan still govern implementation; an owner preference does not convert an experimental mechanism into an established claim.

> **Precedence:** the owner decisions in section 11 supersede incompatible earlier delivery and interaction choices. In particular, the hosted browser-local product now precedes the owner-only desktop research instrument; the composed interactive lesson is primary; TSR is an optional experimental renderer; and final lesson questions replace in-flow diagnostic prompts in the challenge product.

## 1. Governing vision

- PRISM’s end goal is a genuinely new, cutting-edge way to absorb and learn information quickly—not merely a better reader or RSVP clone.
- Durable, transferable learning always outranks raw display speed.
- The primary proof of learning is the ability to explain the governing idea accurately and apply it to a new case.
- Conceptual transfer normally outranks exact recall. Exact wording, values, symbols, definitions, and ordered steps remain required when precision is inherent to the content.
- The central durability horizon is seven days. A 24-hour test is an interim diagnostic.
- The initial product promise is staged: understand in one session, then verify retention and application seven days later.
- The bold long-range research target is equal durable learning in half the active time. This is an aspiration, not a public claim.
- PRISM may decide that normal self-paced source reading is the best representation for a passage or learner.
- The enhanced static Source Reader is a first-class product surface and the primary baseline that experimental semantic presentation must beat or complement.

## 2. Core experience

- The one-screen canvas is the preferred north star, not an absolute restriction. Source inspection, concept maps, editing, and assessment may expand when that materially supports learning.
- Activity is adaptive by mode:
  - Preview is mostly watchable and supports orientation;
  - Understand uses learner-controlled Traceable Semantic Relay with sparse optional conceptual checks;
  - Study uses learner-controlled TSR, explanation, application, source-linked repair, and delayed review.
- **Decision recorded 2026-08-23:** Traceable Semantic Relay is the official name of the Experimental Anchor, Advance, Integrate, and Repair mechanism. The name does not imply demonstrated efficacy.
- Checks occur adaptively at meaningful conceptual boundaries rather than on a fixed clock.
- Users may skip checks or review, but the outcome is relabeled as exposure rather than demonstrated learning.
- **Decision recorded 2026-08-23:** the v0 term is **sparse learning loop**, not mastery loop. Learner state records specific immediate and delayed evidence rather than a generic mastery probability.
- Pace/depth uses a **Faster ↔ Deeper** bundle control, with Auto available as a learning-first recommendation. Every bundle change is itemized, reversible, and constrained by source, accessibility, control, and goal contracts.
- Understand and Study are learner-stepped by default. Preview may offer optional autoplay; Understand autoplay is off by default and blocked for high-inspection or interactive frames; Study has no instructional autoplay in v0.
- PRISM may offer a Deeper bundle after task evidence reveals an unresolved governing relation. Pauses, rewinds, source inspection, replay, response time, or focus loss cannot independently trigger remediation or a learning-state inference.
- Narration is optional and complementary; it should not duplicate identical on-screen prose by default.
- Notes, highlights, and questions are available without leaving the flow, with deeper editing after the stream.
- **Decision superseded 2026-08-30:** the visual direction is the **scholarly instrument**: warm paper and neutral editorial surfaces, a compact graphite rail, editorial reading typography, and one restrained vermilion accent. Decorative spectral gradients, blue glow, generic AI-dashboard styling, chat-first layouts, background text, fake technical ornament, and excessive card containers are excluded.
- The desktop player keeps the most recent relevant source visual on the left, resets it at a section boundary, and places the preceding semantic frame below the active frame for quick skimming.
- Front matter and back matter remain searchable and source-visible but are skipped by semantic playback by default.
- Progress feedback shows specific evidence and review strength without a mastery badge, proprietary score, or addictive streak pressure.
- The target session length is 15–30 minutes.

## 3. Initial user, content, and context

- The project owner is the first primary and longitudinal user.
- The first content domain is computing, with an initial emphasis on databases, computer networks, distributed systems, algorithms, operating systems, Python, data engineering, cloud systems, and AI-related technical material.
- The initial benchmark uses three structurally different concepts rather than treating one subject as the permanent product boundary: database transaction isolation, TCP congestion control, and distributed consensus.
- TCP congestion control remains the first engineering parser/performance fixture. Transaction isolation is the first manually reviewed learning and TSR fixture.
- Initial sessions are focused Windows laptop/desktop study sessions.
- English is the only v0 language.
- General WCAG access is required, but no disability-specific or clinical research track is in v0.
- Defer advanced mathematics and high-stakes medical transformation. Ordinary code and technical prose are not categorically excluded.
- Begin validation with bounded computing passages or sections of roughly 800–2,000 words that have testable conceptual, procedural, or causal structure.
- One-word RSVP is an optional, bounded research-only negative control. It is not a v0 product feature or roadmap dependency.
- A source file may be much larger than the experimental passage. Large born-digital PDFs and full textbooks are a first-class ingestion and navigation target; PRISM creates bounded learning units from them rather than treating a whole book as one prompt or one stream.

## 4. Ingestion and transformation

- v0 accepts pasted text, `.txt`, Markdown, and clean text-based PDFs.
- Clean, born-digital full-textbook PDFs are an explicit product target. Import, indexing, and transformation must be resumable, page-aware, and usable before the entire book has been deeply transformed.
- “Support all PDFs” is the compatibility mission, not permission to silently produce unreliable output. Scanned, mixed, encrypted, malformed, equation-heavy, and layout-ambiguous PDFs move through capability and confidence gates.
- Scanned/OCR-heavy or structurally ambiguous PDFs remain out of scope until extraction quality and provenance are reliable.
- Use public-domain/open-license passages plus private user uploads that are not redistributed.
- Use one canonical primary source per lesson in v0. A Project may organize a textbook or source collection into a route, but multi-source lesson composition comes later.
- PRISM may simplify and reorganize wording through explicit, reversible layers while preserving the canonical source and source spans.
- Generated examples and analogies may appear automatically as clearly labeled drafts. Approved lesson records still require the appropriate grounding and review gates.
- Generated diagrams may show both explicit source relations and clearly marked PRISM inferences.
- Produce a fast initial draft, then refine representations and quality checks without blocking basic use.
- On import, preserve and hash the complete source, recover and quality-check its structure, and build local search plus section/concept indexes. Generate deep semantic frames only for the section the learner opens; optional background refinement remains bounded by the learner's privacy and cost policy.
- The owner can edit frames, questions, diagrams, and corrections as versioned personal overlays; the canonical source is never rewritten.
- When grounding fails, fall back to the source representation and explain why.
- Compact provenance badges appear on frames, with detailed spans and generation information on demand.
- Outside knowledge may appear only in a separate, sourced enrichment layer.

## 5. Personalization and learner state

- The owner accepts a one-to-three-minute first-use calibration.
- v0 has a persistent local profile without an account.
- v1 may add an account and encrypted synchronization.
- Adaptation reasons are available on request while the live canvas remains calm.
- v0 may use scored task evidence, post-answer confidence, and prior learning history. Response time, pauses, rewinds, replays, Source use, and browser focus remain ambiguous context and cannot independently create a learning state or remediation decision.
- Future opt-in sensor research starts with gaze/eye-tracked displays, not EEG or broader biosignals.
- Long-term learning history is local first, with optional encrypted sync later.
- PRISM should first maintain a project-local understanding map for prerequisites, connections, representation selection, and review scheduling. Any cross-project learner graph is a separately approved future capability.
- Explicitly opted-in, anonymized interaction data may improve future models. Personal learning data must never be sold.

## 6. AI and assessment policy

- v0 may use paid cloud AI APIs under a monthly cap of **$25**.
- Cloud transformation is approved separately for each private source. A PDF stays local unless the learner explicitly allows the disclosed source spans or page regions to be sent for that source; importing or indexing a file never grants cloud permission, and no blanket global approval substitutes for source-level consent. A usable local-only path remains available.
- Keep providers replaceable, cache safe reusable work, and expose cost during development.
- Lessons, profiles, playback, and tests remain local; approved cloud AI may receive only the content necessary for generation.
- Human review is acceptable before lesson records receive `approved` publication status for a study package.
- Practice and adaptive-check questions may be generated automatically with grounding and answerability checks.
- Questions used as outcome measures for performance claims or controlled experiments must still be reviewed, versioned, and piloted. Automatically generated practice items cannot validate their own generator.
- AI may propose representation candidates only within content, source-fidelity, accessibility, and author/owner guardrails. Deterministic checks and required review decide what can enter a published package.

## 7. Research and claims

- The owner will use PRISM and return for both 24-hour and 7-day tests.
- Initial testing is owner-only; no general population claim may be inferred from it.
- If normal reading wins, follow the evidence and change direction or retain only the successful mechanisms.
- Preserve all positive, null, and negative results privately.
- Public quantitative learning claims require a preregistered controlled study with fair baselines and delayed outcomes.
- Academic publication or research collaboration becomes a goal only after strong personal pilot evidence.
- The owner does not want in-person human testing. Later controlled studies may recruit consented remote asynchronous adult participants after the owner pilot is strong enough to justify them.

## 8. Product, privacy, and ownership

- PRISM is initially a personal research project.
- The repository and early application remain private.
- Explore potential research/IP protection with qualified advice before public disclosure; no patentability assumption is made.
- If commercialized, serve individual learners first.
- The initial team is the owner plus AI tools.
- The realistic owner time budget is 5–10 hours per week for the next three months.
- PRISM remains learner-only. Instructor dashboards, assignments, classroom administration, course-author workflows, and institutional analytics are not on the roadmap.
- The experience remains reading-centered. Sparse checks diagnose and repair learning, but PRISM must not evolve into a quiz site, flashcard site, or course-management product.

## 9. Runtime and delivery

- v0 is a local Windows web application with optional approved cloud AI generation.
- The first usable release is an owner-only desktop-web research instrument, not a packaged Windows application or hosted multi-user service.
- The interaction and experiment contracts are sufficiently defined to propose the local-first React/TypeScript/Vite plus Python/FastAPI/SQLite stack in `../architecture/TECH_STACK.md`. Accept it only after the first recovery-tested PDF-to-stream vertical slice.
- First tests support Windows laptop/desktop only.
- Generated lesson packages, the player, profile, and assessments work offline after preparation.
- Export versioned research JSON, a readable progress report, and optional study/review cards.
- Eye-tracked displays are the preferred post-desktop research platform if core evidence is strong.

### Pre-implementation authorization recorded 2026-08-23

- Deliver implementation through one focused milestone and pull request at a time. Do not overlap scopes while the prior pull request remains open.
- Finish, validate, commit, push, and open the dossier/documentation pull request before implementation begins.
- Preserve and migrate the existing `.prism-data` database and TCP artifacts. Create a recoverable backup before schema changes; do not treat current local data as disposable.
- Research and select the strongest suitable transaction-isolation source with a commercially compatible open license rather than defaulting to the earlier noncommercial fixture.
- The owner is the approval authority for the private owner/debugging pilot. This is sufficient for early internal research only; it is not independent expert review and cannot support public efficacy, general-population, or external research claims.
- Produce one polished Source Reader/TSR desktop mockup for owner approval before rebuilding the frontend.
- Keep the first owner-pilot scope to the core learning path. Notes, highlights, narration, and text-to-speech do not block the pilot.
- Do not introduce generative AI until the manually authored lesson and player pass their gates.
- Defer local-model benchmarking until the manual and optional cloud paths can be evaluated fairly.
- Use an in-app due/review queue initially; Windows, email, and calendar notifications are deferred.
- After the documentation pull request is merged and the working branch is updated, begin the next approved local milestone without another general start confirmation.

## 10. Owner discovery status

The initial owner discovery is complete:

1. Computing and AI-related PDFs are the first domain family, without narrowing the eventual format mission.
2. Later remote asynchronous studies are acceptable; in-person studies are not required.
3. PRISM is learner-only and reading-centered.

The initial implementation-policy questions are resolved:

1. cloud use requires per-source approval;
2. full books are indexed locally, with deep section generation on demand;
3. the first benchmarks cover transaction isolation, TCP congestion control, and distributed consensus.

The remaining contract-migration, pilot-threshold, and complex-document choices are implementation-evidence questions tracked in `OPEN_QUESTIONS.md`.

## 11. Interactive-lesson product alignment recorded 2026-08-29

### Hosted, device-local product

- PRISM is a hosted web application whose personal sources, indexes, lessons, annotations, reading state, versions, and answer analyses persist in the learner's browser profile.
- The challenge release does not require an account. Same-browser-profile continuity is promised; multi-device continuity is not.
- Import copies a source into browser-owned OPFS by default. Merely retaining a user file path is not the persistence contract.
- Personal source bytes do not pass through or persist on PRISM's hosted server in the default path.
- An active browser agent may receive bounded source spans or visual regions only through narrow WebMCP tools and the source's explicit consent policy.
- Open-license showcase sources may be hosted and preloaded when their redistribution terms permit it.
- An optional user-chosen PRISM Workspace folder for exports, backups, agent artifacts, or companion workflows is recommended after the challenge. It is not required for browser persistence and is not an invisible memory store.

### Reader and document intelligence

- Without an agent, PRISM must be an excellent, fully usable PDF reader.
- The reader supports selectable/copyable text, search, outline/thumbnails, zoom, page and continuous modes, exact citation navigation, local highlights and notes, and visual-region copy/export.
- PDF.js is the canonical browser renderer. Derived text and visual indexes never replace the immutable source.
- PRISM models a textbook as page, layout, structure, visual, and semantic graphs rather than indexed text alone.
- Retrieval combines structure, exact lexical search, visual evidence, cross-references, and later semantic reranking; every evidence item carries stable page/span/region anchors.
- Unsupported, scanned, encrypted, malformed, or low-confidence material fails closed to Reader/source-only mode. PRISM must not silently generate a lesson from uncertain extraction.

### Lessons

- The primary generated object is a visually composed, scrollable, multi-section interactive textbook or online-course lesson—not a summary, chat transcript, slide deck, or frame slideshow.
- Lessons contain detailed explanatory text and only representations that improve structure, causality, space, change, comparison, or quantity: source visuals, generated diagrams/charts, equations, code, tables, and bounded accessible interactions.
- Semantic frames remain the typed internal composition/provenance units. TSR remains an optional Experimental alternate presentation and research condition.
- Each source can own multiple named lessons. Every lesson records its source, page/section/content range, learner goal, assumed knowledge, coverage ledger, provenance, version history, and relationship to parent/repair lessons.
- The agent proposes a coverage-aware plan before composition. It covers all assigned objectives, compresses supporting material according to importance and use, and discloses omissions.
- Saved lessons reopen and remain readable without an agent. An agent is required for semantic creation, discussion, evaluation, and revision.
- Lesson revisions are versioned. The learner must approve substantial changes; the canonical source is never rewritten.

### Continuous discussion and end questions

- The agent can retrieve the active source, lesson, section, selection, and learner-invoked context so the learner can discuss a difficult point without restating where they are.
- The agent can navigate the live Reader to the exact page and region where a concept is introduced or supported.
- Instruction comes first. A lesson ends with normally 3–6 grounded explanation and application questions; PRISM does not interrupt normal reading with a quiz cadence.
- The learner answers in the agent conversation. Structured analysis is stored locally with the question and lesson version, strengths, gaps, evidence, uncertainty, and recommended action.
- A substantial gap becomes a named child repair lesson. Smaller clarifications may become a versioned patch with learner approval.
- Completion means the learner finished the lesson and its immediate evidence loop. It is not a mastery or durable-learning claim.

The authoritative contracts are [`../product/INTERACTIVE_LESSON_SPEC.md`](../product/INTERACTIVE_LESSON_SPEC.md), [`../product/READER_SPEC.md`](../product/READER_SPEC.md), [`../architecture/DEVICE_LOCAL_WEB_ARCHITECTURE.md`](../architecture/DEVICE_LOCAL_WEB_ARCHITECTURE.md), [`../architecture/DOCUMENT_INTELLIGENCE.md`](../architecture/DOCUMENT_INTELLIGENCE.md), and [`../architecture/WEBMCP_INTEGRATION.md`](../architecture/WEBMCP_INTEGRATION.md).

## 12. Project understanding workspace recorded 2026-08-31

- PRISM's product boundary is a private, goal-bound Project that helps a learner form a usable mental model from dense technical sources. Courses and assigned readings are important use cases, not the product definition.
- A Project contains selected sources, a project-local map, a learner-approved learning route, source-grounded lessons, immediate understanding evidence, and learner-approved repairs. It does not silently create a global cross-project learner graph.
- The route can span a whole textbook or source collection, but the challenge implementation keeps each generated lesson anchored to one primary source and bounded range until typed multi-source provenance is designed and measured.
- The agent may propose routes, revisions, repairs, and bounded external-evidence requests. The learner alone approves routes, material revisions, repairs, permissions, deletion, and external enrichment.
- When project sources conflict or are unclear, PRISM first shows the evidence and uncertainty. It may ask for clarification. External evidence is opt-in, separately sourced, and visibly distinct from project-source content.
- The product promise is the fastest source-accountable route to a stated understanding goal with disclosed tradeoffs and immediate evidence of understanding. It must not promise universal comprehension, compression ratios, or mastery from completion.

The detailed product and roadmap contracts are [`../product/PROJECT_UNDERSTANDING_WORKSPACE.md`](../product/PROJECT_UNDERSTANDING_WORKSPACE.md) and [`../engineering/PROJECT_ROUTE_ROADMAP.md`](../engineering/PROJECT_ROUTE_ROADMAP.md).
