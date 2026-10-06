'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

export function BlogAnswerForm({ postId }: { postId: string }) {
  const t = useTranslations('blog')
  const router = useRouter()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const res = await fetch(`/api/blog/posts/${postId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? t('errorGeneric'))
      return
    }
    setBody('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={t('answerPlaceholder')}
        required
        minLength={2}
        maxLength={5000}
        rows={4}
        className="border rounded px-2 py-1"
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-gray-900 text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {t('answerSubmit')}
        </button>
      </div>
    </form>
  )
}
