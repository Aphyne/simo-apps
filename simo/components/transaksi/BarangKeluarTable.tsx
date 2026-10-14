'use client'

import { useState } from 'react'
import { Search, PackageMinus, Package, CalendarDays, TrendingDown, Clock, Pencil, Trash2, Eye } from 'lucide-react'
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
import BarangKeluarForm from '@/components/transaksi/BarangKeluarForm'
import BarangKeluarEditForm from '@/components/transaksi/BarangKeluarEditForm'
import { useBarangKeluarList, useDeleteBarangKeluar } from '@/hooks/useBarangKeluar'
import { formatTanggalPendek, formatRupiah } from '@/lib/utils'
import BarangKeluarTrendChart from '@/components/transaksi/BarangKeluarTrendChart'
import BarangKeluarPerObatChart from '@/components/transaksi/BarangKeluarPerObatChart'
import { useAuthStore } from '@/store/auth.store'
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
          {Array.from({ length: 8 }).map((_, j) => (
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

function todayYMD(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysAgoYMD(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function BarangKeluarTable() {
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const [date, setDate]             = useState('')        // date picker asli — pilih 1 hari bebas
  const [mingguan, setMingguan]     = useState(false)      // tombol cepat "Mingguan" — 7 hari terakhir
  const [keterangan, setKeterangan] = useState('')
  const [open, setOpen]             = useState(false)
  const [editingItem, setEditingItem] = useState<BarangKeluar | null>(null)
  const [selectedItem, setSelectedItem] = useState<BarangKeluar | null>(null)

  const isAdmin = useAuthStore((s) => s.isAdmin())
  const deleteMutation = useDeleteBarangKeluar()

  const today = todayYMD()
  const sevenDaysAgo = daysAgoYMD(6)

  // Tombol "Mingguan" aktif → pakai rentang 7 hari terakhir. Selain itu, pakai date
  // picker biasa (tanggal tunggal bebas, persis seperti semula) kalau diisi.
  const effectiveDari = mingguan ? sevenDaysAgo : undefined
  const effectiveSampai = mingguan ? today : undefined
  const effectiveTanggal = !mingguan ? (date || undefined) : undefined

  const { data, isLoading } = useBarangKeluarList({ page, limit: 10, search, keterangan, tanggal: effectiveTanggal, dari: effectiveDari, sampai: effectiveSampai })
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

  // Tanggal sekarang difilter di backend (lihat query useBarangKeluarList di atas),
  // jadi rawList sudah benar untuk SEMUA halaman, bukan cuma halaman yang sedang dibuka.
  const list = rawList

  // Total nilai mengikuti filter search + tanggal + keterangan yang aktif, dihitung dari
  // allList (bukan `list`/`rawList` yang server-paginated) supaya tetap akurat biarpun
  // hasil filter lebih dari 1 halaman. Hanya hitung Penjualan — jenis lain (Retur, Rusak,
  // Kedaluarsa, Lainnya) bukan pendapatan, konsisten dengan kolom Total & chart lainnya.
  const searchLower = search.trim().toLowerCase()
  const filteredAllList = allList.filter((item) => {
    const matchSearch = !searchLower
      || item.nama_obat.toLowerCase().includes(searchLower)
      || item.kode_obat.toLowerCase().includes(searchLower)
    const ymd = toLocalYMD(item.tanggal)
    const matchTanggal = mingguan
      ? ymd >= effectiveDari! && ymd <= effectiveSampai!
      : !date || ymd === date
    const matchKeterangan = !keterangan || item.keterangan === keterangan
    return matchSearch && matchTanggal && matchKeterangan
  })
  const totalNilaiKeluar = filteredAllList.reduce(
    (sum, item) => sum + (item.keterangan === 'Penjualan' && item.harga_jual != null ? item.jumlah * item.harga_jual : 0),
    0
  )

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
              <Button className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2 text-sm">
                <PackageMinus className="w-4 h-4 mr-1.5" />
                Catat Stok Keluar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold text-gray-800">Catat Stok Keluar</DialogTitle>
              </DialogHeader>
              <BarangKeluarForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog (admin only) */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={(o) => { if (!o) setEditingItem(null) }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold text-gray-800">Edit Stok Keluar</DialogTitle>
            </DialogHeader>
            <BarangKeluarEditForm item={editingItem} onSuccess={() => setEditingItem(null)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Detail/Preview Dialog — tempat Catatan bisa dilihat sejak dihilangkan dari tabel */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={(o) => { if (!o) setSelectedItem(null) }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold text-gray-800">Detail Stok Keluar</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="font-semibold text-gray-900">{selectedItem.nama_obat}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedItem.kode_obat} · {formatTanggalPendek(selectedItem.tanggal)}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  { label: 'Jumlah Keluar', value: `${selectedItem.jumlah} ${selectedItem.satuan}` },
                  { label: 'Keterangan', value: selectedItem.keterangan },
                  { label: 'Perubahan Stok', value: `${selectedItem.stok_sebelum} → ${selectedItem.stok_sesudah} ${selectedItem.satuan}` },
                  { label: 'Harga Jual', value: selectedItem.keterangan === 'Penjualan' && Number(selectedItem.harga_jual) > 0 ? `${formatRupiah(Number(selectedItem.harga_jual))} / ${selectedItem.satuan}` : '—' },
                  { label: 'Total', value: selectedItem.keterangan === 'Penjualan' && Number(selectedItem.harga_jual) > 0 ? `Rp ${(selectedItem.jumlah * Number(selectedItem.harga_jual)).toLocaleString('id-ID')}` : '—' },
                  { label: 'Dicatat oleh', value: selectedItem.nama_user ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-0.5">Catatan</p>
                  <p className="text-sm text-gray-800">{selectedItem.catatan || <span className="text-gray-300">—</span>}</p>
                </div>
              </div>
            </div>
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
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Jumlah Keluar</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Total</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Keterangan</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Perubahan Stok</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Dicatat oleh</th>
                <th className="py-3 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <SkeletonRows />
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-500 text-sm">
                    {mingguan
                      ? (search || keterangan ? 'Tidak ada hasil untuk filter ini' : 'Belum ada transaksi 7 hari terakhir')
                      : date === today
                        ? (search || keterangan ? 'Tidak ada hasil untuk filter ini' : 'Belum ada transaksi hari ini')
                        : search || keterangan || date
                          ? 'Tidak ada hasil untuk filter ini'
                          : 'Belum ada riwayat barang keluar'}
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
                      <p className="font-semibold text-red-600">−{item.jumlah} {item.satuan}</p>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {item.keterangan === 'Penjualan' && Number(item.harga_jual) > 0 ? (
                        <p className="font-medium text-emerald-700">
                          Rp {(item.jumlah * Number(item.harga_jual)).toLocaleString('id-ID')}
                        </p>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${KETERANGAN_WARNA[item.keterangan] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.keterangan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap text-xs text-gray-500">
                      <span className="text-gray-500">{item.stok_sebelum}</span>
                      <span className="mx-1 text-red-400">→</span>
                      <span className="font-medium text-gray-800">{item.stok_sesudah}</span>
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
                            title={`Hapus barang keluar ${item.nama_obat}?`}
                            description="Stok akan ditarik balik (ditambah lagi) sesuai jumlah baris ini."
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

        {/* Total nilai — cuma muncul kalau ada filter aktif (search/tanggal/mingguan/keterangan),
            dan hasil filter-nya tidak kosong. Tidak muncul kalau belum ada filter sama sekali. */}
        {(search || date || mingguan || keterangan) && filteredAllList.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-blue-50/50">
            <span className="text-xs text-gray-500">
              Total {filteredAllList.length} transaksi
              {mingguan ? ` · 7 hari terakhir (${formatTanggalPendek(sevenDaysAgo)}–${formatTanggalPendek(today)})` : ''}
              {!mingguan && date ? ` · tanggal ${formatTanggalPendek(date)}` : ''}
              {keterangan ? ` · ${keterangan}` : ''}
              {search ? ` · "${search}"` : ''}
            </span>
            <span className="text-sm font-semibold text-gray-900">
              Total Nilai (Penjualan): {formatRupiah(totalNilaiKeluar)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
