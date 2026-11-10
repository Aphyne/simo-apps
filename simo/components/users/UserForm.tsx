'use client'

import { useState } from 'react'
import { Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { useCreateUser, useUpdateUser, useDeleteUser, UserItem } from '@/hooks/useUsers'
import { useAuthStore } from '@/store/auth.store'

interface Props {
  initial?: UserItem
  onClose: () => void
}

export default function UserForm({ initial, onClose }: Props) {
  const isEdit = !!initial
  const [nama, setNama] = useState(initial?.nama ?? '')
  const [username, setUsername] = useState(initial?.username ?? '')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState(initial?.email ?? '')
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
      update.mutate({ id: initial!.id, nama, role, is_active: isActive, email: email || undefined }, { onSuccess: onClose })
    } else {
      create.mutate({ username, password, nama, role, email: email || undefined }, { onSuccess: onClose })
    }
  }

  function handleHapus() {
    hapus.mutate(initial!.id, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">{isEdit ? 'Edit User' : 'Tambah User'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-fg-subtle hover:bg-surface-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-secondary">Nama Lengkap</label>
            <input value={nama} onChange={e => setNama(e.target.value)} required
              placeholder="Contoh: Budi Santoso"
              className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-fg-secondary">Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} required
                  placeholder="Contoh: budi123"
                  className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-fg-secondary">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-fg-secondary">
              Email Google <span className="text-fg-muted font-normal">(opsional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contoh@gmail.com"
              className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            <p className="mt-1 text-xs text-fg-muted">Isi jika user ingin login menggunakan Google.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-fg-secondary">Role</label>
            <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'staf')}
              className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
              <option value="staf">Staf</option>
              <option value="admin">Admin</option>
            </select>
            <p className="mt-1 text-xs text-fg-muted">Admin: akses penuh. Staf: hanya input transaksi.</p>
          </div>

          {isEdit && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-fg-secondary">Status Akun</label>
              <button type="button" onClick={() => setIsActive(v => !v)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive ? 'bg-success-100 text-emerald-700' : 'bg-surface-muted text-gray-600'
                }`}>
                {isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                {isActive ? 'Aktif' : 'Non-aktif'}
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="border border-line-strong text-fg-secondary hover:bg-surface-subtle rounded-lg px-4 py-2 text-sm transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="bg-brand-600 hover:bg-brand-700 text-fg-inverse font-medium rounded-lg px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah User'}
            </button>
          </div>

          {isEdit && !isSelf && (
            <div className="border-t border-line-subtle pt-4">
              {initial!.jumlah_transaksi > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-fg-muted">
                  <Trash2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Tidak bisa dihapus — user memiliki {initial!.jumlah_transaksi} transaksi. Gunakan toggle nonaktif.</span>
                </div>
              ) : !confirmHapus ? (
                <button type="button" onClick={() => setConfirmHapus(true)}
                  className="flex items-center gap-1.5 text-xs text-danger-600 hover:text-danger-700 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" /> Hapus Akun Ini
                </button>
              ) : (
                <div className="rounded-lg bg-danger-50 border border-danger-100 p-3">
                  <p className="text-sm font-medium text-danger-700">Hapus akun <span className="font-bold">{initial!.nama}</span>?</p>
                  <p className="mt-0.5 text-xs text-danger-600">Akun akan dihapus permanen dan tidak bisa dikembalikan.</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setConfirmHapus(false)}
                      className="border border-line-strong text-fg-tertiary hover:bg-surface-subtle rounded-lg px-3 py-1.5 text-xs transition-colors">
                      Batal
                    </button>
                    <button type="button" onClick={handleHapus} disabled={hapus.isPending}
                      className="bg-danger-600 hover:bg-danger-700 text-fg-inverse font-medium rounded-lg px-3 py-1.5 text-xs disabled:opacity-60 transition-colors">
                      {hapus.isPending ? 'Menghapus...' : 'Ya, Hapus Permanen'}
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
