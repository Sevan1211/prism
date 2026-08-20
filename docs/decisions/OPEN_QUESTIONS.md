# Open technical questions

**Last updated:** 2026-08-20

The owner discovery interview and initial implementation-policy interview are complete. Confirmed choices are recorded in `V0_DECISIONS.md`; the original question inventory and rationale remain in `OWNER_DISCOVERY_QUESTIONNAIRE.md`. This file now tracks only choices that can be resolved through implementation evidence or a later owner decision.

## Resolved on 2026-08-19

### Cloud boundary for private PDFs

- Use local processing by default.
- Require an explicit per-source “allow cloud transformation” choice that states which pages or spans may leave the device.
- Do not infer cloud permission from upload, indexing, or a blanket global preference.
- Keep local-only mode usable, even when generated representations are slower or lower quality.

### Full-book preparation depth

- Hash and preserve the file, parse and quality-check the complete structure, and build local search plus concept/section indexes after import.
- Deeply generate semantic frames only for the section the learner opens.
- Allow background refinement only within the learner's cost and privacy policy.

### First benchmark concepts

The first three passages are structurally different:

1. **Database transaction isolation** — definitions, anomalies, schedules, and exact conditions.
2. **TCP congestion control** — causal change over time and a state/feedback loop.
3. **Distributed consensus** — multi-node causality, failure cases, and prerequisite relations.

This set stress-tests precise definitions, dynamic processes, diagrams, and system reasoning. Algorithms, operating systems, Python, data engineering, cloud, and AI follow as corpus expansions rather than excluded topics.

## Open: optional local generative model

The current development machine has 31.4 GB RAM and an RTX 5070 Laptop GPU with 8 GB VRAM. It can run document models and small local language models comfortably. A model such as `gpt-oss-20b` can fit in system memory, but on this GPU it will require hybrid CPU/GPU execution and may be materially slower than a cloud model.

The recommended policy is to keep local generation optional until a benchmark compares latency, fidelity, structured-output success, and power use on representative sections. Local parsing and local storage do not depend on this decision.

## Next implementation gate

The scope freeze is complete. Before efficacy comparisons begin:

1. acquire and hash the transaction-isolation source, finalize its page window, and recheck rights for every selected benchmark version;
2. define the three passages' claims, concepts, and assessment blueprints;
3. freeze reviewed golden expectations for all three passages; the first TCP PDF-to-semantic-stream engineering slice is complete;
4. benchmark an optional local model only after the cloud/local interfaces and representative fixtures exist.

## Open: complex visual semantics

The native route now preserves source-faithful regions for detectable embedded images, vector figures, and captioned tables. The next parser gate is not “extract more screenshots”; it is to recover inspectable structure without pretending that pixels establish meaning:

- associate fragmented vector objects and cross-page captions without merging unrelated regions;
- recover table rows, columns, headers, and reading order in addition to the rendered source crop;
- preserve equations, symbol definitions, code indentation, and figure legends as typed elements;
- require reviewed accessible descriptions for uncaptioned visuals before anything can be marked reviewed or verified;
- measure false-positive and missed-visual rates on the frozen corpus before widening PDF compatibility claims.

Docling or another layout adapter should be introduced only if it beats the native route on those reviewed expectations at an acceptable memory/runtime cost.
