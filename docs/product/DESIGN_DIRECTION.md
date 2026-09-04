# Design direction

**Status:** modern research-tool shell and Reader direction implemented 2026-08-31  
**Reviewed:** 2026-08-31  
**Related:** [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md), [`READER_SPEC.md`](READER_SPEC.md), [`INTERACTIVE_LESSON_SPEC.md`](INTERACTIVE_LESSON_SPEC.md)

## Direction: the modern research instrument

PRISM is a serious learning instrument, not a preserved skin from the semantic-stream prototype or a generic AI dashboard. No visual element from either direction is protected merely because it already exists.

The adopted direction combines the precision of a modern research tool with the compositional quality of an excellent technical publication:

- a quiet neutral application shell makes the source, not navigation chrome, the dominant object;
- compact controls, exact alignment, restrained borders, and stable density replace decorative cards and presentation panels;
- one restrained vermilion accent identifies action and focus, while semantic status colors remain separate and labeled;
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

1. **Application header:** product identity, top-level Sources destination, local/WebMCP state, and theme.
2. **Source sidebar:** filterable local library and import action.
3. **Working canvas:** a route-specific library, source overview, or source-owned lesson surface.

The obsolete one-item command rail, fake abstract covers, decorative workflow stepper, oversized agent handoff panel, and nested card wall are excluded. On smaller screens the source sidebar leaves the primary reading order; library and source destinations remain reachable through the header and browser history. Incomplete future destinations are not shown as disabled navigation.

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
| Primary action and focus | `#b64a31` | `#df795f` |

Decorative spectral gradients, blue glow, fake technical ornament, and unrelated multicolor state treatments are excluded. Status never relies on color alone. Both themes are first-class and must pass contrast checks.

## Interaction and motion rules

- The original source is reachable in one action from every source and lesson surface.
- Every durable destination and current Reader page is represented in the URL.
- The learner sees what the agent can access and approves consequential composition or revision.
- Controls use visible verbs; essential actions do not depend on unexplained icons.
- Utility icons come from one consistent audited icon family; hand-authored SVG is reserved for the PRISM brand mark or content visuals.
- Motion is short opacity, color, and small-position feedback. Reduced motion removes nonessential transitions.
- No unsafe flashing, parallax, ambient particle field, or decorative animation competes with learning.
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
