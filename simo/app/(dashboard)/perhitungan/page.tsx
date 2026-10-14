'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PerhitunganTable from '@/components/perhitungan/PerhitunganTable'
import { useAuthStore } from '@/store/auth.store'

// Halaman ini dinonaktifkan sementara (bukan dihapus) — sama seperti Analisis Komparatif
// (lihat app/(dashboard)/analisis/page.tsx). Cukup 1 screenshot final untuk lampiran
// laporan/skripsi. Tampilan & API backend-nya masih ada, tidak dihapus.
//
// Untuk aktifkan lagi sementara waktu ambil screenshot:
//   1. Ubah PERHITUNGAN_AKTIF jadi true
//   2. Un-comment entry "Perhitungan EOQ/ROP" di components/layout/Sidebar.tsx
// Lalu kembalikan PERHITUNGAN_AKTIF ke false setelah selesai.
const PERHITUNGAN_AKTIF = false

export default function PerhitunganPage() {
  const router = useRouter()
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const isAdmin = useAuthStore((s) => s.isAdmin())

  useEffect(() => {
    if (!PERHITUNGAN_AKTIF) {
      router.replace('/dashboard')
      return
    }
    if (isHydrated && !isAdmin) {
      router.replace('/dashboard')
    }
  }, [isHydrated, isAdmin, router])

  if (!PERHITUNGAN_AKTIF || !isHydrated || !isAdmin) {
    return null
  }

  return <PerhitunganTable />
}
