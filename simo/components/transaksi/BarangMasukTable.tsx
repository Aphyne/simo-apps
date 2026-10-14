'use client'

import { useState } from 'react'
import { Search, PackagePlus, Package, CalendarDays, TrendingUp, Clock, Eye, Pencil, Trash2 } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import BarangMasukForm from '@/components/transaksi/BarangMasukForm'
import BarangMasukEditForm from '@/components/transaksi/BarangMasukEditForm'
import { useBarangMasukList, useDeleteBarangMasuk } from '@/hooks/useBarangMasuk'
import { formatTanggalPendek, formatRupiah } from '@/lib/utils'
import BarangMasukTrendChart from '@/components/transaksi/BarangMasukTrendChart'
import BarangMasukPerObatChart from '@/components/transaksi/BarangMasukPerObatChart'
import { useAuthStore } from '@/store/auth.store'
import type { BarangMasuk } from '@/types/obat'

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
          {Array.from({ length: 10 }).map((_, j) => (
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

function todayYMD(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysAgoYMD(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function BarangMasukTable() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [date, setDate] = useState('')        // date picker asli — pilih 1 hari bebas
  const [mingguan, setMingguan] = useState(false) // tombol cepat "Mingguan" — 7 hari terakhir
  const [open, setOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<BarangMasuk | null>(null)
  const [editingItem, setEditingItem] = useState<BarangMasuk | null>(null)

  const isAdmin = useAuthStore((s) => s.isAdmin())
  const deleteMutation = useDeleteBarangMasuk()

  const today = todayYMD()
  const sevenDaysAgo = daysAgoYMD(6)

  // Tombol "Mingguan" aktif → pakai rentang 7 hari terakhir. Selain itu, pakai date
  // picker biasa (tanggal tunggal bebas, persis seperti semula) kalau diisi.
  const effectiveDari = mingguan ? sevenDaysAgo : undefined
  const effectiveSampai = mingguan ? today : undefined
  const effectiveTanggal = !mingguan ? (date || undefined) : undefined

  const { data, isLoading } = useBarangMasukList({ page, limit: 10, search, tanggal: effectiveTanggal, dari: effectiveDari, sampai: effectiveSampai })
  const rawList: BarangMasuk[] = data?.data ?? []
  const meta = data?.meta

  const { data: allData, isLoading: summaryLoading } = useBarangMasukList({ page: 1, limit: 9999 })
  const allList: BarangMasuk[] = allData?.data ?? []

  const now = new Date()
  const currentMonthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`

  const isThisMonth = (s: string | null | undefined) => {
    if (!s) return false
    const d = new Date(s)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }

  const transaksiMonth = allList.filter((item) => isThisMonth(item.tanggal)).length
  const satuanMonth = allList
    .filter((item) => isThisMonth(item.tanggal))
    .reduce((sum, item) => sum + (item.jumlah_satuan ?? 0), 0)

  const lastItem = allList[0]
  const lastTanggal = lastItem?.tanggal
    ? formatTanggalPendek(lastItem.tanggal)
    : '—'
  const daysAgo = lastItem?.tanggal
    ? Math.floor((now.getTime() - new Date(lastItem.tanggal).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const daysAgoLabel =
    daysAgo === null ? '' :
    daysAgo === 0 ? 'hari ini' :
    daysAgo === 1 ? 'kemarin' :
    `${daysAgo} hari lalu`

  const toLocalYMD = (s: string | null | undefined): string => {
    if (!s) return ''
    const d = new Date(s)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // Tanggal sekarang difilter di backend (lihat query useBarangMasukList di atas),
  // jadi rawList sudah benar untuk SEMUA halaman, bukan cuma halaman yang sedang dibuka.
  const list = rawList

  // Total nilai mengikuti filter search + periode yang aktif, dihitung dari allList
  // (bukan dari `list`/`rawList` yang server-paginated) supaya tetap akurat biarpun
  // hasil filter lebih dari 1 halaman.
  const searchLower = search.trim().toLowerCase()
  const filteredAllList = allList.filter((item) => {
    const matchSearch = !searchLower
      || item.nama_obat.toLowerCase().includes(searchLower)
      || item.kode_obat.toLowerCase().includes(searchLower)
      || (item.no_faktur ?? '').toLowerCase().includes(searchLower)
      || (item.no_batch ?? '').toLowerCase().includes(searchLower)
      || (item.nama_supplier ?? '').toLowerCase().includes(searchLower)
    const ymd = toLocalYMD(item.tanggal)
    const matchTanggal = mingguan
      ? ymd >= effectiveDari! && ymd <= effectiveSampai!
      : !date || ymd === date
    return matchSearch && matchTanggal
  })
  const totalSesudahPPN = filteredAllList.reduce(
    (sum, item) => sum + (item.harga_beli != null ? item.harga_beli * item.jumlah_satuan : 0),
    0
  )
  const totalSebelumPPN = filteredAllList.reduce((sum, item) => {
    if (item.harga_beli == null) return sum
    const ppnPct = Number(item.ppn_pct) || 0
    return sum + (item.harga_beli / (1 + ppnPct / 100)) * item.jumlah_satuan
  }, 0)

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
            <StatCard icon={Package}     label="Total Transaksi"       value={allData?.meta?.total ?? 0}          sublabel="semua riwayat"              warna="blue"   />
            <StatCard icon={CalendarDays} label="Transaksi Bulan Ini"  value={transaksiMonth}                     sublabel={currentMonthLabel}           warna="purple" />
            <StatCard icon={TrendingUp}  label="Satuan Masuk Bulan Ini" value={satuanMonth.toLocaleString('id-ID')} sublabel={`unit · ${currentMonthLabel}`} warna="green"  />
            <StatCard icon={Clock}       label="Terakhir Masuk"        value={lastTanggal}                        sublabel={daysAgoLabel}                warna="orange" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarangMasukTrendChart allList={allList} isLoading={summaryLoading} />
        <BarangMasukPerObatChart allList={allList} isLoading={summaryLoading} />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Cari nama obat, kode, no. faktur, no. batch, atau supplier..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {/* Tombol cepat Harian/Mingguan + date picker bebas (persis seperti semula) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const aktif = !mingguan && date === today
              setMingguan(false)
              setDate(aktif ? '' : today)
              setPage(1)
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              !mingguan && date === today
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => {
              setMingguan((aktif) => !aktif)
              setDate('')
              setPage(1)
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              mingguan
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Mingguan
          </button>

          <input
            type="date"
            value={date}
            onChange={(e) => { setMingguan(false); setDate(e.target.value); setPage(1) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {(date || mingguan) && (
            <button
              onClick={() => { setDate(''); setMingguan(false); setPage(1) }}
              className="text-xs text-gray-500 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        <div className="ml-auto">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 text-sm">
                <PackagePlus className="w-4 h-4 mr-1.5" />
                Catat Stok Masuk
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold text-gray-800">Catat Stok Masuk</DialogTitle>
              </DialogHeader>
              <BarangMasukForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Detail Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={(o) => { if (!o) setSelectedItem(null) }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold text-gray-800">Detail Stok Masuk</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Obat + Tanggal */}
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="font-semibold text-gray-900">{selectedItem.nama_obat}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedItem.kode_obat} · {formatTanggalPendek(selectedItem.tanggal)}</p>
              </div>
              {/* Grid detail */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  { label: 'Jumlah Masuk', value: `${selectedItem.jumlah_satuan} ${selectedItem.satuan} (${Number(selectedItem.jumlah_dus)} dus)` },
                  { label: 'Perubahan Stok', value: `${selectedItem.stok_sebelum} → ${selectedItem.stok_sesudah} ${selectedItem.satuan}` },
                  { label: 'No. Faktur', value: selectedItem.no_faktur ?? '—' },
                  { label: 'Supplier', value: selectedItem.nama_supplier ?? '—' },
                  { label: 'No. Batch', value: selectedItem.no_batch ?? '—', mono: true },
                  { label: 'Expired Batch', value: selectedItem.expired_batch ? formatTanggalPendek(selectedItem.expired_batch) : '—' },
                  { label: 'Harga Jual', value: selectedItem.harga_jual != null ? formatRupiah(selectedItem.harga_jual) : '—' },
                  { label: 'Dicatat oleh', value: selectedItem.nama_user ?? '—' },
                ].map(({ label, value, mono }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
                  </div>
                ))}
                {selectedItem.catatan && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">Catatan</p>
                    <p className="text-sm text-gray-800">{selectedItem.catatan}</p>
                  </div>
                )}
              </div>

              {/* Harga & PPN — dipisah dari grid di atas karena butuh breakdown sebelum/sesudah PPN */}
              {selectedItem.harga_beli != null && (() => {
                const ppnPct = Number(selectedItem.ppn_pct) || 0
                const hargaDusSesudahPPN = selectedItem.harga_beli * (selectedItem.jumlah_satuan / selectedItem.jumlah_dus || 1)
                const hargaDusSebelumPPN = hargaDusSesudahPPN / (1 + ppnPct / 100)
                const subTotalSesudahPPN = selectedItem.harga_beli * selectedItem.jumlah_satuan
                const subTotalSebelumPPN = subTotalSesudahPPN / (1 + ppnPct / 100)
                return (
                  <div className="rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Harga {ppnPct > 0 ? `· PPN ${ppnPct}%` : '· Tanpa PPN'}
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Harga (Sebelum PPN)</p>
                        <p className="text-sm font-medium text-gray-800">{formatRupiah(hargaDusSebelumPPN)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Harga (Sesudah PPN)</p>
                        <p className="text-sm font-medium text-gray-800">{formatRupiah(hargaDusSesudahPPN)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Sub Total (Sebelum PPN)</p>
                        <p className="text-sm font-medium text-gray-800">{formatRupiah(subTotalSebelumPPN)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Sub Total (Sesudah PPN)</p>
                        <p className="text-sm font-semibold text-gray-900">{formatRupiah(subTotalSesudahPPN)}</p>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog (admin only) */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={(o) => { if (!o) setEditingItem(null) }}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold text-gray-800">Edit Stok Masuk</DialogTitle>
            </DialogHeader>
            <BarangMasukEditForm item={editingItem} onSuccess={() => setEditingItem(null)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Tanggal</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Obat</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Jumlah Masuk</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Supplier</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">No. Faktur</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">No. Batch</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Expired</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Perubahan Stok</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Sub Total</th>
                <th className="py-3 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <SkeletonRows />
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-gray-500 text-sm">
                    {mingguan
                      ? (search ? 'Tidak ada hasil untuk filter ini' : 'Belum ada transaksi 7 hari terakhir')
                      : date === today
                        ? (search ? 'Tidak ada hasil untuk filter ini' : 'Belum ada transaksi hari ini')
                        : search || date
                          ? 'Tidak ada hasil untuk filter ini'
                          : 'Belum ada riwayat barang masuk'}
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
                      <p className="text-xs text-gray-500 font-mono">{item.kode_obat}</p>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <p className="font-semibold text-emerald-700">+{item.jumlah_satuan} {item.satuan}</p>
                      <p className="text-xs text-gray-500">{Number(item.jumlah_dus)} dus</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-gray-700">
                      {item.nama_supplier ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-gray-600">
                      {item.no_faktur ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-gray-600">
                      {item.no_batch ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.expired_batch ? (
                        <span className={`text-xs font-medium ${
                          Math.floor((new Date(item.expired_batch).getTime() - Date.now()) / (1000*60*60*24)) <= 90
                            ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {formatTanggalPendek(item.expired_batch)}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap text-xs text-gray-500">
                      <span className="text-gray-500">{item.stok_sebelum}</span>
                      <span className="mx-1 text-emerald-500">→</span>
                      <span className="font-medium text-gray-800">{item.stok_sesudah}</span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap text-xs text-gray-700">
                      {item.harga_beli != null
                        ? formatRupiah((item.harga_beli / (1 + (Number(item.ppn_pct) || 0) / 100)) * item.jumlah_satuan)
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Lihat detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <ConfirmDialog
                              trigger={
                                <button
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              }
                              title={`Hapus barang masuk ${item.nama_obat}?`}
                              description="Stok akan ditarik balik sesuai jumlah baris ini. Ditolak otomatis kalau hasilnya bikin stok jadi minus (indikasi sebagian sudah terjual)."
                              onConfirm={() => deleteMutation.mutate(item.id)}
                              loading={deleteMutation.isPending}
                            />
                          </>
                        )}
                      </div>
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

        {/* Total pengeluaran — cuma muncul kalau ada filter aktif (search/tanggal/mingguan),
            dan hasil filter-nya tidak kosong. Tidak muncul kalau belum ada filter sama sekali. */}
        {(search || date || mingguan) && filteredAllList.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-blue-50/50 flex-wrap gap-y-1">
            <span className="text-xs text-gray-500">
              Total {filteredAllList.length} transaksi
              {mingguan ? ` · 7 hari terakhir (${formatTanggalPendek(sevenDaysAgo)}–${formatTanggalPendek(today)})` : ''}
              {!mingguan && date ? ` · tanggal ${formatTanggalPendek(date)}` : ''}
              {search ? ` · "${search}"` : ''}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">
                Total Pengeluaran Sebelum PPN: <span className="text-xs font-semibold text-gray-900">{formatRupiah(totalSebelumPPN)}</span>
              </span>
              <span className="text-xs text-gray-500">
                Total Pengeluaran Sesudah PPN: <span className="text-xs font-semibold text-gray-900">{formatRupiah(totalSesudahPPN)}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
