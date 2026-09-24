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
    expect(screen.getAllByText(en.home.levelComingSoon).length).toBe(2)
    expect(screen.getAllByText(en.home.levelAvailable).length).toBe(2)
  })

  it('links the available A1 and A2 levels to their units pages', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <HomePage />
      </NextIntlClientProvider>
    )
    expect(screen.getByRole('link', { name: /A1/ })).toHaveAttribute('href', '/learn/A1')
    expect(screen.getByRole('link', { name: /A2/ })).toHaveAttribute('href', '/learn/A2')
  })

  it('does not link coming-soon levels', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <HomePage />
      </NextIntlClientProvider>
    )
    expect(screen.queryByRole('link', { name: /B1/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /B2/ })).not.toBeInTheDocument()
  })
})
