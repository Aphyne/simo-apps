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
import { formatRupiah } from '@/lib/utils'

interface Props {
  data: {
    nama: string
    nama_lengkap: string
    biaya_eoq: number
    biaya_tanpa_eoq: number
    penghematan: number
  }[]
}

export default function PerbandinganBiayaChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Belum ada data biaya (isi biaya pesan & simpan pada data obat)
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="nama" tick={{ fontSize: 10, fill: '#6b7280' }} />
        <YAxis
          tick={{ fontSize: 10, fill: '#6b7280' }}
          width={60}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatRupiah(value),
            name === 'biaya_eoq' ? 'Dengan EOQ' : 'Tanpa EOQ',
          ]}
          labelFormatter={(label) => {
            const item = data.find((d) => d.nama === label)
            return item?.nama_lengkap ?? label
          }}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend
          formatter={(value) => value === 'biaya_eoq' ? 'Dengan EOQ' : 'Tanpa EOQ'}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="biaya_tanpa_eoq" fill="#d1d5db" radius={[4, 4, 0, 0]} />
        <Bar dataKey="biaya_eoq" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
