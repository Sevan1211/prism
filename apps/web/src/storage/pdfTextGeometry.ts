import type { TextItem, TextStyle } from 'pdfjs-dist/types/src/display/api'
import type { IndexedTextFragment } from './sourceIndexTypes'

// Convert all four text corners into the rotated viewport, rather than adding
// an unrotated width to a rotated origin. Bounds remain PDF-page coordinates.
export function textFragment(
  item: TextItem,
  viewport: { height: number; transform: number[]; width: number },
  util: { transform: (left: number[], right: number[]) => number[] },
  style?: TextStyle,
): IndexedTextFragment {
  const matrix = util.transform(viewport.transform, item.transform)
  const height = Math.max(1, Math.hypot(matrix[2], matrix[3]))
  const angle = Math.atan2(matrix[1], matrix[0]) + (style?.vertical ? Math.PI / 2 : 0)
  const width = Math.max(0, style?.vertical ? item.height : item.width)
  const ascent = Number.isFinite(style?.ascent) ? style!.ascent : 0.8
  const descent = Number.isFinite(style?.descent) ? style!.descent : -0.2
  const corners = [0, width].flatMap((distance) => [descent * height, ascent * height].map((rise) => [
    matrix[4] + Math.cos(angle) * distance + Math.sin(angle) * rise,
    matrix[5] + Math.sin(angle) * distance - Math.cos(angle) * rise,
  ]))
  const clamp = (value: number) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
  return {
    bbox_normalized: [
      clamp(Math.min(...corners.map((point) => point[0])) / viewport.width),
      clamp(Math.min(...corners.map((point) => point[1])) / viewport.height),
      clamp(Math.max(...corners.map((point) => point[0])) / viewport.width),
      clamp(Math.max(...corners.map((point) => point[1])) / viewport.height),
    ],
    has_eol: item.hasEOL,
    text: item.str,
  }
}
