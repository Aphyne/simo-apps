'use client'

import { Badge } from '@/components/ui/badge'
import { TabelData, type KolomData } from '@/components/shared/TabelData'
import type { RingkasanUser } from '@/hooks/useAktivitas'
import { ringkasPerangkat, waktuRelatif } from './format'

interface Props {
  users: RingkasanUser[]
  isLoading: boolean
  isError: boolean
  onCobaLagi: () => void
  onPilihUser: (u: RingkasanUser) => void
}

// Garis mini aktivitas 7 hari terakhir: tujuh batang setinggi aktivitas harian, hari tanpa aktivitas = batang tipis abu.
// Angkanya ada di label untuk pembaca layar (role="img").
function GarisMini({ nilai }: { nilai: number[] }) {
  const maks = Math.max(1, ...nilai)
  return (
    <span role="img" aria-label={`Aktivitas 7 hari terakhir, terlama dulu: ${nilai.join(', ')}`} className="inline-flex h-6 items-end gap-0.5">
      {nilai.map((n, i) => (
        <span
          key={i}
          className={n > 0 ? 'w-1.5 rounded-sm bg-primary' : 'w-1.5 rounded-sm bg-muted'}
          style={{ height: n > 0 ? `${Math.max(18, (n / maks) * 100)}%` : '12%' }}
        />
      ))}
    </span>
  )
}

function Status({ online }: { online: boolean }) {
  return online ? (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
      <span className="size-2 rounded-full bg-primary" aria-hidden="true" /> Online
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <span className="size-2 rounded-full border border-muted-foreground" aria-hidden="true" /> Offline
    </span>
  )
}

export default function PenggunaTable({ users, isLoading, isError, onCobaLagi, onPilihUser }: Props) {
  const kolom: KolomData<RingkasanUser>[] = [
    {
      id: 'pengguna',
      judul: 'Pengguna',
      skeleton: ['w-32', 'w-20'],
      sel: (u) => (
        <div className="min-w-0">
          <button type="button" onClick={() => onPilihUser(u)} className="rounded-md text-left font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">
            {u.nama}
          </button>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-mono text-xs text-muted-foreground">@{u.username}</span>
            <Badge variant="secondary">{u.role === 'admin' ? 'Admin' : 'Staf'}</Badge>
            {!u.is_active && <Badge variant="outline">Nonaktif</Badge>}
            <span className="md:hidden"><Status online={u.online} /></span>
          </div>
        </div>
      ),
    },
    { id: 'status', judul: 'Status', kelas: 'hidden md:table-cell', skeleton: 'w-16', sel: (u) => <Status online={u.online} /> },
    { id: 'terakhir', judul: 'Terakhir aktif', kelas: 'hidden xl:table-cell', skeleton: 'w-24', sel: (u) => <span className="whitespace-nowrap text-muted-foreground">{waktuRelatif(u.last_seen_at)}</span> },
    { id: 'login', judul: 'Login', kanan: true, skeleton: 'w-8', sel: (u) => <span className="tabular-nums">{u.jumlah_login}</span> },
    { id: 'halaman', judul: 'Halaman', kanan: true, kelas: 'hidden xl:table-cell', skeleton: 'w-8', sel: (u) => <span className="tabular-nums">{u.halaman_dibuka}</span> },
    { id: 'aksi', judul: 'Aksi data', kanan: true, skeleton: 'w-8', sel: (u) => <span className="font-medium tabular-nums text-foreground">{u.jumlah_aksi}</span> },
    { id: 'tren', judul: '7 hari', kanan: true, kelas: 'hidden sm:table-cell', skeleton: 'w-14', sel: (u) => <GarisMini nilai={u.tren_7_hari ?? []} /> },
    { id: 'perangkat', judul: 'Perangkat terakhir', kelas: 'hidden 2xl:table-cell', skeleton: 'w-28', sel: (u) => <span className="whitespace-nowrap text-muted-foreground">{ringkasPerangkat(u.perangkat_terakhir)}</span> },
  ]

  return (
    <TabelData
      kolom={kolom}
      baris={users}
      kunci={(u) => u.id}
      isLoading={isLoading}
      isError={isError}
      onCobaLagi={onCobaLagi}
      judulGagal="Ringkasan pengguna belum bisa dimuat"
      kosong={{ judul: 'Belum ada pengguna', keterangan: 'Akun admin dan staf yang dibuat di Manajemen User akan muncul di sini.' }}
      halaman={null}
      onHalaman={() => {}}
      perHalaman={Infinity}
      barisSkeleton={3}
      noun="pengguna"
    />
  )
}
