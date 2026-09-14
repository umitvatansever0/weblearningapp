'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export interface AdminVocabWord {
  id: string
  word: string
  translationEn: string
  translationTr: string
  exampleSentence: string
}

type VocabFormState = {
  word: string
  translationEn: string
  translationTr: string
  exampleSentence: string
}

const EMPTY_FORM: VocabFormState = { word: '', translationEn: '', translationTr: '', exampleSentence: '' }

export function VocabManager({ lessonId, initialWords }: { lessonId: string; initialWords: AdminVocabWord[] }) {
  const t = useTranslations('admin')
  const [words, setWords] = useState(initialWords)
  const [form, setForm] = useState<VocabFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function startEdit(word: AdminVocabWord) {
    setEditingId(word.id)
    setForm({
      word: word.word,
      translationEn: word.translationEn,
      translationTr: word.translationTr,
      exampleSentence: word.exampleSentence,
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

    const res = await fetch(editingId ? `/api/admin/vocab/${editingId}` : `/api/admin/lessons/${lessonId}/vocab`, {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? t('saveError'))
      return
    }

    if (editingId) {
      setWords((current) => current.map((w) => (w.id === editingId ? { ...w, ...form } : w)))
    } else {
      const created = await res.json()
      setWords((current) => [...current, { id: created.id, ...form }])
    }
    cancelEdit()
  }

  async function handleDelete(wordId: string) {
    if (!confirm(t('confirmDelete'))) return
    const res = await fetch(`/api/admin/vocab/${wordId}`, { method: 'DELETE' })
    if (res.ok) {
      setWords((current) => current.filter((w) => w.id !== wordId))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <ul className="flex flex-col gap-2">
        {words.map((word) => (
          <li key={word.id} className="border rounded px-4 py-2 flex items-center justify-between">
            <span>
              {word.word} — {word.translationEn}
            </span>
            <span className="flex gap-2">
              <button type="button" onClick={() => startEdit(word)} className="text-sm underline">
                {t('edit')}
              </button>
              <button type="button" onClick={() => handleDelete(word.id)} className="text-sm underline text-red-600">
                {t('delete')}
              </button>
            </span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t pt-4">
        <label className="flex flex-col gap-1">
          {t('wordLabel')}
          <input
            type="text"
            value={form.word}
            onChange={(e) => setForm({ ...form, word: e.target.value })}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('translationEnLabel')}
          <input
            type="text"
            value={form.translationEn}
            onChange={(e) => setForm({ ...form, translationEn: e.target.value })}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('translationTrLabel')}
          <input
            type="text"
            value={form.translationTr}
            onChange={(e) => setForm({ ...form, translationTr: e.target.value })}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('exampleSentenceLabel')}
          <input
            type="text"
            value={form.exampleSentence}
            onChange={(e) => setForm({ ...form, exampleSentence: e.target.value })}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <span className="flex gap-2">
          <button type="submit" disabled={submitting} className="bg-gray-900 text-white rounded px-4 py-2">
            {editingId ? t('save') : t('addVocabWord')}
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
