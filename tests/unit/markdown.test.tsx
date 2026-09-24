import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Markdown } from '@/components/Markdown'

describe('Markdown', () => {
  it('renders a heading as an <h2>', () => {
    render(<Markdown>{'## Das Verb "sein"'}</Markdown>)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Das Verb "sein"')
  })

  it('renders a GFM table', () => {
    const md = [
      '| Person | Form |',
      '| ------ | ---- |',
      '| ich    | bin  |',
      '| du     | bist |',
    ].join('\n')
    render(<Markdown>{md}</Markdown>)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'bist' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Person' })).toBeInTheDocument()
  })

  it('renders bold text as <strong>', () => {
    render(<Markdown>{'Ich **bin** Anna.'}</Markdown>)
    const strong = screen.getByText('bin')
    expect(strong.tagName).toBe('STRONG')
  })
})
