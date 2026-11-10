'use client'

import { useEffect, useState } from 'react'
import { useQueryClient, type Query } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw } from 'lucide-react'

// Peringatan global kalau ada data di halaman aktif yang GAGAL dimuat dari server.
// Tanpa ini, kegagalan API tampil sebagai angka 0 / tabel kosong sehingga terlihat seperti
// "stok memang habis" padahal datanya tidak sampai (temuan QA FE-ERR-01).
const gagalAktif = (q: Query) => q.state.status === 'error' && q.getObserversCount() > 0

export default function GlobalErrorBanner() {
  const qc = useQueryClient()
  const [jumlah, setJumlah] = useState(0)
  const [mencoba, setMencoba] = useState(false)

  useEffect(() => {
    const cache = qc.getQueryCache()
    const hitung = () => setJumlah(cache.findAll({ predicate: gagalAktif }).length)
    hitung()
    return cache.subscribe(hitung)
  }, [qc])

  if (jumlah === 0) return null

  async function cobaLagi() {
    setMencoba(true)
    try {
      await qc.refetchQueries({ predicate: gagalAktif })
    } finally {
      setMencoba(false)
    }
  }

  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-red-700">Sebagian data gagal dimuat</p>
        <p className="mt-0.5 text-xs text-red-700">
          Angka atau tabel yang tampil mungkin tidak lengkap (bukan berarti stok kosong). Periksa koneksi lalu coba lagi.
        </p>
      </div>
      <button
        type="button"
        onClick={cobaLagi}
        disabled={mencoba}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${mencoba ? 'animate-spin' : ''}`} aria-hidden="true" />
        Coba lagi
      </button>
    </div>
  )
}
