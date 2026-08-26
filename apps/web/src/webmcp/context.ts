import type {
  ModelContext,
  ModelContextToolDescriptor,
  ModelContextToolResult,
} from './types'

// Tool results travel to the visitor's browser agent (and that agent's vendor),
// so responses stay bounded and content-bearing tools must pass the per-source
// rights gate before returning source text.
const MAX_RESULT_CHARACTERS = 16_000

export function modelContext(): ModelContext | null {
  // Chrome 150 deprecates navigator.modelContext; the origin trial still ships it.
  return document.modelContext ?? navigator.modelContext ?? null
}

export function webMCPAvailable(): boolean {
  return modelContext() !== null
}

function debugRegistry() {
  window.__prismWebMCP ??= { available: webMCPAvailable(), tools: new Map() }
  window.__prismWebMCP.available = webMCPAvailable()
  return window.__prismWebMCP
}

/**
 * Register one tool with the page's model context. Always records the tool in
 * the local debug registry (so registration is inspectable in any browser) and
 * registers with the real API when the browser provides one. Returns a cleanup
 * that unregisters via AbortSignal and never throws: an experimental browser
 * API must not be able to break the instrument.
 */
export function registerPageTool(tool: ModelContextToolDescriptor): () => void {
  const registry = debugRegistry()
  registry.tools.set(tool.name, tool)
  const controller = new AbortController()
  const context = modelContext()
  if (context) {
    try {
      void context.registerTool(tool, { signal: controller.signal })
    } catch {
      // Registration failure leaves the app fully functional without agents.
    }
  }
  return () => {
    controller.abort()
    registry.tools.delete(tool.name)
  }
}

export function textResult(payload: unknown): ModelContextToolResult {
  let text = typeof payload === 'string' ? payload : JSON.stringify(payload)
  if (text.length > MAX_RESULT_CHARACTERS) {
    text = `${text.slice(0, MAX_RESULT_CHARACTERS)}…[truncated]`
  }
  return { content: [{ type: 'text', text }] }
}

export function refusalResult(reason: string): ModelContextToolResult {
  return textResult({ error: reason })
}

/**
 * Per-source agent exposure gate. Tool results leave the device, so only
 * openly licensed sources expose content by default; private or unknown-rights
 * sources require an explicit future per-source opt-in that does not exist yet.
 */
export function agentContentAllowed(rightsStatus: string): boolean {
  return rightsStatus === 'public_domain' || rightsStatus === 'open_license'
}

export const AGENT_ACCESS_REFUSAL =
  'agent_access_not_granted: this source is private or has unknown rights, so its '
  + 'content is not exposed to browser agents. The learner can read it directly in PRISM.'
