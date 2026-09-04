# A library shared by independent browsers

**Reviewed:** 2026-09-03  
**Status:** deployed prototype with a verified public source/brief sync slice.
The owner approved encrypted cloud copies and account-free recovery-key enrollment
on 2026-09-03. Remaining acceptance gates are listed below; the approval does not
turn existing source-agent grants into global grants.

## Required outcome

The owner requires one library of sources, extracted structure, lessons, revisions,
and reading progress across regular browsers and ChatGPT's native browser. Each
browser must work after the others close. No installed companion is acceptable.
Repeated folder selection and manual export/import are not the primary workflow.
The public website must remain usable without a mandatory ChatGPT or PRISM account.

Browser support means verified behavior in each named browser, not merely the
presence of an API. ChatGPT's native browser is the first acceptance environment.
Lesson generation and revision continue through the page's existing WebMCP tools.

## Findings and alternatives

**Verified implementation:** The installed desktop host denies filesystem
permissions before PRISM receives a directory handle. The precise evidence is in
[device-local architecture](DEVICE_LOCAL_WEB_ARCHITECTURE.md#confirmed-desktop-host-restriction--2026-09-03).
Changing picker options cannot fix that host policy.

**Established platform behavior:** Browser storage is on the device, but is
isolated by browser profile and site origin. It is not stored in a search engine.
ChatGPT documents its separate browser profile. Thus local storage can be real
device storage and still fail to provide a shared device library.
[MDN storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria),
[ChatGPT browser](https://learn.chatgpt.com/docs/browser).

| Approach | Independent browsers | Fit for this request |
|---|---|---|
| OPFS / IndexedDB alone | No shared state | Keep as a cache or explicit unsynced mode |
| Same selected physical folder | Only in hosts that grant access | Incompatible with the installed native browser |
| Folder inside a desktop cloud-drive directory | Still requires local folder access | Does not remove the native-browser blocker |
| Native companion | Technically possible | Rejected by owner |
| Browser-to-browser forwarding | Requires an available peer | Rejected as the primary architecture |
| Cloud-drive API | Possible with provider authorization | Adds provider login/consent and token recovery |
| Hosted encrypted library | Each browser talks directly to storage | Approved and implemented; hosted acceptance in progress |

The earlier WebRTC experiment established a working encrypted transport and a
synthetic revision check between Chrome and the native browser. It did not prove
durable library synchronization, and a disconnected peer stopped requests. Do not
ship that dependency as the answer to independent access.

Google Drive's application-data API is a real remote-storage alternative, unlike
selecting its desktop folder. It requires OAuth authorization; it is not an
account-free route. A provider integration would also need testing in the embedded
browser. [Google Drive application data](https://developers.google.com/workspace/drive/api/guides/appdata).

## Recommended experience

1. A first visitor starts with an empty library and chooses **Enable encrypted
   sync**. The dialog explains that encrypted copies leave the device and names
   the storage service. Declining keeps the existing local library usable.
2. PRISM creates a private library and supplies a recovery key to save. No email,
   password account, or ChatGPT sign-in is required by this mode.
3. In another browser, the user chooses **Connect existing library** and enters
   that key once. Subsequent visits reopen the remembered library while that
   browser retains its credentials. Clearing site data, private browsing, revoked
   access, or lost credentials can require reconnecting.
4. Sources, lessons, and revision history synchronize automatically while online.
   Reader progress uses the same library. Original PDFs and indexes are downloaded
   as needed, so opening one lesson does not fetch every textbook.
5. The agent operates the actual PRISM page in ChatGPT's native browser. Chrome can
   be closed. Changes committed by that page appear in the next connected browser.

A new browser cannot privately identify the owner's library without a credential,
an account, or a pairing step. Do not use IP addresses, machine fingerprints, or a
public library ID as identity. The one-time recovery-key flow replaces folder
permissions; it does not pretend recognition happens automatically on first use.

Start with recovery-key enrollment. A shorter, expiring pairing-code experience
can follow only with a reviewed key-transfer protocol. A short code alone must
never be the encryption key or permanent authorization secret.

## Storage and trust boundary

```text
Chrome / Edge cache  <-- authenticated HTTPS -->  PRISM sync service
                                                  | D1: access and commit state
ChatGPT browser     <-- authenticated HTTPS -->    | R2: encrypted library objects
                                                  |
Other linked browser <-- authenticated HTTPS -->--+
```

**Verified hosting state:** The existing PRISM Site is public. Releases 6 onward
add a Worker, D1 authorization/revision metadata and R2 encrypted files to the
previous static SPA. Anonymous visitors can open the application; library API
access still requires its credential. Public site access does not grant library
access.
[Sites capabilities](https://learn.chatgpt.com/docs/sites).

The implemented division is:

- **On linked browsers:** decryption keys, original readable files, PDF parsing,
  rendering, searching, and caches. Source-grounded agent responses still follow
  the learner's disclosure controls.
- **In D1:** opaque library and device identifiers, hashed authorization material,
  quotas, acknowledged commit heads, and deletion state. No plaintext source
  titles, lesson text, questions, source hashes, or extracted passages.
- **In R2:** encrypted source chunks, illustrations, indexed records, lessons,
  immutable revisions, and authenticated manifests. No public bucket or public
  object URLs. Every read/write is authorized by the server.

Encrypt before upload, using a reviewed construction over standard Web Crypto
primitives. Separate data-encryption keys from API authorization credentials.
AES-GCM requires an IV unique for each encryption under a key; authenticate object
identity, format, and revision as associated data. Use fresh per-object key
material and a defined chunk-number scheme rather than trusting random retries to
avoid reuse. Reject modified, truncated, substituted, and unsupported-version
objects before applying them. This is a protocol requirement, not a claim that
selecting AES-GCM alone makes the system secure.
[MDN AES-GCM parameters](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams).

The service necessarily sees some operational metadata, including request times,
network addresses, ciphertext sizes, and library/device relationships. The site
code can access plaintext while a library is unlocked; browser encryption does
not defeat malicious delivered JavaScript, a compromised device, or disclosure to
an authorized agent. Do not claim the site operator can never access plaintext.

Recovery secrets must not enter URLs, analytics, logs, WebMCP results, or this
repository. Store per-browser authorization separately from encryption material.
Provide a list of connected browsers and a revoke action. Revocation stops future
server access; it cannot erase data already downloaded by another browser. A lost
recovery key plus loss of all linked browsers means no account-free recovery.

## Correct synchronization

The current folder journal is useful evidence for a portable data model, but is
not a ready-made network sync engine. Its callback writes local IndexedDB before
the journal append, and conflicting folder histories currently stop with an error.
Blindly uploading that journal could acknowledge a local write while losing its
remote commit, or turn every concurrent edit into manual backup recovery.

Required write sequence:

1. Persist a local mutation and its durable outbox entry in one transaction.
2. Encrypt/upload missing immutable objects in bounded, resumable chunks. Store
   sensitive binary content in R2, not a database text field or one giant JSON body.
3. Commit an idempotent change with the expected server revision. Advance the
   authoritative head atomically; interrupted retries cannot create duplicates.
4. Mark **Synced** only after the server acknowledges that commit. An interrupted
   response is resolved by mutation ID, not by assuming success or failure.
5. Pull unseen commits on open, focus, reconnect, and bounded polling. Apply them
   transactionally and notify the Reader/lesson UI without losing selection.

Unrelated record changes may merge automatically after checking their bases.
Competing changes to the same lesson section must preserve both proposals and
offer a readable conflict decision. Never silently overwrite with the latest
timestamp. A source's fingerprint, coverage ledger, visual references, and revision
history travel together; a lesson must not point to unavailable or mismatched PDF
bytes. Deletions need tombstones so an offline browser cannot resurrect a removed
record. Permanent erasure and retention policy need an explicit, tested flow.

R2 supports strongly consistent reads after acknowledged writes, but unconditional
competing writes can still overwrite one another. Use a single authoritative
revision mechanism; avoid caching mutable commit-head responses at a CDN.
[R2 consistency](https://developers.cloudflare.com/r2/reference/consistency/),
[conditional writes](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/).

Visible states: **Saved on this browser**, **Syncing**, **Synced**, **Offline—changes
pending**, **Needs attention**. Closing a browser with unsent changes does not
magically upload them. Offline reading requires already downloaded material and a
cached application shell; it must be tested before being advertised.

## Migration and permissions

Existing local/folder libraries remain intact until migration is verified. Present
the actual selected sources and data categories before enabling their encrypted
upload. A grant to an agent is not consent to store a whole source on a server.
Do not copy portable source records into an automatically enabled global grant.

For source disclosure, offer one visible, scoped approval dialog when an agent
first requests access, with clear Allow/Deny controls. Remember the learner's
approved fingerprint and scope for later calls in that client; do not prompt for
every text packet or figure within that permission. Expanded scope, a changed
source, and destructive actions keep their appropriate review boundaries.

The owner removed the folder feature from this release. Browser-only storage and
encrypted sync are the two supported modes. Localhost and the public origin need
explicit enrollment in the same library; they cannot share cookies or cache keys.

The storage dialog explains first-browser setup and subsequent connection with
the same recovery key. Creation offers a `.txt` key download; an existing connection
can verify a learner-supplied key locally before exporting it. The connection stores
a non-extractable derived encryption key, not the original recovery secret. A lost
secret cannot be displayed or regenerated. Downloading a key is not proof of backup.

## Delivery and acceptance gates

1. **Storage boundary decision:** approve encrypted remote copies and publish
   accurate local/synced descriptions. Check account-specific Sites capacity and
   set enforceable upload/storage/rate limits. Public-beta inclusion is not a
   guarantee of unlimited free hosting. No personal data is uploaded during this
   research. [Sites limits](https://help.openai.com/en/articles/20001339).
2. **One full vertical slice:** implement backend authorization, encrypted chunk
   storage, recovery-key enrollment, durable outbox, and revision checks for one
   real source and its lesson. Use generated synthetic bytes for transport and
   security tests; author actual lesson content through WebMCP.
3. **Native-browser independence:** import in Chrome, wait for acknowledged sync,
   close its PRISM tab, connect in ChatGPT's native browser, inspect original pixels
   and text, create/revise the same lesson through native WebMCP, then reopen Chrome
   and verify exact content and revision identity. Repeat with the source browser
   fully exited when the owner can do so without interrupting unrelated work.
4. **Recovery and concurrency:** reload/restart each browser, interrupt a large PDF
   transfer, lose a commit response, work offline and reconnect, edit concurrently,
   corrupt a chunk, try an unauthorized library, revoke a browser, and delete while
   another client is offline. Preserve data or fail visibly in every case.
5. **Performance and coverage:** time cold source download separately from warm
   lesson loading and sync acknowledgment; confirm lesson edits do not reupload
   PDFs. Verify Chrome, Edge, the native browser, then Firefox/Safari before making
   broader compatibility claims. Test fresh anonymous public access as well.

## Implementation and measured evidence — September 3

The Worker in `apps/sync/worker.ts` serves authenticated D1 revision metadata and
immutable encrypted R2 chunks. Browser records and the durable outbox share an
IndexedDB transaction. Four-MiB uploads persist their ciphertext and retry state.
HKDF separates authorization from encryption; each immutable object derives a
fresh AES-GCM key from its random 256-bit ID. The nonce is used once per object
key. Retried uploads reuse ciphertext. No recovery secret enters server storage.

The UI supports recovery-key creation/enrollment, remembered connections, sync
status, conflict decisions, browser revocation and cloud-library deletion. Source
agent grants and local audit receipts remain browser-specific. Conflict recovery
records are retained locally; a browsable recovery archive is still outstanding.
App limits are 512 MiB per library, 5 GiB total ciphertext, 100 active libraries,
20 connected browsers per library, and bounded creation/request rates. These are
enforced application limits, not verified account-level hosting entitlements.

Verified locally:

- 33 web test files / 124 tests passed; web/Worker type checks and lint passed.
- Real D1/R2 emulation passed encrypted one-MiB round trip, idempotent upload and
  commit retry, competing revision rejection, unauthorized/cross-library denial,
  browser revocation, cross-origin denial and cloud deletion (381 ms combined).
- Native browser connected with the same recovery key as Chrome without a folder
  picker, imported/indexed the openly licensed 43-page Physical Geology chapter,
  and showed Synced. Chrome independently received the same source and index.
- With the Chrome test tab closed, native WebMCP read original evidence and saved
  a new source-bound lesson brief. This is a sync example, not a full lesson run.

Verified on the public service: native-browser import/indexing of the same 43-page
chapter; Chrome enrollment and PDF download/decryption with photograph/caption
inspection; native WebMCP brief creation while Chrome's test tab was closed; the
same brief ID after Chrome reopened with remembered credentials. Hosted transport
and authorization checks passed in 6.58 seconds, excluding cleanup. Existing
personal libraries remain intact and were not copied into the isolated test library.

Still requiring live acceptance: full lesson/revision synchronization, interrupted
browser transfers, offline/reconnect and visible same-record conflict recovery.
Firefox, Safari, Edge and a fully exited Chrome process have not been checked. A
security review is still required before describing this protocol as independently
audited encryption. The local Wrangler process exited intermittently during build
work; hosted operation has no dependency on that local process.

Release 8 deployed successfully at 2026-09-04 03:46 UTC to
<https://prism-reading.sevan4355.chatgpt.site>. Source commit:
`0c03480c20187812fc22e0cb790ae195821818ec` in the separate Sites source repository.
Saved version: `appgprj_6a99edb4862c8191a88846a5f2a29a6a~appgver_c5449471eba48191b1a3590aeebe0281`.
Deployment: `appgdep_6a9a3edb8a888191ba0acb32b832c648`.
Anonymous requests to `/sources`, a source's `/lessons` route, and a `/lessons/:id`
route returned HTTP 200 with application HTML and no redirect. The release archive
has 278 files, including schema-only migrations, and no user PDFs or local state.

After acceptance, both public browsers returned to their original local/folder
libraries. Chrome's original 489-page Computer Networks source remained present.
Its storage dialog is ready for the owner to enable sync and save their own key;
the native browser's existing-library connection dialog is ready for that key.
The isolated public geology test library is separate from that migration.
