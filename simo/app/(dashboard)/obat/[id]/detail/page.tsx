'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/ui/StatusBadge'
import RumusDisplay from '@/components/obat/RumusDisplay'
import { useObatById, useObatPerhitungan, useHitungUlang } from '@/hooks/useObat'
import { formatRupiah, formatAngka, formatTanggal } from '@/lib/utils'

export default function DetailObatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: obat, isLoading: loadingObat } = useObatById(id)
  const { data: perhitungan, isLoading: loadingCalc } = useObatPerhitungan(id)
  const hitungUlang = useHitungUlang()

  if (loadingObat) {
    return <div className="text-gray-400 py-16 text-center">Memuat data obat...</div>
  }
  if (!obat) {
    return <div className="text-red-500 py-16 text-center">Obat tidak ditemukan</div>
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/obat" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Data Obat
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{obat.nama}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{obat.kode}</span>
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

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Stok Saat Ini', nilai: `${formatAngka(obat.stok, 0)} ${obat.satuan}`, highlight: obat.status === 'HARUS_REORDER' },
          { label: 'Estimasi Habis', nilai: obat.estimasi_habis_hari != null ? `${obat.estimasi_habis_hari} hari` : '—' },
          { label: 'Harga Beli', nilai: formatRupiah(obat.harga_beli) },
          { label: 'Harga Jual', nilai: formatRupiah(obat.harga_jual) },
          { label: 'Satuan per Dus', nilai: `${obat.satuan_per_dus} ${obat.satuan}` },
          { label: 'Lead Time', nilai: `${obat.lead_time} hari` },
          { label: 'Supplier', nilai: obat.nama_supplier ?? '—' },
          { label: 'Expired Terdekat', nilai: formatTanggal(obat.expired_terdekat) },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border p-3 ${item.highlight ? 'border-red-200 bg-red-50' : 'bg-white'}`}
          >
            <p className="text-xs text-gray-400">{item.label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${item.highlight ? 'text-red-700' : 'text-gray-800'}`}>
              {item.nilai}
            </p>
          </div>
        ))}
      </div>

      {/* Perhitungan */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Detail Perhitungan EOQ / Safety Stock / ROP</h2>
        {loadingCalc ? (
          <div className="text-gray-400 py-8 text-center text-sm">Memuat perhitungan...</div>
        ) : perhitungan ? (
          <RumusDisplay data={perhitungan} />
        ) : (
          <div className="text-gray-400 py-8 text-center text-sm">Data perhitungan tidak tersedia</div>
        )}
      </div>
    </div>
  )
}
