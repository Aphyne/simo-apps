'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { HasilSimulasi } from '@/hooks/useSimulasi'

interface Props {
  hasil: HasilSimulasi
}

export default function SimulasiChart({ hasil }: Props) {
  const { aktual, simulasi, obat } = hasil

  const dataMetrik = [
    {
      metrik: 'EOQ',
      Aktual: aktual.eoq !== null ? Math.round(aktual.eoq) : 0,
      Simulasi: simulasi.eoq !== null ? Math.round(simulasi.eoq) : 0,
    },
    {
      metrik: 'Safety Stock',
      Aktual: Math.round(aktual.safety_stock),
      Simulasi: Math.round(simulasi.safety_stock),
    },
    {
      metrik: 'ROP',
      Aktual: Math.round(aktual.rop),
      Simulasi: Math.round(simulasi.rop),
    },
  ]

  return (
    <div>
      <p className="text-xs text-gray-400 mb-3">
        Satuan: {obat.satuan} — EOQ, Safety Stock, dan ROP dalam satuan terkecil
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={dataMetrik} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="metrik" tick={{ fontSize: 11, fill: '#6b7280' }} />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} width={50} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(v: number) => [`${v} ${obat.satuan}`, '']}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Aktual"  fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Simulasi" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
