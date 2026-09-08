# Source folders

**Implemented locally:** 2026-09-07. Related: [design direction](../product/DESIGN_DIRECTION.md), [browser-local architecture](DEVICE_LOCAL_WEB_ARCHITECTURE.md).

The Library supports named folders for subjects or other learner-chosen
organization. A source belongs to at most one folder; sources without a valid
assignment appear in **Unfiled**. **All sources** always includes every source.
Folders are flat, with no required subject taxonomy or nested hierarchy.

Learners can create, rename, and remove folders, move a source with its Folder
selector, and import directly into the selected folder. Names are trimmed, limited
to 80 characters, and checked for case-insensitive duplicates. Search operates
within the selected folder; sorting supports newest first and title A–Z.

Removing a folder requires a PRISM confirmation and removes only its organizational
metadata and assignments. The dialog names the folder and explains that PDFs,
lessons, grants, and reading history are retained. Cancel and Escape leave the
folder untouched. Successful removal opens Unfiled and returns keyboard focus to
that heading. Removing a source also removes
its folder assignment. If a folder disappears during a move, the write fails with
a visible error; stale assignments to absent folders are shown as Unfiled. If import
succeeds but folder assignment fails, the PDF remains imported and the learner is
told to move it from Library.

## Persistence

Browser vault schema 13 adds `library_folders` (key `id`, name and creation time)
and `source_folders` (key `source_id`, `folder_id` index). Migration creates missing
stores without modifying existing source records or copying files. Folder removal
and assignment removal share one transaction. Folder moves include the folder
store in their write transaction to serialize against concurrent removal.

Operations use the existing library storage boundary. The records are included in
portable snapshots and, for already connected experimental sync libraries, the
existing transactional outbox. This neither enables sync nor grants agent access.
No account or cloud request is required for local folder organization. Remote folder
round trips have not been tested; linked browsers need the updated schema. This
does not change the accepted [Cloudflare hosting plan](CLOUDFLARE_HOSTING.md).

Metadata-only library notifications refresh folders and counts in other tabs.
The current folder filter is a view choice, reset to All sources on a full reload;
the folders and source assignments themselves persist. Moving between the library,
source overview, and source lessons keeps that view state in the shared shell.
Opening a source highlights its containing folder; selecting a folder returns to
its list. The dedicated PDF and lesson readers retain their reading layouts.

The shared shell uses the window width with 24px desktop outer padding. Source
titles retain PRISM's reading typography; source content aligns with
the library list rather than adding a second centered container.

The single application header now holds PRISM, Library, Add PDF, and consistent
agent/help/storage/appearance controls. It replaces the stacked application bar
and Sources banner. Mobile exposes the utility controls from a keyboard-accessible
disclosure; the Library label, logo, and import remain visible. Existing source
URLs and stored records are unchanged by the display-name change.

## Local checks

Storage tests cover reopening, renaming, moving, invalid names, duplicate names,
missing destinations, safe removal, source deletion cleanup, schema-12 migration,
portable snapshots, and tracked sync writes. Chrome testing used temporary PDFs in
an isolated browser context and exercised create, rename, move, direct-folder import,
remove-folder-without-source-loss, reload, search, and sort. Layout checks covered
1440, 768, 390, and 320 pixels in light and dark themes. No sample sources are shipped
or added to the owner's library by these tests.

Keyboard creation, save, cancel/focus return, duplicate-name feedback, cross-tab
rename refresh, and long-name reflow also passed. The final frontend suite passes
192 tests across 50 files; lint, TypeScript/production build, and documentation
checks pass. This is local acceptance evidence, not deployment or remote-sync proof.

The shared-shell follow-up passed library/source alignment checks at 1920, 1440,
768, 390, and 320 pixels in both themes. Navigation retains folder/search/sort;
folder creation from a source returns focus to the new folder heading. Long source
titles, Reader navigation, all four header utilities, import isolation, mobile
disclosure keyboard/Escape/outside-click behavior, reduced motion, and forced colors
were exercised in Chrome with temporary documents. The 192-test frontend suite,
lint, production build, and documentation checks also pass after the header update.

The removal-dialog follow-up passes 200 tests across 51 files. Chrome checks cover
source and folder cancellation, Escape, focus containment and return, retained
sources after folder removal, deletion persistence, long names, light/dark/mobile
layouts, and forced colors. Unit checks exercise failure/retry and block duplicate
confirmation or dismissal during pending removal. These checks use temporary local
documents; remote deletion propagation was not exercised.
