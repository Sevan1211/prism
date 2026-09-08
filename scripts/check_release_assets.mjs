import { readdir, readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../apps/web/dist/', import.meta.url))
if (path.resolve(await realpath(root)) !== path.resolve(root)) throw new Error('Release directory must not be a symlink.')
const files = await readdir(root, { recursive: true, withFileTypes: true })
for (const file of files) {
  if (file.isSymbolicLink() || /\.(?:pdf|sqlite3?|db|env|pem|key)$/i.test(file.name) || file.name.startsWith('.env')) {
    throw new Error(`Private or unsupported release asset: ${file.name}`)
  }
  if (!file.isFile() || !/\.(?:[cm]?js|html|json|md|txt)$/i.test(file.name)) continue
  const text = await readFile(path.join(file.parentPath, file.name), 'utf8')
  if (/\blocal_[a-f0-9]{64}\b|\blesson_[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\b/i.test(text)) throw new Error('Hardcoded private library identifier in release assets.')
  if (/\bsk_(?:live|test)_[A-Za-z0-9]+|-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(text)) throw new Error('Secret in release assets.')
}
await readFile(path.join(root, 'index.html'))
console.log(`Release assets checked: ${files.filter(file => file.isFile()).length} files; no PDFs, private library IDs or secret keys.`)
