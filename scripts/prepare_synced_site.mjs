import { cp, mkdir, readdir, readFile, realpath, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const project = await realpath(fileURLToPath(new URL('..', import.meta.url)))
const output = path.join(project, 'dist')
if (await realpath(output) !== output) throw new Error('Release output must not be a symlink.')
const manifest = JSON.parse(await readFile(path.join(project, '.openai/hosting.json'), 'utf8'))
if (!manifest.project_id || manifest.d1 !== 'DB' || manifest.r2 !== 'FILES' || manifest.static) throw new Error('Expected the encrypted sync hosting configuration.')
const source = path.join(project, 'apps/web/dist')
const files = await readdir(source, { recursive: true, withFileTypes: true })
if (files.some(file => file.isSymbolicLink() || /\.(pdf|sqlite3?|env)$/i.test(file.name))) throw new Error('Release assets must not contain PDFs, local state, or symlinks.')
await readFile(path.join(source, 'index.html'))
await readFile(path.join(output, 'server/index.js'))
// Remove only generated assets inside this verified output directory. The server
// and Sites metadata were prepared by the preceding Vite build.
for (const entry of await readdir(output, { withFileTypes: true })) {
  if (entry.isSymbolicLink()) throw new Error('Release output contains a symlink.')
  if (entry.name === 'server' || entry.name === '.openai') continue
  const target = path.resolve(output, entry.name)
  if (path.dirname(target) !== output) throw new Error('Invalid generated output path.')
  await rm(target, { recursive: true, force: true })
}
await mkdir(path.join(output, 'client'), { recursive: true })
await cp(source, path.join(output, 'client'), { recursive: true, dereference: false })
console.log(`Synced release prepared: ${files.filter(file => file.isFile()).length} client files; no bundled PDFs.`)
