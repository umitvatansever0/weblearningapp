import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { useSession } from 'next-auth/react'
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

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}))

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  )
}

describe('Header', () => {
  beforeEach(() => {
    vi.mocked(useSession).mockReset()
  })

  it('renders login and register links when logged out', () => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated' } as ReturnType<
      typeof useSession
    >)

    renderWithIntl(<Header />)
    expect(screen.getByText(en.nav.login)).toBeInTheDocument()
    expect(screen.getByText(en.nav.register)).toBeInTheDocument()
  })

  it('renders the user name and a log out control when logged in', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Ada Lovelace', email: 'ada@example.com' } },
      status: 'authenticated',
    } as ReturnType<typeof useSession>)

    renderWithIntl(<Header />)
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText(en.nav.logout)).toBeInTheDocument()
    expect(screen.queryByText(en.nav.login)).not.toBeInTheDocument()
    expect(screen.queryByText(en.nav.register)).not.toBeInTheDocument()
  })
})
