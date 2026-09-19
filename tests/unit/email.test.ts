import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('sendPasswordResetEmail', () => {
  const originalKey = process.env.RESEND_API_KEY

  afterEach(() => {
    process.env.RESEND_API_KEY = originalKey
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('does not call Resend and does not throw when RESEND_API_KEY is unset', async () => {
    delete process.env.RESEND_API_KEY
    vi.resetModules()
    const sendMock = vi.fn()
    vi.doMock('resend', () => ({
      Resend: class {
        constructor() {
          this.emails = { send: sendMock }
        }
      },
    }))

    const { sendPasswordResetEmail } = await import('@/lib/email')
    await expect(
      sendPasswordResetEmail('user@example.com', 'https://example.com/reset?token=abc')
    ).resolves.toBeUndefined()

    expect(sendMock).not.toHaveBeenCalled()
  })

  it('calls Resend with the reset link when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    vi.resetModules()
    const sendMock = vi.fn().mockResolvedValue({ data: { id: 'abc' }, error: null })
    vi.doMock('resend', () => ({
      Resend: class {
        constructor() {
          this.emails = { send: sendMock }
        }
      },
    }))

    const { sendPasswordResetEmail } = await import('@/lib/email')
    await sendPasswordResetEmail('user@example.com', 'https://example.com/reset?token=abc')

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        from: 'onboarding@resend.dev',
      })
    )
    const callArg = sendMock.mock.calls[0][0]
    expect(callArg.html).toContain('https://example.com/reset?token=abc')
  })
})
