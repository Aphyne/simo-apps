'use client'

import { useMemo } from 'react'
import { PackageMinus } from 'lucide-react'
import { useBarangKeluarList } from '@/hooks/useBarangKeluar'
import type { BarangKeluar } from '@/types/obat'

export default function AktivitasHariIni() {
  const { data, isLoading } = useBarangKeluarList({ limit: 9999 })
  const allList: BarangKeluar[] = data?.data ?? []

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
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <p className="text-sm font-semibold text-fg-secondary">Keluar Hari Ini</p>
        {todayList.length > 0 && (
          <span className="px-2 py-0.5 bg-warning-100 text-warning-700 text-xs font-medium rounded-full">
            {todayList.length} obat
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse bg-surface-muted rounded-lg" />
          ))}
        </div>
      ) : todayList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-fg-muted">
          <PackageMinus className="w-8 h-8 mb-2 text-gray-300" />
          <p className="text-sm">Belum ada barang keluar hari ini</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {todayList.map((item, idx) => (
            <li key={item.nama} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-xs font-bold text-fg-muted w-4 flex-shrink-0 text-center">
                {idx + 1}
              </span>
              <p className="flex-1 text-xs font-medium text-gray-800 truncate">{item.nama}</p>
              <span className="text-xs font-semibold text-warning-700 flex-shrink-0">
                -{item.total} {item.satuan}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
