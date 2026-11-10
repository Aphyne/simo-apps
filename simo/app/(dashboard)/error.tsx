'use client'

import { useEffect } from 'react'
import ErrorPanel from '@/components/layout/ErrorPanel'

// Batas kesalahan untuk halaman di dalam dashboard: sidebar dan header tetap tampil.
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorPanel
      judul="Halaman ini gagal dimuat"
      pesan="Terjadi kesalahan saat menampilkan halaman. Data Anda aman. Coba lagi atau kembali ke dashboard."
      aksi={{ label: 'Coba lagi', onClick: reset }}
    />
  )
}
