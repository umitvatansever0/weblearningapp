import { describe, it, expect, vi, afterEach } from 'vitest'

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
      Resend: vi.fn().mockImplementation(function () {
        return { emails: { send: sendMock } }
      }),
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
      Resend: vi.fn().mockImplementation(function () {
        return { emails: { send: sendMock } }
      }),
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

describe('sendPlacementResultEmail', () => {
  const originalKey = process.env.RESEND_API_KEY

  afterEach(() => {
    process.env.RESEND_API_KEY = originalKey
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('sends the localized result and escapes the member name', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    vi.resetModules()
    const sendMock = vi.fn().mockResolvedValue({ error: null })
    vi.doMock('resend', () => ({
      Resend: vi.fn().mockImplementation(function () {
        return { emails: { send: sendMock } }
      }),
    }))

    const { sendPlacementResultEmail } = await import('@/lib/email')
    const sent = await sendPlacementResultEmail(
      'user@example.com',
      '<script>alert(1)</script>',
      'tr',
      { level: 'B1', recommended: 'B2', correct: 30, total: 50, perLevel: [{ level: 'A1', correct: 9, total: 9 }] },
      'https://www.deutschstep.com'
    )

    expect(sent).toBe(true)
    const message = sendMock.mock.calls[0][0]
    expect(message.to).toBe('user@example.com')
    expect(message.subject).toContain('B1')
    expect(message.html).toContain('https://www.deutschstep.com/tr/learn/B2')
    expect(message.html).toContain('&lt;script&gt;')
    expect(message.html).not.toContain('<script>')
  })

  it('reports false without an API key', async () => {
    delete process.env.RESEND_API_KEY
    vi.resetModules()
    const { sendPlacementResultEmail } = await import('@/lib/email')
    const sent = await sendPlacementResultEmail(
      'user@example.com',
      'Ayşe',
      'en',
      { level: null, recommended: 'A1', correct: 0, total: 50, perLevel: [] },
      'https://www.deutschstep.com'
    )
    expect(sent).toBe(false)
  })
})
