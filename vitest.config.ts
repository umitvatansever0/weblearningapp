import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // Vite's default env-loading root search walks up looking for a real
  // `.git` directory, which skips right past a git *worktree* (whose `.git`
  // is just a file pointing at the main repo) and loads the main repo's
  // `.env` instead of the worktree's own. Pin envDir explicitly so each
  // worktree always loads its own `.env` (e.g. its own isolated DB schema).
  envDir: __dirname,
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    // Integration tests share one Postgres DB and some create/delete rows
    // under shared fixtures (e.g. the seeded 'A1' Level) — running test
    // files in parallel causes cross-file races. Serialize files instead.
    fileParallelism: false,
    // Git worktrees live under .claude/worktrees/ and .worktrees/ in this
    // project; without this exclude, running tests from the repo root also
    // discovers the worktree's own copy of the same test files against its
    // own node_modules, producing duplicate React/next-intl instances and
    // spurious context-provider failures.
    exclude: [...configDefaults.exclude, '.claude/**', '.worktrees/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
