'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Eye, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import StatusBadge from '@/components/ui/StatusBadge'
import RumusDisplay from '@/components/obat/RumusDisplay'
import { useObatList, useObatPerhitungan, useHitungUlang } from '@/hooks/useObat'
import { formatAngka, formatRupiah } from '@/lib/utils'
import type { Obat } from '@/types/obat'

function DetailPanel({ obat }: { obat: Obat }) {
  const { data: perhitungan, isLoading } = useObatPerhitungan(obat.id)
  const hitungUlang = useHitungUlang()

  return (
    <div className="border-t bg-blue-50/40 px-6 py-5">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">
            Detail Perhitungan — {obat.nama}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => hitungUlang.mutate(obat.id)}
              disabled={hitungUlang.isPending}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${hitungUlang.isPending ? 'animate-spin' : ''}`} />
              Hitung Ulang
            </Button>
            <Link href={`/obat/${obat.id}/detail`}>
              <Button size="sm" variant="outline">
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Halaman Penuh
              </Button>
            </Link>
          </div>
        </div>
        {isLoading ? (
          <div className="text-gray-400 py-6 text-center text-sm">Memuat perhitungan...</div>
        ) : perhitungan ? (
          <RumusDisplay data={perhitungan} />
        ) : (
          <div className="text-gray-400 py-6 text-center text-sm">Data tidak tersedia</div>
        )}
      </div>
    </div>
  )
}

export default function PerhitunganPage() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useObatList({ page, limit: 20, search })
  const obatList: Obat[] = data?.data ?? []
  const meta = data?.meta

  function toggleDetail(id: number) {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Perhitungan EOQ / ROP</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Klik baris obat untuk melihat langkah perhitungan detail
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2 max-w-md">
        <Input
          placeholder="Cari nama atau kode obat..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <Button variant="outline" size="icon">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Kode</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Nama Obat</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                  D<span className="block text-xs font-normal text-gray-400">demand/tahun</span>
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                  EOQ<span className="block text-xs font-normal text-gray-400">qty order optimal</span>
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                  SS<span className="block text-xs font-normal text-gray-400">safety stock</span>
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                  ROP<span className="block text-xs font-normal text-gray-400">reorder point</span>
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                  Total Cost<span className="block text-xs font-normal text-gray-400">biaya/tahun</span>
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Detail</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">Memuat data...</td>
                </tr>
              ) : obatList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">Tidak ada data</td>
                </tr>
              ) : (
                obatList.map((obat) => (
                  <React.Fragment key={obat.id}>
                    <tr
                      className={`border-t cursor-pointer transition-colors ${
                        selectedId === obat.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleDetail(obat.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">{obat.kode}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{obat.nama}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-gray-700">
                        {obat.demand_tahunan ? formatAngka(obat.demand_tahunan, 0) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {obat.eoq != null
                          ? <span className="font-semibold text-blue-700">{formatAngka(obat.eoq, 1)}</span>
                          : <span className="text-xs text-gray-300 italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {obat.safety_stock != null
                          ? <span className="font-semibold text-green-700">{formatAngka(obat.safety_stock, 2)}</span>
                          : <span className="text-xs text-gray-300 italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {obat.rop != null
                          ? <span className="font-semibold text-orange-600">{formatAngka(obat.rop, 2)}</span>
                          : <span className="text-xs text-gray-300 italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {obat.total_biaya != null
                          ? formatRupiah(obat.total_biaya)
                          : <span className="text-xs text-gray-300 italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <StatusBadge status={obat.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium ${selectedId === obat.id ? 'text-blue-600' : 'text-gray-400'}`}>
                          {selectedId === obat.id ? '▲ Tutup' : '▼ Lihat'}
                        </span>
                      </td>
                    </tr>
                    {selectedId === obat.id && (
                      <tr>
                        <td colSpan={9} className="p-0">
                          <DetailPanel obat={obat} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm text-gray-500">
            <span>{obatList.length} dari {meta.total} obat</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Sebelumnya
              </Button>
              <span className="text-xs">{page} / {meta.last_page}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}>
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Klik baris untuk expand detail kalkulasi • Klik "Halaman Penuh" untuk tampilan lebih lengkap
      </p>
    </div>
  )
}
