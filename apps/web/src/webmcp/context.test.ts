import { afterEach, describe, expect, it } from 'vitest'
import { installFakeModelContext } from '../test/fakeModelContext'
import {
  agentContentAllowed,
  registerPageTool,
  textResult,
  webMCPAvailable,
} from './context'

let fake: ReturnType<typeof installFakeModelContext> | null = null

afterEach(() => {
  fake?.uninstall()
  fake = null
  delete window.__prismWebMCP
})

describe('registerPageTool', () => {
  it('registers with the browser model context and unregisters via abort', () => {
    fake = installFakeModelContext()
    const cleanup = registerPageTool({
      name: 'demo_tool',
      description: 'demo',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: async () => textResult({ ok: true }),
    })

    expect(webMCPAvailable()).toBe(true)
    expect(fake.tools.has('demo_tool')).toBe(true)
    expect(window.__prismWebMCP?.tools.has('demo_tool')).toBe(true)

    cleanup()
    expect(fake.tools.has('demo_tool')).toBe(false)
    expect(window.__prismWebMCP?.tools.has('demo_tool')).toBe(false)
  })

  it('keeps the inspectable registry even when the browser has no model context', () => {
    const cleanup = registerPageTool({
      name: 'offline_tool',
      description: 'demo',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: async () => textResult('ok'),
    })

    expect(webMCPAvailable()).toBe(false)
    expect(window.__prismWebMCP?.available).toBe(false)
    expect(window.__prismWebMCP?.tools.has('offline_tool')).toBe(true)
    cleanup()
    expect(window.__prismWebMCP?.tools.has('offline_tool')).toBe(false)
  })
})

describe('result and gating helpers', () => {
  it('bounds oversized tool results', () => {
    const oversized = textResult('x'.repeat(20_000))
    expect(oversized.content[0].text.length).toBeLessThan(17_000)
    expect(oversized.content[0].text.endsWith('…[truncated]')).toBe(true)
  })

  it('permits agent content only for openly licensed sources', () => {
    expect(agentContentAllowed('open_license')).toBe(true)
    expect(agentContentAllowed('public_domain')).toBe(true)
    expect(agentContentAllowed('private_authorized')).toBe(false)
    expect(agentContentAllowed('unknown')).toBe(false)
  })
})
