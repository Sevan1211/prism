# Independent PDF corpus audit

**Run:** 2026-09-03, Windows, Node.js 24, PDF.js 6.2.108, PRISM `pdfjs-evidence-v7`.

Run `npm run audit:pdf` after manually downloading the public documents below into `benchmarks/downloads`. Downloads are ignored by Git and never bundled into the website. The audit fails if a required file is absent; it does not silently skip or fetch it.

| Document | Local filename | Pages | Extracted characters | Elements | Candidate / source-only elements |
|---|---|---:|---:|---:|---:|
| [Recursive Language Models v3](https://arxiv.org/abs/2512.24601) | recursive-language-models-v3.pdf | 43 | 137892 | 808 | 664 / 144 |
| [Physical Geology, second edition, chapter 10](https://opentextbc.ca/physicalgeology2ed/front-matter/download-a-pdf/) | physical-geology-ch10.pdf | 43 | 70137 | 573 | 383 / 190 |
| [BERT v2](https://arxiv.org/abs/1810.04805) | bert.pdf | 16 | 64200 | 642 | 628 / 14 |

SHA-256:

- RLM: `8567362c22768d9b50d4a4a8d63bb28dda2c2b2051be30d67f70f645170429ca`
- Geology: `354f97088b9ca7802398a7793f9103fd669ca5e5d86e688cf3d94339f5bff7bb`
- BERT: `5692a5514787a8c6727b4ff3b726a3385798bc68e12138d1d4af83947e2acf6e`

All 102 pages were parsed. The audit checks finite page coordinates, unique anchors, expected page counts, retained independent content terms, the isolated-abstract regression, and conservative handling of mixed table regions. Sixteen BERT pages were inferred as two-column candidates. BERT was initially held out; after it exposed numeric rows within otherwise readable columns, a general numeric-row guard was added, so it is now a regression source rather than an untouched future holdout.

Observed extraction/classification time was approximately 0.42 seconds for RLM, 0.16 seconds for geology, and 0.20 seconds for BERT in this local Node audit. These exclude downloading, browser import, hashing, IndexedDB writes, image rendering, and model interpretation. They are not user-facing latency claims.

The normal web tests also exercise a separately licensed 489-page Computer Networks fixture on selected pages, rotations, synthetic scans, damaged text, column order, and interruption/recovery behavior. Synthetic fixtures isolate engineering contracts; they do not establish performance on natural scanned documents.

## What this does not prove

“Candidate” means usable with a warning, not verified correct. No OCR accuracy, table reconstruction accuracy, equation reconstruction accuracy, multilingual coverage, semantic fidelity percentage, or learning outcome was measured. Page classification is heuristic. A table can still evade detection. The original PDF remains available and the agent must inspect relevant visual evidence.

The live browser rehearsal indexed RLM under the prior supported v5 index and inspected original figures and tables through WebMCP plus browser vision. The corpus command above exercises current v7 code separately; these are different pieces of evidence. A parser upgrade does not silently rewrite existing lesson anchors.

## Rights

RLM v3 is CC BY 4.0. Physical Geology is CC BY 4.0 except where noted; verify each selected figure's attribution. BERT is used only as a local engineering input and is not redistributed here. The cited source pages provide the respective rights notices. Source PDFs and generated lessons do not enter the static release.
