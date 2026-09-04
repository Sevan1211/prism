# Conceptual system design

**Status:** adopted target architecture  
**Reviewed:** 2026-08-31  
**Related:** [`DEVICE_LOCAL_WEB_ARCHITECTURE.md`](DEVICE_LOCAL_WEB_ARCHITECTURE.md), [`DOCUMENT_INTELLIGENCE.md`](DOCUMENT_INTELLIGENCE.md), [`WEBMCP_INTEGRATION.md`](WEBMCP_INTEGRATION.md), [`../product/INTERACTIVE_LESSON_SPEC.md`](../product/INTERACTIVE_LESSON_SPEC.md)

## Design goal

Create a hosted, local-first system in which a learner can read an original source or collaborate with a browser-hosted agent to build, discuss, evaluate, and revise a saved interactive lesson. Every factual block, visual relation, question criterion, and repair must remain traceable to an immutable source anchor or be labeled as an added explanation.

## System flow

```text
personal source bytes
  -> browser-local immutable source vault
  -> page render + extraction + quality inventory
  -> layout, structure, visual, and cross-reference graphs
  -> retrieval indexes + complete selected-scope manifest
       |                              |
       v                              v
  canonical Source Reader        WebMCP agent planning
                                      |
                              learner approves plan
                                      |
                              typed lesson composition
                                      |
                     coverage + grounding + accessibility gates
                                      |
                        saved interactive lesson version
                                      |
                         learner reads and discusses
                                      |
                        end questions in agent chat
                                      |
                     agent proposes close | discuss | repair
                                      |
                         learner accepts or dismisses
```

## Boundaries

### Hosted application shell

Ships the React interface, PDF.js integration, local storage adapters, typed lesson renderer, WebMCP registrations, and open-license hero content. It does not store personal source bytes.

### Browser-local data layer

OPFS stores PDFs and large artifacts. IndexedDB or a browser-local database stores metadata, graphs, indexes, anchors, lessons, annotations, activity, and answer evidence. All durable jobs are resumable and versioned.

### Document intelligence

Separates rendering, extraction, and semantic interpretation. It produces page and layout records, document hierarchy, visual assets, cross-references, retrieval indexes, stable anchors, and quality/status evidence. Unsupported elements remain source-only.

### Source Reader

Renders the immutable original with text selection, search, annotation, visual-region copy, progress, extraction status, and bidirectional lesson links. It works without an agent.

### WebMCP agent boundary

The connected agent receives only consented, bounded tool results. It interprets assignments, creates lesson plans, composes typed blocks, maintains conversational lesson context, analyzes end answers, and proposes revisions. The agent never controls source identity, permissions, rendering safety, persistence, or approval state.

### Lesson document

A lesson is a versioned multi-section document containing objectives, coverage dispositions, semantic frames, typed representation blocks, provenance, end questions, answer criteria, accessibility alternatives, and activity receipts. Saved lessons remain viewable offline.

### Quality gate

Deterministic checks verify:

- identifier and anchor existence;
- source-span and region closure;
- immutable payload identity;
- approved scope and coverage dispositions;
- qualifier, symbol, unit, and ordering preservation where mechanically checkable;
- representation schema and render safety;
- question answerability links;
- accessibility and reduced-motion alternatives.

Model or agent review may propose corrections but cannot self-certify unsupported content. A critical failure blocks readiness and preserves the last valid lesson version.

## Core data contracts

### Source anchor

```yaml
source_anchor:
  id: string
  source_hash: string
  parser_version: string
  page_index: integer
  printed_page_label: string | null
  section_id: string | null
  element_id: string | null
  bbox_normalized: [number, number, number, number] | null
  start_offset: integer | null
  end_offset: integer | null
  text_snapshot_hash: string | null
```

### Lesson

```yaml
lesson:
  id: string
  version: integer
  source_id: string
  name: string
  status: plan_draft | plan_approved | composing | needs_review | ready | in_progress | completed | superseded
  parent_lesson_id: string | null
  scope:
    section_ids: [string]
    page_ranges: [[integer, integer]]
    anchor_ids: [string]
  goal: string
  time_budget_minutes: integer | null
  objective_ids: [string]
  coverage_entries: [coverage_entry]
  section_ids: [string]
  end_check_id: string
  provenance_bundle_id: string
  accessibility_bundle_id: string
  content_hash: string
```

### Lesson section and semantic frame

```yaml
lesson_section:
  id: string
  title: string
  objective_ids: [string]
  frame_ids: [string]
  source_anchor_ids: [string]

semantic_frame:
  id: string
  instructional_purpose: string
  block_ids: [string]
  source_anchor_ids: [string]
  prerequisite_frame_ids: [string]
  content_origin: source_verbatim | source_paraphrase | prism_reconstruction | added_explanation
  publication_status: draft | needs_review | ready | rejected | superseded
  accessible_alternative_ids: [string]
```

### Coverage entry

```yaml
coverage_entry:
  source_item_id: string
  objective_ids: [string]
  disposition: core | supporting | compressed | prerequisite | omitted | deferred | source_only
  reason: string
  lesson_location_ids: [string]
```

### End check and answer analysis

```yaml
end_check:
  id: string
  lesson_version: integer
  question_ids: [string]

answer_analysis:
  id: string
  question_id: string
  learner_answer: string
  status: demonstrated | partially_demonstrated | unclear | contradicted | not_attempted
  criterion_results: [criterion_result]
  evidence_anchor_ids: [string]
  uncertainty: string | null
  agent_identity: string
  observed_at: timestamp

outcome_proposal:
  id: string
  lesson_version: integer
  analysis_ids: [string]
  recommendation: close | continue_discussion | repair
  unresolved_criterion_ids: [string]
  repair_brief: repair_brief | null
  status: proposed | accepted | dismissed
```

## Representation renderer

The renderer accepts constrained text, source asset, equation, code, table, chart, diagram, timeline, process, worked-example, and animation-sequence specifications. It owns sanitization, layout, theming, accessibility, reduced motion, and deterministic fallbacks.

Agent-generated arbitrary HTML, JavaScript, CSS, SVG, external asset execution, and code execution are forbidden. A source visual is preferred when it already expresses the intended relation well.

## Learner control

- The learner approves lesson scope and plan once.
- The learner may ask questions at any point.
- Conversation does not silently modify the saved lesson.
- Material revisions and repair lessons require a proposal and approval.
- The learner can reopen the original source and any earlier lesson version.
- The learner can revoke future agent source access.
- The learner can export or delete all local product state.

## Failure behavior

- Unsupported page or region -> Reader remains available; transformation is blocked for that evidence.
- Retrieval uncertainty -> return candidates and uncertainty; do not claim a unique answer.
- Coverage gap -> lesson remains draft and names the unresolved objective or source item.
- Invalid lesson patch -> reject atomically and retain the last valid version.
- Lost agent -> preserve current lesson state; Reader and saved lessons remain usable.
- Lost browser permission for a linked file -> request reconnection without discarding derived state.
- Storage limit -> stop before corrupting the local vault and offer export or cleanup.
- Agent consent revoked -> unregister content tools and block new content responses.
- Accessibility fallback missing -> block the affected representation from ready status.

## Experimental and research boundary

Traceable Semantic Relay, adaptive representation choice, generated visual pedagogy, and agent-mediated repair remain Experimental until evaluated against the Source Reader using immediate inference, transfer, delayed retention, workload, total time, control use, and fidelity errors.

The challenge proves a coherent product workflow and WebMCP collaboration. It does not prove that PRISM improves learning.
