export const paginationSchema = {
  cursor: { type: 'string', description: 'Opaque continuation from next_call; restart without it if the collection changed.' },
  limit: { type: 'integer', minimum: 1, maximum: 40 },
}

/** Bounded transport. The checksum detects changed collections; it is not an authorization token. */
export function paginateToolItems<T>(items: T[], tool: string, args: Record<string, unknown>, budget = 12_000) {
  const encoded = items.map(item => JSON.stringify(item))
  let hash = 2166136261
  for (const character of JSON.stringify([tool, Object.fromEntries(Object.entries(args).filter(([key]) => key !== 'cursor' && key !== 'limit').sort(([a], [b]) => a.localeCompare(b))), encoded])) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  }
  const signature = (hash >>> 0).toString(36)
  const limit = args.limit ?? 20
  if (!Number.isSafeInteger(limit) || Number(limit) < 1 || Number(limit) > 40) throw new Error('limit must be an integer from 1 to 40.')
  let start = 0
  if (args.cursor !== undefined) {
    if (typeof args.cursor !== 'string' || !/^[a-z0-9]+:\d+$/.test(args.cursor)) throw new Error('Invalid cursor. Restart without cursor.')
    const [previous, offset] = args.cursor.split(':')
    if (previous !== signature) throw new Error('This collection changed. Restart the same request without cursor.')
    start = Number(offset)
    if (!Number.isSafeInteger(start) || start < 0 || start > items.length) throw new Error('Cursor is outside this collection.')
  }
  let used = 0
  const page: T[] = []
  for (let index = start; index < items.length && page.length < Number(limit); index++) {
    if (used + encoded[index].length > budget) {
      if (!page.length) throw new Error('One item exceeds this view limit. Select its focused detail view.')
      break
    }
    used += encoded[index].length
    page.push(items[index])
  }
  const next = start + page.length < items.length ? `${signature}:${start + page.length}` : null
  return { items: page, total: items.length, next_cursor: next, next_call: next ? { tool, arguments: { ...args, cursor: next } as Record<string, unknown> } : null }
}

export function requireOneSelector(args: Record<string, unknown>, keys: string[]) {
  const present = keys.filter(key => args[key] !== undefined)
  if (present.length !== 1 || typeof args[present[0]] !== 'string' || !String(args[present[0]]).trim()) {
    throw new Error(`Provide exactly one of ${keys.join(', ')}.`)
  }
}
