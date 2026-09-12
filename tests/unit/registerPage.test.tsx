import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import RegisterPage from '@/app/[locale]/(auth)/register/page'
import en from '../../messages/en.json'

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

function renderPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <RegisterPage />
    </NextIntlClientProvider>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('shows a server-provided error message on failed submission', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Email already registered' }),
    })

    renderPage()

    fireEvent.change(screen.getByLabelText(en.auth.nameLabel), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText(en.auth.emailLabel), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(en.auth.passwordLabel), { target: { value: 'Sup3rSecret!' } })
    fireEvent.click(screen.getByText(en.auth.registerSubmit))

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument()
    })
  })
})
