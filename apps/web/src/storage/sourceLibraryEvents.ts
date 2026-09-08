const SOURCE_CHANNEL = 'prism:source-library'
const SOURCE_EVENT = 'prism:sources-changed'

/** Metadata-only notifications. PDF content and grants never travel on this channel. */
export function notifySourcesChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(SOURCE_EVENT))
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel(SOURCE_CHANNEL)
  channel.postMessage('changed')
  channel.close()
}

export function subscribeSourcesChanged(refresh: () => void): () => void {
  const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(SOURCE_CHANNEL)
  if (channel) channel.onmessage = (event) => { if (event.data === 'changed') refresh() }
  window.addEventListener(SOURCE_EVENT, refresh)
  window.addEventListener('focus', refresh)
  return () => {
    window.removeEventListener(SOURCE_EVENT, refresh)
    window.removeEventListener('focus', refresh)
    channel?.close()
  }
}
