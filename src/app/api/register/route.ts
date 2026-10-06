import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { registerSchema } from '@/lib/validation'
import { clientIp, consume } from '@/lib/rateLimit'
import { sendAccountExistsEmail } from '@/lib/email'
import { getSiteUrl } from '@/lib/seo'
import { runAfterResponse } from '@/lib/afterResponse'

// Identical for new and already-registered addresses, so the sign-up form
// cannot be used to find out which e-mail addresses have an account.
const ACCEPTED = { message: 'Registration received.' }

export async function POST(request: Request) {
  // Mass account creation (spam/bot sign-ups) is capped per IP.
  if (await consume('registerIp', clientIp(request.headers))) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { email, password, name } = parsed.data

  // Always hash first and always attempt the insert: both outcomes then take
  // about the same time, so response timing doesn't leak existence either.
  const passwordHash = await hashPassword(password)
  try {
    await prisma.user.create({ data: { email, passwordHash, name } })
  } catch (error) {
    // The unique constraint on email is the single source of truth for
    // "already registered" (also covers concurrent duplicate sign-ups).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      await notifyExistingAccount(email)
      return NextResponse.json(ACCEPTED, { status: 201 })
    }
    throw error
  }

  return NextResponse.json(ACCEPTED, { status: 201 })
}

/**
 * Tell the real owner that someone tried to sign up with their address. Capped
 * per address so the form cannot be used to flood an inbox; sent after the response
 * so the e-mail round-trip doesn't make this path measurably slower.
 */
async function notifyExistingAccount(email: string): Promise<void> {
  if (await consume('accountExistsEmail', email)) return
  const owner = await prisma.user.findUnique({ where: { email }, select: { uiLanguage: true } })
  const locale = owner?.uiLanguage.toLowerCase() ?? 'en'
  runAfterResponse(() => sendAccountExistsEmail(email, locale, getSiteUrl()), 'account-exists')
}
