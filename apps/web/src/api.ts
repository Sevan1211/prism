import type {
  ImportJob,
  ImportResponse,
  LessonPackage,
  ResearchEvent,
  RightsStatus,
  SourceReadiness,
  SourceSummary,
} from './types'

export const API_BASE = import.meta.env.VITE_PRISM_API_URL ?? 'http://127.0.0.1:8000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init)
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null
    throw new Error(body?.detail ?? `PRISM request failed (${response.status})`)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export function listSources(): Promise<SourceSummary[]> {
  return request('/api/sources')
}

export function uploadSource(
  file: File,
  rightsStatus: RightsStatus,
): Promise<ImportResponse> {
  const body = new FormData()
  body.append('file', file)
  body.append('rights_status', rightsStatus)
  return request('/api/sources', { method: 'POST', body })
}

export function importStatus(jobId: string): Promise<ImportJob> {
  return request(`/api/imports/${encodeURIComponent(jobId)}`)
}

export function resumeImport(jobId: string): Promise<ImportJob> {
  return request(`/api/imports/${encodeURIComponent(jobId)}/resume`, { method: 'POST' })
}

export function sourceReadiness(
  sourceId: string,
  pageStart?: number,
  pageEnd?: number,
): Promise<SourceReadiness> {
  const search = pageStart !== undefined && pageEnd !== undefined
    ? `?page_start=${encodeURIComponent(pageStart)}&page_end=${encodeURIComponent(pageEnd)}`
    : ''
  return request(`/api/sources/${encodeURIComponent(sourceId)}/readiness${search}`)
}

export function compileLesson(
  sourceId: string,
  pageStart: number,
  pageEnd: number,
  title?: string,
): Promise<LessonPackage> {
  return request(`/api/sources/${encodeURIComponent(sourceId)}/lessons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page_start: pageStart, page_end: pageEnd, title: title || null }),
  })
}

export function recordEvent(event: ResearchEvent): Promise<void> {
  return request('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...event, payload: event.payload ?? {} }),
    keepalive: true,
  })
}

export function sourceFileUrl(sourceId: string, pageNumber: number): string {
  return `${API_BASE}/api/sources/${encodeURIComponent(sourceId)}/file#page=${pageNumber}`
}

export function sourceVisualUrl(sourceId: string, visualId: string): string {
  return `${API_BASE}/api/sources/${encodeURIComponent(sourceId)}/visuals/${encodeURIComponent(visualId)}`
}
