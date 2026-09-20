import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import HomePage from '@/app/[locale]/page'
import en from '../../messages/en.json'

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}))

describe('HomePage', () => {
  it('renders the hero heading and both CTAs', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <HomePage />
      </NextIntlClientProvider>
    )
    expect(screen.getByText(en.home.heroTitle)).toBeInTheDocument()
    expect(screen.getByText(en.home.ctaRegister)).toBeInTheDocument()
    expect(screen.getByText(en.home.ctaLogin)).toBeInTheDocument()
  })

  it('renders all four CEFR levels with an availability label', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <HomePage />
      </NextIntlClientProvider>
    )
    expect(screen.getByText('A1')).toBeInTheDocument()
    expect(screen.getByText('B2')).toBeInTheDocument()
    expect(screen.getAllByText(en.home.levelComingSoon).length).toBe(3)
    expect(screen.getByText(en.home.levelAvailable)).toBeInTheDocument()
  })

  it('links the available A1 level to its units page', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <HomePage />
      </NextIntlClientProvider>
    )
    const a1Link = screen.getByRole('link', { name: /A1/ })
    expect(a1Link).toHaveAttribute('href', '/learn/A1')
  })

  it('does not link coming-soon levels', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <HomePage />
      </NextIntlClientProvider>
    )
    expect(screen.queryByRole('link', { name: /A2/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /B1/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /B2/ })).not.toBeInTheDocument()
  })
})
