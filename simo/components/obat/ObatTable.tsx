'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Plus, Search, Eye, Pill, AlertTriangle, TrendingDown, CalendarX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import StatCard from '@/components/dashboard/StatCard'
import StatusBadge from '@/components/ui/StatusBadge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useObatList, useDeleteObat } from '@/hooks/useObat'
import { formatAngka, formatTanggalPendek } from '@/lib/utils'
import { KATEGORI_OBAT } from '@/lib/constants'
import ObatKategoriChart from '@/components/obat/ObatKategoriChart'
import type { Obat } from '@/types/obat'

// ─── Helper: estimasi hari habis ─────────────────────────────────────────────
function EstimasiHabis({ hari }: { hari: number | null }) {
  if (hari === null) return <span className="text-gray-300">—</span>
  if (hari <= 7)  return <span className="text-xs font-semibold text-red-600">{hari} hari</span>
  if (hari <= 30) return <span className="text-xs font-medium text-orange-500">{hari} hari</span>
  return <span className="text-xs text-gray-500">{hari} hari</span>
}

// ─── Helper: tanggal expired ──────────────────────────────────────────────────
function ExpiredCell({ tanggal }: { tanggal: string | null }) {
  if (!tanggal) return <span className="text-gray-300">—</span>
  const selisihHari = Math.floor(
    (new Date(tanggal).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const label = formatTanggalPendek(tanggal)
  if (selisihHari <= 90)
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600 font-medium">
        {label}
      </span>
    )
  if (selisihHari <= 180)
    return <span className="text-xs font-medium text-orange-500">{label}</span>
  return <span className="text-xs text-gray-400">{label}</span>
}

// ─── Helper: nilai kalkulasi (abu-abu jika belum ada) ─────────────────────────
function KalkulasiCell({ value, satuan }: { value: number | null; satuan?: string }) {
  if (value === null || value === undefined)
    return <span className="text-gray-300 text-xs">—</span>
  return (
    <span className="text-sm text-gray-700">
      {formatAngka(value, 1)}
      {satuan && <span className="text-gray-400 text-xs ml-0.5">{satuan}</span>}
    </span>
  )
}

// ─── Helper: page numbers with ellipsis ──────────────────────────────────────
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100">
          {Array.from({ length: 10 }).map((_, j) => (
            <td key={j} className="px-3 py-3.5">
              <div className="h-3.5 bg-gray-100 rounded-md animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function ObatTable() {
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useObatList({ page, limit: 10, search, kategori, status })
  const { data: dataAll } = useObatList({ limit: 9999 })
  const deleteMutation = useDeleteObat()

  const obatList: Obat[] = data?.data ?? []
  const meta = data?.meta

  const allObat: Obat[] = dataAll?.data ?? []
  const totalObat     = dataAll?.meta?.total ?? 0
  const perluReorder  = allObat.filter(o => o.status === 'HARUS_REORDER').length
  const mendekatiROP  = allObat.filter(o => o.status === 'MENDEKATI_ROP').length
  const akanExpired   = allObat.filter(o => {
    if (!o.expired_terdekat) return false
    const selisih = Math.floor((new Date(o.expired_terdekat).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return selisih >= 0 && selisih <= 90
  }).length

  return (
    <div className="space-y-4">

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Pill}          label="Total Obat"     value={totalObat}    sublabel="jenis terdaftar" warna="blue"   />
        <StatCard icon={AlertTriangle} label="Perlu Reorder"  value={perluReorder} sublabel="stok ≤ ROP"      warna="red"    />
        <StatCard icon={TrendingDown}  label="Mendekati ROP"  value={mendekatiROP} sublabel="perlu diawasi"   warna="orange" />
        <StatCard icon={CalendarX}     label="Akan Expired"   value={akanExpired}  sublabel="dalam 90 hari"   warna="orange" />
      </div>

      {/* ── Kategori Chart ────────────────────────────────────────────────── */}
      <ObatKategoriChart allObat={allObat} isLoading={!dataAll} />

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Cari nama atau kode obat..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>

        <Select value={kategori || 'semua'} onValueChange={(v) => { setKategori(v === 'semua' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Kategori</SelectItem>
            {KATEGORI_OBAT.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={status || 'semua'} onValueChange={(v) => { setStatus(v === 'semua' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="AMAN">Aman</SelectItem>
            <SelectItem value="MENDEKATI_ROP">Mendekati ROP</SelectItem>
            <SelectItem value="HARUS_REORDER">Harus Reorder</SelectItem>
          </SelectContent>
        </Select>

        <Link href="/obat/tambah" className="ml-auto">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 text-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Obat
          </Button>
        </Link>
      </div>

      {/* ── Tabel ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Kode</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Nama Obat</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Kategori</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Stok</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  ROP
                  <span className="block text-gray-400 normal-case font-normal tracking-normal">reorder point</span>
                </th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  EOQ
                  <span className="block text-gray-400 normal-case font-normal tracking-normal">qty order optimal</span>
                </th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Est. Habis
                  <span className="block text-gray-400 normal-case font-normal tracking-normal">dari stok saat ini</span>
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Expired
                  <span className="block text-gray-400 normal-case font-normal tracking-normal">terdekat</span>
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <SkeletonRows />
              ) : obatList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-gray-400 text-sm">
                    Tidak ada data obat
                  </td>
                </tr>
              ) : (
                obatList.map((obat) => (
                  <tr key={obat.id} className="hover:bg-gray-50 transition-colors">

                    {/* Kode */}
                    <td className="px-3 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">
                      {obat.kode}
                    </td>

                    {/* Nama */}
                    <td className="px-3 py-3 whitespace-nowrap max-w-[200px]">
                      <span className="font-medium text-gray-900 truncate block">{obat.nama}</span>
                      {obat.nama_supplier && (
                        <span className="text-xs text-gray-400">{obat.nama_supplier}</span>
                      )}
                    </td>

                    {/* Kategori */}
                    <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{obat.kategori}</td>

                    {/* Stok */}
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{formatAngka(obat.stok, 0)}</span>
                      <span className="text-gray-400 text-xs ml-1">{obat.satuan}</span>
                    </td>

                    {/* ROP */}
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <KalkulasiCell value={obat.rop} satuan={obat.satuan} />
                    </td>

                    {/* EOQ */}
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {obat.eoq !== null && obat.eoq !== undefined ? (
                        <KalkulasiCell value={obat.eoq} satuan={obat.satuan} />
                      ) : (
                        <span className="text-xs text-gray-300 italic">Belum dihitung</span>
                      )}
                    </td>

                    {/* Estimasi Habis */}
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <EstimasiHabis hari={obat.estimasi_habis_hari} />
                    </td>

                    {/* Expired */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <ExpiredCell tanggal={obat.expired_terdekat} />
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <StatusBadge status={obat.status} />
                    </td>

                    {/* Aksi */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex gap-1 justify-center">
                        <Link href={`/obat/${obat.id}/detail`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                            title="Detail Kalkulasi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/obat/${obat.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          }
                          title={`Hapus ${obat.nama}?`}
                          description="Obat yang sudah memiliki riwayat transaksi tidak bisa dihapus."
                          onConfirm={() => deleteMutation.mutate(obat.id)}
                          loading={deleteMutation.isPending}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <span className="text-xs text-gray-500 tabular-nums">
              {(page - 1) * 10 + 1}–{Math.min(page * 10, meta.total)} dari {meta.total} obat
            </span>
            <div className="flex items-center gap-1">
              {/* Prev */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ‹
              </button>

              {/* Page numbers */}
              {getPageNumbers(page, meta.last_page).map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-gray-400 select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[30px] px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      p === page
                        ? 'bg-blue-600 text-white border border-blue-600'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Next */}
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

      {/* ── Legenda ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block flex-shrink-0" />
          Est. habis ≤ 7 hari atau expired &lt; 3 bulan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400 inline-block flex-shrink-0" />
          Est. habis 8–30 hari atau expired 3–6 bulan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-gray-300 font-mono">—</span>
          Data belum tersedia (perlu isi demand harian)
        </span>
      </div>

    </div>
  )
}
