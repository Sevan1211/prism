import { useMemo, useSyncExternalStore } from 'react'

export interface ReaderNavigationState {
  sourceId: string
  requestKey: string
  returnHref: string
  targetId: string | null
  highlight: { elementId: string; page: number; bounds: [number, number, number, number] } | null
}
export interface PrismNavigationState {
  version: 1
  key: string
  returnTargetId?: string
  reader?: ReaderNavigationState
}
type NavigationData = Pick<PrismNavigationState, 'returnTargetId' | 'reader'>
let navigationRevision = 0
const locationListeners = new Set<() => void>()

export type SourceView = 'overview' | 'lessons'

export type PrismRoute =
  | { kind: 'landing' }
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
  let url: URL
  try { url = new URL(href, 'http://prism.local') } catch { return { kind: 'not_found' } }
  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.length === 0) return { kind: 'landing' }
  if (segments.length === 1 && segments[0] === 'sources') {
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
      planId: rawPlanId && validId(rawPlanId) ? rawPlanId : null,
      sourceId,
      view: 'lessons',
    }
  }
  if (segments.length === 3 && segments[2] === 'reader') {
    const rawPage = url.searchParams.get('page') ?? ''
    return {
      kind: 'reader',
      page: /^[1-9]\d*$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) ? Number(rawPage) : null,
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

export function navigatePrism(href: string, options?: { replace?: boolean; state?: NavigationData }): void {
  const current = currentLocation()
  const target = new URL(href, window.location.origin)
  if (target.origin !== window.location.origin) throw new Error('PRISM navigation requires a same-origin URL.')
  const next = `${target.pathname}${target.search}${target.hash}`
  if (current === next && options?.state === undefined) return
  const before = parsePrismRoute(current), after = parsePrismRoute(next)
  const previous = readPrismNavigationState()
  const continuingReader = before.kind === 'reader' && after.kind === 'reader' && before.sourceId === after.sourceId
  const data = options?.state ?? (continuingReader && previous?.reader ? { reader: previous.reader } : {})
  const key = options?.replace && options.state === undefined && previous ? previous.key : crypto.randomUUID()
  const state = validateNavigationState({ version: 1, key, ...data }, after)
  window.history[options?.replace || current === next ? 'replaceState' : 'pushState']({ ...window.history.state, prism: state }, '', next)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function subscribeToLocation(listener: () => void): () => void {
  if (!locationListeners.size) {
    window.addEventListener('popstate', locationChanged)
    window.addEventListener('hashchange', locationChanged)
  }
  locationListeners.add(listener)
  return () => {
    locationListeners.delete(listener)
    if (!locationListeners.size) {
      window.removeEventListener('popstate', locationChanged)
      window.removeEventListener('hashchange', locationChanged)
    }
  }
}

function locationChanged() { navigationRevision++; for (const listener of locationListeners) listener() }

/** Includes traversal so returning to the same entry can restore focus again. */
export function usePrismNavigationState() {
  const snapshot = useSyncExternalStore(subscribeToLocation,
    () => JSON.stringify({ state: readPrismNavigationState(), revision: navigationRevision }),
    () => '{"state":null,"revision":0}')
  return useMemo(() => JSON.parse(snapshot) as { state: PrismNavigationState | null; revision: number }, [snapshot])
}

export function navigationToken() { return `${navigationRevision}:${currentLocation()}` }

export function readPrismNavigationState(): PrismNavigationState | null {
  return validateNavigationState(window.history.state?.prism, parsePrismRoute(currentLocation()))
}

/** Mark the origin before leaving; do not focus it while the citation is opening. */
export function rememberReturnTarget(targetId?: string) {
  const previous = readPrismNavigationState()
  const state = validateNavigationState({ version: 1, key: previous?.key ?? crypto.randomUUID(), returnTargetId: targetId }, parsePrismRoute(currentLocation()))
  window.history.replaceState({ ...window.history.state, prism: state }, '', currentLocation())
}

function validateNavigationState(value: unknown, route: PrismRoute): PrismNavigationState | null {
  if (!value || typeof value !== 'object') return null
  const data = value as Partial<PrismNavigationState>
  if (data.version !== 1 || !validId(data.key)) return null
  const result: PrismNavigationState = { version: 1, key: data.key }
  if ((route.kind === 'lesson' || (route.kind === 'source' && route.view === 'lessons')) && validId(data.returnTargetId)) result.returnTargetId = data.returnTargetId
  const reader = data.reader
  if (route.kind !== 'reader' || !reader || reader.sourceId !== route.sourceId || !validId(reader.requestKey)) return result
  if (typeof reader.returnHref !== 'string' || reader.returnHref.length > 2000 || !reader.returnHref.startsWith('/') || reader.returnHref.startsWith('//')) return result
  let target: URL
  try { target = new URL(reader.returnHref, window.location.origin) } catch { return result }
  if (target.origin !== window.location.origin) return result
  const destination = parsePrismRoute(reader.returnHref)
  if (destination.kind !== 'lesson' && !(destination.kind === 'source' && destination.sourceId === route.sourceId)) return result
  let highlight: ReaderNavigationState['highlight'] = null
  const candidate = reader.highlight
  if (candidate && validId(candidate.elementId) && Number.isSafeInteger(candidate.page) && candidate.page > 0
    && Array.isArray(candidate.bounds) && candidate.bounds.length === 4 && candidate.bounds.every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1)
    && candidate.bounds[2] > candidate.bounds[0] && candidate.bounds[3] > candidate.bounds[1]) {
    highlight = { elementId: candidate.elementId, page: candidate.page, bounds: [...candidate.bounds] }
  }
  result.reader = { sourceId: route.sourceId, requestKey: reader.requestKey, returnHref: `${target.pathname}${target.search}${target.hash}`, targetId: validId(reader.targetId) ? reader.targetId : null, highlight }
  return result
}

function currentLocation(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function serverLocation(): string {
  return '/'
}

function safeDecode(value: string): string | null {
  try {
    const decoded = decodeURIComponent(value)
    return validId(decoded) ? decoded : null
  } catch {
    return null
  }
}

function validId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 512
    && !value.includes('/') && !value.includes('\\')
    && !Array.from(value).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
}
