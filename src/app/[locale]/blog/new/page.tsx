import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { Link } from '@/i18n/navigation'
import { NOINDEX_METADATA } from '@/lib/seo'
import { BlogPostForm } from '@/components/blog/BlogPostForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blog')
  return { ...NOINDEX_METADATA, title: t('newTitle') }
}

export default async function NewBlogPostPage() {
  const session = await getServerSession(authOptions)
  const t = await getTranslations('blog')

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <Link href="/blog" className="text-sm underline text-gray-600">
        {t('backToBlog')}
      </Link>
      <h1 className="text-2xl font-bold">{t('newTitle')}</h1>
      {session?.user?.id ? (
        <BlogPostForm userId={session.user.id} />
      ) : (
        <div className="border rounded p-4 flex flex-col gap-3">
          <p>{t('loginToPost')}</p>
          <div className="flex gap-3">
            <Link href="/login" className="bg-gray-900 text-white rounded px-4 py-2 text-sm">
              {t('login')}
            </Link>
            <Link href="/register" className="border rounded px-4 py-2 text-sm">
              {t('register')}
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
