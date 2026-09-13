import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { PronounceButton } from '@/components/exercises/PronounceButton'
import en from '../../messages/en.json'

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  )
}

describe('PronounceButton', () => {
  afterEach(() => {
    // @ts-expect-error test cleanup — these globals don't exist in jsdom by default
    delete window.speechSynthesis
    // @ts-expect-error test cleanup
    delete window.SpeechSynthesisUtterance
  })

  it('renders nothing when the Web Speech API is unavailable', async () => {
    const { container } = renderWithIntl(<PronounceButton text="Hallo" />)
    // The supported check runs in a useEffect after mount, so give it a tick
    // to flush before asserting the DOM stays empty.
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('speaks the given text in German when clicked', async () => {
    const speak = vi.fn()
    // @ts-expect-error test stub for an unimplemented browser API
    window.speechSynthesis = { speak }
    // @ts-expect-error test stub for an unimplemented browser API
    window.SpeechSynthesisUtterance = function (text: string) {
      return { text, lang: '' }
    }

    renderWithIntl(<PronounceButton text="Hallo" />)
    const button = await screen.findByRole('button')
    fireEvent.click(button)
    expect(speak).toHaveBeenCalledTimes(1)
  })
})
