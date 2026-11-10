'use client'

import { useState } from 'react'
import { Plus, Pencil, KeyRound, ToggleLeft, ToggleRight, Search } from 'lucide-react'
import { useToggleAktif, UserItem } from '@/hooks/useUsers'
import { useAuthStore } from '@/store/auth.store'
import { formatTanggal } from '@/lib/utils'
import UserForm from '@/components/users/UserForm'
import ResetPasswordModal from '@/components/users/ResetPasswordModal'

interface Props {
  users: UserItem[]
  isLoading: boolean
}

export default function UserTable({ users, isLoading }: Props) {
  const toggleAktif = useToggleAktif()
  const currentUser = useAuthStore(s => s.user)

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'semua' | 'admin' | 'staf'>('semua')
  const [filterStatus, setFilterStatus] = useState<'semua' | 'aktif' | 'nonaktif'>('semua')
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<UserItem | null>(null)
  const [resetUser, setResetUser] = useState<UserItem | null>(null)

  const filtered = users.filter(u => {
    const matchSearch = u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'semua' || u.role === filterRole
    const matchStatus = filterStatus === 'semua' ||
      (filterStatus === 'aktif' ? u.is_active : !u.is_active)
    return matchSearch && matchRole && matchStatus
  })

  return (
    <>
      <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-line-subtle">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama atau username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-line-strong rounded-lg pl-9 pr-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value as 'semua' | 'admin' | 'staf')}
            className="border border-line-strong rounded-lg px-3 py-2 text-sm text-fg-secondary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="semua">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="staf">Staf</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as 'semua' | 'aktif' | 'nonaktif')}
            className="border border-line-strong rounded-lg px-3 py-2 text-sm text-fg-secondary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Non-aktif</option>
          </select>
          <button onClick={() => setShowForm(true)}
            className="ml-auto bg-brand-600 hover:bg-brand-700 text-fg-inverse font-medium rounded-lg px-4 py-2 text-sm flex items-center gap-1.5 transition-colors">
            <Plus className="h-4 w-4" /> Tambah User
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Username</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Terdaftar</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-fg-muted">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-fg-muted">
                    {search || filterRole !== 'semua' || filterStatus !== 'semua'
                      ? 'Tidak ada user yang sesuai filter'
                      : 'Belum ada user'}
                  </td>
                </tr>
              ) : filtered.map(u => (
                <tr key={u.id} className={`border-b border-line-subtle hover:bg-surface-subtle transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-fg">{u.nama}</div>
                    {u.id === currentUser?.id && (
                      <span className="text-xs text-brand-600">akun kamu</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-surface-muted text-fg-tertiary'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : 'Staf'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.is_active ? 'bg-success-100 text-emerald-700' : 'bg-surface-muted text-gray-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {u.is_active ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-fg-tertiary">{formatTanggal(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditUser(u)} title="Edit"
                        className="rounded-lg p-1.5 text-fg-muted hover:bg-surface-muted hover:text-fg-secondary transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setResetUser(u)} title="Reset Password"
                        className="rounded-lg p-1.5 text-fg-muted hover:bg-danger-50 hover:text-danger-600 transition-colors">
                        <KeyRound className="h-4 w-4" />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          title={u.is_active ? 'Nonaktifkan' : 'Aktifkan kembali'}
                          onClick={() => toggleAktif.mutate(u.id)}
                          disabled={toggleAktif.isPending}
                          className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
                            u.is_active
                              ? 'text-gray-500 hover:bg-red-50 hover:text-red-500'
                              : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}>
                          {u.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <div className="px-5 py-3 border-t border-line-subtle bg-surface-subtle/50">
          <p className="text-xs text-fg-muted">
            Hapus akun permanen tersedia di dalam menu Edit. User yang sudah memiliki transaksi tidak bisa dihapus.
          </p>
        </div>
      </div>

      {showForm && <UserForm onClose={() => setShowForm(false)} />}
      {editUser && <UserForm initial={editUser} onClose={() => setEditUser(null)} />}
      {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />}
    </>
  )
}
