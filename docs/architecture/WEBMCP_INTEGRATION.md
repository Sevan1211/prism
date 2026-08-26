# WebMCP integration: the instrument hands the agent its evidence

**Status:** adopted direction (owner decision 2026-08-26); every learning-effect claim in this document is **Experimental**  
**Reviewed:** 2026-08-26  
**External deadline:** OpenAI WebMCP Challenge submission, 2026-09-03 13:00 PDT  
**Related:** [`../product/PRODUCT_SPEC.md`](../product/PRODUCT_SPEC.md), [`../product/READER_SPEC.md`](../product/READER_SPEC.md), [`AI_STRATEGY.md`](AI_STRATEGY.md), [`../research/EVIDENCE_REVIEW.md`](../research/EVIDENCE_REVIEW.md)

## What WebMCP is

WebMCP is a W3C Web Machine Learning Community Group draft (announced 2026-02-10; draft report 2026-07-21, edited by Google and Microsoft) that lets a web page register JavaScript tools — name, description, JSON Schema input, async `execute` callback — that browser-hosted agents can discover and invoke. The page keeps its own session, validation, and UI; the agent gets a typed contract instead of scraping the DOM.

Current support: Chrome ships an origin trial (149–156) plus a testing flag; the ChatGPT desktop app's built-in browser, ChatGPT Sites, and Codex support it natively as "Site tools"; Edge is behind a flag; Gemini-in-Chrome is announced as Google's first consumer. The API surface is `document.modelContext` (with a `navigator.modelContext` fallback that Chrome 150 deprecates). Adoption is near zero, which is the opportunity.

```javascript
const ctx = document.modelContext ?? navigator.modelContext
await ctx?.registerTool({
  name: 'get_frame_evidence',
  description: 'Exact source spans backing the current semantic frame',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  annotations: { readOnlyHint: true },
  async execute() { /* returns claim + spans from the player store */ },
}, { signal: lessonAbortController.signal })
```

## Design thesis

Generic agent browsing makes AI *less* accountable: it summarizes content it half-read. PRISM's WebMCP surface is designed to make a connected agent *more* accountable than it is anywhere else, because every content-bearing tool returns hash-validated, source-verbatim spans with page and region provenance — the same receipts the human sees. The agent tutoring the learner can only cite, never invent. This is AGENTS.md principle 9 ("AI output is untrusted until checked") turned into an interface: the checking substrate is the API.

PRISM itself ships no model. The learner brings whatever agent lives in their browser; PRISM defines what that agent may see and do. The M5 provider boundary in the implementation plan is unrelated: it governs models PRISM invokes, while this document governs agents the learner invokes.

## Tool rings

Registered per surface, unregistered on exit via `AbortSignal`. Ring 1 and Ring 2 tools carry `readOnlyHint`.

| Ring | Tool | Contract |
|---|---|---|
| 1 · Navigate | `list_sources`, `get_readiness` | Library contents, trusted-page evidence, recommended ranges |
| 1 | `open_lesson`, `goto_frame`, `set_mode`, `set_pace` | Drive the player the learner is watching; identical guardrails to the UI (no autoplay on high-inspection frames, bundle receipts shown) |
| 1 | `open_source_page` | Open the Reader at an exact page — learner control and the source path stay primary |
| 2 · Evidence | `get_current_frame`, `get_frame_evidence` | Claim text plus exact spans (element id, page, region, offsets, verbatim text) and verification status |
| 2 | `search_source` | FTS5 search over the indexed book returning spans, not prose (the Reader's search endpoint) |
| 2 | `describe_visual` | The active figure/table's accessible text, caption, page, and provenance |
| 3 · Tutor | `get_study_prompt`, `submit_explanation` | The learner's free-recall attempt is recorded as a `study_submitted` research event; the tool response then, and only then, includes the exact source span for comparison |
| 3 | `suggest_repair` | Agent proposes returning to a prerequisite frame; the player offers, never forces, the jump (TSR's Repair step, mediated) |
| 3 | `get_session_evidence` | Exposure summary from the append-only event log, labeled as exposure |

## Guarded tutoring is the point, not a limitation

2025–2026 tutoring trials are consistent: structured programs with pedagogical guardrails produced large gains, while unrestricted assistant access improved in-the-moment performance and *reduced* later unassisted performance. PRISM's tool surface encodes the guardrail structurally:

- `submit_explanation` requires a non-empty attempt before any comparison material is returned — attempt-before-assistance is enforced by the API shape, not by prompt suggestions;
- content tools return source-verbatim spans, so agent feedback is anchored to inspectable evidence;
- every agent invocation of a Ring 3 tool is logged as an `agent_*` research event beside the learner's own events, which makes human-plus-agent co-study a measurable future experiment arm rather than an unexamined feature;
- no tool can mark anything learned, verified, or complete; verification vocabulary stays owned by the deterministic compiler and future review states.

The learning-effect framing ("agent co-study helps") is **Experimental** and earns claims only through the validation plan's delayed-outcome machinery.

## Rights-gated exposure

Tool results flow to the agent vendor's servers. Agent exposure is therefore a per-source policy in the same family as `rights_status` and `cloud_policy`:

- `public_domain` and `open_license` sources expose tools by default;
- `private_authorized` and `unknown` sources register **no content-bearing tools** unless the learner explicitly enables agent access for that source; navigation metadata (titles, readiness) may remain;
- the consent is per source, revocable, and recorded — importing or reading a source never implies agent exposure, mirroring the existing cloud-consent rule.

## Security rules

- Agent-supplied tool arguments are untrusted input: schema-validated, length-capped, and never interpolated into SQL, paths, or shell;
- content responses are size-capped; tools never return raw PDF bytes;
- no tool mutates rights, policies, deletion state, or research data (Ring 3 appends learner-visible events only);
- registration happens only on surfaces the learner opened; closing the lesson or reader aborts every registration;
- the feature detects `document.modelContext ?? navigator.modelContext` and degrades to nothing — no polyfill that fakes agent presence.

## Engineering prerequisite

Player state (current frame, mode, bundle, playing) is currently component-local React state. Tools need to read and drive it from outside the component tree, so the WebMCP work begins by lifting player state into a small store with an imperative controller — the same refactor the research-instrumentation gaps need. Tool handlers call the existing typed API client and the store; no parallel data path.

## Hackathon deliverable (2026-09-03)

- Local-first build finished first; the hosted demo is deployed from it near the deadline (Render API + Cloudflare Pages web) with open-licensed corpus sources preloaded (CC BY / CC BY-SA only);
- Demo uploads are allowed under the transient-processing model: the server parses and compiles in memory with reduced size/page/timeout caps and rate limiting, persists nothing, and the visitor's browser stores sources, indexes, and lessons locally (IndexedDB/OPFS) — "processed in memory, stored only on your device";
- required artifacts: live URL usable in ChatGPT's built-in browser or Chrome with WebMCP enabled, public repository under Apache-2.0, sub-3-minute video, and a write-up centered on the grounded-evidence thesis and the guarded-tutoring design;
- submission language obeys the product-writing rules: no learning-efficacy claims, TSR labeled Experimental, draft packages labeled draft.
