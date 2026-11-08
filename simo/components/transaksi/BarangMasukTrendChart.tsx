'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { BarangMasuk } from '@/types/obat'

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

interface Props {
  allList: BarangMasuk[]
  isLoading: boolean
}

const formatAngka = (n: number) => new Intl.NumberFormat('id-ID').format(n)
const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

export default function BarangMasukTrendChart({ allList, isLoading }: Props) {
  const now = new Date()
  const currentYear = now.getFullYear()

  const [mode, setMode] = useState<'mingguan' | 'bulanan'>('bulanan')
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    years.add(currentYear)
    allList.forEach(item => {
      if (item.tanggal) years.add(new Date(item.tanggal).getFullYear())
    })
    return Array.from(years).sort((a, b) => a - b)
  }, [allList, currentYear])

  // Unit dan nilai Rp dihitung sekaligus; keduanya tampil di tooltip saat hover
  function sumItems(items: BarangMasuk[]) {
    return {
      unit: items.reduce((sum, item) => sum + (item.jumlah_satuan ?? 0), 0),
      nilai: items.reduce((sum, item) => sum + ((item.jumlah_satuan ?? 0) * (item.harga_beli ?? 0)), 0),
    }
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
        return { label: `${d.getDate()}/${d.getMonth() + 1}`, ...sumItems(items) }
      })
    }

    return Array.from({ length: 12 }, (_, i) => {
      const items = allList.filter(item => {
        if (!item.tanggal) return false
        const td = new Date(item.tanggal)
        return td.getFullYear() === selectedYear && td.getMonth() === i
      })
      return { label: MONTHS[i], ...sumItems(items) }
    })
  }, [allList, mode, selectedYear])

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <p className="text-sm font-semibold text-gray-700">Tren Stok Masuk</p>

        <div className="flex items-center gap-2">
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
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              cursor={{ fill: '#F3F4F6' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload as { unit: number; nilai: number }
                return (
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
                    <p className="font-semibold text-gray-900 mb-1">{label}</p>
                    <p className="text-emerald-700">Masuk: <span className="font-semibold tabular-nums">{formatAngka(d.unit)}</span> unit</p>
                    <p className="text-gray-700">Total pengeluaran: <span className="font-semibold tabular-nums">{formatRupiah(d.nilai)}</span></p>
                  </div>
                )
              }}
            />
            <Bar dataKey="unit" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
