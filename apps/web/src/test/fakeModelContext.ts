import type { ModelContext, ModelContextToolDescriptor } from '../webmcp/types'

/** Install a spec-shaped document.modelContext fake for tests. */
export function installFakeModelContext() {
  const tools = new Map<string, ModelContextToolDescriptor>()
  const context: ModelContext = {
    registerTool: (tool, options) => {
      tools.set(tool.name, tool)
      options?.signal?.addEventListener('abort', () => {
        if (tools.get(tool.name) === tool) tools.delete(tool.name)
      })
    },
  }
  Object.defineProperty(document, 'modelContext', { configurable: true, value: context })
  return {
    tools,
    async execute(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
      const tool = tools.get(name)
      if (!tool) throw new Error(`tool ${name} is not registered`)
      const result = await tool.execute(args)
      return JSON.parse(result.content[0].text) as unknown
    },
    uninstall() {
      delete document.modelContext
      delete window.__prismWebMCP
      tools.clear()
    },
  }
}
