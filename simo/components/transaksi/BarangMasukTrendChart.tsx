'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { BarangMasuk } from '@/types/obat'

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

interface Props {
  allList: BarangMasuk[]
  isLoading: boolean
}

export default function BarangMasukTrendChart({ allList, isLoading }: Props) {
  const [mode, setMode] = useState<'harian' | 'mingguan' | 'bulanan'>('harian')

  const trendData = useMemo(() => {
    const now = new Date()
    if (mode === 'harian') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now)
        d.setDate(d.getDate() - (6 - i))
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const total = allList.filter(item => {
          if (!item.tanggal) return false
          const td = new Date(item.tanggal)
          return `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, '0')}-${String(td.getDate()).padStart(2, '0')}` === key
        }).reduce((sum, item) => sum + (item.jumlah_satuan ?? 0), 0)
        return { label: `${d.getDate()}/${d.getMonth() + 1}`, total }
      })
    }
    if (mode === 'mingguan') {
      return Array.from({ length: 4 }, (_, i) => {
        const weekEnd = new Date(now)
        weekEnd.setDate(weekEnd.getDate() - i * 7)
        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekStart.getDate() - 6)
        const total = allList.filter(item => {
          if (!item.tanggal) return false
          const d = new Date(item.tanggal)
          return d >= weekStart && d <= weekEnd
        }).reduce((sum, item) => sum + (item.jumlah_satuan ?? 0), 0)
        return { label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`, total }
      }).reverse()
    }
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const total = allList.filter(item => {
        if (!item.tanggal) return false
        const td = new Date(item.tanggal)
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth()
      }).reduce((sum, item) => sum + (item.jumlah_satuan ?? 0), 0)
      return { label: MONTHS[d.getMonth()], total }
    })
  }, [allList, mode])

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">Tren Barang Masuk</p>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['harian', 'mingguan', 'bulanan'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'harian' ? '7 Hari' : m === 'mingguan' ? '4 Minggu' : '6 Bulan'}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="h-[200px] animate-pulse bg-gray-100 rounded-xl" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={trendData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={30} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E5E7EB' }}
              formatter={(v) => [`${v} unit`, 'Masuk']}
            />
            <Bar dataKey="total" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
