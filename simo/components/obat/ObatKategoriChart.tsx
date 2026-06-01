'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Obat } from '@/types/obat'

const COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#F97316', '#EF4444', '#9CA3AF', '#06B6D4', '#F59E0B']

interface Props {
  allObat: Obat[]
  isLoading: boolean
}

export default function ObatKategoriChart({ allObat, isLoading }: Props) {
  const chartData = useMemo(() => {
    const map: Record<string, number> = {}
    allObat.forEach(o => {
      map[o.kategori] = (map[o.kategori] ?? 0) + 1
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [allObat])

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-700 mb-4">Distribusi per Kategori</p>

      {isLoading ? (
        <div className="h-[200px] animate-pulse bg-gray-100 rounded-xl" />
      ) : chartData.length === 0 ? (
        <p className="text-center py-10 text-gray-400 text-sm">Belum ada data obat</p>
      ) : (
        <div className="flex items-center gap-6">
          {/* Donut */}
          <div className="flex-shrink-0 w-[180px] h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E5E7EB' }}
                  formatter={(value: number, name: string) => [
                    `${value} obat (${Math.round((value / total) * 100)}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <ol className="flex-1 space-y-2 min-w-0">
            {chartData.map((item, i) => (
              <li key={item.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-gray-700 flex-1 truncate">{item.name}</span>
                <span className="text-xs font-semibold text-gray-900 flex-shrink-0">{item.value}</span>
                <span className="text-xs text-gray-400 flex-shrink-0 w-8 text-right">
                  {Math.round((item.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
