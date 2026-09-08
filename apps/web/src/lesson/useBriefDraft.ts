import { useRef, useState } from 'react'
import type { LessonDepth, LessonOutputKind } from './lessonPlanTypes'

export interface BriefDraft {
  name: string; assignment: string; goal: string; priorKnowledge: string
  outputKind: LessonOutputKind; depth: LessonDepth; includeQuestions: boolean
  targetWords: number | null; pageStart: number; pageEnd: number; timeBudget: number
}

// Unsubmitted requests stay in this tab, separate from the shared lesson library.
export function useBriefDraft(sourceId: string, pageCount: number) {
  const key = `prism:brief-draft:v1:${sourceId}`
  const defaults: BriefDraft = { name: '', assignment: '', goal: '', priorKnowledge: '', outputKind: 'lesson', depth: 'deep', includeQuestions: false, targetWords: null, pageStart: 1, pageEnd: pageCount, timeBudget: 30 }
  const [initial] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key)
      if (!raw) return { draft: defaults, restored: false, error: false }
      const value: unknown = JSON.parse(raw)
      if (!validDraft(value)) return { draft: defaults, restored: false, error: false }
      return { draft: value, restored: true, error: false }
    } catch { return { draft: defaults, restored: false, error: true } }
  })
  const [draft, setDraft] = useState(initial.draft)
  const current = useRef(draft)
  const [storageError, setStorageError] = useState(initial.error)
  const [hasDraft, setHasDraft] = useState(initial.restored)
  function update<K extends keyof BriefDraft>(field: K, value: BriefDraft[K]) {
    const next = { ...current.current, [field]: value }
    current.current = next
    setDraft(next)
    setHasDraft(true)
    try { sessionStorage.setItem(key, JSON.stringify(next)); setStorageError(false) }
    catch { setStorageError(true) }
  }
  function clear() {
    try { sessionStorage.removeItem(key); setStorageError(false) }
    catch { setStorageError(true) }
    current.current = defaults
    setDraft(defaults)
    setHasDraft(false)
  }
  return { draft, update, clear, hasDraft, storageError, restored: initial.restored }
}

function validDraft(value: unknown): value is BriefDraft {
  if (!value || typeof value !== 'object') return false
  const draft = value as Record<string, unknown>
  return ['name', 'assignment', 'goal', 'priorKnowledge'].every(key => typeof draft[key] === 'string' && draft[key].length <= 12000)
    && ['lesson', 'research_brief'].includes(String(draft.outputKind))
    && ['overview', 'standard', 'deep'].includes(String(draft.depth))
    && typeof draft.includeQuestions === 'boolean'
    && ['pageStart', 'pageEnd', 'timeBudget'].every(key => typeof draft[key] === 'number' && Number.isFinite(draft[key]))
    && (draft.targetWords === null || typeof draft.targetWords === 'number' && Number.isFinite(draft.targetWords))
}
