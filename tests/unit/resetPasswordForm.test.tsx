import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import ResetPasswordForm from '@/app/[locale]/(auth)/reset-password/ResetPasswordForm'
import en from '../../messages/en.json'

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

function renderForm(token: string) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ResetPasswordForm token={token} />
    </NextIntlClientProvider>
  )
}

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('shows the missing-token message when no token is provided', () => {
    renderForm('')
    expect(screen.getByText(en.resetPassword.missingToken)).toBeInTheDocument()
  })

  it('shows the success message after a successful reset', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Password has been reset.' }),
    })

    renderForm('valid-token')

    fireEvent.change(screen.getByLabelText(en.resetPassword.passwordLabel), {
      target: { value: 'NewPassword1!' },
    })
    fireEvent.click(screen.getByText(en.resetPassword.submit))

    await waitFor(() => {
      expect(screen.getByText(en.resetPassword.successMessage)).toBeInTheDocument()
    })
  })

  it('shows the error message when the API rejects the token', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'This reset link is invalid or has expired.' }),
    })

    renderForm('bad-token')

    fireEvent.change(screen.getByLabelText(en.resetPassword.passwordLabel), {
      target: { value: 'NewPassword1!' },
    })
    fireEvent.click(screen.getByText(en.resetPassword.submit))

    await waitFor(() => {
      expect(screen.getByText(en.resetPassword.errorMessage)).toBeInTheDocument()
    })
  })
})
