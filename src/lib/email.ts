import { Resend } from 'resend'

/**
 * Sender address. Resend's shared test sender only delivers to the Resend
 * account owner, so production should set EMAIL_FROM to an address on a domain
 * verified in Resend, e.g. "DeutschStep <noreply@deutschstep.com>".
 */
function sender(): string {
  return process.env.EMAIL_FROM?.trim() || 'onboarding@resend.dev'
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set; skipping password reset email send.')
    return
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: sender(),
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
    from: sender(),
    to,
    subject: copy.subject,
    html: copy.lines(`${siteUrl}/${locale}/login`, `${siteUrl}/${locale}/forgot-password`),
  })

  if (error) {
    console.error('Failed to send account-exists email:', error)
  }
}

const PLACEMENT_COPY: Record<
  string,
  {
    subject: (level: string) => string
    greeting: (name: string) => string
    intro: string
    levelLabel: string
    beginner: string
    scoreLabel: string
    breakdown: string
    levelColumn: string
    correctColumn: string
    recommendation: (level: string) => string
    cta: string
  }
> = {
  en: {
    subject: (level) => `Your DeutschStep placement test result: ${level}`,
    greeting: (name) => `Hello ${name},`,
    intro: 'thank you for taking the DeutschStep German placement test. Here is your result:',
    levelLabel: 'Your level',
    beginner: 'Beginner (start with A1)',
    scoreLabel: 'Correct answers',
    breakdown: 'Results by level',
    levelColumn: 'Level',
    correctColumn: 'Correct',
    recommendation: (level) => `We recommend continuing with the ${level} lessons.`,
    cta: 'Go to the lessons',
  },
  de: {
    subject: (level) => `Dein DeutschStep-Einstufungstest: ${level}`,
    greeting: (name) => `Hallo ${name},`,
    intro: 'danke, dass du den Einstufungstest von DeutschStep gemacht hast. Hier ist dein Ergebnis:',
    levelLabel: 'Dein Niveau',
    beginner: 'Anfänger (starte mit A1)',
    scoreLabel: 'Richtige Antworten',
    breakdown: 'Ergebnis nach Niveau',
    levelColumn: 'Niveau',
    correctColumn: 'Richtig',
    recommendation: (level) => `Wir empfehlen dir, mit den ${level}-Lektionen weiterzumachen.`,
    cta: 'Zu den Lektionen',
  },
  tr: {
    subject: (level) => `DeutschStep seviye tespit sınavı sonucun: ${level}`,
    greeting: (name) => `Merhaba ${name},`,
    intro: 'DeutschStep Almanca seviye tespit sınavına katıldığın için teşekkürler. Sonucun:',
    levelLabel: 'Seviyen',
    beginner: 'Başlangıç (A1 ile başla)',
    scoreLabel: 'Doğru cevap',
    breakdown: 'Seviyelere göre sonuç',
    levelColumn: 'Seviye',
    correctColumn: 'Doğru',
    recommendation: (level) => `${level} dersleriyle devam etmeni öneriyoruz.`,
    cta: 'Derslere git',
  },
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface PlacementEmailResult {
  level: string | null
  recommended: string
  correct: number
  total: number
  perLevel: { level: string; correct: number; total: number }[]
}

/**
 * Sends the placement test result to the member's own account address.
 * Returns whether the e-mail was handed to the provider.
 */
export async function sendPlacementResultEmail(
  to: string,
  name: string,
  locale: string,
  result: PlacementEmailResult,
  siteUrl: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set; skipping placement result email send.')
    return false
  }

  const copy = PLACEMENT_COPY[locale] ?? PLACEMENT_COPY.en
  const levelText = result.level ?? copy.beginner
  const lessonsUrl = `${siteUrl}/${PLACEMENT_COPY[locale] ? locale : 'en'}/learn/${result.recommended}`
  const rows = result.perLevel
    .map(
      (s) =>
        `<tr><td style="padding:4px 12px;border:1px solid #ddd">${s.level}</td>` +
        `<td style="padding:4px 12px;border:1px solid #ddd">${s.correct} / ${s.total}</td></tr>`
    )
    .join('')

  const html =
    `<p>${copy.greeting(escapeHtml(name))}</p>` +
    `<p>${copy.intro}</p>` +
    `<p style="font-size:20px"><strong>${copy.levelLabel}: ${levelText}</strong></p>` +
    `<p>${copy.scoreLabel}: ${result.correct} / ${result.total}</p>` +
    `<p><strong>${copy.breakdown}</strong></p>` +
    `<table style="border-collapse:collapse"><tr>` +
    `<th style="padding:4px 12px;border:1px solid #ddd;text-align:left">${copy.levelColumn}</th>` +
    `<th style="padding:4px 12px;border:1px solid #ddd;text-align:left">${copy.correctColumn}</th></tr>${rows}</table>` +
    `<p>${copy.recommendation(result.recommended)}</p>` +
    `<p><a href="${lessonsUrl}">${copy.cta}</a></p>`

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: sender(),
    to,
    subject: copy.subject(levelText),
    html,
  })

  if (error) {
    console.error('Failed to send placement result email:', error)
    return false
  }
  return true
}
