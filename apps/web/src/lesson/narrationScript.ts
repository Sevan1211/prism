import type { LessonBlockContent, LessonDocument } from './lessonDocumentTypes'

export interface NarrationPassage { blockId: string; text: string }
export interface NarrationSection { sectionId: string; title: string; passages: NarrationPassage[] }

// Short utterances avoid browser speech engines dropping a long lesson paragraph.
const MAX_UTTERANCE_LENGTH = 280

export function lessonNarrationSections(document: LessonDocument): NarrationSection[] {
  return document.sections.map(section => ({
    sectionId: section.section_id,
    title: section.title,
    passages: section.blocks.flatMap(block => splitForSpeech(narrationText(block.content)).map(text => ({ blockId: block.block_id, text }))),
  })).filter(section => section.passages.length > 0)
}

function narrationText(content: LessonBlockContent): string {
  switch (content.kind) {
    case 'prose': case 'source_excerpt': return content.text
    case 'rich_text': return markdownForSpeech(content.markdown)
    case 'definition': return `${content.term}. ${content.definition}`
    case 'callout': return content.text
    case 'equation': return `Equation. ${content.explanation}`
    case 'code': return `Code example in ${content.language}. ${content.explanation} Read the exact code on screen.`
    case 'worked_example': return `${content.prompt} ${content.steps.map((step, index) => `Step ${index + 1}. ${step}`).join(' ')} Result. ${content.result}`
    case 'table': return `${content.caption} ${content.rows.map((row, index) => `Row ${index + 1}. ${row.map((cell, column) => `${content.columns[column] ?? `Column ${column + 1}`}: ${cell}`).join('. ')}`).join(' ')}`
    case 'practice': return `Optional practice. ${content.prompt} Hints and the worked response can be revealed on screen when you choose.`
    case 'visual_scene': return `${content.caption}. ${content.description} ${content.steps.map(step => `${step.label}. ${step.description}`).join(' ')}`
    case 'data_plot': return `${content.caption}. ${content.description}`
    case 'illustration': case 'source_figure': return `${content.caption}. ${content.alt}`
    case 'network_delay': return `${content.caption}. Packet size ${content.packet_bytes} bytes, link rate ${content.link_mbps} megabits per second, propagation ${content.propagation_ms} milliseconds.`
    case 'diagram': {
      const labels = new Map(content.nodes.map(node => [node.node_id, node.label]))
      return `${content.caption}. ${content.nodes.map(node => node.label).join(', ')}. ${content.edges.map(edge => `${labels.get(edge.from) ?? edge.from} to ${labels.get(edge.to) ?? edge.to}: ${edge.label}`).join('. ')}`
    }
    case 'animation': return `${content.caption}. ${content.steps.map(step => `${step.label}. ${step.description}`).join(' ')}`
    case 'summary': return content.points.join(' ')
  }
}

function markdownForSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' Code example shown on screen. ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\$\$[\s\S]*?\$\$/g, ' Mathematical expression shown on screen. ')
    .replace(/\$[^$]+\$/g, ' mathematical expression shown on screen ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*(?:[-+*]|\d+\.)\s+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\|/g, '; ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitForSpeech(text: string): string[] {
  const remaining = text.replace(/\s+/g, ' ').trim()
  if (!remaining) return []
  const parts: string[] = []
  let rest = remaining
  while (rest.length > MAX_UTTERANCE_LENGTH) {
    const slice = rest.slice(0, MAX_UTTERANCE_LENGTH + 1)
    const sentence = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('? '), slice.lastIndexOf('! '))
    const word = slice.lastIndexOf(' ')
    const cut = sentence > MAX_UTTERANCE_LENGTH / 2 ? sentence + 1 : word > 0 ? word : MAX_UTTERANCE_LENGTH
    parts.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) parts.push(rest)
  return parts
}
