'use client'

import { Plus, X, ListPlus } from 'lucide-react'
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
    <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-line-subtle space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-fg-secondary">Obat yang Perlu Dipesan</h2>
            <p className="text-xs text-fg-muted mt-0.5">Stok sudah di bawah ROP. Klik Tambah untuk memasukkan ke keranjang.</p>
          </div>
          <button
            onClick={() => onTambahSemua(bisaDitambah)}
            disabled={bisaDitambah.length === 0}
            className="flex items-center gap-1.5 border border-line-strong text-fg-secondary hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-3 py-2 text-sm"
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
                    ? 'px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 text-white border border-brand-600'
                    : 'px-3 py-1.5 rounded-lg text-xs font-medium border border-line text-gray-600 hover:bg-surface-muted transition-colors'
                }
              >
                {f.label} <span className={aktif ? 'text-brand-100' : 'text-fg-muted'}>({f.jumlah})</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              {['Obat', 'Status', 'Stok / ROP', 'Saran Pesan', ''].map((h, i) => (
                <th key={i} className={`text-xs font-semibold text-fg-muted uppercase tracking-wide py-3 px-3 ${i === 2 || i === 3 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="py-6 px-3"><div className="animate-pulse bg-surface-muted rounded-xl h-24" /></td></tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-fg-muted text-sm">Tidak ada obat yang perlu dipesan untuk filter ini.</td></tr>
            )}
            {items.map((it) => {
              const habis = it.stok === 0
              const ada = diKeranjang(it.id)
              const tanpaSupplier = it.supplier_id === null
              return (
                <tr key={it.id} className={`border-b border-line-subtle hover:bg-surface-subtle transition-colors ${ada ? 'bg-brand-50/40' : ''}`}>
                  <td className="py-3 px-3">
                    <span className="block font-medium text-fg">{it.nama}</span>
                    <span className="text-xs text-fg-muted">
                      {it.supplier_nama ?? it.nama_supplier ?? 'Supplier belum diatur'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${habis ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {habis ? 'Habis' : 'Reorder'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-fg-secondary whitespace-nowrap">
                    <span className={`font-semibold ${habis ? 'text-red-600' : 'text-gray-900'}`}>{it.stok}</span>
                    {' / '}
                    {Math.ceil(it.rop)} {it.satuan}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-fg-secondary whitespace-nowrap">
                    <span className="font-semibold text-fg">{it.saran_jumlah}</span> {it.satuan_pesan}
                    <span className="block text-xs text-fg-muted">dari {it.basis_saran}</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {tanpaSupplier ? (
                      <span className="text-xs text-warning-700 font-medium">Atur supplier dulu</span>
                    ) : (
                      <button
                        onClick={() => onToggle(it)}
                        aria-pressed={ada}
                        className={
                          ada
                            ? 'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium border border-line-strong text-fg-tertiary hover:bg-danger-50 hover:text-danger-600 hover:border-danger-200 transition-colors'
                            : 'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium border border-brand-600 text-brand-600 hover:bg-brand-50 transition-colors'
                        }
                      >
                        {ada ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {ada ? 'Batalkan' : 'Tambah'}
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
