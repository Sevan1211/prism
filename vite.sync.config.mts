import { defineConfig } from 'vite'
import { sites } from '@openai/sites-vite-plugin'
export default defineConfig({
  plugins: [sites()],
  build: { ssr: 'apps/sync/worker.ts', outDir: 'dist/server', target: 'es2022', rollupOptions: { output: { entryFileNames: 'index.js' } } },
})
