# Password Reset — Design

## Problem

The app has no way for a user who forgets their password to regain access. Auth is NextAuth Credentials-only (`src/lib/auth.ts`); there is no email-sending infrastructure anywhere in the project.

## Flow

1. `/login` gets a "Forgot password?" link → `/forgot-password`.
2. User submits their email → `POST /api/password-reset/request`.
   - If a user with that email exists, generate a reset token and email a reset link via Resend.
   - Regardless of whether the email exists, respond with the same generic message ("if that email is registered, we've sent a link") to avoid account enumeration — consistent with the existing timing-safe login behavior in `authorizeUser`.
3. User clicks the emailed link → `/reset-password?token=...`, a form for a new password.
4. Submitting → `POST /api/password-reset/confirm` with `{ token, password }`.
   - Validate the token: exists, not expired, not already used.
   - Update `User.passwordHash`, mark the token used.
   - Invalid/expired/used token → generic error, no hint about which condition failed.

## Data model

New table:

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}
```

- The raw token is a random value (e.g. 32 bytes, base64url) sent in the email link; only its hash (SHA-256) is stored, mirroring the reasoning behind bcrypt-hashed passwords — a DB leak shouldn't hand out usable reset tokens.
- Expiry: 1 hour from creation.
- One-time use: `usedAt` set on successful reset; confirm endpoint rejects tokens that are expired or already used.
- No cleanup job for expired rows in this pass (YAGNI) — the table stays small at this project's scale.
- Requesting a new reset token does not invalidate older outstanding tokens for the same user (acceptable at this scale; simplifies the request handler).

## Email delivery

- Provider: Resend, via `RESEND_API_KEY` env var (new addition to `.env.example`).
- No verified sending domain yet, so the app sends from Resend's shared `onboarding@resend.dev` address. Under Resend's rules this only delivers to the email address on the Resend account itself — real end users will not receive mail until a domain is verified. This is a known, accepted limitation for now; no code change will be needed later, only a Resend dashboard domain verification + updating the `from` address.
- Email content: plain-text/simple-HTML, English only (no existing transactional-email localization pattern to extend; can be revisited later).
- If `RESEND_API_KEY` is not set, the request endpoint should still respond with the generic success message (do not leak configuration state), but log a server-side warning and skip the actual send — keeps local/dev usable without Resend configured.

## API routes

- `POST /api/password-reset/request` — body `{ email }`, always 200 with generic message.
- `POST /api/password-reset/confirm` — body `{ token, password }`, 200 on success, 400 with generic error on invalid/expired/used token, reusing the existing password validation rules from `registerSchema`/`src/lib/validation.ts`.

## UI / i18n

- New pages: `src/app/[locale]/(auth)/forgot-password/page.tsx`, `src/app/[locale]/(auth)/reset-password/page.tsx`, following the existing `(auth)` route group structure and form patterns used by `login`/`register`.
- New translation keys added to `messages/en.json`, `messages/de.json`, `messages/tr.json` under a new `forgotPassword` / `resetPassword` section, matching the existing key structure.
- Login page gets a "Forgot password?" link to `/forgot-password`.

## Out of scope (YAGNI for this pass)

- Rate limiting on the request endpoint (the existing register/login endpoints don't have it either).
- Localized transactional emails.
- Invalidating other active sessions when the password is reset.
- Background cleanup of expired/used tokens.
