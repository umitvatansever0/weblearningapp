import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    // Integration tests share one Postgres DB and some create/delete rows
    // under shared fixtures (e.g. the seeded 'A1' Level) — running test
    // files in parallel causes cross-file races. Serialize files instead.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
