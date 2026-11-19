'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ExpiredCell from '@/components/shared/ExpiredCell'
import { useAuthStore } from '@/store/auth.store'
import JatuhTempoCell from '@/components/transaksi/JatuhTempoCell'
import { formatAngka, formatRupiah, formatTanggal } from '@/lib/utils'
import type { KelompokFaktur } from '@/lib/barangMasuk'

interface Props {
  faktur: KelompokFaktur | null
  onClose: () => void
}

const KEPALA = 'h-9 text-xs font-medium text-muted-foreground'

// Rincian satu faktur: semua obat di dalamnya dan totalnya, untuk dicocokkan dengan faktur kertas.
// Hanya dibaca; mengubah atau menghapus dikerjakan per obat di tampilan "Per obat".
export default function BarangMasukFakturDialog({ faktur, onClose }: Props) {
  return (
    <Dialog open={!!faktur} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto p-5 sm:max-w-3xl">
        {faktur && <Isi faktur={faktur} />}
      </DialogContent>
    </Dialog>
  )
}

function Isi({ faktur }: { faktur: KelompokFaktur }) {
  // Harga, subtotal, dan total adalah uang: khusus admin.
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const adaHarga = faktur.tanpaHarga < faktur.rows.length
  const ppnRp = faktur.totalSesudahPPN - faktur.totalSebelumPPN
  return (
    <>
      <DialogHeader className="gap-1.5 pr-8">
        {/* Urutan mengikuti faktur kertas: nama PBF, lalu tanggal, lalu no. faktur */}
        <DialogTitle className="text-lg font-semibold">{faktur.namaSupplier ?? 'Supplier belum diisi'}</DialogTitle>
        <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{formatTanggal(faktur.tanggal)}</span>
          <span aria-hidden="true">·</span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{faktur.noFaktur ?? 'Tanpa no. faktur'}</span>
          <span aria-hidden="true">·</span>
          <span>{faktur.rows.length} obat</span>
          {faktur.namaUser && (
            <>
              <span aria-hidden="true">·</span>
              <span>dicatat oleh {faktur.namaUser} ({faktur.roleUser === 'admin' ? 'Admin' : 'Staf'})</span>
            </>
          )}
          {faktur.jatuhTempo && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">Jatuh tempo <JatuhTempoCell tanggal={faktur.jatuhTempo} /></span>
            </>
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={KEPALA}>Obat</TableHead>
              <TableHead className={KEPALA}>Batch dan expired</TableHead>
              <TableHead className={`${KEPALA} text-right`}>Jumlah</TableHead>
              {isAdmin && (
                <>
                  <TableHead className={`${KEPALA} text-right`}>
                    <span className="block leading-tight">Harga per dus<span className="block font-normal">sebelum PPN</span></span>
                  </TableHead>
                  <TableHead className={`${KEPALA} text-right`}>
                    <span className="block leading-tight">Subtotal<span className="block font-normal">sebelum PPN</span></span>
                  </TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {faktur.rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-normal py-2.5">
                  <span className="block font-medium leading-tight text-foreground">{r.nama_obat}</span>
                  <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{r.kode_obat}</span>
                </TableCell>
                <TableCell className="py-2.5 tabular-nums">
                  <span className="block font-mono text-xs text-muted-foreground">{r.no_batch ?? '-'}</span>
                  <span className="mt-0.5 block"><ExpiredCell tanggal={r.expired_batch} /></span>
                </TableCell>
                <TableCell className="whitespace-nowrap py-2.5 text-right tabular-nums">
                  <span className="font-semibold text-foreground">{formatAngka(r.jumlah_satuan, 0)}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{r.satuan}</span>
                  <span className="block text-xs text-muted-foreground">{formatAngka(Number(r.jumlah_dus), 2)} dus</span>
                </TableCell>
                {isAdmin && (
                  <>
                    <TableCell className="whitespace-nowrap py-2.5 text-right tabular-nums">
                      {r.harga_beli != null && r.jumlah_dus > 0 && (1 - (Number(r.diskon_pct) || 0) / 100) > 0
                        ? formatRupiah(((r.harga_beli / ((1 + (Number(r.ppn_pct) || 0) / 100) * (1 - (Number(r.diskon_pct) || 0) / 100))) * r.jumlah_satuan) / Number(r.jumlah_dus))
                        : <span className="text-muted-foreground">-<span className="sr-only"> Harga belum diisi</span></span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-2.5 text-right font-medium tabular-nums">
                      {r.harga_beli != null
                        ? formatRupiah((r.harga_beli / (1 + (Number(r.ppn_pct) || 0) / 100)) * r.jumlah_satuan)
                        : <span className="font-normal text-muted-foreground">-<span className="sr-only"> Harga belum diisi</span></span>}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
          {/* Total rata kanan, tepat di bawah kolom Subtotal (sama dengan rincian transaksi Stok keluar) */}
          {isAdmin && adaHarga && (
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-2 text-right text-sm text-muted-foreground">Total sebelum PPN</TableCell>
                <TableCell className="whitespace-nowrap py-2 text-right font-medium tabular-nums text-foreground">{formatRupiah(faktur.totalSebelumPPN)}</TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-2 text-right text-sm text-muted-foreground">PPN {formatAngka(faktur.ppnPct, 2)}%</TableCell>
                <TableCell className="whitespace-nowrap py-2 text-right font-medium tabular-nums text-foreground">{formatRupiah(ppnRp)}</TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-3 text-right text-sm text-muted-foreground">Total sesudah PPN</TableCell>
                <TableCell className="whitespace-nowrap py-3 text-right text-base font-semibold tabular-nums text-foreground">{formatRupiah(faktur.totalSesudahPPN)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <section aria-label="Catatan faktur" className="space-y-2">
        {isAdmin && !adaHarga && <p className="text-sm text-muted-foreground">Harga beli belum diisi untuk faktur ini, jadi total belum bisa dihitung.</p>}
        {isAdmin && adaHarga && faktur.tanpaHarga > 0 && (
          <p className="text-sm text-muted-foreground">{faktur.tanpaHarga} obat belum berharga dan belum ikut dijumlahkan.</p>
        )}
        <p className="text-sm text-muted-foreground">Untuk mengubah atau menghapus, buka tampilan Per obat.</p>
      </section>
    </>
  )
}
