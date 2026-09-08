import { writeFile } from 'node:fs/promises'
const commit = process.env.PRISM_RELEASE_SHA
if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('A full release commit is required.')
await writeFile(new URL('../apps/web/dist/release.json', import.meta.url), JSON.stringify({ commit }) + '\n')
