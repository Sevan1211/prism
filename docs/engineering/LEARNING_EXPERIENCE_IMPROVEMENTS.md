# Reading quality and learning trial

**Owner contract:** 2026-09-04. Implement the six audit improvements, use RLM and
Physical Geology as reference sources, preserve substantive content by default,
choose the reading design through implementation judgment, optimize the owner's
workflow while supporting newcomers, and prepare an owner learning trial.

## Product contract

Default lessons retain substantive definitions, reasoning, examples, qualifications,
relevant figures and conceptual connections within the approved scope. Word count
and reading-time targets remain soft. An overview is a proposal to shorten scope,
not permission to silently remove essential material. New briefs persist
`coverage_expectation: preserve_substance`; old briefs remain readable.

The visual direction extends the existing reading instrument: continuous prose,
quiet typography, an outline, and passage-local help. The selected passage and exact
lesson version travel in the copied request. Source text is labeled as quoted
content; it cannot authorize actions. Manual copying works if clipboard access fails.
Substantive edits still require the learner's review and acceptance.

## Inspectable content review

`coverage_review` is an additive field on a lesson document. Each entry names a
concept, source element IDs, lesson block IDs, and the details retained by those
passages. Finalization requires coverage of every planned retained evidence anchor
and every composed block. References must resolve to actual planned evidence cited
by the mapped blocks. Input limits and pagination bound transport.

This validates a review's structure and reference integrity. It does not prove
that a paraphrase is true, that a qualifier survived, or that a learner understands.
The UI separates structural checks, the agent's attributable review, and learner
judgment. It discloses compressed, omitted, deferred and source-only material.

Changes to a mapped block invalidate its old review. A revision proposal supplies
a complete updated map and is validated against its candidate document. Acceptance
stores the candidate and review in the same versioned transaction. Old lessons
without a map remain readable and recoverable; their next agent revision must
supply one. No database-version migration or forced source reimport is needed.

## Latency and recovery

**Owner priority — 2026-09-04:** Reduce upload-to-solid-lesson waiting first;
improve teaching and agent ergonomics alongside it. All production behavior must
be source-independent. Reference sources belong to local evaluation, never seeded
libraries or hardcoded lesson content. New installations start empty.

Implemented a lossless `compact` evidence transport: shared column names replace
repeated per-fragment JSON keys. Exact text, full citation IDs, geometry, statuses,
offsets and scan/layout warnings remain available. Continuation calls preserve the
format. `detailed` remains the compatibility default; the authoring guide and new
brief receipts recommend compact. Nothing summarizes or omits source text.

The synthetic eight-page, 1,280-short-fragment regression uses the normal 36,000
character evidence budget. Detailed transport needed 8 calls / 270,954 serialized
characters; compact needed 5 / 181,581. This is approximately 33% less transport
and 37.5% fewer calls for this fixture, **not** measured upload-to-lesson speed or a
promise for every PDF. Long prose and visual inspection have different costs.

`get_authoring_workspace` joins a saved brief, selected plan, one review checkpoint,
review gaps, section anchors, saved block IDs, current draft version and bounded
validation issues. It suggests the next empty section or honors an explicit one;
checkpoints matching that section's anchors are returned first. It never equates a
nonempty section with semantic completeness, selects a source implicitly, approves
a plan or changes a lesson. Source permission, fingerprint and supported-index
checks remain mandatory. Successful save receipts still avoid redundant readbacks.

Review checkpoint validation now resolves up to 64 anchors against the same
bounded page batch already needed for layout checks. It eliminates up to 16
sequential evidence-bundle reads per checkpoint while still rejecting anchors from
another page, source or parser version. Original page-image anchors remain valid.

Writing guidance now explicitly requires unfamiliar terms before use, intermediate
reasoning, explained equation symbols/assumptions, meaningful examples and figure
interpretation. First-section rendering is checked early to avoid repeating layout
mistakes. These are authoring requirements, not proof of improved learning; the
owner trial remains necessary. A complete timed agent rehearsal after this change
is still pending, including host/model time, first useful section and final review.

Saved draft sections remain readable as composition progresses, with unfinished
work labeled explicitly. Agent guidance already batches complete sections; retain
that behavior. Reader refreshes no longer repeat hash-based scrolling every time
a background save changes a record. Source return still restores its explicit target.

The activity panel groups existing local tool receipts by authoring stage. Missing
durations and failed calls remain visible. These sums exclude model/host overhead,
approval waits and reading time; concurrent calls may overlap. They are not
end-to-end latency, and no new personal telemetry is collected.

For each reference rehearsal, separately record wall times for import/index ready,
source review, plan ready, approval wait, first readable section, final review,
accepted revision and reopen. Record host/model/version and cold/warm index state.
Measure the first saved section as well as the first section a human finds useful.
Optimize only the demonstrated bottleneck; do not trade coverage for a target time.

## Current release boundary

The [portfolio release plan](FINAL_PORTFOLIO_RELEASE_PLAN.md) remains authoritative.
This work changes the local reading product and quality gates; it does not deploy,
change DNS, migrate remote libraries, or implement account-backed storage.
The recovery-key prototype describes existing behavior. Optional account-backed
private sync is the next release target; it remains pending implementation and its
separate release acceptance.

CI now checks the sync Worker types and complete production build in addition to
the existing repository checks. No paid inference is run implicitly in CI.

## Acceptance record

- Passage-help layout repair (2026-09-04): scoped close-button styling to its
  header so suggested requests no longer inherit fixed square dimensions.
  Suggestions use two columns on wider screens and one column below 600px;
  panel width preserves viewport margins. Verified the saved RLM lesson in the
  browser at normal width and 390px, including text containment and keyboard
  selection. All four `LessonDraftPreview` tests and web type checking passed.

- Implementation and automated results: [submission readiness](SUBMISSION_READINESS.md).
- Reference-source selection and rehearsal rubric: [reference lessons](../experiments/REFERENCE_LESSONS.md).
- Owner trial and blank recording form: [learning trial](../experiments/OWNER_LEARNING_TRIAL.md).
- Human lesson approval, complete live source-to-revision rehearsals and delayed
  outcomes remain separate acceptance events. Source selection does not imply
  that either reference lesson has been composed or accepted.

## Incremental composition and review — 2026-09-08

The owner requested automatic upload access and substantially faster composition
without reducing detail or quality. Successful visible uploads now enable source
access; the redundant checkbox is removed and the import disclosure explains the
provider boundary. Revocation remains available. This supersedes the earlier
unchecked-checkbox import contract, not learner plan or revision approval.

Draft saves can now carry incremental coverage-review entries. The agent compares
source and section while both are in context, saves the review with that section,
and receives bounded pending-block/evidence counts. Review-only saves are also
supported. Changes to content or its ordering invalidate affected entries. The
finalizer checks the complete saved union, so it does not require the model to
retype a previously completed map. It still revalidates structural requirements
and requires an attributable semantic review after rendered inspection.

The deterministic test in `apps/web/src/lesson/lessonDocumentRead.test.ts` builds
13 sections / 104 blocks and proves unchanged content through checkpoints. Full
content retrieval takes **39 reads with the previous 11,000-character page budget
versus 13 with the new 24,000-character budget** (66.7% fewer calls). Filtered reads
return only unreviewed or visual blocks. Once checkpoints cover all prose, no
redundant prose reread is needed; edited blocks reappear in the pending set.
This is a synthetic transport benchmark, not a timing of model generation, browser
inspection, or a completed textbook lesson. It does not establish equal semantic
quality or a threefold end-to-end speedup.

Run `npm run test:web -- src/lesson/lessonDocumentRead.test.ts` to reproduce the
fixed workload. For end-to-end acceptance, use the same source range, approved
scope, detail target, model and host. Record first complete section time and total
composition/review time, tool timings, retries and resulting fidelity defects.
Keep all substantive content and inspect each authored visual, its meaningful
states, final/reset behavior, crop bounds, numeric data and static transcript.
Reusing tested renderer controls is allowed; uninspected authored meaning is not.

### Original run attribution

The owner identified Astra low. The original composition turn lasted
1,779.974 seconds. Its 39 outer tool calls sum to 264.687 seconds (14.9%);
1,515.287 seconds (85.1%) occurred outside recorded tool execution. Six draft
readback calls took 98.339 seconds. Calls used direct PRISM WebMCP and browser
controls. The trace contains 151,090 characters of tool-call code, including
lesson prose, and shows repeated helper/version recovery and a repeated section
payload. This does not identify token throughput or pure model reasoning time.

The revised guide avoids host-side last-block tracking (`after_block_id: null`
already appends in operation order), preserves payloads for idempotent retries,
and describes optional 2–4-worker drafting of independent approved sections with
one coordinator owning all writes and the cross-section/visual review. It does
not add a hosted inference service or enable concurrent versioned writes.
[OpenAI's Astra guidance](https://developers.openai.com/api/docs/guides/latest-model)
supports explicit delegation instructions when the host provides subagents;
[latency guidance](https://developers.openai.com/api/docs/guides/latency-optimization)
recommends parallelizing independent work. Equivalent lesson quality and the
actual time saved still require a source-faithful end-to-end comparison.
