import { describe, expect, it, vi } from 'vitest'
import { buildSourcePacket, compactSourcePacket, readSourcePacket } from './sourcePackets'
import { buildIndexedSourcePage } from './sourceIntelligence'

function page(number: number, text: string) {
  return buildIndexedSourcePage({ sourceId: 'source', pageNumber: number, fragments: text ? [{ text, bbox_normalized: [.1, .1, .9, .9], has_eol: true }] : [], width: 600, height: 800, rotation: 0 })
}

describe('bounded source evidence packets', () => {
  it('preserves targeted page details, including dense split elements and scans', async () => {
    const dense = page(1, 'Exact original text. '.repeat(300))
    const scan = page(2, '')
    const pages = [dense, scan]
    let args: Parameters<typeof readSourcePacket>[0] | undefined = { source_id: 'source', page_start: 1, page_end: 2, format: 'compact', include_details: true }
    let text = ''
    const seenPages = new Set<number>()
    while (args) {
      const result = compactSourcePacket(await readSourcePacket(args, 2, async (_id, start, end) => pages.slice(start - 1, end), 1400))
      for (const row of result.rows) {
        const element = Object.fromEntries(result.columns.map((column, index) => [column, row[index]]))
        expect(element.confidence).toBe(dense.elements[0].confidence)
        expect(element.order).toBe(dense.elements[0].order)
        expect(element.reasons).toEqual(dense.elements[0].reasons)
        expect(element.text_offset).toBe(text.length)
        text += element.text
      }
      for (const metadata of result.pages) {
        expect(metadata.profile).toEqual(pages[metadata.page - 1].profile)
        expect(metadata.total_elements).toBe(pages[metadata.page - 1].elements.length)
        expect(metadata.image_anchor).toContain(':image:')
        seenPages.add(metadata.page)
      }
      args = result.next_call?.arguments
      if (args) expect(args.include_details).toBe(true)
    }
    expect(text).toBe(dense.elements.map(element => element.text).join(''))
    expect([...seenPages]).toEqual([1, 2])
  })
  it('reduces transport and calls without losing fragment text, coordinates, status or anchors', async () => {
    const pages = Array.from({ length: 8 }, (_, i) => {
      const current = page(i + 1, 'Original fragment')
      current.elements = Array.from({ length: 160 }, (_, j) => ({ ...current.elements[0], element_id: `source:page:${i + 1}:element:${j}`, text: `Cell ${j}: exact \\"value\\" ${i}.`, order: j }))
      return current
    })
    const run = async (format: 'detailed' | 'compact') => {
      let request: Parameters<typeof readSourcePacket>[0] | undefined = { source_id: 'source', page_start: 1, page_end: 8, format }
      const recovered: unknown[] = []
      const completed: number[] = []
      let characters = 0; let calls = 0
      while (request) {
        const packet = await readSourcePacket(request, 8, async (_id, start, end) => pages.slice(start - 1, end))
        const compact = compactSourcePacket(packet)
        const wire = format === 'compact' ? compact : packet
        characters += JSON.stringify(wire).length; calls++
        recovered.push(...(format === 'compact' ? compact.rows.map(row => Object.fromEntries(compact.columns.map((key, index) => [key, row[index]]))) : packet.elements))
        completed.push(...packet.pages_completed_in_packet)
        request = packet.next_call?.arguments
        if (request) expect(request.format).toBe(format)
        expect(calls).toBeLessThan(100)
      }
      return { recovered, completed, characters, calls }
    }
    const detailed = await run('detailed'); const compact = await run('compact')
    expect(compact.recovered).toEqual(detailed.recovered)
    expect(compact.completed).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(compact.characters).toBeLessThan(detailed.characters * .8)
    expect(compact.calls).toBeLessThan(detailed.calls)
    console.info('Synthetic 1280-fragment transport:', { detailed: { calls: detailed.calls, characters: detailed.characters }, compact: { calls: compact.calls, characters: compact.characters } })
  })

  it('reconstructs oversized escaped text in compact rows across cursors', async () => {
    const pages = [page(1, '\\"\\\\\n'.repeat(3000)), page(2, '')]
    let request: Parameters<typeof readSourcePacket>[0] | undefined = { source_id: 'source', page_start: 1, page_end: 2, format: 'compact' }
    let recovered = ''; let calls = 0
    while (request) {
      const packet = compactSourcePacket(await readSourcePacket(request, 2, async (_id, start, end) => pages.slice(start - 1, end), 1800))
      for (const row of packet.rows) { expect(row[5]).toBe(recovered.length); recovered += row[7] }
      request = packet.next_call?.arguments
      expect(++calls).toBeLessThan(100)
    }
    expect(recovered).toBe(pages[0].elements.map(element => element.text).join(''))
  })
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

  it('reads a full 24-page request in three bounded calls without page arithmetic by the caller', async () => {
    const pages = Array.from({ length: 24 }, (_, i) => page(i + 1, `Exact evidence ${i + 1}`))
    const load = vi.fn(async (_id: string, start: number, end: number) => pages.slice(start - 1, end))
    let request: Parameters<typeof readSourcePacket>[0] | undefined = { source_id: 'source', page_start: 1, page_end: 24 }
    const completed: number[] = []
    while (request) {
      const result = await readSourcePacket(request, 24, load)
      completed.push(...result.pages_completed_in_packet)
      expect(result.range).toEqual([1, 24])
      expect(JSON.stringify(result).length).toBeLessThan(48000)
      request = result.next_call?.arguments
    }
    expect(load).toHaveBeenCalledTimes(3)
    expect(completed).toEqual(pages.map(item => item.page_number))
    expect(load.mock.calls.every(([, start, end]) => end - start < 8)).toBe(true)
  })

  it('preserves dense evidence and scan warnings across automatic batch boundaries', async () => {
    const pages = Array.from({ length: 10 }, (_, i) => page(i + 1, i === 7 ? '' : `Evidence ${i + 1}: ` + 'A ".\\\n'.repeat(i === 8 ? 1800 : 8)))
    const load = async (_id: string, start: number, end: number) => pages.slice(start - 1, end)
    let request: Parameters<typeof readSourcePacket>[0] | undefined = { source_id: 'source', page_start: 1, page_end: 10 }
    const text = new Map<string, string>()
    const completed: number[] = []
    let scanSeen = false
    let calls = 0
    while (request) {
      const result = await readSourcePacket(request, 10, load, 1800)
      for (const element of result.elements) {
        const previous = text.get(element.id) ?? ''
        expect(element.text_offset).toBe(previous.length)
        text.set(element.id, previous + element.text)
      }
      scanSeen ||= result.pages.some(item => item.page === 8 && item.warnings.length > 0 && item.image_anchor.includes(':page:8:'))
      completed.push(...result.pages_completed_in_packet)
      request = result.next_call?.arguments
      expect(++calls).toBeLessThan(100)
    }
    expect(scanSeen).toBe(true)
    expect(completed).toEqual(pages.map(item => item.page_number))
    for (const element of pages.flatMap(item => item.elements)) expect(text.get(element.element_id)).toBe(element.text)
  })

  it('rejects invalid scope, missing pages and corrupt cursors without claiming coverage', async () => {
    const request = { source_id: 'source', page_start: 1, page_end: 10 }
    const load = vi.fn(async () => [page(1, 'Text')])
    await expect(readSourcePacket(request, 9, load)).rejects.toThrow('within')
    expect(load).not.toHaveBeenCalled()
    await expect(readSourcePacket({ ...request, cursor: '11:0:0' }, 10, load)).rejects.toThrow('outside')
    await expect(readSourcePacket({ ...request, cursor: '1:no:0' }, 10, load)).rejects.toThrow('Invalid')
    await expect(readSourcePacket(request, 10, load)).rejects.toThrow('not fully indexed')
  })
})
