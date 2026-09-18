import path from 'path'
import dotenv from 'dotenv'

// Something upstream of Vitest's own env loading (Next.js/tsx/Vite root
// detection all walk up looking for a real `.git` *directory*, which a git
// worktree doesn't have — its `.git` is a file) ends up populating
// process.env.DATABASE_URL from an ancestor checkout's `.env` before this
// file runs, even with `envDir` pinned in vitest.config.ts. Force-load this
// worktree's own `.env` by absolute path and override whatever is already
// set, so integration tests always hit this worktree's isolated DB schema.
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true })

import '@testing-library/jest-dom/vitest'
