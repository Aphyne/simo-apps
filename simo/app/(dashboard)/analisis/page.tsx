'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAnalisisPerbandingan, AnalisisDetail } from '@/hooks/useAnalisis'
import AnalisisStatCards from '@/components/analisis/AnalisisStatCards'
import AnalisisChart from '@/components/analisis/AnalisisChart'
import AnalisisTable from '@/components/analisis/AnalisisTable'
import AnalisisDetailModal from '@/components/analisis/AnalisisDetailModal'

// Halaman ini dinonaktifkan sementara (bukan dihapus) — fitur Analisis Komparatif
// sudah tidak perlu tampil di aplikasi berjalan, cukup 1 screenshot final untuk
// lampiran laporan/skripsi. Tampilan & API backend-nya masih ada, tidak dihapus.
//
// Untuk aktifkan lagi sementara waktu ambil screenshot:
//   1. Ubah ANALISIS_AKTIF jadi true
//   2. Un-comment entry "Analisis Komparatif" di components/layout/Sidebar.tsx
// Lalu kembalikan ANALISIS_AKTIF ke false setelah selesai.
const ANALISIS_AKTIF = false

export default function AnalisisPage() {
  const router = useRouter()

  useEffect(() => {
    if (!ANALISIS_AKTIF) {
      router.replace('/dashboard')
    }
  }, [router])

  const { data, isLoading } = useAnalisisPerbandingan()
  const [selectedItem, setSelectedItem] = useState<AnalisisDetail | null>(null)

  if (!ANALISIS_AKTIF) {
    return null
  }

  const ringkasan = data?.ringkasan
  const detail = data?.detail ?? []

  return (
    <div className="space-y-6">
      {selectedItem && (
        <AnalisisDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      <AnalisisStatCards ringkasan={ringkasan} isLoading={isLoading} />

      <AnalisisChart detail={detail} isLoading={isLoading} />

      <AnalisisTable
        detail={detail}
        ringkasan={ringkasan}
        isLoading={isLoading}
        onSelectItem={setSelectedItem}
      />
    </div>
  )
}
