'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatRupiah } from '@/lib/utils'
import type { BarangKeluar } from '@/types/obat'

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
]

interface ChartPoint {
  nama: string
  total: number
  pendapatan: number
  label: string
}

// Tooltip custom — dua baris terpisah (unit keluar & total pendapatan),
// bukan formatter bawaan Recharts yang cuma bisa 1 baris per Bar.
function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartPoint }[] }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-gray-800 mb-1">{data.nama}</p>
      <p className="text-brand-600">Keluar: <span className="font-medium">{data.total} unit</span></p>
      <p className="text-[#10B981]">Total Pendapatan: <span className="font-medium">{formatRupiah(data.pendapatan)}</span></p>
    </div>
  )
}

interface Props {
  allList: BarangKeluar[]
  isLoading: boolean
}

export default function BarangKeluarPerObatChart({ allList, isLoading }: Props) {
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
      // Hanya hitung Penjualan — pemusnahan/retur/rusak/dll bukan pendapatan
      if (item.keterangan !== 'Penjualan') return false
      const d = new Date(item.tanggal)
      if (mode === 'bulanan') {
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
      }
      return d.getFullYear() === selectedYear
    })

    const map: Record<string, { nama: string; total: number; pendapatan: number }> = {}
    filtered.forEach(item => {
      if (!map[item.nama_obat]) map[item.nama_obat] = { nama: item.nama_obat, total: 0, pendapatan: 0 }
      map[item.nama_obat].total += item.jumlah ?? 0
      map[item.nama_obat].pendapatan += (item.jumlah ?? 0) * (item.harga_jual ?? 0)
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
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-fg-secondary">Keluar per Obat</p>
          <p className="text-xs text-fg-muted mt-0.5">{periodeLabel} · khusus Penjualan</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Bulanan / Tahunan */}
          <div className="flex gap-1 bg-surface-muted rounded-lg p-0.5">
            {(['bulanan', 'tahunan'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === m ? 'bg-surface text-gray-900 shadow-sm' : 'text-gray-500 hover:text-fg-secondary'
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
              className="border border-line rounded-lg px-2.5 py-1 text-xs text-fg-secondary bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500"
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
            className="border border-line rounded-lg px-2.5 py-1 text-xs text-fg-secondary bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[200px] animate-pulse bg-surface-muted rounded-xl" />
      ) : chartData.length === 0 ? (
        <p className="text-center py-10 text-fg-muted text-sm">
          Tidak ada barang keluar di {periodeLabel}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F3F4F6' }} />
            <Bar dataKey="total" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
