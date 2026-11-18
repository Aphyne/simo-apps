import { TriangleAlert, type LucideIcon } from 'lucide-react'

// Satu baris kontak: ikon kecil, nomor, atau keterangan bila kosong. WhatsApp kosong diberi ikon peringatan dan tulisan
// (bukan hanya warna) karena nomor itu dipakai Reorder untuk mengirim Surat Pesanan.
export default function BarisKontak({ ikon: Ikon, nilai, kosong, peringatan }: { ikon: LucideIcon; nilai: string | null; kosong: string; peringatan?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <Ikon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      {nilai ? (
        <span className="tabular-nums">{nilai}</span>
      ) : peringatan ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-700">
          <TriangleAlert className="size-3.5" aria-hidden="true" />
          {kosong}
        </span>
      ) : (
        <span className="text-muted-foreground">{kosong}</span>
      )}
    </span>
  )
}
