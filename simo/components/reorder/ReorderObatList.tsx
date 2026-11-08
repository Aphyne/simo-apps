'use client'

import { Plus, Check, ListPlus } from 'lucide-react'
import type { ReorderAlertItem } from '@/hooks/useObat'

export interface FilterSupplier {
  key: string // 'semua' | 'none' | id supplier
  label: string
  jumlah: number
}

interface Props {
  items: ReorderAlertItem[] // sudah terfilter sesuai supplier terpilih
  filters: FilterSupplier[]
  filterAktif: string
  onFilter: (key: string) => void
  diKeranjang: (id: number) => boolean
  onToggle: (item: ReorderAlertItem) => void
  onTambahSemua: (items: ReorderAlertItem[]) => void
  isLoading: boolean
}

export default function ReorderObatList({
  items,
  filters,
  filterAktif,
  onFilter,
  diKeranjang,
  onToggle,
  onTambahSemua,
  isLoading,
}: Props) {
  const bisaDitambah = items.filter((it) => it.supplier_id !== null && !diKeranjang(it.id))

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Obat yang Perlu Dipesan</h2>
            <p className="text-xs text-gray-500 mt-0.5">Stok sudah di bawah ROP. Klik Tambah untuk memasukkan ke keranjang.</p>
          </div>
          <button
            onClick={() => onTambahSemua(bisaDitambah)}
            disabled={bisaDitambah.length === 0}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-3 py-2 text-sm"
          >
            <ListPlus className="w-4 h-4" />
            Tambah semua ({bisaDitambah.length})
          </button>
        </div>

        {/* Filter supplier */}
        <div className="flex items-center gap-2 flex-wrap" role="tablist" aria-label="Filter supplier">
          {filters.map((f) => {
            const aktif = f.key === filterAktif
            return (
              <button
                key={f.key}
                role="tab"
                aria-selected={aktif}
                onClick={() => onFilter(f.key)}
                className={
                  aktif
                    ? 'px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white border border-blue-600'
                    : 'px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors'
                }
              >
                {f.label} <span className={aktif ? 'text-blue-100' : 'text-gray-500'}>({f.jumlah})</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['Obat', 'Status', 'Stok / ROP', 'Saran Pesan', ''].map((h, i) => (
                <th key={i} className={`text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-3 ${i === 2 || i === 3 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="py-6 px-3"><div className="animate-pulse bg-gray-100 rounded-xl h-24" /></td></tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500 text-sm">Tidak ada obat yang perlu dipesan untuk filter ini.</td></tr>
            )}
            {items.map((it) => {
              const habis = it.stok === 0
              const ada = diKeranjang(it.id)
              const tanpaSupplier = it.supplier_id === null
              return (
                <tr key={it.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${ada ? 'bg-blue-50/40' : ''}`}>
                  <td className="py-3 px-3">
                    <span className="block font-medium text-gray-900">{it.nama}</span>
                    <span className="text-xs text-gray-500">
                      {it.supplier_nama ?? it.nama_supplier ?? 'Supplier belum diatur'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${habis ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-700'}`}>
                      {habis ? 'Habis' : 'Reorder'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                    <span className={`font-semibold ${habis ? 'text-red-600' : 'text-gray-900'}`}>{it.stok}</span>
                    {' / '}
                    {Math.ceil(it.rop)} {it.satuan}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">{it.saran_jumlah}</span> {it.satuan_pesan}
                    <span className="block text-xs text-gray-500">dari {it.basis_saran}</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {tanpaSupplier ? (
                      <span className="text-xs text-orange-700 font-medium">Atur supplier dulu</span>
                    ) : (
                      <button
                        onClick={() => onToggle(it)}
                        aria-pressed={ada}
                        className={
                          ada
                            ? 'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors'
                            : 'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors'
                        }
                      >
                        {ada ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {ada ? 'Di keranjang' : 'Tambah'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
