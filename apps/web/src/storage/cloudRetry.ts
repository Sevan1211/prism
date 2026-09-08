/** Persist only a retry deadline, scoped to the account, so reloads and other
 * tabs respect the same server limit. Never store tokens or request contents. */
export function cloudRetryAt(owner: string): number {
  try {
    const value = Number(localStorage.getItem(`prism-cloud-retry:${owner}`))
    return Number.isFinite(value) && value > Date.now() ? value : 0
  } catch { return 0 }
}

export function deferCloudRequests(owner: string, retryAfter: string | null): number {
  const seconds = retryAfter === null ? NaN : Number(retryAfter)
  const parsed = Number.isFinite(seconds) ? Date.now() + seconds * 1000 : Date.parse(retryAfter ?? '')
  // Old servers and intermediary challenges may omit Retry-After.
  const deadline = Math.max(cloudRetryAt(owner), Date.now() + 1000, Number.isFinite(parsed) ? parsed : Date.now() + 60000)
  try { localStorage.setItem(`prism-cloud-retry:${owner}`, String(deadline)) } catch { /* The current request still reports its deadline. */ }
  return deadline
}

export function cloudRetryMessage(deadline: number) {
  return `Changes are saved on this browser. Cloud sync will retry after ${new Date(deadline).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`
}
