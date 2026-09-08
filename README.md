# PRISM

**A reading workspace for understanding difficult sources.**

Import your own PDF, read the original, and work with a compatible browser agent to create a detailed lesson or research brief. PRISM keeps the source, coverage plan, saved reading document, visuals, and revisions together. Lessons use formatted text and inline representations; they are not generated PDFs.

PRISM is being prepared for a portfolio-quality v1 and controlled public beta. It remains an engineering prototype, with no claim of improved learning speed or efficacy. The [release plan](docs/engineering/FINAL_PORTFOLIO_RELEASE_PLAN.md) defines the target; [current evidence](docs/engineering/SUBMISSION_READINESS.md) distinguishes local work, deployed behavior and human acceptance.

The accepted release target is Cloudflare Worker Static Assets and a Worker API, Clerk with username/password and Google login, D1 metadata, and private R2 storage at `prism.sevanlewispayne.com`. Cloud accounts are optional; local reading remains account-free. The initial free beta is capped at 50 cloud users, 1 GB each, and 50 GB globally. [Hosting and account contract](docs/architecture/CLOUDFLARE_HOSTING.md).

**Current status:** real development login and account-owned storage work locally. The private Cloudflare bucket and database are provisioned and tested; the Worker/site and DNS are not deployed. Recovery-key sync has been retired. Production setup and cross-device acceptance remain release gates.

The [Cloudflare release pipeline](docs/engineering/CLOUDFLARE_RELEASE.md) runs checks
before publishing `main`. Development branches and pull requests do not deploy.
The first public rollout is being configured; a workflow file alone does not mean
the production deployment has succeeded.

## How it works

1. **Bring a source.** The library starts empty. PDF processing happens in your browser. Read and save locally without an account. The account cloud mode is a separate opt-in.
2. **Choose what you need.** Ask for one concept, a chapter, or a detailed synthesis of a longer document. Length and reading time are soft targets. A request such as “100 pages into about 10” must disclose what was compressed or omitted.
   Default lessons preserve substantive definitions, reasoning, examples, qualifications and relevant figures. Shorter summaries require explicit scope approval.

3. **Review the plan.** The agent reads the requested pages through WebMCP, inspects relevant original visuals, saves review checkpoints, and proposes a source-grounded sequence. You approve the scope.
4. **Read and inspect.** The agent composes connected Markdown-style explanations, original figure crops, equations, tables, worked examples, and controlled diagrams or charts. Citations open the original evidence.
5. **Improve the same lesson.** Select a confusing passage, discuss it with your agent, and review a proposed revision. Accept or keep the current lesson; previous versions remain recoverable.

Questions are optional. PRISM remains centered on reading and understanding. It does not include a built-in chatbot or prewritten textbook lessons. A compatible external agent supplies generation and interpretation under its provider's access and usage terms.

## Run locally

The browser application needs **Node.js 24**. Python and the companion API are optional.

```powershell
npm ci
npm run dev:web
```

Open `http://127.0.0.1:5173`. Use a browser host that supports WebMCP for agent authoring; the Reader remains usable without it. `localhost` and `127.0.0.1` are different storage origins, so consistently use the same address for your library.

```powershell
npm run quality:web
npm run build
```

The production build contains no source PDFs. `dist/client` contains the browser application and `dist/server` the prototype sync Worker; legacy publishing packaging remains to be replaced as recorded in the [Cloudflare migration sequence](docs/architecture/CLOUDFLARE_HOSTING.md#implementation-sequence-after-local-cleanup). A successful build does not deploy. `npm run dev:sync` uses `wrangler.jsonc` to run local D1/R2 emulation on port 8787; initialize it with `npx wrangler d1 migrations apply DB --local`. The web development server proxies sync requests to it. Production bindings are not provisioned by these commands.

For the optional Python engineering baseline, create `.venv`, install `apps/api[dev]`, and run `npm run dev:api`. Set `VITE_PRISM_API_URL` explicitly when you want the browser to connect to that companion. The default hosted application makes no companion request.

## Parsing and privacy

PDF.js renders original pages and indexes embedded text in a worker. The parser preserves page regions, identifies candidate structure, infers sustained two-column reading order, and flags uncertain layouts and numeric rows for visual inspection. Scans remain viewable and can be inspected by a capable vision agent; browser OCR, verified table reconstruction, and universal document support are not claimed.

Private and unknown-rights documents require explicit per-source agent access. Selected text and page images shared with an external agent may be processed by its provider; “browser-local” does not mean external inference stays on your device. Source text is untrusted evidence and cannot authorize tools or change consent.

Browser caches are specific to a profile and origin. Cloud storage and agent disclosure require separate opt-in. The [accepted cloud account contract](docs/architecture/CLOUDFLARE_HOSTING.md) defines the upcoming cross-browser recovery and privacy behavior. Keep original files safe; local storage can be cleared or evicted.

Use **Help** for the upload → request → approve → read/revise workflow. **Storage**
opens the account and storage dialog. Signing in alone does not upload files; choose
whether to copy the browser library when creating an account library. Local development
is visibly labelled as a test using this computer's Cloudflare emulator. Cross-device
cloud storage requires the production API. Account settings and sign-out remain available.
No recovery-key file is required. See [implementation and setup evidence](docs/architecture/CLOUD_ACCOUNT_PROPOSAL.md).

## Validation

`npm run quality:web` checks lint, types, contracts, recovery, rendering, and production compilation. `npm run audit:pdf` separately audits downloaded independent PDFs; acquisition and provenance are documented in [the corpus record](benchmarks/PDF_CORPUS.md). These are engineering checks, not a semantic accuracy or learning-efficacy score.

The live source-reading and image-inspection tools have been exercised on Recursive Language Models v3. The complete live reference-lesson/revision rehearsals and signed-out public-origin acceptance remain required before release. See the [reference lessons](docs/experiments/REFERENCE_LESSONS.md) and the approved [owner learning trial](docs/experiments/OWNER_LEARNING_TRIAL.md).

## Repository

- [Product brief](docs/00_PROJECT_BRIEF.md)
- [Lesson contract](docs/product/INTERACTIVE_LESSON_SPEC.md)
- [WebMCP tool and authorization contract](docs/architecture/WEBMCP_INTEGRATION.md)
- [Document intelligence](docs/architecture/DOCUMENT_INTELLIGENCE.md)
- [Local browser architecture](docs/architecture/DEVICE_LOCAL_WEB_ARCHITECTURE.md)
- [Cloudflare hosting and accounts](docs/architecture/CLOUDFLARE_HOSTING.md)
- [Portfolio release plan](docs/engineering/FINAL_PORTFOLIO_RELEASE_PLAN.md)
- [Engineering standards](docs/engineering/ENGINEERING_STANDARDS.md)
- [Learning validation plan](docs/experiments/VALIDATION_PLAN.md)

## License

PRISM code is [Apache-2.0](LICENSE). The engineering fixture of Peterson and Davie's Computer Networks is separately CC BY 4.0; see its [attribution](benchmarks/fixtures/README.md). It is not installed into the released library or included in the static site. Other downloaded benchmark PDFs are excluded from Git and distribution.
