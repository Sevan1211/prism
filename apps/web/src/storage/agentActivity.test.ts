import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { textResult } from '../webmcp/context'
import { listAgentActivity, recordWebMcpActivity } from './agentActivity'
import type { BrowserVaultEnvironment } from './browserVault'

function environment(): BrowserVaultEnvironment {
  return {
    indexedDB: new IDBFactory(),
    keyRange: IDBKeyRange,
    storage: {
      getDirectory: async () => ({
        getDirectoryHandle: async () => ({
          getDirectoryHandle: async () => { throw new Error('Not used in this test.') },
          getFileHandle: async () => { throw new Error('Not used in this test.') },
          removeEntry: async () => undefined,
        }),
        getFileHandle: async () => { throw new Error('Not used in this test.') },
        removeEntry: async () => undefined,
      }),
    },
  }
}

describe('agent activity receipts', () => {
  it('records bounded action metadata without retaining private queries or source text', async () => {
    const env = environment()
    await recordWebMcpActivity(
      'search_source',
      { source_id: 'source-1', query: 'private search terms' },
      textResult({ hits: [{ text: 'private source text' }], source_id: 'source-1' }),
      undefined,
      env,
    )

    const records = await listAgentActivity('source-1', 12, env)

    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      kind: 'read',
      outcome: 'success',
      payload_classes: ['source_text'],
      source_id: 'source-1',
      summary: 'Searched the local source index',
      tool_name: 'search_source',
    })
    expect(JSON.stringify(records[0])).not.toContain('private search terms')
    expect(JSON.stringify(records[0])).not.toContain('private source text')
  })

  it('records policy refusals and safe page-range context', async () => {
    const env = environment()
    await recordWebMcpActivity(
      'get_scope_manifest',
      { page_end: 12, page_start: 10, source_id: 'source-2' },
      textResult({ error: 'agent_access_not_granted' }),
      undefined,
      env,
    )

    await expect(listAgentActivity('source-2', 12, env)).resolves.toMatchObject([{
      outcome: 'refused',
      summary: 'Inspected the source scope manifest · pages 10-12',
    }])
  })

  it('records answer-analysis metadata without copying the learner response', async () => {
    const env = environment()
    await recordWebMcpActivity(
      'record_answer_analysis',
      {
        learner_answer: 'A private response written in the agent conversation.',
        lesson_id: 'lesson-1',
      },
      textResult({ source_id: 'source-3', status: 'partially_demonstrated' }),
      undefined,
      env,
    )

    const records = await listAgentActivity('source-3', 12, env)

    expect(records).toMatchObject([{
      payload_classes: ['learner_answer', 'lesson_contract'],
      summary: 'Saved a local evidence-linked answer analysis',
      tool_name: 'record_answer_analysis',
    }])
    expect(JSON.stringify(records)).not.toContain('private response')
  })
})
