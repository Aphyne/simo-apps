'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Bell, CircleCheck, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import StatusBadge from '@/components/ui/StatusBadge'
import { useReorderAlerts } from '@/hooks/useObat'
import { useAuthStore } from '@/store/auth.store'
import { urutKeparahan } from '@/lib/reorderAlert'
import { formatAngka } from '@/lib/utils'

// Berapa obat yang ditulis di panel. Sisanya ada di halaman Reorder; panel menyebut "N teratas" dan menautkan semuanya.
const MAKS_BARIS = 5

// Lonceng notifikasi di header: obat yang stoknya sudah di bawah titik pesan ulang (ROP). Lonceng selalu tampil (dulu hilang
// saat tidak ada peringatan, sehingga gagal memuat terlihat sama dengan aman). Angka merah hanya bila ada yang perlu dipesan.
export default function AlertNotification() {
  const { data: alerts = [], isLoading, isError, refetch } = useReorderAlerts()
  const isAdmin = useAuthStore((s) => s.isAdmin())

  const urut = useMemo(() => [...alerts].sort(urutKeparahan), [alerts])
  const tampil = urut.slice(0, MAKS_BARIS)
  const jumlah = alerts.length
  const habis = alerts.filter((a) => a.stok <= 0).length

  const labelLonceng = isError
    ? 'Notifikasi, daftar obat belum bisa dimuat'
    : jumlah > 0
      ? `Notifikasi, ${jumlah} obat perlu dipesan ulang`
      : 'Notifikasi, tidak ada obat yang perlu dipesan'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={labelLonceng}
          className="relative flex size-11 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted data-[state=open]:text-foreground"
        >
          <Bell className="size-5" aria-hidden="true" />
          {jumlah > 0 && (
            <span aria-hidden="true" className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold tabular-nums text-white">
              {jumlah > 99 ? '99+' : jumlah}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[22rem] max-w-[calc(100vw-2rem)]" aria-label="Notifikasi stok">
        <div className="px-5 pb-3 pt-4">
          <h2 className="text-[15px] font-semibold text-foreground">Perlu dipesan ulang</h2>
          {!isLoading && !isError && jumlah > 0 && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {jumlah} obat di bawah titik pesan ulang{habis > 0 ? `, ${habis} sudah habis` : ''}.
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3 px-5 pb-5" aria-busy="true" aria-label="Memuat notifikasi">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div role="alert" className="flex flex-col items-center gap-2 px-5 pb-6 pt-2 text-center">
            <TriangleAlert className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Daftar belum bisa dimuat</p>
            <p className="text-sm text-muted-foreground">Ini bukan berarti stok aman. Periksa koneksi, lalu coba lagi.</p>
            <Button variant="outline" size="lg" className="mt-1 h-10 rounded-xl px-4" onClick={() => refetch()}>Coba lagi</Button>
          </div>
        ) : jumlah === 0 ? (
          <div role="status" className="flex flex-col items-center gap-2 px-5 pb-6 pt-2 text-center">
            <CircleCheck className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Tidak ada obat yang perlu dipesan</p>
            <p className="text-sm text-muted-foreground">Semua stok masih di atas titik pesan ulang.</p>
          </div>
        ) : (
          <>
            {/* Baris datar dipisah garis tipis (bukan kartu di dalam kartu). Habis dahulu, lalu yang paling tipis. */}
            <ul className="max-h-[22rem] overflow-y-auto border-t border-border">
              {tampil.map((a) => (
                <li key={a.id} className="border-b border-border px-5 py-3 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-sm font-medium leading-snug text-foreground">{a.nama}</p>
                    <span className="shrink-0"><StatusBadge status="HARUS_REORDER" stok={a.stok} /></span>
                  </div>
                  <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
                    Stok <span className="font-medium text-foreground">{formatAngka(a.stok, 0)}</span> dari ROP {formatAngka(a.rop, 2)} {a.satuan}
                  </p>
                  {/* Supplier dan pesan ulang adalah urusan admin; staf cukup melihat stoknya. */}
                  {isAdmin && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.supplier_nama ?? a.nama_supplier ?? (
                        <span className="inline-flex items-center gap-1 font-medium text-warning-700">
                          <TriangleAlert className="size-3.5" aria-hidden="true" />
                          Supplier belum diatur
                        </span>
                      )}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <div className="border-t border-border p-3">
              {jumlah > MAKS_BARIS && (
                <p className="px-2 pb-2 text-sm text-muted-foreground">{MAKS_BARIS} teratas dari {jumlah} obat.</p>
              )}
              {isAdmin ? (
                <Button size="lg" className="h-10 w-full rounded-xl px-4" asChild>
                  <Link href="/reorder">{jumlah > MAKS_BARIS ? `Lihat semua ${jumlah} di Reorder` : 'Buka Reorder'}</Link>
                </Button>
              ) : (
                <>
                  <p className="px-2 pb-2 text-sm text-muted-foreground">Pemesanan dilakukan oleh admin. Sampaikan daftar ini kepada admin.</p>
                  <Button size="lg" className="h-10 w-full rounded-xl px-4" asChild>
                    <Link href="/obat?status=HARUS_REORDER">{jumlah > MAKS_BARIS ? `Lihat semua ${jumlah} di Data Obat` : 'Buka di Data Obat'}</Link>
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
