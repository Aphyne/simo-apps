'use client'

import { useEffect } from 'react'
import ErrorPanel from '@/components/layout/ErrorPanel'

// Batas kesalahan tingkat aplikasi: error saat render tidak lagi menghasilkan layar putih kosong.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorPanel
      judul="Terjadi kesalahan"
      pesan="Halaman gagal ditampilkan. Data Anda aman. Coba muat ulang halaman ini."
      aksi={{ label: 'Coba lagi', onClick: reset }}
    />
  )
}
