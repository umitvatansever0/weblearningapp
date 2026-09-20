import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resetPasswordSchema } from '@/lib/validation'
import { hashResetToken } from '@/lib/passwordResetToken'
import { hashPassword } from '@/lib/password'

const GENERIC_ERROR = 'This reset link is invalid or has expired.'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const tokenHash = hashResetToken(parsed.data.token)
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
  }

  const passwordHash = await hashPassword(parsed.data.password)

  const TOKEN_ALREADY_USED = Symbol('TOKEN_ALREADY_USED')

  try {
    await prisma.$transaction(async (tx) => {
      // Conditionally consume the token: only proceeds if it is still
      // unused. This closes the check-then-act race where two concurrent
      // requests could both pass the `!record.usedAt` check above.
      const result = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      })

      if (result.count === 0) {
        throw TOKEN_ALREADY_USED
      }

      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } })
    })
  } catch (err) {
    if (err === TOKEN_ALREADY_USED) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
    }
    throw err
  }

  return NextResponse.json({ message: 'Password has been reset.' }, { status: 200 })
}
