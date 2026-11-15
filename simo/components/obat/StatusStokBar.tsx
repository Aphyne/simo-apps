'use client'

import { useMemo } from 'react'
import { TriangleAlert } from 'lucide-react'
import Panel from '@/components/dashboard/Panel'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Obat, StatusStok } from '@/types/obat'

// Komposisi status stok sebagai batang bertumpuk 100% (tiga bagian). Kalimat di atas menyebut
// intinya ("64 dari 82 obat aman"), batang menunjukkan perbandingan, dan legenda menuliskan jumlah
// dan persen sehingga warna tidak berdiri sendiri. Baris legenda adalah tombol filter status
// (klik lagi untuk batal). Garis level per obat (LevelBar) tetap di baris tabel.
interface Props {
  allObat: Obat[]
  isLoading: boolean
  isError?: boolean
  statusAktif?: string
  onPilihStatus?: (status: StatusStok) => void
  className?: string
}

// Urutan: yang paling mendesak dulu.
const BAGIAN: { status: StatusStok; label: string; titik: string }[] = [
  { status: 'HARUS_REORDER', label: 'Harus reorder', titik: 'bg-danger-500' },
  { status: 'MENDEKATI_ROP', label: 'Mendekati ROP', titik: 'bg-warning-500' },
  { status: 'AMAN', label: 'Aman', titik: 'bg-primary' },
]

export default function StatusStokBar({ allObat, isLoading, isError, statusAktif = '', onPilihStatus, className }: Props) {
  const { jumlah, total } = useMemo(() => {
    const jumlah: Record<StatusStok, number> = { AMAN: 0, MENDEKATI_ROP: 0, HARUS_REORDER: 0 }
    allObat.forEach((o) => {
      if (o.status in jumlah) jumlah[o.status] += 1
    })
    return { jumlah, total: allObat.length }
  }, [allObat])

  const persen = (n: number) => (total ? Math.round((n / total) * 100) : 0)

  return (
    <Panel title="Kondisi stok" className={className}>
      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Memuat kondisi stok">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 rounded-full" />
          <Skeleton className="h-9 rounded-xl" />
          <Skeleton className="h-9 rounded-xl" />
          <Skeleton className="h-9 rounded-xl" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <TriangleAlert className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Kondisi stok belum bisa dimuat</p>
          <p className="text-sm text-muted-foreground">Ini bukan berarti semua stok aman.</p>
        </div>
      ) : total === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Belum ada obat, jadi belum ada kondisi stok untuk ditampilkan.</p>
      ) : (
        <>
          <p className="text-[15px] text-foreground">
            <span className="text-2xl font-semibold tabular-nums">{jumlah.AMAN}</span>
            <span className="text-muted-foreground"> dari {total} obat aman, {persen(jumlah.AMAN)}%</span>
          </p>

          {/* Batang bertumpuk: aman (biru), mendekati (oranye), harus reorder (merah), dipisah celah 2px */}
          <div
            className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-full"
            role="img"
            aria-label={`Komposisi stok: ${jumlah.AMAN} aman, ${jumlah.MENDEKATI_ROP} mendekati ROP, ${jumlah.HARUS_REORDER} harus reorder dari ${total} obat`}
          >
            {[BAGIAN[2], BAGIAN[1], BAGIAN[0]].map((b) =>
              jumlah[b.status] > 0 ? (
                <span
                  key={b.status}
                  className={cn('block h-full min-w-1.5 transition-opacity', b.titik, statusAktif && statusAktif !== b.status && 'opacity-30')}
                  style={{ flexGrow: jumlah[b.status], flexBasis: 0 }}
                />
              ) : null
            )}
          </div>

          <ul className="mt-3">
            {BAGIAN.map((b) => {
              const dipilih = statusAktif === b.status
              return (
                <li key={b.status}>
                  <button
                    type="button"
                    disabled={!onPilihStatus}
                    aria-pressed={dipilih}
                    aria-label={`${b.label}: ${jumlah[b.status]} obat, ${persen(jumlah[b.status])} persen${onPilihStatus ? (dipilih ? '. Tekan untuk menghapus filter' : '. Tekan untuk memfilter tabel') : ''}`}
                    onClick={() => onPilihStatus?.(b.status)}
                    className={cn(
                      'flex min-h-9 w-full items-center gap-2.5 rounded-xl px-2 py-1 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                      onPilihStatus ? 'hover:bg-muted/60' : 'cursor-default',
                      dipilih && 'bg-accent'
                    )}
                  >
                    <span className={cn('size-2.5 shrink-0 rounded-full', b.titik)} aria-hidden="true" />
                    <span className={cn('min-w-0 flex-1 truncate', dipilih ? 'font-semibold text-foreground' : 'text-foreground/80')}>{b.label}</span>
                    <span className="font-medium tabular-nums text-foreground">{jumlah[b.status]}</span>
                    <span className="w-9 text-right tabular-nums text-muted-foreground">{persen(jumlah[b.status])}%</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Panel>
  )
}
