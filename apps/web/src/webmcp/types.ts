// Minimal ambient types for the experimental WebMCP browser API.
// Spec: https://webmachinelearning.github.io/webmcp/ — document.modelContext,
// with navigator.modelContext as the deprecated pre-Chrome-150 location.

export interface ModelContextToolResult {
  content: Array<{ type: 'text'; text: string }>
}

export interface ModelContextToolDescriptor {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: { readOnlyHint?: boolean }
  execute: (args: Record<string, unknown>) => Promise<ModelContextToolResult>
}

export interface ModelContext {
  registerTool: (
    tool: ModelContextToolDescriptor,
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>
}

declare global {
  interface Document {
    modelContext?: ModelContext
  }
  interface Navigator {
    modelContext?: ModelContext
  }
  interface Window {
    __prismWebMCP?: {
      available: boolean
      tools: Map<string, ModelContextToolDescriptor>
    }
  }
}
