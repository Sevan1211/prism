import { readdir, readFile } from 'node:fs/promises'

const key = process.env.VITE_CLERK_PUBLISHABLE_KEY
if (!key?.startsWith('pk_live_')) throw new Error('Deployment requires a production Clerk publishable key.')
const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'))
const origin = 'https://prism.sevanlewispayne.com'
if (config.vars?.PRISM_APP_ORIGIN !== origin || config.vars?.CLOUD_STORAGE_MODE !== 'remote' || config.vars?.CLOUD_STORAGE_ENABLED !== 'true') throw new Error('Production cloud configuration is incomplete.')
if (config.vars?.CLERK_ISSUER !== `https://${Buffer.from(key.slice(8), 'base64').toString().replace(/\$$/, '')}`) throw new Error('Frontend and server Clerk instances differ.')
const assets = new URL('../apps/web/dist/assets/', import.meta.url)
let embedded = false
for (const file of await readdir(assets)) {
  if (!file.endsWith('.js')) continue
  const text = await readFile(new URL(file, assets), 'utf8')
  if (/pk_test_[A-Za-z0-9]{10,}/.test(text)) throw new Error('Development Clerk key in production assets.')
  embedded ||= text.includes(key)
}
if (!embedded) throw new Error('Build the frontend with the production publishable key before deployment.')
await import('./check_release_assets.mjs')
console.log('Production origin and identity configuration checked.')
