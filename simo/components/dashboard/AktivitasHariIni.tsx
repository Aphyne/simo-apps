'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { PackageMinus, PackagePlus, TriangleAlert } from 'lucide-react'
import { format } from 'date-fns'
import { useBarangKeluarList } from '@/hooks/useBarangKeluar'
import { useBarangMasukList } from '@/hooks/useBarangMasuk'
import { useNow } from '@/hooks/useNow'
import Panel, { SkeletonRows } from './Panel'

interface Aktivitas {
  kunci: string
  masuk: boolean
  nama: string
  jumlah: number
  satuan: string
  waktu: string // created_at, untuk urutan dan jam
}

// Yang terjadi hari ini, stok masuk dan stok keluar digabung, yang terbaru di atas.
export default function AktivitasHariIni({ className }: { className?: string }) {
  // Hanya baris hari ini: dipersempit di backend dengan rentang tanggal, bukan mengambil seluruh riwayat.
  const hariIni = format(useNow(), 'yyyy-MM-dd')
  const rentang = { dari: hariIni, sampai: hariIni, semua: true }
  const keluar = useBarangKeluarList(rentang)
  const masuk = useBarangMasukList(rentang)

  const semua: Aktivitas[] = useMemo(() => {
    const dariMasuk = (masuk.data?.data ?? [])
      // Baris "Riwayat faktur" tidak menambah stok (hanya catatan faktur lama), jadi bukan kejadian hari ini.
      .filter((b) => !b.catatan?.startsWith('Riwayat faktur'))
      .map((b) => ({ kunci: `m-${b.id}`, masuk: true, nama: b.nama_obat, jumlah: b.jumlah_satuan, satuan: b.satuan, waktu: b.created_at }))
    const dariKeluar = (keluar.data?.data ?? []).map((b) => ({
      kunci: `k-${b.id}`, masuk: false, nama: b.nama_obat, jumlah: b.jumlah, satuan: b.satuan, waktu: b.created_at,
    }))
    return [...dariMasuk, ...dariKeluar].sort((a, b) => (a.waktu < b.waktu ? 1 : a.waktu > b.waktu ? -1 : 0))
  }, [masuk.data, keluar.data])

  const isLoading = masuk.isLoading || keluar.isLoading
  // Bila salah satu gagal, daftar tidak boleh tampil seolah lengkap.
  const isError = masuk.isError || keluar.isError

  return (
    <Panel
      title="Aktivitas hari ini"
      count={isLoading || isError ? undefined : semua.length}
      action={
        // Dua tujuan yang jelas (bukan Laporan, yang terbuka di tab Stok): halaman transaksi, sudah disaring ke hari ini.
        <span className="flex items-center gap-3">
          <Link href={`/barang-masuk?tanggal=${hariIni}`} className="text-primary hover:underline focus-visible:underline">
            Stok masuk
          </Link>
          <Link href={`/barang-keluar?tanggal=${hariIni}`} className="text-primary hover:underline focus-visible:underline">
            Stok keluar
          </Link>
        </span>
      }
      className={className}
      bodyClassName="flex min-h-0 flex-col"
    >
      {isLoading ? (
        <SkeletonRows rows={5} />
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <TriangleAlert className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Catatan hari ini belum bisa dimuat</p>
          <p className="text-sm text-muted-foreground">Ini bukan berarti belum ada transaksi. Muat ulang halaman untuk mencoba lagi.</p>
        </div>
      ) : semua.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <PackageMinus className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Belum ada stok masuk atau keluar hari ini</p>
        </div>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-label="Aktivitas hari ini, bisa digulir"
          className="min-h-0 flex-1 overflow-y-auto rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="divide-y">
            {semua.map((a) => {
              const Ikon = a.masuk ? PackagePlus : PackageMinus
              return (
                <li key={a.kunci} className="flex items-center gap-3 py-2">
                  <Ikon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {a.nama}
                    <span className="sr-only">{a.masuk ? ', stok masuk' : ', stok keluar'}</span>
                  </p>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    <span className="font-semibold text-foreground">{a.masuk ? '+' : '-'}{a.jumlah}</span> {a.satuan}
                  </span>
                  <span className="w-11 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {a.waktu ? format(new Date(a.waktu), 'HH:mm') : ''}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Panel>
  )
}
