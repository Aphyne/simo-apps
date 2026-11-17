'use client'

import { TriangleAlert } from 'lucide-react'
import { useNow } from '@/hooks/useNow'

// Hasil pemeriksaan tanggal expired yang diketik. Ambang sama dengan ExpiredCell di tabel:
// sudah lewat dan kurang dari 3 bulan = merah; 3 sampai 6 bulan = oranye; lebih dari 10 tahun = kemungkinan salah tahun.
export function cekExpired(tanggal: string | undefined, sekarangMs: number): { pesan: string; merah: boolean } | null {
  if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return null
  const t = new Date(`${tanggal}T00:00:00`).getTime()
  if (Number.isNaN(t)) return null
  const hari = Math.floor((t - sekarangMs) / 86400000)
  if (hari < 0) return { pesan: 'Tanggal ini sudah lewat. Periksa lagi tanggal expired di kemasan.', merah: true }
  if (hari <= 90) return { pesan: `Expired kurang dari 3 bulan lagi (${hari} hari). Pastikan tanggalnya benar.`, merah: true }
  if (hari <= 180) return { pesan: `Expired kurang dari 6 bulan lagi (${hari} hari). Pastikan tanggalnya benar.`, merah: false }
  if (hari > 3650) return { pesan: 'Expired lebih dari 10 tahun lagi. Periksa lagi tahunnya.', merah: false }
  return null
}

interface Props {
  id: string
  // Tanggal expired yang diketik (YYYY-MM-DD). Kosong atau tidak valid = tidak ada peringatan.
  tanggal: string | undefined
}

// Peringatan non-memblokir di bawah kolom tanggal expired. Menyimpan tetap diperbolehkan; petugas yang memutuskan.
export default function PeringatanExpired({ id, tanggal }: Props) {
  const sekarang = useNow().getTime()
  const hasil = cekExpired(tanggal, sekarang)
  if (!hasil) return null
  return (
    <p id={id} className={`flex items-start gap-1.5 text-sm font-medium ${hasil.merah ? 'text-danger-700' : 'text-warning-700'}`}>
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {hasil.pesan}
    </p>
  )
}
