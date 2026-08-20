# Technical stack

**Status:** adopted for the local clean-PDF vertical slice; complex-document adapters remain evidence-gated  
**Reviewed:** 2026-08-19  
**Decision rule:** choose the smallest stack that preserves source fidelity, supports large local PDFs, and can run controlled learning experiments.

## Recommendation

Build PRISM as a local-first two-process web application:

```text
React + TypeScript + Vite
          │ local HTTP / generated API types
          ▼
Python + FastAPI + Pydantic
          │
          ├── pypdfium2 clean-PDF worker
          ├── deterministic frame/player logic
          ├── replaceable AI providers
          └── SQLite + content-addressed files
```

This is deliberately less elaborate than a production SaaS. It gives the browser a strong interactive canvas while keeping document, AI, and learning-science code in Python, where the relevant ecosystem is strongest.

## Stack by responsibility

| Responsibility | Proposed choice | Why it fits PRISM | Deferred alternative |
|---|---|---|---|
| Learner interface | React + TypeScript | Precise stateful playback, accessible controls, typed frame rendering | No framework change unless the player prototype exposes a concrete limitation |
| Frontend build | Vite | A lean client-only build with fast development and optimized static output; no server rendering is needed | Next.js is unnecessary while PRISM is a local application without public SEO pages |
| API and orchestration | Python + FastAPI + Pydantic | Typed contracts, automatic JSON Schema/OpenAPI, and direct access to document/ML tooling | A Rust service only if profiling later proves Python is the bottleneck |
| PDF structure | `pypdfium2` for the clean embedded-text and source-visual route | Small deterministic dependency, reusable document handles, page-level text/object regions, lazy bounded rendering, and a clear capability boundary | Add Docling behind a parser adapter for table-cell semantics, fragmented vector layouts, mixed pages, and OCR only after golden-corpus comparison |
| Source display | Inline browser PDF viewer for the first slice | Keeps exact original pages visible with no additional runtime dependency | Add PDF.js when region overlays and controlled rendering become the next measured requirement |
| Local persistence | SQLite in WAL mode | One durable local database for jobs, versions, learner state, events, and full-text search | PostgreSQL only when multi-user/server deployment actually exists |
| Search | SQLite FTS5 first | Enough for exact terms, definitions, code, and section search without a vector service | Local embeddings and a vector extension after a measured semantic-search need |
| Binary/artifact storage | Content-addressed files beside the database | Large PDFs, page images, and lesson packages do not belong in database blobs; hashes make caching and provenance explicit | Object storage only for a future synchronized product |
| Background work | One local worker plus a durable SQLite job table | Resumable imports without Redis, Celery, or a message broker | A real queue only after parallel workloads exceed one machine |
| Cloud AI | OpenAI Responses API behind a provider interface | Current vision-capable file/image input and strict structured outputs | Other providers must implement the same internal contracts and pass the same evals |
| Optional local AI | `llama.cpp` server behind the same provider interface | Lightweight Windows/CUDA support, quantized models, hybrid CPU/GPU inference, and schema-constrained JSON | Ollama/LM Studio may be convenient development adapters, not core dependencies |
| Packaging | Browser launch script first | Lowest complexity during research | Tauri only after the web/API workflow is stable and native packaging has user value |

Primary documentation: [Vite](https://vite.dev/guide/), [FastAPI](https://fastapi.tiangolo.com/features/), [SQLite WAL](https://www.sqlite.org/wal.html), [SQLite FTS5](https://www.sqlite.org/fts5.html), [`pypdfium2`](https://pypdfium2.readthedocs.io/), [Docling supported formats](https://github.com/docling-project/docling/blob/main/docs/usage/supported_formats.md), and [PDF.js](https://mozilla.github.io/pdf.js/getting_started/).

## Why not one all-TypeScript application?

The player itself belongs in TypeScript. PDF layout recovery, OCR, scientific-document processing, model evaluation, and research analysis fit Python better. Forcing those into a Node-only stack would either narrow capability or add subprocess wrappers around Python anyway.

The boundary stays small: JSON APIs for imports, lessons, playback events, learner state, and generation jobs. FastAPI exposes a checked-in OpenAPI schema; frontend model types are generated from that contract so the two sides do not drift.

## Why not a desktop shell now?

PRISM is a web interaction running locally. Opening a localhost URL is adequate for the mechanism prototype and makes browser testing straightforward. A native shell adds signing, updater, embedded-runtime, IPC, and packaging work before it improves learning.

Reconsider Tauri when at least one is true:

- a one-click installer is necessary for remote participants;
- offline model/process lifecycle needs a native supervisor;
- file associations or OS-level secure storage are required;
- the browser launch experience is a measured adoption problem.

## Repository shape after scaffolding

```text
prism/
  apps/
    web/                 # React player, source view, settings, reports
    api/                 # FastAPI, worker, policies, persistence
  schemas/               # generated, versioned JSON Schemas
  benchmarks/            # source manifest; local PDFs remain ignored
  docs/
  scripts/               # schema export and repository checks
```

API contract, recovery, parser, compiler, and synthetic golden-fixture tests currently live beside the API in `apps/api/tests/`. Add a root test hierarchy only when another runtime needs to consume the same fixtures.

Do not add a generic `packages/`, `services/`, or `shared/` directory until a real second consumer exists. Prefer feature-local code over premature layers.

## Persistence layout

The local data directory is separate from the repository:

```text
data/
  prism.sqlite3
  objects/sha256/<hash>           # immutable source bytes
  derived/<source-hash>/<version>/
    pages/
    extraction/
    lessons/
  exports/
```

The database stores identities, state, offsets, hashes, paths, and small JSON objects. Large source files and rendered page assets stay on disk. Database migrations are versioned and tested against a copied fixture database.

## Durable local jobs

PDF import and lesson generation are state machines, not fire-and-forget background functions.

```text
queued → running → succeeded
             ├── retryable_failure → queued
             ├── needs_review
             └── failed
```

Each stage records its input hash, implementation version, output hash, attempt, progress cursor, and error class. Restarting the application requeues abandoned work after checking whether its last artifact committed successfully.

FastAPI’s in-process background-task feature is useful for brief follow-up work, but full textbook imports should use the durable job table and worker. A browser closing must not corrupt or erase an import.

## Contract ownership

- Pydantic models own API request/response validation.
- Versioned lesson-package schemas are exported as JSON Schema and checked into `schemas/`.
- The frontend uses generated TypeScript types rather than retyping Python models.
- Provider-specific responses never cross into product code. An adapter converts them into PRISM claims, frames, diagram specs, and evidence records.
- All stored timestamps are UTC; display converts to the local timezone.

## Dependency policy

Start with the minimum direct dependencies required for one PDF-to-stream vertical slice. Every new dependency needs:

1. a named product capability;
2. an acceptable license and transitive-license review;
3. maintenance and security evidence;
4. a removal or replacement boundary;
5. a measured reason if a standard-library or existing dependency solution was insufficient.

Licensing matters. PDF.js is Apache-2.0. Docling code is MIT, but individual model and transitive dependency licenses still require inventory. PyMuPDF and PyMuPDF4LLM use AGPL or commercial licensing, so they should not become a default dependency in this private, potentially commercial project without an explicit licensing decision.

Docling versions before 2.91.0 are excluded because a 2026 security advisory identified unsafe archive/XML handling fixed in 2.91.0. PRISM should still allow-list PDF in the first importer, enforce resource limits, and isolate the parser process. See the [Docling advisory](https://github.com/docling-project/docling/security/advisories/GHSA-r3xg-rg9j-67fv).

## Version policy

Do not pin today’s framework versions in a design document and then forget them. At scaffolding time:

- record exact lockfiles and runtime versions;
- use a supported Python release and Node LTS compatible with the selected Vite release;
- lock the current minor for fast-moving frontend tooling;
- schedule dependency updates as small, tested changes;
- never auto-merge a parser, model, or PDF-renderer upgrade without running the golden PDF corpus.

## Explicitly rejected for v0

- microservices;
- Kubernetes, Docker as a user requirement, or cloud deployment infrastructure;
- Redis, Celery, Kafka, or a hosted queue;
- PostgreSQL;
- a vector database before semantic retrieval is measured;
- GraphQL;
- an ORM that hides the small local schema;
- a full design-system dependency before the core canvas exists;
- end-to-end agent frameworks for a deterministic document pipeline;
- fine-tuning before prompts, schemas, retrieval, and evals are strong.

## Adoption gate

The stack becomes accepted only after a thin vertical slice can:

1. import a representative born-digital computing PDF;
2. preserve page/region provenance;
3. produce a reviewed semantic-frame package;
4. play it with pause, step, rewind, context, and Source mode;
5. survive process interruption and resume;
6. export deterministic research events;
7. pass the repository quality gates in `docs/engineering/ENGINEERING_STANDARDS.md`.

### First-slice evidence

The stack cleared its engineering adoption gate on 2026-08-19 using the 489-page TCP benchmark and synthetic recovery fixtures. The implementation preserves source hashes and regions, resumes without duplicate page elements, invalidates stale parser artifacts, emits deterministic draft packages, plays them with learner control and inline Source mode, exports research events, and passes the repository quality command. The lesson remains `draft`; this evidence adopts the engineering stack, not the learning claim.
