import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { POST as createPost } from '@/app/api/blog/posts/route'
import { DELETE as deletePost } from '@/app/api/blog/posts/[postId]/route'
import { POST as createAnswer } from '@/app/api/blog/posts/[postId]/answers/route'
import { DELETE as deleteAnswer } from '@/app/api/blog/answers/[answerId]/route'
import { POST as createReport } from '@/app/api/blog/reports/route'
import { PATCH as moderatePost } from '@/app/api/admin/blog/posts/[postId]/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { uploadPrefixFor } from '@/lib/blog'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

const EMAILS = ['blog-author@example.com', 'blog-other@example.com', 'blog-admin@example.com']

function json(body: unknown, method = 'POST') {
  return new Request('http://localhost/api/blog', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function signIn(user: { id: string; role: string } | null) {
  vi.mocked(getServerSession).mockResolvedValue(
    user ? { user: { id: user.id, role: user.role, name: 'Test', email: 'test@example.com' }, expires: '' } : null
  )
}

describe('community blog API', () => {
  vi.setConfig({ testTimeout: 30000 })
  let author: { id: string; role: string }
  let other: { id: string; role: string }
  let admin: { id: string; role: string }

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: EMAILS } } })
    const passwordHash = await hashPassword('Sup3rSecret!')
    author = await prisma.user.create({ data: { email: EMAILS[0], passwordHash, name: 'Blog Author' } })
    other = await prisma.user.create({ data: { email: EMAILS[1], passwordHash, name: 'Blog Other' } })
    admin = await prisma.user.create({ data: { email: EMAILS[2], passwordHash, name: 'Blog Admin', role: 'ADMIN' } })
  })

  afterAll(async () => {
    // Posts, answers and reports cascade with their authors.
    await prisma.user.deleteMany({ where: { email: { in: EMAILS } } })
    await prisma.$disconnect()
  })

  it('rejects anonymous posts', async () => {
    signIn(null)
    const res = await createPost(json({ title: 'Anonyme Frage', body: 'Darf ich ohne Konto posten?' }))
    expect(res.status).toBe(401)
  })

  it('creates a post with an own attachment', async () => {
    signIn(author)
    const pathname = `${uploadPrefixFor(author.id)}bild-x1Y2z3.png`
    const res = await createPost(
      json({
        title: 'Wann benutze ich den Dativ?',
        body: 'Ich verstehe nicht, wann der Dativ kommt.',
        attachments: [
          {
            url: `https://store1.public.blob.vercel-storage.com/${pathname}`,
            pathname,
            contentType: 'image/png',
            size: 1234,
            fileName: 'bild.png',
          },
        ],
      })
    )
    expect(res.status).toBe(201)
    const { id } = await res.json()
    const post = await prisma.blogPost.findUniqueOrThrow({ where: { id }, include: { attachments: true } })
    expect(post.authorId).toBe(author.id)
    expect(post.attachments).toHaveLength(1)
  })

  it('rejects attachments from another member’s folder or with a bad type', async () => {
    signIn(author)
    const foreign = `${uploadPrefixFor(other.id)}fremd.png`
    const foreignRes = await createPost(
      json({
        title: 'Fremdes Bild anhängen',
        body: 'Ich versuche, ein fremdes Bild anzuhängen.',
        attachments: [
          { url: `https://store1.public.blob.vercel-storage.com/${foreign}`, pathname: foreign, contentType: 'image/png', size: 10, fileName: 'f.png' },
        ],
      })
    )
    expect(foreignRes.status).toBe(400)

    const own = `${uploadPrefixFor(author.id)}seite.html`
    const typeRes = await createPost(
      json({
        title: 'HTML-Datei anhängen',
        body: 'Ich versuche, eine HTML-Datei anzuhängen.',
        attachments: [
          { url: `https://store1.public.blob.vercel-storage.com/${own}`, pathname: own, contentType: 'text/html', size: 10, fileName: 's.html' },
        ],
      })
    )
    expect(typeRes.status).toBe(400)
  })

  it('lets members answer, report and delete with the right permissions', async () => {
    signIn(author)
    const created = await createPost(json({ title: 'Frage zum Perfekt', body: 'Haben oder sein im Perfekt?' }))
    const { id: postId } = await created.json()

    signIn(other)
    const answerRes = await createAnswer(json({ body: 'Bewegung → sein, sonst meist haben.' }), {
      params: Promise.resolve({ postId }),
    })
    expect(answerRes.status).toBe(201)
    const { id: answerId } = await answerRes.json()

    // Reporting twice is idempotent.
    expect((await createReport(json({ postId, reason: 'Testmeldung' }))).status).toBe(201)
    expect((await createReport(json({ postId, reason: 'Testmeldung' }))).status).toBe(200)
    expect(await prisma.blogReport.count({ where: { postId } })).toBe(1)

    // Another member cannot delete the author's post…
    const forbidden = await deletePost(json({}, 'DELETE'), { params: Promise.resolve({ postId }) })
    expect(forbidden.status).toBe(403)

    // …but can delete their own answer.
    const ownAnswer = await deleteAnswer(json({}, 'DELETE'), { params: Promise.resolve({ answerId }) })
    expect(ownAnswer.status).toBe(204)

    // The author can delete the post.
    signIn(author)
    const deleted = await deletePost(json({}, 'DELETE'), { params: Promise.resolve({ postId }) })
    expect(deleted.status).toBe(204)
    expect(await prisma.blogPost.findUnique({ where: { id: postId } })).toBeNull()
  })

  it('lets only admins hide posts and resolves their reports', async () => {
    signIn(author)
    const created = await createPost(json({ title: 'Spam-Testbeitrag', body: 'Dieser Beitrag wird gemeldet.' }))
    const { id: postId } = await created.json()

    signIn(other)
    await createReport(json({ postId, reason: 'Spam' }))
    expect((await moderatePost(json({ hidden: true }, 'PATCH'), { params: Promise.resolve({ postId }) })).status).toBe(403)

    signIn(admin)
    const hidden = await moderatePost(json({ hidden: true }, 'PATCH'), { params: Promise.resolve({ postId }) })
    expect(hidden.status).toBe(200)
    const post = await prisma.blogPost.findUniqueOrThrow({ where: { id: postId } })
    expect(post.hidden).toBe(true)
    expect(await prisma.blogReport.count({ where: { postId, resolvedAt: null } })).toBe(0)

    // Hidden posts cannot receive new answers.
    signIn(other)
    const answer = await createAnswer(json({ body: 'Antwort auf versteckten Beitrag' }), {
      params: Promise.resolve({ postId }),
    })
    expect(answer.status).toBe(404)
  })
})
