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

function renderHome() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <HomePage />
    </NextIntlClientProvider>
  )
}

describe('HomePage', () => {
  it('renders the product H1 and crawlable intro copy', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 1, name: en.home.heroTitle })).toBeInTheDocument()
    expect(screen.getByText(en.home.intro)).toBeInTheDocument()
    expect(screen.getByText(en.home.audienceBody)).toBeInTheDocument()
  })

  it('links every CEFR level to its lessons page with a real href', () => {
    renderHome()
    for (const level of ['A1', 'A2', 'B1', 'B2'] as const) {
      expect(screen.getByRole('link', { name: new RegExp(`German ${level}`) })).toHaveAttribute(
        'href',
        `/learn/${level}`
      )
    }
  })

  it('links to the all-lessons index and the register CTA', () => {
    renderHome()
    expect(screen.getByRole('link', { name: en.home.viewAllLessons })).toHaveAttribute('href', '/learn')
    expect(screen.getByRole('link', { name: en.home.ctaRegister })).toHaveAttribute('href', '/register')
  })

  it('describes the core features for crawlers', () => {
    renderHome()
    expect(screen.getByText(en.home.featureGrammarTitle)).toBeInTheDocument()
    expect(screen.getByText(en.home.featureVocabTitle)).toBeInTheDocument()
    expect(screen.getByText(en.home.featureExercisesTitle)).toBeInTheDocument()
    expect(screen.getByText(en.home.featureSrsTitle)).toBeInTheDocument()
  })
})
