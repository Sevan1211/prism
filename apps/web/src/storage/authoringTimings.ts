import type { AgentActivityRecord } from './agentActivity'

const stageTools: Record<string, string> = {
  // Historical saved receipts remain measurable; these names are not registered tools.
  read_source_page: 'Source reading', open_source_visual: 'Visual inspection',
  import_public_pdf: 'Import handoff', prepare_source_import: 'Import handoff',
  read_source_packet: 'Source reading', read_source_bundle: 'Source reading',
  inspect_source_visual: 'Visual inspection', get_source_visual_catalog: 'Visual inspection',
  record_scope_review: 'Source review', propose_lesson_plan: 'Planning',
  apply_lesson_patch: 'Composition', validate_lesson: 'Validation', finalize_lesson: 'Final review',
  propose_lesson_revision: 'Revision',
}

// Summed local invocation durations; excludes host/model latency and learner time.
// Calls may overlap, so this is never presented as wall-clock generation time.
export function authoringTimings(records: AgentActivityRecord[]) {
  const stages = new Map<string, { stage: string; calls: number; measuredCalls: number; elapsedMs: number; failures: number }>()
  for (const record of records) {
    const stage = stageTools[record.tool_name]
    if (!stage) continue
    const total = stages.get(stage) ?? { stage, calls: 0, measuredCalls: 0, elapsedMs: 0, failures: 0 }
    total.calls++
    if (record.elapsed_ms !== undefined && Number.isFinite(record.elapsed_ms) && record.elapsed_ms >= 0) {
      total.measuredCalls++
      total.elapsedMs += record.elapsed_ms
    }
    if (record.outcome !== 'success') total.failures++
    stages.set(stage, total)
  }
  return [...stages.values()]
}
