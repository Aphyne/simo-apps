'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { useObatBatchSummary } from '@/hooks/useObat'
import { formatTanggalPendek } from '@/lib/utils'

interface Props {
  id: string | number
}

function getBadge(expiredBatch: string) {
  const hari = Math.floor((new Date(expiredBatch).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (hari < 0)   return { label: 'Sudah Expired',  cls: 'bg-gray-100 text-gray-500',    hari: null }
  if (hari <= 30)  return { label: `${hari} hari lagi`, cls: 'bg-red-100 text-red-600',     hari }
  if (hari <= 90)  return { label: `${hari} hari lagi`, cls: 'bg-orange-100 text-orange-700', hari }
  return           { label: `${hari} hari lagi`, cls: 'bg-emerald-100 text-emerald-700',  hari }
}

export default function ObatBatchSummary({ id }: Props) {
  const { data, isLoading } = useObatBatchSummary(id)
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">Estimasi Sisa per Batch</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            className="text-gray-400 hover:text-blue-500 transition-colors focus:outline-none"
            aria-label="Informasi metode kalkulasi"
          >
            <Info className="w-4 h-4" />
          </button>
          {showInfo && (
            <div className="absolute right-0 top-6 z-20 w-72 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl leading-relaxed">
              Dihitung dengan asumsi FIFO — stok terlama digunakan lebih dulu
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-center py-10 text-gray-400 text-sm">
          Tidak ada data batch dengan expired tercatat
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">No. Batch</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expired</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Masuk</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estimasi Sisa</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sisa Hari</th>
              </tr>
            </thead>
            <tbody>
              {data.map((batch, i) => {
                const badge = getBadge(batch.expired_batch)
                return (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-2 font-mono text-xs text-gray-700">
                      {batch.no_batch ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-2 font-medium text-gray-900">
                      {formatTanggalPendek(batch.expired_batch)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-500 text-xs">
                      {batch.total_masuk} {batch.satuan}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="font-semibold text-gray-900">{batch.estimasi_sisa}</span>
                      <span className="text-xs text-gray-400 ml-1">{batch.satuan}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
