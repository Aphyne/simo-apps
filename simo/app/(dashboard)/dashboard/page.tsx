'use client'

import { Pill, AlertTriangle, ShoppingCart, ArrowLeftRight, CalendarX } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import ReorderTable from '@/components/dashboard/ReorderTable'
import TrenPermintaanChart from '@/components/dashboard/TrenPermintaanChart'
import PerbandinganBiayaChart from '@/components/dashboard/PerbandinganBiayaChart'
import { useDashboardSummary, useTrenPermintaan, usePerbandinganBiaya } from '@/hooks/useDashboard'

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useDashboardSummary()
  const { data: tren, isLoading: loadingTren } = useTrenPermintaan()
  const { data: biaya, isLoading: loadingBiaya } = usePerbandinganBiaya()

  const cards = summary?.cards
  const obatMendesak = summary?.obat_mendesak ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan kondisi persediaan obat saat ini</p>
      </div>

      {/* ── 5 Stat Cards ────────────────────────────────────────────── */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-gray-50 p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Obat"
            value={cards?.total_obat ?? 0}
            icon={Pill}
            warna="blue"
            sublabel="jenis obat terdaftar"
          />
          <StatCard
            label="Perlu Reorder"
            value={cards?.obat_reorder ?? 0}
            icon={AlertTriangle}
            warna="red"
            sublabel="stok ≤ ROP"
          />
          <StatCard
            label="Penjualan Hari Ini   "
            value={cards?.penjualan_hari_ini ?? 0}
            icon={ShoppingCart}
            warna="green"
            sublabel="unit terjual hari ini"
          />
          <StatCard
            label="Transaksi Hari Ini"
            value={cards?.transaksi_hari_ini ?? 0}
            icon={ArrowLeftRight}
            warna="purple"
            sublabel="masuk + keluar"
          />
          <StatCard
            label="Akan Expired"
            value={cards?.obat_expiring ?? 0}
            icon={CalendarX}
            warna="orange"
            sublabel="dalam 90 hari ke depan"
          />
        </div>
      )}

      {/* ── Row 2: Tren + Reorder Table ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Tren Permintaan — 6 Bulan Terakhir
          </h2>
          {loadingTren ? (
            <div className="h-52 bg-gray-100 animate-pulse rounded-lg" />
          ) : (
            <TrenPermintaanChart data={tren ?? []} />
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            Obat Paling Mendesak
            {obatMendesak.length > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                {obatMendesak.length}
              </span>
            )}
          </h2>
          {loadingSummary ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <ReorderTable data={obatMendesak} />
          )}
        </div>
      </div>

      {/* ── Row 3: Perbandingan Biaya ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Perbandingan Biaya Persediaan — EOQ vs Tradisional
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Batang biru (EOQ) seharusnya lebih rendah dari batang abu (Tradisional).
          </p>
        </div>
        {loadingBiaya ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
        ) : (
          <PerbandinganBiayaChart data={biaya ?? []} />
        )}
      </div>
    </div>
  )
}
