const origin = 'https://prism.sevanlewispayne.com'
const expected = process.env.PRISM_RELEASE_SHA
if (!/^[a-f0-9]{40}$/.test(expected ?? '')) throw new Error('Expected release commit is required.')
for (let attempt = 0; attempt < 36; attempt++) {
  try {
    const release = await fetch(`${origin}/release.json?t=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
    if (!release.ok) throw new Error(`Release marker returned HTTP ${release.status}; challenge=${release.headers.get('cf-mitigated') === 'challenge'}.`)
    const marker = await release.json()
    if (marker.commit !== expected) throw new Error(`Release has not propagated: received ${/^[a-f0-9]{40}$/.test(marker.commit ?? '') ? marker.commit : 'an invalid marker'}.`)
    for (const route of ['/', '/sources']) {
      const page = await fetch(`${origin}${route}`, { signal: AbortSignal.timeout(15000) })
      if (!page.ok || !(await page.text()).includes('<div id="root">')) throw new Error(`App route failed: ${route}`)
    }
    const account = await fetch(`${origin}/api/account/session`, { signal: AbortSignal.timeout(15000) })
    if (account.status !== 401) throw new Error('Account configuration or anonymous access check failed.')
    console.log(`Verified ${expected} at ${origin}: app routes and authentication boundary.`)
    process.exit(0)
  } catch (error) {
    if (attempt === 35) throw error
    if (attempt === 0 || attempt % 6 === 0) console.warn(`Hosted verification attempt ${attempt + 1}: ${error instanceof Error ? error.message : 'Request failed.'}`)
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
}
