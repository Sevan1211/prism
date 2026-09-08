# Enhanced Source Reader specification

**Status:** PDF.js Reader v1.2 implemented; full local-reader contract adopted 2026-08-29  
**Reviewed:** 2026-08-31  
**Related:** [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md), [`INTERACTIVE_LESSON_SPEC.md`](INTERACTIVE_LESSON_SPEC.md), [`../architecture/DOCUMENT_INTELLIGENCE.md`](../architecture/DOCUMENT_INTELLIGENCE.md), [`../architecture/DEVICE_LOCAL_WEB_ARCHITECTURE.md`](../architecture/DEVICE_LOCAL_WEB_ARCHITECTURE.md)

## Purpose

PRISM must be an excellent PDF reader even when no agent is connected. The Reader is the original-source surface, the trust boundary behind every lesson, and the recovery path when extraction or reconstruction is uncertain.

Reader progress is exposure evidence only. Pages viewed, time, highlights, and searches never become comprehension or mastery labels.

## Current implementation evidence

The implemented v1.2 includes PDF.js canvas rendering, responsive high-DPI page rendering, document-authored outline and subsection navigation, outline filtering, printed page labels, embedded title/author/subject/format metadata, computed-heading recovery, reading progress and continue-reading, a clearly disclosed page-group fallback, exact page entry, previous/next controls, zoom, fit-width/fit-page modes, collapsible contents and details rails, keyboard search, light/dark themes, and a route-addressable current PDF page. Personal PDFs and reading state persist in the browser-local OPFS/IndexedDB vault. A resumable PDF.js evidence index provides exact local text search, stable candidate-element/page-region anchors, and agent-triggered visible highlights; the Reader mounts selectable text layers only for viewport-adjacent pages. Local-companion sources continue to use FTS5 search. Selection-to-anchor capture, local annotations, visual copying, thumbnails, rotation, single-page mode, tagged-structure reconciliation, persisted zoom/display preferences, and complete accessibility/performance evidence remain required work.

## Surfaces

```text
Library
  └─ Source overview
       ├─ Read original
       ├─ Source readiness and quality
       └─ Saved lessons
            └─ Reader
               ┌──────────────┬───────────────────────────┬─────────────────┐
               │ structure    │ original PDF             │ context         │
               │ outline      │ canvas + text layer      │ section         │
               │ thumbnails   │ annotations + highlights │ figures/assets  │
               │ bookmarks    │ selection + region tools │ lesson backlinks│
               └──────────────┴───────────────────────────┴─────────────────┘
```

The rails collapse through explicit controls. At phone widths the contents rail becomes a temporary overlay without replacing the document route. The Reader keeps one canonical route, `/sources/:sourceId/reader?page=:pdfPage`; lesson source inspection opens this exact surface rather than a second embedded-PDF implementation. Reader scrolling replaces the current page query, while explicit page, outline, search, and agent navigation creates a history entry.

## Rendering

PDF.js is the canonical browser renderer:

- the canvas preserves page appearance;
- the text layer provides selection, copy, search highlighting, and accessibility support;
- the annotation/editor layers provide the foundation for local highlights, comments, ink, and stamps where adopted;
- rendering and extraction run in workers;
- pages are virtualized and mounted near the viewport;
- unmounted pages retain dimensions and navigation identity without filling the accessibility tree with hundreds of page nodes;
- the embedded browser PDF object remains an unsupported-environment fallback only.

The original PDF bytes come from the browser-local vault for personal sources. Hosted open-license samples may be fetched and then cached locally.

## Source structure

Sections reconcile:

1. PDF outline/bookmark entries;
2. tagged structure when available;
3. computed visual headings and boundaries;
4. learner-accepted manual correction.

Section titles remain source-verbatim. Overlap, nonmonotonic order, and disagreement are flagged rather than silently normalized. A structure-free document remains fully readable with page-group navigation.

The Reader inspects the actual PDF at open time rather than assuming a source imported before the structure contract has no contents. Embedded bookmarks remain authoritative and retain their nested chapter/subsection order. A bookmark destination may be a direct page reference or a named destination. Unresolvable bookmark nodes do not fabricate page locations; heading detection is the next fallback, and generic page bins are used only when neither route produces navigation.

## Selection and copy

### Text

The learner can select and copy text from the PDF.js text layer. When extraction coverage exists, the selection resolves to stable source element and span identifiers plus page regions. Copy actions may include an optional citation containing source title, page label, section path, and anchor.

Selections that cross uncertain reading-order or OCR regions show a warning and preserve the raw visible order. PRISM does not silently rewrite copied source text.

### Visuals

The learner can:

- click a detected figure, table, equation, or code region;
- draw a rectangle over any visible page region;
- copy the selected region as a high-resolution local image;
- save it to the lesson asset tray;
- export it locally;
- open its caption, legend, mentions, extraction status, and source anchor.

Region selection remains available when automatic visual detection fails. Copying a crop does not imply that PRISM understands its semantics.

## Search and navigation

Reader search supports exact, fuzzy, structural, and agent-mediated conceptual intents. Every result includes its section, page, region, extraction status, and visible highlight.

The navigation contract supports:

- page and printed-page labels;
- outline and heading navigation;
- thumbnails;
- bookmarks and back/forward history;
- exact PDF-page URLs in the current implementation and span/region anchor URLs in the required extension;
- **Continue reading** to the last page and scroll position;
- lesson frame to source anchor;
- source anchor to every lesson block that uses it;
- agent navigation to an exact page and region.

An agent request such as “Where are packets first introduced?” searches candidates, inspects context, and then invokes `open_source_location`. The Reader visibly navigates, highlights the chosen region, and exposes what changed.

## Local annotations

Annotations are PRISM overlays and do not modify the immutable PDF:

- text highlights with named colors;
- margin notes and comments;
- region highlights;
- bookmarks;
- optional ink or image stamps after the core path;
- links to lesson sections and agent discussions.

Annotations autosave locally and delete with the source unless exported. Annotated-PDF export is a later explicit operation with its own fidelity tests.

## Reading state

```yaml
reading_state:
  source_id: string
  section_id: string | null
  last_page: integer
  last_scroll_ratio: number
  furthest_page: integer
  zoom: number
  rotation: integer
  display_mode: continuous | single_page | page_fit
  active_seconds: number
  updated_at: timestamp
```

Active time accrues only while the Reader is visible and the page is focused under a versioned rule. It remains exposure evidence. Reading state is stored in the browser-local vault and remains available without an agent.

## Source and lesson context

The context rail shows:

- current section and extraction status;
- detected figures, tables, equations, and code on the visible page;
- highlights and notes;
- lessons that cover the visible anchor;
- **Create lesson from selection** when an agent is available;
- **Ask agent about this** with a preview of the exact span or region that will be shared.

The agent never receives a hidden page or selection. A private source requires current source-level consent before content-bearing tools register or execute.

## Keyboard and accessibility

- complete keyboard navigation for structure, pages, search, zoom, selection actions, annotations, context, and lesson return;
- outline uses correct tree semantics;
- pages expose stable landmarks and labels without mounting the whole book in the accessibility DOM;
- selected source text remains available to assistive technology;
- zoom and browser text scaling reach 200 percent without lost controls;
- overlays meet contrast requirements and never rely on color alone;
- reduced motion disables smooth scrolling and animated transitions;
- OCR, equations, tables, code, and figures expose appropriate semantic alternatives when available and honest unavailable states otherwise.

## Performance and recovery

- a 400+ page indexed source opens its overview in under one second from local persisted state on the benchmark machine;
- only viewport-adjacent pages and text layers are mounted;
- search and exact navigation remain responsive on 1,000+ page fixtures;
- browser restart restores the source, page, scroll, zoom, and open lesson-return anchor;
- low storage, interrupted import, stale parser output, and missing linked-file permission produce recoverable states;
- no PDF work blocks the UI thread.

## Acceptance criteria

1. A personal PDF can be added, closed, and reopened without server persistence.
2. Text selection and copy work on the born-digital golden corpus and resolve to source anchors where coverage exists.
3. Exact search opens and visibly highlights the correct region.
4. Agent navigation opens the correct source, section, page, and region.
5. Detected visuals and arbitrary page regions can be copied locally.
6. Highlights and notes survive application restart and remain linked to source fingerprints.
7. A source anchor lists the lesson sections and frames that cite it.
8. A structure-free or low-confidence PDF remains readable without fabricated structure.
9. Keyboard-only and screen-reader smoke paths cover open, navigate, search, select, annotate, copy, and return.
10. Page virtualization does not expose the entire large-book page list as live page content to accessibility tools.
11. Progress language always describes exposure.
12. Deleting a source removes its local bytes, indexes, annotations, lessons, and permissions or reports an auditable incomplete deletion.

## Capability boundary

Rendering, extraction, and semantic interpretation have separate readiness states. Scans, complex equations, tables, charts, multi-column layouts, and protected documents use the tiered rules in [`../architecture/DOCUMENT_INTELLIGENCE.md`](../architecture/DOCUMENT_INTELLIGENCE.md). A source can be Reader-ready while remaining ineligible for lesson transformation.


## Numbered contents navigation — 2026-09-03

The Reader preserves nested document bookmarks without a four-level depth cap.
Each branch has its own expand/collapse control, with Expand all and Collapse all.
Search retains the ancestors of matching headings. Current-page navigation marks
the active heading and opens its ancestry unless the learner explicitly collapsed it.
Printed section numbers are retained when present; otherwise numbers represent
outline order and the UI discloses that distinction. Printed PDF page labels are
shown when supplied, with the physical PDF page in the destination tooltip.

Numbered detected headings may supplement a bookmark only beneath a matching,
source-numbered parent covering that page. Unsupported inferred headings are not
invented to fill a hierarchy. Scanned pages without recoverable headings still
need a separate OCR/structure path; the navigation does not claim to recover those.
