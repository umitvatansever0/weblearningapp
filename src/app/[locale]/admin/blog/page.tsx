import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getFormatter, getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { Link } from '@/i18n/navigation'
import { excerpt } from '@/lib/blog'
import { BlogModerationActions } from '@/components/admin/BlogModerationActions'

export default async function AdminBlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect(`/${locale}/login`)
  if (!isAdmin(session)) redirect(`/${locale}/dashboard`)

  const t = await getTranslations('adminBlog')
  const format = await getFormatter()

  const [reports, posts] = await Promise.all([
    prisma.blogReport.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 100,
      select: {
        id: true,
        reason: true,
        createdAt: true,
        reporter: { select: { name: true, email: true } },
        post: { select: { id: true, title: true, body: true, hidden: true } },
        answer: { select: { id: true, body: true, hidden: true, postId: true } },
      },
    }),
    prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        title: true,
        hidden: true,
        createdAt: true,
        author: { select: { name: true, email: true } },
      },
    }),
  ])

  return (
    <main className="p-8 max-w-3xl mx-auto flex flex-col gap-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          {t('openReports')} ({reports.length})
        </h2>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-600">{t('noReports')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reports.map((report) => {
              const target = report.post ?? report.answer
              if (!target) return null
              const postId = report.post?.id ?? report.answer?.postId
              return (
                <li key={report.id} className="border rounded p-3 flex flex-col gap-2 text-sm">
                  <p className="font-semibold">
                    {report.post ? t('reportedPost') : t('reportedAnswer')}
                    {report.post ? `: ${report.post.title}` : ''}
                    {target.hidden && <span className="ml-2 text-xs text-gray-500">({t('hiddenLabel')})</span>}
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap break-words">{excerpt(target.body, 300)}</p>
                  <p className="text-gray-500">
                    {t('reason')}: {report.reason} · {t('reportedBy')}: {report.reporter.name} ({report.reporter.email}) ·{' '}
                    {format.dateTime(report.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {postId && (
                      <Link href={`/blog/${postId}`} className="underline text-sm">
                        {t('view')}
                      </Link>
                    )}
                    <BlogModerationActions
                      kind={report.post ? 'post' : 'answer'}
                      id={target.id}
                      hidden={target.hidden}
                      reportId={report.id}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t('recentPosts')}</h2>
        <ul className="flex flex-col gap-2">
          {posts.map((post) => (
            <li key={post.id} className="border rounded p-3 flex flex-col gap-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/blog/${post.id}`} className="font-semibold underline">
                  {post.title}
                </Link>
                {post.hidden && <span className="text-xs text-gray-500">({t('hiddenLabel')})</span>}
              </div>
              <p className="text-gray-500">
                {post.author.name} ({post.author.email}) ·{' '}
                {format.dateTime(post.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              <BlogModerationActions kind="post" id={post.id} hidden={post.hidden} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
