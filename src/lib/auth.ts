import type { NextAuthOptions } from 'next-auth'
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
// How often a signed-in session re-reads the user's role from the database,
// so role changes (e.g. removing admin rights) reach existing sessions.
const ROLE_REFRESH_MS = 5 * 60 * 1000

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

  return { id: user.id, email: user.email, name: user.name, role: user.role }
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
        token.id = user.id
        token.role = (user as { role: string }).role
        token.roleCheckedAt = Date.now()
        return token
      }
      if (token.id && Date.now() - (token.roleCheckedAt ?? 0) > ROLE_REFRESH_MS) {
        const fresh = await prisma.user.findUnique({ where: { id: token.id }, select: { role: true } })
        // A deleted account keeps no privileges.
        token.role = fresh?.role ?? 'USER'
        token.roleCheckedAt = Date.now()
      }
      return token
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
