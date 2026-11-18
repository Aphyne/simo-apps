'use client'

import { Eye, PackageOpen, SearchX, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import IconAction from '@/components/shared/IconAction'
import Pagination from '@/components/shared/Pagination'
import StateMessage from '@/components/shared/StateMessage'
import { jamDicatat, type KelompokTransaksi } from '@/lib/barangKeluar'
import { formatRupiah, formatTanggalPendek } from '@/lib/utils'

const KEPALA = 'h-10 text-xs font-medium text-muted-foreground'
const PER_HALAMAN = 10

interface Props {
  kelompok: KelompokTransaksi[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  adaFilter: boolean
  onAturUlang: () => void
  page: number
  onPageChange: (page: number) => void
  onBuka: (k: KelompokTransaksi) => void
  // Aksi bila belum ada catatan sama sekali (tombol Catat stok keluar).
  aksiKosong?: React.ReactNode
}

// Isi panel riwayat dalam tampilan "Per transaksi": satu baris per pencatatan (satu keranjang), dengan jumlah obat dan
// total penjualannya. Dihitung di klien dari seluruh riwayat (sama seperti ringkasan dan grafik), jadi paginasinya
// juga di klien.
export default function BarangKeluarPerTransaksi({ kelompok, isLoading, isError, onRetry, adaFilter, onAturUlang, page, onPageChange, onBuka, aksiKosong }: Props) {
  const lastPage = Math.max(1, Math.ceil(kelompok.length / PER_HALAMAN))
  const tampil = kelompok.slice((page - 1) * PER_HALAMAN, page * PER_HALAMAN)

  return (
    <div aria-busy={isLoading}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`${KEPALA} pl-5`}>Tanggal</TableHead>
            <TableHead className={`${KEPALA} hidden md:table-cell`}>Keterangan</TableHead>
            <TableHead className={`${KEPALA} text-right`}>Jumlah obat</TableHead>
            <TableHead className={`${KEPALA} text-right`}>Total penjualan</TableHead>
            <TableHead className={`${KEPALA} hidden xl:table-cell`}>Dicatat oleh</TableHead>
            <TableHead className={`${KEPALA} pr-4 text-right`}>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                <TableCell className="py-3 pl-5"><Skeleton className="h-4 w-24" /><Skeleton className="mt-1.5 h-3 w-12" /></TableCell>
                <TableCell className="hidden py-3 md:table-cell"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell className="py-3"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                <TableCell className="py-3"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                <TableCell className="hidden py-3 xl:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="py-3 pr-4"><Skeleton className="ml-auto h-8 w-10" /></TableCell>
              </TableRow>
            ))
          ) : isError ? null : (
            tampil.map((k) => (
              <TableRow key={k.kunci}>
                <TableCell className="whitespace-nowrap py-3 pl-5 tabular-nums">
                  <button
                    type="button"
                    onClick={() => onBuka(k)}
                    className="group block rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="block font-medium text-foreground group-hover:text-primary">{formatTanggalPendek(k.tanggal)}</span>
                    {jamDicatat(k.dicatat) && <span className="mt-0.5 block text-xs text-muted-foreground">{jamDicatat(k.dicatat)}</span>}
                  </button>
                  {/* Di layar sempit kolom Keterangan disembunyikan, jadi badge ikut di bawah tanggal */}
                  <span className="mt-1.5 block md:hidden"><Badge variant={k.keterangan === 'Penjualan' ? 'secondary' : 'outline'}>{k.keterangan}</Badge></span>
                </TableCell>
                <TableCell className="hidden py-3 md:table-cell">
                  <Badge variant={k.keterangan === 'Penjualan' ? 'secondary' : 'outline'}>{k.keterangan}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap py-3 text-right tabular-nums">
                  <span className="font-semibold text-foreground">{k.rows.length}</span>{' '}
                  <span className="text-xs text-muted-foreground">obat</span>
                </TableCell>
                <TableCell className="whitespace-nowrap py-3 text-right tabular-nums">
                  {k.keterangan !== 'Penjualan' ? (
                    <span className="text-muted-foreground">-<span className="sr-only"> Bukan penjualan</span></span>
                  ) : k.tanpaHarga === k.rows.length ? (
                    <span className="text-muted-foreground">-<span className="sr-only"> Harga jual belum diisi</span></span>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{formatRupiah(k.totalPenjualan)}</span>
                      {k.tanpaHarga > 0 && <span className="block text-xs text-muted-foreground">{k.tanpaHarga} obat belum berharga</span>}
                    </>
                  )}
                </TableCell>
                <TableCell className="hidden py-3 xl:table-cell">
                  {k.namaUser ? (
                    <>
                      <span className="block text-foreground">{k.namaUser}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{k.roleUser === 'admin' ? 'Admin' : 'Staf'}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">-<span className="sr-only"> Belum tersedia</span></span>
                  )}
                </TableCell>
                <TableCell className="py-1.5 pr-3">
                  <div className="flex justify-end">
                    <IconAction label={`Lihat rincian transaksi ${formatTanggalPendek(k.tanggal)} ${jamDicatat(k.dicatat)}`.trim()} onClick={() => onBuka(k)}>
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
          title="Riwayat transaksi belum bisa dimuat"
          description="Ini bukan berarti tidak ada stok keluar. Periksa koneksi, lalu coba lagi."
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
            title="Tidak ada transaksi yang cocok"
            description="Ubah kata kunci atau longgarkan filter untuk melihat transaksi lain."
            action={<Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={onAturUlang}>Atur ulang filter</Button>}
          />
        ) : (
          <StateMessage
            icon={PackageOpen}
            title="Belum ada transaksi"
            description="Catat penjualan atau obat keluar pertama untuk mulai mengurangi stok."
            action={aksiKosong}
          />
        )
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {!isLoading && !isError ? `${kelompok.length} transaksi ditemukan` : ''}
      </p>

      {!isLoading && !isError && lastPage > 1 && (
        <Pagination page={page} lastPage={lastPage} total={kelompok.length} perPage={PER_HALAMAN} noun="transaksi" onPageChange={onPageChange} />
      )}
    </div>
  )
}
