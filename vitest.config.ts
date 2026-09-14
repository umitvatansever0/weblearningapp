import { defineConfig, configDefaults } from 'vitest/config'
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
    // Git worktrees live under .claude/worktrees/ in this project; without
    // this exclude, running tests from the repo root also discovers the
    // worktree's own copy of the same test files against its own
    // node_modules, producing duplicate React/next-intl instances and
    // spurious context-provider failures.
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
