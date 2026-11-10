'use client'

import { Eye } from 'lucide-react'
import { AnalisisDetail, AnalisisRingkasan } from '@/hooks/useAnalisis'
import { formatRupiah } from '@/lib/utils'

interface Props {
  detail: AnalisisDetail[]
  ringkasan: AnalisisRingkasan | undefined
  isLoading: boolean
  onSelectItem: (item: AnalisisDetail) => void
}

export default function AnalisisTable({ detail, ringkasan, isLoading, onSelectItem }: Props) {
  return (
    <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-line">
        <h2 className="text-sm font-semibold text-fg-secondary">Detail Perbandingan per Obat</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse bg-surface-muted rounded-xl" />
          ))}
        </div>
      ) : detail.length === 0 ? (
        <p className="text-center py-10 text-fg-muted text-sm">
          Belum ada data. Lengkapi parameter biaya pada data obat terlebih dahulu.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Obat</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-fg-muted uppercase tracking-wide">Biaya Sebelum EOQ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-brand-600 uppercase tracking-wide">Biaya Dengan EOQ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-fg-muted uppercase tracking-wide">Penghematan</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-fg-muted uppercase tracking-wide">% Hemat</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-fg-muted uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {detail.map((item) => (
                <tr key={item.id} className="border-b border-line-subtle hover:bg-surface-subtle transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-fg">{item.nama}</div>
                    <div className="text-xs text-fg-muted font-mono">{item.kode} · {item.satuan}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-fg-secondary">
                    {formatRupiah(item.tc_tradisional)}
                  </td>
                  <td className="px-4 py-3 text-right text-brand-600 font-medium">
                    {formatRupiah(item.tc_eoq)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-success-700">
                    {formatRupiah(item.penghematan)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.persen_hemat > 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.persen_hemat > 0 ? '+' : ''}{item.persen_hemat}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onSelectItem(item)}
                      className="text-fg-muted hover:text-fg-secondary hover:bg-surface-muted rounded-lg p-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {ringkasan && (
              <tfoot>
                <tr className="border-t-2 border-line bg-surface-subtle font-semibold text-gray-800">
                  <td className="px-4 py-3 text-sm">Total</td>
                  <td className="px-4 py-3 text-right text-sm">{formatRupiah(ringkasan.total_tc_tradisional)}</td>
                  <td className="px-4 py-3 text-right text-sm text-brand-600">{formatRupiah(ringkasan.total_tc_eoq)}</td>
                  <td className="px-4 py-3 text-right text-sm text-success-700">{formatRupiah(ringkasan.total_penghematan)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-700">
                      +{ringkasan.persen_hemat_total}%
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  )
}
