import type { ModelContext, ModelContextToolDescriptor } from '../webmcp/types'

interface FakeModelContextOptions {
  rejectRegistrationOnAbort?: boolean
  registrationFailure?: Error
}

/** Install a spec-shaped document.modelContext fake for tests. */
export function installFakeModelContext(options: FakeModelContextOptions = {}) {
  const tools = new Map<string, ModelContextToolDescriptor>()
  let registrationCount = 0
  const context: ModelContext = {
    registerTool: (tool, registrationOptions) => {
      registrationCount += 1
      tools.set(tool.name, tool)
      registrationOptions?.signal?.addEventListener('abort', () => {
        if (tools.get(tool.name) === tool) tools.delete(tool.name)
      })
      if (options.registrationFailure) {
        return Promise.reject(options.registrationFailure)
      }
      if (options.rejectRegistrationOnAbort) {
        return new Promise<void>((_resolve, reject) => {
          registrationOptions?.signal?.addEventListener(
            'abort',
            () => queueMicrotask(() => reject(new DOMException('Registration cancelled', 'AbortError'))),
            { once: true },
          )
        })
      }
    },
  }
  Object.defineProperty(document, 'modelContext', { configurable: true, value: context })
  return {
    tools,
    get registrationCount() {
      return registrationCount
    },
    async execute(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
      const tool = tools.get(name)
      if (!tool) throw new Error(`tool ${name} is not registered`)
      const result = await tool.execute(args)
      return JSON.parse(result.content[0].text) as unknown
    },
    uninstall() {
      delete document.modelContext
      tools.clear()
    },
  }
}
