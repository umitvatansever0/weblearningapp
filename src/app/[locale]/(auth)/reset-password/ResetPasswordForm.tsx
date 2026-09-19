'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

export default function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations('resetPassword')
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitting, setSubmitting] = useState(false)

  if (!token) {
    return (
      <main className="max-w-sm mx-auto p-8">
        <p className="text-red-600 text-sm">{t('missingToken')}</p>
      </main>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const res = await fetch('/api/password-reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    setSubmitting(false)

    if (!res.ok) {
      setStatus('error')
      return
    }

    setStatus('success')
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <main className="max-w-sm mx-auto p-8">
      <h1 className="text-xl font-semibold mb-4">{t('title')}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          {t('passwordLabel')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
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
