'use client'

import { TrendingDown, DollarSign, Package } from 'lucide-react'
import { AnalisisRingkasan } from '@/hooks/useAnalisis'
import { formatRupiah } from '@/lib/utils'

interface Props {
  ringkasan: AnalisisRingkasan | undefined
  isLoading: boolean
}

export default function AnalisisStatCards({ ringkasan, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Obat Dihitung */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100">
          <Package className="w-5 h-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium truncate">Obat Dihitung</p>
          <p className="text-2xl font-bold leading-tight text-gray-900">
            {ringkasan?.total_obat_dihitung ?? 0}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">jenis obat</p>
        </div>
      </div>

      {/* Biaya Sebelum EOQ */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-100">
          <DollarSign className="w-5 h-5 text-red-500" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium truncate">Biaya Sebelum EOQ</p>
          <p className="text-lg font-bold leading-tight text-gray-900">
            {ringkasan ? formatRupiah(ringkasan.total_tc_tradisional) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">per tahun</p>
        </div>
      </div>

      {/* Biaya Dengan EOQ */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100">
          <DollarSign className="w-5 h-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium truncate">Biaya Dengan EOQ</p>
          <p className="text-lg font-bold leading-tight text-gray-900">
            {ringkasan ? formatRupiah(ringkasan.total_tc_eoq) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">per tahun</p>
        </div>
      </div>

      {/* Total Penghematan */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-100">
          <TrendingDown className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-emerald-600 font-medium truncate">Total Penghematan</p>
          <p className="text-lg font-bold leading-tight text-emerald-700">
            {ringkasan ? formatRupiah(ringkasan.total_penghematan) : '—'}
          </p>
          <p className="text-xs text-emerald-500 mt-0.5">
            {ringkasan ? `${ringkasan.persen_hemat_total}% lebih hemat` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
