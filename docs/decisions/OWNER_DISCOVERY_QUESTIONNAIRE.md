# PRISM owner discovery questionnaire

**Created:** 2026-08-19  
**Purpose:** turn the long-term vision into explicit product and research decisions without prematurely narrowing the ambition.

**Status:** owner interview completed on 2026-08-19. Confirmed answers are consolidated in `V0_DECISIONS.md`; remaining implementation choices are tracked in `OPEN_QUESTIONS.md`. This file remains the original question inventory and rationale.

Questions marked **P0** should be answered before the v0 prototype scope is frozen. **P1** questions should be answered before a serious user study. **P2** questions can remain open during early prototyping.

Answers can be short. “Unsure—use the recommendation” is a valid answer.

## Confirmed decisions

- Name: **PRISM — Personalized Representation and Information Streaming for Meaning**.
- First validation domain: bounded computing and AI-related sections; the source may be a large/full-textbook PDF, with deep transformation performed section by section.
- Governing objective: durable, transferable learning first; then speed and comfort among approaches that meet that learning standard.
- User control: Faster, Auto, and Deeper presentation, with visible tradeoffs.
- Long-term ambition: a genuinely new, cutting-edge way to absorb and learn information quickly—not merely an RSVP reader.
- Primary proof of learning: explain the idea accurately and apply it to a new example; require exact recall where the content demands it.
- Central retention horizon: seven days, with 24-hour checks used as interim diagnostics.
- First primary user: the project owner; test broader generalization later.
- Later consented remote asynchronous adult studies are acceptable; no in-person study is required.
- PRISM remains learner-only and reading-centered; instructor/course-author and quiz-site directions are excluded.

## A. Meaning of success

1. **Answered — What must a user be able to do for you to say they “learned” something?** Accurately explain the idea and apply it to a new example. Exact recall is required where precision is inherent to the content.
2. **P0 — When exact recall conflicts with conceptual transfer, which should usually win?** Recommendation: conceptual transfer, except when exact wording, symbols, or values are inherently important.
3. **Answered — How long must learning last for the core claim?** Seven days. Use 24-hour performance as an interim diagnostic.
4. **P0 — What is the initial promise?** “Understand in one session,” “remember for later,” “apply in a new situation,” or a deliberately staged promise.
5. **P1 — What eventual improvement would feel transformative?** For example, equal learning in 25% less time, better transfer in the same time, or a long-range 2× research target. This is an aspiration, not a marketing claim.
6. **P1 — Should PRISM sometimes decide that normal reading is already the best representation?** Recommendation: yes; choosing not to transform is part of an intelligent system.

## B. End-state experience

7. **P0 — Is the one-screen canvas a hard product requirement or the preferred north star?** Should Source mode, concept maps, and assessments be allowed to leave that canvas?
8. **P0 — How passive should the ideal experience be?** Fully watchable, occasional one-tap checks, short typed explanations, drawing/diagram actions, or different levels by mode.
9. **P0 — How much interruption will you personally tolerate?** A check every concept, every 3–5 minutes, only at section boundaries, or adaptively.
10. **P0 — May users skip checks and review?** Recommendation: yes, but the result must change from “verified learning” to “exposure only.”
11. **P1 — Should Faster–Auto–Deeper be one continuous control or three named presets?** Recommendation for v0: three understandable presets with an advanced fine-tuning control later.
12. **P1 — When Faster appears risky, should PRISM merely warn, automatically slow, or pause for a quick verification?** Recommendation: explain and offer a one-action repair; do not silently override the learner.
13. **P1 — Do you want optional narration or text-to-speech synchronized with visual frames?** If yes, should users normally hear or read language, rather than receiving identical words in both channels?
14. **P1 — Should note-taking, highlighting, and user questions be part of the central experience or deferred until after the stream?**
15. **P2 — How should the interface feel?** Scientific instrument, premium calm reader, futuristic learning interface, playful educational tool, or another aesthetic.
16. **P2 — Do you want gamification?** Streaks, mastery maps, challenges, none, or only evidence-based progress feedback.

## C. First users and situations

17. **Answered — Who is the first primary user?** The project owner personally. Later studies must test whether results generalize to other learners.
18. **P0 — What are the first three subject areas?** Select topics with different structures—for example history, biology, and computer science—to avoid overfitting to one kind of prose.
19. **P0 — What should the first prototype explicitly not support?** Mathematics, code, medical content, long narratives, second-language reading, or other high-complexity cases.
20. **P0 — What is the normal session context?** Focused desk study, commuting/mobile, work breaks, classroom, or mixed.
21. **P1 — What session length should feel ideal?** 5, 15, 30, or 60 minutes.
22. **P1 — English only initially?** If multilingual support matters, which languages and whether the learner is a native or second-language reader materially affect segmentation and evaluation.
23. **P1 — Which accessibility populations are important from the beginning?** General WCAG support is already required; this asks whether low vision, dyslexia, ADHD, motor access, or another need is a specific research track.
24. **P2 — Is the eventual user working alone, with an instructor, or both?** This changes authoring, dashboards, feedback, and responsibility for verifying source transformations.

## D. Content and source fidelity

25. **P0 — What should v0 accept?** Pasted text, URL, `.txt`, Markdown, EPUB, clean PDF, or another format. Recommendation: pasted text plus `.txt`/Markdown first.
26. **P0 — Where will the first passages come from?** Public-domain/open-license sources, material you own, private user uploads, or licensed publishers.
27. **P0 — May PRISM simplify and reorganize wording if the canonical source remains one click away?** Or should early experiments preserve wording and only change segmentation/presentation?
28. **P0 — May it combine multiple sources into one lesson?** If yes, how should disagreements and confidence be represented?
29. **P1 — Should generated examples and analogies be allowed automatically, require user approval, or remain off in v0?**
30. **P1 — Should generated diagrams be limited to explicit source relationships, or may they visualize a clearly labeled inference?**
31. **P1 — How much preprocessing delay is acceptable?** Instant but basic, 10–30 seconds, several minutes for a higher-quality lesson, or a fast draft followed by refinement.
32. **P2 — Should users be able to edit frames, corrections, questions, and diagrams and save a personal version?**

## E. Personalization and data

33. **P0 — Are you willing to complete a 1–3 minute calibration before a first session?** This can estimate comfortable phrase rate, context preference, and prior knowledge.
34. **P0 — Should v0 have a persistent learner profile or work without an account?** Recommendation: local anonymous profile first, account later.
35. **P1 — How transparent should adaptation be?** Always show “why this slowed down,” show it on request, or keep the player visually quiet while retaining an audit log.
36. **P1 — Which signals may v0 use?** Answers, confidence, response time, pause/rewind/replay, focus/visibility state, reading history, or fewer.
37. **P1 — Which future signals are acceptable as opt-in research?** Webcam gaze, hardware eye tracking, pupil size, EEG, heart rate, none, or undecided.
38. **P1 — Where should sensitive learning history live?** Only on device, encrypted cloud sync, institution-controlled storage, or user choice.
39. **P2 — Should PRISM build a long-term personal knowledge graph across sources and courses?** This could become the foundation for prerequisite detection and spaced review.
40. **P2 — May anonymized, consented interaction data improve the adaptation model?** Recommendation: only explicit opt-in, separable from normal product use, and never sell personal learning data.

## F. AI and generation policy

41. **P0 — Can v0 use paid cloud AI APIs, or must it be local/free?** Include a rough monthly development budget if cloud use is allowed.
42. **P0 — Is a human review step acceptable before a generated lesson is considered verified?** Recommendation: yes for research materials and textbook-style content.
43. **P0 — What should happen when the system cannot ground a claim or visual confidently?** Recommendation: fall back to the source representation and say why.
44. **P1 — Should the learner see provenance badges on every frame or only when opening Source view?**
45. **P1 — May AI add outside knowledge?** Recommendation: only in a separately labeled enrichment layer with its own sources, never silently inside the canonical lesson.
46. **P1 — Should PRISM generate assessment questions automatically, use a reviewed bank, or combine both?** Recommendation: generate drafts, then review and pilot before scoring research outcomes.
47. **P2 — Should advanced models eventually choose among text, diagram, animation, equation, analogy, and simulation, or should authors define allowed representations?**

## G. Research and proof

48. **P0 — Are you willing to use PRISM yourself and return for 24-hour and 7-day tests?**
49. **P0 — Can you recruit initial pilot users?** Roughly how many, and from where?
50. **P0 — Are you comfortable with a result where normal reading wins and PRISM changes direction?** Scientific credibility requires this possibility.
51. **P1 — Should the project publish negative and positive results, or remain private initially?**
52. **P1 — Is academic publication, a thesis, a conference paper, or collaboration with learning/vision researchers an eventual goal?**
53. **P1 — What evidence is required before public claims?** Internal repeated tests, preregistered study, peer review, or staged claim levels.
54. **P2 — Do you want formal human-subject research?** If so, university affiliation, consent, privacy review, and potentially IRB requirements must be planned before data collection.

## H. Product and ownership direction

55. **P0 — Is this initially a personal tool, portfolio/research project, open-source project, or intended company?** It can evolve, but the first identity affects scope.
56. **P0 — Should the repository and early app remain private?**
57. **P1 — Local desktop-like web app, hosted private web app, or public hosted service first?**
58. **P1 — What time and budget can you realistically invest over the next three months?**
59. **P1 — Are you the sole product owner and initial developer, or will others contribute design, research, or engineering?**
60. **P2 — If commercial, who eventually pays?** Individual learners, schools, universities, employers, publishers, or another customer.
61. **P2 — Do you want patents or defensible research/IP explored before public release?** This should be discussed with qualified counsel before disclosure decisions; no patentability assumption is made here.
62. **P2 — What is the preferred brand tone?** Serious scientific, ambitious/futuristic, warm educational, or a blend.

## I. Technical and delivery constraints

63. **P0 — Any required or forbidden technologies?** Frontend stack, backend language, database, AI provider, analytics, or hosting.
64. **P0 — Must the first version run fully on Windows and locally?**
65. **P1 — Which devices must the first user study support?** Specific desktop/laptop screen sizes, tablets, or mobile.
66. **P1 — Is internet access assumed during learning sessions?**
67. **P1 — Should lessons and progress be exportable?** If yes: JSON research package, printable report, Anki-style cards, or another format.
68. **P2 — Are mobile, AR/VR, wearables, or eye-tracked displays part of the eventual north star?** Rank them rather than putting all into the roadmap.

## Recommended answer order

1. Answer the remaining P0 questions 2, 4, 7–10, 18–20, 25–28, 33–34, 41–43, 48–50, 55–56, and 63–64.
2. PRISM can then freeze a v0 decision record and select three test passages.
3. Answer P1 questions while the mechanism prototype is being designed.
4. Leave P2 choices open until early evidence reveals what is actually valuable.
