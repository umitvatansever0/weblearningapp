'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export interface AdminExercise {
  id: string
  order: number
  type: string
  data: unknown
  correctAnswer: unknown
  explanation: string
}

type ExerciseFormState = {
  order: string
  type: string
  data: string
  correctAnswer: string
  explanation: string
}

const EXERCISE_TYPES = ['MULTIPLE_CHOICE', 'FILL_IN_BLANK', 'MATCHING', 'SENTENCE_ORDER', 'SHORT_ANSWER']

const EMPTY_FORM: ExerciseFormState = {
  order: '1',
  type: 'MULTIPLE_CHOICE',
  data: '{}',
  correctAnswer: '{}',
  explanation: '',
}

export function ExerciseManager({ lessonId, initialExercises }: { lessonId: string; initialExercises: AdminExercise[] }) {
  const t = useTranslations('admin')
  const [exercises, setExercises] = useState(initialExercises)
  const [form, setForm] = useState<ExerciseFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function startEdit(exercise: AdminExercise) {
    setEditingId(exercise.id)
    setForm({
      order: String(exercise.order),
      type: exercise.type,
      data: JSON.stringify(exercise.data, null, 2),
      correctAnswer: JSON.stringify(exercise.correctAnswer, null, 2),
      explanation: exercise.explanation,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    let data: unknown
    let correctAnswer: unknown
    try {
      data = JSON.parse(form.data)
      correctAnswer = JSON.parse(form.correctAnswer)
    } catch {
      setError(t('invalidJson'))
      return
    }

    setSubmitting(true)
    const payload = {
      order: Number(form.order),
      type: form.type,
      data,
      correctAnswer,
      explanation: form.explanation,
    }

    const res = await fetch(editingId ? `/api/admin/exercises/${editingId}` : `/api/admin/lessons/${lessonId}/exercises`, {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSubmitting(false)

    if (!res.ok) {
      const errData = await res.json().catch(() => null)
      setError(errData?.error ?? t('saveError'))
      return
    }

    if (editingId) {
      setExercises((current) => current.map((ex) => (ex.id === editingId ? { ...ex, ...payload } : ex)))
    } else {
      const created = await res.json()
      setExercises((current) => [...current, { id: created.id, ...payload }])
    }
    cancelEdit()
  }

  async function handleDelete(exerciseId: string) {
    if (!confirm(t('confirmDelete'))) return
    const res = await fetch(`/api/admin/exercises/${exerciseId}`, { method: 'DELETE' })
    if (res.ok) {
      setExercises((current) => current.filter((ex) => ex.id !== exerciseId))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <ul className="flex flex-col gap-2">
        {exercises.map((exercise) => (
          <li key={exercise.id} className="border rounded px-4 py-2 flex items-center justify-between">
            <span>
              [{exercise.type}] {exercise.explanation}
            </span>
            <span className="flex gap-2">
              <button type="button" onClick={() => startEdit(exercise)} className="text-sm underline">
                {t('edit')}
              </button>
              <button type="button" onClick={() => handleDelete(exercise.id)} className="text-sm underline text-red-600">
                {t('delete')}
              </button>
            </span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t pt-4">
        <label className="flex flex-col gap-1">
          {t('orderLabel')}
          <input
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: e.target.value })}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('typeLabel')}
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border rounded px-2 py-1">
            {EXERCISE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          {t('dataLabel')}
          <textarea
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
            required
            className="border rounded px-2 py-1 font-mono text-sm"
            rows={4}
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('correctAnswerLabel')}
          <textarea
            value={form.correctAnswer}
            onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
            required
            className="border rounded px-2 py-1 font-mono text-sm"
            rows={3}
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('explanationLabel')}
          <textarea
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <span className="flex gap-2">
          <button type="submit" disabled={submitting} className="bg-gray-900 text-white rounded px-4 py-2">
            {editingId ? t('save') : t('addExercise')}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded px-4 py-2 border">
              {t('cancel')}
            </button>
          )}
        </span>
      </form>
    </div>
  )
}
