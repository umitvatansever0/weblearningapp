import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getFormatter, getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { Link } from '@/i18n/navigation'
import { excerpt, formatBytes, isImageContentType } from '@/lib/blog'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { JsonLd } from '@/components/JsonLd'
import { BlogAnswerForm } from '@/components/blog/BlogAnswerForm'
import { BlogItemActions } from '@/components/blog/BlogItemActions'
import { NOINDEX_METADATA, buildPublicMetadata, breadcrumbJsonLd } from '@/lib/seo'

// Shared by generateMetadata and the page within one request. Hidden posts
// are loaded too so admins can review them; everyone else gets a 404.
const getPost = cache(async (postId: string) =>
  prisma.blogPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      hidden: true,
      title: true,
      body: true,
      createdAt: true,
      authorId: true,
      author: { select: { name: true } },
      attachments: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, url: true, contentType: true, size: true, fileName: true },
      },
      answers: {
        where: { hidden: false },
        orderBy: { createdAt: 'asc' },
        select: { id: true, body: true, createdAt: true, authorId: true, author: { select: { name: true } } },
      },
    },
  })
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; postId: string }>
}): Promise<Metadata> {
  const { locale, postId } = await params
  const post = await getPost(postId)
  if (!post || post.hidden) return NOINDEX_METADATA
  return buildPublicMetadata({
    locale,
    path: `/blog/${post.id}`,
    title: post.title,
    description: excerpt(post.body, 155),
    type: 'article',
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; postId: string }>
}) {
  const { locale, postId } = await params
  const post = await getPost(postId)
  const session = await getServerSession(authOptions)
  const viewerId = session?.user?.id
  const admin = isAdmin(session)
  if (!post || (post.hidden && !admin)) notFound()
  const t = await getTranslations('blog')
  const tNav = await getTranslations('nav')
  const format = await getFormatter()

  const breadcrumbs = [
    { name: tNav('home'), path: '/' },
    { name: t('title'), path: '/blog' },
    { name: post.title, path: `/blog/${post.id}` },
  ]

  const images = post.attachments.filter((attachment) => isImageContentType(attachment.contentType))
  const documents = post.attachments.filter((attachment) => !isImageContentType(attachment.contentType))

  return (
    <main className="p-8 max-w-3xl mx-auto flex flex-col gap-6">
      <JsonLd data={[breadcrumbJsonLd(locale, breadcrumbs)]} />
      <Breadcrumbs items={breadcrumbs} />

      <article className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold break-words">{post.title}</h1>
          <p className="text-sm text-gray-500 flex flex-wrap gap-x-3">
            <span>{t('by', { name: post.author.name })}</span>
            <time dateTime={post.createdAt.toISOString()}>
              {format.dateTime(post.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
            </time>
          </p>
        </header>

        {/* User-written text is rendered as plain text (no HTML/Markdown). */}
        <div className="whitespace-pre-wrap break-words leading-relaxed text-gray-800">{post.body}</div>

        {post.attachments.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="font-semibold">{t('attachments')}</h2>
            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {images.map((image) => (
                  <a key={image.id} href={image.url} target="_blank" rel="noopener noreferrer nofollow ugc">
                    {/* eslint-disable-next-line @next/next/no-img-element -- user uploads on Vercel Blob; skip the image optimizer */}
                    <img
                      src={image.url}
                      alt={image.fileName}
                      loading="lazy"
                      className="w-full max-h-96 object-contain border rounded bg-gray-50"
                    />
                  </a>
                ))}
              </div>
            )}
            {documents.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm">
                {documents.map((document) => (
                  <li key={document.id}>
                    <a
                      href={`${document.url}?download=1`}
                      rel="noopener noreferrer nofollow ugc"
                      className="underline"
                    >
                      📄 {document.fileName}
                    </a>{' '}
                    <span className="text-gray-500">({formatBytes(document.size)})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <BlogItemActions
          kind="post"
          id={post.id}
          canReport={Boolean(viewerId) && viewerId !== post.authorId}
          canDelete={viewerId === post.authorId || admin}
        />
      </article>

      <section className="flex flex-col gap-4 border-t pt-6">
        <h2 className="text-lg font-semibold">
          {t('answersTitle')} ({post.answers.length})
        </h2>
        {post.answers.length === 0 ? (
          <p className="text-gray-600 text-sm">{t('noAnswers')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {post.answers.map((answer) => (
              <li key={answer.id} className="border rounded p-3 flex flex-col gap-2">
                <p className="text-xs text-gray-500 flex flex-wrap gap-x-3">
                  <span className="font-medium text-gray-700">{answer.author.name}</span>
                  <time dateTime={answer.createdAt.toISOString()}>
                    {format.dateTime(answer.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </p>
                <div className="whitespace-pre-wrap break-words text-gray-800">{answer.body}</div>
                <BlogItemActions
                  kind="answer"
                  id={answer.id}
                  canReport={Boolean(viewerId) && viewerId !== answer.authorId}
                  canDelete={viewerId === answer.authorId || admin}
                />
              </li>
            ))}
          </ul>
        )}

        {viewerId ? (
          <BlogAnswerForm postId={post.id} />
        ) : (
          <p className="text-sm">
            {t('loginToAnswer')}{' '}
            <Link href="/login" className="underline">
              {t('login')}
            </Link>
          </p>
        )}
      </section>

      <Link href="/blog" className="text-sm underline text-gray-600">
        {t('backToBlog')}
      </Link>
    </main>
  )
}
