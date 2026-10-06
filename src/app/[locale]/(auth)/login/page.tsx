'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/navigation'

export default function LoginPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const justRegistered = useSearchParams().get('registered') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setSubmitting(false)

    if (result?.error) {
      setError(t('loginError'))
      return
    }

    router.push('/')
  }

  return (
    <main className="max-w-sm mx-auto p-8">
      {justRegistered && (
        <p className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          {t('registeredNotice')}
        </p>
      )}
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
        <label className="flex flex-col gap-1">
          {t('passwordLabel')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-gray-900 text-white rounded px-4 py-2"
        >
          {t('loginSubmit')}
        </button>
      </form>
      <p className="mt-4 text-sm">
        <Link href="/forgot-password" className="underline">
          {t('forgotPasswordLink')}
        </Link>
      </p>
    </main>
  )
}
