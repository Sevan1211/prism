# WebMCP integration

**Reviewed:** 2026-09-03  
**Contract:** browser-local reading, source-grounded authoring, and learner-approved changes.  
**Related:** [Lesson specification](../product/INTERACTIVE_LESSON_SPEC.md), [document intelligence](DOCUMENT_INTELLIGENCE.md), [release evidence](../engineering/SUBMISSION_READINESS.md).

## Shared workspace

The learner brings a compatible browser agent. PRISM registers page tools through `document.modelContext` where supported. A normal browser still provides the source library and Reader; generation requires an external agent. PRISM has no hosted inference service or embedded chatbot.

The current route-stable surface has 27 tools. Tool discovery in the actual host, application validation, source fidelity, and owner approval are separate checks. [Official WebMCP documentation](https://learn.chatgpt.com/docs/webmcp).

## Source access

| Tool | Purpose |
|---|---|
| `prepare_source_import` | Open the visible import dialog; cannot select files, upload bytes, or grant content access |
| `list_sources` | Discover source metadata and access/readiness state |
| `get_source_map` | Candidate outline, page count, index state, and limitations |
| `get_scope_manifest` | Cursor-paged element inventory for up to 32 pages |
| `read_source_page` | One page's paginated elements and stable original-image anchor, including scans |
| `read_source_bundle` | Bounded evidence from selected anchors |
| `search_source` | Local lexical search with page regions |
| `open_source_location` | Open the canonical Reader at a selected page/region |
| `open_source_visual` | Render a page or normalized crop and wait for its pixels |
| `close_source_visual` | Return from inspection to the underlying workspace |

`open_source_visual` does not return an image attachment or prove visual understanding. The host's browser vision must actually inspect the rendered page. A caption is not enough to infer a chart's values. Page-image anchors support source crops independently of text extraction; they certify origin, not interpretation.

Private and unknown-rights content is denied until the learner grants the relevant payload classes. A former text-only grant does not silently permit page images. Access revocation is checked again at content boundaries. Public/open-license status and private-source consent are distinct concepts.

## Planning and long-source review

| Tool | Purpose |
|---|---|
| `get_authoring_guide` | Generic writing, fidelity, visual, and revision guidance |
| `create_lesson_brief` | Save the goal, prior knowledge, range, depth, output kind, and soft length/time targets |
| `get_lesson_brief` | Resume the saved assignment |
| `record_scope_review` | Save a nonoverlapping 1–8 page review with essential anchors and visual findings |
| `get_scope_reviews` | Resume one review at a time with compact overall progress |
| `propose_lesson_plan` | Propose the teaching sequence and complete coverage accounting |
| `get_lesson_plan` | Read plan metadata and one section's evidence when requested |
| `open_lesson` | Open a plan or saved document without approving it |

Small scopes classify the complete element inventory. Large scopes require reviews covering every requested page, contiguous coverage ranges with explicit rationales, and a selected essential-anchor ledger. An unresolved visual review cannot silently become taught content. The agent must inspect or explicitly exclude it. The selected evidence set is bounded; a long source is never treated as one unrestricted prompt.

Word count and reading time are approximate targets, not hard truncation budgets. A ten-page equivalent is expressed as a word target because browser layout has no fixed printed page count. End questions are optional.

**The agent cannot approve its own plan.** The visible learner control freezes the scope and sequence. Browser automation that impersonates the learner does not satisfy this boundary. Approval authorizes composition; it does not establish correctness, source fidelity, or learning.

## Composition and revision

| Tool | Purpose |
|---|---|
| `get_lesson_document` | Compact document outline; bounded section content with continuation cursor |
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
