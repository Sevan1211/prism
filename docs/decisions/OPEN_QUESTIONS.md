# Open technical questions

**Last updated:** 2026-09-03

The owner discovery interview and initial implementation-policy interview are complete. Confirmed choices are recorded in `V0_DECISIONS.md`; the original question inventory and rationale remain in `OWNER_DISCOVERY_QUESTIONNAIRE.md`. This file now tracks only choices that can be resolved through implementation evidence or a later owner decision.

## Resolved on 2026-08-19

### Cloud boundary for private PDFs

- Use local processing by default.
- Require an explicit per-source “allow cloud transformation” choice that states which pages or spans may leave the device.
- Do not infer cloud permission from upload, indexing, or a blanket global preference.
- Keep local-only mode usable, even when generated representations are slower or lower quality.

### Full-book preparation depth

- Hash and preserve the file, parse and quality-check the complete structure, and build local search plus concept/section indexes after import.
- Deeply generate semantic frames only for the section the learner opens.
- Allow background refinement only within the learner's cost and privacy policy.

### First benchmark concepts

The first three passages are structurally different:

1. **Database transaction isolation** — definitions, anomalies, schedules, and exact conditions.
2. **TCP congestion control** — causal change over time and a state/feedback loop.
3. **Distributed consensus** — multi-node causality, failure cases, and prerequisite relations.

This set stress-tests precise definitions, dynamic processes, diagrams, and system reasoning. Algorithms, operating systems, Python, data engineering, cloud, and AI follow as corpus expansions rather than excluded topics.

## Resolved on 2026-08-23

### Dossier integration terminology and scope

- Adopt **Traceable Semantic Relay** as the official name of the Experimental Anchor, Advance, Integrate, and Repair mechanism.
- Use **sparse learning loop** for v0 and remove mastery-loop language from the current product contract.
- Retain one-word RSVP only as an optional research negative control; do not build it as a product feature.
- Treat the enhanced static Source Reader as a first-class product surface and principal learning baseline.
- Preserve TCP as the first engineering fixture and use transaction isolation as the first manually reviewed learning fixture.

### Pre-implementation delivery authorization

The research sequencing below remains historical context and is superseded for immediate delivery by the 2026-08-29 challenge plan.

- Deliver one focused milestone/pull request at a time, beginning with the documentation integration pull request.
- Build an owner-only local desktop-web research instrument before packaging or hosting.
- Preserve and migrate current `.prism-data`; back it up before schema changes.
- Select a commercially compatible open-license transaction-isolation source through a documented research pass.
- Treat owner review as sufficient only for the private owner/debugging pilot, not as independent expert evidence for external claims.
- Obtain approval on one polished Source Reader/TSR mockup before frontend reconstruction.
- Keep the first pilot to the core learning path; defer notes, highlights, narration, text-to-speech, and external notifications.
- Add generative AI only after the manual lesson and player pass; defer local-model benchmarking until a fair later comparison.
- Begin the next local milestone automatically after the prior pull request is merged and `sevan-dev` is updated.

### Optional local generative model

Resolved for this cycle: defer. The current development machine may support smaller or hybrid CPU/GPU models, but no local runtime enters the core path until the manual package, provider boundary, evaluation fixtures, and optional cloud comparison exist. Any later adoption requires measured latency, fidelity, structured-output reliability, resource use, and power/thermal behavior.

## Resolved on 2026-08-26

### License and distribution

- The repository is licensed Apache-2.0 and becomes public before the WebMCP Challenge submission.
- The hosted demo redistributes only CC BY / CC BY-SA corpus content; CC BY-NC-SA sources (including the entire current OpenStax catalog, verified 2026-08-26) stay local-only fixtures.

### WebMCP direction

- Adopt the WebMCP tool surface with all three rings, including the guarded tutor loop, per [`../architecture/WEBMCP_INTEGRATION.md`](../architecture/WEBMCP_INTEGRATION.md).
- Agent exposure is a per-source policy: open licenses default-allow, `private_authorized`/`unknown` default-deny with explicit per-source opt-in.

### Design direction approved

The owner approved [`../product/DESIGN_DIRECTION.md`](../product/DESIGN_DIRECTION.md) (The Reading Instrument) as proposed on 2026-08-26, using the blueprint artifact rendered in the token system as the visual sample. This satisfies the M0 approved-mockup precondition; tokens land first, then library, Reader, and player migrate in order.

### Hosted-demo boundary

- Hosting provider remains an implementation choice, but the hosted origin serves the application shell and authorized showcase assets.
- **Superseded 2026-08-29:** transient server processing is no longer the default personal-upload boundary.
- Personal source bytes, indexes, lessons, annotations, answer analyses, and reading state remain in browser-owned IndexedDB/OPFS in the challenge path.
- The agent receives only bounded, policy-approved evidence through WebMCP. A separate future server or local-companion parser mode requires explicit disclosure and consent.

## Resolved on 2026-08-29

### Primary lesson and learning loop

- Use the visually composed, multi-section interactive lesson in [`../product/INTERACTIVE_LESSON_SPEC.md`](../product/INTERACTIVE_LESSON_SPEC.md) as the primary generated experience.
- Keep semantic frames as internal units and TSR as an Experimental alternate renderer.
- Create multiple named, range-bound, versioned lessons under a source.
- Put normally 3–6 explanation/application questions at the end of instruction.
- Save structured answer analysis locally; use named child lessons for substantial repair.
- Keep the agent aware of active learner-invoked context and require learner approval for substantial lesson revisions.

### Reader and local persistence

- Use PDF.js as the controlled Reader surface with selectable/copyable text, local annotation overlays, visual-region capture, exact source navigation, accessibility, and source-only fallback.
- Copy imported files into OPFS and store structured application state in IndexedDB. Promise same-browser-profile continuity, not cross-device continuity.
- **Superseded 2026-09-03:** The owner requested the user-chosen PRISM folder for this release; see the folder decision below.

## Resolved on 2026-09-03: release direction

- Ship a hosted, browser-local application with an empty library and no required PRISM account.
- Generate formatted reading documents through WebMCP, never PDF lessons or bundled textbook-specific lessons.
- Accept section/chapter lessons and long-source syntheses. A request such as 100 pages into 10 is a soft length target with explicit coverage and omissions.
- Make clarification and deeper explanations reviewable revisions of the same lesson, with learner acceptance and retained history.
- Use original source crops, safe typed scenes, and data plots across subjects. Agent-authored executable code is not accepted.
- Use Recursive Language Models and a Physical Geology chapter as proposed demo sources. Reference sources are not the parser's entire support claim.

## Current acceptance gate

The implementation and open acceptance checks are tracked in
[submission readiness](../engineering/SUBMISSION_READINESS.md). Live composition needs
real learner approval: an agent-operated approval control did not satisfy this boundary
and automatic approval review blocked the attempted content write. A successful test
suite does not substitute for this unfinished workflow or for owner review of lesson quality.

## Historical quality-reset questions

The 2026-09-03 owner correction fixes the lesson output as browser-native,
Markdown-style prose with purposeful inline visuals. The current showcase failed
owner acceptance. See the [lesson quality reset](../engineering/LESSON_QUALITY_RESET.md)
before further broad UI or lesson-content work.

Open choices for that reset:

- Freeze the independent, redistributable reference source and exact lesson range.
  Networking remains a useful candidate, not an assumption that every course is CS.
- Define which supporting content may be compressed for a selected goal. Until the
  coverage contract says otherwise, preserve substantive explanations, examples,
  qualifications, and connections; do not shorten to fit a demo duration.
- Choose the first reusable visual model from that source's instructional needs.
  A network-delay model is a design-study proposal, not an adopted general simulator.

The challenge sequence is authoritative in [`../engineering/WEBMCP_CHALLENGE_PLAN.md`](../engineering/WEBMCP_CHALLENGE_PLAN.md): stabilize WebMCP registration, establish browser-local persistence, complete the Reader and exact source navigation, ship the typed lesson composer and end-question/repair loop, then deploy and validate the public submission. The longer research sequence remains in [`../engineering/IMPLEMENTATION_PLAN.md`](../engineering/IMPLEMENTATION_PLAN.md).

## Open: browser document pipeline selection

Choose and measure the smallest browser-local pipeline that can meet the challenge showcase and clean born-digital support tier:

- which PDF.js text/layout APIs become canonical inputs;
- whether existing Python segmentation logic is ported, simplified, or retained only for offline corpus preparation;
- worker boundaries, cancellation, memory limits, and progressive checkpoint format;
- exact OPFS/IndexedDB schema and migrations;
- browser and storage-quota compatibility.

This is an implementation choice. The non-negotiable result is that personal bytes stay on device, the Reader remains usable when transformation fails, and no supported claim exceeds measured fixtures.

## Resolved on 2026-08-31: typed interaction grammar

The challenge grammar accepts only schema-validated data blocks: prose, definition,
source excerpt, callout, equation, code, worked example, table, generated diagram,
step-sequence animation, and summary. Agent-authored HTML, CSS, and JavaScript remain
prohibited. Diagrams expose labeled concepts and relations as a static semantic reading;
step sequences provide Previous/Next controls plus a complete static transcript, so
reduced motion or non-visual access does not remove the teaching relation. Source-authored
visual crops were added on 2026-09-03 and retain page-region provenance; they must not be
mislabeled as generated diagrams. Their runtime acceptance remains tracked separately.

## Device-owned library and approval friction

**Folder choice resolved, 2026-09-03:** The owner accepts choosing the same physical
folder in each browser. The implemented folder mode, cloud-sync limits, cache,
permission and conflict behavior are specified in
[device-local architecture](../architecture/DEVICE_LOCAL_WEB_ARCHITECTURE.md).
The local browser caches do not determine the folder's durable contents. Initial
migration preserves the original browser library. Live cross-browser folder
acceptance and a true multi-device cloud-sync run remain distinct unfinished checks.

**Approval consolidation remains open:** One learner-authorized source/task scope,
optional outline review, and versioned requested revisions would reduce repeated
prompts. Existing source grants and plan/revision approval remain enforced; the
folder implementation does not authorize agent disclosure or accept a pending plan.
The Library storage dialog handles native folder permission loss and save failures.
It is not yet a universal agent approval inbox.

## Open: pilot governance thresholds

The dossier proposes conservative initial thresholds, including at least 98 percent fully supported audited clauses, a 0.20-standard-deviation or five-point noninferiority margin, at least 15 percent median active-time reduction for an efficiency interpretation, and 36–60 completers for a directional study.

These are **project policy proposals**, not established scientific constants. Before preregistration, resolve them through:

- assessment reliability and score-scale review;
- domain-expert judgment about a practically meaningful learning loss;
- owner and usability pilot variance;
- within-person correlation and attrition estimates;
- sample-size and power simulation;
- sensitivity analysis for alternative margins and active-time rules.

The 98 percent clause gate may govern an owner pilot only if zero known critical or major errors remains the overriding rule.

## Open: contract-v2 identifier and migration details

The dossier examples mix UUID-typed records with human-readable fixture identifiers. Before the first schema change, decide and document:

- canonical stored identifier type and serialization;
- compatibility for existing source, lesson, and event IDs;
- exact publication-state vocabulary;
- package-v1 read/regenerate/remove sequence;
- forward and restore migration support for local development data.

This is an implementation decision, not an owner product-policy question. Choose the smallest design that preserves current identities, deterministic hashes, and research reproducibility.

## Open: complex visual semantics

The native route now preserves source-faithful regions for detectable embedded images, vector figures, and captioned tables. The next parser gate is not “extract more screenshots”; it is to recover inspectable structure without pretending that pixels establish meaning:

- associate fragmented vector objects and cross-page captions without merging unrelated regions;
- recover table rows, columns, headers, and reading order in addition to the rendered source crop;
- preserve equations, symbol definitions, code indentation, and figure legends as typed elements;
- require reviewed accessible descriptions for uncaptioned visuals before a transformed representation can receive approved publication status;
- measure false-positive and missed-visual rates on the frozen corpus before widening PDF compatibility claims.

Docling or another layout adapter should be introduced only if it beats the native route on those reviewed expectations at an acceptable memory/runtime cost.

**Current evidence note (2026-08-23):** Docling’s official documentation confirms configurable
local PDF, OCR, table, page-image, and page-range capabilities, but those capabilities do not
establish fidelity for PRISM’s textbook corpus. The native route now fails closed on untrusted
body text and exposes source-only fallback/recovery. Do not add Docling or OCR merely to make a
particular upload appear supported; first run the adapter against the reviewed corpus and preserve
the same page/region/provenance and recovery contracts.

## Open: shared device library with a folder-incompatible agent browser

Read-only inspection on 2026-09-03 confirmed that the owner's installed desktop
browser build rejects filesystem permission requests, including after a directory
is selected. Direct folder handles therefore cannot provide the required shared
library in that host. See [the verified restriction](../architecture/DEVICE_LOCAL_WEB_ARCHITECTURE.md#confirmed-desktop-host-restriction--2026-09-03).

**Resolved by owner:** No native companion. A solution dependent on another browser
remaining open is also unacceptable. Every linked browser must access the shared
library independently, especially ChatGPT's native browser.

**Approved by owner — 2026-09-03:** Allow browser-encrypted library copies in hosted storage,
with one-time recovery-key enrollment instead of mandatory accounts. This changes
the prior device-only contract; permission must not be inferred from an existing source's
agent-disclosure permission. See [the researched design and acceptance gates](../architecture/SYNCED_LIBRARY.md).
Browser caches and optional folder backups remain useful, but are not substitutes
for independent synchronization. No remote library migration has occurred.
