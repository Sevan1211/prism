# WebMCP tool audit

**Reviewed:** 2026-09-07  
**Status:** historical 32-tool audit; its five consolidations are now implemented locally. See the [current 27-tool contract](../architecture/WEBMCP_INTEGRATION.md#consolidated-tool-contract--2026-09-07). The inventory and measurements below preserve the pre-change audit baseline.  
**Scope:** all 32 tools registered by the current local application, including their schemas, handlers, storage operations, guidance, and registration lifecycle.

## Original recommendation

Consolidate five overlapping tools, taking the surface from **32 to 27** after their remaining capabilities have been transferred and tested. Do not reduce the number by deleting supported reading, review, or approval behavior. The first objective is fewer ambiguous choices and unnecessary calls, not a numerical tool quota.

Keep the source-reading, original-image inspection, draft-writing, and learner-reviewed revision boundaries distinct. In particular, do not combine draft edits with proposed revisions merely to eliminate their repeated schemas. They have different effects on saved work.

The [Chrome WebMCP guidance](https://developer.chrome.com/docs/ai/webmcp/best-practices) recommends avoiding overlapping purposes, clear initiation versus execution names, and evaluating the tool set. It also favors static registration for most applications. The consolidation below is PRISM-specific engineering judgment, not a protocol requirement.

## What was measured

An isolated Chrome context loaded the running development application at `127.0.0.1:5173`. A registration interceptor captured the actual descriptors offered by the application. It does not establish that a real agent host discovered or used them successfully.

| Measurement | Observed |
| --- | --- |
| Registered tools on Library | 32 |
| Registered tools on landing | 32 |
| Tools with `readOnlyHint` | 17 |
| Other tools | 15, including visible navigation/import-dialog actions |
| Combined serialized descriptor characters | 46,818 |
| `apply_lesson_patch` descriptor | 10,678 characters |
| `propose_lesson_revision` descriptor | 11,392 characters |
| Combined patch/revision descriptors | 22,070 characters, approximately 47% of the total |
| `get_authoring_guide` result | 11,233 characters |

Characters are measured JSON lengths, not tokenizer counts, host context usage, latency, or proof of agent confusion. The current unit test independently enumerates the same 32 names. No duplicate registered names or obsolete streaming tools were found.

Read-only startup calls (`get_active_lesson_context`, `list_sources`, `get_authoring_guide`) succeeded in the empty isolated library without browser errors. No user sources, approvals, drafts, or activity records were inspected or modified in the user's browser profile. Audit captures are local under `output/`; they contain tool definitions and synthetic/empty-context observations.

## Complete pre-change inventory

“Merge” means transfer the listed behavior before removing the old registration. It does not mean the current replacement already provides all of it.

| # | Current tool | Decision | Reason and required follow-through |
| --- | --- | --- | --- |
| 1 | `get_active_lesson_context` | Keep; rename to `get_workspace_context` during migration | It orients every route, not just lessons. Keep current selection and route/version checks; return one canonical continuation call. It must not guess the selected source. |
| 2 | `list_sources` | Keep; improve | Essential library discovery. Add cursor pagination, optional search and folder metadata/filtering. Keep source IDs stable even though the visible product calls this Library. |
| 3 | `prepare_source_import` | Keep | Opens the learner's import form; neither imports bytes nor grants access. A distinct initiation tool avoids confusing it with an immediate download. |
| 4 | `import_public_pdf` | Keep | Performs a real HTTPS download/import for stated public rights. Different action and network behavior from preparing a local file picker. |
| 5 | `get_source_map` | Keep | Outline navigation, identity and readiness are different from a complete evidence inventory. Preserve pagination, heuristic warnings and permission-aware outline visibility. |
| 6 | `read_source_packet` | Keep; make canonical evidence reader | Handles one page as well as a long range, bounded text chunks, scans' image anchors and exact continuation. Add page-detail metadata needed to replace `read_source_page`. |
| 7 | `read_source_page` | Merge into `read_source_packet` | Same-page start/end already handles targeted reading. First preserve full page profiles and element confidence, order and reasons, which packets currently omit. Retain image-only pages, stable image anchors, and bounded splitting of oversized elements. |
| 8 | `get_scope_manifest` | Keep for now | It adds compact anchor previews, confidence/reasons, inventory totals and explicit omissions. These are not the current packet result. Reserve it for inventory/coverage work, not a mandatory pass before every packet read. An inventory view on the packet tool is a later option only if measured useful. |
| 9 | `read_source_bundle` | Keep; clarify name/purpose | Reads selected anchors plus nearby context, including disjoint pages. This is efficient evidence lookup during repair and citation checking. It is not equivalent to rereading a page range. Explain “selected anchors” before “bundle” in its description. |
| 10 | `search_source` | Keep; improve | Finds relevant passages before reading them. Add result continuation or explicit truncation and optional page bounds; currently only 20 hits are returned. |
| 11 | `get_source_visual_catalog` | Keep, optional | Read-only discovery of candidate figure regions/captions. It neither renders the inspection dialog nor establishes visual understanding. |
| 12 | `open_source_visual` | Keep as `inspect_source_visual` | One bounded visual-inspection tool can support `action: open/close`; opening requires a source and one to four views. Keep image permission, rendering receipts and actual browser vision. |
| 13 | `close_source_visual` | Merge into visual inspection | Closing the same transient viewer does not justify a separate definition. `action: close` should require no source ID or content permission and remain available after access is revoked. |
| 14 | `open_source_location` | Keep | Moves the main Reader to an exact citation, page or highlight. A temporary visual contact sheet serves a different user goal and should not replace Reader navigation. |
| 15 | `import_generated_illustration` | Keep, optional | Attaches an existing generated asset with attribution. It does not generate an image or inspect original evidence. Keep generated labeling and provenance restrictions. |
| 16 | `get_authoring_guide` | Keep; make topic-based | Keep a concise required core, with optional visual/grammar/revision details. Avoid forcing the entire 11,233-character guide on simple navigation or discussion tasks. |
| 17 | `create_lesson_brief` | Keep; reduce avoidable required input | Saves the learner's goal separately from the plan. `name`, `assignment`, `learner_goal` and mandatory time budget are a source of boilerplate. Preserve explicit scope and goals while allowing omitted cosmetic labels and unspecified time targets. This needs storage/schema alignment, not invented user preferences. |
| 18 | `get_authoring_workspace` | Keep; consolidate saved-work reads here | Make this the explicit resume/read surface for saved goals, plans and checkpoints. Add bounded source-level discovery and an explicit view for brief, plan or reviews. Preserve source hash checks, sections, review gaps and next calls. Never automatically choose among saved assignments. |
| 19 | `get_lesson_brief` | Merge into authoring workspace | The workspace already returns the saved brief, but it cannot discover briefs by source. Preserve that discovery through a paginated list view before removal. |
| 20 | `get_lesson_plan` | Merge into authoring workspace | Workspace has plan status and one selected section, but not complete plan metadata or source-level plan discovery. Transfer both, with bounded section/coverage views and full approval status. |
| 21 | `record_scope_review` | Keep | A durable checkpoint is an agent-authored interpretation, not a source read. Do not save a review implicitly when a packet is transported. Preserve nonoverlapping ranges and unresolved visual findings. |
| 22 | `get_scope_reviews` | Merge into authoring workspace | Workspace already returns one checkpoint, review gaps and a continuation call. Preserve total reviewed/requested pages, explicit cursor behavior and a lightweight reviews-only response to avoid repeating all workspace metadata. |
| 23 | `propose_lesson_plan` | Keep | Proposes the teaching sequence and coverage contract for learner approval. This must remain separate from brief creation and composition. |
| 24 | `open_lesson` | Keep | Shows saved work or its proposed plan. It must not approve the plan or accept a revision. Can later accept a lesson ID as well as a plan ID with strict ownership checks. |
| 25 | `get_lesson_document` | Keep | Reads the actual versioned artifact, section content, coverage map and pending revision metadata. Those bounded content reads are different from resuming authoring state. Preserve independent content/review cursors. |
| 26 | `apply_lesson_patch` | Keep | Writes an approved draft with typed operations, expected version and retry identity. Do not weaken the typed schema to arbitrary JSON to save schema space. |
| 27 | `validate_lesson` | Keep as optional diagnostic | Useful for fresh validation without saving. Patch receipts already contain validation and finalization validates again, so the guide should not require this immediately before every finalization. |
| 28 | `finalize_lesson` | Keep | A deliberate draft-to-ready transition with current-version checks and agent-authored coverage/semantic review. It is not the same operation as validating or writing blocks. |
| 29 | `propose_lesson_revision` | Keep | Stores a candidate without overwriting the current lesson. Its shared grammar with draft patches does not make its user effect interchangeable. Learner acceptance remains outside agent tools. |
| 30 | `get_lesson_end_check` | Keep, optional | Returns evaluation criteria and latest analyses while excluding stored answer text. Broader than the end questions present in a document read. Do not force it into ordinary reading/discussion. |
| 31 | `record_answer_analysis` | Keep, optional | Saves attributed answer evidence and uncertainty. It does not close a lesson or establish mastery. It is not a generic lesson revision. |
| 32 | `propose_lesson_outcome` | Keep, optional | Proposes a learner decision based on answer analysis. Distinct from proposing edits to lesson content. Removing the optional learning-check feature would be a separate product-scope decision. |

## Findings beyond the tool count

### 1. Saved-work discovery can fail as the library grows

`list_sources`, source-level `get_lesson_brief`, and source-level `get_lesson_plan` build complete arrays without pagination. `textResult` rejects results over 16,000 characters with `tool_result_too_large`. These tools have no cursor/limit argument to satisfy the resulting instruction to request a smaller response. This is a reachable implementation limit identified from code, not an observed failure in the user's library.

Priority: fix bounded source/brief/plan discovery as part of the consolidation. Preserve exact IDs and provide executable `next_call` continuation, including on empty results. A single giant workspace response would reproduce the problem.

### 2. Workflow guidance is inconsistent with the efficient path

- The authoring guide directs startup through `get_lesson_brief` and repeatedly refers to `get_scope_reviews`, while the newer workspace tool already joins much of that information. Prefer direct continuation when an explicit brief or plan is known; list saved work only when the ID is missing.
- The over-32-page manifest error still recommends `read_source_page`, contrary to the newer full-range packet workflow.
- The guide requires `validate_lesson` before `finalize_lesson`, even though patch saves validate and finalization freshly validates. Keep diagnostic validation available; eliminate the compulsory duplicate call when current receipts already suffice.
- The source-access documentation table omits `import_public_pdf`; the registered illustration importer is described elsewhere rather than listed in the tool tables. A generated inventory should catch documentation drift.

### 3. A smaller name list is not necessarily a smaller or better interface

The two edit schemas account for almost half the registered descriptor characters. Combining them would save more characters than merging small readers, but risks hiding the distinction between changing a draft and proposing a revision. Keep that boundary.

Do not introduce a generic `prism_action`, CRUD dispatcher, or one tool that mixes reads and writes. A narrowly scoped read-only authoring workspace and one viewer open/close action are reasonable consolidations; unbounded mode combinations are not.

Do not promise token or speed savings from the five proposed removals: expanded replacement schemas may offset descriptor savings. Measure wrong-tool choices, redundant calls, response size, successful recovery and preserved fidelity in representative agent runs.

### 4. Schemas and continuation conventions need consistency

Several tools require an ID combination only inside the handler, while their schema permits `{}`: workspace, brief, plan, document, validation, end check and visual opening. Some accept both selectors and silently prioritize one; workspace explicitly checks brief/plan consistency. State valid selector combinations consistently in schema descriptions and runtime validation. Reject conflicting IDs rather than silently ignoring them.

Cursor types vary across tools. That is survivable if every paged response provides an exact `next_call`; currently packets do this well, while several readers return only a cursor. Consolidation must retain separate content and coverage-review streams and distinguish “this response reached the end” from “the agent read the whole range.”

### 5. Optional tools should remain optional

All 32 tools are offered on landing and Library. Start by improving descriptions and canonical next calls. Consider state-aware exposure for the three learning-check tools, generated illustration import, or draft/revision actions only after host discovery/refresh behavior is tested. Avoid tying authoring availability solely to the visible route: agents need to inspect a source and continue a lesson across routes.

There is no usage-frequency evidence here to label optional tools unused. The audit deliberately did not inspect the user's activity history.

## Implementation sequence and acceptance

1. Fix pagination and canonical guidance; split the guide into concise core and requested topics. These improvements reduce failed or redundant calls without removing capabilities.
2. Extend packet page details and workspace views/discovery. Migrate internal next calls, guide text, generated public docs, activity labels and registration tests. Then remove the four obsolete read registrations and their unused adapters.
3. Consolidate viewer open/close into a narrowly typed inspection action, preserving close-after-revocation and visible render completion. Remove the old close registration. The resulting target is 27 tools.
4. Rehearse source discovery, one-page questions, complete long-range reading, scan inspection, interrupted review resume, plan review, draft creation, finalization and learner-requested revision. Preserve explicit learner consent and approval throughout.
5. Test large libraries/plans, dense single elements, missing indexes, invalid/conflicting IDs, stale versions, revocation, route changes and retry behavior. Check actual host rediscovery before any dynamic-registration optimization.

No indefinite compatibility aliases are proposed: they would retain the overlapping discovery surface. If a host caches old definitions, use a coordinated reload/migration and verify stale calls fail with useful guidance. Preserve supported stored briefs/plans/documents; tool consolidation does not authorize deleting learner data or changing its approval state.

## Code and verification references

- [Library, planning, composition and discussion tools](../../apps/web/src/webmcp/usePrismLibraryTools.ts)
- [Evidence, visual and resume tools](../../apps/web/src/webmcp/useDocumentIntelligenceTools.ts)
- [Workspace continuation](../../apps/web/src/webmcp/authoringWorkspace.ts)
- [Packet transport](../../apps/web/src/storage/sourcePackets.ts)
- [Manifest and anchor bundle implementations](../../apps/web/src/storage/browserSources.ts)
- [Output limits and access policy](../../apps/web/src/webmcp/context.ts)
- [Registration lifecycle](../../apps/web/src/webmcp/useModelContextTool.ts)
- [Shared agent guide](../../apps/web/src/webmcp/authoringGuide.ts)
- [Complete expected registration set](../../apps/web/src/App.test.tsx)
- [Integration contract](../architecture/WEBMCP_INTEGRATION.md)

This audit does not establish live agent authoring success, semantic correctness, source coverage or learning effectiveness. It records the pre-change findings; implementation acceptance is recorded in the current integration contract.
