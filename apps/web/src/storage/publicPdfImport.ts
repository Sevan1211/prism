const MAX_BYTES = 128 * 1024 * 1024

export async function downloadPublicPdf(rawUrl: string, signal?: AbortSignal, onProgress?: (bytes: number) => void): Promise<File> {
  const url = new URL(rawUrl)
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use a public HTTPS PDF link without embedded credentials.')
  let response: Response
  try { response = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: signal ?? AbortSignal.timeout(90_000) }) }
  catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new Error('This site does not allow a direct browser download, or the connection failed. Download the PDF yourself and choose the local file.', { cause })
  }
  if (!response.ok || !response.body) throw new Error(`The PDF download failed (${response.status}). Choose a local file instead.`)
  if (Number(response.headers.get('content-length')) > MAX_BYTES) { await response.body.cancel(); throw new Error('The PDF exceeds the 128 MB import limit.') }
  const reader = response.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > MAX_BYTES) throw new Error('The PDF exceeds the 128 MB import limit.')
      chunks.push(new Uint8Array(value)); onProgress?.(size)
    }
  } catch (cause) { await reader.cancel().catch(() => undefined); throw cause }
  finally { reader.releaseLock() }
  const blob = new Blob(chunks, { type: 'application/pdf' })
  const prefix = new TextDecoder().decode(await blob.slice(0, 1024).arrayBuffer())
  if (!prefix.includes('%PDF-')) throw new Error('That link returned a web page or unsupported file. Choose a direct PDF link or upload the downloaded PDF.')
  let filename = url.pathname.split('/').pop() || 'document.pdf'
  try { filename = decodeURIComponent(filename) } catch { /* Keep a malformed escaped filename readable. */ }
  let name = Array.from(filename, character => character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character) ? '_' : character).join('')
  if (!name.toLowerCase().endsWith('.pdf')) name += '.pdf'
  return new File([blob], name, { type: 'application/pdf' })
}
