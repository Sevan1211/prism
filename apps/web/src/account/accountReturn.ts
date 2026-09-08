const returnFlag = 'prism_account'

export function isAccountReturn(search: string): boolean {
  const params = new URLSearchParams(search)
  return params.get(returnFlag) === '1' || params.has('__clerk_handshake')
}

/** A local destination: never replay provider handshake data in a redirect. */
export function accountReturnPath(pathname: string, search: string): string {
  const params = new URLSearchParams(search)
  for (const key of [...params.keys()]) if (key.startsWith('__clerk_')) params.delete(key)
  params.set(returnFlag, '1')
  const destination = pathname === '/sources' || pathname.startsWith('/sources/') ? pathname : '/sources'
  return `${destination}?${params}`
}

export function consumeAccountReturnFlag(): void {
  const url = new URL(window.location.href)
  if (!url.searchParams.has(returnFlag)) return
  url.searchParams.delete(returnFlag)
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}
