'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

interface Props {
  kind: 'post' | 'answer'
  id: string
  /** Signed-in members can report content they did not write. */
  canReport: boolean
  /** Author or admin. */
  canDelete: boolean
}

export function BlogItemActions({ kind, id, canReport, canDelete }: Props) {
  const t = useTranslations('blog')
  const router = useRouter()
  const [reported, setReported] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function report() {
    const reason = window.prompt(t('reportPrompt'))
    if (!reason || reason.trim().length < 3) return
    setBusy(true)
    setError(null)
    const res = await fetch('/api/blog/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kind === 'post' ? { postId: id, reason } : { answerId: id, reason }),
    })
    setBusy(false)
    if (res.ok) setReported(true)
    else setError(t('errorGeneric'))
  }

  async function remove() {
    if (!window.confirm(t('deleteConfirm'))) return
    setBusy(true)
    setError(null)
    const res = await fetch(kind === 'post' ? `/api/blog/posts/${id}` : `/api/blog/answers/${id}`, {
      method: 'DELETE',
    })
    setBusy(false)
    if (!res.ok) {
      setError(t('errorGeneric'))
      return
    }
    if (kind === 'post') router.push('/blog')
    else router.refresh()
  }

  if (!canReport && !canDelete) return null

  return (
    <div className="flex items-center gap-3 text-xs text-gray-500">
      {canReport &&
        (reported ? (
          <span>{t('reported')}</span>
        ) : (
          <button type="button" onClick={report} disabled={busy} className="underline">
            {t('report')}
          </button>
        ))}
      {canDelete && (
        <button type="button" onClick={remove} disabled={busy} className="underline text-red-600">
          {t('delete')}
        </button>
      )}
      {error && <span className="text-red-600">{error}</span>}
    </div>
  )
}
