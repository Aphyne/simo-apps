'use client'

import { TriangleAlert } from 'lucide-react'
import { useNow } from '@/hooks/useNow'
import { tanggalLokalYMD } from '@/lib/barangMasuk'
import { formatTanggalPendek } from '@/lib/utils'

// Sel jatuh tempo faktur. Sudah lewat = merah dengan ikon dan "Lewat N hari"; 7 hari ke depan = oranye "N hari lagi";
// selebihnya netral. Penanda hanya membaca tanggal: aplikasi belum mencatat apakah faktur sudah dibayar.
export default function JatuhTempoCell({ tanggal }: { tanggal: string | null }) {
  const sekarang = useNow()
  const ymd = tanggalLokalYMD(tanggal)
  if (!ymd) return <span className="text-muted-foreground">-<span className="sr-only"> Belum diisi</span></span>
  const hariIni = tanggalLokalYMD(sekarang.toISOString())
  const selisih = Math.round((new Date(`${ymd}T00:00:00`).getTime() - new Date(`${hariIni}T00:00:00`).getTime()) / 86400000)
  const label = formatTanggalPendek(tanggal)
  if (selisih < 0)
    return (
      <span className="font-semibold text-danger-700">
        <span className="inline-flex items-center gap-1">
          <TriangleAlert className="size-3.5" aria-hidden="true" />
          {label}
        </span>
        <span className="block text-xs font-medium">Lewat {-selisih} hari</span>
      </span>
    )
  if (selisih <= 7)
    return (
      <span className="font-medium text-warning-700">
        {label}
        <span className="block text-xs">{selisih === 0 ? 'Hari ini' : `${selisih} hari lagi`}</span>
      </span>
    )
  return <span className="text-muted-foreground">{label}</span>
}
