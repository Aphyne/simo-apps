'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { BarangKeluar } from '@/types/obat'

type Periode = 'minggu' | 'bulan' | '6bulan'

const PERIODE_LABEL: Record<Periode, string> = {
  minggu:  'Minggu Ini',
  bulan:   'Bulan Ini',
  '6bulan': '6 Bulan',
}

interface Props {
  allList: BarangKeluar[]
  isLoading: boolean
}

export default function BarangKeluarPerObatChart({ allList, isLoading }: Props) {
  const [periode, setPeriode] = useState<Periode>('bulan')

  const chartData = useMemo(() => {
    const now = new Date()
    let filtered = allList

    if (periode === 'minggu') {
      const from = new Date(now)
      from.setDate(from.getDate() - 6)
      from.setHours(0, 0, 0, 0)
      filtered = allList.filter(item => item.tanggal && new Date(item.tanggal) >= from)
    } else if (periode === 'bulan') {
      filtered = allList.filter(item => {
        if (!item.tanggal) return false
        const d = new Date(item.tanggal)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      })
    } else {
      const from = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      filtered = allList.filter(item => item.tanggal && new Date(item.tanggal) >= from)
    }

    const map: Record<string, { nama: string; total: number }> = {}
    filtered.forEach(item => {
      if (!map[item.nama_obat]) map[item.nama_obat] = { nama: item.nama_obat, total: 0 }
      map[item.nama_obat].total += item.jumlah ?? 0
    })

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map(item => ({
        ...item,
        label: item.nama.length > 12 ? item.nama.slice(0, 12) + '…' : item.nama,
      }))
  }, [allList, periode])

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">Keluar per Obat</p>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(Object.keys(PERIODE_LABEL) as Periode[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                periode === p
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {PERIODE_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-[200px] animate-pulse bg-gray-100 rounded-xl" />
      ) : chartData.length === 0 ? (
        <p className="text-center py-10 text-gray-400 text-sm">Belum ada data di periode ini</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E5E7EB' }}
              formatter={(v) => [`${v} unit`, 'Keluar']}
              labelFormatter={(label) => {
                const found = chartData.find(d => d.label === label)
                return found?.nama ?? label
              }}
            />
            <Bar dataKey="total" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
