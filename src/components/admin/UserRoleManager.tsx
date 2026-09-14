'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  xp: number
  streak: number
}

export function UserRoleManager({ initialUsers, currentUserId }: { initialUsers: AdminUser[]; currentUserId: string }) {
  const t = useTranslations('admin')
  const [users, setUsers] = useState(initialUsers)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRoleChange(userId: string, role: string) {
    setPendingId(userId)
    setError(null)

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })

    setPendingId(null)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? t('saveError'))
      return
    }

    const updated = await res.json()
    setUsers((current) => current.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)))
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">{t('usersTitle')}</th>
            <th className="py-2">{t('roleLabel')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b">
              <td className="py-2">
                {user.name} ({user.email})
              </td>
              <td className="py-2">
                <select
                  aria-label={`${t('roleLabel')} — ${user.email}`}
                  value={user.role}
                  disabled={pendingId === user.id || user.id === currentUserId}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
