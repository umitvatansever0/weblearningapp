import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { UserRoleManager } from '@/components/admin/UserRoleManager'
import en from '../../messages/en.json'

const users = [
  { id: 'user-1', email: 'a@example.com', name: 'Alice', role: 'USER', xp: 0, streak: 0 },
  { id: 'user-2', email: 'b@example.com', name: 'Bob', role: 'USER', xp: 0, streak: 0 },
]

function renderManager(currentUserId = 'admin-1') {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <UserRoleManager initialUsers={users} currentUserId={currentUserId} />
    </NextIntlClientProvider>
  )
}

describe('UserRoleManager', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('renders each user with a role select', () => {
    renderManager()
    expect(screen.getByText(/Alice/)).toBeInTheDocument()
    expect(screen.getByText(/Bob/)).toBeInTheDocument()
  })

  it('disables the select for the current admin user', () => {
    renderManager('user-1')
    const select = screen.getByLabelText(`${en.admin.roleLabel} — a@example.com`) as HTMLSelectElement
    expect(select.disabled).toBe(true)
  })

  it('submits a role change and updates the select value', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'user-2', role: 'ADMIN' }),
    })

    renderManager()
    const select = screen.getByLabelText(`${en.admin.roleLabel} — b@example.com`) as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'ADMIN' } })

    await waitFor(() => {
      expect(select.value).toBe('ADMIN')
    })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/users/user-2',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('shows an error when the role change fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Cannot remove your own admin role' }),
    })

    renderManager()
    const select = screen.getByLabelText(`${en.admin.roleLabel} — b@example.com`) as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'ADMIN' } })

    await waitFor(() => {
      expect(screen.getByText('Cannot remove your own admin role')).toBeInTheDocument()
    })
  })
})
