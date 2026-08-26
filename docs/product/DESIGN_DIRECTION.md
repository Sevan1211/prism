# Design direction

**Status:** approved by the owner 2026-08-26 and implemented the same day — `tokens.css` carries the full Paper/Slate set, Literata is self-hosted, and the library, shelf, Reader, and player all consume the shared tokens with a three-state theme toggle  
**Reviewed:** 2026-08-26  
**Related:** [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md) (canvas contract, accessibility gates), [`READER_SPEC.md`](READER_SPEC.md)

## Honest critique of the current interface

The current UI established a real identity — warm paper, ink, Baskerville display, mono provenance labels — and its accessibility behavior is ahead of its visual polish. The execution problems, recorded so the redesign has explicit targets:

1. **The library is a landing page, not a workspace.** A hero block and slogans push the actual instrument (sources, readiness, range selection) below the fold; returning users see marketing copy before their book.
2. **Monospace is doing too many jobs.** Eyebrows, labels, evidence, controls, and body-adjacent text all reach for mono, which flattens hierarchy and reads noisy.
3. **The player canvas fights the product spec.** The spec's stable-zone sketch (persistent anchor left, current frame center, carry-forward context, control strip) is only loosely implemented; zones shift with content length, and the decorative SVG "meaning path" spends attention without carrying information.
4. **No dark theme.** A reading instrument used at night renders cream at full brightness; the rendered visual crops also hard-code a cream background.
5. **Number theater.** Zero-padded index numbers (01, 02) decorate lists that are not sequences.
6. **The reading surface has no reading typography.** Frame text is display-set; long claims wrap badly, and there is no long-form face, measure, or leading system for the Reader that M1 requires.

## Direction: The Reading Instrument

One direction, evolved from the existing identity rather than replacing it — the paper-and-ink character is distinctive and worth keeping; the redesign gives it discipline. Two alternates (a cool "laboratory" neutral scheme and a high-contrast editorial scheme) were considered and rejected: both would discard the established identity for generic looks.

### Principles

- **The book is the interface.** Chrome recedes: hairlines, not cards; one accent in view at a time; the page canvas and frame text get the contrast budget.
- **Three type roles, strictly cast.** A reading serif for source text and frame content; the system UI face for controls and labels; mono *only* for provenance data (hashes, offsets, page regions, extraction status). If it is not evidence, it is not mono.
- **Structure is information.** Numbering, ticks, and rails appear only where order or position is real (frame sequence, section progress) and never as decoration.
- **Both themes are first-class.** Paper (light) and Slate (dark) ship together; every token is defined in both; rendered visual crops respect the theme by rendering on a neutral ground.

### Type system

| Role | Face | Fallbacks | Use |
|---|---|---|---|
| Reading | Literata (variable) | Charter, Georgia, serif | Frame content, Reader text layer companion, study prompts — 60–75ch measure, 1.6 leading |
| UI | Aptos / Segoe UI Variable | system-ui, sans-serif | Controls, navigation, labels, receipts |
| Evidence | Cascadia Code | Consolas, ui-monospace | Hashes, offsets, page/region readouts, parser identifiers |
| Display | Libre Baskerville or Baskerville stack | Georgia, serif | Wordmark and one heading level per surface, sparingly |

Literata is chosen because it was engineered for long-form screen reading with optical sizing; it keeps the bookish character Baskerville established while actually being a text face. Type scale: 13 / 15 / 17 (reading base) / 21 / 27 / 34, with UI text at 13–15.

### Color tokens

| Token | Paper (light) | Slate (dark) | Role |
|---|---|---|---|
| ground | `#f4efe5` | `#161511` | page background |
| surface | `#fbf8f1` | `#1e1c16` | panels, rails |
| ink | `#191916` | `#e9e2d1` | primary text |
| ink-soft | `#44423a` | `#c4bcaa` | secondary text |
| line | `#cbc1b1` | `#3c392e` | hairlines |
| accent | `#155c73` | `#6fb2c9` | actions, links, focus |
| trusted | `#3d6b4f` | `#86b598` | trusted-extraction status |
| warning | `#9a6b1c` | `#d3a04d` | warning-level status |
| alert | `#a62f24` | `#e07a5f` | failures, source-only blocks |

Rules: status colors never appear without a text label; accent appears once per view at rest; contrast meets WCAG 2.2 AA for all text tokens on their grounds (spot-check at build time, verify in the accessibility gate).

### Layout and motion

- spacing on a 4px base with an 8/12/20/32 rhythm; sibling groups use gap, not stacked margins;
- the Reader's three-zone grid and the player's stable zones come straight from their specs; zone dimensions are fixed per breakpoint so content length never moves controls;
- motion is opacity and small translate only, 150–250ms, with the existing reduced-motion parity rule; no parallax, no full-field transitions — consistent with the no-unsafe-flashing gate.

## Adoption sequence

1. Owner approves this direction (or edits it) — the blueprint artifact carries a visual sample of the reader and player in both themes.
2. `tokens.css` lands with the full light/dark token set; existing screens consume tokens with minimal re-layout.
3. Library becomes shelf-first (hero collapses to a one-line identity), then the Reader ships on the new system, then the player canvas is rebuilt to the spec's zones during M3.
4. Every migrated surface passes the accessibility gate before the next begins.
