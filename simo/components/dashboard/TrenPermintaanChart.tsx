'use client'

import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  data: { bulan: string; total: string }[]
}

export default function TrenPermintaanChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Belum ada data penjualan
      </div>
    )
  }

  const chartData = data.map((d) => ({
    bulan: format(new Date(d.bulan), 'MMM yyyy', { locale: id }),
    total: parseInt(d.total),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#6b7280' }} />
        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} width={40} />
        <Tooltip
          formatter={(value: number) => [`${value.toLocaleString('id-ID')} unit`, 'Total Penjualan']}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#2563eb"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#2563eb' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
