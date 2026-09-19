// Force-load this worktree's own `.env` with override:true. Without this,
// `@prisma/client`'s internal env resolution (or an ambient DATABASE_URL
// picked up before this file runs) can win over the worktree-local value
// and silently point tests at the main repo's shared `public` schema
// instead of this worktree's isolated schema (see vitest.config.ts envDir
// comment for the same class of worktree/.env resolution bug).
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true })

import '@testing-library/jest-dom/vitest'
