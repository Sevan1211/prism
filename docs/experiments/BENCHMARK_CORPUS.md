# Initial benchmark corpus

**Status:** selected for the first vertical slice  
**Decision date:** 2026-08-19; scope reviewed 2026-08-23  
**Machine-readable manifest:** [`../../benchmarks/sources.json`](../../benchmarks/sources.json)
**Research integration:** [`../research/DOSSIER_INTEGRATION_REVIEW.md`](../research/DOSSIER_INTEGRATION_REVIEW.md)

## Selection rule

The corpus uses three open-license computing passages with different knowledge structures. Each selected window is intended to contain roughly 800–2,000 words, remain understandable as a bounded unit, and expose a different failure mode for PDF parsing and semantic streaming. The passages now have distinct roles so parser evidence cannot be mistaken for learning evidence.

| Benchmark | Source and license | Selected unit | What it tests |
|---|---|---|---|
| Database transaction isolation | CUNY Academic Works, CC BY-NC-SA 4.0 | Chapter 6 window on isolation, schedules, anomalies, and concurrency control; exact pages await manual acquisition | **First manual learning fixture:** exact definitions, interleavings, exceptions, comparisons, checkpoint and transfer design |
| TCP congestion control | Peterson and Davie, *Computer Networks: A Systems Approach* 6.1, CC BY 4.0 | PDF pages 308–311, printed pages 304–307, centered on Section 6.3.2 “Slow Start” | **Golden engineering fixture:** causal change, code, visual regions, exact identifiers, parser recovery and performance |
| Distributed consensus | Kleppmann, *Distributed Systems* course notes, CC BY-SA | PDF and printed pages 69–72, Section 7.1 “Introduction to consensus” | **Second learning/generalization fixture:** definitions, safety/liveness, assumptions, quorums, tables and diagrams |
| Algorithm design | Erickson, *Algorithms* 1st edition, CC BY 4.0 | Whole-book parser fixture; learning window not yet selected | **Parser-generalization fixture:** a second typesetting system (full-color LaTeX book), margin figures, displayed equations, pseudocode, and full front/back matter |

The CUNY source landing page documents the textbook chapter and its [CC BY-NC-SA 4.0 license](https://academicworks.cuny.edu/ny_oers/31/). The networking project records its [CC BY 4.0 license and attribution](https://github.com/SystemsApproach/book#about-this-book). The Cambridge PDF states its Creative Commons BY-SA license on the first page and is published from the [course site](https://www.cst.cam.ac.uk/teaching/2425/ConcDisSys/).

## Rights and cloud policy

- The local copies are ignored by Git and are never redistributed from this repository.
- Attribution, source URL, license, selected page window, and content hash are preserved with every imported source.
- Cloud transformation is disabled by default and requires separate consent for each source.
- A compatible open license does not silently authorize cloud transfer. Privacy consent and rights status remain separate fields.

## First golden fixture

The TCP slow-start window is the first parser/player fixture because it combines prose, exact identifiers, a code block, a causal graph over time, page furniture, and figures while remaining a clean born-digital PDF. The deterministic compiler emits source-verbatim text and source-faithful figure/table regions. Code, equation semantics, and visuals without a reliable region or accessible caption remain available in Source mode and are marked as capability gaps.

**Engineering result recorded 2026-08-19:** the exact 489-page TCP source was hashed, imported end to end, reindexed after parser-version changes, compiled for PDF pages 308-311, and visually compared with rendered page 308. The review caught and repaired hidden control-character leakage, line-wrap dehyphenation loss, prose misclassified as code, and an attachment-only Source response. This establishes a useful golden engineering fixture; it does not validate the lesson or a learning claim.

**Structure/visual/performance result recorded 2026-08-20:** a single local run on the development Windows machine with Python 3.14.7 and a warm filesystem cache indexed all 489 pages in 4.58 seconds (106.8 pages/second). Process working set began at 42.3 MiB, peaked at 73.5 MiB, and returned to 44.7 MiB; the measured incremental peak was 31.2 MiB. The SQLite artifact was 6.56 MiB. The parser labeled 7 nonempty pages as front matter, 3 as back matter, 478 as body, and recorded 290 candidate source-visual regions without rasterizing them. Requested visual crops are separately bounded to at most 1,200 by 1,000 pixels and cached as immutable WebP files. These are engineering baselines from one machine/run, not frozen release budgets or efficacy evidence.

Visual review of PDF pages 309 and 311 confirmed that the lazy crops preserve the complete slow-start packet diagram and the congestion-window/time chart without surrounding prose. The same review rejected a boxed code listing that initially resembled a vector figure and rejected prose references such as “Figure 6.11 traces…” as captions.

**Reproducible compiler-gate result recorded 2026-08-23:** a deterministic, synthetic three-page TCP fixture and checked-in contract-v2 golden manifest now freeze source bytes, the compiled package hash, ordered frame text and types, page bindings, the source-visual region, and the rule that a high-inspection visual frame cannot auto-advance. Seeded failures cover mismatched source text, orphaned claims and prerequisites, missing accessible visual text, content-hash drift, and rejection before an existing valid lesson can be replaced. This is an offline regression gate for compiler integrity; it is not a substitute for the manually reviewed real-textbook overlays or the future transaction-isolation learning fixture.

**Import-reliability gate recorded 2026-08-23:** the same synthetic fixture now covers an exact duplicate PDF text artifact, a stable collision suffix for genuinely distinct records, page-specific failure reporting, source status on interruption, parser-version invalidation, and full reindex from the original immutable bytes. A separate selection fixture verifies that a front-matter-only range is blocked and that the first trusted explanatory body window—not pages 1–3—is recommended. These are parser and recovery checks, not evidence that every textbook layout is transformable.

**Semantic-entry regression recorded 2026-08-23:** the selection classifier additionally covers numbered contents headers, prefaced pages, split-line chapter banners, and numeric code/byte rows that resemble a contents row. The result is deliberately narrow: the importer must choose a real explanatory body entry point when it can identify one, while ambiguous pages remain Source-only rather than being treated as a streamable lesson.

**Parser-generalization result recorded 2026-08-26:** the 472-page Erickson *Algorithms* textbook (a full-color LaTeX layout unlike the Sphinx-generated networking book or the article-style Cambridge notes) was hashed, imported, and fully indexed in 6.3 seconds (74.7 pages/second) on the development machine. Region classification labeled 18 nonempty pages front matter, 420 body, and 24 back matter; the parser recorded 272 candidate figure regions, 204 captions, and 121 code elements, and 23 body pages correctly remained source-only rather than being over-trusted. The recommended entry window compiled into a valid draft package with five bound visuals. Two observations were recorded for follow-up: a page-boundary window can begin mid-sentence because recommendations are page-granular, and curly-quote codepoints survive extraction exactly (an earlier console-rendering artifact, not a parser defect). During acquisition, every current OpenStax title—including *Introduction to Python Programming* and *College Physics 2e*—was found to carry CC BY-NC-SA licensing, so OpenStax is excluded from the redistributable corpus; Erickson's CC BY 4.0 book replaces it. This is parser evidence only, not a learning fixture.

## Acceptance blueprint

Before a benchmark becomes an efficacy passage:

1. every taught frame must resolve to the correct PDF page and normalized region;
2. extraction order and page-furniture removal must be visually reviewed;
3. an essential-claim inventory and prerequisite list must be frozen;
4. literal, inferential, transfer, and seven-day items must be separately reviewed;
5. all compared conditions—including the enhanced Source Reader and TSR—must use the same canonical content and content coverage;
6. licensing and attribution must be rechecked for the exact acquired version.

If one-word RSVP is retained in a locked research protocol, it is an optional negative control that uses the same canonical content. It is not a product package or a gate that TSR must beat.

The transaction-isolation fixture must additionally include a manually reviewed package manifest, clause-origin/support records, an Anchor → Advance → Integrate → Repair trace, static and reduced-motion parity, two matched assessment forms, and a seven-day transfer rubric before it is eligible for the owner pilot.

No passage is yet approved for a learning-performance claim. Selection makes it a parser and lesson-design fixture, not validated instructional content.
