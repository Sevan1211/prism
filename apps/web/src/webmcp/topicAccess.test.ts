import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requirePlanAccess, requireSelectedSourceAccess } from './topicAccess'
import { loadLibrarySources } from '../library/sourceLibrary'
import type { LessonPlan } from '../lesson/lessonPlanTypes'

vi.mock('../library/sourceLibrary', () => ({ loadLibrarySources: vi.fn() }))
const source = { id: 'private', content_hash: 'hash', rights_status: 'private_authorized', storage_location: 'browser_vault', agent_content_granted: true }
const topic = { source_id: '', source_hash: '', topic: { references: [{ id: 'ref', kind: 'source', source_id: 'private', source_hash: 'hash' }] } } as LessonPlan
beforeEach(() => { vi.mocked(loadLibrarySources).mockResolvedValue([source] as Awaited<ReturnType<typeof loadLibrarySources>>) })

describe('topic evidence permissions', () => {
  it('requires current access for each attached source and rejects removal, revocation and changed fingerprints', async () => {
    await expect(requirePlanAccess(topic)).resolves.toBeUndefined()
    for (const records of [[], [{ ...source, agent_content_granted: false }], [{ ...source, content_hash: 'different' }]]) {
      vi.mocked(loadLibrarySources).mockResolvedValue(records as Awaited<ReturnType<typeof loadLibrarySources>>)
      await expect(requirePlanAccess(topic)).rejects.toThrow()
    }
  })
  it('allows knowledge-only work with no source while keeping selected-source access explicit', async () => {
    vi.mocked(loadLibrarySources).mockResolvedValue([])
    await expect(requirePlanAccess({ ...topic, topic: { ...topic.topic!, references: [] } })).resolves.toBeUndefined()
    await expect(requireSelectedSourceAccess(['private'])).rejects.toThrow()
  })
})
