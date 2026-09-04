import { accessBrowserVault, PRISM_VAULT_AGENT_GRANT_STORE, PRISM_VAULT_CHANGED_EVENT, PRISM_VAULT_ILLUSTRATION_STORE, PRISM_VAULT_SOURCE_STORE, type BrowserVaultEnvironment } from './browserVault'

export interface LessonIllustration {
  asset_id: string; source_id: string; origin: 'ai_generated'; blob: Blob
  width: number; height: number; attribution: string; purpose: string
}

export function decodeIllustrationData(data: string) {
  if (data.length > 8_400_000) throw new Error('Use an illustration smaller than 6 MB.')
  const match = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/.exec(data)
  if (!match) throw new Error('Illustrations must be PNG or JPEG data URLs. Executable and remote images are not accepted.')
  const binary = atob(match[2])
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
  if (bytes.length > 6_000_000) throw new Error('Use an illustration smaller than 6 MB.')
  const view = new DataView(bytes.buffer)
  let width = 0, height = 0
  if (match[1] === 'image/png' && bytes.length >= 24 && view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a && view.getUint32(12) === 0x49484452) {
    width = view.getUint32(16); height = view.getUint32(20)
  } else if (match[1] === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) break
      const marker = bytes[i + 1], length = view.getUint16(i + 2)
      if ([0xc0, 0xc1, 0xc2].includes(marker)) { height = view.getUint16(i + 5); width = view.getUint16(i + 7); break }
      if (length < 2) break
      i += length + 2
    }
  }
  if (width < 1 || height < 1 || width > 8192 || height > 8192 || width * height > 12_000_000) throw new Error('Invalid raster header or image dimensions exceed 12 megapixels.')
  return { blob: new Blob([bytes], { type: match[1] }), width, height }
}

export async function importGeneratedIllustration(input: { source_id: string; data_url: string; attribution: string; purpose: string }) {
  if (!input.attribution.trim() || input.attribution.length > 600 || !input.purpose.trim() || input.purpose.length > 1200) throw new Error('Include concise attribution and a concrete explanatory purpose.')
  const decoded = decodeIllustrationData(input.data_url)
  const bitmap = await createImageBitmap(decoded.blob)
  try { if (bitmap.width * bitmap.height > 12_000_000) throw new Error('Decoded image is too large.') } finally { bitmap.close() }
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', await decoded.blob.arrayBuffer()))
  const hash = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('')
  const image: LessonIllustration = { ...decoded, asset_id: `image_${input.source_id}_${hash}`, source_id: input.source_id, origin: 'ai_generated', attribution: input.attribution.trim(), purpose: input.purpose.trim() }
  await accessBrowserVault(database => new Promise<void>((resolve, reject) => {
    const tx = database.transaction([PRISM_VAULT_SOURCE_STORE, PRISM_VAULT_AGENT_GRANT_STORE, PRISM_VAULT_ILLUSTRATION_STORE], 'readwrite')
    const source = tx.objectStore(PRISM_VAULT_SOURCE_STORE).get(input.source_id)
    const grant = tx.objectStore(PRISM_VAULT_AGENT_GRANT_STORE).get(input.source_id)
    let failure: Error | undefined
    grant.onsuccess = () => {
      const record = source.result
      if (!record || (!['open_license', 'public_domain'].includes(record.rights_status) && grant.result?.source_hash !== record.content_hash)) {
        failure = new Error('This source is missing or agent access was revoked.'); tx.abort(); return
      }
      const store = tx.objectStore(PRISM_VAULT_ILLUSTRATION_STORE)
      const prior = store.get(image.asset_id)
      prior.onsuccess = () => { if (!prior.result) store.add(image) }
    }
    tx.oncomplete = () => resolve()
    tx.onabort = tx.onerror = () => reject(failure ?? tx.error ?? new Error('The illustration could not be saved.'))
  }))
  window.dispatchEvent(new Event(PRISM_VAULT_CHANGED_EVENT))
  return { asset_id: image.asset_id, width: image.width, height: image.height, label: 'AI-generated illustration', source_id: image.source_id }
}

export function getLessonIllustration(assetId: string, sourceId: string, environment?: BrowserVaultEnvironment): Promise<LessonIllustration | undefined> {
  return accessBrowserVault(database => new Promise((resolve, reject) => {
    const request = database.transaction(PRISM_VAULT_ILLUSTRATION_STORE, 'readonly').objectStore(PRISM_VAULT_ILLUSTRATION_STORE).get(assetId)
    request.onsuccess = () => resolve(request.result?.source_id === sourceId ? request.result : undefined)
    request.onerror = () => reject(request.error)
  }), environment)
}
