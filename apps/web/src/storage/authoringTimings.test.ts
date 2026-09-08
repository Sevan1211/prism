import { describe, expect, it } from 'vitest'
import { authoringTimings } from './authoringTimings'
import type { AgentActivityRecord } from './agentActivity'

describe('local authoring timings', () => {
  it('keeps missing durations and failures visible without treating unknown time as zero', () => {
    const record = (tool_name: string, elapsed_ms?: number, outcome = 'success') => ({ tool_name, elapsed_ms, outcome }) as AgentActivityRecord
    expect(authoringTimings([
      record('read_source_packet', 120), record('read_source_page'),
      record('read_source_packet', 40, 'error'), record('open_lesson', 500),
      record('apply_lesson_patch', Number.NaN), record('apply_lesson_patch', -10),
    ])).toEqual([
      { stage: 'Source reading', calls: 3, measuredCalls: 2, elapsedMs: 160, failures: 1 },
      { stage: 'Composition', calls: 2, measuredCalls: 0, elapsedMs: 0, failures: 0 },
    ])
  })
})
