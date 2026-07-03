'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, RefreshCw, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/ui/StatusBadge'
import RumusDisplay from '@/components/obat/RumusDisplay'
import ObatBatchSummary from '@/components/obat/ObatBatchSummary'
import { useObatById, useObatPerhitungan, useHitungUlang } from '@/hooks/useObat'
import { formatRupiah, formatAngka, formatTanggal } from '@/lib/utils'

export default function DetailObatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: obat, isLoading: loadingObat } = useObatById(id)
  const { data: perhitungan, isLoading: loadingCalc } = useObatPerhitungan(id)
  const hitungUlang = useHitungUlang()

  if (loadingObat) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!obat) {
    return <div className="text-red-500 py-16 text-center text-sm">Obat tidak ditemukan</div>
  }

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Data Obat
          </button>
          <h1 className="text-xl font-bold text-gray-900">{obat.nama}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
              {obat.kode}
            </span>
            <span className="text-sm text-gray-500">{obat.kategori}</span>
            <StatusBadge status={obat.status} />
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => hitungUlang.mutate(Number(id))}
            disabled={hitungUlang.isPending}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${hitungUlang.isPending ? 'animate-spin' : ''}`} />
            Hitung Ulang
          </Button>
          <Link href={`/obat/${id}/edit`}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit Data
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Info Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Stok Saat Ini',    nilai: `${formatAngka(obat.stok, 0)} ${obat.satuan}`, alert: obat.status === 'HARUS_REORDER' },
          { label: 'Estimasi Habis',   nilai: obat.estimasi_habis_hari != null ? `${obat.estimasi_habis_hari} hari` : '—' },
          { label: `Harga Beli Terkini / ${obat.satuan}`, nilai: formatRupiah(obat.harga_beli) },
          { label: `Harga Jual Terkini / ${obat.satuan}`, nilai: formatRupiah(obat.harga_jual) },
          { label: 'Satuan per Dus',   nilai: `${obat.satuan_per_dus} ${obat.satuan}` },
          { label: 'Lead Time',        nilai: `${obat.lead_time} hari` },
          { label: 'Supplier',         nilai: obat.nama_supplier ?? '—' },
          { label: 'Expired Terdekat', nilai: formatTanggal(obat.expired_terdekat) },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border p-3 shadow-sm ${
              item.alert
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <p className="text-xs text-gray-400 font-medium">{item.label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${item.alert ? 'text-red-700' : 'text-gray-800'}`}>
              {item.nilai}
            </p>
          </div>
        ))}
      </div>

      {/* ── Detail Perhitungan ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Detail Perhitungan EOQ / Safety Stock / ROP
        </h2>
        {loadingCalc ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : perhitungan ? (
          <RumusDisplay data={perhitungan} />
        ) : (
          <div className="text-center py-10 text-gray-400 text-sm">
            Data perhitungan tidak tersedia
          </div>
        )}
      </div>

      {/* ── Estimasi Sisa per Batch ───────────────────────────────────────── */}
      <ObatBatchSummary id={id} />

    </div>
  )
}
