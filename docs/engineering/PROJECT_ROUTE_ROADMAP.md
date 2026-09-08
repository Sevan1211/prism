# Project learning route roadmap

**Status:** implementation roadmap recorded 2026-08-31  
**Product direction:** [`../product/PROJECT_UNDERSTANDING_WORKSPACE.md`](../product/PROJECT_UNDERSTANDING_WORKSPACE.md)  
**Challenge delivery:** [`WEBMCP_CHALLENGE_PLAN.md`](WEBMCP_CHALLENGE_PLAN.md)

## Outcome

Extend PRISM from a library of independent source lessons to a private project workspace that proposes a transparent learning route through a selected source collection. Preserve the current source-bound lesson, provenance, consent, and learner-approval contracts.

## First release: Project Learning Route

The first release is intentionally narrower than general multi-source synthesis.

1. A learner creates a local project with name, goal, time budget, intended depth, and selected sources.
2. The agent receives only bounded maps and consented evidence for selected sources.
3. It proposes three to six route steps. Each step has one primary source, one bounded range, objective, prerequisite assumptions, coverage/uncertainty disclosure, and time estimate.
4. The learner visibly approves or rejects the route. The agent cannot approve it.
5. Starting a step enters the existing source-bound lesson plan, composition, end-check, and repair flow.
6. An accepted repair appears as a named route step or linked child, never as a silent overwrite.

This proves “a trustworthy path through a pile” while retaining the current one-source lesson and evidence model. It does not claim automatic cross-source reasoning, conflict resolution, a perfect knowledge graph, or universal source-format support.

## Sequenced work

### 0. Truth and contract sweep

- Reconcile docs with the actually registered site-tool inventory.
- Mark `get_related_context` and `open_lesson_location` as planned until implemented, or implement and test them before claiming them.
- Correct descriptions whose content-access rules differ from implementation.
- Add a source-content-is-untrusted policy and adversarial tests for prompt-like source text.

**Exit:** public documentation, registration inventory, and tool descriptions agree.

### 1. Project persistence and recovery

- Add browser-vault records for `projects`, `project_sources`, and `project_routes`.
- Version and migrate the IndexedDB schema without losing existing source, lesson, plan, analysis, or repair records.
- Define deletion behavior for a source used by a project; block or visibly detach it rather than silently corrupting the route.
- Add clear-data and recovery coverage for project records.

**Exit:** a project and its approved route survive reload/restart on the same origin; source removal produces an explicit, recoverable result.

### 2. Project workspace and route UI

- Add project list, source membership, readiness/consent state, goal, time budget, route view, coverage/uncertainty disclosures, and “start step.”
- Keep the original Reader and source lesson library directly reachable.
- Show a repair as an explicit pending proposal and linked route element.
- Build keyboard, reduced-motion, and static alternatives alongside the route UI.

**Exit:** a learner can create, inspect, approve, reopen, and navigate an approved route without an agent.

### 3. Narrow WebMCP route tools

- Add read-only project context and project map summaries.
- Add proposal-only route creation/update with narrow schemas, bounded source references, expected revisions, clear side effects, and enough returned state for verification.
- Retain per-source consent and existing bounded source-read tools. Do not add a “read the whole project” endpoint.
- Keep learner-only approval for the route, permissions, material revisions, repairs, and deletion.

**Exit:** a compatible agent can propose a route from the visible project page, and a learner sees, approves, and starts it with no hidden state change.

### 4. Hero lesson and repair proof

- Freeze one open-license full technical source with rights evidence and a reviewed route.
- Create one polished route step using the existing typed lesson contract.
- Demonstrate exact evidence navigation, one contextual question, one application response, and one learner-approved repair proposal.
- Run an external-agent rehearsal using the supported desktop built-in browser and a supported site-tools model.

**Exit:** the demo tells a truthful Project → Route → Lesson → Evidence → Repair story in under three minutes.

### 5. Post-challenge expansions

- Typed multi-source lesson references and evidence-strength metadata.
- Project-map concepts, relations, explicit prerequisites, and conflict objects.
- Learner-approved external-evidence requests with separate retention/provenance.
- Additional source types: web pages, slides, code, transcripts, diagrams, and data.
- Optional explicit project linking; never a hidden global learner graph.

## Non-negotiable WebMCP and safety rules

- Register tools in top-level page JavaScript; preserve normal non-agent UI.
- Keep inputs narrow, side effects accurate, results verifiable, and application authorization/validation authoritative.
- Treat tool definitions, tool results, and source content as untrusted.
- Do not expose raw PDF bytes, arbitrary paths, full bundles, or executable agent output.
- Do not give the agent approval, permission, deletion, external-network, or policy authority.
- Do not infer understanding from route completion, display speed, or one immediate response.

## Validation gates

- storage migration, project deletion, and reload/restart recovery tests;
- route-schema, stale-write, source-membership, and permission-denial tests;
- source-by-source consent tests and bounded-result assertions;
- tool-registration lifecycle, description, and top-level-page tests;
- keyboard, reduced-motion, responsive, and screen-reader validation;
- deployed-origin privacy/network trace and compatible-agent rehearsal;
- a manually audited hero route with disclosed omissions and no known critical source fidelity errors.

