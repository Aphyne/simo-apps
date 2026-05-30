'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { AnalisisDetail } from '@/hooks/useAnalisis'
import { formatRupiah } from '@/lib/utils'

interface Props {
  detail: AnalisisDetail[]
  isLoading: boolean
}

export default function AnalisisChart({ detail, isLoading }: Props) {
  const chartData = detail.slice(0, 15).map((d) => ({
    nama: d.nama.length > 14 ? d.nama.substring(0, 14) + '…' : d.nama,
    nama_lengkap: d.nama,
    tc_tradisional: d.tc_tradisional,
    tc_eoq: d.tc_eoq,
  }))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Grafik Perbandingan Biaya</h2>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-[#94a3b8] inline-block" />
            Sebelum EOQ
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-[#2563eb] inline-block" />
            Dengan EOQ
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse bg-gray-100 rounded-xl" />
      ) : chartData.length === 0 ? (
        <p className="text-center py-10 text-gray-400 text-sm">
          Belum ada obat dengan parameter EOQ lengkap (isi biaya pesan, biaya simpan, dan demand).
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barCategoryGap="40%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="nama" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              width={65}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatRupiah(value),
                name === 'tc_eoq' ? 'Biaya Dengan EOQ' : 'Biaya Sebelum EOQ',
              ]}
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.nama === label)
                return item?.nama_lengkap ?? label
              }}
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            />
            <Bar dataKey="tc_tradisional" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={52} />
            <Bar dataKey="tc_eoq" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={52} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
