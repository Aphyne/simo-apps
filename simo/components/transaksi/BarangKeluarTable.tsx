'use client'

import { useState } from 'react'
import { Search, PackageMinus, Package, CalendarDays, TrendingDown, Clock } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import BarangKeluarForm from '@/components/transaksi/BarangKeluarForm'
import { useBarangKeluarList } from '@/hooks/useBarangKeluar'
import { formatTanggalPendek } from '@/lib/utils'
import BarangKeluarTrendChart from '@/components/transaksi/BarangKeluarTrendChart'
import BarangKeluarPerObatChart from '@/components/transaksi/BarangKeluarPerObatChart'
import type { BarangKeluar } from '@/types/obat'

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="py-3 px-4">
              <div className="h-4 bg-gray-100 rounded-xl animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

const KETERANGAN_WARNA: Record<string, string> = {
  Penjualan:  'bg-blue-100 text-blue-700',
  Retur:      'bg-yellow-100 text-yellow-700',
  Rusak:      'bg-red-100 text-red-600',
  Kedaluarsa: 'bg-orange-100 text-orange-700',
  Lainnya:    'bg-gray-100 text-gray-600',
}

export default function BarangKeluarTable() {
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const [date, setDate]             = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [open, setOpen]             = useState(false)

  const { data, isLoading } = useBarangKeluarList({ page, limit: 10, search, keterangan })
  const rawList: BarangKeluar[] = data?.data ?? []
  const meta = data?.meta

  const { data: allData, isLoading: summaryLoading } = useBarangKeluarList({ page: 1, limit: 9999 })
  const allList: BarangKeluar[] = allData?.data ?? []

  const now = new Date()
  const currentMonthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`

  const isThisMonth = (s: string | null | undefined) => {
    if (!s) return false
    const d = new Date(s)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }

  const isToday = (s: string | null | undefined) => {
    if (!s) return false
    const d = new Date(s)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  }

  const transaksiHariIni = allList.filter((item) => isToday(item.tanggal)).length
  const transaksiMonth = allList.filter((item) => isThisMonth(item.tanggal)).length
  const satuanMonth = allList
    .filter((item) => isThisMonth(item.tanggal))
    .reduce((sum, item) => sum + (item.jumlah ?? 0), 0)

  const lastItem = allList[0]
  const lastTanggal = lastItem?.tanggal ? formatTanggalPendek(lastItem.tanggal) : '—'
  const daysAgo = lastItem?.tanggal
    ? Math.floor((now.getTime() - new Date(lastItem.tanggal).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const daysAgoLabel =
    daysAgo === null ? '' :
    daysAgo === 0    ? 'hari ini' :
    daysAgo === 1    ? 'kemarin' :
    `${daysAgo} hari lalu`

  const toLocalYMD = (s: string | null | undefined): string => {
    if (!s) return ''
    const d = new Date(s)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const list = date ? rawList.filter((item) => toLocalYMD(item.tanggal) === date) : rawList

  return (
    <div className="space-y-4">

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                <div className="h-7 bg-gray-100 rounded animate-pulse w-16" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-20" />
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard icon={Package}      label="Transaksi Hari Ini"       value={transaksiHariIni}                     sublabel="transaksi hari ini"           warna="blue"   />
            <StatCard icon={CalendarDays} label="Transaksi Bulan Ini"      value={transaksiMonth}                       sublabel={currentMonthLabel}             warna="purple" />
            <StatCard icon={TrendingDown} label="Satuan Keluar Bulan Ini"  value={satuanMonth.toLocaleString('id-ID')}  sublabel={`unit · ${currentMonthLabel}`} warna="orange" />
            <StatCard icon={Clock}        label="Terakhir Keluar"          value={lastTanggal}                          sublabel={daysAgoLabel}                  warna="red"    />
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarangKeluarTrendChart allList={allList} isLoading={summaryLoading} />
        <BarangKeluarPerObatChart allList={allList} isLoading={summaryLoading} />
      </div>


      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Cari nama atau kode obat..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <select
          value={keterangan}
          onChange={(e) => { setKeterangan(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Semua Keterangan</option>
          <option value="Penjualan">Penjualan</option>
          <option value="Retur">Retur</option>
          <option value="Rusak">Rusak</option>
          <option value="Kedaluarsa">Kedaluarsa</option>
          <option value="Lainnya">Lainnya</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setPage(1) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {date && (
            <button
              onClick={() => { setDate(''); setPage(1) }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        <div className="ml-auto">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2 text-sm">
                <PackageMinus className="w-4 h-4 mr-1.5" />
                Catat Barang Keluar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold text-gray-800">Catat Barang Keluar</DialogTitle>
              </DialogHeader>
              <BarangKeluarForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Tanggal</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Obat</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Jumlah Keluar</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Keterangan</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Perubahan Stok</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Catatan</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Dicatat oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <SkeletonRows />
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                    {search || date || keterangan ? 'Tidak ada hasil untuk filter ini' : 'Belum ada riwayat barang keluar'}
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                      {formatTanggalPendek(item.tanggal)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{item.nama_obat}</p>
                      <p className="text-xs text-gray-400 font-mono">{item.kode_obat}</p>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <p className="font-semibold text-red-600">−{item.jumlah} {item.satuan}</p>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${KETERANGAN_WARNA[item.keterangan] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.keterangan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap text-xs text-gray-500">
                      <span className="text-gray-400">{item.stok_sebelum}</span>
                      <span className="mx-1 text-red-400">→</span>
                      <span className="font-medium text-gray-800">{item.stok_sesudah}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs max-w-[150px] truncate">
                      {item.catatan ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.nama_user ? (
                        <div>
                          <p className="text-xs font-medium text-gray-700">{item.nama_user}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-0.5 font-medium ${item.role_user === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {item.role_user === 'admin' ? 'Admin' : 'Staf'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <span className="text-xs text-gray-500 tabular-nums">
              {(page - 1) * 10 + 1}–{Math.min(page * 10, meta.total)} dari {meta.total} transaksi
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ‹
              </button>
              {getPageNumbers(page, meta.last_page).map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-gray-400 select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`min-w-[30px] px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      page === p
                        ? 'bg-blue-600 text-white border border-blue-600'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={page === meta.last_page}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
