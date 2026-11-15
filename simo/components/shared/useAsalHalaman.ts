'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// "Kembali ke halaman asal" untuk halaman form (tambah dan ubah). Halaman asal diteruskan lewat
// `?dari=<alamat>` oleh tautan yang membukanya (mis. ikon pensil di daftar membawa alamat daftar lengkap
// dengan filternya; tombol "Ubah data" di detail membawa alamat detail). Lebih andal daripada riwayat
// peramban: tetap benar bila halaman dibuka di tab baru atau dari situs lain.
//
// Hanya alamat di dalam /obat yang diterima. Nilai lain (alamat luar, "//", skema) diabaikan dan jatuh ke `cadangan`.
const ALAMAT_ASAL_AMAN = /^\/obat(\/[A-Za-z0-9_-]+)*(\?[^#\s]*)?$/

export function bacaAsal(dari: string | null): string | null {
  if (!dari) return null
  return ALAMAT_ASAL_AMAN.test(dari) ? dari : null
}

// Tautan tujuan yang membawa asal: `denganAsal('/obat/5/edit', '/obat?kategori=Vitamin')`.
export function denganAsal(tujuan: string, asal: string): string {
  return `${tujuan}?dari=${encodeURIComponent(asal)}`
}

export function useAsalHalaman(cadangan: string) {
  const router = useRouter()
  const sp = useSearchParams()
  const asal = bacaAsal(sp.get('dari')) ?? cadangan
  // replace: tombol Kembali peramban tidak membawa pengguna ke formulir yang sudah ditinggalkan.
  const kembali = useCallback(() => router.replace(asal), [router, asal])
  return { asal, kembali }
}
