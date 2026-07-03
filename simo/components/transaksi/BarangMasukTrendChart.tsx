'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { BarangMasuk } from '@/types/obat'

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

interface Props {
  allList: BarangMasuk[]
  isLoading: boolean
}

function formatRp(value: number) {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`
  return `Rp ${value}`
}

export default function BarangMasukTrendChart({ allList, isLoading }: Props) {
  const now = new Date()
  const currentYear = now.getFullYear()

  const [mode, setMode] = useState<'mingguan' | 'bulanan'>('bulanan')
  const [metric, setMetric] = useState<'unit' | 'nilai'>('nilai')
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    years.add(currentYear)
    allList.forEach(item => {
      if (item.tanggal) years.add(new Date(item.tanggal).getFullYear())
    })
    return Array.from(years).sort((a, b) => a - b)
  }, [allList, currentYear])

  function sumItems(items: BarangMasuk[]) {
    if (metric === 'unit') {
      return items.reduce((sum, item) => sum + (item.jumlah_satuan ?? 0), 0)
    }
    return items.reduce((sum, item) => sum + ((item.jumlah_satuan ?? 0) * (item.harga_beli ?? 0)), 0)
  }

  const trendData = useMemo(() => {
    if (mode === 'mingguan') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now)
        d.setDate(d.getDate() - (6 - i))
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const items = allList.filter(item => {
          if (!item.tanggal) return false
          const td = new Date(item.tanggal)
          return `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, '0')}-${String(td.getDate()).padStart(2, '0')}` === key
        })
        return { label: `${d.getDate()}/${d.getMonth() + 1}`, total: sumItems(items) }
      })
    }

    return Array.from({ length: 12 }, (_, i) => {
      const items = allList.filter(item => {
        if (!item.tanggal) return false
        const td = new Date(item.tanggal)
        return td.getFullYear() === selectedYear && td.getMonth() === i
      })
      return { label: MONTHS[i], total: sumItems(items) }
    })
  }, [allList, mode, metric, selectedYear])

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <p className="text-sm font-semibold text-gray-700">Tren Barang Masuk</p>

        <div className="flex items-center gap-2">
          {/* Toggle Unit / Nilai Rp */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['unit', 'nilai'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  metric === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'unit' ? 'Unit' : 'Nilai Rp'}
              </button>
            ))}
          </div>

          {/* Toggle periode */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['mingguan', 'bulanan'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'mingguan' ? 'Per Minggu' : 'Bulanan'}
              </button>
            ))}
          </div>

          {/* Dropdown Tahun — paling kanan, hanya aktif saat Bulanan */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            disabled={mode === 'mingguan'}
            className={`border border-gray-200 rounded-lg px-2.5 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              mode === 'mingguan' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'
            }`}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[200px] animate-pulse bg-gray-100 rounded-xl" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={trendData} barSize={mode === 'bulanan' ? 24 : 28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              width={metric === 'nilai' ? 48 : 30}
              tickFormatter={metric === 'nilai' ? (v) => formatRp(v) : undefined}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E5E7EB' }}
              formatter={(v: number) =>
                metric === 'unit'
                  ? [`${v} unit`, 'Masuk']
                  : [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v), 'Pengeluaran']
              }
            />
            <Bar dataKey="total" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
