import type { NextAuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { clientIp, isLimited, recordHit } from '@/lib/rateLimit'

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required')
}

// A bcrypt hash of an unguessable, unused password. When the email lookup
// misses, we still run a compare against this so a request for a
// nonexistent account takes about as long as one for a real account with a
// wrong password — otherwise response timing leaks which emails are
// registered.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8n7YKPMWXVDoMQ8xTWKk2FdMHKQdTG'

export async function authorizeUser(email: string, password: string, ip = 'unknown') {
  const normalizedEmail = email.toLowerCase()

  // Brute-force protection: after too many failed attempts for this account
  // or from this IP, refuse further attempts until the window passes. The
  // response is the same generic failure as a wrong password.
  const [emailLimited, ipLimited] = await Promise.all([
    isLimited('loginEmail', normalizedEmail),
    isLimited('loginIp', ip),
  ])
  if (emailLimited || ipLimited) return null

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !valid) {
    await Promise.all([recordHit('loginEmail', normalizedEmail), recordHit('loginIp', ip)])
    return null
  }

  return { id: user.id, email: user.email, name: user.name, role: user.role, sessionVersion: user.sessionVersion }
}

export class SessionRevokedError extends Error {
  constructor() {
    super('Session revoked')
  }
}

/**
 * Re-validate a session token against the database on every request:
 * - the account must still exist,
 * - its sessionVersion must match the one the token was issued with
 *   (a password reset bumps it, which logs out every device at once),
 * - the role is refreshed, so removed admin rights take effect immediately.
 * Throwing makes next-auth treat the session as invalid and clear its cookie.
 */
export async function refreshSessionToken(token: JWT): Promise<JWT> {
  if (!token.id) return token
  const fresh = await prisma.user.findUnique({
    where: { id: token.id },
    select: { role: true, sessionVersion: true },
  })
  if (!fresh || fresh.sessionVersion !== (token.sv ?? 0)) throw new SessionRevokedError()
  token.role = fresh.role
  return token
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null
        return authorizeUser(credentials.email, credentials.password, clientIp(req?.headers ?? {}))
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const signedIn = user as { id: string; role: string; sessionVersion?: number }
        token.id = signedIn.id
        token.role = signedIn.role
        token.sv = signedIn.sessionVersion ?? 0
        return token
      }
      return refreshSessionToken(token)
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
