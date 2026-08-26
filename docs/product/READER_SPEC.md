# Enhanced Source Reader specification

**Status:** v1 implemented 2026-08-26 (PDF.js canvas, outline/computed sections, reading progress with continue-reading, FTS5 search with region highlight, page-group fallback, dual themes); text-selection-to-element mapping and per-section active-time remain open  
**Reviewed:** 2026-08-26  
**Baseline role:** the Source Reader is a first-class product surface and the principal learning comparison condition ([`PRODUCT_SPEC.md`](PRODUCT_SPEC.md)); this document specifies the reading experience it must provide  
**Related:** [`../engineering/IMPLEMENTATION_PLAN.md`](../engineering/IMPLEMENTATION_PLAN.md) (M1), [`../architecture/PDF_PIPELINE.md`](../architecture/PDF_PIPELINE.md), [`../architecture/WEBMCP_INTEGRATION.md`](../architecture/WEBMCP_INTEGRATION.md)

## Purpose

PRISM needs a reader that makes a full textbook *livable*: openable to the right section in seconds, navigable by the book's own structure, and able to remember exactly where the learner stopped. Commercial reading platforms treat these as table stakes; PRISM must provide them locally, without accounts, and with PRISM's provenance guarantees. The reader is also the everyday surface from which Traceable Semantic Relay sessions are launched, so its structure and progress model are shared infrastructure, not a side feature.

This is a reading-experience contract. Reading progress is **exposure evidence only**; nothing in this surface may present time, pages, or completion as demonstrated learning.

## Surfaces

```text
Library (shelf)
  └─ Book overview: cover page render, structure outline, continue-reading card,
     readiness levels, rights and parser status
       └─ Reader (three zones)
          ┌───────────────┬──────────────────────────────┬─────────────────┐
          │ structure rail │ page canvas                  │ context rail    │
          │ chapters,      │ original PDF pages,          │ current section,│
          │ sections,      │ virtualized, text-selectable,│ figures on page,│
          │ progress ticks │ region overlays              │ extraction      │
          │                │                              │ status, actions │
          └───────────────┴──────────────────────────────┴─────────────────┘
```

The structure rail and context rail collapse below desktop widths; the page canvas is never blocked by either.

## Section model

Sections come from two extraction routes, reconciled into one stored structure:

1. **Outline route.** PDF bookmarks/outline entries via the native parser, with title, level, and resolved page target.
2. **Computed route.** The existing heading elements and chapter/section boundary detection, used when a PDF has no outline or the outline disagrees with page evidence.

Stored shape:

```yaml
source_section:
  id: stable-within-source-and-parser-version
  source_id: src_…
  parent_id: section id or null
  title: source-verbatim heading text
  level: 1..4
  page_start: one-based PDF page
  page_end: one-based PDF page (inclusive)
  origin: outline | computed | manual
  confidence: 0.0-1.0
```

Rules:

- section titles are source-verbatim; the reconciler may trim page numbers from outline titles but never rewrites wording;
- overlapping or non-monotonic sections are flagged, not silently repaired;
- a source with no recoverable structure remains fully readable page-by-page; the rail then shows page groups instead of pretending structure exists;
- the compiler's page-range selection UI offers sections as named ranges, replacing raw page-number entry as the primary path (a mid-page section start also lets the recommendation engine stop opening a window mid-sentence, the defect recorded in [`../experiments/BENCHMARK_CORPUS.md`](../experiments/BENCHMARK_CORPUS.md) on 2026-08-26).

## Rendering decision

The inline browser PDF viewer cannot provide text selection synchronized with stored element regions, exact span overlays, virtualized rendering, or theming. Those are now required by this specification, which meets the escalation condition recorded in [`../architecture/TECH_STACK.md`](../architecture/TECH_STACK.md). The reader therefore adopts **PDF.js** (Apache-2.0) as a direct dependency:

- pages render into a virtualized canvas list (current ± 2 mounted; the rest are placeholders with correct dimensions);
- the PDF.js text layer provides selection and copy; selections resolve to stored element ids and normalized regions where coverage exists;
- span highlighting draws from PRISM's stored `bbox_normalized` values over the rendered page, which keeps every overlay traceable to indexed evidence rather than to viewer-side re-extraction;
- the PDF.js worker runs off the main thread; no document parsing on the UI thread;
- the embedded `<object>` viewer remains only as a fallback for unsupported environments.

## Reading progress model

```yaml
reading_state:
  source_id: src_…
  section_id: section id or null when structure is absent
  furthest_page: one-based PDF page
  last_page: one-based PDF page
  last_scroll_ratio: 0.0-1.0 within the page
  active_seconds: derived, focus-gated
  updated_at: UTC
```

Rules, consistent with the product spec's active-time constraints:

- `active_seconds` accrues only while the tab is focused and the reader is visible; blur or `visibilitychange` stops accrual under a versioned grace rule;
- progress ticks in the structure rail show furthest-reached position per section; percentages are page-based exposure, labeled as such;
- **Continue reading** reopens the exact source, section, page, and scroll position from `reading_state`;
- no progress value ever feeds a mastery, retention, or comprehension label;
- progress rows are local data, exported only through the research-event path, and deleted with the source.

## Search

The already-populated FTS5 element index becomes user-facing:

- `GET /api/sources/{id}/search?q=…` returns ranked matches with element id, page, normalized region, kind, document region, and extraction status;
- results open the reader at the page with the matched region highlighted;
- front and back matter remain searchable (their indexing exists for exactly this) and are labeled as navigation matter in results;
- query text stays local; search never leaves the device.

## Keyboard and accessibility requirements

- complete keyboard operation: structure rail navigation, page movement, search, zoom, and return-to-frame;
- the structure rail is a proper tree with ARIA semantics; the canvas exposes page landmarks;
- text scale and page zoom to 200 percent without loss of controls;
- overlays meet contrast requirements in both color themes and never rely on color alone;
- reduced-motion mode disables smooth scrolling and animated transitions with equivalent function.

## Acceptance criteria (added to M1)

1. A 400+ page indexed book opens to its structure view in under one second from the local API.
2. Selecting a section opens the correct first page; the rail tracks scroll position live.
3. Continue-reading restores source, page, and scroll position across full application restarts.
4. Search finds an exact term from the golden corpus and opens the correct highlighted region.
5. A span selected in the canvas reports its element id, page, and offsets (the same identifiers the compiler uses).
6. A structure-free PDF remains readable with page-group navigation and no fabricated sections.
7. Keyboard-only and screen-reader smoke paths cover open → navigate → search → read → return.
8. Progress language throughout says exposure ("reached page 214 of 489"), never learning.

## Explicitly out of scope for the first reader release

- annotations, highlights-as-notes, and margin comments (deferred by the owner-authorized pilot scope);
- text-to-speech and narration;
- cross-device sync and accounts;
- scanned-PDF OCR (governed by the pipeline's staged capability plan);
- any comprehension scoring attached to reading behavior.
