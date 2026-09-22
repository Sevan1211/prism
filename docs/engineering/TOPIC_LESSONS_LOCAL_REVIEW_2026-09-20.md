# Topic lesson local implementation review

Scope: [topic lessons and series](../product/TOPIC_LESSONS.md), shared authoring tools,
and scene/practice improvements. This is local implementation and browser evidence;
deployment and learning effectiveness require separate evidence.

## Automated evidence

- Web suite: 285 tests in 64 files passed. Tests cover clarification requirements,
  atomic whole-series approval, stale approval versions, preapproval write refusal,
  ready-lesson write protection, revisions and history restoration, objective and
  reference validation, incomplete content reviews, required uncertainty in topic
  answer analysis, portable snapshots, request reset, and folder removal.
- Permission tests cover missing sources, revoked grants, changed fingerprints,
  and knowledge-only operation without source access.
- Visual tests cover compact recipes, immutable cumulative state, rewind, reset,
  playback speed, hidden-tab pause, reduced-motion preference changes, chart values,
  and legacy player behavior.
- Sync service: 27 tests in two files passed; TypeScript passed. This is regression
  evidence, not a live multi-device acceptance test of the new feature.
- Web TypeScript, lint, generated authoring-document drift check, documentation
  links, and whitespace checks passed during validation. Production web build passed
  with a large-chunk warning (main bundle over 500 kB).

## Rendered and WebMCP evidence

Tested the local Vite app in the in-app browser with clearly labelled synthetic
data. No actual learner plan was approved by the agent. Desktop checks used a
1440 × 1000 viewport; mobile used 390 × 844. The viewport override and theme were
restored afterward.

- Created an empty folder and a source-free request within it through the visible
  form. Verified saved folder assignment, movement to Unfiled, request editing,
  and the three research options. Selected-sources mode disabled save with no
  source selected. Original library sources were not read or modified for this test.
- Inspected desktop light/system-dark layouts and the mobile request form and
  lesson reader. No page-level horizontal overflow appeared in inspected states;
  diagrams retain their intentional accessible horizontal scrolling on mobile.
- Used the registered WebMCP tools to propose a synthetic humanities plan, save
  section blocks, update a compact diagram, finalize the draft, propose a targeted
  revision, read a focused plan section, and open its saved lesson.
- Exercised the visible plan approval and revision acceptance controls only on
  synthetic QA records. Confirmed the unchanged lesson before acceptance, version
  advancement after acceptance, persistence after reload, series navigation, and
  “Ready to read” status.
- Inspected all three steps of a changing-state diagram: current labels, retained
  hypothesis state, node details, next/previous/reset, opt-in play/pause, speed
  control, and complete static transcript. Checked optional hints and worked response.
- Verified “Ask about this” passes the correct block, current document version,
  and typed learner question through `get_active_lesson_context` for a topic lesson.

## Boundaries and remaining evaluation

Synthetic local records are browser-only and are not shipped fixtures. These checks
do not establish factual accuracy across all disciplines, complete real curricula,
authorship-speed gains, source fidelity, or improved learning. Every real authored
lesson still needs its own semantic and rendered inspection.

Live account restoration across devices, real mixed-source lesson acceptance,
inline PDF crops from multiple sources, and independent verification of reported
web inspections were not established. Topic source references link to exact source
passages; original single-source lessons retain inline PDF crop support. Topic scope
changes use a new request; existing lessons use learner-reviewed revisions.

Compact recipes remove manual coordinate fields and focused plan reads reduce repeated
payloads. No end-to-end authoring-speed benchmark was run, so no percentage or time
improvement is claimed.


## Follow-up persistence acceptance

The actual sync client was exercised against an isolated in-memory HTTP server and
fresh IndexedDB/OPFS substitutes. This extends local evidence; it is not a live Clerk,
D1, R2 or two-device browser acceptance result.

- A complete approved two-plan series and finalized lesson restored into a fresh
  cache after a lost commit acknowledgement, retaining its prior draft revision.
- A populated version-13 library upgraded to version 14 without changing existing
  source or lesson content, or its initialization timestamp.
- Source metadata restored without transferring browser-specific agent grants.
  Explicit enable and revoke operations remained effective on the fresh cache.
- A stronger conflict test exposed a real bug: resolving a series conflict could
  leave linked plan changes unresolved independently. Resolution now groups an atomic
  topic proposal/approval and connected pending lesson writes. Both local and remote
  choices are tested; the unselected updates remain in conflict history. The status
  message discloses when related topic plans and pending lessons are included.

The learner chose mean versus median, with some prior knowledge and one deeper
lesson with practice. The learner approved the full three-section plan in PRISM
before composition. Two NIST pages were inspected for definitions, sensitivity to
extreme values, and cautions about deleting unusual observations. The resulting
local lesson has 20 reviewed blocks, worked odd/even calculations, a comparison
chart with an exact-value table, question-led selection, and optional practice.
Original numerical examples are labelled illustrative. All chart series and the
table were inspected in the rendered desktop and mobile reader; a learner-revealed
hint and worked response were checked. The agent finalized the local lesson after
checking calculations and qualifications. The learner then reviewed the lesson
preview and replied "Looks good." This is local content feedback, not a hosted or
measured learning outcome.

The earlier synthetic-clarification browser proposal was rejected by automatic
approval review; actual learner answers were obtained before the real plan was saved.
Knowledge-only and mixed-source real-content trials have not been completed.

Latest validation: all 292 web tests passed across 64 files; web TypeScript,
lint and production build passed. Sync TypeScript and all 27 sync tests passed.
Documentation links, generated agent-document drift, and tracked whitespace
checks passed. The production build still reports a main chunk above 500 kB.
