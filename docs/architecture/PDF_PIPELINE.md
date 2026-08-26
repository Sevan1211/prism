# Large-PDF and textbook pipeline

**Status:** clean-PDF structure and lazy visual route implemented; complex-document escalation proposed  
**Reviewed:** 2026-08-23  
**Primary target:** born-digital computing and AI textbooks on Windows  
**Mission:** progressively support the full range of PDFs without hiding extraction uncertainty.
**Research integration:** [`../research/DOSSIER_INTEGRATION_REVIEW.md`](../research/DOSSIER_INTEGRATION_REVIEW.md)

## Central decision

A full textbook is a document collection with hierarchy and cross-references, not one giant language-model prompt and not one giant semantic stream.

PRISM imports the whole source into a page-grounded canonical representation, then compiles learning units on demand. The user can search and open early sections while later pages continue processing. Every derived claim still resolves to the immutable source.

## Processing layers

```text
immutable PDF
    ↓
safe preflight + page inventory
    ↓
page-window extraction + visual assets
    ↓
canonical blocks with page regions
    ├────────────────────────────→ enhanced Source Reader
    ↓
book structure + cross-reference graph
    ↓
section retrieval and dependency context
    ↓
claims, concepts, relations, semantic frames
    ↓
fidelity/accessibility gates
    ↓
versioned lesson package
```

Each arrow produces a persisted artifact with an input hash, implementation version, status, and confidence evidence. Reprocessing one page or one section does not invalidate unrelated work.

## 1. Intake and immutable source

On upload:

- stream bytes to a temporary file rather than loading the book into browser or server memory;
- compute SHA-256 while streaming;
- detect duplicate content before processing;
- record original filename, size, MIME evidence, rights/use declaration, import time, optional edition metadata, and `cloud_policy: local_only`;
- move the completed file to content-addressed storage only after its hash and basic validation succeed;
- never rewrite the canonical source in place.

The learner declares one of: public domain, open license, personally authorized/private use, or unknown. Unknown rights permit local inspection but block redistribution and public lesson export.

## 2. Safe preflight

### Current v0 boundary

The implemented importer validates the PDF signature and byte limit, preserves immutable bytes,
then obtains page count and page-local evidence in the local worker. It does **not** yet claim
to provide the full encrypted-file, adversarial-resource, column, rotation, or object-count
preflight described below. Those checks remain part of the M1 security envelope.

After indexing, the v0 API exposes an inspectable page inventory instead of a generic
“ready” flag. For a requested range it reports trusted, warning, and source-only body text,
excluded front/back matter, and whether a draft semantic stream is permitted. The library
defaults to the earliest bounded range containing enough trusted explanatory paragraph text
rather than PDF pages 1–3. The conservative early-page classifier recognizes title/publisher,
edition, preface, and contents signals (including numbered running headers), while an explicit
chapter boundary—including a split-line `CHAPTER` / ordinal / title banner—breaks inherited
front-matter classification. Numeric code or byte-listing rows do not count as table-of-contents
rows. The user can still change the range or open the original PDF at any time.

The importer reads only enough to determine:

- valid PDF signature and parseability;
- page count and page dimensions;
- encryption/password state;
- embedded text coverage per page;
- image-only, mixed, or born-digital page classification;
- likely columns, rotated pages, unusual page sizes, and extreme object counts;
- bookmarks/table of contents availability;
- estimated disk, memory, and processing cost.

Untrusted parsing runs in a child process with:

- PDF-only format allow-list;
- no network access;
- bounded CPU time, memory, page pixels, output bytes, and temporary disk;
- a restricted working directory;
- cancellation and hard termination;
- no execution of attachments, JavaScript, links, or embedded files.

An encrypted PDF requests a password locally. PRISM never sends that password to a model provider.

## 3. Page-window extraction

The implemented clean-PDF route uses `pypdfium2` for deterministic embedded-text extraction with page numbers, reading order, normalized bounding boxes, document-region labels, element status, and parser-version identity. The sequential worker reuses one PDF document handle for the import, closes every page/text object promptly, and commits recovery progress page by page. It detects exact figure/table captions plus meaningful embedded-image or vector regions. Visual pixels are rendered from the immutable PDF only when requested, capped to a bounded image size, encoded as WebP, and cached by source hash, parser version, and element identity. The browser holds only the active image and preloads at most the next distinct visual. Full-book indexing therefore stores coordinates and captions rather than rasterizing every page or embedding image bytes in lesson JSON.

The parser removes **exact** duplicate page artifacts before assigning durable identities. If two
distinct records would otherwise share a text-and-bounds hash, a deterministic occurrence suffix
keeps their identities separate. Storage validates unique IDs and contiguous reading order before
replacing a page, so a malformed parse produces a page-specific recovery error rather than a raw
SQLite constraint failure or a partially erased page.

Before normalization, adjacent PDF text rectangles reconnect a trailing soft hyphen to a lowercase
continuation (for example, `to-` / `gether` becomes `together`). This is a deterministic layout
repair with an exact output span, not an inferred spelling correction; unrelated word boundaries
remain unchanged.

Tables of contents, lists of figures/tables, copyright matter, prefaces, indexes, bibliographies, references, and glossaries are classified conservatively from page position plus page-local evidence. Detected front/back matter stays in the canonical index and Source view but receives `playback_eligible: false`. A real chapter banner can break inherited front-matter classification; numbered code/ASCII rows alone cannot trigger a table-of-contents classification. This default may produce false negatives rather than silently streaming navigational material; a later reviewed structure pass can repair classification.

Docling remains the candidate escalation route for mixed or structurally complex documents. When introduced through an adapter and accepted against the golden corpus, configure it to retain:

- page number and bounding boxes;
- text spans and reading order;
- hierarchy labels;
- lists and code-like blocks;
- tables and cells when reliable;
- equations/formulas and nearby symbol definitions when supported;
- figures, captions, and in-text references;
- confidence and parser diagnostics.

Process bounded page windows, with a small overlap when a section, table, or figure crosses a boundary. Window size is tuned from memory and latency measurements; it is not encoded into content identity. The resulting page records use the original one-based PDF page index and retain printed page labels separately.

Docling supports page ranges, page batching, local layout models, table structure extraction, multiple OCR engines, and page/picture image generation. Its structured output is a starting point, not truth. [Docling pipeline options](https://docling-project.github.io/docling/reference/pipeline_options/) and [minimal package extras](https://github.com/docling-project/docling/blob/main/packages/docling-slim/README.md) document these capabilities.

### Parser landscape decision (recorded 2026-08-26)

A 2026 survey of the leading open-source layout parsers confirms the adapter choice on licensing alone, before any fidelity comparison:

- **Docling** (IBM / LF AI & Data): MIT-licensed, CPU-capable, structured `DoclingDocument` output — the only advanced candidate compatible with this project's licensing policy, and already version-gated at ≥ 2.91.0 for the archive/XML security fix.
- **Marker** (Datalab): GPL-3.0 code plus RAIL-M-restricted model weights — excluded by the same rule that excludes PyMuPDF's AGPL.
- **MinerU** (OpenDataLab): AGPL-3.0 — excluded.
- **OCR models** (olmOCR and similar permissively licensed candidates) remain a separately gated Tier 2 evaluation for scanned pages; none enters the pipeline without the golden-corpus comparison.

"Deterministic" for this pipeline means *versioned reproducibility with fail-closed gates*: identical source bytes plus identical parser identity must produce identical elements, and any component that cannot guarantee that (a layout model, an OCR engine) must pin model versions and decoding settings, carry its identity in `parser_version`, and lose to Source-only fallback whenever its confidence gates fail. Tiering stays: the native `pypdfium2` route (Tier 0) is the default and the baseline every adapter must beat on the reviewed corpus.

### Agent-assisted extraction review — Experimental

The WebMCP surface ([`WEBMCP_INTEGRATION.md`](WEBMCP_INTEGRATION.md)) enables a human-plus-agent review loop for pages the parser refuses to trust: read-only tools can expose a low-confidence page's rendered region, extracted candidates, and status to the learner's browser agent, which may *propose* corrections that the learner explicitly accepts into a `manual` extraction record. The agent never writes; acceptance is a learner action; provenance records the review. This is a review-throughput idea, not a fidelity shortcut, and it stays Experimental until the reviewed corpus shows it catches more errors than it introduces.

### Format routes

| Page class | First route | Escalation |
|---|---|---|
| Clean embedded text | Native text plus layout recovery | Page image check if reading order or figures are ambiguous |
| Mixed text and scans | Native text for reliable regions; OCR only on image regions | Full-page OCR when region extraction fails |
| Image-only scan | OCR adapter with deskew/orientation checks | Manual/source-only if confidence remains low |
| Dense equation page | Preserve page image, text tokens, and equation regions | Specialized formula route or Source mode |
| Complex table | Preserve cell grid and rendered crop | Table-specific extraction or Source mode |
| Code listing | Preserve monospaced spans, whitespace, line numbers, and caption | Source mode if whitespace semantics cannot be recovered |

OCR-heavy support is a staged capability, not a silent automatic promise. The initial release can index a full clean textbook while flagging unsupported scanned pages.

## 4. Canonical page record

Every extracted element needs spatial provenance:

```yaml
element:
  id: stable-within-source-version
  source_hash: sha256
  pdf_page_index: 42
  printed_page_label: "27"
  bbox_normalized: [0.11, 0.23, 0.88, 0.41]
  kind: paragraph | heading | code | equation | table | figure | caption | note
  text: "..."
  reading_order: 17
  extraction_method: native | layout_model | ocr | manual
  confidence:
    text: 0.0-1.0
    order: 0.0-1.0
    structure: 0.0-1.0
  parser_version: string
```

Offsets used by claims refer to this canonical extracted text and also retain the page region. A source viewer can therefore highlight the original page even if text offsets change in a later extraction version.

## 5. Structural stitching

After page windows commit, a document-level pass:

- removes repeated headers and footers without deleting meaningful repeated definitions;
- reconciles bookmarks, visual headings, printed page labels, and table of contents;
- joins paragraphs and code listings split across pages;
- links figures/tables/equations to captions and mentions;
- resolves “see Section 4.2,” citation, glossary, index, and exercise references;
- distinguishes main text, sidebar, warning, example, exercise, and solution;
- records chapter and section prerequisites where explicit;
- preserves disagreements between parser signals as review flags.

This produces a book graph. It is not yet a learner knowledge graph: one represents source structure; the other represents demonstrated learner knowledge.

## 6. Extraction quality gate

Confidence is multidimensional. A page can have perfect character extraction and still have a destructive reading order or attach a caption to the wrong figure.

Automated checks include:

- text coverage against embedded text where available;
- normalized bounding boxes inside page bounds;
- reading-order discontinuities and column crossings;
- heading hierarchy gaps;
- orphaned captions and references;
- table header/cell consistency;
- equation and code token preservation;
- repeated header/footer behavior;
- visual overlay snapshots for golden fixtures;
- cross-window continuity and page-number stability.

Evaluation reports errors by element and stage rather than hiding them inside one document score. Text correctness, reading order, page localization, region localization, table structure, equation/code preservation, caption association, retrieval, citation correctness, and downstream answer verification are distinct measurements. A correct answer grounded in the wrong region is a source-fidelity failure.

Page status is one of:

- `trusted_for_transform`;
- `transform_with_warning`;
- `needs_review`;
- `source_only`;
- `failed`.

Only trusted content contributes automatically to a draft lesson package. Warning content,
source-only content, and unsupported pages remain navigable in the original PDF but do not enter
the compiler until a later reviewed path exists. This is intentionally stricter than a generic
“best effort” converter: the current compiler must not create a plausible-looking stream from
warning-level extraction.

The compiler also joins consecutive trusted heading fragments into one meaningful section frame
instead of displaying isolated tokens such as `CHAPTER`, `ONE`, and a title as separate learning
events. The combined frame retains one exact source span per original heading, so its displayed
text is still source-verbatim and inspectable. When a narrowly recognized repeated running header
is merged with the first paragraph by PDF extraction, the compiler starts its span after that header;
the header remains available in Source and the displayed sentence remains an exact source substring.

## 7. Progressive textbook availability

Import has separate readiness levels:

1. **Source ready:** original pages render in PDF.js.
2. **Search ready:** reliable extracted text and headings are searchable.
3. **Structure ready:** chapters, sections, figures, tables, and cross-references are indexed.
4. **Section ready:** the chosen section has a validated claim/frame plan.
5. **Lesson ready:** representations and accessibility alternatives passed gates.
6. **Research ready:** required human review, approved publication states, frozen measurement assets, and package/protocol hashes are complete.

The UI must show the level rather than a vague spinner. The current local library displays the
latest import job, page cursor, recoverable error message, parser currency, selected-range
evidence, and the original-PDF route. A 900-page book can therefore be useful at source level
while a specific stream remains blocked.

## 8. Section compilation, not whole-book generation

When the learner opens a section, PRISM retrieves:

- the section’s canonical elements;
- its headings and stated objectives;
- locally adjacent context;
- referenced definitions, figures, tables, equations, examples, and prerequisites;
- earlier concepts required by the current claim;
- the learner’s relevant prior evidence.

Only this evidence bundle is sent to a generative model. The bundle contains stable element/span identifiers so structured output must cite them. Long-range links are retrieved explicitly instead of assuming a model will use a full textbook context reliably.

This design follows the evidence that long-context models can underuse information in the middle of their inputs, and that multimodal long-document systems remain weaker on figure/table reasoning and can be distracted by irrelevant pages. See [Liu et al., 2024](https://doi.org/10.1162/tacl_a_00638) and [Chia et al., 2025](https://doi.org/10.18653/v1/2025.emnlp-main.469).

### Selected-unit evidence closure

A section is not compilation-ready merely because retrieval returned relevant-looking pages. Before publication, the unit manifest must close over:

- every factual clause and its exact text or region locator;
- essential definitions, conditions, exceptions, symbols, code states, and worked steps;
- every figure/table/equation caption and in-text reference used by the lesson;
- prerequisite claims imported from outside the selected window;
- every assessment answer, rubric dimension, and repair claim;
- unsupported or uncertain elements that force Source-only fallback.

The manifest records what was intentionally excluded and why. Retrieval recall, evidence localization, and support review are therefore separate gates. The 2026 CiteVQA, DocScope, and XL-DocBench results that motivate stronger attribution remain preprints; they justify testing, not confidence in a particular parser or model.

## 9. Cloud-file boundary

OpenAI’s current file-input API can extract PDF text and page images, but each request is limited to 50 MB combined and visual page processing increases token use. The official guide itself recommends retrieval for large files. [OpenAI file-input guide](https://developers.openai.com/api/docs/guides/file-inputs).

Therefore PRISM does not make direct full-book upload its primary cloud path. Whole-book structural and search indexing runs locally, while deep generation begins only when the learner opens a section. PRISM sends only the minimum approved section evidence. A relevant page image or crop is included only when text extraction cannot express a diagram, equation, or spatial relation.

Cloud consent is per source, not global. Import, indexing, and prior approval of another file do not authorize transmission. Before the first cloud task for a private source, the UI previews the exact spans or page regions, task, and provider; approval is recorded against the immutable source hash.

If PRISM temporarily uploads a file:

- the user’s source-level cloud policy must allow it;
- the request uses the minimum retention-compatible endpoint configuration available;
- uploaded objects receive an expiry or explicit deletion job;
- provider object identifiers and deletion status are logged locally;
- a failed deletion remains visible until reconciled.

## 10. Resumption and invalidation

Each job stage commits atomically. A restart resumes from the first missing or stale artifact.

Current recovery behavior is deliberately explicit:

- an interrupted current-parser job resumes at its durable page cursor;
- a parser-version change creates a new page-zero reindex job without requiring re-upload;
- the immutable source bytes remain unchanged during either path;
- a failed page marks the source `needs_review`, keeps the latest job/error visible, and retains
  the original PDF route;
- stale or mixed parser versions block compilation until the new full reindex succeeds.

Artifacts are invalidated by dependency, not by deleting the whole import:

- parser version change → affected page extraction and downstream section artifacts;
- repaired reading order on page 42 → sections that reference page 42;
- prompt/model change → generated claims/frames, not the immutable source or extraction;
- pacing-policy change → presentation configuration, not content claims;
- learner overlay → personal lesson version, never canonical source.

Old artifacts remain addressable while research events reference them. Garbage collection removes only unreferenced derived artifacts after a recoverable quarantine period.

## 11. Full-PDF acceptance fixtures

The first fixture suite should contain licensed or synthetic examples of:

- single-column prose;
- two-column technical prose;
- repeated headers/footers and Roman/Arabic page labels;
- code with significant indentation;
- a figure plus caption and cross-page reference;
- a simple and a multi-page table;
- inline and display equations;
- bookmarks/table of contents;
- one mixed scan page;
- an encrypted PDF;
- a malformed or resource-adversarial PDF.

For each fixture, store reviewed expected elements, reading order, regions, and capability status. Parser upgrades pass the corpus before merge.

The current synthetic regression fixture also seeds an exact duplicate text rectangle and a
parser-version restart. It verifies that the importer deduplicates the artifact, never reuses an
element ID, reports the failed page cleanly, and can rebuild the same immutable source from page
one without a second upload. A real private textbook may be used for local smoke testing, but its
bytes, title, and extracted text must remain outside the repository.

## Success criteria

A large-PDF pipeline succeeds when:

- the user can begin a chosen clean section without waiting for full-book lesson generation;
- every frame opens the correct original page region;
- interrupt/resume preserves page identity and does not duplicate work;
- unsupported pages fail visibly and locally;
- cost scales with sections transformed, not pages merely stored;
- a parser/model upgrade can be evaluated against frozen golden fixtures;
- the source remains usable even when every AI service is offline.
