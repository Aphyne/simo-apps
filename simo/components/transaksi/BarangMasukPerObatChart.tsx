'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { BarangMasuk } from '@/types/obat'

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
]

interface Props {
  allList: BarangMasuk[]
  isLoading: boolean
}

export default function BarangMasukPerObatChart({ allList, isLoading }: Props) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const [mode, setMode] = useState<'bulanan' | 'tahunan'>('bulanan')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    years.add(currentYear)
    allList.forEach(item => {
      if (item.tanggal) years.add(new Date(item.tanggal).getFullYear())
    })
    return Array.from(years).sort((a, b) => a - b)
  }, [allList, currentYear])

  const chartData = useMemo(() => {
    const filtered = allList.filter(item => {
      if (!item.tanggal) return false
      const d = new Date(item.tanggal)
      if (mode === 'bulanan') {
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
      }
      return d.getFullYear() === selectedYear
    })

    const map: Record<string, { nama: string; total: number }> = {}
    filtered.forEach(item => {
      if (!map[item.nama_obat]) map[item.nama_obat] = { nama: item.nama_obat, total: 0 }
      map[item.nama_obat].total += item.jumlah_satuan ?? 0
    })

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map(item => ({
        ...item,
        label: item.nama.length > 12 ? item.nama.slice(0, 12) + '…' : item.nama,
      }))
  }, [allList, mode, selectedMonth, selectedYear])

  const periodeLabel = mode === 'bulanan'
    ? `${MONTHS[selectedMonth]} ${selectedYear}`
    : `Tahun ${selectedYear}`

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-gray-700">Masuk per Obat</p>
          <p className="text-xs text-gray-400 mt-0.5">{periodeLabel}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Bulanan / Tahunan */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['bulanan', 'tahunan'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'bulanan' ? 'Bulanan' : 'Tahunan'}
              </button>
            ))}
          </div>

          {/* Dropdown Bulan — hanya saat Bulanan */}
          {mode === 'bulanan' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          )}

          {/* Dropdown Tahun — selalu ada */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[200px] animate-pulse bg-gray-100 rounded-xl" />
      ) : chartData.length === 0 ? (
        <p className="text-center py-10 text-gray-400 text-sm">
          Tidak ada barang masuk di {periodeLabel}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E5E7EB' }}
              formatter={(v) => [`${v} unit`, 'Masuk']}
              labelFormatter={(label) => chartData.find(d => d.label === label)?.nama ?? label}
            />
            <Bar dataKey="total" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
