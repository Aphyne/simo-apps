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
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Ringkasan per Pengguna</h2>
        <p className="text-xs text-gray-500 mt-0.5">Klik nama untuk memfilter log aktivitas pengguna tersebut</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {KOLOM.map((h, i) => (
                <th key={h} className={`text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-3 ${i >= 4 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="py-6 px-3"><div className="animate-pulse bg-gray-100 rounded-xl h-16" /></td></tr>
            )}
            {!isLoading && users.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-gray-500 text-sm">Belum ada pengguna.</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-3">
                  <button onClick={() => onPilihUser(u.id)} className="text-left group">
                    <span className="block font-medium text-gray-900 group-hover:text-blue-600">{u.nama}</span>
                    <span className="text-xs text-gray-500 font-mono">@{u.username}</span>
                  </button>
                  <span className={`ml-2 text-xs font-medium px-2.5 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role === 'admin' ? 'Admin' : 'Staf'}
                  </span>
                </td>
                <td className="py-3 px-3">
                  {u.online ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <span className="w-2 h-2 rounded-full bg-gray-300" /> Offline
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-gray-700 whitespace-nowrap">{waktuRelatif(u.last_seen_at)}</td>
                <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap tabular-nums">{formatWaktu(u.login_terakhir)}</td>
                <td className="py-3 px-3 text-right tabular-nums text-gray-700">{u.jumlah_login}</td>
                <td className="py-3 px-3 text-right tabular-nums text-gray-700">{u.halaman_dibuka}</td>
                <td className="py-3 px-3 text-right tabular-nums text-gray-700">{u.jumlah_aksi}</td>
                <td className="py-3 px-3 text-right tabular-nums font-medium text-gray-900">{u.aksi_hari_ini}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
