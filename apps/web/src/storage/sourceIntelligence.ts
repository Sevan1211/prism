import {
  BROWSER_TEXT_INDEX_VERSION,
  type IndexedPageProfile,
  type IndexedSourceElement,
  type IndexedSourcePage,
  type IndexedTextFragment,
  type SourceElementKind,
  type SourceEvidenceStatus,
} from './sourceIndexTypes'

interface BuildPageInput {
  fragments: IndexedTextFragment[]
  height: number
  pageNumber: number
  rotation: number
  sourceId: string
  width: number
}

interface TextLine {
  bbox: [number, number, number, number]
  text: string
}

interface ClassifiedText {
  confidence: number
  kind: SourceElementKind
  reasons: string[]
}

const CAPTION_PATTERN = /^(?:figure|fig\.?|table|listing|algorithm|equation)\s+[a-z]?\d+(?:[.:-]\d+)*\b/i
const EXAMPLE_PATTERN = /^example\s+[a-z]?\d+(?:[.:-]\d+)*\b/i
const EXERCISE_PATTERN = /^(?:exercise|review question|problem)\s+[a-z]?\d*(?:[.:-]\d+)*\b/i
const LIST_PATTERN = /^(?:[•◦▪‣-]|\(?\d+[.)]|\(?[a-z][.)])\s+/i
const CODE_PATTERN = /(?:=>|::|\b(?:class|def|function)\s+\w+\s*[:({]|\b(?:if|while|for)\s*\([^)]*\)|\breturn\s+[^;]+;|\bimport\s+[\w.*]+\s+from\b|\bSELECT\b.+\bFROM\b|[{};]{2,})/
const EQUATION_PATTERN = /(?:[=≈≠≤≥∑∫√∞]|\b(?:sin|cos|log|lim)\b)/i
const TERMINAL_PUNCTUATION = /[.!?;:]$/

export function buildIndexedSourcePage(input: BuildPageInput): IndexedSourcePage {
  const fragments = input.fragments.filter((fragment) => fragment.text.trim().length > 0)
  const unordered = textLines(fragments)
  const columns = columnReadingOrder(unordered)
  const lines = columns ?? unordered
  const possibleColumns = hasPossibleColumns(lines)
  const profile = pageProfile(input, fragments, possibleColumns)
  if (columns && profile.layout_state !== 'source_only') {
    profile.layout_state = 'column_candidate'
    profile.warnings.push('two_column_reading_order_inferred_check_original')
  }
  const elements = sourceElements(input.sourceId, input.pageNumber, lines, profile)
  return {
    elements,
    fragments,
    index_version: BROWSER_TEXT_INDEX_VERSION,
    page_number: input.pageNumber,
    profile,
    source_id: input.sourceId,
    text: lines.map((line) => line.text).join('\n'),
  }
}

function pageProfile(
  input: BuildPageInput,
  fragments: IndexedTextFragment[],
  possibleColumns: boolean,
): IndexedPageProfile {
  const embeddedTextCharacters = pageText(fragments).length
  const damagedCharacters = fragments.reduce((sum, fragment) => sum + [...fragment.text].filter((character) => {
    const code = character.charCodeAt(0)
    return code === 0xfffd || (code < 32 && ![9, 10, 13].includes(code))
  }).length, 0)
  const damagedText = damagedCharacters > Math.max(3, embeddedTextCharacters * 0.02)
  const warnings = ['reading_order_unverified', 'visual_inventory_not_indexed']
  if (possibleColumns) warnings.push('possible_multicolumn_or_table_layout')
  if (embeddedTextCharacters === 0) warnings.push('no_embedded_text')
  if (damagedText) warnings.push('unreliable_character_mapping')
  return {
    embedded_text_characters: embeddedTextCharacters,
    height_points: finiteDimension(input.height),
    layout_state: embeddedTextCharacters === 0 || damagedText
      ? 'source_only'
      : possibleColumns
        ? 'complex_candidate'
        : 'linear_candidate',
    rotation: Number.isFinite(input.rotation) ? input.rotation : 0,
    visual_inventory: 'not_indexed',
    warnings,
    width_points: finiteDimension(input.width),
  }
}

function sourceElements(
  sourceId: string,
  pageNumber: number,
  lines: TextLine[],
  profile: IndexedPageProfile,
): IndexedSourceElement[] {
  if (lines.length === 0) return []
  const medianHeight = median(lines.map((line) => line.bbox[3] - line.bbox[1]))
  const blocks: TextLine[][] = []
  let current: TextLine[] = []

  for (const line of lines) {
    const previous = current.at(-1)
    const currentText = current.map((item) => item.text).join('\n')
    const lineClass = classifyText(line.text, line.bbox[3] - line.bbox[1], medianHeight)
    const currentClass = current.length > 0
      ? classifyText(currentText, maxLineHeight(current), medianHeight)
      : null
    const gap = previous ? line.bbox[1] - previous.bbox[3] : 0
    const alignmentShift = previous ? Math.abs(line.bbox[0] - previous.bbox[0]) : 0
    const specialBoundary = Boolean(
      currentClass
      && (currentClass.kind !== 'paragraph_candidate' || lineClass.kind !== 'paragraph_candidate'),
    )
    const shouldBreak = current.length > 0 && (
      specialBoundary
      || gap > Math.max(0.018, medianHeight * 1.35)
      || alignmentShift > 0.065
      || current.length >= 12
      || currentText.length + line.text.length > 1_600
    )
    if (shouldBreak) {
      blocks.push(current)
      current = []
    }
    current.push(line)
  }
  if (current.length > 0) blocks.push(current)

  const status: SourceEvidenceStatus = ['linear_candidate', 'column_candidate'].includes(profile.layout_state)
    ? 'transform_with_warning'
    : 'source_only'
  return blocks.map((block, order) => {
    const text = block.map((line) => line.text).join('\n')
    const classification = classifyText(text, maxLineHeight(block), medianHeight)
    const numericRow = block.some((line) => {
      const cells = line.text.trim().split(/\s+/)
      const numeric = cells.filter((cell) => /^[-+]?\d+(?:[.,]\d+)*(?:[%*†‡])?$/.test(cell)).length
      return numeric >= 3 && numeric / cells.length >= .4
    })
    // A chart or author row elsewhere on the page must not invalidate clear
    // full-width prose. Keep spatially conflicting regions source-only.
    const bounds = unionBounds(block.map((line) => line.bbox))
    const isolatedProse = profile.layout_state === 'complex_candidate'
      && classification.kind === 'paragraph_candidate' && block.length >= 2
      && block.every((line) => line.bbox[2] - line.bbox[0] > 0.42)
      && !lines.some((line) => !block.includes(line) && centerY(line.bbox) > bounds[1] && centerY(line.bbox) < bounds[3])
    return {
      bbox_normalized: bounds,
      confidence: classification.confidence,
      element_id: `${sourceId}:page:${pageNumber}:element:${order}:${BROWSER_TEXT_INDEX_VERSION}`,
      kind: classification.kind,
      order,
      page_number: pageNumber,
      reasons: numericRow ? [...classification.reasons, 'numeric_row_requires_table_or_equation_inspection'] : isolatedProse ? [...classification.reasons, 'clear_prose_in_mixed_layout_check_original'] : classification.reasons,
      status: numericRow ? 'source_only' : isolatedProse ? 'transform_with_warning' as const : status,
      text,
    }
  })
}

function textLines(fragments: IndexedTextFragment[]): TextLine[] {
  const lines: TextLine[] = []
  let current: IndexedTextFragment[] = []
  for (const fragment of fragments) {
    const previous = current.at(-1)
    const verticalShift = previous
      ? Math.abs(centerY(previous.bbox_normalized) - centerY(fragment.bbox_normalized))
      : 0
    const lineHeight = previous
      ? Math.max(
        previous.bbox_normalized[3] - previous.bbox_normalized[1],
        fragment.bbox_normalized[3] - fragment.bbox_normalized[1],
      )
      : 0
    const horizontalGap = previous ? fragment.bbox_normalized[0] - previous.bbox_normalized[2] : 0
    if (previous && (previous.has_eol || verticalShift > Math.max(0.004, lineHeight * 0.62) || horizontalGap > 0.12 || horizontalGap < -0.02)) {
      lines.push(toLine(current))
      current = []
    }
    current.push(fragment)
  }
  if (current.length > 0) lines.push(toLine(current))
  return lines.filter((line) => line.text.length > 0)
}

function toLine(fragments: IndexedTextFragment[]): TextLine {
  let text = ''
  let previous: IndexedTextFragment | undefined
  for (const fragment of fragments) {
    const next = fragment.text.trim()
    if (!next) continue
    const gap = previous ? fragment.bbox_normalized[0] - previous.bbox_normalized[2] : 0
    const characterWidth = previous ? (previous.bbox_normalized[2] - previous.bbox_normalized[0]) / Math.max(1, previous.text.length) : 0
    const explicitSpace = /\s$/.test(previous?.text ?? '') || /^\s/.test(fragment.text)
    if (text && needsSpace(text, next) && (explicitSpace || gap > Math.max(0.0005, characterWidth * 0.18))) text += ' '
    text += next
    previous = fragment
  }
  return { bbox: unionBounds(fragments.map((fragment) => fragment.bbox_normalized)), text }
}

function needsSpace(left: string, right: string): boolean {
  return !/[\s([{\-/]$/.test(left) && !/^[,.;:!?%)\]}]/.test(right)
}

function classifyText(text: string, lineHeight: number, medianHeight: number): ClassifiedText {
  const normalized = text.replace(/\s+/g, ' ').trim()
  const words = normalized.split(/\s+/).filter(Boolean)
  if (CAPTION_PATTERN.test(normalized) && !/^(?:figure|fig\.?|table|listing|algorithm|equation)\s+[a-z]?\d+(?:[.:-]\d+)*\s+(?:describes|reports|shows|illustrates|compares|presents|demonstrates)\b/i.test(normalized)) {
    return { confidence: 0.82, kind: 'caption_candidate', reasons: ['numbered_caption_prefix'] }
  }
  if (EXAMPLE_PATTERN.test(normalized)) {
    return { confidence: 0.76, kind: 'example_candidate', reasons: ['numbered_example_prefix'] }
  }
  if (EXERCISE_PATTERN.test(normalized)) {
    return { confidence: 0.76, kind: 'exercise_candidate', reasons: ['exercise_prefix'] }
  }
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  if (lines.length === 1 && words.length <= 10 && normalized.length <= 100 && !TERMINAL_PUNCTUATION.test(normalized) && /^\d+(?:\.\d+)*\s+[A-Z]/.test(normalized)) return { confidence: .7, kind: 'heading_candidate', reasons: ['numbered_section_heading'] }
  if (lines.length > 0 && lines.every((line) => LIST_PATTERN.test(line))) {
    return { confidence: 0.72, kind: 'list_candidate', reasons: ['repeated_list_markers'] }
  }
  if (words.length <= 18 && !TERMINAL_PUNCTUATION.test(normalized)) {
    const uppercaseLetters = [...normalized].filter((character) => /[A-Z]/.test(character)).length
    const letters = [...normalized].filter((character) => /[A-Za-z]/.test(character)).length
    const sizeSignal = medianHeight > 0 && lineHeight >= medianHeight * 1.24
    const caseSignal = letters >= 3 && uppercaseLetters / letters >= 0.72
    if (sizeSignal || caseSignal) {
      return {
        confidence: sizeSignal && caseSignal ? 0.78 : 0.64,
        kind: 'heading_candidate',
        reasons: [sizeSignal ? 'larger_text_line' : 'uppercase_short_line'],
      }
    }
  }
  if (normalized.length <= 240 && EQUATION_PATTERN.test(normalized)) {
    const mathCharacters = [...normalized].filter((character) => /[=+*/^≈≠≤≥∑∫√∞]/.test(character)).length
    if (mathCharacters >= 2 || /^\(?\d+(?:\.\d+)*\)?\s+/.test(normalized)) {
      return { confidence: 0.58, kind: 'equation_candidate', reasons: ['math_symbol_density'] }
    }
  }
  if (CODE_PATTERN.test(normalized) && (lines.length >= 2 || /[{};]/.test(normalized))) {
    return { confidence: 0.58, kind: 'code_candidate', reasons: ['code_token_pattern'] }
  }
  if (words.length >= 5) {
    return { confidence: 0.7, kind: 'paragraph_candidate', reasons: ['multiword_text_block'] }
  }
  return { confidence: 0.35, kind: 'unclassified_text', reasons: ['insufficient_layout_evidence'] }
}

function hasPossibleColumns(lines: TextLine[]): boolean {
  const lineBounds = lines
    .map((line) => line.bbox)
    .filter((bounds) => centerY(bounds) >= 0.06 && centerY(bounds) <= 0.92)
  return parallelRegionBands(lineBounds) >= 2
}

// Only infer columns when both sides contain sustained prose. Small tables,
// split equations and marginal labels retain the conservative visual fallback.
function columnReadingOrder(lines: TextLine[]): TextLine[] | null {
  const prose = lines.filter((line) => line.text.split(/\s+/).length >= 6 && line.bbox[2] - line.bbox[0] > .22 && centerY(line.bbox) > .06 && centerY(line.bbox) < .93)
  let split: number | null = null
  let best = 0
  for (const gutter of [.4, .45, .5, .55, .6]) {
    const left = prose.filter((line) => line.bbox[2] <= gutter - .008)
    const right = prose.filter((line) => line.bbox[0] >= gutter + .008)
    if (left.length < 6 || right.length < 6) continue
    const overlap = Math.min(Math.max(...left.map((line) => line.bbox[3])), Math.max(...right.map((line) => line.bbox[3]))) - Math.max(Math.min(...left.map((line) => line.bbox[1])), Math.min(...right.map((line) => line.bbox[1])))
    const score = Math.min(left.length, right.length)
    if (overlap > .15 && left.length + right.length >= prose.length * .65 && score > best) { split = gutter; best = score }
  }
  if (split === null) return null
  const spanning = lines.filter((line) => line.bbox[0] < split && line.bbox[2] > split).sort((a, b) => a.bbox[1] - b.bbox[1])
  const narrow = lines.filter((line) => !spanning.includes(line))
  const output: TextLine[] = []
  let previous = -1
  for (const boundary of [...spanning, null]) {
    const limit = boundary ? centerY(boundary.bbox) : 2
    const band = narrow.filter((line) => centerY(line.bbox) > previous && centerY(line.bbox) <= limit)
    output.push(...band.filter((line) => line.bbox[0] < split).sort((a, b) => a.bbox[1] - b.bbox[1]), ...band.filter((line) => line.bbox[0] >= split).sort((a, b) => a.bbox[1] - b.bbox[1]))
    if (boundary) output.push(boundary)
    previous = limit
  }
  return output
}

function parallelRegionBands(input: Array<[number, number, number, number]>): number {
  const bounds = [...input].sort((left, right) => centerY(left) - centerY(right) || left[0] - right[0])
  const bandCenters: number[] = []
  for (let leftIndex = 0; leftIndex < bounds.length; leftIndex += 1) {
    const left = bounds[leftIndex]
    if (left[2] > 0.58) continue
    for (let rightIndex = leftIndex + 1; rightIndex < bounds.length; rightIndex += 1) {
      const right = bounds[rightIndex]
      if (centerY(right) - centerY(left) > 0.04) break
      if (right[0] < 0.42 || right[0] - left[2] < 0.12) continue
      const height = Math.max(left[3] - left[1], right[3] - right[1])
      if (Math.abs(centerY(left) - centerY(right)) <= Math.max(0.006, height)) {
        const pairCenter = (centerY(left) + centerY(right)) / 2
        if (bandCenters.every((center) => Math.abs(center - pairCenter) > Math.max(0.018, height))) {
          bandCenters.push(pairCenter)
        }
      }
    }
  }
  return bandCenters.length
}

function pageText(fragments: IndexedTextFragment[]): string {
  return fragments
    .map((fragment) => `${fragment.text}${fragment.has_eol ? '\n' : ' '}`)
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

function unionBounds(
  bounds: Array<[number, number, number, number]>,
): [number, number, number, number] {
  if (bounds.length === 0) return [0, 0, 1, 1]
  let left = 1
  let top = 1
  let right = 0
  let bottom = 0
  for (const bound of bounds) {
    left = Math.min(left, bound[0])
    top = Math.min(top, bound[1])
    right = Math.max(right, bound[2])
    bottom = Math.max(bottom, bound[3])
  }
  return [left, top, right, bottom]
}

function maxLineHeight(lines: TextLine[]): number {
  let maximum = 0
  for (const line of lines) maximum = Math.max(maximum, line.bbox[3] - line.bbox[1])
  return maximum
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const ordered = [...values].sort((left, right) => left - right)
  return ordered[Math.floor(ordered.length / 2)]
}

function centerY(bounds: [number, number, number, number]): number {
  return (bounds[1] + bounds[3]) / 2
}

function finiteDimension(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : 0
}
