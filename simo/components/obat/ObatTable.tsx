'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Plus, Search, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import StatusBadge from '@/components/ui/StatusBadge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useObatList, useDeleteObat } from '@/hooks/useObat'
import { formatAngka, formatTanggalPendek } from '@/lib/utils'
import { KATEGORI_OBAT } from '@/lib/constants'
import type { Obat } from '@/types/obat'

// ─── Helper warna estimasi habis ─────────────────────────────────────────────
function EstimasiHabis({ hari }: { hari: number | null }) {
  if (hari === null) return <span className="text-gray-300">—</span>
  if (hari <= 7)
    return <span className="text-red-600 font-semibold">{hari} hari ⚠️</span>
  if (hari <= 30)
    return <span className="text-orange-500 font-medium">{hari} hari</span>
  return <span className="text-gray-600">{hari} hari</span>
}

// ─── Helper warna expired ─────────────────────────────────────────────────────
function ExpiredCell({ tanggal }: { tanggal: string | null }) {
  if (!tanggal) return <span className="text-gray-300">—</span>
  const selisihHari = Math.floor(
    (new Date(tanggal).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const label = formatTanggalPendek(tanggal)
  if (selisihHari <= 90)
    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-600 font-medium">
        {label}
      </span>
    )
  if (selisihHari <= 180)
    return <span className="text-yellow-600 text-xs font-medium">{label}</span>
  return <span className="text-gray-500 text-xs">{label}</span>
}

// ─── Helper nilai kalkulasi (abu-abu jika belum dihitung) ─────────────────────
function KalkulasiCell({ value, satuan }: { value: number | null; satuan?: string }) {
  if (value === null || value === undefined)
    return <span className="text-gray-300 text-xs">—</span>
  return (
    <span>
      {formatAngka(value, 1)}
      {satuan && <span className="text-gray-400 text-xs ml-0.5">{satuan}</span>}
    </span>
  )
}

export default function ObatTable() {
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useObatList({ page, limit: 15, search, kategori, status })
  const deleteMutation = useDeleteObat()

  const obatList: Obat[] = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-4">
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-lg">
          <Input
            placeholder="Cari nama atau kode obat..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={() => setPage(1)}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select
            value={kategori || 'semua'}
            onValueChange={(v) => { setKategori(v === 'semua' ? '' : v); setPage(1) }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Kategori</SelectItem>
              {KATEGORI_OBAT.map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status || 'semua'}
            onValueChange={(v) => { setStatus(v === 'semua' ? '' : v); setPage(1) }}
          >
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

          <Link href="/obat/tambah">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Obat
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Tabel ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-3 font-medium text-gray-500 whitespace-nowrap">Kode</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500 whitespace-nowrap">Nama Obat</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500 whitespace-nowrap">Kategori</th>
                <th className="text-right px-3 py-3 font-medium text-gray-500 whitespace-nowrap">Stok</th>
                <th className="text-right px-3 py-3 font-medium text-gray-500 whitespace-nowrap">
                  ROP
                  <span className="block text-xs font-normal text-gray-400">reorder point</span>
                </th>
                <th className="text-right px-3 py-3 font-medium text-gray-500 whitespace-nowrap">
                  Safety Stock
                  <span className="block text-xs font-normal text-gray-400">stok pengaman</span>
                </th>
                <th className="text-right px-3 py-3 font-medium text-gray-500 whitespace-nowrap">
                  EOQ
                  <span className="block text-xs font-normal text-gray-400">qty order optimal</span>
                </th>
                <th className="text-right px-3 py-3 font-medium text-gray-500 whitespace-nowrap">
                  Est. Habis
                  <span className="block text-xs font-normal text-gray-400">dari stok saat ini</span>
                </th>
                <th className="text-center px-3 py-3 font-medium text-gray-500 whitespace-nowrap">
                  Expired
                  <span className="block text-xs font-normal text-gray-400">terdekat</span>
                </th>
                <th className="text-center px-3 py-3 font-medium text-gray-500 whitespace-nowrap">Status</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-gray-400">
                    Memuat data...
                  </td>
                </tr>
              ) : obatList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-gray-400">
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
                    <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap max-w-[200px]">
                      <span className="truncate block">{obat.nama}</span>
                      {obat.nama_supplier && (
                        <span className="text-xs text-gray-400 font-normal">{obat.nama_supplier}</span>
                      )}
                    </td>

                    {/* Kategori */}
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{obat.kategori}</td>

                    {/* Stok */}
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{formatAngka(obat.stok, 0)}</span>
                      <span className="text-gray-400 text-xs ml-1">{obat.satuan}</span>
                    </td>

                    {/* ROP */}
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <KalkulasiCell value={obat.rop} satuan={obat.satuan} />
                    </td>

                    {/* Safety Stock */}
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <KalkulasiCell value={obat.safety_stock} satuan={obat.satuan} />
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
                            className="h-8 w-8 text-gray-400 hover:text-green-600 hover:bg-green-50"
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
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm text-gray-500">
            <span>
              Menampilkan {obatList.length} dari {meta.total} obat
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Sebelumnya
              </Button>
              <span className="text-xs px-1">
                {page} / {meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={page === meta.last_page}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Legenda ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400 px-1">
        <span>
          <span className="text-red-600 font-semibold">⚠️ merah</span> = Est. habis ≤ 7 hari atau expired &lt; 3 bulan
        </span>
        <span>
          <span className="text-orange-500 font-medium">oranye</span> = Est. habis 8–30 hari atau expired 3–6 bulan
        </span>
        <span>
          <span className="text-gray-300">—</span> = data belum tersedia (perlu isi demand harian)
        </span>
      </div>
    </div>
  )
}
