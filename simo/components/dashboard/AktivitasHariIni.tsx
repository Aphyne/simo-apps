'use client'

import { useMemo } from 'react'
import { PackageMinus } from 'lucide-react'
import { format } from 'date-fns'
import { useBarangKeluarList } from '@/hooks/useBarangKeluar'
import { useNow } from '@/hooks/useNow'
import type { BarangKeluar } from '@/types/obat'
import Panel, { SkeletonRows } from './Panel'

export default function AktivitasHariIni({ className }: { className?: string }) {
  // Hanya butuh baris hari ini: dipersempit di backend dengan rentang tanggal, bukan mengambil seluruh riwayat.
  // (Dulu limit 9999, yang diam-diam dipotong backend jadi 100 baris terbaru.)
  const hariIni = format(useNow(), 'yyyy-MM-dd')
  const { data, isLoading, isError } = useBarangKeluarList({ dari: hariIni, sampai: hariIni, semua: true })
  const allList: BarangKeluar[] = useMemo(() => data?.data ?? [], [data])

  const todayList = useMemo(() => {
    const now = new Date()
    const today = allList.filter(item => {
      if (!item.tanggal) return false
      const d = new Date(item.tanggal)
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      )
    })

    const map: Record<string, { nama: string; satuan: string; total: number }> = {}
    today.forEach(item => {
      if (!map[item.nama_obat]) {
        map[item.nama_obat] = { nama: item.nama_obat, satuan: item.satuan, total: 0 }
      }
      map[item.nama_obat].total += item.jumlah ?? 0
    })

    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [allList])

  return (
    <Panel title="Keluar hari ini" count={todayList.length} className={className} bodyClassName="flex flex-col">
      {isLoading ? (
        <SkeletonRows rows={5} />
      ) : isError ? (
        <p className="flex-1 py-8 text-center text-sm text-muted-foreground">Catatan keluar hari ini belum bisa dimuat. Coba lagi lewat tombol di atas.</p>
      ) : todayList.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <PackageMinus className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Belum ada barang keluar hari ini</p>
        </div>
      ) : (
        <ul className="-my-1 divide-y">
          {todayList.map((item) => (
            <li key={item.nama} className="flex items-center justify-between gap-3 py-2">
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{item.nama}</p>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">-{item.total}</span> {item.satuan}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
