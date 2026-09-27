import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import PrivacyPage from '@/app/[locale]/(public)/privacy/page'
import TermsPage from '@/app/[locale]/(public)/terms/page'
import ContactPage from '@/app/[locale]/(public)/contact/page'
import en from '../../messages/en.json'

describe('PrivacyPage', () => {
  it('renders the privacy title, intro, and all section headings and paragraphs', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <PrivacyPage />
      </NextIntlClientProvider>
    )
    expect(screen.getByText(en.legal.privacyTitle)).toBeInTheDocument()
    expect(screen.getByText(en.legal.privacyIntro)).toBeInTheDocument()
    en.legal.privacySections.forEach((section) => {
      expect(screen.getByText(section.heading)).toBeInTheDocument()
      section.paragraphs.forEach((paragraph) => {
        expect(screen.getByText(paragraph)).toBeInTheDocument()
      })
    })
  })
})

describe('TermsPage', () => {
  it('renders the terms title and all paragraphs', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <TermsPage />
      </NextIntlClientProvider>
    )
    expect(screen.getByText(en.legal.termsTitle)).toBeInTheDocument()
    en.legal.termsParagraphs.forEach((paragraph) => {
      expect(screen.getByText(paragraph)).toBeInTheDocument()
    })
  })
})

describe('ContactPage', () => {
  it('renders the contact title and all fields', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ContactPage />
      </NextIntlClientProvider>
    )
    expect(screen.getByText(en.contact.title)).toBeInTheDocument()
    expect(screen.getByText(en.contact.intro)).toBeInTheDocument()
    en.contact.fields.forEach((field) => {
      expect(screen.getByText(`${field.label}:`)).toBeInTheDocument()
      expect(screen.getByText(field.value)).toBeInTheDocument()
    })
    expect(screen.getByText(en.contact.note)).toBeInTheDocument()
  })
})
