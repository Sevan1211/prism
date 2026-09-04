import { cp, mkdir, readFile, realpath, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const project = await realpath(fileURLToPath(new URL('..', import.meta.url)))
const packageFile = fileURLToPath(import.meta.resolve('pdfjs-dist/package.json'))
const packageRoot = path.dirname(packageFile)
const { version } = JSON.parse(await readFile(packageFile, 'utf8'))
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Unexpected PDF.js version.')
const publicRoot = await realpath(path.join(project, 'apps', 'web', 'public'))
const destination = path.resolve(publicRoot, 'pdfjs')
if (path.dirname(destination) !== publicRoot) throw new Error('Invalid PDF resource output path.')
// Generated dependency assets only; replace old versions to avoid stale decoder files.
await rm(destination, { recursive: true, force: true })
const versionRoot = path.join(destination, version)
await mkdir(versionRoot, { recursive: true })
for (const directory of ['cmaps', 'standard_fonts', 'wasm']) {
  await cp(path.join(packageRoot, directory), path.join(versionRoot, directory), { recursive: true })
}
await cp(path.join(packageRoot, 'LICENSE'), path.join(versionRoot, 'LICENSE'))
console.log(`Prepared PDF.js ${version} character maps, fonts, and image decoders for local loading.`)
