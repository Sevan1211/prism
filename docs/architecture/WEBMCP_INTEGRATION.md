# WebMCP integration

**Reviewed:** 2026-09-07  
**Contract:** browser-local reading, source-grounded authoring, and learner-approved changes.  
**Related:** [Lesson specification](../product/INTERACTIVE_LESSON_SPEC.md), [document intelligence](DOCUMENT_INTELLIGENCE.md), [release evidence](../engineering/SUBMISSION_READINESS.md).

## Shared workspace

The [2026-09-07 tool audit](../engineering/WEBMCP_TOOL_AUDIT.md) recorded the previous 32-tool surface. Its five consolidations are now implemented locally: **27 tools** remain, with unchanged learner consent and approval boundaries.

The learner brings a compatible browser agent. PRISM registers page tools through `document.modelContext` where supported. A normal browser still provides the source library and Reader; generation requires an external agent. PRISM has no hosted inference service or embedded chatbot.

Tools register at the application root and remain available across library, overview, lesson and Reader routes. Tool discovery in the actual host, application validation, source fidelity, and owner approval are separate checks. [Official WebMCP documentation](https://learn.chatgpt.com/docs/webmcp).

## Discovery and efficient authoring — local change, awaiting deployment

The September 4 change follows [OpenAI's integration guidance](https://learn.chatgpt.com/docs/webmcp), [Chrome's imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api), [Chrome's best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices), and the [WebMCP specification](https://webmachinelearning.github.io/webmcp/). JavaScript registration uses top-level `document.modelContext.registerTool` with AbortSignal cleanup. Registration promises can stay pending for the tool lifetime; their rejection is observed without blocking startup.

A single page registry handles API arrival with a bounded startup probe, focus/page-show recovery and explicit retry. React state changes update executors without registering duplicate tools. Registration failures are visible and failed registrations are aborted. The Agent tools dialog distinguishes interface availability, tools offered, and the last completed/error call. It does not claim the host discovered tools merely because registration was attempted. Host/model support, site-tool settings and approval remain external constraints.

`get_active_lesson_context` is the startup tool: current source, index/access state, active plan/document version, and suggested next calls. Follow an explicit resume call directly. `get_authoring_guide` core is read once before authoring; simple navigation does not require it. Source overview and Reader orientation remain metadata-only without content permission. Existing saved work is resumed rather than recreated.

`read_source_packet` now accepts the full requested page range and loads at most eight indexed pages per call. It preserves exact extracted text, anchors, warnings, and text offsets within the existing bounded response. `next_call` includes the exact continuation arguments; dense pages may require multiple calls. `pages_completed_in_packet` records transport, not understanding; `range_exhausted` means there is no next packet, not that earlier packets were read. Missing indexes and invalid cursors fail with actionable errors. Original pixels still require separate inspection. Scope reviews remain nonoverlapping ranges of at most eight pages.

Public `/llms.txt` and `/agent-guide.md` are generated from the same authoring contract as `get_authoring_guide`; `node scripts/write_agent_docs.mjs --check` detects drift. Dev/build regenerates them. The [llms.txt proposal](https://llmstxt.org/) is supplemental documentation, not a WebMCP enablement mechanism or a promise that every host will fetch it. These files contain no library content or credentials. Tool descriptions and runtime registration remain the primary interface.

For lower transport overhead, `read_source_packet` accepts `format: compact`:
`rows` use the returned `columns` order in place of repeated object keys. Every
text fragment, full citation ID, bounding box, status and continuation offset is
retained. Detailed objects remain the default for existing callers. `next_call`
preserves the chosen format. `get_authoring_workspace` joins saved authoring state
and paginates review checkpoints; it grants no permissions and does not generate
content or approve work. See the [latency contract](../engineering/LEARNING_EXPERIENCE_IMPROVEMENTS.md#latency-and-recovery)
for benchmark limits and recovery behavior.

## Source access

| Tool | Purpose |
|---|---|
| `import_public_pdf` | Download a requested public-domain or openly licensed HTTPS PDF and start indexing |
| `prepare_source_import` | Open the visible import dialog; cannot select files, upload bytes, or grant content access |
| `list_sources` | Paginated source metadata, access/readiness and folder information; optional name/folder filters |
| `get_source_map` | Candidate outline, page count, index state, and limitations |
| `get_scope_manifest` | Cursor-paged element inventory for up to 32 pages |
| `read_source_packet` | Full requested range, bounded lossless evidence packets with exact continuation calls |
| `read_source_bundle` | Bounded evidence from selected anchors |
| `search_source` | Local lexical search with page regions |
| `open_source_location` | Open the canonical Reader at a selected page/region |
| `get_source_visual_catalog` | On-demand raster/vector region candidates, caption previews and suggested crops; four pages per call |
| `inspect_source_visual` | `action: open` renders one detailed page/crop or 1–4 selected views; `action: close` dismisses the viewer without requiring source access |

`inspect_source_visual` does not return an image attachment or prove visual understanding. The host's browser vision must actually inspect the rendered page. A caption is not enough to infer a chart's values. Page-image anchors support source crops independently of text extraction; they certify origin, not interpretation.

Visual selection starts from the learner goal and indexed evidence. Full requested
source coverage does not require opening every decorative, duplicate or unrelated
image. `get_source_visual_catalog` is optional discovery for relevant pages, not a
mandatory image tour. It uses PDF.js image coordinates and drawing bounds, clusters
candidate regions, associates nearby caption candidates and offers padded crops.
It retains a full-page fallback and labels uncertain associations and omissions.
The metadata cache is bounded; two pages render concurrently and requests process
at most four pages. Image access is checked before loading or returning cached
data. The catalog does not extract original encoded assets, perform OCR, recover
numeric chart data or verify semantic figure boundaries. See the
[document intelligence contract](DOCUMENT_INTELLIGENCE.md).

The batch viewer renders up to four views in one dialog. Agents inspect the contact
sheet with browser vision, then enlarge only details needed to support the lesson.
Successful receipts follow rendering and a browser paint opportunity; partial
failures remain visible. An overview never establishes unreadable numeric values.

Private and unknown-rights content is denied until the learner grants the relevant payload classes. A former text-only grant does not silently permit page images. Access revocation is checked again at content boundaries. Public/open-license status and private-source consent are distinct concepts.

**Owner decision — 2026-09-08:** Adding a PDF through the visible import dialog
now enables source access automatically after successful import. There is no extra
checkbox. The import disclosure explains that connected agents can read selected
text and page images under their provider's data controls. Private/unknown sources
receive a fingerprint-bound grant on this browser; Revoke remains available in the
source overview. A failed grant keeps the PDF and reports the failure. Reuploading
a source grants access again; cancelling import does not change existing access.
Existing sources are not retroactively granted access by an app update or cloud
restore. Public/open-license sources keep their rights-based behavior.

`prepare_source_import` only opens the dialog; it cannot choose or submit a private
file. `import_public_pdf` remains limited to public/open-license imports. Source
access does not approve a lesson plan or accept a revision for the learner.

## Planning and long-source review

| Tool | Purpose |
|---|---|
| `get_authoring_guide` | Concise core by default; focused writing, visuals and revisions topics on request |
| `get_authoring_workspace` | Explicit saved-work resume; paginated discovery by source; focused brief, plan and review views; source access and fingerprint gated |
| `create_lesson_brief` | Save the goal, prior knowledge, range, depth, output kind, and soft length/time targets |
| `record_scope_review` | Save a nonoverlapping 1–8 page review with essential anchors and visual findings |
| `propose_lesson_plan` | Propose the teaching sequence and complete coverage accounting |
| `open_lesson` | Open a plan or saved document without approving it |

Small scopes classify the complete element inventory. Large scopes require reviews covering every requested page, contiguous coverage ranges with explicit rationales, and a selected essential-anchor ledger. An unresolved visual review cannot silently become taught content. The agent must inspect or explicitly exclude it. The selected evidence set is bounded; a long source is never treated as one unrestricted prompt.

Word count and reading time are approximate targets, not hard truncation budgets. A ten-page equivalent is expressed as a word target because browser layout has no fixed printed page count. End questions are optional.

**The agent cannot approve its own plan.** The visible learner control freezes the scope and sequence. Browser automation that impersonates the learner does not satisfy this boundary. Approval authorizes composition; it does not establish correctness, source fidelity, or learning.

## Composition and revision

| Tool | Purpose |
|---|---|
| `get_lesson_document` | Compact document outline; bounded section content with continuation cursor |
| `import_generated_illustration` | Attach generated PNG/JPEG bytes with attribution and purpose; always labeled as added illustration |
| `apply_lesson_patch` | Progressive typed edits to an approved draft with an expected version |
| `validate_lesson` | Structural checks: planned evidence, provenance, exact excerpts, sections, and representation presence |
| `finalize_lesson` | Save initial reading-ready content with a candid agent semantic review |
| `propose_lesson_revision` | Save a candidate change to the same lesson without overwriting the current version |

The grammar supports connected rich text, excerpts, original source crops, equations, code as text, tables, worked examples, declarative scenes, numeric plots, and other typed blocks. Scenes accept bounded nodes, edges, positions, focus steps, and textual explanations. Charts accept explicit finite numeric data. No arbitrary HTML, SVG source, CSS, JavaScript, expressions, remote Markdown images, paths, or callbacks are executed from an agent's lesson.

A ready document cannot be silently patched. A revision includes a summary, before/after content, changed evidence, and any moved blocks. Only the learner accepts or dismisses it. Stale proposals fail if the document changes. Acceptance and immutable version storage are atomic; restoration creates a new current version and preserves history.

Structural validation cannot determine whether a claim is true, a diagram is scientifically correct, an omission is acceptable, or a lesson teaches well. The agent must separately compare the content with its sources and inspect the rendered result. Its review remains explicitly agent-authored.

## Discussion and optional learning checks

| Tool | Purpose |
|---|---|
| `get_active_lesson_context` | Current route, source, plan, version, and selected passage/request |
| `get_lesson_end_check` | Optional questions and their source-grounded evaluation criteria |
| `record_answer_analysis` | Evidence-linked analysis of an answer, including uncertainty |
| `propose_lesson_outcome` | Recommend continued discussion, closing, or a separate repair scope |

The default response to a confusing concept is a proposed improvement to the same saved lesson. A separate child lesson remains available when a genuinely separate scope is desired. Learner controls decide outcomes. Immediate answer evidence is never called mastery or durable retention.

## Privacy and recovery

PDFs stay in OPFS; structured state stays in IndexedDB. Selected evidence sent to an external agent follows that provider's data controls. The default static site makes no companion API request. Local storage is neither cloud synchronization nor a backup.

Source documents and website/tool outputs are untrusted evidence. Embedded instructions cannot authorize actions, disclose data, change rights, or alter security policy. The application checks source access, identifiers, bounds, schema, and optimistic versions independently of the model. The browser host applies its own action review.

The activity ledger stores compact receipts rather than prompts or document bodies. Stable parser-version anchors remain resolvable for supported older indexes. Unsupported or incomplete indexes fail closed and retain the original Reader. Registration cleanup tolerates route changes and React Strict Mode.

## Verification boundary

Unit/integration checks cover authorization, version conflicts, revision history, parser recovery, source limits, and typed visual controls. The actual host has exercised discovery, paper indexing, paginated reads, visual crops, review checkpoints, and plan creation. A live lesson write was correctly blocked by automatic approval review after the agent simulated plan approval; that simulated state is not valid owner authorization. The complete live composition/revision rehearsal remains pending explicit owner approval.

## Content review transport — 2026-09-04

`finalize_lesson` and `propose_lesson_revision` require `coverage_review`: entries
with `concept`, `source_element_ids`, `block_ids`, and `retained_details`. The map
covers every retained planned anchor and candidate block, with actual citation
membership checked. It is an agent judgment, not semantic verification.
`get_lesson_document` accepts `include_review` and `review_cursor`, returning a
separate `coverage_review.entries` page and `next_review_cursor`. Continue the
review cursor independently of the content cursor. Older records without maps
remain readable; new finalization/revision must provide the map. See the
[reading-quality contract](../engineering/LEARNING_EXPERIENCE_IMPROVEMENTS.md).


## Consolidated tool contract — 2026-09-07

The page keeps a stable set of 27 tools across routes. No broad action dispatcher,
dynamic tool hiding, agent approval tool, or legacy registration aliases were added.
Reload the page/refresh host discovery after this tool-schema migration. Saved
sources, briefs, plans, approval fingerprints, documents and historical activity
receipts keep their existing storage format.

- `list_sources` returns `sources`, `total`, `next_cursor` and exact `next_call`.
  Optional `query` matches source names; `folder_id: null` selects unfiled sources.
  Folder IDs and names appear in each source result. Empty folders are not a
  separate agent discovery surface. Discovery does not grant source-content access.
- `get_authoring_workspace` defaults to `view: resume` with a saved `brief_id` or
  `plan_id`. Both are accepted only when they belong together. `view: discovery`
  takes `source_id`, optional `kind: briefs|plans`, and cursor/limit. It lists
  candidates without choosing a learner assignment. `view: brief` reads one goal;
  `view: reviews` paginates complete checkpoints and reports review progress.
  `view: plan` requires a plan ID and provides paginated `part: sections|coverage|ranges|objectives|questions`.
  Optional `section_id` selects one section in the sections part. Full details live
  in these focused views; resume includes bounded progress previews and detail calls.
  Saved-work reads and evidence packets recheck source access before disclosure,
  including when access is revoked or the source is removed during an async read.
- Source and saved-work discovery cursors carry a collection checksum. Changed
  collections or filters fail with restart guidance rather than silently skipping
  records. This checksum is a consistency check, not a security credential.
- `read_source_packet` accepts `include_details: true` for complete page profiles,
  element confidence, order and reasons. Equal start/end selects one page. Compact
  columns name the extra fields; exact continuations retain details and format.
  Oversized text elements split with offsets; scans retain original-image anchors.
- `inspect_source_visual` requires `action`. Opening requires a source and either
  one page/crop or a selected batch. Closing takes `action: close` alone and remains
  possible after source access is revoked. Opening still checks image permission
  and waits for actual rendering; the result is not an image attachment.
- `get_authoring_guide` accepts `topic: core|writing|visuals|revisions`. Core includes
  fidelity, consent, approval, continuation and review requirements. Detailed topics
  remain available. The public guide is generated from the same complete contract.
- Source maps/manifests and lesson content/coverage-map reads return exact continuation
  calls. Lesson continuation calls bind `document_version`; changed documents require
  restarting the read. Content and coverage-review continuations remain independent.
  Document summaries link to optional question criteria instead of repeating them.
- Document reads, standalone validation and end-check reads require exactly one of
  lesson ID or plan ID. Wrong-view workspace arguments and conflicting selectors are
  rejected. Search discloses its 20-hit limit and suggests narrowing saturated queries.
- Successful patch receipts carry the saved version and validation. Standalone
  validation is optional diagnostics; finalization always performs fresh validation
  and still requires an attributed content review. Proposal receipts link directly
  to the visible learner review step. Draft writes and proposed revisions stay separate.

Checks for this migration distinguish isolated synthetic browser acceptance from
actual agent-host discovery, owner approvals and source-fidelity review. The
synthetic rehearsal must never be interpreted as authorization for a real lesson.

### Local migration evidence

An isolated Chrome rehearsal verified all 27 registrations and exercised the canonical
workflow using a synthetic PDF: import with a test grant, source discovery,
packet details, text search, rendered visual inspection, saved brief discovery,
coverage checkpoint, plan proposal, refusal before approval, the visible approval
control on the synthetic fixture, draft save and idempotent retry, workspace
resume, plan detail read, finalization, stale-version refusal, ready-draft write
refusal, revision isolation, reload recovery, source-access revocation and close
after revocation. Rendered inspection and saved-lesson screenshots were reviewed.

Final local checks passed: 219 web tests across 55 files, lint, TypeScript and
production build, generated-agent-document drift checks, and Markdown checks.
The existing large-JavaScript-chunk build warning remains. The development preview
was restarted on port 5173 after its process stopped during a concurrent validation
run; the complete isolated browser rehearsal then passed against the stable preview.

The default core guide measured 3,116 serialized characters versus 11,233 before
the change (about 72% less). Removing five tool names only slightly reduces total
descriptor size: replacement schemas carry the preserved detail and discovery
options. These are transport measurements, not measured agent task latency or
proof of improved tool choice. Real external-host rediscovery and comparative
agent-run evaluation remain separate from this local acceptance rehearsal.

## Authoring quality diagnostics - 2026-09-08

The source starter, saved brief handoff and selected-passage request share one
compact request card. A single copy action exposes its full request on demand;
clipboard failure opens a selectable manual fallback. Requests reuse saved scope
and existing learner approvals without removing consent boundaries.

Visual save/validation reports now warn when a later scene step omits a previously
moved node (which returns it to its base position), and identify guided diagrams
whose steps change emphasis without movement. These are review cues, not automatic
semantic verdicts or approval gates. The authoring guide explicitly defines
non-cumulative step positions and requires inspecting saved crops, all sequence
states, captions and calculated values. Tight crops must include top labels and
all relevant panels; uncertain crops should retain a complete source page.

Agent activity timings aggregate up to 300 stored source receipts, while the
visible list retains 12. Export timings writes a source-text-free JSON report with
local tool names, timestamps, durations and outcomes. These timings exclude model
thinking, host delays, approval waits and reading time; they cannot establish an
end-to-end speedup by themselves. A new same-scope authoring run and its host trace
are required to attribute or compare the full creation time.

## Incremental composition review — 2026-09-08

Draft `apply_lesson_patch` accepts optional partial `coverage_review` entries.
They are checked against actual candidate blocks and planned citation membership,
then merged with unchanged saved entries. A review-only checkpoint uses empty
`operations` and a nonempty map. Empty probes still fail. The request fingerprint
includes the review: uncertain retries cannot duplicate or alter it silently.
Editing, moving or reordering a mapped block invalidates its entry. Replacing an
entry spanning several blocks requires reviewing that whole group again.

Patch receipts and authoring resume expose bounded `review_progress`. Document
reads accept `content_filter: all|unreviewed|visuals` and retain the filter and
version in continuation calls. Content pages now allow 24,000 serialized block
characters rather than 11,000, retaining whole blocks and the existing bounded
response. No source text, lesson prose or precision is removed.

`finalize_lesson` may omit `coverage_review` to validate the saved union. It still
requires every retained planned anchor and every block, full structural validation,
and an attributed semantic-review summary. No automatic semantic verdict is added.
The agent checks each section against its source during composition, inspects the
first rendered section early, batches later visual inspection, and finishes with
a cross-section consistency/omission check. Reading all reviewed prose back through
tools and regenerating an unchanged map are unnecessary. Every authored visual
still needs actual inspection; checkpoints do not certify pixels or truth.
