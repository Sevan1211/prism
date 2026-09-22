# Mobile PDF Reader local review

The PDF Reader now keeps the source title, search, Contents, and page controls in a
compact two-row bar at phone widths. Zoom, fit, document details, help, storage,
and theme controls remain in a disclosed More panel. Contents uses a modal drawer
with an explicit close action; choosing a section closes the drawer and focuses
the document pages. Escape closes the drawer and returns focus to Contents.

The Reader uses the dynamic viewport height, safe-area space below pages, and
44-pixel primary controls on narrow screens. A viewport transition from desktop
to phone closes desktop rails so they do not cover the document on arrival.

## Local checks

- Focused Reader tests: 14 passed, including mobile section navigation, focus,
  zoom access, and Escape staying in the Reader.
- Web TypeScript and focused ESLint checks passed.
- Rendered the Reader with an existing local PDF at 320, 390, 430, and 768 CSS
  pixels, plus a 430 × 360 short viewport. The header had no horizontal overflow
  at the measured sizes; the short viewport kept 244 pixels for pages.
- In the browser, a mobile contents choice moved to the selected PDF page,
  dismissed the drawer, and focused the document. Escape dismissed the drawer,
  restored focus to Contents, and left the Reader open.

These are local desktop-browser viewport checks. Actual iOS Safari and Android
Chrome, mobile software keyboards, enlarged text, and a full mobile lesson
visual review remain separate acceptance work. Original PDF typography can still
be small at fit-width on a phone; Zoom and fit remain available from More.
