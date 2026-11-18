'use client'

import type { ReactNode } from 'react'
import { CircleAlert, SearchX, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import StateMessage from '@/components/shared/StateMessage'
import Pagination from '@/components/shared/Pagination'
import TabelSkeleton from '@/components/shared/TabelSkeleton'
import { cn } from '@/lib/utils'

export const PER_HALAMAN = 20

export interface KolomData<T> {
  id: string
  judul: ReactNode
  sel: (r: T) => ReactNode
  // Visibilitas bertahap menurut lebar konten, mis. 'hidden md:table-cell'. Kolom tanpa kelas selalu tampil.
  kelas?: string
  kanan?: boolean
  // Lebar kerangka pemuatan (kelas Tailwind); larik = sel dua baris (judul dan keterangan).
  skeleton?: string | string[]
  // Kolom aksi: kerangka berbentuk tombol 40px.
  aksi?: boolean
}

export interface BarisPenutup {
  label: ReactNode
  // Isi per kolom (kunci = id kolom). Kosong = label membentang di seluruh kolom.
  nilai?: Record<string, ReactNode>
  ringan?: boolean
}

interface TabelDataProps<T> {
  kolom: KolomData<T>[]
  baris: T[]
  kunci: (r: T, i: number) => string | number
  isLoading: boolean
  isError: boolean
  onCobaLagi: () => void
  // Judul dan keterangan keadaan gagal. Keterangan selalu perlu menyatakan bahwa gagal bukan berarti datanya kosong.
  judulGagal?: string
  keteranganGagal?: string
  kosong: { icon?: LucideIcon; judul: string; keterangan?: string; aksi?: ReactNode }
  footer?: BarisPenutup[]
  // Kelas tambahan per baris (mis. menyorot baris yang sedang dipilih).
  kelasBaris?: (r: T) => string | undefined
  // null = belum ada nomor di URL: mulai dari halaman pertama, atau dari halaman terakhir bila `awalDiAkhir`.
  halaman: number | null
  awalDiAkhir?: boolean
  onHalaman: (n: number) => void
  // Baris per halaman; Infinity = tanpa paginasi (semua baris ditampilkan).
  perHalaman?: number
  // Jumlah baris kerangka pemuatan.
  barisSkeleton?: number
  // Kata benda untuk ringkasan paginasi, mis. "obat" atau "catatan".
  noun: string
}

// Tabel data untuk daftar yang dimuat penuh di klien (paginasi di klien): kolom muncul bertahap menurut lebar konten,
// kerangka pemuatan, keadaan kosong dan gagal yang jujur, baris penutup untuk total, dan paginasi. Dipakai Laporan, Supplier,
// dan daftar Reorder. Tabel yang paginasinya di server atau barisnya punya interaksi khusus (Data Obat, Stok masuk, Stok keluar)
// memakai Table langsung dan hanya berbagi TabelSkeleton.
export function TabelData<T>({
  kolom,
  baris,
  kunci,
  isLoading,
  isError,
  onCobaLagi,
  judulGagal = 'Data belum bisa dimuat',
  keteranganGagal = 'Ini bukan berarti datanya kosong. Periksa koneksi, lalu coba lagi.',
  kosong,
  footer,
  kelasBaris,
  halaman,
  awalDiAkhir,
  onHalaman,
  perHalaman = PER_HALAMAN,
  barisSkeleton = 6,
  noun,
}: TabelDataProps<T>) {
  if (isError) {
    return (
      <StateMessage
        icon={CircleAlert}
        title={judulGagal}
        description={keteranganGagal}
        action={<Button variant="outline" size="lg" className="h-10 rounded-xl px-4" onClick={onCobaLagi}>Coba lagi</Button>}
        className="border-t border-border"
      />
    )
  }
  if (!isLoading && baris.length === 0) {
    return (
      <StateMessage
        icon={kosong.icon ?? SearchX}
        title={kosong.judul}
        description={kosong.keterangan}
        action={kosong.aksi}
        className="border-t border-border"
      />
    )
  }

  const lastPage = Math.max(1, Math.ceil(baris.length / perHalaman))
  const hal = halaman === null ? (awalDiAkhir ? lastPage : 1) : Math.min(halaman, lastPage)
  const tampil = Number.isFinite(perHalaman) ? baris.slice((hal - 1) * perHalaman, hal * perHalaman) : baris
  const sel = (i: number, kanan?: boolean) => cn('py-2.5', i === 0 && 'pl-5', i === kolom.length - 1 && 'pr-5', kanan && 'text-right')
  const awalIndeks = Number.isFinite(perHalaman) ? (hal - 1) * perHalaman : 0

  return (
    <div aria-busy={isLoading}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {kolom.map((k, i) => (
              <TableHead key={k.id} className={cn('h-10 text-xs font-medium text-muted-foreground', i === 0 && 'pl-5', i === kolom.length - 1 && 'pr-5', k.kanan && 'text-right', k.kelas)}>
                {k.judul}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TabelSkeleton
              baris={barisSkeleton}
              kolom={kolom.map((k) => ({
                kelas: k.kelas,
                kanan: k.kanan,
                bentuk: k.aksi ? 'tombol' : undefined,
                garis: Array.isArray(k.skeleton) ? k.skeleton : [k.skeleton ?? 'w-20'],
              }))}
            />
          ) : (
            tampil.map((r, ri) => (
              <TableRow key={kunci(r, awalIndeks + ri)} className={kelasBaris?.(r)}>
                {kolom.map((k, i) => (
                  <TableCell key={k.id} className={cn(sel(i, k.kanan), k.kelas)}>
                    {k.sel(r)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
        {!isLoading && footer && footer.length > 0 && (
          <TableFooter className="bg-muted/30">
            {footer.map((f, fi) =>
              f.nilai && Object.keys(f.nilai).length > 0 ? (
                <TableRow key={fi} className="hover:bg-transparent">
                  {kolom.map((k, i) => (
                    <TableCell key={k.id} className={cn(sel(i, k.kanan), 'tabular-nums', f.ringan ? 'py-1.5 text-xs font-normal text-muted-foreground' : 'font-semibold text-foreground', k.kelas)}>
                      {i === 0 && f.nilai?.[k.id] === undefined ? f.label : f.nilai?.[k.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ) : (
                <TableRow key={fi} className="hover:bg-transparent">
                  <TableCell colSpan={kolom.length} className={cn('py-2.5 pl-5 pr-5', f.ringan ? 'text-xs font-normal text-muted-foreground' : 'font-semibold text-foreground')}>
                    {f.label}
                  </TableCell>
                </TableRow>
              )
            )}
          </TableFooter>
        )}
      </Table>
      {!isLoading && lastPage > 1 && (
        <Pagination page={hal} lastPage={lastPage} total={baris.length} perPage={perHalaman} noun={noun} onPageChange={(n) => onHalaman(n)} />
      )}
      {!isLoading && lastPage === 1 && (
        <p role="status" className="sr-only">{baris.length} {noun}</p>
      )}
    </div>
  )
}
