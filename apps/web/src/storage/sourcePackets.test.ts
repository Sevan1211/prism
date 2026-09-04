import { describe, expect, it } from 'vitest'
import { buildSourcePacket } from './sourcePackets'
import { buildIndexedSourcePage } from './sourceIntelligence'

function page(number: number, text: string) {
  return buildIndexedSourcePage({ sourceId: 'source', pageNumber: number, fragments: text ? [{ text, bbox_normalized: [.1, .1, .9, .9], has_eol: true }] : [], width: 600, height: 800, rotation: 0 })
}

describe('bounded source evidence packets', () => {
  it('transports exact text and anchors across continuations, including a scanned page', () => {
    const pages = [page(1, 'A ".\\\n'.repeat(1800)), page(2, ''), page(3, 'Final evidence.')]
    const reconstructed = new Map<string, string>()
    const completed: number[] = []
    let cursor: string | undefined
    let calls = 0
    do {
      const result = buildSourcePacket(pages, cursor, 1800)
      for (const element of result.elements) {
        const prior = reconstructed.get(element.id) ?? ''
        expect(element.text_offset).toBe(prior.length)
        reconstructed.set(element.id, prior + element.text)
      }
      completed.push(...result.pages_completed_in_packet)
      cursor = result.next_cursor ?? undefined
      expect(++calls).toBeLessThan(100)
    } while (cursor)
    for (const element of pages.flatMap(item => item.elements)) expect(reconstructed.get(element.element_id)).toBe(element.text)
    expect(completed).toEqual([1, 2, 3])
  })
  it('batches small pages and retains layout warnings and image anchors', () => {
    const result = buildSourcePacket(Array.from({ length: 8 }, (_, i) => page(i + 1, `Evidence on page ${i + 1}`)))
    expect(result.next_cursor).toBeNull()
    expect(result.complete_for_range).toBe(true)
    expect(result.pages).toHaveLength(8)
    expect(result.pages[0].image_anchor).toContain('source:page:1:image:')
    expect(result.pages[0].warnings.length).toBeGreaterThan(0)
    expect(JSON.stringify(result).length).toBeLessThan(48000)
    expect(() => buildSourcePacket([page(1, 'Text')], '99:0:0')).toThrow('outside')
    expect(() => buildSourcePacket([page(1, 'Text')], '1:-1:0')).toThrow('Invalid')
  })
})
