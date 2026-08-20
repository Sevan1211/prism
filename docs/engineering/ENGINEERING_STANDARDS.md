# Engineering standards

**Status:** required once implementation begins  
**Goal:** keep PRISM lean, explainable, reproducible, and safe to change.

## Operating principle

Optimization means reducing measured waste while preserving correctness, learning evidence, accessibility, and maintainability. It does not mean continually rewriting working code or choosing clever low-level code before profiling.

The preferred implementation is the smallest complete vertical slice. Every layer must justify itself through a current product contract, experiment, or safety boundary.

## Definition of done

A change is complete only when:

- the user-visible or research outcome is stated;
- tests cover the new behavior and important failure path;
- source/version/provenance contracts remain valid;
- accessibility behavior is included, not postponed;
- obsolete code, flags, schema fields, fixtures, and documentation made redundant by the change are removed in the same change;
- direct dependencies are still necessary and licensed appropriately;
- logs/events do not collect more learner or source data than required;
- relevant performance budgets are checked;
- local Markdown links and external citations remain valid;
- no contradictory product claim was introduced.

“Keep the old implementation just in case” is not an acceptable default. Version control is the recovery mechanism.

## Vertical-slice rule

Build in end-to-end slices:

1. one representative PDF fixture;
2. one canonical extraction path;
3. one reviewed semantic-frame package;
4. one accessible player flow;
5. one persisted learner/research event path;
6. one restart/recovery test.

Do not build generic plugin systems, provider marketplaces, distributed queues, or broad format abstractions ahead of a second proven implementation.

## Code organization rules

- Organize by product capability first: import, source, compile, lesson, player, learner, research.
- Keep provider/parser adapters at the boundary. Product logic consumes PRISM contracts only.
- Prefer pure functions for segmentation, pacing features, state transitions, and validators.
- Pass explicit dependencies; avoid process-wide mutable singletons.
- Do not place business logic in React components or route handlers.
- Do not add barrel files that hide imports or inflate frontend work.
- Generated schemas and API clients are clearly marked and recreated by one command; do not hand-edit them.
- A TODO must name an issue/decision and removal condition. Unowned TODOs are defects.

## Stale-code control

Every implementation change includes a stale-code pass:

1. search for replaced names, flags, routes, schema fields, and configuration;
2. remove unused exports/imports and unreachable branches;
3. remove obsolete migrations only when the supported upgrade contract permits it;
4. delete unused dependencies from both manifest and lockfile;
5. update or delete stale fixtures and snapshots;
6. search documentation for old terminology or behavior;
7. run a dead-code/dependency scan appropriate to each language.

Candidate automation at scaffolding time:

- TypeScript: compiler no-emit check, ESLint, and a focused unused-file/export/dependency scanner such as Knip;
- Python: Ruff, a strict type checker, tests, and dependency/dead-code checks such as Deptry/Vulture after false-positive baselines are reviewed;
- repository: secret scan, lockfile audit, Markdown link check, and `git diff --check`.

Tool choice is not the standard; a clean result with reviewed exclusions is.

## Testing pyramid

### Contract and unit tests

- canonical identifiers and source spans;
- parser-to-PRISM normalization;
- semantic segmentation constraints;
- pacing feature calculation;
- player state transitions;
- learner evidence transitions;
- schema migrations;
- cloud budget and consent enforcement.

### Golden document tests

- reviewed page elements, reading order, regions, captions, tables, equations, and code;
- visual overlay snapshots for parser upgrades;
- interruption/resume and partial-failure behavior;
- deterministic derived hashes.

### AI evaluation tests

- frozen requests and reviewed expected constraints rather than brittle exact prose;
- source citation validity;
- essential-claim coverage;
- qualifier/negation preservation;
- unsupported relation and contradiction rates;
- schema/retry/cost/latency metrics;
- model/provider change comparison before promotion.

AI evals do not run implicitly against paid services during every local test. A recorded offline set is the default; an explicitly invoked, budgeted suite validates live providers.

### Player integration tests

- keyboard-complete pause, continue, step, rewind, Source, and speed/depth controls;
- focus loss and interruption recovery;
- reduced-motion/static equivalence;
- screen-reader names, roles, states, and announcements;
- no irrecoverable auto-advance;
- event order and active-time accounting.

### End-to-end recovery tests

- application closes during PDF upload;
- parser dies mid-window;
- database commit succeeds but artifact rename fails, and vice versa;
- cloud request times out or returns a schema-valid but unsupported claim;
- model/file deletion reconciliation fails;
- migration is interrupted;
- disk fills or monthly cloud budget is reached.

## Performance budgets

Establish baselines with the first vertical slice and fail regressions relative to representative fixtures. Required measurements include:

- time to Source ready, Search ready, and first Section ready;
- pages processed per minute by PDF class;
- peak RAM, VRAM, temporary disk, and final derived storage;
- resume time after interruption;
- player input latency and missed animation frames;
- frontend JavaScript/CSS bundle size by route;
- local-model tokens per second and structured-output retry rate;
- cloud cost per successfully accepted section, not per raw request;
- database query latency as book/event history grows.

Initial interaction gate: playback controls must respond within the next visual frame under normal desktop load, and document processing must never block the UI thread. Concrete numeric budgets are frozen after measurement on the development machine rather than invented in advance.

## Optimization workflow

1. capture a representative trace or benchmark;
2. name the bottleneck and user impact;
3. change one dominant cause;
4. compare correctness, latency, memory, cost, and complexity;
5. keep the optimization only when the tradeoff is favorable;
6. document a surprising architectural decision in a short ADR.

Do not accept microbenchmarks that bypass PDF fidelity, player behavior, or real section size. Cache only immutable or version-keyed work, and test cache invalidation.

## Dependency and security hygiene

- Use lockfiles and reproducible installs.
- Keep parser/model packages allow-listed and versioned.
- Inventory licenses for code, model weights, fonts, icons, and test PDFs.
- Run untrusted document parsing in a restricted child process with resource limits.
- Never log source text, learner answers, API keys, or file passwords by default.
- Keep secrets outside the repository and browser bundle.
- Bind the local API to loopback by default and use an unguessable per-launch token if browser-origin threats require it.
- Validate file type from content, not extension alone.
- Preserve a recoverable backup before local database migrations.
- Patch known security advisories promptly, but run golden parser tests before promotion.

## Data and schema discipline

- Immutable source and versioned derived artifacts; no silent in-place rewriting.
- Append-only research events with schema version and session/package identity.
- Derived progress views are rebuildable from canonical data.
- Experimental parameters are versioned and exported with results.
- Migrations are forward-tested on the oldest supported fixture and restore-tested from backup.
- Deletion removes or tombstones all referenced source, learner, provider, and derived artifacts according to a documented policy.

## Feature flags and experiments

A feature flag must have:

- owner;
- hypothesis;
- default;
- eligibility/consent condition;
- event/evaluation plan;
- expiry or promotion/removal gate.

Expired flags and both dead branches are removed. Experimental output never receives a verified badge merely because its flag is enabled.

## Review checklist for AI-written code

- Does the code implement a documented contract rather than inferred scope?
- Is every file and abstraction necessary for the current slice?
- Are failure and recovery paths real, not comments?
- Are types and schemas specific enough to reject invalid state?
- Did generated code add a dependency, telemetry, network call, or persistence field without a decision?
- Are source fidelity, cloud consent, accessibility, and budgets enforced in code?
- Was copied boilerplate removed?
- Can a future maintainer identify the governing test and document?

AI output is reviewed as untrusted contribution, just like AI-generated learning content.

## Merge/release gate

At minimum, implementation changes must pass:

```text
format
lint
typecheck
unit/contract tests
golden fixture tests when parsing changes
AI eval comparison when model/prompt/schema changes
frontend build
accessibility smoke test when UI changes
Markdown links
dependency/license/security checks
working-tree whitespace check
```

Release additionally requires recovery tests, a clean install on Windows, no unresolved high-severity dependency finding, no known source-fidelity regression, and a readable record of experimental configuration.

## Periodic pruning gate

At each milestone:

- list largest dependencies and derived artifacts;
- list slowest tests/import stages and largest frontend chunks;
- list flags, TODOs, adapters, and migrations nearing expiry;
- compare implemented features with the current product scope;
- delete or quarantine anything with no active user/research value;
- update the architecture only after the code and evidence justify it.

This is maintenance work with acceptance evidence, not an open-ended rewrite cycle.
