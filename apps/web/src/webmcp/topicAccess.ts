import type { LessonPlan } from '../lesson/lessonPlanTypes'
import { loadLibrarySources } from '../library/sourceLibrary'
import { agentContentAllowed, AGENT_ACCESS_REFUSAL } from './context'

export async function requirePlanAccess(plan: LessonPlan) {
  const sources = await loadLibrarySources()
  const refs = plan.topic ? plan.topic.references.filter(item => item.kind === 'source').map(item => ({ id: item.source_id, hash: item.source_hash })) : [{ id: plan.source_id, hash: plan.source_hash }]
  for (const ref of refs) {
    const source = sources.find(item => item.id === ref.id)
    if (!source || source.content_hash !== ref.hash || !agentContentAllowed(source)) throw new Error(AGENT_ACCESS_REFUSAL)
  }
}

export async function requireSelectedSourceAccess(ids: string[]) {
  const sources = await loadLibrarySources()
  if (ids.some(id => !sources.some(source => source.id === id && agentContentAllowed(source)))) throw new Error(AGENT_ACCESS_REFUSAL)
}
