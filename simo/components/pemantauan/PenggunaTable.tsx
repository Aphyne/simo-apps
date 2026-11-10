'use client'

import type { RingkasanUser } from '@/hooks/useAktivitas'
import { formatWaktu, waktuRelatif } from './format'

interface Props {
  users: RingkasanUser[]
  isLoading: boolean
  onPilihUser: (id: number) => void
}

const KOLOM = ['Pengguna', 'Status', 'Terakhir Aktif', 'Login Terakhir', 'Login', 'Halaman', 'Aksi Data', 'Aksi Hari Ini']

export default function PenggunaTable({ users, isLoading, onPilihUser }: Props) {
  return (
    <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-line-subtle">
        <h2 className="text-sm font-semibold text-fg-secondary">Ringkasan per Pengguna</h2>
        <p className="text-xs text-fg-muted mt-0.5">Klik nama untuk memfilter log aktivitas pengguna tersebut</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              {KOLOM.map((h, i) => (
                <th key={h} className={`text-xs font-semibold text-fg-muted uppercase tracking-wide py-3 px-3 ${i >= 4 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="py-6 px-3"><div className="animate-pulse bg-surface-muted rounded-xl h-16" /></td></tr>
            )}
            {!isLoading && users.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-fg-muted text-sm">Belum ada pengguna.</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line-subtle hover:bg-surface-subtle transition-colors">
                <td className="py-3 px-3">
                  <button onClick={() => onPilihUser(u.id)} className="text-left group">
                    <span className="block font-medium text-fg group-hover:text-brand-600">{u.nama}</span>
                    <span className="text-xs text-fg-muted font-mono">@{u.username}</span>
                  </button>
                  <span className={`ml-2 text-xs font-medium px-2.5 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-surface-muted text-fg-tertiary'}`}>
                    {u.role === 'admin' ? 'Admin' : 'Staf'}
                  </span>
                </td>
                <td className="py-3 px-3">
                  {u.online ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-700">
                      <span className="w-2 h-2 rounded-full bg-success-500" /> Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted">
                      <span className="w-2 h-2 rounded-full bg-gray-300" /> Offline
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-fg-secondary whitespace-nowrap">{waktuRelatif(u.last_seen_at)}</td>
                <td className="py-3 px-3 text-xs text-fg-tertiary whitespace-nowrap tabular-nums">{formatWaktu(u.login_terakhir)}</td>
                <td className="py-3 px-3 text-right tabular-nums text-fg-secondary">{u.jumlah_login}</td>
                <td className="py-3 px-3 text-right tabular-nums text-fg-secondary">{u.halaman_dibuka}</td>
                <td className="py-3 px-3 text-right tabular-nums text-fg-secondary">{u.jumlah_aksi}</td>
                <td className="py-3 px-3 text-right tabular-nums font-medium text-fg">{u.aksi_hari_ini}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
