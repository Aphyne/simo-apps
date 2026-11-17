'use client'

import { TriangleAlert } from 'lucide-react'
import { useNow } from '@/hooks/useNow'
import { formatTanggalPendek } from '@/lib/utils'

// Sel tanggal expired: merah dengan ikon segitiga bila kurang dari 3 bulan (yang sudah lewat tertulis
// "Sudah expired"), oranye 3 sampai 6 bulan, selebihnya netral. Warna selalu disertai teks atau ikon.
export default function ExpiredCell({ tanggal }: { tanggal: string | null }) {
  const sekarang = useNow().getTime()
  if (!tanggal) return <span className="text-muted-foreground">-<span className="sr-only"> Belum tersedia</span></span>
  const selisihHari = Math.floor((new Date(tanggal).getTime() - sekarang) / (1000 * 60 * 60 * 24))
  const label = formatTanggalPendek(tanggal)
  if (selisihHari < 0)
    return (
      <span className="font-semibold text-danger-700">
        <span className="inline-flex items-center gap-1">
          <TriangleAlert className="size-3.5" aria-hidden="true" />
          {label}
        </span>
        <span className="block text-xs font-medium">Sudah expired</span>
      </span>
    )
  if (selisihHari <= 90)
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-danger-700">
        <TriangleAlert className="size-3.5" aria-hidden="true" />
        {label}
        <span className="sr-only">, kurang dari 3 bulan lagi</span>
      </span>
    )
  if (selisihHari <= 180)
    return (
      <span className="font-medium text-warning-700">
        {label}
        <span className="sr-only">, 3 sampai 6 bulan lagi</span>
      </span>
    )
  return <span className="text-muted-foreground">{label}</span>
}
