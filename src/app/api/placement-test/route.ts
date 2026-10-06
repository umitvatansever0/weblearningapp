import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserApi } from '@/lib/blogServer'
import { consume } from '@/lib/rateLimit'
import { placementSubmissionSchema } from '@/lib/validation'
import { PLACEMENT_QUESTION_COUNT, scorePlacement } from '@/lib/placementTest'
import { sendPlacementResultEmail } from '@/lib/email'
import { getSiteUrl } from '@/lib/seo'

/**
 * Scores a placement test and e-mails the result to the member's own account
 * address. Members only: e-mailing an address typed into a form would let
 * anyone use the site to send mail to strangers.
 */
export async function POST(request: Request) {
  const auth = await requireUserApi()
  if ('error' in auth) return auth.error
  const userId = auth.session.user.id

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = placementSubmissionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { answers, locale } = parsed.data
  if (answers.length !== PLACEMENT_QUESTION_COUNT) {
    return NextResponse.json({ error: `Expected ${PLACEMENT_QUESTION_COUNT} answers` }, { status: 400 })
  }

  if (await consume('placementTest', userId)) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = scorePlacement(answers)

  let emailSent = false
  try {
    emailSent = await sendPlacementResultEmail(user.email, user.name ?? '', locale, result, getSiteUrl())
  } catch (error) {
    // The result is still shown on screen; a mail outage must not lose it.
    console.error('Failed to send placement result email:', error)
  }

  return NextResponse.json({ ...result, emailSent })
}
