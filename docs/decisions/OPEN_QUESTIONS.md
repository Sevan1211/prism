# Open technical questions

**Last updated:** 2026-08-26

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

## Open: design-direction sign-off

[`../product/DESIGN_DIRECTION.md`](../product/DESIGN_DIRECTION.md) proposes one evolved direction (The Reading Instrument) with type, color, and layout tokens. Owner approval, amendment, or rejection is required before the reader/player rebuild consumes it.

## Open: hosted-demo boundary details

Before the demo deploys: exact host selection (Render/Cloudflare/Vercel families), whether uploads are disabled or size-capped, rate limiting, and the visible "hosted showcase of a local-first instrument" labeling. These are deployment-scope decisions, not product-contract changes.

## Next implementation gate

The scope freeze and dossier integration decisions are complete. The full sequence is in [`../engineering/IMPLEMENTATION_PLAN.md`](../engineering/IMPLEMENTATION_PLAN.md). Before efficacy comparisons begin:

1. research, acquire, and hash a commercially compatible open-license transaction-isolation source, finalize its learning window, and record exact rights for every selected benchmark version;
2. implement the enhanced Source Reader and contract-v2 migration path;
3. define and freeze the transaction-isolation claims, concepts, relations, frames, rubric, repair, alternate delayed items, and accessibility expectations;
4. complete learner-controlled TSR, recovery, and sparse-loop gates using the manual package;
5. freeze reviewed expectations for the other passages only as each enters the next experiment; the TCP engineering slice is already complete;
6. benchmark an optional local model only after the manual path, provider boundary, permission checks, and representative fixtures exist.

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
