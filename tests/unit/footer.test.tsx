import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { Footer } from '@/components/Footer'
import en from '../../messages/en.json'

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}))

describe('Footer', () => {
  it('links to the privacy, terms, and contact pages', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <Footer />
      </NextIntlClientProvider>
    )
    expect(screen.getByText(en.footer.privacy).closest('a')).toHaveAttribute('href', '/privacy')
    expect(screen.getByText(en.footer.terms).closest('a')).toHaveAttribute('href', '/terms')
    expect(screen.getByText(en.footer.contact).closest('a')).toHaveAttribute('href', '/contact')
  })
})
