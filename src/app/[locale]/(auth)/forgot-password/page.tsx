'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function ForgotPasswordPage() {
  const t = useTranslations('forgotPassword')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const res = await fetch('/api/password-reset/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setSubmitting(false)
    setStatus(res.ok ? 'success' : 'error')
  }

  return (
    <main className="max-w-sm mx-auto p-8">
      <h1 className="text-xl font-semibold mb-2">{t('title')}</h1>
      <p className="text-sm text-gray-600 mb-4">{t('instructions')}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          {t('emailLabel')}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        {status === 'success' && (
          <p className="text-green-700 text-sm">{t('successMessage')}</p>
        )}
        {status === 'error' && <p className="text-red-600 text-sm">{t('errorMessage')}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-gray-900 text-white rounded px-4 py-2"
        >
          {t('submit')}
        </button>
      </form>
    </main>
  )
}
