import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface KolomSkeleton {
  // Visibilitas kolom yang sama dengan kolom aslinya, mis. 'hidden md:table-cell'.
  kelas?: string
  // Lebar tiap garis (kelas Tailwind). Dua atau lebih garis = sel dua baris (judul dan keterangan). Bawaan: satu garis w-20.
  garis?: string[]
  // Rata kanan (kolom angka).
  kanan?: boolean
  // Bentuk khusus: lencana status (lebar dari garis pertama) atau tombol aksi (tinggi 40px, sama dengan IconAction).
  bentuk?: 'badge' | 'tombol'
}

interface Props {
  kolom: KolomSkeleton[]
  // Jumlah baris kerangka; samakan dengan jumlah baris isi yang akan datang (mis. baris per halaman).
  baris?: number
}

// Kerangka pemuatan tabel: jumlah kolom, baris, dan bentuk sel sama dengan isi yang akan datang, supaya halaman tidak
// melompat saat data tiba. Taruh di dalam <TableBody>. Kolom pertama diberi pl-5 dan kolom terakhir pr-4 (pola tabel berpanel).
export default function TabelSkeleton({ kolom, baris = 6 }: Props) {
  return (
    <>
      {Array.from({ length: baris }).map((_, r) => (
        <TableRow key={r} className="hover:bg-transparent">
          {kolom.map((k, i) => {
            const garis = k.garis ?? ['w-20']
            return (
              <TableCell key={i} className={cn('py-3', i === 0 && 'pl-5', i === kolom.length - 1 && 'pr-4', k.kelas)}>
                {k.bentuk === 'tombol' ? (
                  <Skeleton className={cn('ml-auto h-10', garis[0] ?? 'w-28')} />
                ) : k.bentuk === 'badge' ? (
                  <Skeleton className={cn('h-5 rounded-full', garis[0] ?? 'w-20', k.kanan && 'ml-auto')} />
                ) : (
                  garis.map((lebar, g) => (
                    <Skeleton key={g} className={cn(g === 0 ? 'h-4' : 'mt-1.5 h-3', lebar, k.kanan && 'ml-auto')} />
                  ))
                )}
              </TableCell>
            )
          })}
        </TableRow>
      ))}
    </>
  )
}
