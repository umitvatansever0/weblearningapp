'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

interface Props {
  kind: 'post' | 'answer'
  id: string
  hidden: boolean
  /** When set, a "dismiss report" button is shown for this report. */
  reportId?: string
}

export function BlogModerationActions({ kind, id, hidden, reportId }: Props) {
  const t = useTranslations('adminBlog')
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function run(request: () => Promise<Response>) {
    setBusy(true)
    const res = await request()
    setBusy(false)
    if (res.ok) router.refresh()
  }

  const base = kind === 'post' ? `/api/admin/blog/posts/${id}` : `/api/admin/blog/answers/${id}`

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <button
        type="button"
        disabled={busy}
        className="underline"
        onClick={() =>
          run(() =>
            fetch(base, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ hidden: !hidden }),
            })
          )
        }
      >
        {hidden ? t('unhide') : t('hide')}
      </button>
      {reportId && (
        <button
          type="button"
          disabled={busy}
          className="underline"
          onClick={() => run(() => fetch(`/api/admin/blog/reports/${reportId}`, { method: 'PATCH' }))}
        >
          {t('dismiss')}
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        className="underline text-red-600"
        onClick={() => {
          if (!window.confirm(t('deleteConfirm'))) return
          void run(() =>
            fetch(kind === 'post' ? `/api/blog/posts/${id}` : `/api/blog/answers/${id}`, { method: 'DELETE' })
          )
        }}
      >
        {t('delete')}
      </button>
    </div>
  )
}
