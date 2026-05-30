'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pill, AlertTriangle, ShoppingCart, ArrowLeftRight, CalendarX, PackagePlus, PackageMinus, PlusCircle } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import ReorderTable from '@/components/dashboard/ReorderTable'
import TrenPermintaanChart from '@/components/dashboard/TrenPermintaanChart'
import BarangMasukForm from '@/components/transaksi/BarangMasukForm'
import BarangKeluarForm from '@/components/transaksi/BarangKeluarForm'
import ObatForm from '@/components/obat/ObatForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDashboardSummary, useTrenPermintaan } from '@/hooks/useDashboard'
import { useCreateObat } from '@/hooks/useObat'
import type { ObatFormData } from '@/types/obat'

export default function DashboardPage() {
  const router = useRouter()

  const { data: summary, isLoading: loadingSummary } = useDashboardSummary()
  const { data: tren, isLoading: loadingTren } = useTrenPermintaan()
  const createObatMutation = useCreateObat()

  const cards = summary?.cards
  const obatMendesak = summary?.obat_mendesak ?? []

  const [openMasuk, setOpenMasuk]           = useState(false)
  const [openKeluar, setOpenKeluar]         = useState(false)
  const [openTambahObat, setOpenTambahObat] = useState(false)

  function handleBarangMasukSuccess() {
    setOpenMasuk(false)
    router.push('/barang-masuk')
  }

  function handleBarangKeluarSuccess() {
    setOpenKeluar(false)
    router.push('/barang-keluar')
  }

  async function handleTambahObat(data: ObatFormData) {
    await createObatMutation.mutateAsync(data)
    setOpenTambahObat(false)
    router.push('/obat')
  }

  return (
    <div className="space-y-6">

      {/* ── Row 1: 5 Stat Cards ─────────────────────────────────────── */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="rounded-xl bg-blue-400/60 h-24 animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-gray-100 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Perlu Reorder"     value={cards?.obat_reorder ?? 0}      icon={AlertTriangle} warna="red"    sublabel="stok ≤ ROP"         featured />
          <StatCard label="Total Obat"         value={cards?.total_obat ?? 0}         icon={Pill}          warna="blue"   sublabel="jenis terdaftar" />
          <StatCard label="Penjualan Hari Ini" value={cards?.penjualan_hari_ini ?? 0} icon={ShoppingCart}  warna="green"  sublabel="unit terjual hari ini" />
          <StatCard label="Transaksi Hari Ini" value={cards?.transaksi_hari_ini ?? 0} icon={ArrowLeftRight} warna="purple" sublabel="masuk + keluar" />
          <StatCard label="Akan Expired"       value={cards?.obat_expiring ?? 0}      icon={CalendarX}     warna="orange" sublabel="dalam 90 hari" />
        </div>
      )}

      {/* ── Row 2: Obat Mendesak (2/3) + Aksi Cepat (1/3) ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Obat Perlu Reorder */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            Obat Perlu Reorder
            {obatMendesak.length > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                {obatMendesak.length}
              </span>
            )}
          </h2>
          {loadingSummary ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <ReorderTable data={obatMendesak} />
          )}
        </div>

        {/* Aksi Cepat */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-700">Aksi Cepat</h2>

          <div className="space-y-2">
            <button
              onClick={() => setOpenMasuk(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors text-left"
            >
              <PackagePlus className="w-4 h-4 flex-shrink-0" />
              Catat Barang Masuk
            </button>

            <button
              onClick={() => setOpenKeluar(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-medium transition-colors text-left"
            >
              <PackageMinus className="w-4 h-4 flex-shrink-0" />
              Catat Barang Keluar
            </button>

            <button
              onClick={() => setOpenTambahObat(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium transition-colors text-left"
            >
              <PlusCircle className="w-4 h-4 flex-shrink-0" />
              Tambah Obat Baru
            </button>
          </div>

          {/* Expired warning */}
          {(cards?.obat_expiring ?? 0) > 0 && (
            <div className="mt-auto p-3 rounded-lg bg-orange-50 border border-orange-200">
              <p className="text-xs font-semibold text-orange-700">
                {cards?.obat_expiring} obat akan expired dalam 90 hari
              </p>
              <button
                onClick={() => router.push('/monitoring')}
                className="text-xs text-orange-500 hover:underline mt-1 block"
              >
                Lihat di Monitoring →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Tren Permintaan ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Tren Permintaan — 6 Bulan Terakhir
        </h2>
        {loadingTren ? (
          <div className="h-52 bg-gray-100 animate-pulse rounded-lg" />
        ) : (
          <TrenPermintaanChart data={tren ?? []} />
        )}
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────── */}

      <Dialog open={openMasuk} onOpenChange={setOpenMasuk}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Catat Barang Masuk</DialogTitle>
          </DialogHeader>
          <BarangMasukForm onSuccess={handleBarangMasukSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={openKeluar} onOpenChange={setOpenKeluar}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Catat Barang Keluar</DialogTitle>
          </DialogHeader>
          <BarangKeluarForm onSuccess={handleBarangKeluarSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={openTambahObat} onOpenChange={setOpenTambahObat}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Obat Baru</DialogTitle>
          </DialogHeader>
          <ObatForm
            onSubmit={handleTambahObat}
            isLoading={createObatMutation.isPending}
            submitLabel="Tambah Obat"
          />
        </DialogContent>
      </Dialog>

    </div>
  )
}
