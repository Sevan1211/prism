# Design direction

**Status:** modern research-tool shell and Reader direction implemented 2026-08-31  
**Reviewed:** 2026-09-07 (optical studio landing, monochrome controls, spectrum wordmark)  
**Related:** [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md), [`READER_SPEC.md`](READER_SPEC.md), [`INTERACTIVE_LESSON_SPEC.md`](INTERACTIVE_LESSON_SPEC.md)

## Direction: the modern research instrument

PRISM is a serious learning instrument, not a preserved skin from the semantic-stream prototype or a generic AI dashboard. No visual element from either direction is protected merely because it already exists.

The adopted direction combines the precision of a modern research tool with the compositional quality of an excellent technical publication:

- a quiet neutral application shell makes the source, not navigation chrome, the dominant object;
- compact controls, exact alignment, restrained borders, and stable density replace decorative cards and presentation panels;
- monochrome actions and focus keep color concentrated in source visuals and spectrum artwork; semantic status colors remain separate and labeled;
- the source is the stable organizing object;
- every lesson, plan, annotation, and evidence receipt belongs to a source;
- long-form reading uses editorial typography, while controls remain compact and direct.

It should feel purpose-built for turning a textbook or paper into an inspectable learning experience. It must not resemble a generic AI dashboard, chat wrapper, marketing page, slide deck, or quiz platform.

## Information architecture and navigation

PRISM uses real browser routes. Navigation destinations are links, refresh preserves the current destination, and browser back and forward restore prior destinations:

| Destination | Route |
|---|---|
| Source library | `/sources` |
| Source overview | `/sources/:sourceId` |
| Source lessons | `/sources/:sourceId/lessons?plan=:planId` (plan query optional) |
| Original Reader | `/sources/:sourceId/reader?page=:pdfPage` |

The desktop application uses three functional zones:

1. **Application header:** PRISM wordmark, Library destination/count, import action, agent tools, help, storage, and appearance.
2. **Folder rail:** All sources, Unfiled, and named folders, shared across the library and source workspace.
3. **Working canvas:** a route-specific library, source overview, or source-owned lesson surface.

The obsolete one-item command rail, fake abstract covers, decorative workflow stepper, oversized agent handoff panel, and nested card wall are excluded. On smaller screens the folder navigation wraps above the working canvas. Incomplete future destinations are not shown as disabled navigation.

## Library and folders

**Revised locally, 2026-09-07.** A single 64px application bar contains the wordmark,
Library label/count, Add PDF, and utility controls. There is no second title banner.
The destination is named Library; existing `/sources` URLs remain valid. Desktop
utility buttons share sizing, neutral icons, hover/pressed states, and focus rings.
At narrow widths, one Workspace controls button reveals agent tools, help, storage,
and appearance; Escape closes it and returns focus. Add PDF remains directly visible.
The import dialog offers optional source-access consent beside rights and storage
information, so an explicit grant can be saved during import. The checkbox starts
unchecked and resets for a different selection. Agent tools ends with a short
approval explanation and matching Retry connection, Agent guide, and ChatGPT setup
actions; external links identify that they open a new tab.
Library, source overview, and source lessons
share the same folder rail, outer padding, and available window width. Opening a
source replaces the working canvas without swapping navigation or adding another
centered margin. Source titles use the same reading typeface at a compact scale.
The rail highlights the source's folder; choosing a folder opens its source list.
Returning from a source preserves the previous library filter, search, and sort.
Readable rows show a book icon, title, page count, readiness, and an accessible
folder selector. Book icons replace the small PDF glyphs in source navigation and
import. The library remains neutral in both themes, with semantic status colors.

All sources, Unfiled, and named folders are available on desktop and mobile. Folders
support creation, rename, safe removal, and source moves. Import targets the selected
folder. Search, sorting, empty folders, no matches, and storage failures have visible
states. See [source folders](../architecture/SOURCE_FOLDERS.md) for persistence and
validation. No example sources or decorative fake book covers are shipped.

## Lesson canvas direction

The generated lesson is a visually composed, scrollable interactive textbook chapter. It may contain multiple sections, detailed prose, definitions, source figures, reconstructed diagrams, equations, code, worked examples, structured comparisons, bounded interactions, end questions, and a coverage receipt.

The first renderer now composes approved sections into a continuous paper-like manuscript
with restrained evidence labels, technical block treatments, validation disclosures, and
manual step controls. It intentionally renders text and structured data through React;
no agent HTML, CSS, SVG, or JavaScript enters the page. Equations are rendered as semantic
HTML and MathML with a readable LaTeX fallback, and every cited block exposes exact source
evidence that returns through the Reader. Source-image regions, syntax highlighting,
lesson outline navigation, and final reading polish remain open.

Semantic frames remain internal units for provenance and revision. They do not force isolated full-screen cards. A lesson section should read as one coherent instructional narrative, with an outline and source inspection always available. Traceable Semantic Relay is an Experimental alternate renderer for compatible explanations, not the default interface.

## Type roles

| Role | Face | Use |
|---|---|---|
| Reading | Literata, then Charter/Georgia | Lesson prose and long-form explanations |
| Interface and display | Aptos/Segoe UI Variable, then system UI | Navigation, headings, controls, labels, status, receipts |
| Evidence | Cascadia Code/Consolas | Hashes, anchors, offsets, parser identity, immutable version data |

Monospace is evidence typography, not a general visual motif. Reading text targets a comfortable line length and at least 1.55 line height.

## Core color system

| Role | Light | Dark |
|---|---|---|
| Ground | `#f4f5f5` | `#141616` |
| Surface | `#ffffff` | `#1b1d1d` |
| Ink | `#181a1a` | `#f1f3f2` |
| Primary action and focus | `#252929` | `#eef0ee` |
| Action hover / emphasized links | `#080a0a` | `#ffffff` |
| Text on primary action | `#ffffff` | `#151717` |
| Selected surface | `#e4e7e6` | `#303534` |

Decorative spectral gradients, blue glow, fake technical ornament, and unrelated multicolor state treatments are excluded from the reading workspace. The shared spectrum wordmark and landing-page optical metaphor below are scoped exceptions. Status never relies on color alone. Both themes are first-class and must pass contrast checks.

## Spectrum identity and control polish

**Local design pass, 2026-09-07; awaiting owner visual review.** The owner selected
an optical studio direction and mostly black-and-white controls, reserving color
for rainbow artwork. Shared neutral tokens replace the rejected violet proposal
across the landing and library. The approved background prism and wordmark remain.

`PrismWordmark` uses the owner's subsequent 2026-09-07 image as the visual authority:
heavy serif letterforms traced into paths, a circular dot, and a six-band spectrum
with touching, slightly overlapping color wedges. The owner subsequently removed
the separators to keep the small wordmark clean. It has no terminal period, embedded bitmap, or font
dependency. The transparent asset is `apps/web/src/assets/prism-wordmark.svg`;
the component references its shapes and inherits the theme's ink color. The header,
footer, and library reuse it. Parent links supply readable accessible names;
the decorative lettering and rays are hidden from assistive technology.

Keep the existing Phosphor icon family for theme controls and directional arrows.
The optical study is a content illustration built with native SVG.
Icons supplement text. The landing CTA has a 52 px minimum height; header links and
the theme control have at least 44 px targets. Hover clarifies the destination with
color, underline, and a small arrow shift; press adds inset feedback. Keyboard focus
remains explicit. Control motion is limited to 160 ms transitions and small transforms
when reduced motion is not requested. The wordmark remains static; the owner-requested
background rainbow flow is the bounded exception described below.

## Source-to-explanation demonstration below the hero

The owner refined the optical studio into an explicit source-to-explanation example.
“Read it. See it.” introduces a textbook-style passage on the left and an interactive
PRISM explanation on the right. The passage is visibly attributed as adapted from
NASA, not presented as a scan from an invented textbook. Two idea controls select
an explanation and highlight the corresponding source sentence. “Find this in the
passage” scrolls to and focuses that sentence, including for keyboard users.

A spectrum and enlarged wave replace the earlier decorative lens and fan. Changing
the native slider changes both wave spacing and approximate screen color, selects
the wavelength explanation, and updates the source connection. Text and a numerical
readout communicate the change without color. Reset returns to 550 nm and the
wavelength explanation. NASA's source remains a direct link.

The example is authored for this landing page, with illustrative colors and enlarged
distances. It is not a physical optics simulation or evidence of learning gains.
No private source, agent, account, storage change, or telemetry is involved. This is
a prepared interactive example, not live AI generation. On phones the source comes
before its explanation and the complete diagram scales to fit; controls and source
access reflow in reading order. Only the existing hero rainbow
has automatic motion. See the [design research brief](../research/LANDING_DESIGN_RESEARCH_2026-09-07.md)
for precedents, evidence limits, and the rationale for familiar controls within a
distinctive composition.

Local validation for this pass: all four landing tests, frontend lint, TypeScript
and production build, and documentation checks pass. Chrome exercised both themes
at 1440, 768, 390, and 320 px, with no horizontal overflow or captured page errors.
Keyboard Home/End adjustment, reset, idea selection, source-sentence focus, library
navigation, and reduced motion passed. Desktop and phone screenshots were inspected.
The unchanged primary button text contrast was previously measured at 14.71:1 in
light mode and 15.71:1 in dark mode. The unused sync emulator on 8787 and older static
preview on 4173 were stopped; the live editing preview remains on 5173. These are local checks, not complete
accessibility certification, owner visual acceptance, or deployment evidence.

## Landing-page prism and subtle rainbow flow

**Revised 2026-09-07; local only.** The owner replaced the laggy interactive 3D
prototype with the approved black-prism SVG, then requested extremely smooth,
subtle motion in its rainbow. The original image remains intact with an explicit
aspect ratio. `PrismFlow` overlays a faint moving CSS highlight, aligned to the existing
beam's transform and fade. A clipped, masked layer uses a compositor-friendly 3D
translation instead of repainting SVG paths each frame. No canvas, shader,
animation library, or JavaScript frame loop is involved.

The CSS animation moves a repeated gradient outward at constant speed over 16
seconds, wrapping at exactly two pattern widths. Its white highlight peaks at
15% opacity before the figure's theme-independent 28%/20% opacity. Colors keep
their order and position; the prism geometry, incoming light, and wordmark do not
move. At the owner's request, the rainbow runs automatically without an on-page
pause control. Intersection and page-visibility observers suspend motion offscreen
and in hidden tabs, resuming when visible. Reduced motion disables the animation,
leaving the original static SVG.

Earlier flow-pass checks: four landing tests, frontend lint/typecheck/build, and docs
checks pass. Chrome covered light/dark at 1440, 390, and 320 px without horizontal
overflow, plus pause/resume, offscreen suspension and reduced-motion disabling.
Captured frames at 0 and 16 seconds match exactly; different phases change pixels
only in the rainbow region, by at most 9/255 per color channel in the dark desktop
sample. A three-second headless Chrome sample of the composited version observed
439 frame callbacks (6.1 ms median, 12.1 ms p95). This is a local timing observation,
not a frame-rate guarantee across devices. No page errors were captured.

The header, hero copy, actions, optical study, and footer use
the reading workspace's shared theme tokens, typography, borders, and monochrome
action colors. The oversized, unframed SVG sits directly on the page's theme ground,
behind the hero text layer, with no colored panel, border, or shadow. Absolute
positioning removes it from document flow so it overlaps the headline and actions
rather than forming a separate section below. Opacity is 28% on desktop and 20% on
narrow screens to preserve foreground readability. The artwork ignores pointer input;
the hero clips excess beam margins. System is the default theme; explicit saved
choices remain respected. The illustration remains an art-directed brand metaphor.

The former renderer, shader, optics implementation/tests, and camera controls,
generated fallback image, and renderer-specific dependencies are removed. Shared
light/dark/automatic theme selection and library navigation remain available.
Reduced motion uses the original static image with the flow overlay hidden.

The imported SVG measures 6.03 kB raw and approximately 1.67 kB gzip in the local
production build. This is an asset-size measurement, not a measured page-speed
improvement. Automated checks cover wavelength changes and reset, source access,
the static image, absence of obsolete controls, shared theme persistence, and
application navigation.
Local preview is for owner review; no deployment is part of this change.


## Interaction and motion rules

- The original source is reachable in one action from every source and lesson surface.
- Every durable destination and current Reader page is represented in the URL.
- The learner sees what the agent can access and approves consequential composition or revision.
- Controls use visible verbs; essential actions do not depend on unexplained icons.
- Source and folder removal use one shared PRISM confirmation dialog. It identifies
  the item and consequences, starts keyboard focus on Cancel, contains Tab navigation,
  and returns focus after dismissal. Source removal includes lessons/history;
  folder removal preserves them and moves sources to Unfiled. Connected libraries
  disclose synced removal. Pending removal disables repeat actions and dismissal;
  failures remain in the dialog with a retry action. No browser-native alert is used.
- Utility icons come from one consistent audited icon family; hand-authored SVG is reserved for the PRISM brand mark or content visuals.
- Motion is short opacity, color, and small-position feedback. Reduced motion removes nonessential transitions.
- No unsafe flashing, parallax, ambient particle field, or decorative animation competes with learning. Only the landing rainbow has continuous motion, with automatic offscreen suspension and reduced-motion fallback; the owner requested no on-page pause control.
- Agent-generated material is rendered from typed PRISM blocks. Arbitrary HTML, CSS, JavaScript, or SVG is never accepted.

## Acceptance

- A returning learner reaches a source or saved lesson without passing through marketing copy.
- Browser back, forward, refresh, and direct deep links preserve source, lesson, Reader, and Reader-page context.
- The Reader remains usable without an agent.
- Source, plan, lesson, and evidence relationships are legible at a glance.
- Desktop and mobile preserve the same task order and privacy meaning.
- Light, dark, keyboard, reduced-motion, and forced-color behavior are release gates.
- A delayed JavaScript boot or runtime failure shows a branded recovery state, never an unexplained blank canvas.
- The finished lesson looks like a carefully authored interactive technical chapter, not a set of AI cards.

