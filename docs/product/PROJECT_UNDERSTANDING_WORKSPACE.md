# PRISM project understanding workspace

**Status:** owner-direction contract recorded 2026-08-31  
**Purpose:** product model and delivery boundary for PRISM as an adaptive understanding workspace  
**Related:** [`../00_PROJECT_BRIEF.md`](../00_PROJECT_BRIEF.md), [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md), [`INTERACTIVE_LESSON_SPEC.md`](INTERACTIVE_LESSON_SPEC.md), [`../architecture/WEBMCP_INTEGRATION.md`](../architecture/WEBMCP_INTEGRATION.md), [`../engineering/PROJECT_ROUTE_ROADMAP.md`](../engineering/PROJECT_ROUTE_ROADMAP.md)

## Product promise

> PRISM helps a person build a correct, usable mental model from dense technical sources by proposing the fastest source-accountable route to a stated goal, then seeking evidence of understanding and offering learner-approved repairs.

PRISM does not promise that every fifty-page chapter, paper, or source bundle can be fully understood in twenty minutes. It makes the time-versus-coverage tradeoff visible, preserves the source, and warns when the selected goal cannot be supported responsibly in the available time.

The primary value is **conceptual continuity**. A person should not have to repeatedly restate their goal, reread disconnected excerpts, or guess which prerequisite makes a later section incomprehensible. PRISM retains a project-local, inspectable route from source evidence to a usable mental model.

## The problem

Dense textbooks, technical documentation, and research papers often depend on earlier concepts, introduce qualifications gradually, and distribute a mechanism across prose, figures, equations, examples, and references. A conventional PDF reader preserves the source but does not explain dependency, relevance, or misunderstanding. An ordinary agent conversation can explain a local concept, but it does not reliably show coverage, preserve an inspectable teaching artifact, maintain project-level continuity, or turn a later misunderstanding into a source-grounded repair.

PRISM is not a generic summary tool, chat-with-PDF interface, flashcard site, or course-management product. A course is one possible route shape; the underlying product serves any dense source collection that a person needs to understand well enough to explain, apply, evaluate, implement, decide, or diagnose.

## Product model

```text
Project
  ├── Sources
  ├── Project map
  ├── Approved learning route
  │     └── Interactive lessons
  └── Understanding evidence and approved repairs
```

### Project

A **Project** is a private, goal-bound workspace. It contains a selected collection of sources, a stated outcome, time and depth preferences, a project-local understanding map, learner notes and hypotheses, route history, and learner-approved repairs.

Projects do not silently contribute to a universal personal knowledge graph. Future cross-project connections require a separate, visible learner decision.

### Sources

Each **Source** is an immutable original with its own fingerprint, rights status, access policy, provenance anchors, and extraction-confidence record. A textbook is one source; a research or documentation project may contain several. The original remains available through the Source Reader regardless of whether transformation succeeds.

Agent access is separately consented for every personal or unknown-rights source. Neither project membership nor one source grant authorizes access to another source.

### Project map

The **Project map** is a navigable, explicitly uncertain representation of the selected sources. It may show source structure, candidate concepts, prerequisites, claims, evidence, unresolved regions, and source conflicts. It is not a claim of perfect semantic understanding or an authoritative replacement for the source.

When sources conflict, PRISM first displays the disagreement and its respective evidence. It may ask the learner to clarify the goal. A bounded external-evidence request is possible only after visible learner approval; outside material is separately sourced and never silently blended with project-source claims.

### Learning route

A **Learning route** is a learner-approved, time-bounded sequence through the project map. It discloses objectives, prerequisite assumptions, route steps, source anchors, coverage, omissions, uncertainty, and an expected active time. Its purpose is not to cover every sentence; it is to cover the material necessary for the learner's stated goal without hiding important qualifications or dependencies.

For the initial implementation, each route step names one primary source and one bounded range. This keeps evidence and consent honest while a later multi-source composition contract is designed and measured.

### Interactive lesson

An **Interactive lesson** is a coherent, saved segment of a route. It retains the existing lesson contract: detailed source-grounded prose, purposeful representations, exact evidence controls, end-of-lesson explanation/application evidence, and local versions. It is not an automatically generated chat transcript or slide deck.

### Understanding evidence and repair

Instruction comes before sparse checks. The learner may ask contextual questions and complete explanation or application tasks. Immediate evidence is classified with uncertainty; it never proves durable mastery. When a particular missing assumption or misconception remains, the agent may propose a named repair with rationale and scope. The learner must approve every durable repair or material lesson revision.

## Core experience

1. The learner creates a project such as “Understand this textbook well enough to implement the protocol” or “Evaluate this paper set for an experiment.”
2. They add one full document or a selected source collection that stays local by default.
3. The agent inspects only consented, bounded evidence and proposes a project map and learning route, rather than a generic summary.
4. The learner reviews the route's coverage, prerequisites, omissions, uncertainty, and time tradeoff, then approves it.
5. Starting a route step opens the existing source-grounded lesson flow for that source range.
6. The learner explores the lesson, opens exact evidence, and asks questions in context.
7. End evidence identifies a specific gap when possible. The agent proposes a focused repair; the learner accepts or dismisses it.
8. The project retains the route, sources, lessons, evidence, and approved repairs for later return without claiming cross-project inference.

## Why PRISM is distinct

| Alternative | What it does well | What PRISM adds |
|---|---|---|
| PDF reader | faithful source access and reader control | goal-aware coverage, prerequisite routing, adaptable representations, and evidence-linked repair without losing the source |
| Ordinary agent chat | concise local explanation and question answering | durable project state, inspectable route/omission decisions, exact source grounding, and a learner-approved revision workflow |
| Course generator | a preset sequence of lessons | source-bound routes for a learner's actual goal, documentation, papers, textbook, or later source bundle |

WebMCP is justified because the learner and agent operate on the same live project, source, route, lesson, and evidence state. The agent does not need a separate server-side integration or a hidden copy of the learner's work. It uses focused site tools to inspect and propose changes the learner can see and approve.

## Trust, privacy, and control

- Original source content is authoritative; PRISM paraphrases, reconstructions, inferences, analogies, learner notes, and external evidence are visibly distinct.
- Private source bytes, derived state, lessons, and answer analyses remain local by default. Project creation is not consent to disclose source content to an agent.
- All source reads stay bounded. No route or map tool may dump a whole textbook or source bundle into a model context.
- A source can contain prompt-like or misleading text. Source material is evidence, not instruction, and cannot authorize disclosure, policy changes, permissions, deletion, or mutation.
- The agent can propose but cannot approve plans, repairs, material revisions, permissions, deletion, or external enrichment.
- PRISM remains usable as a Reader and lesson viewer when site tools are unavailable.

## Delivery boundary

The challenge hero should demonstrate one whole open-license technical textbook as a project: a transparent route through the book, one excellent source-bound interactive lesson, exact evidence navigation, and a learner-approved repair. This proves the broader “dense source collection to trustworthy path” thesis without claiming that multi-source synthesis, conflict resolution, or universal parsing already exists.

The post-challenge product may expand to project bundles, typed multi-source evidence, conflict objects, and additional source formats. Each expansion must preserve per-source consent, provenance, recoverability, accessibility, and the learner's approval boundary.

## Open implementation choices

1. Ship the first multi-source project immediately after the challenge, or initially limit projects to one full textbook/document while measuring cross-source contracts.
2. Decide the smallest project-map vocabulary that can be truthful from existing PDF.js extraction: source outline, route candidates, prerequisites, and warnings precede an automatic semantic knowledge graph.
3. Define visible proposal-and-accept handling for material revisions to an existing lesson draft.
4. Specify lifecycle behavior when a source is removed from a project: block deletion, detach dependent route steps, or require a replacement source.

