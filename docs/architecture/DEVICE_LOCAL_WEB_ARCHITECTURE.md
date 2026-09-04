# Device-local hosted web architecture

**Release update — 2026-09-03:** Folder mode has been removed at the owner's
request. The current product offers browser-only storage and opt-in
[encrypted cloud sync](SYNCED_LIBRARY.md). Existing files in device folders are
not deleted or automatically imported. The folder implementation and picker
investigation below are historical records, not current product instructions.

**Status:** adopted target; owner decisions recorded 2026-08-29  
**Reviewed:** 2026-08-29  
**Related:** [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md), [`TECH_STACK.md`](TECH_STACK.md), [`WEBMCP_INTEGRATION.md`](WEBMCP_INTEGRATION.md), [`../product/INTERACTIVE_LESSON_SPEC.md`](../product/INTERACTIVE_LESSON_SPEC.md)

**Latest owner requirement — 2026-09-03:** All linked browsers, especially ChatGPT's
native browser, must access the same library independently. The owner rejected a
native companion and reliance on another browser remaining open. Folder mode
cannot satisfy that requirement in the installed host. The owner subsequently
approved [encrypted library sync](SYNCED_LIBRARY.md), now implemented with hosted
storage and browser-side encryption. Browser-only storage remains the default;
sync is a separate, visible opt-in and does not grant source-agent access.

## Decision

**Owner decision — 2026-09-03:** The learner may connect the same physical PRISM
folder in each supported desktop browser. Folder mode now writes original PDFs,
indexed pages, lesson documents, revisions, briefs, plans, projects and illustrations
to that selected directory. IndexedDB is a rebuildable cache in this mode. The
browser-only fallback remains clearly labeled and does not promise cross-browser access.
The hosted site is publicly accessible without ChatGPT sign-in; hosting does not
upload a personal library.

Folder format: `library.prism.json` identifies the library; `sources/` contains
content-addressed PDFs; `assets/` contains binary illustrations; `changes/` is an
append-only JSON record history. Successful saves await the folder commit. On
reopen, the cache is rebuilt from that history. Writes retain older records and PDFs,
including logically removed sources. Permanent erasure requires removing the
folder and any cloud-provider copies. No automatic history pruning is implemented.

A new empty folder copies the browser's existing library without deleting its
original storage. An existing folder opens its own library, without implicitly
merging a different browser library. Source-agent grants and activity logs remain
browser-local and are not exported as portable authorization. The folder picker
and reconnect permission require a real learner gesture. The app exposes permission
loss and save failures in a visible Library storage dialog. Same-origin tabs use
Web Locks; append-only branch detection stops competing browser/device edits rather
than choosing a winner. Conflict recovery currently requires restoring a consistent
folder backup; it is not a collaborative merge interface.

**Cloud-folder tip:** Desktop OneDrive, iCloud Drive and Google Drive can synchronize
the selected folder. Keep it downloaded/available offline, wait for syncing before
switching computers, and use one editor at a time. This is an inference from the
providers' file-sync behavior, not a PRISM multi-device acceptance result. Cloud
providers then store these files under their own accounts and policies. Browser
folder-picker support is feature-detected; unsupported browsers retain browser-only
reading and do not claim shared-folder persistence.

Primary references: [OneDrive offline files](https://support.microsoft.com/en-us/office/save-disk-space-with-onedrive-files-on-demand-for-windows-0e6860d3-d9f3-4971-b321-7092438fb38e),
[iCloud downloaded folders](https://support.apple.com/guide/icloud-windows/icw8531ad6b7/icloud),
[Google Drive stream and mirror](https://support.google.com/drive/answer/13401938).

The older OPFS description below documents the browser-only fallback. Real
cross-browser folder selection and provider synchronization require live acceptance;
a unit-tested record round trip does not establish those outcomes.

PRISM is a hosted web application with a device-resident source and lesson library. Hosting the application shell does not authorize PRISM to persist personal source bytes on a server.

The challenge release requires no account. A later account may synchronize non-source settings or explicitly encrypted exports, but it does not make local documents available on another device.

```text
Hosted PRISM origin
  application shell, empty initial library, WebMCP registration
                     |
                     v
Browser-local PRISM vault
  OPFS: PDFs, page assets, lesson assets, local exports
  IndexedDB: metadata, indexes, anchors, lessons, activity
  Web Workers: parsing, indexing, rendering support
                     |
        approved bounded tool results
                     v
Browser-hosted WebMCP agent
  planning, composition, discussion, answer analysis
```

## Local data ownership

The table below describes browser-only fallback storage. Connected-folder data locations are specified above.

| Data | Fallback location | Cloud condition |
|---|---|---|
| Personal PDF bytes | Browser OPFS | Never sent to PRISM hosting |
| Demo sources | Learner-imported only | No bundled textbook or research paper |
| Page render cache and extracted visuals | Browser OPFS | Selected regions may be shared with the agent after consent |
| Metadata, anchors, search indexes | IndexedDB / OPFS | None by default |
| Lessons, versions, questions, answers, annotations | IndexedDB / OPFS | None by default |
| Agent tool results | Browser agent boundary | Only after source-level consent |
| Product telemetry | Off by default | Separate explicit opt-in |

## Add local source

The interface uses **Add local source**, not **Upload**, when no network transfer occurs.

### Default: copy into the local vault

The selected file is copied into the origin-private file system. This makes reopen behavior independent of the original file's path and permission handle. The imported bytes are fingerprinted and stored only under the stable production origin on the current browser profile and device.

### Optional: link the original file

For very large sources, a later mode may retain a `FileSystemFileHandle` in IndexedDB rather than duplicating the file. PRISM must check permission on every reopen and offer **Reconnect source** when permission was not retained or the file moved. It must not store or claim access through a raw operating-system path.

### Persistence limitations

PRISM requests persistent browser storage and displays quota, usage, and persistence status. Browser-local data can still be removed when the learner clears site data, resets the profile, uses private browsing, or loses the device. The product therefore provides local export and restore and never claims irreversible or cross-device permanence.

Primary platform references: [Origin Private File System](https://web.dev/articles/origin-private-file-system), [File System Access](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access), and [storage persistence](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).

## Agent exposure is not local-only processing

The PDF can remain device-local while selected source content is transmitted to the learner's browser-hosted agent. PRISM must state this distinction precisely.

Every private or unknown source starts with agent content access disabled. The learner may enable it per source after seeing:

- the agent/provider boundary;
- permitted payload classes: text spans, page regions, source visuals, or derived metadata;
- the purpose: planning, composition, discussion, answer analysis, or extraction review;
- the fact that the agent provider's data controls apply to transmitted material.

Consent is bound to the immutable source fingerprint, revocable for future calls, and visible in a sharing history. Tool responses are bounded and never return raw PDF bytes or unrestricted full-book text.

Reader-only operation shares no source content with an agent. A zero-transmission generative path would require a separately evaluated local model; it is not part of the challenge release.

## Local persistence services

### Implementation status — 2026-08-31

The web application now initializes schema version 9 of `prism-browser-vault`. The
version-1-to-version-9 migration preserves the vault initialization record and adds
IndexedDB stores for source metadata, exposure-only Reader position, page-grounded
text evidence, lesson briefs, lesson plans, current typed lesson documents, immutable
document revisions, append-only answer analyses, learner outcome receipts,
fingerprint-bound source-agent grants, capped agent activity, and source-owned project
routes. A dedicated OPFS `sources` directory owns immutable PDF bytes. Startup reports IndexedDB/OPFS
availability, origin usage and quota, persistence state, schema version, and
initialization failure. A learner can explicitly request persistent storage; PRISM does
not make that request silently.

**Add local source** now quota-checks the origin, enforces the current 128 MB browser
limit, calculates a SHA-256 fingerprint, verifies page readability with PDF.js, copies
the PDF into OPFS, and commits its metadata to IndexedDB. Duplicate fingerprints reuse
the immutable source. The library merges browser-vault sources with open-license or
development sources exposed by the loopback reference API, but a browser source opens
through a temporary `blob:` URL and its Reader position never calls that API. Removing
a browser source deletes its OPFS file, Reader-position record, page-index records,
lesson briefs, plans, current documents and revisions, analyses, outcomes, project
membership/routes, activity, and agent grant in one source-scoped cascade.

After import, a dedicated module worker progressively extracts embedded PDF text into
versioned page batches. Each fragment retains its original one-based PDF page and an
approximate normalized region. The `pdfjs-evidence-v2` record also stores stable
candidate-element anchors and a page-quality profile. Heading, paragraph, list, caption,
code, equation, example, and exercise labels remain candidates with reasons and
confidence; image-only pages and credible parallel column/table geometry fail to
`source_only`. The geometry detector ignores header/footer bands and requires repeated
horizontal evidence so a single equation row or split footer does not masquerade as
parallel reading order. True uncertain multi-column layouts still fail closed.
IndexedDB commits every batch together with resumable progress; interrupted or stale
parser output remains non-searchable and can restart at the next compatible page. The
worker bridge ignores unrelated runtime messages and finishes only on PRISM's explicit
`complete` event, preventing premature page-0 success/failure on large documents.

Coverage-aware planning is also browser-local. A brief binds the source fingerprint,
page range, assignment, learner goal, time budget, intended depth, and prior knowledge.
A proposal must classify every cursor-paged manifest element exactly once, preserve
`source_only` evidence, stay within the time budget, teach and check every objective,
and include 3–6 end questions with both explanation and application. Proposed plans
reopen from IndexedDB. Approval is a learner-only visible action that freezes the plan
with a SHA-256 fingerprint; no WebMCP approval tool is registered.

Private and unknown-rights sources now expose a visible per-source switch for bounded
agent access. The grant is off by default, tied to the immutable source hash, limited to
derived structure and text spans in this slice, and revocable for future calls. It does
not upload the PDF or authorize deletion, plan approval, or arbitrary file access.

Approved plans may now receive optimistic-versioned typed lesson patches. The current
draft document, validation report, end questions, and rendered manuscript reopen from
IndexedDB, while every accepted document version is appended to the immutable revision
store. The version-9 migration snapshots each pre-existing current document as its
corresponding historical revision. The validator rejects out-of-plan evidence and
unsupported block data, checks planned evidence use and provenance, and verifies source
excerpts against exact indexed text.

Automated tests run IndexedDB request and transaction semantics through the
development-only `fake-indexeddb` implementation. They cover first-origin migration,
version-1 upgrade, missing-schema-record recovery, quota pressure, persistence refresh,
missing platform capabilities, OPFS failure, byte deduplication, reopen, no-fetch
import, Reader routing, page-index resume and fail-closed completion, exact search,
cursor-paged scope manifests, bounded evidence bundles, private-content refusal,
progress persistence, plan persistence and approval, private-grant revocation, typed
composition/version conflicts/excerpt checks, and cascade deletion. The Reader mounts selectable PDF.js text
only for viewport-adjacent pages, and `open_source_location` can open and visibly
highlight a page region. The agent-facing manifest discloses missing visual inventory,
semantic candidates, cross-references, and verified hierarchy. Trusted layout and source
structure, source-authored visual composition, annotations, export/restore, and
deployed-origin restart/network smoke evidence remain required. Browser sources
cannot compile a lesson until the evidence and lesson contracts pass their own gates.

### OPFS

Stores file-like and high-volume artifacts:

- immutable source bytes;
- page images and thumbnails;
- extracted or selected visual assets;
- OCR or layout artifacts;
- lesson media;
- export bundles.

### IndexedDB

Stores structured state:

- source and rights records;
- processing jobs and quality status;
- outline, layout, semantic, and retrieval indexes;
- source anchors;
- reader progress and annotations;
- lessons, versions, coverage ledgers, and question sets;
- agent activity and sharing history.

Large index or database implementations may place their backing files in OPFS while retaining the same logical boundary.

### Web Workers

PDF decoding, text extraction, indexing, image processing, and other sustained work run outside the UI thread. Jobs are resumable, versioned, cancellable, and checkpointed. Closing the page cannot convert partial output into a ready source or lesson.

## Optional PRISM Workspace folder

After the challenge, PRISM may offer **Connect agent workspace folder**. The learner grants a directory handle, and PRISM exports portable Markdown and JSON such as:

```text
PRISM Workspace/
├── AGENTS.md
├── learner-profile.md
├── courses/
│   └── computer-networks/
│       ├── course-context.md
│       ├── source-manifests/
│       ├── lessons/
│       └── session-receipts/
└── exports/
```

This folder is a portability and agent-context bridge, not the authoritative runtime database. Codex project instructions and memories are helpful context layers, but required product state remains in PRISM's local vault and durable project guidance belongs in checked-in or exported files. See [Codex projects](https://learn.chatgpt.com/docs/projects), [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), and [Codex memories](https://learn.chatgpt.com/docs/customization/memories).

## Challenge migration boundary

The current FastAPI/SQLite/content-addressed-file implementation remains the verified local engineering baseline and can serve open-license bundled demo data. It cannot receive personal uploads in the hosted release while PRISM claims document bytes never leave the device.

The challenge path is:

1. host the static web shell at a stable HTTPS origin;
2. keep the open-license hero source available as a bundled demo;
3. implement browser-local personal-source import, persistence, and reader access;
4. run supported PDF.js extraction and indexing locally;
5. register WebMCP tools against browser-local state;
6. keep the server out of the personal-source data path;
7. disclose unsupported parsing and fall back to the original source.

The post-challenge path may migrate more of the Python document pipeline to WebAssembly or retain an optional local companion process. Any server-assisted parser becomes a separately consented mode and cannot be described as local-only.

## Zero-required-inference-cost boundary

The challenge release is designed to remain free to operate at small public scale:

- the hosted artifact is a static application shell;
- personal PDF bytes, indexes, lesson state, and activity receipts consume the learner's
  browser storage rather than a PRISM database or object-storage account;
- PDF rendering, extraction, lexical search, coverage validation, and lesson rendering
  execute in the browser;
- the learner brings a WebMCP-capable agent, so PRISM does not proxy model requests,
  hold provider keys, or pay per lesson;
- no login, sync service, analytics pipeline, or required server function is in the core path.

This does not mean the system has no resource cost. Static hosting bandwidth and the
learner's chosen agent have costs borne by their respective providers or plans. PRISM
must not market the architecture as universally free; the precise promise is that the
core product requires no PRISM-funded inference or personal-document backend. Optional
future sync, team, OCR, or server-assisted parsing modes must remain separable from this
free local-first core.

## Release gates

- personal PDF bytes are absent from network requests in an automated test;
- sources and lessons reopen after browser and application restart on the same origin;
- clearing one source removes its bytes, indexes, lessons, annotations, agent grant, and activity receipts;
- storage-pressure and quota failures stop safely and preserve existing valid data;
- private-source content tools do not register or return content without current consent;
- source-sharing history identifies each content-bearing call and payload class;
- local export and restore preserve identifiers and hashes;
- the no-agent path provides the complete Source Reader and saved-lesson playback.


Destination-flow correction: the learner selects a destination, and PRISM creates
or reopens its own `PRISM/` subfolder. Selecting an existing library folder directly
also reopens it without adding a nested folder. Protected destinations can still be
blocked by the browser. Cancelled or blocked selection now displays an explanation;
PDF copying and record saving show explicit progress. The earlier silent abort was
observed by the owner; a successful native picker round trip remains unverified.


### Protected destination correction — 2026-09-03

The learner reproduced Chromium's native restricted-directory dialog at the
Documents root. Chromium explicitly blocks selecting entire Documents, Desktop,
Downloads and home folders while allowing appropriate descendants. This occurs
before PRISM receives a directory handle. Therefore the previous automatic
parent-destination flow cannot create PRISM under those protected roots.

The corrected picker starts in Documents as a browsing location. The learner
selects an existing PRISM library or uses the native picker's New folder control
once. Empty folders named PRISM are used directly without creating PRISM/PRISM;
other allowed destinations still receive a PRISM child. Existing nonempty folders
without a manifest are not overwritten. The app cannot suppress the browser dialog,
automatically create a child of a blocked parent, or grant its own folder access.
The agent can prepare a dedicated folder on this owner's machine, but that local
assistance is not a capability available to arbitrary website visitors.

Primary evidence: [Chromium protected-path rules](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/file_system_access/chrome_file_system_access_permission_context.cc).

### Embedded-browser selection failure — 2026-09-03

The owner reports that the Windows picker opens and selecting the dedicated PRISM
folder immediately displays the generic AbortError advice. Live inspection showed
the original browser-only status unchanged, placing this failure before a folder
handle reached PRISM. It does not prove that Documents was selected or that the
folder contains system files. The exact native cause was previously discarded.

Selection now requests read access first. PRISM checks write permission and, when
needed, retains the selected handle in memory for an explicit Allow folder access
click. No library files are prepared until read/write access is granted. A denied
permission can be retried without choosing the path again during that page session.
Existing write grants skip that extra click. Successful connections remain saved
in the browser's connection database; automatic reopening still depends on browser
permission persistence. No access control is disabled or transferred between apps.

Errors identify selection, permission checking/granting, opening the library, or
remembering the folder and show the native response locally. These diagnostics are
not uploaded. The action and error appear near the top of the storage dialog.
Concurrent restore callers now wait for the same completed initialization.

A successful native connection in the owner's embedded browser is still an open
acceptance gate. A read-only picker may also be rejected by that host; this change
must not be represented as proof of universal desktop folder compatibility.

### Confirmed desktop host restriction — 2026-09-03

**Observed:** After the deployed read-only picker change, the owner again selected
PRISM and received `Choose folder: AbortError: Failed to execute
'showDirectoryPicker' on 'Window': The user aborted a request.` This exception is
before PRISM receives a handle; write permission and library code never execute.

**Verified local implementation evidence:** Read-only inspection of the running
ChatGPT desktop package `OpenAI.Codex_26.901.1978.0_x64` found that the browser host
initializes the `persist:codex-browser-app` session with both permission-request
and permission-check handlers that allow only `clipboard-sanitized-write`.
The browser host constructor and page-host setup invoke that configuration.
Electron identifies directory read/write requests as `fileSystem`; these handlers
reject that permission. The installed app was not modified, and no restriction
was disabled. This finding is specific to this installed build, not a claim about
all present or future OpenAI browsers.

**Consequence:** Direct directory-handle storage is incompatible with this desktop
host's current permission configuration. More picker mode/path changes cannot
resolve that denial. Feature detection of `showDirectoryPicker` is insufficient
proof of usable folder access. The earlier permission-flow change improved error
reporting and retry but did not resolve this compatibility blocker.

**Rejected direction:** The owner does not want a native companion. A tested
browser-to-browser transport also fails the requested independence when the peer
closes. Neither is the primary release solution. The recommended replacement is
an [encrypted synced library](SYNCED_LIBRARY.md) that each browser accesses directly
through the hosted site. This changes the device-only storage boundary and is not
yet implemented or approved for uploading the owner's source library.

Primary reference: [Electron session permission handlers](https://www.electronjs.org/docs/latest/api/session#sessetpermissioncheckhandlerhandler).
