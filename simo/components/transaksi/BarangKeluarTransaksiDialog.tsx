'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { jamDicatat, nilaiPenjualan, type KelompokTransaksi } from '@/lib/barangKeluar'
import { formatAngka, formatRupiah, formatTanggal } from '@/lib/utils'

interface Props {
  transaksi: KelompokTransaksi | null
  onClose: () => void
}

const KEPALA = 'h-9 text-xs font-medium text-muted-foreground'

// Rincian satu transaksi (satu keranjang): semua obat di dalamnya dan total penjualannya. Hanya dibaca;
// mengubah atau menghapus dikerjakan per obat di tampilan "Per obat".
export default function BarangKeluarTransaksiDialog({ transaksi, onClose }: Props) {
  return (
    <Dialog open={!!transaksi} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto p-5 sm:max-w-2xl">
        {transaksi && <Isi transaksi={transaksi} />}
      </DialogContent>
    </Dialog>
  )
}

function Isi({ transaksi }: { transaksi: KelompokTransaksi }) {
  const penjualan = transaksi.keterangan === 'Penjualan'
  const tampilUang = penjualan
  const adaHarga = tampilUang && transaksi.tanpaHarga < transaksi.rows.length
  const jam = jamDicatat(transaksi.dicatat)
  return (
    <>
      <DialogHeader className="gap-1.5 pr-8">
        <DialogTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold">
          {formatTanggal(transaksi.tanggal)}
          <Badge variant={penjualan ? 'secondary' : 'outline'}>{transaksi.keterangan}</Badge>
        </DialogTitle>
        <DialogDescription>
          {transaksi.rows.length} obat
          {jam ? `, dicatat pukul ${jam}` : ''}
          {transaksi.namaUser ? ` oleh ${transaksi.namaUser}` : ''}
        </DialogDescription>
      </DialogHeader>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={KEPALA}>Obat</TableHead>
              <TableHead className={`${KEPALA} text-right`}>Jumlah</TableHead>
              {tampilUang && <TableHead className={`${KEPALA} text-right`}>Harga jual</TableHead>}
              {tampilUang && <TableHead className={`${KEPALA} text-right`}>Total</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transaksi.rows.map((r) => {
              const nilai = nilaiPenjualan(r)
              return (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-normal py-2.5">
                    <span className="block font-medium leading-tight text-foreground">{r.nama_obat}</span>
                    <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{r.kode_obat}</span>
                    {r.catatan && <span className="mt-0.5 block text-xs text-muted-foreground">{r.catatan}</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-2.5 text-right tabular-nums">
                    <span className="font-semibold text-foreground">{formatAngka(r.jumlah, 0)}</span>
                    <span className="ml-1 text-xs text-muted-foreground">{r.satuan}</span>
                  </TableCell>
                  {tampilUang && (
                    <TableCell className="whitespace-nowrap py-2.5 text-right tabular-nums text-muted-foreground">
                      {Number(r.harga_jual) > 0 ? formatRupiah(Number(r.harga_jual)) : <>-<span className="sr-only"> Harga belum diisi</span></>}
                    </TableCell>
                  )}
                  {tampilUang && (
                    <TableCell className="whitespace-nowrap py-2.5 text-right font-medium tabular-nums">
                      {nilai !== null ? formatRupiah(nilai) : <span className="font-normal text-muted-foreground">-</span>}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
          {/* Total rata kanan, tepat di bawah kolom Total */}
          {adaHarga && (
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-3 text-right text-sm text-muted-foreground">Total penjualan</TableCell>
                <TableCell className="whitespace-nowrap py-3 text-right text-base font-semibold tabular-nums text-foreground">{formatRupiah(transaksi.totalPenjualan)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <section aria-label="Catatan transaksi" className="space-y-2">
        {penjualan ? (
          !adaHarga && <p className="text-sm text-muted-foreground">Harga jual belum diisi untuk transaksi ini, jadi total belum bisa dihitung.</p>
        ) : (
          <p className="text-sm text-muted-foreground">Bukan penjualan, jadi tidak dihitung sebagai pendapatan.</p>
        )}
        {adaHarga && transaksi.tanpaHarga > 0 && (
          <p className="text-sm text-muted-foreground">{transaksi.tanpaHarga} obat belum punya harga jual dan belum ikut dijumlahkan.</p>
        )}
        <p className="text-sm text-muted-foreground">Untuk mengubah atau menghapus, buka tampilan Per obat.</p>
      </section>
    </>
  )
}
