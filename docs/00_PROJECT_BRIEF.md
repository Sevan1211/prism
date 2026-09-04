# PRISM project brief

**Reviewed:** 2026-08-31 against the project-understanding-workspace direction and current repository baseline  
**Research integration:** [`research/DOSSIER_INTEGRATION_REVIEW.md`](research/DOSSIER_INTEGRATION_REVIEW.md)
**Current product contract:** [`product/PROJECT_UNDERSTANDING_WORKSPACE.md`](product/PROJECT_UNDERSTANDING_WORKSPACE.md) and [`product/INTERACTIVE_LESSON_SPEC.md`](product/INTERACTIVE_LESSON_SPEC.md)

**Owner clarification — 2026-09-03:** Agent-authored lessons are browser-native,
Markdown-style reading documents with substantive explanations and inline visuals.
PDFs are original source material, not the generated lesson format. See the
[`submission readiness`](engineering/SUBMISSION_READINESS.md) for the agreed empty-library,
soft-length, original-visual, and same-lesson revision contract and its acceptance evidence.
The approved [reading release execution plan](engineering/READING_RELEASE_EXECUTION.md)
prioritizes authoring latency, original figure quality, dedicated reading routes, and
purposeful domain-neutral visuals, including explicitly labeled AI illustrations.

The owner's latest storage requirement is independent access to one synchronized
library across browsers, including ChatGPT's native browser, without a companion.
The [synced-library implementation](architecture/SYNCED_LIBRARY.md) now uses
encrypted cloud copies with account-free recovery keys. The owner removed folder
mode from the release: storage is either this browser's local vault or an explicitly
connected encrypted library. Browser acceptance and remaining limits are recorded
in the submission readiness document; cross-browser source/brief sync is verified.

## Name

**PRISM — Personalized Representation and Information Streaming for Meaning**

The metaphor is strong: one body of information enters the system and is “refracted” into the representation best suited to the learner and the idea—text, diagram, image, equation, worked example, animation, or a deliberately paced semantic stream.

## The opportunity

Most reading software changes typography, navigation, or playback speed. Conventional RSVP goes further by replacing a page with a sequence of words at one location. That can reduce eye movement and increase the nominal presentation rate, but it also removes parafoveal preview, reader-chosen pauses, and natural rereading. Those losses matter most as material becomes unfamiliar, conceptually dense, or dependent on relationships across sentences.

PRISM should attack a broader problem:

> How can software transform and pace information so that a person reaches a correct, durable, usable mental model with less wasted time?

That framing permits speed improvements where they are safe while treating understanding as the actual outcome.

## Product thesis

PRISM is five connected systems:

1. **Project workspace and learning route** — keeps a goal-bound source collection, explicit source membership, a transparent route, and project-local learning state rather than treating each lesson as an isolated chat task.
2. **Device-local Source Reader** — preserves each original document as a fully navigable, selectable, annotatable, searchable, and copyable source.
3. **Document-intelligence compiler** — recovers page layout, hierarchy, text, figures, tables, equations, code, cross-references, and stable source anchors with explicit confidence and fallback.
4. **Agent-authored interactive lesson system** — lets a WebMCP agent inspect a learner-approved route step, propose coverage, and build a saved, multi-section interactive textbook experience from typed, source-grounded representations.
5. **Understanding-evidence and repair loop** — places questions after instruction, lets the learner answer through the agent conversation, and records immediate evidence-linked completion, clarification, or learner-approved repair without making a mastery claim.

The innovation is their coordination. PRISM is not a generic PDF summarizer, a quiz site, or an AI chat beside a document. The learner and agent share one live project, source, route, lesson, and evidence surface. Traceable Semantic Relay remains an **Experimental** alternate renderer for selected semantic frames; it is no longer the definition of the primary lesson experience.

## North star

The primary experience is a visually composed interactive textbook generated for the learner's actual assignment. It uses detailed, easy-to-follow prose; meaningful sections and subsections; source-authored and reconstructed visuals; equations; code; worked examples; and user-controlled interactions. The learner can discuss any confusing part with the connected agent, open its exact source evidence, and approve a durable revision or repair.

Semantic frames remain the internal source-grounded composition units. The primary lesson renders them as a coherent, scrollable instructional narrative rather than an uninterrupted sequence of isolated screens. The one-screen Traceable Semantic Relay canvas remains available as an Experimental representation when a process, relation, or focused explanation benefits from it.

### Long-term research mission

PRISM should pursue the best scientifically defensible and technologically advanced design for rapidly absorbing and learning information. The intended destination is not a better e-reader or a polished RSVP clone. It is a new human–information interface that:

- decomposes a source into inspectable meaning and dependency structures;
- selects the representation that best expresses each structure;
- streams those representations through one coherent attentional canvas;
- estimates when processing, integration, or repair is needed;
- verifies learning rather than inferring it from exposure;
- improves its policy from delayed retention and transfer outcomes.

Some parts of this destination are **Promising**, some are **Experimental**, and seamless multimodal comprehension adaptation remains **Speculative**. That classification should guide the research sequence without shrinking the ambition.

### Governing optimization rule

**Decision recorded 2026-08-19:** durable, transferable learning always outranks raw speed. PRISM should first meet a selected learning standard and then find the fastest comfortable path that continues to meet it.

The user retains a clear Faster ↔ Deeper bundle control. It is not merely a speed slider:

- **Faster:** merges compatible frames, removes optional examples, reduces optional checks, and shortens nonessential transition delays without removing qualifiers, source links, accessibility content, or rewind;
- **Auto:** recommends the least costly bundle supported by the selected goal and demonstrated task evidence, while keeping every change inspectable and reversible;
- **Deeper:** splits dense frames, preserves the anchor longer, adds a worked contrast or example, and may insert one additional integration or repair opportunity.

Understand and Study are learner-stepped by default; Study has no instructional autoplay in v0. If the user chooses a gist-only Preview goal, PRISM may go faster but must label the outcome as orientation rather than demonstrated learning. The system never hides an expected speed–learning tradeoff.

## Recommended initial audience

**Decision recorded 2026-08-19:** optimize the first working prototype for the project owner’s real learning behavior. The owner is the first longitudinal test user, while content and event contracts remain suitable for later studies with adult and college-level learners reading English-language nonfiction on desktop or laptop.

This is narrow enough to validate the mechanism honestly before claiming generalization to children, clinical populations, second-language learning, mobile contexts, or accessibility-specialized experiences.

## Cross-domain contract and initial benchmark

PRISM should accept the broad range of structured PDFs a learner actually encounters.
The first stress-testing and challenge-demo corpus is computing and AI-related material:
databases, networks, distributed systems, algorithms, operating systems, Python, data
engineering, cloud, and adjacent AI topics.

**Owner clarification recorded 2026-08-31:** computing is the challenge demonstration
corpus, not the product boundary. The released product, WebMCP tools, lesson contracts,
evaluation criteria, and representation grammar remain discipline-neutral. A learner
should be able to use the same source-grounded workflow for mathematics, natural and
social sciences, engineering, medicine, law, history, literature, business, and other
structured academic or professional material. Domain-specific renderers may be added,
but no core contract may assume that the source contains code, equations, or a technical
mechanism.

The challenge may use a computer-systems chapter because it stress-tests hierarchy,
figures, code, exact terminology, and causal explanation in one source. Success on that
demo is evidence for one demanding corpus only. It is not evidence of universal parsing
or cross-domain learning efficacy.

**Decision recorded 2026-08-19:** the first benchmark trio is database transaction isolation, TCP congestion control, and distributed consensus. These concepts deliberately test precise definitions and anomalies, causal change over time, and multi-node reasoning rather than optimizing the prototype around one kind of technical explanation.

The first efficacy passages should still be bounded, licensed or privately uploaded sections that have:

- 800–2,000 words;
- a clear causal or conceptual structure;
- a small number of useful diagrams;
- no advanced equation layout or cross-chapter dependencies;
- testable literal, inferential, and transfer outcomes.

A full textbook may be the uploaded source even when the current learning unit is one section. Import should recover the whole book’s structure and make it searchable; deep transformation should occur section by section so the learner can begin quickly and the system can preserve page-level provenance.

Private sources remain local by default. Cloud transformation requires explicit approval for each source, with the exact spans or page regions leaving the device disclosed before processing. Importing or indexing a book never grants cloud permission.

“All PDFs” is a long-range compatibility target, not a claim that every file can be transformed reliably today. PRISM must explicitly report unsupported or low-confidence pages and retain Source mode rather than flattening them into plausible-looking misinformation.

## Core product surfaces

- **Source Reader:** the original document with structure, search, selection, copy, local annotations, exact region navigation, and extraction-status inspection. It works without an agent.
- **Lesson Library:** multiple named lessons attached to each source, each showing its chapter/page coverage, objectives, status, version, and any parent or repair relationship.
- **Interactive Lesson:** a detailed, multi-section digital-textbook experience built by the agent from an approved lesson plan and saved locally.
- **Agent Collaboration:** source search, exact navigation, lesson planning, composition, discussion, revision, end-question analysis, and learner-approved repair through WebMCP.

Previously generated lessons remain viewable without an active agent. Creating, evaluating, or revising a lesson requires a connected agent.

## Non-goals for the first version

- replacing normal reading for every text or reader;
- promising extreme words-per-minute rates;
- eye tracking, EEG, or camera-required adaptation;
- arbitrary executable animation or UI generation;
- pretending that arbitrary textbooks have been parsed perfectly;
- transforming an entire book as one model prompt or one uninterrupted stream;
- becoming a quiz bank, flashcard site, classroom platform, or instructor dashboard;
- diagnosing learning disabilities or cognitive state;
- matching people to fixed “learning styles.”

## Durable success criteria

PRISM is successful only if controlled comparisons show one or more of the following without an unacceptable loss elsewhere:

- higher delayed retention in the same total time;
- equivalent delayed retention in less total time;
- better inference or transfer at comparable time;
- lower workload or fatigue at comparable learning;
- better calibration between “I think I understand” and actual performance.

Nominal display rate by itself is not a success criterion.

When two designs produce meaningfully different durable-learning outcomes, prefer the stronger learning outcome. Compare time savings only among designs that satisfy the predeclared learning standard.

**Initial proof standard:** the learner can accurately explain the governing idea and apply it to a new example seven days later. Exact recall remains a required outcome when wording, symbols, values, definitions, or sequences are inherently important. A 24-hour check is useful for iteration but is not the central durability claim.

## Current evidence-based position

- **Established:** normal reading speed and comprehension trade off; readers benefit from self-pacing, preview, and repair.
- **Promising:** phrase/clause segmentation, cumulative context, signaling, and task-sensitive representation selection.
- **Established for learning:** retrieval and spacing improve durable retention more reliably than passive re-exposure.
- **Experimental:** the complete Traceable Semantic Relay interaction, persistent source anchor, and transparent behavior-informed adaptation.
- **Speculative:** seamless one-screen multimodal streaming that consistently outperforms careful textbook study across domains.
