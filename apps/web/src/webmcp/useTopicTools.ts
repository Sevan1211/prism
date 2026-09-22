import { paginateToolItems, paginationSchema } from './toolPagination'
import { useModelContextTool } from './useModelContextTool'
import { createTopicSeries, getTopicSeries, listTopicSeries, proposeTopicSeries } from '../lesson/topicSeries'
import { getLessonPlan } from '../lesson/lessonPlans'
import { getLessonDocumentByPlan } from '../lesson/lessonDocuments'
import { loadSourceFolders } from '../storage/sourceFolders'
import { requirePlanAccess, requireSelectedSourceAccess } from './topicAccess'
import { textResult } from './context'
import { navigatePrism } from '../navigation'

const string = { type: 'string', minLength: 1, maxLength: 2000 }
const strings = { type: 'array', maxItems: 40, items: string }
const object = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false })
const modes = { enum: ['knowledge_research', 'knowledge_only', 'selected_sources'] }

export function useTopicTools(existing: { objectives: unknown; sections: unknown; end_questions: unknown }) {
  useModelContextTool({ name: 'get_topic_workspace', description: 'Discover folders including empty folders and topic requests, or resume a series. A series contains one or more ordinary lessons. Always ask real clarifying questions and wait for learner answers before proposing new work. Omit series_id for discovery; pass plan_id with series_id for a lesson summary, then follow focused detail_calls and pagination for sections, objectives, practice and references. Never infer approval from conversation or browser automation.', readOnly: true,
    inputSchema: object({ series_id: string, plan_id: string, part: { enum: ['sections', 'objectives', 'questions', 'references'] }, ...paginationSchema }, []),
    execute: async args => {
      if (!args.series_id) {
        if (args.plan_id || args.part) throw new Error('plan_id and part require series_id.')
        const [{ folders }, series] = await Promise.all([loadSourceFolders(), listTopicSeries()])
        const entries = [...folders.map(item => ({ kind: 'folder', ...item })), ...series.map(item => ({ kind: 'series', id: item.id, title: item.title, folder_id: item.folder_id, status: item.status, version: item.version }))]
        return textResult({ ...paginateToolItems(entries, 'get_topic_workspace', args), workflow: 'Use create_topic_request for a new goal, then ask clarifying questions in conversation. Do not invent learner answers. Existing approved series can resume without repeating answered questions.' })
      }
      const series = await getTopicSeries(String(args.series_id))
      await requireSelectedSourceAccess(series.source_ids)
      const plans = await Promise.all(series.plan_ids.map(id => getLessonPlan(id)))
      for (const plan of plans) if (plan) await requirePlanAccess(plan)
      if (args.plan_id && !series.plan_ids.includes(String(args.plan_id))) throw new Error('This plan does not belong to this series.')
      if (args.plan_id && args.part) {
        const plan = plans.find(plan => plan?.plan_id === args.plan_id)!
        const items = args.part === 'references' ? plan.topic!.references : args.part === 'questions' ? plan.end_questions : args.part === 'objectives' ? plan.objectives : plan.sections
        const page = paginateToolItems<unknown>(items, 'get_topic_workspace', args, 16000)
        await requirePlanAccess(plan)
        return textResult({ series_id: series.id, series_version: series.version, plan_id: plan.plan_id, status: plan.status, part: args.part, ...page }, 24000)
      }
      if (args.part) throw new Error('part requires plan_id and series_id.')
      const lessons = await Promise.all(plans.filter(plan => plan && (!args.plan_id || plan.plan_id === args.plan_id)).map(async plan => {
        const document = await getLessonDocumentByPlan(plan!.plan_id)
        return { ...(args.plan_id ? { ...plan, topic: { ...plan!.topic, references: undefined }, sections: undefined, objectives: undefined, end_questions: undefined, detail_calls: ['sections', 'objectives', 'questions', 'references'].map(part => ({ tool: 'get_topic_workspace', arguments: { series_id: series.id, plan_id: plan!.plan_id, part } })) } : { plan_id: plan!.plan_id, title: plan!.title, status: plan!.status, section_count: plan!.sections.length }), lesson_id: document?.lesson_id ?? null, document_version: document?.document_version ?? null, saved_sections: document?.sections.filter(section => section.blocks.length).length ?? 0, reading_status: document?.status ?? 'not_started' }
      }))
      await requireSelectedSourceAccess(series.source_ids)
      for (const plan of plans) if (plan) await requirePlanAccess(plan)
      return textResult({ series, lessons, next_step: series.status === 'clarifying' ? 'Ask clarifying questions and wait for answers. Then propose_topic_series with the actual questions and answers.' : series.status === 'proposed' ? 'Wait for visible learner approval of the entire series. Never click approval yourself.' : 'Read one plan with plan_id, then compose via apply_lesson_patch. Topic blocks use objective_ids and reference_ids; source_element_ids is empty. Save coverage_review with empty source_element_ids. Finalization still requires review of every block and rendered visual inspection.' }, 48000)
    },
  })
  useModelContextTool({ name: 'create_topic_request', description: 'Save the learner’s requested standalone lesson or lesson series, optionally in an existing folder. This creates a brief, not a plan. Source selection is explicit and never inherited from folder membership. Ask clarifying questions before planning; do not fabricate answers. Opened in PRISM for the learner.',
    inputSchema: object({ title: { ...string, maxLength: 160 }, request: { ...string, maxLength: 6000 }, folder_id: { type: ['string', 'null'] }, research_mode: modes, source_role: { enum: ['follow', 'support'] }, source_ids: strings }),
    execute: async args => {
      await requireSelectedSourceAccess(args.source_ids as string[])
      const series = await createTopicSeries(args as unknown as Parameters<typeof createTopicSeries>[0])
      navigatePrism(`/series/${series.id}`)
      return textResult({ series_id: series.id, version: series.version, status: series.status, next_step: 'Ask clarifying questions now, and wait for the learner’s answers before proposing a plan.' })
    },
  })
  const reference = object({ id: string, title: string, kind: { enum: ['web', 'source'] }, url: { type: 'string', maxLength: 4000 }, accessed_at: { type: 'string', description: 'Date actually inspected, YYYY-MM-DD' }, locator: string, support: string, source_id: string, element_ids: strings }, ['id', 'title', 'kind', 'locator', 'support'])
  useModelContextTool({ name: 'propose_topic_series', description: 'After asking clarifying questions and receiving real answers, propose the complete series (one lesson is valid). Save explicit objectives, prerequisites, exclusions, sections, meaningful visuals, optional practice and inspected references. One visible learner approval authorizes all included lessons. May replace an unapproved proposal with expected_version; cannot change approved scope. Web references are agent-reported inspections, not app-verified truth. Do not promise complete coverage of an unbounded subject.',
    inputSchema: object({ series_id: string, expected_version: { type: 'integer', minimum: 1 }, clarifications: { type: 'array', minItems: 1, maxItems: 12, items: object({ question: string, answer: string }) }, assumptions: strings, exclusions: strings, lessons: { type: 'array', minItems: 1, maxItems: 24, items: object({ title: string, prerequisites: strings, exclusions: strings, objectives: existing.objectives, sections: existing.sections, end_questions: existing.end_questions, references: { type: 'array', maxItems: 40, items: reference } }) } }),
    execute: async args => {
      const series = await getTopicSeries(String(args.series_id)); await requireSelectedSourceAccess(series.source_ids)
      const next = await proposeTopicSeries(args as unknown as Parameters<typeof proposeTopicSeries>[0])
      navigatePrism(`/series/${next.id}`)
      return textResult({ series_id: next.id, version: next.version, plan_ids: next.plan_ids, status: next.status, next_step: 'The learner reviews and approves the entire plan in PRISM. Stop before composition.' })
    },
  })
}
