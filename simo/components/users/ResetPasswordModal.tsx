'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useResetPassword, UserItem } from '@/hooks/useUsers'

interface Props {
  user: UserItem
  onClose: () => void
}

export default function ResetPasswordModal({ user, onClose }: Props) {
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
          <h2 className="text-sm font-semibold text-gray-900">Reset Password</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Konfirmasi Password</label>
            <input type="password" value={konfirmasi} onChange={e => setKonfirmasi(e.target.value)} required
              placeholder="Ulangi password baru"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm transition-colors">
              Batal
            </button>
            <button type="submit" disabled={reset.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2 text-sm disabled:opacity-60 transition-colors">
              {reset.isPending ? 'Menyimpan...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
