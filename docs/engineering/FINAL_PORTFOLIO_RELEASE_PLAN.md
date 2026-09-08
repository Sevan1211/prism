# PRISM final portfolio release plan

**Owner choices recorded:** 2026-09-04; Cloudflare stack confirmed 2026-09-07  
**Status:** local cleanup first; hosting and DNS work are on hold

The owner accepted the [Cloudflare hosting/account contract](../architecture/CLOUDFLARE_HOSTING.md).
Finish the remaining local product changes before resuming hosting. The architecture
decision is not a deployment, completed account integration, or paid-plan activation.

The approved [reading-quality improvements](LEARNING_EXPERIENCE_IMPROVEMENTS.md) implement the first product slice. [Reference lessons](../experiments/REFERENCE_LESSONS.md) and the [owner trial](../experiments/OWNER_LEARNING_TRIAL.md) provide its acceptance path; they are not completed results.

## Outcome

Ship a polished, truthful PRISM release at
[`https://prism.sevanlewispayne.com`](https://prism.sevanlewispayne.com) that a
recruiter or early user can genuinely use and understand. It must demonstrate a
source-grounded workflow rather than a polished PDF chat surface:

1. import a source into an empty library;
2. inspect the original source and its exact evidence;
3. create a detailed, saved, source-grounded reading document through a compatible
   agent;
4. ask for and accept a substantive revision of the same lesson;
5. reopen the work later, locally or through optional cloud sync.

The result is a **resume-quality v1 with a controlled public beta**, not an
unbounded consumer service or a WebMCP challenge submission retrofit.

## Confirmed release choices

| Decision | Release choice |
| --- | --- |
| Public URL | `prism.sevanlewispayne.com` |
| Core access | Free, local-first Reader with no mandatory account |
| AI authoring | Bring-your-own compatible agent; PRISM does not silently fund model inference |
| Cloud sync | Optional account-backed private cloud library with ordinary login/recovery |
| Hosting | Cloudflare Worker Static Assets and same-origin Worker API |
| Accounts | Clerk Hobby, username/password and Google; D1 library metadata and private R2 files |
| Initial cloud beta | 50 users, 1 GB each including versions, 50 GB globally including upload reservations; minimized owner cost |
| Cost target | Zero owner cost within free allowances; any paid plan needs a concrete cost decision |
| Encrypted recovery-key prototype | Retain as an experimental implementation reference; do not present it as the default cloud experience or independently audited security |

The standard cloud route protects data in transit and at rest, uses private object
storage and per-account authorization, and never makes a library public. It does
not make a zero-knowledge claim. A learner's source remains local unless they
explicitly opt into cloud storage or disclose bounded source material to an agent.

## Starting point and release discipline

The repository already contains a substantial Reader, typed source-grounded lesson
composition, WebMCP tools, local persistence, and a prototype cross-browser sync
path. The previous public preview is not the target release. Current
uncommitted WebMCP and documentation work belongs to the active release effort and
must be reviewed and split into coherent changes rather than overwritten or deployed
as-is.

The public root route is PRISM's product landing page. The source library remains an
intentional `/sources` route: opening the root must not silently redirect into a
library or imply that a visitor has a selected source. This local routing decision is
not evidence of a custom-domain deployment.

The landing visual must explain PRISM's actual distinction: source evidence becomes
connected, inspectable learning frames with a visible route back to the source. It
must be product-native rather than decorative generated artwork or a generic AI
marketing illustration.

The rejected 3D landing direction was removed. The current local replacement uses
a transparent SVG prism behind the hero copy and source-connection examples.
It was inspected in the rebuilt local application during the
[September 7 audit](RELEASE_READINESS_AUDIT_2026-09-07.md); this is not public
deployment or final owner acceptance.

Each milestone below ends with evidence, not a claim based only on static checks.
The existing public site remains available until a Cloudflare-native replacement has
passed its private acceptance checks and a rollback path is clear.

## Milestone 0 — establish one release contract

**Do**

- Audit the active working tree and separate current work into focused, reviewable
  slices: product behavior, WebMCP contract, documentation, and deployment.
- Replace stale challenge-only language with the portfolio-release outcome where it
  affects current behavior or launch material. Preserve historical challenge evidence
  rather than rewriting it as a successful submission.
- Create one release checklist that distinguishes locally tested behavior, deployed
  behavior, and owner-reviewed product acceptance.
- Freeze a small, redistributable source set for demonstrations and regression tests.

**Prove**

- The branch has a known baseline, no private documents or local state are staged,
  and every current change has an owner and validation path.
- The release scope names what is deliberately deferred.

## Milestone 1 — complete the product spine

**Do**

- Finish one complete real workflow using an openly licensed source: import,
  source inspection, learner goal, coverage proposal, detailed lesson, source-linked
  visual/equation or worked explanation where useful, clarification, learner-approved
  revision, reload, and exact source return.
- Fix only the reliability, fidelity, and recovery gaps exposed by that workflow.
- Preserve substantive definitions, examples, qualifications, figures, and conceptual
  connections unless the learner explicitly accepts a reduced-scope goal.
- Keep generated lessons browser-native reading documents, never disguised source PDFs
  or executable agent-authored interfaces.

**Prove**

- A human reviews the finished lesson for usefulness and source fidelity.
- Direct URLs, refresh, back/forward, missing-record recovery, keyboard navigation,
  reduced motion, and source anchors work in the production build.
- A second, non-computing source demonstrates that the product is not merely a
  computer-science demo.

## Milestone 2 — make the experience portfolio-grade

**Do**

- Polish the empty-library onboarding, source import, library, Reader, lesson route,
  error/recovery states, and explanation of what an agent can and cannot do.
- Establish a consistent visual system with readable long-form lessons, purposeful
  source visuals, compact status feedback, and responsive narrow-screen behavior.
- Make the project’s distinction obvious in under a minute: persistent,
  source-inspectable lessons and learner-approved repair—not generic summarization.
- Add accessible names, keyboard paths, high-contrast states, and static alternatives
  wherever motion or interactive visuals are used.

**Prove**

- A clean-browser walkthrough succeeds without developer tools or a preloaded
  library.
- Representative routes meet measured interaction and loading budgets on a normal
  laptop. Do not publish performance claims before measurement.

## Milestone 3 — add simple, bounded cloud accounts

**Do**

- Keep local-only use as the default. Require an account only when a learner chooses
  cloud sync.
- Use Clerk Hobby with username/password and Google sign-in. Prove session
  verification and Worker CPU use; do not build password storage or recovery from scratch.
- Store account/library/revision metadata in D1 and source/lesson objects in a private
  R2 bucket. The Worker authorizes ownership, quota, and revisions; the browser sends
  large files directly to short-lived, single-object upload/download permissions.
- Enforce the accepted 50-user, 1 GB-per-user, 50 GB-global beta limits, including
  retained versions and upload reservations. Recheck provider-account allowances and
  measure request, CPU, D1 and R2 operation use before enabling signups. Reduce idle
  polling; stop intake before exhausting the budget. Present any required paid plan
  for a separate cost decision.
- Add clear deletion, account-disconnect, source-storage consent, and support/contact
  paths. Never send a stored source to an AI service without a separate learner action.

**Minimum security baseline**

- HTTPS, private buckets, server-side authorization on every library operation,
  restrictive CORS and content-security policy, short-lived upload permissions,
  rate limits, abuse protection, and source-free operational logs.
- No claim that the account-backed library is end-to-end encrypted or independently
  audited. The existing recovery-key implementation remains a later, separately
  reviewed privacy mode if it earns that investment.

**Prove**

- A user can sign in on two browsers, access only their own library, recover after
  clearing a browser, and delete a cloud library without another browser resurrecting
  it.
- Large uploads resume or fail visibly; lesson-only changes do not re-upload a PDF.
- Quotas, rate limits, and the global cutoff prevent an unbounded owner bill.

## Milestone 4 — migrate to Cloudflare and the custom domain

**Do**

- Replace the legacy publishing adapter with a Cloudflare-native Worker
  and static-asset build while retaining the current production origin as rollback.
- Create isolated production bindings for D1 and R2, apply reviewed migrations, and
  validate the deployment privately before routing public traffic.
- Add `prism.sevanlewispayne.com` only after the deployed application, API routes,
  storage permissions, and single-page route fallback have passed the release check.
- Keep redirects or a clear notice at the former host during the cutover window; do
  not remove the fallback until the new origin is stable.

**Prove**

- Signed-out visitors can open the application and every public route directly.
- Account/API endpoints reject cross-user and cross-origin access.
- The custom domain serves HTTPS, has correct metadata and sharing previews, and no
  source files or secrets appear in public assets.

## Milestone 5 — turn the project into evidence, not just an app

**Do**

- Write a concise public README: user problem, architecture, local-first privacy
  boundary, WebMCP interaction, account-backed cloud tradeoff, and tested limitations.
- Create a short product walkthrough with one real source, one inspection step, and
  one accepted revision. Do not reuse the missed challenge deadline or imply a
  challenge result.
- Capture clean screenshots and a short case study for the portfolio site.
- Draft résumé bullets only from verified implementation and measured outcomes.

**Prove**

- A reviewer can reach the live product, understand the interaction without a private
  setup, inspect the repository, and see honest limits and evidence.

## Milestone 6 — controlled public beta and release decision

**Do**

- Invite a small number of real users with an explicit feedback path; do not promise
  unlimited storage or universal PDF transformation.
- Track product errors, upload/recovery failures, storage consumption, and user
  confusion without collecting source text or learner answers in ordinary logs.
- Address launch-blocking bugs, reassess the monthly cost, and decide whether to widen
  access, hold the beta, or keep PRISM as a portfolio-hosted project.

**Prove**

- The production walkthrough works for fresh users, cost stays within the owner
  ceiling, and no unresolved high-severity fidelity, privacy, access-control, or
  accessibility issue remains.

## Definition of done

The final release is complete when all of the following are true:

- `prism.sevanlewispayne.com` serves the Cloudflare-native PRISM application.
- A newcomer can complete the core source → inspect → detailed lesson → accepted
  revision workflow with an approved compatible agent.
- Local-only use works without sign-in; optional cloud use is account-backed,
  quota-bounded, recoverable, and private by default.
- The product does not overclaim learning gains, universal PDF support, encryption, or
  agent capability.
- The deployed product, repository, walkthrough, case study, and résumé description
  agree with one another and are backed by current evidence.

## Explicit non-goals for this release

- a new submission to the expired WebMCP challenge;
- unlimited free cloud storage or PRISM-funded inference;
- a hand-built password system;
- an unreviewed end-to-end-encryption claim;
- instructor/classroom management features, quiz-bank scope, or arbitrary agent-run
  code;
- rewriting working components merely to look more sophisticated.

## Decision checkpoints

1. **After Milestone 1:** owner reviews the actual end-to-end lesson and decides if
   the product spine is strong enough to polish rather than expand.
2. **Before enabling cloud accounts:** validate the accepted Clerk integration
   and beta quotas; owner reviews the exact privacy/deletion and migration wording.
   Changes to the accepted limits or any paid plan need a new concrete decision.
3. **Before Milestone 4 cutover:** owner approves the public Cloudflare deployment
   and DNS switch after seeing the private validation result.
4. **After Milestone 6:** owner decides whether beta access expands, pauses, or stays
   a portfolio release.
