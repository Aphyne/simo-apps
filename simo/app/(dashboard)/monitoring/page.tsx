'use client'

import { useState } from 'react'
import { Activity, RefreshCw, Info } from 'lucide-react'
import { useMonitoring } from '@/hooks/useMonitoring'
import MonitoringTable from '@/components/monitoring/MonitoringTable'
import { useQueryClient } from '@tanstack/react-query'

export default function MonitoringPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const { data = [], isLoading, dataUpdatedAt } = useMonitoring(search || undefined)

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : null

  const kritis       = data.filter((d) => d.status_stok === 'Kritis').length
  const perluReorder = data.filter((d) => d.status_stok === 'Perlu Reorder').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Monitoring Stok
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Obat diurutkan dari yang paling cepat habis — hanya obat dengan riwayat penjualan
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-gray-400">Update: {lastUpdate}</span>
          )}
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['monitoring'] })}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 border rounded-md px-3 py-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Alert banner jika ada yang kritis */}
      {(kritis > 0 || perluReorder > 0) && !isLoading && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
          <Info className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            {kritis > 0 && (
              <span className="font-semibold">{kritis} obat Kritis</span>
            )}
            {kritis > 0 && perluReorder > 0 && ' · '}
            {perluReorder > 0 && (
              <span className="font-semibold">{perluReorder} obat Perlu Reorder</span>
            )}
            {' '}— segera lakukan pemesanan ulang.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border p-4 flex gap-3 items-center">
        <input
          type="text"
          placeholder="Cari nama atau kode obat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {data.length} obat dengan riwayat penjualan
          </span>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> ≤ 7 hari
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> ≤ 14 hari
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> ≤ 30 hari
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-50 animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <MonitoringTable data={data} />
        )}
      </div>

      {/* Keterangan */}
      <p className="text-xs text-gray-400 px-1">
        Estimasi habis = stok saat ini ÷ rata-rata penjualan harian (30 hari terakhir).
        Obat tanpa riwayat penjualan tidak ditampilkan di halaman ini.
      </p>
    </div>
  )
}
