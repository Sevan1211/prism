# PRISM implementation plan

**Created:** 2026-08-23  
**Planning horizon:** next 12 focused weeks at approximately 5–10 hours per week  
**Status:** implementation-ready sequence; milestone gates outrank calendar dates  
**Starting point:** existing clean-PDF TCP vertical slice on `sevan-dev`  
**Primary owner-pilot fixture:** manually reviewed transaction-isolation lesson  
**Experimental mechanism:** Traceable Semantic Relay (TSR)

## Owner authorization recorded 2026-08-23

- Target the owner-only local desktop-web research instrument first.
- Deliver one focused milestone and pull request at a time; do not overlap an open scope.
- Merge the documentation integration before implementation work begins.
- Preserve and migrate `.prism-data`, with a recoverable pre-migration backup.
- Select a commercially compatible open-license transaction-isolation source through a documented research pass.
- Use owner approval for the private debugging pilot only; independent expertise remains required before external efficacy claims.
- Obtain owner approval on a polished Source Reader/TSR mockup before frontend reconstruction.
- Keep notes, highlights, narration, text-to-speech, and external notifications outside the first owner-pilot gate.
- Keep generative AI behind the manual lesson/player gates and defer local-model benchmarking.
- Use the in-app review queue for the first 24-hour and seven-day workflow.

## Owner reprioritization recorded 2026-08-26

- Enter the OpenAI WebMCP Challenge (deadline 2026-09-03 13:00 PDT) with a full push; finish locally first, then deploy the hosted demo from the finished build. Scope, tool rings, rights gating, and submission rules: [`../architecture/WEBMCP_INTEGRATION.md`](../architecture/WEBMCP_INTEGRATION.md).
- License the repository Apache-2.0 (LICENSE added 2026-08-26); the repository becomes public before submission.
- Expand M1's Source Reader into the full reading experience specified in [`../product/READER_SPEC.md`](../product/READER_SPEC.md): section structure, reading progress, continue-reading, search, and PDF.js adoption.
- The approved-mockup precondition for frontend reconstruction is served by [`../product/DESIGN_DIRECTION.md`](../product/DESIGN_DIRECTION.md) plus its visual sample; owner sign-off on that direction unblocks the reader and player rebuilds.
- Repository hardening landed the same day: CI quality workflow, portable docs gate, installable dependency lock, API logging, upload sweep, duplicate-upload race fix, event index, error boundary, and session/study research-event fixes.
- Corpus: Erickson's *Algorithms* (CC BY 4.0) added as the parser-generalization fixture after every current OpenStax title was found to be CC BY-NC-SA.
- The WebMCP sprint precedes the remaining M1 work in calendar order; M1–M7 sequencing below is otherwise unchanged, and the sprint must not weaken any M1 security-envelope requirement — the hosted demo runs only open-licensed corpus content until that envelope exists.

## Outcome

The next implementation cycle should produce:

> A local Windows desktop-web research instrument that imports and exposes a clean technical source through an enhanced Source Reader, loads one manually reviewed evidence-locked transaction-isolation lesson, presents it through learner-controlled Traceable Semantic Relay, performs one sparse diagnostic and source-linked repair, schedules 24-hour and seven-day review, records reproducible local events, recovers from interruption, and supports a fair Source Reader comparison.

This is a vertical research instrument, not a general textbook platform. It earns the right to automate only after source fidelity, accessibility, recovery, and the manual learning flow work end to end.

## Governing constraints

1. Seven-day transfer is the primary learning outcome; active time is interpreted beside it.
2. Source Reader is a first-class surface and the principal comparison condition.
3. TSR is Experimental and may lose to static reading.
4. Understand and Study are learner-stepped by default; Study has no instructional autoplay in v0.
5. Faster and Deeper are reversible support bundles, not a hidden speed multiplier.
6. One-word RSVP is an optional research-only negative control and receives no core product investment.
7. The sparse learning loop diagnoses one governing relation at a meaningful boundary; it does not turn the product into a quiz flow.
8. Models propose; deterministic code controls source identity, permissions, validation, rendering, publication, playback, and learner-state transitions.
9. Accessibility, privacy, security, recovery, and source fidelity are release gates.
10. One domain, one user, one local workspace, one clean-PDF class, one optional cloud provider, one typed diagram grammar, and one repair path bound the cycle.

## Current repository baseline

The plan begins from implemented code, not the dossier’s greenfield scaffold.

| Capability | Current evidence | Status for next cycle |
|---|---|---|
| Stack | React/TypeScript/Vite plus FastAPI/Pydantic, SQLite WAL, `pypdfium2`, generated OpenAPI types | **Adopted** |
| Source bytes | Streamed import and content-addressed storage | **Preserve and harden** |
| Clean-PDF indexing | Page-grounded embedded text, regions, conservative front/back classification with explicit semantic entry boundaries, lazy figure/table crops, exact-artifact deduplication, and deterministic collision identities | **Implemented slice; widen only through fixtures** |
| Import readiness | Per-source current job, parser currency, page-range evidence, trusted-body recommendation, and original-PDF fallback | **Implemented local recovery slice; add structure/search reader evidence** |
| Resumption | Page-by-page progress, source `needs_review` state, parser-version full reindex, and no-duplicate recovery tests | **Implemented slice; add process/artifact fault cases** |
| Compiler | Deterministic source-verbatim chunks; full-payload hash; pre-storage span, graph, visual, accessibility, and identity validation; frozen synthetic golden manifest | **Validated draft baseline; contract-v2 claims, relations, review states, and publication remain** |
| Player | Responsive Preview, Understand, Study, and Reader flow; reversible frames, exact source evidence, source visuals, Faster/Auto/Deeper receipts, focus return, reduced motion, and events | **First TSR slice implemented; persistence, transcript, remapping, and full accessibility/recovery gates remain** |
| Source surface | PDF-backed Reader for the active frame with exact page and extracted span | **First return path implemented; structure navigation, search, overlays, inspection, and deletion remain** |
| Provenance | Page, region, source span, parser and package identities | **Partial; add clause, pass, quality, and permission provenance** |
| Events | Append-only local events and JSON export | **Partial; version schema and derive active time** |
| Learning loop | No rubric-scored prompt, repair, delayed evidence, or review queue | **Missing** |
| AI compiler | No provider adapter or model passes | **Correctly deferred** |
| Accessibility | Keyboard basics and reduced-motion setting | **Partial; manual and automated release gate missing** |
| Security/privacy | Loopback API, local-only source default, per-source policy field | **Partial; origin token, CSP, limits, deletion, and threat tests missing** |
| Research validation | Documents and benchmark manifest exist | **No locked lesson, instrument, preregistration, or owner result** |

## Target dependency flow

```text
immutable source + rights record
            |
            v
safe import -> source elements/spans/regions -> enhanced Source Reader
            |                                  |
            v                                  +------------------+
manual gold claims/relations                                      |
            |                                                      |
            v                                                      |
contract-v2 lesson package -> TSR player -> sparse prompt/repair --+
            |                     |                 |
            v                     v                 v
quality/provenance bundle     local events     evidence records
            |                     |                 |
            +---------------------+-----------------+
                                  |
                                  v
                      24 h / 7 d review + export
                                  |
                                  v
                         owner-pilot decision gate
                                  |
                        only after manual path passes
                                  v
             bounded AI proposal passes + typed diagrams
```

No AI milestone is allowed to become a hidden dependency of Source Reader, existing lesson playback, deletion, research export, or recovery.

## Contract slices

The dossier’s complete model is a target vocabulary. Implement it in closed slices so each migration supports a usable vertical path.

### Contract slice A: source and permission

Required objects:

- `SourceDocument` with immutable hash, kind, rights basis, local path, parser run, and deletion state;
- `SourceElement` with kind, order, text, page range, regions, asset binding, extraction status, and parser metadata;
- `SourceSpan` with character or region locator, snapshot/hash, and locator version;
- `ProcessingPermission` bound to source hash, selected scope, provider, purpose, payload class, retention disclosure, cost estimate, and expiry/revocation state.

Migration rule: preserve existing source and element identifiers where they already meet the contract. Add a compatibility reader before changing stored package shape.

### Contract slice B: claims and relations

Required objects:

- `CanonicalClaim` and clause-level support;
- typed content origin;
- support and publication states;
- `Concept`, `ConceptRelation`, and `PrerequisiteEdge`;
- qualifiers, modality, polarity, and source-span references.

Migration rule: existing source-verbatim frames become source-verbatim claims through a deterministic migration. They do not become `approved` merely because they are verbatim.

### Contract slice C: lesson and representation

Required objects:

- immutable `LessonPackage` and package hash;
- `SemanticFrame` with one primary instructional purpose;
- origin-labeled frame blocks;
- representation candidate and explicit selection reason;
- source anchor binding;
- accessibility manifest;
- quality-check and provenance bundles;
- source-reader fallback manifest.

Migration rule: support package v1 playback during development, convert the checked-in fixture to v2, then remove the v1 path in the same focused change after all stored development fixtures are regenerated.

### Contract slice D: practice and learner evidence

Required objects:

- `PracticeItem`, `ScoringRubric`, and rubric dimensions;
- response, confidence-after-answer, and scoring evidence;
- one relation-specific repair path;
- learner concept evidence states rather than a single mastery probability;
- due-at records for 24-hour and seven-day review;
- versioned policy decisions and explanation receipts.

## Milestone plan

Calendar ranges are estimates. A milestone does not close until its acceptance, recovery, accessibility, and documentation gates pass.

## M0 — Documentation and contract lock

**Indicative time:** Week 1  
**Classification:** Build Now  
**Outcome:** one consistent source of truth before schema or UI changes

### Deliverables

- integrated research review and imported dossier artifacts;
- updated product, architecture, decision, validation, benchmark, and engineering contracts;
- this repository-grounded plan;
- one polished Source Reader/TSR desktop mockup approved before M1 frontend implementation;
- contract-v2 field inventory and migration note;
- issue list limited to M1 and M2;
- explicit supersession map for timer-centered pacing, mastery-loop language, RSVP product scope, and old verification states.

### Acceptance

- all local Markdown links resolve;
- no canonical document describes one-word RSVP as a product feature;
- no canonical document treats two rewinds or a pause alone as comprehension evidence;
- seven-day transfer is primary everywhere;
- TSR is always labeled Experimental;
- current implementation evidence remains distinct from planned behavior;
- repository quality command passes after document changes.

### Exit gate

M1 starts only when the active branch is `sevan-dev`, the working tree is understood, and the documentation diff is focused enough for one reviewable pull request.

## M1 — Enhanced Source Reader and local security envelope

**Indicative time:** Weeks 2–3  
**Classification:** Build Now  
**User outcome:** the learner can import, inspect, navigate, search, and study the supported source without semantic compilation or network access

### Scope

- first-class Source Reader route/surface;
- document structure navigation and page selection;
- synchronized extracted text and original page/region;
- exact source-span highlighting;
- source-element status and extraction inspection;
- support pasted text, `.txt`, and Markdown through the same source contract;
- source deletion and source-free manifest export;
- loopback Host/CORS allowlist and per-launch origin/bearer token;
- restrictive CSP and sanitized Markdown/rich-text rendering;
- import byte, page, pixel, CPU, memory, temporary-disk, and timeout limits;
- explicit external-link confirmation;
- source-derived log redaction.

### Dependencies

- source/permission contract slice A;
- existing content-addressed storage and parser;
- owner-approved Source Reader/TSR desktop mockup;
- a deliberate PDF viewer choice when exact overlay requirements are implemented;
- synthetic malicious, oversized, malformed, and path-traversal fixtures.

### Acceptance tests

1. Importing identical bytes reuses the immutable source object.
2. Paste, text, Markdown, and clean PDF produce typed source elements without changing the source text silently.
3. Selecting a span opens the correct original page and normalized region.
4. Search results expose source location and extraction status.
5. Source Reader functions when every model/network adapter is disabled.
6. Refresh and backend restart preserve document and navigation state.
7. A low-confidence element remains visible as Source-only and cannot enter compilation.
8. Host, origin, token, path, content-type, size, and timeout checks reject seeded violations.
9. Sanitization prevents script, arbitrary HTML/SVG, and unsafe URL execution.
10. Delete removes source and derived objects or reports an auditable incomplete state.
11. Keyboard and screen-reader users can navigate structure, source text, pages, inspection, export, and deletion.
12. 200 percent zoom and Windows display scaling preserve operation.

### Recovery tests

- application closes during streaming import;
- parser process terminates mid-page;
- database commit succeeds while object promotion fails and the reverse;
- disk limit is reached;
- stale parser artifacts exist for only some pages;
- deletion is interrupted after metadata but before all objects are removed.

### Performance evidence

Preserve the existing 489-page TCP baseline and add:

- time to Source ready;
- time to first searchable page and full Search ready;
- peak working set and temporary disk;
- region-open latency p50/p95;
- search latency with representative page and element counts;
- page-overlay interaction latency;
- no document work on the browser main thread.

### Exit gate

The golden source is genuinely usable in Source Reader, all security-critical acceptance cases pass, and no semantic player code is required for normal reading.

## M2 — Contract v2 and manual transaction-isolation package

**Indicative time:** Weeks 4–5  
**Classification:** Build Now  
**User outcome:** one lesson can be audited clause by clause before it is played

### Scope

- implement contract slices B and C;
- acquire or create a redistributable 1,000–1,500 word transaction-isolation fixture;
- freeze exact source bytes and rights metadata;
- author and review atomic claims, qualifiers, concepts, relations, and prerequisites;
- author six to ten semantic frames;
- include a two-lane transaction schedule and one comparison table;
- author one explanation item, rubric, nonidentical transfer item, repair, 24-hour item, and seven-day item;
- create package, accessibility, provenance, quality, and fallback manifests;
- implement deterministic package validation and immutable publication;
- produce accepted and intentionally rejected fixture cases.

### Acceptance tests

1. Every visible factual clause maps to valid source spans.
2. Character and region locators resolve against the immutable source hash.
3. Modality, negation, condition, scope, units, and exceptions survive review.
4. Every concept relation names supporting claims.
5. Every schedule lane, table cell focus, label, and visual edge maps to approved evidence.
6. The package contains no orphan IDs or missing assets.
7. The transcript and visual frame sequence contain the same claims and order.
8. Invalid spans, unsupported clauses, missing accessibility data, and unsafe assets block publication.
9. Approved records are immutable; corrections produce a new version and supersede the prior record.
10. The package hash is stable across deterministic rebuilds.
11. Existing TCP draft packages either load through an explicit temporary compatibility path or are regenerated; no silent shape coercion occurs.

### Fidelity gate

- zero known critical or major errors;
- 100 percent valid source references;
- all generated or reconstructed high-risk assets manually reviewed;
- initial audited-clause support target of at least 98 percent, explicitly treated as a project gate rather than proof of safety;
- every remaining concern limited to a minor locator/wording issue or visibly labeled interpretation;
- reviewer disagreements recorded and adjudicated.

### Exit gate

The manual package is safe to inspect and can be loaded without any generative model. AI compiler work remains blocked.

## M3 — Traceable Semantic Relay player and accessibility/recovery gate

**Indicative time:** Weeks 6–7  
**Classification:** Experiment First  
**User outcome:** the learner can complete Anchor, Advance, and source recovery without losing state or access

### Scope

- replace the dwell-multiplier-centered UI with learner-stepped TSR;
- implement stable header, anchor rail, active rail, previous-frame region, and control strip;
- use the exact Source Reader as the source-inspection target;
- implement Preview, Understand, and Study contracts;
- Preview autoplay optional and off by default;
- Understand autoplay off by default and prohibited on interactive/high-inspection frames;
- Study instructional autoplay unavailable;
- implement itemized Faster/Deeper bundle receipts and undo;
- implement first-class static transcript;
- add focus management, polite announcements, shortcut remapping/disable, reduced motion, and no-color paths;
- persist exact player and focus-return state;
- fall back per representation, frame, lesson, or pipeline.

### State-machine requirements

Allowed state must identify:

- package and frame version;
- mode and selected bundle;
- source-reader open/closed location;
- transcript/visual surface;
- pending interaction;
- last stable checkpoint;
- optional autoplay status where legal;
- accessibility settings;
- current anchor and prior frame;
- recovery reason after restart.

Impossible states include Study autoplay, an approved frame with a failed critical check, Preview writing delayed evidence, a required interaction hidden by bundle change, an unresolved source reference, or a representation without an accessible equivalent.

### Acceptance tests

1. Back, Next, Source, transcript, mode, bundle change, and restart are lossless.
2. Source inspection returns to the exact frame, region, scroll position, and invoking control.
3. Faster never removes a qualifier, source link, accessibility content, rewind, or required evidence target.
4. Deeper additions identify expected time and can be undone.
5. Preview cannot write immediate or delayed demonstration states.
6. Reduced motion contains no automatic spatial transition.
7. Visual and transcript render from the same package records.
8. Invalid diagram/table/code/equation frames visibly fall back to source.
9. Keyboard-only completion covers import to report.
10. Manual screen-reader smoke testing covers canvas and transcript.
11. 200 percent zoom, 1024 CSS pixels, and Windows scaling retain all controls and content.
12. Forced frontend and backend restarts resume the exact stable frame.

### Performance evidence

- input-to-paint latency for navigation and control actions;
- layout-shift measurements during representation changes;
- image decode/cache behavior with one active and one preload asset;
- frontend bundle size and test environment;
- memory during repeated source opens and long sessions;
- event-write latency without blocking interaction.

### Exit gate

Accessibility or recovery failures stop feature work. The player is ready for a manual no-check walkthrough before the sparse learning loop is added.

## M4 — Sparse learning loop, delayed review, and research instrumentation

**Indicative time:** Weeks 8–9  
**Classification:** Established components / Experimental integration  
**User outcome:** one diagnosed relation can be checked, repaired, and tested later without turning the session into a quiz

### Scope

- one concept-boundary explanation prompt;
- “not ready” and source review paths;
- confidence only after an answer;
- deterministic or human rubric scoring for the owner fixture;
- one contrastive repair tied to a missing/incorrect rubric dimension;
- one recheck, then return control or Source Reader;
- versioned learner evidence states;
- transparent deterministic policy trace;
- manual override and repeated-recommendation suppression;
- monotonic active-time derivation with focus handling;
- 24-hour and seven-day local review queue;
- source-free research export with package, policy, item, rubric, and timing versions;
- audit view for fidelity and protocol incidents.

### Rule constraints

- pause, rewind, replay, source inspection, response time, focus loss, and preference never independently imply confusion or mastery;
- a task error names the specific missing or wrong governing relation;
- high-confidence error may offer source-linked contrastive repair;
- low-confidence correct response may offer confirmation but is not marked wrong;
- rapid correct application can offer Faster but cannot silently apply it;
- explicit learner control outranks behavioral inference;
- delayed failure uses a new case or representation rather than simple replay;
- a fixed Study bundle remains available.

### Acceptance tests

1. Seeded high-confidence relation error produces the expected source-linked repair.
2. Seeded low-confidence correct answer does not create failure state.
3. Navigation or a long pause without task evidence produces no remediation.
4. “Not ready” opens a meaningful review path and is not graded as a trait.
5. Repair names what was correct, what was missing, and the supporting source.
6. The recheck does not reuse the exact outcome item.
7. Delayed items cannot appear before their due time under clock and timezone tests.
8. Seven-day evidence cannot be awarded by an immediate response.
9. Event replay reproduces policy decisions and derived active time.
10. Browser blur stops active-time accumulation under a versioned grace rule without inferring distraction.
11. Research export omits source, notes, and unrelated learner text by default.
12. Deleting learner data removes raw events, derived state, and pending reviews.

### Exit gate

One complete Anchor → Advance → Integrate → Repair cycle and both delayed-review paths work deterministically on the manual package.

## M5 — Bounded compiler and provider boundary

**Indicative time:** Weeks 10–11  
**Classification:** Experiment First  
**User outcome:** AI may propose auditable lesson content without controlling publication or exposing unauthorized data

### Scope

- provider-neutral request/response contracts;
- one optional cloud adapter and a no-model/local stub;
- task-specific permission and payload preview;
- hard monthly and per-source cost caps;
- content/prompt/schema/provider/revision cache keys;
- Pass 4 atomic-claim proposal;
- deterministic span binding and qualifier checks;
- independent claim review queue;
- concept/relation proposal within a fixed vocabulary;
- frame-plan proposal over approved claims only;
- complete provenance, latency, token, cost, retry, and abstention records;
- no silent provider fallback;
- timeout, cancellation, and cached-resume behavior;
- prompt-injection fixtures that treat source content as data.

### Acceptance tests

1. No cloud request executes without a permission hash matching source, scope, provider, purpose, and payload class.
2. Payload preview matches transmitted normalized content and regions exactly.
3. Notes, learner answers, unrelated pages, and identity are absent unless a separate per-action permission exists.
4. Every candidate clause has valid source spans before review.
5. Seeded unsupported, broadened, contradicted, modality-changing, and qualifier-dropping candidates fail.
6. A schema-valid but semantically wrong response never reaches publication state.
7. Timeout, rate limit, outage, and malformed output preserve Source Reader and cached work.
8. Identical cache keys do not create a second billable request.
9. Model/provider revision change invalidates the relevant evaluation and cache boundary.
10. Ordinary logs contain hashes and reason codes, not source text or learner answers.
11. Budget exhaustion fails closed without reducing fidelity checks.

### Model promotion gate

Measure per task:

- fully supported published-clause precision;
- unsupported, contradicted, and scope-drift rates;
- qualifier preservation;
- correct abstention;
- first-pass schema validity and repair rate;
- source-region attribution;
- technical fixture correctness;
- latency p50/p95;
- cost per approved unit and approved frame;
- reviewer correction time;
- version and prompt sensitivity.

Choose the lowest-cost, lowest-exposure candidate that clears every pass-specific gate. No permanent “best model” is encoded in product contracts.

### Exit gate

The compiler may produce reviewable candidates for the gold fixture. It may not self-publish or replace the manual package used for the first learning comparison.

## M6 — Typed representation and compiler parity

**Indicative time:** Week 12 or the following cycle  
**Classification:** Experiment First  
**User outcome:** one generated relation view can be inspected, rendered safely, and compared with source text

### Scope

- one typed diagram family selected from the gold fixture’s need;
- constrained node/edge/group/state grammar;
- deterministic layout seed and sanitized SVG renderer;
- source visual plus non-destructive overlay;
- text relation-list fallback;
- long description generated as a candidate and manually reviewed;
- coverage, density, answerability, accessibility, and render-safety checks;
- manual-package versus compiler-package parity audit.

### Acceptance tests

1. Grammar cannot carry script, arbitrary markup, external URL, foreign object, style injection, embedded font, or arbitrary path data.
2. Every node and edge maps to approved claims or relations.
3. Meaning survives text-only and reduced-motion paths.
4. Source image scale, orientation, labels, caption, and location remain recoverable.
5. Unsupported or over-dense specifications fall back deterministically.
6. Repeated rendering of the same spec produces the same semantic structure and stable snapshot.
7. A source visual is retained when it already solves the declared representational problem.
8. The compiler proposal matches the manual package’s governing and boundary-claim coverage before it is considered for later study.

### Exit gate

Typed representation generation is an optional candidate inside the established package and quality pipeline, not a parallel rendering system.

## M7 — Owner pilot and next-quarter decision

**Indicative time:** begins after M4; seven-day windows may extend beyond Week 12  
**Classification:** Research gate  
**Outcome:** an honest decision about whether to expand TSR, simplify it, or keep Source Reader as the primary product

### Stage 0: fidelity lock

- exact package, item, rubric, policy, and active-time versions frozen;
- zero known critical or major source errors;
- source, representation, transcript, and repair audited;
- package hash recorded;
- no content changes after first exposure without a protocol deviation and new version.

### Stage 1: owner longitudinal debugging pilot

- N-of-1 only;
- matched concepts and counterbalanced order;
- enhanced Source Reader, semantic frames, and TSR plus sparse loop;
- optional one-word RSVP only if its negative-control question remains worth the extra session;
- immediate, 24-hour, and seven-day alternate forms;
- blinded or delayed scoring where practical;
- workload, fatigue, calibration, source use, rewinds, recovery, and incidents recorded;
- all null and negative results preserved.

### Decision rules

Proceed to usability work only if:

- fidelity and recovery remain intact;
- the delayed workflow functions;
- TSR is not consistently worse than Source Reader;
- workload is tolerable;
- source/representation switches can be explained concretely;
- no adaptation decision depends on an ambiguous trace alone.

If Source Reader clearly wins, stop expanding the canvas and preserve only mechanisms that pass their ablations. If frames help but the sparse loop does not, remove or narrow the loop. If the sparse loop helps but frames do not, move the loop into Source Reader.

### Later usability pilot

Only after the owner flow passes:

- 6–10 technically oriented adults for issue saturation, not efficacy;
- core-task success target initially 90 percent after brief orientation;
- zero unrecoverable states or critical accessibility blockers;
- Preview distinction understood;
- source evidence inspectable;
- Faster/Deeper bundle changes understood by at least 80 percent;
- thresholds reviewed after pilot rather than treated as population estimates.

### Later directional study

Only after usability clears:

- within-subject, counterbalanced, matched technical units;
- planning range 36–60 completers, with final size from simulation;
- seven-day transfer primary;
- Source Reader versus full TSR primary contrast;
- condition, period, unit, prior knowledge, and participant/item variation modeled;
- preregistered noninferiority margin and meaningful time reduction;
- blinded rubric scoring;
- attrition and missing delayed data reported by condition;
- no public efficacy claim from a directional study alone.

## Cross-cutting validation matrix

| Change area | Required validation |
|---|---|
| Source/parser | unit, golden element/region, visual overlay, malformed/resource fixture, interruption/resume, performance |
| Stored contract | schema, migration forward/restore, referential integrity, version compatibility, deterministic hash |
| Player | state-machine/property tests, keyboard, focus, transcript parity, reduced motion, zoom, crash recovery |
| Learning loop | rubric fixtures, policy replay, ambiguous-signal negative tests, due-time tests, deletion/export |
| AI pass | frozen request eval, seeded semantic errors, permission/payload audit, timeout/budget, cost/latency |
| Diagram | schema fuzzing, sanitization, claim-edge mapping, deterministic snapshot, accessible fallback |
| Research | package/protocol lock, condition assignment, scorer blinding, active-time replay, missing-data audit |
| Documentation | local links, external primary citations, terminology search, contradiction search, dated evidence |

## Recovery acceptance matrix

Every durable stage must define the last safe checkpoint, idempotent retry behavior, and operator-visible state.

| Failure | Required recovery |
|---|---|
| Upload interrupted | Temporary bytes are quarantined or removed; completed source objects remain immutable |
| Parser killed | Resume from first incomplete/stale page without duplicate elements |
| Database/artifact split failure | Reconcile committed identity and promoted object; never reference a missing artifact silently |
| Package validation fails | Prior approved package remains loadable; new package remains draft/rejected |
| Frontend closes mid-session | Resume last stable frame and expose the recovery point |
| Backend closes mid-session | Local UI reports temporary unavailability; no state is fabricated; resume after restart |
| Cloud timeout/unknown submission | Reconcile by provider request identity or mark outcome unknown; do not resend blindly |
| Permission changes | Block new calls; keep an auditable record of earlier disclosed calls and deletion state |
| Disk full | Stop before corrupting canonical source/database; report reclaim options |
| Migration interrupted | Restore tested backup or resume idempotently; never open partially migrated data as current |
| Research export interrupted | No partial file is presented as a complete bundle; final hash and manifest required |

## Performance and resource gates

Do not invent release budgets before measuring the new surfaces. Preserve the current TCP import result as a baseline and establish these metrics per milestone:

- time to Source ready, Search ready, Structure ready, and selected Section ready;
- parser pages/second by fixture class;
- peak RAM, temporary disk, final derived storage, and cached image storage;
- source-region open latency;
- player input-to-paint latency and layout shift;
- package load and validation time;
- event append and active-time derivation latency;
- restart-to-resume time;
- frontend JS/CSS size;
- AI pass p50/p95 latency, retries, accepted-output rate, and cost per approved unit;
- local-model RAM/VRAM, power/thermal observation, and structured-output reliability when that benchmark is authorized.

Regression thresholds are frozen only after representative measurements. Correctness, fidelity, accessibility, and recovery cannot be traded away to meet a latency target.

## Issue and pull-request slicing

Each pull request should produce one coherent, independently valid outcome. Suggested order:

1. Documentation integration and plan.
2. Source/permission contract additions with migration tests.
3. Source Reader route and source navigation.
4. Source overlay/inspection and extraction status.
5. Local security envelope and resource limits.
6. Claim/relation/package contract v2 plus validator.
7. Manual transaction-isolation package and fidelity fixtures.
8. TSR state machine without learning prompt.
9. Transcript/focus/reduced-motion/zoom and crash recovery gate.
10. Faster/Deeper bundles and receipts.
11. Practice/rubric/evidence contracts and one prompt.
12. Repair and deterministic policy trace.
13. Delayed queue, active-time derivation, and source-free export.
14. Owner protocol/package lock.
15. Provider contract and permission preview.
16. Claim proposal and review queue.
17. Typed diagram grammar and renderer.

Do not combine Source Reader, schema v2, TSR redesign, learning loop, and AI provider work into one large pull request.

## First ten implementation issues

1. Write the contract-v2 field and migration decision note.
2. Specify the enhanced Source Reader interaction and overlay acceptance fixtures.
3. Add loopback origin-token, Host/CORS, CSP, and source-render sanitization tests.
4. Add pasted text, `.txt`, and Markdown through the canonical source contract.
5. Acquire or author the redistributable transaction-isolation source and freeze its hash and page/element expectations.
6. Implement canonical claim, clause support, concept relation, quality check, provenance, and package states.
7. Build the manual transaction-isolation package and accepted/rejected fixture set.
8. Replace timer-first player state with learner-stepped TSR and Source Reader return.
9. Complete transcript, keyboard, focus, reduced-motion, zoom, and restart recovery gates.
10. Add one rubric-scored prompt, one source-linked repair, and 24-hour/seven-day evidence scheduling.

## Scope-cut order

If the 60–120 hour budget becomes binding, cut in this order:

1. AI provider and compiler automation;
2. generated typed diagram;
3. optional one-word RSVP negative control;
4. pasted text/Markdown breadth beyond the fixture need;
5. automatic Faster/Deeper recommendations;
6. visual polish beyond accessibility and stable layout.

Do not cut Source Reader, manual package fidelity, source inspection, transcript, learner control, recovery, deletion, event/version integrity, or delayed review. Without those, the core hypothesis cannot be tested safely.

## Definition of cycle complete

This implementation cycle is complete only when:

- the Source Reader works without AI;
- one manually reviewed transaction-isolation lesson is immutable, inspectable, and source-locked;
- TSR is learner-controlled, accessible, and restart-safe;
- the sparse learning loop diagnoses and repairs one relation;
- 24-hour and seven-day review works locally;
- event replay reconstructs session and policy state;
- source-free research export is reproducible;
- privacy, security, deletion, and cloud-denial paths are tested;
- the owner pilot can run without changing package, instrument, or policy after exposure;
- all quality gates pass;
- the next decision follows the observed result, including the possibility that Source Reader remains the preferred product.
