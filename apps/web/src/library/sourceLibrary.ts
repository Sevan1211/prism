import { listSources } from '../api'
import { companionSource, listBrowserSources, type LibrarySource } from '../storage/browserSources'

export async function loadLibrarySources(): Promise<LibrarySource[]> {
  // A public installation is entirely browser-local. The companion is an
  // explicit deployment option, never an unsolicited request to loopback.
  if (!import.meta.env.VITE_PRISM_API_URL) return listBrowserSources()
  const [browserSources, companionSources] = await Promise.allSettled([
    listBrowserSources(),
    listSources(),
  ])
  if (browserSources.status === 'rejected' && companionSources.status === 'rejected') {
    throw new Error('Neither the browser vault nor the loopback source library could be opened.')
  }

  const local = browserSources.status === 'fulfilled' ? browserSources.value : []
  const companion = companionSources.status === 'fulfilled'
    ? companionSources.value.map(companionSource)
    : []
  return [...local, ...companion]
}
