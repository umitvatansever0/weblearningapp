'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export interface AdminLesson {
  id: string
  order: number
  grammarTopic: string
  explanationDe: string
  explanationEn: string
  explanationTr: string
  exerciseCount: number
  vocabWordCount: number
}

type LessonFormState = {
  order: string
  grammarTopic: string
  explanationDe: string
  explanationEn: string
  explanationTr: string
}

const EMPTY_FORM: LessonFormState = { order: '1', grammarTopic: '', explanationDe: '', explanationEn: '', explanationTr: '' }

export function LessonManager({ unitId, initialLessons }: { unitId: string; initialLessons: AdminLesson[] }) {
  const t = useTranslations('admin')
  const [lessons, setLessons] = useState(initialLessons)
  const [form, setForm] = useState<LessonFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function startEdit(lesson: AdminLesson) {
    setEditingId(lesson.id)
    setForm({
      order: String(lesson.order),
      grammarTopic: lesson.grammarTopic,
      explanationDe: lesson.explanationDe,
      explanationEn: lesson.explanationEn,
      explanationTr: lesson.explanationTr,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const payload = {
      order: Number(form.order),
      grammarTopic: form.grammarTopic,
      explanationDe: form.explanationDe,
      explanationEn: form.explanationEn,
      explanationTr: form.explanationTr,
    }

    const res = await fetch(editingId ? `/api/admin/lessons/${editingId}` : `/api/admin/units/${unitId}/lessons`, {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? t('saveError'))
      return
    }

    if (editingId) {
      setLessons((current) => current.map((l) => (l.id === editingId ? { ...l, ...payload } : l)))
    } else {
      const created = await res.json()
      setLessons((current) => [...current, { id: created.id, ...payload, exerciseCount: 0, vocabWordCount: 0 }])
    }
    cancelEdit()
  }

  async function handleDelete(lessonId: string) {
    if (!confirm(t('confirmDelete'))) return
    const res = await fetch(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' })
    if (res.ok) {
      setLessons((current) => current.filter((l) => l.id !== lessonId))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <ul className="flex flex-col gap-2">
        {lessons.map((lesson) => (
          <li key={lesson.id} className="border rounded px-4 py-2 flex items-center justify-between">
            <Link href={`/admin/content/lessons/${lesson.id}`} className="underline">
              {lesson.grammarTopic} ({lesson.exerciseCount} ex, {lesson.vocabWordCount} vocab)
            </Link>
            <span className="flex gap-2">
              <button type="button" onClick={() => startEdit(lesson)} className="text-sm underline">
                {t('edit')}
              </button>
              <button type="button" onClick={() => handleDelete(lesson.id)} className="text-sm underline text-red-600">
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
          {t('grammarTopicLabel')}
          <input
            type="text"
            value={form.grammarTopic}
            onChange={(e) => setForm({ ...form, grammarTopic: e.target.value })}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('explanationDeLabel')}
          <textarea
            value={form.explanationDe}
            onChange={(e) => setForm({ ...form, explanationDe: e.target.value })}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('explanationEnLabel')}
          <textarea
            value={form.explanationEn}
            onChange={(e) => setForm({ ...form, explanationEn: e.target.value })}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('explanationTrLabel')}
          <textarea
            value={form.explanationTr}
            onChange={(e) => setForm({ ...form, explanationTr: e.target.value })}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <span className="flex gap-2">
          <button type="submit" disabled={submitting} className="bg-gray-900 text-white rounded px-4 py-2">
            {editingId ? t('save') : t('addLesson')}
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
