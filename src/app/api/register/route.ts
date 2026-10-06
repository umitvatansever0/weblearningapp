import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { registerSchema } from '@/lib/validation'
import { clientIp, consume } from '@/lib/rateLimit'

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

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  try {
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    })
    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 })
  } catch (error) {
    // Concurrent requests can both pass the findUnique check above before
    // either creates; the DB's unique constraint is the real guard, so
    // translate its violation into the same 409 as the pre-check.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }
    throw error
  }
}
