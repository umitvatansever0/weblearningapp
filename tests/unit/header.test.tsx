import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { Header } from '@/components/Header'
import en from '../../messages/en.json'

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/',
}))

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  )
}

describe('Header', () => {
  it('renders login and register links', () => {
    renderWithIntl(<Header />)
    expect(screen.getByText(en.nav.login)).toBeInTheDocument()
    expect(screen.getByText(en.nav.register)).toBeInTheDocument()
  })
})
