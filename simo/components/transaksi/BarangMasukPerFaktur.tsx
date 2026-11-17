'use client'

import { Eye, PackageOpen, SearchX, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import IconAction from '@/components/shared/IconAction'
import Pagination from '@/components/shared/Pagination'
import StateMessage from '@/components/shared/StateMessage'
import JatuhTempoCell from '@/components/transaksi/JatuhTempoCell'
import { formatRupiah, formatTanggalPendek } from '@/lib/utils'
import type { KelompokFaktur } from '@/lib/barangMasuk'

const KEPALA = 'h-10 text-xs font-medium text-muted-foreground'
const PER_HALAMAN = 10

interface Props {
  kelompok: KelompokFaktur[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  adaFilter: boolean
  onAturUlang: () => void
  page: number
  onPageChange: (page: number) => void
  onBuka: (k: KelompokFaktur) => void
  // Aksi bila belum ada catatan sama sekali (tombol Catat stok masuk).
  aksiKosong?: React.ReactNode
}

// Isi panel riwayat dalam tampilan "Per faktur": satu baris per faktur dengan jumlah obat dan totalnya.
// Dihitung di klien dari seluruh riwayat (sama seperti ringkasan dan grafik), jadi paginasinya juga di klien.
export default function BarangMasukPerFaktur({ kelompok, isLoading, isError, onRetry, adaFilter, onAturUlang, page, onPageChange, onBuka, aksiKosong }: Props) {
  const lastPage = Math.max(1, Math.ceil(kelompok.length / PER_HALAMAN))
  const tampil = kelompok.slice((page - 1) * PER_HALAMAN, page * PER_HALAMAN)

  return (
    <div aria-busy={isLoading}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`${KEPALA} pl-5`}>Supplier (PBF)</TableHead>
            <TableHead className={KEPALA}>Tanggal</TableHead>
            <TableHead className={KEPALA}>No. faktur</TableHead>
            <TableHead className={`${KEPALA} hidden md:table-cell`}>Jatuh tempo</TableHead>
            <TableHead className={`${KEPALA} text-right`}>Jumlah obat</TableHead>
            <TableHead className={`${KEPALA} hidden text-right xl:table-cell`}>
              <span className="block leading-tight">Total<span className="block font-normal">sebelum PPN</span></span>
            </TableHead>
            <TableHead className={`${KEPALA} text-right`}>
              <span className="block leading-tight">Total<span className="block font-normal">sesudah PPN</span></span>
            </TableHead>
            <TableHead className={`${KEPALA} pr-4 text-right`}>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                <TableCell className="py-3 pl-5"><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="py-3"><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell className="hidden py-3 md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="py-3"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                <TableCell className="hidden py-3 xl:table-cell"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                <TableCell className="py-3"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                <TableCell className="py-3 pr-4"><Skeleton className="ml-auto h-8 w-10" /></TableCell>
              </TableRow>
            ))
          ) : isError ? null : (
            tampil.map((k) => (
              <TableRow key={k.kunci}>
                <TableCell className="whitespace-normal py-3 pl-5">
                  <button
                    type="button"
                    onClick={() => onBuka(k)}
                    className="group block max-w-[14rem] rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[18rem]"
                  >
                    <span className="block break-words font-medium leading-tight text-foreground group-hover:text-primary">{k.namaSupplier ?? 'Supplier belum diisi'}</span>
                  </button>
                </TableCell>
                <TableCell className="whitespace-nowrap py-3 tabular-nums text-muted-foreground">{formatTanggalPendek(k.tanggal)}</TableCell>
                <TableCell className="py-3 font-mono text-xs text-muted-foreground">{k.noFaktur ?? 'Tanpa no. faktur'}</TableCell>
                <TableCell className="hidden py-3 tabular-nums md:table-cell"><JatuhTempoCell tanggal={k.jatuhTempo} /></TableCell>
                <TableCell className="whitespace-nowrap py-3 text-right tabular-nums">
                  <span className="font-semibold text-foreground">{k.rows.length}</span>
                  <span className="ml-1 text-xs text-muted-foreground">obat</span>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap py-3 text-right tabular-nums xl:table-cell">
                  {k.tanpaHarga === k.rows.length ? <span className="text-muted-foreground">-<span className="sr-only"> Harga belum diisi</span></span> : formatRupiah(k.totalSebelumPPN)}
                </TableCell>
                <TableCell className="whitespace-nowrap py-3 text-right tabular-nums">
                  {k.tanpaHarga === k.rows.length ? (
                    <span className="text-muted-foreground">-<span className="sr-only"> Harga belum diisi</span></span>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{formatRupiah(k.totalSesudahPPN)}</span>
                      {k.tanpaHarga > 0 && <span className="block text-xs text-muted-foreground">{k.tanpaHarga} obat belum berharga</span>}
                    </>
                  )}
                </TableCell>
                <TableCell className="py-1.5 pr-3">
                  <div className="flex justify-end">
                    <IconAction label={`Lihat rincian faktur ${k.noFaktur ?? ''}`.trim()} onClick={() => onBuka(k)}>
                      <Eye />
                    </IconAction>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!isLoading && isError && (
        <StateMessage
          icon={TriangleAlert}
          title="Riwayat faktur belum bisa dimuat"
          description="Ini bukan berarti tidak ada stok masuk. Periksa koneksi, lalu coba lagi."
          action={<Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={onRetry}>Coba lagi</Button>}
        />
      )}
      {!isLoading && !isError && tampil.length === 0 && (
        kelompok.length > 0 ? (
          <StateMessage
            icon={SearchX}
            title="Halaman ini tidak ada"
            description={`Hasilnya hanya sampai halaman ${lastPage}.`}
            action={<Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={() => onPageChange(1)}>Ke halaman pertama</Button>}
          />
        ) : adaFilter ? (
          <StateMessage
            icon={SearchX}
            title="Tidak ada faktur yang cocok"
            description="Ubah kata kunci atau longgarkan filter untuk melihat faktur lain."
            action={<Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={onAturUlang}>Atur ulang filter</Button>}
          />
        ) : (
          <StateMessage
            icon={PackageOpen}
            title="Belum ada faktur"
            description="Catat faktur pertama dari supplier untuk mulai menambah stok."
            action={aksiKosong}
          />
        )
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {!isLoading && !isError ? `${kelompok.length} faktur ditemukan` : ''}
      </p>

      {!isLoading && !isError && lastPage > 1 && (
        <Pagination page={page} lastPage={lastPage} total={kelompok.length} perPage={PER_HALAMAN} noun="faktur" onPageChange={onPageChange} />
      )}
    </div>
  )
}
