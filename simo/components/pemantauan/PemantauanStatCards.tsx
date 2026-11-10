'use client'

import { Wifi, LogIn, MousePointerClick, ShieldAlert } from 'lucide-react'
import type { RingkasanAktivitas } from '@/hooks/useAktivitas'

interface Props {
  data?: RingkasanAktivitas
  isLoading: boolean
}

export default function PemantauanStatCards({ data, isLoading }: Props) {
  const h = data?.hari_ini
  const cards = [
    { label: 'Sedang Online', value: h?.user_online, sub: 'aktif dalam 3 menit terakhir', icon: Wifi, bg: 'bg-emerald-100', fg: 'text-emerald-600' },
    { label: 'Login Hari Ini', value: h?.login_hari_ini, sub: 'login berhasil', icon: LogIn, bg: 'bg-brand-100', fg: 'text-brand-600' },
    { label: 'Aksi Data Hari Ini', value: h?.aksi_hari_ini, sub: 'tambah / ubah / hapus', icon: MousePointerClick, bg: 'bg-purple-100', fg: 'text-purple-600' },
    { label: 'Login Gagal Hari Ini', value: h?.login_gagal_hari_ini, sub: 'username/password salah', icon: ShieldAlert, bg: 'bg-orange-100', fg: 'text-orange-500' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div key={c.label} className="rounded-xl border border-line bg-surface p-5 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${c.fg}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-fg-muted font-medium truncate">{c.label}</p>
              {isLoading ? (
                <div className="animate-pulse bg-surface-muted rounded h-7 w-10 mt-1" />
              ) : (
                <p className="text-2xl font-bold leading-tight text-fg">{c.value ?? 0}</p>
              )}
              <p className="text-xs text-fg-muted mt-0.5 truncate">{c.sub}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
