// Minimal ambient types for the WebMCP API currently supported by the built-in
// browser: JavaScript registration through document.modelContext on the top-level page.

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
}
