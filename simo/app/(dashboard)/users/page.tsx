'use client'

import { useState } from 'react'
import { Users, Plus, Pencil, KeyRound, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { useUserList, useCreateUser, useUpdateUser, useResetPassword, useToggleAktif, useDeleteUser, UserItem } from '@/hooks/useUsers'
import { useAuthStore } from '@/store/auth.store'
import { formatTanggal } from '@/lib/utils'

// ── Form Tambah / Edit ────────────────────────────────────────────────────────
function UserForm({ initial, onClose }: { initial?: UserItem; onClose: () => void }) {
  const isEdit = !!initial
  const [nama, setNama] = useState(initial?.nama ?? '')
  const [username, setUsername] = useState(initial?.username ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'staf'>(initial?.role ?? 'staf')
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [confirmHapus, setConfirmHapus] = useState(false)

  const create = useCreateUser()
  const update = useUpdateUser()
  const hapus = useDeleteUser()
  const loading = create.isPending || update.isPending

  const currentUser = useAuthStore(s => s.user)
  const isSelf = initial?.id === currentUser?.id

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (isEdit) {
      update.mutate({ id: initial!.id, nama, role, is_active: isActive }, { onSuccess: onClose })
    } else {
      create.mutate({ username, password, nama, role }, { onSuccess: onClose })
    }
  }

  function handleHapus() {
    hapus.mutate(initial!.id, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-800">{isEdit ? 'Edit User' : 'Tambah User'}</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input value={nama} onChange={e => setNama(e.target.value)} required
              placeholder="Contoh: Budi Santoso"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} required
                  placeholder="Contoh: budi123"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'staf')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="staf">Staf</option>
              <option value="admin">Admin</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">Admin: akses penuh. Staf: hanya input transaksi.</p>
          </div>

          {isEdit && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Status Akun</label>
              <button type="button" onClick={() => setIsActive(v => !v)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                {isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                {isActive ? 'Aktif' : 'Non-aktif'}
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah User'}
            </button>
          </div>

          {/* Hapus akun — hanya saat edit, bukan akun sendiri, belum ada transaksi */}
          {isEdit && !isSelf && (
            <div className="border-t border-gray-100 pt-4">
              {initial!.jumlah_transaksi > 0 ? (
                <p className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Trash2 className="h-3.5 w-3.5" />
                  Tidak bisa dihapus — user sudah memiliki {initial!.jumlah_transaksi} transaksi. Gunakan toggle nonaktif.
                </p>
              ) : !confirmHapus ? (
                <button type="button" onClick={() => setConfirmHapus(true)}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" /> Hapus Akun Ini
                </button>
              ) : (
                <div className="rounded-lg bg-red-50 p-3 text-sm">
                  <p className="font-medium text-red-700">Yakin hapus akun <span className="font-bold">{initial!.nama}</span>?</p>
                  <p className="mt-0.5 text-xs text-red-500">User belum memiliki transaksi. Akun akan dihapus permanen dan tidak bisa dikembalikan.</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setConfirmHapus(false)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                      Batal
                    </button>
                    <button type="button" onClick={handleHapus} disabled={hapus.isPending}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                      {hapus.isPending ? 'Menghapus…' : 'Ya, Hapus Permanen'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// ── Modal Reset Password ───────────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose }: { user: UserItem; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [konfirmasi, setKonfirmasi] = useState('')
  const reset = useResetPassword()

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (password !== konfirmasi) return alert('Password dan konfirmasi tidak cocok')
    reset.mutate({ id: user.id, password_baru: password }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-800">Reset Password</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <p className="text-sm text-gray-500">
            Reset password untuk <span className="font-semibold text-gray-700">{user.nama}</span>{' '}
            <span className="font-mono text-xs text-gray-400">({user.username})</span>
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password Baru</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Minimal 6 karakter"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Konfirmasi Password</label>
            <input type="password" value={konfirmasi} onChange={e => setKonfirmasi(e.target.value)} required
              placeholder="Ulangi password baru"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={reset.isPending}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">
              {reset.isPending ? 'Menyimpan…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { data, isLoading } = useUserList()
  const toggleAktif = useToggleAktif()
  const currentUser = useAuthStore(s => s.user)
  const users = data ?? []

  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<UserItem | null>(null)
  const [resetUser, setResetUser] = useState<UserItem | null>(null)

  const aktif = users.filter(u => u.is_active)
  const nonAktif = users.filter(u => !u.is_active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Users className="h-6 w-6 text-blue-600" />
            Manajemen User
          </h1>
          <p className="mt-1 text-sm text-gray-500">Kelola akun pengguna sistem SIMO</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Tambah User
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total User', value: users.length, color: 'text-gray-800' },
          { label: 'Aktif', value: aktif.length, color: 'text-green-600' },
          { label: 'Non-aktif', value: nonAktif.length, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-0.5 text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Nama</th>
              <th className="px-4 py-3 text-left">Username</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Terdaftar</th>
              <th className="px-4 py-3 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    Memuat data…
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-gray-400">Belum ada user</td>
              </tr>
            ) : users.map(u => (
              <tr key={u.id} className={`transition-colors hover:bg-gray-50 ${!u.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{u.nama}</div>
                  {u.id === currentUser?.id && (
                    <span className="text-xs text-blue-500">(akun kamu)</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.username}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {u.is_active ? 'Aktif' : 'Non-aktif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatTanggal(u.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {/* Edit */}
                    <button onClick={() => setEditUser(u)} title="Edit"
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {/* Reset Password */}
                    <button onClick={() => setResetUser(u)} title="Reset Password"
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-orange-50 hover:text-orange-600">
                      <KeyRound className="h-4 w-4" />
                    </button>
                    {/* Toggle aktif — hanya untuk user lain */}
                    {u.id !== currentUser?.id && (
                      <button
                        title={u.is_active ? 'Nonaktifkan' : 'Aktifkan kembali'}
                        onClick={() => toggleAktif.mutate(u.id)}
                        disabled={toggleAktif.isPending}
                        className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
                          u.is_active
                            ? 'text-gray-500 hover:bg-red-50 hover:text-red-500'
                            : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
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

      <p className="text-xs text-gray-400">
        * Hapus akun permanen tersedia di dalam menu Edit. Transaksi user akan dialihkan ke akun admin.
      </p>

      {/* Modals */}
      {showForm && <UserForm onClose={() => setShowForm(false)} />}
      {editUser && <UserForm initial={editUser} onClose={() => setEditUser(null)} />}
      {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />}
    </div>
  )
}
