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
    subject: 'Reset your DeutschStep password',
    html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
  })

  if (error) {
    console.error('Failed to send password reset email:', error)
  }
}

const ACCOUNT_EXISTS_COPY: Record<string, { subject: string; lines: (login: string, reset: string) => string }> = {
  en: {
    subject: 'Sign-up attempt for your DeutschStep account',
    lines: (login, reset) =>
      `<p>Someone just tried to create a DeutschStep account with this e-mail address, but you already have an account.</p>` +
      `<p>If that was you, simply <a href="${login}">log in</a>. Forgot your password? <a href="${reset}">Reset it here</a>.</p>` +
      `<p>If it wasn't you, you can ignore this e-mail – nothing has changed.</p>`,
  },
  de: {
    subject: 'Registrierungsversuch für dein DeutschStep-Konto',
    lines: (login, reset) =>
      `<p>Gerade hat jemand versucht, mit dieser E-Mail-Adresse ein DeutschStep-Konto anzulegen – du hast aber bereits ein Konto.</p>` +
      `<p>Warst du das, <a href="${login}">melde dich einfach an</a>. Passwort vergessen? <a href="${reset}">Hier zurücksetzen</a>.</p>` +
      `<p>Warst du es nicht, kannst du diese E-Mail ignorieren – es wurde nichts geändert.</p>`,
  },
  tr: {
    subject: 'DeutschStep hesabın için kayıt denemesi',
    lines: (login, reset) =>
      `<p>Az önce biri bu e-posta adresiyle DeutschStep hesabı oluşturmaya çalıştı, ancak zaten bir hesabın var.</p>` +
      `<p>Bu sensen, <a href="${login}">giriş yapman</a> yeterli. Şifreni mi unuttun? <a href="${reset}">Buradan sıfırla</a>.</p>` +
      `<p>Sen değilsen bu e-postayı yok sayabilirsin – hiçbir şey değişmedi.</p>`,
  },
}

/**
 * Sent instead of an error when someone registers with an address that
 * already has an account, so the sign-up form never reveals which addresses
 * are registered.
 */
export async function sendAccountExistsEmail(to: string, locale: string, siteUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set; skipping account-exists email send.')
    return
  }

  const copy = ACCOUNT_EXISTS_COPY[locale] ?? ACCOUNT_EXISTS_COPY.en
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to,
    subject: copy.subject,
    html: copy.lines(`${siteUrl}/${locale}/login`, `${siteUrl}/${locale}/forgot-password`),
  })

  if (error) {
    console.error('Failed to send account-exists email:', error)
  }
}
