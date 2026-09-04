# PRISM

**A reading workspace for understanding difficult sources.**

Import your own PDF, read the original, and work with a compatible browser agent to create a detailed lesson or research brief. PRISM keeps the source, coverage plan, saved reading document, visuals, and revisions together. Lessons use formatted text and inline representations; they are not generated PDFs.

PRISM is being prepared for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/). It is an engineering prototype, with no claim of improved learning speed or efficacy. [Current release evidence and remaining work](docs/engineering/SUBMISSION_READINESS.md).

## How it works

1. **Bring a source.** The library starts empty. PDF processing happens in your browser. Use local storage or enable encrypted library sync across independent browsers, with a recovery key and no required account.
2. **Choose what you need.** Ask for one concept, a chapter, or a detailed synthesis of a longer document. Length and reading time are soft targets. A request such as “100 pages into about 10” must disclose what was compressed or omitted.
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

The production build contains no source PDFs. `.openai/hosting.json` records the Sites project, D1 metadata and R2 encrypted-object bindings. `dist/client` contains the browser application and `dist/server` the sync Worker. `npm run dev:sync` runs local storage emulation on port 8787; initialize it with `npx wrangler d1 migrations apply DB --local`. The web development server proxies sync requests to it.

For the optional Python engineering baseline, create `.venv`, install `apps/api[dev]`, and run `npm run dev:api`. Set `VITE_PRISM_API_URL` explicitly when you want the browser to connect to that companion. The default hosted application makes no companion request.

## Parsing and privacy

PDF.js renders original pages and indexes embedded text in a worker. The parser preserves page regions, identifies candidate structure, infers sustained two-column reading order, and flags uncertain layouts and numeric rows for visual inspection. Scans remain viewable and can be inspected by a capable vision agent; browser OCR, verified table reconstruction, and universal document support are not claimed.

Private and unknown-rights documents require explicit per-source agent access. Selected text and page images shared with an external agent may be processed by its provider; “browser-local” does not mean external inference stays on your device. Source text is untrusted evidence and cannot authorize tools or change consent.

Browser caches are specific to a profile and origin. Optional encrypted sync connects them through a hosted library: save the recovery key, then enter it once in each new browser. Each browser works independently while online; no folder picker or companion is required. Keep the key and original files safe. Clearing site data requires reconnecting. See the [sync contract and acceptance evidence](docs/architecture/SYNCED_LIBRARY.md).

Use **How it works** in the header for the upload → request → approve → read/revise
workflow. **Library storage** explains encrypted sync and provides a recovery-key
text download during setup. To join from another browser, choose **Connect existing
library** with the same key; do not create another library. Wait for **Synced**
before switching. The first download of a large PDF can take longer. Folder mode
has been retired; existing folders on disk are not deleted.

## Validation

`npm run quality:web` checks lint, types, contracts, recovery, rendering, and production compilation. `npm run audit:pdf` separately audits downloaded independent PDFs; acquisition and provenance are documented in [the corpus record](benchmarks/PDF_CORPUS.md). These are engineering checks, not a semantic accuracy or learning-efficacy score.

The live source-reading and image-inspection tools have been exercised on Recursive Language Models v3. The complete live lesson/revision rehearsal and signed-out public-origin acceptance remain required before submission.

## Repository

- [Product brief](docs/00_PROJECT_BRIEF.md)
- [Lesson contract](docs/product/INTERACTIVE_LESSON_SPEC.md)
- [WebMCP tool and authorization contract](docs/architecture/WEBMCP_INTEGRATION.md)
- [Document intelligence](docs/architecture/DOCUMENT_INTELLIGENCE.md)
- [Local browser architecture](docs/architecture/DEVICE_LOCAL_WEB_ARCHITECTURE.md)
- [Submission plan](docs/engineering/WEBMCP_CHALLENGE_PLAN.md)
- [Engineering standards](docs/engineering/ENGINEERING_STANDARDS.md)
- [Learning validation plan](docs/experiments/VALIDATION_PLAN.md)

## License

PRISM code is [Apache-2.0](LICENSE). The engineering fixture of Peterson and Davie's Computer Networks is separately CC BY 4.0; see its [attribution](benchmarks/fixtures/README.md). It is not installed into the released library or included in the static site. Other downloaded benchmark PDFs are excluded from Git and distribution.
