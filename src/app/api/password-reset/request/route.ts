import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forgotPasswordSchema } from '@/lib/validation'
import { generateResetToken } from '@/lib/passwordResetToken'
import { sendPasswordResetEmail } from '@/lib/email'

const GENERIC_MESSAGE = 'If that email is registered, a reset link has been sent.'

export async function POST(request: Request) {
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

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })

  if (user) {
    const { token, tokenHash, expiresAt } = generateResetToken()
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const locale = user.uiLanguage.toLowerCase()
    const resetUrl = `${siteUrl}/${locale}/reset-password?token=${token}`
    await sendPasswordResetEmail(user.email, resetUrl)
  }

  return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 })
}
