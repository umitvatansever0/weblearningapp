'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export interface AdminUnit {
  id: string
  levelCode: string
  order: number
  titleDe: string
  titleEn: string
  titleTr: string
  lessonCount: number
}

const LEVEL_CODES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

type UnitFormState = {
  levelCode: string
  order: string
  titleDe: string
  titleEn: string
  titleTr: string
}

const EMPTY_FORM: UnitFormState = { levelCode: 'A1', order: '1', titleDe: '', titleEn: '', titleTr: '' }

export function UnitManager({ initialUnits }: { initialUnits: AdminUnit[] }) {
  const t = useTranslations('admin')
  const [units, setUnits] = useState(initialUnits)
  const [form, setForm] = useState<UnitFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function startEdit(unit: AdminUnit) {
    setEditingId(unit.id)
    setForm({
      levelCode: unit.levelCode,
      order: String(unit.order),
      titleDe: unit.titleDe,
      titleEn: unit.titleEn,
      titleTr: unit.titleTr,
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
      levelCode: form.levelCode,
      order: Number(form.order),
      titleDe: form.titleDe,
      titleEn: form.titleEn,
      titleTr: form.titleTr,
    }

    const res = await fetch(editingId ? `/api/admin/units/${editingId}` : '/api/admin/units', {
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
      setUnits((current) => current.map((u) => (u.id === editingId ? { ...u, ...payload } : u)))
    } else {
      const created = await res.json()
      setUnits((current) => [...current, { id: created.id, ...payload, lessonCount: 0 }])
    }
    cancelEdit()
  }

  async function handleDelete(unitId: string) {
    if (!confirm(t('confirmDelete'))) return
    const res = await fetch(`/api/admin/units/${unitId}`, { method: 'DELETE' })
    if (res.ok) {
      setUnits((current) => current.filter((u) => u.id !== unitId))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <ul className="flex flex-col gap-2">
        {units.map((unit) => (
          <li key={unit.id} className="border rounded px-4 py-2 flex items-center justify-between">
            <Link href={`/admin/content/units/${unit.id}`} className="underline">
              [{unit.levelCode}] {unit.titleEn} ({unit.lessonCount})
            </Link>
            <span className="flex gap-2">
              <button type="button" onClick={() => startEdit(unit)} className="text-sm underline">
                {t('edit')}
              </button>
              <button type="button" onClick={() => handleDelete(unit.id)} className="text-sm underline text-red-600">
                {t('delete')}
              </button>
            </span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t pt-4">
        <label className="flex flex-col gap-1">
          {t('levelLabel')}
          <select
            value={form.levelCode}
            onChange={(e) => setForm({ ...form, levelCode: e.target.value })}
            className="border rounded px-2 py-1"
          >
            {LEVEL_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
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
          {t('titleDeLabel')}
          <input
            type="text"
            value={form.titleDe}
            onChange={(e) => setForm({ ...form, titleDe: e.target.value })}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('titleEnLabel')}
          <input
            type="text"
            value={form.titleEn}
            onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('titleTrLabel')}
          <input
            type="text"
            value={form.titleTr}
            onChange={(e) => setForm({ ...form, titleTr: e.target.value })}
            required
            className="border rounded px-2 py-1"
          />
        </label>
        <span className="flex gap-2">
          <button type="submit" disabled={submitting} className="bg-gray-900 text-white rounded px-4 py-2">
            {editingId ? t('save') : t('addUnit')}
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
