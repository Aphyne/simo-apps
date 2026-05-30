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
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">Detail Perbandingan per Obat</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : detail.length === 0 ? (
        <p className="text-center py-10 text-gray-400 text-sm">
          Belum ada data. Lengkapi parameter biaya pada data obat terlebih dahulu.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Obat</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Biaya Sebelum EOQ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-blue-600 uppercase tracking-wide">Biaya Dengan EOQ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Penghematan</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">% Hemat</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {detail.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.nama}</div>
                    <div className="text-xs text-gray-400 font-mono">{item.kode} · {item.satuan}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatRupiah(item.tc_tradisional)}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">
                    {formatRupiah(item.tc_eoq)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">
                    {formatRupiah(item.penghematan)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.persen_hemat > 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {item.persen_hemat > 0 ? '+' : ''}{item.persen_hemat}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onSelectItem(item)}
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {ringkasan && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-gray-800">
                  <td className="px-4 py-3 text-sm">Total</td>
                  <td className="px-4 py-3 text-right text-sm">{formatRupiah(ringkasan.total_tc_tradisional)}</td>
                  <td className="px-4 py-3 text-right text-sm text-blue-600">{formatRupiah(ringkasan.total_tc_eoq)}</td>
                  <td className="px-4 py-3 text-right text-sm text-emerald-600">{formatRupiah(ringkasan.total_penghematan)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
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
