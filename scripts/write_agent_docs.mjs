import { writeFile, readFile } from 'node:fs/promises'
import { AUTHORING_GUIDE } from '../apps/web/src/webmcp/authoringGuide.ts'

const registeredTools = (await Promise.all(['usePrismLibraryTools.ts', 'useDocumentIntelligenceTools.ts'].map(name => readFile(new URL(`../apps/web/src/webmcp/${name}`, import.meta.url), 'utf8'))))
  .flatMap(source => [...source.matchAll(/\bname: '([a-z_]+)'/g)].map(match => match[1])).sort()
if (new Set(registeredTools).size !== registeredTools.length) throw new Error('Duplicate tool names in generated agent inventory.')

// Both discovery files are generated from the same contract returned by WebMCP.
const files = {
  'llms.txt': `# PRISM\n\n> A source-grounded reading workspace. Work with the user's PDFs through this page's WebMCP tools.\n\n## Agent documentation\n\n- [Agent guide](/agent-guide.md): startup, lossless batch evidence, visuals, composition and revision.\n\n## Start\n\nDiscover the top-level page's registered WebMCP tools through your browser host. Call get_active_lesson_context, then get_authoring_guide once. Use read_source_packet for indexed text and browser vision for relevant original images. If the host cannot discover tools, report that limitation before substituting manual Reader scans.\n\nThis file documents the interface; it does not enable WebMCP or grant permission. Do not fetch private sources, account tokens or library data through undocumented endpoints.\n`,
  'agent-guide.md': `# PRISM agent guide\n\n${AUTHORING_GUIDE.purpose}\n\n${AUTHORING_GUIDE.startup}\n\nDiscover WebMCP through your browser host on the top-level PRISM tab. Tool names, descriptions and input schemas are registered with document.modelContext.registerTool. If tools are unavailable, report it and ask the user to check Agent tools and the browser's site-tool settings. Do not silently switch to scanning every Reader page.\n\n## Workflow\n\n${AUTHORING_GUIDE.workflow.map((step, index) => `${index + 1}. ${step}`).join('\n\n')}\n\n## Writing\n\n${AUTHORING_GUIDE.writing}\n\n## Content review\n\n${AUTHORING_GUIDE.coverage_review}\n\n## Visuals\n\n${Object.entries(AUTHORING_GUIDE.visuals).map(([name, guidance]) => `### ${name}\n\n${guidance}`).join('\n\n')}\n\n## Boundaries\n\n${AUTHORING_GUIDE.boundaries}\n\n## Browser guidance\n\n- [OpenAI WebMCP setup](https://learn.chatgpt.com/docs/webmcp)\n- [Chrome WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)\n- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)\n\nGenerated from the same authoring contract as get_authoring_guide. These instructions do not override the user's request or grant approval.\n`,
}
files['agent-guide.md'] += `\n## Registered tools\n\n${registeredTools.map(name => `- \`${name}\``).join('\n')}\n\nUse get_authoring_guide with topic core (default), writing, visuals or revisions for focused guidance. Saved-work discovery uses get_authoring_workspace with view discovery and a source_id; visual inspection requires action open or close.\n`
for (const [name, content] of Object.entries(files)) {
  const path = new URL(`../apps/web/public/${name}`, import.meta.url)
  if (process.argv.includes('--check')) {
    if (await readFile(path, 'utf8') !== content) throw new Error(`${name} is stale; run node scripts/write_agent_docs.mjs.`)
  } else await writeFile(path, content)
}
