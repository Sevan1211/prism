import type { SourceSection } from '../types'
import type { IndexedSourcePage } from '../storage/sourceIndexTypes'
import { textLines } from '../storage/sourceIntelligence'

export const CONTENTS_SCANNER_VERSION = 'contents-v2'
type Line = ReturnType<typeof textLines>[number]
type Candidate = { page: number; line: Line; height: number; body: number; score: number; reasons: string[]; tocLevel?: number }
export interface ContentsScan { sections: SourceSection[]; warnings: string[] }

const clean = (value: string) => value.normalize('NFKC').replace(/\s+/g, ' ').trim()
// Display fonts often encode letter spacing as spaces. This key is for matching,
// never a fabricated replacement for the author's words.
const compact = (value: string) => key(value).replace(/\s/g, '')
const key = (value: string) => clean(value).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')
const height = (line: Line) => line.bbox[3] - line.bbox[1]
const numbered = (title: string) => /^(\d+(?:\.\d+)*|[A-Z](?:\.\d+)+)[.)]?\s+\p{L}/u.exec(title)?.[1]
const major = (title: string) => /^(?:chapter|part|appendix)\s+(?:\d+|[a-z]+)\b/i.test(title)
const frontMatter = /^(?:preface|foreword|introduction|acknowledg(?:e)?ments|about (?:the (?:author|book)|this book)|bibliography|references|notes|glossary|index|conclusion)s?$/i
const tocRow = (title: string) => /(?:\.{2,}|…|\s)\s*(?:\d+|[ivxlcdm]+)\s*$/i.test(title)
const marginKey = (title: string) => key(title.replace(/^\d+\s+|\s+\d+$/g, ''))
const headingKey = (title: string) => compact(title.replace(/^(?:(?:chapter|part|appendix)\s+(?:\d+(?:\.\d+)*|[a-z]+)|\d+(?:\.\d+)*)[.):]?\s+/i, ''))

function displayHeading(title: string): string {
  // Normalize only unambiguous conventional labels. Unknown letter-spaced titles
  // need source inspection; joining all letters would destroy word boundaries.
  const labels = ['Preface', 'Foreword', 'Introduction', 'Acknowledgments', 'Acknowledgements', 'References', 'Bibliography', 'Index', 'Glossary']
  if (title.split(' ').filter(word => word.length === 1).length >= 4) {
    const matched = labels.find(label => compact(label) === compact(title))
    if (matched) return matched
  }
  return title.replace(/^(chapter|part|appendix)\s+/i, word => word[0].toUpperCase() + word.slice(1).toLowerCase())
}

function printedRows(lines: Line[]) {
  return lines.flatMap(line => {
    let text = line.text
    // PDF extractors often separate the right-aligned page-number column.
    const pageCell = lines.find(other => other !== line && /^\d+$/.test(other.text)
      && other.bbox[0] > line.bbox[2] && Math.abs(other.bbox[1] - line.bbox[1]) < height(line) * .5)
    if (pageCell) text += ` ${pageCell.text}`
    const match = /^(.+?)(?:\s*\.{2,}\s*|\s+)(\d+)\s*$/.exec(text)
    if (!match || !/\p{L}/u.test(match[1]) || match[1].length > 180) return []
    return [{ title: match[1].replace(/[.\s]+$/, ''), printedPage: Number(match[2]), x: line.bbox[0] }]
  })
}
function hasContentsLabel(lines: Line[]): boolean {
  return lines.some(line => /^(?:tableof|brief)?contents(?:ataglance|indetail)?$/.test(compact(line.text)))
    || printedRows(lines.filter(line => /\.{3,}|…{2,}/.test(line.text))).filter(row => row.printedPage > 0).length >= 4
}

function median(values: number[]): number {
  const ordered = values.filter(value => value > 0).sort((a, b) => a - b)
  return ordered[Math.floor(ordered.length / 2)] ?? .014
}

/** Derive navigation from geometry and document-wide evidence; never rewrite the evidence index. */
export function scanDocumentContents(pages: IndexedSourcePage[], pageCount: number): ContentsScan {
  const warnings = new Set<string>()
  const prepared = [...pages].sort((a, b) => a.page_number - b.page_number).map(page => {
    // Old supported indexes may have only elements. Preserve that evidence as a weaker fallback.
    const lines = (page.fragments?.length ? textLines(page.fragments) : (page.elements ?? []).map(element => ({
      text: element.text, bbox: element.bbox_normalized,
    }))).map(line => ({ ...line, text: clean(line.text) })).filter(line => line.text)
    const prose = lines.filter(line => line.text.length >= 45 && line.bbox[1] > .1 && line.bbox[3] < .9)
    return { page, lines, body: prose.length >= 2 ? median(prose.map(height)) : 0 }
  })
  // Sparse slides, forms and code pages have no dependable prose baseline.
  // Use the document's observed typography, never an invented default font size.
  const documentBody = median(prepared.flatMap(({ lines }) => lines
    .filter(line => line.text.length >= 15 && !major(line.text))
    .flatMap(line => Array.from({ length: Math.min(4, Math.ceil(line.text.length / 30)) }, () => height(line)))))
  for (const item of prepared) if (!item.body) item.body = documentBody
  const contentsPages = new Set<number>()
  let lastContentsPage = -Infinity
  for (const { page, lines } of prepared) {
    const rows = printedRows(lines)
    const numberedRows = rows.filter(row => numbered(row.title)?.includes('.') && row.printedPage > 0)
    const orderedMiniContents = numberedRows.length >= 4
      && new Set(numberedRows.map(row => numbered(row.title)!.split('.')[0])).size === 1
      && new Set(numberedRows.map(row => row.printedPage)).size >= 3
      && numberedRows.every((row, index) => !index || row.printedPage >= numberedRows[index - 1].printedPage)
    if (hasContentsLabel(lines) || (rows.length >= 5
      && (page.page_number - lastContentsPage <= 2 || orderedMiniContents))) {
      contentsPages.add(page.page_number)
      lastContentsPage = page.page_number
    }
  }
  // Running furniture can differ on recto/verso pages. Count occurrences across pages,
  // not within one page; use bands so headers that drift slightly still match.
  const furniture = new Map<string, Set<number>>()
  for (const { page, lines } of prepared) for (const line of lines) {
    const band = line.bbox[1] < .13 ? 'top' : line.bbox[3] > .87 ? 'bottom' : ''
    if (!band) continue
    const label = `${band}:${marginKey(line.text)}`
    const seen = furniture.get(label) ?? new Set<number>()
    seen.add(page.page_number)
    furniture.set(label, seen)
  }
  const candidates: Candidate[] = []
  for (const { page, lines, body } of prepared) {
    if (page.profile?.layout_state === 'source_only') {
      warnings.add('Some pages need visual inspection or OCR; their headings are not inferred.')
      continue
    }
    const contentsPage = contentsPages.has(page.page_number)
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]
      const title = line.text
      if (title.length < 3 || title.length > 200 || !/\p{L}/u.test(title)) continue
      if (title.split(' ').filter(word => word.length > 1).length > 14) continue
      if (contentsPage || /\.{3,}|…{2,}/.test(title)) continue
      const band = line.bbox[1] < .13 ? 'top' : line.bbox[3] > .87 ? 'bottom' : ''
      if (band && (furniture.get(`${band}:${marginKey(title)}`)?.size ?? 0) >= 3) continue
      // Captions, list markers, equations and machine output are not section titles.
      if (/^(?:figure|fig\.?|table|listing|algorithm|equation|example|exercise|problem)\s+\d/i.test(title)
        || /^(?:[•▪◦‣]|\(?\d+[.)]|[a-z][.)])\s/.test(title)
        || /(?:[{}=;]|https?:\/\/|\b(?:eth\d|wlan\d)\b|^\d{1,3}(?:\.\d{1,3}){3}\s+(?:U|UG|via|dev)\b)/.test(title)
        || /[.!?;,]$/.test(title)
        || /^(?:[$>#]\s|\w+@[^\s]+[:~]|(?:GET|POST|HTTP\/\d)\s|(?:\w:[\\/]|\/)(?:[^\s]+[\\/])|\w+\([^)]*\)\s*$)/.test(title)) continue
      const h = height(line), ratio = h / body
      const number = numbered(title)
      const isMajor = major(title)
      const isFront = frontMatter.test(title) || /^(?:preface|foreword|introduction|acknowledgments|acknowledgements|notes|references|bibliography|index)$/.test(compact(title))
      const large = ratio >= 1.2
      const previous = lines[i - 1], next = lines[i + 1]
      const gap = previous ? line.bbox[1] - previous.bbox[3] : .1
      const isolated = gap >= body * .65
      const continuation = next && Math.abs(height(next) / h - 1) < .12
        && next.bbox[1] - line.bbox[3] < h && next.bbox[1] >= line.bbox[3] - .002
        && (title.split(' ').length + next.text.split(' ').length > 14
          || (lines[i + 2] && Math.abs(height(lines[i + 2]) / h - 1) < .12
            && lines[i + 2].bbox[1] - next.bbox[3] < h))
      const followsRun = previous && Math.abs(height(previous) / h - 1) < .12
        && gap >= -.002 && gap < h
      if ((continuation || followsRun) && !number && !isMajor && !isFront) continue
      // Separate cells sharing a baseline are a table/column row, not a heading.
      const row = lines.some((other, j) => j !== i && Math.abs(other.bbox[1] - line.bbox[1]) < h * .4
        && (other.bbox[0] >= line.bbox[2] + .02 || other.bbox[2] <= line.bbox[0] - .02))
      if (row && !isMajor) continue
      if (tocRow(title) && !isMajor && !isFront) continue
      let score = 0
      const reasons: string[] = []
      if (number?.includes('.')) { score += 3; reasons.push('section_number') }
      else if (number) { score += 1; reasons.push('number') }
      if (isMajor || isFront) { score += 3; reasons.push('section_label') }
      if (large) { score += 3; reasons.push('larger_type') }
      if (isolated) { score += 1; reasons.push('spacing') }
      if (title.length < 90 && title === title.toLocaleUpperCase() && /\p{Lu}/u.test(title)) {
        score += 1; reasons.push('uppercase')
      }
      if (band && !large && !isFront && !isMajor && !number?.includes('.')) score -= 2
      if (score < 4 || (!number && !isMajor && !isFront && !large)) continue
      // Recover wrapped titles only when typography, alignment and spacing agree.
      if (next && !numbered(next.text) && !major(next.text) && !tocRow(next.text)
        && height(next) / h > .9 && height(next) / h < 1.1 && ratio >= 1.2
        && Math.abs(next.bbox[0] - line.bbox[0]) < .04
        && next.bbox[1] - line.bbox[3] >= -.002 && next.bbox[1] - line.bbox[3] < h * .8
        && title.length + next.text.length < 150 && title.split(' ').length + next.text.split(' ').length <= 14 && !/[.!?;]$/.test(next.text)
        && next.text.split(' ').filter(word => word.length > 1).length <= 8) {
        line = { text: `${title} ${next.text}`, bbox: [line.bbox[0], line.bbox[1], Math.max(line.bbox[2], next.bbox[2]), next.bbox[3]] }
        reasons.push('wrapped_title'); i++
      }
      candidates.push({ page: page.page_number, line, height: h, body, score, reasons })
    }
  }

  // A printed contents page is useful title evidence, never the destination itself.
  // Resolve against actual matching heading text; page-number offsets need at least
  // three independent agreements before disambiguating repeated titles.
  const printed = prepared.flatMap(({ page, lines }) => contentsPages.has(page.page_number)
    ? printedRows(lines).map(row => ({ ...row, tocPage: page.page_number })) : [])
  const wanted = new Set(printed.map(row => headingKey(row.title)))
  const matches = new Map<string, Candidate[]>()
  for (const { page, lines, body } of prepared) {
    if (contentsPages.has(page.page_number) || page.profile?.layout_state === 'source_only') continue
    for (let i = 0; i < lines.length; i++) {
      let combined = lines[i]
      for (let span = 0; span < 5; span++) {
        if (span) {
          const next = lines[i + span]
          if (!next || next.bbox[1] - combined.bbox[3] > height(lines[i]) * 2
            || next.bbox[1] < combined.bbox[1] || combined.text.length + next.text.length > 180) break
          combined = { text: `${combined.text} ${next.text}`, bbox: [combined.bbox[0], combined.bbox[1], Math.max(combined.bbox[2], next.bbox[2]), next.bbox[3]] }
        }
        const identity = headingKey(combined.text)
        if (!wanted.has(identity) || identity.length < 4) continue
        const band = combined.bbox[1] < .13 ? 'top' : combined.bbox[3] > .87 ? 'bottom' : ''
        if (band && (furniture.get(`${band}:${marginKey(combined.text)}`)?.size ?? 0) >= 3) continue
        // Require heading-like geometry as well as a text match, avoiding prose mentions.
        if (combined.text.split(' ').filter(word => word.length > 1).length > 16) continue
        const h = height(lines[i])
        const candidate = { page: page.page_number, line: combined, height: h, body,
          score: 6 + (h / body >= 1.2 ? 3 : 0), reasons: ['verified_printed_contents'] }
        matches.set(identity, [...(matches.get(identity) ?? []), candidate])
      }
    }
  }
  const offsets = new Map<number, Set<string>>()
  for (const row of printed) {
    const identity = headingKey(row.title)
    const locations = (matches.get(identity) ?? []).filter(match => match.page > row.tocPage)
    const uniquePages = new Set(locations.map(match => match.page))
    if (uniquePages.size !== 1) continue
    const offset = locations[0].page - row.printedPage
    const evidence = offsets.get(offset) ?? new Set<string>()
    evidence.add(identity); offsets.set(offset, evidence)
  }
  const rankedOffsets = [...offsets].sort((a, b) => b[1].size - a[1].size)
  // Conflicting number systems are not interchangeable. Use a dominant offset;
  // otherwise leave repeated titles unresolved instead of selecting an arbitrary match.
  const strongest = rankedOffsets[0]
  const reliableOffsets = strongest && strongest[1].size >= 3
    && (!rankedOffsets[1] || strongest[1].size > rankedOffsets[1][1].size * 1.5) ? [strongest[0]] : []
  const printedIndents = [...new Set(printed.map(row => Math.round(row.x * 50)))].sort((a, b) => a - b)
  const unresolved = new Set<string>()
  for (const row of printed) {
    const locations = (matches.get(headingKey(row.title)) ?? []).filter(match => match.page > row.tocPage)
    const calibrated = locations.filter(match => reliableOffsets.includes(match.page - row.printedPage))
    const eligible = reliableOffsets.length ? calibrated : new Set(locations.map(match => match.page)).size === 1 ? locations : []
    const best = eligible.sort((a, b) => b.score - a.score || a.line.bbox[1] - b.line.bbox[1])[0]
    if (!best) { unresolved.add(`${headingKey(row.title)}:${row.printedPage}`); continue }
    candidates.push({ ...best, line: { ...best.line, text: row.title },
      tocLevel: numbered(row.title)?.split('.').length ?? (major(row.title) ? 1 : printedIndents.indexOf(Math.round(row.x * 50)) + 1) })
  }
  if (unresolved.size) warnings.add(`${unresolved.size} printed contents entries could not be matched confidently. Check the original contents for missing or ambiguous destinations.`)

  // A numbered section has one start in its enclosing chapter. Keep the strongest
  // geometric evidence, rather than the first occurrence in a running header.
  const selected = new Map<string, Candidate>()
  let branch = ''
  candidates.sort((a, b) => a.page - b.page || a.line.bbox[1] - b.line.bbox[1] || b.score - a.score)
  const atPosition = new Set<string>()
  const verifiedChapters = candidates.filter(candidate => major(candidate.line.text) && candidate.reasons.includes('verified_printed_contents'))
  for (const candidate of candidates) {
    if (major(candidate.line.text) && !candidate.reasons.includes('verified_printed_contents')
      && verifiedChapters.some(verified => headingKey(verified.line.text) === headingKey(candidate.line.text)
        && verified.page !== candidate.page)) continue
    if (printed.length >= 20 && candidate.page < Math.min(...printed.map(row => row.tocPage))
      && !frontMatter.test(candidate.line.text)) continue
    const position = `${candidate.page}:${Math.round(candidate.line.bbox[1] * 10000)}`
    if (atPosition.has(position)) continue
    atPosition.add(position)
    if (major(candidate.line.text)) branch = key(candidate.line.text)
    const number = numbered(candidate.line.text)
    const identity = number ? `${branch}:${number}:${key(candidate.line.text.replace(/^\S+\s+/, ''))}`
      : `${candidate.page}:${key(candidate.line.text)}`
    const previous = selected.get(identity)
    if (!previous || candidate.score > previous.score) selected.set(identity, candidate)
  }
  // Once a substantial printed outline has been verified, it is stronger than
  // unrelated typography guesses. Keep structural labels, not every enlarged line.
  const verified = [...selected.values()].filter(candidate => candidate.reasons.includes('verified_printed_contents'))
  const preferPrinted = printed.length >= 5 && verified.length >= 3 && verified.length / printed.length >= .6
  const reliable = [...selected.values()].filter(candidate => !preferPrinted
    || candidate.reasons.includes('verified_printed_contents')
    || major(candidate.line.text) || frontMatter.test(candidate.line.text))
  if (preferPrinted && reliable.length < selected.size) warnings.add('The verified printed contents are preferred; unrelated typography guesses are omitted.')
  const ordered = reliable.sort((a, b) => a.page - b.page || a.line.bbox[1] - b.line.bbox[1])
  const sections: SourceSection[] = []
  const ancestors: Array<{ section: SourceSection; height: number }> = []
  let backMatter = false
  for (const candidate of ordered) {
    const { line, page } = candidate
    const number = numbered(line.text)
    let level: number
    const isBackMatter = /^(?:notes|references|bibliography|index)$/.test(compact(line.text))
    if (isBackMatter) { backMatter = true; level = 1 }
    else if (backMatter && major(line.text)) level = 2
    else if (candidate.tocLevel !== undefined) level = candidate.tocLevel
    else if (major(line.text) || frontMatter.test(line.text)) level = 1
    else if (number) level = number.split('.').length
    else {
      // Font tiers are local to the current branch, not a global cap on depth.
      while (ancestors.length && candidate.height >= ancestors.at(-1)!.height * .94) ancestors.pop()
      level = (ancestors.at(-1)?.section.level ?? 0) + 1
    }
    while (ancestors.length && ancestors.at(-1)!.section.level >= level) ancestors.pop()
    const section: SourceSection = {
      id: `contents-${page}-${Math.round(line.bbox[1] * 10000)}-${hash(line.text)}`,
      title: displayHeading(line.text), level, parent_id: ancestors.at(-1)?.section.id ?? null,
      page_start: page, page_end: pageCount, page_y: Math.max(0, line.bbox[1] - .015),
      confidence: Math.min(.95, .55 + candidate.score * .05), origin: 'computed',
      detection_reasons: candidate.reasons,
    }
    sections.push(section)
    ancestors.push({ section, height: candidate.height })
  }
  // Inclusive page ranges also cover a boundary partway down the next page.
  const stack: SourceSection[] = []
  for (const section of sections) {
    while (stack.length && stack.at(-1)!.level >= section.level) {
      const previous = stack.pop()!
      previous.page_end = Math.max(previous.page_start, section.page_start - ((section.page_y ?? 0) < .15 ? 1 : 0))
    }
    stack.push(section)
  }
  if (!sections.length) warnings.add('No reliable text headings found. Search the document or browse the original pages.')
  warnings.add('Detected headings are inferred from the source; some sections may be missing.')
  return { sections, warnings: [...warnings] }
}

function hash(value: string): string {
  let result = 2166136261
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619)
  return (result >>> 0).toString(36)
}
