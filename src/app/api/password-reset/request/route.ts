import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forgotPasswordSchema } from '@/lib/validation'
import { generateResetToken } from '@/lib/passwordResetToken'
import { sendPasswordResetEmail } from '@/lib/email'
import { clientIp, consume } from '@/lib/rateLimit'
import { runAfterResponse } from '@/lib/afterResponse'
import { getSiteUrl } from '@/lib/seo'

const GENERIC_MESSAGE = 'If that email is registered, a reset link has been sent.'

export async function POST(request: Request) {
  if (await consume('resetIp', clientIp(request.headers))) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  // Cap reset e-mails per address so nobody can mail-bomb a victim. The
  // response stays the same generic message, so this reveals nothing about
  // whether the address is registered.
  const emailLimited = await consume('resetEmail', parsed.data.email)
  const user = emailLimited ? null : await prisma.user.findUnique({ where: { email: parsed.data.email } })

  if (user) {
    const { token, tokenHash, expiresAt } = generateResetToken()
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    })

    const siteUrl = getSiteUrl()
    const locale = user.uiLanguage.toLowerCase()
    const resetUrl = `${siteUrl}/${locale}/reset-password?token=${token}`
    // Sent after the response: awaiting the Resend round-trip here would make
    // the response time measurably longer for existing users than for
    // nonexistent ones, reopening the account-enumeration channel this
    // endpoint is designed to close.
    const email = user.email
    runAfterResponse(() => sendPasswordResetEmail(email, resetUrl), 'password-reset')
  }

  return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 })
}
