import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required')
}

// A bcrypt hash of an unguessable, unused password. When the email lookup
// misses, we still run a compare against this so a request for a
// nonexistent account takes about as long as one for a real account with a
// wrong password — otherwise response timing leaks which emails are
// registered.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8n7YKPMWXVDoMQ8xTWKk2FdMHKQdTG'

export async function authorizeUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !valid) return null

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        return authorizeUser(credentials.email, credentials.password)
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
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
