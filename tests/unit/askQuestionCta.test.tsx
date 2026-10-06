import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { AskQuestionCta } from '@/components/blog/AskQuestionCta'
import en from '../../messages/en.json'

const pathname = vi.hoisted(() => ({ current: '/' }))

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
  usePathname: () => pathname.current,
}))

function renderCta() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <AskQuestionCta />
    </NextIntlClientProvider>
  )
}

describe('AskQuestionCta', () => {
  beforeEach(() => {
    pathname.current = '/'
  })

  it('points regular pages to the new-post form', () => {
    pathname.current = '/learn/A1'
    renderCta()
    expect(screen.getByText(en.blog.ctaTitle)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: en.blog.ctaButton })).toHaveAttribute('href', '/blog/new')
  })

  it('is hidden inside the blog and the admin area', () => {
    for (const path of ['/blog', '/blog/abc', '/blog/new', '/admin/blog']) {
      pathname.current = path
      const { container, unmount } = renderCta()
      expect(container).toBeEmptyDOMElement()
      unmount()
    }
  })
})
