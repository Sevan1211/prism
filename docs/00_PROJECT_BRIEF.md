# PRISM project brief

**Reviewed:** 2026-08-23 against the GPT Pro research dossier and current repository baseline  
**Research integration:** [`research/DOSSIER_INTEGRATION_REVIEW.md`](research/DOSSIER_INTEGRATION_REVIEW.md)

## Name

**PRISM — Personalized Representation and Information Streaming for Meaning**

The metaphor is strong: one body of information enters the system and is “refracted” into the representation best suited to the learner and the idea—text, diagram, image, equation, worked example, animation, or a deliberately paced semantic stream.

## The opportunity

Most reading software changes typography, navigation, or playback speed. Conventional RSVP goes further by replacing a page with a sequence of words at one location. That can reduce eye movement and increase the nominal presentation rate, but it also removes parafoveal preview, reader-chosen pauses, and natural rereading. Those losses matter most as material becomes unfamiliar, conceptually dense, or dependent on relationships across sentences.

PRISM should attack a broader problem:

> How can software transform and pace information so that a person reaches a correct, durable, usable mental model with less wasted time?

That framing permits speed improvements where they are safe while treating understanding as the actual outcome.

## Product thesis

PRISM is three connected systems:

1. **Representation compiler** — parses a source, builds a traceable semantic model, and proposes representations suited to each idea.
2. **Technical reader and Traceable Semantic Relay player** — preserves an enhanced static Source Reader and experimentally presents source-grounded frames through an Anchor, Advance, Integrate, and Repair cycle.
3. **Sparse learning loop** — uses bounded retrieval, explanation, application, source-linked repair, and delayed review to collect and strengthen specific learning evidence.

The proposed innovation is the coordination of these systems. Phrase-level streaming alone is useful but defensible competitors can copy it. A source-grounded compiler, evidence-locked representation relay, and validated sparse learning loop create the deeper research contribution. Traceable Semantic Relay is **Experimental** until it beats or meaningfully complements the enhanced Source Reader on delayed outcomes.

## North star

The aspirational experience is a single calm screen on which the most useful representation appears at the right moment. The learner can focus on that screen and emerge able to explain and use the material.

This is a research direction, not a promise that arbitrary information can be “uploaded” through rapid flashes. Current evidence supports very fast extraction of visual gist, but not equally fast consolidation of durable, relational knowledge. PRISM should test whether coherent frames, stable context, learner-stepped advancement, sparse checks, source-linked repair, and delayed retrieval reduce wasted effort without removing productive rereading.

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

## Initial content and full-PDF mission

PRISM should eventually accept the broad range of PDFs a learner actually encounters. Its first domain family is computing and AI-related material: databases, networks, distributed systems, algorithms, operating systems, Python, data engineering, cloud, and adjacent AI topics.

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

## Core product modes

- **Preview:** fast structural map and key questions; optimized for orientation and gist.
- **Understand:** learner-controlled Traceable Semantic Relay frames with context and optional explanatory representations.
- **Study:** a deeper TSR bundle with sparse retrieval, application, repair, and spaced follow-up.
- **Source:** an enhanced static reader for normal study, verification, search, structure, and unrestricted navigation.

Keeping these goals separate prevents a fast preview from being mislabeled as deep study.

## Non-goals for the first version

- replacing normal reading for every text or reader;
- promising extreme words-per-minute rates;
- eye tracking, EEG, or camera-required adaptation;
- fully automatic animation generation;
- pretending that arbitrary textbooks have been parsed perfectly;
- transforming an entire book as one model prompt or one uninterrupted stream;
- becoming a quiz bank, flashcard site, course platform, or instructor dashboard;
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
