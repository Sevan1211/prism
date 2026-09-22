# Topic lessons and series

Status: implemented locally, 2026-09-20. The learner reviewed one local
Mean versus median lesson on 2026-09-22; hosted and broader content acceptance
remain open.

## Learning workflow

A folder can contain uploaded sources, a standalone topic lesson, and several lesson
series. Uploading a document is optional. A standalone lesson is a series with one
plan; it uses the same reader, patch, review, revision, and history machinery.

The learner saves a named learning request, with the research mode and optional
source selection. The external agent asks real clarifying questions and waits for
answers before planning new work. It records goals, starting knowledge, depth,
constraints, prerequisites, exclusions, and optional practice as appropriate to the
subject. Saved answers and existing approvals can be resumed without repeating them.
The system requires a nonempty question/answer record but cannot independently prove
that the conversation occurred. Agents must not fabricate that record.

The agent proposes the whole bounded series. The learner reviews every included
lesson and approves once. Approval atomically freezes all those plans; there is no
agent approval tool. A desired lesson count is a preference, not evidence that an
unbounded subject is completely covered. Material scope changes require a new request.
Content improvements use the existing proposed-revision and learner-acceptance flow.
Before approval, the learner may revise request settings and restart clarification.
This removes the superseded unapproved plans, not saved lessons.

## Research and evidence

| Mode | Contract |
|---|---|
| Knowledge + research | Default. Agent explanations plus inspected web or explicitly selected uploaded references; each lesson requires references. |
| Knowledge only | No claimed inspected references. Agent knowledge and original examples are labelled, with uncertainty made explicit. |
| Selected sources only | Every content block references selected uploaded evidence; no web references. |

Source membership is explicit and does not follow folder membership. Sources can be
supporting references or required coverage. Required coverage ensures each selected
source is represented in the plan; it does not automatically establish semantic
completeness. Agents must inspect, describe, and preserve the approved substantive
scope. Existing private-source grants and fingerprint checks apply to reads and writes.
Revocation does not erase a previously authored lesson from the learner's library.

Web references record a title, HTTPS URL, inspected date, location within the page,
and what the reference supports. These are agent-reported inspections, not app-verified
truth. Do not silently fall back to knowledge-only work if research is unavailable.
Uploaded references retain source IDs, immutable fingerprints, and real element
anchors; the reader can open exact passages. Topic blocks map to approved objectives
and references. There are no fabricated PDF IDs, pages, or source excerpts.

## Authoring and representations

Agents create and edit teaching content. Learners manage requests, review scope,
read, explore, and accept changes. There is no learner prose editor or embedded AI
service. The three topic tools are `get_topic_workspace`, `create_topic_request`,
and `propose_topic_series`. Existing lesson tools perform composition and revision.
Focused paginated plan views avoid retransmitting whole series during each save.

`process_diagram` is a compact authoring recipe. The app places labelled concepts in
rows, columns, or grids and stores a validated `visual_scene`. Advanced scenes retain
explicit geometry. Optional cumulative state changes preserve positions, labels,
details, and tones across steps, with deterministic rewind and reset. Legacy scenes
default to their existing absolute step behavior. Playback is opt-in, adjustable,
pauses on hidden tabs, and has reduced-motion and complete transcript alternatives.
Meaningful movement still requires the author to supply meaningful changing states;
highlighting alone is not a simulation. Automatic placement does not eliminate the
need to inspect arrows, labels, long text, and every meaningful state.

Optional `practice` blocks provide a prompt, revealable hints, a worked response, and
reflection. They support interpretation, writing, reasoning, calculations, and coding.
They collect no answers, impose no progression gates, and produce no scores. Optional
agent discussion records require explicit uncertainty for topic lessons. Improvements
use proposed revisions or a newly clarified request; PDF-range repair briefs are not
used for source-free lessons.

## Persistence and limits

Vault schema 14 adds portable `topic_series` records. Topic plans and documents use
the existing stores with an explicit `topic` discriminator; legacy single-source fields
are empty in topic records and must not be interpreted as source claims. Folder removal
preserves series as unfiled. Requests, plans, and content use optimistic versions.
Existing portable-store machinery includes the new records in library transfers and
account sync. Live multi-device cloud acceptance remains separate from local tests.

This implementation keeps single-source PDF excerpt/crop blocks in the original source
workflow. Topic lessons link exact uploaded evidence and use supported authored visuals;
inline crops spanning multiple sources are not part of this slice. New references after
approval require new scope rather than silently changing the approved evidence set.
Rendering and schema checks do not prove factual accuracy, coverage, learning gains,
or real-world authoring-speed improvement.


Topic scope conflicts keep related changes together: selecting a side for a pending
proposal or approval also selects its connected pending plan and lesson writes.
Both sides are retained in local conflict history. Ordinary unrelated record conflicts
keep their existing per-record behavior. Live hosted acceptance remains pending.
