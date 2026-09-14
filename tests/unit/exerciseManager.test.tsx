import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { ExerciseManager } from '@/components/admin/ExerciseManager'
import en from '../../messages/en.json'

function renderManager() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ExerciseManager lessonId="lesson-1" initialExercises={[]} />
    </NextIntlClientProvider>
  )
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(en.admin.explanationLabel), { target: { value: 'Because.' } })
}

describe('ExerciseManager', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('shows an invalid JSON error and does not submit when data is malformed', () => {
    renderManager()
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText(en.admin.dataLabel), { target: { value: '{not valid' } })
    fireEvent.click(screen.getByText(en.admin.addExercise))

    expect(screen.getByText(en.admin.invalidJson)).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('submits parsed JSON for data and correctAnswer on valid input', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'ex-1' }),
    })

    renderManager()
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText(en.admin.dataLabel), {
      target: { value: '{"prompt":"Q?","options":["a","b"]}' },
    })
    fireEvent.change(screen.getByLabelText(en.admin.correctAnswerLabel), {
      target: { value: '{"correctIndex":0}' },
    })
    fireEvent.click(screen.getByText(en.admin.addExercise))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/lessons/lesson-1/exercises',
        expect.objectContaining({ method: 'POST' })
      )
    })
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(call[1].body)
    expect(body.data).toEqual({ prompt: 'Q?', options: ['a', 'b'] })
    expect(body.correctAnswer).toEqual({ correctIndex: 0 })
  })
})
