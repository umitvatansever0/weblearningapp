import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import ForgotPasswordPage from '@/app/[locale]/(auth)/forgot-password/page'
import en from '../../messages/en.json'

function renderPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ForgotPasswordPage />
    </NextIntlClientProvider>
  )
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('shows the success message after submitting', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ message: en.forgotPassword.successMessage }),
    })

    renderPage()

    fireEvent.change(screen.getByLabelText(en.forgotPassword.emailLabel), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByText(en.forgotPassword.submit))

    await waitFor(() => {
      expect(screen.getByText(en.forgotPassword.successMessage)).toBeInTheDocument()
    })
  })

  it('shows a generic error message if the request fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'boom' }),
    })

    renderPage()

    fireEvent.change(screen.getByLabelText(en.forgotPassword.emailLabel), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByText(en.forgotPassword.submit))

    await waitFor(() => {
      expect(screen.getByText(en.forgotPassword.errorMessage)).toBeInTheDocument()
    })
  })
})
