import { useSyncExternalStore } from 'react'

export type SourceView = 'overview' | 'lessons'

export type PrismRoute =
  | { kind: 'library' }
  | { kind: 'lesson'; lessonId: string }
  | { kind: 'reader'; page: number | null; sourceId: string }
  | { kind: 'source'; sourceId: string; view: 'overview' }
  | { kind: 'source'; planId: string | null; sourceId: string; view: 'lessons' }
  | { kind: 'not_found' }

export function usePrismRoute(): PrismRoute {
  const href = useSyncExternalStore(subscribeToLocation, currentLocation, serverLocation)
  return parsePrismRoute(href)
}

export function parsePrismRoute(href: string): PrismRoute {
  const url = new URL(href, 'http://prism.local')
  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'sources')) {
    return { kind: 'library' }
  }
  if (segments.length === 2 && segments[0] === 'lessons') {
    const lessonId = safeDecode(segments[1])
    return lessonId ? { kind: 'lesson', lessonId } : { kind: 'not_found' }
  }
  if (segments[0] !== 'sources' || !segments[1]) return { kind: 'not_found' }

  const sourceId = safeDecode(segments[1])
  if (!sourceId) return { kind: 'not_found' }
  if (segments.length === 2) return { kind: 'source', sourceId, view: 'overview' }
  if (segments.length === 3 && segments[2] === 'lessons') {
    const rawPlanId = url.searchParams.get('plan')
    return {
      kind: 'source',
      planId: rawPlanId ? safeDecode(rawPlanId) : null,
      sourceId,
      view: 'lessons',
    }
  }
  if (segments.length === 3 && segments[2] === 'reader') {
    const rawPage = Number(url.searchParams.get('page'))
    return {
      kind: 'reader',
      page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : null,
      sourceId,
    }
  }
  return { kind: 'not_found' }
}

export function libraryPath(): string {
  return '/sources'
}

export function lessonPath(lessonId: string): string {
  return `/lessons/${encodeURIComponent(lessonId)}`
}

export function sourcePath(
  sourceId: string,
  view: SourceView = 'overview',
  planId?: string | null,
): string {
  const base = `/sources/${encodeURIComponent(sourceId)}`
  if (view !== 'lessons') return base
  return planId
    ? `${base}/lessons?plan=${encodeURIComponent(planId)}`
    : `${base}/lessons`
}

export function readerPath(sourceId: string, page?: number | null): string {
  const base = `${sourcePath(sourceId)}/reader`
  return page && page > 0 ? `${base}?page=${Math.floor(page)}` : base
}

export function navigatePrism(href: string, options?: { replace?: boolean }): void {
  const current = currentLocation()
  const target = new URL(href, window.location.origin)
  const next = `${target.pathname}${target.search}${target.hash}`
  if (current === next) return
  window.history[options?.replace ? 'replaceState' : 'pushState']({}, '', next)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function subscribeToLocation(listener: () => void): () => void {
  window.addEventListener('popstate', listener)
  return () => window.removeEventListener('popstate', listener)
}

function currentLocation(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function serverLocation(): string {
  return '/sources'
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}
