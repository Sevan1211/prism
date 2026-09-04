import { describe, expect, it } from 'vitest'
import { decodeIllustrationData } from './lessonIllustrations'

function header(width: number, height: number) {
  const bytes = new Uint8Array(24)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, 0x89504e47); view.setUint32(4, 0x0d0a1a0a); view.setUint32(12, 0x49484452)
  view.setUint32(16, width); view.setUint32(20, height)
  return `data:image/png;base64,${btoa(String.fromCharCode(...bytes))}`
}
describe('illustration input bounds before image decoding', () => {
  it('reads raster dimensions and rejects oversized or executable inputs', () => {
    expect(decodeIllustrationData(header(1000, 800))).toMatchObject({ width: 1000, height: 800 })
    expect(() => decodeIllustrationData(header(8000, 8000))).toThrow('12 megapixels')
    expect(() => decodeIllustrationData(header(0, 800))).toThrow('Invalid raster')
    expect(() => decodeIllustrationData('data:image/svg+xml;base64,PHN2Zy8+')).toThrow('PNG or JPEG')
    expect(() => decodeIllustrationData('https://example.com/tracker.png')).toThrow('PNG or JPEG')
    expect(() => decodeIllustrationData('data:image/png;base64,AAAA')).toThrow('Invalid raster')
  })
})
