/** Optional PDF resources stay on this origin and load only when a document needs them. */
export function pdfDocumentOptions(version: string) {
  const base = new URL(`/pdfjs/${version}/`, globalThis.location.href).href
  return {
    cMapUrl: `${base}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${base}standard_fonts/`,
    wasmUrl: `${base}wasm/`,
  }
}
