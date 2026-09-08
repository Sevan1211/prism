# Agent instruction trial

**Updated:** 2026-09-06  
**Status:** instruction changes installed; synthetic forward test complete; comparative real-task trials pending.

## Change and rationale

Root agent instructions now describe the implemented reading workspace and route
specialized work to current documents. Research requirements moved to
[their dedicated reference](../research/RESEARCH_REQUIREMENTS.md). The
[engineering standards](../engineering/ENGINEERING_STANDARDS.md) distinguish
affected development checks from merge/release gates. Learner approvals, privacy,
accessibility, source fidelity, and the permanent development branch remain required.

Five personal skill entrypoints were revised without changing their names or
invocation policies: design-taste-frontend, frontend-design, vercel-react-best-practices,
web-design-guidelines, and find-skills. Marketing and application design have distinct
triggers. Marketing-specific references are loaded conditionally; blanket aesthetic
bans and framework-inappropriate recipes were removed. Existing React rule files
remain available on demand. Original entrypoints are backed up locally outside Git.
No model settings, vendor bundles, or installed dependencies were changed.

The new [lesson fidelity review skill](../../.agents/skills/prism-lesson-fidelity-review/SKILL.md)
reviews approved source scope without authorizing access or accepting repairs.
It consults the live authoring guide rather than duplicating tool payload schemas.

This approach follows [OpenAI's Astra guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra),
[skill guidance](https://learn.chatgpt.com/docs/build-skills), and
[Eric Provencher's article](https://x.com/pvncher/status/2095991462416490862).
Those sources motivate the experiment; they do not establish a measured PRISM improvement.

## Initial verification

- Six skill entrypoints passed YAML, naming, description, and placeholder checks
  using the existing js-yaml dependency. The bundled Python quick validator could
  not run because PyYAML was absent; no package was installed to work around this.
- Installed personal files and original backups were SHA-256 checked. Their local
  Markdown references resolved.
- An independent Astra agent applied the new review skill to an invented two-page
  source/lesson packet. It identified missing inlet conditions, cooling duration,
  valve instructions, experimental limits, a worked example, and causal explanation.
  It treated numerical figure claims as unsupported and disclosed that the figure
  could not be reviewed. It did not access live sources or modify the lesson.
- A description-only routing exercise selected marketing design, product UI,
  React performance, skill discovery, lesson review, and accessibility review for
  their corresponding requests. A typo selected no skill. A basic submit-button
  question selected none by default, with a noted boundary if it expands into form design.

The routing exercise is a semantic dry run, not an instrumented test of Codex's
automatic skill discovery. The synthetic review is one scenario, not proof of
reliable full-source review, faster work, or improved learning.

## Real-task comparison

Use comparable starting snapshots and acceptance criteria for a wording fix, bounded
bug, persistence/recovery change, browser-inspected UI change, and authorized lesson
review. Keep the model and reasoning effort constant initially. Record correctness,
elapsed time, unnecessary questions, unrelated changes, repeated checks, omitted
requirements, and skills actually loaded. Include both matching and nonmatching prompts.

Run original and revised instructions in isolated workspaces; repeat cases before
attributing a difference to instruction changes. Do not replay mutations against
production or private sources merely to obtain a benchmark. Preserve the original
task's access and approval boundaries. Change reasoning effort only in a separate
comparison so its effect is distinguishable.

Retain revisions that preserve acceptance outcomes and reduce avoidable work. Correct
specific demonstrated failures instead of adding universal rules for every example.
Real-task results have not yet been collected.
