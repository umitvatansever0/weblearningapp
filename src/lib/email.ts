import { Resend } from 'resend'

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set; skipping password reset email send.')
    return
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to,
    subject: 'Reset your DeutschLernen password',
    html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
  })

  if (error) {
    console.error('Failed to send password reset email:', error)
  }
}
