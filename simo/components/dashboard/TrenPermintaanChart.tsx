'use client'

import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  data: { bulan: string; total: string }[]
  // Tinggi grafik: angka piksel, atau '100%' untuk mengisi wadah induk
  height?: number | string
}

// Warna grafik diambil dari token (var(--chart-1) dst.), bukan hex di kode.
const TICK = { fontSize: 12, fill: 'var(--muted-foreground)' }

export default function TrenPermintaanChart({ data, height = 240 }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Belum ada data penjualan
      </div>
    )
  }

  const chartData = data.map((d) => ({
    bulan: format(new Date(d.bulan), 'MMM yyyy', { locale: id }),
    total: parseInt(d.total),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="bulan" tick={TICK} tickLine={false} axisLine={{ stroke: 'var(--border)' }} tickMargin={8} />
        <YAxis tick={TICK} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          cursor={{ stroke: 'var(--input)' }}
          formatter={(value: number) => [`${value.toLocaleString('id-ID')} unit`, 'Total penjualan']}
          labelStyle={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 2 }}
          itemStyle={{ color: 'var(--foreground)' }}
          contentStyle={{
            fontSize: 13,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--popover)',
            boxShadow: 'none',
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.08}
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--card)', stroke: 'var(--chart-1)', strokeWidth: 2 }}
          activeDot={{ r: 5, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
