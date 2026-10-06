import type { Metadata } from 'next'
import { getFormatter, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import { BLOG_PAGE_SIZE, excerpt } from '@/lib/blog'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { JsonLd } from '@/components/JsonLd'
import { buildPublicMetadata, breadcrumbJsonLd } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('blog')
  return buildPublicMetadata({ locale, path: '/blog', title: t('title'), description: t('metaDescription') })
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1)

  const t = await getTranslations('blog')
  const tNav = await getTranslations('nav')
  const format = await getFormatter()

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { hidden: false },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * BLOG_PAGE_SIZE,
      take: BLOG_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        author: { select: { name: true } },
        _count: { select: { answers: { where: { hidden: false } }, attachments: true } },
      },
    }),
    prisma.blogPost.count({ where: { hidden: false } }),
  ])
  const hasNext = page * BLOG_PAGE_SIZE < total

  const breadcrumbs = [
    { name: tNav('home'), path: '/' },
    { name: t('title'), path: '/blog' },
  ]

  return (
    <main className="p-8 max-w-3xl mx-auto flex flex-col gap-6">
      <JsonLd data={[breadcrumbJsonLd(locale, breadcrumbs)]} />
      <Breadcrumbs items={breadcrumbs} />
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-gray-600">{t('intro')}</p>
        </div>
        <Link href="/blog/new" className="bg-gray-900 text-white rounded px-4 py-2 text-sm text-center whitespace-nowrap">
          {t('askButton')}
        </Link>
      </header>

      {posts.length === 0 ? (
        <p className="text-gray-600">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.id}`}
                className="border rounded p-4 flex flex-col gap-1 hover:border-gray-900 transition-colors"
              >
                <span className="font-semibold">{post.title}</span>
                <span className="text-sm text-gray-600">{excerpt(post.body)}</span>
                <span className="text-xs text-gray-500 flex flex-wrap gap-x-3">
                  <span>{t('by', { name: post.author.name })}</span>
                  <time dateTime={post.createdAt.toISOString()}>
                    {format.dateTime(post.createdAt, { dateStyle: 'medium' })}
                  </time>
                  <span>{t('answersCount', { count: post._count.answers })}</span>
                  {post._count.attachments > 0 && <span>📎 {t('hasAttachments')}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(page > 1 || hasNext) && (
        <nav className="flex justify-between text-sm">
          {page > 1 ? (
            <Link href={page === 2 ? '/blog' : `/blog?page=${page - 1}`} className="underline">
              {t('previous')}
            </Link>
          ) : (
            <span />
          )}
          {hasNext && (
            <Link href={`/blog?page=${page + 1}`} className="underline">
              {t('next')}
            </Link>
          )}
        </nav>
      )}
    </main>
  )
}
