'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })

    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? t('registerError'))
      return
    }

    router.push('/login')
  }

  return (
    <main className="max-w-sm mx-auto p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          {t('nameLabel')}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border rounded px-2 py-1"
          />
        </label>
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
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-gray-900 text-white rounded px-4 py-2"
        >
          {t('registerSubmit')}
        </button>
      </form>
    </main>
  )
}
