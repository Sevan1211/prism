import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  root: fileURLToPath(new URL('..', import.meta.url)),
  test: { environment: 'node', include: ['benchmarks/pdfCorpus.test.ts'], testTimeout: 60000, disableConsoleIntercept: true },
})
