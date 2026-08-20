# AI strategy: local-first, hybrid, and evidence-gated

**Status:** proposed  
**Reviewed:** 2026-08-19  
**Budget:** no more than $25/month in v0 without a new owner decision

## Position

PRISM should use AI where semantic judgment adds value, but the product must not become an opaque prompt wrapper. Parsing, provenance, pacing limits, state transitions, storage, rendering, accessibility constraints, and research measurement remain deterministic software.

The recommended design is hybrid:

- **always local:** source storage, PDF parsing, page images, rights metadata, learner profile, events, lesson playback, source inspection, deterministic segmentation features, and validation state;
- **local by default:** search, retrieval, basic structure, simple diagram rendering, and rule-based adaptation;
- **optional local model:** draft claim extraction, classification, section summaries, and low-risk frame proposals;
- **approved cloud model:** difficult source-grounded planning, diagram interpretation, ambiguity adjudication, and quality review on the minimum necessary spans/pages.

Local and cloud providers implement the same internal task contracts. A lesson package does not care which provider produced a candidate.

## AI is a set of compiler passes

Do not ask one model to “turn this chapter into the best lesson.” Use bounded passes with typed inputs and outputs:

1. **Element classification** — label definitions, claims, examples, warnings, equations, figures, and exercises.
2. **Claim extraction** — produce atomic propositions with exact source element/span identifiers and preserved qualifiers.
3. **Concept/relation mapping** — propose explicit and inferred edges separately.
4. **Prerequisite analysis** — identify concepts required to understand the current unit and cite evidence or label the relation as a PRISM inference.
5. **Frame planning** — group claims into coherent instructional units without changing truth conditions.
6. **Representation proposal** — select text, source visual, table, equation, code trace, or a typed diagram specification.
7. **Practice draft** — create sparse diagnostic items tied to claims and a repair path.
8. **Fidelity review** — check omissions, contradictions, unsupported relations, answerability, and accessibility metadata.

Each pass can be rerun, compared, cached, or replaced independently.

## Tasks AI must not own

| Deterministic responsibility | Reason |
|---|---|
| Source hashes, page numbers, offsets, and bounding boxes | A model may cite identifiers but cannot invent them |
| PDF capability status | Unsupported extraction must fail visibly |
| Minimum dwell and flash/motion limits | Safety constraints are policy, not suggestions |
| Player state transitions | Reproducible experiments require deterministic behavior |
| Learner evidence state | Exposure, recall, inference, transfer, and retention have explicit rules |
| Final verification status | A generator cannot certify itself |
| Research randomization and scoring versions | Experimental integrity requires frozen instruments |
| Cloud-consent decisions | Source privacy belongs to the learner |

Models produce candidates and evidence records. Product code decides whether those candidates are admissible.

## Cloud model tiers

The current OpenAI GPT-5.6 family documents three general tiers: `gpt-5.6-sol` for flagship capability, `gpt-5.6-terra` for strong performance at lower cost, and `gpt-5.6-luna` for efficient high-volume work. Model availability, price, and behavior are time-sensitive and must be rechecked at implementation. [Current model guidance](https://developers.openai.com/api/docs/guides/latest-model) and [pricing](https://developers.openai.com/api/docs/pricing).

The initial eval should test roles, not assume a permanent model:

| Workload | First candidate | Escalation rule |
|---|---|---|
| Repetitive section element/claim drafts | `gpt-5.6-luna` | Escalate examples that fail schema/fidelity checks |
| Complex relation and representation planning | `gpt-5.6-terra` | Escalate only unresolved, high-value ambiguity |
| Adjudicating a small number of difficult pages | `gpt-5.6-sol` | Never apply across an entire book by default |

This routing is **Experimental** until PRISM’s own golden corpus shows the lower tier is noninferior for each task. A cheaper model that needs many repairs may cost more and produce worse lessons.

Use the Responses API with strict JSON Schema output. OpenAI’s Structured Outputs feature can constrain model responses to a supplied schema, but schema validity does not prove source fidelity. [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## Local model strategy

The development machine has:

- Intel Core Ultra 9 275HX, 24 logical processors;
- 31.4 GB RAM;
- NVIDIA RTX 5070 Laptop GPU with 8 GB VRAM.

That is strong for local document models, embeddings, reranking, and smaller quantized language models. It is not enough to assume that a frontier multimodal model can process a full textbook interactively.

### Optional initial candidate

`gpt-oss-20b` is a text-only open-weight candidate with a 128k context window and an Apache-2.0 license. OpenAI documents a roughly 12.8 GiB checkpoint and operation on systems with about 16 GB of memory. [Model announcement and architecture](https://openai.com/index/introducing-gpt-oss/) and [model page](https://developers.openai.com/api/docs/models/gpt-oss-20b).

On this laptop it can fit in system memory, but 8 GB VRAM means hybrid CPU/GPU execution. Treat latency, thermal behavior, power draw, and JSON reliability as unknown until measured. It should be optional, not a requirement for the first player.

`llama.cpp` is the recommended local adapter because it supports Windows, CUDA, quantization, CPU/GPU hybrid inference, an HTTP server, and schema-constrained JSON without adding a larger platform. [llama.cpp](https://github.com/ggml-org/llama.cpp).

### What local generation is good for first

- privacy-sensitive draft summaries and claim candidates;
- content labels and representation eligibility;
- repair suggestions that remain visibly draft;
- offline regeneration and comparison experiments;
- background work where seconds-per-output is acceptable.

### What remains cloud-preferred initially

- interpreting a visually dense page or unfamiliar diagram;
- cross-checking subtle qualifiers across distant passages;
- generating and adjudicating high-value transfer items;
- resolving conflicts between parser output and page image;
- producing a reviewed-quality lesson candidate with the fewest repair cycles.

Local output passes exactly the same provenance and fidelity gates. “Private” is not the same as “correct.”

## Evidence packet for every model call

A generation request contains:

```yaml
task:
  kind: claim_extract_v1
  task_schema_version: 1
source:
  source_hash: string
  section_ids: [string]
  elements:
    - element_id: string
      page: integer
      text: string
      bbox: [number, number, number, number]
  page_images: []        # present only when required and approved
constraints:
  allowed_claim_status: [explicit, inferred, added_explanation]
  required_citations: true
  outside_knowledge: forbidden
learner_context:
  prior_concepts: []     # no identity or unrelated history
```

The response must include cited source identifiers, status, uncertainty, and omitted/unsupported elements. Raw chain-of-thought is never required or stored. PRISM stores concise reason codes and verifiable evidence.

## Generation acceptance pipeline

```text
schema validation
    ↓
identifier/span existence
    ↓
coverage and qualifier checks
    ↓
entailment / contradiction review
    ↓
relation and diagram validation
    ↓
accessibility validation
    ↓
draft | needs_review | blocked
```

No single model verdict makes an artifact `verified`. Independent deterministic checks, a differently configured review pass, and human review can all contribute, but disagreement remains visible.

### Specific rejection rules

Reject or block a candidate that:

- cites a nonexistent or wrong-page span;
- drops a negation, exception, scope condition, unit, or qualifier;
- converts correlation into causation;
- joins two source claims without marking the inference;
- changes code behavior, equation symbols, or table headers;
- creates a diagram arrow without an explicit or labeled inferred relation;
- creates an unanswerable check or leaks the answer before the learner responds;
- introduces outside facts without a separate source.

## Representation generation

Models produce typed representation specifications, not executable UI code.

```yaml
diagram_spec:
  type: causal_graph
  nodes:
    - id: congestion_window
      label: Congestion window
      source_claim_ids: [claim_12]
  edges:
    - from: packet_loss
      to: congestion_window
      relation: decreases
      status: explicit
      source_claim_ids: [claim_14]
```

The local renderer turns this into accessible SVG with stable visual grammar. This is easier to inspect, diff, test, and repair than generated bitmap art. Source figures remain available when simplification would lose information.

## Runtime personalization

Do not place an LLM in the frame-by-frame playback loop. The initial player uses a deterministic, versioned policy over:

- goal and Faster ↔ Deeper position;
- content difficulty features;
- prior knowledge;
- correctness, confidence, latency, rewinds, and pauses;
- accessibility constraints;
- recent and delayed outcomes.

AI may prepare representation alternatives before playback. A learned sequencing policy becomes reasonable only after enough consented delayed-outcome data exist and it beats the transparent rule policy.

## Cost controls

Every request records estimated and actual input/output units, model, service tier, cache use, and task identity. The worker enforces:

- a hard monthly limit and a lower warning threshold;
- a per-source estimate before cloud transformation;
- content-hash and task-version caches;
- section-on-demand generation rather than full-book generation;
- no automatic retry after a non-transient fidelity failure;
- maximum escalation counts;
- an owner-visible cost report.

OpenAI currently offers asynchronous Batch processing at discounted token rates, but batch files and outputs have different persistence behavior and must be deleted explicitly. Use Batch only for public/open or explicitly approved source material, and only when the learner does not need immediate output. [Batch API](https://developers.openai.com/api/reference/resources/batches) and [data controls](https://developers.openai.com/api/docs/guides/your-data).

## Privacy controls

OpenAI states that API data is not used to train its models unless the customer opts in, while default abuse-monitoring logs may retain content for up to 30 days and some endpoints store application state. PRISM must show this distinction rather than reducing privacy to “not used for training.” [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

### Confirmed source-consent contract

- Every imported private source starts with `cloud_policy: local_only`.
- Uploading, hashing, parsing, indexing, searching, or opening a source does not change that policy.
- Before a cloud task, the learner must approve that individual source and see the exact spans or page regions proposed for transmission, the task, and the provider.
- Approval is bound to the source hash and recorded in the local audit log. Replacing the file creates a new source that requires a new decision.
- PRISM does not offer a blanket global setting that silently authorizes all present or future private sources.
- Revoking approval blocks new requests. Any provider-side object already created remains tracked until its expiry or deletion is reconciled.

Default request policy:

- `store: false` where supported;
- send extracted spans rather than the complete file;
- crop a page image to the necessary region when spatial context permits;
- never send learner notes, answers, history, or identity unless the task explicitly requires the minimum subset;
- do not use provider-hosted vector stores for v0;
- attach expiry/deletion reconciliation to any uploaded provider file;
- preserve a local audit of what content left the device.

## Model evaluation before adoption

Build a frozen evaluation set from the first three passages plus adversarial fixtures. For each provider/model/configuration record:

- claim precision and essential-claim recall;
- qualifier/negation preservation;
- source-span validity;
- contradiction and unsupported-inference rate;
- diagram-edge validity;
- question answerability and leakage;
- schema success and retry rate;
- latency, local peak RAM/VRAM, and cloud cost;
- reviewer repair time;
- sensitivity to context order and irrelevant pages.

Choose the lowest-cost configuration that clears every fidelity threshold. Re-run this suite before model aliases, prompts, parsers, or schemas change.

## Research labels

- **Established engineering practice:** typed schemas, bounded inputs, caching, provenance, independent evaluation, and least-data cloud requests reduce avoidable failure and cost.
- **Promising:** hierarchical section retrieval plus multimodal page evidence should be more reliable and efficient than sending a whole textbook.
- **Experimental:** automatic representation choice and model-tier routing improve learning outcomes, not merely output quality.
- **Speculative:** a learned multimodal policy can consistently select the fastest representation that preserves each learner’s durable understanding.
