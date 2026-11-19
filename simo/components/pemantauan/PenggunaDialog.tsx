'use client'

import { CircleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalitikAktivitas, useLogAktivitas, type Rentang, type RingkasanUser } from '@/hooks/useAktivitas'
import { cn } from '@/lib/utils'
import AktivitasChart from './AktivitasChart'
import FiturDipakai from './FiturDipakai'
import { JENIS_LABEL } from './LogAktivitasTable'
import { formatMenit, formatWaktu, formatWaktuSingkat, ringkasPerangkat, waktuRelatif } from './format'

interface Props {
  user: RingkasanUser | null
  rentang: Rentang
  ketRentang: string
  onTutup: () => void
  onLihatLog: (u: RingkasanUser) => void
}

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-[15px] font-semibold text-foreground">{judul}</h3>
      {children}
    </section>
  )
}

// Rincian satu pengguna dalam rentang yang sama dengan halaman: angka ringkas, grafik per hari, fitur yang dipakai,
// dan aktivitas terakhir. Memakai kembali komponen grafik halaman (satu pola, satu perubahan berlaku di dua tempat).
export default function PenggunaDialog({ user, rentang, ketRentang, onTutup, onLihatLog }: Props) {
  const buka = user !== null
  const analitik = useAnalitikAktivitas(rentang, user?.id, buka)
  const log = useLogAktivitas({ ...rentang, user_id: user ? String(user.id) : undefined, page: 1, limit: 8 }, buka)
  const a = analitik.data
  const k = a?.kpi

  const fakta = [
    { label: 'Login berhasil', nilai: k?.login },
    { label: 'Halaman dibuka', nilai: k?.halaman },
    { label: 'Aksi data', nilai: k?.aksi },
    { label: 'Hari aktif', nilai: k?.hari_aktif, ket: a ? `dari ${a.rentang.hari_total} hari` : undefined },
  ]

  return (
    <Dialog open={buka} onOpenChange={(o) => { if (!o) onTutup() }}>
      <DialogContent className="max-h-[88dvh] gap-6 overflow-y-auto p-5 sm:max-w-2xl sm:p-6">
        {user && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight">
                {user.nama}
                <Badge variant="secondary">{user.role === 'admin' ? 'Admin' : 'Staf'}</Badge>
                {!user.is_active && <Badge variant="outline">Nonaktif</Badge>}
              </DialogTitle>
              <DialogDescription>
                <span className="font-mono text-xs">@{user.username}</span> · {user.online ? 'Online sekarang' : `Terakhir aktif ${waktuRelatif(user.last_seen_at).toLowerCase()}`} · {ketRentang}
              </DialogDescription>
            </DialogHeader>

            {analitik.isError ? (
              <div role="status" className="flex items-start gap-2.5 rounded-xl bg-muted/60 p-4 text-sm">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <p className="text-foreground">Rincian belum bisa dimuat. Ini bukan berarti pengguna ini tidak punya aktivitas.</p>
              </div>
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                  {fakta.map((f) => (
                    <div key={f.label}>
                      <dt className="text-sm text-muted-foreground">{f.label}</dt>
                      <dd className="mt-1 text-3xl font-semibold leading-none tabular-nums text-foreground">
                        {analitik.isLoading ? <Skeleton className="h-8 w-12" /> : f.nilai ?? '-'}
                      </dd>
                      {f.ket && <p className="mt-1 text-sm text-muted-foreground">{f.ket}</p>}
                    </div>
                  ))}
                </dl>
                <p className="-mt-2 text-sm text-muted-foreground">
                  Login terakhir {formatWaktu(user.login_terakhir)} · {ringkasPerangkat(user.perangkat_terakhir)}
                  {k && k.sesi > 0 && <> · rata-rata sesi sekitar {formatMenit(k.rata_sesi_menit)} (perkiraan)</>}
                </p>

                <Bagian judul="Aktivitas per hari">
                  {a ? <AktivitasChart data={a.harian} satuan={a.rentang.satuan} height={180} /> : <Skeleton className="h-44 w-full rounded-xl" />}
                </Bagian>

                <Bagian judul="Fitur yang dipakai">
                  {a ? <FiturDipakai modul={a.modul} /> : <Skeleton className="h-40 w-full rounded-xl" />}
                </Bagian>
              </>
            )}

            <Bagian judul="Aktivitas terakhir">
              {log.isError ? (
                <p className="text-sm text-muted-foreground">Log belum bisa dimuat.</p>
              ) : log.isLoading ? (
                <Skeleton className="h-32 w-full rounded-xl" />
              ) : (log.data?.data.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada aktivitas pada rentang ini.</p>
              ) : (
                <ul className="flex flex-col">
                  {log.data!.data.map((r) => {
                    const j = JENIS_LABEL[r.jenis]
                    return (
                      <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t py-2.5 text-sm first:border-t-0 first:pt-0">
                        <span className="w-28 shrink-0 tabular-nums text-muted-foreground">{formatWaktuSingkat(r.created_at)}</span>
                        <Badge variant={j?.variant ?? 'outline'} className={cn(j?.kelas)}>{j?.label ?? r.jenis}</Badge>
                        <span className="min-w-0 flex-1 text-foreground">{r.deskripsi ?? '—'}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Bagian>

            <DialogFooter className="sm:justify-start">
              <Button variant="outline" size="lg" className="h-10 rounded-xl px-4" onClick={() => onLihatLog(user)}>
                Lihat semua di log aktivitas
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
