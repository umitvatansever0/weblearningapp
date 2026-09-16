import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Extract DATABASE_URL directly from the project's own `.env` file on disk,
// rather than trusting `process.env.DATABASE_URL`. In git-worktree setups,
// Vite/Vitest's env auto-loading can resolve to an ancestor checkout's
// `.env` instead of the current worktree's, silently swapping in the wrong
// connection string. Reading the file ourselves (from `process.cwd()`, which
// reliably is the worktree root) sidesteps that.
function readDatabaseUrlFromEnvFile(): string | null {
  try {
    const envPath = path.join(process.cwd(), '.env')
    const contents = fs.readFileSync(envPath, 'utf8')
    const match = contents.match(/^DATABASE_URL\s*=\s*"?([^"\n]*)"?\s*$/m)
    return match ? match[1] : null
  } catch {
    return null
  }
}

// Local dev/CI setups sometimes point DATABASE_URL at a non-public Postgres
// schema via the `schema=` query param (e.g. isolated per-worktree schemas
// for parallel content phases). Prisma's connection pool doesn't reliably
// apply that param to every pooled connection, so pin it explicitly before
// every query (and force a single pooled connection via `connection_limit=1`
// on the URL itself so the pin always applies to the connection the next
// query actually uses). No-op when no `schema` param is configured or it
// targets `public`.
const resolvedDatabaseUrl = readDatabaseUrlFromEnvFile() ?? process.env.DATABASE_URL ?? ''
const configuredSchema = (() => {
  try {
    const schema = new URL(resolvedDatabaseUrl).searchParams.get('schema')
    return schema && schema !== 'public' ? schema : null
  } catch {
    return null
  }
})()

function createPrismaClient(): PrismaClient {
  const client = configuredSchema
    ? new PrismaClient({ datasources: { db: { url: resolvedDatabaseUrl } } })
    : new PrismaClient()
  if (!configuredSchema) return client

  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        await client.$executeRawUnsafe(`SET search_path TO "${configuredSchema}"`)
        return query(args)
      },
    },
  }) as unknown as PrismaClient
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
