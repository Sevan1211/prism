# Document intelligence and retrieval specification

**Status:** adopted target; capability remains tiered and evidence-gated  
**Reviewed:** 2026-08-29  
**Related:** [`PDF_PIPELINE.md`](PDF_PIPELINE.md), [`../product/READER_SPEC.md`](../product/READER_SPEC.md), [`../product/INTERACTIVE_LESSON_SPEC.md`](../product/INTERACTIVE_LESSON_SPEC.md), [`WEBMCP_INTEGRATION.md`](WEBMCP_INTEGRATION.md)

## Goal

Give the learner and agent fast, inspectable access to all relevant material in a selected source range without pretending that indexed text is the complete document.

PRISM distinguishes three capabilities:

1. **Render fidelity:** display the original page accurately.
2. **Extraction fidelity:** recover selectable text, structure, visuals, equations, tables, code, and reading order.
3. **Semantic interpretation:** identify what the material means and how it should be taught.

Success at one level does not imply success at the next. The original rendered page remains the final source reference.

## Implemented browser-local slice — 2026-08-29

`pdfjs-evidence-v2` implements the first conservative Tier-B-candidate inventory for
born-digital PDFs. It creates stable page/element anchors, approximate normalized text
regions, page-quality profiles, exact search, cursor-paged scope manifests, bounded
verbatim evidence bundles, and visible region navigation. Candidate labels include their
reasons and confidence. Possible parallel-column/table geometry and image-only pages are
source-only; all other reconstructed reading order remains warning status.

This is not yet a verified structural graph or multimodal document understanding system.
The manifest explicitly reports that visual objects, semantic definition/claim
candidates, cross-references, and verified hierarchy are unavailable, and browser-local
lesson compilation remains disabled.

## Document intelligence package

### Page render layer

Preserve the exact source page, dimensions, rotation, drawing operations, raster images, annotations, links, and embedded metadata needed for faithful display and region capture.

### Layout graph

Represent every detected page region with reading order and geometry:

- heading;
- paragraph;
- list;
- footnote;
- sidebar;
- code;
- equation;
- figure;
- caption;
- table;
- example;
- exercise;
- navigation matter.

### Structural graph

Reconcile PDF outline entries, visual headings, table-of-contents entries, page labels, and manual corrections into a hierarchy of parts, chapters, sections, subsections, examples, exercises, appendices, and references.

### Visual asset registry

Every detected or learner-selected visual receives:

- page and normalized bounding region;
- rendered crop and source fingerprint;
- type and confidence;
- figure or table number;
- caption, legend, and nearby text;
- in-text mentions and cross-references;
- source-authored status;
- accessible description status;
- interpretation and review state.

When semantic interpretation fails, PRISM still preserves, copies, displays, and cites the exact region.

### Semantic teaching graph

Candidate instructional records include concepts, aliases, definitions, claims, mechanisms, prerequisites, examples, boundary cases, equations, algorithms, evidence, limitations, misconceptions, and applications. Every record cites source elements or is labeled as a PRISM inference or added explanation.

### Retrieval indexes

The retrieval layer combines:

- exact and fuzzy lexical search;
- structural and heading search;
- definition and first-introduction search;
- figure, caption, table, equation, and code search;
- semantic retrieval where a measured local implementation is available;
- cross-reference traversal;
- prerequisite and related-concept expansion.

No single retrieval score is presented as proof that all relevant evidence was found.

## Scope manifest before lesson creation

Lesson planning never begins from an arbitrary top-k search result. PRISM builds a complete manifest over the selected pages or sections containing:

- all headings and structural boundaries;
- all extracted blocks and their status;
- definition and claim candidates;
- every figure, table, equation, code block, example, and exercise;
- referenced prerequisites from outside the selected range;
- cross-references and unresolved references;
- extraction warnings and source-only regions.

The agent reads the compact manifest, assigns coverage dispositions, and then requests bounded evidence bundles for the records needed to compose the lesson. The manifest and final coverage ledger make omissions inspectable.

## Retrieval tool contract

### `get_source_map`

Returns source identity, readiness, outline, page labels, capability tiers, and quality warnings without returning unrestricted source text.

### `get_scope_manifest`

Returns the complete structural and asset inventory for a requested chapter, section, page range, or set of anchors. Large manifests are cursor-paged and carry stable identities.

### `search_source`

Accepts a query plus an explicit intent:

- exact occurrence;
- conceptual match;
- definition;
- first conceptual introduction;
- example;
- figure or caption;
- equation;
- code symbol;
- prerequisite;
- cross-reference.

Returns ranked candidate anchors with section path, page, region, snippet or caption, retrieval reason, extraction status, and confidence.

### `read_source_bundle`

Returns bounded, source-verbatim elements and approved visual crops around selected anchors, including local context and referenced definitions. It never returns the full source by default.

### `get_related_context`

Traverses structural and cross-reference edges for prerequisites, figures, equations, examples, definitions, and later dependencies.

### `open_source_location`

Navigates the visible Reader to an exact source anchor, applies a visible highlight, and returns the source, page, section, region, and current visible state so the result is verifiable.

## Stable source anchors

An anchor contains:

```yaml
source_anchor:
  id: string
  source_hash: string
  parser_version: string
  pdf_page_index: integer
  printed_page_label: string | null
  section_id: string | null
  element_id: string | null
  bbox_normalized: [number, number, number, number] | null
  start_offset: integer | null
  end_offset: integer | null
  text_snapshot_hash: string | null
```

The Reader, lesson, search result, visual asset, question criterion, and agent answer all use the same anchors. A parser upgrade creates a new locator version and an explicit remapping result rather than silently moving evidence.

## Capability tiers

| Tier | Source class | Transformation policy |
|---|---|---|
| A | Well-tagged born-digital PDF | Full structure and lesson eligibility after normal checks |
| B | Untagged born-digital PDF | Inferred layout and reading order with confidence and visual review fixtures |
| C | Scanned or mixed PDF | OCR and layout recognition; low-confidence regions remain source-only |
| D | Complex STEM or multi-column source | Specialized equation, table, code, and visual routes with rendered-region fallback |
| E | Encrypted, malformed, protected, or unsupported | Password requested locally where lawful; otherwise Reader-only or explicit refusal; no protection bypass |

The compatibility mission is broad, but public claims name the tested tiers. A parser may render a page while refusing to reconstruct its semantics.

## Multimodal extraction pipeline

```text
source bytes
  -> safe preflight and page inventory
  -> PDF render and embedded object/text extraction
  -> reading-order and region analysis
  -> OCR only where required
  -> heading and structural reconciliation
  -> figure/table/equation/code detection
  -> caption, legend, and mention linking
  -> cross-page and cross-reference stitching
  -> semantic candidates and retrieval indexes
  -> quality report and source-only fallbacks
```

Complex visuals require separate checks:

- figures: region completeness, caption association, legend coverage, and in-text-reference closure;
- tables: row, column, header, spanning-cell, footnote, and reading-order integrity;
- equations: symbol identity, layout, numbering, definitions, assumptions, and surrounding derivation;
- code: exact whitespace, line numbers, syntax, continuation, input/output, and caption;
- charts: axes, units, series, legend, labels, source data availability, and uncertainty.

Visual semantics remain uncertain until evidence shows the selected parser or agent-review path is reliable. A page crop is not proof that a chart or diagram has been correctly interpreted.

## Reader interaction requirements

The Source Reader provides:

- selectable and copyable text through a synchronized text layer;
- exact and conceptual search with visible result regions;
- local highlights, comments, and notes;
- click-to-copy detected figures;
- rectangular page-region selection and high-resolution local image copy/export;
- equation, table, and code-region copy paths;
- OCR overlay when scan text is available;
- bidirectional source-to-lesson backlinks;
- keyboard-complete navigation and screen-reader semantics;
- virtualized pages without placing an entire large-book page tree in the accessibility DOM.

Annotations remain local overlays by default and never rewrite the immutable source. An annotated PDF export is a later, explicit action.

PDF.js provides the browser rendering, text, annotation, and editor-layer foundation; PRISM adds source anchors, extraction status, lesson links, and local persistence. See the [PDF.js project architecture](https://github.com/mozilla/pdf.js/blob/master/AGENTS.md?plain=1) and [API documentation](https://mozilla.github.io/pdf.js/api/).

## Evaluation

The frozen corpus measures independently:

- rendered-page fidelity;
- character and word extraction;
- reading order;
- heading and section boundaries;
- region localization;
- figure/table/equation/code detection;
- caption and reference association;
- OCR quality;
- exact retrieval;
- conceptual and first-introduction retrieval recall;
- source-navigation correctness;
- lesson essential-concept coverage;
- citation correctness;
- answer-evidence correctness;
- false transformations of source-only regions.

Each benchmark query has reviewed expected anchors and acceptable alternatives. A correct-looking answer supported by the wrong page or region is a fidelity failure.

## Challenge boundary

The challenge release demonstrates Tier A/B local extraction, exact and structural retrieval, source visual selection, scope manifests, exact navigation, and explicit source-only fallback. OCR, universal equation recognition, table reconstruction, and general visual understanding remain roadmap capabilities until the corpus gates pass.
