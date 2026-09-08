# PRISM portfolio walkthrough

**Prepared:** 2026-09-03; aligned with accepted release direction 2026-09-07  
**Status:** script and capture plan; footage, narration, upload, and final acceptance pending.  
**Target:** 2:45, with a hard export ceiling of 2:55.

## Release scope

This is a portfolio walkthrough under the [release plan](FINAL_PORTFOLIO_RELEASE_PLAN.md),
not an entry for the expired challenge. The accepted [Cloudflare/account direction](../architecture/CLOUDFLARE_HOSTING.md)
uses optional Google/GitHub login for private cloud storage. Account and deployment
footage must wait for real implementation and verification. Hosting and publishing
remain on hold while the owner finishes local changes.

## Story

Show what a reader can accomplish with their agent: turn a difficult paper into a useful, saved explanation, check it against the original, and improve the same lesson when something remains unclear. WebMCP must be visible in the interaction, not merely mentioned in an end card.

The primary example is [Recursive Language Models](https://arxiv.org/abs/2512.24601), using the complete 43-page version already used for the real lesson. Briefly show a real lesson from [Physical Geology, second edition](https://opentextbc.ca/physicalgeology2ed/) to demonstrate a second field. Confirm version, page count, permissions, and individual figure credits against the actual imported files before capture.

Do not regenerate the entire library just to record it. Inspect and use the genuinely agent-authored full-paper lesson where suitable, then record a new clarification and accepted revision. Capture import and authoring separately if necessary; label previously generated output and compressed waiting accurately. If the non-CS lesson is incomplete, author and inspect a focused section through WebMCP before recording that segment.

## Shot list and draft narration

Narration is a draft: match every statement to the verified footage. Once cloud accounts ship and pass acceptance, replace the planned-feature sentence with an accurate description of the demonstrated account flow. Aim for a calm 125–140 words per minute, leaving room for clicks and reading.

| Time | Picture and action | Narration |
|---|---|---|
| 0:00–0:12 | Open on the strongest useful lesson visual. Show the reader's clarification request beside it. Keep the actual content legible. | “A research paper can be available to you without being understandable. PRISM lets you work with your agent to turn that paper into a reading document you can inspect, keep, and improve.” |
| 0:12–0:32 | Establish the source and its 43-page scope. Show a real request in the agent interface and the resulting coverage plan. | “Here is Recursive Language Models, including its appendices. I want a detailed explanation of how it works, what the experiments show, and where it fails. I choose the depth and review what the lesson will cover.” |
| 0:32–0:52 | Show genuine WebMCP evidence-reading and lesson-writing calls. Use brief, readable labels for actual operations. Show the source page or figure the agent inspects. | “Through WebMCP, my agent works directly with PRISM: it reads bounded source evidence, inspects the relevant figures, and writes structured lesson sections. PRISM saves the work progressively. The waiting here is shortened; the result comes from the real run.” |
| 0:52–1:27 | Read a substantial paragraph, one helpful visual, and a result with its caveat. Open a citation or source figure at a legible scale, then return to the exact lesson. | “The result is a persistent lesson, with explanations, equations, and visuals where they help. Here, a step-by-step diagram explains how the model works with information outside its immediate context. Experimental results stay alongside their limitations. I can follow a citation back to the original page and check the explanation for myself.” |
| 1:27–2:02 | Send the clarification below. Show the proposed addition, actual learner acceptance, and the revised section in the same lesson. Keep a before/after visible long enough to read. | “But I still have a question: how is that different from simply summarizing a long document? I ask for a concrete example. The agent proposes an expansion grounded in the paper. I review and accept it, and the explanation becomes part of this same lesson. Revision history preserves the earlier version.” |
| 2:02–2:24 | Open the real geology lesson. Show a geological explanation and a relevant original figure or genuinely useful generated diagram. Avoid a second long generation sequence. | “The workflow also applies outside computing. This geology example uses the same tools to explain a physical process, with its own source evidence and an appropriate visual. The application provides the rendering tools; the agent authors the subject-specific lesson.” |
| 2:24–2:45 | Reload saved work. If account-backed cloud acceptance is complete, show cloud save status and the same verified lesson in another browser; otherwise show local persistence only. End on a clean lesson view with the public URL. | “PRISM starts empty and works with the agent you already use. Read and save locally without an account. Optional cloud accounts are the next step for keeping your library across browsers. The goal is simple: make difficult reading useful, and keep improving it as your understanding grows.” |

### Clarification to record

> I still don't understand how keeping the document in an external environment differs from summarizing it into the context window. Add a concrete worked example to this lesson. Separate what the paper demonstrates from your teaching analogy, cite the relevant pages, and keep the existing detail.

Use this only if the current lesson leaves that question meaningfully unresolved. Otherwise choose a real gap discovered during review. Do not stage a defect in the lesson merely to repair it on camera.

## Capture and edit

1. Rehearse the main source → evidence → saved lesson → proposed revision → learner acceptance path in the ChatGPT native browser. Confirm the final lesson is actually available there. Approval remains a real learner action.
2. Inspect the research explanation and non-CS example for usefulness, unsupported claims, and readable figures. Do not substitute schema validation for a content review.
3. Record short takes at 1920 × 1080, ideally 30 fps, using real UI and actual agent actions. Keep the agent visible for the request and WebMCP portions; use the wider lesson view for reading. Test capture and audio before the full take.
4. Capture generation separately from narration. Use actual measured timing if displaying a speed claim. Label cuts that omit waiting. Never invent tool calls, approvals, timing, or outputs.
5. Record approximately 2½ minutes of narration from the final script. Prefer the creator's natural voice; a user-selected synthetic voice is an alternative only after confirming an available production method. Add accurate captions and leave out background music unless there is a clear reason to use it.
6. Use direct cuts and restrained close-ups. Give important text time on screen. Avoid decorative transitions, rapid scrolling, enormous cursor effects, tiny full-window text, or a long logo introduction.
7. Keep recovery keys, account menus, private documents, desktop notifications, and unrelated tabs out of every take. Connect the recording browser before capture. Include source credits for reproduced material.

## Acceptance before upload

- Exported video is under three minutes, 1080p landscape, with clear audible narration and no clipped lines.
- Every filmed operation works on the deployed site, with no local-only development feature presented as public.
- At least one genuine WebMCP read and one write are evident; the human request and the resulting product change are understandable.
- Citation inspection and a real accepted revision are shown. The revised lesson persists after reload and appears in the second browser before a sync claim is included.
- Both sources and every reused figure have the required attribution and reuse permission.
- No content is hardcoded into the application for the demo. Captured lessons were authored through WebMCP.
- No recovery key, private source, credential, or unrelated personal information appears in footage or audio.
- Public YouTube link plays signed out, with audio, at the intended quality. Verify the published duration and processing status.
- Public app URL, public repository/branch, video URL, and implementation description are ready for the submission form. Document pre-existing work versus the challenge-period extension.

## Current boundaries

The public v10 site and local quality gates were verified in the preceding release pass; see [submission readiness](SUBMISSION_READINESS.md). A complete filmed generation/revision rehearsal, final non-CS lesson review, recording, audio, and public upload remain unverified. This plan does not claim those steps are complete and does not itself submit the entry.
