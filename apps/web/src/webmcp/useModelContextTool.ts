import { useEffect, useRef } from 'react'
import { recordWebMcpActivity } from '../storage/agentActivity'
import { registerPageTool } from './context'
import type { ModelContextToolDescriptor, ModelContextToolResult } from './types'

export interface PageToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  readOnly?: boolean
  execute: (args: Record<string, unknown>) => Promise<ModelContextToolResult>
}

/**
 * Register a WebMCP tool for the lifetime of the calling component. The
 * executor lives in a ref so the registered callback always sees current
 * component state without re-registering on every render.
 */
export function useModelContextTool(definition: PageToolDefinition): void {
  const executeRef = useRef(definition.execute)
  useEffect(() => {
    executeRef.current = definition.execute
  }, [definition.execute])

  const { name, description, readOnly } = definition
  const schemaJson = JSON.stringify(definition.inputSchema)

  useEffect(() => {
    const descriptor: ModelContextToolDescriptor = {
      name,
      description,
      inputSchema: JSON.parse(schemaJson) as Record<string, unknown>,
      ...(readOnly ? { annotations: { readOnlyHint: true } } : {}),
      execute: async (args) => {
        const resolvedArgs = args ?? {}
        const started = performance.now()
        try {
          const result = await executeRef.current(resolvedArgs)
          await recordWebMcpActivity(name, resolvedArgs, result, undefined, undefined, performance.now() - started).catch(reportActivityFailure)
          return result
        } catch (cause) {
          await recordWebMcpActivity(name, resolvedArgs, undefined, cause, undefined, performance.now() - started).catch(reportActivityFailure)
          throw cause
        }
      },
    }
    return registerPageTool(descriptor)
  }, [name, description, readOnly, schemaJson])
}

function reportActivityFailure(cause: unknown): void {
  console.warn('[PRISM WebMCP] Agent activity receipt could not be saved.', cause)
}
