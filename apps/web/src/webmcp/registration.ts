import type { ModelContext, ModelContextToolDescriptor } from './types'

interface Registration {
  tool: ModelContextToolDescriptor
  context?: ModelContext
  controller?: AbortController
  failed: boolean
}

interface RegistrationStatus {
  supported: boolean
  offered: number
  pending: number
  failures: string[]
  lastCall: { name: string; succeeded: boolean } | null
}

// One registry per page: route changes do not restart discovery or create a
// polling loop per tool. No source text, arguments, or results are retained here.
const entries = new Set<Registration>()
const listeners = new Set<() => void>()
let snapshot: RegistrationStatus = { supported: false, offered: 0, pending: 0, failures: [], lastCall: null }
let timer: ReturnType<typeof setTimeout> | undefined
let attempt = 0
const delays = [100, 250, 500, 1000, 2000, 4000, 8000]

export const getRegistrationStatus = () => snapshot
export function subscribeRegistration(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function publish() {
  const current = document.modelContext
  const supported = typeof current?.registerTool === 'function'
  const offered = [...entries].filter(entry => entry.context === current && entry.controller && !entry.failed).length
  const failures = [...entries].filter(entry => entry.failed).map(entry => entry.tool.name).sort()
  const next = { supported, offered, pending: entries.size - offered - failures.length, failures, lastCall: snapshot.lastCall }
  if (JSON.stringify(next) === JSON.stringify(snapshot)) return
  snapshot = next
  listeners.forEach(listener => listener())
}

function register(entry: Registration, context: ModelContext) {
  entry.controller?.abort()
  const controller = new AbortController()
  entry.controller = controller
  entry.context = context
  entry.failed = false
  const failed = (cause: unknown) => {
    if (!entries.has(entry) || controller.signal.aborted) return
    entry.failed = true
    controller.abort()
    console.warn(`[PRISM WebMCP] Could not register "${entry.tool.name}".`, cause)
    publish()
  }
  try {
    // Some hosts keep this promise pending until removal. Do not await it.
    const result = context.registerTool({
      ...entry.tool,
      execute: async args => {
        try {
          const result = await entry.tool.execute(args)
          snapshot = { ...snapshot, lastCall: { name: entry.tool.name, succeeded: !result.isError } }
          listeners.forEach(listener => listener())
          return result
        } catch (cause) {
          snapshot = { ...snapshot, lastCall: { name: entry.tool.name, succeeded: false } }
          listeners.forEach(listener => listener())
          throw cause
        }
      },
    }, { signal: controller.signal })
    if (result) void result.catch(failed)
  } catch (cause) { failed(cause) }
}

function refresh() {
  const context = document.modelContext
  if (typeof context?.registerTool === 'function') {
    for (const entry of entries) if (entry.context !== context) register(entry, context)
  } else {
    for (const entry of entries) {
      entry.controller?.abort()
      entry.controller = undefined
      entry.context = undefined
      entry.failed = false
    }
  }
  publish()
}

function probe() {
  timer = undefined
  refresh()
  if (entries.size && !snapshot.supported && attempt < delays.length) {
    timer = setTimeout(probe, delays[attempt++])
  }
}

function resumeDiscovery() {
  if (timer !== undefined) clearTimeout(timer)
  attempt = 0
  probe()
}

/** Explicit recovery retries failures; ordinary renders never duplicate tools. */
export function retryRegistrations() {
  for (const entry of entries) if (entry.failed) entry.context = undefined
  resumeDiscovery()
}

export function registerPageTool(tool: ModelContextToolDescriptor): () => void {
  const entry: Registration = { tool, failed: false }
  entries.add(entry)
  if (entries.size === 1) {
    window.addEventListener('focus', resumeDiscovery)
    window.addEventListener('pageshow', resumeDiscovery)
    resumeDiscovery()
  } else refresh()
  return () => {
    if (!entries.delete(entry)) return
    entry.controller?.abort()
    if (!entries.size) {
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      window.removeEventListener('focus', resumeDiscovery)
      window.removeEventListener('pageshow', resumeDiscovery)
      snapshot = { ...snapshot, lastCall: null }
    }
    publish()
  }
}
