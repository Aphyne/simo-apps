'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBarangKeluarList } from '@/hooks/useBarangKeluar'
import { formatTanggalPendek } from '@/lib/utils'
import type { BarangKeluar } from '@/types/obat'

const KETERANGAN_WARNA: Record<string, string> = {
  Penjualan: 'bg-blue-50 text-blue-700',
  Retur: 'bg-yellow-50 text-yellow-700',
  Rusak: 'bg-red-50 text-red-700',
  Kedaluarsa: 'bg-orange-50 text-orange-700',
  Lainnya: 'bg-gray-100 text-gray-600',
}

export default function BarangKeluarTable() {
  const [search, setSearch] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useBarangKeluarList({ page, limit: 15, search, keterangan })
  const list: BarangKeluar[] = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-2 flex-1 max-w-sm">
          <Input
            placeholder="Cari nama atau kode obat..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
          <Button variant="outline" size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </div>
        <Select
          value={keterangan || 'semua'}
          onValueChange={(v) => { setKeterangan(v === 'semua' ? '' : v); setPage(1) }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua</SelectItem>
            <SelectItem value="Penjualan">Penjualan</SelectItem>
            <SelectItem value="Retur">Retur</SelectItem>
            <SelectItem value="Rusak">Rusak</SelectItem>
            <SelectItem value="Kedaluarsa">Kedaluarsa</SelectItem>
            <SelectItem value="Lainnya">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Obat</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Jumlah Keluar</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Keterangan</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Stok</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Catatan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Dicatat oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">Memuat data...</td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">Belum ada riwayat barang keluar</td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {formatTanggalPendek(item.tanggal)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{item.nama_obat}</p>
                      <p className="text-xs text-gray-400 font-mono">{item.kode_obat}</p>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="font-semibold text-red-600">−{item.jumlah} {item.satuan}</span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${KETERANGAN_WARNA[item.keterangan] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.keterangan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap text-xs text-gray-500">
                      <span className="text-gray-400">{item.stok_sebelum}</span>
                      <span className="mx-1 text-red-400">→</span>
                      <span className="font-medium text-gray-800">{item.stok_sesudah}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[150px] truncate">
                      {item.catatan ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.nama_user ? (
                        <div>
                          <p className="text-xs font-medium text-gray-700">{item.nama_user}</p>
                          <p className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block mt-0.5 font-medium ${item.role_user === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {item.role_user === 'admin' ? 'Admin' : 'Staf'}
                          </p>
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
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm text-gray-500">
            <span>{list.length} dari {meta.total} transaksi</span>
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
    </div>
  )
}
