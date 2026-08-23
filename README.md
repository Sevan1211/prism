# PRISM

**Personalized Representation and Information Streaming for Meaning**

PRISM is a research-driven web project for turning source material into a paced, adaptive sequence of meaning-bearing representations: text, diagrams, images, equations, examples, and eventually animation.

The core idea is not conventional speed reading. PRISM aims to optimize **durable comprehension per unit of time** while preserving source fidelity and giving the learner control. Its distinctive interaction is a one-screen **semantic stream** that presents meaningful units, keeps enough context available for integration and repair, and changes pace or representation when evidence suggests understanding is at risk.

## Current status

This repository now contains the documentation foundation, an independently generated research-and-implementation dossier, its project-level integration review, a milestone implementation plan, and the first local PDF-to-semantic-stream vertical slice. The implementation is an engineering prototype, not evidence that PRISM improves learning. No performance claim should be treated as proven until it has passed the experiments described here.

Implemented in the current slice:

- streamed, content-addressed import of clean born-digital PDFs;
- resumable page indexing into SQLite with parser-version invalidation;
- body/front/back document-region classification that preserves navigation material for search while skipping it in playback;
- source spans and lazy, cached figure/table assets with one-based page numbers and normalized regions;
- deterministic, source-verbatim draft semantic frames with persistent source-visual state;
- a keyboard-accessible semantic-player prototype with pause, step, rewind, downward prior-frame context, a preliminary pacing control, reduced motion, and inline Source mode;
- append-only research events and versioned JSON export through the local API;
- local-only source policy with no upload-time blanket cloud permission;
- generated OpenAPI and TypeScript contracts plus locked Python and npm dependencies.

The slice has imported and visually checked the 489-page TCP benchmark textbook. It supports reliable embedded text plus lazy, source-faithful figure/table regions, and skips detected front/back matter during playback while preserving it for search and Source view. The reviewed next step is an enhanced static Source Reader and a manually authored transaction-isolation package for **Traceable Semantic Relay (TSR)**: Anchor → Advance → Integrate → Repair. TSR is an **Experimental** mechanism, not a validated learning method. OCR, table-cell/equation semantics, generated explanations or visuals, cloud AI, adaptive learning claims, and efficacy conclusions are not implemented or validated.

## Run locally on Windows

Prerequisites: Node.js 24 and Python 3.12-3.14.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".\apps\api[dev]"
npm install
npm run schema:api
```

Start the API and web app in separate PowerShell terminals:

```powershell
npm run dev:api
```

```powershell
npm run dev:web
```

Open `http://127.0.0.1:5173`. Local application data defaults to `%LOCALAPPDATA%\PRISM`; set `PRISM_DATA_DIR` to use an explicit location.

Run the complete repository gate with:

```powershell
npm run quality
```

## Repository map

- [`AGENTS.md`](AGENTS.md) — working rules for Codex and other contributors
- [`apps/api`](apps/api) — FastAPI importer, compiler, storage, events, and recovery tests
- [`apps/web`](apps/web) — React source library and semantic player
- [`schemas/openapi.json`](schemas/openapi.json) — generated API contract
- [`docs/00_PROJECT_BRIEF.md`](docs/00_PROJECT_BRIEF.md) — concise project thesis and boundaries
- [`docs/research/EVIDENCE_REVIEW.md`](docs/research/EVIDENCE_REVIEW.md) — research synthesis and design implications
- [`docs/research/DOSSIER_INTEGRATION_REVIEW.md`](docs/research/DOSSIER_INTEGRATION_REVIEW.md) — section-by-section audit of the imported GPT Pro dossier and adopted project deltas
- [`docs/research/dossiers/2026-08-21/PRISM_RESEARCH_AND_IMPLEMENTATION_DOSSIER.md`](docs/research/dossiers/2026-08-21/PRISM_RESEARCH_AND_IMPLEMENTATION_DOSSIER.md) — preserved Markdown research artifact; the companion HTML is stored beside it
- [`docs/research/SOURCE_LIBRARY.md`](docs/research/SOURCE_LIBRARY.md) — annotated primary and authoritative sources
- [`docs/research/RESEARCH_TO_PRODUCT_MAP.md`](docs/research/RESEARCH_TO_PRODUCT_MAP.md) — evidence-to-mechanism map and frontier research sequence
- [`docs/product/PRODUCT_SPEC.md`](docs/product/PRODUCT_SPEC.md) — proposed experience, modes, MVP, and requirements
- [`docs/architecture/SYSTEM_DESIGN.md`](docs/architecture/SYSTEM_DESIGN.md) — conceptual pipeline and data contracts
- [`docs/architecture/TECH_STACK.md`](docs/architecture/TECH_STACK.md) — adopted lean local-first implementation stack and deferred capabilities
- [`docs/architecture/PDF_PIPELINE.md`](docs/architecture/PDF_PIPELINE.md) — resumable full-textbook ingestion and fidelity gates
- [`docs/architecture/AI_STRATEGY.md`](docs/architecture/AI_STRATEGY.md) — hybrid local/cloud model roles, privacy, cost, and eval policy
- [`docs/engineering/ENGINEERING_STANDARDS.md`](docs/engineering/ENGINEERING_STANDARDS.md) — code hygiene, stale-code removal, performance, and release gates
- [`docs/engineering/IMPLEMENTATION_PLAN.md`](docs/engineering/IMPLEMENTATION_PLAN.md) — dependency-ordered milestones, contract slices, acceptance gates, and first issue sequence
- [`docs/experiments/VALIDATION_PLAN.md`](docs/experiments/VALIDATION_PLAN.md) — hypotheses, baselines, metrics, and gates
- [`docs/experiments/BENCHMARK_CORPUS.md`](docs/experiments/BENCHMARK_CORPUS.md) — open-license source selections and passage gates
- [`docs/decisions/OPEN_QUESTIONS.md`](docs/decisions/OPEN_QUESTIONS.md) — deferred choices and implementation-evidence gates
- [`docs/decisions/V0_DECISIONS.md`](docs/decisions/V0_DECISIONS.md) — confirmed product, research, data, and delivery decisions
- [`docs/decisions/OWNER_DISCOVERY_QUESTIONNAIRE.md`](docs/decisions/OWNER_DISCOVERY_QUESTIONNAIRE.md) — comprehensive owner-alignment questionnaire

## One-sentence thesis

PRISM should be a **representation compiler plus Source Reader/TSR player plus sparse learning loop**, not a word-flashing speed reader.

It remains a reading-centered learner product. Diagnostic checks are sparse evidence and repair mechanisms, not the main interface, and instructor/course-management features are intentionally excluded.

## Working north-star metric

First meet the selected standard for **retained, transferable understanding**; then minimize the time required to reach it. Words displayed per minute is never the governing metric.
